/**
 * Input validation utilities for calculator
 */

// Check if the character is an operator
export const isOperator = (char, operators) => operators.includes(char);

// Check if an expression ends with an operator
export const endsWithOperator = (expression, operators) => {
  if (!expression) return false;
  return operators.some(op => expression.endsWith(op));
};

// Prevent starting with an operator (except minus for negatives)
export const canStartWithOperator = (key, expression) => {
  return !expression && key !== "-" && key !== "−";
};

// Check if input would create multiple decimals in current number
export const wouldCreateMultipleDecimals = (key, expression, operators) => {
  if (key !== ".") return false;
  
  // Get the last number in the expression
  const parts = expression.split(new RegExp(`[${operators.join("")}]`));
  const lastNumber = parts[parts.length - 1] || "";
  return lastNumber.includes(".");
};

// Check if input would create multiple leading zeros
export const wouldCreateMultipleLeadingZeros = (key, expression, operators) => {
  if (key !== "0") return false;
  
  // Handle starting with zero
  if (!expression) return false;
  
  // Check for patterns like "0" followed by a digit
  const parts = expression.split(new RegExp(`[${operators.join("")}]`));
  const lastNumber = parts[parts.length - 1] || "";
  
  // Allow 0.x but not 0x
  return lastNumber === "0" && !lastNumber.includes(".");
};

// Clean up the expression before calculating
export const sanitizeExpression = (expression, operators) => {
  let sanitized = expression;
  
  // Trim trailing operator
  while (endsWithOperator(sanitized, operators)) {
    sanitized = sanitized.slice(0, -1);
  }
  
  // Replace multiple operators with the last one
  operators.forEach(op => {
    const escapedOp = op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    sanitized = sanitized.replace(new RegExp(`${escapedOp}+`, 'g'), op);
  });
  
  // Auto-convert invalid sequences like --, +-, ×÷ to just the last operator
  operators.forEach(op1 => {
    operators.forEach(op2 => {
      if (op1 !== op2) {
        const escapedOp1 = op1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedOp2 = op2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        sanitized = sanitized.replace(new RegExp(`${escapedOp1}\\s*${escapedOp2}`, 'g'), op2);
      }
    });
  });
  
  return sanitized;
};

// Check if the expression contains a division by zero
export const detectDivisionByZero = (expression) => {
  return /\/\s*0(?!\d|\.)/.test(expression) || /÷\s*0(?!\d|\.)/.test(expression);
};

// Limit expression length to avoid overflow
export const exceedsMaxLength = (expression, maxLength = 50) => {
  return expression.length >= maxLength;
};

// Check if adding a key would create an invalid sequence
export const wouldCreateInvalidSequence = (key, expression, operators) => {
  // Check for operator after operator
  if (isOperator(key, operators) && endsWithOperator(expression, operators)) {
    return true;
  }
  
  return false;
};

// Unified validation function
export const validateInput = (key, expression, operators, lastWasEquals = false) => {
  // Allow starting a new calculation after equals
  if (lastWasEquals && !isOperator(key, operators)) {
    return { valid: true, resetExpression: true };
  }
  
  // Block operators as first input (except minus for negative)
  if (!expression && isOperator(key, operators) && key !== "-" && key !== "−") {
    return { valid: false, reason: "Cannot start with operator" };
  }
  
  // Prevent multiple decimals in a number
  if (wouldCreateMultipleDecimals(key, expression, operators)) {
    return { valid: false, reason: "Number already has decimal point" };
  }
  
  // Prevent multiple leading zeros
  if (wouldCreateMultipleLeadingZeros(key, expression, operators)) {
    return { valid: false, reason: "Cannot have multiple leading zeros" };
  }
  
  // Prevent two operators in a row (will replace instead)
  if (isOperator(key, operators) && endsWithOperator(expression, operators)) {
    return { valid: true, replaceLastChar: true };
  }
  
  // Prevent expression from getting too long
  if (exceedsMaxLength(expression)) {
    return { valid: false, reason: "Expression too long" };
  }
  
  // Everything looks good
  return { valid: true };
};
