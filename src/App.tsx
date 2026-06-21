import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'
import { Child, Fact, Domain, Tab, AnswerRecord } from './types'
import { ADDITION_SKILL_ORDER, MULTIPLY_SKILL_ORDER } from './lib/gameData'
import Topbar from './components/Topbar'
import Nav from './components/Nav'
import StartPanel from './components/StartPanel'
import QuestionPanel from './components/QuestionPanel'
import BalloonPanel from './components/BalloonPanel'
import MatchPanel from './components/MatchPanel'
import SummaryPanel from './components/SummaryPanel'
import SkillsPanel from './components/SkillsPanel'
import DashboardPanel from './components/DashboardPanel'

type AppView = 'home' | 'playing' | 'summary'
type GameMode = 'fill' | 'mc' | 'tf' | 'speed' | 'balloon'
const MODES: GameMode[] = ['fill', 'mc', 'tf', 'speed', 'balloon']

interface SkillStats {
  accuracy: number
  avgTime: number
  attemptsCount: number
  mastered: boolean
  locked: boolean
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function App() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [selectedDomain, setSelectedDomain] = useState<Domain>('addition')
  const [currentTab, setCurrentTab] = useState<Tab>('practice')
  const [facts, setFacts] = useState<Fact[]>([])
  const [allAttempts, setAllAttempts] = useState<any[]>([])

  const [appView, setAppView] = useState<AppView>('home')

  // Track pending save promises so endSession can await them all
  const pendingSavesRef = useRef<Promise<void>[]>([])

  // Session state
  const [sessionFacts, setSessionFacts] = useState<Fact[]>([])
  const [sessionFactIndex, setSessionFactIndex] = useState(0)
  const [sessionMatchRound, setSessionMatchRound] = useState(0)
  const [phase, setPhase] = useState<'fact' | 'match' | 'done'>('fact')
  const [activeSkill, setActiveSkill] = useState('')
  const [sessionAttempts, setSessionAttempts] = useState<AnswerRecord[]>([])
  const [sessionResult, setSessionResult] = useState<{
    correctCount: number; wrongCount: number; avgTime: number;
    accuracy: number; mastered: boolean; nextSkill: string | null
  } | null>(null)

  useEffect(() => { fetchChildren(); fetchFacts() }, [])
  useEffect(() => { if (selectedChild) fetchAttempts() }, [selectedChild])

  const fetchChildren = async () => {
    const { data } = await supabase.from('children').select('*').order('name')
    if (data) setChildren(data)
  }
  const fetchFacts = async () => {
    const { data } = await supabase.from('facts').select('*')
    if (data) setFacts(data)
  }
  const fetchAttempts = async () => {
    if (!selectedChild) return []
    const { data } = await supabase
      .from('attempts').select('*, facts!inner(skill, domain)')
      .eq('child_id', selectedChild.id).order('created_at', { ascending: true })
    if (data) setAllAttempts(data)
    return data || []
  }

  const getSkillMastery = (skillName: string, attempts: any[]): { mastery: boolean, accuracy: number, avgTimeMs: number } => {
    const atts = attempts.filter((a: any) => a.facts?.skill === skillName)
    const correct = atts.filter((a: any) => a.is_correct).length
    const total = atts.length
    const totalTime = atts.reduce((s: number, a: any) => s + (a.response_time_ms || 0), 0)
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
    const avgTimeMs = total > 0 ? totalTime / total : 999000
    const mastery = accuracy >= 90 && avgTimeMs <= 6000 && total > 0
    return { mastery, accuracy, avgTimeMs }
  }

  const computeStats = useCallback((): Record<string, SkillStats> => {
    const order = selectedDomain === 'addition' ? ADDITION_SKILL_ORDER : MULTIPLY_SKILL_ORDER
    const result: Record<string, SkillStats> = {}
    let allPreviousMastered = true
    for (const skillName of order) {
      const atts = allAttempts.filter((a: any) => a.facts?.skill === skillName)
      const correct = atts.filter((a: any) => a.is_correct).length
      const total = atts.length
      const totalTime = atts.reduce((s: number, a: any) => s + (a.response_time_ms || 0), 0)
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
      const avgTimeMs = total > 0 ? totalTime / total : 999000
      const mastered = accuracy >= 90 && avgTimeMs <= 6000 && total > 0
      const locked = !allPreviousMastered
      result[skillName] = { accuracy, avgTime: avgTimeMs / 1000, attemptsCount: total, mastered, locked }
      if (!mastered) {
        allPreviousMastered = false
      }
    }
    return result
  }, [selectedDomain, allAttempts])

  const skillStats = computeStats()

  const FACTS_PER_ROUND = 5

  const startSession = (skillName: string) => {
    const skillFacts = shuffle(facts.filter(f => f.domain === selectedDomain && f.skill === skillName))
    if (skillFacts.length === 0) return
    setActiveSkill(skillName)
    setSessionFacts(skillFacts)
    setSessionFactIndex(0)
    setSessionAttempts([])
    setSessionMatchRound(0)
    setPhase('fact')
    setSessionResult(null)
    pendingSavesRef.current = []
    setAppView('playing')
  }

  const saveAttempt = async (r: AnswerRecord) => {
    if (!selectedChild) return
    await supabase.from('attempts').insert({
      child_id: selectedChild.id, fact_id: r.factId, is_correct: r.correct, response_time_ms: r.responseTimeMs,
    })
  }

  const recordAttempt = async (correct: boolean, timeMs: number, factId?: number) => {
    const fid = factId ?? sessionFacts[sessionFactIndex]?.id
    if (fid === undefined) return
    const record: AnswerRecord = { factId: fid, correct, responseTimeMs: timeMs }
    setSessionAttempts(prev => [...prev, record])
    const savePromise = saveAttempt(record)
    pendingSavesRef.current.push(savePromise)
  }

  const advanceAfterFact = () => {
    const nextIdx = sessionFactIndex + 1
    // Insert match round after every FACTS_PER_ROUND facts
    if (nextIdx > 0 && nextIdx % FACTS_PER_ROUND === 0 && nextIdx < sessionFacts.length) {
      setSessionMatchRound(prev => prev + 1)
      setPhase('match')
    } else if (nextIdx >= sessionFacts.length) {
      endSession()
    } else {
      setSessionFactIndex(nextIdx)
    }
  }

  const onMatchComplete = async (results: AnswerRecord[]) => {
    setSessionAttempts(prev => [...prev, ...results])
    for (const r of results) {
      const savePromise = saveAttempt(r)
      pendingSavesRef.current.push(savePromise)
    }
    const nextIdx = (sessionMatchRound) * FACTS_PER_ROUND
    if (nextIdx >= sessionFacts.length) {
      endSession()
    } else {
      setPhase('fact')
      setSessionFactIndex(nextIdx)
    }
  }

  const endSession = async () => {
    // Wait for all pending DB saves to complete before reading back fresh data
    await Promise.all(pendingSavesRef.current)
    pendingSavesRef.current = []

    const freshAttempts = await fetchAttempts()
    const atts = sessionAttempts
    const correctCount = atts.filter(a => a.correct).length
    const wrongCount = atts.filter(a => !a.correct).length
    const total = correctCount + wrongCount
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0
    const avgMs = atts.length > 0 ? atts.reduce((s, a) => s + a.responseTimeMs, 0) / atts.length : 0
    const avgTime = Math.round((avgMs / 100)) / 10

    // Mastery check based on ALL attempts for this skill (including this session)
    const overallMastery = getSkillMastery(activeSkill, freshAttempts)
    const mastered = overallMastery.mastery

    const order = selectedDomain === 'addition' ? ADDITION_SKILL_ORDER : MULTIPLY_SKILL_ORDER
    const idx = order.indexOf(activeSkill)
    let nextSkill: string | null = null
    if (mastered && idx < order.length - 1) nextSkill = order[idx + 1]

    setSessionResult({ correctCount, wrongCount, avgTime, accuracy, mastered, nextSkill })
    setPhase('done')
    setAppView('summary')
  }

  const handleTabChange = async (tab: Tab) => {
    setCurrentTab(tab)
    if (tab !== 'practice') {
      setAppView('home')
    } else if (appView !== 'home' || currentTab !== 'practice') {
      await fetchAttempts()
    }
  }

  const currentMode: GameMode = MODES[sessionFactIndex % MODES.length]
  const currentFact = sessionFacts[sessionFactIndex]

  return (
    <div className="app-container">
      <Topbar child={selectedChild} onBack={() => setAppView('home')} currentSkill={appView === 'playing' ? activeSkill : undefined} />
      <Nav activeTab={currentTab} onTabChange={handleTabChange} />

      <div className="screen-container">
        {currentTab === 'skills' && selectedChild ? <SkillsPanel child={selectedChild} />
          : currentTab === 'dashboard' && selectedChild ? <DashboardPanel child={selectedChild} />
          : appView === 'home' ? (
            <StartPanel
              children={children} selectedChild={selectedChild} onSelectChild={setSelectedChild}
              selectedDomain={selectedDomain} onSelectDomain={setSelectedDomain}
              onStart={startSession} skillStats={skillStats}
            />
          ) : appView === 'playing' && phase === 'fact' && currentFact ? (
            currentMode === 'balloon' ? (
              <BalloonPanel fact={currentFact} questionNumber={sessionFactIndex + 1} totalQuestions={sessionFacts.length} domain={selectedDomain} onAnswer={(c, t) => { recordAttempt(c, t); advanceAfterFact() }} />
            ) : (
              <QuestionPanel fact={currentFact} questionNumber={sessionFactIndex + 1} totalQuestions={sessionFacts.length} domain={selectedDomain} mode={currentMode} onAnswer={(c, t) => { recordAttempt(c, t); advanceAfterFact() }} />
            )
          ) : appView === 'playing' && phase === 'match' ? (
          <MatchPanel
            facts={sessionFacts.slice((sessionMatchRound - 1) * FACTS_PER_ROUND, sessionMatchRound * FACTS_PER_ROUND)}
            domain={selectedDomain}
            roundNumber={sessionMatchRound}
            totalRounds={Math.ceil(sessionFacts.length / FACTS_PER_ROUND)}
            onAnswer={(results) => onMatchComplete(results)}
          />
          ) : appView === 'summary' && sessionResult ? (
            <SummaryPanel
              child={selectedChild!} domain={selectedDomain} skillName={activeSkill}
              correctCount={sessionResult.correctCount} wrongCount={sessionResult.wrongCount}
              avgTime={sessionResult.avgTime} accuracy={sessionResult.accuracy}
              mastered={sessionResult.mastered} nextSkill={sessionResult.nextSkill}
              onRetry={() => startSession(activeSkill)}
              onNext={() => sessionResult.nextSkill && startSession(sessionResult.nextSkill)}
              onViewSkills={() => handleTabChange('skills')}
            />
          ) : null}
      </div>
    </div>
  )
}
