"use server"

import { ImageInferenceSize } from "@/types"

const videoEngine = `${process.env.VIDEO_ENGINE || ""}`

const officialApi = `${process.env.VIDEO_HOTSHOT_XL_API_OFFICIAL || ""}`
const nodeApi = `${process.env.VIDEO_HOTSHOT_XL_API_NODE || ""}`
const gradioApi = `${process.env.VIDEO_HOTSHOT_XL_API_GRADIO || ""}`

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

  try {

    if (videoEngine === "VIDEO_HOTSHOT_XL_API_NODE") {
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
      const res = await fetch(gradioApi + "api/predict", {
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