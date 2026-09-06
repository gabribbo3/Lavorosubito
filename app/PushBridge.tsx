'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function urlBase64ToUint8Array(base64String: string) {
  const padding =
    '='.repeat(
      (4 - (base64String.length % 4)) % 4
    );

  const base64 =
    (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

  const rawData =
    window.atob(base64);

  return Uint8Array.from(
    [...rawData].map(
      char => char.charCodeAt(0)
    )
  );
}

export default function PushBridge() {
  const [role, setRole] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [status, setStatus] =
    useState('');

  useEffect(() => {
    let channel: any = null;

    async function start() {
      const {
        data: { session }
      } =
        await supabase.auth.getSession();

      const user = session?.user;

      if (!user) return;

      const { data: profile } =
        await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

      const currentRole =
        profile?.role ?? null;

      setRole(currentRole);

      if (
        currentRole !== 'cliente'
      ) {
        return;
      }

      channel =
        supabase
          .channel(
            `v19-push-${user.id}`
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'jobs'
            },
            async payload => {
              const job =
                payload.new as {
                  id?: string;
                  client_id?: string;
                };

              if (
                !job.id ||
                job.client_id !==
                  user.id
              ) {
                return;
              }

              const {
                data: {
                  session:
                    freshSession
                }
              } =
                await supabase.auth
                  .getSession();

              const token =
                freshSession
                  ?.access_token;

              if (!token) return;

              try {
                await fetch(
                  '/api/push/send',
                  {
                    method: 'POST',

                    headers: {
                      'Content-Type':
                        'application/json',

                      Authorization:
                        `Bearer ${token}`
                    },

                    body:
                      JSON.stringify({
                        jobId: job.id
                      })
                  }
                );
              } catch {
                // La richiesta resta valida
                // anche se la push fallisce.
              }
            }
          )
          .subscribe();
    }

    start();

    return () => {
      if (channel) {
        supabase.removeChannel(
          channel
        );
      }
    };
  }, []);

  async function activateNotifications() {
    setLoading(true);
    setStatus('');

    try {
      if (
        !(
          'serviceWorker'
          in navigator
        ) ||
        !(
          'PushManager'
          in window
        )
      ) {
        setStatus(
          '❌ Notifiche non supportate su questo browser.'
        );

        return;
      }

      const {
        data: { user }
      } =
        await supabase.auth
          .getUser();

      if (!user) {
        setStatus(
          '❌ Devi essere autenticato.'
        );

        return;
      }

      const permission =
        await Notification
          .requestPermission();

      if (
        permission !==
        'granted'
      ) {
        setStatus(
          '⚠️ Autorizzazione notifiche non concessa.'
        );

        return;
      }

      const registration =
        await navigator
          .serviceWorker
          .register('/sw.js');

      await navigator
        .serviceWorker
        .ready;

      let subscription =
        await registration
          .pushManager
          .getSubscription();

      if (!subscription) {
        const publicKey =
          (
            process.env
              .NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
            ''
          )
            .replace(
              /\s+/g,
              ''
            )
            .replace(
              /^["']|["']$/g,
              ''
            );

        if (!publicKey) {
          throw new Error(
            'Chiave VAPID pubblica mancante.'
          );
        }

        subscription =
          await registration
            .pushManager
            .subscribe({
              userVisibleOnly:
                true,

              applicationServerKey:
                urlBase64ToUint8Array(
                  publicKey
                )
            });
      }

      const json =
        subscription.toJSON();

      if (
        !json.endpoint ||
        !json.keys?.p256dh ||
        !json.keys?.auth
      ) {
        throw new Error(
          'Dati push incompleti.'
        );
      }

      const { error } =
        await supabase
          .from(
            'push_subscriptions'
          )
          .upsert(
            {
              user_id:
                user.id,

              endpoint:
                json.endpoint,

              p256dh:
                json.keys.p256dh,

              auth:
                json.keys.auth,

              updated_at:
                new Date()
                  .toISOString()
            },

            {
              onConflict:
                'user_id,endpoint'
            }
          );

      if (error) {
        throw error;
      }

      setStatus(
        '✅ Notifiche attivate.'
      );
    } catch (error: any) {
      setStatus(
        `❌ ${
          error?.message ||
          'Errore attivazione.'
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  if (
    role !==
    'professionista'
  ) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 9999,
        maxWidth: 520,
        margin: '0 auto',
        padding: 14,
        borderRadius: 16,
        background: 'white',
        boxShadow:
          '0 8px 30px rgba(0,0,0,.18)',
        border:
          '1px solid #e5e5e5'
      }}
    >
      <div
        style={{
          fontWeight: 800,
          marginBottom: 8
        }}
      >
        🔔 Notifiche nuovi lavori
      </div>

      <button
        type="button"
        className="full"
        onClick={
          activateNotifications
        }
        disabled={loading}
      >
        {loading
          ? 'Attivazione...'
          : '🔔 Attiva notifiche'}
      </button>

      {status && (
        <div
          style={{
            marginTop: 8,
            fontSize: 14
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
}
