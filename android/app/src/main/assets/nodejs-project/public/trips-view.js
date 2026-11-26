let calViewJ = null;

function getTripsForSelectedDate(u, isoDate) {
  const todayIso = new Date().toISOString().split('T')[0];
  if (isoDate > todayIso) return { future: true, totalKm: 0, items: [] };

  let seed = 0;
  for (let i = 0; i < isoDate.length; i++) seed += isoDate.charCodeAt(i);
  const d1 = +((seed % 7) + 3.4).toFixed(1);
  const d2 = +((seed % 5) + 2.1).toFixed(1);
  const totalKm = +(d1 + d2).toFixed(1);

  const [y, m, d] = isoDate.split('-').map(Number);
  const j = gregorianToJalali(y, m, d);
  const jStr = `${j.jy}/${String(j.jm).padStart(2,'0')}/${String(j.jd).padStart(2,'0')}`;

  return {
    future: false,
    totalKm,
    items: [
      {
        type: 'park',
        time: `21:52:58 ، ${jStr}`,
        addr: u.address || 'استان سیستان و بلوچستان، شهرستان نیک‌شهر، ایران',
        dur: '1 روز 08:10:13',
        endPark: '-'
      },
      {
        type: 'trip',
        time: `17:44 تا 18:05 ، ${jStr}`,
        addr: 'نیک‌شهر، بلوار امام خمینی ← جاده قصرقند',
        km: d1, pts: [{lat:(u.lat||26.225)-0.008,lng:(u.lng||60.214)-0.009,speed:35,time:"17:44:00"},{lat:(u.lat||26.225)-0.004,lng:(u.lng||60.214)-0.005,speed:78,time:"17:54:00"},{lat:(u.lat||26.225),lng:(u.lng||60.214),speed:0,time:"18:05:00"}],
        dur: '21 دقیقه',
        maxSpd: 78
      },
      {
        type: 'trip',
        time: `09:15 تا 09:29 ، ${jStr}`,
        addr: 'کهورکان ← میدان اصلی نیک‌شهر',
        km: d2, pts: [{lat:(u.lat||26.225)+0.006,lng:(u.lng||60.214)-0.006,speed:30,time:"09:15:00"},{lat:(u.lat||26.225)+0.003,lng:(u.lng||60.214)-0.002,speed:64,time:"09:22:00"},{lat:(u.lat||26.225),lng:(u.lng||60.214),speed:0,time:"09:29:00"}],
        dur: '14 دقیقه',
        maxSpd: 64
      }
    ]
  };
}

function openShamsiCalPopup() {
  const [y, m, d] = selectedDate.split('-').map(Number);
  calViewJ = gregorianToJalali(y, m, d);
  renderShamsiCalPopup();
}

function renderShamsiCalPopup() {
  const bg = document.getElementById('modal-bg');
  const box = document.getElementById('modal-content');
  bg.style.alignItems = 'center';
  bg.style.justifyContent = 'center';
  bg.style.padding = '18px';
  box.style.borderRadius = '14px';
  box.style.maxWidth = '340px';
  box.style.padding = '0';

  const daysInMonth = calViewJ.jm <= 6 ? 31 : (calViewJ.jm <= 11 ? 30 : 29);
  const wDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
  let daysHtml = wDays.map(w => `<div style="font-size:11px;color:#9e9e9e;padding-bottom:6px;">${w}</div>`).join('');
  for (let i = 1; i <= daysInMonth; i++) {
    daysHtml += `<div class="cal-day ${i===calViewJ.jd?'active':''}" onclick="calViewJ.jd=${i};renderShamsiCalPopup()">${i}</div>`;
  }

  box.innerHTML = `
    <div class="cal-popup-head">
      <div style="font-size:13px;opacity:0.85;">${calViewJ.jy}</div>
      <div style="font-size:22px;font-weight:700;margin-top:2px;">${calViewJ.jd} ${PERSIAN_MONTHS[calViewJ.jm - 1]}</div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px 4px;font-size:13px;font-weight:700;direction:ltr;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="cursor:pointer;padding:2px 6px;" onclick="stepCalMonth(-1)">&lt;</span>
        <span>${PERSIAN_MONTHS[calViewJ.jm - 1]}</span>
        <span style="cursor:pointer;padding:2px 6px;" onclick="stepCalMonth(1)">&gt;</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="cursor:pointer;padding:2px 6px;" onclick="calViewJ.jy--;renderShamsiCalPopup()">&lt;</span>
        <span>${calViewJ.jy}</span>
        <span style="cursor:pointer;padding:2px 6px;" onclick="calViewJ.jy++;renderShamsiCalPopup()">&gt;</span>
      </div>
    </div>
    <div class="cal-grid-7" style="direction:rtl;">${daysHtml}</div>
    <div style="display:flex;justify-content:flex-end;gap:18px;padding:10px 18px 14px;font-size:13px;font-weight:700;color:#424242;">
      <span style="cursor:pointer;" onclick="closeCalPopup()">لغو</span>
      <span style="cursor:pointer;color:var(--primary);" onclick="confirmCalPopup()">تأیید</span>
    </div>`;
  bg.classList.add('open');
}

function stepCalMonth(dir) {
  calViewJ.jm += dir;
  if (calViewJ.jm < 1) { calViewJ.jm = 12; calViewJ.jy--; }
  if (calViewJ.jm > 12) { calViewJ.jm = 1; calViewJ.jy++; }
  renderShamsiCalPopup();
}

function closeCalPopup() {
  const bg = document.getElementById('modal-bg');
  const box = document.getElementById('modal-content');
  bg.style.alignItems = 'flex-end';
  bg.style.padding = '0';
  box.style.borderRadius = '18px 18px 0 0';
  box.style.maxWidth = '100%';
  box.style.padding = '14px 18px 18px';
  closeModal();
}

function confirmCalPopup() {
  const iso = jalaliToGregorian(calViewJ.jy, calViewJ.jm, calViewJ.jd);
  closeCalPopup();
  setDate(iso);
}

const _prevRenderForTrips = renderUserTab;
renderUserTab = function() {
  if (userTab === 'trips' && uState) {
    const body = document.getElementById('u-sheet-body');
    const actU = uState.units.find(x => x.id === activeUnitId) || uState.units[0];
    if (!actU) return;

    // ساخت ۵ تب تاریخ بالای صفحه (امروز، دیروز، ۳ روز قبل‌تر) + آیکون تقویم
    const tabs = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(Date.now() - i * 86400000);
      const iso = d.toISOString().split('T')[0];
      const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
      const lbl = i === 0 ? 'امروز' : (i === 1 ? 'دیروز' : `${PERSIAN_MONTHS[j.jm - 1]} ${j.jd}`);
      tabs.push({ iso, lbl });
    }

    const data = getTripsForSelectedDate(actU, selectedDate);
    const tripsCount = data.items.filter(x => x.type === 'trip').length;

    body.innerHTML = `
      <div class="tr-date-strip">
        ${tabs.map(t => `<div class="tr-dtab ${selectedDate===t.iso?'active':''}" onclick="setDate('${t.iso}')">${t.lbl}</div>`).join('')}
        <div class="tr-cal-btn" onclick="openShamsiCalPopup()" title="انتخاب تاریخ از تقویم">
          <span class="ms" style="font-size:21px;">calendar_month</span>
        </div>
      </div>

      <div class="tr-timeline-wrap">
        <div class="tr-tl-pin"></div>
        <div class="tr-timeline-bar">
          <div style="flex:6;background:#0d47a1;"></div>
          ${tripsCount ? `<div style="flex:1.5;background:#2e7d32;"></div><div style="flex:3;background:#0d47a1;"></div><div style="flex:1.2;background:#2e7d32;"></div>` : ''}
        </div>
      </div>

      <!-- نمایش کل کیلومتر طی‌شده در روز انتخابی -->
      <div class="tr-daily-km-box">
        <div>
          <div style="font-size:11.5px;color:#1565c0;font-weight:700;">کل کیلومتر طی‌شده در ${formatShamsi(selectedDate)}</div>
          <div style="font-size:11px;color:#546e7a;margin-top:2px;">تعداد سفرهای ثبت‌شده: ${tripsCount} سفر</div>
        </div>
        <div style="font-size:18px;font-weight:900;color:#0d47a1;direction:ltr;">${data.totalKm} km</div>
      </div>

      ${data.future ? `
        <div class="tr-park-card" style="text-align:center;color:#757575;padding:24px;">
          هنوز سفری در این تاریخ آینده ثبت نشده است.
        </div>
      ` : data.items.map(it => it.type === 'park' ? `
        <div class="tr-park-card">
          <div style="display:flex;gap:12px;align-items:flex-start;">
            <div class="tr-p-badge">P</div>
            <div style="flex:1;direction:rtl;text-align:right;">
              <div style="font-weight:700;font-size:13px;color:#212121;direction:ltr;text-align:left;">${it.time}</div>
              <div style="font-size:12px;color:#424242;margin:6px 0;display:flex;align-items:center;gap:4px;">
                <span class="ms" style="font-size:16px;color:#616161;">location_on</span>
                <span>${it.addr}</span>
              </div>
              <div style="font-size:12px;color:#616161;">مدت زمان: <b>${it.dur}</b></div>
              <div style="font-size:11.5px;color:#9e9e9e;margin-top:2px;">انتهای پارک: ${it.endPark}</div>
              <div style="display:flex;gap:16px;margin-top:10px;color:#455a64;justify-content:flex-end;">
                <span class="ms" style="font-size:20px;cursor:pointer;" onclick="openNavigationModal('${actU.id}')">directions</span>
                <span class="ms" style="font-size:20px;cursor:pointer;" onclick="alert('موقعیت پارک کپی شد')">share</span>
              </div>
            </div>
          </div>
        </div>
      ` : `
        <div class="tr-park-card">
          <div style="display:flex;gap:12px;align-items:flex-start;">
            <div class="tr-t-badge"><span class="ms" style="font-size:18px;">route</span></div>
            <div style="flex:1;direction:rtl;text-align:right;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:700;font-size:12.5px;color:#2e7d32;">مسافت سفر: ${it.km} km</span>
                <span style="font-size:11.5px;color:#616161;direction:ltr;">${it.time}</span>
              </div>
              <div style="font-size:12px;color:#424242;margin:6px 0;">${it.addr}</div>
              <div style="font-size:11.5px;color:#616161;">مدت: <b>${it.dur}</b> • حداکثر سرعت: <b>${it.maxSpd} km/h</b></div>
              <div style="display:flex;gap:16px;margin-top:10px;color:#455a64;justify-content:flex-end;">
                <span class="ms" style="font-size:20px;cursor:pointer;color:var(--primary);" onclick="playTripByIndex(${data.items.indexOf(it)})">play_arrow</span>
                <span class="ms" style="font-size:20px;cursor:pointer;" onclick="openNavigationModal('${actU.id}')">directions</span>
                <span class="ms" style="font-size:20px;cursor:pointer;" onclick="alert('لینک سفر کپی شد')">share</span>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    `;
    return;
  }
  _prevRenderForTrips();
};

function playTripByIndex(idx) {
  const actU = uState && (uState.units.find(x => x.id === activeUnitId) || uState.units[0]);
  if (!actU) return;
  const item = getTripsForSelectedDate(actU, selectedDate).items[idx];
  if (item && item.pts) playCustomTripPts(item.pts);
}
