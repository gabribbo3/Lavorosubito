import {
  NextRequest,
  NextResponse
} from 'next/server';

import {
  createClient
} from '@supabase/supabase-js';

export async function POST(
  request: NextRequest
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

    if (
      !supabaseUrl ||
      !publishableKey ||
      !serviceRoleKey
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
      authorization?.replace(
        /^Bearer\s+/i,
        ''
      );

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Accesso non autorizzato.'
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
      error: userError
    } =
      await userClient.auth
        .getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Sessione non valida.'
        },
        {
          status: 401
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

    /*
      Proteggiamo gli account Admin.
      Un amministratore non può
      auto-eliminarsi dal sito.
    */
    const {
      data: profile,
      error: profileError
    } =
      await admin
        .from('profiles')
        .select(
          'id,is_admin'
        )
        .eq(
          'id',
          user.id
        )
        .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Errore durante il controllo dell’account.'
        },
        {
          status: 500
        }
      );
    }

    if (
      profile?.is_admin ===
      true
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'L’account amministratore non può essere eliminato da questa funzione.'
        },
        {
          status: 403
        }
      );
    }

    /*
      Queste relazioni sono NO ACTION
      nel database, quindi rimuoviamo
      prima le recensioni collegate.
    */
    const {
      error:
        clientReviewsError
    } =
      await admin
        .from('reviews')
        .delete()
        .eq(
          'client_id',
          user.id
        );

    if (
      clientReviewsError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Errore eliminazione recensioni: ${clientReviewsError.message}`
        },
        {
          status: 500
        }
      );
    }

    const {
      error:
        professionalReviewsError
    } =
      await admin
        .from('reviews')
        .delete()
        .eq(
          'professional_id',
          user.id
        );

    if (
      professionalReviewsError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Errore eliminazione recensioni: ${professionalReviewsError.message}`
        },
        {
          status: 500
        }
      );
    }

    /*
      Eliminiamo definitivamente
      l'utente da Supabase Auth.
      Le relazioni CASCADE già
      configurate rimuovono i dati
      collegati.
    */
    const {
      error:
        deleteUserError
    } =
      await admin.auth.admin
        .deleteUser(
          user.id
        );

    if (
      deleteUserError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Errore eliminazione account: ${deleteUserError.message}`
        },
        {
          status: 500
        }
      );
    }

    return NextResponse.json({
      ok: true
    });
  } catch (error) {
    console.error(
      'ACCOUNT DELETE ERROR:',
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          'Errore server durante l’eliminazione dell’account.'
      },
      {
        status: 500
      }
    );
  }
}
