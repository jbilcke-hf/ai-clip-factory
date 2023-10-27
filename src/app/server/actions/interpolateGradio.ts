
const gradioApi = `${process.env.INTERPOLATION_API_GRADIO_URL || ""}`
const accessToken = `${process.env.AUTH_INTERPOLATION_API_GRADIO_TOKEN || ""}`

export async function interpolateGradio(assetUrl: string): Promise<string> {
  // we need to remove this header perhaps
  const videoInBase64 = assetUrl.split("data:video/mp4;base64,").pop()

  const interpolationSteps = 2
  const nbFramesPerSecond = 32

  const res = await fetch(gradioApi + (gradioApi.endsWith("/") ? "" : "/") + "api/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fn_index: 0, // <- important!
      data: [
        accessToken,
        videoInBase64,
        interpolationSteps,
        nbFramesPerSecond
      ],
    }),
    cache: "no-store",
    // we can also use this (see https://vercel.com/blog/vercel-cache-api-nextjs-cache)
    // next: { revalidate: 1 }
  })

  const { data } = await res.json()

  if (res.status !== 200 || !data[0]?.length) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error(`Failed to fetch data (status: ${res.status})`)
  }

  return data[0]
}

