import {
  NextRequest,
  NextResponse
} from 'next/server';

import {
  createClient
} from '@supabase/supabase-js';

import webpush from 'web-push';

function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadius =
    6371;

  const dLat =
    (
      lat2 - lat1
    )
    * Math.PI
    / 180;

  const dLon =
    (
      lon2 - lon1
    )
    * Math.PI
    / 180;

  const a =
    Math.sin(
      dLat / 2
    ) ** 2
    +
    Math.cos(
      lat1
      * Math.PI
      / 180
    )
    *
    Math.cos(
      lat2
      * Math.PI
      / 180
    )
    *
    Math.sin(
      dLon / 2
    ) ** 2;

  return (
    2
    *
    earthRadius
    *
    Math.asin(
      Math.sqrt(
        a
      )
    )
  );
}

export async function POST(
  request:
    NextRequest
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const publishableKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

    const vapidPublicKey =
      process.env
        .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    const vapidPrivateKey =
      process.env
        .VAPID_PRIVATE_KEY;

    if (
      !supabaseUrl
      ||
      !publishableKey
      ||
      !serviceRoleKey
      ||
      !vapidPublicKey
      ||
      !vapidPrivateKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Configurazione server incompleta.'
        },
        {
          status: 500
        }
      );
    }

    const authorization =
      request.headers.get(
        'authorization'
      );

    const accessToken =
      authorization
        ?.replace(
          /^Bearer\s+/i,
          ''
        );

    if (
      !accessToken
    ) {
      return NextResponse.json(
        {
          ok: false
        },
        {
          status: 401
        }
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
      data: {
        user
      },
      error:
        userError
    } =
      await userClient.auth
        .getUser();

    if (
      userError
      ||
      !user
    ) {
      return NextResponse.json(
        {
          ok: false
        },
        {
          status: 401
        }
      );
    }

    let body:
      any;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Richiesta non valida.'
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
      ||
      typeof jobId !==
        'string'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'jobId mancante o non valido.'
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
            persistSession:
              false
          }
        }
      );

    const {
      data:
        job,
      error:
        jobError
    } =
      await admin
        .from(
          'jobs'
        )
        .select(
          'id,client_id,category_id,urgency,latitude,longitude,status'
        )
        .eq(
          'id',
          jobId
        )
        .maybeSingle();

    if (
      jobError
      ||
      !job
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Richiesta non trovata.'
        },
        {
          status: 404
        }
      );
    }

    if (
      job.client_id !==
      user.id
    ) {
      return NextResponse.json(
        {
          ok: false
        },
        {
          status: 403
        }
      );
    }

    if (
      job.status !==
      'aperta'
    ) {
      return NextResponse.json(
        {
          ok: true,
          sent: 0
        }
      );
    }

    const {
      data:
        categoryRows,
      error:
        categoryError
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

    if (
      categoryError
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

    const professionalIds =
      [
        ...new Set(
          (
            categoryRows
            ?? []
          ).map(
            (
              row:
                any
            ) =>
              row
                .professional_id
          )
        )
      ];

    if (
      professionalIds.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok: true,
          sent: 0
        }
      );
    }

    const {
      data:
        professionals,
      error:
        professionalsError
    } =
      await admin
        .from(
          'professionals'
        )
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
      data:
        availabilityRows,
      error:
        availabilityError
    } =
      await admin
        .from(
          'availability'
        )
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
        (
          availabilityRows
          ?? []
        ).map(
          (
            row:
              any
          ) => [
            row.professional_id,
            row.status
          ]
        )
      );

    const urgency =
      String(
        job.urgency
        ?? ''
      )
        .toLowerCase();

    const eligibleProfessionals =
      (
        professionals
        ?? []
      ).filter(
        (
          professional:
            any
        ) => {
          const availability =
            availabilityMap.get(
              professional.id
            );

          if (
            !availability
            ||
            availability ===
              'offline'
          ) {
            return false;
          }

          if (
            urgency ===
              'subito'
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
            urgency ===
              'oggi'
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
            job.latitude ==
              null
            ||
            job.longitude ==
              null
            ||
            professional.latitude ==
              null
            ||
            professional.longitude ==
              null
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
              professional
                .max_distance_km
              ?? 30
            );

          if (
            distance >
            radius
          ) {
            return false;
          }

          const estimatedMinutes =
            Math.ceil(
              distance
              * 2.2
              + 8
            );

          if (
            urgency ===
              'subito'
            &&
            estimatedMinutes >
              120
          ) {
            return false;
          }

          if (
            urgency ===
              'oggi'
            &&
            estimatedMinutes >
              240
          ) {
            return false;
          }

          return true;
        }
      );

    const targetIds =
      eligibleProfessionals
        .map(
          professional =>
            professional.id
        );

    if (
      targetIds.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok: true,
          sent: 0
        }
      );
    }

    const {
      data:
        subscriptions,
      error:
        subscriptionsError
    } =
      await admin
        .from(
          'push_subscriptions'
        )
        .select(
          'endpoint,p256dh,auth,user_id'
        )
        .in(
          'user_id',
          targetIds
        );

    if (
      subscriptionsError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Errore durante il caricamento delle notifiche.'
        },
        {
          status: 500
        }
      );
    }

    webpush
      .setVapidDetails(
        'mailto:noreply@lavorosubito.app',
        vapidPublicKey.trim(),
        vapidPrivateKey.trim()
      );

    let sent =
      0;

    for (
      const subscription
      of subscriptions
      ?? []
    ) {
      try {
        await webpush
          .sendNotification(
            {
              endpoint:
                subscription.endpoint,

              keys: {
                p256dh:
                  subscription.p256dh,

                auth:
                  subscription.auth
              }
            },
            JSON.stringify(
              {
                title:
                  'Nuovo lavoro compatibile',

                body:
                  'È disponibile un nuovo intervento compatibile nella tua zona.',

                url:
                  '/'
              }
            )
          );

        sent++;
      } catch {
      }
    }

    return NextResponse.json(
      {
        ok: true,
        sent
      }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Errore server.'
      },
      {
        status: 500
      }
    );
  }
}
