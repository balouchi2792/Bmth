let mtPage = 'menu'; // 'menu' | 'mileage' | 'engine'
let mtCfgOpen = true, mtSumOpen = true, mtSumTab = 'A';
let mtStore = JSON.parse(localStorage.getItem('bmth_maint_store') || '{}');

function getUnitMaintData(u, mode) {
  const key = `${u.id}_${mode}`;
  if (!mtStore[key]) {
    mtStore[key] = {
      A: {
        active: true,
        name: 'A',
        val: mode === 'mileage' ? (u.mileage || 2821.7) : 91.8,
        limit: mode === 'mileage' ? 0 : 40,
        alert: true,
        since: mode === 'mileage' ? '16:10, 16/10' : '05:20, 18/10'
      },
      B: { active: false, name: 'B', val: 0, limit: 0, alert: false, since: '' },
      C: { active: false, name: 'C', val: 0, limit: 0, alert: false, since: '' }
    };
  }
  return mtStore[key];
}

function saveMtStore() {
  localStorage.setItem('bmth_maint_store', JSON.stringify(mtStore));
}

function fmtMtVal(mode, val, limit) {
  if (mode === 'mileage') {
    const v = `${Number(val).toFixed(1)} km`;
    return limit > 0 ? `${v} / ${limit} km` : v;
  }
  const h = Math.floor(val), m = Math.round((val - h) * 60);
  const v = `${h} ساعت، ${m} دقیقه`;
  return limit > 0 ? `${v} / ${limit} ساعت` : v;
}

function resetMaintCounter(uid, mode, slot) {
  const u = uState && uState.units.find(x => x.id === uid);
  if (!u) return;
  const data = getUnitMaintData(u, mode);
  if (!confirm(`آیا شمارنده «${data[slot].name}» برای ${u.name} بازنشانی (صفر) شود؟`)) return;
  data[slot].val = 0;
  const now = new Date();
  data[slot].since = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}, ${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}`;
  saveMtStore();
  if (typeof showGreenToast === 'function') showGreenToast(`شمارنده ${data[slot].name} بازنشانی شد`);
  renderUserTab();
}

function openMaintConfigModal(uid, mode, slot) {
  const u = uState && uState.units.find(x => x.id === uid);
  if (!u) return;
  const c = getUnitMaintData(u, mode)[slot];
  const unitLbl = mode === 'mileage' ? 'حد مسافت (کیلومتر)' : 'حد ساعات موتور';

  showModal(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <span style="width:20px;"></span>
      <b style="font-size:15px;">پیکربندی شمارنده ${slot}</b>
      <span style="font-size:20px;cursor:pointer;color:#546e7a;" onclick="closeModal()">×</span>
    </div>
    <div style="font-size:11.5px;color:#78909c;margin-bottom:4px;">نام شمارنده</div>
    <input id="mt-c-name" class="cp-inp" value="${c.name || slot}" style="margin-bottom:12px;">
    <div style="font-size:11.5px;color:#78909c;margin-bottom:4px;">${unitLbl}</div>
    <input id="mt-c-lim" type="number" class="cp-inp" value="${c.limit || ''}" placeholder="مثلاً ${mode==='mileage'?'5000':'40'}" dir="ltr" style="margin-bottom:14px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
      <span style="font-size:13px;color:#37474f;">هشدار زمانی که حد رسیده است</span>
      <label class="ios-switch"><input type="checkbox" id="mt-c-al" ${c.alert?'checked':''}><span class="ios-slider"></span></label>
    </div>
    <div style="display:flex;gap:10px;">
      <button class="btn" style="flex:1;background:#546e7a;color:#fff;" onclick="saveMaintConfig('${uid}','${mode}','${slot}',true)">ذخیره</button>
      <button class="btn" style="flex:1;background:transparent;color:#90a4ae;" onclick="saveMaintConfig('${uid}','${mode}','${slot}',false)">غیرفعال کردن</button>
    </div>
  `);
}

function saveMaintConfig(uid, mode, slot, enable) {
  const u = uState && uState.units.find(x => x.id === uid);
  if (!u) return;
  const c = getUnitMaintData(u, mode)[slot];
  if (!enable) {
    c.active = false;
  } else {
    c.active = true;
    c.name = document.getElementById('mt-c-name').value.trim() || slot;
    c.limit = Number(document.getElementById('mt-c-lim').value) || 0;
    c.alert = document.getElementById('mt-c-al').checked;
    if (!c.since) {
      const now = new Date();
      c.since = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}, ${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}`;
    }
  }
  saveMtStore();
  closeModal();
  renderUserTab();
}

const _prevRenderForMaint = renderUserTab;
renderUserTab = function() {
  if (userTab === 'maint' && uState) {
    const body = document.getElementById('u-sheet-body');
    const units = uState.units || [];
    const actU = units.find(x => x.id === activeUnitId) || units[0];
    const leftBtn = document.getElementById('u-left-btn');

    if (mtPage === 'menu') {
      document.getElementById('u-sheet-title').innerText = 'نگهداری';
      if (leftBtn) leftBtn.onclick = handleSheetLeftBtn;
      body.innerHTML = `
        <div class="stat-link-card" onclick="mtPage='mileage';renderUserTab()">
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="ms" style="font-size:24px;color:#37474f;">route</span>
            <div><b style="font-size:14.5px;">شمارنده‌های مسافت پیموده شده</b><div style="font-size:11.5px;color:#78909c;">پیکربندی و خلاصه</div></div>
          </div>
          <span style="font-size:18px;color:#78909c;">&lt;</span>
        </div>
        <div class="stat-link-card" onclick="mtPage='engine';renderUserTab()">
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="ms" style="font-size:24px;color:#37474f;">build</span>
            <div><b style="font-size:14.5px;">شمارنده‌های ساعات موتور</b><div style="font-size:11.5px;color:#78909c;">پیکربندی و خلاصه</div></div>
          </div>
          <span style="font-size:18px;color:#78909c;">&lt;</span>
        </div>`;
      return;
    }

    const isMil = mtPage === 'mileage';
    const titleTxt = isMil ? 'شمارنده‌های مسافت پیموده شده' : 'شمارنده‌های ساعات موتور';
    document.getElementById('u-sheet-title').innerText = titleTxt;
    if (leftBtn) {
      leftBtn.innerHTML = 'chevron_left';
      leftBtn.onclick = () => { mtPage = 'menu'; renderUserTab(); };
    }

    const actData = actU ? getUnitMaintData(actU, mtPage) : {};
    const cfgRows = ['A', 'B', 'C'].map(slot => {
      const c = actData[slot];
      if (!c || !c.active) {
        return `<div class="mt-row" style="display:flex;justify-content:space-between;align-items:center;">
          <div class="mt-badge-abc">${slot}</div>
          <span style="font-size:22px;color:#90a4ae;cursor:pointer;padding:0 6px;" onclick="openMaintConfigModal('${actU.id}','${mtPage}','${slot}')">+</span>
        </div>`;
      }
      const over = c.limit > 0 && c.val >= c.limit;
      return `<div class="mt-row">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="mt-badge-abc">${slot}</div>
            ${c.name !== slot ? `<b style="font-size:12.5px;">${c.name}</b>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:10px;color:#78909c;font-size:12px;">
            <span dir="ltr">${c.since}</span>
            <span style="cursor:pointer;font-size:15px;" onclick="openMaintConfigModal('${actU.id}','${mtPage}','${slot}')">✎</span>
          </div>
        </div>
        <div class="mt-bar-wrap">
          <div class="mt-bar ${over?'over':''}">
            ${over ? `<div class="mt-bar-warn">!</div>` : ''}
            <span class="mt-bar-pill">${fmtMtVal(mtPage, c.val, c.limit)}</span>
          </div>
          <span style="font-size:20px;color:#546e7a;cursor:pointer;padding:0 4px;" title="بازنشانی شمارنده" onclick="resetMaintCounter('${actU.id}','${mtPage}','${slot}')">↻</span>
        </div>
      </div>`;
    }).join('');

    const sumRows = units.map(u => {
      const c = getUnitMaintData(u, mtPage)[mtSumTab];
      if (!c || !c.active) return '';
      const over = c.limit > 0 && c.val >= c.limit;
      return `<div class="mt-row">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:8px;">
            ${getVehicleSvg(u.icon, u.color, 32)}
            <b style="font-size:13.5px;">${u.name}</b>
          </div>
          <span style="font-size:12px;color:#78909c;" dir="ltr">${c.since}</span>
        </div>
        <div class="mt-bar-wrap">
          <div class="mt-bar ${over?'over':''}">
            ${over ? `<div class="mt-bar-warn">!</div>` : ''}
            <span class="mt-bar-pill">${fmtMtVal(mtPage, c.val, c.limit)}</span>
          </div>
          <span style="font-size:20px;color:#546e7a;cursor:pointer;padding:0 4px;" title="بازنشانی شمارنده" onclick="resetMaintCounter('${u.id}','${mtPage}','${mtSumTab}')">↻</span>
        </div>
      </div>`;
    }).filter(Boolean).join('') || `<div style="text-align:center;color:#90a4ae;font-size:12.5px;padding:18px;">شمارنده ${mtSumTab} برای هیچ خودرویی فعال نشده است.</div>`;

    body.innerHTML = `
      <div class="mt-card">
        <div class="mt-head" onclick="mtCfgOpen=!mtCfgOpen;renderUserTab()">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="ms" style="font-size:22px;color:#37474f;">build</span>
            <div><b style="font-size:14px;">${titleTxt}</b><div style="font-size:11px;color:#78909c;">پیکربندی</div></div>
          </div>
          <span class="ms">${mtCfgOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>
        </div>
        ${mtCfgOpen && actU ? `
          <div style="display:flex;align-items:center;gap:8px;padding:0 14px 10px;">
            ${getVehicleSvg(actU.icon, actU.color, 32)}
            <b style="font-size:13.5px;">${actU.name}</b>
          </div>
          ${cfgRows}
        ` : ''}
      </div>

      <div class="mt-card">
        <div class="mt-head" onclick="mtSumOpen=!mtSumOpen;renderUserTab()">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="ms" style="font-size:22px;color:#37474f;">${isMil?'route':'build'}</span>
            <div><b style="font-size:14px;">خلاصه ${titleTxt}</b><div style="font-size:11px;color:#78909c;">محاسبه و بازنشانی</div></div>
          </div>
          <span class="ms">${mtSumOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>
        </div>
        ${mtSumOpen ? `
          <div class="mt-tabs-3">
            ${['A','B','C'].map(t => `<div class="mt-tab ${mtSumTab===t?'active':''}" onclick="mtSumTab='${t}';renderUserTab()">${t}</div>`).join('')}
          </div>
          ${sumRows}
        ` : ''}
      </div>`;
    return;
  }
  _prevRenderForMaint();
};
