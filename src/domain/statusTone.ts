import type { ReserveStatus, TitleStatus } from './types'

export type StatusTone = 'critical' | 'neutral' | 'positive' | 'warning'

export function getTitleTone(titleStatus: TitleStatus): StatusTone {
  if (titleStatus === 'Clean') {
    return 'positive'
  }

  return titleStatus === 'Rebuilt' ? 'warning' : 'critical'
}

export function getReserveTone(reserveStatus: ReserveStatus): StatusTone {
  if (reserveStatus === 'Reserve met') {
    return 'positive'
  }

  return reserveStatus === 'Reserve not met' ? 'warning' : 'neutral'
}

export function getConflictingTitleMention(
  titleStatus: TitleStatus,
  conditionReport: string,
): TitleStatus | null {
  const mentionedStatus = (['Clean', 'Rebuilt', 'Salvage'] as const).find(
    (status) => new RegExp(`\\b${status} title\\b`, 'i').test(conditionReport),
  )

  return mentionedStatus && mentionedStatus !== titleStatus
    ? mentionedStatus
    : null
}
