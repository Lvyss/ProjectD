'use client'

import { useEffect, useState } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Inject CSS ke head untuk override body overflow
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      body {
        overflow: auto !important;
        height: auto !important;
        min-height: 100vh !important;
        display: block !important;
      }
      html {
        overflow: auto !important;
        height: auto !important;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      background: 'radial-gradient(ellipse at center, #0a0a0f 0%, #020205 100%)',
      overflowX: 'hidden',
      overflowY: 'auto',
    }}>
      {/* Background overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'url("/bg.jpeg")',
        backgroundSize: isMobile ? 'auto 80%' : 'cover',
        backgroundPosition: isMobile ? '65% 10%' : 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'blur(5px) brightness(0.4)',
        zIndex: 0,
      }} />
      
      {/* Dark overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1,
      }} />

      {/* Scanline effect */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.02) 1px, rgba(255,255,255,0.02) 2px)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
      }}>
        {children}
      </div>
    </div>
  )
}