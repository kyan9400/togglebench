import type {
  EnvironmentSettings,
  EvaluationContext,
  EvaluationResult,
  FlagConfig,
  Operator,
  TargetingRule,
  Variation,
} from '../types'

const BUCKET_COUNT = 10_000

export function stableHash(value: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export function rolloutBucket(flagKey: string, contextKey: string): number {
  return stableHash(`${flagKey}:${contextKey}`) % BUCKET_COUNT
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase('en-US')
}

export function matches(value: string, operator: Operator, expected: string): boolean {
  const candidate = normalized(value)
  const target = normalized(expected)

  switch (operator) {
    case 'is':
      return candidate === target
    case 'is_not':
      return candidate !== target
    case 'contains':
      return candidate.includes(target)
    case 'one_of':
      return target
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .includes(candidate)
  }
}

function ruleSummary(rule: TargetingRule): string {
  const operator = rule.operator.replaceAll('_', ' ')
  return `${rule.attribute} ${operator} “${rule.value}”`
}

function result(
  variation: Variation,
  reason: EvaluationResult['reason'],
  trace: string[],
  bucket: number | null = null,
  matchedRuleId: string | null = null,
): EvaluationResult {
  return {
    variation,
    value: variation === 'treatment',
    reason,
    trace,
    bucket,
    matchedRuleId,
  }
}

export function evaluateFlag(
  flag: FlagConfig,
  settings: EnvironmentSettings,
  context: EvaluationContext,
): EvaluationResult {
  const trace = [`Read flag “${flag.key}”.`]

  if (!settings.enabled) {
    trace.push('Flag is disabled in this environment.', 'Return control.')
    return result('control', 'flag-disabled', trace)
  }

  trace.push('Flag is enabled. Evaluate targeting rules in order.')
  for (const [index, rule] of settings.rules.entries()) {
    if (!rule.enabled) {
      trace.push(`Rule ${index + 1} is paused. Skip.`)
      continue
    }

    const attributeValue = context[rule.attribute]
    if (matches(attributeValue, rule.operator, rule.value)) {
      trace.push(
        `Rule ${index + 1} matched: ${ruleSummary(rule)}.`,
        `Return ${rule.variation}.`,
      )
      return result(rule.variation, 'rule-match', trace, null, rule.id)
    }
    trace.push(`Rule ${index + 1} did not match: ${ruleSummary(rule)}.`)
  }

  const bucket = rolloutBucket(flag.key, context.key)
  const threshold = Math.round(settings.rolloutPercentage * 100)
  trace.push(
    `No rule matched. Stable bucket is ${bucket.toString().padStart(4, '0')} / 9999.`,
  )

  if (bucket < threshold) {
    trace.push(`Bucket is inside the ${settings.rolloutPercentage}% rollout. Return treatment.`)
    return result('treatment', 'percentage-rollout', trace, bucket)
  }

  trace.push(`Bucket is outside the ${settings.rolloutPercentage}% rollout. Return control.`)
  return result('control', settings.rolloutPercentage > 0 ? 'percentage-rollout' : 'default', trace, bucket)
}

export function getObservedRollout(
  flag: FlagConfig,
  settings: EnvironmentSettings,
  sampleSize = 1_000,
): number {
  let treatmentCount = 0
  for (let index = 0; index < sampleSize; index += 1) {
    const bucket = rolloutBucket(flag.key, `sample-${index}`)
    if (bucket < settings.rolloutPercentage * 100) treatmentCount += 1
  }
  return (treatmentCount / sampleSize) * 100
}
