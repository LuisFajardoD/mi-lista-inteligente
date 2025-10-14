import { useEffect, useState } from 'react'

export type Plan = 'free' | 'premium' | 'b2b'
const KEY = 'demo.plan'

function readStoredPlan(): Plan {
  const v = (localStorage.getItem(KEY) || 'free') as Plan
  return v === 'premium' || v === 'b2b' ? v : 'free'
}

export function usePlan() {
  const [plan, setPlanState] = useState<Plan>('free')

  useEffect(() => {
    setPlanState(readStoredPlan())
  }, [])

  function setPlan(next: Plan) {
    localStorage.setItem(KEY, next)
    setPlanState(next)
  }

  return { plan, setPlan }
}
