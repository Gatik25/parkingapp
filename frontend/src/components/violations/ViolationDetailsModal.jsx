import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, AlertTriangle, FileText, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { parkingLotsAPI } from '../../services/api';

const ViolationDetailsModal = ({ violation, onClose, onUpdate }) => {
  const [notes, setNotes] = useState(violation.notes || '');
  const [occupancyHistory, setOccupancyHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchOccupancyHistory = async () => {
      try {
        setLoadingHistory(true);
        const response = await parkingLotsAPI.getOccupancyHistory(violation.parking_lot_id, 24);
        const chartData = response.data.history.map(point => ({
          time: format(new Date(point.timestamp), 'HH:mm'),
          occupancy: point.occupancy_percentage,
        }));
        setOccupancyHistory(chartData);
      } catch (error) {
        console.error('Failed to fetch occupancy history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchOccupancyHistory();
  }, [violation.parking_lot_id]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        notes: notes || violation.notes,
      };
      
      if (newStatus === 'ACKNOWLEDGED') {
        updateData.acknowledged_by = 'Admin User';
      } else if (newStatus === 'RESOLVED') {
        updateData.resolved_by = 'Admin User';
      }
      
      await onUpdate(violation.id, updateData);
      onClose();
    } catch (error) {
      console.error('Failed to update violation:', error);
    }
  };

  const handleAddNote = async () => {
    try {
      await onUpdate(violation.id, { notes });
      alert('Note added successfully');
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const isCritical = violation.occupancy_percentage > 110;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <AlertTriangle size={24} className={isCritical ? 'text-critical' : 'text-warning'} />
            <h2>Violation Details</h2>
            {isCritical && <span className="critical-badge">CRITICAL</span>}
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="details-section">
            <h3>Parking Lot Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <MapPin size={18} />
                <div>
                  <span className="detail-label">Lot Name</span>
                  <span className="detail-value">{violation.parking_lot?.name || `Lot #${violation.parking_lot_id}`}</span>
                </div>
              </div>
              
              <div className="detail-item">
                <MapPin size={18} />
                <div>
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{violation.parking_lot?.location || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3>Violation Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <AlertTriangle size={18} />
                <div>
                  <span className="detail-label">Occupancy</span>
                  <span className={`detail-value ${isCritical ? 'text-critical' : 'text-warning'}`}>
                    {violation.occupancy_percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Current / Legal Capacity</span>
                <span className="detail-value">
                  {violation.occupancy_count} / {violation.legal_capacity} spots
                </span>
              </div>
              
              <div className="detail-item">
                <Calendar size={18} />
                <div>
                  <span className="detail-label">Detected At</span>
                  <span className="detail-value">
                    {format(new Date(violation.detected_at), 'MMM dd, yyyy HH:mm:ss')}
                  </span>
                </div>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className={`detail-value status-badge status-${violation.status.toLowerCase()}`}>
                  {violation.status}
                </span>
              </div>
            </div>
            
            {violation.acknowledged_at && (
              <div className="detail-item">
                <span className="detail-label">Acknowledged At</span>
                <span className="detail-value">
                  {format(new Date(violation.acknowledged_at), 'MMM dd, yyyy HH:mm:ss')}
                  {violation.acknowledged_by && ` by ${violation.acknowledged_by}`}
                </span>
              </div>
            )}
            
            {violation.resolved_at && (
              <div className="detail-item">
                <span className="detail-label">Resolved At</span>
                <span className="detail-value">
                  {format(new Date(violation.resolved_at), 'MMM dd, yyyy HH:mm:ss')}
                  {violation.resolved_by && ` by ${violation.resolved_by}`}
                </span>
              </div>
            )}
          </div>

          <div className="details-section">
            <h3>24-Hour Occupancy History</h3>
            {loadingHistory ? (
              <div className="loading">Loading chart...</div>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={occupancyHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis label={{ value: 'Occupancy %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <ReferenceLine y={100} stroke="#fbbf24" strokeDasharray="3 3" label="Legal Capacity" />
                    <ReferenceLine y={110} stroke="#ef4444" strokeDasharray="3 3" label="Critical" />
                    <Line type="monotone" dataKey="occupancy" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {violation.evidence_report_url && (
            <div className="details-section">
              <h3>
                <FileText size={18} />
                Evidence Report
              </h3>
              <a href={violation.evidence_report_url} target="_blank" rel="noopener noreferrer" className="evidence-link">
                View Evidence Report
              </a>
            </div>
          )}

          {violation.photo_evidence_url && (
            <div className="details-section">
              <h3>
                <ImageIcon size={18} />
                Photo Evidence
              </h3>
              <img src={violation.photo_evidence_url} alt="Evidence" className="evidence-photo" />
            </div>
          )}

          <div className="details-section">
            <h3>Notes / Comments</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes or comments about this violation..."
              className="notes-textarea"
              rows={4}
            />
            <button className="btn btn-secondary" onClick={handleAddNote}>
              Save Note
            </button>
          </div>
        </div>

        <div className="modal-footer">
          {violation.status === 'OPEN' && (
            <button 
              className="btn btn-warning"
              onClick={() => handleUpdateStatus('ACKNOWLEDGED')}
            >
              Acknowledge Violation
            </button>
          )}
          
          {(violation.status === 'OPEN' || violation.status === 'ACKNOWLEDGED') && (
            <button 
              className="btn btn-success"
              onClick={() => handleUpdateStatus('RESOLVED')}
            >
              Mark as Resolved
            </button>
          )}
          
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViolationDetailsModal;
