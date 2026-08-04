import { useEffect, useState } from 'react'

export function useReferenceTime(suppliedNow?: Date) {
  const [liveTime, setLiveTime] = useState(() => new Date())

  useEffect(() => {
    if (suppliedNow) {
      return
    }

    const timer = window.setInterval(() => setLiveTime(new Date()), 60_000)

    return () => window.clearInterval(timer)
  }, [suppliedNow])

  return suppliedNow ?? liveTime
}
