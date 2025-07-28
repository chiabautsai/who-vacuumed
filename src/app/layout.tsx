import type { Metadata } from "next";
import "./globals.css";
import "../styles/loading-animations.css";

import { ThemeProvider } from "@/components/theme-provider"
import { Auth0Provider } from '@auth0/nextjs-auth0'
import { UserProvider } from '@/contexts/UserContext'
import { SessionHandler } from '@/components/auth/SessionHandler'
import { AsyncErrorBoundary } from '@/components/error/AsyncErrorBoundary'

export const metadata: Metadata = {
  title: "Who Vacuumed",
  description: "Track and manage household chores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <Auth0Provider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <AsyncErrorBoundary>
              <UserProvider>
                {children}
                <SessionHandler />
              </UserProvider>
            </AsyncErrorBoundary>
          </ThemeProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}

