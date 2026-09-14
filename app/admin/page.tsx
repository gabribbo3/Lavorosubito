'use client';

import {
  useEffect,
  useMemo,
  useState
} from 'react';

import type { User } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase';

type Tab =
  | 'dashboard'
  | 'utenti'
  | 'professionisti'
  | 'lavori';

type DashboardStats = {
  total_users: number;
  total_clients: number;
  total_professionals: number;
  pending_professionals: number;
  verified_professionals: number;
  total_jobs: number;
  open_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  jobs_today: number;
};

type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
};

type AdminClientJob = {
  id: string;
  category_name: string | null;
  urgency: string | null;
  description: string | null;
  address: string | null;
  status: string | null;
  created_at: string;
  professional_id: string | null;
  professional_name: string | null;
  professional_phone: string | null;
};

type AdminProfessional = {
  id: string;
  email: string | null;
  full_name: string | null;
  business_name: string | null;
  description: string | null;
  phone: string | null;
  vat_number: string | null;
  tax_code: string | null;
  verification_status: string | null;
  verified: boolean;
  rating: number | string | null;
  reviews_count: number | null;
  response_time_minutes: number | null;
  reliability_score: number | string | null;
  max_distance_km: number | null;
  latitude: number | null;
  longitude: number | null;
  availability_status: string | null;
  availability_updated_at: string | null;
  categories: string | null;
  created_at: string;
};

type AdminJob = {
  id: string;

  client_id: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;

  category_id: string | null;
  category_name: string | null;

  urgency: string | null;
  description: string | null;
  address: string | null;
  status: string | null;
  created_at: string;

  professional_id: string | null;
  professional_name: string | null;
  professional_email: string | null;
  professional_phone: string | null;
};

const emptyStats: DashboardStats = {
  total_users: 0,
  total_clients: 0,
  total_professionals: 0,
  pending_professionals: 0,
  verified_professionals: 0,
  total_jobs: 0,
  open_jobs: 0,
  active_jobs: 0,
  completed_jobs: 0,
  jobs_today: 0
};

function formatDate(
  value?: string | null
) {
  if (!value) {
    return '—';
  }

  return new Date(
    value
  ).toLocaleString(
    'it-IT',
    {
      dateStyle: 'short',
      timeStyle: 'short'
    }
  );
}

function verificationLabel(
  status?: string | null
) {
  if (status === 'verificato') {
    return '✅ Verificato';
  }

  if (status === 'rifiutato') {
    return '❌ Rifiutato';
  }

  return '🟡 Da verificare';
}

function availabilityLabel(
  status?: string | null
) {
  if (status === 'ora') {
    return '🟢 Disponibile ora';
  }

  if (status === '1-2h') {
    return '🟡 Entro 1–2 ore';
  }

  if (status === 'oggi') {
    return '🟠 Disponibile oggi';
  }

  if (status === 'offline') {
    return '⚫ Offline';
  }

  return status || '—';
}

function jobStatusLabel(
  status?: string | null
) {
  if (status === 'aperta') {
    return '🔴 Aperta';
  }

  if (status === 'abbinata') {
    return '🟡 Abbinata';
  }

  if (status === 'accettata') {
    return '🟢 Accettata';
  }

  if (status === 'in_corso') {
    return '🔵 In corso';
  }

  if (status === 'completata') {
    return '✅ Completata';
  }

  if (status === 'annullata') {
    return '⚫ Annullata';
  }

  return status || '—';
}

function StatCard({
  title,
  value,
  icon
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e4e4e4',
        borderRadius: 16,
        padding: 20
      }}
    >
      <div
        style={{
          fontSize: 28,
          marginBottom: 8
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: 30,
          fontWeight: 900
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: '#666',
          fontWeight: 700,
          marginTop: 4
        }}
      >
        {title}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [user, setUser] =
    useState<User | null>(
      null
    );

  const [
    isAdmin,
    setIsAdmin
  ] =
    useState<boolean | null>(
      null
    );

  const [tab, setTab] =
    useState<Tab>(
      'dashboard'
    );

  const [stats, setStats] =
    useState<DashboardStats>(
      emptyStats
    );

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [
    professionals,
    setProfessionals
  ] =
    useState<
      AdminProfessional[]
    >([]);

  const [jobs, setJobs] =
    useState<AdminJob[]>([]);

  const [
    selectedUserId,
    setSelectedUserId
  ] =
    useState<string | null>(
      null
    );

  const [
    clientJobs,
    setClientJobs
  ] =
    useState<
      Record<
        string,
        AdminClientJob[]
      >
    >({});

  const [
    loadingClientJobs,
    setLoadingClientJobs
  ] =
    useState<string | null>(
      null
    );

  const [
    selectedProfessionalId,
    setSelectedProfessionalId
  ] =
    useState<string | null>(
      null
    );

  const [
    selectedJobId,
    setSelectedJobId
  ] =
    useState<string | null>(
      null
    );

  const [search, setSearch] =
    useState('');

  const [
    loading,
    setLoading
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing
  ] =
    useState(false);

  const [
    actionLoading,
    setActionLoading
  ] =
    useState<string | null>(
      null
    );

  const [
    deletingUser,
    setDeletingUser
  ] =
    useState<string | null>(
      null
    );

  const [
    message,
    setMessage
  ] =
    useState('');

  const [
    lastUpdate,
    setLastUpdate
  ] =
    useState<Date | null>(
      null
    );

  useEffect(() => {
    void checkAccess();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          void loadAll(true);
        },
        30000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [isAdmin]);

  async function checkAccess() {
    setLoading(true);
    setMessage('');

    const {
      data: {
        user: currentUser
      }
    } =
      await supabase.auth
        .getUser();

    setUser(
      currentUser
    );

    if (!currentUser) {
      setIsAdmin(false);
      setLoading(false);

      return;
    }

    const {
      data,
      error
    } =
      await supabase.rpc(
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

    const admin =
      data === true;

    setIsAdmin(
      admin
    );

    if (admin) {
      await loadAll();
    }

    setLoading(false);
  }

  async function loadAll(
    silent = false
  ) {
    if (!silent) {
      setRefreshing(true);
    }

    const [
      statsResponse,
      usersResponse,
      professionalsResponse,
      jobsResponse
    ] =
      await Promise.all([
        supabase.rpc(
          'admin_dashboard_stats'
        ),

        supabase.rpc(
          'admin_users_list'
        ),

        supabase.rpc(
          'admin_professionals_list'
        ),

        supabase.rpc(
          'admin_jobs_list'
        )
      ]);

    let newMessage = '';

    if (
      statsResponse.error
    ) {
      newMessage =
        `Errore dashboard: ${statsResponse.error.message}`;
    } else {
      const row =
        Array.isArray(
          statsResponse.data
        )
          ? statsResponse
              .data[0]
          : statsResponse
              .data;

      if (row) {
        setStats(
          row as DashboardStats
        );
      }
    }

    if (
      usersResponse.error
    ) {
      newMessage =
        `Errore utenti: ${usersResponse.error.message}`;
    } else {
      setUsers(
        (
          usersResponse.data ??
          []
        ) as AdminUser[]
      );
    }

    if (
      professionalsResponse.error
    ) {
      newMessage =
        `Errore professionisti: ${professionalsResponse.error.message}`;
    } else {
      setProfessionals(
        (
          professionalsResponse.data ??
          []
        ) as AdminProfessional[]
      );
    }

    if (
      jobsResponse.error
    ) {
      newMessage =
        `Errore lavori: ${jobsResponse.error.message}`;
    } else {
      setJobs(
        (
          jobsResponse.data ??
          []
        ) as AdminJob[]
      );
    }

    if (newMessage) {
      setMessage(
        newMessage
      );
    }

    if (!newMessage) {
      setLastUpdate(
        new Date()
      );
    }

    if (!silent) {
      setRefreshing(false);
    }
  }

  async function openUserDetails(
    userId: string
  ) {
    if (
      selectedUserId === userId
    ) {
      setSelectedUserId(null);
      return;
    }

    setSelectedUserId(
      userId
    );

    setLoadingClientJobs(
      userId
    );

    setMessage('');

    const {
      data,
      error
    } =
      await supabase.rpc(
        'admin_client_jobs',
        {
          p_client_id:
            userId
        }
      );

    if (error) {
      setMessage(
        `Errore caricamento storico cliente: ${error.message}`
      );

      setLoadingClientJobs(
        null
      );

      return;
    }

    setClientJobs(
      current => ({
        ...current,

        [userId]:
          (
            data ??
            []
          ) as AdminClientJob[]
      })
    );

    setLoadingClientJobs(
      null
    );
  }

  async function changeVerification(
    professionalId: string,
    status:
      | 'verificato'
      | 'rifiutato'
  ) {
    const action =
      status ===
      'verificato'
        ? 'approvare'
        : 'rifiutare';

    const confirmed =
      window.confirm(
        `Confermi di voler ${action} questo professionista?`
      );

    if (!confirmed) {
      return;
    }

    setActionLoading(
      professionalId
    );

    setMessage('');

    const {
      data,
      error
    } =
      await supabase.rpc(
        'admin_set_professional_verification',
        {
          p_professional_id:
            professionalId,

          p_status:
            status
        }
      );

    if (error) {
      setMessage(
        `Errore: ${error.message}`
      );

      setActionLoading(
        null
      );

      return;
    }

    if (data === false) {
      setMessage(
        'Non è stato possibile aggiornare il professionista.'
      );

      setActionLoading(
        null
      );

      return;
    }

    setMessage(
      status ===
      'verificato'
        ? '✅ Professionista verificato.'
        : '❌ Professionista rifiutato.'
    );

    await loadAll();

    setActionLoading(
      null
    );
  }

  async function deleteAccount(
    userId: string,
    label: string,
    isAdministrator = false
  ) {
    if (
      isAdministrator ||
      userId === user?.id
    ) {
      setMessage(
        '⛔ Non è possibile eliminare un account amministratore.'
      );

      return;
    }

    const firstConfirmation =
      window.confirm(
        `Vuoi davvero eliminare l'account di ${label}?\n\nQuesta operazione è definitiva.`
      );

    if (
      !firstConfirmation
    ) {
      return;
    }

    const secondConfirmation =
      window.confirm(
        `ATTENZIONE\n\nConfermi definitivamente l'eliminazione di ${label}?\n\nL'account e i dati collegati verranno rimossi.`
      );

    if (
      !secondConfirmation
    ) {
      return;
    }

    setDeletingUser(
      userId
    );

    setMessage('');

    try {
      const {
        data:
          sessionData,
        error:
          sessionError
      } =
        await supabase.auth
          .getSession();

      const accessToken =
        sessionData
          .session
          ?.access_token;

      if (
        sessionError ||
        !accessToken
      ) {
        setMessage(
          'Errore: sessione amministratore non valida.'
        );

        setDeletingUser(
          null
        );

        return;
      }

      const response =
        await fetch(
          '/api/admin/delete-user',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${accessToken}`
            },

            body:
              JSON.stringify({
                userId
              })
          }
        );

      let result: {
        ok?: boolean;
        error?: string;
      } = {};

      try {
        result =
          await response.json();
      } catch {
        result = {};
      }

      if (
        !response.ok ||
        result.ok !== true
      ) {
        setMessage(
          `Errore eliminazione: ${
            result.error ||
            'operazione non riuscita.'
          }`
        );

        setDeletingUser(
          null
        );

        return;
      }

      setMessage(
        `✅ Account di ${label} eliminato definitivamente.`
      );

      setSearch('');

      if (
        selectedUserId ===
        userId
      ) {
        setSelectedUserId(
          null
        );
      }

      if (
        selectedProfessionalId ===
        userId
      ) {
        setSelectedProfessionalId(
          null
        );
      }

      await loadAll();
    } catch {
      setMessage(
        'Errore durante l’eliminazione dell’account.'
      );
    }

    setDeletingUser(
      null
    );
  }

  async function logout() {
    await supabase.auth
      .signOut();

    window.location.href =
      '/';
  }

  const filteredUsers =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) {
        return users;
      }

      return users.filter(
        row =>
          String(
            row.full_name ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.email ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.phone ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.role ??
            ''
          )
            .toLowerCase()
            .includes(q)
      );
    }, [
      users,
      search
    ]);

  const filteredProfessionals =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) {
        return professionals;
      }

      return professionals.filter(
        row =>
          String(
            row.business_name ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.full_name ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.email ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.phone ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.categories ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.verification_status ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.availability_status ??
            ''
          )
            .toLowerCase()
            .includes(q)
      );
    }, [
      professionals,
      search
    ]);

  const filteredJobs =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) {
        return jobs;
      }

      return jobs.filter(
        row =>
          String(
            row.client_name ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.client_email ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.client_phone ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.professional_name ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.professional_email ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.professional_phone ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.category_name ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.description ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.address ??
            ''
          )
            .toLowerCase()
            .includes(q) ||

          String(
            row.status ??
            ''
          )
            .toLowerCase()
            .includes(q)
      );
    }, [
      jobs,
      search
    ]);

  if (loading) {
    return (
      <main>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '60px 20px'
          }}
        >
          <h2>
            Caricamento pannello amministratore...
          </h2>
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
          <h1>
            🔐 Accesso richiesto
          </h1>

          <p>
            Devi accedere con
            l&apos;account amministratore.
          </p>

          <a href="/">
            Torna a LavoroSubito
          </a>
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
          <h1>
            ⛔ Accesso negato
          </h1>

          <p>
            Questo account non dispone
            dei permessi amministratore.
          </p>

          <a href="/">
            Torna alla home
          </a>
        </div>
      </main>
    );
  }

  const buttonStyle = (
    active: boolean
  ) => ({
    border:
      active
        ? '1px solid #111'
        : '1px solid #ddd',

    background:
      active
        ? '#111'
        : '#fff',

    color:
      active
        ? '#fff'
        : '#111',

    borderRadius: 10,
    padding: '11px 16px',
    fontWeight: 800,
    cursor: 'pointer'
  });

  const deleteButtonStyle = {
    width: '100%',
    marginTop: 18,
    background: '#fff',
    color: '#b42318',
    border:
      '1px solid #b42318',
    borderRadius: 10,
    padding: '13px 12px',
    fontWeight: 800,
    cursor: 'pointer'
  };

  const detailBoxStyle = {
    background:
      '#f8f8f8',
    border:
      '1px solid #e2e2e2',
    borderRadius: 12,
    padding: 16
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f5f5'
      }}
    >
      <header
        style={{
          background: '#fff',
          borderBottom:
            '1px solid #e5e5e5',
          padding: '18px 20px'
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: 15
          }}
        >
          <div>
            <div
              style={{
                fontSize: 25,
                fontWeight: 900
              }}
            >
              LavoroSubito
            </div>

            <small>
              Pannello amministratore
            </small>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10
            }}
          >
            <a
              href="/"
              style={{
                border:
                  '1px solid #111',
                borderRadius: 10,
                padding:
                  '10px 14px',
                color: '#111',
                textDecoration:
                  'none',
                fontWeight: 700
              }}
            >
              Sito
            </a>

            <button
              type="button"
              onClick={logout}
              style={{
                background: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding:
                  '10px 14px',
                fontWeight: 700
              }}
            >
              Esci
            </button>
          </div>
        </div>
      </header>

      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding:
            '30px 18px 80px'
        }}
      >
        <div
          style={{
            marginBottom: 25
          }}
        >
          <div
            style={{
              display:
                'inline-block',
              background: '#111',
              color: '#fff',
              padding: '7px 12px',
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 12
            }}
          >
            🛡 AMMINISTRATORE
          </div>

          <h1
            style={{
              fontSize: 34,
              marginBottom: 6
            }}
          >
            Centro di controllo
          </h1>

          <div
            style={{
              color: '#666'
            }}
          >
            {user.email}
          </div>

          <div
            style={{
              marginTop: 8,
              color: '#777',
              fontSize: 13
            }}
          >
            🔄 Aggiornamento automatico ogni 30 secondi
            {lastUpdate && (
              <>
                {' '}• ultimo aggiornamento{' '}
                {lastUpdate.toLocaleTimeString(
                  'it-IT',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  }
                )}
              </>
            )}
          </div>
        </div>

        {message && (
          <div
            style={{
              background: '#fff',
              border:
                '1px solid #ddd',
              padding: 14,
              borderRadius: 12,
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
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 25
          }}
        >
          <button
            type="button"
            style={buttonStyle(
              tab === 'dashboard'
            )}
            onClick={() =>
              setTab('dashboard')
            }
          >
            📊 Dashboard
          </button>

          <button
            type="button"
            style={buttonStyle(
              tab === 'utenti'
            )}
            onClick={() =>
              setTab('utenti')
            }
          >
            👥 Utenti
          </button>

          <button
            type="button"
            style={buttonStyle(
              tab === 'professionisti'
            )}
            onClick={() =>
              setTab('professionisti')
            }
          >
            🛠 Professionisti
          </button>

          <button
            type="button"
            style={buttonStyle(
              tab === 'lavori'
            )}
            onClick={() =>
              setTab('lavori')
            }
          >
            📋 Lavori
          </button>

          <button
            type="button"
            onClick={() =>
              void loadAll()
            }
            disabled={refreshing}
            style={{
              marginLeft: 'auto',
              background: '#fff',
              border:
                '1px solid #111',
              borderRadius: 10,
              padding:
                '11px 16px',
              fontWeight: 800
            }}
          >
            {refreshing
              ? 'Aggiornamento...'
              : '↻ Aggiorna'}
          </button>
        </div>

        {tab !== 'dashboard' && (
          <div
            style={{
              marginBottom: 22
            }}
          >
            <input
              value={search}
              onChange={e =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Cerca..."
              style={{
                width: '100%',
                boxSizing:
                  'border-box',
                padding:
                  '14px 16px',
                borderRadius: 12,
                border:
                  '1px solid #ccc',
                fontSize: 16
              }}
            />
          </div>
        )}

        {tab === 'dashboard' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 15
            }}
          >
            <StatCard
              title="Utenti"
              value={
                stats.total_users
              }
              icon="👥"
            />

            <StatCard
              title="Clienti"
              value={
                stats.total_clients
              }
              icon="👤"
            />

            <StatCard
              title="Professionisti"
              value={
                stats.total_professionals
              }
              icon="🛠"
            />

            <StatCard
              title="Da verificare"
              value={
                stats.pending_professionals
              }
              icon="🟡"
            />

            <StatCard
              title="Verificati"
              value={
                stats.verified_professionals
              }
              icon="✅"
            />

            <StatCard
              title="Lavori totali"
              value={
                stats.total_jobs
              }
              icon="📋"
            />

            <StatCard
              title="Richieste aperte"
              value={
                stats.open_jobs
              }
              icon="🔴"
            />

            <StatCard
              title="Lavori attivi"
              value={
                stats.active_jobs
              }
              icon="⚡"
            />

            <StatCard
              title="Completati"
              value={
                stats.completed_jobs
              }
              icon="🏁"
            />

            <StatCard
              title="Creati oggi"
              value={
                stats.jobs_today
              }
              icon="📅"
            />
          </div>
        )}

        {tab === 'utenti' && (
          <div
            style={{
              display: 'grid',
              gap: 14
            }}
          >
            <h2>
              Utenti ({filteredUsers.length})
            </h2>

            {filteredUsers.map(
              row => {
                const opened =
                  selectedUserId ===
                  row.id;

                const history =
                  clientJobs[
                    row.id
                  ] ?? [];

                return (
                  <article
                    key={row.id}
                    style={{
                      background:
                        '#fff',

                      border:
                        opened
                          ? '2px solid #111'
                          : '1px solid #ddd',

                      borderRadius:
                        16,

                      padding:
                        20
                    }}
                  >
                    <h3
                      style={{
                        marginTop:
                          0
                      }}
                    >
                      {row.full_name ||
                        'Utente'}
                    </h3>

                    <p>
                      <b>Email:</b>{' '}
                      {row.email ||
                        '—'}
                    </p>

                    <p>
                      <b>Ruolo:</b>{' '}
                      {row.role ||
                        '—'}
                    </p>

                    <p>
                      <b>Telefono:</b>{' '}
                      {row.phone ||
                        '—'}
                    </p>

                    <p>
                      <b>Registrato:</b>{' '}
                      {formatDate(
                        row.created_at
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void openUserDetails(
                          row.id
                        )
                      }
                      style={{
                        width:
                          '100%',
                        marginTop:
                          12,
                        background:
                          opened
                            ? '#fff'
                            : '#111',
                        color:
                          opened
                            ? '#111'
                            : '#fff',
                        border:
                          '1px solid #111',
                        borderRadius:
                          10,
                        padding:
                          '13px 12px',
                        fontWeight:
                          900,
                        cursor:
                          'pointer'
                      }}
                    >
                      {opened
                        ? '▲ Chiudi scheda'
                        : '▼ Apri scheda'}
                    </button>

                    {opened && (
                      <div
                        style={{
                          display:
                            'grid',
                          gap:
                            15,
                          marginTop:
                            18
                        }}
                      >
                        <div
                          style={
                            detailBoxStyle
                          }
                        >
                          <h3
                            style={{
                              marginTop:
                                0
                            }}
                          >
                            👤 Dati cliente
                          </h3>

                          <p>
                            <b>Nome:</b>{' '}
                            {row.full_name ||
                              '—'}
                          </p>

                          <p>
                            <b>Email:</b>{' '}
                            {row.email ||
                              '—'}
                          </p>

                          <p>
                            <b>Telefono:</b>{' '}
                            {row.phone ||
                              '—'}
                          </p>

                          <p>
                            <b>Ruolo:</b>{' '}
                            {row.role ||
                              '—'}
                          </p>

                          <p>
                            <b>Registrato:</b>{' '}
                            {formatDate(
                              row.created_at
                            )}
                          </p>

                          <small>
                            ID utente:{' '}
                            {row.id}
                          </small>
                        </div>

                        <div
                          style={
                            detailBoxStyle
                          }
                        >
                          <h3
                            style={{
                              marginTop:
                                0
                            }}
                          >
                            📋 Storico richieste
                          </h3>

                          {loadingClientJobs ===
                          row.id ? (
                            <p>
                              Caricamento storico...
                            </p>
                          ) : history.length ===
                            0 ? (
                            <p
                              style={{
                                color:
                                  '#666'
                              }}
                            >
                              Nessuna richiesta trovata.
                            </p>
                          ) : (
                            <div
                              style={{
                                display:
                                  'grid',
                                gap:
                                  12
                              }}
                            >
                              {history.map(
                                job => (
                                  <div
                                    key={
                                      job.id
                                    }
                                    style={{
                                      border:
                                        '1px solid #ddd',
                                      borderRadius:
                                        12,
                                      padding:
                                        14,
                                      background:
                                        '#fff'
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontWeight:
                                          900,
                                        marginBottom:
                                          8
                                      }}
                                    >
                                      {jobStatusLabel(
                                        job.status
                                      )}
                                    </div>

                                    <p>
                                      <b>Categoria:</b>{' '}
                                      {job.category_name ||
                                        '—'}
                                    </p>

                                    <p>
                                      <b>Urgenza:</b>{' '}
                                      {job.urgency
                                        ?.toUpperCase() ||
                                        '—'}
                                    </p>

                                    <p>
                                      <b>Descrizione:</b>{' '}
                                      {job.description ||
                                        '—'}
                                    </p>

                                    <p>
                                      <b>Indirizzo:</b>{' '}
                                      {job.address ||
                                        '—'}
                                    </p>

                                    <p>
                                      <b>Data:</b>{' '}
                                      {formatDate(
                                        job.created_at
                                      )}
                                    </p>

                                    {job.professional_id ? (
                                      <div
                                        style={{
                                          marginTop:
                                            12,
                                          padding:
                                            12,
                                          background:
                                            '#f5f5f5',
                                          borderRadius:
                                            10
                                        }}
                                      >
                                        <b>
                                          🛠 Professionista assegnato
                                        </b>

                                        <p>
                                          {job.professional_name ||
                                            '—'}
                                        </p>

                                        <p
                                          style={{
                                            marginBottom:
                                              0
                                          }}
                                        >
                                          ☎️{' '}
                                          {job.professional_phone ||
                                            '—'}
                                        </p>
                                      </div>
                                    ) : (
                                      <p
                                        style={{
                                          color:
                                            '#777'
                                        }}
                                      >
                                        Nessun professionista assegnato.
                                      </p>
                                    )}

                                    <small>
                                      ID lavoro:{' '}
                                      {job.id}
                                    </small>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        {row.is_admin ? (
                          <div
                            style={{
                              fontWeight:
                                800
                            }}
                          >
                            🛡 Amministratore protetto
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={
                              deletingUser ===
                              row.id
                            }
                            onClick={() =>
                              deleteAccount(
                                row.id,

                                row.full_name ||
                                  row.email ||
                                  'questo utente',

                                row.is_admin
                              )
                            }
                            style={
                              deleteButtonStyle
                            }
                          >
                            {deletingUser ===
                            row.id
                              ? 'Eliminazione...'
                              : '🗑 Elimina account'}
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              }
            )}
          </div>
        )}

        {tab ===
          'professionisti' && (
          <div
            style={{
              display: 'grid',
              gap: 15
            }}
          >
            <h2>
              Professionisti ({filteredProfessionals.length})
            </h2>

            {filteredProfessionals.map(
              pro => {
                const opened =
                  selectedProfessionalId ===
                  pro.id;

                return (
                  <article
                    key={pro.id}
                    style={{
                      background:
                        '#fff',
                      border:
                        opened
                          ? '2px solid #111'
                          : '1px solid #ddd',
                      borderRadius: 16,
                      padding: 20
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        gap: 15,
                        alignItems:
                          'flex-start',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 800,
                            marginBottom: 8
                          }}
                        >
                          {verificationLabel(
                            pro.verification_status
                          )}
                        </div>

                        <h3
                          style={{
                            margin: 0
                          }}
                        >
                          {pro.business_name ||
                            pro.full_name ||
                            'Professionista'}
                        </h3>

                        <div
                          style={{
                            color: '#666',
                            marginTop: 8
                          }}
                        >
                          {pro.categories ||
                            'Nessuna categoria'}
                        </div>
                      </div>

                      <div
                        style={{
                          background:
                            '#f2f2f2',
                          padding:
                            '8px 12px',
                          borderRadius:
                            999,
                          fontWeight: 800
                        }}
                      >
                        {availabilityLabel(
                          pro.availability_status
                        )}
                      </div>
                    </div>

                    <p>
                      <b>Email:</b>{' '}
                      {pro.email || '—'}
                    </p>

                    <p>
                      <b>Telefono:</b>{' '}
                      {pro.phone || '—'}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedProfessionalId(
                          opened
                            ? null
                            : pro.id
                        )
                      }
                      style={{
                        width: '100%',
                        marginTop: 12,
                        background:
                          opened
                            ? '#fff'
                            : '#111',
                        color:
                          opened
                            ? '#111'
                            : '#fff',
                        border:
                          '1px solid #111',
                        borderRadius: 10,
                        padding:
                          '13px 12px',
                        fontWeight: 900,
                        cursor: 'pointer'
                      }}
                    >
                      {opened
                        ? '▲ Chiudi scheda'
                        : '▼ Apri scheda'}
                    </button>

                    {opened && (
                      <div
                        style={{
                          display: 'grid',
                          gap: 15,
                          marginTop: 18
                        }}
                      >
                        <div
                          style={
                            detailBoxStyle
                          }
                        >
                          <h3
                            style={{
                              marginTop: 0
                            }}
                          >
                            👤 Dati professionista
                          </h3>

                          <p>
                            <b>Nome:</b>{' '}
                            {pro.full_name ||
                              '—'}
                          </p>

                          <p>
                            <b>Attività:</b>{' '}
                            {pro.business_name ||
                              '—'}
                          </p>

                          <p>
                            <b>Email:</b>{' '}
                            {pro.email ||
                              '—'}
                          </p>

                          <p>
                            <b>Telefono:</b>{' '}
                            {pro.phone ||
                              '—'}
                          </p>

                          <p>
                            <b>Partita IVA:</b>{' '}
                            {pro.vat_number ||
                              '—'}
                          </p>

                          <p>
                            <b>Codice fiscale:</b>{' '}
                            {pro.tax_code ||
                              '—'}
                          </p>

                          <p>
                            <b>Registrato:</b>{' '}
                            {formatDate(
                              pro.created_at
                            )}
                          </p>

                          <small>
                            ID professionista:{' '}
                            {pro.id}
                          </small>
                        </div>

                        <div
                          style={
                            detailBoxStyle
                          }
                        >
                          <h3
                            style={{
                              marginTop: 0
                            }}
                          >
                            📝 Profilo professionale
                          </h3>

                          <p>
                            <b>Categorie:</b>{' '}
                            {pro.categories ||
                              '—'}
                          </p>

                          <p>
                            <b>Descrizione:</b>
                          </p>

                          <div
                            style={{
                              whiteSpace:
                                'pre-wrap',
                              lineHeight: 1.5
                            }}
                          >
                            {pro.description ||
                              '—'}
                          </div>

                          <p>
                            <b>Raggio operativo:</b>{' '}
                            {pro.max_distance_km ??
                              '—'}{' '}
                            km
                          </p>

                          <p>
                            <b>Latitudine:</b>{' '}
                            {pro.latitude ??
                              '—'}
                          </p>

                          <p>
                            <b>Longitudine:</b>{' '}
                            {pro.longitude ??
                              '—'}
                          </p>
                        </div>

                        <div
                          style={
                            detailBoxStyle
                          }
                        >
                          <h3
                            style={{
                              marginTop: 0
                            }}
                          >
                            ⚡ Disponibilità
                          </h3>

                          <p>
                            <b>Stato:</b>{' '}
                            {availabilityLabel(
                              pro.availability_status
                            )}
                          </p>

                          <p>
                            <b>Ultimo aggiornamento:</b>{' '}
                            {formatDate(
                              pro.availability_updated_at
                            )}
                          </p>

                          <p>
                            <b>Tempo medio risposta:</b>{' '}
                            {pro.response_time_minutes != null
                              ? `${pro.response_time_minutes} min`
                              : '—'}
                          </p>
                        </div>

                        <div
                          style={
                            detailBoxStyle
                          }
                        >
                          <h3
                            style={{
                              marginTop: 0
                            }}
                          >
                            ⭐ Prestazioni
                          </h3>

                          <p>
                            <b>Valutazione:</b>{' '}
                            {pro.rating ??
                              '—'}
                          </p>

                          <p>
                            <b>Numero recensioni:</b>{' '}
                            {pro.reviews_count ??
                              0}
                          </p>

                          <p>
                            <b>Indice affidabilità:</b>{' '}
                            {pro.reliability_score ??
                              '—'}
                          </p>
                        </div>

                        <div
                          style={
                            detailBoxStyle
                          }
                        >
                          <h3
                            style={{
                              marginTop: 0
                            }}
                          >
                            🛡 Verifica
                          </h3>

                          <p>
                            <b>Stato verifica:</b>{' '}
                            {verificationLabel(
                              pro.verification_status
                            )}
                          </p>

                          <p>
                            <b>Flag verificato:</b>{' '}
                            {pro.verified
                              ? 'Sì'
                              : 'No'}
                          </p>

                          {pro.verification_status ===
                            'da_verificare' && (
                            <div
                              style={{
                                display:
                                  'grid',
                                gridTemplateColumns:
                                  '1fr 1fr',
                                gap: 10,
                                marginTop: 18
                              }}
                            >
                              <button
                                type="button"
                                disabled={
                                  actionLoading ===
                                  pro.id
                                }
                                onClick={() =>
                                  changeVerification(
                                    pro.id,
                                    'verificato'
                                  )
                                }
                                style={{
                                  background:
                                    '#16864b',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius:
                                    10,
                                  padding:
                                    '13px 10px',
                                  fontWeight:
                                    800
                                }}
                              >
                                ✅ Approva
                              </button>

                              <button
                                type="button"
                                disabled={
                                  actionLoading ===
                                  pro.id
                                }
                                onClick={() =>
                                  changeVerification(
                                    pro.id,
                                    'rifiutato'
                                  )
                                }
                                style={{
                                  background:
                                    '#b52b27',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius:
                                    10,
                                  padding:
                                    '13px 10px',
                                  fontWeight:
                                    800
                                }}
                              >
                                ❌ Rifiuta
                              </button>
                            </div>
                          )}
                        </div>

                        {pro.id ===
                        user.id ? (
                          <div
                            style={{
                              fontWeight: 800
                            }}
                          >
                            🛡 Account amministratore protetto
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={
                              deletingUser ===
                              pro.id
                            }
                            onClick={() =>
                              deleteAccount(
                                pro.id,
                                pro.business_name ||
                                  pro.full_name ||
                                  pro.email ||
                                  'questo professionista'
                              )
                            }
                            style={
                              deleteButtonStyle
                            }
                          >
                            {deletingUser ===
                            pro.id
                              ? 'Eliminazione...'
                              : '🗑 Elimina professionista'}
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              }
            )}
          </div>
        )}

        {tab === 'lavori' && (
          <div
            style={{
              display: 'grid',
              gap: 14
            }}
          >
            <h2>
              Lavori ({filteredJobs.length})
            </h2>

            {filteredJobs.map(
              job => {
                const opened =
                  selectedJobId ===
                  job.id;

                return (
                  <article
                    key={job.id}
                    style={{
                      background:
                        '#fff',
                      border:
                        opened
                          ? '2px solid #111'
                          : '1px solid #ddd',
                      borderRadius: 16,
                      padding: 20
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        gap: 15,
                        alignItems:
                          'flex-start',
                        flexWrap:
                          'wrap'
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight:
                              900,
                            marginBottom:
                              10
                          }}
                        >
                          {jobStatusLabel(
                            job.status
                          )}
                        </div>

                        <h3
                          style={{
                            margin: 0
                          }}
                        >
                          {job.category_name ||
                            'Categoria'}
                        </h3>
                      </div>

                      <div
                        style={{
                          fontWeight:
                            900,
                          background:
                            '#f0f0f0',
                          padding:
                            '8px 12px',
                          borderRadius:
                            999
                        }}
                      >
                        {job.urgency
                          ?.toUpperCase() ||
                          '—'}
                      </div>
                    </div>

                    <p>
                      <b>Cliente:</b>{' '}
                      {job.client_name ||
                        '—'}
                    </p>

                    <p>
                      {job.description ||
                        '—'}
                    </p>

                    <p
                      style={{
                        color:
                          '#666'
                      }}
                    >
                      📍{' '}
                      {job.address ||
                        'Indirizzo non disponibile'}
                    </p>

                    <p
                      style={{
                        color:
                          '#666'
                      }}
                    >
                      📅{' '}
                      {formatDate(
                        job.created_at
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedJobId(
                          opened
                            ? null
                            : job.id
                        )
                      }
                      style={{
                        width:
                          '100%',
                        marginTop:
                          12,
                        background:
                          opened
                            ? '#fff'
                            : '#111',
                        color:
                          opened
                            ? '#111'
                            : '#fff',
                        border:
                          '1px solid #111',
                        borderRadius:
                          10,
                        padding:
                          '13px 12px',
                        fontWeight:
                          900,
                        cursor:
                          'pointer'
                      }}
                    >
                      {opened
                        ? '▲ Chiudi scheda'
                        : '▼ Apri scheda'}
                    </button>

                    {opened && (
                      <div
                        style={{
                          display:
                            'grid',
                          gap: 15,
                          marginTop:
                            18
                        }}
                      >
                        <div
                          style={
                            detailBoxStyle
                          }
                        >
                          <h3
                            style={{
                              marginTop:
                                0
                            }}
                          >
                            👤 Cliente
                          </h3>

                          <p>
                            <b>Nome:</b>{' '}
                            {job.client_name ||
                              '—'}
                          </p>

                          <p>
                            <b>Email:</b>{' '}
                            {job.client_email ||
                              '—'}
                          </p>

                          <p>
                            <b>Telefono:</b>{' '}
                            {job.client_phone ||
                              '—'}
                          </p>

                          <small>
                            ID cliente:{' '}
                            {job.client_id}
                          </small>
                        </div>

                        <div
                          style={
                            detailBoxStyle
                          }
                        >
                          <h3
                            style={{
                              marginTop:
                                0
                            }}
                          >
                            🛠 Professionista assegnato
                          </h3>

                          {job.professional_id ? (
                            <>
                              <p>
                                <b>Nome:</b>{' '}
                                {job.professional_name ||
                                  '—'}
                              </p>

                              <p>
                                <b>Email:</b>{' '}
                                {job.professional_email ||
                                  '—'}
                              </p>

                              <p>
                                <b>Telefono:</b>{' '}
                                {job.professional_phone ||
                                  '—'}
                              </p>

                              <small>
                                ID professionista:{' '}
                                {job.professional_id}
                              </small>
                            </>
                          ) : (
                            <p
                              style={{
                                marginBottom:
                                  0,
                                color:
                                  '#666'
                              }}
                            >
                              Nessun professionista ha ancora accettato questo intervento.
                            </p>
                          )}
                        </div>

                        <div
                          style={
                            detailBoxStyle
                          }
                        >
                          <h3
                            style={{
                              marginTop:
                                0
                            }}
                          >
                            📋 Dettagli intervento
                          </h3>

                          <p>
                            <b>Stato:</b>{' '}
                            {jobStatusLabel(
                              job.status
                            )}
                          </p>

                          <p>
                            <b>Categoria:</b>{' '}
                            {job.category_name ||
                              '—'}
                          </p>

                          <p>
                            <b>Urgenza:</b>{' '}
                            {job.urgency
                              ?.toUpperCase() ||
                              '—'}
                          </p>

                          <p>
                            <b>Descrizione:</b>
                          </p>

                          <div
                            style={{
                              whiteSpace:
                                'pre-wrap',
                              lineHeight:
                                1.5
                            }}
                          >
                            {job.description ||
                              '—'}
                          </div>

                          <p>
                            <b>Indirizzo:</b>{' '}
                            {job.address ||
                              '—'}
                          </p>

                          <p>
                            <b>Creato:</b>{' '}
                            {formatDate(
                              job.created_at
                            )}
                          </p>

                          <small>
                            ID lavoro:{' '}
                            {job.id}
                          </small>
                        </div>
                      </div>
                    )}
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </main>
  );
}
