// src/components/common/DataTable.jsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

const TableLoadingSpinner = ({ rows = 5, columns = 4 }) => (
  <div className="animate-pulse">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4 py-4 border-b border-gray-200 last:border-b-0">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div
            key={colIndex}
            className="flex-1 h-4 bg-gray-300 rounded"
            style={{ animationDelay: `${(rowIndex * columns + colIndex) * 0.1}s` }}
          ></div>
        ))}
      </div>
    ))}
  </div>
);

const DataTable = ({ 
  data = [], 
  columns = [], 
  loading = false, 
  onRowClick = null,
  pagination = null,
  actions = null,
  emptyMessage = "Aucune donnée disponible",
  className = ""
}) => {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
        <div className="p-6">
          <TableLoadingSpinner rows={5} columns={columns.length} />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={index} 
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (actions ? 1 : 0)} 
                  className="text-center py-12 text-gray-500"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <MoreVertical className="w-6 h-6 text-gray-400" />
                    </div>
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`
                    hover:bg-gray-50 transition-colors
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-4 py-4 text-sm text-gray-900">
                      {column.render ? column.render(row[column.key], row, rowIndex) : (row[column.key] ?? '')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        {actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row, rowIndex);
                            }}
                            className={`
                              p-1 rounded hover:bg-gray-100 transition-colors
                              ${action.className || 'text-gray-600 hover:text-gray-900'}
                            `}
                            title={action.label}
                            disabled={action.disabled && action.disabled(row)}
                          >
                            <action.icon className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {pagination}
        </div>
      )}
    </div>
  );
};

export default DataTable;