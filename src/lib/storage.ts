import { DEFAULT_FLAG } from '../data'
import type { FlagConfig } from '../types'

const STORAGE_KEY = 'togglebench:flag:v1'

function isFlagConfig(value: unknown): value is FlagConfig {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<FlagConfig>
  return (
    candidate.version === 1 &&
    typeof candidate.key === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.environments === 'object' &&
    candidate.environments !== null &&
    'production' in candidate.environments &&
    'staging' in candidate.environments
  )
}

export function loadFlag(): FlagConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_FLAG)
    const parsed: unknown = JSON.parse(raw)
    return isFlagConfig(parsed) ? parsed : structuredClone(DEFAULT_FLAG)
  } catch {
    return structuredClone(DEFAULT_FLAG)
  }
}

export function saveFlag(flag: FlagConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flag))
  } catch {
    // The workbench remains usable when browser storage is unavailable.
  }
}

export function serializeFlag(flag: FlagConfig): string {
  return `${JSON.stringify(flag, null, 2)}\n`
}
