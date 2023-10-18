import Replicate from "replicate"

import { generateSeed } from "@/lib/generateSeed"
import { VideoOptions } from "@/types"
import { sleep } from "@/lib/sleep"

const replicateToken = `${process.env.AUTH_REPLICATE_API_TOKEN || ""}`
const replicateModel = `${process.env.VIDEO_HOTSHOT_XL_API_REPLICATE_MODEL || ""}`
const replicateModelVersion = `${process.env.VIDEO_HOTSHOT_XL_API_REPLICATE_MODEL_VERSION || ""}`

export async function generateVideoWithReplicateAPI({
  positivePrompt = "",
  negativePrompt = "",
  size = "512x512",
  huggingFaceLora,
  replicateLora,
  steps = 30
}: VideoOptions): Promise<string> {
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

  const [width, height] = size.split("x").map(x => Number(x))

  // console.log("Calling replicate..")
  const seed = generateSeed()
  const prediction = await replicate.predictions.create({
    version: replicateModelVersion,
    input: {
      prompt,
      negative_prompt: negativePrompt,

       // this is not a URL but a model name
      hf_lora_url: replicateLora ? undefined : huggingFaceLora,

      // this is a URL to the .tar (we can get it from the "trainings" page)
      replicate_weights_url: huggingFaceLora ? undefined : replicateLora,

      width,
      height,

      // those are used to create an upsampling or downsampling
      // original_width: width,
      // original_height: height,
      // target_width: width,
      // target_height: height,

      video_length: 8, // nb frames
      video_duration: 1000, // video duration in ms
      
      seed
    }
  })
  
  // console.log("prediction:", prediction)

  // response times are random on Replicate, so this sleep doesn't really help us
  // we should of course do it like on the AI Comic Factory (use the async loading/polling)
  // but on the other hand if it takes 2 minutes to answer, it's not really useful either
  await sleep(50000)

  try {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      method: "GET",
      headers: {
        Authorization: `Token ${replicateToken}`,
      },
      cache: 'no-store',
    })

    if (res.status !== 200) {
      throw new Error("failed")
    } 

    const response = (await res.json()) as any
    const error = `${response?.error || ""}`
    if (error) {
      throw new Error(error)
    }
    return `${response?.output || ""}`
  } catch (err) {
    // OK let's give replicate a second chance
    await sleep(10000)

    const res = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      method: "GET",
      headers: {
        Authorization: `Token ${replicateToken}`,
      },
      cache: 'no-store',
    // we can also use this (see https://vercel.com/blog/vercel-cache-api-nextjs-cache)
    // next: { revalidate: 1 }
    })
  
    if (res.status !== 200) {
      throw new Error('Failed to fetch data')
    }
    
    const response = (await res.json()) as any
    const error = `${response?.error || ""}`
    if (error) {
      throw new Error(error)
    }
    return `${response?.output || ""}`
  }
}