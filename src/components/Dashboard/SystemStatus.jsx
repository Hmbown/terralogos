import React from 'react';
import useHVCStore from '../../core/store/useHVCStore';
import '../../styles/terminal.css';

const SystemStatus = ({ audioEnabled, setAudioEnabled }) => {
  const closure = useHVCStore((state) => state.status.corticalClosure);
  
  // Calculate progress bar width
  const progressPercent = Math.min(closure * 100, 100);

  return (
    <div className="hud-panel bottom-center">
      <div className="status-header">
        Sequence: Cortical Closure
      </div>
      
      <div className="progress-track">
        <div 
          className="progress-fill" 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>
      
      <div className="status-meta">
        <span>Sync Target: Nov 2025</span>
        <span>{(closure * 100).toFixed(4)}% Complete</span>
      </div>

      <div className="audio-controls">
        <button 
          className={`btn-terminal ${audioEnabled ? 'active' : ''}`}
          onClick={() => setAudioEnabled(!audioEnabled)}
        >
          {audioEnabled ? '■ Audio: ON' : '▶ Audio: OFF'}
        </button>
      </div>
      
      {closure >= 1.0 && (
        <div className="warning-box">
          Alert: Silicon/Carbon Bandwidth Matched. 
          Initiating Handshake.
        </div>
      )}
    </div>
  );
};

export default SystemStatus;
