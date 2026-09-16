import './globals.css';

import type { Metadata } from 'next';
import Script from 'next/script';

import PushBridge from './PushBridge';
import VisitTracker from './VisitTracker';

export const metadata: Metadata = {
  title: 'LavoroSubito',
  description:
    'Trova un professionista disponibile vicino a te.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        {children}

        <PushBridge />
        <VisitTracker />

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18451155996"
          strategy="afterInteractive"
        />

        <Script
          id="google-ads-tag"
          strategy="afterInteractive"
        >
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18451155996');
          `}
        </Script>
      </body>
    </html>
  );
}
