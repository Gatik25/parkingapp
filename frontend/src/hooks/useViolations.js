import { useState, useEffect, useCallback } from 'react';
import { violationsAPI } from '../services/api';
import { websocketService } from '../services/websocket';

export const useViolations = (filters = {}) => {
  const [violations, setViolations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openCount, setOpenCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);

  const fetchViolations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await violationsAPI.getViolations(filters);
      setViolations(response.data.violations);
      setTotal(response.data.total);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch violations:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchViolationsCount = useCallback(async () => {
    try {
      const response = await violationsAPI.getViolationsCount();
      setOpenCount(response.data.open_violations);
      setCriticalCount(response.data.critical_violations);
    } catch (err) {
      console.error('Failed to fetch violations count:', err);
    }
  }, []);

  const updateViolation = async (violationId, updateData) => {
    try {
      const response = await violationsAPI.updateViolation(violationId, updateData);
      setViolations(prev =>
        prev.map(v => v.id === violationId ? response.data : v)
      );
      await fetchViolationsCount();
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchViolations();
    fetchViolationsCount();
  }, [fetchViolations, fetchViolationsCount]);

  useEffect(() => {
    websocketService.connect('violations');

    const handleWebSocketMessage = (data) => {
      if (data.type === 'violation_update') {
        setViolations(prev => [data.data, ...prev]);
        fetchViolationsCount();
      } else if (data.type === 'violation_status_update') {
        setViolations(prev =>
          prev.map(v => v.id === data.violation_id ? { ...v, ...data.data } : v)
        );
        fetchViolationsCount();
      }
    };

    websocketService.subscribe('violations-hook', handleWebSocketMessage);

    return () => {
      websocketService.unsubscribe('violations-hook');
    };
  }, [fetchViolationsCount]);

  return {
    violations,
    total,
    loading,
    error,
    openCount,
    criticalCount,
    refetch: fetchViolations,
    updateViolation,
  };
};
