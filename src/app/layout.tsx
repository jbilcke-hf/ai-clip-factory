import { cn } from '@/lib/utils'
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  // alternative names:
  // giffer
  // gipher
  // GIF Factory
  // GIF Magic
  // AI GIF Genie
  title: 'Hotshot-XL Text-to-GIF 🧞',
  description: 'Hotshot-XL Text-to-GIF 🧞',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn(
        `h-full w-full overflow-auto`,
        inter.className
        )}>
        {children}
      </body>
    </html>
  )
}
