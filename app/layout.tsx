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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased pb-20 lg:pb-0`}>
        {children}
        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
        <Toaster position="top-right" expand={true} richColors />
        <Analytics />
      </body>
    </html>
  )
}
