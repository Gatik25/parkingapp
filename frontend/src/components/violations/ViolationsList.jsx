import React, { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useViolations } from '../../hooks/useViolations';
import ViolationListItem from './ViolationListItem';
import ViolationDetailsModal from './ViolationDetailsModal';
import ViolationFilters from './ViolationFilters';

const ViolationsList = () => {
  const [filters, setFilters] = useState({
    status: 'OPEN',
    lot_id: null,
    sort_by: 'newest',
    from_date: null,
    to_date: null,
  });
  
  const [selectedViolation, setSelectedViolation] = useState(null);
  
  const { 
    violations, 
    total, 
    loading, 
    error, 
    openCount, 
    criticalCount,
    removingViolationIds,
    refetch, 
    updateViolation 
  } = useViolations(filters);

  const handleViewDetails = (violation) => {
    setSelectedViolation(violation);
  };

  const handleCloseModal = () => {
    setSelectedViolation(null);
  };

  const handleAcknowledge = async (violationId) => {
    try {
      await updateViolation(violationId, { 
        status: 'ACKNOWLEDGED',
        acknowledged_by: 'Admin User'
      });
    } catch (error) {
      console.error('Failed to acknowledge violation:', error);
    }
  };

  const handleResolve = async (violationId) => {
    try {
      await updateViolation(violationId, { 
        status: 'RESOLVED',
        resolved_by: 'Admin User'
      });
    } catch (error) {
      console.error('Failed to resolve violation:', error);
    }
  };

  return (
    <div className="violations-container">
      <div className="violations-header">
        <div className="header-title">
          <AlertTriangle size={32} className="icon-primary" />
          <div>
            <h1>Real-Time Violation Monitoring</h1>
            <p className="subtitle">Monitor and manage parking capacity violations</p>
          </div>
        </div>
        
        <button className="btn btn-primary refresh-btn" onClick={refetch}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="violations-stats">
        <div className="stat-card open">
          <span className="stat-label">Open Violations</span>
          <span className="stat-value">{openCount}</span>
        </div>
        
        <div className="stat-card critical">
          <span className="stat-label">Critical (>110%)</span>
          <span className="stat-value">{criticalCount}</span>
        </div>
        
        <div className="stat-card total">
          <span className="stat-label">Total Showing</span>
          <span className="stat-value">{total}</span>
        </div>
      </div>

      <ViolationFilters filters={filters} onFiltersChange={setFilters} />

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading violations...</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <AlertTriangle size={24} />
          <p>Error loading violations: {error}</p>
          <button className="btn btn-primary" onClick={refetch}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && violations.length === 0 && (
        <div className="empty-state">
          <AlertTriangle size={48} className="empty-icon" />
          <h3>No Violations Found</h3>
          <p>There are no violations matching your current filters.</p>
        </div>
      )}

      {!loading && !error && violations.length > 0 && (
        <div className="violations-list">
          {violations.map((violation) => (
            <ViolationListItem
              key={violation.id}
              violation={violation}
              isRemoving={removingViolationIds.includes(violation.id)}
              onViewDetails={handleViewDetails}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
            />
          ))}
        </div>
      )}

      {selectedViolation && (
        <ViolationDetailsModal
          violation={selectedViolation}
          onClose={handleCloseModal}
          onUpdate={updateViolation}
        />
      )}
    </div>
  );
};

export default ViolationsList;
