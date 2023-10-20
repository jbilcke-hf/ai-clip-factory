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
         <p>
         👉 This space generates clips using <a className="text-stone-600 underline" href="https://github.com/jbilcke-hf/Hotshot-XL-Gradio-API" target="_blank">Hotshot-XL-Gradio-API</a>, a fork of <a className="text-stone-600 underline" href="https://huggingface.co/spaces/fffiloni/text-to-gif" target="_blank">fffiloni/text-to-gif</a>.
        </p>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={() => setOpen(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}