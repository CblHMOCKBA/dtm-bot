import type { Metadata } from 'next'
import './globals.css'
import { TelegramProvider } from '@/components/TelegramProvider'
import { ToastProvider } from '@/components/ToastProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { NavigationProvider } from '@/components/NavigationProvider'
import PageTransition from '@/components/PageTransition'

export const metadata: Metadata = {
  title: 'DTM',
  description: 'Премиальный автосалон DTM в Москве',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
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
