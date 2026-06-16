import { Child, Domain } from '../types'
import { ADDITION_SKILL_ORDER, MULTIPLY_SKILL_ORDER } from '../lib/gameData'

interface SkillStat {
  accuracy: number
  avgTime: number
  attemptsCount: number
  mastered: boolean
  locked: boolean
}

interface StartPanelProps {
  children: Child[]
  selectedChild: Child | null
  onSelectChild: (c: Child) => void
  selectedDomain: Domain
  onSelectDomain: (d: Domain) => void
  onStart: (skillName: string) => void
  skillStats: Record<string, SkillStat>
}

export default function StartPanel({
  children, selectedChild, onSelectChild,
  selectedDomain, onSelectDomain,
  onStart, skillStats,
}: StartPanelProps) {
  const skillOrder = selectedDomain === 'addition' ? ADDITION_SKILL_ORDER : MULTIPLY_SKILL_ORDER

  // Find current skill (first unlocked non-mastered)
  const currentSkill = skillOrder.find(s => {
    const st = skillStats[s]
    return st && !st.locked && !st.mastered
  })
  const labelName = selectedDomain === 'addition' ? 'Addition' : 'Multiplication'

  return (
    <div className="panel-start">
      <div>
        <div className="sh">Who's practicing? 👋</div>
        <div className="ss">Pick a child and skill to start</div>
      </div>

      <div>
        <div className="section-mini">Child</div>
        <div className="child-row">
          {children.map(child => (
            <div key={child.id} className={`child-card ${selectedChild?.id === child.id ? 'selected' : ''}`} onClick={() => onSelectChild(child)}>
              <span className="child-emo">{child.avatar}</span>
              <span className="child-name">{child.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="section-mini">Topic</div>
        <div className="domain-row">
          <button className={`domain-btn ${selectedDomain === 'addition' ? 'selected' : ''}`} onClick={() => onSelectDomain('addition')}>➕ Addition</button>
          <button className={`domain-btn ${selectedDomain === 'multiplication' ? 'selected' : ''}`} onClick={() => onSelectDomain('multiplication')}>✖️ Multiplication</button>
        </div>
      </div>

      {selectedChild && (
        <div className="skill-list-container">
          <div className="skill-list-header">
            <h2 className="skill-list-title">{labelName}</h2>
            <span className="skill-list-current">Current: {currentSkill || '—'}</span>
          </div>
          <div className="skill-list">
            {skillOrder.map((skill, i) => {
              const s = skillStats[skill] || { accuracy: 0, avgTime: 999, attemptsCount: 0, mastered: false, locked: true }
              const isCurrent = skill === currentSkill
              let statusText = ''
              let statusColor = ''
              if (s.locked) {
                statusText = '🔒 Locked'
                statusColor = 'locked'
              } else if (s.mastered) {
                statusText = `✓ Unlocked · ${s.accuracy}%`
                statusColor = 'done'
              } else if (s.attemptsCount === 0) {
                statusText = 'In progress · new'
                statusColor = 'progress'
              } else {
                statusText = `In progress · ${s.accuracy}%`
                statusColor = 'progress'
              }

              return (
                <button
                  key={skill}
                  className={`skill-list-item ${isCurrent ? 'current' : ''} ${s.locked ? 'is-locked' : ''}`}
                  onClick={() => !s.locked && onStart(skill)}
                  disabled={s.locked}
                >
                  <div className="skill-list-left">
                    <span className="skill-list-num">{i + 1}.</span>
                    <span className="skill-list-name">{skill}</span>
                  </div>
                  <div className={`skill-list-status ${statusColor}`}>{statusText}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
