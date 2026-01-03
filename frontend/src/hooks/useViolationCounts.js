import { useCallback, useEffect, useState } from 'react';
import { violationsAPI } from '../services/api';
import { websocketService } from '../services/websocket';

export const useViolationCounts = () => {
  const [openCount, setOpenCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);

  const fetchCounts = useCallback(async () => {
    try {
      const response = await violationsAPI.getViolationsCount();
      setOpenCount(response.data.open_violations);
      setCriticalCount(response.data.critical_violations);
    } catch (error) {
      console.error('Failed to fetch violation counts:', error);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    websocketService.connect('violations');

    const handleMessage = (message) => {
      if (message.type === 'violation_update' || message.type === 'violation_status_update') {
        fetchCounts();
      }
    };

    websocketService.subscribe('violations-counts-hook', handleMessage);

    return () => {
      websocketService.unsubscribe('violations-counts-hook');
    };
  }, [fetchCounts]);

  return { openCount, criticalCount };
};
