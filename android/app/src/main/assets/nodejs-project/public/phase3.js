let alertSubTab = 'list';

async function addGeofence() {
  const name = prompt('نام حصار جغرافیایی:', 'محدوده جدید');
  if (!name) return;
  const radius = prompt('شعاع دایره (متر):', '450');
  await fetch(`/api/user/${session.user.id}/geofences`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, radius }) }); loadUserState(); }  async function toggleAllGfs() { await fetch(`/api/user/${session.user.id}/geofences/toggle`, { method: 'POST' });
  loadUserState();
}

function openAddPartModal(uid) {
  showModal(`<h4 style="margin:0 0 10px;text-align:center;">افزودن قطعه مصرفی جدید</h4>
    <input id="p3-name" class="inp" placeholder="نام قطعه (مثلاً: روغن گیربکس، لنت، دیسک و صفحه)">
    <input id="p3-int" type="number" class="inp" value="5000" placeholder="دوره تعویض (کیلومتر)" dir="ltr">
    <input id="p3-used" type="number" class="inp" value="0" placeholder="کارکرد فعلی قطعه (کیلومتر)" dir="ltr">
    <button class="btn btn-green btn-full" onclick="submitNewPart('${uid}')">ثبت قطعه در لیست</button>
    <div class="close-bar" onclick="closeModal()">بستن</div>`);
}

async function submitNewPart(uid) {
  const name = document.getElementById('p3-name').value.trim();
  const intervalKm = document.getElementById('p3-int').value;
  const usedKm = document.getElementById('p3-used').value;
  if (!name) return alert('نام قطعه را وارد کنید.');
  await fetch(`/api/units/${uid}/parts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, intervalKm, usedKm })
  });
  closeModal();
  loadUserState();
}

async function resetPartItem(uid, pid, name) {
  if (!confirm(`آیا تعویض «${name}» ثبت و کیلومتر آن صفر شود؟`)) return; await fetch(`/api/units/${uid}/parts/${pid}/reset`, { method: 'POST' }); loadUserState(); }  async function deletePartItem(uid, pid, name) { if (!confirm(`آیا قطعه «${name}» از لیست حذف شود؟`)) return;
  await fetch(`/api/units/${uid}/parts/${pid}`, { method: 'DELETE' });
  loadUserState();
}

const _p2RenderUserTab = renderUserTab;
renderUserTab = function() {
  if (!uState) return;
  const body = document.getElementById('u-sheet-body');
  const actU = uState.units.find(x => x.id === activeUnitId) || uState.units[0];

  if (userTab === 'geofences') {
    body.innerHTML = `<div style="display:flex;gap:8px;margin-bottom:10px;">
        <button class="btn btn-green btn-sm" style="flex:1;" onclick="addGeofence()"><span class="ms" style="font-size:16px;">add</span> حصار جغرافیایی جدید</button>
        <button class="btn btn-gray btn-sm" onclick="toggleAllGfs()"><span class="ms" style="font-size:16px;">visibility</span> نمایش/مخفی</button>
      </div>` +
      (uState.geofences.map(g => `<div class="fg-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <b>${g.name}</b>
          <span class="tag ${g.visible?'tag-green':'tag-red'}">${g.visible?'نمایش روی نقشه':'مخفی'}</span>
        </div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:6px;">مساحت: ${g.area} • محیط: ${g.perimeter}</div>
      </div>`).join('') || `<div class="fg-card" style="text-align:center;color:var(--muted);">هیچ حصاری ثبت نشده است.</div>`);
    return;
  }

  if (userTab === 'stats' && actU) {
    const pts = actU.dailyKm || [18, 42, 29, 64, 31, 55, 24], mx = Math.max(...pts, 10);
    const poly = pts.map((v, i) => `${Math.round((i/(pts.length-1))*280)},${95 - Math.round((v/mx)*80)}`).join(' ');
    body.innerHTML = `<div class="fg-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <b>نمودار مسافت پیموده شده (${actU.name})</b>
          <button class="btn btn-sm" onclick="openExportSheet()">خروجی .xlsx</button>
        </div>
        <svg viewBox="0 0 280 105" style="width:100%;height:110px;">
          <polygon points="0,95 ${poly} 280,95" fill="rgba(255,152,0,0.2)"/>
          <polyline points="${poly}" fill="none" stroke="#ff9800" stroke-width="2.5"/>
        </svg>
        ${uState.units.map(u => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid var(--border);font-size:12px;"><span><span style="color:${u.color};">●</span> ${u.name}</span><b>${u.mileage} km</b></div>`).join('')}
      </div>
      <div class="fg-card">
        <div style="display:flex;justify-content:space-between;font-size:12px;"><span>یگان‌ها</span><b>${uState.units.length} / ${uState.plan.maxUnits}</b></div>
        <div style="height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;margin:6px 0 12px;"><div style="width:${Math.min(100,(uState.units.length/uState.plan.maxUnits)*100)}%;height:100%;background:var(--primary);"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;"><span>حصارهای جغرافیایی</span><b>${uState.geofences.length} / ${uState.plan.maxGeofences}</b></div>
        <div style="height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;margin-top:6px;"><div style="width:${Math.min(100,(uState.geofences.length/uState.plan.maxGeofences)*100)}%;height:100%;background:#2e7d32;"></div></div>
      </div>`;
    return;
  }

  if (userTab === 'maint' && actU) {
    const parts = actU.customParts || [];
    const due = parts.filter(p => p.usedKm >= p.intervalKm * 0.85).length;
    body.innerHTML = `<div class="fg-card" style="border-right:4px solid var(--primary);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <b>وضعیت کارکرد ماهانه (${actU.name})</b>
          <span class="tag ${due>0?'tag-red':'tag-green'}">${due>0?due+' قطعه نزدیک تعویض':'نرمال'}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;background:var(--bg);padding:8px;border-radius:10px;text-align:center;">
          <div><small style="color:var(--muted);">کارکرد ماه</small><div style="font-weight:900;color:var(--primary);">${actU.monthlyKm||0} km</div></div>
          <div><small style="color:var(--muted);">ساعت ماه</small><div style="font-weight:900;color:#2e7d32;">${actU.monthlyHours||0} h</div></div>
          <div><small style="color:var(--muted);">کارکرد کل</small><div style="font-weight:900;">${actU.mileage} km</div></div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 2px;">
        <b style="font-size:13px;">تعویض روغن و قطعات مصرفی (${parts.length})</b>
        <button class="btn btn-green btn-sm" onclick="openAddPartModal('${actU.id}')"><span class="ms" style="font-size:15px;">add</span> افزودن قطعه</button>
      </div>
      ${parts.map(p => {
        const pct = Math.min(100, Math.round((p.usedKm / p.intervalKm) * 100));
        const rem = Math.max(0, Math.round(p.intervalKm - p.usedKm));
        const col = pct >= 90 ? '#d32f2f' : (pct >= 75 ? '#ff9800' : '#2e7d32');
        return `<div class="fg-card">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div><b>${p.name}</b><div style="font-size:11px;color:var(--muted);">آخرین تعویض: ${p.lastChangedShamsi} • دوره: ${p.intervalKm.toLocaleString()} km</div></div>
            <div style="display:flex;gap:5px;">
              <button class="btn btn-sm" onclick="resetPartItem('${actU.id}','${p.id}','${p.name}')">تعویض شد</button>
              <button class="btn btn-red btn-sm" onclick="deletePartItem('${actU.id}','${p.id}','${p.name}')"><span class="ms" style="font-size:15px;">delete</span></button>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-top:6px;">
            <span>کارکرد: ${Math.round(p.usedKm).toLocaleString()} km</span>
            <b style="color:${col};">${rem===0?'زمان تعویض فرا رسیده!':`باقی‌مانده: ${rem.toLocaleString()} km`}</b>
          </div>
          <div style="height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden;margin-top:5px;"><div style="width:${pct}%;height:100%;background:${col};"></div></div>
        </div>`;
      }).join('')}`;
    return;
  }

  if (userTab === 'alerts') {
    body.innerHTML = `<div style="display:flex;gap:8px;margin-bottom:8px;">
        <span class="f-pill ${alertSubTab==='list'?'active':''}" onclick="alertSubTab='list';renderUserTab()">رویدادها</span>
        <span class="f-pill ${alertSubTab==='types'?'active':''}" onclick="alertSubTab='types';renderUserTab()">تنظیمات هشدار</span>
      </div>` +
      (alertSubTab === 'list' ? shamsiBarHtml() + uState.alerts.map(a => `<div class="fg-card" style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:12.5px;">${a.text}</span><small style="color:var(--muted);direction:ltr;">${a.time}</small></div>`).join('') :
      `<div class="fg-card"><b>هشدارهای هوشمند</b><p style="font-size:12px;color:var(--muted);">ورود و خروج از حصار، سرعت غیرمجاز، قطع برق، افت باتری و شروع/پایان سفر فعال هستند.</p></div>`);
    return;
  }

  if (userTab === 'settings' && actU) {
    body.innerHTML = `<div class="fg-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <b>تنظیمات ${actU.name}</b>
          <button class="btn btn-sm" onclick="openIconPicker()">آیکون و رنگ</button>
        </div>
        <div style="font-size:12px;color:var(--muted);margin:10px 0;line-height:1.8;">
          مدل دستگاه: <b>${actU.model}</b><br>شناسه IMEI: <b dir="ltr">${actU.imei}</b><br>پورت سرور TCP: <b>5023</b>
        </div>
        <button class="btn btn-gray btn-sm btn-full" onclick="openUserTab('appearance')">تنظیمات ظاهر و سرعت پخش</button>
      </div>`;
    return;
  }

  if (userTab === 'appearance') {
    body.innerHTML = `<div class="fg-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><span>نمایش نام خودروها روی نقشه</span><label class="ios-switch"><input type="checkbox" ${showLabels?'checked':''} onchange="toggleLabels()"><span class="ios-slider"></span></label></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><span>حالت شب (Dark Mode)</span><label class="ios-switch"><input type="checkbox" ${document.body.classList.contains('dark-mode')?'checked':''} onchange="document.body.classList.toggle('dark-mode')"><span class="ios-slider"></span></label></div>
      <div style="font-size:12px;font-weight:700;margin-bottom:6px;">راهنمای رنگ سرعت روی نقشه (km/h):</div>
      <div style="display:flex;height:12px;border-radius:6px;overflow:hidden;"><div style="flex:1;background:#2e7d32;"></div><div style="flex:1;background:#fbc02d;"></div><div style="flex:1;background:#f57c00;"></div><div style="flex:1;background:#d32f2f;"></div></div>
      <div style="display:flex;justify-content:space-around;font-size:11px;margin-top:4px;color:var(--muted);"><span>40</span><span>60</span><span>80</span><span>100+</span></div>
    </div>`;
    return;
  }

  if (userTab === 'provider') {
    body.innerHTML = `<div class="fg-card"><b>ارائه‌دهنده خدمات</b><p style="font-size:12.5px;line-height:1.8;">پلتفرم: <b>bmth</b><br>پشتیبانی: <b>${uState.company.email}</b><br>تعرفه اشتراک پس از تست ۱۰ روزه: <b>${uState.subscriptionPrice}</b></p></div>`;
    return;
  }

  _p2RenderUserTab();
};
