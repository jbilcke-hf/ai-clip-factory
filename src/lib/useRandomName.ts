"use client"

import { useEffect, useState } from "react"
import { uniqueNamesGenerator, colors, animals } from "unique-names-generator"


export function useRandomName() {
  const [name, setName] = useState("")
  useEffect(() => {
    const newName = uniqueNamesGenerator({
      dictionaries: [
        colors,
        animals
      ],
      separator: '-',
      length: 2,
    });
    setName(newName)
  }, [])
  return name
}