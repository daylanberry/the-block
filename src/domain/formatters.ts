const cadFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
})

const integerFormatter = new Intl.NumberFormat('en-CA', {
  maximumFractionDigits: 0,
})

const auctionDateFormatter = new Intl.DateTimeFormat('en-CA', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export function formatCurrency(amount: number) {
  return cadFormatter.format(amount)
}

export function formatOdometer(odometerKm: number) {
  return `${integerFormatter.format(odometerKm)} km`
}

export function formatAuctionStart(auctionStart: Date) {
  return auctionDateFormatter.format(auctionStart)
}
