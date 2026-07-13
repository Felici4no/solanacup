import type { MatchData } from './MatchCover'

/* Editorial mock content, now match-centric so every item has identity. */

export const BRAND = 'Vez'
export const BRAND_SUB = 'Memories live here'

export const profile = {
  name: 'Lucas Feliciano',
  initials: 'LF',
  since: '2026',
  location: 'São Paulo, SP',
  tagline: 'Vivo o esporte através da memória.',
  statement:
    'Tricolor since birth. A life measured in matches, stadiums and the people beside me.',
  club: 'São Paulo FC',
  nation: 'Brazil',
  colorId: 'saopaulo',
  stats: [
    { n: '128', l: 'Partidas' },
    { n: '32', l: 'Este ano' },
    { n: '24', l: 'Estádios' },
  ],
  clubs: [
    { id: 'saopaulo', label: 'São Paulo' },
    { id: 'riverplate', label: 'River Plate' },
    { id: 'realmadrid', label: 'Real Madrid' },
    { id: 'liverpool', label: 'Liverpool' },
  ],
  marcante: {
    date: '17 · 05 · 2023',
    title: 'São Paulo 2 x 1 Corinthians',
    meta: 'Morumbi · Copa do Brasil',
    quote: 'Aquele gol no fim. A explosão. Eu gritei até perder a voz.',
    home: 'saopaulo',
    away: 'corinthians',
  },
  collections: [
    { icon: 'ticket', label: 'Ingressos', count: '23' },
    { icon: 'shirt', label: 'Camisas', count: '07' },
    { icon: 'trophy', label: 'Conquistas', count: '11' },
  ],
  streak: { count: '5 partidas acompanhadas', sub: 'Continue criando memórias.' },
}

/* SECTION 1 — Today's Chapter (hero) */
export const todaysChapter: MatchData & { minute: string; liveScore: string; fullTime: string } = {
  home: 'saopaulo',
  away: 'riverplate',
  competition: 'libertadores',
  stage: 'Semifinal',
  venue: 'Morumbi',
  kickoff: 'Tonight · 21:30',
  minute: 'Live · 63’',
  liveScore: '1 — 0',
  fullTime: '2 — 1',
}

/* SECTION 2 — Continue a memory */
export const continueMemory = {
  match: {
    home: 'brazil',
    away: 'argentina',
    competition: 'worldcup',
    stage: 'Final',
  } as MatchData,
  line: 'You started this memory after the final whistle — but never finished it.',
}

/* SECTION 3 — On this day */
export const onThisDay = {
  when: 'One year ago today',
  match: {
    home: 'brazil',
    away: 'argentina',
    competition: 'worldcup',
    date: '2022',
    variant: 'historic',
    status: 'Ended',
    score: '3 — 3',
  } as MatchData,
  rating: 5,
  withWhom: 'Watched with your father',
  moment: 'Favorite moment · 87’',
  excerpt: 'The whole street went quiet, then broke loose all at once.',
}

/* SECTION 4 — Community moment */
export const communityMoment = {
  match: {
    home: 'saopaulo',
    away: 'riverplate',
    competition: 'libertadores',
  } as MatchData,
  insight: '2,318 people entered this stadium for the first time today.',
}

/* Hall of Memories — favorite four (poster grid) */
export const hallOfMemories: { rank: string; match: MatchData }[] = [
  { rank: 'I', match: { home: 'saopaulo', away: 'liverpool', competition: 'clubworldcup', date: '2005', score: '1 — 0', status: 'Ended' } },
  { rank: 'II', match: { home: 'argentina', away: 'france', competition: 'worldcup', stage: 'Final', date: '2022', score: '3 — 3', status: 'Ended' } },
  { rank: 'III', match: { home: 'brazil', away: 'germany', competition: 'worldcup', date: '2002', score: '2 — 0', status: 'Ended' } },
  { rank: 'IV', match: { home: 'liverpool', away: 'milan', competition: 'ucl', stage: 'Final', date: '2005', score: '3 — 3', status: 'Ended' } },
]

/* Featured memory — editorial artifact */
export const featuredMemory = {
  match: {
    home: 'saopaulo',
    away: 'liverpool',
    competition: 'clubworldcup',
    stage: 'Final',
    date: '18 December 2005',
    venue: 'Yokohama',
    score: '1 — 0',
    status: 'Ended',
  } as MatchData,
  rating: 5,
  where: 'Grandfather’s living room, Santos',
  withWhom: 'My grandfather, Antônio',
  player: 'Rogério Ceni',
  moment: 'Every save in the final ten minutes.',
  note: 'He barely spoke during the match. When the whistle blew he just squeezed my shoulder and said, “Now you understand.” I did. I still do.',
  id: '0247',
}

export const recentMemories = [
  {
    match: { home: 'saopaulo', away: 'corinthians', competition: 'paulistao', score: '2 — 0', status: 'Ended' } as MatchData,
    date: '12 Mar 2026',
    rating: 5,
    where: 'Morumbi, São Paulo',
  },
  {
    match: { home: 'argentina', away: 'france', competition: 'worldcup', stage: 'Final', score: '3 — 3', status: 'Ended' } as MatchData,
    date: '18 Dec 2022',
    rating: 5,
    where: 'A bar in Pinheiros',
  },
  {
    match: { home: 'liverpool', away: 'milan', competition: 'ucl', stage: 'Final', score: '3 — 3', status: 'Ended', variant: 'historic' } as MatchData,
    date: '25 May 2005',
    rating: 4,
    where: 'Grandfather’s living room',
  },
]

/* Radar — editorial stories, not rankings */
export const radarLead = {
  match: { home: 'liverpool', away: 'milan', competition: 'ucl', stage: 'Final', date: '2005', score: '3 — 3', status: 'Ended', variant: 'historic' } as MatchData,
  quote: 'The comeback that felt like a dream — three goals in six minutes.',
  meta: '1.2M memories',
}
export const radarStories = [
  {
    match: { home: 'argentina', away: 'france', competition: 'worldcup', stage: 'Final', date: '2022', score: '3 — 3', status: 'Ended' } as MatchData,
    quote: 'A final decided in the very last kick.',
    meta: '2.1M memories',
  },
  {
    match: { home: 'brazil', away: 'germany', competition: 'worldcup', date: '2014', score: '1 — 7', status: 'Ended', variant: 'historic' } as MatchData,
    quote: 'The day an entire country cried together.',
    meta: '3.4M memories',
  },
]

export const suggested = {
  competitions: [
    { id: 'worldcup', label: 'World Cup' },
    { id: 'ucl', label: 'Champions League' },
    { id: 'libertadores', label: 'Libertadores' },
  ],
  clubs: [
    { id: 'saopaulo', label: 'São Paulo' },
    { id: 'liverpool', label: 'Liverpool' },
    { id: 'realmadrid', label: 'Real Madrid' },
  ],
  players: [
    { name: 'Kaká', colorId: 'saopaulo', sub: 'Playmaker' },
    { name: 'Messi', colorId: 'argentina', sub: 'Forward' },
    { name: 'Rogério Ceni', colorId: 'saopaulo', sub: 'Goalkeeper' },
  ],
  stadiums: [
    { name: 'Morumbi', city: 'São Paulo', tint: '#c0392b' },
    { name: 'Anfield', city: 'Liverpool', tint: '#C8102E' },
    { name: 'Maracanã', city: 'Rio', tint: '#3a6ea5' },
  ],
}

export const recentSearches = ['Brazil vs Argentina', 'Morumbi 2005', 'Kaká', 'Libertadores final']

export const searchResults = [
  { match: { home: 'brazil', away: 'argentina', competition: 'worldcup', date: '2026' } as MatchData, memories: '2.4M' },
  { match: { home: 'saopaulo', away: 'liverpool', competition: 'clubworldcup', date: '2005', score: '1 — 0' } as MatchData, memories: '740K' },
  { match: { home: 'realmadrid', away: 'milan', competition: 'ucl', date: '2002' } as MatchData, memories: '910K' },
]

export const favoritePlayers = [
  { name: 'Kaká', colorId: 'saopaulo', apps: '48', rating: '4.6', first: '2003', last: '2013' },
  { name: 'Rogério Ceni', colorId: 'saopaulo', apps: '61', rating: '4.8', first: '2001', last: '2015' },
  { name: 'Lionel Messi', colorId: 'argentina', apps: '33', rating: '4.9', first: '2009', last: '2024' },
]

export const stadiums = [
  { name: 'Morumbi', city: 'São Paulo', tint: '#c0392b' },
  { name: 'Maracanã', city: 'Rio de Janeiro', tint: '#3a6ea5' },
  { name: 'La Bombonera', city: 'Buenos Aires', tint: '#2b6cb0' },
  { name: 'Anfield', city: 'Liverpool', tint: '#C8102E' },
]

export const timeline = [
  { yr: '2026', ev: 'First Libertadores final in person.', mark: true },
  { yr: '2022', ev: 'Watched the World Cup final with 40 strangers who became friends.' },
  { yr: '2014', ev: 'Learned that heartbreak has a scoreline.' },
  { yr: '2005', ev: 'Grandfather showed me what football means.', mark: true },
]

/* ============================================================ WATCHLIST */
export type WatchMatch = {
  match: MatchData
  date: string
  venue?: string
  broadcast?: string
  friends?: { mono: string; color: string }[]
  saved?: boolean
  note?: string
}

export const watchlist: { today: WatchMatch[]; week: WatchMatch[]; later: WatchMatch[]; pastUnregistered: WatchMatch[] } = {
  today: [
    {
      match: { home: 'saopaulo', away: 'riverplate', competition: 'libertadores', stage: 'Semifinal', venue: 'Morumbi', kickoff: '21:30' },
      date: 'Tonight · 21:30',
      venue: 'Morumbi',
      broadcast: 'Paramount+ · Globo',
      friends: [{ mono: 'M', color: '#c0392b' }, { mono: 'J', color: '#2b6cb0' }, { mono: 'R', color: '#6b46c1' }],
      saved: true,
    },
  ],
  week: [
    {
      match: { home: 'brazil', away: 'england', competition: 'worldcup', stage: 'Friendly' },
      date: '23 Mar · 16:00',
      venue: 'Wembley Stadium',
      broadcast: 'Globo',
      friends: [{ mono: 'A', color: '#009C3B' }, { mono: 'T', color: '#CF081F' }],
      saved: true,
    },
    {
      match: { home: 'realmadrid', away: 'liverpool', competition: 'ucl', stage: 'Quarterfinal' },
      date: '24 Mar · 21:00',
      venue: 'Santiago Bernabéu',
      broadcast: 'Max',
      saved: true,
    },
  ],
  later: [
    {
      match: { home: 'argentina', away: 'france', competition: 'worldcup', stage: 'Friendly' },
      date: 'Mar 22',
      venue: 'Monumental',
      broadcast: 'TBD',
      saved: true,
    },
  ],
  pastUnregistered: [
    {
      match: { home: 'saopaulo', away: 'corinthians', competition: 'paulistao', score: '2 — 0', status: 'Ended' },
      date: '2 days ago',
      venue: 'Morumbi',
      note: 'You watched this — but never wrote the memory.',
      saved: true,
    },
  ],
}

// COMING UP on Home — the next saved chapters (tonight's match is already the hero).
export const comingUp: WatchMatch[] = [watchlist.week[0], watchlist.week[1], watchlist.later[0]]

/* ============================================================ MATCH DETAIL */
export const matchDetail = {
  base: { home: 'saopaulo', away: 'riverplate', competition: 'libertadores', stage: 'Semifinal · First leg', venue: 'Morumbi', kickoff: 'Tonight · 21:30' } as MatchData,
  minute: 'Live · 63’',
  liveScore: '1 — 0',
  fullTime: '2 — 1',
  connection: {
    pre: { text: 'You plan to watch this match.', sub: 'Saved to your Watchlist · reminder on' },
    live: { text: 'You’re watching this match.', sub: 'Memory in progress · with your father' },
    post: { text: 'This became part of your Libertadores 2026 chapter.', sub: 'Watched with your father · your first Libertadores semifinal' },
  },
  pulse: {
    avg: 4.6,
    memories: 1204,
    firstTimers: 2318,
    stadium: 'Morumbi',
    topReaction: 'Disbelief',
    topMoment: 'Calleri’s goal at 87’',
    familyPct: 41,
    editorial:
      'A tense, low first half gave way to a final ten minutes the community will not forget — decided in the air, in front of the north stand.',
  },
  communityRating: { avg: 4.1, count: 12482 },
  distribution: [64, 24, 8, 3, 1], // 5→1 %
  moments: [
    { min: '87’', type: 'Goal', player: 'Calleri', impact: 4.8, reaction: '“I couldn’t believe it.”', favorites: 1842, key: true,
      notes: [
        { mono: 'LF', txt: 'My father grabbed my shoulder before the ball even crossed the line.' },
        { mono: 'MA', txt: 'The entire stand moved at once.' },
      ] },
    { min: '63’', type: 'Chance', player: 'Lucas Moura', impact: 3.9, reaction: '“I froze.”', favorites: 640,
      notes: [{ mono: 'JP', txt: 'You could hear the whole stadium inhale.' }] },
    { min: '12’', type: 'Yellow card', player: 'Rivero', impact: 2.3, reaction: '“Caught my attention.”', favorites: 118, notes: [] },
  ],
  comments: [
    { anchor: 'Calleri’s goal · 87’', name: 'Marina', mono: 'MA', text: 'I’ve rewatched it forty times and I still stand up every time.', tag: 'At the stadium' },
    { anchor: 'the stadium atmosphere', name: 'João', mono: 'JP', text: 'Morumbi under the floodlights is a cathedral. Nothing sounds like it.', tag: 'First Libertadores match' },
    { anchor: 'the starting lineup', name: 'Rafael', mono: 'RF', text: 'Bold call leaving Ferreira on the bench — it paid off.', tag: 'Neutral supporter' },
  ],
  anchors: ['Calleri’s goal · 87’', 'The atmosphere', 'The lineup', 'What it meant to you'],
  lineups: {
    home: {
      name: 'São Paulo', form: '4-2-3-1', coach: 'Luis Zubeldía',
      starters: [
        { n: 1, name: 'Rafael' }, { n: 13, name: 'Igor Vinícius' }, { n: 3, name: 'Arboleda' },
        { n: 26, name: 'Alan Franco' }, { n: 6, name: 'Welington' }, { n: 5, name: 'Alisson' },
        { n: 25, name: 'Bobadilla' }, { n: 7, name: 'Lucas Moura' }, { n: 11, name: 'Luciano' },
        { n: 10, name: 'Ferreirinha' }, { n: 9, name: 'Calleri' },
      ],
    },
    away: {
      name: 'River Plate', form: '4-3-1-2', coach: 'Marcelo Gallardo',
      starters: [
        { n: 1, name: 'Armani' }, { n: 4, name: 'Montiel' }, { n: 17, name: 'Paulo Díaz' },
        { n: 6, name: 'Martínez Quarta' }, { n: 3, name: 'Acuña' }, { n: 24, name: 'Enzo Pérez' },
        { n: 8, name: 'Aliendro' }, { n: 11, name: 'Rivero' }, { n: 10, name: 'M. Suárez' },
        { n: 16, name: 'Colidio' }, { n: 9, name: 'Borja' },
      ],
    },
  },
  official: {
    stats: [
      { label: 'Possession', h: 58, a: 42, hv: '58%', av: '42%' },
      { label: 'Shots', h: 62, a: 38, hv: '14', av: '9' },
      { label: 'On target', h: 60, a: 40, hv: '6', av: '4' },
      { label: 'Corners', h: 64, a: 36, hv: '7', av: '4' },
    ],
    referee: 'Wilton Sampaio (BRA)',
    broadcast: 'Paramount+ · Globo',
  },
  stadium: {
    name: 'Estádio do Morumbi',
    city: 'São Paulo',
    country: 'Brazil',
    capacity: '66,795',
    club: 'São Paulo FC',
    tint: '#c0392b',
    model3d: 'future',
  },
}
