let udUnitId = null;
let udMiniMaps = [];
let udSlideState = {};

function getUnitTripsList(u) {
  const baseLat = u.lat || 26.225;
  const baseLng = u.lng || 60.214;
  const today = new Date();
  const makeShamsi = (daysAgo, hhmm) => {
    const d = new Date(today.getTime() - daysAgo * 86400000);
    const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `${hhmm} ، ${j.jy}/${String(j.jm).padStart(2,'0')}/${String(j.jd).padStart(2,'0')}`;
  };

  return [
    {
      id: 't1', timeLabel: makeShamsi(0, '21:34'),
      startAddr: u.address || 'نیک‌شهر، بلوار امام خمینی',
      endAddr: 'جاده نیک‌شهر - قصرقند، محدوده زهک بالا',
      distKm: 4.8, dur: '14 دقیقه', maxSpd: 78, avgSpd: 44,
      pts: [
        { lat: baseLat - 0.008, lng: baseLng - 0.009, speed: 32, time: '21:20:10' },
        { lat: baseLat - 0.004, lng: baseLng - 0.006, speed: 58, time: '21:25:30' },
        { lat: baseLat - 0.001, lng: baseLng - 0.002, speed: 78, time: '21:30:05' },
        { lat: baseLat, lng: baseLng, speed: 0, time: '21:34:00' }
      ]
    },
    {
      id: 't2', timeLabel: makeShamsi(1, '17:44'),
      startAddr: 'نیک‌شهر، خیابان معلم، میدان اصلی',
      endAddr: 'دهستان مهبان، مسیر زیرک‌آباد',
      distKm: 6.2, dur: '19 دقیقه', maxSpd: 84, avgSpd: 49,
      pts: [
        { lat: baseLat + 0.005, lng: baseLng - 0.007, speed: 28, time: '17:25:00' },
        { lat: baseLat + 0.002, lng: baseLng - 0.003, speed: 64, time: '17:32:15' },
        { lat: baseLat - 0.002, lng: baseLng + 0.004, speed: 84, time: '17:39:40' },
        { lat: baseLat - 0.003, lng: baseLng + 0.008, speed: 0, time: '17:44:00' }
      ]
    },
    {
      id: 't3', timeLabel: makeShamsi(1, '17:09'),
      startAddr: 'کهورکان، جاده اصلی نیک‌شهر',
      endAddr: 'نیک‌شهر، بلوار امام خمینی',
      distKm: 3.4, dur: '11 دقیقه', maxSpd: 62, avgSpd: 38,
      pts: [
        { lat: baseLat - 0.006, lng: baseLng + 0.005, speed: 35, time: '16:58:00' },
        { lat: baseLat - 0.003, lng: baseLng + 0.002, speed: 62, time: '17:03:20' },
        { lat: baseLat, lng: baseLng, speed: 0, time: '17:09:00' }
      ]
    }
  ];
}

function openUnitDetails(uid) {
  udUnitId = uid;
  activeUnitId = uid;
  userTab = 'unit_details';
  if (uSheetMode === 'collapsed') toggleUSheet();
  renderUserTab();
}

function closeUnitDetails() {
  udMiniMaps.forEach(m => { try { m.remove(); } catch(e){} });
  udMiniMaps = [];
  openUserTab('units');
}

function stepTripSlide(tid, dir) {
  const cur = udSlideState[tid] || 0;
  udSlideState[tid] = (cur + dir + 3) % 3;
  renderUserTab();
}

function playSpecificTrip(tripIdx, autoPlay) {
  const u = uState && uState.units.find(x => x.id === udUnitId);
  if (!u) return;
  const trip = getUnitTripsList(u)[tripIdx];
  if (!trip) return;
  pbPts = trip.pts;
  pbIdx = 0;
  u.history = trip.pts;
  openUserTab('history');
  setTimeout(() => {
    fitRoute();
    if (autoPlay && !pbActive) togglePlayback();
  }, 150);
}

const _prevRenderForUD = renderUserTab;
renderUserTab = function() {
  if (userTab === 'unit_details' && uState) {
    udMiniMaps.forEach(m => { try { m.remove(); } catch(e){} });
    udMiniMaps = [];

    const u = uState.units.find(x => x.id === udUnitId) || uState.units[0];
    if (!u) return;

    // تنظیم هدر اختصاصی صفحه جزئیات خودرو
    document.getElementById('u-sheet-title').innerHTML = `
      <div style="text-align:center;line-height:1.25;">
        <div style="font-size:14.5px;font-weight:700;">${u.name}</div>
        <div style="font-size:11px;color:#757575;direction:ltr;"><span class="dot-g"></span> ${u.lastTime}</div>
      </div>`;
    const leftBtn = document.getElementById('u-left-btn');
    if (leftBtn) {
      leftBtn.innerHTML = 'chevron_left';
      leftBtn.onclick = closeUnitDetails;
    }

    const trips = getUnitTripsList(u);
    const body = document.getElementById('u-sheet-body');
    body.innerHTML = `
      <!-- کارت وضعیت بالای صفحه جزئیات -->
      <div class="unit-card" style="margin-bottom:12px;">
        <div class="fg-grid-8">
          <span class="ms" title="فرمان" onclick="openCmdModal('${u.id}')">terminal</span>
          <span class="ms" title="سفرها" onclick="openUserTab('trips')">route</span>
          <span class="ms" title="تاریخچه" onclick="openUserTab('history')">history</span>
          <span class="ms" title="مسیریابی" onclick="openNavigationModal('${u.id}')">directions</span>
          <span class="ms" title="فوکوس" onclick="focusUnit('${u.id}')">my_location</span>
          <span class="ms" title="پیام خام" onclick="openUnitInfoSheet('${u.id}')">info</span>
          <span class="ms" title="قفل" onclick="quickCmd('${u.id}','STOP')">lock</span>
          <span class="ms" title="باز" onclick="quickCmd('${u.id}','START')">lock_open</span>
        </div>
        <div class="fg-addr-box">
          <div class="p-circle">P</div>
          <div class="fg-addr-txt"><div>${u.address}</div><div class="fg-park-time">1 روز 08:00</div></div>
        </div>
        <div class="ud-status-strip">
          <div class="ud-st-item"><span class="ms" style="font-size:17px;">power_settings_new</span> ${u.ignition?'روشن':'خاموش'}</div>
          <div class="ud-st-item"><span>${u.speed} km/h</span></div>
          <div class="ud-st-item"><span>${u.directionText || 'شمال 0°'}</span></div>
          <div class="ud-st-item"><span>🔋 ${u.battery}%</span></div>
        </div>
        <div class="fg-stats-exp">
          <div class="fg-stat-line"><span>سرعت:</span><span class="stat-pill">${u.speed} km/h</span></div>
          <div class="fg-stat-line"><span>سطح شارژ باتری:</span><span class="stat-pill">${u.battery} %</span></div>
        </div>
      </div>

      <!-- لیست سفرهای مجزا از جدیدترین به قدیمی‌ترین -->
      ${trips.map((tr, idx) => {
        const sl = udSlideState[tr.id] || 0;
        let stageHtml = '';
        if (sl === 0) {
          stageHtml = `<div id="mini-map-${tr.id}" class="trip-mini-map"></div>`;
        } else if (sl === 1) {
          stageHtml = `<div style="padding:14px;direction:rtl;font-size:12.5px;line-height:2;">
            <div>مسافت طی‌شده: <b>${tr.distKm} کیلومتر</b></div>
            <div>مدت زمان سفر: <b>${tr.dur}</b></div>
            <div>حداکثر سرعت: <b style="color:#d32f2f;">${tr.maxSpd} km/h</b> • میانگین: <b>${tr.avgSpd} km/h</b></div>
          </div>`;
        } else {
          stageHtml = `<div style="padding:12px;direction:rtl;font-size:12px;line-height:1.9;">
            <div><b style="color:#2e7d32;">مبدأ (${tr.pts[0].time}):</b> ${tr.startAddr}</div>
            <div><b style="color:#1976d2;">مقصد (${tr.pts[tr.pts.length-1].time}):</b> ${tr.endAddr}</div>
          </div>`;
        }

        return `<div class="trip-mini-card">
          <div class="trip-mini-head">
            <div class="trip-ico-circle"><span class="ms" style="font-size:18px;">route</span></div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:13.5px;color:#212121;">${tr.timeLabel}</div>
              <div style="font-size:11.5px;color:#616161;direction:rtl;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${tr.endAddr}</div>
            </div>
          </div>
          <div class="trip-mini-body">
            <div class="trip-mini-stage">${stageHtml}</div>
            <div class="trip-side-tools">
              <span class="ms" title="پخش روی نقشه" onclick="playSpecificTrip(${idx}, true)">play_arrow</span>
              <span class="ms" title="مشاهده در تاریخچه" onclick="playSpecificTrip(${idx}, false)">history</span>
              <span class="ms" title="جزئیات سرعت و مسافت" onclick="udSlideState['${tr.id}']=1;renderUserTab()">timeline_s</span>
              <span class="ms" title="مبدأ و مقصد سفر" onclick="udSlideState['${tr.id}']=2;renderUserTab()">location_on</span>
            </div>
          </div>
          <div class="trip-dots-bar">
            <span style="cursor:pointer;padding:0 6px;" onclick="stepTripSlide('${tr.id}', -1)">&lt;</span>
            <span class="t-dot ${sl===0?'active':''}" onclick="udSlideState['${tr.id}']=0;renderUserTab()"></span>
            <span class="t-dot ${sl===1?'active':''}" onclick="udSlideState['${tr.id}']=1;renderUserTab()"></span>
            <span class="t-dot ${sl===2?'active':''}" onclick="udSlideState['${tr.id}']=2;renderUserTab()"></span>
            <span style="cursor:pointer;padding:0 6px;" onclick="stepTripSlide('${tr.id}', 1)">&gt;</span>
          </div>
        </div>`;
      }).join('')}
    `;

    // راه‌اندازی نقشه‌های کوچک واقعی Leaflet داخل هر کارت سفر
    setTimeout(() => {
      trips.forEach(tr => {
        const el = document.getElementById('mini-map-' + tr.id);
        if (!el) return;
        const mm = L.map(el, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(mm);
        const latlngs = tr.pts.map(p => [p.lat, p.lng]);
        const line = L.polyline(latlngs, { color: '#1565c0', weight: 4 }).addTo(mm);
        mm.fitBounds(line.getBounds(), { padding: [14, 14] });
        udMiniMaps.push(mm);
      });
    }, 60);
    return;
  }

  // بازگرداندن عملکرد دکمه سمت چپ هدر در سایر تب‌ها
  const leftBtn = document.getElementById('u-left-btn');
  if (leftBtn) leftBtn.onclick = handleSheetLeftBtn;
  _prevRenderForUD();
};
