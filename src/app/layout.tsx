import type { Metadata, Viewport } from 'next';
import './globals.css';
import '../styles/maps.css';
import '../styles/mobile-optimized.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/providers/auth-provider';

export const metadata: Metadata = {
  title: 'HelloTaxi - Servicio de Taxi',
  description: 'Tu servicio de taxi confiable con negociación de tarifa.',
  generator: 'Next.js',
  manifest: '/manifest.json',
  keywords: ['taxi', 'transporte', 'viajes', 'conductor', 'negociación', 'tarifa'],
  authors: [
    { name: 'HelloTaxi Team' },
  ],
  icons: {
    icon: '/icons/android/android-launchericon-192-192.png',
    shortcut: '/icons/android/android-launchericon-192-192.png',
    apple: '/icons/ios/180.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HelloTaxi',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'HelloTaxi',
    title: 'HelloTaxi - Servicio de Taxi',
    description: 'Tu servicio de taxi confiable con negociación de tarifa.',
    images: '/icons/android/android-launchericon-512-512.png',
  },
  twitter: {
    card: 'summary',
    title: 'HelloTaxi - Servicio de Taxi',
    description: 'Tu servicio de taxi confiable con negociación de tarifa.',
    images: '/icons/android/android-launchericon-512-512.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#f59e0b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        
        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HelloTaxi" />
        
        {/* iOS app icons */}
        <link rel="apple-touch-icon" sizes="57x57" href="/icons/ios/57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icons/ios/60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/ios/72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/ios/76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/ios/114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/ios/120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/ios/144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/ios/152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/ios/167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/ios/180.png" />
        
        {/* Windows 11 tiles */}
        <meta name="msapplication-TileColor" content="#f59e0b" />
        <meta name="msapplication-TileImage" content="/icons/windows11/Square150x150Logo.scale-200.png" />
        
        {/* Standard favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/ios/32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/ios/16.png" />
      </head>
      <body className="font-body antialiased bg-background">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
