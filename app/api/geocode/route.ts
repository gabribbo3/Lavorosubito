import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest
) {
  try {
    const searchParams =
      request.nextUrl.searchParams;

    const city =
      searchParams
        .get('city')
        ?.trim();

    const postalCode =
      searchParams
        .get('postalCode')
        ?.trim();

    if (
      !city &&
      !postalCode
    ) {
      return NextResponse.json(
        {
          error:
            'Inserisci almeno città o CAP.'
        },
        {
          status: 400
        }
      );
    }

    const query = [
      postalCode,
      city,
      'Italia'
    ]
      .filter(Boolean)
      .join(', ');

    const url =
      new URL(
        'https://nominatim.openstreetmap.org/search'
      );

    url.searchParams.set(
      'q',
      query
    );

    url.searchParams.set(
      'format',
      'jsonv2'
    );

    url.searchParams.set(
      'limit',
      '1'
    );

    url.searchParams.set(
      'countrycodes',
      'it'
    );

    const response =
      await fetch(
        url.toString(),
        {
          headers: {
            'User-Agent':
              'LavoroSubito/1.0',
            'Accept-Language':
              'it'
          },
          cache: 'no-store'
        }
      );

    if (
      !response.ok
    ) {
      return NextResponse.json(
        {
          error:
            'Servizio di localizzazione non disponibile.'
        },
        {
          status: 502
        }
      );
    }

    const results =
      await response.json();

    if (
      !Array.isArray(results)
      ||
      !results.length
    ) {
      return NextResponse.json(
        {
          error:
            'Località non trovata. Controlla città e CAP.'
        },
        {
          status: 404
        }
      );
    }

    const result =
      results[0];

    const latitude =
      Number(result.lat);

    const longitude =
      Number(result.lon);

    if (
      !Number.isFinite(latitude)
      ||
      !Number.isFinite(longitude)
    ) {
      return NextResponse.json(
        {
          error:
            'Coordinate non valide.'
        },
        {
          status: 500
        }
      );
    }

    return NextResponse.json({
      latitude,
      longitude,
      displayName:
        result.display_name
        ?? query
    });
  } catch {
    return NextResponse.json(
      {
        error:
          'Errore durante la ricerca della località.'
      },
      {
        status: 500
      }
    );
  }
}
