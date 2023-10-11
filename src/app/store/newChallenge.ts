import { getRandomChallengeId } from "@/lib/getRandomChallengeId"
import { Challenge } from "@/types"

export function newChallenge(message: Partial<Challenge> = {}): Challenge {
  return {
    id: getRandomChallengeId(),
    fromPlayer: "",
    toPlayer: "",
    assetUrl: "",
    prompt: "",
    solved: false,
    ...message
  }
}