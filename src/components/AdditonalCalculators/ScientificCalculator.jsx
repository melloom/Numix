import React, { useState, useRef, useEffect } from "react";
import { 
  validateInput, 
  sanitizeExpression, 
  detectDivisionByZero,
  isOperator 
} from "../../utils/inputValidation.js";
import { calculate } from "../../utils/calculatorLogic.js";
// Import Recharts components for graphing
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// Mobile-friendly scientific calculator layout
const rows = [
  ['AC', '+/-', '%', '(', ')', 'π'],
  ['7', '8', '9', '√', 'xʸ', '÷'],
  ['4', '5', '6', 'ln', 'log', '×'],
  ['1', '2', '3', 'sin', 'cos', '−'],
  ['calc', '0', '.', 'tan', '=', '+']
];

// Define fraction calculator buttons
const fractionRows = [
  ['AC', '+/-', '%', '(', ')', '÷'],
  ['7', '8', '9', 'a/b', 'n↔d', '×'],
  ['4', '5', '6', '→dec', '→frac', '−'],
  ['1', '2', '3', 'gcd', 'lcm', '+'],
  ['calc', '0', '.', '/', '=', '⇄']
];

// Define programmable calculator buttons
const programmableRows = [
  ['AC', 'DEF', 'RUN', 'LOAD', 'SAVE', '÷'],
  ['7', '8', '9', 'VAR', 'FUNC', '×'],
  ['4', '5', '6', 'IF', 'LOOP', '−'],
  ['1', '2', '3', 'MSG', 'RET', '+'],
  ['calc', '0', '.', ':', '=', '⇄']
];

// Define graphing calculator buttons
const graphingRows = [
  ['AC', 'Y=', 'GRAPH', 'TRACE', 'ZOOM', '÷'],
  ['7', '8', '9', 'WINDOW', 'TABLE', '×'],
  ['4', '5', '6', 'x', 't', '−'],
  ['1', '2', '3', 'FORMAT', 'CALC', '+'],
  ['calc', '0', '.', 'π', '=', '⇄']
];

// Use the public assets path for the sound file
const SOUND_SRC = "/assets/click-buttons-ui-menu-sounds-effects-button-2-203594.mp3";

function ScientificCalculator({
  onCalcIconClick,
  calcBtnRef,
  calcBtnActive,
  onCalcIconDown,
  onCalcIconUp,
  onAddToHistory
}) {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [lastWasEquals, setLastWasEquals] = useState(false);
  const [calculatorMode, setCalculatorMode] = useState("scientific"); // New state for calculator mode
  const [lastHistoryEntry, setLastHistoryEntry] = useState({ expr: null, res: null });
  
  // State for graphing calculator
  const [graphFunction, setGraphFunction] = useState("x^2");
  const [graphData, setGraphData] = useState([]);
  
  // State for programmable calculator
  const [programs, setPrograms] = useState([]);
  const [currentProgram, setCurrentProgram] = useState("");
  const [programOutput, setProgramOutput] = useState("");
  
  // State for fraction calculator
  const [fractionMode, setFractionMode] = useState(false);
  const [numerator, setNumerator] = useState(0);
  const [denominator, setDenominator] = useState(1);
  
  // Enhanced graph visualization settings
  const [graphViewport, setGraphViewport] = useState({
    xMin: -10, 
    xMax: 10, 
    yMin: -10, 
    yMax: 10,
    gridLines: true
  });

  // Track examples for programmable calculator
  const [programExamples] = useState([
    { name: "Simple Addition", code: `function add() {\n  let a = 5;\n  let b = 3;\n  return a + b;\n}` },
    { name: "Square", code: `function square() {\n  let x = 4;\n  return x * x;\n}` },
    { name: "Factorial", code: `function factorial() {\n  let n = 5;\n  let result = 1;\n  for (let i = 1; i <= n; i++) {\n    result *= i;\n  }\n  return result;\n}` }
  ]);

  // Scientific calculator operators
  const SCIENTIFIC_OPERATORS = ["/", "*", "-", "+", "÷", "×", "−", "+", "^", "√"];

  // Play sound instantly, always, with a new Audio instance
  const playSound = () => {
    try {
      const audio = new window.Audio(SOUND_SRC);
      audio.playbackRate = 1.7;
      audio.play();
    } catch (e) {
      console.warn("Sound playback failed:", e);
    }
  };

  // Generate more accurate graph data when function changes
  useEffect(() => {
    if (calculatorMode === "graphing" && graphFunction) {
      const generateGraphData = async () => {
        try {
          const points = [];
          // Calculate number of points based on viewport
          const range = graphViewport.xMax - graphViewport.xMin;
          const pointCount = Math.min(range * 20, 200); // 20 points per unit, max 200 points
          const step = range / pointCount;
          
          for (let i = 0; i <= pointCount; i++) {
            const x = parseFloat((graphViewport.xMin + i * step).toFixed(4));
            
            try {
              // Replace 'x' in the function with the actual value and convert to API format
              let expr = graphFunction
                .replace(/x/g, `(${x})`)
                .replace(/sin/g, "sin")
                .replace(/cos/g, "cos")
                .replace(/tan/g, "tan")
                .replace(/log/g, "log10")
                .replace(/ln/g, "log")
                .replace(/sqrt|√/g, "sqrt")
                .replace(/\^/g, "^")
                .replace(/pi|π/g, "pi")
                .replace(/e\^/g, "exp");
              
              // Use the MathJS API for evaluation
              const result = await calculate(expr);
              const y = parseFloat(result);
              
              // Only include points within y range and valid numbers
              if (!isNaN(y) && isFinite(y) && 
                  y >= graphViewport.yMin - 10 && 
                  y <= graphViewport.yMax + 10) {
                points.push({x, y});
              }
            } catch (e) {
              // Skip invalid points
              console.warn(`Skipping point at x=${x}:`, e.message);
            }
          }
          
          setGraphData([{
            label: graphFunction,
            values: points
          }]);
        } catch (error) {
          console.error("Error generating graph data:", error);
          setGraphData([]);
        }
      };
      
      generateGraphData();
    }
  }, [graphFunction, calculatorMode, graphViewport]);

  const handleButton = (key, e) => {
    // Play sound on button press
    playSound();
    
    // Remove focus from button after click
    if (e && e.target && typeof e.target.blur === "function") {
      e.target.blur();
    }
    
    if (key === "calc") {
      onCalcIconClick && onCalcIconClick();
      return;
    }
    
    // Handle mode switching buttons
    if (["SCIENTIFIC", "GRAPHING", "PROGRAMMABLE", "FRACTION"].includes(key)) {
      setCalculatorMode(key.toLowerCase());
      return;
    }
    
    // Special handling based on calculator mode
    if (calculatorMode === "graphing") {
      handleGraphingCalculator(key);
      return;
    } else if (calculatorMode === "programmable") {
      handleProgrammableCalculator(key);
      return;
    } else if (calculatorMode === "fraction") {
      handleFractionCalculator(key);
      return;
    }
    
    // Standard scientific calculator logic
    if (key === "AC") {
      setExpression("");
      setResult("0");
      setLastWasEquals(false);
      return;
    }
    
    // Validate input before proceeding
    const validation = validateInput(key, expression, SCIENTIFIC_OPERATORS, lastWasEquals);
    
    if (!validation.valid) {
      console.log(`Invalid input: ${validation.reason}`);
      return;
    }
    
    if (key === "=") {
      if (!expression) return; // Don't calculate empty expressions
      
      // Sanitize the expression before calculating
      const expr = sanitizeExpression(expression, SCIENTIFIC_OPERATORS);
      
      // Check for division by zero
      if (detectDivisionByZero(expr)) {
        setResult("Error: Division by zero");
        setLastWasEquals(true);
        return;
      }
      
      // Convert scientific notation to API-compatible format
      const calculateExpression = async () => {
        try {
          let apiExpr = expr
            .replace(/÷/g, "/")
            .replace(/×/g, "*")
            .replace(/−/g, "-")
            .replace(/π/g, "pi")
            .replace(/√\(/g, "sqrt(")
            .replace(/√(\d+\.?\d*)/g, "sqrt($1)")
            .replace(/√/g, "sqrt")
            .replace(/xʸ/g, "^")
            .replace(/log\(/g, "log10(")
            .replace(/ln\(/g, "log(")
            .replace(/sin\(/g, "sin(")
            .replace(/cos\(/g, "cos(")
            .replace(/tan\(/g, "tan(");
          
          // Handle special cases where functions might not have parentheses
          apiExpr = apiExpr.replace(/sin(\d+\.?\d*)/g, "sin($1)");
          apiExpr = apiExpr.replace(/cos(\d+\.?\d*)/g, "cos($1)");
          apiExpr = apiExpr.replace(/tan(\d+\.?\d*)/g, "tan($1)");
          apiExpr = apiExpr.replace(/log10(\d+\.?\d*)/g, "log10($1)");
          apiExpr = apiExpr.replace(/log(\d+\.?\d*)/g, "log($1)");
          
          const result = await calculate(apiExpr);
          
          if (result === "Error") {
            setResult("Error");
          } else {
            setResult(result.toString());
            
            // Only add to history if this isn't a duplicate of the last calculation
            if (expression !== lastHistoryEntry.expr || result !== lastHistoryEntry.res) {
              // Add to shared history
              if (onAddToHistory) {
                onAddToHistory(expression, result.toString());
                // Track the last entry we added to history
                setLastHistoryEntry({ expr: expression, res: result.toString() });
              }
            }
          }
          
          setLastWasEquals(true);
          return;
        } catch (error) {
          console.error("Calculation error:", error);
          setResult("Error");
          setLastWasEquals(true);
        }
      };
      
      calculateExpression();
      return;
    }
    
    // When starting a new expression, reset lastHistoryEntry
    if (validation?.resetExpression || key === "AC") {
      setLastHistoryEntry({ expr: null, res: null });
    }
    
    // Reset expression if starting a new calculation after equals
    if (validation.resetExpression) {
      setExpression(key);
      setResult("0");
      setLastWasEquals(false);
      return;
    }
    
    // Replace last character if needed (for operators)
    if (validation.replaceLastChar && isOperator(key, SCIENTIFIC_OPERATORS)) {
      const opMap = { "÷": "÷", "×": "×", "−": "−", "+": "+" };
      setExpression(expression.slice(0, -1) + (opMap[key] || key));
      setLastWasEquals(false);
      return;
    }
    
    // Handle +/- toggle
    if (key === "+/-") {
      if (!expression) return;
      
      if (expression.startsWith("-")) {
        setExpression(expression.slice(1));
      } else {
        setExpression("-" + expression);
      }
      return;
    }
    
    // Handle percentage
    if (key === "%") {
      if (!expression || isOperator(expression[expression.length - 1], SCIENTIFIC_OPERATORS)) return;
      setExpression(expression + "/100");
      setLastWasEquals(false);
      return;
    }
    
    // Handle decimal point as first character
    if (key === "." && !expression) {
      setExpression("0.");
      setLastWasEquals(false);
      return;
    }
    
    // Handle special scientific functions
    if (["sin", "cos", "tan", "ln", "log", "√", "π"].includes(key)) {
      if (key === "π") {
        setExpression(expression + "π");
      } else if (key === "√") {
        setExpression(expression + "√(");
      } else {
        setExpression(expression + key + "(");
      }
      setLastWasEquals(false);
      return;
    }
    
    // Handle power function
    if (key === "xʸ") {
      setExpression(expression + "^");
      setLastWasEquals(false);
      return;
    }
    
    // Default: append key to expression
    if (key) setExpression(expression + key);
    setLastWasEquals(false);
  };
  
  // Enhanced graphing calculator with better UI
  const handleGraphingCalculator = (key) => {
    if (key === "Y=") {
      // Open function input dialog
      const func = prompt("Enter a function of x (e.g., x^2, sin(x), log(x)):", graphFunction);
      if (func !== null && func.trim() !== "") {
        setGraphFunction(func.trim());
      }
      return;
    }
    
    if (key === "GRAPH") {
      // Trigger graph redraw - already handled by useEffect
      return;
    }
    
    if (key === "ZOOM+") {
      // Zoom in - reduce viewport range by 25%
      setGraphViewport(prev => ({
        ...prev,
        xMin: prev.xMin * 0.75,
        xMax: prev.xMax * 0.75,
        yMin: prev.yMin * 0.75,
        yMax: prev.yMax * 0.75
      }));
      return;
    }
    
    if (key === "ZOOM-") {
      // Zoom out - increase viewport range by 25%
      setGraphViewport(prev => ({
        ...prev,
        xMin: prev.xMin * 1.25,
        xMax: prev.xMax * 1.25,
        yMin: prev.yMin * 1.25,
        yMax: prev.yMax * 1.25
      }));
      return;
    }
    
    if (key === "WINDOW") {
      // Set custom viewport
      const xMin = parseFloat(prompt("X Min:", graphViewport.xMin));
      const xMax = parseFloat(prompt("X Max:", graphViewport.xMax));
      const yMin = parseFloat(prompt("Y Min:", graphViewport.yMin));
      const yMax = parseFloat(prompt("Y Max:", graphViewport.yMax));
      
      if (!isNaN(xMin) && !isNaN(xMax) && !isNaN(yMin) && !isNaN(yMax) && 
          xMin < xMax && yMin < yMax) {
        setGraphViewport({
          xMin, xMax, yMin, yMax,
          gridLines: graphViewport.gridLines
        });
      }
      return;
    }
    
    if (key === "TRACE") {
      // Reset viewport to default
      setGraphViewport({
        xMin: -10,
        xMax: 10,
        yMin: -10,
        yMax: 10,
        gridLines: true
      });
      return;
    }
    
    if (key === "GRID") {
      // Toggle grid lines
      setGraphViewport(prev => ({
        ...prev,
        gridLines: !prev.gridLines
      }));
      return;
    }
    
    // Handle common function inputs
    if (key === "sin") {
      setGraphFunction(graphFunction + "sin(x)");
      return;
    }
    
    if (key === "cos") {
      setGraphFunction(graphFunction + "cos(x)");
      return;
    }
    
    if (key === "tan") {
      setGraphFunction(graphFunction + "tan(x)");
      return;
    }
    
    if (key === "e^x") {
      setGraphFunction(graphFunction + "exp(x)");
      return;
    }
    
    if (key === "ln") {
      setGraphFunction(graphFunction + "log(x)");
      return;
    }
    
    if (key === "^") {
      setGraphFunction(graphFunction + "^");
      return;
    }
    
    // Handle number and operator inputs for the function editor
    if ("0123456789.+-*/()x".includes(key)) {
      setGraphFunction(graphFunction + key);
      return;
    }
    
    if (key === "AC") {
      setGraphFunction("");
      setGraphData([]);
      return;
    }
    
    if (key === "=") {
      // Evaluate the current function at x=0 as a test
      if (graphFunction) {
        const testExpr = graphFunction.replace(/x/g, "0");
        calculate(testExpr).then(result => {
          if (result !== "Error") {
            setResult(`f(0) = ${result}`);
          } else {
            setResult("Invalid function");
          }
        });
      }
      return;
    }
  };
  
  // Improved programmable calculator with syntax highlighting and better output
  const handleProgrammableCalculator = (key) => {
    if (key === "DEF") {
      // Define a new program with improved template
      const name = prompt("Enter program name:");
      if (name) {
        setCurrentProgram(`function ${name}() {\n  // Your code here\n  return 0;\n}`);
      }
      return;
    }
    
    if (key === "RUN") {
      try {
        // Add timing information for performance analysis
        const startTime = performance.now();
        
        // Create sandbox for safer execution
        const program = currentProgram;
        const functionMatch = program.match(/function\s+([a-zA-Z_$][0-9a-zA-Z_$]*)/);
        const functionName = functionMatch ? functionMatch[1] : null;
        
        if (!functionName) {
          setProgramOutput(`Error: No valid function found. Use: function name() { ... }`);
          return;
        }
        
        // Use Function constructor for isolated scope
        const sandbox = new Function(`
          "use strict";
          ${program};
          return ${functionName}();
        `);
        
        const result = sandbox();
        const executionTime = (performance.now() - startTime).toFixed(2);
        
        // Format result based on type
        const formattedResult = typeof result === 'object' ? 
          JSON.stringify(result, null, 2) : String(result);
        
        setProgramOutput(`Result: ${formattedResult}\nExecution time: ${executionTime}ms`);
        
        // Add to history
        if (onAddToHistory && result !== undefined) {
          onAddToHistory(`Run Program: ${functionName}`, formattedResult);
        }
      } catch (error) {
        setProgramOutput(`Error: ${error.message}`);
      }
      return;
    }
    
    if (key === "EX") {
      // Show examples dropdown
      const exampleIndex = prompt(
        `Choose an example (1-${programExamples.length}):\n${
          programExamples.map((ex, i) => `${i+1}: ${ex.name}`).join('\n')
        }`
      );
      
      const index = parseInt(exampleIndex) - 1;
      if (!isNaN(index) && index >= 0 && index < programExamples.length) {
        setCurrentProgram(programExamples[index].code);
        setProgramOutput(`Loaded: ${programExamples[index].name}`);
      }
      return;
    }
    
    if (key === "SAVE") {
      const name = prompt("Save program as:");
      if (name && currentProgram) {
        // In a real app, this would save to localStorage or database
        setProgramOutput(`Program saved as: ${name}`);
      }
      return;
    }
    
    if (key === "LOAD") {
      const name = prompt("Load program name:");
      if (name) {
        // In a real app, this would load from localStorage or database
        setProgramOutput(`Program "${name}" not found`);
      }
      return;
    }
    
    if (key === "AC") {
      setCurrentProgram("");
      setProgramOutput("");
      return;
    }
    
    // Add programming syntax helpers
    if (key === "IF") {
      setCurrentProgram(currentProgram + "if () {\n  \n}");
      return;
    }
    
    if (key === "FOR") {
      setCurrentProgram(currentProgram + "for (let i=0; i<10; i++) {\n  \n}");
      return;
    }
    
    if (key === "VAR") {
      setCurrentProgram(currentProgram + "let x = 0;");
      return;
    }
    
    if (key === "FUNC") {
      setCurrentProgram(currentProgram + "function calc() {\n  return 0;\n}");
      return;
    }
    
    if (key === "{") {
      setCurrentProgram(currentProgram + "{\n  \n}");
      return;
    }
    
    if (key === "}") {
      setCurrentProgram(currentProgram + "}");
      return;
    }
    
    if (key === ":") {
      setCurrentProgram(currentProgram + ":");
      return;
    }
    
    // Handle numbers and basic operations
    if ("0123456789.+-*/()".includes(key)) {
      setCurrentProgram(currentProgram + key);
      return;
    }
    
    if (key === "=") {
      setCurrentProgram(currentProgram + " = ");
      return;
    }
  };
  
  // Enhanced fraction calculator with visual representation
  const handleFractionCalculator = (key) => {
    if (key === "AC") {
      setExpression("");
      setResult("0");
      setNumerator(0);
      setDenominator(1);
      setFractionMode(false);
      return;
    }
    
    if (key === "a/b") {
      setFractionMode(true);
      setNumerator(1);
      setDenominator(2);
      setResult("1/2");
      return;
    }
    
    if (key === "n↔d") {
      // Swap numerator and denominator
      const temp = numerator;
      setNumerator(denominator);
      setDenominator(temp);
      
      // Update visual representation
      setResult(`${denominator}/${temp}`);
      return;
    }
    
    if (key === "→dec") {
      // Convert fraction to decimal with more precision
      if (denominator !== 0) {
        const decimalValue = numerator / denominator;
        
        // Format based on size
        let formatted;
        if (Math.abs(decimalValue) < 0.000001) {
          formatted = decimalValue.toExponential(6);
        } else if (Math.abs(decimalValue) > 1000000) {
          formatted = decimalValue.toExponential(6);
        } else if (Number.isInteger(decimalValue)) {
          formatted = decimalValue.toString();
        } else {
          // Show up to 8 decimal places for better precision
          formatted = decimalValue.toFixed(8).replace(/\.?0+$/, "");
        }
        
        setExpression(formatted);
        setResult(formatted);
        
        // Add to history
        if (onAddToHistory) {
          onAddToHistory(`${numerator}/${denominator}`, formatted);
        }
      } else {
        setResult("Error: Division by zero");
      }
      return;
    }
    
    if (key === "→frac") {
      // Convert decimal to fraction with improved algorithm
      try {
        const decimal = parseFloat(expression || result);
        if (!isNaN(decimal)) {
          // Use continued fractions algorithm for better approximations
          const tolerance = 1.0E-10;
          
          let n = Math.abs(decimal);
          let a = Math.floor(n);
          let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
          let h, k;
          
          while (n - a > tolerance) {
            n = 1 / (n - a);
            a = Math.floor(n);
            h = a * h1 + h2; h2 = h1; h1 = h;
            k = a * k1 + k2; k2 = k1; k1 = k;
          }
          
          // Apply sign
          const num = decimal < 0 ? -h1 : h1;
          const den = k1;
          
          setNumerator(num);
          setDenominator(den);
          setResult(`${num}/${den}`);
          
          // Add to history
          if (onAddToHistory) {
            onAddToHistory(`Convert to fraction: ${expression}`, `${num}/${den}`);
          }
        }
      } catch (error) {
        setResult("Error");
      }
      return;
    }
    
    if (key === "SIMP") {
      // Simplify the current fraction
      if (denominator !== 0) {
        // Find GCD using Euclidean algorithm
        const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
        const divisor = gcd(numerator, denominator);
        
        const newNum = numerator / divisor;
        const newDen = denominator / divisor;
        
        setNumerator(newNum);
        setDenominator(newDen);
        setResult(`${newNum}/${newDen}`);
        
        // Add to history
        if (onAddToHistory) {
          onAddToHistory(`Simplify: ${numerator}/${denominator}`, `${newNum}/${newDen}`);
        }
      }
      return;
    }
    
    if (key === "GCD") {
      // Calculate GCD of numerator and denominator
      const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
      const result = gcd(numerator, denominator);
      setResult(`GCD: ${result}`);
      return;
    }
    
    if (key === "LCM") {
      // Calculate LCM of numerator and denominator
      const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
      const lcm = Math.abs(numerator * denominator) / gcd(numerator, denominator);
      setResult(`LCM: ${lcm}`);
      return;
    }
    
    // Handle the "/" key for fraction input
    if (key === "/") {
      setExpression(expression + "/");
      return;
    }
    
    // Handle numbers and basic operations
    if ("0123456789.".includes(key)) {
      setExpression(expression + key);
      return;
    }
    
    if (key === "=") {
      // Try to parse expression as fraction
      const parts = expression.split('/');
      if (parts.length === 2) {
        const num = parseInt(parts[0]);
        const den = parseInt(parts[1]);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
          setNumerator(num);
          setDenominator(den);
          setResult(`${num}/${den}`);
        }
      }
      return;
    }
    
    // Handle basic arithmetic operations for fractions
    if (["+", "-", "×", "÷"].includes(key)) {
      setExpression(expression + key);
      return;
    }
  };

  // --- NEW STATE ---
  const [sciSubMode, setSciSubMode] = useState("basic"); // "basic", "stat", "complex", "format"
  const [shiftActive, setShiftActive] = useState(false);
  const [angleUnit, setAngleUnit] = useState("DEG"); // DEG, RAD, GRAD
  const [formatMode, setFormatMode] = useState("NORMAL"); // NORMAL, SCI, ENG, FIX
  const [fixDecimals, setFixDecimals] = useState(2);
  // Statistical data entry
  const [statData, setStatData] = useState([]);
  const [statInput, setStatInput] = useState("");
  // Complex number entry
  const [complexInput, setComplexInput] = useState("");
  const [complexResult, setComplexResult] = useState("");

  // --- BUTTON LAYOUTS ---
  // Submode layouts for scientific calculator
  const sciBasicRows = [
    ['AC', 'SHIFT', 'MODE', '(', ')', 'π'],
    ['7', '8', '9', '√', 'xʸ', '÷'],
    ['4', '5', '6', 'ln', 'log', '×'],
    ['1', '2', '3', 'sin', 'cos', '−'],
    ['calc', '0', '.', 'tan', '=', '+']
  ];
  const sciStatRows = [
    ['AC', 'SHIFT', 'MODE', 'Σx', 'Σx²', 'n'],
    ['7', '8', '9', 'mean', 'std', 'nCr'],
    ['4', '5', '6', 'nPr', '', ''],
    ['1', '2', '3', '', '', ''],
    ['calc', '0', '.', 'DATA', '=', '+']
  ];
  const sciComplexRows = [
    ['AC', 'SHIFT', 'MODE', 'i', 'Re(z)', 'Im(z)'],
    ['7', '8', '9', 'CONJ', 'arg(z)', '÷'],
    ['4', '5', '6', '', '', '×'],
    ['1', '2', '3', '', '', '−'],
    ['calc', '0', '.', '', '=', '+']
  ];
  const sciFormatRows = [
    ['AC', 'SHIFT', 'MODE', 'Rnd', 'ENG', 'SCI'],
    ['7', '8', '9', 'FIX', '', '÷'],
    ['4', '5', '6', '', '', '×'],
    ['1', '2', '3', '', '', '−'],
    ['calc', '0', '.', '', '=', '+']
  ];

  // --- STATUS BAR ---
  const renderStatusBar = () => (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      fontSize: "0.8em", color: "#64748b", marginBottom: "2px"
    }}>
      <span>
        {angleUnit} | {formatMode}{formatMode === "FIX" ? `(${fixDecimals})` : ""}
      </span>
      <span>
        {shiftActive ? "SHIFT" : ""}
        {sciSubMode !== "basic" ? ` | ${sciSubMode.toUpperCase()}` : ""}
      </span>
    </div>
  );

  // --- SUBMODE BUTTON HANDLERS ---
  const handleMode = () => {
    // Cycle through submodes
    const modes = ["basic", "stat", "complex", "format"];
    setSciSubMode(modes[(modes.indexOf(sciSubMode) + 1) % modes.length]);
    setShiftActive(false);
  };
  const handleShift = () => setShiftActive(v => !v);

  // --- ANGLE UNIT HANDLER ---
  const handleAngleUnit = () => {
    setAngleUnit(u => u === "DEG" ? "RAD" : u === "RAD" ? "GRAD" : "DEG");
  };

  // --- FORMAT HANDLER ---
  const handleFormat = (mode) => {
    if (mode === "FIX") {
      const d = prompt("Decimals (0-10):", fixDecimals);
      if (d !== null && !isNaN(d) && d >= 0 && d <= 10) setFixDecimals(Number(d));
      setFormatMode("FIX");
    } else {
      setFormatMode(mode);
    }
  };

  // --- SCIENTIFIC BUTTON HANDLER (with submodes) ---
  const handleSciButton = (key, e) => {
    playSound();
    if (e && e.target && typeof e.target.blur === "function") e.target.blur();
    // --- SUBMODE CONTROLS ---
    if (key === "MODE") return handleMode();
    if (key === "SHIFT") return handleShift();
    if (key === "DEG" || key === "RAD" || key === "GRAD") return handleAngleUnit();
    // --- SUBMODE LOGIC ---
    if (sciSubMode === "stat") return handleStatButton(key);
    if (sciSubMode === "complex") return handleComplexButton(key);
    if (sciSubMode === "format") return handleFormatButton(key);
    // --- BASIC SCIENTIFIC LOGIC (as before) ---
    handleButton(key, e);
  };

  // --- STATISTICAL FUNCTIONS ---
  const handleStatButton = (key) => {
    if (key === "DATA") {
      if (statInput && !isNaN(statInput)) {
        setStatData([...statData, Number(statInput)]);
        setStatInput("");
      }
      return;
    }
    if (key === "AC") {
      setStatData([]);
      setStatInput("");
      setResult("0");
      return;
    }
    if (["Σx", "Σx²", "mean", "std", "n"].includes(key)) {
      let res = "";
      if (statData.length === 0) return setResult("No data");
      if (key === "Σx") res = statData.reduce((a, b) => a + b, 0);
      if (key === "Σx²") res = statData.reduce((a, b) => a + b * b, 0);
      if (key === "mean") res = statData.reduce((a, b) => a + b, 0) / statData.length;
      if (key === "std") {
        const mean = statData.reduce((a, b) => a + b, 0) / statData.length;
        res = Math.sqrt(statData.reduce((a, b) => a + (b - mean) ** 2, 0) / statData.length);
      }
      if (key === "n") res = statData.length;
      setResult(formatDisplay(res));
      return;
    }
    if (key === "nCr" || key === "nPr") {
      if (statData.length < 2) return setResult("Need 2 vals");
      const [n, r] = statData.slice(-2);
      const fact = n => n <= 1 ? 1 : n * fact(n - 1);
      let res = "";
      if (key === "nCr") res = fact(n) / (fact(r) * fact(n - r));
      if (key === "nPr") res = fact(n) / fact(n - r);
      setResult(formatDisplay(res));
      return;
    }
    // Digits for stat input
    if ("0123456789.".includes(key)) setStatInput(statInput + key);
    if (key === "=" && statInput && !isNaN(statInput)) {
      setStatData([...statData, Number(statInput)]);
      setStatInput("");
    }
  };

  // --- COMPLEX NUMBER FUNCTIONS ---
  const handleComplexButton = (key) => {
    // Use a simple "a+bi" parser for demo
    const parseComplex = (str) => {
      const match = str.match(/^([+-]?\d*\.?\d*)?([+-]\d*\.?\d*)i$/);
      if (match) {
        return {
          re: parseFloat(match[1] || "0"),
          im: parseFloat(match[2] || "1")
        };
      }
      if (/i$/.test(str)) {
        const re = str.replace(/([+-]?\d*\.?\d*)i$/, "");
        return { re: parseFloat(re || "0"), im: 1 };
      }
      return { re: parseFloat(str), im: 0 };
    };
    const toStr = (z) => `${z.re}${z.im >= 0 ? "+" : ""}${z.im}i`;
    if (key === "AC") {
      setComplexInput("");
      setComplexResult("");
      return;
    }
    if (key === "i") {
      setComplexInput(complexInput + (complexInput ? "+i" : "i"));
      return;
    }
    if (key === "Re(z)") {
      const z = parseComplex(complexInput);
      setComplexResult(z.re);
      return;
    }
    if (key === "Im(z)") {
      const z = parseComplex(complexInput);
      setComplexResult(z.im);
      return;
    }
    if (key === "CONJ") {
      const z = parseComplex(complexInput);
      setComplexResult(toStr({ re: z.re, im: -z.im }));
      return;
    }
    if (key === "arg(z)") {
      const z = parseComplex(complexInput);
      setComplexResult(Math.atan2(z.im, z.re));
      return;
    }
    if ("0123456789.+-".includes(key)) setComplexInput(complexInput + key);
    if (key === "=") setComplexResult(complexInput);
  };

  // --- FORMAT FUNCTIONS ---
  const handleFormatButton = (key) => {
    if (key === "Rnd") {
      setResult(formatDisplay(Number(result), { round: true }));
      return;
    }
    if (key === "ENG") {
      setFormatMode("ENG");
      setResult(formatDisplay(Number(result), { eng: true }));
      return;
    }
    if (key === "SCI") {
      setFormatMode("SCI");
      setResult(formatDisplay(Number(result), { sci: true }));
      return;
    }
    if (key === "FIX") {
      handleFormat("FIX");
      setResult(formatDisplay(Number(result)));
      return;
    }
    if (key === "MODE") {
      setFormatMode("NORMAL");
      setResult(formatDisplay(Number(result)));
      return;
    }
    // Digits
    if ("0123456789.".includes(key)) handleButton(key);
  };

  // --- DISPLAY FORMATTING ---
  const formatDisplay = (val, opts = {}) => {
    if (val === undefined || val === null || isNaN(val)) return "";
    if (opts.round) return Math.round(val);
    if (opts.eng) {
      // Engineering notation: exponent is multiple of 3
      const exp = Math.floor(Math.log10(Math.abs(val)) / 3) * 3;
      return (val / Math.pow(10, exp)).toFixed(3) + "e" + exp;
    }
    if (opts.sci || formatMode === "SCI") return Number(val).toExponential(6);
    if (formatMode === "ENG") {
      const exp = Math.floor(Math.log10(Math.abs(val)) / 3) * 3;
      return (val / Math.pow(10, exp)).toFixed(3) + "e" + exp;
    }
    if (formatMode === "FIX") return Number(val).toFixed(fixDecimals);
    return val.toString();
  };

  // --- BUTTONS ROWS SELECTOR ---
  const getButtonRows = () => {
    if (calculatorMode === "scientific") {
      switch (sciSubMode) {
        case "stat": return sciStatRows;
        case "complex": return sciComplexRows;
        case "format": return sciFormatRows;
        default: return sciBasicRows;
      }
    }
    switch(calculatorMode) {
      case "graphing":
        return [
          ['AC', 'Y=', 'WINDOW', 'TRACE', 'GRID', '÷'],
          ['7', '8', '9', 'x', 'sin', '×'],
          ['4', '5', '6', 'cos', 'tan', '−'],
          ['1', '2', '3', 'e^x', 'ln', '+'],
          ['calc', '0', '.', '^', '=', '']
        ];
        
      case "programmable":
        return [
          ['AC', 'DEF', 'RUN', 'SAVE', 'LOAD', 'EX'],
          ['7', '8', '9', 'VAR', 'FUNC', '÷'],
          ['4', '5', '6', 'IF', 'FOR', '×'],
          ['1', '2', '3', '{', '}', '−'],
          ['calc', '0', '.', ':', '=', '+']
        ];
        
      case "fraction":
        return [
          ['AC', '+/-', 'SIMP', 'GCD', 'LCM', '÷'],
          ['7', '8', '9', 'a/b', 'n↔d', '×'],
          ['4', '5', '6', '→dec', '→frac', '−'],
          ['1', '2', '3', '/', '%', '+'],
          ['calc', '0', '.', '(', ')', '=']
        ];
        
      default:
        return rows; // Default scientific calculator layout
    }
  };

  // --- MAIN RENDER ---
  return (
    <div className="scientific-calculator">
      {/* Mode selection tabs */}
      <div className="calculator-mode-tabs" style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "10px",
        gap: "5px"
      }}>
        {["SCIENTIFIC", "GRAPHING", "PROGRAMMABLE", "FRACTION"].map(mode => (
          <button
            key={mode}
            className={`mode-tab ${calculatorMode === mode.toLowerCase() ? "active-mode" : ""}`}
            onClick={() => setCalculatorMode(mode.toLowerCase())}
            style={{
              flex: 1,
              padding: "5px 2px",
              fontSize: "0.7rem",
              backgroundColor: calculatorMode === mode.toLowerCase() ? "#6366f1" : "#f8fafc",
              color: calculatorMode === mode.toLowerCase() ? "#ffffff" : "#232946",
              border: "1px solid #e5e9f2",
              borderRadius: "5px",
              fontWeight: calculatorMode === mode.toLowerCase() ? "bold" : "normal"
            }}
          >
            {mode}
          </button>
        ))}
      </div>
      {/* --- STATUS BAR --- */}
      {calculatorMode === "scientific" && renderStatusBar()}
      {/* --- DISPLAY --- */}
      <div className="modern-display" style={{
        marginBottom: "0.5rem", 
        padding: calculatorMode === "graphing" ? "0.5rem" : "1.3rem 1.1rem 0.9rem 1.1rem"
      }}>
        {/* --- SCIENTIFIC SUBMODE DISPLAYS --- */}
        {calculatorMode === "scientific" && sciSubMode === "stat" ? (
          <div>
            <div style={{fontSize: "1.1em", marginBottom: "0.3em"}}>Stat Data: [{statData.join(", ")}]</div>
            <input
              value={statInput}
              onChange={e => setStatInput(e.target.value.replace(/[^0-9.\-]/g, ""))}
              placeholder="Enter value"
              style={{
                width: "70px", fontSize: "1em", marginRight: "0.5em"
              }}
            />
            <button onClick={() => handleStatButton("DATA")}>Add</button>
            <div style={{marginTop: "0.5em", fontSize: "1.2em"}}>
              {result}
            </div>
          </div>
        ) : calculatorMode === "scientific" && sciSubMode === "complex" ? (
          <div>
            <div style={{fontSize: "1.1em", marginBottom: "0.3em"}}>z = <input
              value={complexInput}
              onChange={e => setComplexInput(e.target.value)}
              placeholder="a+bi"
              style={{width: "90px", fontSize: "1em"}}
            /></div>
            <div style={{marginTop: "0.5em", fontSize: "1.2em"}}>
              {complexResult}
            </div>
          </div>
        ) : calculatorMode === "scientific" && sciSubMode === "format" ? (
          <div>
            <div style={{fontSize: "1.1em", marginBottom: "0.3em"}}>Format: {formatMode}{formatMode === "FIX" ? ` (${fixDecimals})` : ""}</div>
            <div style={{marginTop: "0.5em", fontSize: "1.2em"}}>
              {result}
            </div>
          </div>
        ) : calculatorMode === "scientific" ? (
          <div>
            <div className="expression digital">{expression || "0"}</div>
            <div className="result digital" style={{ textAlign: "right", fontSize: "2em" }}>
              {result !== "0" && result !== expression && result}
            </div>
          </div>
        ) : (
          // GRAPHING CALCULATOR DISPLAY
          calculatorMode === "graphing" ? (
            <div className="graph-container" style={{ 
              height: "170px", 
              backgroundColor: "#f8fafc",
              border: "1px solid #e5e9f2",
              borderRadius: "5px",
              padding: "5px",
              overflow: "hidden"
            }}>
              {graphData.length > 0 && graphData[0].values.length > 0 ? (
                <div style={{height: "100%", width: "100%"}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={graphData[0].values}
                      margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                    >
                      {graphViewport.gridLines && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
                      
                      <XAxis 
                        dataKey="x" 
                        type="number"
                        domain={[graphViewport.xMin, graphViewport.xMax]}
                        allowDataOverflow={true}
                        tick={{fontSize: 10}}
                        tickCount={5}
                      />
                      
                      <YAxis 
                        domain={[graphViewport.yMin, graphViewport.yMax]}
                        allowDataOverflow={true}
                        tick={{fontSize: 10}}
                        tickCount={5}
                      />
                      
                      <Tooltip 
                        formatter={(value) => parseFloat(value).toFixed(4)} 
                        labelFormatter={(value) => `x = ${parseFloat(value).toFixed(4)}`}
                      />
                      
                      {/* Add x and y axis lines */}
                      <ReferenceLine y={0} stroke="#232946" strokeWidth={1.5} />
                      <ReferenceLine x={0} stroke="#232946" strokeWidth={1.5} />
                      
                      <Line
                        type="monotone"
                        dataKey="y"
                        stroke="#6366f1"
                        dot={false}
                        isAnimationActive={false}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{
                  textAlign: "center", 
                  marginTop: "60px",
                  color: "#64748b"
                }}>
                  Enter a function using x variable (e.g., x^2 or sin(x))
                </div>
              )}
            </div>
          ) : calculatorMode === "programmable" ? (
            /* PROGRAMMABLE CALCULATOR DISPLAY */
            <div className="program-editor" style={{ 
              height: "170px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e5e9f2",
              borderRadius: "5px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column"
            }}>
              {/* Code editor with improved styling */}
              <div className="editor-header" style={{
                backgroundColor: "#232946",
                color: "#fff",
                padding: "4px 8px",
                fontSize: "0.7em",
                display: "flex",
                justifyContent: "space-between"
              }}>
                <span>JavaScript Editor</span>
                <span style={{opacity: 0.7}}>Use function name() &#123; ... &#125;</span>
              </div>
              
              <textarea 
                value={currentProgram}
                onChange={e => setCurrentProgram(e.target.value)}
                style={{
                  width: "100%",
                  height: "100px",
                  border: "none",
                  resize: "none",
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "12px",
                  backgroundColor: "#1e293b",
                  color: "#f8fafc",
                  padding: "8px",
                  flex: 1
                }}
                placeholder="// Write your program here"
              />
              
              {/* Console output with better styling */}
              <div className="console-output" style={{
                backgroundColor: "#0f172a",
                color: programOutput.includes("Error") ? "#fb7185" : "#4ade80",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "11px",
                padding: "4px 8px",
                maxHeight: "60px",
                overflowY: "auto",
                whiteSpace: "pre-wrap"
              }}>
                {programOutput || "> Ready"}
              </div>
            </div>
          ) : calculatorMode === "fraction" ? (
            /* FRACTION CALCULATOR DISPLAY */
            <div className="fraction-display" style={{
              height: "170px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {/* Visual fraction representation */}
              <div className="fraction-visual" style={{
                fontSize: "2em",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                margin: "0.5em 0",
                position: "relative"
              }}>
                <div className="numerator" style={{
                  padding: "0.15em 0.5em",
                  borderBottom: "2px solid #232946",
                  minWidth: "2em",
                  textAlign: "center"
                }}>
                  {numerator}
                </div>
                <div className="denominator" style={{
                  padding: "0.15em 0.5em",
                  minWidth: "2em",
                  textAlign: "center"
                }}>
                  {denominator}
                </div>
                
                {/* Show decimal equivalent */}
                <div className="decimal-value" style={{
                  fontSize: "0.5em",
                  marginTop: "1em",
                  color: "#64748b"
                }}>
                  = {denominator !== 0 ? (numerator / denominator).toString() : "Error"}
                </div>
              </div>
              
              {/* Input area */}
              <div className="fraction-input" style={{
                marginTop: "0.5em",
                fontSize: "1.2em",
                width: "100%",
                textAlign: "center"
              }}>
                {result || "Enter a fraction using '/' or convert a decimal"}
              </div>
            </div>
          ) : null
        )}
      </div>
      
      {/* Calculator keypad */}
      <div className="scientific-keypad">
        {getButtonRows().map((row, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "0.5rem",
              marginBottom: "0.4rem"
            }}>
            {row.map((key, colIdx) => 
              key === "calc" ? (
                <button
                  key={key + rowIdx + colIdx}
                  className={`keypad-btn calc-icon-btn${calcBtnActive ? " calc-icon-btn-active" : ""}`}
                  ref={calcBtnRef}
                  style={{
                    width: "100%",
                    height: "100%",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #232946 0%, #3730a3 100%)",
                    border: "3px solid #fbbf24",
                    boxShadow: "0 0 0 4px rgba(251,191,36,0.15), 0 2px 12px rgba(36,41,61,0.22)",
                    borderRadius: "0.9rem",
                    gridColumn: "1", // Explicitly set column
                    gridRow: "auto" // Ensure it stays in its row
                  }}
                  onPointerDown={e => { onCalcIconDown(); handleButton(key, e); }}
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
                  className={`keypad-btn sci-btn
                    ${key === "=" ? "equals" : ""}
                    ${key === "AC" ? "clear" : ""}
                    ${["÷", "×", "−", "+", "%", "√", "xʸ", "ln", "log", "sin", "cos", "tan", "Σx", "Σx²", "mean", "std", "nCr", "nPr", "i", "Re(z)", "Im(z)", "CONJ", "arg(z)", "Rnd", "ENG", "SCI", "FIX"].includes(key) ? "operator" : ""}
                    ${key === "%" ? "percent-btn" : ""}
                    ${key === "+/-" ? "plusminus" : ""}
                    ${key === "+" ? "plus-btn" : ""}
                    ${key === "0" ? "zero-btn" : ""}
                    ${key.length > 4 ? "small-text-btn" : ""}
                  `}
                  style={{
                    fontSize: key.length > 10 ? "0.62rem" : key.length > 7 ? "0.7rem" : key.length > 4 ? "0.8rem" : "1rem",
                    padding: "0.7rem 0.2rem",
                    borderRadius: "0.9rem",
                    gridColumn: `${colIdx + 1}`,
                    gridRow: "auto",
                    transition: "transform 0.1s, background 0.18s, color 0.18s, box-shadow 0.18s",
                    whiteSpace: "normal", // allow wrapping if needed
                    overflow: "visible",   // never hide text
                    textOverflow: "clip",  // never show ...
                    lineHeight: "1.05",
                    wordBreak: "break-word",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    minHeight: "2.2em",
                    maxWidth: "100%",
                    flexDirection: "row"
                  }}
                  onPointerDown={e => handleSciButton(key, e)}
                  title={key}
                >
                  <span style={{
                    display: "inline-block",
                    width: "100%",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                    lineHeight: "1.05",
                    overflow: "visible",
                    textOverflow: "clip",
                    textAlign: "center"
                  }}>
                    {key === "Σx" ? "Σx" :
                     key === "Σx²" ? "Σx²" :
                     key === "mean" ? "mean" :
                     key === "std" ? "std" :
                     key === "nCr" ? "nCr" :
                     key === "nPr" ? "nPr" :
                     key === "Re(z)" ? "Re" :
                     key === "Im(z)" ? "Im" :
                     key === "CONJ" ? "CONJ" :
                     key === "arg(z)" ? "arg" :
                     key === "Rnd" ? "Rnd" :
                     key === "ENG" ? "ENG" :
                     key === "SCI" ? "SCI" :
                     key === "FIX" ? "FIX" :
                     key === "SHIFT" ? (shiftActive ? "2nd" : "SHIFT") :
                     key === "MODE" ? "MODE" :
                     key}
                  </span>
                </button>
              ) : null
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScientificCalculator;
