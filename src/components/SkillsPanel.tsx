import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Child } from '../types'
import { ADDITION_SKILL_ORDER, MULTIPLY_SKILL_ORDER } from '../lib/gameData'

interface SkillStat {
  name: string
  accuracy: number
  avgTime: number
  status: 'done' | 'prog' | 'lock'
}

interface SkillsPanelProps {
  child: Child
}

export default function SkillsPanel({ child }: SkillsPanelProps) {
  const [addSkills, setAddSkills] = useState<SkillStat[]>([])
  const [mulSkills, setMulSkills] = useState<SkillStat[]>([])

  useEffect(() => {
    fetchSkills()
  }, [child.id])

  const SESSION_GAP_MS = 5 * 60 * 1000

  const getCutoffAt = (items: any[]): number => {
    if (items.length === 0) return 0
    const sorted = [...items].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const latestTime = new Date(sorted[0].created_at).getTime()
    let cutoff = latestTime
    for (let i = 1; i < sorted.length; i++) {
      const itemTime = new Date(sorted[i].created_at).getTime()
      if (latestTime - itemTime > SESSION_GAP_MS) break
      cutoff = Math.min(cutoff, itemTime)
    }
    return cutoff
  }

  // Mastery pakai seluruh history (achievement permanen)
  const computeMastery = (items: any[]): { accuracy: number; avgTime: number; mastered: boolean } => {
    if (items.length === 0) return { accuracy: 0, avgTime: 0, mastered: false }
    const correct = items.filter(a => a.is_correct).length
    const accuracy = Math.round((correct / items.length) * 100)
    const avg = items.reduce((s, a) => s + (a.response_time_ms || 0), 0) / items.length / 1000
    const mastered = accuracy >= 90 && avg <= 6
    return { accuracy, avgTime: avg, mastered }
  }

  // Session stats pakai window sessions per-skill
  const computeSessionStats = (skillItems: any[]): { accuracy: number; avgTime: number } => {
    if (skillItems.length === 0) return computeMastery(skillItems)
    const cutoffAt = getCutoffAt(skillItems)
    const sessionItems = skillItems.filter(a => new Date(a.created_at).getTime() >= cutoffAt)
    if (sessionItems.length === 0) return computeMastery(skillItems)
    const correct = sessionItems.filter(a => a.is_correct).length
    const accuracy = Math.round((correct / sessionItems.length) * 100)
    const avg = sessionItems.reduce((s, a) => s + (a.response_time_ms || 0), 0) / sessionItems.length / 1000
    return { accuracy, avgTime: avg }
  }

  const processSkills = (order: string[], allAttempts: any[]): SkillStat[] => {
    // Group by skill first
    const bySkill: Record<string, any[]> = {}
    for (const a of allAttempts) {
      const skill = a.facts?.skill
      if (!skill) continue
      if (!bySkill[skill]) bySkill[skill] = []
      bySkill[skill].push(a)
    }

    let unlocked = true
    return order.map(name => {
      const items = bySkill[name] || []
      // Mastery pakai seluruh history (pencapaian permanen)
      const overall = computeMastery(items)
      // Display pakai session terbaru PER SKILL (fix: bukan global cutoff)
      const display = computeSessionStats(items)

      let status: 'done' | 'prog' | 'lock' = 'prog'
      if (overall.mastered) {
        status = 'done'
      } else if (!unlocked) {
        status = 'lock'
      }

      if (status === 'done') {
        unlocked = true
      } else if (status === 'prog') {
        unlocked = false
      }

      return {
        name,
        accuracy: display.accuracy,
        avgTime: display.avgTime,
        status,
      }
    })
  }

  const fetchSkills = async () => {
    const { data: attempts } = await supabase
      .from('attempts')
      .select('is_correct, response_time_ms, created_at, facts!inner(skill)')
      .eq('child_id', child.id)

    const all = attempts as any[] || []
    setAddSkills(processSkills(ADDITION_SKILL_ORDER, all))
    setMulSkills(processSkills(MULTIPLY_SKILL_ORDER, all))
  }

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
                ></div>
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
