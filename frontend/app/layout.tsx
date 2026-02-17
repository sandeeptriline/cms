import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { ProjectProvider } from '@/contexts/project-context'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'CMS Platform - Admin Panel',
  description: 'Headless Multi-Tenant CMS Admin Panel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ProjectProvider>
            {children}
            <Toaster />
          </ProjectProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
