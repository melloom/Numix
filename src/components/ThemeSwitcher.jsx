import React, { useContext } from "react";
import { ThemeContext } from "../themeContext";

function ThemeSwitcher() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      className="theme-switcher modern-theme-switcher"
      title="Switch theme"
      onClick={toggleTheme}
      aria-label="Switch theme"
    >
      {theme === "light" ? (
        <span role="img" aria-label="dark mode">🌙</span>
      ) : (
        <span role="img" aria-label="light mode">☀️</span>
      )}
    </button>
  );
}

export default ThemeSwitcher;
