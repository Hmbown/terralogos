export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  
  if (!env?.TERRA_DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), { 
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const startTime = url.searchParams.get('start') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endTime = url.searchParams.get('end') || new Date().toISOString();
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const aggregate = url.searchParams.get('aggregate'); // 'hourly' or 'daily'
    const metricType = url.searchParams.get('type'); // 'seismic', 'solar', 'climate', etc.

    let query;
    let params;

    if (aggregate === 'hourly') {
      // Aggregate by hour
      query = `
        SELECT 
          strftime('%Y-%m-%d %H:00:00', snapshot_time) as time_bucket,
          COUNT(*) as count,
          json_extract(payload, '$.metrics.coreLoad') as avg_core_load,
          json_extract(payload, '$.metrics.solar.windSpeed') as avg_solar_wind,
          json_extract(payload, '$.metrics.crustTemp') as avg_temp,
          json_extract(payload, '$.metrics.atmosphere.co2') as avg_co2
        FROM metric_history
        WHERE snapshot_time >= ? AND snapshot_time <= ?
        GROUP BY time_bucket
        ORDER BY time_bucket DESC
        LIMIT ? OFFSET ?
      `;
      params = [startTime, endTime, limit, offset];
    } else if (aggregate === 'daily') {
      // Aggregate by day
      query = `
        SELECT 
          date(snapshot_time) as time_bucket,
          COUNT(*) as count,
          AVG(CAST(json_extract(payload, '$.metrics.coreLoad') AS REAL)) as avg_core_load,
          AVG(CAST(json_extract(payload, '$.metrics.solar.windSpeed') AS REAL)) as avg_solar_wind,
          AVG(CAST(json_extract(payload, '$.metrics.crustTemp') AS REAL)) as avg_temp,
          AVG(CAST(json_extract(payload, '$.metrics.atmosphere.co2') AS REAL)) as avg_co2
        FROM metric_history
        WHERE snapshot_time >= ? AND snapshot_time <= ?
        GROUP BY time_bucket
        ORDER BY time_bucket DESC
        LIMIT ? OFFSET ?
      `;
      params = [startTime, endTime, limit, offset];
    } else {
      // Raw data
      query = `
        SELECT id, snapshot_time, payload
        FROM metric_history
        WHERE snapshot_time >= ? AND snapshot_time <= ?
        ORDER BY snapshot_time DESC
        LIMIT ? OFFSET ?
      `;
      params = [startTime, endTime, limit, offset];
    }

    const result = await env.TERRA_DB.prepare(query).bind(...params).all();
    
    // Get total count for pagination
    const countResult = await env.TERRA_DB.prepare(
      'SELECT COUNT(*) as total FROM metric_history WHERE snapshot_time >= ? AND snapshot_time <= ?'
    ).bind(startTime, endTime).first();

    const total = countResult?.total || 0;

    // Parse payloads if raw data
    let data = result.results || [];
    if (!aggregate) {
      data = data.map(row => ({
        id: row.id,
        timestamp: row.snapshot_time,
        ...JSON.parse(row.payload || '{}')
      }));
    }

    return new Response(JSON.stringify({
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      filters: {
        start: startTime,
        end: endTime,
        aggregate,
        type: metricType
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (err) {
    console.error('[HISTORY API] Error:', err);
    return new Response(JSON.stringify({ 
      error: err?.message || 'Failed to fetch history',
      data: [],
      pagination: { total: 0, limit: 0, offset: 0, hasMore: false }
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

