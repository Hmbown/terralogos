import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import { createXRStore, XR } from '@react-three/xr';
import useHVCStore, { useMockDataGenerator } from '../../core/store/useHVCStore';
import { useEarthVoice } from '../../core/hooks/useEarthVoice';

// 3D Components
import EarthGlobe from '../Hardware/EarthBase/EarthGlobe';
import GridLines from '../Hardware/EarthBase/GridLines';
import PlasmaTopology from '../Hardware/CoreMHD/PlasmaTopology';
import WaveGuide from '../Hardware/MantleBus/WaveGuide';
import PiezoHead from '../Hardware/CrustInterface/PiezoHead';
import SeismicMarker from '../Hardware/CrustInterface/SeismicMarker';
import VolcanicVents from '../Hardware/CrustInterface/VolcanicVents';
import IonosphereCooling from '../Hardware/AtmosphereSink/IonosphereCooling';
import AuroraBorealis from '../Hardware/EarthBase/AuroraBorealis';
import ISSTracker from '../Hardware/EarthBase/ISSTracker';
import SolarFlareRing from '../Hardware/EarthBase/SolarFlareRing';
import SolarWindParticles from '../Hardware/EarthBase/SolarWindParticles';
import ResonanceChamber from '../Hardware/Audio/ResonanceChamber';

// Dashboard Components
import LiveDataPanel from './LiveDataPanel';
import TemporalMemory from './TemporalMemory';
import AboutPage from './AboutPage';
import MobileNav from '../Navigation/MobileNav';

import '../../styles/dashboard.css';

const store = createXRStore();

const TerraLogosSystem = () => {
  const metrics = useHVCStore((state) => state.data.metrics);
  const isStale = useHVCStore((state) => state.data.isStale);
  const isFlare = metrics.solar?.class === 'M' || metrics.solar?.class === 'X';
  const flareColor = isFlare ? '#ffaa00' : '#ffffff';

  return (
    <group>
        {/* Stale data visual indicator: desaturate/dim entire system */}
        {isStale && (
             <fog attach="fog" args={['#000000', 5, 25]} />
        )}

      {/* Base Earth Globe - provides geographic context */}
      <EarthGlobe radius={4.2} />

      {/* Grid lines for orientation */}
      <GridLines radius={4.25} />

      {/* Core and Mantle layers (internal, visible through transparency) */}
      <PlasmaTopology
        systemLoad={metrics.coreLoad || 0}
        radius={2.5}
      />

      {/* Solar Direction Indicator (Conceptual) */}
      {isFlare && (
        <pointLight position={[100, 20, 0]} intensity={5} color={flareColor} distance={500} />
      )}
      <WaveGuide
        busLoad={(metrics.mantleBandwidth || 0) / 1000}
        coreRadius={2.5}
        mantleDepth={1.5}
      />

      {/* Crust layer with seismic activity */}
      <PiezoHead
        mantleRadius={4.0}
        crustDepth={0.2}
      />

      {/* Surface features */}
      <SeismicMarker />
      <VolcanicVents />

      {/* Atmosphere layer */}
      <IonosphereCooling
        systemTemp={metrics.crustTemp || 288}
        crustRadius={4.2}
        atmosphereDepth={0.6}
      />

      {/* Auroral Emissions */}
      <AuroraBorealis radius={4.25} />

      {/* Satellite Tracking */}
      <ISSTracker />

      {/* Solar Activity Visualizations */}
      <SolarFlareRing earthRadius={4.2} />
      <SolarWindParticles count={1000} earthRadius={4.2} />
    </group>
  );
};

const EarthVisualization = ({ audioEnabled, setAudioEnabled }) => {
  const isStale = useHVCStore((state) => state.data.isStale);

  return (
    <div className="earth-visualization-container">
      {isStale && <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#888',
          background: 'rgba(0,0,0,0.8)',
          padding: '5px 10px',
          borderRadius: '4px',
          zIndex: 10,
          border: '1px solid #444'
      }}>DATA STALE - CONNECTING...</div>}
      <ResonanceChamber active={audioEnabled} />
      <Canvas gl={{ antialias: true, alpha: false }}>
        <XR store={store}>
          <color attach="background" args={['#000000']} />
          <Stars
            radius={300}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade speed={1}
          />
          <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={45} />
          <OrbitControls
            enablePan={false}
            minDistance={6}
            maxDistance={20}
            rotateSpeed={0.5}
          />
          <ambientLight intensity={0.05} color="#001133" />
          <directionalLight
            position={[10, 0, 5]}
            intensity={1.5}
            color="#ffffff"
          />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#0044ff" />
          <Suspense fallback={null}>
            <TerraLogosSystem />
          </Suspense>
        </XR>
      </Canvas>
      <div className="globe-controls">
        <button
          className="audio-toggle"
          onClick={() => setAudioEnabled(!audioEnabled)}
        >
          {audioEnabled ? '■ Mute Earth Voice' : '▶ Enable Earth Voice'}
        </button>
        <button
          className="xr-toggle"
          onClick={() => store.enterVR()}
          style={{ marginLeft: '10px', padding: '8px 16px', background: '#440088', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Enter VR
        </button>
        {!audioEnabled && (
          <p className="audio-hint">Headphones recommended. Audio starts after you click.</p>
        )}
      </div>
    </div>
  );
};

const MainDashboard = () => {
  useEarthVoice();
  const viewMode = useHVCStore((state) => state.ui.viewMode);
  const setViewMode = useHVCStore((state) => state.actions.setViewMode);

  const isMockMode = useHVCStore((state) => state.ui.isMockMode);
  const setMockMode = useHVCStore((state) => state.actions.setMockMode);
  const checkStaleness = useHVCStore((state) => state.actions.checkStaleness);
  const triggerMockEvent = useHVCStore((state) => state.actions.triggerMockEvent);

  const [audioEnabled, setAudioEnabled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Use the mock data generator if mock mode is enabled
  useMockDataGenerator(isMockMode);

  // Check for staleness periodically
  useEffect(() => {
    const interval = setInterval(checkStaleness, 60000);
    return () => clearInterval(interval);
  }, [checkStaleness]);

  // Toggle mock mode with keyboard shortcut (Ctrl+Shift+M)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        setMockMode(!isMockMode);
        console.log(`Mock Mode ${!isMockMode ? 'Enabled' : 'Disabled'}`);
      }
      // Triggers for demo
      if (isMockMode && e.shiftKey && e.key === 'F') {
          triggerMockEvent('flare-X');
      }
      if (isMockMode && e.shiftKey && e.key === 'Q') {
          triggerMockEvent('quake-9');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMockMode, setMockMode, triggerMockEvent]);

  const renderContent = () => {
    switch (viewMode) {
      case 'history':
        return <TemporalMemory />;
      case 'about':
        return <AboutPage />;
      case 'live':
      default:
        return <LiveDataPanel />;
    }
  };

  return (
    <div className="main-dashboard">
      <MobileNav
        viewMode={viewMode}
        setViewMode={setViewMode}
        isOpen={mobileMenuOpen}
        setIsOpen={setMobileMenuOpen}
      />

      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Terra-Logos {isMockMode && <span style={{fontSize: '0.5em', color: '#ffaa00'}}>[SIMULATION]</span>}</h1>
          <nav className="dashboard-nav">
            <button
              className={`nav-button ${viewMode === 'live' ? 'active' : ''}`}
              onClick={() => setViewMode('live')}
            >
              Live Data
            </button>
            <button
              className={`nav-button ${viewMode === 'history' ? 'active' : ''}`}
              onClick={() => setViewMode('history')}
            >
              Temporal Memory
            </button>
            <button
              className={`nav-button ${viewMode === 'about' ? 'active' : ''}`}
              onClick={() => setViewMode('about')}
            >
              About
            </button>
          </nav>
          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>

      <div className="dashboard-body">
        {viewMode === 'about' ? (
          renderContent()
        ) : (
          <div className="dashboard-split">
            <div className="dashboard-left">
              <EarthVisualization
                audioEnabled={audioEnabled}
                setAudioEnabled={setAudioEnabled}
              />
            </div>
            <div className="dashboard-right">
              {renderContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainDashboard;
