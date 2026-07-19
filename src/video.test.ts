import { describe, it, expect } from 'vitest'
import {
  markerForEvent,
  sortedMarkers,
  isPlayableMarker,
  pastClipEnd,
  youtubeWatchUrl,
  youtubeThumbUrl,
  formatVideoOffset,
  matchBroadcast,
  eventVideoMarkers,
  WC_MATCH_ID,
  type EventVideoMarker,
} from './video'
import { pulseMatch } from './pulse'

const m = (over: Partial<EventVideoMarker>): EventVideoMarker => ({
  id: 'vm-x',
  matchId: WC_MATCH_ID,
  eventId: 'e85',
  videoId: 'abc',
  startSeconds: 100,
  label: 'x',
  gameMinute: 85,
  eventType: 'goal',
  source: 'demo',
  ...over,
})

describe('marker resolution', () => {
  it('finds the clip for a pulse event by its stable id', () => {
    expect(markerForEvent(eventVideoMarkers, 'e85')?.id).toBe('vm-e85')
  })
  it('returns null for events without a mapped clip', () => {
    expect(markerForEvent(eventVideoMarkers, 'e36')).toBeNull()
    expect(markerForEvent(eventVideoMarkers, 'e51')).toBeNull()
  })
  it('returns null when nothing is selected', () => {
    expect(markerForEvent(eventVideoMarkers, null)).toBeNull()
    expect(markerForEvent(eventVideoMarkers, undefined)).toBeNull()
  })
  it('orders the in-player list by match clock', () => {
    const minutes = sortedMarkers(eventVideoMarkers).map((x) => x.gameMinute)
    expect(minutes).toEqual([...minutes].sort((a, b) => a - b))
  })
})

describe('marker validity', () => {
  it('accepts a sane manual timestamp', () => {
    expect(isPlayableMarker(m({ startSeconds: 0 }))).toBe(true)
    expect(isPlayableMarker(m({ startSeconds: 17112, endSeconds: 17195 }))).toBe(true)
  })
  it('rejects invalid timestamps', () => {
    expect(isPlayableMarker(m({ startSeconds: -3 }))).toBe(false)
    expect(isPlayableMarker(m({ startSeconds: NaN }))).toBe(false)
    expect(isPlayableMarker(m({ startSeconds: 100, endSeconds: 90 }))).toBe(false)
  })
  it('respects endSeconds only when present', () => {
    expect(pastClipEnd(m({ startSeconds: 100, endSeconds: 120 }), 121)).toBe(true)
    expect(pastClipEnd(m({ startSeconds: 100, endSeconds: 120 }), 110)).toBe(false)
    expect(pastClipEnd(m({ startSeconds: 100 }), 99999)).toBe(false)
  })
})

describe('origin links', () => {
  it('builds a timestamped watch URL — origin never hidden', () => {
    expect(youtubeWatchUrl('QcmQ_zCf8vc', 17512)).toBe('https://www.youtube.com/watch?v=QcmQ_zCf8vc&t=17512s')
    expect(youtubeWatchUrl('QcmQ_zCf8vc')).toBe('https://www.youtube.com/watch?v=QcmQ_zCf8vc')
  })
  it('points at the official thumbnail CDN', () => {
    expect(youtubeThumbUrl('QcmQ_zCf8vc')).toContain('i.ytimg.com/vi/QcmQ_zCf8vc')
  })
  it('formats broadcast offsets for display', () => {
    expect(formatVideoOffset(17512)).toBe('4:51:52')
    expect(formatVideoOffset(65)).toBe('1:05')
    expect(formatVideoOffset(0)).toBe('0:00')
  })
})

/* ============================================================
   Seed integrity — the demo mapping obeys the domain rules.
   ============================================================ */
describe('seeded demo mapping', () => {
  it('is explicitly demo-tagged, video and markers alike', () => {
    expect(matchBroadcast.source).toBe('demo')
    expect(eventVideoMarkers.every((x) => x.source === 'demo')).toBe(true)
  })
  it('links every marker to an existing pulse event, one clip per event', () => {
    const ids = pulseMatch.events.map((e) => e.id)
    expect(eventVideoMarkers.every((x) => ids.includes(x.eventId))).toBe(true)
    const evs = eventVideoMarkers.map((x) => x.eventId)
    expect(new Set(evs).size).toBe(evs.length)
  })
  it('keeps gameMinute in sync with the pulse event it shows', () => {
    for (const x of eventVideoMarkers) {
      const ev = pulseMatch.events.find((e) => e.id === x.eventId)!
      expect(x.gameMinute).toBe(ev.minute)
    }
  })
  it('never derives startSeconds from the match clock', () => {
    // The broadcast VOD includes hours of pre-show + halftime: a marker whose
    // offset equals gameMinute * 60 would be a computed lie, not a located clip.
    for (const x of eventVideoMarkers) {
      expect(x.startSeconds).not.toBe(x.gameMinute * 60)
    }
  })
  it('covers the required demo range: goal, card, chance and substitution', () => {
    const types = new Set(eventVideoMarkers.map((x) => x.eventType))
    expect(types.has('goal')).toBe(true)
    expect(types.has('card')).toBe(true)
    expect(types.has('chance')).toBe(true)
    expect(types.has('substitution')).toBe(true)
  })
  it('gives every goal its own distinct timestamp', () => {
    const goals = eventVideoMarkers.filter((x) => x.eventType === 'goal')
    expect(goals.length).toBeGreaterThanOrEqual(3)
    expect(new Set(goals.map((x) => x.startSeconds)).size).toBe(goals.length)
  })
  it('is playable end to end (sane manual timestamps)', () => {
    expect(eventVideoMarkers.every(isPlayableMarker)).toBe(true)
    expect(eventVideoMarkers.every((x) => x.videoId === matchBroadcast.videoId)).toBe(true)
  })
})
