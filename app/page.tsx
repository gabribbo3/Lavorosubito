'use client';

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

const PRIVACY_VERSION = '2026-09-09';
const TERMS_VERSION = '2026-09-09';

const CATEGORIES = [
  ['Idraulico', '🔧'],
  ['Elettricista', '⚡'],
  ['Fabbro', '🔑'],
  ['Caldaia', '🔥'],
  ['Climatizzatore', '❄️'],
  ['Serramenti', '🪟'],
  ['Meccanico', '🚗'],
  ['Altro', '🏠']
];

const DISTANCES = [10, 20, 30, 50, 100];

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

function statusLabel(value: string) {
  if (value === 'aperta') {
    return '🔴 RICERCA IN CORSO';
  }

  if (value === 'accettata') {
    return '🟢 ACCETTATA';
  }

  if (value === 'completata') {
    return '✅ COMPLETATA';
  }

  if (value === 'annullata') {
    return '⚫ ANNULLATA';
  }

  return value.toUpperCase();
}

function etaLabel(
  value: number | null | undefined
) {
  if (value == null) {
    return 'Tempo non disponibile';
  }

  if (value < 60) {
    return `Circa ${value} min`;
  }

  const h =
    Math.floor(value / 60);

  const m =
    value % 60;

  return m
    ? `Circa ${h} h ${m} min`
    : `Circa ${h} h`;
}

function LegalFooter() {
  return (
    <footer>
      <div>
        © 2026 LavoroSubito · MVP 1.0
      </div>

      <div
        style={{
          marginTop: 8,
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          flexWrap: 'wrap'
        }}
      >
        <a
          href="/privacy"
          style={{
            color: 'inherit',
            fontWeight: 700
          }}
        >
          Privacy
        </a>

        <a
          href="/termini"
          style={{
            color: 'inherit',
            fontWeight: 700
          }}
        >
          Termini e condizioni
        </a>
      </div>
    </footer>
  );
}

export default function Home() {
  const [user, setUser] =
    useState<User | null>(null);

  const [role, setRole] =
    useState('');

  const [fullName, setFullName] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const [live, setLive] =
    useState(false);

  const [categories, setCategories] =
    useState<any[]>([]);

  const [
    selectedProCats,
    setSelectedProCats
  ] =
    useState<string[]>([]);

  const [
    availability,
    setAvailability
  ] =
    useState('offline');

  const [
    maxDistance,
    setMaxDistance
  ] =
    useState(30);

  const [
    identity,
    setIdentity
  ] =
    useState<any>({});

  const [setup, setSetup] =
    useState<any>(null);

  const [
    proCity,
    setProCity
  ] =
    useState('');

  const [
    proPostalCode,
    setProPostalCode
  ] =
    useState('');

  const [
    locationBusy,
    setLocationBusy
  ] =
    useState(false);

  const [reviews, setReviews] =
    useState<any[]>([]);

  const [
    clientJobs,
    setClientJobs
  ] =
    useState<any[]>([]);

  const [
    matchingJobs,
    setMatchingJobs
  ] =
    useState<any[]>([]);

  const [
    acceptedJobs,
    setAcceptedJobs
  ] =
    useState<any[]>([]);

  const [
    clientFilter,
    setClientFilter
  ] =
    useState('tutti');

  const [
    proFilter,
    setProFilter
  ] =
    useState('tutti');

  const [cat, setCat] =
    useState('');

  const [urgency, setUrgency] =
    useState('SUBITO');

  const [
    description,
    setDescription
  ] =
    useState('');

  const [
    address,
    setAddress
  ] =
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
        string | null
      >
    >({});

  const [
    bestMatch,
    setBestMatch
  ] =
    useState<any>(null);

  const [
    authOpen,
    setAuthOpen
  ] =
    useState(false);

  const [
    authMode,
    setAuthMode
  ] =
    useState('login');

  const [
    signupRole,
    setSignupRole
  ] =
    useState('cliente');

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
    acceptedLegal,
    setAcceptedLegal
  ] =
    useState(false);

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
    useState<any[]>([]);

  const chatInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    reviewJobId,
    setReviewJobId
  ] =
    useState<string | null>(null);

  const [
    rating,
    setRating
  ] =
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
              resetState();
            }
          }
        );

    return () =>
      data.subscription
        .unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !role) {
      return;
    }

    const channel =
      supabase
        .channel(
          `lavorosubito-${user.id}`
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
              role === 'cliente'
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
            const row: any =
              payload.new;

            if (
              chatJobId &&
              row?.job_id === chatJobId
            ) {
              await loadChat(
                chatJobId
              );
            }
          }
        )
        .subscribe(
          status =>
            setLive(
              status === 'SUBSCRIBED'
            )
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

  function resetState() {
    setRole('');
    setFullName('');
    setMessage('');

    setClientJobs([]);
    setMatchingJobs([]);
    setAcceptedJobs([]);

    setSelectedProCats([]);

    setAvailability(
      'offline'
    );

    setIdentity({});
    setSetup(null);

    setProCity('');
    setProPostalCode('');

    setLocationBusy(false);

    setReviews([]);

    setBestMatch(null);

    setAcceptedLegal(false);

    setChatJobId(null);
    setMessages([]);
  }

  async function loadProfile(
    id: string
  ) {
    const profile =
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

    const detected =
      profile.data?.role ===
        'professionista'
        ? 'professionista'
        : 'cliente';

    setRole(
      detected
    );

    setFullName(
      profile.data
        ?.full_name ?? ''
    );

    const catResponse =
      await supabase
        .from('categories')
        .select(
          'id,name,slug'
        )
        .order(
          'name'
        );

    setCategories(
      Array.isArray(
        catResponse.data
      )
        ? catResponse.data
        : []
    );

    if (
      detected === 'cliente'
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
      idRes,
      catRes,
      setupRes,
      availRes
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
      Array.isArray(idRes.data) &&
      idRes.data[0]
    ) {
      setIdentity(
        idRes.data[0]
      );
    }

    if (
      Array.isArray(catRes.data)
    ) {
      setSelectedProCats(
        catRes.data.map(
          (row: any) =>
            row.category_id
        )
      );
    }

    if (
      Array.isArray(setupRes.data) &&
      setupRes.data[0]
    ) {
      setSetup(
        setupRes.data[0]
      );
    }

    if (
      typeof availRes.data ===
      'string'
    ) {
      setAvailability(
        availRes.data
      );
    }

    const {
      data: authData
    } =
      await supabase.auth
        .getUser();

    if (
      authData.user
    ) {
      const pro =
        await supabase
          .from(
            'professionals'
          )
          .select(
            'max_distance_km'
          )
          .eq(
            'id',
            authData.user.id
          )
          .maybeSingle();

      if (
        pro.data
          ?.max_distance_km
        != null
      ) {
        setMaxDistance(
          Number(
            pro.data
              .max_distance_km
          )
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
      Array.isArray(data)
        ? data
        : [];

    setClientJobs(rows);

    void loadPhotos(
      rows.map(
        (row: any) =>
          row.id
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
      Array.isArray(data)
        ? data
        : [];

    setMatchingJobs(rows);

    void loadPhotos(
      rows.map(
        (row: any) =>
          row.id
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
      Array.isArray(data)
        ? data
        : [];

    setAcceptedJobs(rows);

    void loadPhotos(
      rows.map(
        (row: any) =>
          row.id
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
      Array.isArray(data)
        ? data
        : []
    );
  }

  async function getPosition() {
    return new Promise<{
      latitude: number;
      longitude: number;
    } | null>(
      resolve => {
        if (
          !navigator.geolocation
        ) {
          resolve(null);
          return;
        }

        navigator
          .geolocation
          .getCurrentPosition(
            p =>
              resolve({
                latitude:
                  p.coords.latitude,

                longitude:
                  p.coords.longitude
              }),

            () =>
              resolve(null),

            {
              enableHighAccuracy:
                true,

              timeout:
                12000,

              maximumAge:
                60000
            }
          );
      }
    );
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
      file.size >
      10 *
      1024 *
      1024
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

    setPhotoFile(file);

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
      URL
        .revokeObjectURL(
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
      !photoFile ||
      !user
    ) {
      return;
    }

    const ext =
      (
        photoFile.name
          .split('.')
          .pop()
        ||
        'jpg'
      )
        .replace(
          /[^a-zA-Z0-9]/g,
          ''
        )
        .toLowerCase();

    const path =
      `${user.id}/${jobId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

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

      return;
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
      save.error ||
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
    }
  }

  async function loadPhoto(
    jobId: string
  ) {
    if (
      Object.prototype
        .hasOwnProperty
        .call(
          jobPhotos,
          jobId
        )
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

    if (
      !data
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
      download.error ||
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
      !cat ||
      !description.trim() ||
      !address.trim()
    ) {
      setMessage(
        'Completa categoria, descrizione e indirizzo.'
      );

      return;
    }

    if (
      !user
    ) {
      setSignupRole(
        'cliente'
      );

      setAuthMode(
        'signup'
      );

      setAcceptedLegal(
        false
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

    if (
      !position
    ) {
      position =
        await getPosition();

      if (
        position
      ) {
        setCoords(
          position
        );
      }
    }

    const category =
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

    if (
      !category.data
    ) {
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
            category.data.id,

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
      insert.error ||
      !insert.data
    ) {
      setBusy(false);

      setMessage(
        `Errore: ${insert.error?.message ?? 'creazione richiesta'}`
      );

      return;
    }

    const jobId =
      String(
        insert.data.id
      );

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
      Array.isArray(
        matching.data
      ) &&
      matching.data.length
        ? matching.data[0]
        : null;

    setBestMatch(first);

    try {
      const {
        data: sessionData
      } =
        await supabase.auth
          .getSession();

      if (
        sessionData
          .session
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
                `Bearer ${sessionData.session.access_token}`
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
      () =>
        chatInputRef.current
          ?.focus(),
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

    if (
      error
    ) {
      setMessage(
        error.message
      );
    } else {
      setMessages(
        Array.isArray(data)
          ? data
          : []
      );
    }
  }

  async function sendMessage(
    event:
      FormEvent
  ) {
    event.preventDefault();

    if (
      !user ||
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

    if (
      !text
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
            text
        });

    if (
      error
    ) {
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
      () =>
        chatInputRef.current
          ?.focus(),
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

    if (
      authMode ===
        'signup' &&
      !acceptedLegal
    ) {
      setMessage(
        'Per registrarti devi accettare la Privacy Policy e i Termini e condizioni.'
      );

      return;
    }

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
            email:
              email.trim(),

            password,

            options: {
              data: {
                full_name:
                  authName.trim(),

                role:
                  signupRole,

                legal_accepted:
                  true,

                privacy_version:
                  PRIVACY_VERSION,

                terms_version:
                  TERMS_VERSION
              }
            }
          });

      setMessage(
        error
          ? error.message
          : '✅ Registrazione completata. Controlla la tua email.'
      );

      if (
        !error
      ) {
        setAcceptedLegal(
          false
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
            email:
              email.trim(),

            password
          });

      if (
        error
      ) {
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

  async function forgotPassword() {
    const cleanEmail =
      email.trim();

    if (
      !cleanEmail
    ) {
      setMessage(
        'Inserisci prima la tua email.'
      );

      return;
    }

    setBusy(true);
    setMessage('');

    const redirectTo =
      `${window.location.origin}/reset-password`;

    const {
      error
    } =
      await supabase.auth
        .resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo
          }
        );

    setBusy(false);

    setMessage(
      error
        ? `Errore: ${error.message}`
        : '✅ Se l’indirizzo è associato a un account, riceverai una email per reimpostare la password.'
    );
  }

  async function logout() {
    await supabase.auth
      .signOut();

    resetState();
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
            identity.business_name
              ?.trim()
            || '',

          p_phone:
            identity.phone
              ?.trim()
            || '',

          p_vat_number:
            identity.vat_number
              ?.trim()
            || '',

          p_tax_code:
            identity.tax_code
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
      !selectedProCats.length
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

  async function saveProfessionalCoordinates(
    latitude: number,
    longitude: number,
    successMessage: string
  ) {
    const {
      error
    } =
      await supabase.rpc(
        'update_my_professional_location',
        {
          p_latitude:
            latitude,

          p_longitude:
            longitude
        }
      );

    if (
      error
    ) {
      setMessage(
        error.message
      );

      return false;
    }

    setMessage(
      successMessage
    );

    await loadProfessional();

    await loadMatchingJobs();

    return true;
  }

  async function setProLocation() {
    setLocationBusy(
      true
    );

    setMessage('');

    const p =
      await getPosition();

    if (
      !p
    ) {
      setMessage(
        'GPS non disponibile. Puoi inserire città e CAP qui sotto.'
      );

      setLocationBusy(
        false
      );

      return;
    }

    await saveProfessionalCoordinates(
      p.latitude,
      p.longitude,
      '✅ Posizione GPS aggiornata.'
    );

    setLocationBusy(
      false
    );
  }

  async function setProLocationManual() {
    const city =
      proCity.trim();

    const postalCode =
      proPostalCode.trim();

    if (
      !city &&
      !postalCode
    ) {
      setMessage(
        'Inserisci la città o il CAP della tua zona operativa.'
      );

      return;
    }

    setLocationBusy(
      true
    );

    setMessage('');

    try {
      const params =
        new URLSearchParams();

      if (
        city
      ) {
        params.set(
          'city',
          city
        );
      }

      if (
        postalCode
      ) {
        params.set(
          'postalCode',
          postalCode
        );
      }

      const response =
        await fetch(
          `/api/geocode?${params.toString()}`
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        setMessage(
          result.error ||
          'Località non trovata.'
        );

        setLocationBusy(
          false
        );

        return;
      }

      const latitude =
        Number(
          result.latitude
        );

      const longitude =
        Number(
          result.longitude
        );

      if (
        !Number.isFinite(
          latitude
        ) ||
        !Number.isFinite(
          longitude
        )
      ) {
        setMessage(
          'Coordinate della località non valide.'
        );

        setLocationBusy(
          false
        );

        return;
      }

      const label =
        result.displayName ||
        [
          postalCode,
          city
        ]
          .filter(Boolean)
          .join(' ');

      await saveProfessionalCoordinates(
        latitude,
        longitude,
        `✅ Zona operativa impostata: ${label}`
      );
    } catch {
      setMessage(
        'Errore durante la ricerca della località.'
      );
    }

    setLocationBusy(
      false
    );
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

    if (
      error
    ) {
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
    value: string
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

    if (
      error
    ) {
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

  const visibleMatching =
    proFilter ===
      'tutti'
    ||
    proFilter ===
      'aperta'
      ? matchingJobs
      : [];

  const visibleAccepted =
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
    identity.verification_status ===
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
            sum,
            r
          ) =>
            sum +
            Number(
              r.rating || 0
            ),
          0
        ) /
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

    return src
      ? (
        <img
          className="photo"
          src={src}
          alt="Foto del problema"
        />
      )
      : null;
  }

  function ChatModal() {
    if (
      !chatJobId
    ) {
      return null;
    }

    return (
      <div className="modal">
        <div className="modalBox">
          <button
            type="button"
            className="x"
            onClick={() =>
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
                marginTop: 10
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
    user &&
    role === 'professionista'
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
            onClick={logout}
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
                fullName ||
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
              message &&
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
                  {setupPercentage}%
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
                    matchingJobs.length
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
                      ? averageRating.toFixed(1)
                      : '—'
                  }
                </strong>
              </div>
            </div>

            <div
              className="card"
              style={{
                marginTop: 16
              }}
            >
              <span className="tag">
                Dati e verifica
              </span>

              <h3>
                {
                  verified
                    ? '✅ Professionista verificato'
                    : identity.verification_status ===
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
                  identity.business_name
                  ?? ''
                }
                onChange={
                  e =>
                    setIdentity(
                      (x: any) => ({
                        ...x,
                        business_name:
                          e.target.value
                      })
                    )
                }
              />

              <label>
                Telefono
              </label>

              <input
                value={
                  identity.phone
                  ?? ''
                }
                onChange={
                  e =>
                    setIdentity(
                      (x: any) => ({
                        ...x,
                        phone:
                          e.target.value
                      })
                    )
                }
              />

              <label>
                Partita IVA
              </label>

              <input
                value={
                  identity.vat_number
                  ?? ''
                }
                onChange={
                  e =>
                    setIdentity(
                      (x: any) => ({
                        ...x,
                        vat_number:
                          e.target.value
                      })
                    )
                }
              />

              <label>
                Codice fiscale
              </label>

              <input
                value={
                  identity.tax_code
                  ?? ''
                }
                onChange={
                  e =>
                    setIdentity(
                      (x: any) => ({
                        ...x,
                        tax_code:
                          e.target.value
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
                marginTop: 16
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
                  [
                    'ora',
                    '1-2h',
                    'oggi',
                    'offline'
                  ].map(
                    value => (
                      <button
                        key={value}
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
                marginTop: 16
              }}
            >
              <span className="tag">
                Categorie
              </span>

              <div
                className="grid"
                style={{
                  marginTop: 12
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
                                  ? current.filter(
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
                marginTop: 16
              }}
            >
              <span className="tag">
                Posizione e raggio
              </span>

              <h3>
                Zona operativa
              </h3>

              <p className="muted">
                Puoi usare la posizione GPS oppure indicare
                manualmente città e CAP.
              </p>

              <button
                className="full"
                disabled={
                  locationBusy
                }
                onClick={
                  setProLocation
                }
              >
                {
                  locationBusy
                    ? 'Localizzazione...'
                    : '📍 Usa la mia posizione GPS'
                }
              </button>

              <div
                style={{
                  marginTop: 20
                }}
              >
                <label>
                  Città
                </label>

                <input
                  value={
                    proCity
                  }
                  onChange={
                    e =>
                      setProCity(
                        e.target.value
                      )
                  }
                  placeholder="Es. Urbino"
                />

                <label>
                  CAP
                </label>

                <input
                  value={
                    proPostalCode
                  }
                  onChange={
                    e =>
                      setProPostalCode(
                        e.target.value
                      )
                  }
                  inputMode="numeric"
                  placeholder="Es. 61029"
                />

                <button
                  className="outline"
                  disabled={
                    locationBusy
                  }
                  style={{
                    marginTop: 12,
                    width: '100%'
                  }}
                  onClick={
                    setProLocationManual
                  }
                >
                  🗺 Imposta città / CAP
                </button>
              </div>

              <hr
                style={{
                  margin: '24px 0',
                  border: 0,
                  borderTop:
                    '1px solid #e5e5e5'
                }}
              />

              <h3>
                Raggio massimo:{' '}
                {maxDistance} km
              </h3>

              <div className="actions">
                {
                  DISTANCES.map(
                    value => (
                      <button
                        key={value}
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
                        {value} km
                      </button>
                    )
                  )
                }
              </div>
            </div>

            <div
              style={{
                marginTop: 30
              }}
            >
              <span className="tag">
                Lavori
              </span>

              <h2>
                Lavori e storico
              </h2>

              {
                !verified &&
                (
                  <div className="notice">
                    🔒 Il matching è visibile solo dopo la verifica amministratore.
                  </div>
                )
              }

              <div className="filter">
                {
                  [
                    'tutti',
                    'aperta',
                    'accettata',
                    'completata'
                  ].map(
                    filter => (
                      <button
                        key={filter}
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
                verified &&
                visibleMatching.map(
                  job => (
                    <article
                      className="card job"
                      key={
                        `m-${job.id}`
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
                        != null &&
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
                          busy ||
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
                verified &&
                visibleAccepted.map(
                  job => {
                    if (
                      job.status ===
                      'completata'
                    ) {
                      return (
                        <article
                          className="card job"
                          key={
                            `a-${job.id}`
                          }
                        >
                          <div
                            style={{
                              display:
                                'flex',
                              justifyContent:
                                'space-between',
                              alignItems:
                                'flex-start',
                              gap: 10
                            }}
                          >
                            <div>
                              <span className="status">
                                ✅ COMPLETATA
                              </span>

                              <h3>
                                {
                                  job.category_name
                                  ||
                                  'Intervento'
                                }
                              </h3>
                            </div>

                            <span
                              className="muted"
                              style={{
                                fontSize: 12,
                                fontWeight: 700
                              }}
                            >
                              {
                                job.urgency
                                  ?.toUpperCase()
                              }
                            </span>
                          </div>

                          <p
                            style={{
                              marginBottom: 8
                            }}
                          >
                            {
                              job.description
                            }
                          </p>

                          <details>
                            <summary
                              style={{
                                cursor:
                                  'pointer',
                                fontWeight: 800,
                                fontSize: 13,
                                padding:
                                  '6px 0'
                              }}
                            >
                              Mostra dettagli
                            </summary>

                            <Photo
                              id={
                                job.id
                              }
                            />

                            {
                              job.address &&
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
                            </div>
                          </details>
                        </article>
                      );
                    }

                    return (
                      <article
                        className="card job"
                        key={
                          `a-${job.id}`
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
                          job.address &&
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
                        </div>
                      </article>
                    );
                  }
                )
              }
            </div>

            <div
              style={{
                marginTop: 30
              }}
            >
              <span className="tag">
                Recensioni
              </span>

              <h2>
                Le mie recensioni
              </h2>

              {
                reviews.length === 0
                  ? (
                    <div className="card">
                      <p className="muted">
                        Non hai ancora recensioni.
                      </p>
                    </div>
                  )
                  : (
                    <div
                      className="card"
                      style={{
                        padding: 0,
                        overflow:
                          'hidden'
                      }}
                    >
                      {
                        reviews.map(
                          (
                            review,
                            index
                          ) => (
                            <div
                              key={
                                review.review_id
                              }
                              style={{
                                padding:
                                  '12px 14px',

                                borderBottom:
                                  index <
                                  reviews.length - 1
                                    ? '1px solid #e3e5e8'
                                    : 'none'
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    'flex',

                                  justifyContent:
                                    'space-between',

                                  alignItems:
                                    'center',

                                  gap: 10
                                }}
                              >
                                <b
                                  style={{
                                    fontSize: 13
                                  }}
                                >
                                  {
                                    review.client_name
                                    ||
                                    'Cliente'
                                  }
                                </b>

                                <span
                                  style={{
                                    fontSize: 13,
                                    whiteSpace:
                                      'nowrap'
                                  }}
                                >
                                  {
                                    '⭐'.repeat(
                                      Number(
                                        review.rating
                                        || 0
                                      )
                                    )
                                  }
                                </span>
                              </div>

                              <p
                                className="muted"
                                style={{
                                  margin:
                                    '5px 0 0',

                                  fontSize: 12,

                                  lineHeight:
                                    1.35
                                }}
                              >
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
                  )
              }
            </div>
          </section>
        </div>

        <LegalFooter />

        <ChatModal />
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
                onClick={logout}
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

                    setAcceptedLegal(
                      false
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
                CATEGORIES.map(
                  (
                    [
                      name,
                      icon
                    ]
                  ) => (
                    <button
                      key={name}
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
                        {icon}
                      </strong>

                      {name}
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
                      key={value}
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
                      {value}
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
                e =>
                  setDescription(
                    e.target.value
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
              photoPreview &&
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
                e =>
                  setAddress(
                    e.target.value
                  )
              }
              placeholder="Es. Via Roma 15, Urbino"
            />

            <div className="actions">
              <button
                className="outline"
                onClick={
                  async () => {
                    const p =
                      await getPosition();

                    setCoords(
                      p
                    );

                    setMessage(
                      p
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
              message &&
              (
                <div className="success">
                  {message}
                </div>
              )
            }

            {
              bestMatch &&
              (
                <div
                  className="card"
                  style={{
                    marginTop: 16,
                    borderColor:
                      '#48b779'
                  }}
                >
                  <span className="tag">
                    Professionista compatibile
                  </span>

                  <h3>
                    {
                      bestMatch.professional_name
                    }
                  </h3>

                  <p>
                    🎯{' '}
                    {
                      bestMatch.match_score
                    }/100
                    {' · '}
                    ⭐{' '}
                    {
                      Number(
                        bestMatch.average_rating
                        || 0
                      )
                        .toFixed(1)
                    }
                    {' · '}
                    {
                      bestMatch.review_count
                      || 0
                    } recensioni
                  </p>

                  <p>
                    {
                      availabilityLabel(
                        bestMatch.availability_status
                      )
                    }

                    {' · '}

                    📍{' '}

                    {
                      bestMatch.distance_km
                      != null
                        ? Number(
                            bestMatch.distance_km
                          )
                            .toFixed(1)
                        : '—'
                    } km
                  </p>
                </div>
              )
            }
          </div>
        </section>

        {
          user &&
          role ===
            'cliente' &&
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
                  [
                    'tutti',
                    'aperta',
                    'accettata',
                    'completata',
                    'annullata'
                  ].map(
                    filter => (
                      <button
                        key={filter}
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
                filteredClient.map(
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
                        job.address &&
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
                        job.professional_name &&
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
                            'aperta' &&
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
                          ) &&
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
                            'accettata' &&
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
                            'completata' &&
                          !job.reviewed &&
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

      <LegalFooter />

      {
        authOpen &&
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
                  () => {
                    setAuthOpen(
                      false
                    );

                    setAcceptedLegal(
                      false
                    );
                  }
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
                    () => {
                      setAuthMode(
                        'login'
                      );

                      setAcceptedLegal(
                        false
                      );
                    }
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
                    () => {
                      setAuthMode(
                        'signup'
                      );

                      setAcceptedLegal(
                        false
                      );
                    }
                  }
                >
                  Registrati
                </button>
              </div>

              {
                authMode ===
                  'signup' &&
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
                        e =>
                          setAuthName(
                            e.target.value
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
                        e =>
                          setSignupRole(
                            e.target.value
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
                  e =>
                    setEmail(
                      e.target.value
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
                  e =>
                    setPassword(
                      e.target.value
                    )
                }
              />

              {
                authMode ===
                  'login' &&
                (
                  <button
                    type="button"
                    className="outline"
                    disabled={
                      busy
                    }
                    style={{
                      marginTop: 12,
                      width: '100%'
                    }}
                    onClick={
                      forgotPassword
                    }
                  >
                    🔑 Password dimenticata?
                  </button>
                )
              }

              {
                authMode ===
                  'signup' &&
                (
                  <label
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'flex-start',
                      gap: 10,
                      marginTop: 16,
                      fontWeight: 600,
                      fontSize: 13,
                      lineHeight: 1.45,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      required
                      checked={
                        acceptedLegal
                      }
                      onChange={
                        e =>
                          setAcceptedLegal(
                            e.target.checked
                          )
                      }
                      style={{
                        width: 18,
                        height: 18,
                        minWidth: 18,
                        padding: 0,
                        margin:
                          '1px 0 0'
                      }}
                    />

                    <span>
                      Dichiaro di aver letto e accetto i{' '}

                      <a
                        href="/termini"
                        target="_blank"
                        rel="noreferrer"
                        onClick={
                          e =>
                            e.stopPropagation()
                        }
                      >
                        Termini e condizioni
                      </a>

                      {' '}e dichiaro di aver letto la{' '}

                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noreferrer"
                        onClick={
                          e =>
                            e.stopPropagation()
                        }
                      >
                        Privacy Policy
                      </a>
                      .
                    </span>
                  </label>
                )
              }

              <button
                className="full"
                style={{
                  marginTop: 14
                }}
                disabled={
                  busy ||
                  (
                    authMode ===
                      'signup' &&
                    !acceptedLegal
                  )
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

      <ChatModal />

      {
        reviewJobId &&
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
                        key={stars}
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
                        {stars} ⭐
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
                  e =>
                    setReviewComment(
                      e.target.value
                    )
                }
              />

              <button
                className="full"
                style={{
                  marginTop: 12
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
