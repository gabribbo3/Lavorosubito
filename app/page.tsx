'use client';

import {
  ChangeEvent,
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

type AvailabilityStatus =
  | 'ora'
  | '1-2h'
  | 'oggi'
  | 'offline';

type AppRole =
  | 'cliente'
  | 'professionista';

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

const slug = (value: string) =>
  value
    .toLowerCase()
    .replaceAll(' ', '-');

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

type ProfessionalIdentity = {
  business_name?: string | null;
  phone?: string | null;
  vat_number?: string | null;
  tax_code?: string | null;
  verification_status?: string | null;
  verified?: boolean | null;
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
  address?: string | null;
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
  address?: string | null;
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

  const [
    availabilityStatus,
    setAvailabilityStatus
  ] =
    useState<AvailabilityStatus>(
      'offline'
    );

  const [
    availabilitySaving,
    setAvailabilitySaving
  ] =
    useState(false);

  const [
    realtimeConnected,
    setRealtimeConnected
  ] =
    useState(false);

  const [setupStatus, setSetupStatus] =
    useState<SetupStatus | null>(null);

  const [
    allCategories,
    setAllCategories
  ] =
    useState<Category[]>([]);

  const [
    selectedCategoryIds,
    setSelectedCategoryIds
  ] =
    useState<string[]>([]);

  const [
    categorySaving,
    setCategorySaving
  ] =
    useState(false);

  const [
    maxDistance,
    setMaxDistance
  ] =
    useState(30);

  const [
    professionalLocationSet,
    setProfessionalLocationSet
  ] =
    useState(false);

  const [
    professionalLocationLoading,
    setProfessionalLocationLoading
  ] =
    useState(false);

  const [
    distanceSaving,
    setDistanceSaving
  ] =
    useState(false);

  const [
    businessName,
    setBusinessName
  ] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [
    vatNumber,
    setVatNumber
  ] =
    useState('');

  const [
    taxCode,
    setTaxCode
  ] =
    useState('');

  const [
    verificationStatus,
    setVerificationStatus
  ] =
    useState('da_verificare');

  const [
    identityVerified,
    setIdentityVerified
  ] =
    useState(false);

  const [
    identitySaving,
    setIdentitySaving
  ] =
    useState(false);

  const [jobs, setJobs] =
    useState<Job[]>([]);

  const [
    jobsLoading,
    setJobsLoading
  ] =
    useState(false);

  const [
    acceptedJobs,
    setAcceptedJobs
  ] =
    useState<AcceptedJob[]>([]);

  const [
    professionalReviews,
    setProfessionalReviews
  ] =
    useState<ProfessionalReview[]>([]);

  const [
    clientJobs,
    setClientJobs
  ] =
    useState<ClientJob[]>([]);

  const [
    clientJobsLoading,
    setClientJobsLoading
  ] =
    useState(false);

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

  const [urg, setUrg] =
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
  ] =
    useState(false);

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
  ] =
    useState(false);

  const [
    authOpen,
    setAuthOpen
  ] =
    useState(false);

  const [
    authMode,
    setAuthMode
  ] =
    useState<'login' | 'signup'>(
      'login'
    );

  const [name, setName] =
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
    chatMessages,
    setChatMessages
  ] =
    useState<ChatMessage[]>([]);

  const [
    chatText,
    setChatText
  ] =
    useState('');

  const [
    chatLoading,
    setChatLoading
  ] =
    useState(false);

  const [
    chatSending,
    setChatSending
  ] =
    useState(false);

  const [
    reviewJobId,
    setReviewJobId
  ] =
    useState<string | null>(null);

  const [
    reviewProfessionalName,
    setReviewProfessionalName
  ] =
    useState('');

  const [rating, setRating] =
    useState(5);

  const [
    reviewComment,
    setReviewComment
  ] =
    useState('');

  const [
    reviewSending,
    setReviewSending
  ] =
    useState(false);

  const [
    reviewMessage,
    setReviewMessage
  ] =
    useState('');

  // =========================
  // V35 FOTO
  // =========================

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
    photoUploading,
    setPhotoUploading
  ] =
    useState(false);

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
    photoLoadingJobs,
    setPhotoLoadingJobs
  ] =
    useState<
      Record<string, boolean>
    >({});

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
          (
            _event,
            session
          ) => {
            const currentUser =
              session?.user ??
              null;

            setUser(
              currentUser
            );

            if (
              currentUser
            ) {
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
          `lavorosubito-v35-${user.id}`
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

  function clearPhotoPreview() {
    if (photoPreview) {
      URL.revokeObjectURL(
        photoPreview
      );
    }

    setPhotoPreview('');
    setPhotoFile(null);
  }

  function clearDownloadedPhotos() {
    Object.values(
      jobPhotos
    ).forEach(value => {
      if (value) {
        URL.revokeObjectURL(
          value
        );
      }
    });

    setJobPhotos({});
    setPhotoLoadingJobs({});
  }

  function resetSession() {
    clearPhotoPreview();
    clearDownloadedPhotos();

    setProfileRole(null);
    setFullName('');
    setAvailabilityStatus(
      'offline'
    );

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
    setBusinessName('');
    setPhone('');
    setVatNumber('');
    setTaxCode('');

    setVerificationStatus(
      'da_verificare'
    );

    setIdentityVerified(
      false
    );

    setBestMatch(null);
    setChatJobId(null);
    setChatMessages([]);
    setReviewJobId(null);
    setCoordinates(null);
    setAddress('');

    setProfessionalLocationSet(
      false
    );

    setMaxDistance(30);

    setRealtimeConnected(
      false
    );

    setClientFilter(
      'tutti'
    );

    setProFilter(
      'tutti'
    );
  }

  function scrollToSection(
    id: string
  ) {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior:
          'smooth',
        block:
          'start'
      });
  }

  // =========================
  // V35 GESTIONE FOTO
  // =========================

  function selectPhoto(
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
      !file.type.startsWith(
        'image/'
      )
    ) {
      setMessage(
        'Seleziona un file immagine.'
      );

      event.target.value =
        '';

      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setMessage(
        'La foto supera il limite di 10 MB.'
      );

      event.target.value =
        '';

      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(
        photoPreview
      );
    }

    const preview =
      URL.createObjectURL(
        file
      );

    setPhotoFile(file);
    setPhotoPreview(
      preview
    );

    setMessage(
      '📷 Foto selezionata.'
    );
  }

  function safeFileName(
    file: File
  ) {
    const original =
      file.name ||
      'foto.jpg';

    const extension =
      original.includes('.')
        ? original
            .split('.')
            .pop()
            ?.toLowerCase()
        : '';

    const safeExtension =
      extension
        ?.replace(
          /[^a-z0-9]/g,
          ''
        ) ||
      'jpg';

    return `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${safeExtension}`;
  }

  async function uploadJobPhoto(
    jobId: string
  ) {
    if (
      !photoFile ||
      !user
    ) {
      return true;
    }

    setPhotoUploading(
      true
    );

    const path =
      `${user.id}/${jobId}/${safeFileName(
        photoFile
      )}`;

    const {
      error:
        uploadError
    } =
      await supabase
        .storage
        .from(
          'job-photos'
        )
        .upload(
          path,
          photoFile,
          {
            cacheControl:
              '3600',

            upsert:
              false,

            contentType:
              photoFile.type ||
              undefined
          }
        );

    if (
      uploadError
    ) {
      setMessage(
        `Richiesta creata, ma la foto non è stata caricata: ${uploadError.message}`
      );

      setPhotoUploading(
        false
      );

      return false;
    }

    const {
      data:
        photoSaved,
      error:
        photoSaveError
    } =
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
      photoSaveError ||
      photoSaved === false
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
        `Richiesta creata, ma non è stato possibile collegare la foto: ${
          photoSaveError
            ?.message ??
          'errore sconosciuto'
        }`
      );

      setPhotoUploading(
        false
      );

      return false;
    }

    await loadJobPhoto(
      jobId,
      true
    );

    setPhotoUploading(
      false
    );

    return true;
  }

  async function loadJobPhoto(
    jobId: string,
    force = false
  ) {
    if (
      !force &&
      jobPhotos[
        jobId
      ] !== undefined
    ) {
      return;
    }

    if (
      photoLoadingJobs[
        jobId
      ]
    ) {
      return;
    }

    setPhotoLoadingJobs(
      current => ({
        ...current,
        [jobId]: true
      })
    );

    const {
      data,
      error
    } =
      await supabase.rpc(
        'get_job_photo_url',
        {
          p_job_id:
            jobId
        }
      );

    if (
      error ||
      !data
    ) {
      setJobPhotos(
        current => ({
          ...current,
          [jobId]:
            null
        })
      );

      setPhotoLoadingJobs(
        current => ({
          ...current,
          [jobId]:
            false
        })
      );

      return;
    }

    const photoPath =
      String(data);

    const {
      data:
        photoBlob,
      error:
        downloadError
    } =
      await supabase
        .storage
        .from(
          'job-photos'
        )
        .download(
          photoPath
        );

    if (
      downloadError ||
      !photoBlob
    ) {
      setJobPhotos(
        current => ({
          ...current,
          [jobId]:
            null
        })
      );
    } else {
      const localUrl =
        URL.createObjectURL(
          photoBlob
        );

      setJobPhotos(
        current => {
          const oldUrl =
            current[
              jobId
            ];

          if (
            oldUrl
          ) {
            URL.revokeObjectURL(
              oldUrl
            );
          }

          return {
            ...current,
            [jobId]:
              localUrl
          };
        }
      );
    }

    setPhotoLoadingJobs(
      current => ({
        ...current,
        [jobId]:
          false
      })
    );
  }

  async function loadPhotos(
    ids: string[]
  ) {
    for (
      const id of ids
    ) {
      await loadJobPhoto(
        id
      );
    }
  }

  function JobPhoto({
    jobId
  }: {
    jobId: string;
  }) {
    const url =
      jobPhotos[
        jobId
      ];

    const loading =
      photoLoadingJobs[
        jobId
      ];

    if (loading) {
      return (
        <div
          className="card"
          style={{
            marginTop:
              12
          }}
        >
          📷 Caricamento
          foto...
        </div>
      );
    }

    if (url) {
      return (
        <div
          style={{
            margin:
              '15px 0'
          }}
        >
          <b>
            📷 Foto del
            problema
          </b>

          <img
            src={url}
            alt="Foto del problema"
            style={{
              display:
                'block',
              width:
                '100%',
              maxHeight:
                420,
              objectFit:
                'cover',
              borderRadius:
                14,
              marginTop:
                10,
              border:
                '1px solid #ddd'
            }}
          />
        </div>
      );
    }

    return null;
  }

  // =========================
  // PROFILO
  // =========================

  async function loadProfile(
    userId: string
  ) {
    const {
      data,
      error
    } =
      await supabase
        .from(
          'profiles'
        )
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
      data.full_name ??
      ''
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

        loadProfessionalIdentity(),

        loadSetupStatus(),

        loadJobs(),

        loadAcceptedJobs(),

        loadProfessionalReviews()
      ]);
    } else {
      await loadClientJobs();
    }
  }

  async function loadProfessionalIdentity() {
    const {
      data,
      error
    } =
      await supabase.rpc(
        'my_professional_identity'
      );

    if (error) {
      setMessage(
        `Errore dati professionali: ${error.message}`
      );
      return;
    }

    if (
      !data ||
      data.length === 0
    ) {
      return;
    }

    const identity =
      data[0] as ProfessionalIdentity;

    setBusinessName(
      identity
        .business_name ??
      ''
    );

    setPhone(
      identity.phone ??
      ''
    );

    setVatNumber(
      identity
        .vat_number ??
      ''
    );

    setTaxCode(
      identity
        .tax_code ??
      ''
    );

    setVerificationStatus(
      identity
        .verification_status ??
      'da_verificare'
    );

    setIdentityVerified(
      identity.verified ===
        true
    );
  }

  async function saveProfessionalIdentity() {
    if (
      !businessName.trim()
    ) {
      setMessage(
        'Inserisci il nome della tua attività.'
      );
      return;
    }

    if (
      !phone.trim()
    ) {
      setMessage(
        'Inserisci un numero di telefono.'
      );
      return;
    }

    setIdentitySaving(
      true
    );

    setMessage('');

    const {
      data,
      error
    } =
      await supabase.rpc(
        'update_my_professional_identity',
        {
          p_business_name:
            businessName.trim(),

          p_phone:
            phone.trim(),

          p_vat_number:
            vatNumber.trim(),

          p_tax_code:
            taxCode.trim()
        }
      );

    if (error) {
      setMessage(
        `Errore salvataggio dati: ${error.message}`
      );
    } else if (
      data === false
    ) {
      setMessage(
        'Non è stato possibile salvare i dati.'
      );
    } else {
      setVerificationStatus(
        'da_verificare'
      );

      setIdentityVerified(
        false
      );

      setMessage(
        '✅ Dati professionali salvati. Il profilo è in attesa di verifica.'
      );

      await loadProfessionalIdentity();
    }

    setIdentitySaving(
      false
    );
  }

  function verificationLabel() {
    if (
      identityVerified ||
      verificationStatus ===
        'verificato'
    ) {
      return '✅ Professionista verificato';
    }

    if (
      verificationStatus ===
      'rifiutato'
    ) {
      return '❌ Verifica rifiutata';
    }

    return '🟡 Da verificare';
  }

  function verificationDescription() {
    if (
      identityVerified ||
      verificationStatus ===
        'verificato'
    ) {
      return 'I dati professionali sono stati verificati.';
    }

    if (
      verificationStatus ===
      'rifiutato'
    ) {
      return 'I dati inseriti non sono stati approvati. Controllali e inviali nuovamente.';
    }

    return 'I dati sono in attesa di verifica.';
  }

  async function loadSetupStatus() {
    const {
      data,
      error
    } =
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
    if (
      !setupStatus
    ) {
      return 0;
    }

    let completed =
      0;

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

    return (
      completed *
      25
    );
  }

  async function loadAllCategories() {
    const {
      data,
      error
    } =
      await supabase
        .from(
          'categories'
        )
        .select(
          'id, name, slug'
        )
        .order(
          'name',
          {
            ascending:
              true
          }
        );

    if (!error) {
      setAllCategories(
        (data ??
          []) as Category[]
      );
    }
  }

  async function loadProfessionalCategories() {
    const {
      data,
      error
    } =
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
        (
          row: any
        ) =>
          row.category_id
      )
    );
  }

  function toggleProfessionalCategory(
    categoryId:
      string
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

    setCategorySaving(
      true
    );

    setMessage('');

    const {
      data,
      error
    } =
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

    setCategorySaving(
      false
    );
  }

  async function loadAvailability(
    userId: string
  ) {
    const {
      data,
      error
    } =
      await supabase
        .from(
          'availability'
        )
        .select(
          'status'
        )
        .eq(
          'professional_id',
          userId
        )
        .maybeSingle();

    if (
      error ||
      !data
    ) {
      setAvailabilityStatus(
        'offline'
      );

      return;
    }

    const status =
      data.status as AvailabilityStatus;

    if (
      status ===
        'ora' ||
      status ===
        '1-2h' ||
      status ===
        'oggi' ||
      status ===
        'offline'
    ) {
      setAvailabilityStatus(
        status
      );
    } else {
      setAvailabilityStatus(
        'offline'
      );
    }
  }

  async function updateAvailability(
    status:
      AvailabilityStatus
  ) {
    setAvailabilitySaving(
      true
    );

    setMessage('');

    const {
      data,
      error
    } =
      await supabase.rpc(
        'update_my_availability',
        {
          p_status:
            status
        }
      );

    if (error) {
      setMessage(
        `Errore disponibilità: ${error.message}`
      );
    } else if (
      data === false
    ) {
      setMessage(
        'Non è stato possibile aggiornare la disponibilità.'
      );
    } else {
      setAvailabilityStatus(
        status
      );

      setMessage(
        `✅ Disponibilità aggiornata: ${availabilityLabel(
          status
        )}`
      );

      await loadSetupStatus();

      await loadJobs();
    }

    setAvailabilitySaving(
      false
    );
  }

  async function loadProfessionalSettings(
    userId: string
  ) {
    const {
      data
    } =
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
      data?.latitude !=
        null &&
      data?.longitude !=
        null
    );

    setMaxDistance(
      data
        ?.max_distance_km ??
      30
    );
  }

  async function loadJobs() {
    setJobsLoading(
      true
    );

    const {
      data,
      error
    } =
      await supabase.rpc(
        'my_matching_jobs'
      );

    if (error) {
      setJobs([]);
    } else {
      const mapped =
        (data ?? []).map(
          (
            job: any
          ) => ({
            id:
              job.id,

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
        ) as Job[];

      setJobs(
        mapped
      );

      void loadPhotos(
        mapped.map(
          item =>
            item.id
        )
      );
    }

    setJobsLoading(
      false
    );
  }

  async function loadAcceptedJobs() {
    const {
      data,
      error
    } =
      await supabase.rpc(
        'my_accepted_jobs'
      );

    if (error) {
      setAcceptedJobs(
        []
      );
    } else {
      const mapped =
        (data ??
          []) as AcceptedJob[];

      setAcceptedJobs(
        mapped
      );

      void loadPhotos(
        mapped.map(
          item =>
            item.id
        )
      );
    }
  }

  async function loadProfessionalReviews() {
    const {
      data,
      error
    } =
      await supabase.rpc(
        'my_professional_reviews'
      );

    if (error) {
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

    const {
      data,
      error
    } =
      await supabase.rpc(
        'my_client_jobs'
      );

    if (error) {
      setMessage(
        `Errore richieste cliente: ${error.message}`
      );

      setClientJobs(
        []
      );
    } else {
      const mapped =
        (data ??
          []) as ClientJob[];

      setClientJobs(
        mapped
      );

      void loadPhotos(
        mapped.map(
          item =>
            item.id
        )
      );
    }

    setClientJobsLoading(
      false
    );
  }

  async function cancelJob(
    jobId: string
  ) {
    const confirmation =
      window.confirm(
        'Vuoi davvero annullare questa richiesta?'
      );

    if (
      !confirmation
    ) {
      return;
    }

    setBusy(true);
    setMessage('');

    const {
      data,
      error
    } =
      await supabase.rpc(
        'cancel_my_job',
        {
          p_job_id:
            jobId
        }
      );

    if (error) {
      setMessage(
        `Errore annullamento: ${error.message}`
      );
    } else if (
      data === false
    ) {
      setMessage(
        'La richiesta non può più essere annullata.'
      );
    } else {
      setBestMatch(
        null
      );

      setMessage(
        '✅ Richiesta annullata correttamente.'
      );

      await loadClientJobs();
    }

    setBusy(false);
  }

  function getCurrentPosition():
    Promise<Coordinates | null> {
    return new Promise(
      resolve => {
        if (
          !navigator.geolocation
        ) {
          resolve(
            null
          );

          return;
        }

        navigator
          .geolocation
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
              resolve(
                null
              ),

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

  async function detectLocation() {
    setLocationLoading(
      true
    );

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

    setCoordinates(
      position
    );

    setMessage(
      '📍 Posizione GPS rilevata correttamente.'
    );

    setLocationLoading(
      false
    );
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

    const {
      data,
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
    setDistanceSaving(
      true
    );

    setMessage('');

    const {
      data,
      error
    } =
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

  async function acceptJob(
    jobId: string
  ) {
    setBusy(true);
    setMessage('');

    const {
      data,
      error
    } =
      await supabase.rpc(
        'accept_verified_job',
        {
          p_job_id:
            jobId
        }
      );

    if (error) {
      if (
        error.message
          .toLowerCase()
          .includes(
            'non verificato'
          )
      ) {
        setMessage(
          '🔒 Il tuo profilo deve essere verificato prima di poter accettare lavori.'
        );
      } else {
        setMessage(
          `Errore accettazione: ${error.message}`
        );
      }
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

    if (
      !confirmation
    ) {
      return;
    }

    setBusy(true);

    const {
      data,
      error
    } =
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

    const {
      data,
      error
    } =
      await supabase.rpc(
        'find_verified_professionals_for_job',
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
      results.length >
      0
    ) {
      setBestMatch(
        results[0]
      );

      setMessage(
        '✅ Professionista verificato compatibile trovato.'
      );
    } else {
      setMessage(
        '✅ Richiesta creata. Nessun professionista verificato compatibile disponibile al momento.'
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

    if (
      !address.trim()
    ) {
      setMessage(
        'Inserisci l’indirizzo dell’intervento.'
      );

      return;
    }

    if (!user) {
      setRole(
        'cliente'
      );

      setAuthMode(
        'signup'
      );

      setAuthOpen(
        true
      );

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
      data:
        category,
      error:
        categoryError
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
      data:
        newJob,
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

          address:
            address.trim(),

          latitude:
            currentCoordinates
              ?.latitude ??
            null,

          longitude:
            currentCoordinates
              ?.longitude ??
            null
        })
        .select(
          'id'
        )
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

    let photoOk =
      true;

    if (photoFile) {
      photoOk =
        await uploadJobPhoto(
          newJob.id
        );
    }

    setDescription('');
    setAddress('');

    clearPhotoPreview();

    await loadClientJobs();

    await findBestMatch(
      newJob.id
    );

    if (
      photoFile &&
      !photoOk
    ) {
      setMessage(
        '⚠️ La richiesta è stata creata, ma c’è stato un problema con la foto.'
      );
    }

    setBusy(false);
  }

  async function openChat(
    jobId: string,
    title: string
  ) {
    setChatJobId(
      jobId
    );

    setChatTitle(
      title
    );

    setChatText('');

    await loadChat(
      jobId
    );
  }

  async function loadChat(
    jobId: string
  ) {
    setChatLoading(
      true
    );

    const {
      data,
      error
    } =
      await supabase
        .from(
          'messages'
        )
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
            ascending:
              true
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

    setChatLoading(
      false
    );
  }

  async function sendChatMessage(
    event:
      FormEvent
  ) {
    event.preventDefault();

    if (
      !user ||
      !chatJobId ||
      !chatText.trim()
    ) {
      return;
    }

    setChatSending(
      true
    );

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

    setChatSending(
      false
    );
  }

  function closeChat() {
    setChatJobId(null);
    setChatTitle('');
    setChatMessages([]);
    setChatText('');
  }

  function openReview(
    jobId: string,
    professionalName:
      string
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

    setReviewProfessionalName(
      ''
    );

    setRating(5);
    setReviewComment('');
    setReviewMessage('');
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

    setReviewSending(
      true
    );

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
              .trim() ||
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

    setReviewSending(
      false
    );
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
        await supabase
          .auth
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
        await supabase
          .auth
          .signInWithPassword(
            {
              email,
              password
            }
          );

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

    resetSession();

    setMessage('');
  }

  function etaLabel(
    eta:
      | number
      | null
      | undefined
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
      minutes ===
      0
    ) {
      return `Circa ${hours} h`;
    }

    return `Circa ${hours} h ${minutes} min`;
  }

  function availabilityLabel(
    status:
      string
  ) {
    if (
      status ===
      'ora'
    ) {
      return '🟢 Disponibile ora';
    }

    if (
      status ===
      '1-2h'
    ) {
      return '🟡 Disponibile entro 1–2 ore';
    }

    if (
      status ===
      'oggi'
    ) {
      return '🟠 Disponibile oggi';
    }

    return '⚫ Offline';
  }

  const averageRating =
    professionalReviews
      .length > 0
      ? professionalReviews
          .reduce(
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
        professionalReviews
          .length
      : 0;

  const percentage =
    setupPercentage();

  const setupComplete =
    setupStatus
      ?.setup_complete ===
    true;

  const verifiedForMatching =
    identityVerified ===
      true &&
    verificationStatus ===
      'verificato';

  const canUseMatching =
    setupComplete &&
    verifiedForMatching;

  const availableForJobs =
    availabilityStatus !==
    'offline';

  const filteredClientJobs =
    clientFilter ===
    'tutti'
      ? clientJobs
      : clientJobs.filter(
          job =>
            job.status ===
            clientFilter
        );

  const proOpenJobs =
    proFilter ===
      'tutti' ||
    proFilter ===
      'aperta'
      ? jobs
      : [];

  const proAcceptedJobs =
    proFilter ===
    'tutti'
      ? acceptedJobs
      : acceptedJobs.filter(
          job =>
            job.status ===
            proFilter
        );

  const clientCounts = {
    tutti:
      clientJobs.length,

    aperta:
      clientJobs.filter(
        job =>
          job.status ===
          'aperta'
      ).length,

    accettata:
      clientJobs.filter(
        job =>
          job.status ===
          'accettata'
      ).length,

    completata:
      clientJobs.filter(
        job =>
          job.status ===
          'completata'
      ).length,

    annullata:
      clientJobs.filter(
        job =>
          job.status ===
          'annullata'
      ).length
  };

  const proCounts = {
    tutti:
      jobs.length +
      acceptedJobs.length,

    aperta:
      jobs.length,

    accettata:
      acceptedJobs.filter(
        job =>
          job.status ===
          'accettata'
      ).length,

    completata:
      acceptedJobs.filter(
        job =>
          job.status ===
          'completata'
      ).length
  };

  const ChatModal =
    () =>
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
                maxHeight:
                  330,

                overflowY:
                  'auto',

                marginTop:
                  20,

                marginBottom:
                  20,

                display:
                  'grid',

                gap:
                  10
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
                    item
                      .sender_id ===
                    user?.id;

                  return (
                    <div
                      key={
                        item.id
                      }
                      style={{
                        padding:
                          12,

                        borderRadius:
                          12,

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
                        {
                          item.message
                        }
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
                value={
                  chatText
                }
                onChange={
                  e =>
                    setChatText(
                      e
                        .target
                        .value
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

  const ReviewModal =
    () =>
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
              Valuta{' '}
              <b>
                {
                  reviewProfessionalName
                }
              </b>
            </p>

            <div
              style={{
                display:
                  'flex',

                gap:
                  5,

                margin:
                  '20px 0'
              }}
            >
              {[
                1,
                2,
                3,
                4,
                5
              ].map(
                star => (
                  <button
                    key={
                      star
                    }
                    type="button"
                    onClick={() =>
                      setRating(
                        star
                      )
                    }
                    style={{
                      border:
                        'none',

                      background:
                        'transparent',

                      fontSize:
                        32
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
              onChange={
                e =>
                  setReviewComment(
                    e
                      .target
                      .value
                  )
              }
              placeholder="Commento..."
              rows={5}
            />

            {reviewMessage && (
              <div className="success">
                {
                  reviewMessage
                }
              </div>
            )}

            <button
              className="full"
              disabled={
                reviewSending
              }
            >
              ⭐ Invia
              recensione
            </button>
          </form>
        </div>
      ) : null;

  // =========================
  // AREA PROFESSIONISTA
  // =========================

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
            onClick={
              logout
            }
          >
            Esci
          </button>
        </header>

        <section
          className="section"
          style={{
            paddingTop:
              70
          }}
        >
          <label className="tag">
            AREA
            PROFESSIONISTA
          </label>

          <h2>
            Ciao{' '}
            {fullName ||
              'Professionista'}
            .
          </h2>

          <div
            style={{
              display:
                'inline-block',

              marginTop:
                15,

              padding:
                '8px 14px',

              border:
                '1px solid #ddd',

              borderRadius:
                999,

              fontWeight:
                700
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
                marginTop:
                  25,

                border:
                  '2px solid #e4b23c'
              }}
            >
              <label className="tag">
                V35 · PRIMO
                ACCESSO
              </label>

              <h2>
                👋 Configuriamo
                il tuo profilo
              </h2>

              <h3>
                {percentage}%
                completato
              </h3>

              <div
                style={{
                  width:
                    '100%',

                  height:
                    14,

                  background:
                    '#ededed',

                  borderRadius:
                    999,

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

                    height:
                      '100%',

                    background:
                      '#f0b93a'
                  }}
                />
              </div>

              <button
                className="full"
                onClick={() =>
                  scrollToSection(
                    'setup-categories'
                  )
                }
              >
                🛠 Configura
                profilo
              </button>
            </div>
          )}

          {setupComplete &&
            verifiedForMatching && (
              <div
                className="success"
                style={{
                  marginTop:
                    25
                }}
              >
                ✅ Profilo
                operativo e
                verificato.
              </div>
            )}

          {setupComplete &&
            !verifiedForMatching && (
              <div
                className="card"
                style={{
                  marginTop:
                    25
                }}
              >
                <h2>
                  🔒 Matching in
                  attesa di
                  verifica
                </h2>

                <b>
                  {
                    verificationLabel()
                  }
                </b>
              </div>
            )}

          <div
            className="card"
            style={{
              marginTop:
                20
            }}
          >
            <label className="tag">
              VERIFICA
              PROFESSIONISTA
            </label>

            <h2>
              🪪 Dati
              professionali
            </h2>

            <p>
              <b>
                {
                  verificationLabel()
                }
              </b>
            </p>

            <p>
              {
                verificationDescription()
              }
            </p>

            <label>
              Nome attività
            </label>

            <input
              value={
                businessName
              }
              onChange={
                e =>
                  setBusinessName(
                    e
                      .target
                      .value
                  )
              }
            />

            <label>
              Telefono
            </label>

            <input
              value={
                phone
              }
              onChange={
                e =>
                  setPhone(
                    e
                      .target
                      .value
                  )
              }
            />

            <label>
              Partita IVA
            </label>

            <input
              value={
                vatNumber
              }
              onChange={
                e =>
                  setVatNumber(
                    e
                      .target
                      .value
                  )
              }
            />

            <label>
              Codice fiscale
            </label>

            <input
              value={
                taxCode
              }
              onChange={
                e =>
                  setTaxCode(
                    e
                      .target
                      .value
                  )
              }
            />

            <button
              className="full"
              disabled={
                identitySaving
              }
              onClick={
                saveProfessionalIdentity
              }
            >
              💾 Salva dati
              professionali
            </button>
          </div>

          <div
            id="setup-availability"
            className="card"
            style={{
              marginTop:
                20
            }}
          >
            <label className="tag">
              DISPONIBILITÀ
            </label>

            <h2>
              ⏱ Quando sei
              disponibile?
            </h2>

            <p>
              Stato attuale:{' '}
              <b>
                {
                  availabilityLabel(
                    availabilityStatus
                  )
                }
              </b>
            </p>

            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  '1fr 1fr',

                gap:
                  10
              }}
            >
              <button
                className={
                  availabilityStatus ===
                  'ora'
                    ? 'full'
                    : 'outline'
                }
                disabled={
                  availabilitySaving
                }
                onClick={() =>
                  updateAvailability(
                    'ora'
                  )
                }
              >
                🟢 Ora
              </button>

              <button
                className={
                  availabilityStatus ===
                  '1-2h'
                    ? 'full'
                    : 'outline'
                }
                disabled={
                  availabilitySaving
                }
                onClick={() =>
                  updateAvailability(
                    '1-2h'
                  )
                }
              >
                🟡 1–2 ore
              </button>

              <button
                className={
                  availabilityStatus ===
                  'oggi'
                    ? 'full'
                    : 'outline'
                }
                disabled={
                  availabilitySaving
                }
                onClick={() =>
                  updateAvailability(
                    'oggi'
                  )
                }
              >
                🟠 Oggi
              </button>

              <button
                className={
                  availabilityStatus ===
                  'offline'
                    ? 'full'
                    : 'outline'
                }
                disabled={
                  availabilitySaving
                }
                onClick={() =>
                  updateAvailability(
                    'offline'
                  )
                }
              >
                ⚫ Offline
              </button>
            </div>
          </div>

          <div
            id="setup-categories"
            className="card"
            style={{
              marginTop:
                20
            }}
          >
            <h2>
              🛠 Le mie
              categorie
            </h2>

            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  '1fr 1fr',

                gap:
                  10
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
                      {
                        category.name
                      }
                    </button>
                  );
                }
              )}
            </div>

            <button
              className="full"
              onClick={
                saveProfessionalCategories
              }
              disabled={
                categorySaving
              }
            >
              💾 Salva
              categorie
            </button>
          </div>

          <div
            id="setup-location"
            className="card"
            style={{
              marginTop:
                20
            }}
          >
            <h2>
              📍 Posizione e
              raggio
            </h2>

            <p>
              {professionalLocationSet
                ? '✅ Posizione configurata'
                : '⚠️ Posizione da configurare'}
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
              📍 Usa la mia
              posizione
            </button>

            <h3>
              Raggio massimo:{' '}
              {maxDistance} km
            </h3>

            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  'repeat(3,1fr)',

                gap:
                  10
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
                marginTop:
                  20
              }}
            >
              {message}
            </div>
          )}

          {canUseMatching && (
            <>
              <div
                style={{
                  marginTop:
                    50
                }}
              >
                <label className="tag">
                  V35 · LAVORI
                </label>

                <h2>
                  Lavori e
                  storico
                </h2>

                <p>
                  {
                    availabilityLabel(
                      availabilityStatus
                    )
                  }
                </p>

                <button
                  className="outline"
                  onClick={
                    loadJobs
                  }
                >
                  ↻ Aggiorna
                </button>
              </div>

              <div
                style={{
                  display:
                    'flex',

                  gap:
                    8,

                  flexWrap:
                    'wrap',

                  margin:
                    '20px 0'
                }}
              >
                <button
                  className={
                    proFilter ===
                    'tutti'
                      ? 'full'
                      : 'outline'
                  }
                  onClick={() =>
                    setProFilter(
                      'tutti'
                    )
                  }
                >
                  Tutti (
                  {
                    proCounts.tutti
                  }
                  )
                </button>

                <button
                  className={
                    proFilter ===
                    'aperta'
                      ? 'full'
                      : 'outline'
                  }
                  onClick={() =>
                    setProFilter(
                      'aperta'
                    )
                  }
                >
                  🔴 Da
                  accettare (
                  {
                    proCounts.aperta
                  }
                  )
                </button>

                <button
                  className={
                    proFilter ===
                    'accettata'
                      ? 'full'
                      : 'outline'
                  }
                  onClick={() =>
                    setProFilter(
                      'accettata'
                    )
                  }
                >
                  🟢 Accettati (
                  {
                    proCounts.accettata
                  }
                  )
                </button>

                <button
                  className={
                    proFilter ===
                    'completata'
                      ? 'full'
                      : 'outline'
                  }
                  onClick={() =>
                    setProFilter(
                      'completata'
                    )
                  }
                >
                  ✅ Completati (
                  {
                    proCounts.completata
                  }
                  )
                </button>
              </div>

              {jobsLoading && (
                <p>
                  Caricamento...
                </p>
              )}

              {proOpenJobs.map(
                job => (
                  <article
                    key={
                      `open-${job.id}`
                    }
                    className="card"
                    style={{
                      marginTop:
                        18
                    }}
                  >
                    <div className="live">
                      🔴 DA
                      ACCETTARE
                    </div>

                    <h3>
                      {job.category_name ||
                        'Intervento'}
                    </h3>

                    <p>
                      {
                        job.description
                      }
                    </p>

                    <JobPhoto
                      jobId={
                        job.id
                      }
                    />

                    <p>
                      <b>
                        Urgenza:
                      </b>{' '}
                      {job.urgency
                        .toUpperCase()}
                    </p>

                    <p>
                      🔒 Indirizzo
                      visibile dopo
                      l'accettazione.
                    </p>

                    {job.distance_km !=
                      null && (
                      <p>
                        📍{' '}
                        {Number(
                          job.distance_km
                        ).toFixed(
                          1
                        )}{' '}
                        km
                      </p>
                    )}

                    {job.eta_minutes !=
                      null && (
                      <p>
                        ⏱{' '}
                        {etaLabel(
                          job.eta_minutes
                        )}
                      </p>
                    )}

                    <button
                      className="full"
                      disabled={
                        busy ||
                        !availableForJobs
                      }
                      onClick={() =>
                        acceptJob(
                          job.id
                        )
                      }
                    >
                      {availableForJobs
                        ? 'Accetta lavoro →'
                        : 'Sei offline'}
                    </button>
                  </article>
                )
              )}

              {proAcceptedJobs.map(
                job => {
                  const completed =
                    job.status ===
                    'completata';

                  return (
                    <article
                      key={
                        `accepted-${job.id}`
                      }
                      className="card"
                      style={{
                        marginTop:
                          18
                      }}
                    >
                      <div className="live">
                        {completed
                          ? '✅ COMPLETATO'
                          : '🟢 ACCETTATO'}
                      </div>

                      <h3>
                        {job.category_name ||
                          'Intervento'}
                      </h3>

                      <p>
                        {
                          job.description
                        }
                      </p>

                      <JobPhoto
                        jobId={
                          job.id
                        }
                      />

                      {job.address && (
                        <div
                          className="success"
                          style={{
                            margin:
                              '15px 0'
                          }}
                        >
                          <b>
                            📍 Indirizzo
                            intervento
                          </b>

                          <p>
                            {
                              job.address
                            }
                          </p>
                        </div>
                      )}

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

                      {!completed && (
                        <button
                          className="outline"
                          style={{
                            marginTop:
                              10
                          }}
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

              {!jobsLoading &&
                proOpenJobs.length ===
                  0 &&
                proAcceptedJobs.length ===
                  0 && (
                  <div
                    className="card"
                    style={{
                      marginTop:
                        20
                    }}
                  >
                    Nessun lavoro
                    in questa
                    categoria.
                  </div>
                )}
            </>
          )}

          <div
            style={{
              marginTop:
                60
            }}
          >
            <label className="tag">
              RECENSIONI
            </label>

            <h2>
              ⭐ Le mie
              recensioni
            </h2>

            <p>
              Media:{' '}
              <b>
                {professionalReviews
                  .length
                  ? averageRating
                      .toFixed(
                        1
                      )
                  : '—'}
              </b>
            </p>
          </div>

          {professionalReviews.map(
            review => (
              <article
                key={
                  review.review_id
                }
                className="card"
                style={{
                  marginTop:
                    18
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
                    'Cliente'}
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
          <small>
            © 2026
            LavoroSubito ·
            V35
          </small>
        </footer>

        <ChatModal />
      </main>
    );
  }

  // =========================
  // AREA CLIENTE
  // =========================

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
            onClick={
              logout
            }
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
      </header>

      <section className="hero">
        <div>
          <label className="tag">
            ● INTERVENTI
            URGENTI
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
            Trova un
            professionista
            verificato,
            disponibile e
            vicino a te.
          </p>
        </div>

        <div className="card">
          <label className="tag">
            V35
          </label>

          <h2>
            Di cosa hai
            bisogno?
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

          <label>
            Descrivi il
            problema
          </label>

          <textarea
            value={
              description
            }
            onChange={
              e =>
                setDescription(
                  e.target
                    .value
                )
            }
            placeholder="Es. Perdita d'acqua sotto il lavandino..."
            rows={4}
          />

          <label>
            📷 Foto del
            problema
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={
              selectPhoto
            }
          />

          <small
            style={{
              display:
                'block',

              marginBottom:
                12
            }}
          >
            Facoltativa ·
            massimo 10 MB
          </small>

          {photoPreview && (
            <div
              style={{
                marginBottom:
                  18
              }}
            >
              <img
                src={
                  photoPreview
                }
                alt="Anteprima foto"
                style={{
                  width:
                    '100%',

                  maxHeight:
                    420,

                  objectFit:
                    'cover',

                  borderRadius:
                    14,

                  border:
                    '1px solid #ddd'
                }}
              />

              <button
                type="button"
                className="outline"
                style={{
                  marginTop:
                    10
                }}
                onClick={
                  clearPhotoPreview
                }
              >
                ❌ Rimuovi foto
              </button>
            </div>
          )}

          <label>
            📍 Indirizzo
            intervento
          </label>

          <input
            value={
              address
            }
            onChange={
              e =>
                setAddress(
                  e.target
                    .value
                )
            }
            placeholder="Es. Via Roma 15, Urbino"
          />

          <small
            style={{
              display:
                'block',

              marginBottom:
                15
            }}
          >
            L'indirizzo
            completo verrà
            mostrato al
            professionista
            solo dopo
            l'accettazione.
          </small>

          <button
            type="button"
            className="outline"
            disabled={
              locationLoading
            }
            onClick={
              detectLocation
            }
          >
            {locationLoading
              ? '📍 Rilevamento...'
              : coordinates
                ? '✅ Posizione GPS rilevata'
                : '📍 Usa anche la mia posizione GPS'}
          </button>

          <button
            className="full"
            disabled={
              busy ||
              photoUploading
            }
            onClick={
              submitJob
            }
          >
            {photoUploading
              ? '📷 Caricamento foto...'
              : busy
                ? 'Ricerca...'
                : 'Trova chi è disponibile →'}
          </button>

          {message && (
            <div className="success">
              {message}
            </div>
          )}

          {matchingLoading && (
            <div className="card">
              🔎 Matching in
              corso...
            </div>
          )}

          {bestMatch && (
            <div
              className="card"
              style={{
                marginTop:
                  20,

                border:
                  '2px solid #48b779'
              }}
            >
              <label className="tag">
                ✅ PROFESSIONISTA
                VERIFICATO
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

              {bestMatch
                .distance_km !=
                null && (
                <p>
                  📍{' '}
                  {Number(
                    bestMatch
                      .distance_km
                  ).toFixed(
                    1
                  )}{' '}
                  km
                </p>
              )}

              {bestMatch
                .eta_minutes !=
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
                ).toFixed(
                  1
                )}{' '}
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
              V35 · STORICO
            </label>

            <h2>
              Le mie richieste
            </h2>

            <div
              style={{
                marginBottom:
                  20,

                fontWeight:
                  700
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

            <div
              style={{
                display:
                  'flex',

                gap:
                  8,

                flexWrap:
                  'wrap',

                margin:
                  '20px 0'
              }}
            >
              <button
                className={
                  clientFilter ===
                  'tutti'
                    ? 'full'
                    : 'outline'
                }
                onClick={() =>
                  setClientFilter(
                    'tutti'
                  )
                }
              >
                Tutti (
                {
                  clientCounts.tutti
                }
                )
              </button>

              <button
                className={
                  clientFilter ===
                  'aperta'
                    ? 'full'
                    : 'outline'
                }
                onClick={() =>
                  setClientFilter(
                    'aperta'
                  )
                }
              >
                🔴 Aperti (
                {
                  clientCounts.aperta
                }
                )
              </button>

              <button
                className={
                  clientFilter ===
                  'accettata'
                    ? 'full'
                    : 'outline'
                }
                onClick={() =>
                  setClientFilter(
                    'accettata'
                  )
                }
              >
                🟢 Accettati (
                {
                  clientCounts.accettata
                }
                )
              </button>

              <button
                className={
                  clientFilter ===
                  'completata'
                    ? 'full'
                    : 'outline'
                }
                onClick={() =>
                  setClientFilter(
                    'completata'
                  )
                }
              >
                ✅ Completati (
                {
                  clientCounts.completata
                }
                )
              </button>

              <button
                className={
                  clientFilter ===
                  'annullata'
                    ? 'full'
                    : 'outline'
                }
                onClick={() =>
                  setClientFilter(
                    'annullata'
                  )
                }
              >
                ⚫ Annullati (
                {
                  clientCounts.annullata
                }
                )
              </button>
            </div>

            {clientJobsLoading && (
              <p>
                Caricamento...
              </p>
            )}

            {!clientJobsLoading &&
              filteredClientJobs
                .length ===
                0 && (
                <div className="card">
                  Nessuna
                  richiesta in
                  questa
                  categoria.
                </div>
              )}

            {filteredClientJobs.map(
              job => {
                const accepted =
                  job.status ===
                    'accettata' ||
                  job.status ===
                    'completata';

                const completed =
                  job.status ===
                  'completata';

                const cancelled =
                  job.status ===
                  'annullata';

                const open =
                  job.status ===
                  'aperta';

                return (
                  <article
                    key={
                      job.id
                    }
                    className="card"
                    style={{
                      marginTop:
                        18,

                      opacity:
                        cancelled
                          ? 0.65
                          : 1
                    }}
                  >
                    <div className="live">
                      {cancelled
                        ? '⚫ ANNULLATA'
                        : completed
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
                      {
                        job.description
                      }
                    </p>

                    <JobPhoto
                      jobId={
                        job.id
                      }
                    />

                    {job.address && (
                      <div
                        style={{
                          margin:
                            '12px 0',

                          padding:
                            12,

                          border:
                            '1px solid #ddd',

                          borderRadius:
                            10
                        }}
                      >
                        <b>
                          📍 Indirizzo
                          intervento
                        </b>

                        <p>
                          {
                            job.address
                          }
                        </p>
                      </div>
                    )}

                    <p>
                      <b>
                        Urgenza:
                      </b>{' '}
                      {job.urgency
                        ?.toUpperCase()}
                    </p>

                    {open && (
                      <button
                        className="outline"
                        disabled={
                          busy
                        }
                        style={{
                          borderColor:
                            '#d9534f'
                        }}
                        onClick={() =>
                          cancelJob(
                            job.id
                          )
                        }
                      >
                        ❌ Annulla
                        richiesta
                      </button>
                    )}

                    {cancelled && (
                      <p>
                        <b>
                          Questa
                          richiesta è
                          stata
                          annullata.
                        </b>
                      </p>
                    )}

                    {accepted &&
                      job
                        .professional_name && (
                        <>
                          <div className="success">
                            ✅{' '}
                            {
                              job
                                .professional_name
                            }
                          </div>

                          <button
                            className="full"
                            onClick={() =>
                              openChat(
                                job.id,

                                job
                                  .professional_name ||
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
                                marginTop:
                                  10
                              }}
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

                          {completed &&
                            !job.reviewed && (
                              <button
                                className="outline"
                                style={{
                                  marginTop:
                                    10
                                }}
                                onClick={() =>
                                  openReview(
                                    job.id,

                                    job
                                      .professional_name ||
                                      'Professionista'
                                  )
                                }
                              >
                                ⭐ Lascia
                                recensione
                              </button>
                            )}

                          {completed &&
                            job.reviewed && (
                              <div
                                className="success"
                                style={{
                                  marginTop:
                                    10
                                }}
                              >
                                ⭐ Recensione
                                inviata
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
          Il professionista
          giusto, quando
          serve.
        </h2>

        <p>
          Matching basato su
          specializzazione,
          disponibilità,
          distanza, urgenza,
          reputazione e
          verifica del
          professionista.
        </p>
      </section>

      <footer>
        <small>
          © 2026
          LavoroSubito · V35
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
                display:
                  'grid',

                gridTemplateColumns:
                  '1fr 1fr',

                gap:
                  10
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
                  value={
                    name
                  }
                  onChange={
                    e =>
                      setName(
                        e
                          .target
                          .value
                      )
                  }
                />

                <select
                  value={
                    role
                  }
                  onChange={
                    e =>
                      setRole(
                        e
                          .target
                          .value as AppRole
                      )
                  }
                >
                  <option value="cliente">
                    👤 Cliente
                  </option>

                  <option value="professionista">
                    🛠
                    Professionista
                  </option>
                </select>
              </>
            )}

            <input
              required
              type="email"
              placeholder="Email"
              value={
                email
              }
              onChange={
                e =>
                  setEmail(
                    e
                      .target
                      .value
                  )
              }
            />

            <input
              required
              minLength={
                6
              }
              type="password"
              placeholder="Password"
              value={
                password
              }
              onChange={
                e =>
                  setPassword(
                    e
                      .target
                      .value
                  )
              }
            />

            <button
              className="full"
              disabled={
                busy
              }
            >
              {busy
                ? 'Attendi...'
                : authMode ===
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
