"use client"

import { create } from "zustand"

import { CurrentPanel, Party, Player } from "@/types"
import { newParty } from "./newParty"
import { newPlayer } from "./newPlayer"

// note: this should not be used in server-side template or we will have some trouble
export const useStore = create<{
  panel: CurrentPanel
  isLoading: boolean
  party: Party
  player: Player
  setLoading: (isLoading: boolean) => void
  setPanel: (panel: CurrentPanel) => void
  setParty: (party: Partial<Party>) => void
  setPlayer: (player: Player) => void
}>((set, get) => ({
  panel: "join",
  isLoading: false,
  party: newParty(),
  player: newPlayer(),
  setLoading: (isLoading: boolean) => {
    set({ isLoading })
  },
  setPanel: (panel: CurrentPanel) => {
    set({ panel })
  },
  setParty: (party: Partial<Party>) => {
    set({
      party: {
        ...get().party,
        ...party,
      }
    })
  },
  setPlayer: (player: Player) => {
    set({ player })
  }
}))

