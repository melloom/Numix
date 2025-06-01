import React, { useState, useEffect } from "react";
import { 
  validateInput, 
  sanitizeExpression, 
  detectDivisionByZero 
} from "../../utils/inputValidation.js";

// Use the public assets path for the sound file
const SOUND_SRC = "/assets/click-buttons-ui-menu-sounds-effects-button-2-203594.mp3";

function ProgrammerCalculator({
  onCalcIconClick,
  calcBtnRef,
  calcBtnActive,
  onCalcIconDown,
  onCalcIconUp,
  onAddToHistory
}) {
  const [value, setValue] = useState("");
  const [base, setBase] = useState(10); // Default to base 10 (decimal)
  const [result, setResult] = useState("");
  const [memory, setMemory] = useState(0);
  // Initialize selectedBaseView as null - no base selection highlighted by default
  const [selectedBaseView, setSelectedBaseView] = useState(null);
  const [showAscii, setShowAscii] = useState(false);
  const [asciiValue, setAsciiValue] = useState('');
  const [lastHistoryEntry, setLastHistoryEntry] = useState({ expr: null, res: null });
  
  // Remove the showQuickConversion state
  // const [showQuickConversion, setShowQuickConversion] = useState(false);
  
  const [conversionDirection, setConversionDirection] = useState(null);
  
  // Programmer calculator operators
  const PROG_OPERATORS = ["+", "-", "*", "/", "&", "|", "^", "~", "<<", ">>", "AND", "OR", "XOR", "NOT"];
  
  // Play sound instantly with a new Audio instance
  const playSound = () => {
    try {
      const audio = new window.Audio(SOUND_SRC);
      audio.playbackRate = 1.7;
      audio.play();
    } catch (e) {
      console.warn("Sound playback failed:", e);
    }
  };

  // ASCII converter function
  const convertToAscii = (input) => {
    try {
      // Handle edge cases or empty input
      if (!input || input === '0') return '"\\0"'; // Null character
      
      // Convert to decimal if in another base
      let decimalValue;
      if (base !== 10) {
        decimalValue = parseInt(input, base);
        if (isNaN(decimalValue)) return "Invalid input";
      } else {
        decimalValue = parseInt(input);
        if (isNaN(decimalValue)) return "Invalid input";
      }
      
      // Check if it's in valid ASCII range
      if (decimalValue >= 0 && decimalValue <= 127) {
        const char = String.fromCharCode(decimalValue);
        // Handle special characters with nice display
        if (decimalValue < 32 || decimalValue === 127) {
          const specialChars = {
            0: "NULL",
            9: "TAB",
            10: "LF",
            13: "CR",
            27: "ESC",
            32: "SPACE",
            127: "DEL"
          };
          return specialChars[decimalValue] || `ASCII ${decimalValue}`;
        }
        return `"${char}"`;
      } else if (decimalValue <= 0x10FFFF) {
        return `"${String.fromCharCode(decimalValue)}"`;
      } else {
        return "Out of range";
      }
    } catch (e) {
      return "Error";
    }
  };
  
  // Update ASCII value when value or base changes
  useEffect(() => {
    if (value && !showAscii) {
      try {
        setAsciiValue(convertToAscii(value));
      } catch (e) {
        setAsciiValue("Invalid");
      }
    } else if (result && !showAscii) {
      try {
        setAsciiValue(convertToAscii(result));
      } catch (e) {
        setAsciiValue("Invalid");
      }
    }
  }, [value, result, base, showAscii]);
  
  // Get values in all bases for quick conversion view
  const getBaseValues = () => {
    if (!value && !result) return null;
    
    const displayValue = result || value;
    
    try {
      // Parse in current base
      const num = parseInt(displayValue, base);
      if (isNaN(num)) return null;
      
      // Return formatted values in each base
      return {
        bin: num.toString(2),
        oct: num.toString(8),
        dec: num.toString(10),
        hex: num.toString(16).toUpperCase()
      };
    } catch (e) {
      console.error("Error converting to bases:", e);
      return null;
    }
  };
  
  // Convert the current value to a new base
  const convertToBase = (newBase) => {
    if (!value && !result) return;
    
    try {
      // Get current value in decimal
      const displayValue = result || value;
      const decimalValue = parseInt(displayValue, base);
      
      if (!isNaN(decimalValue)) {
        // Convert to the new base
        const targetBase = 
          newBase === "BIN" ? 2 : 
          newBase === "OCT" ? 8 : 
          newBase === "HEX" ? 16 : 10;
        
        const convertedValue = decimalValue.toString(targetBase).toUpperCase();
        
        // Update value or result based on which one is active
        if (result) {
          setResult(convertedValue);
        } else {
          setValue(convertedValue);
        }
        
        // Update the base
        setBase(targetBase);
        setSelectedBaseView(newBase);
      }
    } catch (e) {
      console.error("Base conversion error:", e);
    }
  };

  // Determine base name for display
  const getBaseName = (baseValue) => {
    switch(baseValue) {
      case 2: return "Binary";
      case 8: return "Octal";
      case 10: return "Decimal";
      case 16: return "Hexadecimal";
      default: return "Unknown";
    }
  };
  
  // Get valid digits for the current base
  const getValidDigits = (baseValue) => {
    switch(baseValue) {
      case 2: return ["0", "1"];
      case 8: return ["0", "1", "2", "3", "4", "5", "6", "7"];
      case 10: return ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
      case 16: return ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
      default: return [];
    }
  };

  const handleButton = (key) => {
    // Play sound on button press
    playSound();
    
    if (key === "calc") {
      onCalcIconClick && onCalcIconClick();
      return;
    }
    
    if (key === "AC") {
      setValue("");
      setResult("");
      setSelectedBaseView(null);
      return;
    }
    
    if (key === "DEL") {
      setValue(value.slice(0, -1));
      return;
    }
    
    // Toggle ASCII display
    if (key === "ASCII") {
      setShowAscii(!showAscii);
      return;
    }
    
    // Allow certain operations without validation
    if (key === "SPACE" || ["BIN", "DEC", "HEX", "OCT"].includes(key) || 
        key === "MS" || key === "MR" || key === "M+" || key === "M-") {
      if (key === "SPACE") {
        setValue(value + " ");
        return;
      }
      
      if (["BIN", "DEC", "HEX", "OCT"].includes(key)) {
        const newBase = key === "BIN" ? 2 : 
                        key === "OCT" ? 8 : 
                        key === "HEX" ? 16 : 10;
        
        // If changing to a different base, show conversion direction
        if (base !== newBase) {
          const fromBase = base;
          setConversionDirection({
            from: getBaseName(fromBase),
            to: getBaseName(newBase)
          });
          
          // Auto-hide the conversion direction after 2 seconds
          setTimeout(() => {
            setConversionDirection(null);
          }, 2000);
        }
        
        // Toggle selection if clicking the same base
        if (selectedBaseView === key) {
          // Deselect the base but keep using it
          setSelectedBaseView(null);
        } else {
          // Select a new base
          setSelectedBaseView(key);
          
          // Convert the current value if we have one
          if (value || result) {
            convertToBase(key);
            return; // Return early since we've updated everything
          }
        }
        
        // Always update the numeric base value even when toggling selection
        setBase(newBase);
        return;
      }
      
      // Improved memory operations
      if (key === "MS") {
        try {
          // Store in decimal regardless of current base
          let numValue;
          if (value) {
            numValue = base !== 10 ? parseInt(value, base) : parseInt(value);
            if (!isNaN(numValue)) {
              setMemory(numValue);
            }
          }
        } catch (e) {
          console.error("Memory store error:", e);
        }
        return;
      }
      
      if (key === "MR") {
        try {
          // Properly convert memory to current base when recalling
          const memoryInCurrentBase = memory.toString(base).toUpperCase();
          setValue(value + memoryInCurrentBase);
        } catch (e) {
          console.error("Memory recall error:", e);
        }
        return;
      }
      
      if (key === "M+") {
        try {
          // Parse current value in current base
          if (value) {
            const numValue = base !== 10 ? parseInt(value, base) : parseInt(value);
            if (!isNaN(numValue)) {
              // Perform operation in decimal
              const newMemory = memory + numValue;
              // Store result in decimal
              setMemory(newMemory);
            }
          }
        } catch (e) {
          console.error("Memory add error:", e);
        }
        return;
      }
      
      if (key === "M-") {
        try {
          // Parse current value in current base
          if (value) {
            const numValue = base !== 10 ? parseInt(value, base) : parseInt(value);
            if (!isNaN(numValue)) {
              // Perform operation in decimal
              const newMemory = memory - numValue;
              // Store result in decimal
              setMemory(newMemory);
            }
          }
        } catch (e) {
          console.error("Memory subtract error:", e);
        }
        return;
      }
      
      return;
    }
    
    // Stricter input validation based on current base
    // Binary mode specific validation - ONLY apply when a base is explicitly selected
    if (selectedBaseView === "BIN" && ["2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"].includes(key)) {
      console.log(`Invalid digit ${key} for binary mode`);
      setResult(`Invalid input for Binary: ${key}`);
      setTimeout(() => setResult(""), 1500);
      return;
    }
    
    // Octal mode specific validation - ONLY apply when a base is explicitly selected
    if (selectedBaseView === "OCT" && ["8", "9", "A", "B", "C", "D", "E", "F"].includes(key)) {
      console.log(`Invalid digit ${key} for octal mode`);
      setResult(`Invalid input for Octal: ${key}`);
      setTimeout(() => setResult(""), 1500);
      return;
    }
    
    // Decimal mode specific validation - ONLY apply when a base is explicitly selected
    if (selectedBaseView === "DEC" && ["A", "B", "C", "D", "E", "F"].includes(key)) {
      console.log(`Invalid digit ${key} for decimal mode`);
      setResult(`Invalid input for Decimal: ${key}`);
      setTimeout(() => setResult(""), 1500);
      return;
    }
    
    // Validate input for operations that modify the expression
    const validation = validateInput(key, value, PROG_OPERATORS, !!result);
    
    if (!validation.valid) {
      console.log(`Invalid input: ${validation.reason}`);
      return;
    }
    
    if (key === "+/-") {
      try {
        // Toggle sign for the last number in expression
        const lastNumberMatch = value.match(/[-]?\w+$/);
        if (lastNumberMatch) {
          const lastNumber = lastNumberMatch[0];
          const prefix = value.slice(0, value.length - lastNumber.length);
          const toggledNumber = lastNumber.startsWith('-') ? 
            lastNumber.slice(1) : 
            '-' + lastNumber;
          setValue(prefix + toggledNumber);
        }
      } catch {
        // Ignore if there's an error
      }
      return;
    }
    
    if (key === "=") {
      if (!value) return; // Don't calculate empty expressions
      
      try {
        // Sanitize the expression before calculating
        const sanitized = sanitizeExpression(value, PROG_OPERATORS);
        
        // Check for division by zero
        if (detectDivisionByZero(sanitized)) {
          setResult("Error: Division by zero");
          return;
        }
        
        // Support extended integer expressions with better handling for bitwise ops
        let expr = sanitized
          .replace(/AND/g, "&")
          .replace(/OR/g, "|")
          .replace(/XOR/g, "^")
          .replace(/NOT/g, "~")
          .replace(/<</g, "(a,b) => a << b")
          .replace(/>>/g, "(a,b) => a >> b")
          .replace(/%/g, "/100*");
          
        // Evaluate in the correct base context
        let resultValue;
        if (base !== 10) {
          // Convert operands to decimal, evaluate, then convert back
          const basePattern = new RegExp(`[0-9A-F]{1,}`, 'gi');
          expr = expr.replace(basePattern, match => {
            return parseInt(match, base);
          });
          
          // Better handling of bitwise operations
          try {
            // First attempt to evaluate as is for simple expressions
            resultValue = eval(expr);
          } catch (err) {
            // For more complex expressions especially with shift operators
            const shiftPattern = /\(a,b\) => a << b|\(a,b\) => a >> b/g;
            if (shiftPattern.test(expr)) {
              // Replace pattern with actual function and call it
              expr = expr.replace(/\(a,b\) => a << b\((\d+),(\d+)\)/g, (_, a, b) => parseInt(a) << parseInt(b));
              expr = expr.replace(/\(a,b\) => a >> b\((\d+),(\d+)\)/g, (_, a, b) => parseInt(a) >> parseInt(b));
              resultValue = eval(expr);
            } else {
              throw err;
            }
          }
          
          const formattedResult = resultValue.toString(base).toUpperCase();
          setResult(formattedResult);
          
          // Add to shared history with base information
          if (onAddToHistory) {
            // Include base information in the expression
            const basePrefix = base === 2 ? "0b" : 
                               base === 8 ? "0o" : 
                               base === 16 ? "0x" : "";
            // Only add to history if this isn't a duplicate of the last calculation
            if (value !== lastHistoryEntry.expr || formattedResult !== lastHistoryEntry.res) {
              onAddToHistory(`${value} [${basePrefix}${base}]`, formattedResult);
              setLastHistoryEntry({ expr: `${value} [${basePrefix}${base}]`, res: formattedResult });
            }
          }
        } else {
          resultValue = eval(expr);
          const formattedResult = resultValue.toString().toUpperCase();
          setResult(formattedResult);
          
          // Add to shared history
          if (onAddToHistory) {
            if (value !== lastHistoryEntry.expr || formattedResult !== lastHistoryEntry.res) {
              onAddToHistory(value, formattedResult);
              setLastHistoryEntry({ expr: value, res: formattedResult });
            }
          }
        }
      } catch (error) {
        console.error("Calculation error:", error);
        setResult("Error");
      }
      return;
    }
    
    // When starting a new value, reset lastHistoryEntry
    if (key === "AC" || validation?.resetExpression) {
      setLastHistoryEntry({ expr: null, res: null });
    }
    
    // Check if the key is valid for the current base - only when a base is explicitly selected
    if (selectedBaseView) {
      const validDigits = getValidDigits(base);
      if (!validDigits.includes(key) && ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"].includes(key)) {
        // It's a digit but not valid for this base
        console.log(`Invalid digit ${key} for base ${base}`);
        
        // Show a temporary message about invalid digit
        setResult(`Invalid: '${key}' not allowed in ${getBaseName(base)}`);
        setTimeout(() => {
          setResult("");
        }, 1500);
        
        return;
      }
    }
    
    // Default: append key
    setValue(value + key);
  };

  // Get the current primary value to show in the result display
  const getDisplayValue = () => {
    // If we're in ASCII mode, show the ASCII conversion
    if (showAscii) {
      return asciiValue || '—';
    }
    
    // If there's a calculated result, show it in the selected base
    if (result) {
      try {
        // For very large numbers, handle potential overflow
        const num = BigInt(result);
        
        // Convert to the selected base with appropriate handling for large numbers
        if (selectedBaseView === "BIN") {
          return num.toString(2);
        }
        if (selectedBaseView === "OCT") {
          return num.toString(8);
        }
        if (selectedBaseView === "HEX") {
          return num.toString(16).toUpperCase();
        }
        return num.toString(10);
      } catch (error) {
        // If there's an error in conversion
        return result;
      }
    }
    
    // Otherwise show the current input value
    try {
      if (value) {
        // Use BigInt for safer handling of large integers
        try {
          const num = BigInt(value);
          
          if (selectedBaseView === "BIN") return num.toString(2);
          if (selectedBaseView === "OCT") return num.toString(8);
          if (selectedBaseView === "HEX") return num.toString(16).toUpperCase();
          return num.toString(10);
        } catch {
          // If BigInt fails (maybe it's not a valid integer), 
          // fall back to parseInt
          const num = parseInt(value, 10);
          if (selectedBaseView === "BIN") return num.toString(2);
          if (selectedBaseView === "OCT") return num.toString(8);
          if (selectedBaseView === "HEX") return num.toString(16).toUpperCase();
          return num.toString(10);
        }
      }
    } catch {
      // In case of parsing error
    }
    return "0";
  };

  // Determine which base indicator to show - return null when no base is selected
  const getCurrentBaseIndicator = () => {
    // If user explicitly selected a base, show that
    if (selectedBaseView) {
      return selectedBaseView;
    }
    
    // When no base is explicitly selected, return default indicator based on current base
    return base === 10 ? "DEC (Default)" : `Base-${base}`;
  };

  return (
    <div className="programmer-calculator">
      <div className="modern-display" style={{
        marginBottom: "0.5rem", 
        borderRadius: "8px", 
        padding: "10px", 
        position: "relative",
        minHeight: "80px" // Ensure consistent minimum height
      }}>
        <div className="expression digital">{value || "0"}</div>
        <div className="result digital" style={{ 
          textAlign: "right",
          fontSize: "1.8em",
          overflowX: "auto", 
          whiteSpace: "nowrap",
          msOverflowStyle: "none", // Hide scrollbar in IE and Edge
          scrollbarWidth: "none", // Hide scrollbar in Firefox
          paddingBottom: "4px" // Add some space for the scrollbar
        }}>
          {getDisplayValue()}
        </div>
        
        {/* Add a custom style to hide the scrollbar in webkit browsers */}
        <style>
          {`
            .result.digital::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
        
        {/* Base indicator with improved visibility */}
        <div style={{
          position: "absolute",
          bottom: "5px",
          left: "10px", // Position on left instead of right
          fontSize: "0.8em",
          fontWeight: "bold",
          backgroundColor: selectedBaseView ? "#e0e7ef" : "#fef3c7", // Yellow background for default mode
          color: "#232946",
          padding: "2px 8px",
          borderRadius: "10px",
          border: selectedBaseView ? "1px solid #6366f1" : "1px solid #fbbf24", // Gold border for default mode
          zIndex: 2
        }}>
          {getCurrentBaseIndicator()}
        </div>
        
        {/* Show conversion direction when changing base */}
        {conversionDirection && (
          <div style={{
            position: "absolute",
            bottom: "5px",
            right: "10px",
            fontSize: "0.8em",
            fontWeight: "bold",
            backgroundColor: "#6366f1",
            color: "#ffffff",
            padding: "2px 8px",
            borderRadius: "10px",
            zIndex: 3,
            animation: "fadeInOut 2s forwards"
          }}>
            {conversionDirection.from} → {conversionDirection.to}
          </div>
        )}
        
        {/* Add animation for the conversion indicator */}
        <style>
          {`
            @keyframes fadeInOut {
              0% { opacity: 0; transform: translateY(10px); }
              15% { opacity: 1; transform: translateY(0); }
              85% { opacity: 1; transform: translateY(0); }
              100% { opacity: 0; transform: translateY(-10px); }
            }
          `}
        </style>
      </div>
      
      {/* Base selection buttons (remain as row 1) */}
      <div className="row-1-buttons" style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "6px",
        marginBottom: "0.5rem"
      }}>
        {["BIN", "OCT", "DEC", "HEX"].map((key, idx) => {
          // Add valid digits label
          const baseValue = key === "BIN" ? 2 : key === "OCT" ? 8 : key === "HEX" ? 16 : 10;
          const validDigitsText = key === "BIN" ? "0-1" : 
                              key === "OCT" ? "0-7" : 
                              key === "HEX" ? "0-F" : "0-9";
          
          // Highlight DEC button subtly when in default mode (no explicit selection)
          const isDefaultActive = !selectedBaseView && key === "DEC" && base === 10;
          
          return (
            <button
              key={key + idx}
              className={`keypad-btn base-btn ${key === selectedBaseView ? "active-base" : ""} ${isDefaultActive ? "default-active" : ""}`}
              onClick={() => handleButton(key)}
              style={{
                padding: "8px 4px", // Less vertical padding
                borderRadius: "0.9rem",
                fontWeight: "bold",
                fontSize: "1em",
                backgroundColor: isDefaultActive ? "#fef3c7" : "#f8fafc", // Light yellow for default mode
                color: "#232946",
                border: key === selectedBaseView
                  ? "1px solid #6366f1"
                  : isDefaultActive 
                    ? "1px solid #fbbf24" // Gold border for default active
                    : "1px solid #e5e9f2",
                WebkitTapHighlightColor: "transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative", // For the default indicator
              }}
            >
              <span style={{fontSize: "0.95em"}}>{key}</span>
              <span style={{
                fontSize: "0.6em", 
                opacity: 0.7, 
                marginTop: "3px",
                fontWeight: "normal"
              }}>
                {validDigitsText}
              </span>
              
              {/* Add "Default" indicator when in default mode */}
              {isDefaultActive && (
                <span style={{
                  position: "absolute",
                  bottom: "0px",
                  right: "0px",
                  fontSize: "0.5em",
                  backgroundColor: "#fbbf24",
                  color: "white",
                  padding: "1px 3px",
                  borderTopLeftRadius: "4px",
                  borderBottomRightRadius: "6px"
                }}>
                  DEFAULT
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* ASCII toggle button moved up to row 2 */}
      <div className="row-ascii-toggle" style={{
        marginBottom: "0.5rem"
      }}>
        <button
          className={`keypad-btn ${showAscii ? "active-base" : ""}`}
          onClick={() => handleButton("ASCII")}
          style={{
            width: "100%",
            padding: "10px 8px",
            borderRadius: "0.9rem",
            fontWeight: "bold",
            fontSize: "1em",
            backgroundColor: showAscii ? "#6366f1" : "#f8fafc",
            color: showAscii ? "#ffffff" : "#232946",
            border: "1px solid #e5e9f2",
            WebkitTapHighlightColor: "transparent"
          }}
        >
          ASCII {showAscii ? "Mode (ON)" : "Converter"}
        </button>
      </div>
      
      {/* Memory buttons moved to row 3 */}
      <div className="row-3-buttons" style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: "6px",
        marginBottom: "0.5rem" 
      }}>
        {["AC", "DEL", "MS", "MR", "M+", "M-"].map((key, idx) => (
          <button
            key={key + idx}
            className={`keypad-btn
              ${key === "AC" ? "clear" : ""}
              ${["MS", "MR", "M+", "M-"].includes(key) ? "memory-btn" : ""}
              ${key === "DEL" ? "delete-btn" : ""}
            `}
            onClick={() => handleButton(key)}
            style={{
              padding: "12px 8px",
              borderRadius: "0.9rem",
              fontWeight: "normal",
              fontSize: "1em",
              // Style the DEL button
              ...(key === "DEL" ? {
                background: "linear-gradient(135deg, #fb7185 0%, #fbbf24 100%)",
                color: "#ffffff",
                fontWeight: "700",
                border: "2px solid #fb7185",
                boxShadow: "0 0 0 2px rgba(251,191,36,0.08), 0 2px 8px rgba(251,113,133,0.10)"
              } : {}),
              WebkitTapHighlightColor: "transparent"
            }}
          >
            {key}
          </button>
        ))}
      </div>
      
      {/* Hex digits A-F now in row 4 */}
      <div className="row-4-buttons" style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: "6px",
        marginBottom: "0.5rem"
      }}>
        {["A", "B", "C", "D", "E", "F"].map((key, idx) => {
          // Only disable digits if a base is explicitly selected
          const isValidForCurrentBase = !selectedBaseView || getValidDigits(base).includes(key);
          
          return (
            <button
              key={key + idx}
              className={`keypad-btn hex-digit ${!isValidForCurrentBase ? "disabled-digit" : ""}`}
              onClick={() => handleButton(key)}
              style={{
                padding: "12px 8px",
                borderRadius: "0.9rem",
                fontWeight: "bold",
                fontSize: "1em",
                backgroundColor: isValidForCurrentBase ? "var(--hex-digit-bg, #6366f1)" : "#cbd5e1",
                color: isValidForCurrentBase ? "var(--hex-digit-color, #ffffff)" : "#64748b",
                opacity: isValidForCurrentBase ? 1 : 0.7,
                WebkitTapHighlightColor: "transparent"
              }}
            >
              {key}
            </button>
          );
        })}
      </div>
      
      {/* Rest of the keypad (remain unchanged) */}
      <div className="row-5-buttons" style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: "6px",
        marginBottom: "0.5rem"
      }}>
        {["7", "8", "9", "AND", "OR", "XOR"].map((key, idx) => {
          const isDigit = ["7", "8", "9"].includes(key);
          // Only disable digits if a base is explicitly selected
          const isValidForCurrentBase = !selectedBaseView || !isDigit || getValidDigits(base).includes(key);
          
          return (
            <button
              key={key + idx}
              className={`keypad-btn ${["AND", "OR", "XOR"].includes(key) ? "operator" : ""} ${isDigit && !isValidForCurrentBase ? "disabled-digit" : ""}`}
              onClick={() => handleButton(key)}
              style={{
                padding: "12px 8px",
                borderRadius: "0.9rem",
                fontWeight: "normal",
                fontSize: "1em",
                backgroundColor: ["AND", "OR", "XOR"].includes(key) ? "#fb7185" : 
                              (isDigit && !isValidForCurrentBase) ? "#cbd5e1" : "",
                color: ["AND", "OR", "XOR"].includes(key) ? "white" : 
                      (isDigit && !isValidForCurrentBase) ? "#64748b" : "",
                opacity: (isDigit && !isValidForCurrentBase) ? 0.7 : 1,
                WebkitTapHighlightColor: "transparent"
              }}
            >
              {key}
            </button>
          );
        })}
      </div>
      
      <div className="row-6-buttons" style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: "6px",
        marginBottom: "0.5rem"
      }}>
        {["4", "5", "6", "NOT", "<<", ">>"].map((key, idx) => (
          <button
            key={key + idx}
            className={`keypad-btn ${["NOT", "<<", ">>"].includes(key) ? "operator" : ""}`}
            onClick={() => handleButton(key)}
            style={{
              padding: "12px 8px",
              borderRadius: "0.9rem",
              fontWeight: "normal",
              fontSize: "1em",
              backgroundColor: ["NOT", "<<", ">>"].includes(key) ? "#fb7185" : "",
              color: ["NOT", "<<", ">>"].includes(key) ? "white" : "",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            {key}
          </button>
        ))}
      </div>
      
      <div className="row-7-buttons" style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: "6px",
        marginBottom: "0.5rem"
      }}>
        {["1", "2", "3", "(", ")", "%"].map((key, idx) => (
          <button
            key={key + idx}
            className={`keypad-btn ${["(", ")", "%"].includes(key) ? "operator" : ""}`}
            onClick={() => handleButton(key)}
            style={{
              padding: "12px 8px",
              borderRadius: "0.9rem",
              fontWeight: "normal",
              fontSize: "1em",
              backgroundColor: ["(", ")", "%"].includes(key) ? "#fb7185" : "",
              color: ["(", ")", "%"].includes(key) ? "white" : "",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            {key}
          </button>
        ))}
      </div>
      
      {/* Add seventh row with calculator button, zero, sign toggle, space and equals */}
      <div className="row-8-buttons" style={{
        display: "flex",
        gap: "6px",
        marginBottom: "0.5rem",
        position: "relative"
      }}>
        {/* Calculator mode button */}
        <button
          key="calc-btn"
          className={`keypad-btn calc-icon-btn${calcBtnActive ? " calc-icon-btn-active" : ""}`}
          ref={calcBtnRef}
          style={{
            flex: "1",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #232946 0%, #3730a3 100%)",
            border: "3px solid #fbbf24",
            boxShadow: "0 0 0 4px rgba(251,191,36,0.15), 0 2px 12px rgba(36,41,61,0.22)"
          }}
          onMouseDown={onCalcIconDown}
          onMouseUp={onCalcIconUp}
          onMouseLeave={onCalcIconUp}
          onTouchStart={onCalcIconDown}
          onTouchEnd={onCalcIconUp}
          onClick={onCalcIconClick}
          aria-label="Calculator Modes"
        >
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="3" width="24" height="26" rx="7" fill="#fff" opacity="0.13"/>
            <rect x="4" y="3" width="24" height="26" rx="7" fill="#232946"/>
            <rect x="8" y="7" width="16" height="4" rx="2" fill="#fff" />
            <rect x="8" y="13" width="4" height="4" rx="2" fill="#a5b4fc" />
            <rect x="14" y="13" width="4" height="4" rx="2" fill="#a5b4fc" />
            <rect x="20" y="13" width="4" height="4" rx="2" fill="#a5b4fc" />
            <rect x="8" y="19" width="4" height="4" rx="2" fill="#a5b4fc" />
            <rect x="14" y="19" width="4" height="4" rx="2" fill="#a5b4fc" />
            <rect x="20" y="19" width="4" height="4" rx="2" fill="#a5b4fc" />
          </svg>
        </button>
        
        {/* Zero button */}
        <button
          key="zero-btn"
          className="keypad-btn"
          onClick={() => handleButton("0")}
          style={{
            flex: "1",
            padding: "12px 8px",
            borderRadius: "0.9rem",
          }}
        >
          0
        </button>
        
        {/* Plus-minus button */}
        <button
          key="plusminus-btn"
          className="keypad-btn" // Removed "plusminus" class
          onClick={() => handleButton("+/-")}
          style={{
            flex: "1",
            padding: "12px 8px",
            borderRadius: "0.9rem",
            backgroundColor: "var(--number-btn-bg, #f8fafc)",
            color: "var(--number-btn-color, #232946)"
          }}
        >
          +/- 
        </button>
        
        {/* SPACE button */}
        <button
          key="space-btn"
          className="keypad-btn"
          onClick={() => handleButton("SPACE")}
          style={{
            flex: "1", 
            padding: "12px 8px",
            borderRadius: "0.9rem",
            fontSize: "0.9em"
          }}
        >
          SPACE
        </button>
        
        {/* Equals button - forced positioning */}
        <button
          key="equals-btn"
          className="keypad-btn equals"
          onClick={() => handleButton("=")}
          style={{
            flex: "1",
            padding: "12px 8px",
            borderRadius: "0.9rem",
            backgroundColor: "#fb7185",
            color: "white",
            display: "block", // Ensure it's a block element
            height: "100%"  // Match height with others
          }}
        >
          =
        </button>
      </div>
      
      {/* Visual indicator for valid digits - show conditionally */}
      {selectedBaseView && (
        <div className="valid-digits-indicator" style={{
          padding: "0.3rem 0.5rem",
          textAlign: "center",
          marginBottom: "0.5rem",
          backgroundColor: "rgba(99, 102, 241, 0.08)",
          borderRadius: "0.6rem",
          fontSize: "0.75rem"
        }}>
          Valid digits for {getBaseName(base)}: 
          {getValidDigits(base).map((digit, i) => (
            <span 
              key={i} 
              style={{
                display: "inline-block",
                padding: "0.1rem 0.3rem",
                margin: "0 0.1rem",
                backgroundColor: "#6366f1",
                color: "white",
                borderRadius: "4px",
                fontSize: "0.8rem"
              }}
            >
              {digit}
            </span>
          ))}
        </div>
      )}
      
      {/* Enhanced memory and mode display with binary preview for larger values */}
      <div style={{
        marginTop: "0.7em", 
        fontSize: "0.85em",
        display: "flex",
        flexDirection: "column",
        gap: "0.4em"
      }}>
        <div style={{
          color: "#6366f1", 
          display: "flex", 
          justifyContent: "space-between",
          backgroundColor: "rgba(99, 102, 241, 0.06)",
          padding: "0.4em 0.6em",
          borderRadius: "0.8em",
          border: "1px solid rgba(99, 102, 241, 0.2)"
        }}>
          <div>Memory: {memory !== 0 ? (base !== 10 ? memory.toString(base).toUpperCase() : memory) : "0"}</div>
          <div>
            {showAscii ? "ASCII Mode" : 
             selectedBaseView ? `Base: ${base} (${selectedBaseView})` : 
             `Base: ${base} (Default DEC)`}
          </div>
        </div>
        
        {/* Add binary preview for bit operations */}
        {(value || result) && selectedBaseView !== "BIN" && (
          <div style={{
            color: "#64748b", 
            fontSize: "0.8em", 
            fontFamily: "'Share Tech Mono', monospace",
            backgroundColor: "rgba(99, 102, 241, 0.03)",
            padding: "0.3em 0.6em",
            borderRadius: "0.6em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            Binary: {(() => {
              const displayValue = result || value;
              try {
                const decValue = parseInt(displayValue, base);
                if (!isNaN(decValue)) {
                  const binValue = decValue.toString(2);
                  if (binValue.length > 16) {
                    return binValue.substring(0, 8) + "..." + binValue.substring(binValue.length - 8);
                  }
                  return binValue;
                }
                return "—";
              } catch {
                return "—";
              }
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProgrammerCalculator;
