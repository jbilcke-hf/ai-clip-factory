import { pick } from "@/lib/pick"
import { Avatar, GameColor, Player, colors, eyes, mouths } from "@/types"

let nbPlayers = 0
export function newPlayer(player: Partial<Player> = {}): Player {
  return {
    id: `${nbPlayers++}`,
    name: typeof player?.name === "string" && player.name.length ? player.name : "Anon",
    color: typeof player?.color === "string" && player.color.length ? player.color : pick(colors) as GameColor,
    avatar: {
      eye: typeof player?.avatar?.eye === "string" && player.avatar.eye.length ? player.avatar.eye : pick(eyes) as string,
      mouth:  typeof player?.avatar?.mouth === "string"  && player.avatar.mouth.length ? player.avatar.mouth : pick(mouths) as string,
      colors: Array.isArray(player?.avatar?.colors) && player?.avatar?.colors.length ? colors : ["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"],
    } as Avatar,
    score: 0,
    ...player,
  }
}