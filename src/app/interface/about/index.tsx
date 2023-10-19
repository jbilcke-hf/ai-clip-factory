import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"

export function About() {
  const [isOpen, setOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <span className="hidden md:inline">About this project</span>
          <span className="inline md:hidden">About</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI Clip Factory</DialogTitle>
          <DialogDescription className="w-full text-center text-lg font-bold text-stone-800">
            AI Clip Factory
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-stone-800">
        <p className="">
           The model used by the AI Clip Factory depends on what I&apos;m experimenting at the current time.
         </p>
         <p>
         👉 Right now it uses an API that you can <a className="text-stone-600 underline" href="https://github.com/jbilcke-hf/Hotshot-XL-Gradio-API" target="_blank">fork from here</a>. This API is based on the amazing work made by <a className="text-stone-600 underline" href="https://huggingface.co/fffiloni" target="_blank">@fffiloni</a> for his super cool <a className="text-stone-600 underline" href="https://huggingface.co/spaces/fffiloni/text-to-gif" target="_blank">Hotshot-XL Space</a>.
        </p>
         <p>
         👉 The model is <a className="text-stone-600 underline" href="https://huggingface.co/hotshotco/Hotshot-XL" target="_blank">Hotshot-XL</a> made by the awesome <a className="text-stone-600 underline" href="https://hotshot.co" target="_blank">hotshot.co team</a>.
         </p>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={() => setOpen(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}