"use server"

import { VideoOptions } from "@/types"

import { generateVideoWithGradioAPI } from "./generateWithGradioApi"
import { generateVideoWithReplicateAPI } from "./generateWithReplicateAPI"

const videoEngine = `${process.env.VIDEO_ENGINE || ""}`

// const officialApi = `${process.env.VIDEO_HOTSHOT_XL_API_OFFICIAL || ""}`
const nodeApi = `${process.env.VIDEO_HOTSHOT_XL_API_NODE || ""}`

export async function generateAnimation({
  positivePrompt = "",
  negativePrompt = "",
  size = "512x512",
  huggingFaceLora,
  replicateLora,
  nbFrames = 8,
  duration = 1000,
  steps = 30,
}: VideoOptions): Promise<string> {
  if (!positivePrompt?.length) {
    throw new Error(`prompt is too short!`)
  }

  // pimp the prompt
  positivePrompt = [
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