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
    const body = await request.json();

    const {
      userIds,
      title,
      message,
      url = '/'
    } = body;

    if (
      !Array.isArray(userIds) ||
      userIds.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'Nessun destinatario'
        },
        {
          status: 400
        }
      );
    }

    const {
      data: subscriptions,
      error
    } = await supabaseAdmin
      .from('push_subscriptions')
      .select(
        'id, user_id, endpoint, p256dh, auth'
      )
      .in(
        'user_id',
        userIds
      );

    if (error) {
      throw error;
    }

    if (
      !subscriptions ||
      subscriptions.length === 0
    ) {
      return NextResponse.json({
        success: true,
        sent: 0
      });
    }

    let sent = 0;

    for (
      const subscription
      of subscriptions
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
              title ||
              'LavoroSubito',

            body:
              message ||
              'Hai una nuova richiesta di intervento.',

            url
          })
        );

        sent++;
      } catch (pushError: any) {
        if (
          pushError?.statusCode ===
            404 ||
          pushError?.statusCode ===
            410
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
          'Errore invio notifiche'
      },
      {
        status: 500
      }
    );
  }
}
