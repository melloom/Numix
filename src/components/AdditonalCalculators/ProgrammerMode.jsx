import React, { useState, useEffect, useRef } from 'react';
import { safeEval, highlightSyntax, validateJavaScript, codeTemplates } from '../../utils/programCodeHelpers';

/**
 * Enhanced Programmer Calculator Mode Component
 * Provides a full featured code editor with syntax highlighting,
 * execution capabilities, and helpful templates
 */
function ProgrammerMode({ onAddToHistory }) {
  const [code, setCode] = useState(codeTemplates.empty);
  const [output, setOutput] = useState('> Ready');
  const [isRunning, setIsRunning] = useState(false);
  const [syntaxError, setSyntaxError] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const editorRef = useRef(null);
  
  // Calculate line count whenever code changes
  useEffect(() => {
    setLineCount(code.split('\n').length);
  }, [code]);
  
  // Validate syntax as user types (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const validation = validateJavaScript(code);
      setSyntaxError(validation.valid ? null : {
        message: validation.error,
        line: validation.line
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [code]);
  
  // Execute the code safely
  const runCode = () => {
    setIsRunning(true);
    setOutput('> Running...');
    
    // Slight delay to allow UI to update
    setTimeout(() => {
      try {
        const startTime = performance.now();
        const result = safeEval(code);
        const executionTime = performance.now() - startTime;
        
        if (result.success) {
          const formattedResult = typeof result.result === 'object' 
            ? JSON.stringify(result.result, null, 2) 
            : String(result.result);
            
          setOutput(`> ${formattedResult}\nExecution time: ${executionTime.toFixed(2)}ms`);
          
          // Add to history if provided
          if (onAddToHistory && result.result !== undefined) {
            // Extract function name for history
            const functionMatch = code.match(/function\s+([a-zA-Z_$][0-9a-zA-Z_$]*)/);
            const functionName = functionMatch ? functionMatch[1] : "anonymous";
            onAddToHistory(`Run Program: ${functionName}()`, formattedResult);
          }
        } else {
          setOutput(`> Error: ${result.error}`);
        }
      } catch (error) {
        setOutput(`> Error: ${error.message}`);
      } finally {
        setIsRunning(false);
      }
    }, 50);
  };
  
  // Insert a code template
  const insertTemplate = (templateName) => {
    setCode(codeTemplates[templateName] || codeTemplates.empty);
    setShowTemplates(false);
  };
  
  // Generate line numbers for the editor
  const renderLineNumbers = () => {
    return Array.from({ length: lineCount }, (_, i) => i + 1).map(num => (
      <div 
        key={num} 
        className={`line-number ${syntaxError && syntaxError.line === num ? 'error-line' : ''}`}
        style={{ userSelect: "none" }}
      >
        {num}
      </div>
    ));
  };
  
  // Handle tab key in textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      
      // Insert a proper tab (2 spaces)
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newValue);
      
      // Set cursor position after the tab
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };
  
  return (
    <div className="programmer-mode" style={{
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Editor header with actions */}
      <div className="editor-header" style={{
        backgroundColor: "#232946",
        color: "#fff",
        padding: "4px 8px",
        fontSize: "0.7em",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div className="editor-title">
          JavaScript Editor
        </div>
        <div className="editor-actions" style={{ display: "flex", gap: "8px" }}>
          <button 
            onClick={() => setFontSize(prev => Math.min(prev + 1, 18))}
            style={{ fontSize: "0.9em", padding: "1px 4px", backgroundColor: "transparent", border: "none", color: "#fff" }}
          >
            A+
          </button>
          <button 
            onClick={() => setFontSize(prev => Math.max(prev - 1, 9))}
            style={{ fontSize: "0.9em", padding: "1px 4px", backgroundColor: "transparent", border: "none", color: "#fff" }}
          >
            A-
          </button>
          <button 
            onClick={() => setShowTemplates(!showTemplates)}
            style={{ fontSize: "0.9em", padding: "1px 4px", backgroundColor: "#6366f1", border: "none", borderRadius: "3px", color: "#fff" }}
          >
            Templates
          </button>
        </div>
      </div>
      
      {/* Templates popup */}
      {showTemplates && (
        <div className="templates-popup" style={{
          position: "absolute",
          top: "30px",
          right: "10px",
          backgroundColor: "#1e293b",
          border: "1px solid #6366f1",
          borderRadius: "5px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          zIndex: 10,
          width: "150px"
        }}>
          {Object.keys(codeTemplates).map(template => (
            template !== 'empty' && (
              <button 
                key={template}
                onClick={() => insertTemplate(template)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: "1px solid #2d3748",
                  color: "#e2e8f0",
                  cursor: "pointer"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#2d3748"}
                onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
              >
                {template.charAt(0).toUpperCase() + template.slice(1)}
              </button>
            )
          ))}
        </div>
      )}
      
      {/* Editor area with line numbers */}
      <div className="editor-area" style={{
        display: "flex",
        flex: 1,
        backgroundColor: "#1e293b",
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: `${fontSize}px`
      }}>
        {/* Line numbers */}
        <div className="line-numbers" style={{
          backgroundColor: "#0f172a",
          color: "#64748b",
          padding: "8px 5px",
          textAlign: "right",
          userSelect: "none",
          minWidth: "30px"
        }}>
          {renderLineNumbers()}
        </div>
        
        {/* Code editor */}
        <textarea
          ref={editorRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            backgroundColor: "#1e293b",
            color: "#f8fafc",
            border: "none",
            padding: "8px",
            resize: "none",
            outline: "none",
            lineHeight: "1.5",
            fontFamily: "inherit",
            fontSize: "inherit",
            overflowY: "auto"
          }}
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
        />
      </div>
      
      {/* Syntax error display */}
      {syntaxError && (
        <div className="syntax-error" style={{
          backgroundColor: "#7f1d1d",
          color: "#fecaca",
          padding: "4px 8px",
          fontSize: "0.7rem",
          maxHeight: "40px",
          overflowY: "auto",
          borderTop: "1px solid #be123c"
        }}>
          {syntaxError.line ? `Line ${syntaxError.line}: ` : ""}
          {syntaxError.message}
        </div>
      )}
      
      {/* Run button */}
      <button
        onClick={runCode}
        disabled={isRunning || syntaxError}
        style={{
          backgroundColor: syntaxError ? "#64748b" : "#6366f1",
          color: "#fff",
          border: "none",
          padding: "6px",
          margin: 0,
          cursor: isRunning || syntaxError ? "not-allowed" : "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontWeight: "bold"
        }}
      >
        {isRunning ? "Running..." : "Run Program"}
      </button>
      
      {/* Console output */}
      <div className="console-output" style={{
        backgroundColor: "#0f172a",
        color: output.includes("Error") ? "#fb7185" : "#4ade80",
        padding: "8px",
        maxHeight: "60px",
        overflowY: "auto",
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: "11px",
        whiteSpace: "pre-wrap"
      }}>
        {output}
      </div>
    </div>
  );
}

export default ProgrammerMode;
