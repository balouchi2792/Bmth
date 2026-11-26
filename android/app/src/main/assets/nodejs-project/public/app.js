let session = JSON.parse(localStorage.getItem('bmth_session') || 'null');
let uState = null;
let aState = null;
let activeUnitId = null;
let userTab = 'units';
let adminTab = 'dash';
let uSheetMode = 'half';
let showLabels = true;
let showHiddenUnits = false;
let compactListView = false;

let map = null;
let tiles = [];
let tileIdx = 0;
let unitMarkers = {};
let gfLayer = null;
let secLayer = null;
let histLayer = null;

function switchAuth(mode) {
    document.getElementById('atab-login').classList.toggle('active', mode === 'login');
    document.getElementById('atab-reg').classList.toggle('active', mode === 'reg');
    document.getElementById('login-box').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('reg-box').style.display = mode === 'reg' ? 'block' : 'none';
}

async function doLogin() {
    const email = document.getElementById('l-email').value.trim();
    const password = document.getElementById('l-pass').value.trim();
    const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.ok) return alert(data.message);
    session = data;
    localStorage.setItem('bmth_session', JSON.stringify(session));
    startApp();
}

async function doRegister() {
    const name = document.getElementById('r-name').value.trim();
    const email = document.getElementById('r-email').value.trim();
    const password = document.getElementById('r-pass').value.trim();
    const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!data.ok) return alert(data.message);
    session = { ok: true, role: 'user', user: data.user };
    localStorage.setItem('bmth_session', JSON.stringify(session));
    alert('ثبت‌نام انجام شد! اکنون ماشین خود را ثبت کنید تا ۱۰ روز مهلت تست رایگان فعال شود.');
    startApp();
}

function logout() {
    localStorage.removeItem('bmth_session');
    session = null;
    location.reload();
}

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
        loadAdminState();
    } else {
        document.getElementById('user-app').style.display = 'block';
        document.getElementById('admin-console').style.display = 'none';
        document.getElementById('ham-user-email').innerText = session.user.email;
        initMap();
        loadUserState();
        setInterval(loadUserState, 3500);
    }
}

function initMap() {
    if (map) return;
    map = L.map('map', { zoomControl: false }).setView([26.250875, 60.244280], 14);
    tiles = [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }),
        L.tileLayer('http://mt0.google.com/vt/lyrs=m&hl=fa&x={x}&y={y}&z={z}', { maxZoom: 20 }),
        L.tileLayer('http://mt0.google.com/vt/lyrs=s&hl=fa&x={x}&y={y}&z={z}', { maxZoom: 20 }),
        L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=fa&x={x}&y={y}&z={z}', { maxZoom: 20 })
    ];
    tiles[0].addTo(map);
    gfLayer = L.layerGroup().addTo(map);
    secLayer = L.layerGroup().addTo(map);
    histLayer = L.layerGroup().addTo(map);
}

async function loadUserState() {
    if (!session || session.role !== 'user') return;
    const res = await fetch(`/api/user/${session.user.id}/state`);
    if (res.status === 403) { alert('حساب شما مسدود شده است.'); return logout(); }
    uState = await res.json();
    document.documentElement.style.setProperty('--primary', uState.themeColor);
    if (!activeUnitId && uState.units.length > 0) activeUnitId = uState.units[0].id;
    document.getElementById('notif-badge').innerText = uState.alerts.length;
    document.getElementById('top-bell-badge').innerText = uState.alerts.length;
    renderMap();
    renderUserTab();
}

function renderMap() {
    if (!uState || !map) return;
    uState.units.forEach(u => {
        if (u.hidden) {
            if (unitMarkers[u.id]) { map.removeLayer(unitMarkers[u.id]); delete unitMarkers[u.id]; }
            return;
        }
        const col = u.isExpired ? '#999' : u.color;
        const html = `
            <div class="fg-marker-wrap">
                <div class="fg-marker-pill">
                    ${showLabels ? `<span>${u.name}</span>` : ''}
                    <i class="fas ${u.icon}" style="color:${col};"></i>
                </div>
                <div class="fg-heading-arrow"></div>
            </div>
        `;
        const icon = L.divIcon({ html, className: '', iconSize: [0, 0], iconAnchor: [0, 0] });
        if (!unitMarkers[u.id]) {
            unitMarkers[u.id] = L.marker([u.lat, u.lng], { icon }).addTo(map).on('click', () => { activeUnitId = u.id; renderUserTab(); });
        } else {
            unitMarkers[u.id].setLatLng([u.lat, u.lng]);
            unitMarkers[u.id].setIcon(icon);
        }
    });

    gfLayer.clearLayers();
    uState.geofences.forEach(g => {
        if (g.visible) L.circle([g.lat, g.lng], { color: '#1976d2', fillColor: '#1976d2', fillOpacity: 0.12, weight: 2, radius: g.radius }).bindTooltip(g.name).addTo(gfLayer);
    });

    secLayer.clearLayers();
    const actU = uState.units.find(x => x.id === activeUnitId);
    if (actU && actU.securityMode && !actU.isExpired) {
        L.circle([actU.secLat, actU.secLng], { color: '#2e7d32', fillColor: '#4caf50', fillOpacity: 0.15, radius: 100 }).addTo(secLayer);
    }
}

function toggleUSheet() {
    const sh = document.getElementById('u-sheet');
    const ch = document.getElementById('u-chev');
    if (uSheetMode === 'half') { uSheetMode = 'collapsed'; sh.className = 'u-sheet collapsed'; ch.className = 'fas fa-chevron-up'; }
    else if (uSheetMode === 'collapsed') { uSheetMode = 'expanded'; sh.className = 'u-sheet expanded'; ch.className = 'fas fa-chevron-down'; }
    else { uSheetMode = 'half'; sh.className = 'u-sheet'; ch.className = 'fas fa-chevron-down'; }
}

function openUserTab(tab) {
    userTab = tab;
    document.querySelectorAll('.n10-cell').forEach(c => c.classList.remove('active'));
    const el = document.getElementById('unav-' + tab);
    if (el) el.classList.add('active');
    const titles = {
        units: 'یگان‌ها', trips: 'سفرها', alerts: 'هشدارها', geofences: 'حصارهای جغرافیایی',
        provider: 'ارائه‌دهنده', stats: 'آمار', maint: 'نگهداری', timeline: 'جدول زمانی',
        history: 'تاریخچه', settings: 'تنظیمات', raw: 'آخرین پیام', share: 'اشتراک‌گذاری واحدها', billing: 'تمدید اشتراک'
    };
    document.getElementById('u-sheet-title').innerText = titles[tab] || 'یگان‌ها';
    if (uSheetMode === 'collapsed') { uSheetMode = 'half'; document.getElementById('u-sheet').className = 'u-sheet'; }
    if (histLayer) histLayer.clearLayers();
    renderUserTab();
}

function dateTabsHtml() {
    return `<div class="date-tabs-strip"><div class="date-tab active">امروز</div><div class="date-tab">دیروز</div><div class="date-tab">آبان ۱۱</div><div class="date-tab">آبان ۱۰</div><div class="date-tab">آبان ۹</div></div>`;
}
function renderUserTab() {
    if (!uState) return;
    const body = document.getElementById('u-sheet-body');
    const actU = uState.units.find(x => x.id === activeUnitId) || uState.units[0];

    if (userTab === 'units') {
        const list = uState.units.filter(u => showHiddenUnits ? u.hidden : !u.hidden);
        const hiddenCnt = uState.units.filter(u => u.hidden).length;
        let html = hiddenCnt > 0 ? `<div style="margin-bottom:8px; text-align:left;"><button class="btn btn-sm" onclick="showHiddenUnits=!showHiddenUnits; renderUserTab();">${showHiddenUnits ? 'بازگشت به یگان‌ها' : `واحدهای پنهان (${hiddenCnt})`}</button></div>` : '';
        if (list.length === 0) html += `<div class="fg-white-box" style="text-align:center;">خودرویی ثبت نشده است. برای ثبت ماشین روی آیکون خودرو بالای پنل بزنید.</div>`;

        html += list.map(u => {
            if (compactListView) {
                return `
                    <div class="fg-unit-card" style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px;" onclick="activeUnitId='${u.id}'; focusActiveUnit(); renderUserTab();">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <i class="fas ${u.icon}" style="font-size:20px; color:${u.color};"></i>
                            <div><div class="fg-unit-title">${u.name}</div><div class="fg-unit-sub"><span class="dot-online"></span><span>${u.lastTime}</span></div></div>
                        </div>
                        <i class="fas fa-play" style="color:#888; font-size:13px;" onclick="event.stopPropagation(); activeUnitId='${u.id}'; openUserTab('history');"></i>
                    </div>`;
            }
            return `
                <div class="fg-unit-card ${actU && u.id === actU.id ? 'selected' : ''} ${u.isExpired ? 'expired' : ''}" onclick="activeUnitId='${u.id}'; focusActiveUnit(); renderUserTab();">
                    <div class="fg-unit-top">
                        <div class="fg-unit-id">
                            <div class="fg-unit-avatar" onclick="event.stopPropagation(); activeUnitId='${u.id}'; openModal('modal-icon-picker')">
                                <i class="fas ${u.icon}" style="color:${u.isExpired ? '#999' : u.color};"></i>
                            </div>
                            <div>
                                <div class="fg-unit-title">${u.name}</div>
                                <div class="fg-unit-sub"><span class="dot-online"></span><span>${u.lastTime}</span></div>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="tag ${u.isExpired ? 'tag-red' : 'tag-green'}">${u.isExpired ? 'منقضی' : `${u.remainingDays} روز`}</span>
                            <i class="fas fa-ellipsis-v" style="color:#888; padding:4px; cursor:pointer;" onclick="event.stopPropagation(); openModal('modal-unit-list-dots')"></i>
                        </div>
                    </div>
                    ${u.isExpired ? `
                        <div style="padding:8px; background:#ffebee; color:#c62828; border-radius:8px; font-size:11.5px; display:flex; justify-content:space-between; align-items:center;">
                            <span>مهلت ۱۰ روزه تمام شده! برای فعال‌سازی هزینه پرداخت کنید.</span>
                            <button class="btn btn-red btn-sm" onclick="event.stopPropagation(); openUserTab('billing')">پرداخت</button>
                        </div>
                    ` : `
                        <div class="fg-icon-row" onclick="event.stopPropagation()">
                            <i class="fas fa-history" title="تاریخچه" onclick="activeUnitId='${u.id}'; openUserTab('history')"></i>
                            <i class="fas fa-list-ul" title="رخدادها" onclick="activeUnitId='${u.id}'; openUserTab('alerts')"></i>
                            <i class="fas fa-route" title="سفرها" onclick="activeUnitId='${u.id}'; openUserTab('trips')"></i>
                            <i class="fas fa-share-alt" title="موقعیت" onclick="openUserTab('share')"></i>
                            <i class="fas fa-wrench" title="ابزارها" onclick="openModal('modal-tools')"></i>
                            <i class="fas fa-cog" title="تنظیمات" onclick="activeUnitId='${u.id}'; openUserTab('settings')"></i>
                            <i class="fas fa-envelope-open-text" title="آخرین پیام" onclick="activeUnitId='${u.id}'; openUserTab('raw')"></i>
                        </div>
                        <div class="fg-icon-row" onclick="event.stopPropagation()">
                            <i class="fas fa-compass" title="جهت" onclick="alert('جهت حرکت: ${u.directionText}')"></i>
                            <i class="fas fa-eye-slash" title="پنهان کردن" onclick="toggleHideUnit('${u.id}', ${!u.hidden})"></i>
                            <i class="fas fa-lock" style="color:#d32f2f" title="مسدود کردن" onclick="sendUnitCmd('${u.id}', 'STOP')"></i>
                            <i class="fas fa-lock-open" style="color:#2e7d32" title="رفع انسداد" onclick="sendUnitCmd('${u.id}', 'START')"></i>
                            <i class="fas fa-shield-alt" style="color:${u.securityMode ? '#2e7d32' : ''}" title="حالت امنیتی" onclick="sendUnitCmd('${u.id}', 'SECURITY')"></i>
                            <i class="fas fa-location-arrow" title="مسیریابی" onclick="focusActiveUnit()"></i>
                        </div>
                        <div class="fg-addr-row"><div class="p-square">P</div><div>${u.address}</div></div>
                        <div class="fg-bottom-stats"><span>سطح شارژ باتری: <b>${u.battery}%</b></span><span>سرعت: <b>${u.speed} km/h</b></span></div>
                    `}
                </div>`;
        }).join('');
        body.innerHTML = html;
    } else if (userTab === 'history' && actU) {
        const pts = actU.history;
        for (let i = 0; i < pts.length - 1; i++) {
            const s = pts[i].speed;
            const c = s < 40 ? '#2e7d32' : (s < 60 ? '#fbc02d' : (s < 80 ? '#f57c00' : '#d32f2f'));
            L.polyline([[pts[i].lat, pts[i].lng], [pts[i+1].lat, pts[i+1].lng]], { color: c, weight: 5 }).addTo(histLayer);
        }
        const maxS = Math.max(...pts.map(p => p.speed));
        body.innerHTML = `${dateTabsHtml()}<div class="fg-white-box"><div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;"><i class="fas fa-play" style="color:#1976d2; font-size:18px; cursor:pointer;" onclick="playHistoryRoute()"></i><div style="display:flex; gap:18px; font-size:16px; color:#555;"><i class="fas fa-flag"></i><i class="fas fa-parking"></i><i class="fas fa-chart-line" onclick="openUserTab('stats')"></i><i class="fas fa-share-alt" onclick="exportFile('kml')"></i></div></div><div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;"><span style="background:#2e7d32; color:#fff; width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold;">A</span><b>00:00:15</b></div><div style="font-size:12px; color:#555; margin-bottom:8px;">مسافت پیموده شده: <b>${actU.mileage} km</b> • حداکثر سرعت: <b>${maxS} km/h</b></div><div style="display:flex; align-items:center; gap:10px;"><span style="background:#1976d2; color:#fff; width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold;">B</span><b>23:59:59</b></div></div>`;
    } else if (userTab === 'stats' && actU) {
        const maxD = Math.max(...actU.dailyKm, 10);
        body.innerHTML = `<div class="fg-white-box"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;"><b>مسافت پیموده شده</b><button class="btn btn-sm" onclick="exportFile('xlsx')">استخراج (.xlsx)</button></div><div style="display:flex; align-items:flex-end; justify-content:space-between; height:110px; padding-top:14px; border-bottom:1px solid #e0e0e0;">${actU.dailyKm.map((v, i) => `<div style="flex:1; display:flex; flex-direction:column; align-items:center;"><small style="font-size:9.5px; color:#666;">${v}</small><div style="width:14px; height:${Math.round((v/maxD)*75)}px; background:#f59e0b; border-radius:4px 4px 0 0;"></div><small style="font-size:9.5px; margin-top:4px; color:#666;">روز ${i+1}</small></div>`).join('')}</div></div><div class="fg-white-box"><div style="display:flex; justify-content:space-between; font-size:12.5px;"><span>یگان‌ها</span><b>${uState.units.length} / ${uState.plan.maxUnits}</b></div><div class="fg-progress-track"><div class="fg-progress-fill" style="width:${Math.min(100, (uState.units.length/uState.plan.maxUnits)*100)}%"></div></div></div><div class="fg-white-box"><div style="display:flex; justify-content:space-between; font-size:12.5px;"><span>حصارهای جغرافیایی</span><b>${uState.geofences.length} / ${uState.plan.maxGeofences}</b></div><div class="fg-progress-track"><div class="fg-progress-fill" style="width:${Math.min(100, (uState.geofences.length/uState.plan.maxGeofences)*100)}%"></div></div></div>`;
    } else if (userTab === 'alerts') {
        body.innerHTML = dateTabsHtml() + uState.alerts.map(a => `<div class="fg-white-box" style="display:flex; justify-content:space-between; align-items:center;"><div style="display:flex; align-items:center; gap:10px;"><i class="fas fa-draw-polygon" style="color:#888;"></i><span style="font-size:12.5px;">${a.text}</span></div><small style="color:#888; direction:ltr;">${a.time}</small></div>`).join('');
    } else if (userTab === 'geofences') {
        body.innerHTML = `<div style="display:flex; gap:8px; margin-bottom:10px;"><button class="btn btn-sm" style="flex:1;" onclick="createGeofence()">+ حصار جغرافیایی جدید</button><button class="btn btn-sm" style="background:#555;" onclick="toggleAllGeofences()">نمایش / پنهان کردن</button></div>` + uState.geofences.map(g => `<div class="fg-white-box"><div style="display:flex; justify-content:space-between;"><b>${g.name}</b><span class="tag tag-green">فعال</span></div><div style="font-size:11.5px; color:#666; margin-top:4px;">مساحت: ${g.area} • محیط: ${g.perimeter}</div></div>`).join('');
    } else if (userTab === 'maint' && actU) {
        body.innerHTML = `<div class="fg-white-box"><div style="display:flex; justify-content:space-between; align-items:center;"><b>شمارنده‌های مسافت پیموده شده</b><button class="btn btn-amber btn-sm" onclick="sendUnitCmd('${actU.id}', 'RESET_KM')">بازنشانی</button></div><div style="font-size:12px; margin-top:6px;">${actU.maintKm.A} / ${actU.maintKm.limit} km</div><div class="fg-progress-track"><div class="fg-progress-fill" style="width:${Math.min(100, (actU.maintKm.A/actU.maintKm.limit)*100)}%"></div></div></div><div class="fg-white-box"><div style="display:flex; justify-content:space-between; align-items:center;"><b>شمارنده‌های ساعات موتور</b><button class="btn btn-amber btn-sm" onclick="sendUnitCmd('${actU.id}', 'RESET_HR')">بازنشانی</button></div><div style="font-size:12px; margin-top:6px;">ساعت ${actU.maintHr.A} / ${actU.maintHr.limit}</div><div class="fg-progress-track"><div class="fg-progress-fill" style="width:${Math.min(100, (actU.maintHr.A/actU.maintHr.limit)*100)}%; background:#2e7d32;"></div></div></div>`;
    } else if (userTab === 'settings' && actU) {
        body.innerHTML = `<div class="fg-white-box"><div style="display:flex; justify-content:space-between; align-items:center;"><b>تنظیمات ${actU.name}</b><button class="btn btn-sm" onclick="openModal('modal-icon-picker')">تغییر آیکون</button></div><div style="font-size:12px; color:#666; margin:8px 0;">نوع دستگاه: <b>${actU.model}</b> • شناسه: <b>${actU.imei}</b><br>مسافت پیموده شده کل: <b>${actU.mileage} km</b></div><button class="btn btn-green btn-sm" onclick="addExtraField('${actU.id}')">+ فیلدهای اضافی</button></div>`;
    } else if (userTab === 'billing') {
        body.innerHTML = `<div class="fg-white-box" style="border-right:4px solid #1976d2;"><b>تمدید اشتراک و پرداخت هزینه در bmth</b><p style="font-size:12px; line-height:1.7;">هر خودروی جدید به مدت <b>۱۰ روز رایگان</b> فعال است.<br>تعرفه تمدید پس از ۱۰ روز: <b>${uState.subscriptionPrice}</b><br>پس از پرداخت، مدیر سیستم اشتراک خودروی شما را تمدید خواهد کرد.</p></div>`;
    } else if (userTab === 'provider') {
        body.innerHTML = `<div class="fg-white-box"><b>ارائه‌دهنده خدمات</b><p style="font-size:12.5px;">نام: <b>${uState.brandName}</b><br>ایمیل: <b>${uState.company.email}</b></p></div>`;
    } else if (userTab === 'share') {
        body.innerHTML = `<button class="btn btn-green btn-full" style="margin-bottom:8px;" onclick="createShareLink()">+ ایجاد پیوند اشتراک‌گذاری موقت</button>` + (uState.sharedLinks.map(s => `<div class="fg-white-box"><b>${s.name}</b> (${s.hours} ساعت)<div style="font-size:11px; color:#1976d2; margin-top:4px;" dir="ltr">${s.url}</div></div>`).join('') || '<div class="fg-white-box">هیچ پیوندی وجود ندارد.</div>');
    } else if (userTab === 'raw' && actU) {
        body.innerHTML = `<div class="fg-white-box" style="direction:ltr; font-size:12px;"><div><b>battery.level:</b> ${actU.battery}%</div><div><b>defense.active.status:</b> ${actU.securityMode ? 'روشن' : 'خاموش'}</div><div><b>engine.ignition.status:</b> ${actU.ignition ? 'روشن' : 'خاموش'}</div><div><b>position.latitude:</b> ${actU.lat.toFixed(6)}</div><div><b>position.longitude:</b> ${actU.lng.toFixed(6)}</div><div><b>position.speed:</b> ${actU.speed} km/h</div><div><b>vendor.code:</b> HQ (${actU.model})</div></div>`;
    } else {
        body.innerHTML = `${dateTabsHtml()}<div class="fg-white-box"><div style="display:flex; align-items:center; gap:10px;"><div class="p-square">P</div><div><div style="font-size:12.5px; font-weight:bold;">${actU ? actU.address : ''}</div><small style="color:#888;">مدت زمان توقف: 08:23:43</small></div></div></div>`;
    }
}
async function createUserUnit() {
    const name = document.getElementById('nu-name').value.trim();
    const imei = document.getElementById('nu-imei').value.trim();
    const model = document.getElementById('nu-model').value;
    const icon = document.getElementById('nu-icon').value;
    const res = await fetch(`/api/user/${session.user.id}/units`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, imei, model, icon }) });
    const data = await res.json();
    if (!data.ok) return alert(data.message);
    closeModals();
    activeUnitId = data.unit.id;
    alert('خودرو ثبت شد و ۱۰ روز مهلت تست رایگان برای آن فعال گردید!');
    loadUserState();
}

async function sendUnitCmd(id, cmd) {
    const res = await fetch(`/api/units/${id}/command`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cmd }) });
    const d = await res.json();
    alert(d.message);
    loadUserState();
}

async function toggleHideUnit(id, hidden) {
    await fetch(`/api/units/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hidden }) });
    loadUserState();
}

async function setUnitVisual(color, icon) {
    if (!activeUnitId) return;
    const payload = {};
    if (color) payload.color = color;
    if (icon) payload.icon = icon;
    await fetch(`/api/units/${activeUnitId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    closeModals();
    loadUserState();
}

async function addExtraField(id) {
    const name = prompt('نام فیلد اضافی:');
    if (!name) return;
    const value = prompt('مقدار:');
    await fetch(`/api/units/${id}/extra-fields`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, value, showOnCard: true }) });
    loadUserState();
}

async function createGeofence() {
    const name = prompt('نام حصار جغرافیایی:', 'حصار جغرافیایی من ۱');
    if (!name) return;
    const radius = prompt('شعاع دایره (متر):', '460');
    await fetch(`/api/user/${session.user.id}/geofences`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, radius }) });
    loadUserState();
}

async function toggleAllGeofences() {
    await fetch(`/api/user/${session.user.id}/geofences/toggle`, { method: 'POST' });
    loadUserState();
}

async function createShareLink() {
    const name = prompt('نام پیوند اشتراک‌گذاری:', 'لینک موقت ۱ ساعته');
    if (!name) return;
    await fetch(`/api/user/${session.user.id}/share`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, hours: 1 }) });
    loadUserState();
}

function exportFile(ext) {
    const actU = uState.units.find(x => x.id === activeUnitId);
    const blob = new Blob([JSON.stringify(actU ? actU.history : [], null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bmth_export.${ext}`;
    a.click();
}

function playHistoryRoute() {
    const actU = uState.units.find(x => x.id === activeUnitId);
    if (!actU) return;
    let i = 0;
    const t = setInterval(() => {
        if (i < actU.history.length) {
            unitMarkers[actU.id].setLatLng([actU.history[i].lat, actU.history[i].lng]);
            map.panTo([actU.history[i].lat, actU.history[i].lng]);
            i++;
        } else clearInterval(t);
    }, 800);
}

function focusActiveUnit() {
    const actU = uState && uState.units.find(x => x.id === activeUnitId);
    if (actU) map.setView([actU.lat, actU.lng], 15);
}

function toggleLabels() { showLabels = !showLabels; renderMap(); }
function cycleMapTile() { map.removeLayer(tiles[tileIdx]); tileIdx = (tileIdx + 1) % tiles.length; tiles[tileIdx].addTo(map); }
function toggleDarkTheme() { document.body.classList.toggle('dark-mode'); }

function toggleAdminDrawer() { document.getElementById('c-drawer').classList.toggle('open'); }

async function loadAdminState() {
    const res = await fetch('/api/admin/state');
    aState = await res.json();
    document.documentElement.style.setProperty('--primary', aState.themeColor);
    renderAdminTab();
}

function openAdminTab(tab) {
    adminTab = tab;
    document.getElementById('c-drawer').classList.remove('open');
    renderAdminTab();
}

function renderAdminTab() {
    if (!aState) return;
    const box = document.getElementById('c-content');
    if (adminTab === 'dash') {
        const activeCount = aState.users.filter(u => u.status === 'active').length;
        const blockedCount = aState.users.filter(u => u.status === 'blocked').length;
        box.innerHTML = `<h3 style="margin-top:0;">داشبورد bmth Console</h3><div class="kpi-grid"><div class="kpi-box"><div><b style="font-size:20px;">${aState.users.length}</b><div style="font-size:11px;color:#64748b;">کل حساب‌ها</div></div><i class="fas fa-users" style="font-size:22px;color:var(--primary)"></i></div><div class="kpi-box"><div><b style="font-size:20px;color:#16a34a;">${activeCount}</b><div style="font-size:11px;color:#64748b;">حساب‌های فعال</div></div><i class="fas fa-user-check" style="font-size:22px;color:#16a34a"></i></div><div class="kpi-box"><div><b style="font-size:20px;color:#dc2626;">${blockedCount}</b><div style="font-size:11px;color:#64748b;">مسدود شده</div></div><i class="fas fa-user-slash" style="font-size:22px;color:#dc2626"></i></div><div class="kpi-box"><div><b style="font-size:20px;color:#d97706;">${aState.allUnits.length}</b><div style="font-size:11px;color:#64748b;">کل دستگاه‌ها</div></div><i class="fas fa-car" style="font-size:22px;color:#d97706"></i></div></div>`;
    } else if (adminTab === 'accounts') {
        box.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;"><h3 style="margin:0;">حساب‌ها</h3><button class="btn btn-green btn-sm" onclick="createAdminAccount()">+ حساب</button></div>` + aState.users.map(u => `<div class="c-card"><div style="display:flex; justify-content:space-between; align-items:center;"><div><b>${u.name}</b> <small>(#${u.id})</small><div style="font-size:11.5px; color:#475569;">ایمیل: <b dir="ltr">${u.email}</b></div></div><span class="tag ${u.status === 'active' ? 'tag-green' : 'tag-red'}">${u.status === 'active' ? 'فعال' : 'مسدود'}</span></div><div style="font-size:12px; margin:6px 0; color:#dc2626;">رمز عبور: <code dir="ltr" style="background:#fee2e2; padding:2px 6px; border-radius:6px;">${u.password}</code></div><div style="background:#f8fafc; padding:8px; border-radius:10px; font-size:11.5px; margin-bottom:8px;"><b>واحدها (${u.units.length}):</b>${u.units.map(car => `<div style="margin-top:4px;">• ${car.name} (${car.imei}) — <b style="color:${car.isExpired?'#dc2626':'#16a34a'}">${car.isExpired ? 'منقضی' : `${car.remainingDays} روز`}</b></div>`).join('')}</div><div style="display:flex; gap:6px;"><button class="btn btn-sm" onclick="openAdminEditUser('${u.id}')">ویرایش و تغییر رمز</button><button class="btn btn-red btn-sm" onclick="deleteUser('${u.id}')">حذف</button></div></div>`).join('');
    } else if (adminTab === 'units') {
        box.innerHTML = `<h3 style="margin-top:0;">واحدها و تمدید اشتراک</h3>` + aState.allUnits.map(car => `<div class="c-card" style="border-right:4px solid ${car.isExpired ? '#dc2626' : '#16a34a'}"><div style="display:flex; justify-content:space-between;"><b>${car.name} (${car.model})</b><span class="tag ${car.isExpired ? 'tag-red' : 'tag-green'}">${car.isExpired ? 'منقضی' : `${car.remainingDays} روز باقی‌مانده`}</span></div><div style="font-size:11.5px; color:#64748b; margin:4px 0 8px 0;">شناسه واحد: <b>${car.imei}</b> • میزبان سرور: <b>TCP 5023</b></div><div style="display:flex; gap:6px; flex-wrap:wrap;"><button class="btn btn-green btn-sm" onclick="extendUnit('${car.id}', 30)">+ تمدید ۳۰ روزه (تایید پرداخت)</button><button class="btn btn-sm" onclick="extendUnit('${car.id}', 365)">+ تمدید ۱ ساله</button><button class="btn btn-red btn-sm" onclick="expireUnit('${car.id}')">انقضای فوری</button></div></div>`).join('');
    } else if (adminTab === 'roles') {
        box.innerHTML = `<h3 style="margin-top:0;">مدیریت نقش‌ها (RBAC)</h3>` + aState.roles.map(r => `<div class="c-card"><b>${r.name}</b><div style="font-size:11.5px; color:#64748b; margin:4px 0 8px 0;">${r.desc}</div><table class="rbac-table"><tr><th>نام دسترسی</th><th>کامل</th><th>خواندن</th><th>ایجاد</th><th>به‌روزرسانی</th></tr>${Object.entries(r.perms).map(([k, v]) => `<tr><td>${k}</td><td>${v.full ? '✅' : '—'}</td><td>${v.read ? '✅' : '—'}</td><td>${v.create ? '✅' : '—'}</td><td>${v.update ? '✅' : '—'}</td></tr>`).join('')}</table></div>`).join('');
    } else if (adminTab === 'design') {
        box.innerHTML = `<h3 style="margin-top:0;">طراحی برنامه</h3><div class="c-card"><p style="font-size:12px;">رنگ اصلی سیستم:</p><div style="display:flex; gap:10px; margin:12px 0;">${['#1976d2', '#0d9488', '#7c3aed', '#e11d48', '#d97706', '#16a34a'].map(c => `<div onclick="saveAdminCfg('${c}')" style="width:34px; height:34px; border-radius:50%; background:${c}; cursor:pointer;"></div>`).join('')}</div><label style="font-size:12px;">تعرفه اشتراک:</label><input type="text" id="cfg-price" class="inp" value="${aState.subscriptionPrice}"><label style="font-size:12px;">رمز عبور ادمین:</label><input type="text" id="cfg-apass" class="inp" value="${aState.admin.password}" dir="ltr"><button class="btn btn-full" onclick="saveAdminCfg()">ذخیره</button></div>`;
    } else {
        box.innerHTML = `<div class="c-card"><b>بخش ${adminTab} در bmth Console</b><p style="font-size:12px; color:#64748b;">تمام خدمات و برنامه‌های مشتری فعال هستند.</p></div>`;
    }
}

function openAdminEditUser(uid) {
    const u = aState.users.find(x => x.id === uid);
    if (!u) return;
    document.getElementById('eu-id').value = u.id;
    document.getElementById('eu-name').value = u.name;
    document.getElementById('eu-email').value = u.email;
    document.getElementById('eu-pass').value = u.password;
    document.getElementById('eu-status').value = u.status;
    document.getElementById('eu-role').innerHTML = aState.roles.map(r => `<option value="${r.id}" ${r.id===u.roleId?'selected':''}>${r.name}</option>`).join('');
    openModal('modal-admin-edit-user');
}

async function saveAdminUser() {
    const id = document.getElementById('eu-id').value;
    await fetch(`/api/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: document.getElementById('eu-name').value, email: document.getElementById('eu-email').value, password: document.getElementById('eu-pass').value, roleId: document.getElementById('eu-role').value, status: document.getElementById('eu-status').value }) });
    closeModals();
    loadAdminState();
}

async function createAdminAccount() {
    const name = prompt('نام کاربر جدید:');
    if (!name) return;
    const email = prompt('ایمیل کاربر:');
    const password = prompt('رمز عبور:', '123456');
    await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
    loadAdminState();
}

async function deleteUser(id) {
    if (!confirm('کاربر و خودروهایش حذف شوند؟')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    loadAdminState();
}

async function extendUnit(id, days) {
    const res = await fetch(`/api/admin/units/${id}/extend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days }) });
    const d = await res.json();
    alert(d.message);
    loadAdminState();
}

async function expireUnit(id) {
    await fetch(`/api/admin/units/${id}/expire`, { method: 'POST' });
    loadAdminState();
}

async function saveAdminCfg(color) {
    const priceEl = document.getElementById('cfg-price');
    const passEl = document.getElementById('cfg-apass');
    await fetch('/api/admin/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ themeColor: color || aState.themeColor, subscriptionPrice: priceEl ? priceEl.value : aState.subscriptionPrice, adminPassword: passEl ? passEl.value : aState.admin.password }) });
    loadAdminState();
}

function openModal(id) {
    document.getElementById('modal-bg').classList.add('open');
    document.querySelectorAll('.modal-sheet').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}
function closeModalBg(e) { if (e.target.id === 'modal-bg') closeModals(); }
function closeModals() { document.getElementById('modal-bg').classList.remove('open'); }

startApp();

// آیکون‌های گرافیکی رنگی اختصاصی (SVG)
const VEHICLE_SVGS = {
    'pickup': (c) => `<svg viewBox="0 0 64 32" width="38" height="20"><rect x="4" y="12" width="54" height="11" rx="3" fill="${c}"/><path d="M18 12 L24 4 L40 4 L44 12 Z" fill="${c}"/><path d="M25 6 L38 6 L41 11 L22 11 Z" fill="#e0f2fe"/><rect x="6" y="7" width="14" height="5" rx="1" fill="#334155"/><circle cx="16" cy="24" r="5" fill="#1e293b"/><circle cx="16" cy="24" r="2.2" fill="#cbd5e1"/><circle cx="48" cy="24" r="5" fill="#1e293b"/><circle cx="48" cy="24" r="2.2" fill="#cbd5e1"/><rect x="55" y="14" width="4" height="3" rx="1" fill="#fef08a"/></svg>`,
    'nissan': (c) => `<svg viewBox="0 0 64 34" width="40" height="22"><rect x="3" y="8" width="34" height="16" rx="2" fill="#1d4ed8"/><rect x="38" y="6" width="21" height="18" rx="3" fill="${c}"/><path d="M44 8 L55 8 L58 14 L44 14 Z" fill="#e0f2fe"/><circle cx="15" cy="26" r="5.5" fill="#0f172a"/><circle cx="15" cy="26" r="2.5" fill="#94a3b8"/><circle cx="49" cy="26" r="5.5" fill="#0f172a"/><circle cx="49" cy="26" r="2.5" fill="#94a3b8"/></svg>`,
    'sedan': (c) => `<svg viewBox="0 0 64 30" width="38" height="19"><path d="M6 16 L12 14 L20 6 L42 6 L50 14 L58 16 L58 22 L6 22 Z" fill="${c}"/><path d="M22 8 L40 8 L46 14 L16 14 Z" fill="#e0f2fe"/><circle cx="16" cy="23" r="5" fill="#1e293b"/><circle cx="16" cy="23" r="2.2" fill="#cbd5e1"/><circle cx="48" cy="23" r="5" fill="#1e293b"/><circle cx="48" cy="23" r="2.2" fill="#cbd5e1"/><rect x="55" y="16" width="4" height="3" fill="#fef08a"/></svg>`,
    'suv': (c) => `<svg viewBox="0 0 64 32" width="38" height="20"><path d="M6 15 L10 6 L44 6 L52 14 L58 16 L58 23 L6 23 Z" fill="${c}"/><path d="M13 8 L26 8 L26 14 L10 14 Z" fill="#e0f2fe"/><path d="M29 8 L42 8 L48 14 L29 14 Z" fill="#e0f2fe"/><circle cx="16" cy="24" r="5.2" fill="#1e293b"/><circle cx="16" cy="24" r="2.3" fill="#cbd5e1"/><circle cx="48" cy="24" r="5.2" fill="#1e293b"/><circle cx="48" cy="24" r="2.3" fill="#cbd5e1"/></svg>`,
    'moto': (c) => `<svg viewBox="0 0 64 34" width="36" height="20"><circle cx="14" cy="24" r="7" fill="none" stroke="#1e293b" stroke-width="3.5"/><circle cx="50" cy="24" r="7" fill="none" stroke="#1e293b" stroke-width="3.5"/><path d="M14 24 L26 14 L40 14 L50 24 M26 14 L22 8 L16 8 M38 14 L43 7 L48 9" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="32" cy="14" rx="9" ry="4" fill="${c}"/></svg>`,
    'van': (c) => `<svg viewBox="0 0 64 32" width="38" height="20"><rect x="5" y="6" width="53" height="18" rx="4" fill="${c}"/><rect x="10" y="9" width="12" height="7" rx="1.5" fill="#e0f2fe"/><rect x="25" y="9" width="12" height="7" rx="1.5" fill="#e0f2fe"/><path d="M40 9 L53 9 L56 16 L40 16 Z" fill="#e0f2fe"/><circle cx="16" cy="25" r="5" fill="#1e293b"/><circle cx="16" cy="25" r="2.2" fill="#cbd5e1"/><circle cx="48" cy="25" r="5" fill="#1e293b"/><circle cx="48" cy="25" r="2.2" fill="#cbd5e1"/></svg>`
};

function getVehicleSvg(iconKey, color) {
    const mapOld = { 'fa-truck-pickup': 'pickup', 'fa-truck': 'nissan', 'fa-car-side': 'sedan', 'fa-motorcycle': 'moto' };
    const key = VEHICLE_SVGS[iconKey] ? iconKey : (mapOld[iconKey] || 'sedan');
    return VEHICLE_SVGS[key](color || '#0284c7');
}

// جایگزینی رندر نقشه و کارت‌ها با آیکون‌های رنگی جدید
const _origRenderMap = renderMap;
renderMap = function() {
    if (!uState || !map) return;
    uState.units.forEach(u => {
        if (u.hidden) {
            if (unitMarkers[u.id]) { map.removeLayer(unitMarkers[u.id]); delete unitMarkers[u.id]; }
            return;
        }
        const col = u.isExpired ? '#94a3b8' : u.color;
        const html = `
            <div class="fg-marker-wrap">
                <div class="fg-marker-pill" style="padding:3px 7px;">
                    ${showLabels ? `<span>${u.name}</span>` : ''}
                    ${getVehicleSvg(u.icon, col)}
                </div>
                <div class="fg-heading-arrow" style="border-top-color:${col};"></div>
            </div>
        `;
        const icon = L.divIcon({ html, className: '', iconSize: [0, 0], iconAnchor: [0, 0] });
        if (!unitMarkers[u.id]) {
            unitMarkers[u.id] = L.marker([u.lat, u.lng], { icon }).addTo(map).on('click', () => { activeUnitId = u.id; renderUserTab(); });
        } else {
            unitMarkers[u.id].setLatLng([u.lat, u.lng]);
            unitMarkers[u.id].setIcon(icon);
        }
    });
    gfLayer.clearLayers();
    uState.geofences.forEach(g => {
        if (g.visible) L.circle([g.lat, g.lng], { color: '#1976d2', fillColor: '#1976d2', fillOpacity: 0.12, weight: 2, radius: g.radius }).bindTooltip(g.name).addTo(gfLayer);
    });
    secLayer.clearLayers();
    const actU = uState.units.find(x => x.id === activeUnitId);
    if (actU && actU.securityMode && !actU.isExpired) {
        L.circle([actU.secLat, actU.secLng], { color: '#2e7d32', fillColor: '#4caf50', fillOpacity: 0.15, radius: 100 }).addTo(secLayer);
    }
};

// آیکون‌های سه‌بعدی از بالا (Top-Down 3D Isometric) دقیقاً مشابه Forguard
const TOPDOWN_SVGS = {
    'pickup': (c) => `<svg viewBox="0 0 48 84" width="24" height="42"><ellipse cx="24" cy="43" rx="18" ry="38" fill="rgba(0,0,0,0.18)"/><rect x="8" y="6" width="32" height="72" rx="9" fill="${c}" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/><path d="M11 22 L37 22 L34 33 L14 33 Z" fill="#1e293b"/><rect x="12" y="34" width="24" height="16" rx="3" fill="${c}" stroke="rgba(255,255,255,0.35)" stroke-width="1"/><rect x="11" y="52" width="26" height="22" rx="2" fill="#334155"/><line x1="15" y1="53" x2="15" y2="73" stroke="#475569" stroke-width="1.5"/><line x1="24" y1="53" x2="24" y2="73" stroke="#475569" stroke-width="1.5"/><line x1="33" y1="53" x2="33" y2="73" stroke="#475569" stroke-width="1.5"/><rect x="11" y="7" width="6" height="3" rx="1" fill="#fef08a"/><rect x="31" y="7" width="6" height="3" rx="1" fill="#fef08a"/><rect x="11" y="75" width="6" height="2.5" rx="1" fill="#ef4444"/><rect x="31" y="75" width="6" height="2.5" rx="1" fill="#ef4444"/></svg>`,
    'sedan': (c) => `<svg viewBox="0 0 48 84" width="24" height="42"><ellipse cx="24" cy="43" rx="17" ry="38" fill="rgba(0,0,0,0.18)"/><rect x="9" y="6" width="30" height="72" rx="11" fill="${c}" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/><path d="M12 24 L36 24 L33 35 L15 35 Z" fill="#1e293b"/><rect x="13" y="36" width="22" height="18" rx="4" fill="${c}" stroke="rgba(255,255,255,0.4)" stroke-width="1"/><path d="M14 55 L34 55 L36 63 L12 63 Z" fill="#1e293b"/><rect x="12" y="7" width="6" height="3" rx="1" fill="#fef08a"/><rect x="30" y="7" width="6" height="3" rx="1" fill="#fef08a"/><rect x="12" y="74" width="6" height="2.5" rx="1" fill="#ef4444"/><rect x="30" y="74" width="6" height="2.5" rx="1" fill="#ef4444"/></svg>`,
    'suv': (c) => `<svg viewBox="0 0 48 84" width="24" height="42"><ellipse cx="24" cy="43" rx="18" ry="38" fill="rgba(0,0,0,0.18)"/><rect x="8" y="6" width="32" height="72" rx="9" fill="${c}" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/><path d="M11 22 L37 22 L34 32 L14 32 Z" fill="#1e293b"/><rect x="12" y="33" width="24" height="32" rx="3" fill="${c}" stroke="rgba(255,255,255,0.35)" stroke-width="1"/><line x1="15" y1="38" x2="15" y2="62" stroke="rgba(0,0,0,0.3)" stroke-width="1.5"/><line x1="33" y1="38" x2="33" y2="62" stroke="rgba(0,0,0,0.3)" stroke-width="1.5"/><path d="M13 66 L35 66 L36 71 L12 71 Z" fill="#1e293b"/><rect x="11" y="7" width="6" height="3" rx="1" fill="#fef08a"/><rect x="31" y="7" width="6" height="3" rx="1" fill="#fef08a"/></svg>`,
    'nissan': (c) => `<svg viewBox="0 0 48 86" width="24" height="43"><ellipse cx="24" cy="44" rx="18" ry="39" fill="rgba(0,0,0,0.2)"/><rect x="8" y="6" width="32" height="28" rx="6" fill="${c}" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/><path d="M11 16 L37 16 L34 25 L14 25 Z" fill="#1e293b"/><rect x="7" y="35" width="34" height="45" rx="3" fill="#1d4ed8" stroke="#1e3a8a" stroke-width="1.5"/><line x1="13" y1="36" x2="13" y2="79" stroke="#3b82f6" stroke-width="1.5"/><line x1="24" y1="36" x2="24" y2="79" stroke="#3b82f6" stroke-width="1.5"/><line x1="35" y1="36" x2="35" y2="79" stroke="#3b82f6" stroke-width="1.5"/></svg>`,
    'moto': (c) => `<svg viewBox="0 0 48 84" width="22" height="40"><ellipse cx="24" cy="43" rx="10" ry="35" fill="rgba(0,0,0,0.18)"/><rect x="20" y="8" width="8" height="16" rx="4" fill="#1e293b"/><rect x="20" y="60" width="8" height="16" rx="4" fill="#1e293b"/><rect x="11" y="24" width="26" height="4" rx="2" fill="#475569"/><ellipse cx="24" cy="36" rx="8" ry="12" fill="${c}"/><rect x="19" y="45" width="10" height="16" rx="4" fill="#0f172a"/></svg>`,
    'van': (c) => `<svg viewBox="0 0 48 86" width="24" height="43"><ellipse cx="24" cy="44" rx="18" ry="39" fill="rgba(0,0,0,0.18)"/><rect x="8" y="6" width="32" height="74" rx="8" fill="${c}" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/><path d="M11 16 L37 16 L35 26 L13 26 Z" fill="#1e293b"/><rect x="12" y="29" width="24" height="42" rx="3" fill="${c}" stroke="rgba(255,255,255,0.4)" stroke-width="1"/><rect x="11" y="7" width="6" height="3" rx="1" fill="#fef08a"/><rect x="31" y="7" width="6" height="3" rx="1" fill="#fef08a"/></svg>`
};

function getTopDownSvg(iconKey, color, scale = 1) {
    const legacy = { 'fa-truck-pickup': 'pickup', 'fa-truck': 'nissan', 'fa-car-side': 'sedan', 'fa-motorcycle': 'moto' };
    const k = TOPDOWN_SVGS[iconKey] ? iconKey : (legacy[iconKey] || 'pickup');
    return `<div style="transform:scale(${scale}); display:inline-flex; align-items:center; justify-content:center;">${TOPDOWN_SVGS[k](color || '#0284c7')}</div>`;
}

// بروزرسانی آیکون‌های نقشه و کارت‌ها با مدل سه‌بعدی از بالا
renderMap = function() {
    if (!uState || !map) return;
    uState.units.forEach(u => {
        if (u.hidden) {
            if (unitMarkers[u.id]) { map.removeLayer(unitMarkers[u.id]); delete unitMarkers[u.id]; }
            return;
        }
        const col = u.isExpired ? '#94a3b8' : u.color;
        const html = `
            <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -50%);">
                ${showLabels ? `<div style="background:#fff; color:#111; padding:2px 8px; border-radius:8px; font-size:10.5px; font-weight:bold; box-shadow:0 2px 6px rgba(0,0,0,0.2); margin-bottom:2px; white-space:nowrap;">${u.name}</div>` : ''}
                ${getTopDownSvg(u.icon, col, 0.95)}
            </div>
        `;
        const icon = L.divIcon({ html, className: '', iconSize: [0, 0], iconAnchor: [0, 0] });
        if (!unitMarkers[u.id]) {
            unitMarkers[u.id] = L.marker([u.lat, u.lng], { icon }).addTo(map).on('click', () => { activeUnitId = u.id; renderUserTab(); });
        } else {
            unitMarkers[u.id].setLatLng([u.lat, u.lng]);
            unitMarkers[u.id].setIcon(icon);
        }
    });
    gfLayer.clearLayers();
    uState.geofences.forEach(g => {
        if (g.visible) L.circle([g.lat, g.lng], { color: '#1976d2', fillColor: '#1976d2', fillOpacity: 0.12, weight: 2, radius: g.radius }).bindTooltip(g.name).addTo(gfLayer);
    });
    secLayer.clearLayers();
    const actU = uState.units.find(x => x.id === activeUnitId);
    if (actU && actU.securityMode && !actU.isExpired) {
        L.circle([actU.secLat, actU.secLng], { color: '#2e7d32', fillColor: '#4caf50', fillOpacity: 0.15, radius: 100 }).addTo(secLayer);
    }
};

// تزریق آیکون سه‌بعدی داخل کارت‌های لیست خودروها
const _baseRenderUserTab = renderUserTab;
renderUserTab = function() {
    _baseRenderUserTab();
    if (userTab === 'units' && uState) {
        const cards = document.querySelectorAll('.fg-unit-avatar');
        const list = uState.units.filter(u => showHiddenUnits ? u.hidden : !u.hidden);
        cards.forEach((el, idx) => {
            if (list[idx]) {
                const col = list[idx].isExpired ? '#94a3b8' : list[idx].color;
                el.innerHTML = getTopDownSvg(list[idx].icon, col, 0.85);
            }
        });
    }
};

// پنجره تعاملی انتخاب آیکون و رنگ دستی (Custom Color Picker)
let pickerColor = '#0284c7';
let pickerIcon = 'pickup';

const _origOpenModal = openModal;
openModal = function(id) {
    _origOpenModal(id);
    if (id === 'modal-icon-picker' && uState) {
        const u = uState.units.find(x => x.id === activeUnitId) || uState.units[0];
        if (u) {
            pickerColor = u.color || '#0284c7';
            const legacy = { 'fa-truck-pickup': 'pickup', 'fa-truck': 'nissan', 'fa-car-side': 'sedan', 'fa-motorcycle': 'moto' };
            pickerIcon = TOPDOWN_SVGS[u.icon] ? u.icon : (legacy[u.icon] || 'pickup');
        }
        renderIconPickerUI();
    }
};

function renderIconPickerUI() {
    const box = document.getElementById('modal-icon-picker');
    if (!box) return;
    const models = [
        { k: 'pickup', n: 'وانت دوکابین' },
        { k: 'nissan', n: 'نیسان باری' },
        { k: 'sedan', n: 'سواری سدان' },
        { k: 'suv', n: 'شاسی‌بلند' },
        { k: 'moto', n: 'موتورسیکلت' },
        { k: 'van', n: 'ون / مینی‌بوس' }
    ];
    const presets = ['#dc2626', '#0284c7', '#16a34a', '#f59e0b', '#7c3aed', '#ec4899', '#334155', '#ffffff'];

    box.innerHTML = `
        <h4 style="margin:0 0 12px 0; text-align:center;">انتخاب آیکون و رنگ سفارشی خودرو</h4>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:14px;">
            ${models.map(m => `
                <div onclick="pickerIcon='${m.k}'; renderIconPickerUI();" style="border:2px solid ${pickerIcon===m.k ? '#1976d2' : '#e2e8f0'}; background:${pickerIcon===m.k ? '#eff6ff' : '#fff'}; border-radius:12px; padding:10px 4px; text-align:center; cursor:pointer;">
                    ${getTopDownSvg(m.k, pickerColor, 1)}
                    <div style="font-size:11px; margin-top:4px; font-weight:bold;">${m.n}</div>
                </div>
            `).join('')}
        </div>
        <div style="font-size:12px; font-weight:bold; margin-bottom:8px;">انتخاب رنگ آماده یا رنگ دلخواه دستی:</div>
        <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:14px; flex-wrap:wrap;">
            ${presets.map(c => `
                <div onclick="pickerColor='${c}'; renderIconPickerUI();" style="width:30px; height:30px; border-radius:50%; background:${c}; cursor:pointer; border:${pickerColor===c ? '3px solid #1976d2' : '1px solid #cbd5e1'}; box-shadow:0 2px 5px rgba(0,0,0,0.15);"></div>
            `).join('')}
            <label style="display:flex; align-items:center; gap:6px; background:#f1f5f9; padding:5px 10px; border-radius:20px; cursor:pointer; font-size:11.5px; font-weight:bold;">
                <i class="fas fa-eye-dropper" style="color:#1976d2;"></i>
                <span>رنگ دستی</span>
                <input type="color" value="${pickerColor}" onchange="pickerColor=this.value; renderIconPickerUI();" style="width:24px; height:24px; border:none; background:none; cursor:pointer;">
            </label>
        </div>
        <button class="btn btn-full" onclick="setUnitVisual(pickerColor, pickerIcon)">اعمال آیکون و رنگ</button>
        <div class="close-sheet-bar" onclick="closeModals()">بستن</div>
    `;
}

// ================= موتور پیشرفته ردیابی زنده و پلیر تاریخچه مسیر =================
let liveTrailLine = null;
let isPlaybackActive = false;
let playbackTimer = null;
let playbackIdx = 0;
let playbackSpeed = 1;
let playbackRoutePts = [];

function calcDistKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcBearing(lat1, lon1, lat2, lon2) {
    const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180);
    return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

// بروزرسانی رندر نقشه: چرخش خودرو در جهت حرکت + خط دنباله زنده (Live Trail)
const _prevRenderMap = renderMap;
renderMap = function() {
    if (!uState || !map) return;
    if (!liveTrailLine) liveTrailLine = L.polyline([], { color: '#1976d2', weight: 4, opacity: 0.75 }).addTo(map);

    uState.units.forEach(u => {
        if (u.hidden) {
            if (unitMarkers[u.id]) { map.removeLayer(unitMarkers[u.id]); delete unitMarkers[u.id]; }
            return;
        }
        const col = u.isExpired ? '#94a3b8' : u.color;
        let angle = u.direction || 0;
        if (u.history && u.history.length >= 2) {
            const p1 = u.history[u.history.length - 2];
            const p2 = u.history[u.history.length - 1];
            if (p1.lat !== p2.lat || p1.lng !== p2.lng) angle = calcBearing(p1.lat, p1.lng, p2.lat, p2.lng);
        }

        const html = `
            <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -50%);">
                ${showLabels ? `<div style="background:#fff; color:#111; padding:2px 8px; border-radius:8px; font-size:10.5px; font-weight:bold; box-shadow:0 2px 6px rgba(0,0,0,0.22); margin-bottom:2px; white-space:nowrap;">${u.name} ${u.speed > 0 ? `(${u.speed} km/h)` : ''}</div>` : ''}
                <div style="transform:rotate(${angle}deg); transition:transform 0.4s ease;">
                    ${getTopDownSvg(u.icon, col, 0.95)}
                </div>
            </div>
        `;
        const icon = L.divIcon({ html, className: '', iconSize: [0, 0], iconAnchor: [0, 0] });

        if (!isPlaybackActive || u.id !== activeUnitId) {
            if (!unitMarkers[u.id]) {
                unitMarkers[u.id] = L.marker([u.lat, u.lng], { icon }).addTo(map).on('click', () => { activeUnitId = u.id; renderUserTab(); });
            } else {
                unitMarkers[u.id].setLatLng([u.lat, u.lng]);
                unitMarkers[u.id].setIcon(icon);
            }
        }
    });

    // رسم خط دنباله زنده برای خودروی فعال در حالت ردیابی آنلاین
    const actU = uState.units.find(x => x.id === activeUnitId);
    if (actU && userTab !== 'history' && !isPlaybackActive && actU.history) {
        liveTrailLine.setLatLngs(actU.history.map(p => [p.lat, p.lng]));
        liveTrailLine.setStyle({ color: actU.trailColor || '#1976d2' });
    } else {
        liveTrailLine.setLatLngs([]);
    }

    gfLayer.clearLayers();
    uState.geofences.forEach(g => {
        if (g.visible) L.circle([g.lat, g.lng], { color: '#1976d2', fillColor: '#1976d2', fillOpacity: 0.12, weight: 2, radius: g.radius }).bindTooltip(g.name).addTo(gfLayer);
    });

    secLayer.clearLayers();
    if (actU && actU.securityMode && !actU.isExpired) {
        L.circle([actU.secLat, actU.secLng], { color: '#2e7d32', fillColor: '#4caf50', fillOpacity: 0.15, radius: 100 }).addTo(secLayer);
    }
};

// بازطراحی کامل تب تاریخچه مسیر با تمام امکانات پخش، کم/زیاد کردن سرعت، مسافت لحظه‌ای و نمایش کل مسیر
const _prevRenderTab2 = renderUserTab;
renderUserTab = function() {
    if (userTab === 'history' && uState) {
        const body = document.getElementById('u-sheet-body');
        const actU = uState.units.find(x => x.id === activeUnitId) || uState.units[0];
        if (!actU) return;

        // ساخت نقاط مسیر نمونه غنی در صورتی که نقاط کم باشند تا بازپخش کامل دیده شود
        let pts = actU.history && actU.history.length >= 4 ? actU.history : [
            { lat: actU.lat - 0.0055, lng: actU.lng - 0.0060, speed: 28, time: "08:05:10" },
            { lat: actU.lat - 0.0040, lng: actU.lng - 0.0042, speed: 48, time: "08:09:30" },
            { lat: actU.lat - 0.0025, lng: actU.lng - 0.0028, speed: 72, time: "08:14:15" },
            { lat: actU.lat - 0.0012, lng: actU.lng - 0.0015, speed: 94, time: "08:18:40" },
            { lat: actU.lat, lng: actU.lng, speed: 35, time: "08:23:00" }
        ];
        playbackRoutePts = pts;

        // محاسبه مسافت تجمعی در هر نقطه از مسیر
        let cumDist = [0];
        for (let i = 1; i < pts.length; i++) {
            cumDist.push(+(cumDist[i - 1] + calcDistKm(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng)).toFixed(3));
        }
        const totalRouteKm = cumDist[cumDist.length - 1];
        const maxS = Math.max(...pts.map(p => p.speed));
        const avgS = Math.round(pts.reduce((s, p) => s + p.speed, 0) / pts.length);

        // رسم کل مسیر روی نقشه با رنگ‌بندی سرعت + نشانگر شروع A، پایان B و توقف P
        histLayer.clearLayers();
        for (let i = 0; i < pts.length - 1; i++) {
            const s = pts[i].speed;
            const segCol = s < 40 ? '#2e7d32' : (s < 60 ? '#fbc02d' : (s < 80 ? '#f57c00' : '#d32f2f'));
            L.polyline([[pts[i].lat, pts[i].lng], [pts[i + 1].lat, pts[i + 1].lng]], { color: segCol, weight: 6, opacity: 0.9 }).addTo(histLayer);
        }

        const pinA = L.divIcon({ html: `<div style="background:#2e7d32;color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,0.3);">A</div>`, className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
        const pinB = L.divIcon({ html: `<div style="background:#1976d2;color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,0.3);">B</div>`, className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
        L.marker([pts[0].lat, pts[0].lng], { icon: pinA }).bindPopup(`نقطه شروع: ${pts[0].time}`).addTo(histLayer);
        L.marker([pts[pts.length - 1].lat, pts[pts.length - 1].lng], { icon: pinB }).bindPopup(`نقطه پایان: ${pts[pts.length - 1].time}`).addTo(histLayer);

        if (pts.length > 2) {
            const mid = pts[Math.floor(pts.length / 2)];
            const pinP = L.divIcon({ html: `<div style="background:#0284c7;color:#fff;width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:11px;border:2px solid #fff;">P</div>`, className: '', iconSize: [22, 22], iconAnchor: [11, 11] });
            L.marker([mid.lat, mid.lng], { icon: pinP }).bindPopup('توقف موقت: ۰۴ دقیقه').addTo(histLayer);
        }

        const curPt = pts[Math.min(playbackIdx, pts.length - 1)];
        const curKm = cumDist[Math.min(playbackIdx, cumDist.length - 1)];

        body.innerHTML = `
            ${dateTabsHtml()}
            <div class="fg-white-box">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button class="btn btn-sm" onclick="toggleTrackPlayback()" style="min-width:74px;">
                            <i class="fas ${isPlaybackActive ? 'fa-pause' : 'fa-play'}"></i> ${isPlaybackActive ? 'توقف' : 'پخش'}
                        </button>
                        <button class="btn btn-sm" style="background:#475569;" onclick="changePlaybackSpeed()" title="کم و زیاد کردن سرعت پخش">
                            سرعت: ${playbackSpeed}x
                        </button>
                        <button class="btn btn-green btn-sm" onclick="fitFullRoute()" title="نمایش کل مسیر روی نقشه">
                            <i class="fas fa-expand-arrows-alt"></i> کل مسیر
                        </button>
                    </div>
                    <div style="display:flex; gap:12px; font-size:15px; color:#555;">
                        <i class="fas fa-chart-line" onclick="openUserTab('stats')" title="نمودار"></i>
                        <i class="fas fa-file-export" onclick="exportFile('kml')" title="خروجی KML"></i>
                    </div>
                </div>

                <!-- اسلایدر پیمایش دستی مسیر -->
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                    <span style="font-size:11px; color:#666; direction:ltr;" id="pb-time-lbl">${curPt.time}</span>
                    <input type="range" id="pb-slider" min="0" max="${pts.length - 1}" value="${playbackIdx}" oninput="scrubTrack(this.value)" style="flex:1; accent-color:#1976d2; cursor:pointer;">
                    <span style="font-size:11px; color:#666;">${playbackIdx + 1}/${pts.length}</span>
                </div>

                <!-- نمایش زنده سرعت و مسافت طی‌شده در همان نقطه از مسیر -->
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; background:#f8fafc; padding:8px; border-radius:10px; border:1px solid #e2e8f0; text-align:center; margin-bottom:10px;">
                    <div>
                        <div style="font-size:10px; color:#64748b;">سرعت در این نقطه</div>
                        <div style="font-weight:900; font-size:13.5px; color:#d32f2f;" id="pb-speed-val">${curPt.speed} km/h</div>
                    </div>
                    <div>
                        <div style="font-size:10px; color:#64748b;">مسافت طی‌شده</div>
                        <div style="font-weight:900; font-size:13.5px; color:#1976d2;" id="pb-dist-val">${curKm} km</div>
                    </div>
                    <div>
                        <div style="font-size:10px; color:#64748b;">کل مسافت مسیر</div>
                        <div style="font-weight:900; font-size:13.5px; color:#16a34a;">${totalRouteKm} km</div>
                    </div>
                </div>

                <!-- راهنمای رنگ‌بندی سرعت مسیر -->
                <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:10px;">
                    <span style="background:#2e7d32;color:#fff;padding:2px 7px;border-radius:4px;">0-40 km/h</span>
                    <span style="background:#fbc02d;color:#000;padding:2px 7px;border-radius:4px;">40-60</span>
                    <span style="background:#f57c00;color:#fff;padding:2px 7px;border-radius:4px;">60-80</span>
                    <span style="background:#d32f2f;color:#fff;padding:2px 7px;border-radius:4px;">80+ km/h</span>
                </div>

                <!-- جزئیات خلاصه سفر -->
                <div style="font-size:12px; color:#475569; border-top:1px solid #eee; padding-top:8px; display:flex; justify-content:space-between;">
                    <span>حداکثر سرعت: <b>${maxS} km/h</b></span>
                    <span>میانگین سرعت: <b>${avgS} km/h</b></span>
                </div>
            </div>
        `;
        return;
    }
    _prevRenderTab2();
};

function fitFullRoute() {
    if (!playbackRoutePts || playbackRoutePts.length === 0) return;
    const bounds = L.latLngBounds(playbackRoutePts.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
}

function changePlaybackSpeed() {
    const speeds = [0.5, 1, 2, 4, 8];
    playbackSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    if (isPlaybackActive) {
        clearInterval(playbackTimer);
        startPlaybackLoop();
    }
    renderUserTab();
}

function toggleTrackPlayback() {
    if (isPlaybackActive) {
        isPlaybackActive = false;
        clearInterval(playbackTimer);
        renderUserTab();
    } else {
        if (playbackIdx >= playbackRoutePts.length - 1) playbackIdx = 0;
        isPlaybackActive = true;
        fitFullRoute();
        startPlaybackLoop();
        renderUserTab();
    }
}

function startPlaybackLoop() {
    clearInterval(playbackTimer);
    playbackTimer = setInterval(() => {
        if (playbackIdx < playbackRoutePts.length) {
            scrubTrack(playbackIdx);
            playbackIdx++;
        } else {
            isPlaybackActive = false;
            clearInterval(playbackTimer);
            renderUserTab();
        }
    }, Math.max(150, 900 / playbackSpeed));
}

function scrubTrack(idx) {
    playbackIdx = Number(idx);
    const actU = uState && uState.units.find(x => x.id === activeUnitId);
    const pt = playbackRoutePts[playbackIdx];
    if (!actU || !pt || !unitMarkers[actU.id]) return;

    let angle = 0;
    if (playbackIdx > 0) {
        const prev = playbackRoutePts[playbackIdx - 1];
        angle = calcBearing(prev.lat, prev.lng, pt.lat, pt.lng);
    }

    const html = `
        <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -50%);">
            <div style="background:#0f172a; color:#fff; padding:2px 8px; border-radius:8px; font-size:10.5px; font-weight:bold; margin-bottom:2px; white-space:nowrap;">
                ${actU.name} • ${pt.speed} km/h
            </div>
            <div style="transform:rotate(${angle}deg);">
                ${getTopDownSvg(actU.icon, actU.color, 1)}
            </div>
        </div>
    `;
    unitMarkers[actU.id].setIcon(L.divIcon({ html, className: '', iconSize: [0, 0], iconAnchor: [0, 0] }));
    unitMarkers[actU.id].setLatLng([pt.lat, pt.lng]);
    map.panTo([pt.lat, pt.lng]);

    // محاسبه مسافت تا این نقطه
    let dist = 0;
    for (let i = 1; i <= playbackIdx; i++) {
        dist += calcDistKm(playbackRoutePts[i - 1].lat, playbackRoutePts[i - 1].lng, playbackRoutePts[i].lat, playbackRoutePts[i].lng);
    }
    const spdEl = document.getElementById('pb-speed-val');
    const dstEl = document.getElementById('pb-dist-val');
    const timEl = document.getElementById('pb-time-lbl');
    const sldEl = document.getElementById('pb-slider');
    if (spdEl) spdEl.innerText = `${pt.speed} km/h`;
    if (dstEl) dstEl.innerText = `${dist.toFixed(3)} km`;
    if (timEl) timEl.innerText = pt.time;
    if (sldEl) sldEl.value = playbackIdx;
}

// ================= ۱. انتخابگر تقویم هر تاریخ (گذشته، امروز و آینده) =================
let selectedTripDate = new Date().toISOString().split('T')[0];

function shiftTripDate(daysOffset) {
    const d = new Date(selectedTripDate);
    d.setDate(d.getDate() + daysOffset);
    selectedTripDate = d.toISOString().split('T')[0];
    playbackIdx = 0;
    isPlaybackActive = false;
    clearInterval(playbackTimer);
    renderUserTab();
}

function setExactTripDate(val) {
    if (!val) return;
    selectedTripDate = val;
    playbackIdx = 0;
    isPlaybackActive = false;
    clearInterval(playbackTimer);
    renderUserTab();
}

function getRouteForDate(actU, dateStr) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr === todayStr && actU.history && actU.history.length >= 2) {
        return { status: 'past_or_today', pts: actU.history };
    }
    if (dateStr > todayStr) {
        return {
            status: 'future',
            pts: [],
            scheduledMsg: `تاریخ انتخاب‌شده (${dateStr}) در آینده قرار دارد. هنوز سفری در این تاریخ ثبت نشده است.`
        };
    }
    // تولید مسیر اختصاصی بر اساس تاریخ گذشته انتخاب‌شده
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) seed += dateStr.charCodeAt(i);
    const offsetLat = ((seed % 9) - 4) * 0.0012;
    const offsetLng = ((seed % 7) - 3) * 0.0012;

    return {
        status: 'past_or_today',
        pts: [
            { lat: actU.lat + offsetLat - 0.0045, lng: actU.lng + offsetLng - 0.0050, speed: 32, time: "07:45:10" },
            { lat: actU.lat + offsetLat - 0.0030, lng: actU.lng + offsetLng - 0.0032, speed: 58, time: "07:58:20" },
            { lat: actU.lat + offsetLat - 0.0015, lng: actU.lng + offsetLng - 0.0018, speed: 84, time: "08:11:45" },
            { lat: actU.lat + offsetLat, lng: actU.lng + offsetLng, speed: 41, time: "08:25:00" }
        ]
    };
}

// جایگزینی نوار تب‌های تاریخ با تقویم کامل گذشته/آینده
dateTabsHtml = function() {
    const todayStr = new Date().toISOString().split('T')[0];
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().split('T')[0];
    const tom = new Date(); tom.setDate(tom.getDate() + 1);
    const tomStr = tom.toISOString().split('T')[0];

    return `
        <div class="fg-white-box" style="padding:10px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:8px;">
                <button class="btn btn-sm" style="background:#475569;" onclick="shiftTripDate(-1)" title="روز قبل">◀ روز قبل</button>
                <input type="date" value="${selectedTripDate}" onchange="setExactTripDate(this.value)" style="padding:5px 8px; border:1px solid #cbd5e1; border-radius:8px; font-family:inherit; font-size:12px; font-weight:bold;">
                <button class="btn btn-sm" style="background:#475569;" onclick="shiftTripDate(1)" title="روز بعد">روز بعد ▶</button>
            </div>
            <div style="display:flex; gap:6px; justify-content:center;">
                <span class="date-tab ${selectedTripDate===yestStr?'active':''}" style="padding:4px 10px; border-radius:8px; background:#f1f5f9;" onclick="setExactTripDate('${yestStr}')">دیروز</span>
                <span class="date-tab ${selectedTripDate===todayStr?'active':''}" style="padding:4px 10px; border-radius:8px; background:#f1f5f9;" onclick="setExactTripDate('${todayStr}')">امروز</span>
                <span class="date-tab ${selectedTripDate===tomStr?'active':''}" style="padding:4px 10px; border-radius:8px; background:#f1f5f9;" onclick="setExactTripDate('${tomStr}')">فردا (آینده)</span>
            </div>
        </div>
    `;
};

// ================= ۲. پنل جامع دستورات تمام مدل‌های GPS =================
function openUniversalCommandsModal(unitId) {
    activeUnitId = unitId;
    const actU = uState && uState.units.find(x => x.id === unitId);
    if (!actU) return;

    let modal = document.getElementById('modal-universal-cmds');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-universal-cmds';
        modal.className = 'modal-sheet';
        document.getElementById('modal-bg').appendChild(modal);
    }

    modal.innerHTML = `
        <h4 style="margin:0 0 6px 0; text-align:center;">مرکز فرمان‌های سخت‌افزاری (${actU.name})</h4>
        <div style="text-align:center; font-size:11.5px; color:#64748b; margin-bottom:12px;">
            پشتیبانی از Micodus (H02) • Concox (GT06) • Teltonika • Sinotrack
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
            <button class="btn btn-red btn-sm" style="padding:10px;" onclick="sendUniversalCmd('${actU.id}', 'STOP', 'RELAY,1#')">
                <i class="fas fa-power-off"></i> قطع سوخت / خاموش
            </button>
            <button class="btn btn-green btn-sm" style="padding:10px;" onclick="sendUniversalCmd('${actU.id}', 'START', 'RELAY,0#')">
                <i class="fas fa-key"></i> وصل مجدد سوخت
            </button>
            <button class="btn btn-sm" style="padding:10px;" onclick="sendUniversalCmd('${actU.id}', 'CUSTOM', 'WHERE# / G123456#')">
                <i class="fas fa-map-marker-alt"></i> استعلام موقعیت آنی
            </button>
            <button class="btn btn-amber btn-sm" style="padding:10px;" onclick="sendUniversalCmd('${actU.id}', 'SECURITY', 'DEFENSE,1#')">
                <i class="fas fa-shield-alt"></i> قفل دزدگیر / حالت امنیتی
            </button>
            <button class="btn btn-sm" style="background:#0284c7; padding:10px;" onclick="sendUniversalCmd('${actU.id}', 'CUSTOM', 'MONITOR#')">
                <i class="fas fa-microphone"></i> شنود صدای کابین
            </button>
            <button class="btn btn-sm" style="background:#7c3aed; padding:10px;" onclick="sendUniversalCmd('${actU.id}', 'CUSTOM', 'SPEED,90#')">
                <i class="fas fa-tachometer-alt"></i> تنظیم هشدار سرعت (90)
            </button>
            <button class="btn btn-sm" style="background:#475569; padding:10px;" onclick="sendUniversalCmd('${actU.id}', 'CUSTOM', 'STATUS# / PARAM#')">
                <i class="fas fa-info-circle"></i> دریافت وضعیت و پارامترها
            </button>
            <button class="btn btn-sm" style="background:#0f172a; padding:10px;" onclick="sendUniversalCmd('${actU.id}', 'CUSTOM', 'RESET#')">
                <i class="fas fa-sync-alt"></i> ریستارت سخت‌افزاری ردیاب
            </button>
        </div>

        <div style="background:#f8fafc; padding:10px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:10px;">
            <div style="font-size:11.5px; font-weight:bold; margin-bottom:6px;">ارسال دستور سفارشی دستی (GPRS / SMS):</div>
            <div style="display:flex; gap:6px;">
                <input type="text" id="uni-custom-cmd" class="inp" style="margin:0;" placeholder="مثال: TIMER,10# یا SERVER,1,ip,5023,0#" dir="ltr">
                <button class="btn btn-sm" onclick="sendManualUniCmd('${actU.id}')">ارسال</button>
            </div>
        </div>
        <div class="close-sheet-bar" onclick="closeModals()">بستن</div>
    `;
    openModal('modal-universal-cmds');
}

async function sendUniversalCmd(id, cmdType, rawText) {
    const res = await fetch(`/api/units/${id}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd: cmdType, payload: rawText })
    });
    const d = await res.json();
    alert(d.message || `دستور ${rawText} ارسال شد.`);
    loadUserState();
}

function sendManualUniCmd(id) {
    const val = document.getElementById('uni-custom-cmd').value.trim();
    if (!val) return alert('متن دستور را وارد کنید.');
    sendUniversalCmd(id, 'CUSTOM', val);
    document.getElementById('uni-custom-cmd').value = '';
}

// اتصال تقویم تاریخ و دکمه فرمان به رابط کاربری اصلی
const _prevRenderTab3 = renderUserTab;
renderUserTab = function() {
    if (uState && (userTab === 'history' || userTab === 'trips')) {
        const body = document.getElementById('u-sheet-body');
        const actU = uState.units.find(x => x.id === activeUnitId) || uState.units[0];
        if (!actU) return;

        const routeInfo = getRouteForDate(actU, selectedTripDate);
        if (routeInfo.status === 'future') {
            histLayer.clearLayers();
            body.innerHTML = `
                ${dateTabsHtml()}
                <div class="fg-white-box" style="text-align:center; padding:24px 12px;">
                    <i class="far fa-calendar-times" style="font-size:32px; color:#f59e0b; margin-bottom:8px;"></i>
                    <div style="font-weight:bold; font-size:13.5px; margin-bottom:4px;">تاریخ آینده انتخاب شده است</div>
                    <div style="font-size:12px; color:#64748b;">${routeInfo.scheduledMsg}</div>
                </div>
            `;
            return;
        }
        actU.history = routeInfo.pts;
    }

    _prevRenderTab3();

    // افزودن دکمه مستقیم «دستورات GPS» روی هر کارت خودرو
    if (userTab === 'units' && uState) {
        const list = uState.units.filter(u => showHiddenUnits ? u.hidden : !u.hidden);
        const iconRows = document.querySelectorAll('.fg-unit-card .fg-icon-row:first-of-type');
        iconRows.forEach((row, idx) => {
            if (list[idx] && !row.querySelector('.fa-terminal')) {
                const termIcon = document.createElement('i');
                termIcon.className = 'fas fa-terminal';
                termIcon.title = 'دستورات تمام جی‌پی‌اس‌ها';
                termIcon.style.color = '#1976d2';
                termIcon.onclick = (e) => { e.stopPropagation(); openUniversalCommandsModal(list[idx].id); };
                row.appendChild(termIcon);
            }
        });
    }
};

// ================= ۱. مبدل و تقویم تمام‌شمسی ایران (جلالی) =================
const PERSIAN_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = (gy <= 1600) ? 0 : 979;
    gy -= (gy <= 1600) ? 621 : 1600;
    let gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    jy += Math.floor((days - 1) / 365);
    if (days > 365) days = (days - 1) % 365;
    let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    return { jy, jm, jd };
}

function jalaliToGregorian(jy, jm, jd) {
    jy += 1595;
    let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    let gy = 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) {
        gy += 100 * Math.floor(--days / 36524);
        days %= 36524;
        if (days >= 365) days++;
    }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
        gy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }
    let gd = days + 1;
    const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 0;
    for (gm = 1; gm <= 12 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
    return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
}

function formatShamsiLabel(isoDateStr) {
    const [y, m, d] = isoDateStr.split('-').map(Number);
    const { jy, jm, jd } = gregorianToJalali(y, m, d);
    return `${jd} ${PERSIAN_MONTHS[jm - 1]} ${jy} (${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')})`;
}

function applyShamsiSelect() {
    const jy = Number(document.getElementById('sh-year').value);
    const jm = Number(document.getElementById('sh-month').value);
    const jd = Number(document.getElementById('sh-day').value);
    setExactTripDate(jalaliToGregorian(jy, jm, jd));
}

// جایگزینی نوار انتخاب تاریخ با تقویم کامل شمسی ایران (گذشته، امروز و آینده)
dateTabsHtml = function() {
    const todayStr = new Date().toISOString().split('T')[0];
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().split('T')[0];
    const tom = new Date(); tom.setDate(tom.getDate() + 1);
    const tomStr = tom.toISOString().split('T')[0];

    const [cy, cm, cd] = selectedTripDate.split('-').map(Number);
    const curJ = gregorianToJalali(cy, cm, cd);

    let yearsOpts = '';
    for (let y = 1400; y <= 1410; y++) yearsOpts += `<option value="${y}" ${y===curJ.jy?'selected':''}>${y}</option>`;
    let monthsOpts = PERSIAN_MONTHS.map((mn, idx) => `<option value="${idx+1}" ${(idx+1)===curJ.jm?'selected':''}>${mn}</option>`).join('');
    let daysOpts = '';
    for (let d = 1; d <= 31; d++) daysOpts += `<option value="${d}" ${d===curJ.jd?'selected':''}>${d}</option>`;

    return `
        <div class="fg-white-box" style="padding:10px; margin-bottom:10px;">
            <div style="text-align:center; font-size:12px; font-weight:bold; color:#1976d2; margin-bottom:8px;">
                <i class="far fa-calendar-alt"></i> تاریخ شمسی انتخاب‌شده: ${formatShamsiLabel(selectedTripDate)}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:4px; margin-bottom:8px;">
                <button class="btn btn-sm" style="background:#475569; padding:5px 8px;" onclick="shiftTripDate(-1)">◀ روز قبل</button>
                <div style="display:flex; gap:3px;">
                    <select id="sh-day" onchange="applyShamsiSelect()" style="padding:4px; border-radius:6px; border:1px solid #cbd5e1; font-family:inherit; font-size:11.5px;">${daysOpts}</select>
                    <select id="sh-month" onchange="applyShamsiSelect()" style="padding:4px; border-radius:6px; border:1px solid #cbd5e1; font-family:inherit; font-size:11.5px;">${monthsOpts}</select>
                    <select id="sh-year" onchange="applyShamsiSelect()" style="padding:4px; border-radius:6px; border:1px solid #cbd5e1; font-family:inherit; font-size:11.5px;">${yearsOpts}</select>
                </div>
                <button class="btn btn-sm" style="background:#475569; padding:5px 8px;" onclick="shiftTripDate(1)">روز بعد ▶</button>
            </div>
            <div style="display:flex; gap:6px; justify-content:center;">
                <span class="date-tab ${selectedTripDate===yestStr?'active':''}" style="padding:3px 10px; border-radius:8px; background:#f1f5f9;" onclick="setExactTripDate('${yestStr}')">دیروز</span>
                <span class="date-tab ${selectedTripDate===todayStr?'active':''}" style="padding:3px 10px; border-radius:8px; background:#f1f5f9;" onclick="setExactTripDate('${todayStr}')">امروز</span>
                <span class="date-tab ${selectedTripDate===tomStr?'active':''}" style="padding:3px 10px; border-radius:8px; background:#f1f5f9;" onclick="setExactTripDate('${tomStr}')">فردا (آینده)</span>
            </div>
        </div>
    `;
};

// ================= ۲. تشخیص خودکار دستورات بر اساس مدل GPS + مجوز باز/بسته کردن درب =================
const GPS_MODEL_COMMANDS = {
    "Micodus MV720": {
        proto: "H02 / Micodus",
        stop: "RELAY,1#",
        start: "RELAY,0#",
        doorLock: "LOCK#",
        doorUnlock: "UNLOCK#",
        locate: "WHERE#",
        status: "STATUS#",
        speed90: "SPEED,90#",
        reset: "RESET#"
    },
    "Micodus MV208": {
        proto: "H02 / Micodus",
        stop: "RELAY,1#",
        start: "RELAY,0#",
        doorLock: "DOOR,1#",
        doorUnlock: "DOOR,0#",
        locate: "WHERE#",
        status: "STATUS#",
        speed90: "SPEED,90#",
        reset: "RESET#"
    },
    "Concox GT06": {
        proto: "GT06 / Concox",
        stop: "RELAY,1#",
        start: "RELAY,0#",
        doorLock: "LOCKDOOR#",
        doorUnlock: "UNLOCKDOOR#",
        locate: "URL#",
        status: "PARAM#",
        speed90: "SPEED,ON,90#",
        reset: "RESET#"
    },
    "Teltonika FMB920": {
        proto: "Codec8 / Teltonika",
        stop: "setdigout 1",
        start: "setdigout 0",
        doorLock: "lvcanlockalldoors",
        doorUnlock: "lvcanunlockalldoors",
        locate: "getgps",
        status: "getinfo",
        speed90: "setparam 11100:90",
        reset: "cpureset"
    }
};

openUniversalCommandsModal = function(unitId) {
    activeUnitId = unitId;
    const actU = uState && uState.units.find(x => x.id === unitId);
    if (!actU) return;

    const cmdSet = GPS_MODEL_COMMANDS[actU.model] || GPS_MODEL_COMMANDS["Micodus MV720"];
    const canControlDoors = uState.user && uState.user.allowDoorLock !== false;

    let modal = document.getElementById('modal-universal-cmds');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-universal-cmds';
        modal.className = 'modal-sheet';
        document.getElementById('modal-bg').appendChild(modal);
    }

    modal.innerHTML = `
        <h4 style="margin:0 0 4px 0; text-align:center;">ارسال دستور به ${actU.name}</h4>
        <div style="text-align:center; font-size:11.5px; color:#1976d2; font-weight:bold; margin-bottom:12px;">
            مدل تشخیص داده‌شده: ${actU.model} (${cmdSet.proto})
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
            <button class="btn btn-red btn-sm" style="padding:10px; flex-direction:column; gap:2px;" onclick="sendUniversalCmd('${actU.id}', 'STOP', '${cmdSet.stop}')">
                <span><i class="fas fa-power-off"></i> خاموش کردن (قطع سوخت)</span>
                <small style="opacity:0.85; font-size:9.5px;" dir="ltr">${cmdSet.stop}</small>
            </button>
            <button class="btn btn-green btn-sm" style="padding:10px; flex-direction:column; gap:2px;" onclick="sendUniversalCmd('${actU.id}', 'START', '${cmdSet.start}')">
                <span><i class="fas fa-key"></i> روشن کردن (وصل سوخت)</span>
                <small style="opacity:0.85; font-size:9.5px;" dir="ltr">${cmdSet.start}</small>
            </button>
        </div>

        ${canControlDoors ? `
            <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:8px; margin-bottom:10px;">
                <div style="font-size:11px; font-weight:bold; color:#1e40af; margin-bottom:6px; text-align:center;">
                    <i class="fas fa-car"></i> کنترل قفل مرکزی درب‌های خودرو (فعال‌شده برای حساب شما)
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <button class="btn btn-sm" style="background:#1e3a8a; padding:9px; flex-direction:column; gap:2px;" onclick="sendUniversalCmd('${actU.id}', 'DOOR_LOCK', '${cmdSet.doorLock}')">
                        <span><i class="fas fa-lock"></i> بستن / قفل درب‌ها</span>
                        <small style="opacity:0.8; font-size:9.5px;" dir="ltr">${cmdSet.doorLock}</small>
                    </button>
                    <button class="btn btn-sm" style="background:#0284c7; padding:9px; flex-direction:column; gap:2px;" onclick="sendUniversalCmd('${actU.id}', 'DOOR_UNLOCK', '${cmdSet.doorUnlock}')">
                        <span><i class="fas fa-lock-open"></i> باز کردن درب‌ها</span>
                        <small style="opacity:0.8; font-size:9.5px;" dir="ltr">${cmdSet.doorUnlock}</small>
                    </button>
                </div>
            </div>
        ` : `
            <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:10px; padding:8px; margin-bottom:10px; text-align:center; font-size:11px; color:#64748b;">
                <i class="fas fa-lock"></i> قابلیت باز و بسته کردن درب خودرو برای این حساب کاربری فعال نیست (نیاز به تایید ادمین).
            </div>
        `}

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
            <button class="btn btn-sm" style="background:#475569; padding:9px;" onclick="sendUniversalCmd('${actU.id}', 'CUSTOM', '${cmdSet.locate}')">
                <i class="fas fa-map-marker-alt"></i> موقعیت آنی (${cmdSet.locate})
            </button>
            <button class="btn btn-amber btn-sm" style="padding:9px;" onclick="sendUniversalCmd('${actU.id}', 'SECURITY', 'DEFENSE')">
                <i class="fas fa-shield-alt"></i> حالت امنیتی ۱۰۰ متری
            </button>
            <button class="btn btn-sm" style="background:#334155; padding:9px;" onclick="sendUniversalCmd('${actU.id}', 'CUSTOM', '${cmdSet.status}')">
                <i class="fas fa-info-circle"></i> وضعیت (${cmdSet.status})
            </button>
            <button class="btn btn-sm" style="background:#0f172a; padding:9px;" onclick="sendUniversalCmd('${actU.id}', 'CUSTOM', '${cmdSet.reset}')">
                <i class="fas fa-sync-alt"></i> ریستارت (${cmdSet.reset})
            </button>
        </div>

        <div style="background:#f8fafc; padding:10px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:10px;">
            <div style="font-size:11.5px; font-weight:bold; margin-bottom:6px;">ارسال کد دستی به ${actU.model}:</div>
            <div style="display:flex; gap:6px;">
                <input type="text" id="uni-custom-cmd" class="inp" style="margin:0;" placeholder="کد دستوری..." dir="ltr">
                <button class="btn btn-sm" onclick="sendManualUniCmd('${actU.id}')">ارسال</button>
            </div>
        </div>
        <div class="close-sheet-bar" onclick="closeModals()">بستن</div>
    `;
    openModal('modal-universal-cmds');
};

// ================= ۳. افزودن سوییچ مجوز درب خودرو در پنل ادمین =================
const _origOpenAdminEditUser = openAdminEditUser;
openAdminEditUser = function(uid) {
    _origOpenAdminEditUser(uid);
    const u = aState.users.find(x => x.id === uid);
    if (!u) return;
    const modal = document.getElementById('modal-admin-edit-user');
    let doorWrap = document.getElementById('eu-door-wrap');
    if (!doorWrap) {
        doorWrap = document.createElement('div');
        doorWrap.id = 'eu-door-wrap';
        doorWrap.style.cssText = 'background:#eff6ff; padding:10px; border-radius:10px; margin-bottom:10px; border:1px solid #bfdbfe;';
        const saveBtn = modal.querySelector('button');
        modal.insertBefore(doorWrap, saveBtn);
    }
    doorWrap.innerHTML = `
        <label style="display:flex; align-items:center; gap:8px; font-size:12.5px; font-weight:bold; color:#1e40af; cursor:pointer;">
            <input type="checkbox" id="eu-door-perm" ${u.allowDoorLock !== false ? 'checked' : ''} style="width:18px; height:18px;">
            <span>مجوز ارسال دستور باز و بسته کردن درب خودرو (Lock/Unlock)</span>
        </label>
    `;
};

saveAdminUser = async function() {
    const id = document.getElementById('eu-id').value;
    const doorEl = document.getElementById('eu-door-perm');
    await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: document.getElementById('eu-name').value,
            email: document.getElementById('eu-email').value,
            password: document.getElementById('eu-pass').value,
            roleId: document.getElementById('eu-role').value,
            status: document.getElementById('eu-status').value,
            allowDoorLock: doorEl ? doorEl.checked : false
        })
    });
    closeModals();
    loadAdminState();
};

// ================= بخش جامع نگهداری، کارکرد ماهانه و قطعات مصرفی =================
const _prevRenderTab4 = renderUserTab;
renderUserTab = function() {
    if (userTab === 'maint' && uState) {
        const body = document.getElementById('u-sheet-body');
        const actU = uState.units.find(x => x.id === activeUnitId) || uState.units[0];
        if (!actU) return;

        const parts = actU.customParts || [];
        const monthlyKm = actU.monthlyKm || 0;
        const monthlyHr = actU.monthlyHours || 0;
        const dueCount = parts.filter(p => p.usedKm >= p.intervalKm * 0.85).length;

        body.innerHTML = `
            <!-- ۱. کارت وضعیت کارکرد ماهانه خودرو -->
            <div class="fg-white-box" style="border-right:4px solid #1976d2;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <b><i class="fas fa-calendar-check" style="color:#1976d2;"></i> وضعیت کارکرد ماهانه (${actU.name})</b>
                    <span class="tag ${dueCount > 0 ? 'tag-red' : 'tag-green'}">
                        ${dueCount > 0 ? `${dueCount} قطعه نزدیک تعویض` : 'وضعیت فنی نرمال'}
                    </span>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; background:#f8fafc; padding:8px; border-radius:10px; border:1px solid #e2e8f0; text-align:center;">
                    <div>
                        <div style="font-size:10px; color:#64748b;">کارکرد این ماه</div>
                        <div style="font-weight:900; font-size:13.5px; color:#1976d2;">${monthlyKm} km</div>
                    </div>
                    <div>
                        <div style="font-size:10px; color:#64748b;">ساعات موتور ماه</div>
                        <div style="font-weight:900; font-size:13.5px; color:#16a34a;">${monthlyHr} ساعت</div>
                    </div>
                    <div>
                        <div style="font-size:10px; color:#64748b;">کارکرد کل</div>
                        <div style="font-weight:900; font-size:13.5px; color:#334155;">${actU.mileage} km</div>
                    </div>
                </div>
            </div>

            <!-- ۲. دکمه افزودن قطعه مصرفی دلخواه توسط کاربر -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin:10px 2px;">
                <b style="font-size:13px;"><i class="fas fa-oil-can" style="color:#d97706;"></i> تعویض روغن و قطعات مصرفی (${parts.length})</b>
                <button class="btn btn-green btn-sm" onclick="openAddPartModal('${actU.id}')">
                    <i class="fas fa-plus"></i> افزودن قطعه
                </button>
            </div>

            <!-- ۳. لیست تمام قطعات مصرفی با نوار سلامت، ثبت تعویض و حذف -->
            ${parts.length === 0 ? `
                <div class="fg-white-box" style="text-align:center; color:#64748b; font-size:12px;">
                    هیچ قطعه‌ای ثبت نشده است. با دکمه «+ افزودن قطعه» موارد دلخواه خود را اضافه کنید.
                </div>
            ` : parts.map(p => {
                const pct = Math.min(100, Math.round((p.usedKm / p.intervalKm) * 100));
                const remKm = Math.max(0, Math.round(p.intervalKm - p.usedKm));
                const barColor = pct >= 90 ? '#dc2626' : (pct >= 75 ? '#f59e0b' : '#16a34a');

                return `
                    <div class="fg-white-box" style="padding:12px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <div>
                                <b style="font-size:13.5px;">${p.name}</b>
                                <div style="font-size:11px; color:#64748b; margin-top:2px;">
                                    آخرین تعویض: <b>${p.lastChangedShamsi || 'ثبت نشده'}</b> • دوره: <b>${p.intervalKm.toLocaleString()} km</b>
                                </div>
                            </div>
                            <div style="display:flex; gap:6px; align-items:center;">
                                <button class="btn btn-sm" style="background:#0284c7; padding:5px 8px;" onclick="resetConsumablePart('${actU.id}', '${p.id}', '${p.name}')" title="ثبت تعویض و صفر کردن کیلومتر">
                                    <i class="fas fa-sync-alt"></i> تعویض شد
                                </button>
                                <button class="btn btn-red btn-sm" style="padding:5px 8px;" onclick="deleteConsumablePart('${actU.id}', '${p.id}', '${p.name}')" title="حذف قطعه">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>

                        <div style="display:flex; justify-content:space-between; font-size:11.5px; margin-top:6px;">
                            <span>کارکرد فعلی: <b>${Math.round(p.usedKm).toLocaleString()} km</b></span>
                            <span style="color:${barColor}; font-weight:bold;">
                                ${remKm === 0 ? '⚠️ زمان تعویض فرا رسیده است!' : `باقی‌مانده: ${remKm.toLocaleString()} km (${100 - pct}% سالم)`}
                            </span>
                        </div>
                        <div class="fg-progress-track">
                            <div class="fg-progress-fill" style="width:${pct}%; background:${barColor};"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        `;
        return;
    }
    _prevRenderTab4();
};

function openAddPartModal(unitId) {
    let modal = document.getElementById('modal-add-part');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-add-part';
        modal.className = 'modal-sheet';
        document.getElementById('modal-bg').appendChild(modal);
    }

    modal.innerHTML = `
        <h4 style="margin:0 0 12px 0; text-align:center;">افزودن قطعه مصرفی جدید</h4>
        <label style="font-size:12px; font-weight:bold;">نام قطعه مصرفی:</label>
        <input type="text" id="np-name" class="inp" placeholder="مثلاً: دیسک و صفحه، ضدیخ، لاستیک جلو، روغن گیربکس...">
        <label style="font-size:12px; font-weight:bold;">دوره تعویض (هر چند کیلومتر؟):</label>
        <input type="number" id="np-interval" class="inp" value="5000" dir="ltr">
        <label style="font-size:12px; font-weight:bold;">کیلومتر کارکرد فعلی قطعه (اگر نو است 0 بگذارید):</label>
        <input type="number" id="np-used" class="inp" value="0" dir="ltr">
        <button class="btn btn-green btn-full" onclick="submitNewPart('${unitId}')">ثبت قطعه در لیست نگهداری</button>
        <div class="close-sheet-bar" onclick="closeModals()">بستن</div>
    `;
    openModal('modal-add-part');
}

async function submitNewPart(unitId) {
    const name = document.getElementById('np-name').value.trim();
    const intervalKm = document.getElementById('np-interval').value;
    const usedKm = document.getElementById('np-used').value;
    if (!name) return alert('نام قطعه را وارد کنید.');

    const res = await fetch(`/api/units/${unitId}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, intervalKm, usedKm })
    });
    const data = await res.json();
    if (!data.ok) return alert(data.message);
    closeModals();
    loadUserState();
}

async function resetConsumablePart(unitId, partId, partName) {
    if (!confirm(`آیا تعویض «${partName}» انجام شده و شمارنده آن صفر شود؟`)) return;
    await fetch(`/api/units/${unitId}/parts/${partId}/reset`, { method: 'POST' });
    loadUserState();
}

async function deleteConsumablePart(unitId, partId, partName) {
    if (!confirm(`آیا گزینه «${partName}» از لیست نگهداری حذف شود؟`)) return;
    await fetch(`/api/units/${unitId}/parts/${partId}`, { method: 'DELETE' });
    loadUserState();
}
