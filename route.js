// app/api/remote-stats/route.js
export const runtime = 'nodejs';

function parsePrometheusText(text) {
  const metrics = {};
  for (const line of text.split('\n')) {
    if (line.startsWith('#') || !line.trim()) continue;
    const match = line.match(/^([a-zA-Z0-9_]+)(\{[^}]*\})?\s+([0-9.e+-]+)/);
    if (!match) continue;
    const [, name, labels, value] = match;
    const key = labels ? `${name}${labels}` : name;
    metrics[key] = parseFloat(value);
  }
  return metrics;
}

export async function GET(req) {
  const hostname = req.nextUrl.searchParams.get('hostname');
  if (!hostname) return Response.json({ error: 'hostname required' }, { status: 400 });

  try {
    const res = await fetch(`http://${hostname}:9100/metrics`, { signal: AbortSignal.timeout(5000) });
    const text = await res.text();
    const m = parsePrometheusText(text);

    const totalMem = m['node_memory_MemTotal_bytes'];
    const availMem = m['node_memory_MemAvailable_bytes'];

    return Response.json({
      memory: {
        totalGB: (totalMem / 1e9).toFixed(2),
        availableGB: (availMem / 1e9).toFixed(2),
        usedGB: ((totalMem - availMem) / 1e9).toFixed(2),
        usedPercent: (((totalMem - availMem) / totalMem) * 100).toFixed(1),
      },
      cpu: {
        loadAvg1min: m['node_load1'],
        loadAvg5min: m['node_load5'],
        loadAvg15min: m['node_load15'],
      },
    });
  } catch (err) {
    return Response.json({ error: `Could not reach ${hostname}:9100 — ${err.message}` }, { status: 502 });
  }
}
