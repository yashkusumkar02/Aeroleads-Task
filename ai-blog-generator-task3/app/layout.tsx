import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: process.env.SITE_NAME || 'AI Programming Article Generator',
  description: 'Generate up to 10 full programming articles using AI. Articles are automatically saved under /blog.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


