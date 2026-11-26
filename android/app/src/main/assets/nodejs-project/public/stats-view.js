let stMilOpen = true, stEngOpen = true;
let stMilRange = 30, stEngRange = 1;
let stHideTipM = false, stHideTipE = false;
let stHiddenUnits = {};

function toggleStatUnit(uid) {
  stHiddenUnits[uid] = !stHiddenUnits[uid];
  renderUserTab();
}

function getUnitStatSeries(u, range, isEngine) {
  let seed = 0;
  for (let i = 0; i < u.id.length; i++) seed += u.id.charCodeAt(i);
  const count = range === 1 ? 11 : (range === 7 ? 7 : 10);
  const vals = [];
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const wave = Math.abs(Math.sin((i + 1) * (seed % 5 + 1) * 0.65));
    const v = isEngine
      ? +((wave * (i > 1 && i < 8 ? 0.9 : 0.15)).toFixed(2))
      : Math.round(wave * (range === 1 ? 45 : 280));
    vals.push(v);
    sum += v;
  }
  return { vals, sum: isEngine ? +(sum.toFixed(1)) : +(sum.toFixed(1)) };
}

function buildColoredSvgChart(units, range, isEngine) {
  const W = 320, H = 155, padL = 28, padR = 10, padT = 12, padB = 26;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const maxVal = isEngine ? 1.0 : (range === 1 ? 60 : 350);
  const xLabels = range === 1
    ? ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00']
    : (range === 7 ? ['روز ۱','روز ۲','روز ۳','روز ۴','روز ۵','روز ۶','امروز'] : ['21/10','24/10','27/10','30/10','02/11','05/11','08/11','12/11','16/11','20/11']);

  let grid = '';
  for (let g = 0; g <= 5; g++) {
    const y = padT + (chartH * g) / 5;
    const lbl = isEngine ? (1 - g * 0.2).toFixed(1) : Math.round(maxVal * (1 - g / 5));
    grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#eeeeee" stroke-width="1"/>`;
    grid += `<text x="2" y="${y + 3}" font-size="8.5" fill="#78909c">${lbl}</text>`;
  }

  const xStep = chartW / Math.max(1, xLabels.length - 1);
  let xAxis = xLabels.map((l, i) => `<text x="${padL + i * xStep}" y="${H - 6}" font-size="7.5" fill="#78909c" text-anchor="middle">${l}</text>`).join('');

  let curves = '';
  units.forEach(u => {
    if (stHiddenUnits[u.id]) return;
    const col = u.color || '#0284c7';
    const { vals } = getUnitStatSeries(u, range, isEngine);
    const pts = vals.map((v, i) => ({
      x: padL + (i * chartW) / Math.max(1, vals.length - 1),
      y: padT + chartH - (Math.min(v, maxVal) / maxVal) * chartH,
      v
    }));
    const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const areaD = `${lineD} L${pts[pts.length - 1].x.toFixed(1)},${padT + chartH} L${pts[0].x.toFixed(1)},${padT + chartH} Z`;
    const dots = pts.map((p, i) =>
      `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.2" fill="${col}" stroke="#fff" stroke-width="1" style="cursor:pointer;" onclick="showGreenToast('${u.name} (${xLabels[i] || ''}): ${p.v} ${isEngine ? 'ساعت' : 'km'}')"/>`
    ).join('');
    curves += `<path d="${areaD}" fill="${col}" fill-opacity="0.14"/>`;
    curves += `<path d="${lineD}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round"/>`;
    curves += dots;
  });

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:175px;display:block;direction:ltr;">${grid}${curves}${xAxis}</svg>`;
}

function openEventsExportModal() {
  showModal(`
    <h4 style="margin:0 0 10px;text-align:center;">استخراج رویدادها</h4>
    <div class="menu-row" onclick="doTrackExport('xlsx')"><b>دانلود فایل اکسل (XLSX)</b></div>
    <div class="menu-row" onclick="doTrackExport('csv')"><b>دانلود فایل CSV</b></div>
    <div class="menu-row" onclick="closeModal();showGreenToast('گزارش رویدادها به ایمیل ارسال شد')"><b>ارسال گزارش به ایمیل</b></div>
    <div class="close-bar" onclick="closeModal()">بستن</div>
  `);
}

const _prevRenderForStats = renderUserTab;
renderUserTab = function() {
  if (userTab === 'stats' && uState) {
    const body = document.getElementById('u-sheet-body');
    const units = uState.units || [];
    const gfCount = (uState.geofences || []).length;
    document.getElementById('u-sheet-title').innerText = 'آمار';

    const rangeTabs = (cur, varName) => `
      <div class="stat-range-bar">
        <div class="stat-rtab ${cur===1?'active':''}" onclick="${varName}=1;renderUserTab()">1 روز</div>
        <div class="stat-rtab ${cur===7?'active':''}" onclick="${varName}=7;renderUserTab()">7 روز</div>
        <div class="stat-rtab ${cur===30?'active':''}" onclick="${varName}=30;renderUserTab()">30 روز</div>
        <div class="stat-rtab ${cur===365?'active':''}" onclick="${varName}=365;renderUserTab()">همه</div>
        <span class="ms" style="font-size:20px;color:#455a64;cursor:pointer;padding:4px;" onclick="openShamsiCalPopup()">calendar_month</span>
      </div>`;

    const uRows = (range, isEngine) => units.map(u => {
      const { sum } = getUnitStatSeries(u, range, isEngine);
      const isOff = !!stHiddenUnits[u.id];
      const valTxt = isEngine
        ? `${Math.floor(sum)} ساعت، ${Math.round((sum % 1) * 60)} دقیقه`
        : `${sum} km`;
      return `<div class="stat-unit-row ${isOff ? 'off' : 'on'}" onclick="toggleStatUnit('${u.id}')">
        <div>
          <div style="font-size:13px;font-weight:700;color:#37474f;">
            <span class="stat-dot" style="background:${u.color || '#0284c7'};"></span>${u.name}
          </div>
          <div style="font-size:13px;font-weight:800;color:#212121;margin-top:2px;" dir="${isEngine?'rtl':'ltr'}">${valTxt}</div>
        </div>
        <div style="font-size:11px;color:#78909c;text-align:left;">از 00:00<br>${range === 1 ? 'امروز' : 'دوره انتخابی'}</div>
      </div>`;
    }).join('');

    const uPct = Math.min(100, Math.round((units.length / 30) * 100));
    const gPct = Math.min(100, Math.round((gfCount / 25) * 100));

    body.innerHTML = `
      <!-- کارت ۱: مسافت پیموده شده -->
      <div class="stat-card">
        <div class="stat-card-head" onclick="stMilOpen=!stMilOpen;renderUserTab()">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="ms" style="font-size:24px;color:#37474f;">bar_chart</span>
            <div><b style="font-size:14.5px;">مسافت پیموده شده</b><div style="font-size:11px;color:#78909c;">خلاصه مسافت پیموده شده</div></div>
          </div>
          <span class="ms">${stMilOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>
        </div>
        ${stMilOpen ? `
          ${rangeTabs(stMilRange, 'stMilRange')}
          <div style="padding:10px 10px 4px;">
            ${!stHideTipM ? `<div class="cp-info-banner" style="margin-bottom:8px;"><span style="flex:1;">برای نمایش جزئیات اطلاعات روی نقاط نمودار کلیک کنید</span><span style="font-size:18px;cursor:pointer;" onclick="stHideTipM=true;renderUserTab()">×</span></div>` : ''}
            ${buildColoredSvgChart(units, stMilRange, false)}
          </div>
          ${uRows(stMilRange, false)}
        ` : ''}
      </div>

      <!-- کارت ۲: ساعات موتور -->
      <div class="stat-card">
        <div class="stat-card-head" onclick="stEngOpen=!stEngOpen;renderUserTab()">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="ms" style="font-size:24px;color:#37474f;">build</span>
            <div><b style="font-size:14.5px;">ساعات موتور</b><div style="font-size:11px;color:#78909c;">خلاصه ساعات موتور</div></div>
          </div>
          <span class="ms">${stEngOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>
        </div>
        ${stEngOpen ? `
          ${rangeTabs(stEngRange, 'stEngRange')}
          <div style="padding:10px 10px 4px;">
            ${!stHideTipE ? `<div class="cp-info-banner" style="margin-bottom:8px;"><span style="flex:1;">برای نمایش جزئیات اطلاعات روی نقاط نمودار کلیک کنید</span><span style="font-size:18px;cursor:pointer;" onclick="stHideTipE=true;renderUserTab()">×</span></div>` : ''}
            ${buildColoredSvgChart(units, stEngRange, true)}
          </div>
          ${uRows(stEngRange, true)}
        ` : ''}
      </div>

      <!-- کارت استخراج رویدادها -->
      <div class="stat-link-card" onclick="openEventsExportModal()">
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="ms" style="font-size:24px;color:#37474f;">cloud_download</span>
          <div><b style="font-size:14px;">استخراج رویدادها</b><div style="font-size:11px;color:#78909c;">دانلود یا ارسال به ایمیل</div></div>
        </div>
        <span style="font-size:18px;color:#78909c;">&lt;</span>
      </div>

      <!-- کارت نمودارها -->
      <div class="stat-link-card" onclick="openSpeedChartModal()">
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="ms" style="font-size:24px;color:#37474f;">show_chart</span>
          <div><b style="font-size:14px;">نمودارها</b><div style="font-size:11px;color:#78909c;">توسط داده‌های دستگاه</div></div>
        </div>
        <span style="font-size:18px;color:#78909c;">&lt;</span>
      </div>

      <!-- کارت ظرفیت یگان‌ها و حصارهای جغرافیایی -->
      <div class="stat-card" style="padding:14px;">
        <div style="font-size:12.5px;font-weight:700;color:#37474f;">یگان‌ها</div>
        <div class="stat-quota-bar">
          <div class="stat-quota-fill" style="width:${Math.max(12, uPct)}%;"></div>
          <div class="stat-quota-lbl">${units.length} / 30</div>
        </div>
        <div style="font-size:12.5px;font-weight:700;color:#37474f;">حصارهای جغرافیایی</div>
        <div class="stat-quota-bar" style="margin-bottom:2px;">
          <div class="stat-quota-fill" style="width:${Math.max(10, gPct)}%;"></div>
          <div class="stat-quota-lbl">${gfCount} / 25</div>
        </div>
      </div>
    `;
    return;
  }
  _prevRenderForStats();
};
