import React, { useState, useEffect, useRef } from 'react';
import useHVCStore from '../../core/store/useHVCStore';
import '../../styles/history.css';

const TemporalMemory = () => {
  const history = useHVCStore((state) => state.history);
  const timeRange = useHVCStore((state) => state.selectedTimeRange);
  const setHistory = useHVCStore((state) => state.setHistory);
  const setHistoryLoading = useHVCStore((state) => state.setHistoryLoading);
  const setHistoryError = useHVCStore((state) => state.setHistoryError);
  const setTimeRange = useHVCStore((state) => state.setTimeRange);

  const [selectedTime, setSelectedTime] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState('streams'); // 'streams' or 'heatmap'
  const svgRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, [timeRange.start, timeRange.end]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({
        start: timeRange.start,
        end: timeRange.end,
        aggregate: 'hourly',
        limit: '1000'
      });
      const response = await fetch(`/api/history?${params}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistory(data.data || [], data.pagination);
    } catch (err) {
      setHistoryError(err.message);
    }
  };

  const handleTimeRangeChange = (days) => {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    setTimeRange(start, end);
  };

  const processDataForVisualization = () => {
    if (!history.data || history.data.length === 0) return { streams: [], events: [] };

    const streams = {
      coreLoad: [],
      solarWind: [],
      temperature: [],
      co2: [],
    };

    const events = [];

    history.data.forEach((point, idx) => {
      const timestamp = point.time_bucket || point.timestamp;
      if (!timestamp) return;

      const time = new Date(timestamp).getTime();

      // Extract metrics
      const coreLoad = point.avg_core_load || point.metrics?.coreLoad || 0;
      const solarWind = point.avg_solar_wind || point.metrics?.solarWindFlux || point.metrics?.solar?.windSpeed || 0;
      const temp = point.avg_temp || point.metrics?.crustTemp || 0;
      const co2 = point.avg_co2 || point.metrics?.atmosphere?.co2 || 0;

      streams.coreLoad.push({ time, value: parseFloat(coreLoad) || 0 });
      streams.solarWind.push({ time, value: parseFloat(solarWind) || 0 });
      streams.temperature.push({ time, value: parseFloat(temp) || 0 });
      streams.co2.push({ time, value: parseFloat(co2) || 0 });

      // Extract events
      if (point.metrics?.lastSeismicEvent) {
        events.push({
          type: 'seismic',
          time,
          data: point.metrics.lastSeismicEvent,
        });
      }
      if (point.metrics?.solar?.class && ['M', 'X'].includes(point.metrics.solar.class)) {
        events.push({
          type: 'solar',
          time,
          data: point.metrics.solar,
        });
      }
    });

    return { streams, events };
  };

  const { streams, events } = processDataForVisualization();

  const normalizeValue = (value, min, max) => {
    if (max === min) return 0.5;
    return (value - min) / (max - min);
  };

  const renderStreams = () => {
    if (!svgRef.current || streams.coreLoad.length === 0) return null;

    const width = svgRef.current.clientWidth || 800;
    const height = 400;
    const padding = { top: 40, right: 40, bottom: 60, left: 60 };

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const times = streams.coreLoad.map(s => s.time);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = maxTime - minTime;

    // Find value ranges
    const allValues = [
      ...streams.coreLoad.map(s => s.value),
      ...streams.solarWind.map(s => s.value),
      ...streams.temperature.map(s => s.value),
      ...streams.co2.map(s => s.value),
    ];
    const minValue = Math.min(...allValues.filter(v => !isNaN(v) && isFinite(v)));
    const maxValue = Math.max(...allValues.filter(v => !isNaN(v) && isFinite(v)));

    const getX = (time) => padding.left + ((time - minTime) / timeRange) * plotWidth;
    const getY = (value) => padding.top + plotHeight - (normalizeValue(value, minValue, maxValue) * plotHeight);

    const createPath = (data) => {
      if (data.length === 0) return '';
      const points = data
        .filter(d => d.value !== null && !isNaN(d.value) && isFinite(d.value))
        .map(d => `${getX(d.time)},${getY(d.value)}`);
      return `M ${points.join(' L ')}`;
    };

    return (
      <svg ref={svgRef} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="temporal-svg">
        <defs>
          <linearGradient id="coreLoadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00ff88" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="solarWindGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00ccff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00ccff" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff6b45" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ff6b45" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => (
          <line
            key={`grid-${frac}`}
            x1={padding.left}
            y1={padding.top + frac * plotHeight}
            x2={width - padding.right}
            y2={padding.top + frac * plotHeight}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Stream paths */}
        {streams.coreLoad.length > 0 && (
          <g>
            <path
              d={createPath(streams.coreLoad)}
              fill="none"
              stroke="#00ff88"
              strokeWidth="2"
              className="stream-path"
            />
            <path
              d={`${createPath(streams.coreLoad)} L ${getX(streams.coreLoad[streams.coreLoad.length - 1].time)},${padding.top + plotHeight} L ${getX(streams.coreLoad[0].time)},${padding.top + plotHeight} Z`}
              fill="url(#coreLoadGradient)"
            />
          </g>
        )}

        {streams.solarWind.length > 0 && (
          <g>
            <path
              d={createPath(streams.solarWind)}
              fill="none"
              stroke="#00ccff"
              strokeWidth="2"
              className="stream-path"
            />
          </g>
        )}

        {streams.temperature.length > 0 && (
          <g>
            <path
              d={createPath(streams.temperature)}
              fill="none"
              stroke="#ff6b45"
              strokeWidth="2"
              className="stream-path"
            />
          </g>
        )}

        {/* Event markers */}
        {events.map((event, idx) => {
          const x = getX(event.time);
          const color = event.type === 'seismic' ? '#ffaa00' : '#ff6b45';
          return (
            <g key={idx}>
              <circle
                cx={x}
                cy={padding.top + plotHeight / 2}
                r="6"
                fill={color}
                stroke="#fff"
                strokeWidth="2"
                className="event-marker"
                onClick={() => setSelectedTime(event)}
              />
            </g>
          );
        })}

        {/* Axes */}
        <line
          x1={padding.left}
          y1={padding.top + plotHeight}
          x2={width - padding.right}
          y2={padding.top + plotHeight}
          stroke="#00ff88"
          strokeWidth="2"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + plotHeight}
          stroke="#00ff88"
          strokeWidth="2"
        />

        {/* Labels */}
        <text x={width / 2} y={height - 10} fill="#a0b0c0" textAnchor="middle" fontSize="12">
          Time
        </text>
        <text
          x={20}
          y={height / 2}
          fill="#a0b0c0"
          textAnchor="middle"
          fontSize="12"
          transform={`rotate(-90, 20, ${height / 2})`}
        >
          Value
        </text>
      </svg>
    );
  };

  return (
    <div className="temporal-memory">
      <div className="temporal-header">
        <h1>Temporal Memory</h1>
        <p className="temporal-subtitle">Historical data streams through time</p>
      </div>

      <div className="temporal-controls">
        <div className="time-range-buttons">
          <button onClick={() => handleTimeRangeChange(1)}>Last 24 Hours</button>
          <button onClick={() => handleTimeRangeChange(7)}>Last 7 Days</button>
          <button onClick={() => handleTimeRangeChange(30)}>Last 30 Days</button>
        </div>
        <div className="view-mode-buttons">
          <button
            className={viewMode === 'streams' ? 'active' : ''}
            onClick={() => setViewMode('streams')}
          >
            Streams
          </button>
          <button
            className={viewMode === 'heatmap' ? 'active' : ''}
            onClick={() => setViewMode('heatmap')}
          >
            Heatmap
          </button>
        </div>
      </div>

      {history.loading && (
        <div className="loading-state">Loading historical data...</div>
      )}

      {history.error && (
        <div className="error-state">Error: {history.error}</div>
      )}

      {!history.loading && !history.error && (
        <div className="temporal-visualization">
          {viewMode === 'streams' && renderStreams()}
          {viewMode === 'heatmap' && (
            <div className="heatmap-placeholder">
              Heatmap view coming soon
            </div>
          )}
        </div>
      )}

      {selectedTime && (
        <div className="event-detail">
          <button className="close-detail" onClick={() => setSelectedTime(null)}>×</button>
          <h3>{selectedTime.type === 'seismic' ? 'Earthquake Event' : 'Solar Event'}</h3>
          <pre>{JSON.stringify(selectedTime.data, null, 2)}</pre>
        </div>
      )}

      <div className="temporal-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#00ff88' }}></span>
          <span>Core MHD Load</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#00ccff' }}></span>
          <span>Solar Wind</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#ff6b45' }}></span>
          <span>Temperature</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#ffaa00' }}></span>
          <span>Seismic Events</span>
        </div>
      </div>
    </div>
  );
};

export default TemporalMemory;

