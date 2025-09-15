import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Slide Puzzle Pro',
  description: '🎮 スライドパズルゲーム - カラフルなタイルを並べて消すパズルゲーム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}