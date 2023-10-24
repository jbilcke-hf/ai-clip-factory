
export type ProjectionMode = 'cartesian' | 'spherical'

export type MouseEventType = "hover" | "click"

export type MouseEventHandler = (type: MouseEventType, x: number, y: number) => Promise<void>

export type CacheMode = "use" | "renew" | "ignore"

export interface RenderRequest {
  prompt: string

  // whether to use video segmentation
  // disabled (default)
  // firstframe: we only analyze the first frame
  // allframes: we analyze all the frames
  segmentation: 'disabled' | 'firstframe' | 'allframes'

  // segmentation will only be executed if we have a non-empty list of actionnables
  // actionnables are names of things like "chest", "key", "tree", "chair" etc
  actionnables: string[]

  // note: this is the number of frames for Zeroscope,
  // which is currently configured to only output 3 seconds, so:
  // nbFrames=8 -> 1 sec
  // nbFrames=16 -> 2 sec
  // nbFrames=24 -> 3 sec
  nbFrames: number // min: 1, max: 24

  nbSteps: number // min: 1, max: 50

  seed: number

  width: number // fixed at 1024 for now
  height: number // fixed at 512 for now

  // upscaling factor
  // 0: no upscaling
  // 1: no upscaling
  // 2: 2x larger
  // 3: 3x larger
  // 4x: 4x larger, up to 4096x4096 (warning: a PNG of this size can be 50 Mb!)
  upscalingFactor: number

  projection: ProjectionMode

  cache: CacheMode

  wait: boolean // wait until the job is completed

  analyze: boolean // analyze the image to generate a caption (optional)
}

export interface ImageSegment {
  id: number
  box: number[]
  color: number[]
  label: string
  score: number 
}

export type RenderedSceneStatus =
  | "pending"
  | "completed"
  | "error"

export interface RenderedScene {
  renderId: string
  status: RenderedSceneStatus
  assetUrl: string 
  alt: string
  error: string
  maskUrl: string
  segments: ImageSegment[]
}

export interface ImageAnalysisRequest {
  image: string // in base64
  prompt: string
}

export interface ImageAnalysisResponse {
  result: string
  error?: string
}

export type RenderingEngine =
  | "VIDEOCHAIN"
  | "OPENAI"
  | "REPLICATE"

export type PostVisibility =
  | "featured" // featured by admins
  | "trending" // top trending / received more than 10 upvotes
  | "normal" // default visibility

export type Post = {
  postId: string
  appId: string
  prompt: string
  model: string
  previewUrl: string
  assetUrl: string
  createdAt: string
  visibility: PostVisibility
  upvotes: number
  downvotes: number
}

export type CreatePostResponse = {
  success?: boolean
  error?: string
  post: Post
}

export type GetAppPostsResponse = {
  success?: boolean
  error?: string
  posts: Post[]
}

export type GetAppPostResponse = {
  success?: boolean
  error?: string
  post: Post
}

export const eyes = ["normal", "happy", "sleepy", "mischief"]
export const mouths = ["smile",  "open", "surprise", "unhappy"]

export type Avatar = {
  eye: "normal" | "happy" | "sleepy" | "mischief"
  mouth: "smile" | "open" | "surprise" | "unhappy"
  colors: string[]
}

export const colors: GameColor[] = [
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose"
]
export type GameColor =
  | "stone"
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose"

  
export const playerColorsAlt: Record<GameColor, string> = {
  stone: "text-stone-700",
  red: "text-red-700",
  orange: "text-orange-700",
  amber: "text-amber-700",
  yellow: "text-yellow-700",
  lime: "text-lime-700",
  green: "text-green-700",
  emerald: "text-emerald-700",
  teal: "text-teal-700",
  cyan: "text-cyan-700",
  sky: "text-sky-700",
  blue: "text-blue-700",
  indigo: "text-indigo-700",
  violet: "text-violet-700",
  purple: "text-purple-700",
  fuchsia: "text-fuchsia-700",
  pink: "text-pink-700",
  rose: "text-rose-700",
}

// players have a deeper color
export const playerColors: Record<GameColor, string> = {
  stone: "text-stone-800",
  red: "text-red-800",
  orange: "text-orange-800",
  amber: "text-amber-800",
  yellow: "text-yellow-800",
  lime: "text-lime-800",
  green: "text-green-800",
  emerald: "text-emerald-800",
  teal: "text-teal-800",
  cyan: "text-cyan-800",
  sky: "text-sky-800",
  blue: "text-blue-800",
  indigo: "text-indigo-800",
  violet: "text-violet-800",
  purple: "text-purple-800",
  fuchsia: "text-fuchsia-800",
  pink: "text-pink-800",
  rose: "text-rose-800",
}

export type Player = {
  id: string
  name: string
  color: GameColor
  avatar: Avatar
  score: number
}

export type Team = {
  id: number
  name: string
  color: GameColor
  score: number
  players: string[]
}

// a "challenge" is what is passed from one person to another
export type Challenge = {
  id: string
  fromPlayer: string
  toPlayer: string
  assetUrl: string
  prompt: string
  solved: boolean
}

export type PartyStatus =
  | "waiting" // not started yet -> display the lobby panel
  | "running" // game is running -> display the invent or guess panels
  | "ended" // -> display the results panel

export type Party = {
  partyId: string
  durationInMs: number // 5 * 60 * 1000
  startedAt: string // ISO datetime
  players: Player[]
  status: PartyStatus
  // we can add back the concept of team later
  // but for now let's keep it simple and skip it
  // teams: Team[]

  challenges: Challenge[]
}

export type CurrentPanel =
  | "join"
  | "play"
  | "results"

// vendor-specific types

export type HotshotImageInferenceSize =
| '320x768'
| '384x672'
| '416x608'
| '512x512'
| '608x416'
| '672x384'
| '768x320'
| '1024x1024' // custom ratio - this isn't supported / supposed to work properly
| '1024x512' // custom panoramic ratio - this isn't supported / supposed to work properly
| '1024x576' // movie ratio (16:9) this isn't supported / supposed to work properly
| '576x1024' // tiktok ratio (9:16) this isn't supported / supposed to work properly

export type VideoOptions = {
  positivePrompt: string

  negativePrompt?: string

  size?: HotshotImageInferenceSize
  
  /**
   * Must be a model *name*
   */
  huggingFaceLora?: string

  replicateLora?: string

  triggerWord?: string
  
  nbFrames?: number // FPS (eg. 8)
  duration?: number // in milliseconds

  steps?: number

  key?: string // a semi-unique key to prevent abuse from some users
}

export type SDXLModel = {
  image: string
  title: string
  repo: string
  trigger_word: string
  weights: string
  is_compatible: boolean
  likes: number
  downloads: number
}

export type QualityLevel = "low" | "medium" | "high"

export type QualityOption = {
  level: QualityLevel
  label: string
}
