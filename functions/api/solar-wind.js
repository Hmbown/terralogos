export async function onRequest() {
  try {
    // NOAA Real-Time Solar Wind (RTSW) - Plasma (Density, Speed, Temp)
    // Returns array of arrays. First row is header.
    // [time_tag, density, speed, temperature]
    const response = await fetch('https://services.swpc.noaa.gov/products/solar-wind/plasma-5-minute.json');
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[API] SOLAR_WIND', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to fetch solar wind data' }), { status: 500 });
  }
}
