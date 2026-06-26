import { AuthProvider } from '@iliad/auth';
import { TenantProvider } from '@iliad/core';
import { Toaster } from '@iliad/ui';
import '@/styles/vortex-theme.css';
import type { Metadata } from 'next';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import { OdysseyShell } from '@/components/shell/odyssey-shell';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'OdysseyCast',
  description:
    'Unified radio operations workspace for weather, traffic, voice tracking, music clocks, and ad scheduling.',
};

const odysseyThemeInitScript = `
  (function () {
    try {
      var saved = localStorage.getItem('odyssey-theme');
      var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = saved === 'dark' || saved === 'light' ? saved : (systemDark ? 'dark' : 'light');
      var root = document.documentElement;
      root.classList.toggle('dark', theme === 'dark');
      root.setAttribute('data-theme', theme);
    } catch (e) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Script id="odyssey-theme-init" strategy="beforeInteractive">
          {odysseyThemeInitScript}
        </Script>
        <AuthProvider>
          <TenantProvider>
            <OdysseyShell>{children}</OdysseyShell>
            <Toaster />
          </TenantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}