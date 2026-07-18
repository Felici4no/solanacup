import { describe, it, expect } from 'vitest'
import { TEAMS } from './assets'
import {
  getTeamIdentity,
  hasRealAsset,
  MISSING_TEAM_ASSETS,
} from './teamIdentity'

const TEAM_IDS = Object.keys(TEAMS)

describe('teamIdentity registry', () => {
  it('resolves an identity for every existing TEAMS id', () => {
    expect(TEAM_IDS).toHaveLength(11)
    for (const id of TEAM_IDS) {
      const identity = getTeamIdentity(id)
      expect(identity.id, id).toBe(id)
      expect(identity.name, id).toBe(TEAMS[id].name)
      expect(identity.shortName, id).toBe(TEAMS[id].short)
      expect(identity.kind, id).toBe(
        TEAMS[id].kind === 'nation' ? 'national' : 'club',
      )
    }
  })

  it('auto variant maps club → crest and national → flag', () => {
    for (const id of TEAM_IDS) {
      const identity = getTeamIdentity(id)
      if (identity.kind === 'club') {
        expect(identity.crestSrc, id).toBeTruthy()
        expect(identity.flagSrc, id).toBeUndefined()
      } else {
        expect(identity.flagSrc, id).toBeTruthy()
        expect(identity.crestSrc, id).toBeUndefined()
      }
    }
  })

  it('teams with assets expose a non-empty src and source "real"', () => {
    for (const id of TEAM_IDS) {
      if (!hasRealAsset(id)) continue
      const identity = getTeamIdentity(id)
      expect(identity.source, id).toBe('real')
      const src = identity.crestSrc ?? identity.flagSrc
      expect(typeof src, id).toBe('string')
      expect(src!.length, id).toBeGreaterThan(0)
    }
  })

  it('MISSING_TEAM_ASSETS matches exactly the teams without an asset', () => {
    const missing = TEAM_IDS.filter((id) => {
      const identity = getTeamIdentity(id)
      return !(identity.crestSrc ?? identity.flagSrc)
    })
    expect([...MISSING_TEAM_ASSETS].sort()).toEqual([...missing].sort())
    for (const id of MISSING_TEAM_ASSETS) {
      expect(hasRealAsset(id), id).toBe(false)
      expect(getTeamIdentity(id).source, id).toBe('fallback')
    }
  })

  it('keeps unknown ids total via a neutral fallback identity', () => {
    const unknown = getTeamIdentity('unknown-club')
    expect(unknown.source).toBe('fallback')
    expect(unknown.crestSrc).toBeUndefined()
    expect(unknown.flagSrc).toBeUndefined()
    expect(unknown.shortName).toBe('UNK')
  })
})
