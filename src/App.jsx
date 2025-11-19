import React from 'react';
import MainDashboard from './components/Dashboard/MainDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/terminal.css';

const App = () => {
  return (
    <ErrorBoundary>
      <MainDashboard />
    </ErrorBoundary>
  );
};

export default App;
