
// 21. Data Export/Import Components
// ets-reselec-frontend/src/components/export/DataExporter.jsx
import React, { useState } from 'react';
import { Download, FileText, Table, Calendar, Filter } from 'lucide-react';
import Modal from '../common/Modal';
import { exportService } from '../../services/exportService';
import toast from 'react-hot-toast';

const DataExporter = ({ isOpen, onClose, entityType, filters = {} }) => {
  const [exportConfig, setExportConfig] = useState({
    format: 'excel',
    dateRange: 'all',
    includeFields: ['all'],
    customDateFrom: '',
    customDateTo: ''
  });
  const [exporting, setExporting] = useState(false);

  const exportFormats = [
    { value: 'excel', label: 'Excel (.xlsx)', icon: Table },
    { value: 'pdf', label: 'PDF Report', icon: FileText },
    { value: 'csv', label: 'CSV File', icon: Table }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Data' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleExport = async () => {
    setExporting(true);
    
    try {
      const exportData = {
        entityType,
        format: exportConfig.format,
        dateRange: exportConfig.dateRange,
        dateFrom: exportConfig.customDateFrom,
        dateTo: exportConfig.customDateTo,
        fields: exportConfig.includeFields,
        filters
      };

      const response = await exportService.exportData(exportData);
      
      // Download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', response.filename || `${entityType}_export.${exportConfig.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Export completed successfully');
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Export ${entityType} Data`}
      size="md"
    >
      <div className="space-y-6">
        {/* Export Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Export Format
          </label>
          <div className="grid grid-cols-1 gap-2">
            {exportFormats.map(format => {
              const Icon = format.icon;
              return (
                <label key={format.value} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={exportConfig.format === format.value}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, format: e.target.value }))}
                    className="text-blue-600"
                  />
                  <Icon className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">{format.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <select
            value={exportConfig.dateRange}
            onChange={(e) => setExportConfig(prev => ({ ...prev, dateRange: e.target.value }))}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Date Range */}
        {exportConfig.dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={exportConfig.customDateFrom}
                onChange={(e) => setExportConfig(prev => ({ ...prev, customDateFrom: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={exportConfig.customDateTo}
                onChange={(e) => setExportConfig(prev => ({ ...prev, customDateTo: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {Object.keys(filters).length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Active Filters</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => (
                <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {key}: {value}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DataExporter;

// 22. Final Service Implementations
// ets-reselec-frontend/src/services/analyticsService.js
import api from './api';

export const analyticsService = {
  getAdvancedAnalytics: (timeframe = '30') =>
    api.get('/analytics/advanced', { params: { timeframe } }).then(res => res.data),
  
  getClientAnalytics: (clientId) =>
    api.get(`/analytics/client/${clientId}`).then(res => res.data),
  
  getEquipmentAnalytics: (equipmentId) =>
    api.get(`/analytics/equipment/${equipmentId}`).then(res => res.data),
  
  getPerformanceReport: (params = {}) =>
    api.get('/analytics/performance', { params }).then(res => res.data)
};