// Basic arithmetic operations
export const evaluate = (firstOperand, secondOperand, operation) => {
  switch (operation) {
    case '+':
      return firstOperand + secondOperand
    case '-':
      return firstOperand - secondOperand
    case '*':
      return firstOperand * secondOperand
    case '/':
      if (secondOperand === 0) {
        throw new Error('Cannot divide by zero')
      }
      return firstOperand / secondOperand
    default:
      return secondOperand
  }
}

// Format numbers for display
export const formatNumber = (num) => {
  if (typeof num !== 'number') return '0'
  
  // Handle infinity and NaN
  if (!isFinite(num)) {
    return num.toString()
  }
  
  // Handle very large or very small numbers
  if (Math.abs(num) >= 1e12 || (Math.abs(num) < 0.000001 && num !== 0)) {
    return num.toExponential(5)
  }
  
  // Handle regular numbers
  const formatted = num.toString()
  
  // If the number has more than 12 characters, use scientific notation
  if (formatted.length > 12) {
    return num.toPrecision(6)
  }
  
  return formatted
}

// Scientific calculator functions
export const scientificOperations = {
  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  tan: (x) => Math.tan(x),
  asin: (x) => Math.asin(x),
  acos: (x) => Math.acos(x),
  atan: (x) => Math.atan(x),
  sinh: (x) => Math.sinh(x),
  cosh: (x) => Math.cosh(x),
  tanh: (x) => Math.tanh(x),
  log: (x) => Math.log10(x),
  ln: (x) => Math.log(x),
  exp: (x) => Math.exp(x),
  sqrt: (x) => Math.sqrt(x),
  cbrt: (x) => Math.cbrt(x),
  pow: (x, y) => Math.pow(x, y),
  factorial: (n) => {
    if (n < 0 || !Number.isInteger(n)) throw new Error('Invalid input for factorial')
    if (n === 0 || n === 1) return 1
    let result = 1
    for (let i = 2; i <= n; i++) {
      result *= i
    }
    return result
  },
  reciprocal: (x) => 1 / x,
  percent: (x) => x / 100,
  pi: () => Math.PI,
  e: () => Math.E
}

// Programmer calculator functions
export const programmerOperations = {
  // Convert between number systems
  toBinary: (num) => num.toString(2),
  toOctal: (num) => num.toString(8),
  toHexadecimal: (num) => num.toString(16).toUpperCase(),
  toDecimal: (num, base) => parseInt(num, base),
  
  // Bitwise operations
  and: (a, b) => a & b,
  or: (a, b) => a | b,
  xor: (a, b) => a ^ b,
  not: (a) => ~a,
  leftShift: (a, b) => a << b,
  rightShift: (a, b) => a >> b,
  
  // Two's complement
  twosComplement: (num, bits = 32) => {
    const max = Math.pow(2, bits - 1)
    if (num >= max) {
      return num - Math.pow(2, bits)
    }
    return num
  }
}

// Validation functions
export const isValidNumber = (str) => {
  return !isNaN(str) && !isNaN(parseFloat(str))
}

export const sanitizeInput = (input) => {
  // Remove any characters that aren't numbers, operators, or decimal points
  return input.replace(/[^0-9+\-*/.()]/g, '')
} 