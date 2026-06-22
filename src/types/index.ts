export interface Child {
  id: string
  name: string
  avatar: string
}

export interface Fact {
  id: number
  domain: 'addition' | 'multiplication'
  skill: string
  question: string
  answer: number
  strategy: string
}

export interface Attempt {
  id?: string
  child_id: string
  fact_id: number
  is_correct: boolean
  response_time_ms: number
  created_at?: string
}

export interface ChildStats {
  fact_id: number
  question: string
  accuracy: number
  avg_time_ms: number
  attempts_count: number
}

export interface AnswerRecord {
  factId: number
  correct: boolean
  responseTimeMs: number
}

// Per-fact stats dari satu sesi, keyed by factId
export interface FactSessionStat {
  question: string
  correct: number
  total: number
  totalTimeMs: number
}

// Summary sesi terakhir yang di-pass langsung ke SkillsPanel & DashboardPanel
export interface LastSessionSummary {
  skill: string
  domain: 'addition' | 'multiplication'
  perFact: Record<number, FactSessionStat>
}

export type Domain = 'addition' | 'multiplication'

export type Tab = 'practice' | 'skills' | 'dashboard'
