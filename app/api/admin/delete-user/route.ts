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
        user: currentUser
      },
      error: userError
    } =
      await userClient.auth
        .getUser();

    if (
      userError ||
      !currentUser
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

    const {
      data: isAdmin,
      error: adminCheckError
    } =
      await userClient.rpc(
        'is_current_user_admin'
      );

    if (
      adminCheckError ||
      isAdmin !== true
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Accesso amministratore richiesto.'
        },
        {
          status: 403
        }
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
          error:
            'Richiesta non valida.'
        },
        {
          status: 400
        }
      );
    }

    const userId =
      body?.userId;

    if (
      !userId ||
      typeof userId !==
        'string'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'ID utente non valido.'
        },
        {
          status: 400
        }
      );
    }

    /*
      Protezione fondamentale:
      l'amministratore non può
      cancellare il proprio account.
    */
    if (
      userId ===
      currentUser.id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Non puoi eliminare il tuo account amministratore.'
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

    /*
      Controlliamo che l'account
      da eliminare esista.
    */
    const {
      data: targetProfile,
      error: profileError
    } =
      await admin
        .from('profiles')
        .select(
          'id,is_admin,role'
        )
        .eq(
          'id',
          userId
        )
        .maybeSingle();

    if (
      profileError ||
      !targetProfile
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Utente non trovato.'
        },
        {
          status: 404
        }
      );
    }

    /*
      Non permettiamo di eliminare
      nessun altro amministratore.
    */
    if (
      targetProfile.is_admin ===
      true
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Non è possibile eliminare un account amministratore.'
        },
        {
          status: 400
        }
      );
    }

    /*
      Queste due relazioni sono
      NO ACTION nel database.
      Le recensioni devono essere
      eliminate prima dell'account.
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
          userId
        );

    if (
      clientReviewsError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Errore eliminazione recensioni cliente: ${clientReviewsError.message}`
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
          userId
        );

    if (
      professionalReviewsError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Errore eliminazione recensioni professionista: ${professionalReviewsError.message}`
        },
        {
          status: 500
        }
      );
    }

    /*
      Eliminando auth.users,
      le relazioni CASCADE già
      configurate eliminano i dati
      collegati.
    */
    const {
      error:
        deleteUserError
    } =
      await admin.auth.admin
        .deleteUser(
          userId
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
      'ADMIN DELETE USER ERROR:',
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          'Errore server durante l’eliminazione.'
      },
      {
        status: 500
      }
    );
  }
}
