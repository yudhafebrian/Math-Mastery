interface NavProps {
  activeTab: 'practice' | 'skills' | 'dashboard'
  onTabChange: (tab: 'practice' | 'skills' | 'dashboard') => void
}

export default function Nav({ activeTab, onTabChange }: NavProps) {
  return (
    <nav className="nav">
      <button 
        className={`nav-btn ${activeTab === 'practice' ? 'active' : ''}`} 
        onClick={() => onTabChange('practice')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        Practice
      </button>
      <button 
        className={`nav-btn ${activeTab === 'skills' ? 'active' : ''}`} 
        onClick={() => onTabChange('skills')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        Skills
      </button>
      <button 
        className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} 
        onClick={() => onTabChange('dashboard')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        Parent
      </button>
    </nav>
  )
}