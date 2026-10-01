const SUPABASE_FETCH_TIMEOUT_MS = 8_000;

export const fetchWithTimeout: typeof fetch = (input, init) =>
  fetch(input, {
    ...init,
    signal: init?.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(SUPABASE_FETCH_TIMEOUT_MS)])
      : AbortSignal.timeout(SUPABASE_FETCH_TIMEOUT_MS),
  });
