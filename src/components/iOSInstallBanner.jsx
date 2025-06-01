import React, { useState, useEffect } from 'react';

const iOSInstallBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    
    setIsIOS(iOS);
    setIsStandalone(standalone);
    
    console.log('iOS detected:', iOS);
    console.log('Standalone mode:', standalone);
    
    // Show banner for iOS devices that aren't in standalone mode
    if (iOS && !standalone) {
      const dismissed = localStorage.getItem('ios-install-dismissed');
      if (!dismissed) {
        setTimeout(() => {
          setShowBanner(true);
          console.log('Showing iOS install banner');
        }, 2000);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('ios-install-dismissed', Date.now().toString());
  };

  if (!showBanner || !isIOS || isStandalone) {
    return null;
  }

  return (
    <div className="ios-install-banner">
      <div className="ios-banner-content">
        <div className="ios-banner-icon">📱</div>
        <div className="ios-banner-text">
          <strong>Install Numix</strong>
          <span>Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong></span>
        </div>
        <button onClick={handleDismiss} className="ios-banner-close">×</button>
      </div>
    </div>
  );
};

export default iOSInstallBanner; 