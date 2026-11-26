let hvShowP = true, hvShowF = true, hvColorMode = 2; // 0: آبی، 1: نارنجی، 2: رنگ‌بندی سرعت
let hvAnimFrame = null, hvPlaying = false, hvProgress = 0, hvSpeedMul = 1;
let hvCarMarker = null, hvExtraLayer = null;

function buildSmoothRoutePts(u) {
  const bLat = u.lat || 26.225, bLng = u.lng || 60.214;
  return [
    { lat: bLat - 0.012, lng: bLng - 0.014, speed: 24, time: '00:02:59' },
    { lat: bLat - 0.009, lng: bLng - 0.011, speed: 46, time: '04:15:10' },
    { lat: bLat - 0.006, lng: bLng - 0.007, speed: 68, time: '07:45:20' },
    { lat: bLat - 0.004, lng: bLng - 0.005, speed: 82, time: '10:30:00' },
    { lat: bLat - 0.002, lng: bLng - 0.003, speed: 54, time: '14:12:45' },
    { lat: bLat - 0.001, lng: bLng - 0.001, speed: 35, time: '18:05:12' },
    { lat: bLat, lng: bLng, speed: 0, time: '21:17:38' }
  ];
}

function drawHistoryTrackOnMap(u, pts) {
  if (!map || !histLayer) return;
  histLayer.clearLayers();
  if (!hvExtraLayer) hvExtraLayer = L.layerGroup().addTo(map);
  hvExtraLayer.clearLayers();

  for (let i = 0; i < pts.length - 1; i++) {
    const s = pts[i].speed;
    let col = '#1565c0';
    if (hvColorMode === 1) col = '#ff9800';
    if (hvColorMode === 2) col = s < 35 ? '#2e7d32' : (s < 55 ? '#fbc02d' : (s < 75 ? '#f57c00' : '#d32f2f'));
    L.polyline([[pts[i].lat, pts[i].lng], [pts[i+1].lat, pts[i+1].lng]], { color: col, weight: 6, opacity: 0.92 }).addTo(histLayer);
  }

  if (hvShowP) {
    [0, 2, pts.length - 1].forEach(idx => {
      const p = pts[idx];
      if (!p) return;
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({ className: '', html: `<div class="pb-p-marker">P</div>`, iconSize: [26, 26], iconAnchor: [13, 13] })
      }).addTo(hvExtraLayer);
    });
  }

  if (hvShowF) {
    const endP = pts[pts.length - 1];
    L.marker([endP.lat, endP.lng], {
      icon: L.divIcon({ className: '', html: `<div class="pb-p-marker" style="background:#2e7d32;">F</div>`, iconSize: [26, 26], iconAnchor: [13, 13] })
    }).addTo(hvExtraLayer);
  }
}

function ensurePbFloatBar() {
  let el = document.getElementById('pb-float-bar');
  if (!el) {
    el = document.createElement('div');
    el.id = 'pb-float-bar';
    document.body.appendChild(el);
  }
  return el;
}

function updateCarAtProgress(u, pts, prog) {
  const maxSeg = pts.length - 1;
  const clamped = Math.max(0, Math.min(maxSeg, prog));
  const i = Math.min(Math.floor(clamped), maxSeg - 1);
  const f = clamped - i;
  const p1 = pts[i], p2 = pts[i + 1];
  const lat = p1.lat + (p2.lat - p1.lat) * f;
  const lng = p1.lng + (p2.lng - p1.lng) * f;
  const spd = Math.round(p1.speed + (p2.speed - p1.speed) * f);
  const tm = f < 0.5 ? p1.time : p2.time;

  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-80%);">
      <div class="pb-car-speed-tag">${spd} km/h</div>
      ${getVehicleSvg(u.icon, u.color, 36)}
    </div>`;

  if (!hvCarMarker) {
    hvCarMarker = L.marker([lat, lng], {
      zIndexOffset: 1000,
      icon: L.divIcon({ className: '', html, iconSize: [1, 1] })
    }).addTo(map);
  } else {
    hvCarMarker.setLatLng([lat, lng]);
    hvCarMarker.setIcon(L.divIcon({ className: '', html, iconSize: [1, 1] }));
  }

  const rng = document.getElementById('pbf-rng');
  if (rng) rng.value = Math.round(clamped * 100);
  const tmEl = document.getElementById('pbf-tm');
  if (tmEl) tmEl.innerText = tm;
  const spEl = document.getElementById('pbf-sp');
  if (spEl) spEl.innerText = `${spd} km/h`;
}

function startSmartPlayback() {
  const u = uState && (uState.units.find(x => x.id === activeUnitId) || uState.units[0]);
  if (!u) return;
  pbPts = buildSmoothRoutePts(u);
  drawHistoryTrackOnMap(u, pbPts);
  fitRoute();
  if (typeof collapseSheetNow === 'function') collapseSheetNow();

  hvPlaying = true;
  if (hvProgress >= pbPts.length - 1) hvProgress = 0;
  renderPbFloatBar(u);
  runSmoothPbLoop(u);
}

function renderPbFloatBar(u) {
  const bar = ensurePbFloatBar();
  bar.classList.add('open');
  bar.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
      <div style="display:flex;align-items:center;gap:6px;">
        <button class="btn btn-sm" onclick="toggleSmartPbPlay()">${hvPlaying ? 'توقف ❚❚' : 'پخش ▶'}</button>
        <button class="btn btn-gray btn-sm" onclick="cycleSmartPbSpeed()">${hvSpeedMul}x</button>
      </div>
      <div style="font-size:12px;font-weight:700;color:#d32f2f;" id="pbf-sp">0 km/h</div>
      <div style="font-size:11.5px;color:#475569;" id="pbf-tm">${pbPts[0].time}</div>
      <span style="font-size:20px;cursor:pointer;color:#64748b;padding:0 4px;" onclick="stopSmartPlayback()">×</span>
    </div>
    <input type="range" id="pbf-rng" min="0" max="${(pbPts.length - 1) * 100}" value="${Math.round(hvProgress * 100)}" oninput="scrubSmartPb(this.value)" style="width:100%;accent-color:var(--primary);">
  `;
}

function runSmoothPbLoop(u) {
  cancelAnimationFrame(hvAnimFrame);
  let lastT = performance.now();
  const step = (now) => {
    if (!hvPlaying) return;
    const dt = (now - lastT) / 1000;
    lastT = now;
    hvProgress += dt * 0.45 * hvSpeedMul;
    if (hvProgress >= pbPts.length - 1) {
      hvProgress = pbPts.length - 1;
      updateCarAtProgress(u, pbPts, hvProgress);
      hvPlaying = false;
      renderPbFloatBar(u);
      return;
    }
    updateCarAtProgress(u, pbPts, hvProgress);
    hvAnimFrame = requestAnimationFrame(step);
  };
  hvAnimFrame = requestAnimationFrame(step);
}

function toggleSmartPbPlay() {
  const u = uState && (uState.units.find(x => x.id === activeUnitId) || uState.units[0]);
  if (!u) return;
  hvPlaying = !hvPlaying;
  if (hvPlaying && hvProgress >= pbPts.length - 1) hvProgress = 0;
  renderPbFloatBar(u);
  if (hvPlaying) runSmoothPbLoop(u);
}

function cycleSmartPbSpeed() {
  const speeds = [0.5, 1, 2, 4, 8];
  hvSpeedMul = speeds[(speeds.indexOf(hvSpeedMul) + 1) % speeds.length];
  const u = uState && (uState.units.find(x => x.id === activeUnitId) || uState.units[0]);
  if (u) renderPbFloatBar(u);
}

function scrubSmartPb(val) {
  const u = uState && (uState.units.find(x => x.id === activeUnitId) || uState.units[0]);
  if (!u) return;
  hvProgress = Number(val) / 100;
  updateCarAtProgress(u, pbPts, hvProgress);
}

function stopSmartPlayback() {
  hvPlaying = false;
  cancelAnimationFrame(hvAnimFrame);
  if (hvCarMarker && map) { map.removeLayer(hvCarMarker); hvCarMarker = null; }
  const bar = document.getElementById('pb-float-bar');
  if (bar) bar.classList.remove('open');
}

function openFullExportSheet() {
  showModal(
    ['xlsx', 'kml', 'gpx', 'geojson', 'wln', 'google'].map(f =>
      `<div class="menu-row" onclick="doTrackExport('${f}')"><b style="font-size:14px;">${f}</b></div>`
    ).join('') + `<div class="close-bar" onclick="closeModal()">بستن</div>`
  );
}

function openSpeedChartModal() {
  const u = uState && (uState.units.find(x => x.id === activeUnitId) || uState.units[0]);
  if (!u) return;
  let el = document.getElementById('spd-chart-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'spd-chart-overlay';
    document.body.appendChild(el);
  }
  const pts = [0, 0, 12, 65, 78, 52, 82, 30, 18, 0, 22, 68, 75, 40, 0, 0];
  const bars = pts.map((v, i) => {
    const x = 28 + i * 16;
    const h = Math.round((v / 90) * 130);
    return `<rect x="${x}" y="${145 - h}" width="8" height="${h}" rx="3" fill="#455a64" opacity="0.8"/>`;
  }).join('');

  el.innerHTML = `
    <div class="rp-head">
      <span style="width:24px;"></span>
      <div style="text-align:center;">
        <div style="font-weight:700;font-size:15px;">نمودار سرعت</div>
        <div style="font-size:12px;color:#64748b;">${u.name}</div>
      </div>
      <span style="font-size:22px;cursor:pointer;color:#455a64;" onclick="document.getElementById('spd-chart-overlay').classList.remove('open')">×</span>
    </div>
    <div style="padding:14px;">
      <div class="hv-card" style="padding:16px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="background:#546e7a;color:#fff;padding:4px 10px;border-radius:14px;font-size:11.5px;">00:02:59</span>
          <span style="background:#546e7a;color:#fff;padding:4px 10px;border-radius:14px;font-size:11.5px;">21:17:38</span>
        </div>
        <input type="range" min="0" max="100" value="100" style="width:100%;accent-color:#546e7a;margin-bottom:14px;">
        <svg viewBox="0 0 300 165" style="width:100%;height:190px;">
          <line x1="22" y1="145" x2="290" y2="145" stroke="#90a4ae" stroke-width="1.5"/>
          <text x="4" y="25" font-size="9" fill="#78909c">90</text>
          <text x="4" y="65" font-size="9" fill="#78909c">60</text>
          <text x="4" y="105" font-size="9" fill="#78909c">30</text>
          <text x="8" y="145" font-size="9" fill="#78909c">0</text>
          ${bars}
        </svg>
      </div>
    </div>`;
  el.classList.add('open');
}

const _prevRenderForHist = renderUserTab;
renderUserTab = function() {
  if ((userTab === 'history' || userTab === 'timeline') && uState) {
    const body = document.getElementById('u-sheet-body');
    const actU = uState.units.find(x => x.id === activeUnitId) || uState.units[0];
    if (!actU) return;

    document.getElementById('u-sheet-title').innerText = 'تاریخچه';
    pbPts = buildSmoothRoutePts(actU);
    drawHistoryTrackOnMap(actU, pbPts);

    const tabs = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(Date.now() - i * 86400000);
      const iso = d.toISOString().split('T')[0];
      const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
      const lbl = i === 0 ? 'امروز' : (i === 1 ? 'دیروز' : `${PERSIAN_MONTHS[j.jm - 1]} ${j.jd}`);
      tabs.push({ iso, lbl });
    }

    body.innerHTML = `
      <div class="tr-date-strip">
        ${tabs.map(t => `<div class="tr-dtab ${selectedDate===t.iso?'active':''}" onclick="setDate('${t.iso}')">${t.lbl}</div>`).join('')}
        <div class="tr-cal-btn" onclick="openShamsiCalPopup()"><span class="ms" style="font-size:21px;">calendar_month</span></div>
      </div>

      <div class="hv-time-pill">
        <span>00:00 - 23:59</span>
        <span class="ms" style="font-size:18px;">keyboard_arrow_down</span>
      </div>

      <div class="hv-card">
        <div class="hv-tools">
          <div class="hv-tool-btn" title="نمایش کل مسیر روی نقشه" onclick="fitRoute();collapseSheetNow()"><span class="ms">map</span></div>
          <div class="hv-tool-btn" title="خروجی فایل مسیر" onclick="openFullExportSheet()"><span class="ms">cloud_download</span></div>
          <div class="hv-tool-btn ${hvShowP?'active':''}" title="نشانگرهای پارک P" onclick="hvShowP=!hvShowP;renderUserTab()">P</div>
          <div class="hv-tool-btn ${hvShowF?'active':''}" title="پرچم شروع و پایان" onclick="hvShowF=!hvShowF;renderUserTab()"><span class="ms">flag</span></div>
          <div class="hv-tool-btn active" title="تغییر رنگ مسیر (آبی/نارنجی/سرعت)" onclick="hvColorMode=(hvColorMode+1)%3;renderUserTab()"><span class="ms">play_circle</span></div>
          <div class="hv-tool-btn" title="نمودار سرعت" onclick="openSpeedChartModal()"><span class="ms">show_chart</span></div>
          <div class="hv-tool-btn" style="color:var(--primary);" title="پخش هوشمند روی نقشه" onclick="startSmartPlayback()"><span class="ms">play_arrow</span></div>
        </div>

        <div class="hv-ab-wrap">
          <div class="hv-ab-col">
            <div class="hv-dot-a">A</div>
            <div class="hv-ab-line"></div>
            <div class="hv-dot-b">B</div>
          </div>
          <div class="hv-ab-info">
            <div style="font-size:11.5px;color:#78909c;direction:ltr;text-align:right;">00:02:59</div>
            <div style="font-weight:600;margin-bottom:4px;">${actU.address}</div>
            <div>مسافت پیموده شده: <b>185.372 km</b></div>
            <div>مدت زمان: <b>21:14:39</b></div>
            <div>حداکثر سرعت: <b>82 km/h</b></div>
            <div style="margin-bottom:8px;">میانگین سرعت: <b>9 km/h</b></div>
            <div style="font-size:11.5px;color:#78909c;direction:ltr;text-align:right;">21:17:38</div>
            <div style="font-weight:600;">${actU.address}</div>
          </div>
        </div>

        <div class="hv-bottom-row">
          <div><b>میانگین سرعت</b><div style="font-size:10.5px;color:#90a4ae;">توسط داده‌های دستگاه</div></div>
          <b dir="ltr">26 km/h</b>
        </div>
        <div class="hv-bottom-row">
          <b>امتیاز</b>
          <span style="color:#1565c0;font-size:18px;letter-spacing:2px;">★★☆☆☆</span>
        </div>
      </div>`;
    return;
  }
  _prevRenderForHist();
};

function playCustomTripPts(pts) {
  const u = uState && (uState.units.find(x => x.id === activeUnitId) || uState.units[0]);
  if (!u || !pts || pts.length < 2) return;
  pbPts = pts;
  hvProgress = 0;
  drawHistoryTrackOnMap(u, pbPts);
  fitRoute();
  if (typeof collapseSheetNow === 'function') collapseSheetNow();
  hvPlaying = true;
  renderPbFloatBar(u);
  runSmoothPbLoop(u);
}
