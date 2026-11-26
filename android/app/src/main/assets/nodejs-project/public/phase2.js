let selectedDate = new Date().toISOString().split('T')[0];
let pbActive = false, pbTimer = null, pbIdx = 0, pbSpeed = 1, pbPts = [];

function calcDistKm(a, b, c, d) {
  const R = 6371, dl = (c - a) * Math.PI / 180, dn = (d - b) * Math.PI / 180;
  const x = Math.sin(dl/2)**2 + Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dn/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function shamsiBarHtml() {
  const today = new Date().toISOString().split('T')[0];
  const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tom = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [y, m, d] = selectedDate.split('-').map(Number);
  const j = gregorianToJalali(y, m, d);
  let yOpts = '', dOpts = '';
  for (let i = 1400; i <= 1410; i++) yOpts += `<option value="${i}" ${i===j.jy?'selected':''}>${i}</option>`;
  for (let i = 1; i <= 31; i++) dOpts += `<option value="${i}" ${i===j.jd?'selected':''}>${i}</option>`;
  const mOpts = PERSIAN_MONTHS.map((nm, idx) => `<option value="${idx+1}" ${idx+1===j.jm?'selected':''}>${nm}</option>`).join('');
  return `<div class="fg-card" style="padding:10px;">
    <div style="text-align:center;font-size:12px;font-weight:700;color:var(--primary);margin-bottom:6px;">
      <span class="ms" style="font-size:16px;">calendar_month</span> ${formatShamsi(selectedDate)}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;margin-bottom:6px;">
      <button class="btn btn-gray btn-sm" onclick="shiftDate(-1)">◀ قبل</button>
      <div style="display:flex;gap:3px;">
        <select id="sh-d" onchange="applyShamsi()" style="padding:4px;border-radius:6px;border:1px solid #cbd5e1;font-family:inherit;font-size:11px;">${dOpts}</select>
        <select id="sh-m" onchange="applyShamsi()" style="padding:4px;border-radius:6px;border:1px solid #cbd5e1;font-family:inherit;font-size:11px;">${mOpts}</select>
        <select id="sh-y" onchange="applyShamsi()" style="padding:4px;border-radius:6px;border:1px solid #cbd5e1;font-family:inherit;font-size:11px;">${yOpts}</select>
      </div>
      <button class="btn btn-gray btn-sm" onclick="shiftDate(1)">بعد ▶</button>
    </div>
    <div style="display:flex;justify-content:center;gap:6px;">
      <span class="f-pill ${selectedDate===yest?'active':''}" onclick="setDate('${yest}')">دیروز</span>
      <span class="f-pill ${selectedDate===today?'active':''}" onclick="setDate('${today}')">امروز</span>
      <span class="f-pill ${selectedDate===tom?'active':''}" onclick="setDate('${tom}')">فردا (آینده)</span>
    </div>
  </div>`;
}

function shiftDate(off) { const d = new Date(selectedDate); d.setDate(d.getDate() + off); setDate(d.toISOString().split('T')[0]); }
function applyShamsi() { setDate(jalaliToGregorian(+document.getElementById('sh-y').value, +document.getElementById('sh-m').value, +document.getElementById('sh-d').value)); }
function setDate(iso) { selectedDate = iso; pbIdx = 0; pbActive = false; clearInterval(pbTimer); renderUserTab(); }

function getPtsForDate(actU) {
  const today = new Date().toISOString().split('T')[0];
  if (selectedDate > today) return { future: true, pts: [] };
  if (selectedDate === today && actU.history && actU.history.length >= 4) return { future: false, pts: actU.history };
  let seed = 0; for (let i = 0; i < selectedDate.length; i++) seed += selectedDate.charCodeAt(i);
  const oLat = ((seed % 7) - 3) * 0.001, oLng = ((seed % 5) - 2) * 0.001;
  return {
    future: false,
    pts: [
      { lat: actU.lat + oLat - 0.0048, lng: actU.lng + oLng - 0.0052, speed: 32, time: "07:45:10" },
      { lat: actU.lat + oLat - 0.0032, lng: actU.lng + oLng - 0.0035, speed: 56, time: "08:01:25" },
      { lat: actU.lat + oLat - 0.0016, lng: actU.lng + oLng - 0.0018, speed: 88, time: "08:14:40" },
      { lat: actU.lat + oLat, lng: actU.lng + oLng, speed: 42, time: "08:26:00" }
    ]
  };
}

function fitRoute() { if (pbPts.length) map.fitBounds(L.latLngBounds(pbPts.map(p => [p.lat, p.lng])), { padding: [40, 40] }); }
function cyclePbSpeed() {
  const sp = [0.5, 1, 2, 4, 8];
  pbSpeed = sp[(sp.indexOf(pbSpeed) + 1) % sp.length];
  if (pbActive) { clearInterval(pbTimer); runPbLoop(); }
  renderUserTab();
}
function togglePlayback() {
  if (pbActive) { pbActive = false; clearInterval(pbTimer); renderUserTab(); return; }
  if (pbIdx >= pbPts.length - 1) pbIdx = 0;
  pbActive = true; fitRoute(); renderUserTab(); runPbLoop();
}
function runPbLoop() {
  clearInterval(pbTimer);
  pbTimer = setInterval(() => {
    if (pbIdx < pbPts.length) { scrubTo(pbIdx); pbIdx++; }
    else { pbActive = false; clearInterval(pbTimer); renderUserTab(); }
  }, Math.max(150, 900 / pbSpeed));
}
function scrubTo(i) {
  pbIdx = +i; const u = uState && uState.units.find(x => x.id === activeUnitId), pt = pbPts[pbIdx];
  if (!u || !pt || !markers[u.id]) return;
  markers[u.id].setLatLng([pt.lat, pt.lng]); map.panTo([pt.lat, pt.lng]);
  let d = 0; for (let k = 1; k <= pbIdx; k++) d += calcDistKm(pbPts[k-1].lat, pbPts[k-1].lng, pbPts[k].lat, pbPts[k].lng);
  if (document.getElementById('pb-sp')) document.getElementById('pb-sp').innerText = `${pt.speed} km/h`; if (document.getElementById('pb-ds')) document.getElementById('pb-ds').innerText = `${d.toFixed(3)} km`;
  if (document.getElementById('pb-tm')) document.getElementById('pb-tm').innerText = pt.time;
  if (document.getElementById('pb-rng')) document.getElementById('pb-rng').value = pbIdx;
}

const GPS_CMDS = {
  "Micodus MV720": { proto: "H02", stop: "RELAY,1#", start: "RELAY,0#", lock: "LOCK#", unlock: "UNLOCK#", loc: "WHERE#", st: "STATUS#", rst: "RESET#" },
  "Micodus MV208": { proto: "H02", stop: "RELAY,1#", start: "RELAY,0#", lock: "DOOR,1#", unlock: "DOOR,0#", loc: "WHERE#", st: "STATUS#", rst: "RESET#" },
  "Concox GT06": { proto: "GT06", stop: "RELAY,1#", start: "RELAY,0#", lock: "LOCKDOOR#", unlock: "UNLOCKDOOR#", loc: "URL#", st: "PARAM#", rst: "RESET#" },
  "Teltonika FMB920": { proto: "Codec8", stop: "setdigout 1", start: "setdigout 0", lock: "lvcanlockalldoors", unlock: "lvcanunlockalldoors", loc: "getgps", st: "getinfo", rst: "cpureset" }
};

function openCmdModal(uid) {
  const u = uState.units.find(x => x.id === uid); if (!u) return;
  const c = GPS_CMDS[u.model] || GPS_CMDS["Micodus MV720"];
  const doorOk = uState.user && uState.user.allowDoorLock !== false;
  showModal(`<h4 style="margin:0 0 4px;text-align:center;">مرکز فرمان ${u.name}</h4>
    <div style="text-align:center;font-size:11.5px;color:var(--primary);margin-bottom:10px;">مدل تشخیص داده‌شده: <b>${u.model} (${c.proto})</b></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
      <button class="btn btn-red btn-sm" onclick="sendGpsCmd('${u.id}','STOP','${c.stop}')"><span class="ms" style="font-size:16px;">power_settings_new</span> خاموش (${c.stop})</button>
      <button class="btn btn-green btn-sm" onclick="sendGpsCmd('${u.id}','START','${c.start}')"><span class="ms" style="font-size:16px;">vpn_key</span> روشن (${c.start})</button>
    </div>
    ${doorOk ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;background:var(--primary-soft);padding:8px;border-radius:10px;">
      <button class="btn btn-sm" onclick="sendGpsCmd('${u.id}','DOOR_LOCK','${c.lock}')"><span class="ms" style="font-size:16px;">lock</span> قفل درب (${c.lock})</button>
      <button class="btn btn-sm" style="background:#0284c7;" onclick="sendGpsCmd('${u.id}','DOOR_UNLOCK','${c.unlock}')"><span class="ms" style="font-size:16px;">lock_open</span> باز کردن درب</button>
    </div>` : `<div style="font-size:11px;color:var(--muted);text-align:center;margin-bottom:8px;">دسترسی قفل/باز کردن درب برای این حساب غیرفعال است.</div>`}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
      <button class="btn btn-gray btn-sm" onclick="sendGpsCmd('${u.id}','CUSTOM','${c.loc}')">موقعیت (${c.loc})</button>
      <button class="btn btn-gray btn-sm" onclick="sendGpsCmd('${u.id}','CUSTOM','${c.st}')">وضعیت (${c.st})</button>
      <button class="btn btn-gray btn-sm" onclick="sendGpsCmd('${u.id}','SECURITY','DEFENSE')">حالت امنیتی ۱۰۰م</button>
      <button class="btn btn-gray btn-sm" onclick="sendGpsCmd('${u.id}','CUSTOM','${c.rst}')">ریستارت (${c.rst})</button>
    </div>
    <div style="display:flex;gap:6px;"><input id="man-cmd" class="inp" style="margin:0;" placeholder="ارسال کد دستی..." dir="ltr"><button class="btn btn-sm" onclick="sendGpsCmd('${u.id}','CUSTOM',document.getElementById('man-cmd').value)">ارسال</button></div>
    <div class="close-bar" onclick="closeModal()">بستن</div>`);
}

async function sendGpsCmd(id, cmd, payload = '') {
  const r = await fetch(`/api/units/${id}/command`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cmd, payload }) });
  alert((await r.json()).message); loadUserState();
}

function openExportSheet() {
  showModal(`<h4 style="margin:0 0 8px;text-align:center;">خروجی گرفتن از مسیر</h4>` +
    ['xlsx', 'kml', 'gpx', 'geojson'].map(f => `<div class="menu-row" onclick="doTrackExport('${f}')"><b>فایل ${f.toUpperCase()}</b><span class="ms">download</span></div>`).join('') +
    `<div class="close-bar" onclick="closeModal()">بستن</div>`);
}
function doTrackExport(ext) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(pbPts, null, 2)], { type: 'application/json' }));
  a.download = `bmth_track_${selectedDate}.${ext}`; a.click(); closeModal();
}

// توسعه renderUserTab برای تب‌های فاز ۲
const _p1RenderUserTab = renderUserTab;
renderUserTab = function() {
  if (!uState) return;
  const body = document.getElementById('u-sheet-body');
  const actU = uState.units.find(x => x.id === activeUnitId) || uState.units[0];

  if (userTab === 'history' && actU) {
    const info = getPtsForDate(actU);
    if (info.future) {
      histLayer.clearLayers();
      body.innerHTML = shamsiBarHtml() + `<div class="fg-card" style="text-align:center;padding:24px;"><span class="ms" style="font-size:34px;color:var(--amber);">event_busy</span><div style="font-weight:700;margin-top:6px;">تاریخ آینده انتخاب شده است</div><div style="font-size:12px;color:var(--muted);">هنوز سفری در ${formatShamsi(selectedDate)} ثبت نشده است.</div></div>`;
      return;
    }
    pbPts = info.pts;
    let cum = [0];
    for (let i = 1; i < pbPts.length; i++) cum.push(+(cum[i-1] + calcDistKm(pbPts[i-1].lat, pbPts[i-1].lng, pbPts[i].lat, pbPts[i].lng)).toFixed(3));
    histLayer.clearLayers();
    for (let i = 0; i < pbPts.length - 1; i++) {
      const s = pbPts[i].speed, col = s < 40 ? '#2e7d32' : (s < 60 ? '#fbc02d' : (s < 80 ? '#f57c00' : '#d32f2f'));
      L.polyline([[pbPts[i].lat, pbPts[i].lng], [pbPts[i+1].lat, pbPts[i+1].lng]], { color: col, weight: 6 }).addTo(histLayer);
    }
    const cur = pbPts[Math.min(pbIdx, pbPts.length - 1)], curKm = cum[Math.min(pbIdx, cum.length - 1)];
    const maxS = Math.max(...pbPts.map(p => p.speed));
    body.innerHTML = `${shamsiBarHtml()}<div class="fg-card">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding-bottom:8px;margin-bottom:8px;">
        <div style="display:flex;gap:6px;">
          <button class="btn btn-sm" onclick="togglePlayback()"><span class="ms" style="font-size:16px;">${pbActive?'pause':'play_arrow'}</span> ${pbActive?'توقف':'پخش'}</button>
          <button class="btn btn-gray btn-sm" onclick="cyclePbSpeed()">${pbSpeed}x</button>
          <button class="btn btn-green btn-sm" onclick="fitRoute()">کل مسیر</button>
        </div>
        <span class="ms" style="color:#546e7a;cursor:pointer;" onclick="openExportSheet()">share</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:11px;direction:ltr;" id="pb-tm">${cur.time}</span>
        <input type="range" id="pb-rng" min="0" max="${pbPts.length-1}" value="${pbIdx}" oninput="scrubTo(this.value)" style="flex:1;accent-color:var(--primary);">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;background:var(--bg);padding:8px;border-radius:10px;text-align:center;margin-bottom:8px;">
        <div><small style="color:var(--muted);">سرعت</small><div style="font-weight:900;color:#d32f2f;" id="pb-sp">${cur.speed} km/h</div></div>
        <div><small style="color:var(--muted);">طی‌شده</small><div style="font-weight:900;color:var(--primary);" id="pb-ds">${curKm} km</div></div>
        <div><small style="color:var(--muted);">کل مسیر</small><div style="font-weight:900;color:#2e7d32;">${cum[cum.length-1]} km</div></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;"><span>حداکثر سرعت: <b>${maxS} km/h</b></span><span style="color:#f59e0b;">★★★★☆</span></div>
    </div>`;
    return;
  }

  if (userTab === 'trips' && actU) {
    body.innerHTML = `${shamsiBarHtml()}<div class="fg-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><b>سفرهای ${actU.name}</b><span style="color:#f59e0b;">★★★★☆</span></div>
      <div class="addr-line"><div class="p-icon">A</div><div>نقطه شروع — 07:45 • ${actU.address}</div></div>
      <div class="addr-line"><div class="p-icon">B</div><div>نقطه پایان — 08:26 • مسافت: <b>${actU.mileage} km</b></div></div>
      <button class="btn btn-sm btn-full" onclick="openUserTab('history')">نمایش و پخش روی نقشه</button>
    </div>`;
    return;
  }

  if (userTab === 'timeline' && actU) {
    body.innerHTML = `${shamsiBarHtml()}<div class="fg-card" style="border-right:3px solid #2e7d32;"><b>حرکت (Trip)</b><div style="font-size:12px;color:var(--muted);margin-top:4px;">07:45 تا 08:26 • حداکثر سرعت 88 km/h</div></div>
      <div class="fg-card" style="border-right:3px solid #1976d2;"><b>توقف (Stop)</b><div style="font-size:12px;color:var(--muted);margin-top:4px;">مدت توقف: 02:15:00 • ${actU.address}</div></div>`;
    return;
  }

  if (userTab === 'raw' && actU) {
    body.innerHTML = `<div class="fg-card"><div style="border-right:2px solid #4caf50;padding-right:12px;margin-right:4px;">
      <div style="font-size:12px;font-weight:700;color:#2e7d32;margin-bottom:6px;">● ${actU.lastTime}</div>
      <div style="font-family:monospace;font-size:11.5px;direction:ltr;text-align:left;line-height:1.7;">
        peer: app.bmth.ir:5023<br>vendor.code: HQ (${actU.model})<br>position.latitude: ${actU.lat.toFixed(6)}<br>position.longitude: ${actU.lng.toFixed(6)}<br>position.speed: ${actU.speed} km/h<br>position.satellites: ${actU.satellites}<br>battery.level: ${actU.battery}%<br>defense.active.status: ${actU.securityMode?'روشن':'خاموش'}<br>engine.ignition.status: ${actU.ignition?'روشن':'خاموش'}
      </div>
    </div></div>`;
    return;
  }

  _p1RenderUserTab();

  // اتصال دکمه‌های ترمینال و آخرین پیام در کارت یگان‌ها به مودال‌های فاز ۲
  if (userTab === 'units') {
    const list = uState.units.filter(u => (showHidden ? u.hidden : !u.hidden) && (!searchQ || u.name.includes(searchQ)));
    document.querySelectorAll('.unit-card').forEach((card, i) => {
      if (!list[i]) return;
      const termBtn = Array.from(card.querySelectorAll('.ms')).find(el => (el.dataset.icon === 'terminal' || el.innerText.trim() === 'terminal'));
      const rawBtn = Array.from(card.querySelectorAll('.ms')).find(el => (el.dataset.icon === 'drafts' || el.innerText.trim() === 'drafts'));
      if (termBtn) termBtn.onclick = (e) => { e.stopPropagation(); openCmdModal(list[i].id); };
      if (rawBtn) rawBtn.onclick = (e) => { e.stopPropagation(); activeUnitId = list[i].id; openUserTab('raw'); };
    });
  }
};
