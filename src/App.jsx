import React, { useEffect } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import CalculatorApp from "./components/CalculatorApp";
import { settingsManager } from "./utils/localStorage";
import { initializeMobileOptimizations, isMobileDevice } from "./utils/mobileUtils";
import { handleUserInteraction } from "./utils/sounds";
import "./styles/App.css";

function App() {
  // iOS viewport height fix for better mobile experience
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  // Initialize mobile optimizations based on user settings
  useEffect(() => {
    if (isMobileDevice()) {
      const settings = settingsManager.getSettings();
      initializeMobileOptimizations({
        hideAddressBar: settings.hideAddressBarMobile,
        preventZoom: true,
        optimizeViewport: true
      });
    }
  }, []);

  // Set up early user interaction handling for better audio support
  useEffect(() => {
    const setupAudioInteraction = () => {
      handleUserInteraction();
    };
    
    // Listen for any early user interactions
    document.addEventListener('touchstart', setupAudioInteraction, { once: true, passive: true });
    document.addEventListener('click', setupAudioInteraction, { once: true, passive: true });
    
    return () => {
      document.removeEventListener('touchstart', setupAudioInteraction);
      document.removeEventListener('click', setupAudioInteraction);
    };
  }, []);

  return (
    <ThemeProvider>
      <div className="app">
        <CalculatorApp />
      </div>
    </ThemeProvider>
  );
}

export default App;