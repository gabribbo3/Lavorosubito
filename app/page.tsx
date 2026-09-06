'use client';

import {
  FormEvent,
  useEffect,
  useState
} from 'react';

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

const slug = (value: string) =>
  value
    .toLowerCase()
    .replaceAll(' ', '-');

type AppRole =
  | 'cliente'
  | 'professionista';

type Category = {
  id: string;
  name: string;
  slug?: string | null;
};

type SetupStatus = {
  categories_count: number;
  has_categories: boolean;
  has_location: boolean;
  has_radius: boolean;
  has_availability: boolean;
  setup_complete: boolean;
};

type Job = {
  id: string;
  description: string;
  urgency: string;
  status: string;
  created_at?: string;
  distance_km?: number | null;
  eta_minutes?: number | null;
  category_name?: string | null;
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
  eta_minutes: number | null;
  match_score: number;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

export default function Home() {
  const [user, setUser] =
    useState<User | null>(null);

  const [profileRole, setProfileRole] =
    useState<AppRole | null>(null);

  const [role, setRole] =
    useState<AppRole>('cliente');

  const [fullName, setFullName] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const [online, setOnline] =
    useState(false);

  const [
    realtimeConnected,
    setRealtimeConnected
  ] = useState(false);

  const [
    setupStatus,
    setSetupStatus
  ] =
    useState<SetupStatus | null>(
      null
    );

  const [
    allCategories,
    setAllCategories
  ] = useState<Category[]>([]);

  const [
    selectedCategoryIds,
    setSelectedCategoryIds
  ] = useState<string[]>([]);

  const [
    categorySaving,
    setCategorySaving
  ] = useState(false);

  const [
    maxDistance,
    setMaxDistance
  ] = useState(30);

  const [
    professionalLocationSet,
    setProfessionalLocationSet
  ] = useState(false);

  const [
    professionalLocationLoading,
    setProfessionalLocationLoading
  ] = useState(false);

  const [
    distanceSaving,
    setDistanceSaving
  ] = useState(false);

  const [jobs, setJobs] =
    useState<Job[]>([]);

  const [
    jobsLoading,
    setJobsLoading
  ] = useState(false);

  const [
    acceptedJobs,
    setAcceptedJobs
  ] = useState<AcceptedJob[]>([]);

  const [
    professionalReviews,
    setProfessionalReviews
  ] =
    useState<ProfessionalReview[]>(
      []
    );

  const [
    clientJobs,
    setClientJobs
  ] = useState<ClientJob[]>([]);

  const [
    clientJobsLoading,
    setClientJobsLoading
  ] = useState(false);

  const [cat, setCat] =
    useState('');

  const [urg, setUrg] =
    useState('SUBITO');

  const [
    description,
    setDescription
  ] = useState('');

  const [
    coordinates,
    setCoordinates
  ] =
    useState<Coordinates | null>(
      null
    );

  const [
    locationLoading,
    setLocationLoading
  ] = useState(false);

  const [
    bestMatch,
    setBestMatch
  ] =
    useState<MatchResult | null>(
      null
    );

  const [
    matchingLoading,
    setMatchingLoading
  ] = useState(false);

  const [
    authOpen,
    setAuthOpen
  ] = useState(false);

  const [
    authMode,
    setAuthMode
  ] =
    useState<
      'login' | 'signup'
    >('login');

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    chatJobId,
    setChatJobId
  ] =
    useState<string | null>(
      null
    );

  const [
    chatTitle,
    setChatTitle
  ] = useState('');

  const [
    chatMessages,
    setChatMessages
  ] =
    useState<ChatMessage[]>(
      []
    );

  const [chatText, setChatText] =
    useState('');

  const [
    chatLoading,
    setChatLoading
  ] = useState(false);

  const [
    chatSending,
    setChatSending
  ] = useState(false);

  const [
    reviewJobId,
    setReviewJobId
  ] =
    useState<string | null>(
      null
    );

  const [
    reviewProfessionalName,
    setReviewProfessionalName
  ] = useState('');

  const [rating, setRating] =
    useState(5);

  const [
    reviewComment,
    setReviewComment
  ] = useState('');

  const [
    reviewSending,
    setReviewSending
  ] = useState(false);

  const [
    reviewMessage,
    setReviewMessage
  ] = useState('');

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => {
        setUser(data.user);

        if (data.user) {
          loadProfile(
            data.user.id
          );
        }
      });

    const { data } =
      supabase.auth
        .onAuthStateChange(
          (_event, session) => {
            const currentUser =
              session?.user ??
              null;

            setUser(
              currentUser
            );

            if (currentUser) {
              loadProfile(
                currentUser.id
              );
            } else {
              resetSession();
            }
          }
        );

    return () => {
      data.subscription
        .unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (
      !user ||
      !profileRole
    ) {
      return;
    }

    const channel =
      supabase
        .channel(
          `lavorosubito-v23-${user.id}`
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'jobs'
          },
          async payload => {
            if (
              profileRole ===
              'professionista'
            ) {
              await loadJobs();
              await loadAcceptedJobs();

              if (
                payload.eventType ===
                'INSERT'
              ) {
                setMessage(
                  '🔔 Nuova richiesta ricevuta.'
                );
              }
            }

            if (
              profileRole ===
              'cliente'
            ) {
              await loadClientJobs();
            }
          }
        )
        .subscribe(
          status => {
            setRealtimeConnected(
              status ===
                'SUBSCRIBED'
            );
          }
        );

    return () => {
      setRealtimeConnected(
        false
      );

      supabase.removeChannel(
        channel
      );
    };
  }, [
    user?.id,
    profileRole
  ]);

  function resetSession() {
    setProfileRole(null);
    setFullName('');
    setOnline(false);
    setJobs([]);
    setAcceptedJobs([]);
    setClientJobs([]);
    setProfessionalReviews(
      []
    );
    setSelectedCategoryIds(
      []
    );
    setSetupStatus(null);
    setBestMatch(null);
    setChatJobId(null);
    setChatMessages([]);
    setReviewJobId(null);
    setCoordinates(null);
    setProfessionalLocationSet(
      false
    );
    setMaxDistance(30);
    setRealtimeConnected(
      false
    );
  }

  function scrollToSection(
    id: string
  ) {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
  }

  async function loadProfile(
    userId: string
  ) {
    const { data, error } =
      await supabase
        .from('profiles')
        .select(
          'role, full_name'
        )
        .eq(
          'id',
          userId
        )
        .single();

    if (
      error ||
      !data
    ) {
      setProfileRole(
        'cliente'
      );

      await loadClientJobs();
      return;
    }

    const detectedRole:
      AppRole =
        data.role ===
        'professionista'
          ? 'professionista'
          : 'cliente';

    setProfileRole(
      detectedRole
    );

    setFullName(
      data.full_name ?? ''
    );

    await loadAllCategories();

    if (
      detectedRole ===
      'professionista'
    ) {
      await Promise.all([
        loadAvailability(
          userId
        ),
        loadProfessionalSettings(
          userId
        ),
        loadProfessionalCategories(),
        loadSetupStatus(),
        loadJobs(),
        loadAcceptedJobs(),
        loadProfessionalReviews()
      ]);
    } else {
      await loadClientJobs();
    }
  }

  async function loadSetupStatus() {
    const { data, error } =
      await supabase.rpc(
        'my_professional_setup_status'
      );

    if (
      error ||
      !data ||
      data.length === 0
    ) {
      return;
    }

    setSetupStatus(
      data[0] as SetupStatus
    );
  }

  function setupPercentage() {
    if (!setupStatus) {
      return 0;
    }

    let completed = 0;

    if (
      setupStatus
        .has_categories
    ) {
      completed++;
    }

    if (
      setupStatus
        .has_location
    ) {
      completed++;
    }

    if (
      setupStatus
        .has_radius
    ) {
      completed++;
    }

    if (
      setupStatus
        .has_availability
    ) {
      completed++;
    }

    return completed * 25;
  }

  async function loadAllCategories() {
    const { data, error } =
      await supabase
        .from('categories')
        .select(
          'id, name, slug'
        )
        .order(
          'name',
          {
            ascending: true
          }
        );

    if (!error) {
      setAllCategories(
        (data ?? []) as Category[]
      );
    }
  }

  async function loadProfessionalCategories() {
    const { data, error } =
      await supabase.rpc(
        'my_professional_categories'
      );

    if (error) {
      setMessage(
        `Errore categorie: ${error.message}`
      );
      return;
    }

    setSelectedCategoryIds(
      (data ?? []).map(
        (row: any) =>
          row.category_id
      )
    );
  }

  function toggleProfessionalCategory(
    categoryId: string
  ) {
    setSelectedCategoryIds(
      current =>
        current.includes(
          categoryId
        )
          ? current.filter(
              id =>
                id !==
                categoryId
            )
          : [
              ...current,
              categoryId
            ]
    );
  }

  async function saveProfessionalCategories() {
    if (
      selectedCategoryIds
        .length === 0
    ) {
      setMessage(
        'Seleziona almeno una categoria.'
      );
      return;
    }

    setCategorySaving(true);
    setMessage('');

    const { data, error } =
      await supabase.rpc(
        'update_my_categories',
        {
          p_category_ids:
            selectedCategoryIds
        }
      );

    if (error) {
      setMessage(
        `Errore salvataggio categorie: ${error.message}`
      );
    } else if (
      data === false
    ) {
      setMessage(
        'Non è stato possibile salvare le categorie.'
      );
    } else {
      setMessage(
        '✅ Categorie professionali aggiornate.'
      );

      await loadJobs();
      await loadSetupStatus();
    }

    setCategorySaving(false);
  }

  async function loadAvailability(
    userId: string
  ) {
    const { data } =
      await supabase
        .from(
          'availability'
        )
        .select('status')
        .eq(
          'professional_id',
          userId
        )
        .maybeSingle();

    setOnline(
      data?.status ===
        'ora'
    );
  }

  async function loadProfessionalSettings(
    userId: string
  ) {
    const { data } =
      await supabase
        .from(
          'professionals'
        )
        .select(
          'latitude, longitude, max_distance_km'
        )
        .eq(
          'id',
          userId
        )
        .maybeSingle();

    setProfessionalLocationSet(
      data?.latitude != null &&
        data?.longitude !=
          null
    );

    setMaxDistance(
      data?.max_distance_km ??
        30
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
      setJobs(
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
            category_name:
              job.category_name,
            distance_km:
              job.distance_km,
            eta_minutes:
              job.eta_minutes
          })
        )
      );
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
        (data ??
          []) as AcceptedJob[]
      );
    }
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

      setProfessionalReviews(
        []
      );
    } else {
      setProfessionalReviews(
        (data ??
          []) as ProfessionalReview[]
      );
    }
  }

  async function loadClientJobs() {
    setClientJobsLoading(
      true
    );

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
        (data ??
          []) as ClientJob[]
      );
    }

    setClientJobsLoading(
      false
    );
  }

  function getCurrentPosition():
    Promise<Coordinates | null> {
    return new Promise(
      resolve => {
        if (
          !navigator.geolocation
        ) {
          resolve(null);
          return;
        }

        navigator.geolocation
          .getCurrentPosition(
            position => {
              resolve({
                latitude:
                  position
                    .coords
                    .latitude,

                longitude:
                  position
                    .coords
                    .longitude
              });
            },

            () =>
              resolve(null),

            {
              enableHighAccuracy:
                true,
              timeout: 12000,
              maximumAge:
                60000
            }
          );
      }
    );
  }

  async function detectLocation() {
    setLocationLoading(true);
    setMessage('');

    const position =
      await getCurrentPosition();

    if (!position) {
      setMessage(
        'Non è stato possibile ottenere la posizione.'
      );

      setLocationLoading(
        false
      );
      return;
    }

    setCoordinates(position);

    setMessage(
      '📍 Posizione rilevata correttamente.'
    );

    setLocationLoading(false);
  }

  async function updateProfessionalLocation() {
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
    } else if (
      data === false
    ) {
      setMessage(
        'Posizione non aggiornata.'
      );
    } else {
      setProfessionalLocationSet(
        true
      );

      setMessage(
        '📍 Posizione professionale aggiornata.'
      );

      await loadJobs();
      await loadSetupStatus();
    }

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
        `Errore raggio: ${error.message}`
      );
    } else if (
      data === false
    ) {
      setMessage(
        'Raggio non aggiornato.'
      );
    } else {
      setMaxDistance(
        distance
      );

      setMessage(
        `📍 Raggio impostato a ${distance} km.`
      );

      await loadJobs();
      await loadSetupStatus();
    }

    setDistanceSaving(
      false
    );
  }

  async function toggleAvailability() {
    if (!user) return;

    const next =
      !online;

    setBusy(true);

    const { error } =
      await supabase
        .from(
          'availability'
        )
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
          ? '🟢 Ora sei disponibile.'
          : '⚫ Ora sei offline.'
      );

      await loadSetupStatus();
    }

    setBusy(false);
  }

  async function acceptJob(
    jobId: string
  ) {
    setBusy(true);
    setMessage('');

    const { data, error } =
      await supabase.rpc(
        'accept_job',
        {
          p_job_id:
            jobId
        }
      );

    if (error) {
      setMessage(
        `Errore accettazione: ${error.message}`
      );
    } else if (
      data === false
    ) {
      setMessage(
        'Questo lavoro è già stato accettato.'
      );
    } else {
      setMessage(
        '✅ Lavoro accettato.'
      );
    }

    await loadJobs();
    await loadAcceptedJobs();

    setBusy(false);
  }

  async function completeJob(
    jobId: string
  ) {
    const confirmation =
      window.confirm(
        'Confermi che l’intervento è stato completato?'
      );

    if (!confirmation) {
      return;
    }

    setBusy(true);

    const { data, error } =
      await supabase.rpc(
        'complete_job',
        {
          p_job_id:
            jobId
        }
      );

    if (error) {
      setMessage(
        `Errore: ${error.message}`
      );
    } else if (
      data === false
    ) {
      setMessage(
        'Non è stato possibile completare il lavoro.'
      );
    } else {
      setMessage(
        '✅ Intervento completato.'
      );

      if (
        profileRole ===
        'professionista'
      ) {
        await loadAcceptedJobs();
      } else {
        await loadClientJobs();
      }
    }

    setBusy(false);
  }

  async function findBestMatch(
    jobId: string
  ) {
    setMatchingLoading(
      true
    );

    setBestMatch(null);

    const { data, error } =
      await supabase.rpc(
        'find_professionals_for_job',
        {
          p_job_id:
            jobId
        }
      );

    if (error) {
      setMessage(
        `Richiesta creata, ma errore matching: ${error.message}`
      );

      setMatchingLoading(
        false
      );

      return;
    }

    const results =
      (data ??
        []) as MatchResult[];

    if (
      results.length > 0
    ) {
      setBestMatch(
        results[0]
      );

      setMessage(
        '✅ Professionista compatibile trovato.'
      );
    } else {
      setMessage(
        '✅ Richiesta creata. Nessun professionista compatibile disponibile al momento.'
      );
    }

    setMatchingLoading(
      false
    );
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
      setAuthMode(
        'signup'
      );
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

    if (
      !currentCoordinates
    ) {
      currentCoordinates =
        await getCurrentPosition();

      if (
        currentCoordinates
      ) {
        setCoordinates(
          currentCoordinates
        );
      }
    }

    const {
      data: category,
      error: categoryError
    } =
      await supabase
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
    } =
      await supabase
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
              ?.latitude ??
            null,

          longitude:
            currentCoordinates
              ?.longitude ??
            null
        })
        .select('id')
        .single();

    if (
      error ||
      !newJob
    ) {
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

  async function openChat(
    jobId: string,
    title: string
  ) {
    setChatJobId(jobId);
    setChatTitle(title);
    setChatText('');

    await loadChat(
      jobId
    );
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
        .eq(
          'job_id',
          jobId
        )
        .order(
          'created_at',
          {
            ascending: true
          }
        );

    if (error) {
      setMessage(
        `Errore chat: ${error.message}`
      );
    } else {
      setChatMessages(
        (data ??
          []) as ChatMessage[]
      );
    }

    setChatLoading(false);
  }

  async function sendChatMessage(
    event: FormEvent
  ) {
    event.preventDefault();

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
        `Errore messaggio: ${error.message}`
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
    setReviewJobId(
      jobId
    );

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
    event: FormEvent
  ) {
    event.preventDefault();

    if (!reviewJobId) {
      return;
    }

    setReviewSending(true);

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
      );
    } else if (
      data === false
    ) {
      setReviewMessage(
        'Recensione non inviata.'
      );
    } else {
      setMessage(
        '⭐ Recensione inviata.'
      );

      await loadClientJobs();
      closeReview();
    }

    setReviewSending(false);
  }

  async function authSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

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
          '✅ Registrazione completata. Controlla la tua email per confermare l’account.'
        );

        setAuthMode(
          'login'
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

        if (
          data.user
        ) {
          await loadProfile(
            data.user.id
          );
        }
      }
    }

    setBusy(false);
  }

  async function logout() {
    await supabase.auth
      .signOut();

    resetSession();
    setMessage('');
  }

  function etaLabel(
    eta:
      number |
      null |
      undefined
  ) {
    if (
      eta == null
    ) {
      return 'Tempo non disponibile';
    }

    if (
      eta < 60
    ) {
      return `Circa ${eta} min`;
    }

    const hours =
      Math.floor(
        eta / 60
      );

    const minutes =
      eta % 60;

    if (
      minutes === 0
    ) {
      return `Circa ${hours} h`;
    }

    return `Circa ${hours} h ${minutes} min`;
  }

  function availabilityLabel(
    status: string
  ) {
    if (
      status === 'ora'
    ) {
      return '🟢 Disponibile ora';
    }

    if (
      status === '1-2h'
    ) {
      return '🟡 Disponibile entro 1–2 ore';
    }

    if (
      status === 'oggi'
    ) {
      return '🟠 Disponibile oggi';
    }

    return '⚫ Offline';
  }

  const averageRating =
    professionalReviews.length
      ? professionalReviews.reduce(
          (
            total,
            review
          ) =>
            total +
            Number(
              review.rating
            ),
          0
        ) /
        professionalReviews.length
      : 0;

  const percentage =
    setupPercentage();

  const setupComplete =
    setupStatus?.setup_complete ===
    true;

  const ChatModal = () =>
    chatJobId ? (
      <div className="modal">
        <div className="modalBox">
          <button
            type="button"
            className="x"
            onClick={
              closeChat
            }
          >
            ×
          </button>

          <label className="tag">
            CHAT INTERVENTO
          </label>

          <h2>
            {chatTitle}
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
                Caricamento...
              </p>
            )}

            {chatMessages.map(
              item => {
                const mine =
                  item.sender_id ===
                  user?.id;

                return (
                  <div
                    key={
                      item.id
                    }
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

                    <p>
                      {item.message}
                    </p>
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
              gap: 5,
              margin:
                '20px 0'
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
                    fontSize: 32
                  }}
                >
                  {star <=
                  rating
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
            placeholder="Commento..."
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
            <span>
              Subito
            </span>
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
            style={{
              display:
                'inline-block',
              marginTop: 15,
              padding:
                '8px 14px',
              border:
                '1px solid #ddd',
              borderRadius: 999,
              fontWeight: 700
            }}
          >
            {realtimeConnected
              ? '🟢 Aggiornamento LIVE attivo'
              : '🟡 Connessione LIVE...'}
          </div>

          {!setupComplete && (
            <div
              className="card"
              style={{
                marginTop: 25,
                border:
                  '2px solid #e4b23c'
              }}
            >
              <label className="tag">
                V23 · PRIMO ACCESSO
              </label>

              <h2>
                👋 Configuriamo il tuo profilo
              </h2>

              <p>
                Completa questi passaggi per iniziare a ricevere richieste di lavoro compatibili.
              </p>

              <h3
                style={{
                  marginTop: 25
                }}
              >
                {percentage}% completato
              </h3>

              <div
                style={{
                  width: '100%',
                  height: 14,
                  background:
                    '#ededed',
                  borderRadius: 999,
                  overflow:
                    'hidden',
                  margin:
                    '15px 0 25px'
                }}
              >
                <div
                  style={{
                    width:
                      `${percentage}%`,
                    height: '100%',
                    background:
                      '#f0b93a',
                    transition:
                      'width .3s ease'
                  }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 12
                }}
              >
                <button
                  type="button"
                  className={
                    setupStatus
                      ?.has_categories
                      ? 'outline'
                      : 'full'
                  }
                  onClick={() =>
                    scrollToSection(
                      'setup-categories'
                    )
                  }
                >
                  {setupStatus
                    ?.has_categories
                    ? '✅'
                    : '1️⃣'}{' '}
                  Scegli le categorie
                </button>

                <button
                  type="button"
                  className={
                    setupStatus
                      ?.has_location
                      ? 'outline'
                      : 'full'
                  }
                  onClick={() =>
                    scrollToSection(
                      'setup-location'
                    )
                  }
                >
                  {setupStatus
                    ?.has_location
                    ? '✅'
                    : '2️⃣'}{' '}
                  Imposta la posizione
                </button>

                <button
                  type="button"
                  className={
                    setupStatus
                      ?.has_radius
                      ? 'outline'
                      : 'full'
                  }
                  onClick={() =>
                    scrollToSection(
                      'setup-location'
                    )
                  }
                >
                  {setupStatus
                    ?.has_radius
                    ? '✅'
                    : '3️⃣'}{' '}
                  Scegli il raggio di lavoro
                </button>

                <button
                  type="button"
                  className={
                    setupStatus
                      ?.has_availability
                      ? 'outline'
                      : 'full'
                  }
                  onClick={() =>
                    scrollToSection(
                      'setup-availability'
                    )
                  }
                >
                  {setupStatus
                    ?.has_availability
                    ? '✅'
                    : '4️⃣'}{' '}
                  Imposta la disponibilità
                </button>
              </div>

              <p
                style={{
                  marginTop: 20
                }}
              >
                🔒 Il matching dei nuovi lavori verrà attivato automaticamente al completamento del profilo.
              </p>
            </div>
          )}

          {setupComplete && (
            <div
              className="success"
              style={{
                marginTop: 25,
                padding: 20
              }}
            >
              ✅ Profilo operativo al 100%. Puoi ricevere lavori compatibili.
            </div>
          )}

          <div
            id="setup-availability"
            className="proPanel"
            style={{
              marginTop: 20,
              scrollMarginTop:
                100
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
                  fontSize: 24,
                  fontWeight: 700
                }}
              >
                ⭐{' '}
                {professionalReviews.length
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
            id="setup-categories"
            className="card"
            style={{
              marginTop: 20,
              scrollMarginTop:
                100
            }}
          >
            <label className="tag">
              PASSAGGIO 1
            </label>

            <h2>
              🛠 Le mie categorie
            </h2>

            <p>
              Seleziona tutti i tipi di intervento che sei in grado di svolgere.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(2, minmax(0, 1fr))',
                gap: 10,
                marginTop: 20
              }}
            >
              {allCategories.map(
                category => {
                  const selected =
                    selectedCategoryIds
                      .includes(
                        category.id
                      );

                  return (
                    <button
                      key={
                        category.id
                      }
                      type="button"
                      className={
                        selected
                          ? 'full'
                          : 'outline'
                      }
                      onClick={() =>
                        toggleProfessionalCategory(
                          category.id
                        )
                      }
                    >
                      {selected
                        ? '✓ '
                        : ''}
                      {category.name}
                    </button>
                  );
                }
              )}
            </div>

            <button
              className="full"
              style={{
                marginTop: 20
              }}
              disabled={
                categorySaving
              }
              onClick={
                saveProfessionalCategories
              }
            >
              {categorySaving
                ? 'Salvataggio...'
                : '💾 Salva categorie'}
            </button>
          </div>

          <div
            id="setup-location"
            className="card"
            style={{
              marginTop: 20,
              scrollMarginTop:
                100
            }}
          >
            <label className="tag">
              PASSAGGI 2 E 3
            </label>

            <h2>
              📍 Zona di lavoro
            </h2>

            <p>
              {professionalLocationSet
                ? '✅ Posizione configurata'
                : '⚠️ Posizione ancora da configurare'}
            </p>

            <button
              className="full"
              disabled={
                professionalLocationLoading
              }
              onClick={
                updateProfessionalLocation
              }
            >
              {professionalLocationLoading
                ? 'Rilevamento...'
                : '📍 Usa la mia posizione'}
            </button>

            <h3
              style={{
                marginTop: 30
              }}
            >
              Raggio massimo:{' '}
              {maxDistance} km
            </h3>

            <p>
              Riceverai richieste entro questa distanza.
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

          {!setupComplete && (
            <div
              className="card"
              style={{
                marginTop: 40,
                textAlign:
                  'center'
              }}
            >
              <div
                style={{
                  fontSize: 42
                }}
              >
                🔒
              </div>

              <h2>
                Matching in attesa
              </h2>

              <p>
                Completa la configurazione del profilo per visualizzare e accettare i lavori disponibili.
              </p>
            </div>
          )}

          {setupComplete && (
            <>
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

                <button
                  className="outline"
                  onClick={
                    loadJobs
                  }
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
                jobs.length ===
                  0 && (
                  <div
                    className="card"
                    style={{
                      marginTop: 20
                    }}
                  >
                    <h3>
                      Nessun lavoro compatibile
                    </h3>

                    <p>
                      Al momento non ci sono richieste compatibili con categorie, posizione e raggio impostati.
                    </p>
                  </div>
                )}

              {jobs.map(
                job => (
                  <article
                    className="card"
                    key={
                      job.id
                    }
                    style={{
                      marginTop: 18
                    }}
                  >
                    <div className="live">
                      ● MATCH COMPATIBILE
                    </div>

                    <h3>
                      {job.category_name ||
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
                      <h3>
                        📍{' '}
                        {Number(
                          job.distance_km
                        ).toFixed(
                          1
                        )}{' '}
                        km
                      </h3>
                    )}

                    {job.eta_minutes !=
                      null && (
                      <h3>
                        ⏱{' '}
                        {etaLabel(
                          job.eta_minutes
                        )}
                      </h3>
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
            </>
          )}

          <div
            style={{
              marginTop: 60
            }}
          >
            <label className="tag">
              I MIEI LAVORI
            </label>

            <h2>
              Lavori accettati
            </h2>
          </div>

          {acceptedJobs.length ===
            0 && (
            <div
              className="card"
              style={{
                marginTop: 18
              }}
            >
              <p>
                Non hai ancora lavori accettati.
              </p>
            </div>
          )}

          {acceptedJobs.map(
            job => (
              <article
                key={job.id}
                className="card"
                style={{
                  marginTop: 18
                }}
              >
                <div className="live">
                  {job.status ===
                  'completata'
                    ? '✅ COMPLETATO'
                    : '🟢 ACCETTATO'}
                </div>

                <h3>
                  {job.category_name ||
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
                      job.category_name ||
                        'Intervento'
                    )
                  }
                >
                  💬 Apri chat
                </button>

                {job.status !==
                  'completata' && (
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
            )
          )}

          <div
            style={{
              marginTop: 60
            }}
          >
            <label className="tag">
              RECENSIONI
            </label>

            <h2>
              Cosa dicono i clienti
            </h2>
          </div>

          {professionalReviews.length ===
            0 && (
            <div
              className="card"
              style={{
                marginTop: 18
              }}
            >
              <p>
                Non hai ancora recensioni.
              </p>
            </div>
          )}

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
                    'Nessun commento.'}
                </p>
              </article>
            )
          )}
        </section>

        <footer>
          <div className="logo">
            <b>L</b>{' '}
            Lavoro
            <span>
              Subito
            </span>
          </div>

          <small>
            © 2026 LavoroSubito · V23
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
          <span>
            Subito
          </span>
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
            Trova rapidamente il professionista più adatto e disponibile nella tua zona.
          </p>
        </div>

        <div className="card">
          <h2>
            Di cosa hai bisogno?
          </h2>

          <div className="grid">
            {cats.map(
              (
                category,
                index
              ) => (
                <button
                  key={
                    category
                  }
                  className={
                    cat ===
                    category
                      ? 'cat selected'
                      : 'cat'
                  }
                  onClick={() =>
                    setCat(
                      category
                    )
                  }
                >
                  <strong>
                    {
                      icons[
                        index
                      ]
                    }
                  </strong>

                  {category}
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
              urgency => (
                <button
                  key={
                    urgency
                  }
                  className={
                    urg ===
                    urgency
                      ? 'selUrg'
                      : ''
                  }
                  onClick={() =>
                    setUrg(
                      urgency
                    )
                  }
                >
                  {urgency}
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
            placeholder="Descrivi il problema..."
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
                ? '✅ Posizione rilevata'
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
              ? 'Ricerca...'
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
                  bestMatch
                    .professional_name
                }
              </h2>

              <h3>
                🎯{' '}
                {
                  bestMatch
                    .match_score
                }
                /100
              </h3>

              {bestMatch.distance_km !=
                null && (
                <p>
                  📍{' '}
                  {Number(
                    bestMatch
                      .distance_km
                  ).toFixed(1)}{' '}
                  km
                </p>
              )}

              {bestMatch.eta_minutes !=
                null && (
                <p>
                  ⏱{' '}
                  {etaLabel(
                    bestMatch
                      .eta_minutes
                  )}
                </p>
              )}

              <p>
                {availabilityLabel(
                  bestMatch
                    .availability_status
                )}
              </p>

              <p>
                ⭐{' '}
                {Number(
                  bestMatch
                    .average_rating
                ).toFixed(1)}{' '}
                ·{' '}
                {
                  bestMatch
                    .review_count
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
              Stato interventi
            </h2>

            <div
              style={{
                marginBottom: 20,
                fontWeight: 700
              }}
            >
              {realtimeConnected
                ? '🟢 Stato LIVE'
                : '🟡 Connessione LIVE...'}
            </div>

            <button
              className="outline"
              onClick={
                loadClientJobs
              }
            >
              ↻ Aggiorna
            </button>

            {clientJobsLoading && (
              <p>
                Caricamento...
              </p>
            )}

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
                    style={{
                      marginTop: 18
                    }}
                  >
                    <div className="live">
                      {completed
                        ? '✅ COMPLETATO'
                        : accepted
                          ? '🟢 PROFESSIONISTA TROVATO'
                          : '🔴 RICERCA IN CORSO'}
                    </div>

                    <h3>
                      {job.category_name ||
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
                              job.professional_name ||
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
                                job.professional_name ||
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
          LAVOROSUBITO
        </label>

        <h2>
          Il professionista giusto, quando serve.
        </h2>

        <p>
          Matching basato su specializzazione, disponibilità, distanza, urgenza e reputazione.
        </p>
      </section>

      <footer>
        <div className="logo">
          <b>L</b>{' '}
          Lavoro
          <span>
            Subito
          </span>
        </div>

        <small>
          © 2026 LavoroSubito · V23
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

            <h2>
              {authMode ===
              'signup'
                ? 'Crea il tuo account'
                : 'Bentornato'}
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap: 10,
                marginBottom: 20
              }}
            >
              <button
                type="button"
                className={
                  authMode ===
                  'login'
                    ? 'full'
                    : 'outline'
                }
                onClick={() =>
                  setAuthMode(
                    'login'
                  )
                }
              >
                Accedi
              </button>

              <button
                type="button"
                className={
                  authMode ===
                  'signup'
                    ? 'full'
                    : 'outline'
                }
                onClick={() =>
                  setAuthMode(
                    'signup'
                  )
                }
              >
                Registrati
              </button>
            </div>

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
                    👤 Cliente
                  </option>

                  <option value="professionista">
                    🛠 Professionista
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
              value={
                password
              }
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

            {message && (
              <div
                className="success"
                style={{
                  marginTop: 15
                }}
              >
                {message}
              </div>
            )}
          </form>
        </div>
      )}

      <ChatModal />
      <ReviewModal />
    </main>
  );
}
