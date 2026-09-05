'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const cats = [
  'Idraulico',
  'Elettricista',
  'Fabbro',
  'Caldaia',
  'Climatizzatore',
  'Serramenti',
  'Meccanico',
  'Altro'
];

const icons = ['🔧', '⚡', '🔑', '🔥', '❄️', '🪟', '🚗', '🏠'];

const slug = (v: string) =>
  v.toLowerCase().replaceAll(' ', '-');

type AppRole = 'cliente' | 'professionista';

type Job = {
  id: string;
  description: string;
  urgency: string;
  status: string;
  created_at?: string;
  categories?: {
    name?: string;
  } | null;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  const [role, setRole] = useState<AppRole>('cliente');
  const [profileRole, setProfileRole] = useState<AppRole | null>(null);
  const [fullName, setFullName] = useState('');

  const [cat, setCat] = useState('');
  const [urg, setUrg] = useState('SUBITO');
  const [description, setDescription] = useState('');

  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [online, setOnline] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);

      if (data.user) {
        loadProfile(data.user.id);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;

      setUser(currentUser);

      if (currentUser) {
        loadProfile(currentUser.id);
      } else {
        setProfileRole(null);
        setFullName('');
        setJobs([]);
        setOnline(false);
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', userId)
      .single();

    if (error || !data) {
      setProfileRole('cliente');
      return;
    }

    const detectedRole: AppRole =
      data.role === 'professionista'
        ? 'professionista'
        : 'cliente';

    setProfileRole(detectedRole);
    setFullName(data.full_name ?? '');

    if (detectedRole === 'professionista') {
      await loadAvailability(userId);
      await loadJobs();
    }
  }

  async function loadAvailability(userId: string) {
    const { data } = await supabase
      .from('availability')
      .select('status')
      .eq('professional_id', userId)
      .maybeSingle();

    setOnline(data?.status === 'ora');
  }

  async function loadJobs() {
    setJobsLoading(true);

    const { data, error } = await supabase
      .from('jobs')
      .select(`
        id,
        description,
        urgency,
        status,
        created_at,
        categories (
          name
        )
      `)
      .eq('status', 'aperta')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(`Errore caricamento richieste: ${error.message}`);
      setJobs([]);
    } else {
      setJobs((data ?? []) as unknown as Job[]);
    }

    setJobsLoading(false);
  }

  async function acceptJob(jobId: string) {
    if (!user) {
      setMessage('Devi essere autenticato.');
      return;
    }

    setBusy(true);
    setMessage('');

    const { data, error } = await supabase.rpc('accept_job', {
      p_job_id: jobId
    });

    if (error) {
      setMessage(`Errore accettazione: ${error.message}`);
      setBusy(false);
      return;
    }

    if (data === false) {
      setMessage(
        'Questo lavoro è già stato accettato da un altro professionista.'
      );

      await loadJobs();
      setBusy(false);
      return;
    }

    setMessage('✓ Lavoro accettato correttamente.');

    await loadJobs();

    setBusy(false);
  }

  async function authSubmit(e: FormEvent) {
    e.preventDefault();

    setBusy(true);
    setMessage('');

    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role
          }
        }
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          'Registrazione completata. Controlla la tua email per confermare l’account.'
        );
      }
    } else {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Accesso effettuato.');
        setAuthOpen(false);

        if (data.user) {
          await loadProfile(data.user.id);
        }
      }
    }

    setBusy(false);
  }

  async function submitJob() {
    if (!cat || !description.trim()) {
      setMessage('Scegli una categoria e descrivi il problema.');
      return;
    }

    if (!user) {
      setRole('cliente');
      setAuthMode('signup');
      setAuthOpen(true);
      setMessage('Registrati o accedi per inviare la richiesta.');
      return;
    }

    setBusy(true);
    setMessage('');

    const { data: category, error: categoryError } =
      await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug(cat))
        .single();

    if (categoryError || !category) {
      setMessage('Categoria non trovata.');
      setBusy(false);
      return;
    }

    const { error } = await supabase
      .from('jobs')
      .insert({
        client_id: user.id,
        category_id: category.id,
        urgency: urg.toLowerCase(),
        description: description.trim()
      });

    if (error) {
      setMessage(`Errore: ${error.message}`);
    } else {
      setMessage('✓ Richiesta inviata e salvata nel database.');
      setDescription('');
    }

    setBusy(false);
  }

  async function toggleAvailability() {
    if (!user) return;

    const next = !online;

    setBusy(true);
    setMessage('');

    const { error } = await supabase
      .from('availability')
      .upsert({
        professional_id: user.id,
        status: next ? 'ora' : 'offline',
        updated_at: new Date().toISOString()
      });

    if (error) {
      setMessage(`Errore disponibilità: ${error.message}`);
    } else {
      setOnline(next);

      setMessage(
        next
          ? '🟢 Ora risulti disponibile.'
          : '⚫ Ora risulti offline.'
      );
    }

    setBusy(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setMessage('');
  }

  if (user && profileRole === 'professionista') {
    return (
      <main>
        <header>
          <div className="logo">
            <b>L</b> Lavoro<span>Subito</span>
          </div>

          <button className="outline" onClick={logout}>
            Esci
          </button>
        </header>

        <section
          className="section"
          style={{
            paddingTop: 70,
            minHeight: '75vh'
          }}
        >
          <label className="tag">AREA PROFESSIONISTA</label>

          <h2>Ciao {fullName || 'Professionista'}.</h2>

          <p>
            Gestisci la tua disponibilità e visualizza le richieste urgenti.
          </p>

          <div
            className="proPanel"
            style={{ marginTop: 30 }}
          >
            <div>
              <div className="avatar">PRO</div>

              <h3>{fullName || user.email}</h3>

              <p>{user.email}</p>
            </div>

            <div className="switchLine">
              <span>Disponibilità</span>

              <button
                className={online ? 'switch on' : 'switch'}
                onClick={toggleAvailability}
                disabled={busy}
              >
                <span />
              </button>

              <b>
                {online
                  ? '🟢 Disponibile ora'
                  : '⚫ Offline'}
              </b>
            </div>
          </div>

          {message && (
            <div
              className="success"
              style={{ marginTop: 20 }}
            >
              {message}
            </div>
          )}

          <div
            style={{
              marginTop: 50,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 15
            }}
          >
            <div>
              <label className="tag">RICHIESTE LIVE</label>

              <h2>Lavori disponibili</h2>
            </div>

            <button
              className="outline"
              onClick={loadJobs}
              disabled={jobsLoading}
            >
              ↻ Aggiorna
            </button>
          </div>

          {jobsLoading && (
            <p>Caricamento richieste...</p>
          )}

          {!jobsLoading && jobs.length === 0 && (
            <div
              className="card"
              style={{
                marginTop: 20,
                maxWidth: '100%'
              }}
            >
              <h3>Nessuna richiesta disponibile</h3>

              <p>
                Quando arriveranno nuove richieste aperte compariranno qui.
              </p>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gap: 18,
              marginTop: 20
            }}
          >
            {jobs.map(job => (
              <article
                key={job.id}
                className="card"
                style={{
                  maxWidth: '100%'
                }}
              >
                <div className="live">
                  ● RICHIESTA APERTA
                </div>

                <h3>
                  {job.categories?.name ?? 'Intervento'}
                </h3>

                <p>{job.description}</p>

                <p>
                  <b>Urgenza:</b>{' '}
                  {job.urgency.toUpperCase()}
                </p>

                <button
                  className="full"
                  disabled={busy || !online}
                  onClick={() => acceptJob(job.id)}
                >
                  {busy
                    ? 'Attendi...'
                    : online
                      ? 'Accetta lavoro →'
                      : 'Vai online per accettare'}
                </button>
              </article>
            ))}
          </div>
        </section>

        <footer>
          <div className="logo">
            <b>L</b> Lavoro<span>Subito</span>
          </div>

          <small>
            © 2026 LavoroSubito · V3
          </small>
        </footer>
      </main>
    );
  }

  return (
    <main>
      <header>
        <div className="logo">
          <b>L</b> Lavoro<span>Subito</span>
        </div>

        <nav>
          <a href="#come">Come funziona</a>

          <a href="#professionisti">Professionisti</a>

          {user ? (
            <button
              className="outline"
              onClick={logout}
            >
              Esci
            </button>
          ) : (
            <button
              className="outline"
              onClick={() => {
                setAuthMode('login');
                setAuthOpen(true);
              }}
            >
              Accedi / Registrati
            </button>
          )}
        </nav>
      </header>

      <section className="hero">
        <div>
          <label className="tag">
            ● INTERVENTI URGENTI NELLA TUA ZONA
          </label>

          <h1>
            Un problema?
            <br />
            <span>Risolviamolo subito.</span>
          </h1>

          <p>
            Trova professionisti disponibili vicino a te.
            Una richiesta, un match, un intervento.
          </p>

          <div className="actions">
            <button
              className="primary"
              onClick={() =>
                document
                  .getElementById('richiesta')
                  ?.scrollIntoView()
              }
            >
              🚨 Trova un professionista
            </button>

            <button
              className="outline"
              onClick={() => {
                setRole('professionista');
                setAuthMode('signup');
                setAuthOpen(true);
              }}
            >
              Registrati come professionista →
            </button>
          </div>

          <div className="checks">
            ✓ Disponibilità in tempo reale　✓ Profili verificati　✓ Recensioni
          </div>
        </div>

        <div
          id="richiesta"
          className="card"
        >
          <div className="live">
            ● LIVE REQUEST
          </div>

          <h2>Di cosa hai bisogno?</h2>

          <p>
            Scegli il servizio e indica l'urgenza.
          </p>

          <div className="grid">
            {cats.map((c, i) => (
              <button
                key={c}
                className={
                  cat === c
                    ? 'cat selected'
                    : 'cat'
                }
                onClick={() => setCat(c)}
              >
                <strong>{icons[i]}</strong>
                {c}
              </button>
            ))}
          </div>

          <div className="urg">
            {['SUBITO', 'OGGI', '48H'].map(u => (
              <button
                key={u}
                className={
                  urg === u
                    ? 'selUrg'
                    : ''
                }
                onClick={() => setUrg(u)}
              >
                {u}
              </button>
            ))}
          </div>

          <input
            value={description}
            onChange={e =>
              setDescription(e.target.value)
            }
            placeholder="Descrivi brevemente il problema..."
          />

          <button
            className="full"
            disabled={busy}
            onClick={submitJob}
          >
            {busy
              ? 'Invio...'
              : 'Trova chi è disponibile →'}
          </button>

          {message && (
            <div className="success">
              {message}
            </div>
          )}
        </div>
      </section>

      <section className="stats">
        <div>
          <b>30 sec</b>
          <small>per creare una richiesta</small>
        </div>

        <div>
          <b>🟢 LIVE</b>
          <small>disponibilità professionisti</small>
        </div>

        <div>
          <b>V3</b>
          <small>cliente + professionista</small>
        </div>
      </section>

      <section
        id="come"
        className="section"
      >
        <label className="tag">
          COME FUNZIONA
        </label>

        <h2>
          Dal problema alla soluzione.
        </h2>

        <div className="steps">
          <article>
            <i>01</i>
            <h3>Descrivi</h3>
            <p>
              Scegli il servizio e racconta cosa è successo.
            </p>
          </article>

          <article>
            <i>02</i>
            <h3>Trova</h3>
            <p>
              Il sistema cerca professionisti compatibili e disponibili.
            </p>
          </article>

          <article>
            <i>03</i>
            <h3>Risolvi</h3>
            <p>
              Il professionista accetta e interviene.
            </p>
          </article>
        </div>
      </section>

      <section
        id="professionisti"
        className="proSection"
      >
        <div className="section">
          <label className="tag light">
            PER I PROFESSIONISTI
          </label>

          <h2>
            Sei disponibile?{' '}
            <span>Fatti trovare.</span>
          </h2>

          <p>
            Crea un profilo professionista, imposta la disponibilità e ricevi richieste urgenti.
          </p>

          {!user && (
            <button
              className="primary"
              onClick={() => {
                setRole('professionista');
                setAuthMode('signup');
                setAuthOpen(true);
              }}
            >
              Registrati come professionista →
            </button>
          )}
        </div>
      </section>

      <footer>
        <div className="logo">
          <b>L</b> Lavoro<span>Subito</span>
        </div>

        <small>
          © 2026 LavoroSubito · V3
        </small>
      </footer>

      {authOpen && (
        <div className="modal">
          <form
            className="modalBox"
            onSubmit={authSubmit}
          >
            <button
              type="button"
              className="x"
              onClick={() =>
                setAuthOpen(false)
              }
            >
              ×
            </button>

            <label className="tag">
              {authMode === 'signup'
                ? 'REGISTRAZIONE'
                : 'ACCESSO'}
            </label>

            <h2>
              {authMode === 'signup'
                ? 'Entra in LavoroSubito'
                : 'Bentornato'}
            </h2>

            {authMode === 'signup' && (
              <>
                <input
                  required
                  placeholder="Nome e cognome"
                  value={name}
                  onChange={e =>
                    setName(e.target.value)
                  }
                />

                <select
                  value={role}
                  onChange={e =>
                    setRole(
                      e.target.value as AppRole
                    )
                  }
                >
                  <option value="cliente">
                    Cliente
                  </option>

                  <option value="professionista">
                    Professionista
                  </option>
                </select>
              </>
            )}

            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={e =>
                setEmail(e.target.value)
              }
            />

            <input
              required
              minLength={6}
              type="password"
              placeholder="Password"
              value={password}
              onChange={e =>
                setPassword(e.target.value)
              }
            />

            <button
              className="full"
              disabled={busy}
            >
              {busy
                ? 'Attendi...'
                : authMode === 'signup'
                  ? 'Crea account'
                  : 'Accedi'}
            </button>

            <button
              type="button"
              className="outline"
              onClick={() =>
                setAuthMode(
                  authMode === 'signup'
                    ? 'login'
                    : 'signup'
                )
              }
            >
              {authMode === 'signup'
                ? 'Hai già un account? Accedi'
                : 'Non hai un account? Registrati'}
            </button>

            {message && (
              <small>{message}</small>
            )}
          </form>
        </div>
      )}
    </main>
  );
}
