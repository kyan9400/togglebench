import { describe, expect, it } from 'vitest'
import { DEFAULT_CONTEXT, DEFAULT_FLAG } from '../data'
import type { EnvironmentSettings, EvaluationContext } from '../types'
import { evaluateFlag, getObservedRollout, matches, rolloutBucket } from './evaluator'

const production = DEFAULT_FLAG.environments.production

describe('target matching', () => {
  it('normalizes values and supports comma-separated lists', () => {
    expect(matches(' DE ', 'one_of', 'NL, de, SE')).toBe(true)
    expect(matches('PRO', 'is', 'pro')).toBe(true)
    expect(matches('user@example.com', 'contains', '@example')).toBe(true)
    expect(matches('starter', 'is_not', 'enterprise')).toBe(true)
  })
})

describe('flag evaluation', () => {
  it('returns control immediately when the environment is disabled', () => {
    const settings: EnvironmentSettings = { ...production, enabled: false }
    const evaluation = evaluateFlag(DEFAULT_FLAG, settings, DEFAULT_CONTEXT)

    expect(evaluation.variation).toBe('control')
    expect(evaluation.reason).toBe('flag-disabled')
    expect(evaluation.bucket).toBeNull()
  })

  it('gives ordered rules precedence over percentage rollout', () => {
    const context: EvaluationContext = {
      key: 'always-control',
      country: 'DE',
      plan: 'starter',
      email: 'person@legacy.example',
    }
    const evaluation = evaluateFlag(DEFAULT_FLAG, production, context)

    expect(evaluation.variation).toBe('control')
    expect(evaluation.reason).toBe('rule-match')
    expect(evaluation.matchedRuleId).toBe('blocked-domain')
  })

  it('assigns the same context to the same stable bucket', () => {
    const first = rolloutBucket('checkout-redesign', 'usr_2048')
    const second = rolloutBucket('checkout-redesign', 'usr_2048')

    expect(first).toBe(second)
    expect(first).toBeGreaterThanOrEqual(0)
    expect(first).toBeLessThan(10_000)
  })

  it('tracks the configured rollout across a large deterministic sample', () => {
    const observed = getObservedRollout(DEFAULT_FLAG, production, 10_000)

    expect(observed).toBeGreaterThan(33)
    expect(observed).toBeLessThan(37)
  })

  it('returns a readable decision trace', () => {
    const evaluation = evaluateFlag(DEFAULT_FLAG, production, DEFAULT_CONTEXT)

    expect(evaluation.trace[0]).toContain('checkout-redesign')
    expect(evaluation.trace.at(-1)).toMatch(/Return (treatment|control)/)
  })
})
