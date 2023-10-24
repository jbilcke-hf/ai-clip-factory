import { generateSeed } from "@/lib/generateSeed"
import { VideoOptions } from "@/types"

const gradioApi = `${process.env.VIDEO_HOTSHOT_XL_API_GRADIO || ""}`
const accessToken = `${process.env.AUTH_HOTSHOT_XL_API_GRADIO_ACCESS_TOKEN || ""}`

export async function generateVideoWithGradioAPI({
  positivePrompt = "",
  negativePrompt = "",
  size = "512x512",
  huggingFaceLora,
  // replicateLora, // not supported yet
  nbFrames = 8,
  duration = 1000,
  steps = 30,
}: VideoOptions): Promise<string> {
  /*
  console.log(`SEND TO ${gradioApi + (gradioApi.endsWith("/") ? "" : "/") + "api/predict"}:`, [
    // accessToken,
    positivePrompt,
    negativePrompt,
    huggingFaceLora,
    size,
    generateSeed(),
    steps,
    nbFrames,
    duration,
  ])
  */
  const res = await fetch(gradioApi + (gradioApi.endsWith("/") ? "" : "/") + "api/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fn_index: 1, // <- important!
      data: [
        accessToken,
        positivePrompt,
        negativePrompt,
        huggingFaceLora,
        size,
        generateSeed(),
        steps,
        nbFrames,
        duration,
      ],
    }),
    cache: "no-store",
    // we can also use this (see https://vercel.com/blog/vercel-cache-api-nextjs-cache)
    // next: { revalidate: 1 }
  })

  const { data } = await res.json()

  // console.log("data:", data)
  // Recommendation: handle errors
  if (res.status !== 200 || !Array.isArray(data)) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error(`Failed to fetch data (status: ${res.status})`)
  }
  // console.log("data:", data.slice(0, 50))

  return data[0]
}