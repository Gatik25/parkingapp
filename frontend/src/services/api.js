import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const violationsAPI = {
  getViolations: (params = {}) => {
    return api.get('/violations/', { params });
  },
  
  getViolation: (violationId) => {
    return api.get(`/violations/${violationId}`);
  },
  
  updateViolation: (violationId, data) => {
    return api.patch(`/violations/${violationId}`, data);
  },
  
  getViolationsCount: () => {
    return api.get('/violations/stats/count');
  },
};

export const parkingLotsAPI = {
  getParkingLots: (params = {}) => {
    return api.get('/parking-lots/', { params });
  },

  getOccupancyHistory: (lotId, hours = 24) => {
    return api.get(`/parking-lots/${lotId}/occupancy-history`, {
      params: { hours },
    });
  },
};

export default api;
