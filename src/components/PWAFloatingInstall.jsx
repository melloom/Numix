import React, { useState, useEffect } from 'react';
import InstallIcon from './icons/InstallIcon';

const PWAFloatingInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      return mobile;
    };

    const isMobileDevice = checkMobile();

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show floating button after the banner is dismissed or after a delay
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
          setShowButton(true);
        }
      }, 15000); // Show after 15 seconds if banner was dismissed
    };

    const handleAppInstalled = () => {
      setShowButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For mobile, show floating button after some time regardless
    if (isMobileDevice) {
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (!dismissed || Date.now() - dismissedTime > oneDay) {
          setShowButton(true);
        }
      }, 20000); // Show after 20 seconds on mobile
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowButton(false);
    } else if (isMobile) {
      // For mobile devices without native prompt, show instructions
      alert('To install this app:\n\n• Safari (iOS): Tap Share → Add to Home Screen\n• Chrome (Android): Tap Menu → Install App or Add to Home Screen');
      setShowButton(false);
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }
  };

  if (!showButton) {
    return null;
  }

  return (
    <button 
      className={`pwa-floating-install ${isMobile ? 'mobile' : ''}`}
      onClick={handleInstallClick}
      title="Install Numix App"
      aria-label="Install Numix App"
    >
      <InstallIcon size={isMobile ? 28 : 24} />
      {isMobile && <span className="install-tooltip">Install App</span>}
    </button>
  );
};

export default PWAFloatingInstall; 