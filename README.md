# Numix Calculator

A modern, multi-purpose calculator app with Standard, Scientific, Programmer, and Converter modes.

## Programmer Calculator Guide

The Programmer Calculator allows you to work with numbers in different numbering systems (Binary, Octal, Decimal, and Hexadecimal) and perform bit-wise operations.

### Basic Usage

1. **Base Selection** (Top Row)
   - Click on BIN, OCT, DEC, or HEX to choose your number base
   - The selected base will be highlighted with a blue border
   - When no base is selected, all digits are allowed, but the calculator defaults to decimal

2. **ASCII Converter**
   - Click "ASCII Converter" to toggle ASCII conversion mode
   - In ASCII mode, numbers are displayed as their ASCII character equivalents

3. **Memory Functions** (AC, DEL, MS, MR, M+, M-)
   - **AC**: Clear all input
   - **DEL**: Delete the last character
   - **MS**: Store current number in memory
   - **MR**: Recall memory value
   - **M+**: Add current value to memory
   - **M-**: Subtract current value from memory

4. **Digit Buttons**
   - Hexadecimal buttons (A-F) - Available in HEX mode
   - Digits 0-9 (availability depends on selected base)
   - The "Valid digits" indicator shows which digits can be used in the current base

5. **Bitwise Operations**
   - **AND**, **OR**, **XOR**: Logical operators
   - **NOT**: Bitwise NOT (complement)
   - **<<**: Left shift
   - **>>**: Right shift

6. **Other Functions**
   - **(**, **)**: Parentheses for grouping operations
   - **%**: Percent operator
   - **+/-**: Change sign of current number
   - **SPACE**: Insert space (for readability)
   - **=**: Calculate result

### Examples

1. **Binary Addition**
   - Select BIN mode
   - Enter: 101 + 11
   - Result: 1000 (8 in decimal)

2. **Hexadecimal Calculation**
   - Select HEX mode
   - Enter: FF + 1
   - Result: 100 (256 in decimal)

3. **Bitwise Operations**
   - Enter: 5 AND 3
   - Result: 1 (0101 AND 0011 = 0001)

4. **Base Conversion**
   - Enter a number (e.g., 42) in DEC mode
   - Click BIN to convert to binary (101010)
   - Click HEX to convert to hexadecimal (2A)

### Tips

- When a base is selected (BIN/OCT/DEC/HEX), only valid digits for that base can be entered
- When no base is explicitly selected, all digits are allowed
- The ASCII converter lets you see the ASCII character for any number
- The binary preview at the bottom shows binary representation for bit operations
