import type { Metadata, Viewport } from 'next'
import './globals.css'
import { TelegramProvider } from '@/components/TelegramProvider'
import { ToastProvider } from '@/components/ToastProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { NavigationProvider } from '@/components/NavigationProvider'
import PageTransition from '@/components/PageTransition'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'DTM',
  description: 'Премиальный автосалон DTM в Москве',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning - Telegram SDK добавляет style к html после загрузки
    // Это нормально и ожидаемо, поэтому подавляем warning
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Telegram Web App SDK */}
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive"
        />
      </head>
      {/* suppressHydrationWarning на body тоже, на всякий случай */}
      <body suppressHydrationWarning>
        <ErrorBoundary>
          <TelegramProvider>
            <ToastProvider>
              <NavigationProvider>
                <PageTransition>
                  {children}
                </PageTransition>
              </NavigationProvider>
            </ToastProvider>
          </TelegramProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
