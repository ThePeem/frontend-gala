export type ResultsPhase = 'PRE_GALA' | 'LIVE' | 'POST_GALA';
export const RESULTS_PHASE_OVERRIDE_KEY = 'results_phase_debug';

export function useResultsPhase(dateGala: Date) {
  let phase: ResultsPhase = 'PRE_GALA';
  const now = new Date();

  // 1) Override desde localStorage (admin)
  if (typeof window !== 'undefined') {
    const ls = window.localStorage.getItem(RESULTS_PHASE_OVERRIDE_KEY);
    if (ls === 'live') return { phase: 'LIVE' as ResultsPhase };
    if (ls === 'pre') return { phase: 'PRE_GALA' as ResultsPhase };
    if (ls === 'post') return { phase: 'POST_GALA' as ResultsPhase };
  }

  // 2) Override por query param (?debug=live|pre|post)
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const debug = params?.get('debug');
  if (debug === 'live') return { phase: 'LIVE' as ResultsPhase };
  if (debug === 'pre') return { phase: 'PRE_GALA' as ResultsPhase };
  if (debug === 'post') return { phase: 'POST_GALA' as ResultsPhase };

  // 3) Cálculo por fecha
  if (now < dateGala) phase = 'PRE_GALA';
  else if (now.toDateString() === dateGala.toDateString() || now < new Date(dateGala.getTime() + 24*60*60*1000)) phase = 'LIVE';
  else phase = 'POST_GALA';

  return { phase };
}
