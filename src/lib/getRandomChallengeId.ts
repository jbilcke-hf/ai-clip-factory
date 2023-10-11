import { customAlphabet } from "nanoid"
  
const nanoid = customAlphabet([
  '1234567890',
  'abcdefghijklmnopqrstuvwxyz',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
].join(''), 16)

export function getRandomChallengeId() {
  return nanoid()
}
