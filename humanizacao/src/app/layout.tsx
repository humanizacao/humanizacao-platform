import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'HumanizAÇÃO · Plataforma de Inteligência Psicossocial',
    template: '%s · HumanizAÇÃO',
  },
  description: 'Plataforma SaaS de Gestão Estratégica de Riscos Psicossociais conforme NR-1. People Analytics, IA preditiva e conformidade trabalhista.',
  keywords: ['NR-1', 'riscos psicossociais', 'saúde mental corporativa', 'people analytics', 'SESMT', 'RH'],
  authors: [{ name: 'HumanizAÇÃO Consultoria Organizacional' }],
  robots: 'noindex, nofollow', // SaaS platform - private
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a2b4a',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '13px',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 500,
              border: '1px solid rgba(255,255,255,0.1)',
            },
            success: {
              iconTheme: { primary: '#3aab86', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#e05252', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  )
}
