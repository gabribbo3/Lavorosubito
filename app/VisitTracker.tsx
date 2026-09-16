'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { supabase } from '../lib/supabase';

const VISITOR_STORAGE_KEY =
  'lavorosubito_visitor_id';

function createVisitorId() {
  if (
    typeof window !== 'undefined' &&
    window.crypto?.randomUUID
  ) {
    return window.crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2) +
    '-' +
    Math.random().toString(36).slice(2)
  );
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
    return createVisitorId();
  }
}

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    async function trackVisit() {
      try {
        const visitorId = getVisitorId();

        const { error } = await supabase.rpc(
          'track_site_visit',
          {
            p_visitor_id: visitorId,
            p_path: pathname || '/'
          }
        );

        if (error) {
          console.error(
            'Errore registrazione visita:',
            error.message
          );
        }
      } catch (error) {
        console.error(
          'Errore VisitTracker:',
          error
        );
      }
    }

    void trackVisit();
  }, [pathname]);

  return null;
}
