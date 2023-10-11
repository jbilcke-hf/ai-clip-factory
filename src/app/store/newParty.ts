import { getRandomPartyId } from "@/lib/getRandomPartyId"
import { Party } from "@/types"

export function newParty(party: Partial<Party> = {}): Party {
  return {
    partyId: getRandomPartyId(),
    durationInMs: 5 * 60 * 1000,
    startedAt: "", // ISO datetime
    status: "waiting",
    players: [],
    challenges: [],
    ...party,
  }
}