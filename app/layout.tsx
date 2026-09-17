import './globals.css';

import type { Metadata } from 'next';
import Script from 'next/script';

import PushBridge from './PushBridge';
import VisitTracker from './VisitTracker';
import CookieConsent from './CookieConsent';

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
        <CookieConsent />

        {/*
          Consent Mode viene inizializzato PRIMA
          del caricamento del tag Google Ads.

          Finché l'utente non sceglie,
          i consensi opzionali restano negati.
        */}
        <Script
          id="google-consent-default"
          strategy="beforeInteractive"
        >
          {`
            window.dataLayer = window.dataLayer || [];

            function gtag(){
              dataLayer.push(arguments);
            }

            gtag('consent', 'default', {
              ad_storage: 'denied',
              analytics_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              wait_for_update: 500
            });
          `}
        </Script>

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

            window.gtag =
              window.gtag ||
              function(){
                window.dataLayer.push(arguments);
              };

            window.gtag('js', new Date());

            window.gtag(
              'config',
              'AW-18451155996'
            );
          `}
        </Script>
      </body>
    </html>
  );
}
