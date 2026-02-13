import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pantolingo',
  description: 'Website translation made simple',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
                    // system: resolve OS preference to a class
                    document.documentElement.classList.add(
                      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
                    );
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
