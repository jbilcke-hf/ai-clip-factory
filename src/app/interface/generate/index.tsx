"use client"

import { useState, useTransition } from "react"
import { useSpring, animated } from "@react-spring/web"

import { cn } from "@/lib/utils"
import { headingFont } from "@/app/interface/fonts"
import { useCharacterLimit } from "@/lib/useCharacterLimit"
import { generateAnimation } from "@/app/server/actions/animation"

export function Generate() {
  const [_isPending, startTransition] = useTransition()

  const [isLocked, setLocked] = useState(false)
  const [promptDraft, setPromptDraft] = useState("")
  const [assetUrl, setAssetUrl] = useState("")
  const [isOverSubmitButton, setOverSubmitButton] = useState(false)

  const { shouldWarn, colorClass, nbCharsUsed, nbCharsLimits } = useCharacterLimit({
    value: promptDraft,
    nbCharsLimits: 70,
    warnBelow: 10,
  })

  const submitButtonBouncer = useSpring({
    transform: isOverSubmitButton
      ? 'scale(1.05)'
      : 'scale(1.0)',
    boxShadow: isOverSubmitButton 
      ? `0px 5px 15px 0px rgba(0, 0, 0, 0.05)`
      : `0px 0px 0px 0px rgba(0, 0, 0, 0.05)`,
    loop: true,
    config: {
      tension: 300,
      friction: 10,
    },
  })

  const handleSubmit = () => {
    console.log("handleSubmit:", { isLocked, promptDraft })
    if (isLocked) { return }
    if (!promptDraft) { return }
    setLocked(true)
    startTransition(async () => {
      try {
        console.log("starting transition, calling generateAnimation")
        const newAssetUrl = await generateAnimation({
          prompt: promptDraft,
          lora: "https://huggingface.co/ostris/crayon_style_lora_sdxl/resolve/main/crayons_v1_sdxl.safetensors",
          size: "512x512" // "320x768"
      })
        setAssetUrl(newAssetUrl)
      } catch (err) {
        console.error(err)
      } finally {
        setLocked(false)
      }
    })
  }

  return (
    <div className={cn(
      `fixed inset-0 w-screen h-screen`,
      `flex flex-col items-center justify-center`,
      `transition-all duration-300 ease-in-out`,
      //  panel === "play" ? "opacity-1 translate-x-0" : "opacity-0 translate-x-[-1000px] pointer-events-none"
      )}>
      <div className={cn(
        `flex flex-col md:flex-row`,
        `w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[80vh]`,
        `space-y-3 md:space-y-0 md:space-x-6`,
        `transition-all duration-300 ease-in-out`,

      )}>
        <div className={cn(
          `flex flex-col`,
          `flex-grow rounded-2xl md:rounded-3xl`,
          `backdrop-blur-lg bg-white/40`,
          `border-2 border-white/10`,
          `items-center`,
          `space-y-6 md:space-y-8 lg:space-y-12 xl:space-y-16`,
          `px-3 py-6 md:px-6 md:py-12 xl:px-8 xl:py-16`
        )}>

            {assetUrl ? <div
              className={cn(
                `flex flex-col`,
                `space-y-3 md:space-y-6`,
                `items-center`,
              )}>
                <img
                  src={assetUrl}
                  className={cn(
                    `w-[512px] object-cover`,
                    `rounded-2xl`
                    )}
                />
            </div> : null}

            <div className={cn(
              `flex flex-col md:flex-row`,
              `space-y-3 md:space-y-0 md:space-x-3`,
              ` w-full max-w-[1024px]`,
              `items-center justify-between`
            )}>
              <div className={cn(
                `flex flex-row flex-grow`
              )}>
                <input
                  type="text"
                  placeholder={`Imagine a funny gif`}
                  className={cn(
                    headingFont.className,
                    `w-full`,
                    `input input-bordered rounded-full`,
                    `transition-all duration-300 ease-in-out`,
         
                    `disabled:bg-sky-100 disabled:text-sky-500 disabled:border-transparent`,
                    isLocked
                      ? `bg-sky-100 text-sky-500 border-transparent`
                      : `bg-sky-200 text-sky-600 selection:bg-sky-200`,
                    `text-left`,
                    `text-xl leading-10 px-6 h-16 pt-1`
                  )}
                  value={promptDraft}
                  onChange={e => setPromptDraft(e.target.value)}
                  onKeyDown={({ key }) => {
                    if (key === 'Enter') {
                     if (!isLocked) {
                        handleSubmit()
                     }
                    }
                  }}
                  disabled={isLocked}
                />
                <div className={cn(
                  `flex flew-row ml-[-64px] items-center`,
                  `transition-all duration-300 ease-in-out`,
                  `text-base`,
                  `bg-sky-200`,
                  `rounded-full`,
                  `text-right`,
                  `p-1`,
                  headingFont.className,
                  colorClass,
                  shouldWarn && !isLocked ? "opacity-100" : "opacity-0"
                )}>
                  <span>{nbCharsUsed}</span>
                  <span>&#47;</span>
                  <span>{nbCharsLimits}</span>
                </div>
              </div>
              <div className="flex flex-row w-52">
              <animated.button
                style={{
                  textShadow: "0px 0px 1px #000000ab",
                  ...submitButtonBouncer
                }}
                onMouseEnter={() => setOverSubmitButton(true)}
                onMouseLeave={() => setOverSubmitButton(false)}
                className={cn(
                  `px-6 py-3`,
                  `rounded-full`,
                  `transition-all duration-300 ease-in-out`,
                  isLocked
                    ? `bg-orange-500/20  border-orange-800/10`
                    : `bg-sky-500/80 hover:bg-sky-400/100  border-sky-800/20`,
                  `text-center`,
                  `w-full`,
                  `text-2xl text-sky-50`,
                  `border`,
                  headingFont.className,
                  // `transition-all duration-300`,
                  // `hover:animate-bounce`
                )}
                disabled={isLocked}
                onClick={handleSubmit}
                >
                {isLocked ? "Generating.." : "Generate"}
              </animated.button>
              </div>
            </div>
            {/*
            Put community creations here, this may get wild though.
            <div>
              <div>A</div>
              <div>B</div>
              <div>C</div>
              <div>D</div>
              <div>E</div>
            </div>
                */}
        </div>
      </div>
    </div>
  )
}
