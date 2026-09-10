import {
  NextRequest,
  NextResponse
} from 'next/server';

import {
  createClient
} from '@supabase/supabase-js';

function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadius = 6371;

  const dLat =
    (lat2 - lat1) * Math.PI / 180;

  const dLon =
    (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2
    +
    Math.cos(lat1 * Math.PI / 180)
    *
    Math.cos(lat2 * Math.PI / 180)
    *
    Math.sin(dLon / 2) ** 2;

  return (
    2
    * earthRadius
    * Math.asin(Math.sqrt(a))
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    const resendApiKey =
      process.env.RESEND_API_KEY;

    if (
      !supabaseUrl
      || !publishableKey
      || !serviceRoleKey
      || !resendApiKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Configurazione server incompleta.'
        },
        {
          status: 500
        }
      );
    }

    const authorization =
      request.headers.get('authorization');

    const accessToken =
      authorization?.replace(
        /^Bearer\s+/i,
        ''
      );

    if (!accessToken) {
      return NextResponse.json(
        { ok: false },
        { status: 401 }
      );
    }

    const userClient =
      createClient(
        supabaseUrl,
        publishableKey,
        {
          global: {
            headers: {
              Authorization:
                `Bearer ${accessToken}`
            }
          }
        }
      );

    const {
      data: { user },
      error: userError
    } =
      await userClient.auth.getUser();

    if (
      userError
      || !user
    ) {
      return NextResponse.json(
        { ok: false },
        { status: 401 }
      );
    }

    let body: any;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: 'Richiesta non valida.'
        },
        {
          status: 400
        }
      );
    }

    const jobId =
      body?.jobId;

    if (
      !jobId
      || typeof jobId !== 'string'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'jobId mancante o non valido.'
        },
        {
          status: 400
        }
      );
    }

    const admin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false
          }
        }
      );

    const {
      data: job,
      error: jobError
    } =
      await admin
        .from('jobs')
        .select(
          'id,client_id,category_id,urgency,latitude,longitude,status'
        )
        .eq('id', jobId)
        .maybeSingle();

    if (
      jobError
      || !job
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Richiesta non trovata.'
        },
        {
          status: 404
        }
      );
    }

    if (
      job.client_id !== user.id
    ) {
      return NextResponse.json(
        { ok: false },
        { status: 403 }
      );
    }

    if (
      job.status !== 'aperta'
    ) {
      return NextResponse.json({
        ok: true,
        sent: 0
      });
    }

    const {
      data: category
    } =
      await admin
        .from('categories')
        .select('name')
        .eq(
          'id',
          job.category_id
        )
        .maybeSingle();

    const categoryName =
      String(
        category?.name
        ?? 'Intervento'
      );

    const {
      data: categoryRows,
      error: categoryError
    } =
      await admin
        .from(
          'professional_categories'
        )
        .select(
          'professional_id'
        )
        .eq(
          'category_id',
          job.category_id
        );

    if (categoryError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Errore durante la selezione dei professionisti.'
        },
        {
          status: 500
        }
      );
    }

    const professionalIds = [
      ...new Set(
        (categoryRows ?? []).map(
          (row: any) =>
            row.professional_id
        )
      )
    ];

    if (
      professionalIds.length === 0
    ) {
      return NextResponse.json({
        ok: true,
        sent: 0
      });
    }

    const {
      data: professionals,
      error: professionalsError
    } =
      await admin
        .from('professionals')
        .select(
          'id,verified,verification_status,latitude,longitude,max_distance_km'
        )
        .in(
          'id',
          professionalIds
        )
        .eq(
          'verified',
          true
        )
        .eq(
          'verification_status',
          'verificato'
        );

    if (
      professionalsError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Errore durante la selezione dei professionisti.'
        },
        {
          status: 500
        }
      );
    }

    const {
      data: availabilityRows,
      error: availabilityError
    } =
      await admin
        .from('availability')
        .select(
          'professional_id,status'
        )
        .in(
          'professional_id',
          professionalIds
        );

    if (
      availabilityError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Errore durante la verifica della disponibilità.'
        },
        {
          status: 500
        }
      );
    }

    const availabilityMap =
      new Map(
        (availabilityRows ?? []).map(
          (row: any) => [
            row.professional_id,
            row.status
          ]
        )
      );

    const urgency =
      String(
        job.urgency ?? ''
      ).toLowerCase();

    const eligibleProfessionals =
      (professionals ?? []).filter(
        (professional: any) => {
          const availability =
            availabilityMap.get(
              professional.id
            );

          if (
            !availability
            || availability === 'offline'
          ) {
            return false;
          }

          if (
            urgency === 'subito'
            &&
            ![
              'ora',
              '1-2h'
            ].includes(
              String(
                availability
              )
            )
          ) {
            return false;
          }

          if (
            urgency === 'oggi'
            &&
            ![
              'ora',
              '1-2h',
              'oggi'
            ].includes(
              String(
                availability
              )
            )
          ) {
            return false;
          }

          if (
            job.latitude == null
            || job.longitude == null
            || professional.latitude == null
            || professional.longitude == null
          ) {
            return true;
          }

          const distance =
            distanceKm(
              Number(
                job.latitude
              ),
              Number(
                job.longitude
              ),
              Number(
                professional.latitude
              ),
              Number(
                professional.longitude
              )
            );

          const radius =
            Number(
              professional.max_distance_km
              ?? 30
            );

          if (
            distance > radius
          ) {
            return false;
          }

          const estimatedMinutes =
            Math.ceil(
              distance * 2.2 + 8
            );

          if (
            urgency === 'subito'
            &&
            estimatedMinutes > 120
          ) {
            return false;
          }

          if (
            urgency === 'oggi'
            &&
            estimatedMinutes > 240
          ) {
            return false;
          }

          return true;
        }
      );

    const targetIds =
      eligibleProfessionals.map(
        professional =>
          professional.id
      );

    if (
      targetIds.length === 0
    ) {
      return NextResponse.json({
        ok: true,
        sent: 0
      });
    }

    const {
      data: emailRows,
      error: emailError
    } =
      await admin
        .from(
          'professional_notification_emails'
        )
        .select(
          'professional_id,email,enabled'
        )
        .in(
          'professional_id',
          targetIds
        )
        .eq(
          'enabled',
          true
        );

    if (
      emailError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Errore durante il caricamento delle email.'
        },
        {
          status: 500
        }
      );
    }

    const safeCategory =
      escapeHtml(
        categoryName
      );

    const safeUrgency =
      escapeHtml(
        urgency.toUpperCase()
      );

    const appUrl =
      'https://lavorosubito.vercel.app/';

    let sent = 0;

    for (
      const row
      of emailRows ?? []
    ) {
      try {
        const response =
          await fetch(
            'https://api.resend.com/emails',
            {
              method: 'POST',

              headers: {
                Authorization:
                  `Bearer ${resendApiKey}`,

                'Content-Type':
                  'application/json',

                'Idempotency-Key':
                  `new-job/${jobId}/${row.professional_id}`
              },

              body:
                JSON.stringify({
                  from:
                    'LavoroSubito <onboarding@resend.dev>',

                  to: [
                    row.email
                  ],

                  subject:
                    `Nuovo intervento ${urgency.toUpperCase()} su LavoroSubito`,

                  html: `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#111317">
                      <h2>Nuovo intervento disponibile</h2>

                      <p>
                        C'è una nuova richiesta compatibile con il tuo profilo professionale.
                      </p>

                      <p>
                        <strong>Categoria:</strong>
                        ${safeCategory}
                      </p>

                      <p>
                        <strong>Urgenza:</strong>
                        ${safeUrgency}
                      </p>

                      <p>
                        Accedi a LavoroSubito per vedere i dettagli disponibili e accettare l'intervento.
                      </p>

                      <p style="margin:28px 0">
                        <a
                          href="${appUrl}"
                          style="background:#121419;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700"
                        >
                          Apri LavoroSubito
                        </a>
                      </p>

                      <p style="font-size:12px;color:#68707b">
                        L'indirizzo completo e le informazioni riservate del cliente non vengono inviate via email.
                      </p>
                    </div>
                  `
                })
            }
          );

        if (
          response.ok
        ) {
          sent++;
        }
      } catch {
      }
    }

    return NextResponse.json({
      ok: true,
      sent
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: 'Errore server.'
      },
      {
        status: 500
      }
    );
  }
}
