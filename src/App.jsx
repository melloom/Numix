import React, { useEffect } from "react";
import Calculator from "./components/Calculator";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import PWAFloatingInstall from "./components/PWAFloatingInstall";
import iOSInstallBanner from "./components/iOSInstallBanner";
import "./App.css";

function App() {
  // Add event listener for iOS viewport height fix
  useEffect(() => {
    // Fix for iOS Safari 100vh issue
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Set on initial load and resize
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  return (
    <div className="app-bg">
      <iOSInstallBanner />
      <Calculator />
      <PWAInstallPrompt />
      <PWAFloatingInstall />
    </div>
  );
}

export default App;