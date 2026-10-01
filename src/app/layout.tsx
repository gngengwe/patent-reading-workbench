import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Patent Workbench',
  description: 'Patent Reading Workbench — analyze, cluster, and extract insights from patent text',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
