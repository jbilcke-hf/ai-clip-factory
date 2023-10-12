"use server"

import Replicate from "replicate"

import { generateSeed } from "@/lib/generateSeed"
import { ImageInferenceSize } from "@/types"
import { sleep } from "@/lib/sleep"

const videoEngine = `${process.env.VIDEO_ENGINE || ""}`

const officialApi = `${process.env.VIDEO_HOTSHOT_XL_API_OFFICIAL || ""}`
const nodeApi = `${process.env.VIDEO_HOTSHOT_XL_API_NODE || ""}`
const gradioApi = `${process.env.VIDEO_HOTSHOT_XL_API_GRADIO || ""}`

const replicateToken = `${process.env.AUTH_REPLICATE_API_TOKEN || ""}`
const replicateModel = `${process.env.VIDEO_HOTSHOT_XL_API_REPLICATE_MODEL || ""}`
const replicateModelVersion = `${process.env.VIDEO_HOTSHOT_XL_API_REPLICATE_MODEL_VERSION || ""}`

export async function generateAnimation({
  prompt,
  size,
  lora,
}: {
  prompt: string
  size: ImageInferenceSize
  lora: string
 }): Promise<string> {
  if (!prompt?.length) {
    throw new Error(`prompt is too short!`)
  }

  // pimp themy prompt
  prompt = [
    "beautiful",
    prompt,
    "hd"
  ].join(", ")

  const negativePrompt = [
    "cropped",
    "dark",
    "underexposed",
    "overexposed",
    "watermark",
    "watermarked",
  ].join(", ")

  const [width, height] = size.split("x").map(x => Number(x))

  try {

    if (videoEngine === "VIDEO_HOTSHOT_XL_API_REPLICATE") {
      if (!replicateToken) {
        throw new Error(`you need to configure your AUTH_REPLICATE_API_TOKEN in order to use the REPLICATE rendering engine`)
      }
      if (!replicateModel) {
        throw new Error(`you need to configure your RENDERING_REPLICATE_API_MODEL in order to use the REPLICATE rendering engine`)
      }

      if (!replicateModelVersion) {
        throw new Error(`you need to configure your REPLICATE_API_MODEL_VERSION in order to use the REPLICATE rendering engine`)
      }
      const replicate = new Replicate({ auth: replicateToken })


      // console.log("Calling replicate..")
      const seed = generateSeed()
      const prediction = await replicate.predictions.create({
        version: replicateModelVersion,
        input: {
          prompt,
          negative_prompt: negativePrompt,
          hf_lora_url: lora,
          width,
          height,

          // those are used to create an upsampling or downsampling
          // original_width: width,
          // original_height: height,
          // target_width: width,
          // target_height: height,

          video_length: 8, // nb frames
          video_duration: 1000, // video duration in ms
          // seed
        }
      })
      
      // console.log("prediction:", prediction)

      // no need to reply straight away as images take time to generate, this isn't instantaneous
      // also our friends at Replicate won't like it if we spam them with requests
      await sleep(5000)


      const res = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        method: "GET",
        headers: {
          Authorization: `Token ${replicateToken}`,
        },
        cache: 'no-store',
      // we can also use this (see https://vercel.com/blog/vercel-cache-api-nextjs-cache)
      // next: { revalidate: 1 }
      })
    
      // Recommendation: handle errors
      if (res.status !== 200) {
        // This will activate the closest `error.js` Error Boundary
        throw new Error('Failed to fetch data')
      }
      
      const response = (await res.json()) as any
      const error = `${response?.error || ""}`
      if (error) {
        throw new Error(error)
      }
      return `${response?.output || ""}`
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
          prompt,
          lora,
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
      const res = await fetch(gradioApi + (gradioApi.endsWith("/") ? "" : "/") + "api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // access isn't secured for now, the free lunch is open
          // Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fn_index: 0,
          data: [
            prompt,
            lora,
            size,
          ],
        }),
        cache: "no-store",
        // we can also use this (see https://vercel.com/blog/vercel-cache-api-nextjs-cache)
        // next: { revalidate: 1 }
      })

      const { data } = await res.json()

      // Recommendation: handle errors
      if (res.status !== 200) {
        // This will activate the closest `error.js` Error Boundary
        throw new Error('Failed to fetch data')
      }
      // console.log("data:", data.slice(0, 50))

      return data
    } else {
      throw new Error(`not implemented yet!`)
    }

  } catch (err) {
    throw new Error(`failed to generate the image ${err}`)
  }
}