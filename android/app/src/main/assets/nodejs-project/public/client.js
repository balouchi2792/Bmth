let session = JSON.parse(localStorage.getItem('bmth_session') || 'null');
let uState = null, activeUnitId = null, userTab = 'units', uSheetMode = 'half';
let showLabels = true, showHidden = false, compactView = false, searchQ = '';
let map = null, mapLayers = {}, curLayerKey = 'osm', markers = {}, gfLayer = null, secLayer = null, histLayer = null;

function switchAuth(m) {
  document.getElementById('atab-login').classList.toggle('active', m === 'login');
  document.getElementById('atab-reg').classList.toggle('active', m === 'reg');
  document.getElementById('login-box').style.display = m === 'login' ? 'block' : 'none';
  document.getElementById('reg-box').style.display = m === 'reg' ? 'block' : 'none';
}

async function doLogin() {
  const email = document.getElementById('l-email').value.trim();
  const password = document.getElementById('l-pass').value.trim();
  const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const d = await r.json();
  if (!d.ok) return alert(d.message);
  session = d; localStorage.setItem('bmth_session', JSON.stringify(session)); startApp();
}

async function doRegister() {
  const name = document.getElementById('r-name').value.trim();
  const email = document.getElementById('r-email').value.trim();
  const password = document.getElementById('r-pass').value.trim();
  const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
  const d = await r.json();
  if (!d.ok) return alert(d.message);
  session = { ok: true, role: 'user', user: d.user }; localStorage.setItem('bmth_session', JSON.stringify(session));
  alert('ثبت‌نام انجام شد! با ثبت هر خودرو، ۱۰ روز مهلت تست رایگان می‌گیرید.'); startApp();
}

function logout() { localStorage.removeItem('bmth_session'); location.reload(); }
function showModal(html) { document.getElementById('modal-content').innerHTML = html; document.getElementById('modal-bg').classList.add('open'); }
function closeModal() { document.getElementById('modal-bg').classList.remove('open'); }

function startApp() {
  if (!session) {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('user-app').style.display = 'none';
    document.getElementById('admin-console').style.display = 'none';
    return;
  }
  document.getElementById('auth-screen').style.display = 'none';
  if (session.role === 'admin') {
    document.getElementById('admin-console').style.display = 'flex';
    document.getElementById('user-app').style.display = 'none';
    if (typeof loadAdminState === 'function') loadAdminState();
  } else {
    document.getElementById('user-app').style.display = 'block';
    document.getElementById('admin-console').style.display = 'none';
    initMap(); loadUserState(); setInterval(loadUserState, 3500);
  }
}

function initMap() {
  if (map) return;
  map = L.map('map', { zoomControl: false }).setView([26.250875, 60.244280], 14);
  mapLayers = {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }),
    roadmap: L.tileLayer('http://mt0.google.com/vt/lyrs=m&hl=fa&x={x}&y={y}&z={z}', { maxZoom: 20 }),
    satellite: L.tileLayer('http://mt0.google.com/vt/lyrs=s&hl=fa&x={x}&y={y}&z={z}', { maxZoom: 20 }),
    hybrid: L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=fa&x={x}&y={y}&z={z}', { maxZoom: 20 })
  };
  mapLayers.osm.addTo(map);
  gfLayer = L.layerGroup().addTo(map);
  secLayer = L.layerGroup().addTo(map);
  histLayer = L.layerGroup().addTo(map);
}

function setMapLayer(key) {
  if (!mapLayers[key]) return;
  map.removeLayer(mapLayers[curLayerKey]);
  curLayerKey = key;
  mapLayers[key].addTo(map);
  closeModal();
}

async function loadUserState() {
  if (!session || session.role !== 'user') return;
  const r = await fetch(`/api/user/${session.user.id}/state`);
  if (!r.ok && r.status !== 403) { document.getElementById("u-sheet-body").innerHTML = "<div class=unit-card style=color:red;text-align:center>خطای سرور: " + r.status + "</div>"; return; }
  if (r.status === 403) { alert('حساب شما مسدود است.'); return logout(); }
  uState = await r.json();
  document.documentElement.style.setProperty('--primary', uState.themeColor);
  if (!activeUnitId && uState.units.length) activeUnitId = uState.units[0].id;
  document.getElementById('top-bell').innerText = uState.alerts.length;
  document.getElementById('nav-bell').innerText = uState.alerts.length;
  renderMap(); renderUserTab();
}

function renderMap() {
  if (!uState || !map) return;
  uState.units.forEach(u => {
    if (u.hidden) { if (markers[u.id]) { map.removeLayer(markers[u.id]); delete markers[u.id]; } return; }
    const col = u.isExpired ? '#9e9e9e' : u.color;
    const html = `<div class="fg-pin"><div class="fg-pin-pill">${showLabels ? `<span>${u.name}</span>` : ''}${getVehicleSvg(u.icon, col, 30)}</div><div class="fg-pin-dot"></div></div>`;
    const icon = L.divIcon({ html, className: '', iconSize: [0, 0], iconAnchor: [0, 0] });
    if (!markers[u.id]) markers[u.id] = L.marker([u.lat, u.lng], { icon }).addTo(map).on('click', () => { activeUnitId = u.id; renderUserTab(); });
    else { markers[u.id].setLatLng([u.lat, u.lng]); markers[u.id].setIcon(icon); }
  });
  gfLayer.clearLayers();
  uState.geofences.forEach(g => { if (g.visible) L.circle([g.lat, g.lng], { color: '#1976d2', fillColor: '#1976d2', fillOpacity: 0.12, weight: 2, radius: g.radius }).bindTooltip(g.name).addTo(gfLayer); });
  secLayer.clearLayers();
  const actU = uState.units.find(x => x.id === activeUnitId);
  if (actU && actU.securityMode && !actU.isExpired) L.circle([actU.secLat, actU.secLng], { color: '#4caf50', fillColor: '#4caf50', fillOpacity: 0.15, radius: 100 }).addTo(secLayer);
}

function toggleUSheet() {
  const s = document.getElementById('u-sheet'), c = document.getElementById('u-chev'), z = document.getElementById('zoom-stack');
  if (uSheetMode === 'half') { uSheetMode = 'collapsed'; s.className = 'u-sheet collapsed'; c.innerText = 'keyboard_arrow_up'; z.style.bottom = '175px'; }
  else if (uSheetMode === 'collapsed') { uSheetMode = 'expanded'; s.className = 'u-sheet expanded'; c.innerText = 'keyboard_arrow_down'; z.style.bottom = '175px'; }
  else { uSheetMode = 'half'; s.className = 'u-sheet'; c.innerText = 'keyboard_arrow_down'; z.style.bottom = '465px'; }
}

function openUserTab(tab) {
  userTab = tab;
  document.querySelectorAll('.n10-cell').forEach(e => e.classList.remove('active'));
  const n = document.getElementById('unav-' + tab);
  if (n) n.classList.add('active');
  const titles = { units: 'یگان‌ها', trips: 'سفرها', alerts: 'هشدارها', geofences: 'حصارهای جغرافیایی', provider: 'ارائه‌دهنده', stats: 'آمار', maint: 'نگهداری', timeline: 'جدول زمانی', history: 'تاریخچه', settings: 'تنظیمات' };
  document.getElementById('u-sheet-title').innerText = titles[tab] || 'یگان‌ها';
  if (uSheetMode === 'collapsed') toggleUSheet();
  renderUserTab();
}

function renderUserTab() {
  if (!uState) return;
  const body = document.getElementById('u-sheet-body');
  const actU = uState.units.find(x => x.id === activeUnitId) || uState.units[0];

  if (userTab === 'units') {
    let list = uState.units.filter(u => (showHidden ? u.hidden : !u.hidden) && (!searchQ || u.name.includes(searchQ)));
    const hidCnt = uState.units.filter(u => u.hidden).length;
    let h = '';
    if (searchQ) h += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px;"><span>نتیجه جستجو: <b>${searchQ}</b></span><button class="btn btn-sm btn-gray" onclick="searchQ='';renderUserTab()">پاک کردن</button></div>`;
    if (hidCnt) h += `<div style="text-align:left;margin-bottom:8px;"><button class="btn btn-sm" onclick="showHidden=!showHidden;renderUserTab()">${showHidden ? 'بازگشت به یگان‌ها' : `واحدهای پنهان (${hidCnt})`}</button></div>`;
    if (!list.length) h += `<div class="unit-card" style="text-align:center;color:#757575;">خودرویی در این بخش نیست. از آیکون خودرو بالای پنل ثبت کنید.</div>`;

    h += list.map(u => {
      if (compactView) {
        return `<div class="unit-card" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;" onclick="activeUnitId='${u.id}';focusUnit('${u.id}');renderUserTab()">
          <div class="unit-id">${getVehicleSvg(u.icon, u.isExpired?'#9e9e9e':u.color, 36)}<div><div class="unit-name">${u.name}</div><div class="unit-time"><span class="dot-g"></span><span>${u.lastTime}</span></div></div></div>
          <span class="ms" style="color:#757575;" onclick="event.stopPropagation();activeUnitId='${u.id}';openUserTab('history')">play_arrow</span>
        </div>`;
      }
      return `<div class="unit-card ${actU && u.id===actU.id?'active':''} ${u.isExpired?'expired':''}" onclick="activeUnitId='${u.id}';focusUnit('${u.id}');renderUserTab()">
        <div class="unit-head">
          <div class="unit-id">
            <div onclick="event.stopPropagation();activeUnitId='${u.id}';openIconPicker()" style="cursor:pointer;">${getVehicleSvg(u.icon, u.isExpired?'#9e9e9e':u.color, 40)}</div>
            <div><div class="unit-name">${u.name}</div><div class="unit-time"><span class="dot-g"></span><span>${u.lastTime}</span></div></div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="tag ${u.isExpired?'tag-red':'tag-green'}">${u.isExpired?'منقضی':u.remainingDays+' روز'}</span>
            <span class="ms" style="color:#757575;cursor:pointer;" onclick="event.stopPropagation();openUnitActionMenu('${u.id}')">more_vert</span>
          </div>
        </div>
        ${u.isExpired ? `<div style="padding:8px 10px;background:#ffebee;color:#c62828;border-radius:8px;font-size:11.5px;display:flex;justify-content:space-between;align-items:center;"><span>مهلت ۱۰ روزه تمام شده! برای تمدید پرداخت کنید.</span><button class="btn btn-red btn-sm" onclick="openRenewalModal('${u.id}')">پرداخت</button></div>` : `
        <div class="action-row" onclick="event.stopPropagation()">
          <span class="ms" title="تاریخچه" onclick="openRawPanel('${u.id}')">history</span>
          <span class="ms" title="رخدادها" onclick="openUnitDetails('${u.id}')">event_note</span>
          <span class="ms" title="سفرها" onclick="activeUnitId='${u.id}';openUserTab('trips')">route</span>
          <span class="ms" title="اشتراک موقعیت" onclick="alert('لینک موقعیت کپی شد')">share</span>
          <span class="ms" title="ابزارها" onclick="openToolsModal('${u.id}')">build</span>
          <span class="ms" title="تنظیمات" onclick="activeUnitId='${u.id}';openUserTab('settings')">settings</span>
          <span class="ms" title="آخرین پیام" onclick="activeUnitId='${u.id}';openUserTab('raw')">drafts</span>
        </div>
        <div class="action-row" style="border-top:1px solid var(--border);" onclick="event.stopPropagation()">
          <span class="ms" title="جهت حرکت" onclick="alert('جهت: ${u.directionText}')">explore</span>
          <span class="ms" title="پنهان کردن" onclick="toggleHide('${u.id}',${!u.hidden})">visibility_off</span>
          <span class="ms" style="color:#d32f2f;" title="قطع سوخت" onclick="quickCmd('${u.id}','STOP')">power_settings_new</span>
          <span class="ms" style="color:#2e7d32;" title="وصل سوخت" onclick="quickCmd('${u.id}','START')">vpn_key</span>
          <span class="ms" style="color:${u.securityMode?'#2e7d32':''};" title="حالت امنیتی ۱۰۰ متری" onclick="quickCmd('${u.id}','SECURITY')">verified_user</span>
          <span class="ms" style="color:var(--primary);" title="فرمان‌های GPS" onclick="openCmdModal('${u.id}')">terminal</span>
          <span class="ms" title="مسیریابی" onclick="focusUnit('${u.id}')">near_me</span>
        </div>
        <div class="addr-line"><div class="p-icon">P</div><div>${u.address}</div></div>
        <div class="unit-foot"><span>سطح شارژ باتری: <b>${u.battery}%</b></span><span>سرعت: <b>${u.speed} km/h</b></span></div>`}
      </div>`;
    }).join('');
    body.innerHTML = h;
  } else {
    body.innerHTML = `<div class="unit-card" style="text-align:center;padding:24px 12px;">
      <span class="ms" style="font-size:36px;color:var(--primary);margin-bottom:8px;">construction</span>
      <div style="font-weight:700;margin-bottom:4px;">بخش «${document.getElementById('u-sheet-title').innerText}» آماده ارتقا در فازهای ۲ و ۳</div>
      <div style="font-size:12px;color:var(--muted);">ابتدا ظاهر صفحه «یگان‌ها»، نقشه، آیکون‌های Material و منوها را چک کنید تا بلافاصله فاز ۲ را اضافه کنیم.</div>
    </div>`;
  }
}

function openHamburgerMenu() {
  showModal(`<div style="text-align:center;font-weight:700;margin-bottom:8px;font-size:14px;">${session.user.email}</div>
    <div class="menu-row" onclick="closeModal();openUserTab('alerts')"><div class="menu-row-r"><span class="ms">notifications</span><span>اعلان‌ها</span></div><span class="ms" style="font-size:18px;">chevron_left</span></div>
    <div class="menu-row" onclick="openMapTypeSheet()"><div class="menu-row-r"><span class="ms">map</span><span>نوع نقشه</span></div><span class="ms" style="font-size:18px;">chevron_left</span></div>
    <div class="menu-row" onclick="closeModal();document.body.classList.toggle('dark-mode')"><div class="menu-row-r"><span class="ms">dark_mode</span><span>تغییر پوسته روشن / تیره</span></div><span class="ms" style="font-size:18px;">chevron_left</span></div>
    <div class="menu-row" style="color:#d32f2f;" onclick="logout()"><div class="menu-row-r"><span class="ms" style="color:#d32f2f;">logout</span><span>خروج از حساب</span></div></div>
    <div class="close-bar" onclick="closeModal()">بستن</div>`);
}

function openMapTypeSheet() {
  showModal(`<div style="text-align:center;font-weight:700;margin-bottom:8px;">انتخاب نوع نقشه</div>
    <div class="menu-row" onclick="setMapLayer('osm')"><div class="menu-row-r"><span class="ms">map</span><span>OpenStreetMap</span></div></div>
    <div class="menu-row" onclick="setMapLayer('roadmap')"><div class="menu-row-r"><span class="ms">public</span><span>Google Roadmap</span></div></div>
    <div class="menu-row" onclick="setMapLayer('satellite')"><div class="menu-row-r"><span class="ms">satellite_alt</span><span>Google Satellite</span></div></div>
    <div class="menu-row" onclick="setMapLayer('hybrid')"><div class="menu-row-r"><span class="ms">layers</span><span>Google Hybrid</span></div></div>
    <div class="close-bar" onclick="closeModal()">بستن</div>`);
}

function openUnitsDotsMenu() {
  showModal(`<div class="menu-row" onclick="openAddUnitModal()"><div class="menu-row-r"><span class="ms" style="color:#2e7d32;">add_circle</span><span>ثبت ماشین جدید (۱۰ روز تست رایگان)</span></div></div>
    <div class="menu-row" onclick="closeModal();compactView=!compactView;renderUserTab()"><div class="menu-row-r"><span class="ms">view_list</span><span>${compactView ? 'نمای پیشخوان (کارتی)' : 'نمای فهرستی (خلاصه)'}</span></div></div>
    <div class="close-bar" onclick="closeModal()">بستن</div>`);
}

function openUnitActionMenu(uid) {
  activeUnitId = uid;
  showModal(`<div class="menu-row" onclick="openIconPicker()"><div class="menu-row-r"><span class="ms">palette</span><span>تغییر آیکون و رنگ خودرو</span></div></div>
    <div class="menu-row" onclick="closeModal();openUserTab('settings')"><div class="menu-row-r"><span class="ms">settings</span><span>تنظیمات دستگاه</span></div></div>
    <div class="close-bar" onclick="closeModal()">بستن</div>`);
}

function openAddUnitModal() {
  showModal(`<h4 style="margin:0 0 10px;">ثبت ماشین جدید (۱۰ روز تست رایگان)</h4>
    <input id="nu-n" class="inp" placeholder="نام ماشین (مثلاً: مزدا ۲۰۰۰)">
    <input id="nu-i" class="inp" placeholder="شماره سریال IMEI ردیاب" dir="ltr">
    <select id="nu-m" class="inp"><option>Micodus MV720</option><option>Micodus MV208</option><option>Concox GT06</option><option>Teltonika FMB920</option></select>
    <button class="btn btn-green btn-full" onclick="submitUnit()">ثبت ماشین و شروع ۱۰ روز تست</button>
    <div class="close-bar" onclick="closeModal()">بستن</div>`);
}

async function submitUnit() {
  const r = await fetch(`/api/user/${session.user.id}/units`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: document.getElementById('nu-n').value.trim(), imei: document.getElementById('nu-i').value.trim(), model: document.getElementById('nu-m').value, icon: 'pickup' }) });
  const d = await r.json(); if (!d.ok) return alert(d.message);
  closeModal(); activeUnitId = d.unit.id; loadUserState();
}

let pickCol = '#0284c7', pickIco = 'pickup';
function openIconPicker() {
  const u = uState.units.find(x => x.id === activeUnitId);
  if (u) { pickCol = u.color || '#0284c7'; pickIco = u.icon || 'pickup'; }
  drawIconPicker();
}
function drawIconPicker() {
  const cols = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0284c7', '#7c3aed', '#334155'];
  showModal(`<h4 style="margin:0 0 10px;text-align:center;">تغییر آیکون و رنگ خودرو</h4>
    <div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
      ${cols.map(c => `<div onclick="pickCol='${c}';drawIconPicker()" style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;border:${pickCol===c?'3px solid #111':'2px solid #fff'};box-shadow:0 1px 4px rgba(0,0,0,0.2);"></div>`).join('')}
      <label style="font-size:11px;background:#f1f5f9;color:#111;padding:4px 8px;border-radius:16px;cursor:pointer;display:flex;align-items:center;gap:4px;"><span>رنگ دستی</span><input type="color" value="${pickCol}" onchange="pickCol=this.value;drawIconPicker()" style="width:20px;height:20px;border:none;background:none;"></label>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;">
      ${VEHICLE_MODELS.map(m => `<div onclick="pickIco='${m.key}';drawIconPicker()" style="border:2px solid ${pickIco===m.key?'var(--primary)':'var(--border)'};border-radius:12px;padding:8px 4px;text-align:center;cursor:pointer;">${getVehicleSvg(m.key, pickCol, 42)}<div style="font-size:11px;margin-top:4px;">${m.label}</div></div>`).join('')}
    </div>
    <button class="btn btn-full" onclick="saveIconColor()">ذخیره آیکون و رنگ</button>
    <div class="close-bar" onclick="closeModal()">لغو</div>`);
}
async function saveIconColor() {
  await fetch(`/api/units/${activeUnitId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ color: pickCol, icon: pickIco }) });
  closeModal(); loadUserState();
}

async function quickCmd(id, cmd) {
  const r = await fetch(`/api/units/${id}/command`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cmd }) });
  alert((await r.json()).message); loadUserState();
}
async function toggleHide(id, hidden) { await fetch(`/api/units/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hidden }) }); loadUserState(); }
function openSearchUnit() { const q = prompt('نام خودرو را برای جستجو وارد کنید:', searchQ); if (q !== null) { searchQ = q.trim(); openUserTab('units'); } }
function focusUnit(id) { const u = uState && uState.units.find(x => x.id === id); if (u) map.setView([u.lat, u.lng], 15); }
function focusAllUnits() { if (!uState || !uState.units.length) return; map.fitBounds(L.latLngBounds(uState.units.map(u => [u.lat, u.lng])), { padding: [45, 45] }); }
function toggleLabels() { showLabels = !showLabels; document.getElementById('lbl-fab').style.color = showLabels ? 'var(--primary)' : '#9e9e9e'; renderMap(); }

function openToolsModal(uid) {
  activeUnitId = uid;
  const u = uState && uState.units.find(x => x.id === uid);
  if (!u) return;
  showModal(`<h4 style="margin:0 0 10px;text-align:center;">ابزارهای سخت‌افزار (${u.name})</h4>
    <div class="fg-card">
      <b>SetBox (پیکربندی از راه دور)</b>
      <div style="font-size:12px;color:var(--muted);margin:4px 0 8px;">مدل: ${u.model} | IMEI: ${u.imei}</div>
      <button class="btn btn-sm" onclick="closeModal();openCmdModal('${u.id}')">ارسال فرمان‌های پیکربندی</button>
    </div>
    <div class="fg-card">
      <b>ToolBox (پیام‌های خام ردیاب)</b>
      <div style="font-size:12px;color:var(--muted);margin:4px 0 8px;">مشاهده پارامترهای زنده دریافتی روی پورت 5023</div>
      <button class="btn btn-green btn-sm" onclick="closeModal();openUserTab('raw')">مشاهده آخرین پیام خام</button>
    </div>
    <div class="fg-card">
      <b>نگهداری و قطعات مصرفی</b>
      <div style="font-size:12px;color:var(--muted);margin:4px 0 8px;">مدیریت تعویض روغن، لنت و کارکرد ماهانه</div>
      <button class="btn btn-gray btn-sm" onclick="closeModal();openUserTab('maint')">باز کردن بخش نگهداری</button>
    </div>
    <div class="close-bar" onclick="closeModal()">بستن</div>`);
}

// === منطق دقیق مرحله ۱ ===
uSheetMode = 'collapsed';

function updateLeftBtnIcon() {
  const btn = document.getElementById('u-left-btn');
  if (!btn) return;
  const iconName = (uSheetMode === 'collapsed') ? 'keyboard_arrow_up' : 'menu';
  btn.innerHTML = iconName;
  if (typeof renderAllMsIcons === 'function') renderAllMsIcons();
}

function handleSheetLeftBtn() {
  if (uSheetMode === 'collapsed') {
    toggleUSheet();
  } else {
    openHamburgerMenu();
  }
}

toggleUSheet = function() {
  const s = document.getElementById('u-sheet');
  if (uSheetMode === 'collapsed') {
    uSheetMode = 'expanded';
    s.classList.remove('collapsed');
  } else {
    uSheetMode = 'collapsed';
    s.classList.add('collapsed');
  }
  updateLeftBtnIcon();
};

function toggleNavExpand() {
  document.body.classList.toggle('nav-open');
  if (map) setTimeout(() => map.invalidateSize(), 280);
}

// با زدن هر تب، اگر پنل بسته بود خودکار باز شود
const _origOpenUserTab = openUserTab;
openUserTab = function(tab) {
  userTab = tab;
  document.querySelectorAll('.n10-cell').forEach(e => e.classList.remove('active'));
  const n = document.getElementById('unav-' + tab);
  if (n) n.classList.add('active');
  const titles = { units: 'یگان‌ها', trips: 'سفرها', alerts: 'هشدارها', geofences: 'حصارهای جغرافیایی', provider: 'ارائه‌دهنده', stats: 'آمار', maint: 'نگهداری', timeline: 'جدول زمانی', history: 'تاریخچه', settings: 'تنظیمات', raw: 'آخرین پیام', appearance: 'تنظیمات ظاهر' };
  document.getElementById('u-sheet-title').innerText = titles[tab] || 'یگان‌ها';
  if (uSheetMode === 'collapsed') toggleUSheet();
  renderUserTab();
};

let expandedCards = {};
function toggleCardStats(uid) {
  expandedCards[uid] = !expandedCards[uid];
  renderUserTab();
}

const _p3RenderForCards = renderUserTab;
renderUserTab = function() {
  if (userTab === 'units' && uState) {
    const body = document.getElementById('u-sheet-body');
    const actU = uState.units.find(x => x.id === activeUnitId) || uState.units[0];
    let list = uState.units.filter(u => (showHidden ? u.hidden : !u.hidden) && (!searchQ || u.name.includes(searchQ)));
    const hidCnt = uState.units.filter(u => u.hidden).length;
    let h = '';
    if (searchQ) h += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px;"><span>جستجو: <b>${searchQ}</b></span><button class="btn btn-sm btn-gray" onclick="searchQ='';renderUserTab()">پاک کردن</button></div>`;
    if (hidCnt) h += `<div style="text-align:left;margin-bottom:8px;"><button class="btn btn-sm" onclick="showHidden=!showHidden;renderUserTab()">${showHidden ? 'بازگشت به یگان‌ها' : `واحدهای پنهان (${hidCnt})`}</button></div>`;
    if (!list.length) h += `<div class="unit-card" style="text-align:center;color:#757575;padding:16px;">خودرویی ثبت نشده است.</div>`;

    h += list.map(u => {
      const isAct = actU && u.id === actU.id;
      const isExp = expandedCards[u.id] !== undefined ? expandedCards[u.id] : isAct;
      return `<div class="unit-card ${isAct?'active':''} ${u.isExpired?'expired':''}" onclick="activeUnitId='${u.id}';focusUnit('${u.id}');renderUserTab()">
        <div class="unit-head">
          <div class="unit-id">
            <div onclick="event.stopPropagation();activeUnitId='${u.id}';openIconPicker()" style="cursor:pointer;">${getVehicleSvg(u.icon, u.isExpired?'#9e9e9e':u.color, 38)}</div>
            <div>
              <div class="unit-name">${u.name}</div>
              <div class="unit-time"><span class="dot-g"></span><span>${u.lastTime}</span></div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            ${u.isExpired ? `<span class="tag tag-red">منقضی</span>` : ''}
            <span class="ms" style="color:#616161;cursor:pointer;" onclick="event.stopPropagation();openUnitActionMenu('${u.id}')">more_vert</span>
          </div>
        </div>

        ${u.isExpired ? `<div style="padding:8px;background:#ffebee;color:#c62828;border-radius:8px;font-size:11.5px;display:flex;justify-content:space-between;align-items:center;direction:rtl;"><span>مهلت ۱۰ روزه تمام شده!</span><button class="btn btn-red btn-sm" onclick="openRenewalModal('${u.id}')">پرداخت</button></div>` : `
        <!-- ردیف ۱: ۸ آیکون دقیقاً مطابق اسکرین‌شات -->
        <div class="fg-grid-8" onclick="event.stopPropagation()">
          <span class="ms" title="رخدادها" onclick="openUnitDetails('${u.id}')">event_note</span>
          <span class="ms" title="فرمان‌های GPS" onclick="openCmdModal('${u.id}')">terminal</span>
          <span class="ms" title="سفرها" onclick="activeUnitId='${u.id}';openUserTab('trips')">route</span>
          <span class="ms" title="تاریخچه" onclick="openRawPanel('${u.id}')">history</span>
          <span class="ms" title="مسیریابی" onclick="openNavigationModal('${u.id}')">directions</span>
          <span class="ms" title="فوکوس روی نقشه" onclick="focusUnit('${u.id}')">my_location</span>
          <span class="ms" title="آخرین پیام خام" onclick="openUnitInfoSheet('${u.id}')">info</span>
          <span class="ms" title="جهت حرکت" onclick="alert('جهت: ${u.directionText}')">navigation</span>
        </div>
        <!-- ردیف ۲: ۶ آیکون دقیقاً مطابق اسکرین‌شات -->
        <div class="fg-grid-8" onclick="event.stopPropagation()">
          <span class="ms" title="قطع سوخت / قفل" onclick="quickCmd('${u.id}','STOP')">lock</span>
          <span class="ms" title="وصل سوخت / باز" onclick="quickCmd('${u.id}','START')">lock_open</span>
          <span class="ms" style="color:${u.securityMode?'#2e7d32':''};" title="حالت امنیتی" onclick="quickCmd('${u.id}','SECURITY')">shield</span>
          <span class="ms" title="مسیر حرکت" onclick="activeUnitId='${u.id}';openUserTab('history')">timeline_s</span>
          <span class="ms" title="اشتراک‌گذاری" onclick="alert('لینک موقعیت کپی شد')">share</span>
          <span class="ms" title="ابزارها" onclick="activeUnitId='${u.id}';openUserTab('settings')">dvr</span>
        </div>

        <div class="fg-addr-box">
          <div class="p-circle">P</div>
          <div class="fg-addr-txt">
            <div>${u.address}</div>
            <div class="fg-park-time">1 روز 07:53</div>
          </div>
        </div>

        ${isExp ? `
          <div class="fg-stats-exp">
            <div class="fg-stat-line"><span>سرعت:</span><span class="stat-pill">${u.speed} km/h</span></div>
            <div class="fg-stat-line"><span>سطح شارژ باتری:</span><span class="stat-pill">${u.battery} %</span></div>
          </div>
        ` : `
          <div class="fg-stats-col">
            <span>سرعت: <span class="stat-pill">${u.speed} km/h</span></span>
            <span>سطح شارژ باتری: <span class="stat-pill">${u.battery} %</span></span>
          </div>
        `}
        <div class="card-chev" onclick="event.stopPropagation();toggleCardStats('${u.id}')">
          <span class="ms" style="font-size:18px;">${isExp ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>
        </div>`}
      </div>`;
    }).join('');
    body.innerHTML = h;
    return;
  }
  _p3RenderForCards();
};

function openNavigationModal(uid) {
  const u = uState && uState.units.find(x => x.id === uid);
  if (!u) return;
  const lat = u.lat.toFixed(6);
  const lng = u.lng.toFixed(6);
  const gMaps = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const neshan = `https://neshan.org/maps/routing/car/destination/${lat},${lng}`;
  const balad = `https://balad.ir/location?latitude=${lat}&longitude=${lng}&zoom=16`;
  const waze = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  const geo = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(u.name)})`;

  showModal(`
    <h4 style="margin:0 0 4px;text-align:center;">مسیریابی به سمت ${u.name}</h4>
    <div style="text-align:center;font-size:11.5px;color:var(--muted);margin-bottom:12px;" dir="ltr">${lat}, ${lng}</div>
    <div class="menu-row" onclick="window.open('${neshan}','_blank');closeModal()">
      <div class="menu-row-r"><span class="ms" style="color:#1976d2;">directions</span><b>مسیریابی با نشان (Neshan)</b></div>
      <span class="ms" style="font-size:18px;">chevron_left</span>
    </div>
    <div class="menu-row" onclick="window.open('${balad}','_blank');closeModal()">
      <div class="menu-row-r"><span class="ms" style="color:#2e7d32;">map</span><b>مسیریابی با بلد (Balad)</b></div>
      <span class="ms" style="font-size:18px;">chevron_left</span>
    </div>
    <div class="menu-row" onclick="window.open('${gMaps}','_blank');closeModal()">
      <div class="menu-row-r"><span class="ms" style="color:#d32f2f;">location_on</span><b>مسیریابی با گوگل مپ (Google Maps)</b></div>
      <span class="ms" style="font-size:18px;">chevron_left</span>
    </div>
    <div class="menu-row" onclick="window.open('${waze}','_blank');closeModal()">
      <div class="menu-row-r"><span class="ms" style="color:#0284c7;">navigation</span><b>مسیریابی با ویز (Waze)</b></div>
      <span class="ms" style="font-size:18px;">chevron_left</span>
    </div>
    <div class="menu-row" onclick="location.href='${geo}';closeModal()">
      <div class="menu-row-r"><span class="ms" style="color:#546e7a;">near_me</span><span>باز کردن در اپ مسیریاب گوشی</span></div>
      <span class="ms" style="font-size:18px;">chevron_left</span>
    </div>
    <div class="close-bar" onclick="closeModal()">بستن</div>
  `);
}

function openUnitInfoSheet(uid) {
  const u = uState && uState.units.find(x => x.id === uid);
  if (!u) return;
  const now = new Date();
  const lastDate = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} ${u.lastTime || '00:00:00'}`;
  const firstDate = u.firstMsgTime || '16/10/2026 16:30:05';
  const sat = u.satellites || 8;
  const usedMb = u.storageMb || '7.38';
  const pct = ((parseFloat(usedMb) / 200) * 100).toFixed(2);
  const isOnline = !u.isExpired;

  showModal(`
    <div style="direction:rtl;font-size:13px;line-height:2;color:#37474f;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <div style="display:flex;align-items:center;gap:6px;font-weight:700;color:${isOnline?'#2e7d32':'#d32f2f'};">
          <span style="width:9px;height:9px;border-radius:50%;background:${isOnline?'#4caf50':'#f44336'};display:inline-block;"></span>
          <span>${isOnline ? 'آنلاین' : 'آفلاین'}</span>
        </div>
        <span class="ms" title="مشاهده آخرین پیام‌ها" style="color:#546e7a;cursor:pointer;font-size:21px;" onclick="closeModal();openRawPanel('${u.id}')">drafts</span>
      </div>
      <div>ماهواره‌ها: <b>${sat}</b></div>
      <div>زمان اولین پیام دریافتی: <b dir="ltr">${firstDate}</b></div>
      <div>زمان آخرین پیام دریافتی: <b dir="ltr">${lastDate}</b></div>
      <div>زمان آخرین موقعیت دریافتی: <b dir="ltr">${lastDate}</b></div>
      <div style="margin-top:8px;">فضای ذخیره‌سازی پیام: <b dir="ltr">${usedMb}/200 MB (${pct}%)</b></div>
      <div>زمان ذخیره‌سازی پیش‌بینی شده: <b>365 روز</b></div>
    </div>
    <div class="close-bar" style="margin-top:8px;border-top:1px solid var(--border);" onclick="closeModal()">بستن</div>
  `);
}

let _fgToastTimer = null;
function showGreenToast(msg) {
  let t = document.getElementById('fg-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'fg-toast';
    document.body.appendChild(t);
  }
  t.innerHTML = `<span>${msg}</span><span class="fg-toast-x" onclick="document.getElementById('fg-toast').classList.remove('show')">×</span>`;
  t.classList.add('show');
  clearTimeout(_fgToastTimer);
  _fgToastTimer = setTimeout(() => t.classList.remove('show'), 4000);
}

function showCmdConfirm(cmdLabel, onConfirm) {
  let bg = document.getElementById('fg-confirm-bg');
  if (!bg) {
    bg = document.createElement('div');
    bg.id = 'fg-confirm-bg';
    document.body.appendChild(bg);
  }
  bg.innerHTML = `
    <div class="fg-confirm-box">
      <div class="fg-confirm-title">ارسال دستور</div>
      <div class="fg-confirm-msg">آیا مطمئن هستید که می‌خواهید یک فرمان "${cmdLabel}" ارسال کنید؟</div>
      <div class="fg-confirm-acts">
        <span class="fg-btn-cancel" id="fg-c-no">لغو</span>
        <span class="fg-btn-send" id="fg-c-yes">ارسال</span>
      </div>
    </div>`;
  bg.classList.add('open');
  document.getElementById('fg-c-no').onclick = () => bg.classList.remove('open');
  document.getElementById('fg-c-yes').onclick = async () => {
    bg.classList.remove('open');
    await onConfirm();
  };
}

// بازنویسی quickCmd برای نمایش پنجره تأیید و پیام سبز
quickCmd = function(uid, cmd) {
  const labels = { STOP: 'مسدود کردن', START: 'رفع انسداد', SECURITY: 'حالت امنیتی' };
  const lbl = labels[cmd] || cmd;
  showCmdConfirm(lbl, async () => {
    await fetch(`/api/units/${uid}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd })
    });
    showGreenToast(`فرمان "${lbl}" ارسال شد`);
    loadUserState();
  });
};
