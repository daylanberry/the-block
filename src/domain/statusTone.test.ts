import { describe, expect, it } from 'vitest'

import {
  getConflictingTitleMention,
  getReserveTone,
  getTitleTone,
} from './statusTone'

describe('status tone', () => {
  it.each([
    ['Clean', 'positive'],
    ['Rebuilt', 'warning'],
    ['Salvage', 'critical'],
  ] as const)('maps %s titles to the %s tone', (status, tone) => {
    expect(getTitleTone(status)).toBe(tone)
  })

  it.each([
    ['No reserve', 'neutral'],
    ['Reserve not met', 'warning'],
    ['Reserve met', 'positive'],
  ] as const)('maps %s reserve states to the %s tone', (status, tone) => {
    expect(getReserveTone(status)).toBe(tone)
  })

  it('flags title language that conflicts with the title record', () => {
    expect(
      getConflictingTitleMention(
        'Clean',
        'Good condition overall. Salvage title documentation supplied.',
      ),
    ).toBe('Salvage')
    expect(
      getConflictingTitleMention('Clean', 'Clean title documentation supplied.'),
    ).toBeNull()
    expect(
      getConflictingTitleMention('Clean', 'No title language in this report.'),
    ).toBeNull()
  })
})
