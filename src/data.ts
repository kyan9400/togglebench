import type { EvaluationContext, FlagConfig } from './types'

export const DEFAULT_FLAG: FlagConfig = {
  version: 1,
  key: 'checkout-redesign',
  name: 'Checkout redesign',
  description: 'Progressively expose the new checkout flow while preserving deterministic assignments.',
  environments: {
    production: {
      enabled: true,
      rolloutPercentage: 35,
      rules: [
        {
          id: 'enterprise-plan',
          enabled: true,
          attribute: 'plan',
          operator: 'is',
          value: 'enterprise',
          variation: 'treatment',
        },
        {
          id: 'blocked-domain',
          enabled: true,
          attribute: 'email',
          operator: 'contains',
          value: '@legacy.example',
          variation: 'control',
        },
        {
          id: 'launch-markets',
          enabled: true,
          attribute: 'country',
          operator: 'one_of',
          value: 'DE, NL, SE',
          variation: 'treatment',
        },
      ],
    },
    staging: {
      enabled: true,
      rolloutPercentage: 100,
      rules: [],
    },
  },
}

export const SAMPLE_CONTEXTS: EvaluationContext[] = [
  { key: 'usr_1042', country: 'DE', plan: 'pro', email: 'mina@example.com' },
  { key: 'usr_2088', country: 'US', plan: 'starter', email: 'noah@example.com' },
  { key: 'usr_3110', country: 'FR', plan: 'enterprise', email: 'ines@northwind.dev' },
  { key: 'usr_4821', country: 'GB', plan: 'pro', email: 'leo@legacy.example' },
  { key: 'usr_5902', country: 'CA', plan: 'starter', email: 'ava@example.com' },
  { key: 'usr_6344', country: 'NL', plan: 'pro', email: 'sam@example.com' },
  { key: 'usr_7741', country: 'AU', plan: 'pro', email: 'kai@example.com' },
  { key: 'usr_8915', country: 'US', plan: 'starter', email: 'zoe@example.com' },
]

export const DEFAULT_CONTEXT = SAMPLE_CONTEXTS[1]
