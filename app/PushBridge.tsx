'use client';

import {
  useEffect,
  useState
} from 'react';

import {
  supabase
} from '../lib/supabase';

function urlBase64ToUint8Array(
  base64String: string
) {
  const padding =
    '='.repeat(
      (
        4
        -
        (
          base64String.length
          % 4
        )
      )
      % 4
    );

  const base64 =
    (
      base64String
      +
      padding
    )
      .replace(
        /-/g,
        '+'
      )
      .replace(
        /_/g,
        '/'
      );

  const rawData =
    window.atob(
      base64
    );

  return Uint8Array.from(
    [
      ...rawData
    ].map(
      char =>
        char.charCodeAt(
          0
        )
    )
  );
}

export default function PushBridge() {

  const [
    show,
    setShow
  ] =
    useState(
      false
    );

  const [
    status,
    setStatus
  ] =
    useState(
      ''
    );

  const [
    loading,
    setLoading
  ] =
    useState(
      false
    );

  useEffect(
    () => {

      async function checkRole() {

        const {
          data: {
            user
          }
        } =
          await supabase
            .auth
            .getUser();

        if (
          !user
        ) {

          setShow(
            false
          );

          return;

        }

        const {
          data
        } =
          await supabase
            .from(
              'profiles'
            )
            .select(
              'role'
            )
            .eq(
              'id',
              user.id
            )
            .maybeSingle();

        setShow(
          data?.role ===
            'professionista'
        );

      }

      void checkRole();

      const {
        data
      } =
        supabase
          .auth
          .onAuthStateChange(
            () => {

              void checkRole();

            }
          );

      return () => {

        data
          .subscription
          .unsubscribe();

      };

    },
    []
  );

  async function activateNotifications() {

    setLoading(
      true
    );

    setStatus(
      ''
    );

    try {

      if (
        !(
          'serviceWorker'
          in navigator
        )
        ||
        !(
          'PushManager'
          in window
        )
      ) {

        throw new Error(
          'Notifiche push non supportate su questo dispositivo.'
        );

      }

      const {
        data: {
          user
        }
      } =
        await supabase
          .auth
          .getUser();

      if (
        !user
      ) {

        throw new Error(
          'Devi essere autenticato.'
        );

      }

      const publicKey =
        (
          process.env
            .NEXT_PUBLIC_VAPID_PUBLIC_KEY
          ??
          ''
        )
          .trim()
          .replace(
            /^["']|["']$/g,
            ''
          );

      if (
        !publicKey
      ) {

        throw new Error(
          'Chiave VAPID pubblica mancante.'
        );

      }

      const permission =
        await Notification
          .requestPermission();

      if (
        permission !==
          'granted'
      ) {

        throw new Error(
          'Autorizzazione notifiche non concessa.'
        );

      }

      const registration =
        await navigator
          .serviceWorker
          .register(
            '/sw.js'
          );

      await navigator
        .serviceWorker
        .ready;

      let subscription =
        await registration
          .pushManager
          .getSubscription();

      if (
        !subscription
      ) {

        subscription =
          await registration
            .pushManager
            .subscribe(
              {

                userVisibleOnly:
                  true,

                applicationServerKey:
                  urlBase64ToUint8Array(
                    publicKey
                  )

              }
            );

      }

      const json =
        subscription
          .toJSON();

      if (
        !json.endpoint
        ||
        !json.keys?.p256dh
        ||
        !json.keys?.auth
      ) {

        throw new Error(
          'Sottoscrizione push incompleta.'
        );

      }

      const {
        error
      } =
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

      if (
        error
      ) {

        throw error;

      }

      setStatus(
        '✅ Notifiche attivate.'
      );

    } catch (
      error:
        any
    ) {

      setStatus(
        `❌ ${
          error?.message
          ??
          'Errore attivazione notifiche.'
        }`
      );

    } finally {

      setLoading(
        false
      );

    }

  }

  if (
    !show
  ) {

    return null;

  }

  return (

    <div className="push-card">

      <div className="row between">

        <b>
          🔔 Notifiche nuovi lavori
        </b>

        <span className="small muted">
          MVP 1.0
        </span>

      </div>

      <button
        className="full"
        style={{
          width:
            '100%',

          marginTop:
            10
        }}
        disabled={
          loading
        }
        onClick={
          activateNotifications
        }
      >

        {
          loading
            ? 'Attivazione...'
            : 'Attiva notifiche'
        }

      </button>

      {
        status
        &&
        (
          <div
            className="small"
            style={{
              marginTop:
                8
            }}
          >
            {status}
          </div>
        )
      }

    </div>

  );

}
