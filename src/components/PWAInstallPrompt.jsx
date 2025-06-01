import React, { useState, useEffect } from 'react';
import InstallIcon from './icons/InstallIcon';
import SparkleIcon from './icons/SparkleIcon';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install prompt
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
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
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Store in localStorage to not show again for a while
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if recently dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const oneWeek = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
      if (Date.now() - dismissedTime < oneWeek) {
        setShowInstallPrompt(false);
      }
    }
  }, []);

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-install-content">
        <div className="pwa-install-icon-container">
          <InstallIcon size={32} className="pwa-install-main-icon" />
          <SparkleIcon size={14} className="pwa-sparkle-1" />
          <SparkleIcon size={10} className="pwa-sparkle-2" />
          <SparkleIcon size={12} className="pwa-sparkle-3" />
        </div>
        <div className="pwa-install-text">
          <h3>
            Install Numix 
            <SparkleIcon size={16} className="pwa-title-sparkle" />
          </h3>
          <p>Get the full app experience with offline access, faster loading, and native app features!</p>
        </div>
        <div className="pwa-install-buttons">
          <button onClick={handleInstallClick} className="pwa-install-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Install App
          </button>
          <button onClick={handleDismiss} className="pwa-dismiss-btn">
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt; 