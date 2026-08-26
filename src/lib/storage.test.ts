import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_FLAG } from '../data'
import { loadFlag, saveFlag, serializeFlag } from './storage'

describe('versioned configuration storage', () => {
  beforeEach(() => localStorage.clear())

  it('returns the sample flag when storage is empty or malformed', () => {
    expect(loadFlag()).toEqual(DEFAULT_FLAG)
    localStorage.setItem('togglebench:flag:v1', '{broken')
    expect(loadFlag()).toEqual(DEFAULT_FLAG)
  })

  it('round-trips valid configuration', () => {
    const changed = structuredClone(DEFAULT_FLAG)
    changed.environments.production.rolloutPercentage = 61
    saveFlag(changed)

    expect(loadFlag().environments.production.rolloutPercentage).toBe(61)
    expect(serializeFlag(changed)).toContain('"rolloutPercentage": 61')
  })
})
