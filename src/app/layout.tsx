import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VP Pershot - Ortiqcha Tovarlarni Fiksatsiya Qilish',
  description: 'Muammoli otdel va omborxona uchun ortiqcha tovarlarni skanerlash va Google Sheets jadvaliga integratsiya tizimi',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
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
      </body>
    </html>
  );
}
