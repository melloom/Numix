import React from "react";

const sciRows = [
  ["AC", "+/-", "%", "(", ")", "÷"],
  ["7", "8", "9", "√", "xʸ", "×"],
  ["4", "5", "6", "ln", "log", "−"],
  ["1", "2", "3", "sin", "cos", "+"],
  ["calc", "0", ".", "tan", "π", "="]
];

function ScientificKeypad({ onKeyPress, onCalcIconClick, calcBtnRef, calcBtnActive, onCalcIconDown, onCalcIconUp }) {
  const handleButtonPointerDown = (key, e) => {
    if (e && e.target && typeof e.target.blur === "function") {
      e.target.blur();
    }
    if (key === "calc") {
      onCalcIconClick && onCalcIconClick();
    } else {
      onKeyPress(key);
    }
  };

  return (
    <div className="keypad modern-keypad" style={{gridTemplateColumns: "repeat(6, 1fr)"}}>
      {sciRows.map((row, rowIdx) =>
        row.map((key, colIdx) =>
          key === "calc" ? (
            <button
              key={key + rowIdx + colIdx}
              className={`keypad-btn calc-icon-btn${calcBtnActive ? " calc-icon-btn-active" : ""}`}
              ref={calcBtnRef}
              style={{
                gridColumn: "1 / span 1",
                width: "100%",
                height: "100%",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #232946 0%, #3730a3 100%)",
                border: "3px solid #fbbf24",
                boxShadow: "0 0 0 4px rgba(251,191,36,0.15), 0 2px 12px rgba(36,41,61,0.22)"
              }}
              onPointerDown={e => handleButtonPointerDown(key, e)}
              onMouseDown={onCalcIconDown}
              onMouseUp={onCalcIconUp}
              onMouseLeave={onCalcIconUp}
              onTouchStart={onCalcIconDown}
              onTouchEnd={onCalcIconUp}
              aria-label="Calculator Modes"
              tabIndex={0}
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
          ) : key ? (
            <button
              key={key + rowIdx + colIdx}
              className={`keypad-btn
                ${key === "=" ? "equals" : ""}
                ${key === "AC" ? "clear" : ""}
                ${["÷", "×", "−", "+", "%", "√", "xʸ", "ln", "log", "sin", "cos", "tan"].includes(key) ? "operator" : ""}
                ${key === "%" ? "percent-btn" : ""}
                ${key === "+/-" ? "plusminus" : ""}
                ${key === "+" ? "plus-btn" : ""}
                ${key === "0" ? "zero-btn" : ""}
              `}
              style={{
                whiteSpace: "normal",
                overflow: "visible",
                textOverflow: "clip",
                lineHeight: "1.1",
                wordBreak: "break-word",
                textAlign: "center",
                minHeight: "2.2em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingLeft: 2,
                paddingRight: 2
              }}
              onPointerDown={e => handleButtonPointerDown(key, e)}
            >
              {key}
            </button>
          ) : null
        )
      )}
    </div>
  );
}

export default ScientificKeypad;
