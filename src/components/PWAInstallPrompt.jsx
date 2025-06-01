import React, { useState, useEffect } from 'react';
import InstallIcon from './icons/InstallIcon';
import SparkleIcon from './icons/SparkleIcon';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      console.log('Mobile device detected:', mobile);
      console.log('User agent:', navigator.userAgent);
      return mobile;
    };

    const isMobileDevice = checkMobile();

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install prompt
      setShowInstallPrompt(true);
      console.log('PWA install prompt ready');
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for test force prompt
    const handleForcePWAPrompt = () => {
      console.log('Force PWA prompt triggered');
      setShowInstallPrompt(true);
    };
    
    window.addEventListener('force-pwa-prompt', handleForcePWAPrompt);

    // For mobile devices, show install prompt after a delay if not dismissed recently
    if (isMobileDevice) {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const oneDay = 24 * 60 * 60 * 1000; // 1 day in milliseconds
      
      console.log('Mobile device - checking dismiss status:', { dismissed, dismissedTime });
      
      if (!dismissed || Date.now() - dismissedTime > oneDay) {
        console.log('Scheduling mobile PWA prompt in 3 seconds...');
        setTimeout(() => {
          // Force show prompt on mobile for testing
          setShowInstallPrompt(true);
          console.log('Showing mobile PWA prompt NOW');
        }, 3000); // Show after 3 seconds on mobile
      } else {
        console.log('PWA prompt dismissed recently, not showing');
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('force-pwa-prompt', handleForcePWAPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } else if (isMobile) {
      // For mobile devices without native prompt, show instructions
      alert('To install this app:\n\n• Safari (iOS): Tap Share → Add to Home Screen\n• Chrome (Android): Tap Menu → Install App or Add to Home Screen');
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Store in localStorage to not show again for a while
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if recently dismissed (except for forced mobile show)
  useEffect(() => {
    if (!isMobile) {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const oneWeek = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
        if (Date.now() - dismissedTime < oneWeek) {
          setShowInstallPrompt(false);
        }
      }
    }
  }, [isMobile]);

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-install-content">
        <div className="pwa-install-icon-container">
          <InstallIcon size={isMobile ? 28 : 32} className="pwa-install-main-icon" />
          <SparkleIcon size={14} className="pwa-sparkle-1" />
          <SparkleIcon size={10} className="pwa-sparkle-2" />
          <SparkleIcon size={12} className="pwa-sparkle-3" />
        </div>
        <div className="pwa-install-text">
          <h3>
            Install Numix 
            <SparkleIcon size={16} className="pwa-title-sparkle" />
          </h3>
          <p>{isMobile ? 'Add to your home screen for quick access!' : 'Get the full app experience with offline access, faster loading, and native app features!'}</p>
        </div>
        <div className="pwa-install-buttons">
          <button onClick={handleInstallClick} className="pwa-install-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {isMobile ? 'Add to Home' : 'Install App'}
          </button>
          <button onClick={handleDismiss} className="pwa-dismiss-btn">
            {isMobile ? 'Not Now' : 'Maybe Later'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt; 