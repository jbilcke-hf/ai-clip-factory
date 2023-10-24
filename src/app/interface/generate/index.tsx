"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useSpring, animated } from "@react-spring/web"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { headingFont } from "@/app/interface/fonts"
import { useCharacterLimit } from "@/lib/useCharacterLimit"
import { generateAnimation } from "@/app/server/actions/animation"
import { getLatestPosts, getPost, postToCommunity } from "@/app/server/actions/community"
import { getSDXLModels } from "@/app/server/actions/models"
import { HotshotImageInferenceSize, Post, QualityLevel, QualityOption, SDXLModel } from "@/types"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { interpolate } from "@/app/server/actions/interpolate"
import { isRateLimitError } from "@/app/server/utils/isRateLimitError"
import { useCountdown } from "@/lib/useCountdown"

import { Countdown } from "../countdown"

const qualityOptions = [
  {
    level: "low",
    label: "Low (~ 30 sec)"
  },
  {
    level: "medium",
    label: "Medium (~90 secs)"
  }
] as QualityOption[]

type Stage = "generate" | "interpolate" | "finished"

export function Generate() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsEntries = searchParams ? Array.from(searchParams.entries()) : []
  const [_isPending, startTransition] = useTransition()

  const scrollRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [isLocked, setLocked] = useState(false)
  const [promptDraft, setPromptDraft] = useState("")
  const [assetUrl, setAssetUrl] = useState("")
  const [isOverSubmitButton, setOverSubmitButton] = useState(false)

  const [models, setModels] = useState<SDXLModel[]>([])
  const [selectedModel, setSelectedModel] = useState<SDXLModel>()

  const [runs, setRuns] = useState(0)
  const runsRef = useRef(0)
  const [showModels, setShowModels] = useState(true)

  const [communityRoll, setCommunityRoll] = useState<Post[]>([])

  const [stage, setStage] = useState<Stage>("generate")
  
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>("low")

  const { toast } = useToast()
  
  const { progressPercent, remainingTimeInSec } = useCountdown({
    isActive: isLocked,
    timerId: runs, // everytime we change this, the timer will reset
    durationInSec: /*stage === "interpolate" ? 30 :*/ 90, // it usually takes 40 seconds, but there might be lag
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
    if (isLocked) { return }
    if (!promptDraft) { return }

    setShowModels(false)
    setRuns(runsRef.current + 1)
    setLocked(true)
    setStage("generate")

    scrollRef.current?.scroll({
      top: 0,
      behavior: 'smooth'
    })

    startTransition(async () => {
      const huggingFaceLora = selectedModel ? selectedModel.repo.trim() : "KappaNeuro/studio-ghibli-style"
      const triggerWord =  selectedModel ? selectedModel.trigger_word : "Studio Ghibli Style"

      // now you got a read/write object
      const current = new URLSearchParams(searchParamsEntries)
      current.set("prompt", promptDraft)
      current.set("model", huggingFaceLora)
      const search = current.toString()
      router.push(`${pathname}${search ? `?${search}` : ""}`)

      const size: HotshotImageInferenceSize = "608x416"

      // 608x416 @ 25 steps -> 32 seconds
      const steps = qualityLevel === "low" ? 25 : 35

      let key = ""
      try {
        const res = await fetch("/api/get-key", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          cache: 'no-store',
        })
        key = await res.text()
      } catch (err) {
        console.error("failed to get key, but this is not a blocker")
      }

      const params = {
        positivePrompt: promptDraft,
        negativePrompt: "",
        huggingFaceLora,
        triggerWord,
        nbFrames: 10, // if duration is 1000ms then it means 8 FPS
        duration: 1000, // in ms
        steps,
        size,
        key
      }

      let rawAssetUrl = ""
      try {
        // console.log("starting transition, calling generateAnimation")
        rawAssetUrl = await generateAnimation(params)

        if (!rawAssetUrl) {
          throw new Error("invalid asset url")
        }

        setAssetUrl(rawAssetUrl)

      } catch (err) {

        // check the rate limit
        if (isRateLimitError(err)) {
          console.error("error, too many requests")
          toast({
            title: "You can generate only one video per minute 👀",
            description: "Please wait a bit before trying again 🤗",
          })
          setLocked(false)
          return
        } else {
          toast({
            title: "We couldn't generate your video 👀",
            description: "We aere probably over capacity, but you can try again 🤗",
          })
        }

        console.log("generation failed! probably just a Gradio failure, so let's just run the round robin again!")
        
        try {
          rawAssetUrl = await generateAnimation(params)
        } catch (err) {

          // check the rate limit
          if (isRateLimitError(err)) {
            console.error("error, too many requests")
            toast({
              title: "Error: the free server is over capacity 👀",
              description: "You can generate one video per minute 🤗 Please try again in a moment!",
            })
            setLocked(false)
            return
          }
          
          console.error(`generation failed again! ${err}`)
        }
      } 

      if (!rawAssetUrl) {
        console.log("failed to generate the video, aborting")
        setLocked(false)
        return
      }
      
      setAssetUrl(rawAssetUrl)


      let assetUrl = rawAssetUrl
        
      setStage("interpolate")
      setRuns(runsRef.current + 1)

      try {
        assetUrl = await interpolate(rawAssetUrl)

        if (!assetUrl) {
          throw new Error("invalid interpolated asset url")
        }

        setAssetUrl(assetUrl)
      } catch (err) {
        console.log(`failed to interpolate the video, but this is not a blocker: ${err}`)
      }

      setLocked(false)
      setStage("generate")
      
      if (process.env.NEXT_PUBLIC_ENABLE_COMMUNITY_SHARING !== "true") {
        return
      }
      
      try {
        const post = await postToCommunity({
          prompt: promptDraft,
          model: huggingFaceLora,
          assetUrl,
        })
        console.log("successfully submitted to the community!", post)

        // now you got a read/write object
        const current = new URLSearchParams(searchParamsEntries)
        current.set("postId", post.postId.trim())
        current.set("prompt", post.prompt.trim())
        current.set("model", post.model.trim())
        const search = current.toString()
        router.push(`${pathname}${search ? `?${search}` : ""}`)
      } catch (err) {
        console.error(`not a blocker, but we failed to post to the community (reason: ${err})`)
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
      const current = new URLSearchParams(searchParamsEntries)

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
        maxNbPosts: 32,
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
    const current = new URLSearchParams(searchParamsEntries)
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

  const handleClickPlay = () => {
    videoRef.current?.play()
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
        `w-full md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[85vh]`,
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
            `space-y-6 md:space-y-8 lg:space-y-12 xl:space-y-14`,
            `px-3 py-6 md:px-6 md:py-12 xl:px-8 xl:py-14`,

          )}>
            {assetUrl ? <div
              className={cn(
                `flex flex-col`,
                `space-y-3 md:space-y-6`,
                `items-center`,
              )}>
                {assetUrl.startsWith("data:video/mp4") || assetUrl.endsWith(".mp4")
                 ? <video
                    ref={videoRef}
                    muted
                    autoPlay
                    loop
                    src={assetUrl}
                    onClick={handleClickPlay}
                    className="rounded-md overflow-hidden md:h-[400px] lg:h-[500px] xl:h-[560px]"
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
                  {isLocked
                    ? (stage === "generate" ? `Generating..` : `Smoothing..`)
                    : "Generate"
                  }
                </animated.button>
              </div>
            </div>
            {/*
            <div>
              <p>Generation will take about 32 seconds</p>
            </div>
                  */}

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
             <div className="flex flex-col text-center">
                <h3 className={cn(
                  headingFont.className,
                  "text-3xl text-sky-600 mb-4"
                  )}>{models.length ? `You selected:` : ""}</h3>
                <h3 className={cn(
                  headingFont.className,
                  "text-5xl text-sky-700 mb-4"
                  )}>{models.length ? `${(selectedModel?.title || "").replaceAll("-", " ")}` : "Loading styles.."}</h3>
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
                  )}>{communityRoll.length ? "Random community clips:" : "Loading community roll.."}</h3>
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
