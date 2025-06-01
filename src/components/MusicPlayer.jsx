import React, { useState, useEffect } from 'react';
import spotifyManager from '../utils/spotifyManager';
import appleMusicManager from '../utils/appleMusicManager';

const MusicPlayer = () => {
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [appleMusicConnected, setAppleMusicConnected] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [error, setError] = useState(null);
  const [showServiceSelector, setShowServiceSelector] = useState(false);

  useEffect(() => {
    // Spotify event listeners
    const handleSpotifyConnection = (event) => {
      setSpotifyConnected(event.detail.isConnected);
      if (event.detail.isConnected) {
        setCurrentService('spotify');
        setCurrentTrack(event.detail.currentTrack);
        setIsPlaying(event.detail.isPlaying);
      } else if (currentService === 'spotify') {
        setCurrentService(null);
        setCurrentTrack(null);
        setIsPlaying(false);
      }
    };

    const handleSpotifyUpdate = (event) => {
      if (currentService === 'spotify') {
        setCurrentTrack(event.detail.currentTrack);
        setIsPlaying(event.detail.isPlaying);
        setVolume(event.detail.volume);
      }
    };

    const handleSpotifyError = (event) => {
      setError(`Spotify: ${event.detail.message}`);
      setTimeout(() => setError(null), 5000);
    };

    // Apple Music event listeners
    const handleAppleMusicConnection = (event) => {
      setAppleMusicConnected(event.detail.isConnected);
      if (event.detail.isConnected) {
        setCurrentService('appleMusic');
        setCurrentTrack(event.detail.currentTrack);
        setIsPlaying(event.detail.isPlaying);
      } else if (currentService === 'appleMusic') {
        setCurrentService(null);
        setCurrentTrack(null);
        setIsPlaying(false);
      }
    };

    const handleAppleMusicUpdate = (event) => {
      if (currentService === 'appleMusic') {
        setCurrentTrack(event.detail.currentTrack);
        setIsPlaying(event.detail.isPlaying);
        setVolume(event.detail.volume);
      }
    };

    const handleAppleMusicError = (event) => {
      setError(`Apple Music: ${event.detail.message}`);
      setTimeout(() => setError(null), 5000);
    };

    // Add event listeners
    window.addEventListener('spotifyConnectionChanged', handleSpotifyConnection);
    window.addEventListener('spotifyPlayerUpdate', handleSpotifyUpdate);
    window.addEventListener('spotifyError', handleSpotifyError);
    window.addEventListener('appleMusicConnectionChanged', handleAppleMusicConnection);
    window.addEventListener('appleMusicPlayerUpdate', handleAppleMusicUpdate);
    window.addEventListener('appleMusicError', handleAppleMusicError);

    // Get initial status
    const spotifyStatus = spotifyManager.getStatus();
    const appleMusicStatus = appleMusicManager.getStatus();
    
    setSpotifyConnected(spotifyStatus.isConnected);
    setAppleMusicConnected(appleMusicStatus.isConnected);
    
    if (spotifyStatus.isConnected) {
      setCurrentService('spotify');
      setCurrentTrack(spotifyStatus.currentTrack);
      setIsPlaying(spotifyStatus.isPlaying);
      setVolume(spotifyStatus.volume);
    } else if (appleMusicStatus.isConnected) {
      setCurrentService('appleMusic');
      setCurrentTrack(appleMusicStatus.currentTrack);
      setIsPlaying(appleMusicStatus.isPlaying);
      setVolume(appleMusicStatus.volume);
    }

    return () => {
      window.removeEventListener('spotifyConnectionChanged', handleSpotifyConnection);
      window.removeEventListener('spotifyPlayerUpdate', handleSpotifyUpdate);
      window.removeEventListener('spotifyError', handleSpotifyError);
      window.removeEventListener('appleMusicConnectionChanged', handleAppleMusicConnection);
      window.removeEventListener('appleMusicPlayerUpdate', handleAppleMusicUpdate);
      window.removeEventListener('appleMusicError', handleAppleMusicError);
    };
  }, [currentService]);

  const handleConnect = async (service) => {
    if (service === 'spotify') {
      spotifyManager.authenticate();
    } else if (service === 'appleMusic') {
      await appleMusicManager.authenticate();
    }
    setShowServiceSelector(false);
  };

  const handleDisconnect = () => {
    if (currentService === 'spotify') {
      spotifyManager.disconnect();
    } else if (currentService === 'appleMusic') {
      appleMusicManager.disconnect();
    }
    setCurrentService(null);
  };

  const handlePlayPause = () => {
    if (currentService === 'spotify') {
      spotifyManager.togglePlayback();
    } else if (currentService === 'appleMusic') {
      appleMusicManager.togglePlayback();
    }
  };

  const handleNext = () => {
    if (currentService === 'spotify') {
      spotifyManager.nextTrack();
    } else if (currentService === 'appleMusic') {
      appleMusicManager.nextTrack();
    }
  };

  const handlePrevious = () => {
    if (currentService === 'spotify') {
      spotifyManager.previousTrack();
    } else if (currentService === 'appleMusic') {
      appleMusicManager.previousTrack();
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (currentService === 'spotify') {
      spotifyManager.setVolume(newVolume);
    } else if (currentService === 'appleMusic') {
      appleMusicManager.setVolume(newVolume);
    }
  };

  const getTrackInfo = () => {
    if (!currentTrack) return null;
    
    if (currentService === 'spotify') {
      return {
        name: currentTrack.name,
        artist: currentTrack.artists?.[0]?.name,
        image: currentTrack.album?.images?.[0]?.url
      };
    } else if (currentService === 'appleMusic') {
      return {
        name: currentTrack.attributes?.name,
        artist: currentTrack.attributes?.artistName,
        image: currentTrack.attributes?.artwork?.url?.replace('{w}', '300').replace('{h}', '300')
      };
    }
    
    return null;
  };

  const getServiceIcon = (service) => {
    if (service === 'spotify') {
      return (
        <svg viewBox="0 0 24 24" className="music-service-icon">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      );
    } else if (service === 'appleMusic') {
      return (
        <svg viewBox="0 0 24 24" className="music-service-icon">
          <path d="M18.715 12.121A3.997 3.997 0 0 1 22 16a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4 3.997 3.997 0 0 1 3.285-3.879A6.5 6.5 0 0 1 12 6a6.5 6.5 0 0 1 6.715 6.121zM12 8a4.5 4.5 0 0 0-4.348 3.29l-.433 1.27L6 13a2 2 0 0 0-2 2 2 2 0 0 0 2 2h12a2 2 0 0 0 2-2 2 2 0 0 0-2-2l-1.219-.44-.433-1.27A4.5 4.5 0 0 0 12 8z"/>
          <path d="M8.5 15.5A.5.5 0 0 1 9 15h6a.5.5 0 0 1 0 1H9a.5.5 0 0 1-.5-.5z"/>
        </svg>
      );
    }
    return null;
  };

  if (error) {
    return (
      <div className="music-error">
        <span className="music-error-icon">⚠️</span>
        <span className="music-error-text">{error}</span>
      </div>
    );
  }

  // Show service selector if no service connected
  if (!currentService) {
    return (
      <div className="music-connect">
        <button 
          className="music-connect-btn"
          onClick={() => setShowServiceSelector(!showServiceSelector)}
          title="Connect Music Service"
        >
          <svg viewBox="0 0 24 24" className="music-icon">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
          Connect Music
        </button>
        
        {showServiceSelector && (
          <div className="music-service-selector">
            <div className="service-option" onClick={() => handleConnect('spotify')}>
              {getServiceIcon('spotify')}
              <span>Spotify</span>
            </div>
            {appleMusicManager.constructor.isSupported() && (
              <div className="service-option" onClick={() => handleConnect('appleMusic')}>
                {getServiceIcon('appleMusic')}
                <span>Apple Music</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const trackInfo = getTrackInfo();

  return (
    <div className="music-player">
      <div className="music-player-content">
        {/* Service indicator */}
        <div className="music-service-indicator">
          {getServiceIcon(currentService)}
        </div>

        {/* Track Info */}
        <div className="music-track-info">
          {trackInfo && (
            <>
              <div className="music-track-image">
                {trackInfo.image ? (
                  <img 
                    src={trackInfo.image} 
                    alt="Album cover"
                    className="music-album-cover"
                  />
                ) : (
                  <div className="music-album-placeholder">🎵</div>
                )}
              </div>
              <div className="music-track-details">
                <div className="music-track-name" title={trackInfo.name}>
                  {trackInfo.name}
                </div>
                <div className="music-track-artist" title={trackInfo.artist}>
                  {trackInfo.artist}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="music-controls">
          <button 
            className="music-control-btn"
            onClick={handlePrevious}
            title="Previous track"
          >
            <svg viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          
          <button 
            className="music-play-btn"
            onClick={handlePlayPause}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          
          <button 
            className="music-control-btn"
            onClick={handleNext}
            title="Next track"
          >
            <svg viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
        </div>

        {/* Volume */}
        <div className="music-volume">
          <svg viewBox="0 0 24 24" className="music-volume-icon">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="music-volume-slider"
          />
        </div>

        {/* Disconnect */}
        <button 
          className="music-disconnect-btn"
          onClick={handleDisconnect}
          title="Disconnect Music Service"
        >
          <svg viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MusicPlayer; 