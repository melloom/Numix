import React from "react";

function Display({ expression, result }) {
  return (
    <div className="display modern-display">
      <div className="expression digital">{expression || "0"}</div>
      <div className="result digital" style={{ textAlign: "right", fontSize: "2em" }}>{result}</div>
    </div>
  );
}

export default Display;
