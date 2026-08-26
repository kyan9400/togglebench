import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  Activity,
  Braces,
  Check,
  CircleDot,
  Copy,
  Download,
  FlaskConical,
  GitBranch,
  Play,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  Users,
} from 'lucide-react'
import { DEFAULT_CONTEXT, DEFAULT_FLAG, SAMPLE_CONTEXTS } from './data'
import { evaluateFlag, getObservedRollout } from './lib/evaluator'
import { loadFlag, saveFlag, serializeFlag } from './lib/storage'
import type {
  EnvironmentName,
  EnvironmentSettings,
  EvaluationContext,
  FlagConfig,
  TargetingRule,
} from './types'

const REASON_LABELS = {
  'flag-disabled': 'Flag disabled',
  'rule-match': 'Targeting rule',
  'percentage-rollout': 'Stable rollout',
  default: 'Default variation',
} as const

function cloneDefaultFlag(): FlagConfig {
  return structuredClone(DEFAULT_FLAG)
}

function RuleRow({
  rule,
  index,
  onToggle,
}: {
  rule: TargetingRule
  index: number
  onToggle: () => void
}) {
  return (
    <li className={rule.enabled ? 'rule-row' : 'rule-row rule-row--paused'}>
      <span className="rule-row__number">{String(index + 1).padStart(2, '0')}</span>
      <div className="rule-row__logic">
        <span>{rule.attribute}</span>
        <span>{rule.operator.replaceAll('_', ' ')}</span>
        <strong>{rule.value}</strong>
      </div>
      <span className={`variation-chip variation-chip--${rule.variation}`}>{rule.variation}</span>
      <button
        type="button"
        className="icon-button"
        onClick={onToggle}
        aria-label={`${rule.enabled ? 'Pause' : 'Enable'} rule ${index + 1}`}
        aria-pressed={rule.enabled}
      >
        {rule.enabled ? <Check aria-hidden="true" /> : <Play aria-hidden="true" />}
      </button>
    </li>
  )
}

function ContextField({
  label,
  name,
  value,
  onChange,
}: {
  label: string
  name: keyof EvaluationContext
  value: string
  onChange: (name: keyof EvaluationContext, value: string) => void
}) {
  return (
    <label className="context-field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(name, event.target.value)} spellCheck="false" />
    </label>
  )
}

export default function App() {
  const [flag, setFlag] = useState<FlagConfig>(loadFlag)
  const [environment, setEnvironment] = useState<EnvironmentName>('production')
  const [context, setContext] = useState<EvaluationContext>(DEFAULT_CONTEXT)
  const [copied, setCopied] = useState(false)
  const settings = flag.environments[environment]

  const evaluation = useMemo(
    () => evaluateFlag(flag, settings, context),
    [context, flag, settings],
  )
  const cohort = useMemo(
    () =>
      SAMPLE_CONTEXTS.map((sample) => ({
        context: sample,
        evaluation: evaluateFlag(flag, settings, sample),
      })),
    [flag, settings],
  )
  const observedRollout = useMemo(
    () => getObservedRollout(flag, settings),
    [flag, settings],
  )
  const treatmentCount = cohort.filter(({ evaluation: item }) => item.value).length

  useEffect(() => saveFlag(flag), [flag])

  function updateSettings(update: (current: EnvironmentSettings) => EnvironmentSettings) {
    setFlag((current) => ({
      ...current,
      environments: {
        ...current.environments,
        [environment]: update(current.environments[environment]),
      },
    }))
  }

  function updateContext(name: keyof EvaluationContext, value: string) {
    setContext((current) => ({ ...current, [name]: value }))
  }

  function toggleRule(ruleId: string) {
    updateSettings((current) => ({
      ...current,
      rules: current.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule,
      ),
    }))
  }

  async function copyConfiguration() {
    try {
      await navigator.clipboard.writeText(serializeFlag(flag))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  function downloadConfiguration() {
    const file = new Blob([serializeFlag(flag)], { type: 'application/json' })
    const url = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${flag.key}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function resetConfiguration() {
    setFlag(cloneDefaultFlag())
    setContext(DEFAULT_CONTEXT)
    setEnvironment('production')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="./" aria-label="ToggleBench home">
          <span className="brand__mark" aria-hidden="true">
            <SlidersHorizontal />
          </span>
          <span>ToggleBench</span>
        </a>
        <nav aria-label="Project links">
          <span className="runtime-status"><span aria-hidden="true" /> Local runtime</span>
          <a href="https://github.com/kyan9400/togglebench" target="_blank" rel="noreferrer">
            <GitBranch aria-hidden="true" /> Source
          </a>
        </nav>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div>
            <p className="kicker">Feature delivery workbench / 01</p>
            <h1 id="hero-title">Know exactly <em>why</em> a flag resolves.</h1>
          </div>
          <div className="hero__aside">
            <p>
              Model targeting rules, test user contexts, and inspect deterministic rollout assignments
              before configuration reaches production.
            </p>
            <div className="hero__proof">
              <span><ShieldCheck aria-hidden="true" /> Local only</span>
              <span><Braces aria-hidden="true" /> Exportable JSON</span>
              <span><Activity aria-hidden="true" /> Stable hashing</span>
            </div>
          </div>
        </section>

        <section className="workspace" aria-label="Feature flag workbench">
          <aside className="control-panel">
            <div className="panel-heading">
              <div>
                <p className="kicker">Flag configuration</p>
                <h2>{flag.name}</h2>
                <code>{flag.key}</code>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(event) =>
                    updateSettings((current) => ({ ...current, enabled: event.target.checked }))
                  }
                />
                <span aria-hidden="true" />
                <strong>{settings.enabled ? 'Live' : 'Off'}</strong>
              </label>
            </div>

            <div className="environment-tabs" role="group" aria-label="Environment">
              {(['production', 'staging'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={environment === item ? 'is-active' : ''}
                  onClick={() => setEnvironment(item)}
                  aria-pressed={environment === item}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="control-section">
              <div className="control-section__title">
                <span><Target aria-hidden="true" /> Ordered targeting</span>
                <small>{settings.rules.filter((rule) => rule.enabled).length} active</small>
              </div>
              {settings.rules.length > 0 ? (
                <ol className="rule-list">
                  {settings.rules.map((rule, index) => (
                    <RuleRow
                      key={rule.id}
                      rule={rule}
                      index={index}
                      onToggle={() => toggleRule(rule.id)}
                    />
                  ))}
                </ol>
              ) : (
                <p className="empty-rules">No explicit rules. Every context proceeds to rollout.</p>
              )}
            </div>

            <div className="control-section rollout-control">
              <div className="control-section__title">
                <span><Users aria-hidden="true" /> Percentage rollout</span>
                <strong>{settings.rolloutPercentage}%</strong>
              </div>
              <input
                aria-label="Treatment rollout percentage"
                type="range"
                min="0"
                max="100"
                step="1"
                value={settings.rolloutPercentage}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    rolloutPercentage: Number(event.target.value),
                  }))
                }
                style={{ '--rollout': `${settings.rolloutPercentage}%` } as CSSProperties}
              />
              <div className="range-labels" aria-hidden="true"><span>0</span><span>50</span><span>100</span></div>
              <p>
                Observed over 1,000 stable sample keys: <strong>{observedRollout.toFixed(1)}%</strong>
              </p>
            </div>

            <div className="config-actions">
              <button type="button" onClick={() => void copyConfiguration()}>
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
              <button type="button" onClick={downloadConfiguration}>
                <Download aria-hidden="true" /> Export
              </button>
              <button type="button" onClick={resetConfiguration} aria-label="Reset sample configuration">
                <RotateCcw aria-hidden="true" />
              </button>
            </div>
          </aside>

          <div className="evaluation-panel">
            <section className="context-card" aria-labelledby="context-heading">
              <div className="section-label">
                <span>01</span>
                <div>
                  <p className="kicker">Evaluation context</p>
                  <h2 id="context-heading">Change the subject.</h2>
                </div>
              </div>
              <div className="context-grid">
                <ContextField label="User key" name="key" value={context.key} onChange={updateContext} />
                <ContextField label="Country" name="country" value={context.country} onChange={updateContext} />
                <ContextField label="Plan" name="plan" value={context.plan} onChange={updateContext} />
                <ContextField label="Email" name="email" value={context.email} onChange={updateContext} />
              </div>
            </section>

            <section className={`decision-card decision-card--${evaluation.variation}`} aria-labelledby="decision-heading">
              <div className="decision-card__result">
                <p className="kicker">Resolved variation</p>
                <div className="decision-value">
                  <span aria-hidden="true"><CircleDot /></span>
                  <h2 id="decision-heading">{evaluation.variation}</h2>
                </div>
                <dl>
                  <div><dt>Value</dt><dd>{String(evaluation.value)}</dd></div>
                  <div><dt>Reason</dt><dd>{REASON_LABELS[evaluation.reason]}</dd></div>
                  <div><dt>Bucket</dt><dd>{evaluation.bucket === null ? '—' : evaluation.bucket.toString().padStart(4, '0')}</dd></div>
                </dl>
              </div>
              <div className="decision-card__trace">
                <div className="control-section__title">
                  <span><FlaskConical aria-hidden="true" /> Evaluation trace</span>
                  <small>{evaluation.trace.length} steps</small>
                </div>
                <ol>
                  {evaluation.trace.map((step, index) => (
                    <li key={`${step}-${index}`}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <p>{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          </div>
        </section>

        <section className="cohort-section" aria-labelledby="cohort-heading">
          <div className="cohort-heading">
            <div>
              <p className="kicker">Cohort explorer / 02</p>
              <h2 id="cohort-heading">One configuration. Eight explanations.</h2>
            </div>
            <p>
              {treatmentCount} of {cohort.length} sample contexts resolve to treatment. Rule matches
              remain stable even when rollout percentage changes.
            </p>
          </div>
          <div className="cohort-table-wrap">
            <table className="cohort-table">
              <thead>
                <tr><th scope="col">Subject</th><th scope="col">Market</th><th scope="col">Plan</th><th scope="col">Decision</th><th scope="col">Reason</th></tr>
              </thead>
              <tbody>
                {cohort.map(({ context: item, evaluation: itemEvaluation }) => (
                  <tr key={item.key}>
                    <th scope="row"><button type="button" onClick={() => setContext(item)}>{item.key}</button></th>
                    <td>{item.country}</td>
                    <td>{item.plan}</td>
                    <td><span className={`variation-chip variation-chip--${itemEvaluation.variation}`}>{itemEvaluation.variation}</span></td>
                    <td>{REASON_LABELS[itemEvaluation.reason]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer>
        <div><span className="brand brand--small"><span className="brand__mark" aria-hidden="true"><SlidersHorizontal /></span><span>ToggleBench</span></span><p>Make feature delivery explainable before it becomes operational.</p></div>
        <span className="footer-note">Deterministic by design · No network calls</span>
      </footer>
    </div>
  )
}
