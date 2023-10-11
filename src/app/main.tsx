"use client"

import { cn } from "@/lib/utils"
import { paragraphFont } from "@/app/interface/fonts"
import { Background } from "./interface/background"
import { Generate } from "./interface/generate"

export function Main() {

  return (
    <div className={cn(
      `flex flex-col h-screen items-center justify-center`,
      `px-3 md:px-0`,
      paragraphFont.className
    )}>
      <Background />
      <Generate />
    </div>
  )
}