/* ============================================================
   Match Cover foundation — teams, competitions, color science,
   and thin Crest/Flag wrappers over the TeamMark system, which
   renders REAL official crests and flags (see teamIdentity.ts).
   ============================================================ */

import { TeamMark } from './TeamMark'

export type Team = {
  id: string
  name: string
  short: string
  city?: string
  kind: 'club' | 'nation'
  /** [primary, secondary, accent] — restrained, identity-referencing */
  colors: [string, string, string]
  /** ISO-ish code for national flag rendering */
  flag?: FlagCode
}

export type Competition = {
  id: string
  label: string
  short: string
  accent: string
}

/* ---- Color helpers ---- */
function toRgb(hex: string) {
  const h = hex.replace('#', '')
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16,
  )
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}
export function rgba(hex: string, a: number) {
  const { r, g, b } = toRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
function mix(hex: string, target: string, t: number) {
  const a = toRgb(hex)
  const b = toRgb(target)
  const r = Math.round(a.r + (b.r - a.r) * t)
  const g = Math.round(a.g + (b.g - a.g) * t)
  const bb = Math.round(a.b + (b.b - a.b) * t)
  return `rgb(${r}, ${g}, ${bb})`
}
const NIGHT = '#0d0d11'
export const darken = (hex: string, t = 0.6) => mix(hex, NIGHT, t)

/* Cinematic cover background from the two teams' colors. */
export function coverGradient(
  home: Team,
  away: Team,
  variant: 'night' | 'historic' = 'night',
) {
  if (variant === 'historic') {
    return [
      `radial-gradient(120% 90% at 20% 0%, rgba(196,182,160,0.16) 0%, transparent 55%)`,
      `linear-gradient(165deg, #26221d 0%, #16130f 55%, #0e0c0a 100%)`,
    ].join(', ')
  }
  const h = home.colors[0]
  const a = away.colors[0]
  return [
    `radial-gradient(130% 80% at 12% -5%, ${rgba(h, 0.55)} 0%, transparent 52%)`,
    `radial-gradient(130% 80% at 90% 8%, ${rgba(a, 0.5)} 0%, transparent 52%)`,
    `linear-gradient(158deg, ${darken(h, 0.5)} 0%, ${NIGHT} 48%, ${darken(
      a,
      0.5,
    )} 100%)`,
  ].join(', ')
}

/* ---- Registries ---- */
export const TEAMS: Record<string, Team> = {
  saopaulo: { id: 'saopaulo', name: 'São Paulo', short: 'SPF', city: 'São Paulo', kind: 'club', colors: ['#E4032E', '#111114', '#F2EEE6'] },
  riverplate: { id: 'riverplate', name: 'River Plate', short: 'RIV', city: 'Buenos Aires', kind: 'club', colors: ['#8f939b', '#C81E2E', '#F2EEE6'] },
  corinthians: { id: 'corinthians', name: 'Corinthians', short: 'COR', city: 'São Paulo', kind: 'club', colors: ['#111114', '#F2EEE6', '#9AA0A6'] },
  liverpool: { id: 'liverpool', name: 'Liverpool', short: 'LFC', city: 'Liverpool', kind: 'club', colors: ['#C8102E', '#00B2A9', '#F6C544'] },
  milan: { id: 'milan', name: 'Milan', short: 'ACM', city: 'Milan', kind: 'club', colors: ['#12100F', '#A50021', '#F2EEE6'] },
  realmadrid: { id: 'realmadrid', name: 'Real Madrid', short: 'RMA', city: 'Madrid', kind: 'club', colors: ['#e9e4d6', '#FEBE10', '#00509E'] },

  brazil: { id: 'brazil', name: 'Brazil', short: 'BRA', kind: 'nation', colors: ['#009C3B', '#FFDF00', '#002776'], flag: 'BR' },
  argentina: { id: 'argentina', name: 'Argentina', short: 'ARG', kind: 'nation', colors: ['#75AADB', '#F2EEE6', '#F6B40E'], flag: 'AR' },
  germany: { id: 'germany', name: 'Germany', short: 'GER', kind: 'nation', colors: ['#111114', '#DD0000', '#FFCE00'], flag: 'DE' },
  france: { id: 'france', name: 'France', short: 'FRA', kind: 'nation', colors: ['#0055A4', '#F2EEE6', '#EF4135'], flag: 'FR' },
  england: { id: 'england', name: 'England', short: 'ENG', kind: 'nation', colors: ['#CF081F', '#F2EEE6', '#00247D'], flag: 'EN' },
}

export const COMPETITIONS: Record<string, Competition> = {
  libertadores: { id: 'libertadores', label: 'Copa Libertadores', short: 'Libertadores', accent: '#C9A24B' },
  worldcup: { id: 'worldcup', label: 'FIFA World Cup', short: 'World Cup', accent: '#C9A24B' },
  clubworldcup: { id: 'clubworldcup', label: 'Club World Cup', short: 'Club World Cup', accent: '#C9A24B' },
  ucl: { id: 'ucl', label: 'Champions League', short: 'Champions League', accent: '#8FA0D6' },
  paulistao: { id: 'paulistao', label: 'Paulistão', short: 'Paulistão', accent: '#C6A15B' },
}

export function team(id: string): Team {
  return (
    TEAMS[id] ?? {
      id,
      name: id,
      short: id.slice(0, 3).toUpperCase(),
      kind: 'club',
      colors: ['#5A5A64', '#2A2A30', '#EDEDED'],
    }
  )
}
export function competition(id: string): Competition {
  return COMPETITIONS[id] ?? { id, label: id, short: id, accent: '#C6A15B' }
}

/* ============================================================
   Crest — real official club crests via TeamMark; national teams
   keep their historical behaviour of showing the flag roundel.
   ============================================================ */
export function Crest({ id, size = 40 }: { id: string; size?: number }) {
  const t = team(id)
  if (t.kind === 'nation' && t.flag) {
    return <Flag code={t.flag} size={size} shape="roundel" label={t.name} />
  }
  return <TeamMark teamId={t.id} size={size} variant="crest" shape="shield" />
}

/* ============================================================
   National flags — real official art via TeamMark. Roundel or rect.
   ============================================================ */
export type FlagCode = 'BR' | 'AR' | 'DE' | 'FR' | 'EN' | 'IT'

const FLAG_TEAM: Record<FlagCode, string> = {
  BR: 'brazil',
  AR: 'argentina',
  DE: 'germany',
  FR: 'france',
  EN: 'england',
  IT: 'italy',
}

export function Flag({
  code,
  size = 40,
  shape = 'roundel',
  label,
}: {
  code: FlagCode
  size?: number
  shape?: 'roundel' | 'rect'
  label?: string
}) {
  return (
    <TeamMark
      teamId={FLAG_TEAM[code]}
      size={size}
      shape={shape}
      variant="flag"
      label={label ?? code}
    />
  )
}
