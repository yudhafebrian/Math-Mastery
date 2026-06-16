import { useState, useEffect, useRef } from 'react'
import { Fact, AnswerRecord } from '../types'

interface Pair {
  leftId: string
  factId: number
  leftText: string
  rightText: string
}

interface MatchPanelProps {
  facts: Fact[]
  domain: 'addition' | 'multiplication'
  roundNumber: number
  totalRounds: number
  onAnswer: (results: AnswerRecord[]) => void
}

const shuffleArr = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildPairs(facts: Fact[], domain: 'addition' | 'multiplication'): Pair[] {
  const normalFacts = facts.filter(f => !f.question.includes('_'))
  const uniqueAnswers = [...new Set(normalFacts.map(f => f.answer))]
  const isSameAnswer = uniqueAnswers.length === 1 && domain === 'addition' && normalFacts.length === facts.length

  const shuffled = shuffleArr(facts)
  const seen = new Set<string>()
  const pairs: Pair[] = []

  for (const f of shuffled) {
    if (pairs.length >= 5) break

    if (f.question.includes('_')) {
      if (seen.has(f.question)) continue
      seen.add(f.question)
      pairs.push({
        leftId: f.id.toString(), factId: f.id,
        leftText: f.question, rightText: f.answer.toString(),
      })
    } else {
      const parts = f.question.split(' ')
      const a = parseInt(parts[0])
      const b = parseInt(parts[2])
      const key = `${Math.min(a, b)}_${Math.max(a, b)}`
      if (seen.has(key)) continue
      seen.add(key)
      if (isSameAnswer) {
        pairs.push({
          leftId: f.id.toString(), factId: f.id,
          leftText: Math.min(a, b).toString(), rightText: Math.max(a, b).toString(),
        })
      } else {
        pairs.push({
          leftId: f.id.toString(), factId: f.id,
          leftText: f.question, rightText: f.answer.toString(),
        })
      }
    }
  }
  return pairs
}

export default function MatchPanel({ facts, domain, roundNumber, totalRounds, onAnswer }: MatchPanelProps) {
  const [pairs, setPairs] = useState<Pair[]>([])
  const [rightOrder, setRightOrder] = useState<number[]>([])
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [matchedRight, setMatchedRight] = useState<Set<number>>(new Set())
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [wrongLeft, setWrongLeft] = useState<number | null>(null)
  const [wrongRight, setWrongRight] = useState<number | null>(null)
  const [results, setResults] = useState<AnswerRecord[]>([])
  const [roundStartTime, setRoundStartTime] = useState(Date.now())
  const doneRef = useRef(false)

  useEffect(() => {
    doneRef.current = false
    const newPairs = buildPairs(facts, domain)
    setPairs(newPairs)
    setRightOrder(shuffleArr(newPairs.map((_, i) => i)))
    setMatched(new Set())
    setMatchedRight(new Set())
    setSelectedLeft(null)
    setWrongLeft(null)
    setWrongRight(null)
    setResults([])
    setRoundStartTime(Date.now())
  }, [roundNumber])

  const totalPairs = pairs.length

  const handleClick = (rightPos: number) => {
    if (selectedLeft === null || doneRef.current) return
    const pairIdx = rightOrder[rightPos]
    if (matchedRight.has(rightPos)) return

    const elapsed = Date.now() - roundStartTime

    if (pairIdx === selectedLeft) {
      // Correct match — record per-pair time
      const newMatched = new Set(matched)
      newMatched.add(selectedLeft)
      const newMatchedRight = new Set(matchedRight)
      newMatchedRight.add(rightPos)
      setMatched(newMatched)
      setMatchedRight(newMatchedRight)
      const newResults = [...results, { factId: pairs[selectedLeft].factId, correct: true, responseTimeMs: elapsed }]
      setResults(newResults)
      setSelectedLeft(null)

      if (newMatched.size === totalPairs && !doneRef.current) {
        doneRef.current = true
        setTimeout(() => onAnswer(newResults), 500)
      }
    } else {
      // Wrong match - record WRONG attempt
      const newResults = [...results, { factId: pairs[selectedLeft].factId, correct: false, responseTimeMs: elapsed }]
      setResults(newResults)
      setWrongLeft(selectedLeft)
      setWrongRight(rightPos)
      setSelectedLeft(null)
      setTimeout(() => { setWrongLeft(null); setWrongRight(null) }, 500)
    }
  }

  const modeHint = [...new Set(pairs.map(p => p.rightText))].length === 1
    ? 'Find pairs of numbers that go together'
    : 'Tap a question, then tap its answer'

  return (
    <div className="panel-match">
      <div className="q-header">
        <span className="q-count">Match Round {roundNumber} of {totalRounds}</span>
        <span className="q-mode-pill">🔗 Matching</span>
      </div>
      <div className="prog-track"><div className="prog-fill" style={{ width: `${(roundNumber / totalRounds) * 100}%` }} /></div>
      <div className="match-instruction">{modeHint}</div>
      <div className="match-cols">
        <div>
          <div className="match-col-label">Left</div>
          <div className="match-col">
            {pairs.map((pair, i) => (
              <button key={`l-${pair.factId}`}
                className={`match-card left ${matched.has(i) ? 'matched' : selectedLeft === i ? 'selected' : wrongLeft === i ? 'wrong-flash' : ''}`}
                onClick={() => {
                  if (matched.has(i) || doneRef.current) return
                  setSelectedLeft(prev => prev === i ? null : i)
                }}>
                {pair.leftText}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="match-col-label">Right</div>
          <div className="match-col">
            {rightOrder.map((pairIdx, pos) => (
              <button key={`r-${pairs[pairIdx].factId}-${pos}`}
                className={`match-card right ${matchedRight.has(pos) ? 'matched' : wrongRight === pos ? 'wrong-flash' : ''}`}
                onClick={() => handleClick(pos)}>
                {pairs[pairIdx].rightText}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="match-score">{matched.size} of {totalPairs} matched</div>
    </div>
  )
}
