import type {Metadata} from 'next'
import {Inter_Tight, JetBrains_Mono, Newsreader} from 'next/font/google'
import './globals.css'

/** Answers are set in the serif, the interface in the sans, ids and dates in the mono. */
const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
})

const interTight = Inter_Tight({
  variable: '--font-inter-tight',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'TSB Oracle',
  description:
    'Ask about a car and get answers from its service bulletins, NHTSA investigations and owner complaints, each cited, with any disagreement between them laid out.',
}

export default function RootLayout({children}: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${interTight.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
