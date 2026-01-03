import React from 'react';
import ViolationsList from './components/violations/ViolationsList';
import './App.css';

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Smart Municipal Parking</h1>
          <span className="navbar-subtitle">Enforcement System</span>
        </div>
        <div className="navbar-menu">
          <a href="#violations" className="nav-link active">
            Violations
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
