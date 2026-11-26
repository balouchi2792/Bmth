let stSubTab = 'general';
let stHideParamTip = false;
let stExtraFields = JSON.parse(localStorage.getItem('bmth_extra_fields') || '{}');
let stDisplayParams = JSON.parse(localStorage.getItem('bmth_disp_params') || '{}');
let stTailColors = JSON.parse(localStorage.getItem('bmth_tail_colors') || '{}');

const ALL_DEVICE_PARAMS = [
  'alarm.code', 'battery.charging.status', 'channel.id', 'defense.active.status',
  'device.id', 'device.name', 'device.type.id', 'engine.blocked.status',
  'engine.ignition.status', 'gnss.realtime.status', 'gnss.status', 'gsm.cellid',
  'gsm.lac', 'gsm.mcc', 'gsm.mnc', 'gsm.signal.level', 'ident', 'language',
  'peer', 'position.direction', 'position.latitude', 'position.longitude',
  'position.satellites', 'position.valid', 'protocol.id', 'protocol.number',
  'record.seqnum', 'server.timestamp', 'timestamp'
];

const ALL_COUNTERS = [
  { key: 'counter.mileage', label: 'شمارنده مسافت پیموده شده A' },
  { key: 'counter.engine_hours', label: 'شمارنده ساعات موتور A' }
];

function openSettingsInfoNote(txt) {
  showModal(`
    <div style="font-size:13px;line-height:1.9;color:#37474f;text-align:right;padding:4px 2px;">${txt}</div>
    <div class="close-bar" style="margin-top:8px;" onclick="closeModal()">بستن</div>
  `);
}

function openAddExtraFieldModal(uid) {
  showModal(`
    <h4 style="margin:0 0 12px;text-align:right;font-size:15px;">فیلد اضافی</h4>
    <input id="ef-name" class="cp-inp" placeholder="نام" style="margin-bottom:10px;">
    <input id="ef-val" class="cp-inp" placeholder="مقدار" style="margin-bottom:14px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
      <span style="font-size:13px;color:#37474f;">نمایش در کارت واحد</span>
      <label class="ios-switch"><input type="checkbox" id="ef-show"><span class="ios-slider"></span></label>
    </div>
    <div style="display:flex;gap:12px;">
      <button class="btn" style="flex:1;background:#cfd8dc;color:#37474f;" onclick="saveExtraField('${uid}')">ذخیره</button>
      <button class="btn" style="flex:1;background:transparent;color:#37474f;" onclick="closeModal()">لغو</button>
    </div>
  `);
}

function saveExtraField(uid) {
  const name = document.getElementById('ef-name').value.trim();
  const val = document.getElementById('ef-val').value.trim();
  const show = document.getElementById('ef-show').checked;
  if (!name || !val) return alert('نام و مقدار را وارد کنید.');
  if (!stExtraFields[uid]) stExtraFields[uid] = [];
  stExtraFields[uid].push({ id: Date.now(), name, val, show });
  localStorage.setItem('bmth_extra_fields', JSON.stringify(stExtraFields));
  closeModal();
  renderUserTab();
}

function delExtraField(uid, id) {
  stExtraFields[uid] = (stExtraFields[uid] || []).filter(x => x.id !== id);
  localStorage.setItem('bmth_extra_fields', JSON.stringify(stExtraFields));
  renderUserTab();
}

function openSelectParamModal(uid, isCounter) {
  const list = isCounter ? ALL_COUNTERS : ALL_DEVICE_PARAMS.map(p => ({ key: p, label: p }));
  showModal(`
    <div style="font-size:12px;color:#78909c;padding-bottom:8px;border-bottom:2px solid var(--primary);margin-bottom:6px;">
      ${isCounter ? 'شمارنده‌ها' : 'پارامترها'}
    </div>
    <div style="max-height:55vh;overflow-y:auto;">
      ${list.map(it => `
        <div class="menu-row" style="direction:${isCounter?'rtl':'ltr'};" onclick="addDisplayParam('${uid}','${it.key}','${it.label}')">
          <span style="font-size:13.5px;color:#263238;">${it.label}</span>
        </div>
      `).join('')}
    </div>
    <div class="close-bar" onclick="closeModal()">بستن</div>
  `);
}

function addDisplayParam(uid, key, label) {
  if (!stDisplayParams[uid]) {
    stDisplayParams[uid] = [
      { key: 'position.speed', label: 'سرعت' },
      { key: 'battery.level', label: 'سطح شارژ باتری' }
    ];
  }
  if (!stDisplayParams[uid].some(x => x.key === key)) {
    stDisplayParams[uid].push({ key, label });
    localStorage.setItem('bmth_disp_params', JSON.stringify(stDisplayParams));
  }
  closeModal();
  renderUserTab();
}

function removeDisplayParam(uid, key) {
  if (!stDisplayParams[uid]) return;
  stDisplayParams[uid] = stDisplayParams[uid].filter(x => x.key !== key);
  localStorage.setItem('bmth_disp_params', JSON.stringify(stDisplayParams));
  renderUserTab();
}

function renameActiveUnit(uid) {
  const u = uState && uState.units.find(x => x.id === uid);
  if (!u) return;
  const n = prompt('نام جدید خودرو:', u.name);
  if (!n || !n.trim()) return;
  fetch(`/api/units/${uid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: n.trim() })
  }).then(() => loadUserState());
}

function saveTailColor(uid) {
  const col = document.getElementById('st-tail-inp').value;
  stTailColors[uid] = col;
  localStorage.setItem('bmth_tail_colors', JSON.stringify(stTailColors));
  if (typeof showGreenToast === 'function') showGreenToast('رنگ دنباله مسیر ذخیره شد');
}

const _prevRenderForSettings = renderUserTab;
renderUserTab = function() {
  if (userTab === 'settings' && uState) {
    const body = document.getElementById('u-sheet-body');
    const u = uState.units.find(x => x.id === activeUnitId) || uState.units[0];
    if (!u) return;

    document.getElementById('u-sheet-title').innerText = 'تنظیمات';
    const leftBtn = document.getElementById('u-left-btn');
    if (leftBtn) { leftBtn.innerHTML = 'chevron_left'; leftBtn.onclick = () => openUserTab('units'); }
    const fields = stExtraFields[u.id] || [];
    const params = stDisplayParams[u.id] || [
      { key: 'position.speed', label: 'سرعت' },
      { key: 'battery.level', label: 'سطح شارژ باتری' }
    ];
    const tailCol = stTailColors[u.id] || '#0d47a1';

    let tabHtml = '';
    if (stSubTab === 'general') {
      tabHtml = `
        <div class="st-card">
          <div style="font-size:12.5px;color:#37474f;">پیام‌ها از: <b dir="ltr">16/10/2026 16:15:32</b></div>
          <div class="st-storage-bar">
            <div class="st-storage-fill"></div>
            <div class="st-storage-lbl">12.94 / 200 MB</div>
          </div>
          <div style="font-size:12.5px;color:#37474f;">مدت زمان ذخیره‌سازی داده <b>365 روز</b>.</div>
        </div>

        <div class="st-card">
          <div class="st-cnt-row">
            <div>
              <div style="font-size:12px;color:#78909c;">مسافت پیموده شده کل</div>
              <b style="font-size:14px;" dir="ltr">${u.mileage || 2822.535} km</b>
            </div>
            <span class="ms" style="color:#546e7a;cursor:pointer;" onclick="openSettingsInfoNote('کل مسافت پیموده شده از 16/10/2026، از جمله اطلاعات مسافت پیموده شده اولیه 0 متر تنظیم شده در تنظیمات یگان')">info</span>
          </div>
          <div class="st-cnt-row">
            <div>
              <div style="font-size:12px;color:#78909c;">کل ساعات موتور</div>
              <b style="font-size:14px;">95 ساعت، 6 دقیقه</b>
            </div>
            <span class="ms" style="color:#546e7a;cursor:pointer;" onclick="openSettingsInfoNote('کل ساعات موتور از 16/10/2026، شامل داده‌های ساعات اولیه موتور 0 ساعت، تنظیم شده در تنظیمات واحد')">info</span>
          </div>
        </div>

        <div class="st-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <b style="font-size:14px;">فیلدهای اضافی</b>
            <span style="font-size:22px;cursor:pointer;color:#455a64;padding:0 4px;" onclick="openAddExtraFieldModal('${u.id}')">+</span>
          </div>
          ${fields.length ? fields.map(f => `
            <div class="st-cnt-row">
              <div><b>${f.name}</b><div style="font-size:12px;color:#607d8b;">${f.val} ${f.show?'• نمایش در کارت':''}</div></div>
              <span style="color:#d32f2f;cursor:pointer;font-size:18px;" onclick="delExtraField('${u.id}',${f.id})">×</span>
            </div>
          `).join('') : `<div style="text-align:center;color:#78909c;font-size:12.5px;padding:10px 0;">لیست خالی است.</div>`}
        </div>`;
    } else if (stSubTab === 'alerts') {
      const items = [
        'ورود و خروج از حصار جغرافیایی',
        'سرعت غیرمجاز',
        'قطع برق / جدا شدن باتری',
        'فعال شدن دزدگیر / ضربه',
        'شروع و پایان سفر'
      ];
      tabHtml = `
        <div class="st-card">
          <b style="font-size:14px;display:block;margin-bottom:10px;">اعلان‌های ساده</b>
          ${items.map(lbl => `
            <div class="st-cnt-row">
              <span style="font-size:13px;">${lbl}</span>
              <label class="ios-switch"><input type="checkbox" checked><span class="ios-slider"></span></label>
            </div>
          `).join('')}
        </div>`;
    } else if (stSubTab === 'display') {
      tabHtml = `
        <div class="st-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <b style="font-size:14px;">پارامترها</b>
          </div>
          ${!stHideParamTip ? `
            <div class="cp-info-banner" style="margin-bottom:10px;">
              <div style="flex:1;">در این قسمت شما می‌توانید پارامترهایی که در صفحه یگان نمایش داده می‌شوند را انتخاب کنید.</div>
              <span style="font-size:18px;cursor:pointer;" onclick="stHideParamTip=true;renderUserTab()">×</span>
            </div>
          ` : ''}
          ${params.map(p => `
            <div class="st-param-item">
              <div>
                <div style="font-size:12px;color:#78909c;" dir="ltr">${p.key}</div>
                <div style="font-size:13.5px;font-weight:600;">${p.label}</div>
              </div>
              <span style="color:#90a4ae;cursor:pointer;font-size:18px;padding:4px;" onclick="removeDisplayParam('${u.id}','${p.key}')">×</span>
            </div>
          `).join('')}

          <div class="st-sel-row">
            <div class="st-sel-btn" onclick="openSelectParamModal('${u.id}', true)"><span>شمارنده‌ها</span><span>⌄</span></div>
            <div class="st-sel-add" onclick="openSelectParamModal('${u.id}', true)">+</div>
          </div>
          <div class="st-sel-row">
            <div class="st-sel-btn" onclick="openSelectParamModal('${u.id}', false)"><span>پارامترها</span><span>⌄</span></div>
            <div class="st-sel-add" onclick="openSelectParamModal('${u.id}', false)">+</div>
          </div>
        </div>

        <div class="st-card">
          <b style="font-size:14px;display:block;margin-bottom:12px;">دنباله مسیر</b>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <span style="font-size:13px;">رنگ دنباله</span>
            <input id="st-tail-inp" type="color" value="${tailCol}" style="width:34px;height:34px;border:none;border-radius:50%;cursor:pointer;background:transparent;">
          </div>
          <button class="btn btn-full" style="background:#b0bec5;color:#fff;" onclick="saveTailColor('${u.id}')">ذخیره</button>
        </div>`;
    }

    body.innerHTML = `
      <div class="st-banner">
        <span class="ms" style="position:absolute;top:12px;left:12px;color:#37474f;cursor:pointer;" onclick="openUnitActionMenu('${u.id}')">more_vert</span>
        <div class="st-avatar-wrap" onclick="openIconPicker()">
          <span class="st-online-dot"></span>
          ${getVehicleSvg(u.icon, u.color, 44)}
        </div>
        <div style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;" onclick="renameActiveUnit('${u.id}')">
          <b style="font-size:14.5px;color:#263238;">${u.name}</b>
          <span style="font-size:13px;color:#546e7a;">✎</span>
        </div>
      </div>

      <div class="st-tabs">
        <div class="st-tab ${stSubTab==='general'?'active':''}" onclick="stSubTab='general';renderUserTab()">عمومی</div>
        <div class="st-tab ${stSubTab==='alerts'?'active':''}" onclick="stSubTab='alerts';renderUserTab()">هشدارها</div>
        <div class="st-tab ${stSubTab==='display'?'active':''}" onclick="stSubTab='display';renderUserTab()">نمایش</div>
      </div>

      ${tabHtml}
    `;
    return;
  }
  _prevRenderForSettings();
};

// === ۱. مدیریت جابه‌جایی و فعال/غیرفعال کردن دکمه‌های دسترسی سریع ===
const DEFAULT_QUICK_BTNS = [
  { id: 'details', icon: 'event_note', label: 'جزئیات' },
  { id: 'cmd', icon: 'terminal', label: 'دستورات' },
  { id: 'trips', icon: 'route', label: 'سفرها' },
  { id: 'raw', icon: 'history', label: 'پیام‌ها' },
  { id: 'nav', icon: 'directions', label: 'مسیریابی' },
  { id: 'focus', icon: 'my_location', label: 'فوکوس' },
  { id: 'info', icon: 'info', label: 'اطلاعات' },
  { id: 'dir', icon: 'navigation', label: 'جهت' },
  { id: 'lock', icon: 'lock', label: 'قفل' },
  { id: 'unlock', icon: 'lock_open', label: 'باز' },
  { id: 'sec', icon: 'shield', label: 'امنیت' },
  { id: 'tl', icon: 'timeline_s', label: 'تاریخچه' },
  { id: 'share', icon: 'share', label: 'اشتراک' },
  { id: 'tools', icon: 'dvr', label: 'ابزارها' }
];

let stQuickOrder = JSON.parse(localStorage.getItem('bmth_quick_order') || 'null') || DEFAULT_QUICK_BTNS.map(b => ({ id: b.id, on: true }));
let stSpeedRules = JSON.parse(localStorage.getItem('bmth_speed_rules') || '{}');

function moveQuickBtn(idx, dir) {
  const nIdx = idx + dir;
  if (nIdx < 0 || nIdx >= stQuickOrder.length) return;
  const tmp = stQuickOrder[idx];
  stQuickOrder[idx] = stQuickOrder[nIdx];
  stQuickOrder[nIdx] = tmp;
  renderUserTab();
}

function toggleQuickBtn(idx) {
  stQuickOrder[idx].on = !stQuickOrder[idx].on;
  renderUserTab();
}

function saveQuickOrder() {
  localStorage.setItem('bmth_quick_order', JSON.stringify(stQuickOrder));
  if (typeof showGreenToast === 'function') showGreenToast('ترتیب دکمه‌های دسترسی سریع ذخیره شد');
}

function resetQuickOrder() {
  stQuickOrder = DEFAULT_QUICK_BTNS.map(b => ({ id: b.id, on: true }));
  localStorage.setItem('bmth_quick_order', JSON.stringify(stQuickOrder));
  renderUserTab();
}

function saveSpeedLimiter(uid) {
  const enabled = document.getElementById('sl-en').checked;
  const maxSpd = Number(document.getElementById('sl-max').value) || 100;
  const resSpd = Number(document.getElementById('sl-res').value) || 90;
  const autoRelay = document.getElementById('sl-relay').checked;
  stSpeedRules[uid] = { enabled, maxSpd, resSpd, autoRelay, isCut: false };
  localStorage.setItem('bmth_speed_rules', JSON.stringify(stSpeedRules));
  if (typeof showGreenToast === 'function') showGreenToast(`محدودیت سرعت (${maxSpd} km/h) ذخیره شد`);
}

// تزریق کارت «دکمه‌های دسترسی سریع» به تب نمایش و «محدودکننده سرعت» به تب هشدارها
const _prevRenderSettingsV2 = renderUserTab;
renderUserTab = function() {
  _prevRenderSettingsV2();
  if (userTab !== 'settings' || !uState) return;
  const u = uState.units.find(x => x.id === activeUnitId) || uState.units[0];
  if (!u) return;
  const body = document.getElementById('u-sheet-body');

  if (stSubTab === 'display') {
    const activeBtns = stQuickOrder.map((q, i) => {
      const meta = DEFAULT_QUICK_BTNS.find(d => d.id === q.id);
      if (!meta) return '';
      return `<div style="display:inline-flex;flex-direction:column;align-items:center;gap:3px;padding:6px;border-radius:10px;background:${q.on?'#fff':'#f1f5f9'};opacity:${q.on?1:0.45};border:1px solid #e2e8f0;min-width:52px;">
        <span class="ms" style="font-size:20px;cursor:pointer;" onclick="toggleQuickBtn(${i})" title="فعال/غیرفعال">${meta.icon}</span>
        <div style="display:flex;gap:8px;font-size:12px;color:var(--primary);font-weight:bold;">
          <span style="cursor:pointer;" onclick="moveQuickBtn(${i},-1)">◀</span>
          <span style="cursor:pointer;" onclick="moveQuickBtn(${i},1)">▶</span>
        </div>
      </div>`;
    }).join('');

    const card = document.createElement('div');
    card.className = 'st-card';
    card.innerHTML = `
      <b style="font-size:14px;display:block;margin-bottom:8px;">دکمه‌های دسترسی سریع</b>
      <div class="cp-info-banner" style="margin-bottom:10px;">
        <div style="flex:1;">با لمس هر آیکون آن را فعال/مخفی کنید و با فلش‌های ◀ ▶ جای آیکون‌ها را روی کارت خودرو تغییر دهید.</div>
      </div>
      <div style="display:flex;gap:6px;overflow-x:auto;padding:6px 2px 12px;direction:ltr;">${activeBtns}</div>
      <div style="display:flex;gap:10px;margin-top:6px;">
        <button class="btn" style="flex:1;background:#546e7a;color:#fff;" onclick="saveQuickOrder()">ذخیره</button>
        <button class="btn" style="flex:1;background:#eeeeee;color:#37474f;" onclick="resetQuickOrder()">ریست کردن</button>
      </div>`;
    const tabsEl = body.querySelector('.st-tabs');
    if (tabsEl) tabsEl.insertAdjacentElement('afterend', card);
  }

  if (stSubTab === 'alerts') {
    const rule = stSpeedRules[u.id] || { enabled: false, maxSpd: 100, resSpd: 90, autoRelay: false };
    const card = document.createElement('div');
    card.className = 'st-card';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <b style="font-size:14px;">محدودکننده سرعت هوشمند</b>
        <label class="ios-switch"><input type="checkbox" id="sl-en" ${rule.enabled?'checked':''}><span class="ios-slider"></span></label>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        <div><label style="font-size:11.5px;color:#64748b;">حداکثر سرعت مجاز (km/h):</label><input id="sl-max" type="number" class="cp-inp" value="${rule.maxSpd}" dir="ltr"></div>
        <div><label style="font-size:11.5px;color:#64748b;">سرعت وصل مجدد رله:</label><input id="sl-res" type="number" class="cp-inp" value="${rule.resSpd}" dir="ltr"></div>
      </div>
      <div class="st-cnt-row" style="border-top:1px solid #f1f5f9;">
        <div>
          <div style="font-size:12.5px;font-weight:700;color:#c62828;">قطع و وصل خودکار رله برق</div>
          <div style="font-size:10.5px;color:#64748b;">بالای سرعت مجاز قطع و زیر سرعت بازگشت وصل شود</div>
        </div>
        <label class="ios-switch"><input type="checkbox" id="sl-relay" ${rule.autoRelay?'checked':''}><span class="ios-slider"></span></label>
      </div>
      <button class="btn btn-full" style="margin-top:10px;" onclick="saveSpeedLimiter('${u.id}')">ذخیره تنظیمات سرعت</button>`;
    body.appendChild(card);
  }
};
