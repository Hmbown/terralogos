import React, { useState } from 'react';
import '../../styles/datatable.css';

const DataTable = ({ 
  data, 
  columns, 
  onRowClick,
  sourceLinks = {},
  sortable = true 
}) => {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (column) => {
    if (!sortable || !column.sortable) return;
    
    if (sortColumn === column.key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column.key);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortable) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [data, sortColumn, sortDirection, sortable]);

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.sortable && sortable ? 'sortable' : ''}
                onClick={() => handleSort(col)}
              >
                <div className="th-content">
                  {col.label}
                  {col.sortable && sortable && sortColumn === col.key && (
                    <span className="sort-indicator">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="empty-state">
                No data available
              </td>
            </tr>
          ) : (
            sortedData.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? 'clickable' : ''}
              >
                {columns.map((col) => {
                  const cellValue = col.render 
                    ? col.render(row[col.key], row)
                    : row[col.key];
                  
                  return (
                    <td key={col.key}>
                      {cellValue}
                      {sourceLinks[col.key] && row[col.key] && (
                        <a
                          href={sourceLinks[col.key](row)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="source-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ↗
                        </a>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;

