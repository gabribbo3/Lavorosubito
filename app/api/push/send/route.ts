import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY!;

const vapidPublicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY!;

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

webpush.setVapidDetails(
  'mailto:info@lavorosubito.it',
  vapidPublicKey,
  vapidPrivateKey
);

export async function POST(
  request: NextRequest
) {
  try {
    const authHeader =
      request.headers.get('authorization');

    const token =
      authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const {
      data: userData,
      error: userError
    } =
      await supabaseAdmin.auth.getUser(
        token
      );

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        { error: 'Sessione non valida' },
        { status: 401 }
      );
    }

    const { jobId } =
      await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId mancante' },
        { status: 400 }
      );
    }

    const {
      data: job,
      error: jobError
    } =
      await supabaseAdmin
        .from('jobs')
        .select(
          'id, client_id, description, urgency'
        )
        .eq('id', jobId)
        .single();

    if (
      jobError ||
      !job
    ) {
      return NextResponse.json(
        { error: 'Lavoro non trovato' },
        { status: 404 }
      );
    }

    if (
      job.client_id !==
      userData.user.id
    ) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 403 }
      );
    }

    const {
      data: matches,
      error: matchError
    } =
      await supabaseAdmin.rpc(
        'find_professionals_for_job',
        {
          p_job_id: jobId
        }
      );

    if (matchError) {
      throw matchError;
    }

    const professionalIds =
      (matches ?? [])
        .filter(
          (match: any) =>
            match.availability_status !==
            'offline'
        )
        .map(
          (match: any) =>
            match.professional_id
        );

    if (
      professionalIds.length === 0
    ) {
      return NextResponse.json({
        success: true,
        sent: 0
      });
    }

    const {
      data: subscriptions,
      error: subscriptionError
    } =
      await supabaseAdmin
        .from('push_subscriptions')
        .select(
          'id, user_id, endpoint, p256dh, auth'
        )
        .in(
          'user_id',
          professionalIds
        );

    if (subscriptionError) {
      throw subscriptionError;
    }

    let sent = 0;

    for (
      const subscription
      of subscriptions ?? []
    ) {
      try {
        await webpush.sendNotification(
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
          JSON.stringify({
            title:
              job.urgency === 'subito'
                ? '🚨 Nuovo lavoro urgente'
                : '🔔 Nuova richiesta LavoroSubito',

            body:
              job.description,

            url: '/'
          })
        );

        sent++;
      } catch (error: any) {
        if (
          error?.statusCode === 404 ||
          error?.statusCode === 410
        ) {
          await supabaseAdmin
            .from(
              'push_subscriptions'
            )
            .delete()
            .eq(
              'id',
              subscription.id
            );
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent
    });
  } catch (error: any) {
    console.error(
      'Push error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Errore notifiche'
      },
      { status: 500 }
    );
  }
}
