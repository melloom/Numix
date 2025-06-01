import React, { useState, useEffect } from 'react';
import InstallIcon from './icons/InstallIcon';

const PWAFloatingInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show floating button after the banner is dismissed or after a delay
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
          setShowButton(true);
        }
      }, 10000); // Show after 10 seconds if banner was dismissed
    };

    const handleAppInstalled = () => {
      setShowButton(false);
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
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowButton(false);
    }
  };

  if (!showButton || !deferredPrompt) {
    return null;
  }

  return (
    <button 
      className="pwa-floating-install"
      onClick={handleInstallClick}
      title="Install Numix App"
      aria-label="Install Numix App"
    >
      <InstallIcon size={24} />
    </button>
  );
};

export default PWAFloatingInstall; 