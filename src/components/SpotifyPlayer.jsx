import React, { useState, useEffect } from 'react';
import spotifyManager from '../utils/spotifyManager';

const SpotifyPlayer = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen for Spotify events
    const handleConnectionChange = (event) => {
      setIsConnected(event.detail.isConnected);
      setCurrentTrack(event.detail.currentTrack);
      setIsPlaying(event.detail.isPlaying);
      setShowPlayer(event.detail.isConnected);
    };

    const handlePlayerUpdate = (event) => {
      setCurrentTrack(event.detail.currentTrack);
      setIsPlaying(event.detail.isPlaying);
      setVolume(event.detail.volume);
    };

    const handleError = (event) => {
      setError(event.detail.message);
      setTimeout(() => setError(null), 5000);
    };

    window.addEventListener('spotifyConnectionChanged', handleConnectionChange);
    window.addEventListener('spotifyPlayerUpdate', handlePlayerUpdate);
    window.addEventListener('spotifyError', handleError);

    // Get initial status
    const status = spotifyManager.getStatus();
    setIsConnected(status.isConnected);
    setCurrentTrack(status.currentTrack);
    setIsPlaying(status.isPlaying);
    setVolume(status.volume);
    setShowPlayer(status.isConnected);

    return () => {
      window.removeEventListener('spotifyConnectionChanged', handleConnectionChange);
      window.removeEventListener('spotifyPlayerUpdate', handlePlayerUpdate);
      window.removeEventListener('spotifyError', handleError);
    };
  }, []);

  const handleConnect = () => {
    spotifyManager.authenticate();
  };

  const handleDisconnect = () => {
    spotifyManager.disconnect();
    setShowPlayer(false);
  };

  const handlePlayPause = () => {
    spotifyManager.togglePlayback();
  };

  const handleNext = () => {
    spotifyManager.nextTrack();
  };

  const handlePrevious = () => {
    spotifyManager.previousTrack();
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    spotifyManager.setVolume(newVolume);
  };

  if (error) {
    return (
      <div className="spotify-error">
        <span className="spotify-error-icon">⚠️</span>
        <span className="spotify-error-text">{error}</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="spotify-connect">
        <button 
          className="spotify-connect-btn"
          onClick={handleConnect}
          title="Connect to Spotify"
        >
          <svg viewBox="0 0 24 24" className="spotify-icon">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Connect
        </button>
      </div>
    );
  }

  if (!showPlayer) return null;

  return (
    <div className="spotify-player">
      <div className="spotify-player-content">
        {/* Track Info */}
        <div className="spotify-track-info">
          {currentTrack && (
            <>
              <div className="spotify-track-image">
                {currentTrack.album?.images?.[0] ? (
                  <img 
                    src={currentTrack.album.images[0].url} 
                    alt="Album cover"
                    className="spotify-album-cover"
                  />
                ) : (
                  <div className="spotify-album-placeholder">🎵</div>
                )}
              </div>
              <div className="spotify-track-details">
                <div className="spotify-track-name" title={currentTrack.name}>
                  {currentTrack.name}
                </div>
                <div className="spotify-track-artist" title={currentTrack.artists?.[0]?.name}>
                  {currentTrack.artists?.[0]?.name}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="spotify-controls">
          <button 
            className="spotify-control-btn"
            onClick={handlePrevious}
            title="Previous track"
          >
            <svg viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          
          <button 
            className="spotify-play-btn"
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
            className="spotify-control-btn"
            onClick={handleNext}
            title="Next track"
          >
            <svg viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
        </div>

        {/* Volume */}
        <div className="spotify-volume">
          <svg viewBox="0 0 24 24" className="spotify-volume-icon">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="spotify-volume-slider"
          />
        </div>

        {/* Disconnect */}
        <button 
          className="spotify-disconnect-btn"
          onClick={handleDisconnect}
          title="Disconnect Spotify"
        >
          <svg viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SpotifyPlayer; 