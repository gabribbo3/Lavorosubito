'use client';

import {
  useEffect,
  useState
} from 'react';

const CONSENT_STORAGE_KEY =
  'lavorosubito_cookie_consent';

const VISITOR_STORAGE_KEY =
  'lavorosubito_visitor_id';

type ConsentPreferences = {
  analytics: boolean;
  advertising: boolean;
};

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

function updateGoogleConsent(
  preferences: ConsentPreferences
) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dataLayer =
    window.dataLayer || [];

  const gtag =
    window.gtag ||
    function (...args: any[]) {
      window.dataLayer.push(args);
    };

  window.gtag = gtag;

  gtag('consent', 'update', {
    analytics_storage:
      preferences.analytics
        ? 'granted'
        : 'denied',

    ad_storage:
      preferences.advertising
        ? 'granted'
        : 'denied',

    ad_user_data:
      preferences.advertising
        ? 'granted'
        : 'denied',

    ad_personalization:
      preferences.advertising
        ? 'granted'
        : 'denied'
  });
}

function readPreferences():
  | ConsentPreferences
  | null {
  try {
    const value =
      window.localStorage.getItem(
        CONSENT_STORAGE_KEY
      );

    if (!value) {
      return null;
    }

    const parsed =
      JSON.parse(value);

    if (
      typeof parsed?.analytics !==
        'boolean' ||
      typeof parsed?.advertising !==
        'boolean'
    ) {
      return null;
    }

    return {
      analytics:
        parsed.analytics,
      advertising:
        parsed.advertising
    };
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const [visible, setVisible] =
    useState(false);

  const [
    customize,
    setCustomize
  ] = useState(false);

  const [
    analytics,
    setAnalytics
  ] = useState(false);

  const [
    advertising,
    setAdvertising
  ] = useState(false);

  useEffect(() => {
    const preferences =
      readPreferences();

    if (!preferences) {
      setVisible(true);
      return;
    }

    setAnalytics(
      preferences.analytics
    );

    setAdvertising(
      preferences.advertising
    );

    updateGoogleConsent(
      preferences
    );
  }, []);

  function savePreferences(
    preferences:
      ConsentPreferences
  ) {
    try {
      window.localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify(
          preferences
        )
      );

      /*
       * Se l'utente rifiuta le statistiche,
       * eliminiamo anche l'identificatore
       * eventualmente creato in precedenza.
       */
      if (!preferences.analytics) {
        window.localStorage.removeItem(
          VISITOR_STORAGE_KEY
        );
      }
    } catch {
      // Il sito continua a funzionare.
    }

    setAnalytics(
      preferences.analytics
    );

    setAdvertising(
      preferences.advertising
    );

    updateGoogleConsent(
      preferences
    );

    window.dispatchEvent(
      new Event(
        'lavorosubito-consent-change'
      )
    );

    setVisible(false);
    setCustomize(false);
  }

  function acceptAll() {
    savePreferences({
      analytics: true,
      advertising: true
    });
  }

  function rejectAll() {
    savePreferences({
      analytics: false,
      advertising: false
    });
  }

  function saveCustom() {
    savePreferences({
      analytics,
      advertising
    });
  }

  if (!visible) {
    return (
      <button
        type="button"
        aria-label="Gestisci preferenze cookie"
        onClick={() => {
          const preferences =
            readPreferences();

          if (preferences) {
            setAnalytics(
              preferences.analytics
            );

            setAdvertising(
              preferences.advertising
            );
          }

          setCustomize(true);
          setVisible(true);
        }}
        style={{
          position: 'fixed',
          left: 14,
          bottom: 14,
          zIndex: 9998,
          border: '1px solid #d0d5dd',
          borderRadius: 999,
          background: '#ffffff',
          padding: '9px 13px',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow:
            '0 4px 14px rgba(0,0,0,.12)'
        }}
      >
        🍪 Privacy
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Preferenze privacy"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background:
          'rgba(0,0,0,.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          background: '#ffffff',
          borderRadius: 18,
          padding: 22,
          boxShadow:
            '0 18px 50px rgba(0,0,0,.25)'
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 10
          }}
        >
          Privacy e cookie
        </h2>

        <p
          style={{
            marginTop: 0,
            lineHeight: 1.55,
            fontSize: 14
          }}
        >
          LavoroSubito utilizza
          tecnologie necessarie al
          funzionamento del sito.
          Con il tuo consenso possiamo
          inoltre raccogliere statistiche
          di utilizzo e utilizzare
          tecnologie pubblicitarie di
          Google.
        </p>

        <p
          style={{
            fontSize: 13,
            lineHeight: 1.5
          }}
        >
          Puoi accettare, rifiutare o
          personalizzare la scelta.
          Potrai modificarla in qualsiasi
          momento tramite il pulsante
          “Privacy”.
        </p>

        <a
          href="/privacy"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block',
            marginBottom: 16,
            fontWeight: 700
          }}
        >
          Leggi la Privacy Policy
        </a>

        {customize && (
          <div
            style={{
              borderTop:
                '1px solid #e5e7eb',
              borderBottom:
                '1px solid #e5e7eb',
              padding:
                '14px 0',
              marginBottom: 16
            }}
          >
            <div
              style={{
                marginBottom: 16
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  gap: 16
                }}
              >
                <div>
                  <b>
                    Necessari
                  </b>

                  <div
                    style={{
                      fontSize: 12,
                      marginTop: 4
                    }}
                  >
                    Necessari per il
                    funzionamento e la
                    sicurezza del sito.
                  </div>
                </div>

                <b>
                  Sempre attivi
                </b>
              </div>
            </div>

            <label
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                gap: 16,
                marginBottom: 16,
                cursor: 'pointer'
              }}
            >
              <div>
                <b>
                  Statistiche
                </b>

                <div
                  style={{
                    fontSize: 12,
                    marginTop: 4
                  }}
                >
                  Permettono di stimare
                  visualizzazioni e
                  visitatori del sito.
                </div>
              </div>

              <input
                type="checkbox"
                checked={analytics}
                onChange={event =>
                  setAnalytics(
                    event.target.checked
                  )
                }
                style={{
                  width: 20,
                  height: 20
                }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer'
              }}
            >
              <div>
                <b>
                  Pubblicità
                </b>

                <div
                  style={{
                    fontSize: 12,
                    marginTop: 4
                  }}
                >
                  Consente l'utilizzo
                  delle tecnologie
                  pubblicitarie Google
                  secondo la scelta
                  espressa.
                </div>
              </div>

              <input
                type="checkbox"
                checked={advertising}
                onChange={event =>
                  setAdvertising(
                    event.target.checked
                  )
                }
                style={{
                  width: 20,
                  height: 20
                }}
              />
            </label>
          </div>
        )}

        {!customize ? (
          <>
            <button
              type="button"
              onClick={acceptAll}
              style={{
                width: '100%',
                padding: 13,
                border: 0,
                borderRadius: 10,
                fontWeight: 800,
                cursor: 'pointer',
                marginBottom: 8
              }}
            >
              Accetta tutto
            </button>

            <button
              type="button"
              onClick={rejectAll}
              style={{
                width: '100%',
                padding: 13,
                border:
                  '1px solid #d0d5dd',
                borderRadius: 10,
                background:
                  '#ffffff',
                fontWeight: 800,
                cursor: 'pointer',
                marginBottom: 8
              }}
            >
              Rifiuta tutto
            </button>

            <button
              type="button"
              onClick={() =>
                setCustomize(true)
              }
              style={{
                width: '100%',
                padding: 11,
                border: 0,
                background:
                  'transparent',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Personalizza
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={saveCustom}
              style={{
                width: '100%',
                padding: 13,
                border: 0,
                borderRadius: 10,
                fontWeight: 800,
                cursor: 'pointer',
                marginBottom: 8
              }}
            >
              Salva preferenze
            </button>

            <button
              type="button"
              onClick={rejectAll}
              style={{
                width: '100%',
                padding: 12,
                border:
                  '1px solid #d0d5dd',
                borderRadius: 10,
                background:
                  '#ffffff',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Rifiuta tutto
            </button>
          </>
        )}
      </div>
    </div>
  );
}
