export type EnvironmentName = 'production' | 'staging'
export type AttributeName = 'country' | 'plan' | 'email'
export type Operator = 'is' | 'is_not' | 'one_of' | 'contains'
export type Variation = 'treatment' | 'control'

export interface EvaluationContext {
  key: string
  country: string
  plan: string
  email: string
}

export interface TargetingRule {
  id: string
  enabled: boolean
  attribute: AttributeName
  operator: Operator
  value: string
  variation: Variation
}

export interface EnvironmentSettings {
  enabled: boolean
  rolloutPercentage: number
  rules: TargetingRule[]
}

export interface FlagConfig {
  version: 1
  key: string
  name: string
  description: string
  environments: Record<EnvironmentName, EnvironmentSettings>
}

export type EvaluationReason = 'flag-disabled' | 'rule-match' | 'percentage-rollout' | 'default'

export interface EvaluationResult {
  variation: Variation
  value: boolean
  reason: EvaluationReason
  bucket: number | null
  matchedRuleId: string | null
  trace: string[]
}
