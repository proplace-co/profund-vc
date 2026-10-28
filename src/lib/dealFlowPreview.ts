const PROPLACE = 'https://proplace.co';
const PROFUND_TOKEN = 'ERMTuBeSbTA9CfFJ';

/** Same live source as the GP's cockpit, with the investor presentation.
 *  28/10 — the access service decides who reads: `guest=gp` (the GP's own link: every gesture
 *  of the file) or `guest=lp` (an investor: read and discuss), and `lpk` signs the reader's
 *  messages in the deal discussion. Both are carried over; anything else stays `lp`. */
export function dealFlowPreview(serverSrc?: string): string {
  let token = PROFUND_TOKEN;
  let guest = 'lp';
  let lpk = '';
  try {
    const source = new URL(serverSrc || '', PROPLACE);
    if (source.origin === PROPLACE || source.origin === 'https://www.proplace.co') {
      const sharedToken = source.pathname.match(/^\/cibles\/([a-zA-Z0-9_-]{16,})\/?$/)?.[1];
      token = source.searchParams.get('cb') || source.searchParams.get('token') || sharedToken || token;
      if (source.searchParams.get('guest') === 'gp') guest = 'gp';
      const key = source.searchParams.get('lpk') || '';
      if (/^[A-Za-z0-9_-]{16,64}$/.test(key)) lpk = key;
    }
  } catch { /* Keep the known ProFund source if the access service omits its URL. */ }

  const preview = new URL('/fr/carte/', PROPLACE);
  preview.search = new URLSearchParams({
    cb: token, embed: '1', chrome: '0', ui: 'v2', teaser: '1', guest,
    ...(lpk ? { lpk } : {}),
    ticker: '0', onb: '0', ptab: '4', tab: 'callyes', dens: 'liste', win: 'all',
    memo_ui: 'reader16', cockpit_ui: 'aligned2',
  }).toString();
  return preview.href;
}
