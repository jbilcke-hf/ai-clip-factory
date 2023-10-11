"use server"

import { ImageInferenceSize } from "@/types"

const hotshotApiUrl = `${process.env.HF_HOTSHOT_XL_API_URL || ""}`

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
    const res = await fetch(hotshotApiUrl, {
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

  } catch (err) {
    throw new Error(`failed to generate the image ${err}`)
  }
}