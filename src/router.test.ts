// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { parseRoute, profileUrl, chapterUrl } from './router'

describe('public route parsing', () => {
  it('maps the public surfaces', () => {
    expect(parseRoute('/welcome')).toEqual({ name: 'welcome' })
    expect(parseRoute('/u/demo')).toEqual({ name: 'publicProfile', username: 'demo' })
    expect(parseRoute('/chapters/ch-eng-arg-85')).toEqual({ name: 'publicChapter', chapterId: 'ch-eng-arg-85' })
  })
  it('decodes URL components', () => {
    expect(parseRoute('/u/dem%C3%B3')).toEqual({ name: 'publicProfile', username: 'demó' })
  })
  it('sends everything else to the app (SPA rewrite target)', () => {
    expect(parseRoute('/')).toEqual({ name: 'app' })
    expect(parseRoute('/u')).toEqual({ name: 'app' })
    expect(parseRoute('/chapters')).toEqual({ name: 'app' })
    expect(parseRoute('/anything/else')).toEqual({ name: 'app' })
  })
})

describe('shareable URLs', () => {
  it('builds absolute public links', () => {
    expect(profileUrl('demo')).toBe(`${window.location.origin}/u/demo`)
    expect(chapterUrl('ch-eng-arg-85')).toBe(`${window.location.origin}/chapters/ch-eng-arg-85`)
  })
})
