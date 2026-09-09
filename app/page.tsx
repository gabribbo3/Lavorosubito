'use 'use client';

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Role =
  | 'cliente'
  | 'professionista';

type Availability =
  | 'ora'
  | '1-2h'
  | 'oggi'
  | 'offline';

type ClientFilter =
  | 'tutti'
  | 'aperta'
  | 'accettata'
  | 'completata'
  | 'annullata';

type ProFilter =
  | 'tutti'
  | 'aperta'
  | 'accettata'
  | 'completata';

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Job = {
  id: string;
  description: string;
  urgency: string;
  status: string;
  created_at?: string;
  category_name?: string | null;
  distance_km?: number | null;
  eta_minutes?: number | null;
  address?: string | null;
  professional_name?: string | null;
  reviewed?: boolean;
};

type Review = {
  review_id: string;
  rating: number;
  comment?: string | null;
  created_at?: string;
  client_name?: string | null;
};

type Match = {
  professional_id: string;
  professional_name: string;
  availability_status: string;
  average_rating: number;
  review_count: number;
  distance_km: number | null;
  eta_minutes: number | null;
  match_score: number;
};

type Message = {
  id: string;
  job_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type Identity = {
  business_name?: string | null;
  phone?: string | null;
  vat_number?: string | null;
  tax_code?: string | null;
  verification_status?: string | null;
  verified?: boolean | null;
};

type Setup = {
  categories_count: number;
  has_categories: boolean;
  has_location: boolean;
  has_radius: boolean;
  has_availability: boolean;
  setup_complete: boolean;
};

const cats = [
  ['Idraulico', '🔧'],
  ['Elettricista', '⚡'],
  ['Fabbro', '🔑'],
  ['Caldaia', '🔥'],
  ['Climatizzatore', '❄️'],
  ['Serramenti', '🪟'],
  ['Meccanico', '🚗'],
  ['Altro', '🏠']
] as const;

const distances = [
  10,
  20,
  30,
  50,
  100
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replaceAll(' ', '-');
}

function availabilityLabel(value: string) {
  if (value === 'ora') {
    return '🟢 Disponibile ora';
  }

  if (value === '1-2h') {
    return '🟡 Entro 1–2 ore';
  }

  if (value === 'oggi') {
    return '🟠 Disponibile oggi';
  }

  return '⚫ Offline';
}

function etaLabel(value?: number | null) {
  if (value == null) {
    return 'Tempo non disponibile';
  }

  if (value < 60) {
    return `Circa ${value} min`;
  }

  const hours =
    Math.floor(value / 60);

  const minutes =
    value % 60;

  return minutes
    ? `Circa ${hours} h ${minutes} min`
    : `Circa ${hours} h`;
}

function statusLabel(status: string) {
  if (status === 'aperta') {
    return '🔴 RICERCA IN CORSO';
  }

  if (status === 'accettata') {
    return '🟢 ACCETTATA';
  }

  if (status === 'completata') {
    return '✅ COMPLETATA';
  }

  if (status === 'annullata') {
    return '⚫ ANNULLATA';
  }

  return status.toUpperCase();
}

export default function Home() {
  const [user, setUser] =
    useState<User | null>(null);

  const [role, setRole] =
    useState<Role | null>(null);

  const [fullName, setFullName] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const [live, setLive] =
    useState(false);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [
    selectedProCats,
    setSelectedProCats
  ] =
    useState<string[]>([]);

  const [
    availability,
    setAvailability
  ] =
    useState<Availability>('offline');

  const [
    maxDistance,
    setMaxDistance
  ] =
    useState(30);

  const [setup, setSetup] =
    useState<Setup | null>(null);

  const [identity, setIdentity] =
    useState<Identity>({});

  const [reviews, setReviews] =
    useState<Review[]>([]);

  const [clientJobs, setClientJobs] =
    useState<Job[]>([]);

  const [
    matchingJobs,
    setMatchingJobs
  ] =
    useState<Job[]>([]);

  const [
    acceptedJobs,
    setAcceptedJobs
  ] =
    useState<Job[]>([]);

  const [
    clientFilter,
    setClientFilter
  ] =
    useState<ClientFilter>('tutti');

  const [
    proFilter,
    setProFilter
  ] =
    useState<ProFilter>('tutti');

  const [cat, setCat] =
    useState('');

  const [urgency, setUrgency] =
    useState('SUBITO');

  const [
    description,
    setDescription
  ] =
    useState('');

  const [address, setAddress] =
    useState('');

  const [coords, setCoords] =
    useState<{
      latitude: number;
      longitude: number;
    } | null>(null);

  const [
    photoFile,
    setPhotoFile
  ] =
    useState<File | null>(null);

  const [
    photoPreview,
    setPhotoPreview
  ] =
    useState('');

  const [
    jobPhotos,
    setJobPhotos
  ] =
    useState<
      Record<
        string,
        string | null | undefined
      >
    >({});

  const [
    bestMatch,
    setBestMatch
  ] =
    useState<Match | null>(null);

  const [
    authOpen,
    setAuthOpen
  ] =
    useState(false);

  const [
    authMode,
    setAuthMode
  ] =
    useState<
      'login'
      | 'signup'
    >('login');

  const [
    signupRole,
    setSignupRole
  ] =
    useState<Role>('cliente');

  const [
    authName,
    setAuthName
  ] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [
    password,
    setPassword
  ] =
    useState('');

  const [
    chatJobId,
    setChatJobId
  ] =
    useState<string | null>(null);

  const [
    chatTitle,
    setChatTitle
  ] =
    useState('');

  const [
    messages,
    setMessages
  ] =
    useState<Message[]>([]);

  const chatInputRef =
    useRef<HTMLInputElement | null>(null);

  const [
    reviewJobId,
    setReviewJobId
  ] =
    useState<string | null>(null);

  const [rating, setRating] =
    useState(5);

  const [
    reviewComment,
    setReviewComment
  ] =
    useState('');

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => {
        setUser(data.user);

        if (data.user) {
          void loadProfile(
            data.user.id
          );
        }
      });

    const { data } =
      supabase.auth
        .onAuthStateChange(
          (
            _event,
            session
          ) => {
            const currentUser =
              session?.user ?? null;

            setUser(
              currentUser
            );

            if (currentUser) {
              void loadProfile(
                currentUser.id
              );
            } else {
              reset();
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
      !user
      ||
      !role
    ) {
      return;
    }

    const channel =
      supabase
        .channel(
          `lavorosubito-mvp-${user.id}`
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'jobs'
          },
          async () => {
            if (
              role ===
              'cliente'
            ) {
              await loadClientJobs();
            } else {
              await loadMatchingJobs();
              await loadAcceptedJobs();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          async payload => {
            const row =
              payload.new as {
                job_id?: string;
              };

            if (
              chatJobId
              &&
              row.job_id ===
                chatJobId
            ) {
              await loadChat(
                chatJobId
              );
            }
          }
        )
        .subscribe(
          status => {
            setLive(
              status ===
              'SUBSCRIBED'
            );
          }
        );

    return () => {
      setLive(false);

      void supabase
        .removeChannel(
          channel
        );
    };
  }, [
    user?.id,
    role,
    chatJobId
  ]);

  function reset() {
    setRole(null);
    setFullName('');
    setMessage('');
    setClientJobs([]);
    setMatchingJobs([]);
    setAcceptedJobs([]);
    setSelectedProCats([]);
    setAvailability('offline');
    setSetup(null);
    setIdentity({});
    setReviews([]);
    setBestMatch(null);
    clearPhoto();
    setJobPhotos({});
    setChatJobId(null);
    setMessages([]);
  }

  async function loadProfile(
    id: string
  ) {
    const { data } =
      await supabase
        .from('profiles')
        .select(
          'role,full_name'
        )
        .eq(
          'id',
          id
        )
        .maybeSingle();

    const detected: Role =
      data?.role ===
        'professionista'
        ? 'professionista'
        : 'cliente';

    setRole(
      detected
    );

    setFullName(
      data?.full_name
      ?? ''
    );

    const {
      data: categoryRows
    } =
      await supabase
        .from('categories')
        .select(
          'id,name,slug'
        )
        .order(
          'name'
        );

    setCategories(
      (
        categoryRows
        ?? []
      ) as Category[]
    );

    if (
      detected ===
      'cliente'
    ) {
      await loadClientJobs();
    } else {
      await Promise.all([
        loadProfessional(),
        loadMatchingJobs(),
        loadAcceptedJobs(),
        loadReviews()
      ]);
    }
  }

  async function loadProfessional() {
    const [
      identityResponse,
      categoryResponse,
      setupResponse,
      availabilityResponse
    ] =
      await Promise.all([
        supabase.rpc(
          'my_professional_identity'
        ),

        supabase.rpc(
          'my_professional_categories'
        ),

        supabase.rpc(
          'my_professional_setup_status'
        ),

        supabase.rpc(
          'my_professional_availability'
        )
      ]);

    if (
      identityResponse
        .data?.[0]
    ) {
      setIdentity(
        identityResponse
          .data[0]
        as Identity
      );
    }

    setSelectedProCats(
      (
        categoryResponse
          .data
        ?? []
      ).map(
        (row: any) =>
          row.category_id
      )
    );

    if (
      setupResponse
        .data?.[0]
    ) {
      setSetup(
        setupResponse
          .data[0]
        as Setup
      );
    }

    if (
      availabilityResponse
        .data
    ) {
      setAvailability(
        availabilityResponse
          .data
        as Availability
      );
    }

    const {
      data: {
        user: currentUser
      }
    } =
      await supabase.auth
        .getUser();

    if (
      currentUser
    ) {
      const {
        data:
          professionalRow
      } =
        await supabase
          .from(
            'professionals'
          )
          .select(
            'max_distance_km'
          )
          .eq(
            'id',
            currentUser.id
          )
          .maybeSingle();

      if (
        professionalRow
          ?.max_distance_km
        != null
      ) {
        setMaxDistance(
          professionalRow
            .max_distance_km
        );
      }
    }
  }

  async function loadClientJobs() {
    const {
      data,
      error
    } =
      await supabase.rpc(
        'my_client_jobs'
      );

    if (error) {
      setMessage(
        `Errore richieste: ${error.message}`
      );

      return;
    }

    const rows =
      (
        data
        ?? []
      ) as Job[];

    setClientJobs(rows);

    void loadPhotos(
      rows.map(
        row => row.id
      )
    );
  }

  async function loadMatchingJobs() {
    const {
      data,
      error
    } =
      await supabase.rpc(
        'my_matching_jobs'
      );

    if (error) {
      setMatchingJobs([]);
      return;
    }

    const rows =
      (
        data
        ?? []
      ) as Job[];

    setMatchingJobs(rows);

    void loadPhotos(
      rows.map(
        row => row.id
      )
    );
  }

  async function loadAcceptedJobs() {
    const {
      data
    } =
      await supabase.rpc(
        'my_accepted_jobs'
      );

    const rows =
      (
        data
        ?? []
      ) as Job[];

    setAcceptedJobs(rows);

    void loadPhotos(
      rows.map(
        row => row.id
      )
    );
  }

  async function loadReviews() {
    const {
      data
    } =
      await supabase.rpc(
        'my_professional_reviews'
      );

    setReviews(
      (
        data
        ?? []
      ) as Review[]
    );
  }

  async function getPosition() {
    return new Promise<
      {
        latitude: number;
        longitude: number;
      } | null
    >(resolve => {
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
          () => {
            resolve(null);
          },
          {
            enableHighAccuracy:
              true,

            timeout:
              12000,

            maximumAge:
              60000
          }
        );
    });
  }

  function choosePhoto(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target
        .files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type
        .startsWith(
          'image/'
        )
    ) {
      setMessage(
        'Seleziona un’immagine.'
      );

      return;
    }

    if (
      file.size
      >
      10
      * 1024
      * 1024
    ) {
      setMessage(
        'La foto supera 10 MB.'
      );

      return;
    }

    if (
      photoPreview
    ) {
      URL.revokeObjectURL(
        photoPreview
      );
    }

    setPhotoFile(
      file
    );

    setPhotoPreview(
      URL.createObjectURL(
        file
      )
    );
  }

  function clearPhoto() {
    if (
      photoPreview
    ) {
      URL.revokeObjectURL(
        photoPreview
      );
    }

    setPhotoFile(null);
    setPhotoPreview('');
  }

  async function uploadPhoto(
    jobId: string
  ) {
    if (
      !photoFile
      ||
      !user
    ) {
      return true;
    }

    const extension =
      (
        photoFile
          .name
          .split('.')
          .pop()
        ?? 'jpg'
      )
        .replace(
          /[^a-zA-Z0-9]/g,
          ''
        )
        .toLowerCase();

    const path =
      `${user.id}/${jobId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const upload =
      await supabase
        .storage
        .from(
          'job-photos'
        )
        .upload(
          path,
          photoFile,
          {
            contentType:
              photoFile.type,

            upsert:
              false
          }
        );

    if (
      upload.error
    ) {
      setMessage(
        `Richiesta creata, foto non caricata: ${upload.error.message}`
      );

      return false;
    }

    const save =
      await supabase.rpc(
        'set_my_job_photo',
        {
          p_job_id:
            jobId,

          p_photo_url:
            path
        }
      );

    if (
      save.error
      ||
      save.data === false
    ) {
      await supabase
        .storage
        .from(
          'job-photos'
        )
        .remove([
          path
        ]);

      setMessage(
        `Richiesta creata, foto non collegata: ${save.error?.message ?? 'errore'}`
      );

      return false;
    }

    return true;
  }

  async function loadPhoto(
    jobId: string
  ) {
    if (
      jobPhotos[
        jobId
      ] !== undefined
    ) {
      return;
    }

    const {
      data
    } =
      await supabase.rpc(
        'get_job_photo_url',
        {
          p_job_id:
            jobId
        }
      );

    if (!data) {
      setJobPhotos(
        current => ({
          ...current,
          [jobId]:
            null
        })
      );

      return;
    }

    const download =
      await supabase
        .storage
        .from(
          'job-photos'
        )
        .download(
          String(data)
        );

    if (
      download.error
      ||
      !download.data
    ) {
      setJobPhotos(
        current => ({
          ...current,
          [jobId]:
            null
        })
      );

      return;
    }

    setJobPhotos(
      current => ({
        ...current,

        [jobId]:
          URL.createObjectURL(
            download.data
          )
      })
    );
  }

  async function loadPhotos(
    ids: string[]
  ) {
    for (
      const id
      of ids
    ) {
      await loadPhoto(
        id
      );
    }
  }

  async function submitJob() {
    if (
      !cat
      ||
      !description.trim()
      ||
      !address.trim()
    ) {
      setMessage(
        'Completa categoria, descrizione e indirizzo.'
      );

      return;
    }

    if (!user) {
      setSignupRole(
        'cliente'
      );

      setAuthMode(
        'signup'
      );

      setAuthOpen(
        true
      );

      return;
    }

    setBusy(true);
    setMessage('');
    setBestMatch(null);

    let position =
      coords;

    if (!position) {
      position =
        await getPosition();

      if (position) {
        setCoords(
          position
        );
      }
    }

    const {
      data: category
    } =
      await supabase
        .from(
          'categories'
        )
        .select(
          'id'
        )
        .eq(
          'slug',
          slugify(cat)
        )
        .maybeSingle();

    if (!category) {
      setBusy(false);

      setMessage(
        'Categoria non trovata.'
      );

      return;
    }

    const insert =
      await supabase
        .from(
          'jobs'
        )
        .insert({
          client_id:
            user.id,

          category_id:
            category.id,

          urgency:
            urgency
              .toLowerCase(),

          description:
            description
              .trim(),

          address:
            address
              .trim(),

          latitude:
            position
              ?.latitude
            ?? null,

          longitude:
            position
              ?.longitude
            ?? null
        })
        .select(
          'id'
        )
        .single();

    if (
      insert.error
      ||
      !insert.data
    ) {
      setBusy(false);

      setMessage(
        `Errore: ${insert.error?.message ?? 'creazione richiesta'}`
      );

      return;
    }

    const jobId =
      insert.data.id
      as string;

    await uploadPhoto(
      jobId
    );

    clearPhoto();

    setDescription('');
    setAddress('');

    await loadClientJobs();

    const matching =
      await supabase.rpc(
        'find_verified_professionals_for_job',
        {
          p_job_id:
            jobId
        }
      );

    const first =
      (
        matching.data
        ?? []
      )[0]
      as
        | Match
        | undefined;

    setBestMatch(
      first
      ?? null
    );

    try {
      const {
        data: {
          session
        }
      } =
        await supabase
          .auth
          .getSession();

      if (
        session
          ?.access_token
      ) {
        await fetch(
          '/api/push/send',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${session.access_token}`
            },

            body:
              JSON.stringify({
                jobId
              })
          }
        );
      }
    } catch {
    }

    setMessage(
      first
        ? '✅ Professionista compatibile trovato.'
        : '✅ Richiesta creata. Nessun professionista compatibile al momento.'
    );

    setBusy(false);
  }

  async function cancelJob(
    id: string
  ) {
    if (
      !confirm(
        'Vuoi annullare la richiesta?'
      )
    ) {
      return;
    }

    const {
      data,
      error
    } =
      await supabase.rpc(
        'cancel_my_job',
        {
          p_job_id:
            id
        }
      );

    setMessage(
      error
        ? error.message
        : data
          ? '✅ Richiesta annullata.'
          : 'Richiesta non annullabile.'
    );

    await loadClientJobs();
  }

  async function acceptJob(
    id: string
  ) {
    setBusy(true);

    const {
      data,
      error
    } =
      await supabase.rpc(
        'accept_verified_job',
        {
          p_job_id:
            id
        }
      );

    setMessage(
      error
        ? `Errore: ${error.message}`
        : data
          ? '✅ Lavoro accettato.'
          : 'Lavoro già accettato.'
    );

    await Promise.all([
      loadMatchingJobs(),
      loadAcceptedJobs()
    ]);

    setBusy(false);
  }

  async function completeJob(
    id: string
  ) {
    if (
      !confirm(
        'Confermi intervento completato?'
      )
    ) {
      return;
    }

    const {
      data,
      error
    } =
      await supabase.rpc(
        'complete_job',
        {
          p_job_id:
            id
        }
      );

    setMessage(
      error
        ? error.message
        : data
          ? '✅ Intervento completato.'
          : 'Operazione non riuscita.'
    );

    if (
      role ===
      'cliente'
    ) {
      await loadClientJobs();
    } else {
      await loadAcceptedJobs();
    }
  }

  async function openChat(
    id: string,
    title: string
  ) {
    setChatJobId(
      id
    );

    setChatTitle(
      title
    );

    await loadChat(
      id
    );

    setTimeout(
      () => {
        chatInputRef
          .current
          ?.focus();
      },
      100
    );
  }

  async function loadChat(
    id: string
  ) {
    const {
      data,
      error
    } =
      await supabase
        .from(
          'messages'
        )
        .select(
          'id,job_id,sender_id,message,created_at'
        )
        .eq(
          'job_id',
          id
        )
        .order(
          'created_at'
        );

    if (error) {
      setMessage(
        error.message
      );
    } else {
      setMessages(
        (
          data
          ?? []
        ) as Message[]
      );
    }
  }

  async function sendMessage(
    event:
      FormEvent
  ) {
    event.preventDefault();

    if (
      !user
      ||
      !chatJobId
    ) {
      return;
    }

    const text =
      chatInputRef
        .current
        ?.value
        .trim()
      ?? '';

    if (!text) {
      return;
    }

    const {
      error
    } =
      await supabase
        .from(
          'messages'
        )
        .insert({
          job_id:
            chatJobId,

          sender_id:
            user.id,

          message:
            text
        });

    if (error) {
      setMessage(
        error.message
      );

      return;
    }

    if (
      chatInputRef.current
    ) {
      chatInputRef
        .current
        .value =
        '';
    }

    await loadChat(
      chatJobId
    );

    setTimeout(
      () => {
        chatInputRef
          .current
          ?.focus();
      },
      50
    );
  }

  async function submitReview(
    event:
      FormEvent
  ) {
    event.preventDefault();

    if (
      !reviewJobId
    ) {
      return;
    }

    const {
      data,
      error
    } =
      await supabase.rpc(
        'create_review',
        {
          p_job_id:
            reviewJobId,

          p_rating:
            rating,

          p_comment:
            reviewComment
              .trim()
            || null
        }
      );

    setMessage(
      error
        ? error.message
        : data
          ? '⭐ Recensione inviata.'
          : 'Recensione non inviata.'
    );

    setReviewJobId(
      null
    );

    setReviewComment(
      ''
    );

    await loadClientJobs();
  }

  async function authSubmit(
    event:
      FormEvent
  ) {
    event.preventDefault();

    setBusy(true);
    setMessage('');

    if (
      authMode ===
      'signup'
    ) {
      const {
        error
      } =
        await supabase.auth
          .signUp({
            email,
            password,

            options: {
              data: {
                full_name:
                  authName,

                role:
                  signupRole
              }
            }
          });

      setMessage(
        error
          ? error.message
          : '✅ Registrazione completata. Controlla la tua email.'
      );

      if (!error) {
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
        setAuthOpen(
          false
        );

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

    reset();
  }

  async function saveIdentity() {
    const {
      data,
      error
    } =
      await supabase.rpc(
        'update_my_professional_identity',
        {
          p_business_name:
            identity
              .business_name
              ?.trim()
            || '',

          p_phone:
            identity
              .phone
              ?.trim()
            || '',

          p_vat_number:
            identity
              .vat_number
              ?.trim()
            || '',

          p_tax_code:
            identity
              .tax_code
              ?.trim()
            || ''
        }
      );

    setMessage(
      error
        ? error.message
        : data
          ? '✅ Dati salvati. Il profilo torna in verifica.'
          : 'Salvataggio non riuscito.'
    );

    await loadProfessional();
  }

  async function saveCategories() {
    if (
      !selectedProCats
        .length
    ) {
      setMessage(
        'Seleziona almeno una categoria.'
      );

      return;
    }

    const {
      error
    } =
      await supabase.rpc(
        'update_my_categories',
        {
          p_category_ids:
            selectedProCats
        }
      );

    setMessage(
      error
        ? error.message
        : '✅ Categorie aggiornate.'
    );

    await loadProfessional();
    await loadMatchingJobs();
  }

  async function setProLocation() {
    const position =
      await getPosition();

    if (!position) {
      setMessage(
        'Posizione non disponibile.'
      );

      return;
    }

    const {
      error
    } =
      await supabase.rpc(
        'update_my_professional_location',
        {
          p_latitude:
            position.latitude,

          p_longitude:
            position.longitude
        }
      );

    setMessage(
      error
        ? error.message
        : '✅ Posizione aggiornata.'
    );

    await loadProfessional();
    await loadMatchingJobs();
  }

  async function setRadius(
    value: number
  ) {
    const {
      error
    } =
      await supabase.rpc(
        'update_my_max_distance',
        {
          p_max_distance:
            value
        }
      );

    if (error) {
      setMessage(
        error.message
      );

      return;
    }

    setMaxDistance(
      value
    );

    setMessage(
      `✅ Raggio impostato a ${value} km.`
    );

    await loadMatchingJobs();
  }

  async function setAvail(
    value:
      Availability
  ) {
    const {
      error
    } =
      await supabase.rpc(
        'update_my_availability',
        {
          p_status:
            value
        }
      );

    if (error) {
      setMessage(
        error.message
      );

      return;
    }

    setAvailability(
      value
    );

    setMessage(
      `✅ ${availabilityLabel(value)}`
    );

    await loadMatchingJobs();
  }

  const filteredClient =
    useMemo(
      () => {
        if (
          clientFilter ===
          'tutti'
        ) {
          return clientJobs;
        }

        return clientJobs
          .filter(
            job =>
              job.status ===
              clientFilter
          );
      },
      [
        clientJobs,
        clientFilter
      ]
    );

  const openProfessionalJobs =
    (
      proFilter ===
      'tutti'
      ||
      proFilter ===
      'aperta'
    )
      ? matchingJobs
      : [];

  const filteredAcceptedJobs =
    proFilter ===
      'tutti'
      ? acceptedJobs
      : acceptedJobs
          .filter(
            job =>
              job.status ===
              proFilter
          );

  const verified =
    identity.verified ===
      true
    &&
    identity
      .verification_status ===
      'verificato';

  const setupPercentage =
    setup
      ? [
          setup.has_categories,
          setup.has_location,
          setup.has_radius,
          setup.has_availability
        ]
          .filter(Boolean)
          .length
          * 25
      : 0;

  const averageRating =
    reviews.length
      ? reviews.reduce(
          (
            total,
            review
          ) =>
            total
            +
            Number(
              review.rating
            ),
          0
        )
        /
        reviews.length
      : 0;

  function Photo(
    {
      id
    }: {
      id: string;
    }
  ) {
    const src =
      jobPhotos[id];

    if (!src) {
      return null;
    }

    return (
      <img
        className="photo"
        src={src}
        alt="Foto del problema"
      />
    );
  }

  function renderChatModal() {
    return (
      <div className="modal">
        <div className="modalBox">
          <button
            className="x"
            type="button"
            onClick={
              () =>
                setChatJobId(
                  null
                )
            }
          >
            ×
          </button>

          <span className="tag">
            Chat intervento
          </span>

          <h2>
            {chatTitle}
          </h2>

          <div className="chat-list">
            {
              messages.map(
                item => (
                  <div
                    key={
                      item.id
                    }
                    className={
                      `bubble ${
                        item.sender_id ===
                          user?.id
                          ? 'mine'
                          : 'theirs'
                      }`
                    }
                  >
                    <b>
                      {
                        item.sender_id ===
                          user?.id
                          ? 'Tu'
                          : 'Interlocutore'
                      }
                    </b>

                    <div>
                      {
                        item.message
                      }
                    </div>
                  </div>
                )
              )
            }
          </div>

          <form
            onSubmit={
              sendMessage
            }
          >
            <input
              ref={
                chatInputRef
              }
              autoComplete="off"
              placeholder="Scrivi un messaggio..."
            />

            <button
              className="full"
              style={{
                marginTop:
                  10
              }}
            >
              Invia
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (
    user
    &&
    role ===
      'professionista'
  ) {
    return (
      <main>
        <header>
          <div className="logo">
            <b>L</b>
            Lavoro
            <span>
              Subito
            </span>
          </div>

          <button
            className="outline"
            onClick={
              logout
            }
          >
            Esci
          </button>
        </header>

        <div className="container">
          <section className="section">
            <span className="tag">
              Area professionista · MVP 1.0
            </span>

            <h2>
              Ciao{' '}
              {
                fullName
                ||
                'Professionista'
              }
            </h2>

            <div
              className={
                live
                  ? 'success'
                  : 'notice'
              }
            >
              {
                live
                  ? '🟢 Aggiornamento LIVE attivo'
                  : '🟡 Connessione LIVE...'
              }
            </div>

            {
              message
              &&
              (
                <div className="notice">
                  {message}
                </div>
              )
            }

            <div className="kpi">
              <div className="card">
                <span className="muted">
                  Profilo
                </span>

                <strong>
                  {
                    setupPercentage
                  }%
                </strong>
              </div>

              <div className="card">
                <span className="muted">
                  Stato
                </span>

                <strong>
                  {
                    verified
                      ? '✅'
                      : '🟡'
                  }
                </strong>
              </div>

              <div className="card">
                <span className="muted">
                  Nuovi
                </span>

                <strong>
                  {
                    matchingJobs
                      .length
                  }
                </strong>
              </div>

              <div className="card">
                <span className="muted">
                  Recensioni
                </span>

                <strong>
                  {
                    reviews.length
                      ? averageRating
                          .toFixed(1)
                      : '—'
                  }
                </strong>
              </div>
            </div>

            <div
              className="card"
              style={{
                marginTop:
                  16
              }}
            >
              <span className="tag">
                Dati e verifica
              </span>

              <h3>
                {
                  verified
                    ? '✅ Professionista verificato'
                    : identity
                        .verification_status ===
                        'rifiutato'
                      ? '❌ Verifica rifiutata'
                      : '🟡 In attesa di verifica'
                }
              </h3>

              <label>
                Nome attività
              </label>

              <input
                value={
                  identity
                    .business_name
                  ?? ''
                }
                onChange={
                  event =>
                    setIdentity(
                      current => ({
                        ...current,

                        business_name:
                          event
                            .target
                            .value
                      })
                    )
                }
              />

              <label>
                Telefono
              </label>

              <input
                value={
                  identity
                    .phone
                  ?? ''
                }
                onChange={
                  event =>
                    setIdentity(
                      current => ({
                        ...current,

                        phone:
                          event
                            .target
                            .value
                      })
                    )
                }
              />

              <label>
                Partita IVA
              </label>

              <input
                value={
                  identity
                    .vat_number
                  ?? ''
                }
                onChange={
                  event =>
                    setIdentity(
                      current => ({
                        ...current,

                        vat_number:
                          event
                            .target
                            .value
                      })
                    )
                }
              />

              <label>
                Codice fiscale
              </label>

              <input
                value={
                  identity
                    .tax_code
                  ?? ''
                }
                onChange={
                  event =>
                    setIdentity(
                      current => ({
                        ...current,

                        tax_code:
                          event
                            .target
                            .value
                      })
                    )
                }
              />

              <div className="actions">
                <button
                  className="full"
                  onClick={
                    saveIdentity
                  }
                >
                  Salva dati
                </button>
              </div>
            </div>

            <div
              className="card"
              style={{
                marginTop:
                  16
              }}
            >
              <span className="tag">
                Disponibilità
              </span>

              <h3>
                {
                  availabilityLabel(
                    availability
                  )
                }
              </h3>

              <div className="actions">
                {
                  (
                    [
                      'ora',
                      '1-2h',
                      'oggi',
                      'offline'
                    ]
                    as Availability[]
                  ).map(
                    value => (
                      <button
                        key={
                          value
                        }
                        className={
                          availability ===
                            value
                            ? 'full'
                            : 'outline'
                        }
                        onClick={
                          () =>
                            setAvail(
                              value
                            )
                        }
                      >
                        {
                          availabilityLabel(
                            value
                          )
                        }
                      </button>
                    )
                  )
                }
              </div>
            </div>

            <div
              className="card"
              style={{
                marginTop:
                  16
              }}
            >
              <span className="tag">
                Categorie
              </span>

              <div
                className="grid"
                style={{
                  marginTop:
                    12
                }}
              >
                {
                  categories.map(
                    category => (
                      <button
                        key={
                          category.id
                        }
                        className={
                          selectedProCats
                            .includes(
                              category.id
                            )
                            ? 'cat selected'
                            : 'cat'
                        }
                        onClick={
                          () =>
                            setSelectedProCats(
                              current =>
                                current.includes(
                                  category.id
                                )
                                  ? current
                                      .filter(
                                        id =>
                                          id !==
                                          category.id
                                      )
                                  : [
                                      ...current,
                                      category.id
                                    ]
                            )
                        }
                      >
                        {
                          selectedProCats
                            .includes(
                              category.id
                            )
                            ? '✓ '
                            : ''
                        }

                        {
                          category.name
                        }
                      </button>
                    )
                  )
                }
              </div>

              <div className="actions">
                <button
                  className="full"
                  onClick={
                    saveCategories
                  }
                >
                  Salva categorie
                </button>
              </div>
            </div>

            <div
              className="card"
              style={{
                marginTop:
                  16
              }}
            >
              <span className="tag">
                Posizione e raggio
              </span>

              <h3>
                Raggio massimo:{' '}
                {
                  maxDistance
                } km
              </h3>

              <div className="actions">
                <button
                  className="full"
                  onClick={
                    setProLocation
                  }
                >
                  📍 Aggiorna posizione
                </button>

                {
                  distances.map(
                    value => (
                      <button
                        key={
                          value
                        }
                        className={
                          maxDistance ===
                            value
                            ? 'full'
                            : 'outline'
                        }
                        onClick={
                          () =>
                            setRadius(
                              value
                            )
                        }
                      >
                        {
                          value
                        } km
                      </button>
                    )
                  )
                }
              </div>
            </div>

            <div
              style={{
                marginTop:
                  34
              }}
            >
              <span className="tag">
                Lavori
              </span>

              <h2>
                Lavori e storico
              </h2>

              {
                !verified
                &&
                (
                  <div className="notice">
                    🔒 Il matching è visibile solo dopo la verifica amministratore.
                  </div>
                )
              }

              <div className="filter">
                {
                  (
                    [
                      'tutti',
                      'aperta',
                      'accettata',
                      'completata'
                    ]
                    as ProFilter[]
                  ).map(
                    filter => (
                      <button
                        key={
                          filter
                        }
                        className={
                          proFilter ===
                            filter
                            ? 'selected'
                            : ''
                        }
                        onClick={
                          () =>
                            setProFilter(
                              filter
                            )
                        }
                      >
                        {
                          filter ===
                            'tutti'
                            ? 'Tutti'
                            : filter ===
                                'aperta'
                              ? 'Da accettare'
                              : filter ===
                                  'accettata'
                                ? 'Accettati'
                                : 'Completati'
                        }
                      </button>
                    )
                  )
                }
              </div>

              {
                verified
                &&
                openProfessionalJobs
                  .map(
                    job => (
                      <article
                        className="card job"
                        key={
                          `matching-${job.id}`
                        }
                      >
                        <div className="job-top">
                          <div>
                            <span className="status">
                              🔴 DA ACCETTARE
                            </span>

                            <h3>
                              {
                                job.category_name
                                ||
                                'Intervento'
                              }
                            </h3>
                          </div>

                          <b>
                            {
                              job.urgency
                                ?.toUpperCase()
                            }
                          </b>
                        </div>

                        <p>
                          {
                            job.description
                          }
                        </p>

                        <Photo
                          id={
                            job.id
                          }
                        />

                        <p className="muted">
                          🔒 Indirizzo completo dopo l’accettazione
                        </p>

                        {
                          job.distance_km
                          != null
                          &&
                          (
                            <p>
                              📍{' '}
                              {
                                Number(
                                  job.distance_km
                                )
                                  .toFixed(1)
                              } km
                              {' · '}
                              ⏱{' '}
                              {
                                etaLabel(
                                  job.eta_minutes
                                )
                              }
                            </p>
                          )
                        }

                        <button
                          className="full"
                          disabled={
                            busy
                            ||
                            availability ===
                              'offline'
                          }
                          onClick={
                            () =>
                              acceptJob(
                                job.id
                              )
                          }
                        >
                          {
                            availability ===
                              'offline'
                              ? 'Sei offline'
                              : 'Accetta lavoro →'
                          }
                        </button>
                      </article>
                    )
                  )
              }

              {
                verified
                &&
                filteredAcceptedJobs
                  .map(
                    job => (
                      <article
                        className="card job"
                        key={
                          `accepted-${job.id}`
                        }
                      >
                        <span className="status">
                          {
                            statusLabel(
                              job.status
                            )
                          }
                        </span>

                        <h3>
                          {
                            job.category_name
                            ||
                            'Intervento'
                          }
                        </h3>

                        <p>
                          {
                            job.description
                          }
                        </p>

                        <Photo
                          id={
                            job.id
                          }
                        />

                        {
                          job.address
                          &&
                          (
                            <div className="success">
                              📍{' '}
                              <b>
                                Indirizzo intervento
                              </b>
                              <br />
                              {
                                job.address
                              }
                            </div>
                          )
                        }

                        <div className="actions">
                          <button
                            className="full"
                            onClick={
                              () =>
                                openChat(
                                  job.id,
                                  job.category_name
                                  ||
                                  'Intervento'
                                )
                            }
                          >
                            💬 Chat
                          </button>

                          {
                            job.status !==
                              'completata'
                            &&
                            (
                              <button
                                className="outline"
                                onClick={
                                  () =>
                                    completeJob(
                                      job.id
                                    )
                                }
                              >
                                ✓ Completa
                              </button>
                            )
                          }
                        </div>
                      </article>
                    )
                  )
              }
            </div>

            <div
              style={{
                marginTop:
                  34
              }}
            >
              <span className="tag">
                Recensioni
              </span>

              <h2>
                Le mie recensioni
              </h2>

              {
                reviews.map(
                  review => (
                    <div
                      className="card job"
                      key={
                        review.review_id
                      }
                    >
                      <b>
                        {
                          '⭐'
                            .repeat(
                              Number(
                                review.rating
                              )
                            )
                        }
                      </b>

                      <h3>
                        {
                          review.client_name
                          ||
                          'Cliente'
                        }
                      </h3>

                      <p>
                        {
                          review.comment
                          ||
                          'Nessun commento.'
                        }
                      </p>
                    </div>
                  )
                )
              }
            </div>
          </section>
        </div>

        <footer>
          © 2026 LavoroSubito · MVP 1.0
        </footer>

        {
          chatJobId
          &&
          renderChatModal()
        }
      </main>
    );
  }

  return (
    <main>
      <header>
        <div className="logo">
          <b>L</b>
          Lavoro
          <span>
            Subito
          </span>
        </div>

        {
          user
            ? (
              <button
                className="outline"
                onClick={
                  logout
                }
              >
                Esci
              </button>
            )
            : (
              <button
                className="outline"
                onClick={
                  () => {
                    setAuthMode(
                      'login'
                    );

                    setAuthOpen(
                      true
                    );
                  }
                }
              >
                Accedi / Registrati
              </button>
            )
        }
      </header>

      <div className="container">
        <section className="hero">
          <div>
            <span className="tag">
              ● Interventi urgenti
            </span>

            <h1>
              Un problema?
              <br />
              <span>
                Risolviamolo subito.
              </span>
            </h1>

            <p>
              Trova un professionista verificato, disponibile e vicino a te.
            </p>
          </div>

          <div className="card">
            <span className="tag">
              MVP 1.0
            </span>

            <h2>
              Di cosa hai bisogno?
            </h2>

            <div className="grid">
              {
                cats.map(
                  (
                    [
                      name,
                      icon
                    ]
                  ) => (
                    <button
                      key={
                        name
                      }
                      className={
                        cat ===
                          name
                          ? 'cat selected'
                          : 'cat'
                      }
                      onClick={
                        () =>
                          setCat(
                            name
                          )
                      }
                    >
                      <strong>
                        {
                          icon
                        }
                      </strong>

                      {
                        name
                      }
                    </button>
                  )
                )
              }
            </div>

            <div className="urg">
              {
                [
                  'SUBITO',
                  'OGGI',
                  '48H'
                ].map(
                  value => (
                    <button
                      key={
                        value
                      }
                      className={
                        urgency ===
                          value
                          ? 'selected'
                          : ''
                      }
                      onClick={
                        () =>
                          setUrgency(
                            value
                          )
                      }
                    >
                      {
                        value
                      }
                    </button>
                  )
                )
              }
            </div>

            <label>
              Descrivi il problema
            </label>

            <textarea
              rows={4}
              value={
                description
              }
              onChange={
                event =>
                  setDescription(
                    event
                      .target
                      .value
                  )
              }
              placeholder="Es. Perdita d’acqua sotto il lavandino..."
            />

            <label>
              📷 Foto del problema
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={
                choosePhoto
              }
            />

            <div className="small muted">
              Facoltativa · massimo 10 MB
            </div>

            {
              photoPreview
              &&
              (
                <>
                  <img
                    className="photo"
                    src={
                      photoPreview
                    }
                    alt="Anteprima"
                  />

                  <button
                    className="danger"
                    onClick={
                      clearPhoto
                    }
                  >
                    Rimuovi foto
                  </button>
                </>
              )
            }

            <label>
              📍 Indirizzo intervento
            </label>

            <input
              value={
                address
              }
              onChange={
                event =>
                  setAddress(
                    event
                      .target
                      .value
                  )
              }
              placeholder="Es. Via Roma 15, Urbino"
            />

            <div className="actions">
              <button
                className="outline"
                onClick={
                  async () => {
                    const position =
                      await getPosition();

                    setCoords(
                      position
                    );

                    setMessage(
                      position
                        ? '📍 Posizione GPS rilevata.'
                        : 'Posizione non disponibile.'
                    );
                  }
                }
              >
                {
                  coords
                    ? '✅ GPS rilevato'
                    : '📍 Usa posizione GPS'
                }
              </button>

              <button
                className="full"
                disabled={
                  busy
                }
                onClick={
                  submitJob
                }
              >
                {
                  busy
                    ? 'Invio...'
                    : 'Trova chi è disponibile →'
                }
              </button>
            </div>

            {
              message
              &&
              (
                <div className="success">
                  {
                    message
                  }
                </div>
              )
            }

            {
              bestMatch
              &&
              (
                <div
                  className="card"
                  style={{
                    marginTop:
                      16,

                    borderColor:
                      '#48b779'
                  }}
                >
                  <span className="tag">
                    Professionista compatibile
                  </span>

                  <h3>
                    {
                      bestMatch
                        .professional_name
                    }
                  </h3>

                  <p>
                    🎯{' '}
                    {
                      bestMatch
                        .match_score
                    }/100
                    {' · '}
                    ⭐{' '}
                    {
                      Number(
                        bestMatch
                          .average_rating
                      )
                        .toFixed(1)
                    }
                    {' · '}
                    {
                      bestMatch
                        .review_count
                    } recensioni
                  </p>

                  <p>
                    {
                      availabilityLabel(
                        bestMatch
                          .availability_status
                      )
                    }
                    {' · '}
                    📍{' '}
                    {
                      bestMatch
                        .distance_km
                        ?.toFixed?.(1)
                      ?? '—'
                    } km
                  </p>
                </div>
              )
            }
          </div>
        </section>

        {
          user
          &&
          role ===
            'cliente'
          &&
          (
            <section className="section">
              <span className="tag">
                Storico cliente
              </span>

              <h2>
                Le mie richieste
              </h2>

              <div
                className={
                  live
                    ? 'success'
                    : 'notice'
                }
              >
                {
                  live
                    ? '🟢 Stato LIVE'
                    : '🟡 Connessione LIVE...'
                }
              </div>

              <div className="filter">
                {
                  (
                    [
                      'tutti',
                      'aperta',
                      'accettata',
                      'completata',
                      'annullata'
                    ]
                    as ClientFilter[]
                  ).map(
                    filter => (
                      <button
                        key={
                          filter
                        }
                        className={
                          clientFilter ===
                            filter
                            ? 'selected'
                            : ''
                        }
                        onClick={
                          () =>
                            setClientFilter(
                              filter
                            )
                        }
                      >
                        {
                          filter ===
                            'tutti'
                            ? 'Tutti'
                            : filter
                        }
                      </button>
                    )
                  )
                }
              </div>

              {
                filteredClient
                  .map(
                    job => (
                      <article
                        className="card job"
                        key={
                          job.id
                        }
                      >
                        <span className="status">
                          {
                            statusLabel(
                              job.status
                            )
                          }
                        </span>

                        <h3>
                          {
                            job.category_name
                            ||
                            'Intervento'
                          }
                        </h3>

                        <p>
                          {
                            job.description
                          }
                        </p>

                        <Photo
                          id={
                            job.id
                          }
                        />

                        {
                          job.address
                          &&
                          (
                            <div className="notice">
                              📍{' '}
                              <b>
                                Indirizzo intervento
                              </b>
                              <br />
                              {
                                job.address
                              }
                            </div>
                          )
                        }

                        <p>
                          <b>
                            Urgenza:
                          </b>{' '}
                          {
                            job.urgency
                              ?.toUpperCase()
                          }
                        </p>

                        {
                          job.professional_name
                          &&
                          (
                            <div className="success">
                              ✅{' '}
                              {
                                job.professional_name
                              }
                            </div>
                          )
                        }

                        <div className="actions">
                          {
                            job.status ===
                              'aperta'
                            &&
                            (
                              <button
                                className="danger"
                                onClick={
                                  () =>
                                    cancelJob(
                                      job.id
                                    )
                                }
                              >
                                ❌ Annulla richiesta
                              </button>
                            )
                          }

                          {
                            (
                              job.status ===
                                'accettata'
                              ||
                              job.status ===
                                'completata'
                            )
                            &&
                            (
                              <button
                                className="full"
                                onClick={
                                  () =>
                                    openChat(
                                      job.id,
                                      job.professional_name
                                      ||
                                      'Intervento'
                                    )
                                }
                              >
                                💬 Chat
                              </button>
                            )
                          }

                          {
                            job.status ===
                              'accettata'
                            &&
                            (
                              <button
                                className="outline"
                                onClick={
                                  () =>
                                    completeJob(
                                      job.id
                                    )
                                }
                              >
                                ✓ Completa
                              </button>
                            )
                          }

                          {
                            job.status ===
                              'completata'
                            &&
                            !job.reviewed
                            &&
                            (
                              <button
                                className="outline"
                                onClick={
                                  () => {
                                    setReviewJobId(
                                      job.id
                                    );

                                    setRating(
                                      5
                                    );
                                  }
                                }
                              >
                                ⭐ Recensisci
                              </button>
                            )
                          }
                        </div>
                      </article>
                    )
                  )
              }
            </section>
          )
        }
      </div>

      <footer>
        © 2026 LavoroSubito · MVP 1.0
      </footer>

      {
        authOpen
        &&
        (
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
                onClick={
                  () =>
                    setAuthOpen(
                      false
                    )
                }
              >
                ×
              </button>

              <h2>
                {
                  authMode ===
                    'signup'
                    ? 'Crea account'
                    : 'Bentornato'
                }
              </h2>

              <div className="actions">
                <button
                  type="button"
                  className={
                    authMode ===
                      'login'
                      ? 'full'
                      : 'outline'
                  }
                  onClick={
                    () =>
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
                  onClick={
                    () =>
                      setAuthMode(
                        'signup'
                      )
                  }
                >
                  Registrati
                </button>
              </div>

              {
                authMode ===
                  'signup'
                &&
                (
                  <>
                    <label>
                      Nome e cognome
                    </label>

                    <input
                      required
                      value={
                        authName
                      }
                      onChange={
                        event =>
                          setAuthName(
                            event
                              .target
                              .value
                          )
                      }
                    />

                    <label>
                      Tipo account
                    </label>

                    <select
                      value={
                        signupRole
                      }
                      onChange={
                        event =>
                          setSignupRole(
                            event
                              .target
                              .value
                            as Role
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
                )
              }

              <label>
                Email
              </label>

              <input
                type="email"
                required
                value={
                  email
                }
                onChange={
                  event =>
                    setEmail(
                      event
                        .target
                        .value
                    )
                }
              />

              <label>
                Password
              </label>

              <input
                type="password"
                minLength={
                  6
                }
                required
                value={
                  password
                }
                onChange={
                  event =>
                    setPassword(
                      event
                        .target
                        .value
                    )
                }
              />

              <button
                className="full"
                style={{
                  marginTop:
                    14
                }}
                disabled={
                  busy
                }
              >
                {
                  busy
                    ? 'Attendi...'
                    : authMode ===
                        'signup'
                      ? 'Crea account'
                      : 'Accedi'
                }
              </button>
            </form>
          </div>
        )
      }

      {
        chatJobId
        &&
        renderChatModal()
      }

      {
        reviewJobId
        &&
        (
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
                  () =>
                    setReviewJobId(
                      null
                    )
                }
              >
                ×
              </button>

              <span className="tag">
                Recensione
              </span>

              <h2>
                Valuta l’intervento
              </h2>

              <div className="actions">
                {
                  [
                    1,
                    2,
                    3,
                    4,
                    5
                  ].map(
                    stars => (
                      <button
                        type="button"
                        key={
                          stars
                        }
                        className={
                          rating ===
                            stars
                            ? 'full'
                            : 'outline'
                        }
                        onClick={
                          () =>
                            setRating(
                              stars
                            )
                        }
                      >
                        {
                          stars
                        } ⭐
                      </button>
                    )
                  )
                }
              </div>

              <label>
                Commento
              </label>

              <textarea
                rows={4}
                value={
                  reviewComment
                }
                onChange={
                  event =>
                    setReviewComment(
                      event
                        .target
                        .value
                    )
                }
              />

              <button
                className="full"
                style={{
                  marginTop:
                    12
                }}
              >
                Invia recensione
              </button>
            </form>
          </div>
        )
      }
    </main>
  );
}
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState
} from 'react';

import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Role =
  | 'cliente'
  | 'professionista';

type Availability =
  | 'ora'
  | '1-2h'
  | 'oggi'
  | 'offline';

type ClientFilter =
  | 'tutti'
  | 'aperta'
  | 'accettata'
  | 'completata'
  | 'annullata';

type ProFilter =
  | 'tutti'
  | 'aperta'
  | 'accettata'
  | 'completata';

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Job = {
  id: string;
  description: string;
  urgency: string;
  status: string;
  created_at?: string;
  category_name?: string | null;
  distance_km?: number | null;
  eta_minutes?: number | null;
  address?: string | null;
  professional_name?: string | null;
  reviewed?: boolean;
};

type Review = {
  review_id: string;
  rating: number;
  comment?: string | null;
  created_at?: string;
  client_name?: string | null;
};

type Match = {
  professional_id: string;
  professional_name: string;
  availability_status: string;
  average_rating: number;
  review_count: number;
  distance_km: number | null;
  eta_minutes: number | null;
  match_score: number;
};

type Message = {
  id: string;
  job_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type Identity = {
  business_name?: string | null;
  phone?: string | null;
  vat_number?: string | null;
  tax_code?: string | null;
  verification_status?: string | null;
  verified?: boolean | null;
};

type Setup = {
  categories_count: number;
  has_categories: boolean;
  has_location: boolean;
  has_radius: boolean;
  has_availability: boolean;
  setup_complete: boolean;
};

const cats = [
  ['Idraulico', '🔧'],
  ['Elettricista', '⚡'],
  ['Fabbro', '🔑'],
  ['Caldaia', '🔥'],
  ['Climatizzatore', '❄️'],
  ['Serramenti', '🪟'],
  ['Meccanico', '🚗'],
  ['Altro', '🏠']
] as const;

const distances = [
  10,
  20,
  30,
  50,
  100
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replaceAll(' ', '-');
}

function availabilityLabel(value: string) {
  if (value === 'ora') {
    return '🟢 Disponibile ora';
  }

  if (value === '1-2h') {
    return '🟡 Entro 1–2 ore';
  }

  if (value === 'oggi') {
    return '🟠 Disponibile oggi';
  }

  return '⚫ Offline';
}

function etaLabel(value?: number | null) {
  if (value == null) {
    return 'Tempo non disponibile';
  }

  if (value < 60) {
    return `Circa ${value} min`;
  }

  const hours =
    Math.floor(value / 60);

  const minutes =
    value % 60;

  return minutes
    ? `Circa ${hours} h ${minutes} min`
    : `Circa ${hours} h`;
}

function statusLabel(status: string) {
  if (status === 'aperta') {
    return '🔴 RICERCA IN CORSO';
  }

  if (status === 'accettata') {
    return '🟢 ACCETTATA';
  }

  if (status === 'completata') {
    return '✅ COMPLETATA';
  }

  if (status === 'annullata') {
    return '⚫ ANNULLATA';
  }

  return status.toUpperCase();
}

export default function Home() {
  const [user, setUser] =
    useState<User | null>(null);

  const [role, setRole] =
    useState<Role | null>(null);

  const [fullName, setFullName] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const [live, setLive] =
    useState(false);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [
    selectedProCats,
    setSelectedProCats
  ] =
    useState<string[]>([]);

  const [
    availability,
    setAvailability
  ] =
    useState<Availability>(
      'offline'
    );

  const [
    maxDistance,
    setMaxDistance
  ] =
    useState(30);

  const [setup, setSetup] =
    useState<Setup | null>(null);

  const [identity, setIdentity] =
    useState<Identity>({});

  const [reviews, setReviews] =
    useState<Review[]>([]);

  const [clientJobs, setClientJobs] =
    useState<Job[]>([]);

  const [
    matchingJobs,
    setMatchingJobs
  ] =
    useState<Job[]>([]);

  const [
    acceptedJobs,
    setAcceptedJobs
  ] =
    useState<Job[]>([]);

  const [
    clientFilter,
    setClientFilter
  ] =
    useState<ClientFilter>(
      'tutti'
    );

  const [
    proFilter,
    setProFilter
  ] =
    useState<ProFilter>(
      'tutti'
    );

  const [cat, setCat] =
    useState('');

  const [urgency, setUrgency] =
    useState('SUBITO');

  const [
    description,
    setDescription
  ] =
    useState('');

  const [address, setAddress] =
    useState('');

  const [coords, setCoords] =
    useState<{
      latitude: number;
      longitude: number;
    } | null>(null);

  const [
    photoFile,
    setPhotoFile
  ] =
    useState<File | null>(null);

  const [
    photoPreview,
    setPhotoPreview
  ] =
    useState('');

  const [
    jobPhotos,
    setJobPhotos
  ] =
    useState<
      Record<
        string,
        string | null | undefined
      >
    >({});

  const [
    bestMatch,
    setBestMatch
  ] =
    useState<Match | null>(
      null
    );

  const [
    authOpen,
    setAuthOpen
  ] =
    useState(false);

  const [
    authMode,
    setAuthMode
  ] =
    useState<
      'login'
      | 'signup'
    >('login');

  const [
    signupRole,
    setSignupRole
  ] =
    useState<Role>(
      'cliente'
    );

  const [
    authName,
    setAuthName
  ] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [
    password,
    setPassword
  ] =
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
  ] =
    useState('');

  const [
    messages,
    setMessages
  ] =
    useState<Message[]>([]);

  const [
    chatText,
    setChatText
  ] =
    useState('');

  const [
    reviewJobId,
    setReviewJobId
  ] =
    useState<string | null>(
      null
    );

  const [rating, setRating] =
    useState(5);

  const [
    reviewComment,
    setReviewComment
  ] =
    useState('');

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(
        ({ data }) => {
          setUser(
            data.user
          );

          if (data.user) {
            void loadProfile(
              data.user.id
            );
          }
        }
      );

    const { data } =
      supabase.auth
        .onAuthStateChange(
          (
            _event,
            session
          ) => {
            const currentUser =
              session?.user
              ?? null;

            setUser(
              currentUser
            );

            if (
              currentUser
            ) {
              void loadProfile(
                currentUser.id
              );
            } else {
              reset();
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
      !user
      ||
      !role
    ) {
      return;
    }

    const channel =
      supabase
        .channel(
          `lavorosubito-mvp-${user.id}`
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'jobs'
          },
          async () => {
            if (
              role ===
              'cliente'
            ) {
              await loadClientJobs();
            } else {
              await loadMatchingJobs();
              await loadAcceptedJobs();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          async payload => {
            const row =
              payload.new as {
                job_id?: string;
              };

            if (
              chatJobId
              &&
              row.job_id ===
                chatJobId
            ) {
              await loadChat(
                chatJobId
              );
            }
          }
        )
        .subscribe(
          status => {
            setLive(
              status ===
              'SUBSCRIBED'
            );
          }
        );

    return () => {
      setLive(false);

      void supabase
        .removeChannel(
          channel
        );
    };
  }, [
    user?.id,
    role,
    chatJobId
  ]);

  function reset() {
    setRole(null);
    setFullName('');
    setMessage('');
    setClientJobs([]);
    setMatchingJobs([]);
    setAcceptedJobs([]);
    setSelectedProCats([]);
    setAvailability(
      'offline'
    );
    setSetup(null);
    setIdentity({});
    setReviews([]);
    setBestMatch(null);
    clearPhoto();
    setJobPhotos({});
  }

  async function loadProfile(
    id: string
  ) {
    const { data } =
      await supabase
        .from('profiles')
        .select(
          'role,full_name'
        )
        .eq(
          'id',
          id
        )
        .maybeSingle();

    const detected: Role =
      data?.role ===
        'professionista'
        ? 'professionista'
        : 'cliente';

    setRole(
      detected
    );

    setFullName(
      data?.full_name
      ?? ''
    );

    const {
      data: categoryRows
    } =
      await supabase
        .from(
          'categories'
        )
        .select(
          'id,name,slug'
        )
        .order(
          'name'
        );

    setCategories(
      (
        categoryRows
        ?? []
      ) as Category[]
    );

    if (
      detected ===
      'cliente'
    ) {
      await loadClientJobs();
    } else {
      await Promise.all([
        loadProfessional(),
        loadMatchingJobs(),
        loadAcceptedJobs(),
        loadReviews()
      ]);
    }
  }

  async function loadProfessional() {
    const [
      identityResponse,
      categoryResponse,
      setupResponse,
      availabilityResponse
    ] =
      await Promise.all([
        supabase.rpc(
          'my_professional_identity'
        ),

        supabase.rpc(
          'my_professional_categories'
        ),

        supabase.rpc(
          'my_professional_setup_status'
        ),

        supabase.rpc(
          'my_professional_availability'
        )
      ]);

    if (
      identityResponse
        .data?.[0]
    ) {
      setIdentity(
        identityResponse
          .data[0]
        as Identity
      );
    }

    setSelectedProCats(
      (
        categoryResponse
          .data
        ?? []
      ).map(
        (row: any) =>
          row.category_id
      )
    );

    if (
      setupResponse
        .data?.[0]
    ) {
      setSetup(
        setupResponse
          .data[0]
        as Setup
      );
    }

    if (
      availabilityResponse
        .data
    ) {
      setAvailability(
        availabilityResponse
          .data
        as Availability
      );
    }

    const {
      data: {
        user:
          currentUser
      }
    } =
      await supabase.auth
        .getUser();

    if (
      currentUser
    ) {
      const {
        data:
          professionalRow
      } =
        await supabase
          .from(
            'professionals'
          )
          .select(
            'max_distance_km'
          )
          .eq(
            'id',
            currentUser.id
          )
          .maybeSingle();

      if (
        professionalRow
          ?.max_distance_km
        != null
      ) {
        setMaxDistance(
          professionalRow
            .max_distance_km
        );
      }
    }
  }

  async function loadClientJobs() {
    const {
      data,
      error
    } =
      await supabase.rpc(
        'my_client_jobs'
      );

    if (error) {
      setMessage(
        `Errore richieste: ${error.message}`
      );

      return;
    }

    const rows =
      (
        data
        ?? []
      ) as Job[];

    setClientJobs(
      rows
    );

    void loadPhotos(
      rows.map(
        row => row.id
      )
    );
  }

  async function loadMatchingJobs() {
    const {
      data,
      error
    } =
      await supabase.rpc(
        'my_matching_jobs'
      );

    if (error) {
      setMatchingJobs([]);
      return;
    }

    const rows =
      (
        data
        ?? []
      ) as Job[];

    setMatchingJobs(
      rows
    );

    void loadPhotos(
      rows.map(
        row => row.id
      )
    );
  }

  async function loadAcceptedJobs() {
    const {
      data
    } =
      await supabase.rpc(
        'my_accepted_jobs'
      );

    const rows =
      (
        data
        ?? []
      ) as Job[];

    setAcceptedJobs(
      rows
    );

    void loadPhotos(
      rows.map(
        row => row.id
      )
    );
  }

  async function loadReviews() {
    const {
      data
    } =
      await supabase.rpc(
        'my_professional_reviews'
      );

    setReviews(
      (
        data
        ?? []
      ) as Review[]
    );
  }

  async function getPosition() {
    return new Promise<
      {
        latitude: number;
        longitude: number;
      } | null
    >(resolve => {
      if (
        !navigator
          .geolocation
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
          () => {
            resolve(null);
          },
          {
            enableHighAccuracy:
              true,

            timeout:
              12000,

            maximumAge:
              60000
          }
        );
    });
  }

  function choosePhoto(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target
        .files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type
        .startsWith(
          'image/'
        )
    ) {
      setMessage(
        'Seleziona un’immagine.'
      );

      return;
    }

    if (
      file.size
      >
      10
      * 1024
      * 1024
    ) {
      setMessage(
        'La foto supera 10 MB.'
      );

      return;
    }

    if (
      photoPreview
    ) {
      URL
        .revokeObjectURL(
          photoPreview
        );
    }

    setPhotoFile(
      file
    );

    setPhotoPreview(
      URL
        .createObjectURL(
          file
        )
    );
  }

  function clearPhoto() {
    if (
      photoPreview
    ) {
      URL
        .revokeObjectURL(
          photoPreview
        );
    }

    setPhotoFile(
      null
    );

    setPhotoPreview(
      ''
    );
  }

  async function uploadPhoto(
    jobId: string
  ) {
    if (
      !photoFile
      ||
      !user
    ) {
      return true;
    }

    const extension =
      (
        photoFile
          .name
          .split('.')
          .pop()
        ?? 'jpg'
      )
        .replace(
          /[^a-zA-Z0-9]/g,
          ''
        )
        .toLowerCase();

    const path =
      `${user.id}/${jobId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const upload =
      await supabase
        .storage
        .from(
          'job-photos'
        )
        .upload(
          path,
          photoFile,
          {
            contentType:
              photoFile.type,

            upsert:
              false
          }
        );

    if (
      upload.error
    ) {
      setMessage(
        `Richiesta creata, foto non caricata: ${upload.error.message}`
      );

      return false;
    }

    const save =
      await supabase.rpc(
        'set_my_job_photo',
        {
          p_job_id:
            jobId,

          p_photo_url:
            path
        }
      );

    if (
      save.error
      ||
      save.data === false
    ) {
      await supabase
        .storage
        .from(
          'job-photos'
        )
        .remove([
          path
        ]);

      setMessage(
        `Richiesta creata, foto non collegata: ${save.error?.message ?? 'errore'}`
      );

      return false;
    }

    return true;
  }

  async function loadPhoto(
    jobId: string
  ) {
    if (
      jobPhotos[
        jobId
      ] !== undefined
    ) {
      return;
    }

    const {
      data
    } =
      await supabase.rpc(
        'get_job_photo_url',
        {
          p_job_id:
            jobId
        }
      );

    if (!data) {
      setJobPhotos(
        current => ({
          ...current,
          [jobId]:
            null
        })
      );

      return;
    }

    const download =
      await supabase
        .storage
        .from(
          'job-photos'
        )
        .download(
          String(data)
        );

    if (
      download.error
      ||
      !download.data
    ) {
      setJobPhotos(
        current => ({
          ...current,
          [jobId]:
            null
        })
      );

      return;
    }

    setJobPhotos(
      current => ({
        ...current,

        [jobId]:
          URL
            .createObjectURL(
              download.data
            )
      })
    );
  }

  async function loadPhotos(
    ids: string[]
  ) {
    for (
      const id
      of ids
    ) {
      await loadPhoto(
        id
      );
    }
  }

  async function submitJob() {
    if (
      !cat
      ||
      !description.trim()
      ||
      !address.trim()
    ) {
      setMessage(
        'Completa categoria, descrizione e indirizzo.'
      );

      return;
    }

    if (!user) {
      setSignupRole(
        'cliente'
      );

      setAuthMode(
        'signup'
      );

      setAuthOpen(
        true
      );

      return;
    }

    setBusy(true);
    setMessage('');
    setBestMatch(null);

    let position =
      coords;

    if (!position) {
      position =
        await getPosition();

      if (position) {
        setCoords(
          position
        );
      }
    }

    const {
      data: category
    } =
      await supabase
        .from(
          'categories'
        )
        .select(
          'id'
        )
        .eq(
          'slug',
          slugify(cat)
        )
        .maybeSingle();

    if (!category) {
      setBusy(false);

      setMessage(
        'Categoria non trovata.'
      );

      return;
    }

    const insert =
      await supabase
        .from(
          'jobs'
        )
        .insert({
          client_id:
            user.id,

          category_id:
            category.id,

          urgency:
            urgency
              .toLowerCase(),

          description:
            description
              .trim(),

          address:
            address
              .trim(),

          latitude:
            position
              ?.latitude
            ?? null,

          longitude:
            position
              ?.longitude
            ?? null
        })
        .select(
          'id'
        )
        .single();

    if (
      insert.error
      ||
      !insert.data
    ) {
      setBusy(false);

      setMessage(
        `Errore: ${insert.error?.message ?? 'creazione richiesta'}`
      );

      return;
    }

    const jobId =
      insert.data.id
      as string;

    await uploadPhoto(
      jobId
    );

    clearPhoto();

    setDescription(
      ''
    );

    setAddress(
      ''
    );

    await loadClientJobs();

    const matching =
      await supabase.rpc(
        'find_verified_professionals_for_job',
        {
          p_job_id:
            jobId
        }
      );

    const first =
      (
        matching.data
        ?? []
      )[0]
      as
        | Match
        | undefined;

    setBestMatch(
      first
      ?? null
    );

    try {
      const {
        data: {
          session
        }
      } =
        await supabase
          .auth
          .getSession();

      if (
        session
          ?.access_token
      ) {
        await fetch(
          '/api/push/send',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${session.access_token}`
            },

            body:
              JSON.stringify({
                jobId
              })
          }
        );
      }
    } catch {
    }

    setMessage(
      first
        ? '✅ Professionista compatibile trovato.'
        : '✅ Richiesta creata. Nessun professionista compatibile al momento.'
    );

    setBusy(false);
  }

  async function cancelJob(
    id: string
  ) {
    if (
      !confirm(
        'Vuoi annullare la richiesta?'
      )
    ) {
      return;
    }

    const {
      data,
      error
    } =
      await supabase.rpc(
        'cancel_my_job',
        {
          p_job_id:
            id
        }
      );

    setMessage(
      error
        ? error.message
        : data
          ? '✅ Richiesta annullata.'
          : 'Richiesta non annullabile.'
    );

    await loadClientJobs();
  }

  async function acceptJob(
    id: string
  ) {
    setBusy(true);

    const {
      data,
      error
    } =
      await supabase.rpc(
        'accept_verified_job',
        {
          p_job_id:
            id
        }
      );

    setMessage(
      error
        ? `Errore: ${error.message}`
        : data
          ? '✅ Lavoro accettato.'
          : 'Lavoro già accettato.'
    );

    await Promise.all([
      loadMatchingJobs(),
      loadAcceptedJobs()
    ]);

    setBusy(false);
  }

  async function completeJob(
    id: string
  ) {
    if (
      !confirm(
        'Confermi intervento completato?'
      )
    ) {
      return;
    }

    const {
      data,
      error
    } =
      await supabase.rpc(
        'complete_job',
        {
          p_job_id:
            id
        }
      );

    setMessage(
      error
        ? error.message
        : data
          ? '✅ Intervento completato.'
          : 'Operazione non riuscita.'
    );

    if (
      role ===
      'cliente'
    ) {
      await loadClientJobs();
    } else {
      await loadAcceptedJobs();
    }
  }

  async function openChat(
    id: string,
    title: string
  ) {
    setChatJobId(
      id
    );

    setChatTitle(
      title
    );

    setChatText(
      ''
    );

    await loadChat(
      id
    );
  }

  async function loadChat(
    id: string
  ) {
    const {
      data,
      error
    } =
      await supabase
        .from(
          'messages'
        )
        .select(
          'id,job_id,sender_id,message,created_at'
        )
        .eq(
          'job_id',
          id
        )
        .order(
          'created_at'
        );

    if (error) {
      setMessage(
        error.message
      );
    } else {
      setMessages(
        (
          data
          ?? []
        ) as Message[]
      );
    }
  }

  async function sendMessage(
    event:
      FormEvent
  ) {
    event.preventDefault();

    if (
      !user
      ||
      !chatJobId
      ||
      !chatText.trim()
    ) {
      return;
    }

    const {
      error
    } =
      await supabase
        .from(
          'messages'
        )
        .insert({
          job_id:
            chatJobId,

          sender_id:
            user.id,

          message:
            chatText
              .trim()
        });

    if (error) {
      setMessage(
        error.message
      );
    } else {
      setChatText(
        ''
      );

      await loadChat(
        chatJobId
      );
    }
  }

  async function submitReview(
    event:
      FormEvent
  ) {
    event.preventDefault();

    if (
      !reviewJobId
    ) {
      return;
    }

    const {
      data,
      error
    } =
      await supabase.rpc(
        'create_review',
        {
          p_job_id:
            reviewJobId,

          p_rating:
            rating,

          p_comment:
            reviewComment
              .trim()
            || null
        }
      );

    setMessage(
      error
        ? error.message
        : data
          ? '⭐ Recensione inviata.'
          : 'Recensione non inviata.'
    );

    setReviewJobId(
      null
    );

    setReviewComment(
      ''
    );

    await loadClientJobs();
  }

  async function authSubmit(
    event:
      FormEvent
  ) {
    event.preventDefault();

    setBusy(true);
    setMessage('');

    if (
      authMode ===
      'signup'
    ) {
      const {
        error
      } =
        await supabase.auth
          .signUp({
            email,
            password,

            options: {
              data: {
                full_name:
                  authName,

                role:
                  signupRole
              }
            }
          });

      setMessage(
        error
          ? error.message
          : '✅ Registrazione completata. Controlla la tua email.'
      );

      if (!error) {
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
        setAuthOpen(
          false
        );

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

    reset();
  }

  async function saveIdentity() {
    const {
      data,
      error
    } =
      await supabase.rpc(
        'update_my_professional_identity',
        {
          p_business_name:
            identity
              .business_name
              ?.trim()
            || '',

          p_phone:
            identity
              .phone
              ?.trim()
            || '',

          p_vat_number:
            identity
              .vat_number
              ?.trim()
            || '',

          p_tax_code:
            identity
              .tax_code
              ?.trim()
            || ''
        }
      );

    setMessage(
      error
        ? error.message
        : data
          ? '✅ Dati salvati. Il profilo torna in verifica.'
          : 'Salvataggio non riuscito.'
    );

    await loadProfessional();
  }

  async function saveCategories() {
    if (
      !selectedProCats
        .length
    ) {
      setMessage(
        'Seleziona almeno una categoria.'
      );

      return;
    }

    const {
      error
    } =
      await supabase.rpc(
        'update_my_categories',
        {
          p_category_ids:
            selectedProCats
        }
      );

    setMessage(
      error
        ? error.message
        : '✅ Categorie aggiornate.'
    );

    await loadProfessional();
    await loadMatchingJobs();
  }

  async function setProLocation() {
    const position =
      await getPosition();

    if (!position) {
      setMessage(
        'Posizione non disponibile.'
      );

      return;
    }

    const {
      error
    } =
      await supabase.rpc(
        'update_my_professional_location',
        {
          p_latitude:
            position.latitude,

          p_longitude:
            position.longitude
        }
      );

    setMessage(
      error
        ? error.message
        : '✅ Posizione aggiornata.'
    );

    await loadProfessional();
    await loadMatchingJobs();
  }

  async function setRadius(
    value: number
  ) {
    const {
      error
    } =
      await supabase.rpc(
        'update_my_max_distance',
        {
          p_max_distance:
            value
        }
      );

    if (error) {
      setMessage(
        error.message
      );

      return;
    }

    setMaxDistance(
      value
    );

    setMessage(
      `✅ Raggio impostato a ${value} km.`
    );

    await loadMatchingJobs();
  }

  async function setAvail(
    value:
      Availability
  ) {
    const {
      error
    } =
      await supabase.rpc(
        'update_my_availability',
        {
          p_status:
            value
        }
      );

    if (error) {
      setMessage(
        error.message
      );

      return;
    }

    setAvailability(
      value
    );

    setMessage(
      `✅ ${availabilityLabel(value)}`
    );

    await loadMatchingJobs();
  }

  const filteredClient =
    useMemo(
      () => {
        if (
          clientFilter ===
          'tutti'
        ) {
          return clientJobs;
        }

        return clientJobs
          .filter(
            job =>
              job.status ===
              clientFilter
          );
      },
      [
        clientJobs,
        clientFilter
      ]
    );

  const openProfessionalJobs =
    (
      proFilter ===
      'tutti'
      ||
      proFilter ===
      'aperta'
    )
      ? matchingJobs
      : [];

  const filteredAcceptedJobs =
    proFilter ===
      'tutti'
      ? acceptedJobs
      : acceptedJobs
          .filter(
            job =>
              job.status ===
              proFilter
          );

  const verified =
    identity.verified ===
      true
    &&
    identity
      .verification_status ===
      'verificato';

  const setupPercentage =
    setup
      ? [
          setup.has_categories,
          setup.has_location,
          setup.has_radius,
          setup.has_availability
        ]
          .filter(
            Boolean
          )
          .length
          * 25
      : 0;

  const averageRating =
    reviews.length
      ? reviews.reduce(
          (
            total,
            review
          ) =>
            total
            +
            Number(
              review.rating
            ),
          0
        )
        /
        reviews.length
      : 0;

  function Photo(
    {
      id
    }: {
      id: string;
    }
  ) {
    const src =
      jobPhotos[id];

    if (!src) {
      return null;
    }

    return (
      <img
        className="photo"
        src={src}
        alt="Foto del problema"
      />
    );
  }

  function ChatModal() {
    return (
      <div className="modal">
        <div className="modalBox">
          <button
            className="x"
            type="button"
            onClick={
              () =>
                setChatJobId(
                  null
                )
            }
          >
            ×
          </button>

          <span className="tag">
            Chat intervento
          </span>

          <h2>
            {chatTitle}
          </h2>

          <div className="chat-list">
            {
              messages.map(
                item => (
                  <div
                    key={
                      item.id
                    }
                    className={
                      `bubble ${
                        item.sender_id ===
                          user?.id
                          ? 'mine'
                          : 'theirs'
                      }`
                    }
                  >
                    <b>
                      {
                        item.sender_id ===
                          user?.id
                          ? 'Tu'
                          : 'Interlocutore'
                      }
                    </b>

                    <div>
                      {
                        item.message
                      }
                    </div>
                  </div>
                )
              )
            }
          </div>

          <form
            onSubmit={
              sendMessage
            }
          >
            <input
              value={
                chatText
              }
              onChange={
                event =>
                  setChatText(
                    event
                      .target
                      .value
                  )
              }
              autoFocus
              placeholder="Scrivi un messaggio..."
            />

            <button
              className="full"
              style={{
                marginTop:
                  10
              }}
            >
              Invia
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (
    user
    &&
    role ===
      'professionista'
  ) {
    return (
      <main>
        <header>
          <div className="logo">
            <b>L</b>
            Lavoro
            <span>
              Subito
            </span>
          </div>

          <button
            className="outline"
            onClick={
              logout
            }
          >
            Esci
          </button>
        </header>

        <div className="container">
          <section className="section">
            <span className="tag">
              Area professionista · MVP 1.0
            </span>

            <h2>
              Ciao{' '}
              {
                fullName
                ||
                'Professionista'
              }
            </h2>

            <div
              className={
                live
                  ? 'success'
                  : 'notice'
              }
            >
              {
                live
                  ? '🟢 Aggiornamento LIVE attivo'
                  : '🟡 Connessione LIVE...'
              }
            </div>

            {
              message
              &&
              (
                <div className="notice">
                  {message}
                </div>
              )
            }

            <div className="kpi">
              <div className="card">
                <span className="muted">
                  Profilo
                </span>

                <strong>
                  {
                    setupPercentage
                  }%
                </strong>
              </div>

              <div className="card">
                <span className="muted">
                  Stato
                </span>

                <strong>
                  {
                    verified
                      ? '✅'
                      : '🟡'
                  }
                </strong>
              </div>

              <div className="card">
                <span className="muted">
                  Nuovi
                </span>

                <strong>
                  {
                    matchingJobs
                      .length
                  }
                </strong>
              </div>

              <div className="card">
                <span className="muted">
                  Recensioni
                </span>

                <strong>
                  {
                    reviews.length
                      ? averageRating
                          .toFixed(1)
                      : '—'
                  }
                </strong>
              </div>
            </div>

            <div
              className="card"
              style={{
                marginTop:
                  16
              }}
            >
              <span className="tag">
                Dati e verifica
              </span>

              <h3>
                {
                  verified
                    ? '✅ Professionista verificato'
                    : identity
                        .verification_status ===
                        'rifiutato'
                      ? '❌ Verifica rifiutata'
                      : '🟡 In attesa di verifica'
                }
              </h3>

              <label>
                Nome attività
              </label>

              <input
                value={
                  identity
                    .business_name
                  ?? ''
                }
                onChange={
                  event =>
                    setIdentity(
                      current => ({
                        ...current,

                        business_name:
                          event
                            .target
                            .value
                      })
                    )
                }
              />

              <label>
                Telefono
              </label>

              <input
                value={
                  identity
                    .phone
                  ?? ''
                }
                onChange={
                  event =>
                    setIdentity(
                      current => ({
                        ...current,

                        phone:
                          event
                            .target
                            .value
                      })
                    )
                }
              />

              <label>
                Partita IVA
              </label>

              <input
                value={
                  identity
                    .vat_number
                  ?? ''
                }
                onChange={
                  event =>
                    setIdentity(
                      current => ({
                        ...current,

                        vat_number:
                          event
                            .target
                            .value
                      })
                    )
                }
              />

              <label>
                Codice fiscale
              </label>

              <input
                value={
                  identity
                    .tax_code
                  ?? ''
                }
                onChange={
                  event =>
                    setIdentity(
                      current => ({
                        ...current,

                        tax_code:
                          event
                            .target
                            .value
                      })
                    )
                }
              />

              <div className="actions">
                <button
                  className="full"
                  onClick={
                    saveIdentity
                  }
                >
                  Salva dati
                </button>
              </div>
            </div>

            <div
              className="card"
              style={{
                marginTop:
                  16
              }}
            >
              <span className="tag">
                Disponibilità
              </span>

              <h3>
                {
                  availabilityLabel(
                    availability
                  )
                }
              </h3>

              <div className="actions">
                {
                  (
                    [
                      'ora',
                      '1-2h',
                      'oggi',
                      'offline'
                    ]
                    as Availability[]
                  ).map(
                    value => (
                      <button
                        key={
                          value
                        }
                        className={
                          availability ===
                            value
                            ? 'full'
                            : 'outline'
                        }
                        onClick={
                          () =>
                            setAvail(
                              value
                            )
                        }
                      >
                        {
                          availabilityLabel(
                            value
                          )
                        }
                      </button>
                    )
                  )
                }
              </div>
            </div>

            <div
              className="card"
              style={{
                marginTop:
                  16
              }}
            >
              <span className="tag">
                Categorie
              </span>

              <div
                className="grid"
                style={{
                  marginTop:
                    12
                }}
              >
                {
                  categories.map(
                    category => (
                      <button
                        key={
                          category.id
                        }
                        className={
                          selectedProCats
                            .includes(
                              category.id
                            )
                            ? 'cat selected'
                            : 'cat'
                        }
                        onClick={
                          () =>
                            setSelectedProCats(
                              current =>
                                current.includes(
                                  category.id
                                )
                                  ? current
                                      .filter(
                                        id =>
                                          id !==
                                          category.id
                                      )
                                  : [
                                      ...current,
                                      category.id
                                    ]
                            )
                        }
                      >
                        {
                          selectedProCats
                            .includes(
                              category.id
                            )
                            ? '✓ '
                            : ''
                        }

                        {
                          category.name
                        }
                      </button>
                    )
                  )
                }
              </div>

              <div className="actions">
                <button
                  className="full"
                  onClick={
                    saveCategories
                  }
                >
                  Salva categorie
                </button>
              </div>
            </div>

            <div
              className="card"
              style={{
                marginTop:
                  16
              }}
            >
              <span className="tag">
                Posizione e raggio
              </span>

              <h3>
                Raggio massimo:{' '}
                {
                  maxDistance
                } km
              </h3>

              <div className="actions">
                <button
                  className="full"
                  onClick={
                    setProLocation
                  }
                >
                  📍 Aggiorna posizione
                </button>

                {
                  distances.map(
                    value => (
                      <button
                        key={
                          value
                        }
                        className={
                          maxDistance ===
                            value
                            ? 'full'
                            : 'outline'
                        }
                        onClick={
                          () =>
                            setRadius(
                              value
                            )
                        }
                      >
                        {
                          value
                        } km
                      </button>
                    )
                  )
                }
              </div>
            </div>

            <div
              style={{
                marginTop:
                  34
              }}
            >
              <span className="tag">
                Lavori
              </span>

              <h2>
                Lavori e storico
              </h2>

              {
                !verified
                &&
                (
                  <div className="notice">
                    🔒 Il matching è visibile solo dopo la verifica amministratore.
                  </div>
                )
              }

              <div className="filter">
                {
                  (
                    [
                      'tutti',
                      'aperta',
                      'accettata',
                      'completata'
                    ]
                    as ProFilter[]
                  ).map(
                    filter => (
                      <button
                        key={
                          filter
                        }
                        className={
                          proFilter ===
                            filter
                            ? 'selected'
                            : ''
                        }
                        onClick={
                          () =>
                            setProFilter(
                              filter
                            )
                        }
                      >
                        {
                          filter ===
                            'tutti'
                            ? 'Tutti'
                            : filter ===
                                'aperta'
                              ? 'Da accettare'
                              : filter ===
                                  'accettata'
                                ? 'Accettati'
                                : 'Completati'
                        }
                      </button>
                    )
                  )
                }
              </div>

              {
                verified
                &&
                openProfessionalJobs
                  .map(
                    job => (
                      <article
                        className="card job"
                        key={
                          `matching-${job.id}`
                        }
                      >
                        <div className="job-top">
                          <div>
                            <span className="status">
                              🔴 DA ACCETTARE
                            </span>

                            <h3>
                              {
                                job.category_name
                                ||
                                'Intervento'
                              }
                            </h3>
                          </div>

                          <b>
                            {
                              job.urgency
                                ?.toUpperCase()
                            }
                          </b>
                        </div>

                        <p>
                          {
                            job.description
                          }
                        </p>

                        <Photo
                          id={
                            job.id
                          }
                        />

                        <p className="muted">
                          🔒 Indirizzo completo dopo l’accettazione
                        </p>

                        {
                          job.distance_km
                          != null
                          &&
                          (
                            <p>
                              📍{' '}
                              {
                                Number(
                                  job.distance_km
                                )
                                  .toFixed(1)
                              } km
                              {' · '}
                              ⏱{' '}
                              {
                                etaLabel(
                                  job.eta_minutes
                                )
                              }
                            </p>
                          )
                        }

                        <button
                          className="full"
                          disabled={
                            busy
                            ||
                            availability ===
                              'offline'
                          }
                          onClick={
                            () =>
                              acceptJob(
                                job.id
                              )
                          }
                        >
                          {
                            availability ===
                              'offline'
                              ? 'Sei offline'
                              : 'Accetta lavoro →'
                          }
                        </button>
                      </article>
                    )
                  )
              }

              {
                verified
                &&
                filteredAcceptedJobs
                  .map(
                    job => (
                      <article
                        className="card job"
                        key={
                          `accepted-${job.id}`
                        }
                      >
                        <span className="status">
                          {
                            statusLabel(
                              job.status
                            )
                          }
                        </span>

                        <h3>
                          {
                            job.category_name
                            ||
                            'Intervento'
                          }
                        </h3>

                        <p>
                          {
                            job.description
                          }
                        </p>

                        <Photo
                          id={
                            job.id
                          }
                        />

                        {
                          job.address
                          &&
                          (
                            <div className="success">
                              📍{' '}
                              <b>
                                Indirizzo intervento
                              </b>
                              <br />
                              {
                                job.address
                              }
                            </div>
                          )
                        }

                        <div className="actions">
                          <button
                            className="full"
                            onClick={
                              () =>
                                openChat(
                                  job.id,
                                  job.category_name
                                  ||
                                  'Intervento'
                                )
                            }
                          >
                            💬 Chat
                          </button>

                          {
                            job.status !==
                              'completata'
                            &&
                            (
                              <button
                                className="outline"
                                onClick={
                                  () =>
                                    completeJob(
                                      job.id
                                    )
                                }
                              >
                                ✓ Completa
                              </button>
                            )
                          }
                        </div>
                      </article>
                    )
                  )
              }
            </div>

            <div
              style={{
                marginTop:
                  34
              }}
            >
              <span className="tag">
                Recensioni
              </span>

              <h2>
                Le mie recensioni
              </h2>

              {
                reviews.map(
                  review => (
                    <div
                      className="card job"
                      key={
                        review.review_id
                      }
                    >
                      <b>
                        {
                          '⭐'
                            .repeat(
                              Number(
                                review.rating
                              )
                            )
                        }
                      </b>

                      <h3>
                        {
                          review.client_name
                          ||
                          'Cliente'
                        }
                      </h3>

                      <p>
                        {
                          review.comment
                          ||
                          'Nessun commento.'
                        }
                      </p>
                    </div>
                  )
                )
              }
            </div>
          </section>
        </div>

        <footer>
          © 2026 LavoroSubito · MVP 1.0
        </footer>

        {
          chatJobId
          &&
          ChatModal()
        }
      </main>
    );
  }

  return (
    <main>
      <header>
        <div className="logo">
          <b>L</b>
          Lavoro
          <span>
            Subito
          </span>
        </div>

        {
          user
            ? (
              <button
                className="outline"
                onClick={
                  logout
                }
              >
                Esci
              </button>
            )
            : (
              <button
                className="outline"
                onClick={
                  () => {
                    setAuthMode(
                      'login'
                    );

                    setAuthOpen(
                      true
                    );
                  }
                }
              >
                Accedi / Registrati
              </button>
            )
        }
      </header>

      <div className="container">
        <section className="hero">
          <div>
            <span className="tag">
              ● Interventi urgenti
            </span>

            <h1>
              Un problema?
              <br />
              <span>
                Risolviamolo subito.
              </span>
            </h1>

            <p>
              Trova un professionista verificato, disponibile e vicino a te.
            </p>
          </div>

          <div className="card">
            <span className="tag">
              MVP 1.0
            </span>

            <h2>
              Di cosa hai bisogno?
            </h2>

            <div className="grid">
              {
                cats.map(
                  (
                    [
                      name,
                      icon
                    ]
                  ) => (
                    <button
                      key={
                        name
                      }
                      className={
                        cat ===
                          name
                          ? 'cat selected'
                          : 'cat'
                      }
                      onClick={
                        () =>
                          setCat(
                            name
                          )
                      }
                    >
                      <strong>
                        {
                          icon
                        }
                      </strong>

                      {
                        name
                      }
                    </button>
                  )
                )
              }
            </div>

            <div className="urg">
              {
                [
                  'SUBITO',
                  'OGGI',
                  '48H'
                ].map(
                  value => (
                    <button
                      key={
                        value
                      }
                      className={
                        urgency ===
                          value
                          ? 'selected'
                          : ''
                      }
                      onClick={
                        () =>
                          setUrgency(
                            value
                          )
                      }
                    >
                      {
                        value
                      }
                    </button>
                  )
                )
              }
            </div>

            <label>
              Descrivi il problema
            </label>

            <textarea
              rows={4}
              value={
                description
              }
              onChange={
                event =>
                  setDescription(
                    event
                      .target
                      .value
                  )
              }
              placeholder="Es. Perdita d’acqua sotto il lavandino..."
            />

            <label>
              📷 Foto del problema
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={
                choosePhoto
              }
            />

            <div className="small muted">
              Facoltativa · massimo 10 MB
            </div>

            {
              photoPreview
              &&
              (
                <>
                  <img
                    className="photo"
                    src={
                      photoPreview
                    }
                    alt="Anteprima"
                  />

                  <button
                    className="danger"
                    onClick={
                      clearPhoto
                    }
                  >
                    Rimuovi foto
                  </button>
                </>
              )
            }

            <label>
              📍 Indirizzo intervento
            </label>

            <input
              value={
                address
              }
              onChange={
                event =>
                  setAddress(
                    event
                      .target
                      .value
                  )
              }
              placeholder="Es. Via Roma 15, Urbino"
            />

            <div className="actions">
              <button
                className="outline"
                onClick={
                  async () => {
                    const position =
                      await getPosition();

                    setCoords(
                      position
                    );

                    setMessage(
                      position
                        ? '📍 Posizione GPS rilevata.'
                        : 'Posizione non disponibile.'
                    );
                  }
                }
              >
                {
                  coords
                    ? '✅ GPS rilevato'
                    : '📍 Usa posizione GPS'
                }
              </button>

              <button
                className="full"
                disabled={
                  busy
                }
                onClick={
                  submitJob
                }
              >
                {
                  busy
                    ? 'Invio...'
                    : 'Trova chi è disponibile →'
                }
              </button>
            </div>

            {
              message
              &&
              (
                <div className="success">
                  {
                    message
                  }
                </div>
              )
            }

            {
              bestMatch
              &&
              (
                <div
                  className="card"
                  style={{
                    marginTop:
                      16,

                    borderColor:
                      '#48b779'
                  }}
                >
                  <span className="tag">
                    Professionista compatibile
                  </span>

                  <h3>
                    {
                      bestMatch
                        .professional_name
                    }
                  </h3>

                  <p>
                    🎯{' '}
                    {
                      bestMatch
                        .match_score
                    }/100
                    {' · '}
                    ⭐{' '}
                    {
                      Number(
                        bestMatch
                          .average_rating
                      )
                        .toFixed(1)
                    }
                    {' · '}
                    {
                      bestMatch
                        .review_count
                    } recensioni
                  </p>

                  <p>
                    {
                      availabilityLabel(
                        bestMatch
                          .availability_status
                      )
                    }
                    {' · '}
                    📍{' '}
                    {
                      bestMatch
                        .distance_km
                        ?.toFixed?.(1)
                      ?? '—'
                    } km
                  </p>
                </div>
              )
            }
          </div>
        </section>

        {
          user
          &&
          role ===
            'cliente'
          &&
          (
            <section className="section">
              <span className="tag">
                Storico cliente
              </span>

              <h2>
                Le mie richieste
              </h2>

              <div
                className={
                  live
                    ? 'success'
                    : 'notice'
                }
              >
                {
                  live
                    ? '🟢 Stato LIVE'
                    : '🟡 Connessione LIVE...'
                }
              </div>

              <div className="filter">
                {
                  (
                    [
                      'tutti',
                      'aperta',
                      'accettata',
                      'completata',
                      'annullata'
                    ]
                    as ClientFilter[]
                  ).map(
                    filter => (
                      <button
                        key={
                          filter
                        }
                        className={
                          clientFilter ===
                            filter
                            ? 'selected'
                            : ''
                        }
                        onClick={
                          () =>
                            setClientFilter(
                              filter
                            )
                        }
                      >
                        {
                          filter ===
                            'tutti'
                            ? 'Tutti'
                            : filter
                        }
                      </button>
                    )
                  )
                }
              </div>

              {
                filteredClient
                  .map(
                    job => (
                      <article
                        className="card job"
                        key={
                          job.id
                        }
                      >
                        <span className="status">
                          {
                            statusLabel(
                              job.status
                            )
                          }
                        </span>

                        <h3>
                          {
                            job.category_name
                            ||
                            'Intervento'
                          }
                        </h3>

                        <p>
                          {
                            job.description
                          }
                        </p>

                        <Photo
                          id={
                            job.id
                          }
                        />

                        {
                          job.address
                          &&
                          (
                            <div className="notice">
                              📍{' '}
                              <b>
                                Indirizzo intervento
                              </b>
                              <br />
                              {
                                job.address
                              }
                            </div>
                          )
                        }

                        <p>
                          <b>
                            Urgenza:
                          </b>{' '}
                          {
                            job.urgency
                              ?.toUpperCase()
                          }
                        </p>

                        {
                          job.professional_name
                          &&
                          (
                            <div className="success">
                              ✅{' '}
                              {
                                job.professional_name
                              }
                            </div>
                          )
                        }

                        <div className="actions">
                          {
                            job.status ===
                              'aperta'
                            &&
                            (
                              <button
                                className="danger"
                                onClick={
                                  () =>
                                    cancelJob(
                                      job.id
                                    )
                                }
                              >
                                ❌ Annulla richiesta
                              </button>
                            )
                          }

                          {
                            (
                              job.status ===
                                'accettata'
                              ||
                              job.status ===
                                'completata'
                            )
                            &&
                            (
                              <button
                                className="full"
                                onClick={
                                  () =>
                                    openChat(
                                      job.id,
                                      job.professional_name
                                      ||
                                      'Intervento'
                                    )
                                }
                              >
                                💬 Chat
                              </button>
                            )
                          }

                          {
                            job.status ===
                              'accettata'
                            &&
                            (
                              <button
                                className="outline"
                                onClick={
                                  () =>
                                    completeJob(
                                      job.id
                                    )
                                }
                              >
                                ✓ Completa
                              </button>
                            )
                          }

                          {
                            job.status ===
                              'completata'
                            &&
                            !job.reviewed
                            &&
                            (
                              <button
                                className="outline"
                                onClick={
                                  () => {
                                    setReviewJobId(
                                      job.id
                                    );

                                    setRating(
                                      5
                                    );
                                  }
                                }
                              >
                                ⭐ Recensisci
                              </button>
                            )
                          }
                        </div>
                      </article>
                    )
                  )
              }
            </section>
          )
        }
      </div>

      <footer>
        © 2026 LavoroSubito · MVP 1.0
      </footer>

      {
        authOpen
        &&
        (
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
                onClick={
                  () =>
                    setAuthOpen(
                      false
                    )
                }
              >
                ×
              </button>

              <h2>
                {
                  authMode ===
                    'signup'
                    ? 'Crea account'
                    : 'Bentornato'
                }
              </h2>

              <div className="actions">
                <button
                  type="button"
                  className={
                    authMode ===
                      'login'
                      ? 'full'
                      : 'outline'
                  }
                  onClick={
                    () =>
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
                  onClick={
                    () =>
                      setAuthMode(
                        'signup'
                      )
                  }
                >
                  Registrati
                </button>
              </div>

              {
                authMode ===
                  'signup'
                &&
                (
                  <>
                    <label>
                      Nome e cognome
                    </label>

                    <input
                      required
                      value={
                        authName
                      }
                      onChange={
                        event =>
                          setAuthName(
                            event
                              .target
                              .value
                          )
                      }
                    />

                    <label>
                      Tipo account
                    </label>

                    <select
                      value={
                        signupRole
                      }
                      onChange={
                        event =>
                          setSignupRole(
                            event
                              .target
                              .value
                            as Role
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
                )
              }

              <label>
                Email
              </label>

              <input
                type="email"
                required
                value={
                  email
                }
                onChange={
                  event =>
                    setEmail(
                      event
                        .target
                        .value
                    )
                }
              />

              <label>
                Password
              </label>

              <input
                type="password"
                minLength={
                  6
                }
                required
                value={
                  password
                }
                onChange={
                  event =>
                    setPassword(
                      event
                        .target
                        .value
                    )
                }
              />

              <button
                className="full"
                style={{
                  marginTop:
                    14
                }}
                disabled={
                  busy
                }
              >
                {
                  busy
                    ? 'Attendi...'
                    : authMode ===
                        'signup'
                      ? 'Crea account'
                      : 'Accedi'
                }
              </button>
            </form>
          </div>
        )
      }

      {
        chatJobId
        &&
        ChatModal()
      }

      {
        reviewJobId
        &&
        (
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
                  () =>
                    setReviewJobId(
                      null
                    )
                }
              >
                ×
              </button>

              <span className="tag">
                Recensione
              </span>

              <h2>
                Valuta l’intervento
              </h2>

              <div className="actions">
                {
                  [
                    1,
                    2,
                    3,
                    4,
                    5
                  ].map(
                    stars => (
                      <button
                        type="button"
                        key={
                          stars
                        }
                        className={
                          rating ===
                            stars
                            ? 'full'
                            : 'outline'
                        }
                        onClick={
                          () =>
                            setRating(
                              stars
                            )
                        }
                      >
                        {
                          stars
                        } ⭐
                      </button>
                    )
                  )
                }
              </div>

              <label>
                Commento
              </label>

              <textarea
                rows={4}
                value={
                  reviewComment
                }
                onChange={
                  event =>
                    setReviewComment(
                      event
                        .target
                        .value
                    )
                }
              />

              <button
                className="full"
                style={{
                  marginTop:
                    12
                }}
              >
                Invia recensione
              </button>
            </form>
          </div>
        )
      }
    </main>
  );
}
