let tlSelectedIdx = 0;
let tlMapLayer = null;

function buildTimelineEvents(u) {
  const lat = u.lat || 26.225, lng = u.lng || 60.214;
  const addr = u.address || 'استان سیستان و بلوچستان، شهرستان نیک‌شهر، ایران';
  return [
    {
      dur: '00:06:59', maxSpd: 61, avgSpd: 29,
      pts: [[lat - 0.002, lng - 0.012], [lat - 0.001, lng - 0.006], [lat, lng]],
      nodes: [
        { type: 'stats' },
        { type: 'gf-out', title: 'حصار جغرافیایی حصار جغرافیایی من 1', time: '14:11:31', addr },
        { type: 'a', title: 'سفر', time: '14:09:01', addr }
      ]
    },
    {
      dur: '00:12:29', maxSpd: 54, avgSpd: 26,
      pts: [[lat + 0.006, lng - 0.003], [lat + 0.001, lng - 0.007], [lat + 0.002, lng - 0.001], [lat + 0.004, lng + 0.001]],
      nodes: [
        { type: 'stats' },
        { type: 'gf-out', title: 'حصار جغرافیایی حصار جغرافیایی من', time: '13:47:54', addr },
        { type: 'a', title: 'سفر', time: '13:47:35', addr }
      ]
    },
    {
      dur: '00:16:30', maxSpd: 48, avgSpd: 22,
      pts: [[lat + 0.001, lng + 0.006], [lat + 0.0015, lng], [lat + 0.002, lng - 0.008]],
      nodes: [
        { type: 'gf-in', title: 'حصار جغرافیایی حصار جغرافیایی من', time: '13:20:06', addr },
        { type: 'gf-out', title: 'حصار جغرافیایی حصار جغرافیایی من 1', time: '13:06:35', addr },
        { type: 'a', title: 'سفر', time: '13:03:36', addr }
      ]
    }
  ];
}

function drawTimelineTripOnMap(ev) {
  if (!map) return;
  if (histLayer) histLayer.clearLayers();
  if (!tlMapLayer) tlMapLayer = L.layerGroup().addTo(map);
  tlMapLayer.clearLayers();

  const line = L.polyline(ev.pts, { color: '#0d47a1', weight: 6, opacity: 0.9 }).addTo(tlMapLayer);
  const start = ev.pts[0], end = ev.pts[ev.pts.length - 1];

  L.marker(start, {
    icon: L.divIcon({ className: '', html: `<div class="tl-ico a" style="border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);">A</div>`, iconSize: [30, 30], iconAnchor: [15, 15] })
  }).addTo(tlMapLayer);

  L.marker(end, {
    icon: L.divIcon({ className: '', html: `<div class="tl-ico b" style="border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);">B</div>`, iconSize: [30, 30], iconAnchor: [15, 15] })
  }).addTo(tlMapLayer);

  map.fitBounds(line.getBounds(), { padding: [45, 45] });
}

function selectTimelineCard(idx) {
  tlSelectedIdx = idx;
  renderUserTab();
}

const _prevRenderForTimeline = renderUserTab;
renderUserTab = function() {
  if (userTab === 'timeline' && uState) {
    const body = document.getElementById('u-sheet-body');
    const u = uState.units.find(x => x.id === activeUnitId) || uState.units[0];
    if (!u) return;

    document.getElementById('u-sheet-title').innerText = 'جدول زمانی';
    const events = buildTimelineEvents(u);
    const activeEv = events[tlSelectedIdx] || events[0];
    drawTimelineTripOnMap(activeEv);

    body.innerHTML = events.map((ev, idx) => `
      <div class="tl-card ${idx === tlSelectedIdx ? 'active' : ''}" onclick="selectTimelineCard(${idx})">
        ${ev.nodes.map(n => {
          if (n.type === 'stats') {
            return `<div class="tl-node">
              <div class="tl-rail"><div class="tl-line" style="margin-top:0;"></div></div>
              <div class="tl-content tl-stats">
                <div>مدت زمان: <b>${ev.dur}</b></div>
                <div>حداکثر سرعت: <b>${ev.maxSpd} km/h</b></div>
                <div>میانگین سرعت: <b>${ev.avgSpd} km/h</b></div><div style="margin-top:6px;"><button class="btn btn-sm" onclick="event.stopPropagation();playTimelineTrip(${idx})">▶ پخش این سفر</button></div>
              </div>
            </div>`;
          }
          const icoHtml = n.type === 'a'
            ? `<div class="tl-ico a">A</div>`
            : `<div class="tl-ico ${n.type}"><span class="ms" style="font-size:17px;">pentagon</span></div>`;
          return `<div class="tl-node">
            <div class="tl-rail">${icoHtml}<div class="tl-line"></div></div>
            <div class="tl-content">
              <div class="tl-row-top">
                <span class="tl-title">${n.title}</span>
                <span class="tl-time">${n.time}</span>
              </div>
              <div class="tl-addr"><span class="ms" style="font-size:15px;">location_on</span><span>${n.addr}</span></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    `).join('');
    return;
  }

  if (tlMapLayer && map) tlMapLayer.clearLayers();
  _prevRenderForTimeline();
};

function playTimelineTrip(idx) {
  const u = uState && (uState.units.find(x => x.id === activeUnitId) || uState.units[0]);
  if (!u) return;
  const ev = buildTimelineEvents(u)[idx];
  if (!ev) return;
  const pts = ev.pts.map((p, i) => ({
    lat: p[0], lng: p[1],
    speed: i === ev.pts.length - 1 ? 0 : Math.round(ev.avgSpd + i * 12),
    time: (ev.nodes[ev.nodes.length - 1] && ev.nodes[ev.nodes.length - 1].time) || "14:00:00"
  }));
  playCustomTripPts(pts);
}
