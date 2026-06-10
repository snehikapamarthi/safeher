import './globals.css'

export const metadata = {
  title: 'SafeHer - Your Safety Companion',
  description: 'Emergency app for women safety',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}