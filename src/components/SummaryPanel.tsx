import { Child, Domain } from '../types'

interface SummaryPanelProps {
  child: Child
  domain: Domain
  skillName: string
  correctCount: number
  wrongCount: number
  avgTime: number
  accuracy: number
  mastered: boolean
  nextSkill: string | null
  onRetry: () => void
  onNext: () => void
  onViewSkills: () => void
}

export default function SummaryPanel({
  child, domain, skillName, correctCount, wrongCount,
  avgTime, accuracy, mastered, nextSkill, onRetry, onNext, onViewSkills,
}: SummaryPanelProps) {
  const emoji = mastered ? '🏆' : accuracy >= 80 ? '' : accuracy >= 50 ? '' : ''
  const title = mastered ? 'Skill Mastered!' : 'Session Complete'
  const hint = mastered
    ? `You unlocked: ${nextSkill || 'All skills in this domain mastered!'}`
    : 'Need ≥90% accuracy AND ≤5s avg time to unlock the next skill'

  return (
    <div className="panel-summary">
      <div className="sum-hero">
        <span className="sum-emoji">{emoji}</span>
        <div className="sum-title">{title}</div>
        <div className="sum-sub">{child.name} · {domain === 'addition' ? 'Addition' : 'Multiplication'} · {skillName}</div>
      </div>
      <div className="stats-row">
        <div className="stat-box green"><span className="stat-val">{correctCount}</span><div className="stat-lbl">Correct</div></div>
        <div className="stat-box red"><span className="stat-val">{wrongCount}</span><div className="stat-lbl">Wrong</div></div>
        <div className="stat-box purple"><span className="stat-val">{avgTime}s</span><div className="stat-lbl">Avg Time</div></div>
      </div>
      <div className="skill-prog-card">
        <div className="spc-head">Session Accuracy</div>
        <div className="spc-sub">{skillName} · {accuracy}%</div>
        <div className="spc-bar"><div className="spc-fill" style={{ width: `${accuracy}%`, background: mastered ? 'var(--g400)' : 'var(--p400)' }} /></div>
        <div className="spc-hint">{hint}</div>
      </div>
      {mastered && nextSkill ? (
        <button className="again-btn" onClick={onNext}>Next Skill: {nextSkill} →</button>
      ) : (
        <button className="again-btn" onClick={onRetry}>Practice Again 🔄</button>
      )}
      <button className="view-skills-btn" onClick={onViewSkills} style={{ marginTop: 8 }}>View Skill Progress</button>
    </div>
  )
}
