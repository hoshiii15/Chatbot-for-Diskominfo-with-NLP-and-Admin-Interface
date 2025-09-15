import './globals.css';

export const metadata = {
  title: 'FAQ Chatbot Admin Dashboard',
  description: 'Professional admin interface for managing FAQ chatbot system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
