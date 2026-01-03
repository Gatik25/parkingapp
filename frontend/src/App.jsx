import React from 'react';
import ViolationsList from './components/violations/ViolationsList';
import { useViolationCounts } from './hooks/useViolationCounts';
import './App.css';

function App() {
  const { openCount, criticalCount } = useViolationCounts();

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Smart Municipal Parking</h1>
          <span className="navbar-subtitle">Enforcement System</span>
        </div>
        <div className="navbar-menu">
          <a
            href="#violations"
            className={`nav-link active ${criticalCount > 0 ? 'has-critical' : ''}`}
          >
            Violations
            {openCount > 0 && <span className="nav-badge">{openCount}</span>}
          </a>
        </div>
      </nav>

      <main className="main-content">
        <ViolationsList />
      </main>
    </div>
  );
}

export default App;
