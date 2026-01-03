import React from 'react';
import { AlertTriangle, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const ViolationListItem = ({ violation, isRemoving = false, onViewDetails, onAcknowledge, onResolve }) => {
  const isCritical = violation.occupancy_percentage > 110;
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'status-open';
      case 'ACKNOWLEDGED':
        return 'status-acknowledged';
      case 'RESOLVED':
        return 'status-resolved';
      default:
        return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle size={16} />;
      case 'ACKNOWLEDGED':
        return <Clock size={16} />;
      case 'RESOLVED':
        return <CheckCircle size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className={`violation-card ${isCritical ? 'critical' : ''} ${isRemoving ? 'removing' : ''}`}>
      <div className="violation-header">
        <div className="violation-title">
          <MapPin size={20} className="icon-primary" />
          <h3>{violation.parking_lot?.name || `Lot #${violation.parking_lot_id}`}</h3>
          {isCritical && (
            <span className="critical-badge">
              <AlertTriangle size={14} />
              CRITICAL
            </span>
          )}
        </div>
        <span className={`violation-status ${getStatusColor(violation.status)}`}>
          {getStatusIcon(violation.status)}
          {violation.status}
        </span>
      </div>

      <div className="violation-body">
        <div className="violation-info">
          <div className="info-item">
            <span className="info-label">Location:</span>
            <span className="info-value">{violation.parking_lot?.location || 'N/A'}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Occupancy:</span>
            <span className={`info-value occupancy ${isCritical ? 'critical' : ''}`}>
              {violation.occupancy_percentage.toFixed(1)}% 
              <span className="occupancy-detail">
                ({violation.occupancy_count}/{violation.legal_capacity} spots)
              </span>
            </span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Detected:</span>
            <span className="info-value">
              {format(new Date(violation.detected_at), 'MMM dd, yyyy HH:mm')}
            </span>
          </div>
        </div>

        <div className="violation-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => onViewDetails(violation)}
          >
            View Details
          </button>
          
          {violation.status === 'OPEN' && (
            <button 
              className="btn btn-warning"
              onClick={() => onAcknowledge(violation.id)}
            >
              Acknowledge
            </button>
          )}
          
          {(violation.status === 'OPEN' || violation.status === 'ACKNOWLEDGED') && (
            <button 
              className="btn btn-success"
              onClick={() => onResolve(violation.id)}
            >
              Mark Resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViolationListItem;
