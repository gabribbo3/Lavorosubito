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

  let emailDebug =
    'Email: chiamata non eseguita.';

  try {
    const {
      data: sessionData
    } =
      await supabase.auth
        .getSession();

    const accessToken =
      sessionData
        .session
        ?.access_token;

    if (
      !accessToken
    ) {
      emailDebug =
        'Email debug: token utente mancante.';
    } else {
      const emailResponse =
        await fetch(
          '/api/email/new-job',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${accessToken}`
            },

            body:
              JSON.stringify({
                jobId
              })
          }
        );

      let emailResult:
        any = null;

      try {
        emailResult =
          await emailResponse
            .json();
      } catch {
        emailResult = null;
      }

      emailDebug =
        `EMAIL DEBUG → HTTP ${emailResponse.status} → ${JSON.stringify(emailResult)}`;

      try {
        await fetch(
          '/api/push/send',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${accessToken}`
            },

            body:
              JSON.stringify({
                jobId
              })
          }
        );
      } catch {
      }
    }
  } catch (
    error
  ) {
    emailDebug =
      `EMAIL DEBUG → errore chiamata: ${
        error instanceof Error
          ? error.message
          : 'errore sconosciuto'
      }`;
  }

  setMessage(
    `${
      first
        ? '✅ Professionista compatibile trovato.'
        : '✅ Richiesta creata. Nessun professionista compatibile al momento.'
    }

${emailDebug}`
  );

  setBusy(false);
}
