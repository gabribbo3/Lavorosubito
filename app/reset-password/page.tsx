'use client';

import {
  FormEvent,
  useEffect,
  useState
} from 'react';

import { supabase } from '../../lib/supabase';

export default function ResetPasswordPage() {
  const [
    password,
    setPassword
  ] =
    useState('');

  const [
    confirmPassword,
    setConfirmPassword
  ] =
    useState('');

  const [
    message,
    setMessage
  ] =
    useState('');

  const [
    busy,
    setBusy
  ] =
    useState(false);

  const [
    ready,
    setReady
  ] =
    useState(false);

  const [
    completed,
    setCompleted
  ] =
    useState(false);

  useEffect(() => {
    let mounted =
      true;

    supabase.auth
      .getSession()
      .then(
        ({
          data
        }) => {
          if (
            mounted &&
            data.session
          ) {
            setReady(
              true
            );
          }
        }
      );

    const {
      data
    } =
      supabase.auth
        .onAuthStateChange(
          (
            event,
            session
          ) => {
            if (
              !mounted
            ) {
              return;
            }

            if (
              event ===
                'PASSWORD_RECOVERY'
              ||
              !!session
            ) {
              setReady(
                true
              );
            }
          }
        );

    return () => {
      mounted =
        false;

      data.subscription
        .unsubscribe();
    };
  }, []);

  async function submit(
    event:
      FormEvent
  ) {
    event.preventDefault();

    setMessage('');

    if (
      password.length < 8
    ) {
      setMessage(
        'La password deve avere almeno 8 caratteri.'
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setMessage(
        'Le due password non coincidono.'
      );

      return;
    }

    setBusy(
      true
    );

    const {
      error
    } =
      await supabase.auth
        .updateUser({
          password
        });

    setBusy(
      false
    );

    if (
      error
    ) {
      setMessage(
        `Errore: ${error.message}`
      );

      return;
    }

    setCompleted(
      true
    );

    setPassword('');
    setConfirmPassword('');

    setMessage(
      '✅ Password aggiornata con successo.'
    );
  }

  return (
    <main
      style={{
        minHeight:
          '100vh',

        display:
          'grid',

        placeItems:
          'center',

        padding:
          20,

        background:
          '#f7f7f5'
      }}
    >
      <div
        className="card"
        style={{
          width:
            'min(460px, 100%)'
        }}
      >
        <span className="tag">
          LavoroSubito
        </span>

        <h1
          style={{
            fontSize:
              30,

            lineHeight:
              1.1,

            marginBottom:
              8
          }}
        >
          Reimposta password
        </h1>

        <p
          className="muted"
          style={{
            marginBottom:
              20
          }}
        >
          Scegli una nuova password per il tuo account.
        </p>

        {
          message &&
          (
            <div
              className={
                message.startsWith(
                  '✅'
                )
                  ? 'success'
                  : 'notice'
              }
            >
              {
                message
              }
            </div>
          )
        }

        {
          !ready &&
          !completed &&
          (
            <div className="notice">
              🔒 Per modificare la password devi aprire questa pagina dal link ricevuto via email.
            </div>
          )
        }

        {
          ready &&
          !completed &&
          (
            <form
              onSubmit={
                submit
              }
            >
              <label>
                Nuova password
              </label>

              <input
                type="password"
                minLength={
                  8
                }
                required
                autoComplete="new-password"
                value={
                  password
                }
                onChange={
                  e =>
                    setPassword(
                      e.target.value
                    )
                }
                placeholder="Almeno 8 caratteri"
              />

              <label>
                Conferma nuova password
              </label>

              <input
                type="password"
                minLength={
                  8
                }
                required
                autoComplete="new-password"
                value={
                  confirmPassword
                }
                onChange={
                  e =>
                    setConfirmPassword(
                      e.target.value
                    )
                }
                placeholder="Ripeti la nuova password"
              />

              <button
                className="full"
                disabled={
                  busy
                }
                style={{
                  width:
                    '100%',

                  marginTop:
                    16
                }}
              >
                {
                  busy
                    ? 'Aggiornamento...'
                    : 'Aggiorna password'
                }
              </button>
            </form>
          )
        }

        {
          completed &&
          (
            <a
              href="/"
              className="full"
              style={{
                display:
                  'block',

                textAlign:
                  'center',

                marginTop:
                  16,

                textDecoration:
                  'none'
              }}
            >
              Torna a LavoroSubito →
            </a>
          )
        }

        {
          !completed &&
          (
            <a
              href="/"
              style={{
                display:
                  'block',

                textAlign:
                  'center',

                marginTop:
                  18,

                color:
                  '#2474d2',

                fontWeight:
                  700
              }}
            >
              ← Torna a LavoroSubito
            </a>
          )
        }
      </div>
    </main>
  );
}
