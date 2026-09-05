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
  categories?: { name?: string } | null;
};

type AcceptedJob = {
  id: string;
  description: string;
  urgency: string;
  status: string;
  created_at?: string;
  category_name?: string | null;
};

type ClientJob = {
  id: string;
  description: string;
  urgency: string;
  status: string;
  created_at?: string;
  category_name?: string | null;
  professional_name?: string | null;
};

type ChatMessage = {
  id: string;
  job_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type ProfessionalReview = {
  review_id: string;
  rating: number;
  comment?: string | null;
  created_at?: string;
  client_name?: string | null;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>('cliente');
  const [profileRole, setProfileRole] =
    useState<AppRole | null>(null);

  const [fullName, setFullName] = useState('');

  const [cat, setCat] = useState('');
  const [urg, setUrg] = useState('SUBITO');
  const [description, setDescription] = useState('');

  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] =
    useState<'login' | 'signup'>('signup');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [online, setOnline] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const [acceptedJobs, setAcceptedJobs] =
    useState<AcceptedJob[]>([]);
  const [acceptedLoading, setAcceptedLoading] =
    useState(false);

  const [clientJobs, setClientJobs] =
    useState<ClientJob[]>([]);
  const [clientJobsLoading, setClientJobsLoading] =
    useState(false);

  const [chatJobId, setChatJobId] =
    useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState('');
  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);

  const [reviewJobId, setReviewJobId] =
    useState<string | null>(null);
  const [
    reviewProfessionalName,
    setReviewProfessionalName
  ] = useState('');

  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] =
    useState('');
  const [reviewSending, setReviewSending] =
    useState(false);

  const [
    professionalReviews,
    setProfessionalReviews
  ] = useState<ProfessionalReview[]>([]);

  const [
    reviewsLoading,
    setReviewsLoading
  ] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);

      if (data.user) {
        loadProfile(data.user.id);
      }
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;

        setUser(currentUser);

        if (currentUser) {
          loadProfile(currentUser.id);
        } else {
          setProfileRole(null);
          setFullName('');
          setJobs([]);
          setAcceptedJobs([]);
          setClientJobs([]);
          setProfessionalReviews([]);
          setOnline(false);
          setChatJobId(null);
          setChatMessages([]);
          setReviewJobId(null);
        }
      }
    );

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
      await loadClientJobs();
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
      await loadAcceptedJobs();
      await loadProfessionalReviews();
    } else {
      await loadClientJobs();
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
        categories (name)
      `)
      .eq('status', 'aperta')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(
        `Errore caricamento richieste: ${error.message}`
      );
      setJobs([]);
    } else {
      setJobs((data ?? []) as unknown as Job[]);
    }

    setJobsLoading(false);
  }

  async function loadAcceptedJobs() {
    setAcceptedLoading(true);

    const { data, error } =
      await supabase.rpc('my_accepted_jobs');

    if (error) {
      setMessage(
        `Errore lavori accettati: ${error.message}`
      );
      setAcceptedJobs([]);
    } else {
      setAcceptedJobs(
        (data ?? []) as AcceptedJob[]
      );
    }

    setAcceptedLoading(false);
  }

  async function loadClientJobs() {
    setClientJobsLoading(true);

    const { data, error } =
      await supabase.rpc('my_client_jobs');

    if (error) {
      setMessage(
        `Errore richieste cliente: ${error.message}`
      );
      setClientJobs([]);
    } else {
      setClientJobs(
        (data ?? []) as ClientJob[]
      );
    }

    setClientJobsLoading(false);
  }

  async function loadProfessionalReviews() {
    setReviewsLoading(true);

    const { data, error } =
      await supabase.rpc(
        'my_professional_reviews'
      );

    if (error) {
      setMessage(
        `Errore recensioni: ${error.message}`
      );
      setProfessionalReviews([]);
    } else {
      setProfessionalReviews(
        (data ?? []) as ProfessionalReview[]
      );
    }

    setReviewsLoading(false);
  }

  async function acceptJob(jobId: string) {
    if (!user) return;

    setBusy(true);
    setMessage('');

    const { data, error } =
      await supabase.rpc('accept_job', {
        p_job_id: jobId
      });

    if (error) {
      setMessage(
        `Errore accettazione: ${error.message}`
      );
    } else if (data === false) {
      setMessage(
        'Questo lavoro è già stato accettato da un altro professionista.'
      );
    } else {
      setMessage(
        '✓ Lavoro accettato correttamente.'
      );
    }

    await loadJobs();
    await loadAcceptedJobs();

    setBusy(false);
  }

  async function completeJob(jobId: string) {
    if (!user) return;

    const confirmComplete =
      window.confirm(
        'Confermi che l’intervento è stato completato?'
      );

    if (!confirmComplete) return;

    setBusy(true);
    setMessage('');

    const { data, error } =
      await supabase.rpc('complete_job', {
        p_job_id: jobId
      });

    if (error) {
      setMessage(
        `Errore completamento intervento: ${error.message}`
      );

      setBusy(false);
      return;
    }

    if (data === false) {
      setMessage(
        'Non è stato possibile completare questo intervento.'
      );

      setBusy(false);
      return;
    }

    setMessage(
      '✓ Intervento completato.'
    );

    if (
      profileRole === 'professionista'
    ) {
      await loadAcceptedJobs();
    } else {
      await loadClientJobs();
    }

    setBusy(false);
  }

  async function openChat(
    jobId: string,
    title: string
  ) {
    setChatJobId(jobId);
    setChatTitle(title);
    setChatText('');
    setChatMessages([]);

    await loadChat(jobId);
  }

  async function loadChat(jobId: string) {
    setChatLoading(true);

    const { data, error } =
      await supabase
        .from('messages')
        .select(
          'id, job_id, sender_id, message, created_at'
        )
        .eq('job_id', jobId)
        .order('created_at', {
          ascending: true
        });

    if (error) {
      setMessage(
        `Errore chat: ${error.message}`
      );
    } else {
      setChatMessages(
        (data ?? []) as ChatMessage[]
      );
    }

    setChatLoading(false);
  }

  async function sendChatMessage(
    e: FormEvent
  ) {
    e.preventDefault();

    if (
      !user ||
      !chatJobId ||
      !chatText.trim()
    ) {
      return;
    }

    setChatSending(true);

    const { error } = await supabase
      .from('messages')
      .insert({
        job_id: chatJobId,
        sender_id: user.id,
        message: chatText.trim()
      });

    if (error) {
      setMessage(
        `Errore invio messaggio: ${error.message}`
      );
    } else {
      setChatText('');
      await loadChat(chatJobId);
    }

    setChatSending(false);
  }

  function closeChat() {
    setChatJobId(null);
    setChatTitle('');
    setChatMessages([]);
    setChatText('');
  }

  function openReview(
    jobId: string,
    professionalName: string
  ) {
    setReviewJobId(jobId);
    setReviewProfessionalName(
      professionalName
    );
    setRating(5);
    setReviewComment('');
  }

  function closeReview() {
    setReviewJobId(null);
    setReviewProfessionalName('');
    setRating(5);
    setReviewComment('');
  }

  async function submitReview(
    e: FormEvent
  ) {
    e.preventDefault();

    if (!reviewJobId) return;

    setReviewSending(true);
    setMessage('');

    const { data, error } =
      await supabase.rpc(
        'create_review',
        {
          p_job_id: reviewJobId,
          p_rating: rating,
          p_comment:
            reviewComment.trim() || null
        }
      );

    if (error) {
      if (
        error.message
          .toLowerCase()
          .includes('già recensito')
      ) {
        setMessage(
          'Hai già recensito questo intervento.'
        );
      } else {
        setMessage(
          `Errore recensione: ${error.message}`
        );
      }

      setReviewSending(false);
      return;
    }

    if (data === false) {
      setMessage(
        'Non è possibile recensire questo intervento.'
      );

      setReviewSending(false);
      return;
    }

    setMessage(
      '⭐ Recensione inviata correttamente.'
    );

    closeReview();
    setReviewSending(false);
  }

  async function authSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    setBusy(true);
    setMessage('');

    if (authMode === 'signup') {
      const { error } =
        await supabase.auth.signUp({
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
        setAuthOpen(false);

        if (data.user) {
          await loadProfile(
            data.user.id
          );
        }
      }
    }

    setBusy(false);
  }

  async function submitJob() {
    if (
      !cat ||
      !description.trim()
    ) {
      setMessage(
        'Scegli una categoria e descrivi il problema.'
      );

      return;
    }

    if (!user) {
      setRole('cliente');
      setAuthMode('signup');
      setAuthOpen(true);

      setMessage(
        'Registrati o accedi per inviare la richiesta.'
      );

      return;
    }

    setBusy(true);
    setMessage('');

    const {
      data: category,
      error: categoryError
    } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug(cat))
      .single();

    if (
      categoryError ||
      !category
    ) {
      setMessage(
        'Categoria non trovata.'
      );

      setBusy(false);
      return;
    }

    const { error } =
      await supabase
        .from('jobs')
        .insert({
          client_id: user.id,
          category_id:
            category.id,
          urgency:
            urg.toLowerCase(),
          description:
            description.trim()
        });

    if (error) {
      setMessage(
        `Errore: ${error.message}`
      );
    } else {
      setMessage(
        '✓ Richiesta inviata.'
      );

      setDescription('');
      await loadClientJobs();
    }

    setBusy(false);
  }

  async function toggleAvailability() {
    if (!user) return;

    const next = !online;

    setBusy(true);
    setMessage('');

    const { error } =
      await supabase
        .from('availability')
        .upsert({
          professional_id:
            user.id,
          status:
            next
              ? 'ora'
              : 'offline',
          updated_at:
            new Date().toISOString()
        });

    if (error) {
      setMessage(
        `Errore disponibilità: ${error.message}`
      );
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

  const averageRating =
    professionalReviews.length > 0
      ? professionalReviews.reduce(
          (sum, review) =>
            sum + Number(review.rating),
          0
        ) /
        professionalReviews.length
      : 0;

  const ChatModal = () =>
    chatJobId ? (
      <div className="modal">
        <div className="modalBox">
          <button
            type="button"
            className="x"
            onClick={closeChat}
          >
            ×
          </button>

          <label className="tag">
            CHAT INTERVENTO
          </label>

          <h2>
            {chatTitle ||
              'Intervento'}
          </h2>

          <div
            style={{
              maxHeight: 330,
              overflowY: 'auto',
              marginTop: 20,
              marginBottom: 20,
              display: 'grid',
              gap: 10
            }}
          >
            {chatLoading && (
              <p>
                Caricamento
                messaggi...
              </p>
            )}

            {!chatLoading &&
              chatMessages.length ===
                0 && (
                <div className="card">
                  <p>
                    Nessun messaggio.
                    Inizia la
                    conversazione.
                  </p>
                </div>
              )}

            {chatMessages.map(
              m => {
                const mine =
                  m.sender_id ===
                  user?.id;

                return (
                  <div
                    key={m.id}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border:
                        '1px solid #ddd',
                      marginLeft:
                        mine
                          ? 35
                          : 0,
                      marginRight:
                        mine
                          ? 0
                          : 35
                    }}
                  >
                    <b>
                      {mine
                        ? 'Tu'
                        : 'Interlocutore'}
                    </b>

                    <p
                      style={{
                        margin:
                          '5px 0'
                      }}
                    >
                      {m.message}
                    </p>

                    <small>
                      {new Date(
                        m.created_at
                      ).toLocaleString(
                        'it-IT'
                      )}
                    </small>
                  </div>
                );
              }
            )}
          </div>

          <form
            onSubmit={
              sendChatMessage
            }
          >
            <input
              value={chatText}
              onChange={e =>
                setChatText(
                  e.target.value
                )
              }
              placeholder="Scrivi un messaggio..."
              maxLength={1000}
            />

            <button
              className="full"
              disabled={
                chatSending ||
                !chatText.trim()
              }
            >
              {chatSending
                ? 'Invio...'
                : 'Invia messaggio →'}
            </button>
          </form>

          <button
            className="outline"
            style={{
              marginTop: 10
            }}
            onClick={() =>
              loadChat(chatJobId)
            }
            disabled={
              chatLoading
            }
          >
            ↻ Aggiorna chat
          </button>
        </div>
      </div>
    ) : null;

  const ReviewModal = () =>
    reviewJobId ? (
      <div className="modal">
        <form
          className="modalBox"
          onSubmit={
            submitReview
          }
        >
          <button
            type="button"
            className="x"
            onClick={
              closeReview
            }
          >
            ×
          </button>

          <label className="tag">
            RECENSIONE
          </label>

          <h2>
            Come è andato
            l'intervento?
          </h2>

          <p>
            Valuta il lavoro di{' '}
            <b>
              {reviewProfessionalName ||
                'professionista'}
            </b>
            .
          </p>

          <div
            style={{
              display: 'flex',
              gap: 6,
              fontSize: 34,
              margin: '20px 0'
            }}
          >
            {[1, 2, 3, 4, 5].map(
              star => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setRating(
                      star
                    )
                  }
                  style={{
                    border: 'none',
                    background:
                      'transparent',
                    padding: 0,
                    fontSize: 34,
                    cursor:
                      'pointer'
                  }}
                >
                  {star <= rating
                    ? '⭐'
                    : '☆'}
                </button>
              )
            )}
          </div>

          <p>
            <b>{rating} / 5</b>
          </p>

          <textarea
            value={
              reviewComment
            }
            onChange={e =>
              setReviewComment(
                e.target.value
              )
            }
            placeholder="Scrivi un commento sull'intervento..."
            maxLength={1000}
            rows={5}
            style={{
              width: '100%',
              marginTop: 10,
              marginBottom: 15
            }}
          />

          <button
            className="full"
            disabled={
              reviewSending
            }
          >
            {reviewSending
              ? 'Invio recensione...'
              : '⭐ Invia recensione'}
          </button>
        </form>
      </div>
    ) : null;

  if (
    user &&
    profileRole ===
      'professionista'
  ) {
    return (
      <main>
        <header>
          <div className="logo">
            <b>L</b>{' '}
            Lavoro
            <span>Subito</span>
          </div>

          <button
            className="outline"
            onClick={logout}
          >
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
          <label className="tag">
            AREA PROFESSIONISTA
          </label>

          <h2>
            Ciao{' '}
            {fullName ||
              'Professionista'}
            .
          </h2>

          <div
            className="proPanel"
            style={{
              marginTop: 30
            }}
          >
            <div>
              <div className="avatar">
                PRO
              </div>

              <h3>
                {fullName ||
                  user.email}
              </h3>

              <p>
                {user.email}
              </p>

              <div
                style={{
                  marginTop: 15
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700
                  }}
                >
                  ⭐{' '}
                  {professionalReviews.length >
                  0
                    ? averageRating.toFixed(
                        1
                      )
                    : '—'}
                </div>

                <small>
                  {professionalReviews.length ===
                  1
                    ? '1 recensione'
                    : `${professionalReviews.length} recensioni`}
                </small>
              </div>
            </div>

            <div className="switchLine">
              <span>
                Disponibilità
              </span>

              <button
                className={
                  online
                    ? 'switch on'
                    : 'switch'
                }
                onClick={
                  toggleAvailability
                }
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
              style={{
                marginTop: 20
              }}
            >
              {message}
            </div>
          )}

          <div
            style={{
              marginTop: 50
            }}
          >
            <label className="tag">
              RICHIESTE LIVE
            </label>

            <h2>
              Lavori disponibili
            </h2>

            <button
              className="outline"
              onClick={loadJobs}
              disabled={
                jobsLoading
              }
            >
              ↻ Aggiorna
            </button>
          </div>

          {jobsLoading && (
            <p>
              Caricamento
              richieste...
            </p>
          )}

          {!jobsLoading &&
            jobs.length === 0 && (
              <div
                className="card"
                style={{
                  marginTop: 20
                }}
              >
                <h3>
                  Nessuna richiesta
                  disponibile
                </h3>
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
              >
                <div className="live">
                  ● RICHIESTA
                  APERTA
                </div>

                <h3>
                  {job.categories
                    ?.name ??
                    'Intervento'}
                </h3>

                <p>
                  {job.description}
                </p>

                <p>
                  <b>
                    Urgenza:
                  </b>{' '}
                  {job.urgency.toUpperCase()}
                </p>

                <button
                  className="full"
                  disabled={
                    busy ||
                    !online
                  }
                  onClick={() =>
                    acceptJob(
                      job.id
                    )
                  }
                >
                  {online
                    ? 'Accetta lavoro →'
                    : 'Vai online per accettare'}
                </button>
              </article>
            ))}
          </div>

          <div
            style={{
              marginTop: 70
            }}
          >
            <label className="tag">
              I MIEI LAVORI
            </label>

            <h2>
              Lavori accettati
            </h2>
          </div>

          {acceptedLoading && (
            <p>
              Caricamento...
            </p>
          )}

          <div
            style={{
              display: 'grid',
              gap: 18,
              marginTop: 20
            }}
          >
            {acceptedJobs.map(
              job => {
                const completed =
                  job.status ===
                  'completata';

                return (
                  <article
                    key={job.id}
                    className="card"
                  >
                    <div className="live">
                      {completed
                        ? '✅ COMPLETATO'
                        : '🟢 ACCETTATO'}
                    </div>

                    <h3>
                      {job.category_name ??
                        'Intervento'}
                    </h3>

                    <p>
                      {
                        job.description
                      }
                    </p>

                    <p>
                      <b>
                        Urgenza:
                      </b>{' '}
                      {job.urgency.toUpperCase()}
                    </p>

                    <p>
                      <b>
                        Stato:
                      </b>{' '}
                      {completed
                        ? 'Intervento completato'
                        : 'Preso in carico'}
                    </p>

                    <button
                      className="full"
                      onClick={() =>
                        openChat(
                          job.id,
                          job.category_name ??
                            'Intervento'
                        )
                      }
                    >
                      💬 Apri chat
                    </button>

                    {!completed && (
                      <button
                        className="outline"
                        style={{
                          marginTop: 12
                        }}
                        disabled={
                          busy
                        }
                        onClick={() =>
                          completeJob(
                            job.id
                          )
                        }
                      >
                        ✓ Intervento
                        completato
                      </button>
                    )}
                  </article>
                );
              }
            )}
          </div>

          <div
            style={{
              marginTop: 70
            }}
          >
            <label className="tag">
              RECENSIONI
            </label>

            <h2>
              Cosa dicono i
              clienti
            </h2>

            <button
              className="outline"
              onClick={
                loadProfessionalReviews
              }
              disabled={
                reviewsLoading
              }
            >
              ↻ Aggiorna
            </button>
          </div>

          <div
            className="card"
            style={{
              marginTop: 20,
              maxWidth: '100%'
            }}
          >
            <h3>
              ⭐{' '}
              {professionalReviews.length >
              0
                ? averageRating.toFixed(
                    1
                  )
                : 'Nessuna valutazione'}
            </h3>

            <p>
              {professionalReviews.length ===
              1
                ? '1 recensione ricevuta'
                : `${professionalReviews.length} recensioni ricevute`}
            </p>
          </div>

          {reviewsLoading && (
            <p>
              Caricamento
              recensioni...
            </p>
          )}

          {!reviewsLoading &&
            professionalReviews.length ===
              0 && (
              <div
                className="card"
                style={{
                  marginTop: 18,
                  maxWidth:
                    '100%'
                }}
              >
                <h3>
                  Nessuna recensione
                </h3>

                <p>
                  Le recensioni
                  ricevute dopo gli
                  interventi
                  compariranno qui.
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
            {professionalReviews.map(
              review => (
                <article
                  key={
                    review.review_id
                  }
                  className="card"
                  style={{
                    maxWidth:
                      '100%'
                  }}
                >
                  <div
                    style={{
                      fontSize: 20,
                      marginBottom: 10
                    }}
                  >
                    {'⭐'.repeat(
                      Number(
                        review.rating
                      )
                    )}
                  </div>

                  <h3>
                    {review.client_name ||
                      'Cliente LavoroSubito'}
                  </h3>

                  {review.comment ? (
                    <p>
                      “
                      {
                        review.comment
                      }
                      ”
                    </p>
                  ) : (
                    <p>
                      Nessun commento
                      scritto.
                    </p>
                  )}

                  {review.created_at && (
                    <small>
                      {new Date(
                        review.created_at
                      ).toLocaleDateString(
                        'it-IT'
                      )}
                    </small>
                  )}
                </article>
              )
            )}
          </div>
        </section>

        <footer>
          <div className="logo">
            <b>L</b>{' '}
            Lavoro
            <span>Subito</span>
          </div>

          <small>
            © 2026 LavoroSubito
            · V9
          </small>
        </footer>

        <ChatModal />
      </main>
    );
  }

  return (
    <main>
      <header>
        <div className="logo">
          <b>L</b>{' '}
          Lavoro
          <span>Subito</span>
        </div>

        <nav>
          <a href="#come">
            Come funziona
          </a>

          <a href="#professionisti">
            Professionisti
          </a>

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
                setAuthMode(
                  'login'
                );
                setAuthOpen(
                  true
                );
              }}
            >
              Accedi /
              Registrati
            </button>
          )}
        </nav>
      </header>

      <section className="hero">
        <div>
          <label className="tag">
            ● INTERVENTI URGENTI
            NELLA TUA ZONA
          </label>

          <h1>
            Un problema?
            <br />
            <span>
              Risolviamolo
              subito.
            </span>
          </h1>

          <p>
            Trova professionisti
            disponibili vicino a
            te. Una richiesta, un
            match, un intervento.
          </p>

          <div className="actions">
            <button
              className="primary"
              onClick={() =>
                document
                  .getElementById(
                    'richiesta'
                  )
                  ?.scrollIntoView()
              }
            >
              🚨 Trova un
              professionista
            </button>

            <button
              className="outline"
              onClick={() => {
                setRole(
                  'professionista'
                );
                setAuthMode(
                  'signup'
                );
                setAuthOpen(
                  true
                );
              }}
            >
              Registrati come
              professionista →
            </button>
          </div>
        </div>

        <div
          id="richiesta"
          className="card"
        >
          <div className="live">
            ● LIVE REQUEST
          </div>

          <h2>
            Di cosa hai bisogno?
          </h2>

          <div className="grid">
            {cats.map(
              (c, i) => (
                <button
                  key={c}
                  className={
                    cat === c
                      ? 'cat selected'
                      : 'cat'
                  }
                  onClick={() =>
                    setCat(c)
                  }
                >
                  <strong>
                    {icons[i]}
                  </strong>
                  {c}
                </button>
              )
            )}
          </div>

          <div className="urg">
            {[
              'SUBITO',
              'OGGI',
              '48H'
            ].map(u => (
              <button
                key={u}
                className={
                  urg === u
                    ? 'selUrg'
                    : ''
                }
                onClick={() =>
                  setUrg(u)
                }
              >
                {u}
              </button>
            ))}
          </div>

          <input
            value={description}
            onChange={e =>
              setDescription(
                e.target.value
              )
            }
            placeholder="Descrivi brevemente il problema..."
          />

          <button
            className="full"
            disabled={busy}
            onClick={
              submitJob
            }
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

      {user &&
        profileRole ===
          'cliente' && (
          <section className="section">
            <label className="tag">
              LE MIE RICHIESTE
            </label>

            <h2>
              Stato dei tuoi
              interventi
            </h2>

            <button
              className="outline"
              onClick={
                loadClientJobs
              }
              disabled={
                clientJobsLoading
              }
            >
              ↻ Aggiorna
            </button>

            {clientJobsLoading && (
              <p>
                Caricamento...
              </p>
            )}

            <div
              style={{
                display: 'grid',
                gap: 18,
                marginTop: 20
              }}
            >
              {clientJobs.map(
                job => {
                  const accepted =
                    job.status ===
                      'accettata' ||
                    job.status ===
                      'completata';

                  const completed =
                    job.status ===
                    'completata';

                  return (
                    <article
                      key={job.id}
                      className="card"
                    >
                      <div className="live">
                        {completed
                          ? '✅ INTERVENTO COMPLETATO'
                          : accepted
                            ? '🟢 PROFESSIONISTA TROVATO'
                            : '🔴 RICERCA IN CORSO'}
                      </div>

                      <h3>
                        {job.category_name ??
                          'Intervento'}
                      </h3>

                      <p>
                        {
                          job.description
                        }
                      </p>

                      <p>
                        <b>
                          Urgenza:
                        </b>{' '}
                        {job.urgency.toUpperCase()}
                      </p>

                      <p>
                        <b>
                          Stato:
                        </b>{' '}
                        {completed
                          ? 'Intervento completato'
                          : accepted
                            ? 'Presa in carico'
                            : 'In attesa di un professionista'}
                      </p>

                      {accepted &&
                        job.professional_name && (
                          <>
                            <div className="success">
                              <b>
                                {completed
                                  ? '✅ Intervento completato'
                                  : '🟢 Professionista trovato!'}
                              </b>

                              <br />

                              {
                                job.professional_name
                              }

                              {completed
                                ? ' ha completato questo intervento.'
                                : ' ha accettato la tua richiesta.'}
                            </div>

                            <button
                              className="full"
                              style={{
                                marginTop: 15
                              }}
                              onClick={() =>
                                openChat(
                                  job.id,
                                  job.professional_name ??
                                    job.category_name ??
                                    'Intervento'
                                )
                              }
                            >
                              💬 Apri chat
                              con{' '}
                              {
                                job.professional_name
                              }
                            </button>

                            {!completed && (
                              <button
                                className="outline"
                                style={{
                                  marginTop: 12
                                }}
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  completeJob(
                                    job.id
                                  )
                                }
                              >
                                ✓ Intervento
                                completato
                              </button>
                            )}

                            {completed && (
                              <button
                                className="outline"
                                style={{
                                  marginTop: 12
                                }}
                                onClick={() =>
                                  openReview(
                                    job.id,
                                    job.professional_name ??
                                      'Professionista'
                                  )
                                }
                              >
                                ⭐ Lascia
                                recensione
                              </button>
                            )}
                          </>
                        )}
                    </article>
                  );
                }
              )}
            </div>
          </section>
        )}

      <section className="stats">
        <div>
          <b>30 sec</b>
          <small>
            per creare una
            richiesta
          </small>
        </div>

        <div>
          <b>🟢 LIVE</b>
          <small>
            disponibilità
            professionisti
          </small>
        </div>

        <div>
          <b>V9</b>
          <small>
            chat + recensioni +
            reputazione
          </small>
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
          Dal problema alla
          soluzione.
        </h2>

        <div className="steps">
          <article>
            <i>01</i>
            <h3>Descrivi</h3>
            <p>
              Scegli il servizio
              e racconta cosa è
              successo.
            </p>
          </article>

          <article>
            <i>02</i>
            <h3>Trova</h3>
            <p>
              Troviamo un
              professionista
              disponibile.
            </p>
          </article>

          <article>
            <i>03</i>
            <h3>Risolvi</h3>
            <p>
              Completa
              l'intervento e
              lascia una
              recensione.
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
            PER I
            PROFESSIONISTI
          </label>

          <h2>
            Sei disponibile?{' '}
            <span>
              Fatti trovare.
            </span>
          </h2>

          <p>
            Imposta la
            disponibilità e
            ricevi richieste
            urgenti.
          </p>

          {!user && (
            <button
              className="primary"
              onClick={() => {
                setRole(
                  'professionista'
                );
                setAuthMode(
                  'signup'
                );
                setAuthOpen(
                  true
                );
              }}
            >
              Registrati come
              professionista →
            </button>
          )}
        </div>
      </section>

      <footer>
        <div className="logo">
          <b>L</b>{' '}
          Lavoro
          <span>Subito</span>
        </div>

        <small>
          © 2026 LavoroSubito
          · V9
        </small>
      </footer>

      {authOpen && (
        <div className="modal">
          <form
            className="modalBox"
            onSubmit={
              authSubmit
            }
          >
            <button
              type="button"
              className="x"
              onClick={() =>
                setAuthOpen(
                  false
                )
              }
            >
              ×
            </button>

            <label className="tag">
              {authMode ===
              'signup'
                ? 'REGISTRAZIONE'
                : 'ACCESSO'}
            </label>

            <h2>
              {authMode ===
              'signup'
                ? 'Entra in LavoroSubito'
                : 'Bentornato'}
            </h2>

            {authMode ===
              'signup' && (
              <>
                <input
                  required
                  placeholder="Nome e cognome"
                  value={name}
                  onChange={e =>
                    setName(
                      e.target
                        .value
                    )
                  }
                />

                <select
                  value={role}
                  onChange={e =>
                    setRole(
                      e.target
                        .value as AppRole
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
                setEmail(
                  e.target.value
                )
              }
            />

            <input
              required
              minLength={6}
              type="password"
              placeholder="Password"
              value={password}
              onChange={e =>
                setPassword(
                  e.target.value
                )
              }
            />

            <button
              className="full"
              disabled={busy}
            >
              {busy
                ? 'Attendi...'
                : authMode ===
                    'signup'
                  ? 'Crea account'
                  : 'Accedi'}
            </button>

            <button
              type="button"
              className="outline"
              onClick={() =>
                setAuthMode(
                  authMode ===
                    'signup'
                    ? 'login'
                    : 'signup'
                )
              }
            >
              {authMode ===
              'signup'
                ? 'Hai già un account? Accedi'
                : 'Non hai un account? Registrati'}
            </button>

            {message && (
              <small>
                {message}
              </small>
            )}
          </form>
        </div>
      )}

      <ChatModal />
      <ReviewModal />
    </main>
  );
}
