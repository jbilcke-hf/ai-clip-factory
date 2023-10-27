import Replicate from "replicate"

import { sleep } from "@/lib/sleep"

const replicateToken = `${process.env.AUTH_REPLICATE_API_TOKEN || ""}`
const replicateModel = `${process.env.INTERPOLATION_API_REPLICATE_MODEL || ""}`
const replicateModelVersion = `${process.env.INTERPOLATION_API_REPLICATE_MODEL_VERSION || ""}`

export async function interpolateReplicate(input: string): Promise<string> {
  if (!replicateToken) {
    throw new Error(`you need to configure your AUTH_REPLICATE_API_TOKEN in order to use interpolation`)
  }
  if (!replicateModel) {
    throw new Error(`you need to configure your INTERPOLATION_API_REPLICATE_MODEL in order to use interpolation`)
  }

  if (!replicateModelVersion) {
    throw new Error(`you need to configure your INTERPOLATION_API_REPLICATE_MODEL_VERSION in order to use interpolation`)
  }
  const replicate = new Replicate({ auth: replicateToken })

  const prediction = await replicate.predictions.create({
    version: replicateModelVersion,
    input: {
      mp4: input,
      framerate_multiplier: 4,
      keep_original_duration: true,
    }
  })

  let res: Response
  let pollingCount = 0
  do {
    // This is normally a fast model, so let's check every 4 seconds
    await sleep(4000)

    res = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      method: "GET",
      headers: {
        Authorization: `Token ${replicateToken}`,
      },
      cache: 'no-store',
    })

    // console.log("res:", res)

    /*
    try {
      const text = await res.text()
      console.log("res.text:", text)
    } catch (err) {
      console.error("res.text() error:", err)
    }
    */

    if (res.status === 200) {
      try {
        const response = (await res.json()) as any
        const error = `${response?.error || ""}`
        if (error) {
          throw new Error(error)
        }
        if (response.status === "succeeded") {
          return response.output.pop()
        }
      } catch (err) {
        console.error("res.json() error:", err)
      }
    }

    pollingCount++

    // To prevent indefinite polling, we can stop after a certain number
    if (pollingCount >= 20) {
      throw new Error('Request time out.')
    }
  } while (true)
}