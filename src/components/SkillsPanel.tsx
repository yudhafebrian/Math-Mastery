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

  const processSkills = (order: string[], skillData: Record<string, { correct: number; total: number; totalTime: number }>): SkillStat[] => {
    let unlocked = true
    return order.map(name => {
      const data = skillData[name]
      if (!data) {
        return { name, accuracy: 0, avgTime: 0, status: unlocked ? 'prog' : 'lock' }
      }
      const acc = Math.round((data.correct / data.total) * 100)
      const avg = data.totalTime / data.total / 1000
      let status: 'done' | 'prog' | 'lock' = 'prog'
      if (acc >= 90 && avg <= 5) {
        status = 'done'
      } else if (!unlocked) {
        status = 'lock'
      }
      if (status === 'done') {
        unlocked = true
      } else if (status === 'prog') {
        unlocked = false
      }
      return { name, accuracy: acc, avgTime: avg, status }
    })
  }

  const fetchSkills = async () => {
    const { data: attempts } = await supabase
      .from('attempts')
      .select('is_correct, response_time_ms, facts!inner(skill)')
      .eq('child_id', child.id)

    const skillData: Record<string, { correct: number; total: number; totalTime: number }> = {}
    if (attempts) {
      attempts.forEach((a: any) => {
        const skill = a.facts?.skill
        if (!skill) return
        if (!skillData[skill]) skillData[skill] = { correct: 0, total: 0, totalTime: 0 }
        skillData[skill].total += 1
        if (a.is_correct) skillData[skill].correct += 1
        skillData[skill].totalTime += a.response_time_ms
      })
    }

    setAddSkills(processSkills(ADDITION_SKILL_ORDER, skillData))
    setMulSkills(processSkills(MULTIPLY_SKILL_ORDER, skillData))
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
