import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'CUEMS Inventory Management',
  description: 'CUEMS Inventory Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}


