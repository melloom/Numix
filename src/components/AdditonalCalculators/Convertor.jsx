import React, { useState, useEffect, useCallback } from "react";

// Expanded conversion types organized by categories
const conversionCategories = [
  {
    id: "currency",
    name: "Currency",
    units: [
      { value: "USD", label: "US Dollar" },
      { value: "EUR", label: "Euro" },
      { value: "GBP", label: "British Pound" },
      { value: "JPY", label: "Japanese Yen" },
      { value: "CAD", label: "Canadian Dollar" },
      { value: "AUD", label: "Australian Dollar" },
      { value: "INR", label: "Indian Rupee" },
      { value: "CNY", label: "Chinese Yuan" }
    ]
  },
  {
    id: "length",
    name: "Length",
    units: [
      { value: "m", label: "Meters" },
      { value: "km", label: "Kilometers" },
      { value: "cm", label: "Centimeters" },
      { value: "mm", label: "Millimeters" },
      { value: "ft", label: "Feet" },
      { value: "in", label: "Inches" },
      { value: "yd", label: "Yards" },
      { value: "mi", label: "Miles" }
    ]
  },
  {
    id: "weight",
    name: "Weight",
    units: [
      { value: "kg", label: "Kilograms" },
      { value: "g", label: "Grams" },
      { value: "mg", label: "Milligrams" },
      { value: "lb", label: "Pounds" },
      { value: "oz", label: "Ounces" },
      { value: "ton", label: "Metric Tons" }
    ]
  },
  {
    id: "temperature",
    name: "Temperature",
    units: [
      { value: "c", label: "Celsius" },
      { value: "f", label: "Fahrenheit" },
      { value: "k", label: "Kelvin" }
    ]
  },
  {
    id: "timezone",
    name: "Time Zone",
    units: [
      { value: "local", label: "Local Time" },
      { value: "utc", label: "UTC" },
      { value: "est", label: "EST (UTC-5)" },
      { value: "cst", label: "CST (UTC-6)" },
      { value: "mst", label: "MST (UTC-7)" },
      { value: "pst", label: "PST (UTC-8)" },
      { value: "gmt", label: "GMT (UTC)" },
      { value: "bst", label: "BST (UTC+1)" },
      { value: "cet", label: "CET (UTC+1)" },
      { value: "ist", label: "IST (UTC+5:30)" },
      { value: "jst", label: "JST (UTC+9)" },
      { value: "aest", label: "AEST (UTC+10)" }
    ]
  },
  {
    id: "volume",
    name: "Volume",
    units: [
      { value: "l", label: "Liters" },
      { value: "ml", label: "Milliliters" },
      { value: "gal", label: "Gallons (US)" },
      { value: "qt", label: "Quarts (US)" },
      { value: "pt", label: "Pints (US)" },
      { value: "cup", label: "Cups" },
      { value: "floz", label: "Fluid Ounces" }
    ]
  },
  {
    id: "area",
    name: "Area",
    units: [
      { value: "m2", label: "Square Meters" },
      { value: "km2", label: "Square Kilometers" },
      { value: "cm2", label: "Square Centimeters" },
      { value: "ha", label: "Hectares" },
      { value: "ft2", label: "Square Feet" },
      { value: "in2", label: "Square Inches" },
      { value: "acre", label: "Acres" }
    ]
  },
  {
    id: "data",
    name: "Data",
    units: [
      { value: "b", label: "Bytes" },
      { value: "kb", label: "Kilobytes" },
      { value: "mb", label: "Megabytes" },
      { value: "gb", label: "Gigabytes" },
      { value: "tb", label: "Terabytes" }
    ]
  }
];

// Sound for button clicks
const SOUND_SRC = "/assets/click-buttons-ui-menu-sounds-effects-button-2-203594.mp3";

// Currency API constants
const API_KEY = "86b0a51861e59f75d4e065d12fdeb2e7";
const CURRENCY_API_URL = `https://api.forexrateapi.com/v1/latest?api_key=${API_KEY}`;

// Comprehensive conversion function
function convert(value, from, to, category, exchangeRates) {
  if (!value || isNaN(parseFloat(value))) return "";
  
  const num = parseFloat(value);
  
  // Handle different conversion categories
  switch (category) {
    case "currency":
      return convertCurrency(num, from, to, exchangeRates);
    case "length":
      return convertLength(num, from, to);
    case "weight":
      return convertWeight(num, from, to);
    case "temperature":
      return convertTemperature(num, from, to);
    case "volume":
      return convertVolume(num, from, to);
    case "area":
      return convertArea(num, from, to);
    case "timezone":
      return convertTimezone(num, from, to);
    case "data":
      return convertData(num, from, to);
    default:
      return "";
  }
}

// Currency conversion using live exchange rates
function convertCurrency(num, from, to, exchangeRates) {
  if (!exchangeRates || !exchangeRates.rates) {
    return "API Error";
  }
  
  // Special case: If converting to the base currency or same currency
  if (from === to) return num;
  
  // First convert to USD (base currency)
  let inUSD;
  if (from === "USD") {
    inUSD = num;
  } else {
    // Get the rate of FROM currency to USD
    const fromRate = exchangeRates.rates[from];
    if (!fromRate) return "Rate not available";
    inUSD = num / fromRate;
  }
  
  // Then convert from USD to target currency
  if (to === "USD") {
    return inUSD;
  } else {
    // Get the rate of USD to TO currency
    const toRate = exchangeRates.rates[to];
    if (!toRate) return "Rate not available";
    return inUSD * toRate;
  }
}

// Length conversion
function convertLength(num, from, to) {
  // Convert everything to meters first, then to target unit
  let meters = num;
  
  // Convert from source unit to meters
  if (from === "km") meters = num * 1000;
  if (from === "cm") meters = num / 100;
  if (from === "mm") meters = num / 1000;
  if (from === "ft") meters = num * 0.3048;
  if (from === "in") meters = num * 0.0254;
  if (from === "yd") meters = num * 0.9144;
  if (from === "mi") meters = num * 1609.34;
  
  // Convert from meters to target unit
  if (to === "m") return meters;
  if (to === "km") return meters / 1000;
  if (to === "cm") return meters * 100;
  if (to === "mm") return meters * 1000;
  if (to === "ft") return meters / 0.3048;
  if (to === "in") return meters / 0.0254;
  if (to === "yd") return meters / 0.9144;
  if (to === "mi") return meters / 1609.34;
  
  return meters;
}

function convertWeight(num, from, to) {
  // Convert to kg first
  let kg = num;
  
  if (from === "g") kg = num / 1000;
  if (from === "mg") kg = num / 1000000;
  if (from === "lb") kg = num * 0.453592;
  if (from === "oz") kg = num * 0.0283495;
  if (from === "ton") kg = num * 1000;
  
  // Convert to target
  if (to === "kg") return kg;
  if (to === "g") return kg * 1000;
  if (to === "mg") return kg * 1000000;
  if (to === "lb") return kg / 0.453592;
  if (to === "oz") return kg / 0.0283495;
  if (to === "ton") return kg / 1000;
  
  return kg;
}

function convertTemperature(num, from, to) {
  // Fix to ensure precise temperature conversion
  if (from === to) return num;
  
  // Convert to Celsius first
  let celsius = num;
  if (from === "f") celsius = (num - 32) * 5/9;
  if (from === "k") celsius = num - 273.15;
  
  // Convert to target
  if (to === "c") return celsius;
  if (to === "f") return celsius * 9/5 + 32;
  if (to === "k") return celsius + 273.15;
  
  return celsius;
}

// Timezone conversion function
function convertTimezone(num, from, to) {
  // Get the timezone offsets in minutes
  const offsets = {
    "local": -(new Date().getTimezoneOffset()),
    "utc": 0,
    "est": -300, // UTC-5
    "cst": -360, // UTC-6
    "mst": -420, // UTC-7
    "pst": -480, // UTC-8
    "gmt": 0,    // UTC
    "bst": 60,   // UTC+1
    "cet": 60,   // UTC+1
    "ist": 330,  // UTC+5:30
    "jst": 540,  // UTC+9
    "aest": 600  // UTC+10
  };
  
  // Convert time to minutes 
  const hours = Math.floor(num);
  const minutes = Math.round((num - hours) * 60);
  const totalMinutes = hours * 60 + minutes;
  
  // Adjust for timezone difference
  const fromOffset = offsets[from] || 0;
  const toOffset = offsets[to] || 0;
  const utcMinutes = totalMinutes - fromOffset;
  const targetMinutes = utcMinutes + toOffset;
  
  // Convert back to decimal hours
  const targetHours = Math.floor(targetMinutes / 60);
  const targetMins = targetMinutes % 60;
  
  // Format result as decimal hours
  return targetHours + (targetMins / 60);
}

function convertVolume(num, from, to) {
  // Convert to liters first
  let liters = num;
  
  if (from === "ml") liters = num / 1000;
  if (from === "gal") liters = num * 3.78541;
  if (from === "qt") liters = num * 0.946353;
  if (from === "pt") liters = num * 0.473176;
  if (from === "cup") liters = num * 0.24;
  if (from === "floz") liters = num * 0.0295735;
  
  // Convert to target
  if (to === "l") return liters;
  if (to === "ml") return liters * 1000;
  if (to === "gal") return liters / 3.78541;
  if (to === "qt") return liters / 0.946353;
  if (to === "pt") return liters / 0.473176;
  if (to === "cup") return liters / 0.24;
  if (to === "floz") return liters / 0.0295735;
  
  return liters;
}

function convertArea(num, from, to) {
  // Convert to square meters
  let sqMeters = num;
  
  if (from === "km2") sqMeters = num * 1000000;
  if (from === "cm2") sqMeters = num / 10000;
  if (from === "ha") sqMeters = num * 10000;
  if (from === "ft2") sqMeters = num * 0.092903;
  if (from === "in2") sqMeters = num * 0.00064516;
  if (from === "acre") sqMeters = num * 4046.86;
  
  // Convert to target
  if (to === "m2") return sqMeters;
  if (to === "km2") return sqMeters / 1000000;
  if (to === "cm2") return sqMeters * 10000;
  if (to === "ha") return sqMeters / 10000;
  if (to === "ft2") return sqMeters / 0.092903;
  if (to === "in2") return sqMeters / 0.00064516;
  if (to === "acre") return sqMeters / 4046.86;
  
  return sqMeters;
}

function convertData(num, from, to) {
  // Convert to bytes
  let bytes = num;
  
  if (from === "kb") bytes = num * 1024;
  if (from === "mb") bytes = num * 1024 * 1024;
  if (from === "gb") bytes = num * 1024 * 1024 * 1024;
  if (from === "tb") bytes = num * 1024 * 1024 * 1024 * 1024;
  
  // Convert to target
  if (to === "b") return bytes;
  if (to === "kb") return bytes / 1024;
  if (to === "mb") return bytes / (1024 * 1024);
  if (to === "gb") return bytes / (1024 * 1024 * 1024);
  if (to === "tb") return bytes / (1024 * 1024 * 1024 * 1024);
  
  return bytes;
}

// Format the result with appropriate precision
function formatResult(num, category, from, to) {
  if (num === undefined || num === null || isNaN(num)) return "";
  
  const absNum = Math.abs(num);
  
  // Special handling for timezone conversion - format as time
  if (category === "timezone") {
    const hours = Math.floor(num);
    const minutes = Math.round((num - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // Use scientific notation for very large or small numbers
  if (absNum >= 1e10 || (absNum < 1e-6 && absNum > 0)) {
    return num.toExponential(6);
  }
  
  // For normal numbers, use appropriate precision
  if (Number.isInteger(num)) return num.toString();
  if (absNum >= 10) return num.toFixed(4);
  if (absNum >= 1) return num.toFixed(6);
  
  return num.toPrecision(6);
}

function Convertor({
  onCalcIconClick,
  calcBtnRef,
  calcBtnActive,
  onCalcIconDown,
  onCalcIconUp,
  onAddToHistory
}) {
  const [input, setInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("currency");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [exchangeRates, setExchangeRates] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [lastHistoryEntry, setLastHistoryEntry] = useState({ expr: null, res: null });
  
  // Get current category and its units
  const currentCategory = conversionCategories.find(cat => cat.id === selectedCategory) || conversionCategories[0];
  const availableUnits = currentCategory.units;

  // Handle timezone special case - provide current time as default input
  useEffect(() => {
    if (selectedCategory === "timezone" && !input) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      setInput(`${hours + minutes/60}`);
      setFrom("local");
      setTo("utc");
    }
  }, [selectedCategory, input]);
  
  // Fetch exchange rates from API
  const fetchExchangeRates = useCallback(async () => {
    if (selectedCategory !== "currency") return;
    
    // Use cached rates if they're less than 30 minutes old
    const now = Date.now();
    if (exchangeRates && lastFetchTime && (now - lastFetchTime < 30 * 60 * 1000)) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create URL with all available currencies for comprehensive data
      const currencyCodes = conversionCategories.find(c => c.id === "currency")
                            .units.map(u => u.value).join(",");
      const url = `${CURRENCY_API_URL}&base=USD&currencies=${currencyCodes}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }
      
      const data = await response.json();
      if (data.success) {
        // Add base currency to rates with value 1
        data.rates['USD'] = 1;
        setExchangeRates(data);
        setLastFetchTime(now);
      } else {
        throw new Error(data.error?.message || "API error");
      }
    } catch (err) {
      setError(err.message);
      console.error("Currency API error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, exchangeRates, lastFetchTime]);
  
  // Fetch exchange rates when category changes to currency
  useEffect(() => {
    if (selectedCategory === "currency") {
      fetchExchangeRates();
    }
    
    // Set default units when category changes
    if (currentCategory?.units?.length) {
      const defaultFrom = currentCategory.units[0].value;
      const defaultTo = currentCategory.units.length > 1 ? currentCategory.units[1].value : currentCategory.units[0].value;
      
      // Don't reset units if they're already in the new category
      const fromExists = currentCategory.units.some(u => u.value === from);
      const toExists = currentCategory.units.some(u => u.value === to);
      
      if (!fromExists) setFrom(defaultFrom);
      if (!toExists) setTo(defaultTo);
    }
  }, [selectedCategory, fetchExchangeRates, currentCategory, from, to]);
  
  // Calculate result
  const getResult = () => {
    if (!input) return "";
    
    // Show loading indicator while fetching rates
    if (selectedCategory === "currency" && isLoading) {
      return "Loading...";
    }
    
    // Show error if there was one
    if (selectedCategory === "currency" && error) {
      return "API Error";
    }
    
    try {
      const result = convert(input, from, to, selectedCategory, exchangeRates);
      const formattedResult = formatResult(result, selectedCategory, from, to);
      
      // Record significant conversions to history
      // Only add to history when "=" button is pressed
      return formattedResult;
    } catch (err) {
      console.error("Conversion error:", err);
      return "Error";
    }
  };
  
  const result = getResult();
  
  // Revised keypad layout - calculator button moved to bottom left
  const rows = [
    ["AC", "cat", "+/-", "⇄"],
    ["7", "8", "9", "←"],
    ["4", "5", "6", "→"],
    ["1", "2", "3", "="],
    ["calc", "0", ".", ""] // Moved calc to bottom left
  ];

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

  // Handle keypad button press
  const handleKeypad = (key) => {
    playSound();
    
    if (key === "AC") {
      setInput("");
      return;
    }
    
    if (key === "calc") {
      onCalcIconClick && onCalcIconClick();
      return;
    }
    
    if (key === "+/-") {
      if (!input) return;
      
      if (input.startsWith("-")) {
        setInput(input.slice(1));
      } else {
        setInput("-" + input);
      }
      return;
    }
    
    if (key === "⇄") {
      // Swap from and to units
      const temp = from;
      setFrom(to);
      setTo(temp);
      return;
    }
    
    if (key === "cat") {
      // Cycle through categories
      const currentIndex = conversionCategories.findIndex(cat => cat.id === selectedCategory);
      const nextIndex = (currentIndex + 1) % conversionCategories.length;
      const nextCategory = conversionCategories[nextIndex].id;
      setSelectedCategory(nextCategory);
      
      // Clear input when switching to timezone
      if (nextCategory === "timezone") {
        setInput("");
      }
      
      return;
    }
    
    if (key === "←") {
      // Previous source unit
      const currentIndex = availableUnits.findIndex(u => u.value === from);
      const prevIndex = (currentIndex - 1 + availableUnits.length) % availableUnits.length;
      setFrom(availableUnits[prevIndex].value);
      return;
    }
    
    if (key === "→") {
      // Next target unit
      const currentIndex = availableUnits.findIndex(u => u.value === to);
      const nextIndex = (currentIndex + 1) % availableUnits.length;
      setTo(availableUnits[nextIndex].value);
      return;
    }
    
    if (key === "=" || key === "ENTER") {
      // Add current conversion to history if we have input and result
      if (input && result && onAddToHistory) {
        const formattedInput = `${input} ${from}`;
        const formattedResult = `${result} ${to}`;
        const conversionExpression = `Convert ${currentCategory.name}: ${formattedInput}`;
        
        // Only add to history if this isn't a duplicate of the last conversion
        if (conversionExpression !== lastHistoryEntry.expr || formattedResult !== lastHistoryEntry.res) {
          // Add to history with category info
          onAddToHistory(conversionExpression, formattedResult);
          setLastHistoryEntry({ expr: conversionExpression, res: formattedResult });
        }
      }
      
      // Trigger manual refresh of exchange rates if in currency mode
      if (selectedCategory === "currency") {
        fetchExchangeRates();
      }
      return;
    }
    
    // Reset lastHistoryEntry when values change
    if (key === "AC" || "0123456789.".includes(key) || key === "+/-") {
      setLastHistoryEntry({ expr: null, res: null });
    }
  };
  
  // Reset lastHistoryEntry when category or units change as this creates a new context
  useEffect(() => {
    setLastHistoryEntry({ expr: null, res: null });
  }, [selectedCategory, from, to]);
  
  // Add keyboard event handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      // If the key is a number key, decimal point, or relevant function key
      if ("0123456789".includes(e.key) || e.key === "." || e.key === "Backspace" || 
          e.key === "Enter" || e.key === "-") {
        e.preventDefault();
        
        if (e.key === "Backspace") {
          setInput(prev => prev.slice(0, -1));
          return;
        }
        
        if (e.key === "Enter") {
          handleKeypad("=");
          return;
        }
        
        if (e.key === "-") {
          handleKeypad("+/-");
          return;
        }
        
        handleKeypad(e.key);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [input]); // Re-attach listener when input changes

  return (
    <div className="converter-calculator">
      <div className="modern-display convertor-display" style={{
        marginBottom: "0.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
        overflow: "hidden", // Contain all content
        position: "relative" // For loading indicator
      }}>
        {/* Category title with API status indicator for currency */}
        <div className="converter-category" style={{
          fontSize: "1rem",
          fontWeight: "bold",
          color: "#6366f1",
          textAlign: "center",
          padding: "0.2rem 0",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          {currentCategory.name} Converter
          {selectedCategory === "currency" && isLoading && (
            <span style={{ fontSize: "0.8em", color: "#fb7185" }}>⟳</span>
          )}
        </div>
        
        {/* Dual display for input and output */}
        <div className="dual-display" style={{
          display: "flex", 
          flexDirection: "column", 
          gap: "0.4rem",
          width: "100%"
        }}>
          {/* Input section */}
          <div className="convert-input-section" style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem", // Reduced gap
            padding: "0.4rem",
            background: "rgba(245,247,250,0.5)",
            borderRadius: "0.7rem",
            border: "1px solid #e5e9f2",
            width: "100%", // Ensure full width
            boxSizing: "border-box" // Include padding in width calculation
          }}>
            <input
              type="text"
              value={input}
              onChange={e => {
                const val = e.target.value;
                // Allow negative values and decimals
                if (/^-?\d*\.?\d*$/.test(val)) {
                  setInput(val);
                }
              }}
              placeholder="Enter value"
              className="convertor-input"
              style={{
                flex: "1 1 auto", // Allow shrinking
                minWidth: 0, // Allow shrinking below content size
                fontSize: "1.1em", // Slightly smaller
                border: "none",
                background: "transparent",
                color: "inherit",
                outline: "none",
                padding: "0.35em",
                width: "100%"
              }}
            />
            <select
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="convertor-select"
              style={{
                flex: "0 0 auto", // Don't grow or shrink
                fontSize: "0.9em", // Smaller text
                borderRadius: "0.5em",
                border: "1px solid #e5e9f2",
                padding: "0.35em 0.3em", // Reduced horizontal padding
                background: "#f8fafc",
                width: "80px", // Fixed width instead of minWidth
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {availableUnits.map(u => 
                <option key={u.value} value={u.value}>{u.label}</option>
              )}
            </select>
          </div>
          
          {/* Arrow between sections */}
          <div style={{
            textAlign: "center",
            color: "#6366f1",
            fontSize: "1.2em",
            fontWeight: "bold"
          }}>
            ⇩
          </div>
          
          {/* Output section */}
          <div className="convert-output-section" style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem", // Reduced gap
            padding: "0.4rem",
            background: "rgba(99,102,241,0.1)",
            borderRadius: "0.7rem",
            border: "1px solid #a5b4fc",
            width: "100%", // Ensure full width
            boxSizing: "border-box" // Include padding in width calculation
          }}>
            <div className="result digital" style={{ 
              flex: "1 1 auto", // Allow shrinking
              minWidth: 0, // Allow shrinking below content size
              fontSize: "1.1em", // Slightly smaller
              padding: "0.35em",
              textAlign: "left",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              {result || "—"}
            </div>
            <select
              value={to}
              onChange={e => setTo(e.target.value)}
              className="convertor-select"
              style={{
                flex: "0 0 auto", // Don't grow or shrink
                fontSize: "0.9em", // Smaller text
                borderRadius: "0.5em",
                border: "1px solid #a5b4fc",
                padding: "0.35em 0.3em", // Reduced horizontal padding
                background: "#f8fafc",
                width: "80px", // Fixed width instead of minWidth
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {availableUnits.map(u => 
                <option key={u.value} value={u.value}>{u.label}</option>
              )}
            </select>
          </div>
        </div>
        
        {/* Category selector - fixed grid layout instead of scrolling */}
        <div className="category-selector" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))",
          gap: "0.2rem",
          width: "100%",
          justifyContent: "center"
        }}>
          {conversionCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                
                // Set default units when changing category
                if (cat.units.length) {
                  setFrom(cat.units[0].value);
                  setTo(cat.units.length > 1 ? cat.units[1].value : cat.units[0].value);
                }
              }}
              style={{
                background: selectedCategory === cat.id ? "#6366f1" : "transparent",
                color: selectedCategory === cat.id ? "white" : "#64748b",
                border: "1px solid #e5e9f2",
                borderRadius: "0.5rem",
                padding: "0.2rem 0.25rem",
                fontSize: "0.7em", // Even smaller text
                cursor: "pointer",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
        
        {/* Currency API status message */}
        {selectedCategory === "currency" && (
          <div style={{
            fontSize: "0.65em",
            color: error ? "#fb7185" : "#64748b",
            textAlign: "center",
            padding: "0 0.5rem"
          }}>
            {error ? `${error}` : 
             lastFetchTime ? `Rates updated: ${new Date(lastFetchTime).toLocaleTimeString()}` :
             isLoading ? "Fetching rates..." : ""}
          </div>
        )}
      </div>
      
      {/* Keypad */}
      <div className="modern-keypad" style={{gridTemplateColumns: "repeat(4, 1fr)", gap: "0.7rem"}}>
        {rows.map((row, rowIdx) =>
          row.map((key, colIdx) => {
            if (!key) return <div key={`empty-${rowIdx}-${colIdx}`} />;
            
            if (key === "calc") {
              return (
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
                    borderRadius: "0.9rem", // Added consistent border-radius
                    boxShadow: "0 0 0 4px rgba(251,191,36,0.15), 0 2px 12px rgba(36,41,61,0.22)",
                    WebkitTapHighlightColor: "transparent"
                  }}
                  onPointerDown={onCalcIconDown}
                  onMouseDown={onCalcIconDown}
                  onMouseUp={onCalcIconUp}
                  onMouseLeave={onCalcIconUp}
                  onTouchStart={onCalcIconDown}
                  onTouchEnd={onCalcIconUp}
                  onClick={() => onCalcIconClick()}
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
              );
            }
          
            // Updated special button styles to ensure dark mode compatibility
            const specialButtonStyle = {
              "cat": { 
                backgroundColor: "#6366f1", 
                color: "white", 
                fontSize: "0.9em",
                border: "none" // Ensure no border in dark mode
              },
              "⇄": { 
                backgroundColor: "#fb7185", 
                color: "white",
                border: "none"
              },
              "←": { 
                backgroundColor: "#22c55e", 
                color: "white",
                border: "none"
              },
              "→": { 
                backgroundColor: "#22c55e", 
                color: "white",
                border: "none"
              },
              "AC": { 
                backgroundColor: "#fb7185", 
                color: "white",
                border: "none"
              },
              "+/-": { 
                backgroundColor: "#fb7185", 
                color: "white",
                border: "none"
              },
              "=": { 
                backgroundColor: "#fb7185", 
                color: "white",
                border: "none"
              },
            };
          
            return (
              <button
                key={key + rowIdx + colIdx}
                className={`keypad-btn${key === "=" ? " equals" : ""}`}
                onClick={() => handleKeypad(key)}
                style={{
                  ...(specialButtonStyle[key] || {}),
                  WebkitTapHighlightColor: "transparent",
                  borderRadius: "0.9rem",
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
              >
                {key === "cat" ? "CAT" : key}
              </button>
            );
          })
        )}
      </div>
      
      {/* Instructions */}
      <div style={{
        marginTop: "0.7rem",
        fontSize: "0.75rem",
        color: "#64748b",
        textAlign: "center"
      }}>
        {selectedCategory === "currency" ? 
          "Use = to refresh rates • ⇄ to swap units" :
          "Use CAT to change category • ⇄ to swap units"}
      </div>
    </div>
  );
}

export default Convertor;
