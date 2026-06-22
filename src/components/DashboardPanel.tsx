import { Child, ChildStats, LastSessionSummary } from '../types'

interface DashboardPanelProps {
  child: Child
  lastSessionSummary: LastSessionSummary | null
}

export default function DashboardPanel({ child, lastSessionSummary }: DashboardPanelProps) {
  if (!lastSessionSummary) {
    return (
      <div className="screen-dashboard">
        <div className="dash-header">
          <h2>Parent Dashboard</h2>
          <p>{child.name}'s fact performance</p>
        </div>
        <div style={{ padding: '24px 0', color: 'var(--muted)', fontSize: '14px' }}>
          Complete a practice session to see performance data here.
        </div>
      </div>
    )
  }

  const stats: ChildStats[] = Object.entries(lastSessionSummary.perFact).map(([fidStr, data]) => ({
    fact_id: parseInt(fidStr),
    question: data.question,
    accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    avg_time_ms: data.total > 0 ? data.totalTimeMs / data.total : 0,
    attempts_count: data.total,
  }))

  // Weak: accuracy < 90% atau avg_time > 6000ms
  const weak = stats
    .filter(s => s.accuracy < 90 || s.avg_time_ms > 6000)
    .sort((a, b) => a.accuracy - b.accuracy || b.avg_time_ms - a.avg_time_ms)
    .slice(0, 5)

  // Strong: accuracy >= 90% dan avg_time <= 6000ms
  const strong = stats
    .filter(s => s.accuracy >= 90 && s.avg_time_ms <= 6000)
    .sort((a, b) => b.accuracy - a.accuracy || a.avg_time_ms - b.avg_time_ms)
    .slice(0, 5)

  return (
    <div className="screen-dashboard">
      <div className="dash-header">
        <h2>Parent Dashboard</h2>
        <p>{child.name} · Last session: {lastSessionSummary.skill}</p>
      </div>

      {weak.length > 0 && (
        <div className="unlock-notice">
          <div className="un-title">💡 Focus Practice</div>
          <div className="un-body">
            Facts answered incorrectly or slowly in the last session. Keep practicing these!
          </div>
        </div>
      )}

      <div className="dash-section">
        <div className="dash-section-label">🔴 Weak Facts — Needs Practice</div>
        {weak.length === 0 ? (
          <div style={{ padding: '10px 0', color: 'var(--muted)', fontSize: '13px' }}>
            All facts in this session were answered well!
          </div>
        ) : (
          weak.map(stat => (
            <div key={stat.fact_id} className="fact-row">
              <span className="fact-q weak">{stat.question}</span>
              <div className="fact-meta">
                <div className="fact-acc weak">{stat.accuracy}% Accuracy</div>
                <div className="fact-time">{(stat.avg_time_ms / 1000).toFixed(1)}s avg</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="dash-section">
        <div className="dash-section-label">🟢 Strong Facts — Well done!</div>
        {strong.length === 0 ? (
          <div style={{ padding: '10px 0', color: 'var(--muted)', fontSize: '13px' }}>
            No facts met strong criteria yet (≥90% accuracy, ≤6s).
          </div>
        ) : (
          strong.map(stat => (
            <div key={stat.fact_id} className="fact-row">
              <span className="fact-q strong">{stat.question}</span>
              <div className="fact-meta">
                <div className="fact-acc strong">{stat.accuracy}% Accuracy</div>
                <div className="fact-time">{(stat.avg_time_ms / 1000).toFixed(1)}s avg</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
