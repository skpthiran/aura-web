const REJECTED_KEY = 'aura_rejected_signals'

export function getRejectedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(REJECTED_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

export function addRejectedId(id: string) {
  try {
    const set = getRejectedIds()
    set.add(id)
    localStorage.setItem(REJECTED_KEY, JSON.stringify([...set]))
  } catch {
    // Silently ignore storage errors
  }
}

export function clearRejected() {
  localStorage.removeItem(REJECTED_KEY)
}
