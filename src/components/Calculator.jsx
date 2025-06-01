import React, { useState, useRef, useEffect } from "react";
import Display from "./Display";
import Keypad from "./Keypad";
import ThemeSwitcher from "./ThemeSwitcher";
import { calculate } from "../utils/calculatorLogic.js";
import { 
  validateInput, 
  sanitizeExpression, 
  detectDivisionByZero,
  isOperator
} from "../utils/inputValidation.js";
import ScientificCalculator from "./AdditonalCalculators/ScientificCalculator.jsx";
import ProgrammerCalculator from "./AdditonalCalculators/ProgrammerCalculator.jsx";
import Convertor from "./AdditonalCalculators/Convertor.jsx";

const CALC_TYPES = [
  { key: "Standard", label: "Basic", icon: "⋇" },
  { key: "Scientific", label: "Scientific", icon: "ƒ(x)" },
  { key: "Programmer", label: "Programmer", icon: "⌨️" },
  { key: "Convert", label: "Convert", icon: "⇄" }
];
const OPERATORS = ["/", "*", "-", "+", "÷", "×", "−", "+"];

function Calculator() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [calcType, setCalcType] = useState("Standard");
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [lastWasEquals, setLastWasEquals] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      const data = localStorage.getItem("numix-history");
      if (data) {
        const parsedHistory = JSON.parse(data);
        
        // Filter out entries older than 15 days
        const fifteenDaysInMs = 15 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const filteredHistory = parsedHistory.filter(item => {
          return (now - item.time) < fifteenDaysInMs;
        });
        
        return filteredHistory;
      }
      return [];
    } catch (error) {
      console.error("Error loading history from localStorage:", error);
      return [];
    }
  });
  const popupRef = useRef(null);
  const calcBtnRef = useRef(null);
  const [popupStyle, setPopupStyle] = useState({});
  const [calcBtnActive, setCalcBtnActive] = useState(false);
  // Add state for selected calculator mode
  const [activeCalc, setActiveCalc] = useState("Standard");
  const [lastHistoryEntry, setLastHistoryEntry] = useState({ expr: null, res: null });
  
  // Remove the popup ready state since we won't pre-render
  // const [popupReady, setPopupReady] = useState(false);
  // useEffect(() => {
  //   setPopupReady(true);
  // }, []);
  
  // Add state for popup animation
  const [isPopupAnimating, setIsPopupAnimating] = useState(false);
  
  // Responsive: detect mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 600;

  // Keyboard input support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showTypeMenu) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      let key = e.key;
      if (key === "Enter") key = "=";
      if (key === "Backspace") key = "AC";
      if (key === "Escape") {
        setShowTypeMenu(false);
        return;
      }
      if ("0123456789".includes(key) || "+-*/.".includes(key) || key === "=" || key === "AC") {
        e.preventDefault();
        handleKeyPress(key);
      }
      if (e.code.startsWith("Numpad")) {
        const np = e.code.replace("Numpad", "");
        if ("0123456789".includes(np)) handleKeyPress(np);
        if (np === "Add") handleKeyPress("+");
        if (np === "Subtract") handleKeyPress("-");
        if (np === "Multiply") handleKeyPress("*");
        if (np === "Divide") handleKeyPress("/");
        if (np === "Decimal") handleKeyPress(".");
        if (np === "Enter") handleKeyPress("=");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line
  }, [showTypeMenu, expression, result, lastWasEquals]);

  // Modal close on outside click or tap on icon again
  useEffect(() => {
    if (!showTypeMenu) return;
    const handleClick = (e) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        calcBtnRef.current &&
        !calcBtnRef.current.contains(e.target)
      ) {
        setShowTypeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [showTypeMenu]);

  // Modify the type menu toggle function to ensure clean animations
  const toggleTypeMenu = () => {
    if (showTypeMenu) {
      // Just hide immediately when closing
      setShowTypeMenu(false);
      setIsPopupAnimating(false);
    } else {
      // For opening, first set animation flag and delay showing
      setIsPopupAnimating(true);
      
      // Apply a short timeout to prevent rendering issues
      requestAnimationFrame(() => {
        setShowTypeMenu(true);
      });
    }
  };

  // Listen for animation end to reset animation state
  const handleAnimationEnd = () => {
    setIsPopupAnimating(false);
  };

  // Position popup absolutely within calculator container with consistent positioning
  useEffect(() => {
    if (showTypeMenu && calcBtnRef.current) {
      const btn = calcBtnRef.current;
      const calculatorContainer = document.querySelector('.calculator-container');
      
      if (!calculatorContainer || !btn) return;
      
      const btnRect = btn.getBoundingClientRect();
      const containerRect = calculatorContainer.getBoundingClientRect();
      
      // Simple positioning that works consistently
      setPopupStyle({
        position: "absolute",
        left: `${btnRect.left - containerRect.left}px`,
        bottom: `${containerRect.height - (btnRect.top - containerRect.top) + 10}px`,
        top: 'auto',
        transform: 'translateY(0)',
        minWidth: "160px",
        maxWidth: "210px",
        zIndex: 200 // Ensure it's above everything
      });
    }
  }, [showTypeMenu]);

  const getLastChar = (str) => str[str.length - 1];

  // Make handleKeyPress async and always use the latest expression
  const handleKeyPress = async (key) => {
    // Map display operators to JS
    const opMap = { "÷": "/", "×": "*", "−": "-", "+": "+" };
    
    if (key === "calc") {
      setShowTypeMenu((v) => !v);
      return;
    }

    // Handle AC (clear all)
    if (key === "AC") {
      setExpression("");
      setResult("0");
      setLastWasEquals(false);
      return;
    }
    
    // Validate input before proceeding
    const validation = validateInput(key, expression, OPERATORS, lastWasEquals);
    
    if (!validation.valid) {
      console.log(`Invalid input: ${validation.reason}`);
      return;
    }
    
    // Handle equals button
    if (key === "=") {
      if (!expression) return; // Don't calculate empty expressions
      
      // Sanitize the expression before calculating
      const expr = sanitizeExpression(expression, OPERATORS);
      
      // Check for division by zero
      if (detectDivisionByZero(expr)) {
        setResult("Error: Division by zero");
        setLastWasEquals(true);
        return;
      }
      
      const res = await calculate(expr);
      setResult(res);
      setLastWasEquals(true);
      
      // Only add to history if this isn't a duplicate of the last calculation
      if (expr !== lastHistoryEntry.expr || res !== lastHistoryEntry.res) {
        addToHistory(expr, res);
      }
      return;
    }
    
    // Reset expression if starting a new calculation after equals
    if (validation.resetExpression) {
      setExpression(key);
      setResult("0");
      setLastWasEquals(false);
      return;
    }
    
    // Replace last character if needed
    if (validation.replaceLastChar && isOperator(key, OPERATORS)) {
      setExpression(expression.slice(0, -1) + opMap[key] || key);
      setLastWasEquals(false);
      return;
    }
    
    // Handle decimal point as first character
    if (key === "." && !expression) {
      setExpression("0.");
      setLastWasEquals(false);
      return;
    }

    // Handle +/- toggle
    if (key === "+/-") {
      if (!expression) return;
      
      // Toggle sign of the last number in the expression
      const parts = expression.split(/([\+\-\*\/÷×−\+])/);
      let lastNumber = parts.pop();
      if (!lastNumber || OPERATORS.includes(lastNumber)) {
        lastNumber = parts.pop();
      }
      if (!lastNumber) return;
      
      const prefix = expression.slice(0, expression.length - lastNumber.length);
      const toggledNumber = lastNumber.startsWith('-') ? 
        lastNumber.slice(1) : 
        '-' + lastNumber;
      
      setExpression(prefix + toggledNumber);
      setLastWasEquals(false);
      return;
    }

    // Handle percentage
    if (key === "%") {
      if (!expression || isOperator(expression[expression.length - 1], OPERATORS)) return;
      setExpression(expression + "/100");
      setLastWasEquals(false);
      return;
    }

    // Default: append key to expression
    setExpression(expression + (opMap[key] || key));
    setLastWasEquals(false);
  };

  // Create a shared function to add calculations to history
  const addToHistory = (expr, res) => {
    if (expr && res !== "Error") {
      
      // Generate a unique ID for this calculation
      const calculationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create context-specific metadata based on calculator type
      let metadata = {};
      
      if (activeCalc === "Scientific") {
        // Detect type of scientific calculation
        const hasTrigo = /sin|cos|tan/.test(expr);
        const hasLog = /log|ln/.test(expr);
        const hasPower = /\^|xʸ|√/.test(expr);
        
        metadata = {
          category: hasTrigo ? "Trigonometric" : 
                   hasLog ? "Logarithmic" : 
                   hasPower ? "Power/Root" : "Basic",
          complexity: expr.length > 15 ? "Complex" : "Simple"
        };
      } 
      else if (activeCalc === "Programmer") {
        // Extract base information from programmer calculations
        const hasBase = expr.includes("[");
        const baseMatch = expr.match(/\[(?:0b|0o|0x)?(\d+)\]/);
        const base = baseMatch ? parseInt(baseMatch[1]) : 10;
        
        // Detect type of bitwise operation
        const hasBitwise = /AND|OR|XOR|NOT|<<|>>|&|\||\^|~/.test(expr);
        const hasHex = /[A-F]|0x/.test(expr);
        
        metadata = {
          base: base === 2 ? "Binary" :
                base === 8 ? "Octal" :
                base === 16 ? "Hexadecimal" : "Decimal",
          operation: hasBitwise ? "Bitwise" : "Arithmetic",
          notation: hasHex ? "Hexadecimal" : "Standard"
        };
      }
      else if (activeCalc === "Convert") {
        // Extract unit conversion information
        const fromMatch = expr.match(/(\w+)\s+to\s+(\w+)/i) || 
                          expr.match(/Convert (\w+):\s+([\d.]+)\s+(\w+)/i);
        
        const category = expr.includes("Currency") ? "Currency" :
                        expr.includes("Length") ? "Length" :
                        expr.includes("Weight") ? "Weight" :
                        expr.includes("Temperature") ? "Temperature" :
                        expr.includes("Time") ? "Time" : "Other";
                        
        metadata = {
          conversionType: category,
          fromUnit: fromMatch ? fromMatch[1] : "unknown",
          toUnit: fromMatch ? fromMatch[2] : "unknown"
        };
      }
      else {
        // Standard calculator or other types
        metadata = {
          category: "Basic",
          hasParentheses: expr.includes("(") || expr.includes(")"),
          hasMultipleOperations: (expr.match(/[\+\-\×\÷]/g) || []).length > 1
        };
      }
      
      // Store calculation in history with metadata
      const newCalculation = {
        id: calculationId,
        expression: expr,
        result: res,
        timestamp: new Date().toISOString(),
        calculator: activeCalc,
        metadata
      };
      
      // Add to history state
      setHistory(prev => [...prev, newCalculation]);
      
      // Optionally persist to localStorage
      try {
        const savedHistory = JSON.parse(localStorage.getItem('calculatorHistory') || '[]');
        savedHistory.push(newCalculation);
        localStorage.setItem('calculatorHistory', JSON.stringify(savedHistory.slice(-50))); // Keep last 50
      } catch (err) {
        console.error("Error saving to history:", err);
      }
    }
  };

  // Reset lastHistoryEntry whenever the calculator mode changes
  useEffect(() => {
    setLastHistoryEntry({ expr: null, res: null });
  }, [activeCalc]);

  // Add console logging to debug mode switching
  useEffect(() => {
    console.log("Active calculator changed to:", activeCalc);
  }, [activeCalc]);

  // Modify the handleTypeSelect function to ensure state updates
  const handleTypeSelect = (type) => {
    console.log("Selecting calculator type:", type.key);
    setCalcType(type.key);
    setActiveCalc(type.key);
    setShowTypeMenu(false);
  };

  const handleCalcIconDown = () => setCalcBtnActive(true);
  const handleCalcIconUp = () => setCalcBtnActive(false);

  // Update the handleCalcIconClick function to use toggleTypeMenu
  const handleCalcIconClick = () => toggleTypeMenu();

  // Hamburger menu for history (open modal)
  const handleHistoryClick = () => setShowHistory(true);

  // Add state for the custom confirmation modal
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  
  // Replace the clearAllHistory function with this improved version
  const clearAllHistory = () => {
    // Show the custom confirmation modal instead of browser confirm
    setShowConfirmClear(true);
  };
  
  // Add a function to handle actual history clearing
  const confirmClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("numix-history");
    setShowConfirmClear(false);
  };

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      // Filter out entries older than 15 days before saving
      const fifteenDaysInMs = 15 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const filteredHistory = history.filter(item => {
        return (now - item.time) < fifteenDaysInMs;
      });
      
      localStorage.setItem("numix-history", JSON.stringify(filteredHistory));
    } catch (error) {
      console.error("Error saving history to localStorage:", error);
    }
  }, [history]);

  // Periodically clean up old history entries (once per session)
  useEffect(() => {
    const cleanupOldEntries = () => {
      setHistory(prevHistory => {
        const fifteenDaysInMs = 15 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        return prevHistory.filter(item => (now - item.time) < fifteenDaysInMs);
      });
    };
    
    // Run cleanup once when component mounts
    cleanupOldEntries();
    
    // Optional: Set up periodic cleanup (e.g., once per day)
    // This ensures old entries are removed even if the user keeps the app open for days
    const cleanupInterval = setInterval(cleanupOldEntries, 24 * 60 * 60 * 1000);
    return () => clearInterval(cleanupInterval);
  }, []);

  // Pass modal control props to all calculators
  return (
    <div className="calculator-container" style={{ position: "relative" }}>
      <div className="calculator-header">
        <div className="theme-tabs">
          <button
            className="history-menu-btn"
            title="Show history"
            aria-label="Show calculation history"
            onClick={handleHistoryClick}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.35rem",
              marginRight: "0.15rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "0.18rem 0.38rem 0.18rem 0.18rem",
              borderRadius: "0.6em",
              height: "2.1rem",
              width: "2.1rem",
              minWidth: "2.1rem",
              minHeight: "2.1rem"
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", width: "100%", height: "100%" }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect y="4" width="22" height="2" rx="1" fill="#6366f1"/>
                <rect y="10" width="22" height="2" rx="1" fill="#6366f1"/>
                <rect y="16" width="22" height="2" rx="1" fill="#6366f1"/>
              </svg>
            </span>
          </button>
          <ThemeSwitcher />
          <div className="calc-tabs">
            <button
              className="calc-tab active"
              style={{ background: "#6366f1", color: "#fff", cursor: "default" }}
              disabled
            >
              {CALC_TYPES.find(t => t.key === calcType)?.label || "Basic"}
            </button>
          </div>
        </div>
      </div>
      {/* Only show Display for Standard calculator */}
      {activeCalc === "Standard" && (
        <Display expression={expression} result={result} />
      )}
      <div style={{ position: "relative", zIndex: 1 }}> {/* Add explicit z-index */}
        {/* Only show overlay within the calculator area */}
        {showTypeMenu && (
          <div
            className="calc-mode-overlay"
            onClick={() => setShowTypeMenu(false)}
            style={{ 
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 150 // Between calculator and popup
            }}
          />
        )}
        
        {showTypeMenu && (
          <div
            className={`calc-mode-popup ios-calc-popup ${isPopupAnimating ? "animating" : ""}`}
            ref={popupRef}
            style={{
              ...popupStyle,
              zIndex: 200 // Ensure it's above the overlay
            }}
            onAnimationEnd={handleAnimationEnd}
          >
            <div className="calc-mode-popup-inner small-calc-popup-inner">
              {CALC_TYPES.map((type) => (
                <button
                  key={type.key}
                  className={`calc-mode-item${calcType === type.key ? " active" : ""}`}
                  onClick={() => handleTypeSelect(type)}
                  tabIndex={0}
                >
                  <span className="calc-mode-icon">{type.icon}</span>
                  <span className="calc-mode-label">{type.label}</span>
                  {type.key === "Convert" && (
                    <span className="calc-mode-switch">
                      <input type="checkbox" disabled />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Render the selected calculator with a fallback for debugging */}
        {activeCalc === "Standard" ? (
          <Keypad
            onKeyPress={handleKeyPress}
            onCalcIconClick={handleCalcIconClick}
            calcBtnRef={calcBtnRef}
            calcBtnActive={calcBtnActive}
            onCalcIconDown={handleCalcIconDown}
            onCalcIconUp={handleCalcIconUp}
          />
        ) : activeCalc === "Scientific" ? (
          <ScientificCalculator
            onCalcIconClick={handleCalcIconClick}
            calcBtnRef={calcBtnRef}
            calcBtnActive={calcBtnActive}
            onCalcIconDown={handleCalcIconDown}
            onCalcIconUp={handleCalcIconUp}
            onAddToHistory={addToHistory}
          />
        ) : activeCalc === "Programmer" ? (
          <ProgrammerCalculator
            onCalcIconClick={handleCalcIconClick}
            calcBtnRef={calcBtnRef}
            calcBtnActive={calcBtnActive}
            onCalcIconDown={handleCalcIconDown}
            onCalcIconUp={handleCalcIconUp}
            onAddToHistory={addToHistory}
          />
        ) : activeCalc === "Convert" ? (
          <Convertor
            onCalcIconClick={handleCalcIconClick}
            calcBtnRef={calcBtnRef}
            calcBtnActive={calcBtnActive}
            onCalcIconDown={handleCalcIconDown}
            onCalcIconUp={handleCalcIconUp}
            onAddToHistory={addToHistory}
          />
        ) : (
          <div style={{padding: "20px", color: "red"}}>
            Error: Unknown calculator type '{activeCalc}'
          </div>
        )}
      </div>
      
      {/* History Modal with improved close button */}
      {showHistory && (
        <div
          className="history-modal-overlay"
          onClick={() => setShowHistory(false)}
          tabIndex={-1}
        >
          <div
            className="history-modal"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="history-modal-close"
              onClick={() => setShowHistory(false)}
              aria-label="Close history"
              title="Close"
              style={{
                position: "absolute",
                top: "12px",
                right: "15px",
                background: "transparent",
                border: "none",
                fontSize: "1.8rem",
                lineHeight: "1",
                padding: "5px 10px",
                cursor: "pointer",
                color: "#64748b",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease"
              }}
            >
              ×
            </button>
            <h2 className="history-modal-title">Calculation History</h2>
            <div className="history-modal-content">
              {history.length === 0 ? (
                <p>No history yet.</p>
              ) : (
                <ul className="history-list">
                  {history.map((item) => {
                    // Calculate how many days ago this entry was created
                    const daysAgo = Math.floor((Date.now() - item.time) / (24 * 60 * 60 * 1000));
                    const timeDisplay = daysAgo === 0 
                      ? "Today, " + new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                      : daysAgo === 1 
                      ? "Yesterday, " + new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                      : `${daysAgo} days ago, ` + new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    
                    // Get calculator type label for display
                    const calcTypeLabel = item.calcType ? 
                      (CALC_TYPES.find(t => t.key === item.calcType)?.label || item.calcType) : 
                      "Standard";
                    
                    // Create tailored entry displays based on calculator type
                    let historyContent;
                    
                    switch(item.calcType) {
                      case "Scientific":
                        // Scientific calculations with color-coded category
                        historyContent = (
                          <>
                            <div className="history-expr-container">
                              <span className={`history-category scientific-${(item.metadata?.category || "Basic").toLowerCase()}`}>
                                {item.metadata?.category || "Calculation"}
                              </span>
                              <div className="history-expr scientific">{item.expr}</div>
                            </div>
                            <div className="history-res">
                              <span className="history-equals">=</span> 
                              <span className="history-value scientific">{item.res}</span>
                            </div>
                          </>
                        );
                        break;
                        
                      case "Programmer":
                        // Programmer calculations with base information
                        historyContent = (
                          <>
                            <div className="history-expr-container">
                              {item.metadata?.hasBitwiseOp && 
                                <span className="history-tag bitwise">Bitwise</span>}
                              {item.metadata?.base && 
                                <span className="history-base-tag">{item.metadata.base}</span>}
                              <div className="history-expr programmer">{item.expr}</div>
                            </div>
                            <div className="history-res">
                              <span className="history-equals">=</span> 
                              <span className="history-value programmer">{item.res}</span>
                            </div>
                          </>
                        );
                        break;
                        
                      case "Convert":
                        // Conversion calculations with units highlighted
                        historyContent = (
                          <>
                            <div className="history-expr-container">
                              <span className="history-category converter">{item.metadata?.category || "Conversion"}</span>
                              <div className="history-expr converter">
                                {item.expr.replace(/Convert .*?:/, '')}
                              </div>
                            </div>
                            <div className="history-res converter">
                              {/* The conversion result already has the format we want */}
                              <span className="history-value">{item.res}</span>
                            </div>
                          </>
                        );
                        break;
                        
                      default:
                        // Standard calculations with basic display
                        historyContent = (
                          <>
                            <div className="history-expr">{item.expr}</div>
                            <div className="history-res">
                              <span className="history-equals">=</span> 
                              <span className="history-value">{item.res}</span>
                            </div>
                          </>
                        );
                    }
                    
                    return (
                      <li 
                        key={item.id || item.time} 
                        className={`history-item history-${item.calcType?.toLowerCase()}`}
                        data-calc-type={calcTypeLabel}
                      >
                        {historyContent}
                        
                        <div className="history-time">
                          <span className="history-timestamp">{timeDisplay}</span>
                          <span className={`history-calc-type ${item.calcType?.toLowerCase()}`} title={`Calculated in ${calcTypeLabel} calculator`}>
                            {calcTypeLabel}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {history.length > 0 && (
                <button onClick={clearAllHistory} className="clear-history-btn">
                  Clear All History
                </button>
              )}
              <div className="history-note">
                History is saved for 15 days
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom confirmation modal for clearing history */}
      {showConfirmClear && (
        <div className="history-modal-overlay" style={{ zIndex: 250 }}>
          <div className="confirmation-modal">
            <h3 className="confirmation-title">Clear History?</h3>
            <p className="confirmation-message">
              Are you sure you want to clear all calculation history? 
              This action cannot be undone.
            </p>
            <div className="confirmation-buttons">
              <button 
                className="cancel-button"
                onClick={() => setShowConfirmClear(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-button"
                onClick={confirmClearHistory}
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calculator;
