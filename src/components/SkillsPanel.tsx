import { ADDITION_SKILL_ORDER, MULTIPLY_SKILL_ORDER } from '../lib/gameData'
import { LastSessionSummary } from '../types'

interface SkillStat {
  name: string
  accuracy: number
  avgTime: number
  status: 'done' | 'prog' | 'lock'
}

interface SkillsPanelProps {
  allAttempts: any[]
  lastSessionSummary: LastSessionSummary | null
}

const MASTERY_ACC = 90
const MASTERY_AVG_S = 6

export default function SkillsPanel({ allAttempts, lastSessionSummary }: SkillsPanelProps) {
  // Mastery = dari seluruh history (pencapaian permanen, tidak bisa hilang)
  const computeMastery = (skillAttempts: any[]): boolean => {
    if (skillAttempts.length === 0) return false
    const correct = skillAttempts.filter(a => a.is_correct).length
    const accuracy = Math.round((correct / skillAttempts.length) * 100)
    const avg = skillAttempts.reduce((s: number, a: any) => s + (a.response_time_ms || 0), 0) / skillAttempts.length / 1000
    return accuracy >= MASTERY_ACC && avg <= MASTERY_AVG_S
  }

  // Display stats: ambil dari lastSessionSummary jika skill ini adalah skill session terakhir,
  // otherwise tampilkan dari seluruh history (fallback)
  const getDisplayStats = (skillName: string, skillAttempts: any[]): { accuracy: number; avgTime: number } => {
    if (lastSessionSummary?.skill === skillName) {
      const facts = Object.values(lastSessionSummary.perFact)
      if (facts.length === 0) return { accuracy: 0, avgTime: 0 }
      const correct = facts.reduce((s, f) => s + f.correct, 0)
      const total = facts.reduce((s, f) => s + f.total, 0)
      const totalTimeMs = facts.reduce((s, f) => s + f.totalTimeMs, 0)
      return {
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        avgTime: total > 0 ? totalTimeMs / total / 1000 : 0,
      }
    }
    // Fallback ke seluruh history untuk skill yang tidak di-play di sesi terakhir
    if (skillAttempts.length === 0) return { accuracy: 0, avgTime: 0 }
    const correct = skillAttempts.filter(a => a.is_correct).length
    const accuracy = Math.round((correct / skillAttempts.length) * 100)
    const avg = skillAttempts.reduce((s: number, a: any) => s + (a.response_time_ms || 0), 0) / skillAttempts.length / 1000
    return { accuracy, avgTime: avg }
  }

  const processSkills = (order: string[]): SkillStat[] => {
    const bySkill: Record<string, any[]> = {}
    for (const a of allAttempts) {
      const skill = (a.facts as any)?.skill
      if (!skill) continue
      if (!bySkill[skill]) bySkill[skill] = []
      bySkill[skill].push(a)
    }

    let unlocked = true
    return order.map(name => {
      const items = bySkill[name] || []
      const mastered = computeMastery(items)
      const display = getDisplayStats(name, items)

      let status: 'done' | 'prog' | 'lock' = 'prog'
      if (mastered) status = 'done'
      else if (!unlocked) status = 'lock'

      if (status === 'done') unlocked = true
      else if (status === 'prog') unlocked = false

      return { name, accuracy: display.accuracy, avgTime: display.avgTime, status }
    })
  }

  const addSkills = processSkills(ADDITION_SKILL_ORDER)
  const mulSkills = processSkills(MULTIPLY_SKILL_ORDER)

  const renderSkillGroup = (title: string, skills: SkillStat[]) => (
    <div className="skill-group">
      <div className="skill-group-label">{title}</div>
      {skills.map(skill => (
        <div key={skill.name} className="skill-item">
          <div className="skill-row">
            <span className="skill-name">{skill.name}</span>
            <span className={`badge badge-${skill.status}`}>
              {skill.status === 'done' ? 'Done' : skill.status === 'prog' ? 'In Progress' : 'Locked'}
            </span>
          </div>
          {skill.status !== 'lock' ? (
            <>
              <div className="skill-pct">
                {skill.accuracy}% accuracy · {skill.avgTime.toFixed(1)}s avg
              </div>
              <div className="skill-bar-track">
                <div
                  className="skill-bar-fill"
                  style={{
                    width: `${Math.min(100, skill.accuracy)}%`,
                    background: skill.status === 'done' ? 'var(--g400)' : 'var(--p400)',
                  }}
                />
              </div>
            </>
          ) : (
            <div className="skill-locked-msg">Complete previous skill to unlock</div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="screen-skills">
      <div className="skills-header">
        <h2>Skill Progress</h2>
        <p>Skills unlock in order — master each one before moving on</p>
      </div>
      {renderSkillGroup('➕ Addition', addSkills)}
      {renderSkillGroup('✖️ Multiplication', mulSkills)}
    </div>
  )
}
