import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://warehouse-surplus-tracker.vercel.app'),
  title: 'VP Pershot - Warehouse Surplus Tracker',
  description: 'Muammoli otdel va omborxona uchun ortiqcha tovarlarni tezkor skanerlash va Google Sheets jadvaliga integratsiya tizimi',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/app-logo.png', sizes: 'any', type: 'image/png' },
      { url: '/app-logo.jpg', sizes: 'any', type: 'image/jpeg' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
      { url: '/apple-touch-icon.jpg' },
    ],
    shortcut: ['/app-logo.png'],
  },
  openGraph: {
    title: 'VP Pershot - Warehouse Surplus Tracker 📦',
    description: 'Omborxona ortiqcha tovarlarni fiksatsiya qilish va Google Sheets bilan real vaqtda sinxronizatsiya tizimi',
    url: 'https://warehouse-surplus-tracker.vercel.app',
    siteName: 'VP Pershot Tracker',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 675,
        alt: 'VP Pershot - Warehouse Surplus Tracker Logo Banner',
      },
    ],
    locale: 'uz_UZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VP Pershot - Warehouse Surplus Tracker 📦',
    description: 'Omborxona ortiqcha tovarlarni fiksatsiya qilish va Google Sheets bilan real vaqtda sinxronizatsiya tizimi',
    images: ['/og-image.jpg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#191b26',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className="dark">
      <body className="antialiased selection:bg-indigo-500 selection:text-white bg-[#191b26] text-slate-100 min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
