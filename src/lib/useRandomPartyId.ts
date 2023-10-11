"use client"

import { useEffect, useState } from "react"

import { getRandomPartyId } from "./getRandomPartyId"

export function useRandomPartyId() {
  const [id, setId] = useState("")
  useEffect(() => {
    setId(getRandomPartyId())
  }, [])
  return id
}