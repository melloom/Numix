import React, { useState, useEffect, useCallback } from 'react'
import { historyManager } from '../../utils/localStorage'
import './History.css'

const History = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // 'all', 'selected', or item id

  // Load history on component mount and when localStorage changes
  useEffect(() => {
    const loadHistory = () => {
      const savedHistory = historyManager.getHistory()
      setHistory(savedHistory)
    }

    loadHistory()

    // Listen for storage events (changes in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'calculatorHistory') {
        loadHistory()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Filter history based on search query
  const filteredHistory = searchQuery 
    ? historyManager.searchHistory(searchQuery)
    : history

  // Function to add new calculation to history
  const addToHistory = useCallback((calculation, result, calculatorType = 'standard') => {
    const newEntry = historyManager.addToHistory(calculation, result, calculatorType)
    setHistory(prev => [newEntry, ...prev.slice(0, 99)]) // Update local state
    return newEntry
  }, [])

  // Function to delete individual history item
  const deleteHistoryItem = (id) => {
    setDeleteTarget(id)
    setShowConfirmDelete(true)
  }

  // Function to confirm deletion
  const confirmDelete = () => {
    if (deleteTarget === 'all') {
      historyManager.clearAllHistory()
      setHistory([])
    } else if (deleteTarget === 'selected') {
      historyManager.deleteMultipleItems(selectedItems)
      setHistory(prev => prev.filter(item => !selectedItems.includes(item.id)))
      setSelectedItems([])
      setIsSelectionMode(false)
    } else {
      historyManager.deleteHistoryItem(deleteTarget)
      setHistory(prev => prev.filter(item => item.id !== deleteTarget))
    }
    
    setShowConfirmDelete(false)
    setDeleteTarget(null)
  }

  // Function to clear all history
  const clearAllHistory = () => {
    setDeleteTarget('all')
    setShowConfirmDelete(true)
  }

  // Function to delete selected items
  const deleteSelectedItems = () => {
    if (selectedItems.length > 0) {
      setDeleteTarget('selected')
      setShowConfirmDelete(true)
    }
  }

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    setSelectedItems([])
  }

  // Toggle item selection
  const toggleItemSelection = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  // Select all visible items
  const selectAllItems = () => {
    const allIds = filteredHistory.map(item => item.id)
    setSelectedItems(allIds)
  }

  // Function to copy calculation to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    }).catch(err => {
      console.error('Failed to copy: ', err)
    })
  }

  // Export history
  const exportHistory = () => {
    const blob = historyManager.exportHistory()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `calculator-history-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="history-backdrop" onClick={onClose} />
      <div className="history-modal">
        <div className="history-header">
          <h2 className="history-title">Calculator History</h2>
          <div className="history-actions">
            {isSelectionMode && (
              <>
                <button 
                  className="selection-btn" 
                  onClick={selectAllItems}
                  disabled={filteredHistory.length === 0}
                  title="Select all"
                >
                  Select All
                </button>
                <button 
                  className="delete-selected-btn" 
                  onClick={deleteSelectedItems}
                  disabled={selectedItems.length === 0}
                  title="Delete selected"
                >
                  Delete ({selectedItems.length})
                </button>
              </>
            )}
            
            {history.length > 0 && (
              <>
                <button 
                  className="selection-toggle-btn" 
                  onClick={toggleSelectionMode}
                  title={isSelectionMode ? "Exit selection" : "Select items"}
                >
                  {isSelectionMode ? "Cancel" : "Select"}
                </button>
                <button 
                  className="export-btn" 
                  onClick={exportHistory}
                  title="Export history"
                >
                  Export
                </button>
                <button 
                  className="clear-all-btn" 
                  onClick={clearAllHistory}
                  title="Clear all history"
                >
                  Clear All
                </button>
              </>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>
        
        {history.length > 0 && (
          <div className="history-search">
            <input
              type="text"
              placeholder="Search calculations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        )}
        
        <div className="history-content">
          {filteredHistory.length === 0 ? (
            <div className="empty-history">
              <div className="empty-icon">📋</div>
              <p>{searchQuery ? 'No matching calculations' : 'No calculations yet'}</p>
              <span>{searchQuery ? 'Try a different search term' : 'Your calculation history will appear here'}</span>
            </div>
          ) : (
            <div className="history-list">
              {filteredHistory.map((item) => (
                <div 
                  key={item.id} 
                  className={`history-item ${selectedItems.includes(item.id) ? 'selected' : ''}`}
                  onClick={isSelectionMode ? () => toggleItemSelection(item.id) : undefined}
                >
                  {isSelectionMode && (
                    <div className="selection-checkbox">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                      />
                    </div>
                  )}
                  
                  <div className="history-item-content">
                    <div className="calculation">
                      <span className="expression">{item.calculation}</span>
                      <span className="equals">=</span>
                      <span className="result">{item.result}</span>
                    </div>
                    <div className="item-meta">
                      <span className="timestamp">{item.displayTime}</span>
                      {item.calculatorType && item.calculatorType !== 'standard' && (
                        <span className="calculator-type">{item.calculatorType}</span>
                      )}
                    </div>
                  </div>
                  
                  {!isSelectionMode && (
                    <div className="history-item-actions">
                      <button 
                        className="copy-btn" 
                        onClick={() => copyToClipboard(item.result)}
                        title="Copy result"
                      >
                        📋
                      </button>
                      <button 
                        className="delete-btn" 
                        onClick={() => deleteHistoryItem(item.id)}
                        title="Delete this calculation"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Confirmation Modal */}
        {showConfirmDelete && (
          <div className="confirm-modal-backdrop">
            <div className="confirm-modal">
              <h3>Confirm Delete</h3>
              <p>
                {deleteTarget === 'all' 
                  ? 'Are you sure you want to delete all calculation history? This action cannot be undone.'
                  : deleteTarget === 'selected'
                  ? `Are you sure you want to delete ${selectedItems.length} selected items? This action cannot be undone.`
                  : 'Are you sure you want to delete this calculation? This action cannot be undone.'
                }
              </p>
              <div className="confirm-actions">
                <button 
                  className="confirm-btn confirm-btn--danger"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
                <button 
                  className="confirm-btn confirm-btn--cancel"
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Export the addToHistory function to be used by calculators
export const useCalculatorHistory = () => {
  const [, forceUpdate] = useState({})

  const addToHistory = useCallback((calculation, result, calculatorType = 'standard') => {
    const newEntry = historyManager.addToHistory(calculation, result, calculatorType)
    
    // Force re-render to update any listening components
    forceUpdate({})
    
    return newEntry
  }, [])

  return { addToHistory }
}

export default History 