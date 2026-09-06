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

const icons = [
  '🔧',
  '⚡',
  '🔑',
  '🔥',
  '❄️',
  '🪟',
  '🚗',
  '🏠'
];

const distances = [10, 20, 30, 50, 100];

const slug = (v: string) =>
  v.toLowerCase().replaceAll(' ', '-');

type AppRole = 'cliente' | 'professionista';

type Job = {
  id: string;
  description: string;
  urgency: string;
  status: string;
  created_at?: string;
  distance_km?: number | null;
  categories?: {
    name?: string;
  } | null;
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
  reviewed: boolean;
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

type MatchResult = {
  professional_id: string;
  professional_name: string;
  availability_status: string;
  average_rating: number;
  review_count: number;
  distance_km: number | null;
  match_score: number;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  const [role, setRole] =
    useState<AppRole>('cliente');

  const [profileRole, setProfileRole] =
    useState<AppRole | null>(null);

  const [fullName, setFullName] =
    useState('');

  const [cat, setCat] =
    useState('');

  const [urg, setUrg] =
    useState('SUBITO');

  const [description, setDescription] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const [authOpen, setAuthOpen] =
    useState(false);

  const [authMode, setAuthMode] =
    useState<'login' | 'signup'>(
      'signup'
    );

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [online, setOnline] =
    useState(false);

  const [jobs, setJobs] =
    useState<Job[]>([]);

  const [jobsLoading, setJobsLoading] =
    useState(false);

  const [acceptedJobs, setAcceptedJobs] =
    useState<AcceptedJob[]>([]);

  const [clientJobs, setClientJobs] =
    useState<ClientJob[]>([]);

  const [
    clientJobsLoading,
    setClientJobsLoading
  ] = useState(false);

  const [chatJobId, setChatJobId] =
    useState<string | null>(null);

  const [chatTitle, setChatTitle] =
    useState('');

  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>([]);

  const [chatText, setChatText] =
    useState('');

  const [chatLoading, setChatLoading] =
    useState(false);

  const [chatSending, setChatSending] =
    useState(false);

  const [reviewJobId, setReviewJobId] =
    useState<string | null>(null);

  const [
    reviewProfessionalName,
    setReviewProfessionalName
  ] = useState('');

  const [rating, setRating] =
    useState(5);

  const [reviewComment, setReviewComment] =
    useState('');

  const [reviewSending, setReviewSending] =
    useState(false);

  const [reviewMessage, setReviewMessage] =
    useState('');

  const [
    professionalReviews,
    setProfessionalReviews
  ] = useState<ProfessionalReview[]>([]);

  const [bestMatch, setBestMatch] =
    useState<MatchResult | null>(null);

  const [
    matchingLoading,
    setMatchingLoading
  ] = useState(false);

  const [
    locationLoading,
    setLocationLoading
  ] = useState(false);

  const [coordinates, setCoordinates] =
    useState<Coordinates | null>(null);

  const [
    professionalLocationLoading,
    setProfessionalLocationLoading
  ] = useState(false);

  const [
    professionalLocationSet,
    setProfessionalLocationSet
  ] = useState(false);

  const [maxDistance, setMaxDistance] =
    useState(30);

  const [
    distanceSaving,
    setDistanceSaving
  ] = useState(false);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => {
        setUser(data.user);

        if (data.user) {
          loadProfile(data.user.id);
        }
      });

    const { data } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          const currentUser =
            session?.user ?? null;

          setUser(currentUser);

          if (currentUser) {
            loadProfile(
              currentUser.id
            );
          } else {
            setProfileRole(null);
            setFullName('');
            setJobs([]);
            setAcceptedJobs([]);
            setClientJobs([]);
            setProfessionalReviews([]);
            setBestMatch(null);
            setOnline(false);
            setChatJobId(null);
            setChatMessages([]);
            setReviewJobId(null);
            setCoordinates(null);
            setProfessionalLocationSet(
              false
            );
            setMaxDistance(30);
          }
        }
      );

    return () =>
      data.subscription.unsubscribe();
  }, []);

  async function loadProfile(
    userId: string
  ) {
    const { data, error } =
      await supabase
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
    setFullName(
      data.full_name ?? ''
    );

    if (
      detectedRole ===
      'professionista'
    ) {
      await loadAvailability(
        userId
      );

      await loadProfessionalSettings(
        userId
      );

      await loadJobs();
      await loadAcceptedJobs();
      await loadProfessionalReviews();
    } else {
      await loadClientJobs();
    }
  }

  async function loadProfessionalSettings(
    userId: string
  ) {
    const { data } =
      await supabase
        .from('professionals')
        .select(
          'latitude, longitude, max_distance_km'
        )
        .eq('id', userId)
        .maybeSingle();

    setProfessionalLocationSet(
      data?.latitude != null &&
      data?.longitude != null
    );

    setMaxDistance(
      data?.max_distance_km ??
        30
    );
  }

  async function loadAvailability(
    userId: string
  ) {
    const { data } =
      await supabase
        .from('availability')
        .select('status')
        .eq(
          'professional_id',
          userId
        )
        .maybeSingle();

    setOnline(
      data?.status === 'ora'
    );
  }

  async function loadJobs() {
    setJobsLoading(true);

    const { data, error } =
      await supabase.rpc(
        'my_matching_jobs'
      );

    if (error) {
      setMessage(
        `Errore caricamento richieste: ${error.message}`
      );

      setJobs([]);
    } else {
      const matchingJobs =
        (data ?? []).map(
          (job: any) => ({
            id: job.id,
            description:
              job.description,
            urgency:
              job.urgency,
            status:
              job.status,
            created_at:
              job.created_at,
            distance_km:
              job.distance_km,
            categories: {
              name:
                job.category_name
            }
          })
        );

      setJobs(matchingJobs);
    }

    setJobsLoading(false);
  }

  async function loadAcceptedJobs() {
    const { data, error } =
      await supabase.rpc(
        'my_accepted_jobs'
      );

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
  }

  async function loadClientJobs() {
    setClientJobsLoading(true);

    const { data, error } =
      await supabase.rpc(
        'my_client_jobs'
      );

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
  }

  function getCurrentPosition():
    Promise<Coordinates | null> {
    return new Promise(resolve => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation
        .getCurrentPosition(
          position => {
            resolve({
              latitude:
                position.coords.latitude,

              longitude:
                position.coords.longitude
            });
          },

          () => resolve(null),

          {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 60000
          }
        );
    });
  }

  async function detectLocation() {
    setLocationLoading(true);
    setMessage('');

    const position =
      await getCurrentPosition();

    if (!position) {
      setCoordinates(null);

      setMessage(
        'Non è stato possibile ottenere la posizione. Controlla i permessi GPS.'
      );
    } else {
      setCoordinates(position);

      setMessage(
        '📍 Posizione rilevata correttamente.'
      );
    }

    setLocationLoading(false);
  }

  async function updateProfessionalLocation() {
    if (!user) return;

    setProfessionalLocationLoading(
      true
    );

    setMessage('');

    const position =
      await getCurrentPosition();

    if (!position) {
      setMessage(
        'Non è stato possibile ottenere la posizione.'
      );

      setProfessionalLocationLoading(
        false
      );

      return;
    }

    const { data, error } =
      await supabase.rpc(
        'update_my_professional_location',
        {
          p_latitude:
            position.latitude,

          p_longitude:
            position.longitude
        }
      );

    if (error) {
      setMessage(
        `Errore posizione: ${error.message}`
      );

      setProfessionalLocationLoading(
        false
      );

      return;
    }

    if (data === false) {
      setMessage(
        'Non è stato possibile aggiornare la posizione.'
      );

      setProfessionalLocationLoading(
        false
      );

      return;
    }

    setProfessionalLocationSet(
      true
    );

    setMessage(
      '📍 Posizione professionale aggiornata correttamente.'
    );

    await loadJobs();

    setProfessionalLocationLoading(
      false
    );
  }

  async function saveMaxDistance(
    distance: number
  ) {
    setDistanceSaving(true);
    setMessage('');

    const { data, error } =
      await supabase.rpc(
        'update_my_max_distance',
        {
          p_max_distance:
            distance
        }
      );

    if (error) {
      setMessage(
        `Errore raggio di lavoro: ${error.message}`
      );

      setDistanceSaving(false);
      return;
    }

    if (data === false) {
      setMessage(
        'Non è stato possibile salvare il raggio di lavoro.'
      );

      setDistanceSaving(false);
      return;
    }

    setMaxDistance(distance);

    setMessage(
      `📍 Raggio massimo impostato a ${distance} km.`
    );

    await loadJobs();

    setDistanceSaving(false);
  }

  async function findBestMatch(
    jobId: string
  ) {
    setMatchingLoading(true);
    setBestMatch(null);

    const { data, error } =
      await supabase.rpc(
        'find_professionals_for_job',
        {
          p_job_id: jobId
        }
      );

    if (error) {
      setMessage(
        `Richiesta creata, ma errore matching: ${error.message}`
      );

      setMatchingLoading(false);
      return;
    }

    const results =
      (data ?? []) as MatchResult[];

    if (results.length > 0) {
      setBestMatch(
        results[0]
      );

      setMessage(
        '✓ Richiesta inviata. Professionista compatibile trovato.'
      );
    } else {
      setBestMatch(null);

      setMessage(
        '✓ Richiesta inviata. La ricerca dei professionisti resta attiva.'
      );
    }

    setMatchingLoading(false);
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
    setBestMatch(null);

    let currentCoordinates =
      coordinates;

    if (!currentCoordinates) {
      currentCoordinates =
        await getCurrentPosition();

      if (currentCoordinates) {
        setCoordinates(
          currentCoordinates
        );
      }
    }

    const {
      data: category,
      error: categoryError
    } = await supabase
      .from('categories')
      .select('id')
      .eq(
        'slug',
        slug(cat)
      )
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

    const {
      data: newJob,
      error
    } = await supabase
      .from('jobs')
      .insert({
        client_id:
          user.id,

        category_id:
          category.id,

        urgency:
          urg.toLowerCase(),

        description:
          description.trim(),

        latitude:
          currentCoordinates
            ?.latitude ?? null,

        longitude:
          currentCoordinates
            ?.longitude ?? null
      })
      .select('id')
      .single();

    if (error || !newJob) {
      setMessage(
        `Errore: ${
          error?.message ??
          'Impossibile creare la richiesta'
        }`
      );

      setBusy(false);
      return;
    }

    setDescription('');

    await loadClientJobs();

    await findBestMatch(
      newJob.id
    );

    setBusy(false);
  }

  async function acceptJob(
    jobId: string
  ) {
    if (!user) return;

    setBusy(true);
    setMessage('');

    const { data, error } =
      await supabase.rpc(
        'accept_job',
        {
          p_job_id: jobId
        }
      );

    if (error) {
      setMessage(
        `Errore accettazione: ${error.message}`
      );
    } else if (data === false) {
      setMessage(
        'Questo lavoro è già stato accettato.'
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

  async function completeJob(
    jobId: string
  ) {
    if (!user) return;

    const confirmation =
      window.confirm(
        'Confermi che l’intervento è stato completato?'
      );

    if (!confirmation) return;

    setBusy(true);
    setMessage('');

    const { data, error } =
      await supabase.rpc(
        'complete_job',
        {
          p_job_id: jobId
        }
      );

    if (error) {
      setMessage(
        `Errore completamento: ${error.message}`
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
      profileRole ===
      'professionista'
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

  async function loadChat(
    jobId: string
  ) {
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

    const { error } =
      await supabase
        .from('messages')
        .insert({
          job_id:
            chatJobId,

          sender_id:
            user.id,

          message:
            chatText.trim()
        });

    if (error) {
      setMessage(
        `Errore invio messaggio: ${error.message}`
      );
    } else {
      setChatText('');

      await loadChat(
        chatJobId
      );
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
    setReviewMessage('');
  }

  function closeReview() {
    setReviewJobId(null);
    setReviewProfessionalName('');
    setRating(5);
    setReviewComment('');
    setReviewMessage('');
  }

  async function submitReview(
    e: FormEvent
  ) {
    e.preventDefault();

    if (!reviewJobId) return;

    setReviewSending(true);
    setReviewMessage('');

    const { data, error } =
      await supabase.rpc(
        'create_review',
        {
          p_job_id:
            reviewJobId,

          p_rating:
            rating,

          p_comment:
            reviewComment.trim() ||
            null
        }
      );

    if (error) {
      setReviewMessage(
        error.message
          .toLowerCase()
          .includes(
            'già recensito'
          )
          ? 'Hai già recensito questo intervento.'
          : `Errore recensione: ${error.message}`
      );

      setReviewSending(false);
      return;
    }

    if (data === false) {
      setReviewMessage(
        'Non è possibile recensire questo intervento.'
      );

      setReviewSending(false);
      return;
    }

    setMessage(
      '⭐ Recensione inviata correttamente.'
    );

    await loadClientJobs();

    closeReview();

    setReviewSending(false);
  }

  async function authSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    setBusy(true);
    setMessage('');

    if (
      authMode ===
      'signup'
    ) {
      const { error } =
        await supabase.auth
          .signUp({
            email,
            password,

            options: {
              data: {
                full_name:
                  name,

                role
              }
            }
          });

      if (error) {
        setMessage(
          error.message
        );
      } else {
        setMessage(
          'Registrazione completata. Controlla la tua email.'
        );
      }
    } else {
      const {
        data,
        error
      } =
        await supabase.auth
          .signInWithPassword({
            email,
            password
          });

      if (error) {
        setMessage(
          error.message
        );
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

  async function toggleAvailability() {
    if (!user) return;

    const next =
      !online;

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
            new Date()
              .toISOString()
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
    setBestMatch(null);
    setCoordinates(null);
  }

  function availabilityLabel(
    status: string
  ) {
    if (status === 'ora') {
      return '🟢 Disponibile ora';
    }

    if (status === '1-2h') {
      return '🟡 Disponibile entro 1–2 ore';
    }

    if (status === 'oggi') {
      return '🟠 Disponibile oggi';
    }

    return '⚫ Offline';
  }

  const averageRating =
    professionalReviews.length > 0
      ? professionalReviews.reduce(
          (sum, review) =>
            sum +
            Number(
              review.rating
            ),
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
                Caricamento messaggi...
              </p>
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
                        mine ? 35 : 0,
                      marginRight:
                        mine ? 0 : 35
                    }}
                  >
                    <b>
                      {mine
                        ? 'Tu'
                        : 'Interlocutore'}
                    </b>

                    <p>{m.message}</p>
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
            />

            <button
              className="full"
              disabled={
                chatSending
              }
            >
              💬 Invia
            </button>
          </form>
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
            Come è andato l'intervento?
          </h2>

          <p>
            Valuta{' '}
            <b>
              {reviewProfessionalName}
            </b>
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
                    setRating(star)
                  }
                  style={{
                    border: 'none',
                    background:
                      'transparent',
                    fontSize: 34
                  }}
                >
                  {star <= rating
                    ? '⭐'
                    : '☆'}
                </button>
              )
            )}
          </div>

          <textarea
            value={
              reviewComment
            }
            onChange={e =>
              setReviewComment(
                e.target.value
              )
            }
            placeholder="Scrivi un commento..."
            rows={5}
          />

          {reviewMessage && (
            <div className="success">
              {reviewMessage}
            </div>
          )}

          <button
            className="full"
            disabled={
              reviewSending
            }
          >
            ⭐ Invia recensione
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
            paddingTop: 70
          }}
        >
          <label className="tag">
            AREA PROFESSIONISTA
          </label>

          <h2>
            Ciao{' '}
            {fullName ||
              'Professionista'}.
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

              <p>{user.email}</p>

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
                {
                  professionalReviews.length
                }{' '}
                recensioni
              </small>
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

          <div
            className="card"
            style={{
              marginTop: 20
            }}
          >
            <label className="tag">
              ZONA DI LAVORO
            </label>

            <h3>
              📍 Posizione e raggio
            </h3>

            <p>
              {professionalLocationSet
                ? '✅ Posizione configurata'
                : '⚠️ Posizione non configurata'}
            </p>

            <button
              className="full"
              onClick={
                updateProfessionalLocation
              }
              disabled={
                professionalLocationLoading
              }
            >
              📍 Aggiorna la mia posizione
            </button>

            <h3
              style={{
                marginTop: 30
              }}
            >
              Raggio massimo: {maxDistance} km
            </h3>

            <p>
              Vedrai solo i lavori entro
              questa distanza.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3, 1fr)',
                gap: 10,
                marginTop: 15
              }}
            >
              {distances.map(
                distance => (
                  <button
                    key={
                      distance
                    }
                    type="button"
                    className={
                      maxDistance ===
                      distance
                        ? 'full'
                        : 'outline'
                    }
                    disabled={
                      distanceSaving
                    }
                    onClick={() =>
                      saveMaxDistance(
                        distance
                      )
                    }
                  >
                    {distance} km
                  </button>
                )
              )}
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
              MATCHING LIVE
            </label>

            <h2>
              Lavori compatibili
            </h2>

            <p>
              Solo lavori entro{' '}
              <b>
                {maxDistance} km
              </b>{' '}
              dalla tua posizione.
            </p>

            <button
              className="outline"
              onClick={loadJobs}
            >
              ↻ Aggiorna
            </button>
          </div>

          {jobsLoading && (
            <p>
              Caricamento...
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
                  Nessun lavoro nel tuo raggio
                </h3>

                <p>
                  Non ci sono richieste
                  compatibili entro{' '}
                  {maxDistance} km.
                </p>
              </div>
            )}

          {jobs.map(
            job => (
              <article
                key={job.id}
                className="card"
                style={{
                  marginTop: 18
                }}
              >
                <div className="live">
                  ● MATCH COMPATIBILE
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

                {job.distance_km !=
                  null && (
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      margin:
                        '15px 0'
                    }}
                  >
                    📍{' '}
                    {Number(
                      job.distance_km
                    ).toFixed(1)}{' '}
                    km da te
                  </div>
                )}

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
            )
          )}

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

          {acceptedJobs.map(
            job => {
              const completed =
                job.status ===
                'completata';

              return (
                <article
                  key={job.id}
                  className="card"
                  style={{
                    marginTop: 18
                  }}
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
                    {job.description}
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
                      onClick={() =>
                        completeJob(
                          job.id
                        )
                      }
                    >
                      ✓ Intervento completato
                    </button>
                  )}
                </article>
              );
            }
          )}

          <div
            style={{
              marginTop: 70
            }}
          >
            <label className="tag">
              RECENSIONI
            </label>

            <h2>
              Cosa dicono i clienti
            </h2>
          </div>

          {professionalReviews.map(
            review => (
              <article
                key={
                  review.review_id
                }
                className="card"
                style={{
                  marginTop: 18
                }}
              >
                <div>
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

                <p>
                  {review.comment ||
                    'Nessun commento scritto.'}
                </p>
              </article>
            )
          )}
        </section>

        <footer>
          <div className="logo">
            <b>L</b>{' '}
            Lavoro
            <span>Subito</span>
          </div>

          <small>
            © 2026 LavoroSubito · V16
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
            Accedi / Registrati
          </button>
        )}
      </header>

      <section className="hero">
        <div>
          <label className="tag">
            ● INTERVENTI URGENTI
          </label>

          <h1>
            Un problema?
            <br />

            <span>
              Risolviamolo subito.
            </span>
          </h1>

          <p>
            Trova il professionista
            disponibile più adatto
            e più vicino a te.
          </p>
        </div>

        <div className="card">
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
            ].map(
              u => (
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
              )
            )}
          </div>

          <input
            value={
              description
            }
            onChange={e =>
              setDescription(
                e.target.value
              )
            }
            placeholder="Descrivi brevemente il problema..."
          />

          <button
            type="button"
            className="outline"
            style={{
              width: '100%',
              marginBottom: 12
            }}
            onClick={
              detectLocation
            }
          >
            {locationLoading
              ? '📍 Rilevamento...'
              : coordinates
                ? '✓ Posizione rilevata'
                : '📍 Usa la mia posizione'}
          </button>

          <button
            className="full"
            disabled={busy}
            onClick={
              submitJob
            }
          >
            {busy
              ? 'Ricerca in corso...'
              : 'Trova chi è disponibile →'}
          </button>

          {message && (
            <div className="success">
              {message}
            </div>
          )}

          {matchingLoading && (
            <div
              className="card"
              style={{
                marginTop: 20
              }}
            >
              🔎 Matching in corso...
            </div>
          )}

          {bestMatch && (
            <div
              className="card"
              style={{
                marginTop: 20,
                border:
                  '2px solid #48b779'
              }}
            >
              <label className="tag">
                MIGLIOR MATCH
              </label>

              <h2>
                {
                  bestMatch.professional_name
                }
              </h2>

              <div
                style={{
                  fontSize: 30,
                  fontWeight: 800
                }}
              >
                🎯{' '}
                {
                  bestMatch.match_score
                }
                /100
              </div>

              {bestMatch.distance_km !=
                null && (
                <h3>
                  📍{' '}
                  {Number(
                    bestMatch.distance_km
                  ).toFixed(1)}{' '}
                  km da te
                </h3>
              )}

              <p>
                {availabilityLabel(
                  bestMatch.availability_status
                )}
              </p>

              <p>
                ⭐{' '}
                {Number(
                  bestMatch.average_rating
                ).toFixed(1)}{' '}
                ·{' '}
                {
                  bestMatch.review_count
                }{' '}
                recensioni
              </p>
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
              Stato dei tuoi interventi
            </h2>

            <button
              className="outline"
              onClick={
                loadClientJobs
              }
            >
              ↻ Aggiorna
            </button>

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
                    key={
                      job.id
                    }
                    className="card"
                    style={{
                      marginTop: 18
                    }}
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
                      {job.description}
                    </p>

                    {accepted &&
                      job.professional_name && (
                        <>
                          <div className="success">
                            {
                              job.professional_name
                            }
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
                              onClick={() =>
                                completeJob(
                                  job.id
                                )
                              }
                            >
                              ✓ Intervento completato
                            </button>
                          )}

                          {completed &&
                            !job.reviewed && (
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
                                ⭐ Lascia recensione
                              </button>
                            )}

                          {completed &&
                            job.reviewed && (
                              <div
                                className="success"
                                style={{
                                  marginTop: 12
                                }}
                              >
                                ⭐ Recensione inviata
                              </div>
                            )}
                        </>
                      )}
                  </article>
                );
              }
            )}
          </section>
        )}

      <section className="section">
        <label className="tag">
          MATCHING INTELLIGENTE
        </label>

        <h2>
          Il professionista giusto,
          più vicino a te.
        </h2>

        <p>
          Categoria, disponibilità,
          distanza e reputazione.
        </p>
      </section>

      <footer>
        <div className="logo">
          <b>L</b>{' '}
          Lavoro
          <span>Subito</span>
        </div>

        <small>
          © 2026 LavoroSubito · V16
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
                setAuthOpen(false)
              }
            >
              ×
            </button>

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
                      e.target.value
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
              {authMode ===
              'signup'
                ? 'Crea account'
                : 'Accedi'}
            </button>
          </form>
        </div>
      )}

      <ChatModal />
      <ReviewModal />
    </main>
  );
}
