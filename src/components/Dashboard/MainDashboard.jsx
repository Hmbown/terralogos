import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import useHVCStore from '../../core/store/useHVCStore';
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
import ResonanceChamber from '../Hardware/Audio/ResonanceChamber';

// Dashboard Components
import LiveDataPanel from './LiveDataPanel';
import TemporalMemory from './TemporalMemory';
import AboutPage from './AboutPage';
import MobileNav from '../Navigation/MobileNav';

import '../../styles/dashboard.css';

const TerraLogosSystem = () => {
  const metrics = useHVCStore((state) => state.metrics);

  return (
    <group>
      {/* Base Earth Globe - provides geographic context */}
      <EarthGlobe radius={4.2} />
      
      {/* Grid lines for orientation */}
      <GridLines radius={4.25} />
      
      {/* Core and Mantle layers (internal, visible through transparency) */}
      <PlasmaTopology 
        systemLoad={metrics.coreLoad || 0} 
        radius={2.5} 
      />
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
    </group>
  );
};

const EarthVisualization = ({ audioEnabled, setAudioEnabled }) => {
  return (
    <div className="earth-visualization-container">
      <ResonanceChamber active={audioEnabled} />
      <Canvas gl={{ antialias: true, alpha: false }}>
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
      </Canvas>
      <div className="globe-controls">
        <button 
          className="audio-toggle"
          onClick={() => setAudioEnabled(!audioEnabled)}
        >
          {audioEnabled ? '■ Mute Earth Voice' : '▶ Enable Earth Voice'}
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
  const viewMode = useHVCStore((state) => state.viewMode);
  const setViewMode = useHVCStore((state) => state.setViewMode);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <h1 className="dashboard-title">Terra-Logos</h1>
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

