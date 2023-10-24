"use server"

import {Ratelimit} from "@upstash/ratelimit"
import {Redis} from "@upstash/redis"

import { VideoOptions } from "@/types"

import { generateVideoWithGradioAPI } from "./generateWithGradioApi"
import { generateVideoWithReplicateAPI } from "./generateWithReplicateAPI"
import { filterOutBadWords } from "./censorship"

const videoEngine = `${process.env.VIDEO_ENGINE || ""}`

// const officialApi = `${process.env.VIDEO_HOTSHOT_XL_API_OFFICIAL || ""}`
const nodeApi = `${process.env.VIDEO_HOTSHOT_XL_API_NODE || ""}`

const redis = new Redis({
  url: `${process.env.UPSTASH_REDIS_REST_URL || ""}`,
  token: `${process.env.UPSTASH_REDIS_REST_TOKEN || ""}`,
})

// Create a new ratelimiter for anonymous users, that allows 1 requests per 60 seconds
const rateLimitAnons = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "60 s"),
  analytics: true,
  timeout: 1000,
  prefix: "production:anon"
})

export async function generateAnimation({
  positivePrompt = "",
  negativePrompt = "",
  size = "512x512",
  huggingFaceLora,
  replicateLora,
  triggerWord,
  nbFrames = 8,
  duration = 1000,
  steps = 30,
  key = "",
}: VideoOptions): Promise<string> {
  if (!positivePrompt?.length) {
    throw new Error(`prompt is too short!`)
  }

  const cropped = positivePrompt.slice(0, 30)

  console.log(`user ${key.slice(0, 10)} requested "${cropped}${cropped !== positivePrompt ? "..." : ""}"`)

  // this waits for 3 seconds before failing the request
  // we don't wait more because it is frustrating for someone to wait a failure
  const rateLimitResult = await rateLimitAnons.limit(key || "anon")
  // const rateLimitResult = await rateLimitAnons.blockUntilReady(key, 3_000)

  // admin / developers will have this key:
  // eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3

  // result.limit
  if (!rateLimitResult.success) {
    console.log(`blocking user ${key.slice(0, 10)} who requested "${cropped}${cropped !== positivePrompt ? "..." : ""}"`)
    throw new Error(`Rate Limit Reached`)
  } else {
    console.log(`allowing user ${key.slice(0, 10)}: who requested "${cropped}${cropped !== positivePrompt ? "..." : ""}"`)
  }

  positivePrompt = filterOutBadWords(positivePrompt)

  // pimp the prompt
  positivePrompt = [
    triggerWord,
    positivePrompt,
    "beautiful",
    "hd"
  ].join(", ")

  negativePrompt = [
    negativePrompt,
    "cropped",
    "dark",
    "underexposed",
    "overexposed",
    "watermark",
    "watermarked",
  ].join(", ")

  try {

    if (videoEngine === "VIDEO_HOTSHOT_XL_API_REPLICATE") {
      return generateVideoWithReplicateAPI({
        positivePrompt,
        negativePrompt,
        size,
        huggingFaceLora,
        replicateLora,
        nbFrames,
        duration,
        steps,
      })
      
    } else if (videoEngine === "VIDEO_HOTSHOT_XL_API_NODE") {
      // TODO: support other API to avoid duplicate work?
      // (are the other API supporting custom LoRAs?)
      const res = await fetch(nodeApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // access isn't secured for now, the free lunch is open
          // Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: positivePrompt,
          lora: huggingFaceLora,
          size,
        }),
        cache: "no-store",
        // we can also use this (see https://vercel.com/blog/vercel-cache-api-nextjs-cache)
        // next: { revalidate: 1 }
      })

      const content = await res.text()

      // Recommendation: handle errors
      if (res.status !== 200) {
        console.error(content)
        // This will activate the closest `error.js` Error Boundary
        throw new Error('Failed to fetch data')
      }

      return content
    } else if (videoEngine === "VIDEO_HOTSHOT_XL_API_GRADIO") {
      return generateVideoWithGradioAPI({
        positivePrompt,
        negativePrompt,
        size,
        huggingFaceLora,
        replicateLora,
        nbFrames,
        duration,
        steps,
      })
    } else {
      throw new Error(`not implemented yet!`)
    }

  } catch (err) {
    throw new Error(`failed to generate the image ${err}`)
  }
}