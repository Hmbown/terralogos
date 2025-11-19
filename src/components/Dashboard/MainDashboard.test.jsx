import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MainDashboard from './MainDashboard';

// Mock the hooks
vi.mock('../../core/hooks/useEarthVoice', () => ({
  useEarthVoice: () => {}
}));

vi.mock('../../core/store/useHVCStore', () => ({
  default: (selector) => {
    const state = {
      metrics: {},
      viewMode: 'live',
      setViewMode: vi.fn(),
    };
    return selector(state);
  }
}));

// Mock Canvas and hooks
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => <div data-testid="canvas-mock">{children}</div>,
  useFrame: () => {},
  useLoader: () => [],
  useThree: () => ({ gl: { capabilities: { getMaxAnisotropy: () => 8 } } }),
  extend: () => {},
}));

// Mock Drei components
vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Stars: () => null,
  PerspectiveCamera: () => null,
  shaderMaterial: () => class {},
}));

// Mock XR
vi.mock('@react-three/xr', () => ({
  createXRStore: () => ({ enterVR: vi.fn() }),
  XR: ({ children }) => <div data-testid="xr-mock">{children}</div>,
}));

// Mock child components
vi.mock('../Hardware/EarthBase/EarthGlobe', () => ({ default: () => <div data-testid="earth-globe">Earth Globe</div> }));
vi.mock('../Hardware/EarthBase/GridLines', () => ({ default: () => null }));

vi.mock('./LiveDataPanel', () => ({
  default: () => <div data-testid="live-data-panel">Live Data Panel</div>
}));

vi.mock('./TemporalMemory', () => ({
  default: () => <div>Temporal Memory</div>
}));

vi.mock('./AboutPage', () => ({
  default: () => <div>About Page</div>
}));

vi.mock('../Navigation/MobileNav', () => ({
  default: ({ isOpen }) => isOpen ? <div>Mobile Nav Open</div> : <div>Mobile Nav Closed</div>
}));

// Mock the 3D system components to be safe
vi.mock('../Hardware/CoreMHD/PlasmaTopology', () => ({ default: () => null }));
vi.mock('../Hardware/MantleBus/WaveGuide', () => ({ default: () => null }));
vi.mock('../Hardware/CrustInterface/PiezoHead', () => ({ default: () => null }));
vi.mock('../Hardware/CrustInterface/VolcanicVents', () => ({ default: () => null }));
vi.mock('../Hardware/AtmosphereSink/IonosphereCooling', () => ({ default: () => null }));
vi.mock('../Hardware/EarthBase/AuroraBorealis', () => ({ default: () => null }));
vi.mock('../Hardware/Audio/ResonanceChamber', () => ({ default: () => null }));

describe('MainDashboard', () => {
  it('renders the dashboard title', () => {
    render(<MainDashboard />);
    expect(screen.getByText('Terra-Logos')).toBeInTheDocument();
  });

  it('renders the navigation buttons', () => {
    render(<MainDashboard />);
    // Using getAllByText because mobile nav might duplicate text
    expect(screen.getAllByText('Live Data')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Temporal Memory')[0]).toBeInTheDocument();
    expect(screen.getAllByText('About')[0]).toBeInTheDocument();
  });

  it('defaults to showing the Live Data view', () => {
    render(<MainDashboard />);
    expect(screen.getByTestId('live-data-panel')).toBeInTheDocument();
  });
  
  it('shows audio toggle control', () => {
    render(<MainDashboard />);
    expect(screen.getByText(/Enable Earth Voice/i)).toBeInTheDocument();
  });
});
