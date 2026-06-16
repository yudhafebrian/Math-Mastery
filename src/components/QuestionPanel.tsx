import { useState, useEffect, useRef, useMemo, ReactElement } from 'react'
import { Fact } from '../types'
import { parseFactQuestion, ParsedFact } from '../lib/gameData'

type GameMode = 'fill' | 'mc' | 'tf' | 'speed'

interface QuestionPanelProps {
  fact: Fact
  questionNumber: number
  totalQuestions: number
  domain: 'addition' | 'multiplication'
  mode: GameMode
  onAnswer: (correct: boolean, responseTimeMs: number) => void
}

type AnswerResult = 'correct' | 'wrong'

const playSound = (type: AnswerResult) => {
  try {
    const audio = new Audio(`/music/${type === 'correct' ? 'correct' : 'wrong'}.mp3`)
    audio.volume = 0.5
    audio.play().catch(() => {})
  } catch { /* ignore */ }
}

function renderQuestionText(parsed: ParsedFact): ReactElement {
  const op = <span className="op">{parsed.operator}</span>
  if (!parsed.isReverse) {
    return <>{parsed.operandA} {op} {parsed.operandB} = ?</>
  }
  if (parsed.blankPosition === 'first') {
    return <>___ {op} {parsed.knownOperand} = {parsed.total}</>
  }
  return <>{parsed.knownOperand} {op} ___ = {parsed.total}</>
}

function renderFillInput(parsed: ParsedFact, fillValue: string, answered: boolean, className: string, onChange: (v: string) => void, onKeyDown: (e: React.KeyboardEvent) => void, ref: React.RefObject<HTMLInputElement | null>): ReactElement {
  const op = <span className="op">{parsed.operator}</span>
  if (!parsed.isReverse) {
    return (
      <div className="fill-row">
        <span className="fill-eq">{`${parsed.operandA} ${parsed.operator} ${parsed.operandB} =`}</span>
        <input ref={ref} className={className} type="number" inputMode="numeric" value={fillValue}
          onChange={e => onChange(e.target.value)} onKeyDown={onKeyDown} disabled={answered} />
      </div>
    )
  }
  if (parsed.blankPosition === 'first') {
    return (
      <div className="fill-row">
        <input ref={ref} className={className} type="number" inputMode="numeric" value={fillValue}
          onChange={e => onChange(e.target.value)} onKeyDown={onKeyDown} disabled={answered}
          style={{ width: 80, marginRight: 6 }} />
        <span className="fill-eq">{op} {parsed.knownOperand} = {parsed.total}</span>
      </div>
    )
  }
  return (
    <div className="fill-row">
      <span className="fill-eq">{parsed.knownOperand} {op}</span>
      <input ref={ref} className={className} type="number" inputMode="numeric" value={fillValue}
        onChange={e => onChange(e.target.value)} onKeyDown={onKeyDown} disabled={answered}
        style={{ width: 80, margin: '0 6px' }} />
      <span className="fill-eq">= {parsed.total}</span>
    </div>
  )
}

function renderTfDisplay(parsed: ParsedFact, tfDisplay: number): ReactElement {
  if (!parsed.isReverse) {
    return <>{parsed.operandA} {parsed.operator} {parsed.operandB} = {tfDisplay}</>
  }
  if (parsed.blankPosition === 'first') {
    return <>{tfDisplay} {parsed.operator} {parsed.knownOperand} = {parsed.total}</>
  }
  return <>{parsed.knownOperand} {parsed.operator} {tfDisplay} = {parsed.total}</>
}

export default function QuestionPanel({ fact, questionNumber, totalQuestions, mode, onAnswer }: QuestionPanelProps) {
  const [startTime, setStartTime] = useState(Date.now())
  const [answered, setAnswered] = useState(false)
  const [fillValue, setFillValue] = useState('')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [tfDisplay, setTfDisplay] = useState(fact.answer)
  const [tfCorrect, setTfCorrect] = useState(true)
  const [speedLeft, setSpeedLeft] = useState(5)
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null)
  const speedTimerRef = useRef<number | null>(null)
  const fillRef = useRef<HTMLInputElement>(null)

  const parsed = useMemo(() => parseFactQuestion(fact), [fact])
  const isReverse = parsed.isReverse

  const getReverseAnswerHint = (): number => {
    if (!isReverse || 'blankPosition' in parsed === false) return 0
    if (parsed.blankPosition === 'first') {
      return parsed.operator === '×'
        ? Math.round(parsed.total / parsed.knownOperand)
        : parsed.total - parsed.knownOperand
    }
    return parsed.operator === '×'
      ? Math.round(parsed.total / parsed.knownOperand)
      : parsed.total - parsed.knownOperand
  }
  const reverseAnswer = getReverseAnswerHint()

  useEffect(() => {
    setStartTime(Date.now())
    setAnswered(false)
    setLastResult(null)
    setFillValue('')
    setSelectedOption(null)
    setSpeedLeft(5)

    if (mode === 'tf') {
      const isTrue = Math.random() > 0.5
      setTfCorrect(isTrue)
      if (isReverse) {
        setTfDisplay(isTrue ? reverseAnswer : reverseAnswer + (Math.random() > 0.5 ? 1 : -1))
      } else {
        setTfDisplay(isTrue ? fact.answer : fact.answer + (Math.random() > 0.5 ? 1 : -1))
      }
    }

    if (mode === 'speed') {
      if (speedTimerRef.current) clearInterval(speedTimerRef.current)
      speedTimerRef.current = window.setInterval(() => {
        setSpeedLeft(prev => {
          if (prev <= 0.1) {
            if (speedTimerRef.current) clearInterval(speedTimerRef.current)
            const ms = Date.now() - startTime
            handleResult(false, ms)
            return 0
          }
          return Math.round((prev - 0.1) * 10) / 10
        })
      }, 100)
    }

    setTimeout(() => fillRef.current?.focus(), 80)
    return () => { if (speedTimerRef.current) clearInterval(speedTimerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, fact.id])

  const handleResult = (correct: boolean, ms: number) => {
    if (answered) return
    setAnswered(true)
    const result = correct ? 'correct' : 'wrong'
    setLastResult(result)
    playSound(result)
    onAnswer(correct, ms)
  }

  const mcOptions = useMemo(() => {
    const opts = new Set<number>([fact.answer])
    let tries = 0
    while (opts.size < 4 && tries < 30) {
      const off = Math.floor(Math.random() * 5) + 1
      opts.add(fact.answer + (Math.random() > 0.5 ? off : -off))
      tries++
    }
    while (opts.size < 4) opts.add(fact.answer + opts.size)
    return Array.from(opts).filter(n => n > 0).sort(() => Math.random() - 0.5)
  }, [fact.id, fact.answer])

  const qLabel = isReverse ? 'Find the missing number' : 'What is'
  const modeLabelText = mode === 'fill' ? 'Fill in Blank' : mode === 'mc' ? 'Multiple Choice' : 'True / False'

  if (mode === 'speed') {
    const pct = Math.max(0, (speedLeft / 5) * 100)
    const barColor = pct > 60 ? '#7F77DD' : pct > 30 ? '#BA7517' : '#E24B4A'
    return (
      <div className="panel-question">
        <div className="q-header">
          <span className="q-count">Question {questionNumber} of {totalQuestions}</span>
          <span className="q-mode-pill"> Speed</span>
        </div>
        <div className="prog-track"><div className="prog-fill" style={{ width: `${(questionNumber / totalQuestions) * 100}%` }} /></div>
        <div className="question-card">
          <div className="q-label">{qLabel}</div>
          <div className="q-text">{renderQuestionText(parsed)}</div>
        </div>
        <div className="speed-timer-wrap">
          <div className="speed-timer-track"><div className="speed-timer-fill" style={{ width: `${pct}%`, background: barColor }} /></div>
          <span className="speed-timer-num">{Math.ceil(speedLeft)}</span>
        </div>
        <div className="speed-opts">
          {mcOptions.map(opt => {
            let cls = 'speed-opt'
            if (answered) {
              if (opt === fact.answer) cls += ' correct'
              else if (opt === selectedOption) cls += ' wrong'
            }
            return <button key={opt} className={cls} disabled={answered} onClick={() => { setSelectedOption(opt); handleResult(opt === fact.answer, Date.now() - startTime) }}>{opt}</button>
          })}
        </div>
        {answered && <FeedbackCard correct={lastResult === 'correct'} fact={fact} />}
        {answered && <button className="next-btn" style={{ display: 'block' }} onClick={() => {}}>Next →</button>}
      </div>
    )
  }

  return (
    <div className="panel-question">
      <div className="q-header">
        <span className="q-count">Question {questionNumber} of {totalQuestions}</span>
        <span className="q-mode-pill">{modeLabelText}</span>
      </div>
      <div className="prog-track"><div className="prog-fill" style={{ width: `${(questionNumber / totalQuestions) * 100}%` }} /></div>

      <div className="question-card">
        <div className="q-label">{qLabel}</div>
        <div className="q-text">{renderQuestionText(parsed)}</div>
      </div>

      {mode === 'fill' && (
        <>
          {renderFillInput(
            parsed, fillValue, answered,
            `fill-input ${answered ? parseInt(fillValue) === fact.answer ? 'correct' : 'wrong' : ''}`,
            v => setFillValue(v),
            e => { if (e.key === 'Enter') handleResult(parseInt(fillValue) === fact.answer, Date.now() - startTime) },
            fillRef
          )}
          <button className="check-btn" disabled={answered || !fillValue} onClick={() => handleResult(parseInt(fillValue) === fact.answer, Date.now() - startTime)}>Check Answer</button>
        </>
      )}

      {mode === 'mc' && (
        <div className="mc-grid">
          {mcOptions.map(opt => {
            let cls = 'mc-opt'
            if (answered) {
              if (opt === fact.answer) cls += ' correct'
              else if (opt === selectedOption) cls += ' wrong'
            }
            return <button key={opt} className={cls} disabled={answered} onClick={() => { setSelectedOption(opt); handleResult(opt === fact.answer, Date.now() - startTime) }}>{opt}</button>
          })}
        </div>
      )}

      {mode === 'tf' && (
        <>
          <div className="tf-display">{renderTfDisplay(parsed, tfDisplay)}</div>
          <div className="tf-hint">Is this correct?</div>
          <div className="tf-row">
            <button className="tf-btn tf-true" disabled={answered} onClick={() => handleResult(true === tfCorrect, Date.now() - startTime)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              True
            </button>
            <button className="tf-btn tf-false" disabled={answered} onClick={() => handleResult(false === tfCorrect, Date.now() - startTime)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              False
            </button>
          </div>
        </>
      )}

      {answered && <FeedbackCard correct={lastResult === 'correct'} fact={fact} />}
    </div>
  )
}

function FeedbackCard({ correct, fact }: { correct: boolean; fact: Fact }) {
  if (correct) {
    return (
      <div className="feedback show" style={{ background: 'var(--g50)', borderColor: '#97C459' }}>
        <div className="fb-head" style={{ color: 'var(--g600)', fontSize: 18, marginBottom: 4 }}>Correct! 🎉</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--g600)' }}>Great job!</div>
      </div>
    )
  }
  return (
    <div className="feedback show">
      <div className="fb-head">The answer is <strong>{fact.answer}</strong></div>
      <div className="fb-trick">💡 {fact.strategy}</div>
    </div>
  )
}
