'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

type PendingProfessional = {
  professional_id: string;
  business_name: string | null;
  phone: string | null;
  vat_number: string | null;
  tax_code: string | null;
  verification_status: string | null;
  verified: boolean;
  full_name: string | null;
};

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const [professionals, setProfessionals] =
    useState<PendingProfessional[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [message, setMessage] = useState('');

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    setLoading(true);
    setMessage('');

    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();

    setUser(currentUser);

    if (!currentUser) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc(
      'is_current_user_admin'
    );

    if (error) {
      setMessage(
        `Errore controllo amministratore: ${error.message}`
      );
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const admin = data === true;

    setIsAdmin(admin);

    if (admin) {
      await loadProfessionals();
    }

    setLoading(false);
  }

  async function loadProfessionals() {
    const { data, error } = await supabase.rpc(
      'admin_professionals_pending'
    );

    if (error) {
      setMessage(
        `Errore caricamento professionisti: ${error.message}`
      );

      setProfessionals([]);
      return;
    }

    setProfessionals(
      (data ?? []) as PendingProfessional[]
    );
  }

  async function changeVerification(
    professionalId: string,
    status: 'verificato' | 'rifiutato'
  ) {
    const text =
      status === 'verificato'
        ? 'approvare'
        : 'rifiutare';

    const confirmed = window.confirm(
      `Confermi di voler ${text} questo professionista?`
    );

    if (!confirmed) return;

    setActionLoading(professionalId);
    setMessage('');

    const { data, error } = await supabase.rpc(
      'admin_set_professional_verification',
      {
        p_professional_id: professionalId,
        p_status: status
      }
    );

    if (error) {
      setMessage(`Errore: ${error.message}`);
      setActionLoading(null);
      return;
    }

    if (data === false) {
      setMessage(
        'Non è stato possibile aggiornare il professionista.'
      );

      setActionLoading(null);
      return;
    }

    setMessage(
      status === 'verificato'
        ? '✅ Professionista verificato.'
        : '❌ Professionista rifiutato.'
    );

    await loadProfessionals();

    setActionLoading(null);
  }

  async function logout() {
    await supabase.auth.signOut();

    window.location.href = '/';
  }

  if (loading) {
    return (
      <main>
        <div
          style={{
            maxWidth: 850,
            margin: '0 auto',
            padding: '60px 20px'
          }}
        >
          <h2>Caricamento pannello amministratore...</h2>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main>
        <div
          style={{
            maxWidth: 700,
            margin: '0 auto',
            padding: '60px 20px'
          }}
        >
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: 18,
              padding: 30
            }}
          >
            <div
              style={{
                fontSize: 50
              }}
            >
              🔐
            </div>

            <h1>Accesso richiesto</h1>

            <p>
              Devi prima accedere a LavoroSubito con
              l'account amministratore.
            </p>

            <a
              href="/"
              style={{
                display: 'inline-block',
                marginTop: 20,
                background: '#111',
                color: '#fff',
                padding: '14px 22px',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: 700
              }}
            >
              Torna a LavoroSubito
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main>
        <div
          style={{
            maxWidth: 700,
            margin: '0 auto',
            padding: '60px 20px'
          }}
        >
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: 18,
              padding: 30
            }}
          >
            <div
              style={{
                fontSize: 50
              }}
            >
              ⛔
            </div>

            <h1>Accesso negato</h1>

            <p>
              Questo account non dispone dei permessi
              amministratore.
            </p>

            <a
              href="/"
              style={{
                display: 'inline-block',
                marginTop: 20,
                background: '#111',
                color: '#fff',
                padding: '14px 22px',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: 700
              }}
            >
              Torna alla home
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f7f7f7'
      }}
    >
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #e7e7e7',
          padding: '18px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 15
        }}
      >
        <div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 900
            }}
          >
            LavoroSubito
          </div>

          <small>V25 · Amministrazione</small>
        </div>

        <button
          type="button"
          onClick={logout}
          style={{
            background: '#fff',
            border: '1px solid #111',
            borderRadius: 10,
            padding: '10px 16px',
            fontWeight: 700
          }}
        >
          Esci
        </button>
      </header>

      <section
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '40px 20px 80px'
        }}
      >
        <div
          style={{
            marginBottom: 35
          }}
        >
          <div
            style={{
              display: 'inline-block',
              background: '#111',
              color: '#fff',
              borderRadius: 999,
              padding: '7px 12px',
              fontSize: 12,
              fontWeight: 800
            }}
          >
            🛡 AMMINISTRATORE
          </div>

          <h1
            style={{
              fontSize: 36,
              marginBottom: 8
            }}
          >
            Verifica professionisti
          </h1>

          <p>
            Approva o rifiuta i professionisti che hanno
            inviato i propri dati.
          </p>

          <p>
            Accesso: <b>{user.email}</b>
          </p>
        </div>

        {message && (
          <div
            style={{
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 12,
              padding: 15,
              marginBottom: 20,
              fontWeight: 700
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 15,
            marginBottom: 20
          }}
        >
          <div>
            <h2
              style={{
                margin: 0
              }}
            >
              Da verificare
            </h2>

            <p
              style={{
                marginBottom: 0
              }}
            >
              {professionals.length}{' '}
              {professionals.length === 1
                ? 'professionista'
                : 'professionisti'}
            </p>
          </div>

          <button
            type="button"
            onClick={loadProfessionals}
            style={{
              background: '#fff',
              border: '1px solid #111',
              padding: '11px 16px',
              borderRadius: 10,
              fontWeight: 700
            }}
          >
            ↻ Aggiorna
          </button>
        </div>

        {professionals.length === 0 && (
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e2e2',
              borderRadius: 18,
              padding: 30,
              textAlign: 'center'
            }}
          >
            <div
              style={{
                fontSize: 45
              }}
            >
              ✅
            </div>

            <h2>Nessuna verifica in attesa</h2>

            <p>
              Al momento non ci sono professionisti da
              controllare.
            </p>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gap: 20
          }}
        >
          {professionals.map(pro => (
            <article
              key={pro.professional_id}
              style={{
                background: '#fff',
                border: '1px solid #e1e1e1',
                borderRadius: 18,
                padding: 25
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '6px 10px',
                  borderRadius: 999,
                  background: '#fff3cd',
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 15
                }}
              >
                🟡 DA VERIFICARE
              </div>

              <h2
                style={{
                  marginTop: 0
                }}
              >
                {pro.business_name ||
                  pro.full_name ||
                  'Professionista'}
              </h2>

              {pro.full_name && (
                <p>
                  <b>Nome:</b> {pro.full_name}
                </p>
              )}

              <p>
                <b>Nome attività:</b>{' '}
                {pro.business_name || 'Non inserito'}
              </p>

              <p>
                <b>Telefono:</b>{' '}
                {pro.phone || 'Non inserito'}
              </p>

              <p>
                <b>Partita IVA:</b>{' '}
                {pro.vat_number || 'Non inserita'}
              </p>

              <p>
                <b>Codice fiscale:</b>{' '}
                {pro.tax_code || 'Non inserito'}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginTop: 25
                }}
              >
                <button
                  type="button"
                  disabled={
                    actionLoading ===
                    pro.professional_id
                  }
                  onClick={() =>
                    changeVerification(
                      pro.professional_id,
                      'verificato'
                    )
                  }
                  style={{
                    border: 'none',
                    background: '#16864b',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '14px 10px',
                    fontWeight: 800,
                    fontSize: 15
                  }}
                >
                  ✅ Approva
                </button>

                <button
                  type="button"
                  disabled={
                    actionLoading ===
                    pro.professional_id
                  }
                  onClick={() =>
                    changeVerification(
                      pro.professional_id,
                      'rifiutato'
                    )
                  }
                  style={{
                    border: 'none',
                    background: '#b52b27',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '14px 10px',
                    fontWeight: 800,
                    fontSize: 15
                  }}
                >
                  ❌ Rifiuta
                </button>
              </div>

              {actionLoading ===
                pro.professional_id && (
                <p
                  style={{
                    marginTop: 15,
                    fontWeight: 700
                  }}
                >
                  Aggiornamento...
                </p>
              )}
            </article>
          ))}
        </div>

        <div
          style={{
            marginTop: 40
          }}
        >
          <a
            href="/"
            style={{
              color: '#111',
              fontWeight: 700
            }}
          >
            ← Torna a LavoroSubito
          </a>
        </div>
      </section>
    </main>
  );
}
