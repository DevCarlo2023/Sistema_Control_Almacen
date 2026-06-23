import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

import { Suspense } from 'react'
import { MobileNav } from '@/components/ui/mobile-nav'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'PROMET - Control de Almacén',
  description: 'CARLO TECH V2.0 - Gestión de Inventarios y Equipos',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CARLO TECH',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#020617',
}

import { OfflineSyncProvider } from '@/components/offline-sync-provider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} antialiased pb-20 lg:pb-0`}>
        <OfflineSyncProvider>
          {children}
          <Suspense fallback={null}>
            <MobileNav />
          </Suspense>
          <Toaster position="top-right" expand={true} richColors />
          <Analytics />
        </OfflineSyncProvider>
      </body>
    </html>
  )
}
