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
  const compatibleModels = content.filter(model => model.is_compatible)

  const hardcoded: SDXLModel[] = [
    {
      "image": "https://jbilcke-hf-ai-clip-factory.hf.space/images/models/sdxl-modern-pixar.jpg",
      "title": "sdxl-modern-pixar",
      "repo": "jbilcke-hf/sdxl-modern-pixar",
      "trigger_word": "modern-pixar",
      "weights": "pytorch_lora_weights.safetensors",
      "is_compatible": true,
      "likes": 0,
      "downloads": 0
    },
    {
      "image": "https://jbilcke-hf-ai-clip-factory.hf.space/images/models/sdxl-cinematic-2.jpg",
      "title": "sdxl-cinematic-2",
      "repo": "jbilcke-hf/sdxl-cinematic-2",
      "trigger_word": "cinematic-2",
      "weights": "pytorch_lora_weights.safetensors",
      "is_compatible": true,
      "likes": 0,
      "downloads": 0
    },
    {
      "image": "https://jbilcke-hf-ai-clip-factory.hf.space/images/models/sdxl-moebius-lean.jpg",
      "title": "sdxl-moebius-lean",
      "repo": "jbilcke-hf/sdxl-moebius-lean",
      "trigger_word": "moebius-lean",
      "weights": "pytorch_lora_weights.safetensors",
      "is_compatible": true,
      "likes": 0,
      "downloads": 0
    },
    {
      "image": "https://jbilcke-hf-ai-clip-factory.hf.space/images/models/sdxl-foundation-2.jpg",
      "title": "sdxl-foundation-2",
      "repo": "jbilcke-hf/sdxl-foundation-2",
      "trigger_word": "hober-mallow",
      "weights": "pytorch_lora_weights.safetensors",
      "is_compatible": true,
      "likes": 0,
      "downloads": 0
    },
  ]

  return hardcoded.concat(compatibleModels)
}