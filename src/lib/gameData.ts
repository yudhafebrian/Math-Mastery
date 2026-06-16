import { Fact } from '../types'

export const INDIVIDUAL_MODES = ['fill', 'mc', 'tf', 'speed', 'balloon'] as const
export type IndividualMode = typeof INDIVIDUAL_MODES[number]
export type QuestionType = 'individual' | 'match'

export const ADDITION_SKILL_ORDER = ['Make 10', 'Doubles', 'Near Doubles', 'Add 9', 'Mixed Addition']
export const MULTIPLY_SKILL_ORDER = ['×1', '×10', '×2', '×5', '×4', '×3', '×6', '×9', '×7', '×8']

export const SKILL_ORDERS: Record<string, string[]> = {
  addition: ADDITION_SKILL_ORDER,
  multiplication: MULTIPLY_SKILL_ORDER,
}

export type ParsedNormalFact = {
  isReverse: false
  operandA: number
  operator: string
  operandB: number
}

export type ParsedReverseFact = {
  isReverse: true
  blankPosition: 'first' | 'second'
  operator: string
  knownOperand: number
  total: number
}

export type ParsedFact = ParsedNormalFact | ParsedReverseFact

export function isReverseFact(fact: Fact | { question: string }): boolean {
  return fact.question.includes('_')
}

export function parseFactQuestion(fact: Fact): ParsedFact {
  const parts = fact.question.split(' ')
  if (parts.length === 3 || !parts.includes('_')) {
    return {
      isReverse: false,
      operandA: parseInt(parts[0]),
      operator: parts[1],
      operandB: parseInt(parts[2]),
    }
  }
  if (parts[0] === '_') {
    return {
      isReverse: true,
      blankPosition: 'first',
      operator: parts[1],
      knownOperand: parseInt(parts[2]),
      total: parseInt(parts[parts.length - 1]),
    }
  }
  return {
    isReverse: true,
    blankPosition: 'second',
    operator: parts[1],
    knownOperand: parseInt(parts[0]),
    total: parseInt(parts[parts.length - 1]),
  }
}

export interface IndividualQueueItem {
  type: 'individual'
  fact: Fact
  mode: IndividualMode
}

export interface MatchQueueItem {
  type: 'match'
  facts: Fact[]
}

export type QueueItem = IndividualQueueItem | MatchQueueItem

export interface AnswerRecord {
  factId: number
  correct: boolean
  responseTimeMs: number
}

export function buildSessionQueue(skillFacts: Fact[]): QueueItem[] {
  const queue: QueueItem[] = []
  const modesLen = INDIVIDUAL_MODES.length

  for (let i = 0; i < skillFacts.length; i++) {
    queue.push({
      type: 'individual',
      fact: skillFacts[i],
      mode: INDIVIDUAL_MODES[i % modesLen],
    })
    // Insert a match round every 5 individual questions
    if ((i + 1) % 5 === 0) {
      const start = i - 4
      queue.push({ type: 'match', facts: skillFacts.slice(start, start + 5) })
    }
  }
  // If there are leftover facts (less than 5 at the end), add a final match round
  const remainder = skillFacts.length % 5
  if (remainder > 0) {
    const lastMatchStart = skillFacts.length - remainder
    queue.push({ type: 'match', facts: skillFacts.slice(lastMatchStart) })
  }

  return queue
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface SkillMastery {
  accuracy: number
  avgTime: number
  attemptsCount: number
  mastered: boolean
}

export function computeSkillMastery(
  attempts: Array<{ is_correct: boolean; response_time_ms: number; fact: { skill: string } | null }>
): Record<string, SkillMastery> {
  const stats: Record<string, { correct: number; total: number; totalTime: number }> = {}

  for (const a of attempts) {
    if (!a.fact) continue
    const skill = a.fact.skill
    if (!stats[skill]) stats[skill] = { correct: 0, total: 0, totalTime: 0 }
    stats[skill].total += 1
    if (a.is_correct) stats[skill].correct += 1
    stats[skill].totalTime += a.response_time_ms
  }

  const result: Record<string, SkillMastery> = {}
  for (const [skill, s] of Object.entries(stats)) {
    const accuracy = Math.round((s.correct / s.total) * 100)
    const avgTime = s.totalTime / s.total / 1000
    result[skill] = {
      accuracy,
      avgTime,
      attemptsCount: s.total,
      mastered: accuracy >= 90 && avgTime <= 3,
    }
  }
  return result
}

export function findFirstUnmasteredSkill(
  domain: string,
  skillMastery: Record<string, SkillMastery>
): string {
  const order = SKILL_ORDERS[domain] || []
  for (const skill of order) {
    const m = skillMastery[skill]
    if (!m || !m.mastered) return skill
  }
  // All skills mastered, return last one (could unlock something else)
  return order[order.length - 1]
}
