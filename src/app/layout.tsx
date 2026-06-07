import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PROJECT.S',
  description: 'GTA SA Territory Leaderboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ 
        margin: 0, 
        padding: 0, 
        background: '#000',
        overflow: 'hidden',
        height: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}>
        {children}
      </body>
    </html>
  )
}