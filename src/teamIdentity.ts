/* ============================================================
   Team identity — central registry of REAL marks (official club
   crests + national flags) with per-team colours carried over
   from the TEAMS palette in assets.tsx. Every identity surface
   (MatchCover, SplitCover, MatchDetail, Profile, Search,
   PlayerVisual) flows from here through TeamMark.

   Note: the registry is built lazily so the assets.tsx ↔
   teamIdentity.ts import cycle (assets.tsx renders TeamMark,
   which reads identities derived from TEAMS) can never hit a
   temporal-dead-zone access at module-init time.
   ============================================================ */

import { TEAMS } from './assets'

import saopauloCrest from './assets/teams/crests/saopaulo.svg'
import riverplateCrest from './assets/teams/crests/riverplate.svg'
import corinthiansCrest from './assets/teams/crests/corinthians.svg'
import liverpoolCrest from './assets/teams/crests/liverpool.svg'
import milanCrest from './assets/teams/crests/milan.svg'
import realmadridCrest from './assets/teams/crests/realmadrid.svg'

import brazilFlag from './assets/teams/flags/br.svg'
import argentinaFlag from './assets/teams/flags/ar.svg'
import germanyFlag from './assets/teams/flags/de.svg'
import franceFlag from './assets/teams/flags/fr.svg'
import englandFlag from './assets/teams/flags/gb-eng.svg'
import italyFlag from './assets/teams/flags/it.svg'

export type TeamIdentity = {
  id: string
  kind: 'national' | 'club'
  name: string
  shortName: string
  crestSrc?: string // clubs
  flagSrc?: string // nations
  primaryColor: string
  secondaryColor: string
  accentColor: string
  neutralOnDark: string
  source: 'real' | 'fallback'
}

/** Shared warm paper neutral used when a team's palette has none. */
const PAPER = '#F2EEE6'

type IdentitySeed = {
  id: string
  crestSrc?: string
  flagSrc?: string
  neutralOnDark?: string
  /** Only required when id is absent from TEAMS (flag-only identities). */
  name?: string
  shortName?: string
  kind?: 'national' | 'club'
  colors?: [string, string, string]
}

const SEEDS: IdentitySeed[] = [
  { id: 'saopaulo', crestSrc: saopauloCrest },
  { id: 'riverplate', crestSrc: riverplateCrest },
  { id: 'corinthians', crestSrc: corinthiansCrest },
  { id: 'liverpool', crestSrc: liverpoolCrest },
  { id: 'milan', crestSrc: milanCrest },
  { id: 'realmadrid', crestSrc: realmadridCrest, neutralOnDark: '#e9e4d6' },
  { id: 'brazil', flagSrc: brazilFlag },
  { id: 'argentina', flagSrc: argentinaFlag },
  { id: 'germany', flagSrc: germanyFlag },
  { id: 'france', flagSrc: franceFlag },
  { id: 'england', flagSrc: englandFlag },
  {
    // flag-only identity: referenced by FlagCode 'IT', not a TEAMS entry
    id: 'italy',
    flagSrc: italyFlag,
    name: 'Italy',
    shortName: 'ITA',
    kind: 'national',
    colors: ['#008C45', PAPER, '#CD212A'],
  },
]

function buildIdentity(seed: IdentitySeed): TeamIdentity {
  const t = TEAMS[seed.id]
  const colors: [string, string, string] =
    t?.colors ?? seed.colors ?? ['#5A5A64', '#2A2A30', '#EDEDED']
  const [primaryColor, secondaryColor, accentColor] = colors
  const hasAsset = Boolean(seed.crestSrc ?? seed.flagSrc)
  return {
    id: seed.id,
    kind:
      seed.kind ?? (t?.kind === 'nation' ? 'national' : 'club'),
    name: t?.name ?? seed.name ?? seed.id,
    shortName: t?.short ?? seed.shortName ?? seed.id.slice(0, 3).toUpperCase(),
    crestSrc: seed.crestSrc,
    flagSrc: seed.flagSrc,
    primaryColor,
    secondaryColor,
    accentColor,
    neutralOnDark: seed.neutralOnDark ?? PAPER,
    source: hasAsset ? 'real' : 'fallback',
  }
}

let cache: Record<string, TeamIdentity> | null = null
function registry(): Record<string, TeamIdentity> {
  if (!cache) {
    cache = Object.fromEntries(SEEDS.map((s) => [s.id, buildIdentity(s)]))
  }
  return cache
}

export function getTeamIdentity(id: string): TeamIdentity {
  const hit = registry()[id]
  if (hit) return hit
  // Unknown id — neutral fallback identity, keeps callers total.
  const t = TEAMS[id]
  return {
    id,
    kind: t?.kind === 'nation' ? 'national' : 'club',
    name: t?.name ?? id,
    shortName: t?.short ?? id.slice(0, 3).toUpperCase(),
    primaryColor: t?.colors[0] ?? '#5A5A64',
    secondaryColor: t?.colors[1] ?? '#2A2A30',
    accentColor: t?.colors[2] ?? '#EDEDED',
    neutralOnDark: PAPER,
    source: 'fallback',
  }
}

export function hasRealAsset(id: string): boolean {
  const seed = SEEDS.find((s) => s.id === id)
  return Boolean(seed && (seed.crestSrc ?? seed.flagSrc))
}

/** Registry teams with no real crest/flag asset on disk. */
export const MISSING_TEAM_ASSETS: string[] = SEEDS.filter(
  (s) => !(s.crestSrc ?? s.flagSrc),
).map((s) => s.id)
