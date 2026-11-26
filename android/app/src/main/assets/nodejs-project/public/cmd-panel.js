let cpUnitId = null, cpTab = 'list', cpGeoView = false, cpHideBanner = false;
let cpSavedCmds = JSON.parse(localStorage.getItem('bmth_saved_cmds') || '{}');
let cpHistory = JSON.parse(localStorage.getItem('bmth_cmd_hist') || '[]');
let cpEventActs = JSON.parse(localStorage.getItem('bmth_ev_acts') || '{}');

function ensureCmdOverlay() {
  let el = document.getElementById('cmd-panel-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cmd-panel-overlay';
    document.body.appendChild(el);
  }
  return el;
}

openCmdModal = function(uid) {
  cpUnitId = uid;
  activeUnitId = uid;
  cpTab = 'list';
  cpGeoView = false;
  ensureCmdOverlay().classList.add('open');
  renderCmdPanel();
};

function closeCmdPanel() {
  const el = document.getElementById('cmd-panel-overlay');
  if (el) el.classList.remove('open');
}

function addEventAction(key, label) {
  const act = prompt(`انتخاب دستور برای رویداد «${label}» (مثلاً: RELAY,1# یا مسدود کردن):`, 'RELAY,1#');
  if (!act || !act.trim()) return;
  if (!cpEventActs[key]) cpEventActs[key] = [];
  cpEventActs[key].push(act.trim());
  localStorage.setItem('bmth_ev_acts', JSON.stringify(cpEventActs));
  renderCmdPanel();
}

function removeEventAction(key, idx) {
  if (!cpEventActs[key]) return;
  cpEventActs[key].splice(idx, 1);
  localStorage.setItem('bmth_ev_acts', JSON.stringify(cpEventActs));
  renderCmdPanel();
}

function saveCustomCmd() {
  const name = document.getElementById('cp-name').value.trim();
  const payload = document.getElementById('cp-payload').value.trim();
  const quick = document.getElementById('cp-quick').checked;
  if (!name || !payload) return alert('نام و payload دستور را وارد کنید.');
  if (!cpSavedCmds[cpUnitId]) cpSavedCmds[cpUnitId] = [];
  cpSavedCmds[cpUnitId].push({ id: Date.now(), name, payload, quick });
  localStorage.setItem('bmth_saved_cmds', JSON.stringify(cpSavedCmds));
  renderCmdPanel();
}

async function execPanelCmd(cmdType, label, payload) {
  const u = uState && uState.units.find(x => x.id === cpUnitId);
  if (!u) return;
  const r = await fetch(`/api/units/${u.id}/command`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: cmdType, payload })
  });
  const d = await r.json();
  cpHistory.unshift({
    unitId: u.id, unitName: u.name, label, payload,
    time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  });
  localStorage.setItem('bmth_cmd_hist', JSON.stringify(cpHistory.slice(0, 40)));
  showGreenToast(`فرمان "${label}" ارسال شد`);
  loadUserState();
  renderCmdPanel();
}

function renderEventList(key) {
  const arr = cpEventActs[key] || [];
  if (!arr.length) return `<div class="cp-ev-empty">هیچ اقدام رویدادی وجود ندارد</div>`;
  return `<div style="padding:4px 0 10px;border-bottom:1px solid #f1f5f9;">` + arr.map((a, i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;padding:6px 10px;border-radius:8px;margin-bottom:4px;font-size:12px;">
      <code dir="ltr">${a}</code>
      <span style="color:#d32f2f;cursor:pointer;font-weight:bold;" onclick="removeEventAction('${key}',${i})">×</span>
    </div>`).join('') + `</div>`;
}

function renderCmdPanel() {
  const el = ensureCmdOverlay();
  const u = uState && uState.units.find(x => x.id === cpUnitId);
  if (!u) return;
  const c = (typeof GPS_CMDS !== 'undefined' && GPS_CMDS[u.model]) ? GPS_CMDS[u.model] : { stop: 'RELAY,1#', start: 'RELAY,0#', lock: 'LOCK#', unlock: 'UNLOCK#' };
  const doorOk = uState.user && uState.user.allowDoorLock !== false;
  const saved = cpSavedCmds[u.id] || [];

  let bodyHtml = '';
  if (cpTab === 'list') {
    bodyHtml = `
      <div class="cp-card">
        <div style="font-size:13.5px;font-weight:700;margin-bottom:12px;color:#37474f;">ایجاد کردن دستور</div>
        <input id="cp-name" class="cp-inp" placeholder="نام برای ذخیره">
        <div class="cp-helper">نام را برای ذخیره فرمان وارد کنید</div>
        <input id="cp-payload" class="cp-inp" placeholder="payload" dir="ltr">
        <div class="cp-helper">این رشته است (مثال: ${c.stop})</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:10px 0 16px;">
          <div>
            <div style="font-size:12.5px;color:#607d8b;">نمایش در نوار ابزار دسترسی سریع</div>
            <div id="cp-q-lbl" style="font-size:11.5px;color:#37474f;margin-top:2px;">غیر فعال</div>
          </div>
          <label class="ios-switch"><input type="checkbox" id="cp-quick" onchange="document.getElementById('cp-q-lbl').innerText=this.checked?'فعال':'غیر فعال'"><span class="ios-slider"></span></label>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <button class="btn" style="flex:1;background:#cfd8dc;color:#37474f;" onclick="saveCustomCmd()">ذخیره</button>
          <button class="btn" style="flex:1;background:transparent;color:#546e7a;border:1px solid #cfd8dc;" onclick="execPanelCmd('CUSTOM','دستور دستی',document.getElementById('cp-payload').value.trim()||'STATUS#')">
            <span class="ms" style="font-size:18px;">near_me</span> ارسال
          </button>
        </div>
      </div>

      <div class="cp-card">
        <div style="font-size:13.5px;font-weight:700;margin-bottom:8px;color:#37474f;">اقدامات (${u.model})</div>
        <div class="cp-action-row">
          <div style="display:flex;align-items:center;gap:12px;"><span class="ms">lock</span><span>مسدود کردن</span></div>
          <span class="ms" style="cursor:pointer;color:#455a64;" onclick="execPanelCmd('STOP','مسدود کردن','${c.stop}')">near_me</span>
        </div>
        <div class="cp-action-row">
          <div style="display:flex;align-items:center;gap:12px;"><span class="ms">lock_open</span><span>رفع انسداد</span></div>
          <span class="ms" style="cursor:pointer;color:#455a64;" onclick="execPanelCmd('START','رفع انسداد','${c.start}')">near_me</span>
        </div>
        ${doorOk ? `
        <div class="cp-action-row">
          <div style="display:flex;align-items:center;gap:12px;"><span class="ms" style="color:var(--primary);">lock</span><span>بستن درب‌ها</span></div>
          <span class="ms" style="cursor:pointer;color:var(--primary);" onclick="execPanelCmd('DOOR_LOCK','بستن درب‌ها','${c.lock}')">near_me</span>
        </div>
        <div class="cp-action-row">
          <div style="display:flex;align-items:center;gap:12px;"><span class="ms" style="color:var(--primary);">lock_open</span><span>باز کردن درب‌ها</span></div>
          <span class="ms" style="cursor:pointer;color:var(--primary);" onclick="execPanelCmd('DOOR_UNLOCK','باز کردن درب‌ها','${c.unlock}')">near_me</span>
        </div>` : ''}
        ${saved.map(sc => `
        <div class="cp-action-row">
          <div style="display:flex;align-items:center;gap:12px;"><span class="ms">terminal</span><div><div>${sc.name}</div><small dir="ltr" style="color:#78909c;">${sc.payload}</small></div></div>
          <span class="ms" style="cursor:pointer;color:#455a64;" onclick="execPanelCmd('CUSTOM','${sc.name}','${sc.payload}')">near_me</span>
        </div>`).join('')}
      </div>`;
  } else if (cpTab === 'history') {
    const hist = cpHistory.filter(x => x.unitId === u.id);
    bodyHtml = hist.length ? hist.map(h => `
      <div class="cp-card" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;">
        <div><b>${h.label}</b><div style="font-size:11.5px;color:#607d8b;" dir="ltr">${h.payload}</div></div>
        <span style="font-size:11.5px;color:#78909c;direction:ltr;">${h.time}</span>
      </div>`).join('') : `<div class="cp-card" style="text-align:center;color:#78909c;padding:24px;">هنوز دستوری برای این خودرو ارسال نشده است.</div>`;
  } else if (cpTab === 'events') {
    if (cpGeoView) {
      const gfs = (uState.geofences && uState.geofences.length) ? uState.geofences : [{ id: 'g1', name: 'حصار جغرافیایی من' }, { id: 'g2', name: 'حصار جغرافیایی من 1' }];
      bodyHtml = `
        <div class="cp-pill-back" onclick="cpGeoView=false;renderCmdPanel()">
          <span>همه دستورات رویداد</span><span>&lt;</span>
        </div>
        ${gfs.map(g => `
          <div class="cp-card">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <span class="ms" style="color:#455a64;">my_location</span>
              <div><b style="font-size:13.5px;">${g.name}</b><div style="font-size:11px;color:#90a4ae;">اقدامات رویداد حصار جغرافیایی</div></div>
            </div>
            <div class="cp-ev-row"><span>ورود</span><span style="font-size:20px;cursor:pointer;" onclick="addEventAction('${u.id}_g_${g.id}_in','ورود به ${g.name}')">+</span></div>
            ${renderEventList(u.id + '_g_' + g.id + '_in')}
            <div class="cp-ev-row"><span>خروج</span><span style="font-size:20px;cursor:pointer;" onclick="addEventAction('${u.id}_g_${g.id}_out','خروج از ${g.name}')">+</span></div>
            ${renderEventList(u.id + '_g_' + g.id + '_out')}
          </div>`).join('')}`;
    } else {
      bodyHtml = `
        ${!cpHideBanner ? `<div class="cp-info-banner">
          <div style="flex:1;">دستورات به نوع دستگاه واحد بستگی دارد. اگر نوع دستگاه واحد را تغییر دهید، اقدامات رویداد ذخیره شده قبلی حذف خواهند شد. اگر حصار جغرافیایی را حذف کنید، اقدامات رویداد برای این حصار جغرافیایی نیز حذف خواهند شد.</div>
          <span style="font-size:18px;cursor:pointer;" onclick="cpHideBanner=true;renderCmdPanel()">×</span>
        </div>` : ''}
        <div class="cp-card">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><span class="ms">route</span><b>اقدامات رویداد سفرها</b></div>
          <div class="cp-ev-row"><span>شروع سفر</span><span style="font-size:20px;cursor:pointer;" onclick="addEventAction('${u.id}_trip_start','شروع سفر')">+</span></div>
          ${renderEventList(u.id + '_trip_start')}
          <div class="cp-ev-row"><span>پایان سفر</span><span style="font-size:20px;cursor:pointer;" onclick="addEventAction('${u.id}_trip_end','پایان سفر')">+</span></div>
          ${renderEventList(u.id + '_trip_end')}
        </div>
        <div class="cp-card">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><span class="ms">notifications</span><b>اقدامات رویداد هشدار</b></div>
          <div class="cp-ev-row"><span>هشدار فعال شد</span><span style="font-size:20px;cursor:pointer;" onclick="addEventAction('${u.id}_alert_on','هشدار فعال شد')">+</span></div>
          ${renderEventList(u.id + '_alert_on')}
        </div>
        <div class="cp-card" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="cpGeoView=true;renderCmdPanel()">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="ms">pentagon</span>
            <div><b>اقدامات رویداد حصار جغرافیایی</b><div style="font-size:11px;color:#90a4ae;">تنظیم برای حصارهای جغرافیایی مختلف</div></div>
          </div>
          <span style="font-size:18px;color:#78909c;">&lt;</span>
        </div>`;
    }
  }

  el.innerHTML = `
    <div class="cp-head">
      <span style="width:24px;"></span>
      <div style="text-align:center;">
        <div style="font-weight:700;font-size:15px;">پنل دستورات</div>
        <div style="font-size:12px;color:#607d8b;">${u.name}</div>
      </div>
      <span style="font-size:22px;cursor:pointer;color:#455a64;width:24px;text-align:left;" onclick="closeCmdPanel()">×</span>
    </div>
    <div class="cp-tabs">
      <div class="cp-tab ${cpTab==='list'?'active':''}" onclick="cpTab='list';renderCmdPanel()"><span class="ms" style="font-size:19px;">view_list</span>${cpTab==='list'?'<span>فهرست</span>':''}</div>
      <div class="cp-tab ${cpTab==='history'?'active':''}" onclick="cpTab='history';renderCmdPanel()"><span class="ms" style="font-size:19px;">history</span>${cpTab==='history'?'<span>تاریخچه</span>':''}</div>
      <div class="cp-tab ${cpTab==='events'?'active':''}" onclick="cpTab='events';cpGeoView=false;renderCmdPanel()"><span class="ms" style="font-size:19px;">terminal</span>${cpTab==='events'?'<span>اقدامات رویداد</span>':''}</div>
    </div>
    <div class="cp-body">${bodyHtml}</div>`;
}
