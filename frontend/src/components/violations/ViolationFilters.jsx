import React from 'react';
import { Filter } from 'lucide-react';

const ViolationFilters = ({ filters, onFiltersChange }) => {
  const handleStatusChange = (e) => {
    const value = e.target.value === 'ALL' ? null : e.target.value;
    onFiltersChange({ ...filters, status: value });
  };

  const handleSortChange = (e) => {
    onFiltersChange({ ...filters, sort_by: e.target.value });
  };

  const handleDateChange = (field, value) => {
    onFiltersChange({ ...filters, [field]: value || null });
  };

  return (
    <div className="filters-container">
      <div className="filters-header">
        <Filter size={20} />
        <h3>Filters & Sort</h3>
      </div>
      
      <div className="filters-grid">
        <div className="filter-group">
          <label htmlFor="status">Status</label>
          <select 
            id="status" 
            value={filters.status || 'ALL'} 
            onChange={handleStatusChange}
            className="filter-select"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sort">Sort By</label>
          <select 
            id="sort" 
            value={filters.sort_by || 'newest'} 
            onChange={handleSortChange}
            className="filter-select"
          >
            <option value="newest">Newest First</option>
            <option value="severity">Severity (High to Low)</option>
            <option value="lot_name">Lot Name (A-Z)</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="from_date">From Date</label>
          <input
            type="date"
            id="from_date"
            value={filters.from_date || ''}
            onChange={(e) => handleDateChange('from_date', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="to_date">To Date</label>
          <input
            type="date"
            id="to_date"
            value={filters.to_date || ''}
            onChange={(e) => handleDateChange('to_date', e.target.value)}
            className="filter-input"
          />
        </div>
      </div>
    </div>
  );
};

export default ViolationFilters;
