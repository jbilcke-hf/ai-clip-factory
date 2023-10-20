"use server"

import { SDXLModel } from "@/types"

const SDXL_MODEL_DATABASE_URL = "https://huggingface.co/spaces/multimodalart/LoraTheExplorer/raw/main/sdxl_loras.json"

export async function getSDXLModels(): Promise<SDXLModel[]> {
  const res = await fetch(SDXL_MODEL_DATABASE_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    },
    cache: "no-store",
    // we can also use this (see https://vercel.com/blog/vercel-cache-api-nextjs-cache)
    // next: { revalidate: 1 }
  })

  const content = await res.json() as SDXLModel[]

  // we only return compatible models
  return content.filter(model => model.is_compatible)
}