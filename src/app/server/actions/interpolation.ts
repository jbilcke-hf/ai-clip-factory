"use server"

import { interpolateGradio } from "./interpolateGradio"
import { interpolateReplicate } from "./interpolateReplicate"

const interpolationEngine = `${process.env.INTERPOLATION_ENGINE || ""}`

export async function interpolateVideo(inputVideo: string): Promise<string> {
  if (!inputVideo?.length) {
    throw new Error(`missing input video`)
  }

  try {

    if (interpolationEngine === "STMFNET_REPLICATE") {
      return interpolateReplicate(inputVideo)
    } else if (interpolationEngine === "FILM_GRADIO") {
      return interpolateGradio(inputVideo)
    } else {
      throw new Error(`unsupported interpolation engine "${interpolationEngine}"`)
    }
  } catch (err) {
    throw new Error(`failed to interpolate the video ${err}`)
  }
}