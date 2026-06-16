import { useState, useEffect, useMemo } from 'react'
import { Fact } from '../types'
import { parseFactQuestion } from '../lib/gameData'

interface BalloonPanelProps {
  fact: Fact
  questionNumber: number
  totalQuestions: number
  domain: 'addition' | 'multiplication'
  onAnswer: (correct: boolean, responseTimeMs: number) => void
}

const BALLOON_COLORS = ['#7F77DD', '#D85A30', '#1D9E75', '#D4537E', '#BA7517', '#534AB7', '#E24B4A', '#0F6E56']

export default function BalloonPanel({ fact, questionNumber, totalQuestions, domain: _domain, onAnswer }: BalloonPanelProps) {
  const [startTime, setStartTime] = useState(Date.now())
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [popped, setPopped] = useState<Record<number, boolean>>({})
  const [wrongIdx, setWrongIdx] = useState<number | null>(null)

  const parsed = useMemo(() => parseFactQuestion(fact), [fact])
  const isReverse = parsed.isReverse
  const totalValue = isReverse && !('operandA' in parsed) ? parsed.total : undefined

  useEffect(() => {
    setStartTime(Date.now())
    setAnswered(false)
    setIsCorrect(null)
    setPopped({})
    setWrongIdx(null)
  }, [fact.id])

  const balloons = useMemo(() => {
    const offsets = [1, -1, 2, -2, 3, -3]
    const used = new Set<number>([fact.answer])
    if (totalValue !== undefined) used.add(totalValue)
    const wrongChoices: number[] = []
    let idx = 0
    while (wrongChoices.length < 3 && idx < 20) {
      const off = offsets[idx % offsets.length]
      const val = fact.answer + off
      if (!used.has(val) && val > 0) {
        wrongChoices.push(val)
        used.add(val)
      }
      idx++
    }
    const all = [{ answer: fact.answer, isCorrect: true }, ...wrongChoices.map(a => ({ answer: a, isCorrect: false }))]
    return all.sort(() => Math.random() - 0.5).map((b, i) => ({ ...b, color: BALLOON_COLORS[i % BALLOON_COLORS.length] }))
  }, [fact.id, fact.answer, totalValue])

  const positions = [{ left: 8, top: 10 }, { left: 28, top: 30 }, { left: 52, top: 8 }, { left: 72, top: 28 }]

  const handlePop = (idx: number, balloon: typeof balloons[0]) => {
    if (answered || popped[idx] !== undefined) return
    const ms = Date.now() - startTime
    if (balloon.isCorrect) {
      setAnswered(true)
      setIsCorrect(true)
      setPopped(prev => ({ ...prev, [idx]: true }))
      onAnswer(true, ms)
    } else {
      setAnswered(true)
      setIsCorrect(false)
      setWrongIdx(idx)
      onAnswer(false, ms)
    }
  }

  const op = <span className="op">{parsed.operator}</span>

  const renderBalloonQuestion = () => {
    if (!isReverse || !('blankPosition' in parsed)) {
      return <>
        <span>{parsed.operandA}</span>
        {op}
        <span>{parsed.operandB}</span>
      </>
    }
    if (parsed.blankPosition === 'first') {
      return <>
        <span>___</span>
        {op}
        <span>{parsed.knownOperand}</span>
        <span>= {parsed.total}</span>
      </>
    }
    return <>
      <span>{parsed.knownOperand}</span>
      {op}
      <span>___</span>
      <span>= {parsed.total}</span>
    </>
  }

  const qLabel = isReverse ? 'Pop the balloon with the missing number' : 'Pop the balloon with the answer'

  return (
    <div className="panel-balloon">
      <div className="q-header">
        <span className="q-count">Question {questionNumber} of {totalQuestions}</span>
        <span className="q-mode-pill">🎈 Pop Balloon</span>
      </div>
      <div className="prog-track"><div className="prog-fill" style={{ width: `${(questionNumber / totalQuestions) * 100}%` }} /></div>
      <div className="question-card" style={{ padding: '14px 16px 12px' }}>
        <div className="q-label">{qLabel}</div>
        <div className="balloon-q">{renderBalloonQuestion()}</div>
        <div className="balloon-hint">Find the correct number!</div>
      </div>
      <div className="balloon-arena">
        {balloons.map((b, i) => {
          const pos = positions[i]
          const isPopped = popped[i]
          const isWrong = wrongIdx === i
          const floatAnim = i % 2 === 0 ? 'floatA' : 'floatB'
          return (
            <div key={i} className={`balloon ${isPopped ? 'popped' : ''} ${isWrong ? 'wrong-pop' : ''}`}
              style={{ left: `${pos.left}%`, top: `${pos.top}%`, animation: `${floatAnim} ${2 + i * 0.4}s ease-in-out infinite` }}
              onClick={() => handlePop(i, b)}>
              <div className="balloon-body" style={{ background: b.color }}>{b.answer}</div>
              <div className="balloon-string" />
            </div>
          )
        })}
      </div>
      {answered && isCorrect === false && (
        <div className="feedback show">
          <div className="fb-head">The answer is <strong>{fact.answer}</strong></div>
          <div className="fb-trick">💡 {fact.strategy}</div>
        </div>
      )}
      {answered && isCorrect === true && (
        <div className="feedback show" style={{ background: 'var(--g50)', borderColor: '#97C459' }}>
          <div className="fb-head" style={{ color: 'var(--g600)', fontSize: 18, marginBottom: 4 }}>Correct! 🎈</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--g600)' }}>Balloon popped!</div>
        </div>
      )}
    </div>
  )
}
