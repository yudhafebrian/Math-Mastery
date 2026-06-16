import { Child } from '../types'

interface TopbarProps {
  child: Child | null
  onBack: () => void
  currentSkill?: string
}

export default function Topbar({ child, onBack, currentSkill }: TopbarProps) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="topbar-icon">🧮</div>
        <div>
          <div className="topbar-title">Math Mastery</div>
          <div className="topbar-sub">
            {child
              ? currentSkill
                ? `${child.name} · ${currentSkill}`
                : `${child.name} · Ready to practice!`
              : 'Choose a child to start'}
          </div>
        </div>
      </div>
      {child && (
        <div className="avatar-bubble" onClick={onBack} title="Back to start">
          {child.avatar}
        </div>
      )}
    </div>
  )
}
