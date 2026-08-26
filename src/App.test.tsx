import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('ToggleBench workbench', () => {
  beforeEach(() => localStorage.clear())

  it('evaluates edited contexts and exposes a readable trace', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.clear(screen.getByLabelText('Plan'))
    await user.type(screen.getByLabelText('Plan'), 'enterprise')

    expect(screen.getByRole('heading', { name: 'treatment' })).toBeInTheDocument()
    expect(screen.getByText(/Rule 1 matched/)).toBeInTheDocument()
    expect(screen.getAllByText('Targeting rule').length).toBeGreaterThan(0)
  })

  it('switches environments and updates the rollout control', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'staging' }))

    expect(screen.getByLabelText('Treatment rollout percentage')).toHaveValue('100')
    expect(screen.getByText('No explicit rules. Every context proceeds to rollout.')).toBeInTheDocument()
  })

  it('can pause an ordered rule', async () => {
    const user = userEvent.setup()
    render(<App />)

    const button = screen.getByRole('button', { name: 'Pause rule 1' })
    await user.click(button)

    expect(screen.getByRole('button', { name: 'Enable rule 1' })).toHaveAttribute('aria-pressed', 'false')
  })
})
