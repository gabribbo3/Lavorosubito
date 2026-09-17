'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { supabase } from '../lib/supabase';

const VISITOR_STORAGE_KEY =
  'lavorosubito_visitor_id';

const CONSENT_STORAGE_KEY =
  'lavorosubito_cookie_consent';

type ConsentPreferences = {
  analytics: boolean;
  advertising: boolean;
};

function createVisitorId() {
  if (
    typeof window !== 'undefined' &&
    window.crypto?.randomUUID
  ) {
    return window.crypto.randomUUID();
  }

  /*
   * Fallback UUID v4 compatibile con
   * una colonna PostgreSQL di tipo UUID.
   */
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, character => {
      const random =
        Math.floor(Math.random() * 16);

      const value =
        character === 'x'
          ? random
          : (random & 0x3) | 0x8;

      return value.toString(16);
    });
}

function readConsent():
  | ConsentPreferences
  | null {
  try {
    const stored =
      window.localStorage.getItem(
        CONSENT_STORAGE_KEY
      );

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);

    if (
      typeof parsed?.analytics !==
        'boolean' ||
      typeof parsed?.advertising !==
        'boolean'
    ) {
      return null;
    }

    return {
      analytics: parsed.analytics,
      advertising:
        parsed.advertising
    };
  } catch {
    return null;
  }
}

function getVisitorId() {
  try {
    let visitorId =
      window.localStorage.getItem(
        VISITOR_STORAGE_KEY
      );

    if (!visitorId) {
      visitorId = createVisitorId();

      window.localStorage.setItem(
        VISITOR_STORAGE_KEY,
        visitorId
      );
    }

    return visitorId;
  } catch {
    /*
     * Se localStorage non è disponibile
     * non conserviamo un identificatore
     * persistente.
     */
    return null;
  }
}

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function trackVisit() {
      try {
        const consent =
          readConsent();

        /*
         * Nessun tracciamento statistico
         * senza consenso analytics.
         */
        if (!consent?.analytics) {
          return;
        }

        const visitorId =
          getVisitorId();

        if (!visitorId) {
          return;
        }

        const { error } =
          await supabase.rpc(
            'track_site_visit',
            {
              p_visitor_id:
                visitorId,
              p_path:
                pathname || '/'
            }
          );

        if (
          error &&
          !cancelled
        ) {
          console.error(
            'Errore registrazione visita:',
            error.message
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            'Errore VisitTracker:',
            error
          );
        }
      }
    }

    void trackVisit();

    /*
     * Se l'utente cambia consenso mentre
     * si trova sulla stessa pagina,
     * VisitTracker viene aggiornato subito.
     */
    function handleConsentChange() {
      void trackVisit();
    }

    window.addEventListener(
      'lavorosubito-consent-change',
      handleConsentChange
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        'lavorosubito-consent-change',
        handleConsentChange
      );
    };
  }, [pathname]);

  return null;
}
