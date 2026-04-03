import "./globals.css"

export const metadata = {
  title: {
    template: '%s | AAuth',
    default: 'AAuth — Authentication & Authorization for Autonomous Agents',
  },
  description: 'AAuth is an authentication and authorization protocol for autonomous agents and dynamic ecosystems.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.aauth.ai',
    siteName: 'AAuth',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": ""}'
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
