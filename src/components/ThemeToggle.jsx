import React from 'react'
import { useTheme } from '../contexts/ThemeContext'
import './ThemeToggle.css'

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <button 
      className={`theme-toggle ${theme}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="toggle-track">
        <div className="toggle-thumb">
          <span className="toggle-icon">
            {isDark ? '🌙' : '☀️'}
          </span>
        </div>
      </div>
    </button>
  )
}

export default ThemeToggle 