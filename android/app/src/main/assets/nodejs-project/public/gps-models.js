// دیتابیس جامع مدل‌های GPS دنیا + دستورات اختصاصی هر پروتکل
window.GPS_MODELS_DB = [
  { brand: 'Concox / Jimi', model: 'GT06N / GT06E / AT4 / JM-VL03', proto: 'gt06', port: 5023, cmds: { stop: 'RELAY,1#', start: 'RELAY,0#', lock: 'LOCK#', unlock: 'UNLOCK#', status: 'STATUS#' } },
  { brand: 'Quectel / Generic', model: 'MC20 / YT_MC20 / X1', proto: 'gt06', port: 5023, cmds: { stop: 'RELAY,1#', start: 'RELAY,0#', lock: 'LOCK#', unlock: 'UNLOCK#', status: 'PARAM#' } },
  { brand: 'Coban / GPS103', model: 'TK103A / TK103B / TK303 / TK403', proto: 'gps103', port: 5001, cmds: { stop: 'stop123456', start: 'resume123456', lock: 'arm123456', unlock: 'disarm123456', status: 'check123456' } },
  { brand: 'Teltonika', model: 'FMB920 / FMB120 / FMB140 / FMC130 / FMM130', proto: 'teltonika', port: 5027, cmds: { stop: 'setdigout 1', start: 'setdigout 0', lock: 'setdigout 11', unlock: 'setdigout 00', status: 'getinfo' } },
  { brand: 'Sinotrack', model: 'ST-901 / ST-902 / ST-906 / ST-907', proto: 'h02', port: 5013, cmds: { stop: '9400000', start: '9410000', lock: 'LOCK#', unlock: 'UNLOCK#', status: 'RCONF' } },
  { brand: 'MiCODUS', model: 'MV720 / MV730 / MV710G / ML910', proto: 'gt06', port: 5023, cmds: { stop: '555', start: '666', lock: 'ARM#', unlock: 'DISARM#', status: 'STATUS#' } },
  { brand: 'Wanway / S20', model: 'S20 / G19 / EV02 / GS10G', proto: 'gt06', port: 5023, cmds: { stop: 'RELAY,1#', start: 'RELAY,0#', lock: 'LOCK#', unlock: 'UNLOCK#', status: 'STATUS#' } },
  { brand: 'Ruptela', model: 'FM-Eco4 / FM-Pro4 / Trace5 / HCV5', proto: 'ruptela', port: 5046, cmds: { stop: 'setio 1,1', start: 'setio 1,0', lock: 'setio 2,1', unlock: 'setio 2,0', status: 'getver' } },
  { brand: 'Queclink', model: 'GV55 / GV300 / GV350 / GL300', proto: 'gl200', port: 5004, cmds: { stop: 'AT+GTOUT=gv300,1,,,0,0,0,0,0,0,0,,,,,,,FFFF$', start: 'AT+GTOUT=gv300,0,,,0,0,0,0,0,0,0,,,,,,,FFFF$', lock: 'AT+GTOUT=gv300,0,1', unlock: 'AT+GTOUT=gv300,0,0', status: 'AT+GTRTO=gv300,1,,,,,,FFFF$' } },
  { brand: 'Meitrack', model: 'MVT380 / T366 / T399 / MVT600', proto: 'meitrack', port: 5020, cmds: { stop: '0000,C01,0,12222', start: '0000,C01,0,02222', lock: '0000,C01,0,21222', unlock: '0000,C01,0,20222', status: '0000,A00' } },
  { brand: 'Suntech', model: 'ST310U / ST4310 / ST4340', proto: 'suntech', port: 5011, cmds: { stop: 'SA200CMD;01;Enable1', start: 'SA200CMD;01;Disable1', lock: 'SA200CMD;01;Enable2', unlock: 'SA200CMD;01;Disable2', status: 'SA200CMD;01;StatusReq' } },
  { brand: 'CalAmp', model: 'LMU-2630 / LMU-3030 / LMU-4230', proto: 'calamp', port: 5082, cmds: { stop: 'OUT1=1', start: 'OUT1=0', lock: 'OUT2=1', unlock: 'OUT2=0', status: 'STATUS' } },
  { brand: 'TKSTAR / Winnes', model: 'TK905 / TK915 / TK909', proto: 'watch', port: 5093, cmds: { stop: 'stop123456', start: 'resume123456', lock: 'arm123456', unlock: 'disarm123456', status: 'check123456' } },
  { brand: 'Galileosky', model: '7x / Base Block / 10', proto: 'galileo', port: 5034, cmds: { stop: 'Out 0,1', start: 'Out 0,0', lock: 'Out 1,1', unlock: 'Out 1,0', status: 'Status' } },
  { brand: 'Eelink', model: 'TK115 / TK119 / GPT12', proto: 'eelink', port: 5064, cmds: { stop: 'RELAY,1#', start: 'RELAY,0#', lock: 'LOCK#', unlock: 'UNLOCK#', status: 'STATUS#' } },
  { brand: 'Wialon / Generic H02', model: 'H02 / Xexun / Radar / Zیتون', proto: 'h02', port: 5013, cmds: { stop: 'DYD#', start: 'HFYD#', lock: 'SF#', unlock: 'CF#', status: 'STATUS#' } }
];

// همگام‌سازی خودکار با GPS_CMDS برای ارسال دستور بر اساس مدل
window.GPS_CMDS = window.GPS_CMDS || {};
window.GPS_MODELS_DB.forEach(m => {
  window.GPS_CMDS[m.model] = m.cmds;
  window.GPS_CMDS[m.brand + ' - ' + m.model] = m.cmds;
});

function getCmdsForModel(modelName) {
  const found = window.GPS_MODELS_DB.find(m =>
    m.model === modelName || (m.brand + ' - ' + m.model) === modelName || (modelName && m.model.includes(modelName))
  );
  return found ? found.cmds : { stop: 'RELAY,1#', start: 'RELAY,0#', lock: 'LOCK#', unlock: 'UNLOCK#', status: 'STATUS#' };
}

function openAddGpsModal() {
  showModal(`
    <h4 style="margin:0 0 6px;text-align:center;">افزودن ردیاب (GPS) جدید</h4>
    <div style="text-align:center;font-size:11.5px;color:#2e7d32;background:#e8f5e9;padding:6px 10px;border-radius:8px;margin-bottom:12px;">
      هر اکانت جدید به صورت پیش‌فرض <b>۱۰ روز مهلت تست رایگان</b> دارد.
    </div>
    <input id="ag-name" class="cp-inp" placeholder="نام خودرو (مثلاً: مزدا ۲۰۰۰)" style="margin-bottom:8px;">
    <input id="ag-imei" class="cp-inp" placeholder="شماره سریال / IMEI (۱۵ رقم)" dir="ltr" style="margin-bottom:8px;">
    <input id="ag-search" class="cp-inp" placeholder="جستجوی برند یا مدل GPS (مثلاً Teltonika, GT06, Coban...)" oninput="filterGpsModelList(this.value)" style="margin-bottom:6px;font-size:12px;">
    <select id="ag-model" class="cp-inp" style="margin-bottom:8px;direction:ltr;">
      ${window.GPS_MODELS_DB.map(m => `<option value="${m.brand} - ${m.model}">${m.brand} — ${m.model} (Port: ${m.port})</option>`).join('')}
    </select>
    <div id="ag-cmd-preview" style="font-size:11px;color:#546e7a;background:#f8fafc;padding:8px;border-radius:8px;margin-bottom:12px;direction:ltr;"></div>
    <div style="display:flex;gap:10px;">
      <button class="btn" style="flex:1;background:#2e7d32;color:#fff;" onclick="submitNewGpsUnit()">ثبت و فعال‌سازی</button>
      <button class="btn" style="flex:1;background:#eeeeee;color:#37474f;" onclick="closeModal()">لغو</button>
    </div>
  `);
  const sel = document.getElementById('ag-model');
  const updPrev = () => {
    const c = getCmdsForModel(sel.value);
    document.getElementById('ag-cmd-preview').innerHTML = `<b>دستورات خودکار این مدل:</b><br>قطع: <code>${c.stop}</code> | وصل: <code>${c.start}</code>`;
  };
  sel.onchange = updPrev;
  updPrev();
}

function filterGpsModelList(q) {
  const sel = document.getElementById('ag-model');
  const term = (q || '').toLowerCase();
  const filtered = window.GPS_MODELS_DB.filter(m =>
    (m.brand + ' ' + m.model + ' ' + m.proto).toLowerCase().includes(term)
  );
  sel.innerHTML = filtered.map(m => `<option value="${m.brand} - ${m.model}">${m.brand} — ${m.model} (Port: ${m.port})</option>`).join('');
  if (sel.onchange) sel.onchange();
}

async function submitNewGpsUnit() {
  const name = document.getElementById('ag-name').value.trim();
  const imei = document.getElementById('ag-imei').value.trim();
  const model = document.getElementById('ag-model').value;
  if (!name || !imei) return alert('لطفاً نام خودرو و شماره سریال (IMEI) را وارد کنید.');

  const r = await fetch('/api/units', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, imei, model })
  });
  const d = await r.json();
  if (!r.ok || d.error) {
    return alert(d.error || 'خطا در ثبت سریال! ممکن است این سریال قبلاً در اکانت دیگری ثبت شده باشد.');
  }
  closeModal();
  if (typeof showGreenToast === 'function') showGreenToast(`ردیاب «${name}» با ۱۰ روز تست رایگان ثبت شد`);
  loadUserState();
}

// افزودن دکمه «افزودن GPS جدید» به انتهای لیست یگان‌ها
const _prevRenderForAddBtn = renderUserTab;
renderUserTab = function() {
  _prevRenderForAddBtn();
  if (userTab === 'units' && uState) {
    const body = document.getElementById('u-sheet-body');
    if (body && !body.querySelector('.add-gps-bottom-btn')) {
      const wrap = document.createElement('div');
      wrap.className = 'add-gps-bottom-btn';
      wrap.style.cssText = 'padding:8px 0 18px;';
      wrap.innerHTML = `<button class="btn btn-full" style="background:#1565c0;color:#fff;padding:12px;border-radius:12px;font-size:13.5px;display:flex;align-items:center;justify-content:center;gap:8px;" onclick="openAddGpsModal()">
        <span style="font-size:20px;line-height:1;">+</span><span>افزودن GPS جدید (۱۰ روز تست رایگان)</span>
      </button>`;
      body.appendChild(wrap);
    }
  }
};
