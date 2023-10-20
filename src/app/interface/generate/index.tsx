"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useSpring, animated } from "@react-spring/web"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { headingFont } from "@/app/interface/fonts"
import { useCharacterLimit } from "@/lib/useCharacterLimit"
import { generateAnimation } from "@/app/server/actions/animation"
import { getLatestPosts, getPost, postToCommunity } from "@/app/server/actions/community"
import { useCountdown } from "@/lib/useCountdown"
import { Countdown } from "../countdown"
import { getSDXLModels } from "@/app/server/actions/models"
import { Post, SDXLModel } from "@/types"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TooltipProvider } from "@radix-ui/react-tooltip"

export function Generate() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [_isPending, startTransition] = useTransition()

  const scrollRef = useRef<HTMLDivElement>(null)

  const [isLocked, setLocked] = useState(false)
  const [promptDraft, setPromptDraft] = useState("")
  const [assetUrl, setAssetUrl] = useState("")
  const [isOverSubmitButton, setOverSubmitButton] = useState(false)

  const [models, setModels] = useState<SDXLModel[]>([])
  const [selectedModel, setSelectedModel] = useState<SDXLModel>()

  const [runs, setRuns] = useState(0)
  const runsRef = useRef(0)
  const [showModels, setShowModels] = useState(true)
  // useEffect(() => { runsRef.current = runs },  [runs])

  const [communityRoll, setCommunityRoll] = useState<Post[]>([])

  console.log("runs:", runs)
  const { progressPercent, remainingTimeInSec } = useCountdown({
    isActive: isLocked,
    timerId: runs, // everytime we change this, the timer will reset
    durationInSec: 50, // it usually takes 40 seconds, but there might be lag
    onEnd: () => {}
  })
  
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

    setShowModels(false)
    setRuns(runs + 1)
    setLocked(true)

    scrollRef.current?.scroll({
      top: 0,
      behavior: 'smooth'
    })

    startTransition(async () => {
      const huggingFaceLora = selectedModel ? selectedModel.repo.trim() : "KappaNeuro/studio-ghibli-style"
      const triggerWord =  selectedModel ? selectedModel.trigger_word : "Studio Ghibli Style"

      // now you got a read/write object
      const current = new URLSearchParams(Array.from(searchParams.entries()))
      current.set("prompt", promptDraft)
      current.set("model", huggingFaceLora)
      const search = current.toString()
      router.push(`${pathname}${search ? `?${search}` : ""}`)

      try {
        console.log("starting transition, calling generateAnimation")
        const newAssetUrl = await generateAnimation({
          positivePrompt: promptDraft,
          negativePrompt: "",
          huggingFaceLora,
          triggerWord,
          size: "608x416", // "1024x512", // "512x512" // "320x768"
          nbFrames: 8, // if duration is 1000ms then it means 8 FPS
          duration: 1000, // in ms
          steps: 25,
        })
        setAssetUrl(newAssetUrl)

        try {
          const post = await postToCommunity({
            prompt: promptDraft,
            model: huggingFaceLora,
            assetUrl: newAssetUrl,
          })
          console.log("successfully submitted to the community!", post)

          // now you got a read/write object
          const current = new URLSearchParams(Array.from(searchParams.entries()))
          current.set("postId", post.postId.trim())
          current.set("prompt", post.prompt.trim())
          current.set("model", post.model.trim())
          const search = current.toString()
          router.push(`${pathname}${search ? `?${search}` : ""}`)
        } catch (err) {
          console.error(`not a blocker, but we failed to post to the community (reason: ${err})`)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLocked(false)
      }
    })
  }

  useEffect(() => {
    startTransition(async () => {
      const models = await getSDXLModels()
      setModels(models)

      const defaultModel = models.find(model => model.repo.toLowerCase().includes("ghibli")) || models[0]

      if (defaultModel) {
        setSelectedModel(defaultModel)
      }

      // now we load URL params
      const current = new URLSearchParams(Array.from(searchParams.entries()))

      // URL query params
      const existingPostId = current.get("postId") || ""
      const existingPrompt = current.get("prompt")?.trim() || ""
      const existingModelName = current.get("model")?.toLowerCase().trim() || ""

      // if and only if we don't have a post id, then we look at the other query params
      if (existingPrompt) {
        setPromptDraft(existingPrompt)
      }

      if (existingModelName) {

        let existingModel = models.find(model => {
          return (
            model.repo.toLowerCase().trim().includes(existingModelName)
            || model.title.toLowerCase().trim().includes(existingModelName)
           )
        })

        if (existingModel) {
          setSelectedModel(existingModel)
        }
      }

      // if we have a post id, then we use that to override all the previous values
      if (existingPostId) {
        try {
          const post = await getPost(existingPostId)

          if (post.assetUrl) {
            setAssetUrl(post.assetUrl)
          }
          if (post.prompt) {
            setPromptDraft(post.prompt)
          }

          if (post.model) {

            const nameToFind = post.model.toLowerCase().trim()
            const existingModel = models.find(model => {
      
              return (
                model.repo.toLowerCase().trim().includes(nameToFind)
                || model.title.toLowerCase().trim().includes(nameToFind)
              )
            })

            if (existingModel) {
              setSelectedModel(existingModel)
            }
          }
        } catch (err) {
          console.error(`failed to load the community post (${err})`)
        }
      }
    })
  }, [])

  useEffect(() => {
    startTransition(async () => {
      const posts = await getLatestPosts({
        maxNbPosts: 16,
        shuffle: true,
      })
      if (posts?.length) {
        setCommunityRoll(posts)
      }
    })
  }, [])

  const handleSelectCommunityPost = (post: Post) => {
    if (isLocked) { return }

    scrollRef.current?.scroll({
      top: 0,
      behavior: 'smooth'
    })

    // now you got a read/write object
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set("postId", post.postId.trim())
    current.set("prompt", post.prompt.trim())
    current.set("model", post.model.trim())
    const search = current.toString()
    router.push(`${pathname}${search ? `?${search}` : ""}`)

    if (post.assetUrl) {
      setAssetUrl(post.assetUrl)
    }
    if (post.prompt) {
      setPromptDraft(post.prompt)
    }

    if (post.model) {
      const nameToFind = post.model.toLowerCase().trim()
      const existingModel = models.find(model => {

        return (
          model.repo.toLowerCase().trim().includes(nameToFind)
          || model.title.toLowerCase().trim().includes(nameToFind)
        )
      })

      if (existingModel) {
        setSelectedModel(existingModel)
      }
    }
  }

  return (
    <div
      ref={scrollRef}
      className={cn(
      `fixed inset-0 w-screen h-screen`,
      `flex flex-col items-center justify-center`,
      // `transition-all duration-300 ease-in-out`,
      `overflow-y-scroll`,
       )}>
      <TooltipProvider>
      {isLocked ? <Countdown
        progressPercent={progressPercent}
        remainingTimeInSec={remainingTimeInSec}
      /> : null}
      <div

      className={cn(
        `flex flex-col`,
        `w-full md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[80vh]`,
        `space-y-8`,
       //  `transition-all duration-300 ease-in-out`,
      )}>
      
          <div
          className={cn(
            `flex flex-col`,
            `flex-grow rounded-2xl md:rounded-3xl`,
            `backdrop-blur-lg bg-white/40`,
            `border-2 border-white/10`,
            `items-center`,
            `space-y-6 md:space-y-8 lg:space-y-12 xl:space-y-16`,
            `px-3 py-6 md:px-6 md:py-12 xl:px-8 xl:py-16`,

          )}>
            {assetUrl ? <div
              className={cn(
                `flex flex-col`,
                `space-y-3 md:space-y-6`,
                `items-center`,
              )}>
                {assetUrl.startsWith("data:video/mp4")
                 ? <video
                    muted
                    autoPlay
                    loop
                    src={assetUrl}
                    className="rounded-md overflow-hidden"
                  /> :
                <img
                  src={assetUrl}
                  className={cn(
                    `w-[512px] object-cover`,
                    `rounded-2xl`
                    )}
                />}
            </div> : null}

            <div className={cn(
              `flex flex-col md:flex-row`,
              `space-y-3 md:space-y-0 md:space-x-3`,
              ` w-full md:max-w-[1024px]`,
              `items-center justify-between`
            )}>
              <div className={cn(
                `flex flex-row flex-grow w-full`
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
                    `text-xl leading-10 px-6 h-16 pt-1`,
                    `selection:bg-sky-800 selection:text-sky-200`
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
                  {isLocked ? `Loading..` : "Generate"}
                </animated.button>
              </div>
            </div>

          </div>

          <div
            className={cn(
            `flex flex-col`,
            `flex-grow rounded-2xl md:rounded-3xl`,
            `backdrop-blur-lg bg-white/40`,
            `border-2 border-white/10`,
            `items-center`,
            `space-y-2 md:space-y-3 lg:space-y-4 xl:space-y-6`,
            `px-3 py-6 md:px-6 md:py-12 xl:px-8 xl:py-16`,
          )}>
             <div className="flex flex-row">
                <h3 className={cn(
                  headingFont.className,
                  "text-4xl text-sky-600 mb-4"
                  )}>{models.length ? "Pick a style:" : "Loading styles.."}</h3>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                {models.map(model =>
              <div key={model.repo}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={isLocked ? 'cursor-not-allowed' : `cursor-pointer`}
                      onClick={() => {
                        if (!isLocked) { setSelectedModel(model) }
                      }}>
                     <img
                    src={
                      model.image.startsWith("http")
                      ? model.image
                      : `https://multimodalart-loratheexplorer.hf.space/file=${model.image}`
                    }
                    className={cn(
                      `transition-all duration-150 ease-in-out`,
                      `w-20 h-20 object-cover rounded-lg overflow-hidden`,
                      `border-4 border-transparent`,
                      isLocked ? '' : `hover:border-yellow-50 hover:scale-110`,
                      selectedModel?.repo === model.repo
                        ? `scale-110 border-4 border-yellow-300 hover:border-yellow-300`
                        : ``
                      )}
                  ></img>
                </div>
                </TooltipTrigger>
                {!isLocked && <TooltipContent>
                  <p className="w-full max-w-xl">{model.title}</p>
                </TooltipContent>}
              </Tooltip>
              </div>
                 )}
              </div>
            </div>


        <div
            className={cn(
            `flex flex-col`,
            `flex-grow rounded-2xl md:rounded-3xl`,
            `backdrop-blur-lg bg-white/40`,
            `border-2 border-white/10`,
            `items-center`,
            `space-y-2 md:space-y-3 lg:space-y-4 xl:space-y-6`,
            `px-3 py-6 md:px-6 md:py-12 xl:px-8 xl:py-16`,
          )}>
             <div className="flex flex-row">
                <h3 className={cn(
                  headingFont.className,
                  "text-4xl text-sky-600 mb-4"
                  )}>{communityRoll.length ? "Community creations:" : "Loading community roll.."}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {communityRoll.map(post =>
              <div key={post.postId}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={isLocked ? 'cursor-not-allowed' : `cursor-pointer`}
                      onClick={() => { handleSelectCommunityPost(post) }}>
                  <video
                    muted
                    autoPlay
                    loop
                    src={post.assetUrl}
                    className={cn(
                      `rounded-md overflow-hidden`,
                      `transition-all duration-150 ease-in-out`,
                      `w-40 h-30 object-cover rounded-lg overflow-hidden`,
                      `border-4 border-transparent`,
                      isLocked ? '' : `hover:border-yellow-50 hover:scale-110`,
                    )}
                  />
                </div>
                </TooltipTrigger>
                {!isLocked && <TooltipContent>
                  <p className="w-full max-w-xl">{post.prompt}</p>
                </TooltipContent>}
              </Tooltip>
              </div>
                 )}
              </div>
            </div>
  
          </div>
     
      </TooltipProvider>
    </div>
  )
}
