import React, { useEffect, useState } from 'react';
import useHVCStore from '../../core/store/useHVCStore';
import '../../styles/terminal.css';

const TelemetryPanel = () => {
  const metrics = useHVCStore((state) => state.metrics);
  
  // Local oscillation for "Live Data" feel without churning global state
  const [jitter, setJitter] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setJitter(Math.random() * 0.5);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hud-panel top-left">
      <div className="hud-header">
        <span className="blink"></span>
        <span>System Telemetry</span>
      </div>
      
      <div className="data-grid">
        {/* Core Logic Metric */}
        <div className="data-row">
          <label>Core MHD Load</label>
          <value>{(metrics.coreLoad * 100 + jitter).toFixed(2)}%</value>
        </div>
        {/* Mantle Bus Metric */}
        <div className="data-row">
          <label>Alfvén Bus Velocity</label>
          <value>{(metrics.mantleBandwidth + jitter * 10).toFixed(0)} km/s</value>
        </div>
        {/* Atmosphere Metric */}
        <div className="data-row">
          <label>Atmosphere CO₂</label>
          <value>{metrics.atmosphere.co2} ppm</value>
        </div>
        <div className="data-row">
          <label>Thermal Dissipation</label>
          <value style={{ color: metrics.crustTemp > 300 ? '#ff6b45' : 'inherit' }}>
            {metrics.crustTemp.toFixed(1)} K
          </value>
        </div>
        {/* Solar Metrics (Expanded) */}
        <div className="data-row">
          <label>Solar Flare Class</label>
          <value style={{ color: metrics.solar.class.startsWith('X') ? '#ff6b45' : metrics.solar.class.startsWith('M') ? '#ffaa00' : 'inherit' }}>
            {metrics.solar.class} ({metrics.solar.flux.toExponential(1)})
          </value>
        </div>
        <div className="data-row">
          <label>Solar Wind Speed</label>
          <value>{metrics.solar.windSpeed} km/s</value>
        </div>
        <div className="data-row">
          <label>Proton Storm Level</label>
          <value style={{ color: metrics.solar.protonLevel !== 'None' ? '#ff6b45' : 'inherit' }}>
            {metrics.solar.protonLevel}
          </value>
        </div>
        {/* Seismic Event */}
        <div className="data-row">
          <label>Last Seismic Event</label>
          <value style={{ fontSize: '0.85rem', textAlign: 'right', lineHeight: '1.3' }}>
            {metrics.lastSeismicEvent.label}
          </value>
        </div>
      </div>
      <div className="hud-footer">
        <div>HVCS_ID: TERRA_01</div>
        <div>LATENCY: {(1000 / 60).toFixed(1)}ms</div>
      </div>
    </div>
  );
};

export default TelemetryPanel;
