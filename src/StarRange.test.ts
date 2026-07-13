import { describe, it, expect } from 'vitest'
import {
  clamp,
  snapRating,
  ratingFromPointer,
  labelFor,
  ariaValueText,
  MATCH_STAR_LABELS,
  MOMENT_STAR_LABELS,
} from './StarRange'

describe('clamp', () => {
  it('bounds within range', () => {
    expect(clamp(3, 0.5, 5)).toBe(3)
    expect(clamp(-2, 0.5, 5)).toBe(0.5)
    expect(clamp(9, 0.5, 5)).toBe(5)
  })
})

describe('snapRating', () => {
  it('snaps to the nearest half', () => {
    expect(snapRating(2.24)).toBe(2)
    expect(snapRating(2.25)).toBe(2.5)
    expect(snapRating(4.7)).toBe(4.5)
    expect(snapRating(4.8)).toBe(5)
    expect(snapRating(3.0)).toBe(3)
  })
  it('never returns 0 — minimum is 0.5', () => {
    expect(snapRating(0)).toBe(0.5)
    expect(snapRating(0.1)).toBe(0.5)
    expect(snapRating(-5)).toBe(0.5)
  })
  it('clamps the maximum to 5', () => {
    expect(snapRating(5.4)).toBe(5)
    expect(snapRating(99)).toBe(5)
  })
  it('only produces valid 0.5-step values', () => {
    for (let x = -1; x <= 6; x += 0.07) {
      const v = snapRating(x)
      expect(v).toBeGreaterThanOrEqual(0.5)
      expect(v).toBeLessThanOrEqual(5)
      expect(Number.isInteger(v * 2)).toBe(true)
    }
  })
})

describe('ratingFromPointer', () => {
  const left = 100
  const width = 200 // 40px per star

  it('maps left edge to the minimum 0.5', () => {
    expect(ratingFromPointer(100, left, width)).toBe(0.5)
    expect(ratingFromPointer(90, left, width)).toBe(0.5) // left of the track
  })
  it('maps the right edge to 5', () => {
    expect(ratingFromPointer(300, left, width)).toBe(5)
    expect(ratingFromPointer(400, left, width)).toBe(5)
  })
  it('maps the middle to 2.5', () => {
    expect(ratingFromPointer(200, left, width)).toBe(2.5)
  })
  it('snaps a position near 3.5 stars', () => {
    // 3.5/5 * 200 + 100 = 240
    expect(ratingFromPointer(240, left, width)).toBe(3.5)
    expect(ratingFromPointer(236, left, width)).toBe(3.5)
  })
  it('is safe with zero width', () => {
    expect(ratingFromPointer(150, 100, 0)).toBe(0.5)
  })
})

describe('labelFor — 5 bands, each spanning 1.0', () => {
  it('maps match rating bands', () => {
    expect(labelFor(0.5, MATCH_STAR_LABELS)).toBe('Forgettable')
    expect(labelFor(1.0, MATCH_STAR_LABELS)).toBe('Forgettable')
    expect(labelFor(1.5, MATCH_STAR_LABELS)).toBe('Had its moments')
    expect(labelFor(2.0, MATCH_STAR_LABELS)).toBe('Had its moments')
    expect(labelFor(2.5, MATCH_STAR_LABELS)).toBe('Memorable')
    expect(labelFor(3.0, MATCH_STAR_LABELS)).toBe('Memorable')
    expect(labelFor(3.5, MATCH_STAR_LABELS)).toBe('Remarkable')
    expect(labelFor(4.0, MATCH_STAR_LABELS)).toBe('Remarkable')
    expect(labelFor(4.5, MATCH_STAR_LABELS)).toBe('Part of my story')
    expect(labelFor(5.0, MATCH_STAR_LABELS)).toBe('Part of my story')
  })
  it('uses the moment model with the same band boundaries', () => {
    expect(labelFor(0.5, MOMENT_STAR_LABELS)).toBe('Passed by')
    expect(labelFor(3.0, MOMENT_STAR_LABELS)).toBe('Stayed with me')
    expect(labelFor(5.0, MOMENT_STAR_LABELS)).toBe('Part of my story')
  })
  it('returns empty string when unrated', () => {
    expect(labelFor(null, MATCH_STAR_LABELS)).toBe('')
  })
})

describe('ariaValueText', () => {
  it('reads value + semantic label', () => {
    expect(ariaValueText(4.5, MATCH_STAR_LABELS)).toBe('4.5 out of 5, Part of my story')
  })
  it('announces unrated', () => {
    expect(ariaValueText(null, MATCH_STAR_LABELS)).toBe('Not rated')
  })
})
