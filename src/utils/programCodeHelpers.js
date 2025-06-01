/**
 * Helper functions for the programmable calculator
 */

// Code templates for the programmer mode
export const codeTemplates = {
  empty: "// Write your code here\nfunction calculate() {\n  return 0;\n}",
  calculator: `// Simple calculator function
function calculate() {
  const a = 12;
  const b = 7;
  
  // Basic operations
  const sum = a + b;
  const difference = a - b;
  const product = a * b;
  const quotient = a / b;
  
  return {
    sum,
    difference,
    product,
    quotient
  };
}`,
  factorial: `// Calculate factorial of a number
function calculate() {
  const num = 5;
  let factorial = 1;
  
  for (let i = 2; i <= num; i++) {
    factorial *= i;
  }
  
  return \`\${num}! = \${factorial}\`;
}`,
  fibonacci: `// Generate Fibonacci sequence
function calculate() {
  const count = 10;
  const sequence = [0, 1];
  
  for (let i = 2; i < count; i++) {
    sequence.push(sequence[i-1] + sequence[i-2]);
  }
  
  return sequence;
}`,
  prime: `// Check if a number is prime
function calculate() {
  const num = 17;
  
  if (num <= 1) return false;
  if (num <= 3) return true;
  
  if (num % 2 === 0 || num % 3 === 0) return false;
  
  let i = 5;
  while (i * i <= num) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
    i += 6;
  }
  
  return \`\${num} is prime\`;
}`,
  statistics: `// Calculate statistics on an array
function calculate() {
  const data = [5, 10, 15, 20, 25];
  
  // Calculate mean
  const sum = data.reduce((acc, val) => acc + val, 0);
  const mean = sum / data.length;
  
  // Calculate standard deviation
  const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    data,
    mean,
    stdDev
  };
}`
};


// Safely validate JavaScript syntax
export const validateJavaScript = (code) => {
  try {
    new Function(code);
    return { valid: true };
  } catch (error) {
    // Extract line number from error message
    const lineMatch = error.message.match(/line\\s+(\\d+)/i);
    const line = lineMatch ? parseInt(lineMatch[1]) : null;
    return {
      valid: false,
      error: error.message,
      line
    };
  }
};


// Safely evaluate code with protection against infinite loops and malicious code
export const safeEval = (code) => {
  try {
    // Remove potentially harmful operations
    const sanitizedCode = code
      .replace(/process|require|module|window\\s*\\.\\s*location|document|eval|Function|setTimeout|setInterval|fetch|XMLHttpRequest/g, 'BLOCKED')
      .replace(/while\\s*\\(.*true.*\\)/g, 'BLOCKED_LOOP')
      .replace(/for\\s*\\([^;]*;[^;]*;[^)]*\\)\\s*\\{\\s*\\}/g, 'BLOCKED_LOOP');
    
    // Add the calculate function to extract its results
    const executeCode = `
      "use strict";
      ${sanitizedCode};
      try {
        if (typeof calculate === 'function') {
          return calculate();
        } else {
          return "No calculate() function found";
        }
      } catch(e) {
        return "Error: " + e.message;
      }
    `;
    
    // Execute in a controlled environment
    const result = Function(executeCode)();
    
    return {
      success: true,
      result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};


// Highlight syntax for code display
export const highlightSyntax = (code) => {
  if (!code) return '';
  
  // This is a simple syntax highlighter
  return code
    .replace(/\\b(function|return|if|else|for|while|let|const|var)\\b/g, '<span class="syntax-keyword">$1</span>')
    .replace(/"([^"]*)"/g, '<span class="syntax-string">"$1"</span>')
    .replace(/'([^']*)'/g, '<span class="syntax-string">\'$1\'</span>')
    .replace(/\/\/(.*)/g, '<span class="syntax-comment">//$1</span>')
    .replace(/\\b(\\d+)\\b/g, '<span class="syntax-number">$1</span>');
};


// Format code output with special handling for objects
export const formatOutput = (result) => {
  if (result === undefined) return 'undefined';
  if (result === null) return 'null';
  
  if (typeof result === 'object') {
    try {
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return String(result);
    }
  }
  
  return String(result);
};


// Add line numbers to code for display
export const addLineNumbers = (code) => {
  if (!code) return '';
  
  const lines = code.split('\\n');
  const paddingSize = lines.length.toString().length;
  
  return lines.map((line, i) => {
    const lineNum = (i + 1).toString().padStart(paddingSize, ' ');
    return `${lineNum}: ${line}`;
  }).join('\n');
};


// Insert a tab character when tab key is pressed in the editor
export const handleTabKey = (e, code) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    
    // Insert 2 spaces for tab
    const updatedCode = code.substring(0, start) + '  ' + code.substring(end);
    
    // Update selection position
    setTimeout(() => {
      e.target.selectionStart = e.target.selectionEnd = start + 2;
    }, 0);
    
    return updatedCode;
  }
  
  return null; // Return null if not tab key
};
