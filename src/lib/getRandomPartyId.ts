import { customAlphabet } from "nanoid"
  
const nanoid = customAlphabet([
  '1234567890',
  'abcdefghijklmnopqrstuvwxyz',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
].join(''), 10)

export function getRandomPartyId() {
  const num = Math.round(Math.random() * 99)
  const newId = `${nanoid(2)}${num}${nanoid(2)}`
  return newId
}
