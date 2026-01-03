import { useState, useEffect, useCallback, useRef } from 'react';
import { violationsAPI } from '../services/api';
import { websocketService } from '../services/websocket';

const sortViolations = (violations, sortBy) => {
  const sorted = [...violations];

  if (sortBy === 'severity') {
    sorted.sort((a, b) => b.occupancy_percentage - a.occupancy_percentage);
  } else if (sortBy === 'lot_name') {
    sorted.sort((a, b) => {
      const nameA = a.parking_lot?.name || '';
      const nameB = b.parking_lot?.name || '';
      return nameA.localeCompare(nameB);
    });
  } else {
    sorted.sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at));
  }

  return sorted;
};

const matchesFilters = (violation, filters) => {
  if (filters?.status && violation.status !== filters.status) return false;
  if (filters?.lot_id && violation.parking_lot_id !== filters.lot_id) return false;

  const detectedAt = new Date(violation.detected_at);

  if (filters?.from_date) {
    const from = new Date(`${filters.from_date}T00:00:00`);
    if (detectedAt < from) return false;
  }

  if (filters?.to_date) {
    const to = new Date(`${filters.to_date}T23:59:59.999`);
    if (detectedAt > to) return false;
  }

  return true;
};

export const useViolations = (filters = {}) => {
  const [violations, setViolations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openCount, setOpenCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [removingViolationIds, setRemovingViolationIds] = useState([]);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

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

  const scheduleRemoval = useCallback((violationId) => {
    setRemovingViolationIds((prev) => (prev.includes(violationId) ? prev : [...prev, violationId]));

    window.setTimeout(() => {
      setViolations((prev) => prev.filter((v) => v.id !== violationId));
      setRemovingViolationIds((prev) => prev.filter((id) => id !== violationId));
    }, 350);
  }, []);

  const updateViolation = async (violationId, updateData) => {
    try {
      const response = await violationsAPI.updateViolation(violationId, updateData);
      const updated = response.data;

      setViolations((prev) => {
        const next = prev.map((v) => (v.id === violationId ? updated : v));
        return sortViolations(next, filtersRef.current?.sort_by);
      });

      if (!matchesFilters(updated, filtersRef.current)) {
        scheduleRemoval(violationId);
      }

      await fetchViolationsCount();
      return updated;
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

    const handleWebSocketMessage = (message) => {
      const currentFilters = filtersRef.current;

      if (message.type === 'violation_update') {
        const newViolation = message.data;

        if (!matchesFilters(newViolation, currentFilters)) return;

        setViolations((prev) => {
          const withoutExisting = prev.filter((v) => v.id !== newViolation.id);
          const next =
            currentFilters?.sort_by === 'newest'
              ? [newViolation, ...withoutExisting]
              : sortViolations([...withoutExisting, newViolation], currentFilters?.sort_by);

          return next;
        });

        fetchViolationsCount();
      } else if (message.type === 'violation_status_update') {
        const updatedViolation = message.data;

        setViolations((prev) => {
          const existing = prev.find((v) => v.id === message.violation_id);

          if (existing) {
            const next = prev.map((v) => (v.id === message.violation_id ? updatedViolation : v));
            return sortViolations(next, currentFilters?.sort_by);
          }

          if (!matchesFilters(updatedViolation, currentFilters)) return prev;

          const next =
            currentFilters?.sort_by === 'newest'
              ? [updatedViolation, ...prev]
              : sortViolations([...prev, updatedViolation], currentFilters?.sort_by);

          return next;
        });

        if (!matchesFilters(updatedViolation, currentFilters)) {
          scheduleRemoval(message.violation_id);
        }

        fetchViolationsCount();
      }
    };

    websocketService.subscribe('violations-hook', handleWebSocketMessage);

    return () => {
      websocketService.unsubscribe('violations-hook');
    };
  }, [fetchViolationsCount, scheduleRemoval]);

  return {
    violations,
    total,
    loading,
    error,
    openCount,
    criticalCount,
    removingViolationIds,
    refetch: fetchViolations,
    updateViolation,
  };
};
