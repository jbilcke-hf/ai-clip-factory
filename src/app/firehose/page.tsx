"use client"

import { useEffect, useState, useTransition } from "react"

import { Post } from "@/types"
import { cn } from "@/lib/utils"
import { actionman } from "@/lib/fonts"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Delete } from "./delete"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getLatestPosts } from "@/app/server/actions/community"

const defaultLimit = 200

export default function FirehosePage() {
  const searchParams = useSearchParams()
  const [_isPending, startTransition] = useTransition()
  const [posts, setPosts] = useState<Post[]>([])
  const moderationKey = (searchParams.get("moderationKey") as string) || ""
  const limit = Number((searchParams.get("limit") as string) || defaultLimit)
  const [toDelete, setToDelete] = useState<Post>()

  useEffect(() => {
    startTransition(async () => {
      const newPosts = await getLatestPosts({
        maxNbPosts: isNaN(limit) || !isFinite(limit) ? defaultLimit : limit,
        shuffle: false,
      })
      setPosts(newPosts)
    })
  }, [])

  const handleOnDelete = ({ postId }: Post) => {
    setPosts(posts.filter(post => post.postId !== postId))
    setToDelete(undefined)
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn(
        `light fixed w-full h-full flex flex-col items-center bg-slate-300 text-slate-800`,
        ``,
        actionman.className
        )}>
        <div className="w-full flex flex-col items-center overflow-y-scroll">
          <div className="flex flex-col space-y-2 pt-18 mb-6">
            <h1 className="text-4xl md:text-6xl lg:text-[70px] xl:text-[100px] text-cyan-700">AI Clip Factory</h1>
          </div>

          <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6 px-12">
            {posts.map(post => (
              <Link
                key={post.postId}
                href={`/?postId=${post.postId}`}
                target="_blank">
                <div
                  key={post.postId}
                  className="group flex flex-col cursor-pointer"
                  >
                  <div className="w-full h-32">
                    <video
                          muted
                          autoPlay={false}
                          loop
                          src={post.assetUrl}
                          className={cn(
                        `w-full h-32 rounded-xl overflow-hidden object-cover`,
                        `border border-zinc-900/70`,
                        // `group-hover:brightness-105`
                        )}
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="text-base text-stone-900/80 truncate w-full group-hover:underline underline-offset-2"
                      >{post.prompt}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-full max-w-xl">{post.prompt}</p>
                    </TooltipContent>
                  </Tooltip>
                  <div
                  className="text-sm text-stone-700/70 w-full group-hover:underline underline-offset-2"
                  >{new Date(Date.parse(post.createdAt)).toLocaleString()}</div>
                 {moderationKey ? <div className="">
                    <Button
                      className="z-40 bg-red-200 text-red-700 hover:bg-red-300 hover:text-red-800 text-2xs px-2 h-7"
                      onClick={(e) => {
                        e.preventDefault()
                        setToDelete(post)
                        return false
                      }}>Delete</Button>
                  </div> : null}
                </div>
              </Link>
            ))}
          </div>
        </div>
        <Delete post={toDelete} moderationKey={moderationKey} onDelete={handleOnDelete} />
      </div>
    </TooltipProvider>
  )
}