import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://rouletteaccuracy.com'),
  title: 'Roulette Accuracy — Precision Intelligence for European Roulette',
  description: 'Direction-aware prediction engine for European Roulette across 20+ Evolution Gaming & Pragmatic Play live tables. Dealer Signature, n9 sector mapping and travel mathematics in one glass-clear workspace.',
  keywords: ['roulette accuracy', 'roulette prediction', 'european roulette tool', 'roulette algorithm', 'dealer signature strategy', 'evolution gaming tracker'],
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/favicon.ico' }
    ],
    apple: [
      { url: '/logo.png' }
    ],
    shortcut: ['/logo.png']
  },
  openGraph: {
    title: 'Roulette Accuracy — Advanced Prediction Platform',
    description: 'Real-time European Roulette pattern recognition and predictive intelligence.',
    images: [{ url: '/logo.png', width: 800, height: 800, alt: 'Roulette Accuracy Premium' }],
    type: 'website'
  }
};

import { AuthProvider } from '../context/AuthContext';
import { DisclaimerProvider } from '../context/DisclaimerContext';
import { ToolWidgetProvider } from '../context/ToolWidgetContext';
import { FloatingPredictionWidget } from '../components/FloatingPredictionWidget';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full scroll-smooth">
      <body className="min-h-full flex flex-col bg-[#06080d] text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
        <AuthProvider>
          <DisclaimerProvider>
            <ToolWidgetProvider>
              {children}
              <FloatingPredictionWidget />
            </ToolWidgetProvider>
          </DisclaimerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

