import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CMS Platform',
  description: 'Headless Multi-Tenant CMS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
