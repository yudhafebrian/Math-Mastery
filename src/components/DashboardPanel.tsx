import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Child, ChildStats } from '../types'

interface DashboardPanelProps {
  child: Child
}

export default function DashboardPanel({ child }: DashboardPanelProps) {
  const [weakFacts, setWeakFacts] = useState<ChildStats[]>([])
  const [strongFacts, setStrongFacts] = useState<ChildStats[]>([])

  useEffect(() => {
    fetchStats()
  }, [child])

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

  const fetchStats = async () => {
    const { data: attempts } = await supabase
      .from('attempts')
      .select('fact_id, is_correct, response_time_ms, created_at, facts(question, answer)')
      .eq('child_id', child.id)

    if (!attempts) return

    const cutoffAt = getCutoffAt(attempts as any[])
    const sessionAttempts = attempts.filter(
      a => new Date(a.created_at).getTime() >= cutoffAt
    ) as any[]

    const factStats: Record<number, { correct: number, total: number, totalTime: number, question: string }> = {}

    for (const a of sessionAttempts) {
      const fid = a.fact_id
      if (!factStats[fid]) {
        factStats[fid] = { correct: 0, total: 0, totalTime: 0, question: a.facts.question }
      }
      factStats[fid].total += 1
      if (a.is_correct) factStats[fid].correct += 1
      factStats[fid].totalTime += a.response_time_ms || 0
    }

    const stats: ChildStats[] = Object.entries(factStats).map(([fid, data]) => ({
      fact_id: parseInt(fid),
      question: data.question,
      accuracy: Math.round((data.correct / data.total) * 100),
      avg_time_ms: data.totalTime / data.total,
      attempts_count: data.total
    }))

    // Weak: accuracy < 80% or avg_time > 4000ms, sorted by accuracy asc, then time desc
    const weak = stats
      .filter(s => s.accuracy < 80 || s.avg_time_ms > 4000)
      .sort((a, b) => a.accuracy - b.accuracy || b.avg_time_ms - a.avg_time_ms)
      .slice(0, 5)

    // Strong: accuracy >= 90% and avg_time <= 3000ms
    const strong = stats
      .filter(s => s.accuracy >= 90 && s.avg_time_ms <= 3000)
      .sort((a, b) => b.accuracy - a.accuracy || a.avg_time_ms - b.avg_time_ms)
      .slice(0, 5)

    setWeakFacts(weak)
    setStrongFacts(strong)
  }

  return (
    <div className="screen-dashboard">
      <div className="dash-header">
        <h2>Parent Dashboard</h2>
        <p>{child.name}'s overall fact performance</p>
      </div>

      {weakFacts.length > 0 && (
        <div className="unlock-notice">
          <div className="un-title">💡 Focus Practice</div>
          <div className="un-body">
            Here are the facts most frequently answered incorrectly or slowly. 
            Focus on the skills covering these before unlocking the next level.
          </div>
        </div>
      )}

      <div className="dash-section">
        <div className="dash-section-label">🔴 Weak Facts — Needs Practice</div>
        {weakFacts.length === 0 ? (
          <div style={{ padding: '10px 0', color: 'var(--muted)', fontSize: '13px' }}>Not enough data or all facts are mastered.</div>
        ) : (
          weakFacts.map(stat => (
            <div key={stat.fact_id} className="fact-row">
              <span className={`fact-q weak`}>{stat.question}</span>
              <div className="fact-meta">
                <div className={`fact-acc weak`}>{stat.accuracy}% Accuracy</div>
                <div className="fact-time">{(stat.avg_time_ms / 1000).toFixed(1)}s avg</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="dash-section">
        <div className="dash-section-label">🟢 Strong Facts — Well done!</div>
        {strongFacts.length === 0 ? (
          <div style={{ padding: '10px 0', color: 'var(--muted)', fontSize: '13px' }}>No facts meet strong criteria yet (≥90% accuracy, ≤3s).</div>
        ) : (
          strongFacts.map(stat => (
            <div key={stat.fact_id} className="fact-row">
              <span className={`fact-q strong`}>{stat.question}</span>
              <div className="fact-meta">
                <div className={`fact-acc strong`}>{stat.accuracy}% Accuracy</div>
                <div className="fact-time">{(stat.avg_time_ms / 1000).toFixed(1)}s avg</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}