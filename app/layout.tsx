import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'STOP Engine Lab',
  description: 'Routing pipeline explorer with deterministic replay and full trace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-void text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
