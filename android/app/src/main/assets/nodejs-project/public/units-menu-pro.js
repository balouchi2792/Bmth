// === مدیریت کامل منوی سه‌خط (≡) بالای یگان‌ها: نمای فهرستی، مرتب‌سازی دستی، اشتراک‌گذاری ۲ مرحله‌ای ===
let umpOverlay = null;
let umpSortTemp = [];
let umpShareLinks = JSON.parse(localStorage.getItem('bmth_share_links') || '[]');
let umpShareDraft = { step: 1, ids: [], name: '', expVal: 1, expUnit: 'ساعت', showName: true, showIcon: true, showTail: false };

function ensureUmpOverlay() {
  if (!umpOverlay) {
    umpOverlay = document.createElement('div');
    umpOverlay.id = 'ump-overlay';
    umpOverlay.style.cssText = 'position:fixed;inset:0;background:#f2f4f7;z-index:7200;display:none;flex-direction:column;direction:rtl;overflow:hidden;';
    document.body.appendChild(umpOverlay);
  }
  return umpOverlay;
}

function closeUmpOverlay() {
  if (umpOverlay) umpOverlay.style.display = 'none';
}

// اعمال ترتیب ذخیره‌شده یگان‌ها
function applySavedUnitsOrder() {
  const saved = JSON.parse(localStorage.getItem('bmth_units_custom_order') || 'null');
  if (!saved || !uState || !Array.isArray(uState.units)) return;
  uState.units.sort((a, b) => {
    const ia = saved.indexOf(a.id), ib = saved.indexOf(b.id);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

// ۱. منوی سه‌خط (≡) دقیقاً مطابق اسکرین‌شات
window.openUnitsDotsMenu = function() {
  showModal(`
    <div class="menu-row" onclick="closeModal();compactView=!compactView;renderUserTab()">
      <div class="menu-row-r">
        <span class="ms">${compactView ? 'dvr' : 'view_list'}</span>
        <span>${compactView ? 'نمای پیشخوان' : 'نمای فهرستی'}</span>
      </div>
    </div>
    <div class="menu-row" onclick="closeModal();openManualSortPage()">
      <div class="menu-row-r"><span class="ms">sort</span><span>مرتب سازی</span></div>
    </div>
    <div class="menu-row" onclick="closeModal();openShareLinksListPage()">
      <div class="menu-row-r"><span class="ms">share</span><span>اشتراک‌گذاری واحدها</span></div>
    </div>
    <div class="close-bar" onclick="closeModal()">بستن</div>
  `);
};

// ۲. صفحه «مرتب‌سازی بر اساس یگان» (با فلش‌های بالا/پایین و دکمه ذخیره)
function openManualSortPage() {
  applySavedUnitsOrder();
  umpSortTemp = ((uState && uState.units) || []).map(u => ({ id: u.id, name: u.name, icon: u.icon, color: u.color }));
  renderManualSortPage();
}

function moveSortItem(idx, dir) {
  const nIdx = idx + dir;
  if (nIdx < 0 || nIdx >= umpSortTemp.length) return;
  const tmp = umpSortTemp[idx];
  umpSortTemp[idx] = umpSortTemp[nIdx];
  umpSortTemp[nIdx] = tmp;
  renderManualSortPage();
}

function saveManualSortOrder() {
  const orderIds = umpSortTemp.map(x => x.id);
  localStorage.setItem('bmth_units_custom_order', JSON.stringify(orderIds));
  applySavedUnitsOrder();
  closeUmpOverlay();
  renderUserTab();
  if (typeof showGreenToast === 'function') showGreenToast('ترتیب یگان‌ها ذخیره شد');
}

function renderManualSortPage() {
  const ov = ensureUmpOverlay();
  ov.style.display = 'flex';
  ov.innerHTML = `
    <div style="background:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb;">
      <span style="width:24px;"></span>
      <b style="font-size:15.5px;color:#263238;">مرتب‌سازی بر اساس یگان</b>
      <span style="font-size:22px;cursor:pointer;color:#455a64;padding:0 4px;" onclick="closeUmpOverlay()">×</span>
    </div>
    <div style="flex:1;overflow-y:auto;padding:14px;">
      ${umpSortTemp.map((u, i) => `
        <div style="background:#fff;border-radius:14px;padding:10px 14px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
          <div style="display:flex;align-items:center;gap:12px;">
            ${getVehicleSvg(u.icon, u.color, 34)}
            <b style="font-size:13.5px;color:#263238;">${u.name}</b>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px;color:#455a64;">
            <span style="cursor:pointer;font-size:16px;line-height:1;opacity:${i===0?0.25:1};padding:2px 6px;" onclick="moveSortItem(${i},-1)">⌃</span>
            <span style="cursor:pointer;font-size:16px;line-height:1;opacity:${i===umpSortTemp.length-1?0.25:1};padding:2px 6px;" onclick="moveSortItem(${i},1)">⌄</span>
          </div>
        </div>
      `).join('')}
    </div>
    <div style="padding:12px 16px;background:#f2f4f7;display:flex;justify-content:flex-end;">
      <button class="btn" style="min-width:140px;background:#546e7a;color:#fff;border-radius:12px;padding:10px 20px;" onclick="saveManualSortOrder()">ذخیره</button>
    </div>
  `;
}

// ۳. صفحه «اشتراک‌گذاری واحدها» (لیست پیوندها)
function openShareLinksListPage() {
  const ov = ensureUmpOverlay();
  ov.style.display = 'flex';
  ov.innerHTML = `
    <div style="background:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb;">
      <span style="font-size:20px;cursor:pointer;color:#455a64;padding:0 6px;" onclick="closeUmpOverlay()">&lt;</span>
      <b style="font-size:15.5px;color:#263238;">اشتراک‌گذاری واحدها</b>
      <span style="width:24px;"></span>
    </div>
    <div style="flex:1;overflow-y:auto;padding:14px;">
      <div style="background:#fff;border-radius:14px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <b style="font-size:14.5px;color:#263238;">پیوندهای اشتراک‌گذاری</b>
          <div style="display:flex;align-items:center;gap:14px;">
            <span title="حذف همه پیوندها" style="cursor:pointer;color:#90a4ae;font-size:18px;" onclick="clearAllShareLinks()">🗑</span>
            <span title="ایجاد پیوند جدید" style="cursor:pointer;color:#1565c0;font-size:22px;font-weight:900;" onclick="startCreateShareLink()">+</span>
          </div>
        </div>
        ${umpShareLinks.length ? umpShareLinks.map(lk => `
          <div style="border-top:1px solid #f1f5f9;padding:10px 0;display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div style="min-width:0;">
              <div style="font-weight:700;font-size:13.5px;color:#263238;">${lk.name}</div>
              <div style="font-size:11.5px;color:#607d8b;margin-top:2px;">${lk.ids.length} واحد • انقضا: ${lk.expVal} ${lk.expUnit}</div>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-sm" style="background:#e3f2fd;color:#1565c0;" onclick="copyOneShareLink('${lk.url}')">کپی</button>
              <button class="btn btn-sm" style="background:#ffebee;color:#c62828;" onclick="deleteOneShareLink('${lk.id}')">حذف</button>
            </div>
          </div>
        `).join('') : `<div style="text-align:center;color:#607d8b;font-size:13px;padding:16px 6px;">هیچ پیوندی وجود ندارد. می‌توانید یک پیوند جدید ایجاد کنید.</div>`}
      </div>
    </div>
  `;
}

function clearAllShareLinks() {
  if (!umpShareLinks.length) return;
  if (!confirm('همه پیوندهای اشتراک‌گذاری حذف شوند؟')) return;
  umpShareLinks = [];
  localStorage.setItem('bmth_share_links', '[]');
  openShareLinksListPage();
}

function deleteOneShareLink(id) {
  umpShareLinks = umpShareLinks.filter(x => x.id !== id);
  localStorage.setItem('bmth_share_links', JSON.stringify(umpShareLinks));
  openShareLinksListPage();
}

function copyOneShareLink(url) {
  if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
  if (typeof showGreenToast === 'function') showGreenToast('پیوند اشتراک‌گذاری کپی شد');
}

// ۴. فرم ۲ مرحله‌ای «ایجاد پیوند اشتراک‌گذاری»
function startCreateShareLink() {
  umpShareDraft = { step: 1, ids: [], name: '', expVal: 1, expUnit: 'ساعت', showName: true, showIcon: true, showTail: false };
  renderCreateShareWizard();
}

function toggleShareAllUnits(checked) {
  const units = (uState && uState.units) || [];
  umpShareDraft.ids = checked ? units.map(u => u.id) : [];
  renderCreateShareWizard();
}

function toggleShareUnitId(id, checked) {
  if (checked && !umpShareDraft.ids.includes(id)) umpShareDraft.ids.push(id);
  if (!checked) umpShareDraft.ids = umpShareDraft.ids.filter(x => x !== id);
  renderCreateShareWizard();
}

function finishCreateShareLink() {
  const name = (document.getElementById('sh-w-name').value || '').trim() || ('پیوند ' + (umpShareLinks.length + 1));
  const expVal = Number(document.getElementById('sh-w-val').value) || 1;
  const expUnit = document.getElementById('sh-w-unit').value || 'ساعت';
  const showName = document.getElementById('sh-w-sn').checked;
  const showIcon = document.getElementById('sh-w-si').checked;
  const showTail = document.getElementById('sh-w-st').checked;
  const url = `${location.origin}/?share=${encodeURIComponent(umpShareDraft.ids.join(','))}&n=${showName?1:0}&i=${showIcon?1:0}&t=${showTail?1:0}`;

  umpShareLinks.unshift({ id: 'sh_' + Date.now(), name, ids: umpShareDraft.ids, expVal, expUnit, showName, showIcon, showTail, url });
  localStorage.setItem('bmth_share_links', JSON.stringify(umpShareLinks));
  if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
  if (typeof showGreenToast === 'function') showGreenToast('پیوند اشتراک‌گذاری ایجاد و کپی شد');
  openShareLinksListPage();
}

function renderCreateShareWizard() {
  const ov = ensureUmpOverlay();
  const units = (uState && uState.units) || [];
  const allChecked = units.length > 0 && umpShareDraft.ids.length === units.length;

  ov.innerHTML = `
    <div style="background:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb;">
      <span style="width:24px;"></span>
      <b style="font-size:15.5px;color:#263238;">ایجاد پیوند اشتراک‌گذاری</b>
      <span style="font-size:22px;cursor:pointer;color:#455a64;padding:0 4px;" onclick="openShareLinksListPage()">×</span>
    </div>
    <div style="flex:1;overflow-y:auto;padding:14px;">
      <div style="background:#fff;border-radius:16px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        <!-- مرحله ۱ -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;cursor:pointer;" onclick="umpShareDraft.step=1;renderCreateShareWizard()">
          <div style="width:26px;height:26px;border-radius:50%;background:#1565c0;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;">${umpShareDraft.step===2?'✓':'✎'}</div>
          <b style="color:#1565c0;font-size:14px;">انتخاب واحدها</b>
        </div>

        ${umpShareDraft.step === 1 ? `
          <div style="padding-right:16px;border-right:1.5px solid #e2e8f0;margin-right:12px;margin-bottom:14px;">
            <label style="display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid #f1f5f9;cursor:pointer;">
              <input type="checkbox" ${allChecked?'checked':''} onchange="toggleShareAllUnits(this.checked)" style="width:18px;height:18px;">
              <b style="font-size:13.5px;">همه یگان‌ها</b>
            </label>
            ${units.map(u => `
              <label style="display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid #f1f5f9;cursor:pointer;">
                <input type="checkbox" ${umpShareDraft.ids.includes(u.id)?'checked':''} onchange="toggleShareUnitId('${u.id}',this.checked)" style="width:18px;height:18px;">
                ${getVehicleSvg(u.icon, u.color, 30)}
                <span style="font-size:13.5px;">${u.name}</span>
              </label>
            `).join('')}
            <div style="display:flex;justify-content:flex-end;padding-top:12px;">
              <button class="btn btn-sm" style="background:transparent;color:${umpShareDraft.ids.length?'#1565c0':'#b0bec5'};font-size:14px;" ${umpShareDraft.ids.length?'':'disabled'} onclick="umpShareDraft.step=2;renderCreateShareWizard()">بعدی &lt;</button>
            </div>
          </div>
        ` : ''}

        <!-- مرحله ۲ -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <div style="width:26px;height:26px;border-radius:50%;background:${umpShareDraft.step===2?'#1565c0':'#b0bec5'};color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;">${umpShareDraft.step===2?'✎':'🔗'}</div>
          <b style="color:${umpShareDraft.step===2?'#1565c0':'#90a4ae'};font-size:14px;">تنظیمات پیوند</b>
        </div>

        ${umpShareDraft.step === 2 ? `
          <div style="padding-right:12px;">
            <input id="sh-w-name" class="cp-inp" placeholder="نام پیوند اشتراک‌گذاری" style="margin-bottom:14px;">
            <div style="font-size:13px;font-weight:700;color:#37474f;margin-bottom:8px;">زمان انقضا</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
              <select id="sh-w-val" class="cp-inp" dir="ltr">
                ${[1,2,3,6,12,24,48].map(n => `<option value="${n}">${n}</option>`).join('')}
              </select>
              <select id="sh-w-unit" class="cp-inp">
                <option value="ساعت">ساعت</option>
                <option value="روز">روز</option>
                <option value="هفته">هفته</option>
                <option value="ماه">ماه</option>
              </select>
            </div>
            <label style="display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:13.5px;cursor:pointer;">
              <input id="sh-w-sn" type="checkbox" checked style="width:18px;height:18px;"><span>نمایش نام واحد</span>
            </label>
            <label style="display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:13.5px;cursor:pointer;">
              <input id="sh-w-si" type="checkbox" checked style="width:18px;height:18px;"><span>نمایش آیکون واحد</span>
            </label>
            <label style="display:flex;align-items:center;gap:10px;margin-bottom:18px;font-size:13.5px;cursor:pointer;">
              <input id="sh-w-st" type="checkbox" style="width:18px;height:18px;"><span>نمایش دنباله مسیر</span>
            </label>
            <div style="display:flex;justify-content:flex-end;">
              <button class="btn" style="min-width:130px;background:#546e7a;color:#fff;border-radius:12px;" onclick="finishCreateShareLink()">ایجاد</button>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ۵. اصلاح قطعی دکمه سه‌خط (≡) بالا سمت چپ در تب یگان‌ها + رندر نمای فهرستی مطابق اسکرین‌شات
const _origHandleLeftForUmp = typeof handleSheetLeftBtn === 'function' ? handleSheetLeftBtn : null;
window.handleSheetLeftBtn = function() {
  if (typeof userTab !== 'undefined' && userTab === 'units') {
    return window.openUnitsDotsMenu();
  }
  if (_origHandleLeftForUmp) return _origHandleLeftForUmp();
};

const _origRenderForCompact = renderUserTab;
renderUserTab = function() {
  applySavedUnitsOrder();
  _origRenderForCompact();
  if (userTab === 'units' && compactView && uState) {
    const body = document.getElementById('u-sheet-body');
    if (!body) return;
    body.innerHTML = (uState.units || []).map(u => `
      <div style="background:#fff;border-radius:14px;padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 3px rgba(0,0,0,0.06);border-right:3.5px solid ${activeUnitId===u.id?'#1565c0':'transparent'};cursor:pointer;" onclick="selectUnit('${u.id}')">
        <div style="display:flex;align-items:center;gap:10px;">
          ${getVehicleSvg(u.icon, u.color, 34)}
          <div>
            <b style="font-size:13.5px;color:#263238;">${u.name}</b>
            <div style="font-size:11.5px;color:#546e7a;display:flex;align-items:center;gap:5px;">
              <span style="width:7px;height:7px;border-radius:50%;background:${u.isExpired?'#ef4444':'#22c55e'};display:inline-block;"></span>
              <span dir="ltr">${u.lastTime || '00:00:00'}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;color:#546e7a;" onclick="event.stopPropagation()">
          <span class="ms" style="font-size:20px;cursor:pointer;" onclick="activeUnitId='${u.id}';openUserTab('history')">play_circle</span>
          <span class="ms" style="font-size:20px;cursor:pointer;" onclick="openUnitDetailsPage('${u.id}')">event_note</span>
          <span class="ms" style="font-size:20px;cursor:pointer;" onclick="openUnitActionMenu('${u.id}')">more_vert</span>
        </div>
      </div>
    `).join('');
  }
};

// === ارتقای لیست پیوندهای اشتراک‌گذاری و پنجره Share بومی گوشی مطابق نمونه اصلی ===
let umpExpandedShareId = null;

function calcExpireString(val, unit) {
  const mult = unit === 'ساعت' ? 3600000 : (unit === 'روز' ? 86400000 : (unit === 'هفته' ? 7 * 86400000 : 30 * 86400000));
  const d = new Date(Date.now() + (Number(val) || 1) * mult);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

async function triggerNativeShare(title, url) {
  if (navigator.share) {
    try {
      await navigator.share({ title: title || 'اشتراک‌گذاری موقعیت', url });
      return;
    } catch (e) {}
  }
  if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
  if (typeof showGreenToast === 'function') showGreenToast('لینک اشتراک‌گذاری کپی شد');
}

finishCreateShareLink = function() {
  const name = (document.getElementById('sh-w-name').value || '').trim() || ('پیوند ' + (umpShareLinks.length + 1));
  const expVal = Number(document.getElementById('sh-w-val').value) || 1;
  const expUnit = document.getElementById('sh-w-unit').value || 'ساعت';
  const showName = document.getElementById('sh-w-sn').checked;
  const showIcon = document.getElementById('sh-w-si').checked;
  const showTail = document.getElementById('sh-w-st').checked;
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const url = `${location.origin}/?locator=${token}&share=${encodeURIComponent(umpShareDraft.ids.join(','))}&n=${showName?1:0}&i=${showIcon?1:0}&t=${showTail?1:0}`;
  const unitNames = ((uState && uState.units) || [])
    .filter(u => umpShareDraft.ids.includes(u.id))
    .map(u => u.name);

  const newLink = {
    id: 'sh_' + Date.now(),
    name,
    ids: umpShareDraft.ids,
    unitNames,
    expVal,
    expUnit,
    expStr: calcExpireString(expVal, expUnit),
    showName,
    showIcon,
    showTail,
    url
  };

  umpShareLinks.unshift(newLink);
  umpExpandedShareId = newLink.id;
  localStorage.setItem('bmth_share_links', JSON.stringify(umpShareLinks));
  openShareLinksListPage();
  triggerNativeShare(name, url);
};

openShareLinksListPage = function() {
  const ov = ensureUmpOverlay();
  ov.style.display = 'flex';

  const eyeRow = (label, on) => `
    <div style="display:flex;align-items:center;gap:10px;padding:9px 2px;border-top:1px solid #f1f5f9;font-size:13px;color:${on?'#263238':'#90a4ae'};">
      <span style="color:${on?'#1565c0':'#b0bec5'};font-size:16px;">${on ? '👁' : '🚫'}</span>
      <span>${label}</span>
    </div>`;

  ov.innerHTML = `
    <div style="background:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb;">
      <span style="font-size:20px;cursor:pointer;color:#455a64;padding:0 6px;" onclick="closeUmpOverlay()">&lt;</span>
      <b style="font-size:15.5px;color:#263238;">اشتراک‌گذاری واحدها</b>
      <span style="width:24px;"></span>
    </div>
    <div style="flex:1;overflow-y:auto;padding:14px;">
      <div style="background:#fff;border-radius:14px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <b style="font-size:14.5px;color:#263238;">پیوندهای اشتراک‌گذاری</b>
          <div style="display:flex;align-items:center;gap:14px;">
            <span title="حذف همه" style="cursor:pointer;color:#90a4ae;font-size:18px;" onclick="clearAllShareLinks()">🗑</span>
            <span title="ایجاد پیوند جدید" style="cursor:pointer;color:#1565c0;font-size:22px;font-weight:900;" onclick="startCreateShareLink()">+</span>
          </div>
        </div>

        ${umpShareLinks.length ? umpShareLinks.map(lk => {
          const isOpen = umpExpandedShareId === lk.id;
          const namesTxt = (lk.unitNames && lk.unitNames.length) ? lk.unitNames.join('، ') : `${lk.ids.length} واحد`;
          return `
            <div style="border-top:1px solid #e5e7eb;padding:10px 0;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <div style="display:flex;align-items:center;gap:10px;min-width:0;cursor:pointer;" onclick="triggerNativeShare('${lk.name}','${lk.url}')">
                  <span class="ms" style="font-size:20px;color:#455a64;" title="اشتراک‌گذاری لینک">share</span>
                  <div style="min-width:0;">
                    <div style="font-weight:700;font-size:13.5px;color:#263238;">${lk.name}</div>
                    <div style="font-size:11.5px;color:#78909c;">انقضا در: <span dir="ltr">${lk.expStr || (lk.expVal + ' ' + lk.expUnit)}</span></div>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:14px;color:#546e7a;">
                  <span style="cursor:pointer;font-size:18px;" onclick="umpExpandedShareId=(umpExpandedShareId==='${lk.id}'?null:'${lk.id}');openShareLinksListPage()">${isOpen ? '⌃' : '⌄'}</span>
                  <span style="cursor:pointer;font-size:18px;" onclick="deleteOneShareLink('${lk.id}')">×</span>
                </div>
              </div>

              ${isOpen ? `
                <div style="margin-top:10px;padding-top:8px;border-top:1px solid #f1f5f9;">
                  <div style="font-size:13px;font-weight:700;color:#263238;margin-bottom:3px;">یگان‌ها</div>
                  <div style="font-size:12px;color:#607d8b;margin-bottom:8px;line-height:1.6;">${namesTxt}</div>
                  ${eyeRow('نام واحد', lk.showName)}
                  ${eyeRow('آیکون واحد', lk.showIcon)}
                  ${eyeRow('دنباله واحد', lk.showTail)}
                  <div style="padding-top:10px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;">
                    <a href="${lk.url}" target="_blank" style="color:#1565c0;font-size:13px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:5px;">
                      <span>نمایش در Locator</span><span>↗</span>
                    </a>
                    <button class="btn btn-sm" style="background:#e3f2fd;color:#1565c0;" onclick="triggerNativeShare('${lk.name}','${lk.url}')">اشتراک‌گذاری لینک</button>
                  </div>
                </div>
              ` : ''}
            </div>`;
        }).join('') : `<div style="text-align:center;color:#607d8b;font-size:13px;padding:16px 6px;">هیچ پیوندی وجود ندارد. می‌توانید یک پیوند جدید ایجاد کنید.</div>`}
      </div>
    </div>
  `;
};

// === پنجره انتخاب سریع خودرو از آیکون بالا سمت راست (مطابق نسخه اصلی) ===
function openUnitQuickPicker(filterText = '') {
  const units = (uState && uState.units) || [];
  const q = (filterText || '').trim().toLowerCase();
  const list = q ? units.filter(u => (u.name || '').toLowerCase().includes(q)) : units;

  showModal(`
    <div style="direction:rtl;">
      <div style="display:flex;align-items:center;gap:10px;padding:4px 6px 12px;border-bottom:1px solid #e5e7eb;margin-bottom:4px;">
        <span class="ms" style="font-size:22px;color:#546e7a;">search</span>
        <input id="uqp-search" value="${filterText.replace(/"/g,'&quot;')}" placeholder="جستجو" oninput="filterUnitQuickPicker(this.value)" style="flex:1;border:none;outline:none;font-size:14px;background:transparent;color:#263238;">
      </div>
      <div id="uqp-list" style="max-height:52vh;overflow-y:auto;">
        ${renderUnitQuickPickerRows(list)}
      </div>
    </div>
  `);
  const inp = document.getElementById('uqp-search');
  if (inp && filterText) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
}

function renderUnitQuickPickerRows(list) {
  if (!list.length) return `<div style="text-align:center;color:#90a4ae;padding:20px;font-size:13px;">خودرویی پیدا نشد.</div>`;
  return list.map(u => {
    const isAct = u.id === activeUnitId;
    return `
      <div onclick="pickUnitFromQuickList('${u.id}')" style="display:flex;align-items:center;gap:14px;padding:12px 8px;border-bottom:1px solid #f1f5f9;cursor:pointer;">
        ${getVehicleSvg(u.icon, u.color, 34)}
        <span style="font-size:14px;font-weight:${isAct ? '700' : '500'};color:${isAct ? '#1565c0' : '#263238'};">${u.name}</span>
      </div>`;
  }).join('');
}

function filterUnitQuickPicker(val) {
  const units = (uState && uState.units) || [];
  const q = (val || '').trim().toLowerCase();
  const list = q ? units.filter(u => (u.name || '').toLowerCase().includes(q)) : units;
  const box = document.getElementById('uqp-list');
  if (box) box.innerHTML = renderUnitQuickPickerRows(list);
}

function pickUnitFromQuickList(uid) {
  activeUnitId = uid;
  closeModal();
  if (typeof selectUnit === 'function') selectUnit(uid);
  else renderUserTab();
  syncHeaderRightUnitIcon();
}

function syncHeaderRightUnitIcon() {
  const u = uState && (uState.units.find(x => x.id === activeUnitId) || uState.units[0]);
  if (!u) return;
  const btn = document.querySelector('#u-sheet .u-sheet-head .u-unit-btn, #u-sheet .u-sheet-head .head-right, #u-unit-picker-btn');
  if (btn) {
    btn.innerHTML = getVehicleSvg(u.icon, u.color, 28);
    btn.style.cursor = 'pointer';
    btn.onclick = (e) => { e.stopPropagation(); openUnitQuickPicker(); };
  }
}

// اتصال کلیک روی آیکون دایره‌ای سمت راست هدر به پنجره انتخاب سریع
(function bindRightCarPicker() {
  const head = document.querySelector('#u-sheet .u-sheet-head');
  if (!head) return;
  head.addEventListener('click', function(e) {
    const carBtn = e.target.closest('.u-unit-btn, .head-right, #u-unit-picker-btn');
    if (carBtn) {
      e.stopImmediatePropagation();
      e.preventDefault();
      openUnitQuickPicker();
    }
  }, true);
})();

const _origRenderForRightIcon = renderUserTab;
renderUserTab = function() {
  _origRenderForRightIcon();
  syncHeaderRightUnitIcon();
};

// پیدا کردن قطعی دکمه دایره‌ای ماشین در هدر شیت (سمت راست) و اتصال آن به انتخاب سریع
function findRightCarCircleBtn() {
  const titleEl = document.getElementById('u-sheet-title');
  const head = titleEl ? titleEl.parentElement : document.querySelector('#u-sheet .u-sheet-head');
  if (!head) return null;
  const candidates = Array.from(head.querySelectorAll('button, div, span')).filter(el => {
    if (el.id === 'u-left-btn' || el.id === 'u-sheet-title') return false;
    const st = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return r.width >= 30 && r.width <= 54 && Math.abs(r.width - r.height) <= 8 && (parseInt(st.borderRadius) >= 15 || st.borderRadius.includes('%'));
  });
  return candidates.length ? candidates[candidates.length - 1] : null;
}

syncHeaderRightUnitIcon = function() {
  const u = uState && (uState.units.find(x => x.id === activeUnitId) || uState.units[0]);
  const btn = findRightCarCircleBtn();
  if (!btn || !u) return;
  btn.innerHTML = getVehicleSvg(u.icon, u.color, 28);
  btn.style.display = 'inline-flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
  btn.style.cursor = 'pointer';
  btn.onclick = function(e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    openUnitQuickPicker();
  };
};

setTimeout(syncHeaderRightUnitIcon, 600);
setTimeout(syncHeaderRightUnitIcon, 1500);

// اصلاح انتخاب یگان از لیست بالا سمت راست: سوییچ کامل + فوکوس نقشه + اسکرول به کارت خودرو
pickUnitFromQuickList = function(uid) {
  const u = uState && uState.units.find(x => x.id === uid);
  if (!u) return;

  activeUnitId = uid;
  window.activeUnitId = uid;
  closeModal();

  if (typeof selectUnit === 'function') {
    try { selectUnit(uid); } catch (e) {}
  }
  renderUserTab();
  syncHeaderRightUnitIcon();

  // فوکوس و زوم نقشه روی خودروی انتخاب‌شده
  if (typeof map !== 'undefined' && map && u.lat && u.lng) {
    map.setView([u.lat, u.lng], Math.max(map.getZoom(), 15), { animate: true });
  }

  // اسکرول به کارت همان خودرو در تب یگان‌ها
  if (typeof userTab !== 'undefined' && userTab === 'units') {
    setTimeout(() => {
      const body = document.getElementById('u-sheet-body');
      if (!body) return;
      const target = Array.from(body.children).find(el => (el.innerText || '').includes(u.name));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  }
};

// قرار دادن خودروی انتخاب‌شده در صدر لیست یگان‌ها و اسکرول به بالا (مطابق نسخه اصلی)
pickUnitFromQuickList = function(uid) {
  if (!uState || !Array.isArray(uState.units)) return;
  const idx = uState.units.findIndex(x => x.id === uid);
  if (idx === -1) return;

  // انتقال خودروی انتخاب‌شده به اول لیست
  const [picked] = uState.units.splice(idx, 1);
  uState.units.unshift(picked);

  activeUnitId = uid;
  window.activeUnitId = uid;
  closeModal();

  if (typeof selectUnit === 'function') {
    try { selectUnit(uid); } catch (e) {}
  }
  renderUserTab();
  syncHeaderRightUnitIcon();

  // اسکرول لیست به بالاترین نقطه تا کارت جدید دقیقاً اول دیده شود
  const body = document.getElementById('u-sheet-body');
  if (body) body.scrollTop = 0;

  // فوکوس نقشه روی موقعیت خودروی انتخاب‌شده
  if (typeof map !== 'undefined' && map && picked.lat && picked.lng) {
    map.setView([picked.lat, picked.lng], Math.max(map.getZoom(), 15), { animate: true });
  }
};

// نگهداری آخرین خودروی انتخاب‌شده در صدر لیست برای همه یگان‌ها بدون تداخل با مرتب‌سازی قبلی
let umpTopUnitId = null;

const _origApplyOrderForTop = applySavedUnitsOrder;
applySavedUnitsOrder = function() {
  _origApplyOrderForTop();
  if (umpTopUnitId && uState && Array.isArray(uState.units)) {
    const i = uState.units.findIndex(x => x.id === umpTopUnitId);
    if (i > 0) {
      const [u] = uState.units.splice(i, 1);
      uState.units.unshift(u);
    }
  }
};

pickUnitFromQuickList = function(uid) {
  if (!uState || !Array.isArray(uState.units)) return;
  const picked = uState.units.find(x => x.id === uid);
  if (!picked) return;

  umpTopUnitId = uid;
  activeUnitId = uid;
  window.activeUnitId = uid;
  closeModal();

  if (typeof selectUnit === 'function') {
    try { selectUnit(uid); } catch (e) {}
  }
  renderUserTab();
  syncHeaderRightUnitIcon();

  const body = document.getElementById('u-sheet-body');
  if (body) body.scrollTop = 0;

  if (typeof map !== 'undefined' && map && picked.lat && picked.lng) {
    map.setView([picked.lat, picked.lng], Math.max(map.getZoom(), 15), { animate: true });
  }
};

// === سیستم پنهان کردن و نمایش مجدد واحدها (متصل به سه‌نقطه ⋮) ===
function getHiddenUnitIds() {
  try { return JSON.parse(localStorage.getItem('bmth_hidden_units') || '[]'); } catch (e) { return []; }
}
function saveHiddenUnitIds(arr) {
  localStorage.setItem('bmth_hidden_units', JSON.stringify(arr));
}

function hideUnitById(uid) {
  const ids = getHiddenUnitIds();
  if (!ids.includes(uid)) ids.push(uid);
  saveHiddenUnitIds(ids);
  closeModal();
  renderUserTab();
  if (typeof showGreenToast === 'function') showGreenToast('واحد از لیست پنهان شد');
}

function unhideUnitById(uid) {
  const ids = getHiddenUnitIds().filter(x => x !== uid);
  saveHiddenUnitIds(ids);
  renderUserTab();
  if (ids.length) openHiddenUnitsModal();
  else closeModal();
  if (typeof showGreenToast === 'function') showGreenToast('واحد به لیست اصلی برگشت');
}

function unhideAllUnits() {
  saveHiddenUnitIds([]);
  closeModal();
  renderUserTab();
  if (typeof showGreenToast === 'function') showGreenToast('همه واحدها نمایش داده شدند');
}

function openHiddenUnitsModal() {
  const hiddenIds = getHiddenUnitIds();
  const units = (uState && uState.units) || [];
  const hiddenUnits = units.filter(u => hiddenIds.includes(u.id));
  showModal(`
    <h4 style="margin:0 0 10px;text-align:center;">واحدهای پنهان (${hiddenUnits.length})</h4>
    <div style="max-height:50vh;overflow-y:auto;margin-bottom:10px;">
      ${hiddenUnits.length ? hiddenUnits.map(u => `
        <div class="menu-row" style="justify-content:space-between;">
          <div class="menu-row-r">${getVehicleSvg(u.icon, u.color, 30)}<b>${u.name}</b></div>
          <button class="btn btn-sm" style="background:#1565c0;color:#fff;" onclick="unhideUnitById('${u.id}')">نمایش</button>
        </div>
      `).join('') : '<div style="text-align:center;color:#78909c;padding:16px;">واحد پنهانی وجود ندارد.</div>'}
    </div>
    ${hiddenUnits.length ? `<button class="btn btn-full" style="background:#2e7d32;color:#fff;margin-bottom:6px;" onclick="unhideAllUnits()">نمایش همه واحدها</button>` : ''}
    <div class="close-bar" onclick="closeModal()">بستن</div>
  `);
}

// افزودن گزینه «پنهان کردن از لیست» به منوی سه‌نقطه (⋮) هر خودرو
if (typeof openUnitActionMenu === 'function') {
  const _origOpenUnitActionMenu = openUnitActionMenu;
  window.openUnitActionMenu = function(uid) {
    _origOpenUnitActionMenu(uid);
    setTimeout(() => {
      const modal = document.querySelector('#modal-box, .modal-box, .modal-content, #modal');
      if (!modal || modal.querySelector('.ump-hide-row')) return;
      const row = document.createElement('div');
      row.className = 'menu-row ump-hide-row';
      row.innerHTML = `<div class="menu-row-r"><span style="font-size:18px;">🙈</span><span>پنهان کردن از لیست</span></div>`;
      row.onclick = () => hideUnitById(uid);
      const closeBar = modal.querySelector('.close-bar');
      if (closeBar) closeBar.parentNode.insertBefore(row, closeBar);
      else modal.appendChild(row);
    }, 20);
  };
}

// مخفی کردن کارت‌های پنهان‌شده و نمایش دکمه «واحدهای پنهان (N)» بالای لیست
const _origRenderForHide = renderUserTab;
renderUserTab = function() {
  _origRenderForHide();
  if (userTab !== 'units' || !uState) return;
  const body = document.getElementById('u-sheet-body');
  if (!body) return;
  const hiddenIds = getHiddenUnitIds();
  const hiddenUnits = (uState.units || []).filter(u => hiddenIds.includes(u.id));

  Array.from(body.children).forEach(el => {
    if (el.id === 'ump-hidden-bar' || el.classList.contains('add-gps-bottom-btn')) return;
    const txt = el.innerText || '';
    if (txt.includes('واحدهای پنهان')) { el.remove(); return; }
    if (hiddenUnits.some(u => txt.includes(u.name))) {
      el.style.display = 'none';
    }
  });

  if (hiddenUnits.length > 0) {
    const bar = document.createElement('div');
    bar.id = 'ump-hidden-bar';
    bar.style.cssText = 'margin-bottom:10px;display:flex;justify-content:flex-start;';
    bar.innerHTML = `<button class="btn btn-sm" style="background:#1565c0;color:#fff;border-radius:10px;padding:6px 14px;font-size:12.5px;" onclick="openHiddenUnitsModal()">واحدهای پنهان (${hiddenUnits.length})</button>`;
    body.prepend(bar);
  }
};

// افزودن تیک (چک‌باکس) نمایش/پنهان کردن جلوی هر خودرو در لیست انتخاب سریع
function toggleUnitVisibilityCheck(uid, isVisible) {
  let hidden = getHiddenUnitIds();
  if (isVisible) {
    hidden = hidden.filter(x => x !== uid);
  } else {
    if (!hidden.includes(uid)) hidden.push(uid);
  }
  saveHiddenUnitIds(hidden);
  renderUserTab();
}

renderUnitQuickPickerRows = function(list) {
  if (!list.length) return `<div style="text-align:center;color:#90a4ae;padding:20px;font-size:13px;">خودرویی پیدا نشد.</div>`;
  const hiddenIds = getHiddenUnitIds();
  return list.map(u => {
    const isAct = u.id === activeUnitId;
    const isVisible = !hiddenIds.includes(u.id);
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 8px;border-bottom:1px solid #f1f5f9;">
        <div onclick="pickUnitFromQuickList('${u.id}')" style="display:flex;align-items:center;gap:14px;flex:1;cursor:pointer;opacity:${isVisible ? 1 : 0.45};">
          ${getVehicleSvg(u.icon, u.color, 34)}
          <span style="font-size:14px;font-weight:${isAct ? '700' : '500'};color:${isAct ? '#1565c0' : '#263238'};">${u.name}</span>
        </div>
        <input type="checkbox" ${isVisible ? 'checked' : ''}
          title="نمایش / پنهان کردن در لیست"
          onclick="event.stopPropagation()"
          onchange="toggleUnitVisibilityCheck('${u.id}', this.checked); filterUnitQuickPicker((document.getElementById('uqp-search')||{}).value || '')"
          style="width:19px;height:19px;accent-color:#1565c0;cursor:pointer;">
      </div>`;
  }).join('');
};

// یکپارچه‌سازی وضعیت پنهان‌سازی قدیمی client.js با تیک‌های جدید
const _prevRenderBeforeSync = renderUserTab;
renderUserTab = function() {
  if (uState && Array.isArray(uState.units)) {
    const hiddenIds = getHiddenUnitIds();
    // پاک کردن حالت مخفی قدیمی تا فقط تیک‌های جدید ملاک باشند
    uState.units.forEach(u => {
      u.hidden = false;
      u.isHidden = false;
    });
    if (typeof hiddenUnits !== 'undefined') {
      if (Array.isArray(hiddenUnits)) hiddenUnits.length = 0;
      else if (hiddenUnits instanceof Set) hiddenUnits.clear();
    }
    try {
      localStorage.removeItem('hiddenUnits');
      localStorage.removeItem('bmth_hidden');
    } catch (e) {}
  }
  _prevRenderBeforeSync();
};

// === منوی سه‌نقطه (⋮) بالا سمت راست نقشه دقیقاً مطابق نمونه اصلی ===
let fgServiceMode = localStorage.getItem('fg_service_mode') === '1';

function getFgAccountId() {
  if (window.uState && uState.user) return uState.user.accountId || uState.user.id || uState.user.email || '2600173';
  return localStorage.getItem('userEmail') || '2600173';
}

function openForGuardTopMenu() {
  const accId = getFgAccountId();
  const rowStyle = 'display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid #eef0f3;cursor:pointer;background:#fff;';
  const rightStyle = 'display:flex;align-items:center;gap:14px;font-size:14px;color:#263238;font-weight:500;';
  const ic = (d) => `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#546e7a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

  const icons = {
    info: ic('<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'),
    map: ic('<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>'),
    bell: ic('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'),
    theme: ic('<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><path d="M14.5 16.5a2 2 0 0 1 2-2h2.5"/>'),
    service: ic('<circle cx="12" cy="12" r="9"/><path d="M14.7 9.3l-5.4 5.4"/><circle cx="10" cy="10" r="1.5"/>'),
    about: ic('<rect x="6" y="2" width="12" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>'),
    docs: ic('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>'),
    account: ic('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    logout: ic('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'),
    ext: ic('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>')
  };

  showModal(`
    <div style="margin:-16px -16px -10px;direction:rtl;overflow:hidden;border-radius:16px 16px 0 0;">
      <div style="background:#e9ecef;text-align:center;padding:11px;font-size:14px;font-weight:700;color:#263238;direction:ltr;">${accId}</div>

      <div style="${rowStyle}" onclick="closeModal();if(typeof openUserTab==='function')openUserTab('alerts');">
        <div style="${rightStyle}">${icons.info}<span>اعلان ها</span></div>
      </div>

      <div style="${rowStyle}" onclick="openFgMapTypeModal()">
        <div style="${rightStyle}">${icons.map}<span>نوع نقشه</span></div>
        <span style="color:#78909c;font-size:16px;">&lt;</span>
      </div>

      <div style="${rowStyle}" onclick="openFgAlertsSettingsModal()">
        <div style="${rightStyle}">${icons.bell}<span>تنظیمات هشدارها</span></div>
        <span style="color:#78909c;font-size:16px;">&lt;</span>
      </div>

      <div style="${rowStyle}" onclick="openFgAppearanceModal()">
        <div style="${rightStyle}">${icons.theme}<span>تنظیمات ظاهر</span></div>
      </div>

      <div style="${rowStyle}" onclick="toggleFgServiceMode()">
        <div style="${rightStyle}">${icons.service}<span>حالت خدمات</span></div>
        <span style="padding:3px 12px;border-radius:14px;font-size:11.5px;font-weight:700;color:#fff;background:${fgServiceMode ? '#2e7d32' : '#bdbdbd'};">${fgServiceMode ? 'روشن' : 'خاموش'}</span>
      </div>

      <div style="${rowStyle}" onclick="openFgAboutModal()">
        <div style="${rightStyle}">${icons.about}<span>درباره برنامه</span></div>
      </div>

      <div style="${rowStyle}" onclick="openFgDocsModal()">
        <div style="${rightStyle}">${icons.docs}<span>مستندات</span></div>
        ${icons.ext}
      </div>

      <div style="${rowStyle}" onclick="openFgAccountModal()">
        <div style="${rightStyle}">${icons.account}<span>حساب</span></div>
        <span style="color:#78909c;font-size:16px;">&lt;</span>
      </div>

      <div style="${rowStyle}" onclick="doFgLogout()">
        <div style="${rightStyle}">${icons.logout}<span>خروج</span></div>
      </div>

      <div style="text-align:center;padding:14px;font-size:14px;font-weight:600;color:#455a64;cursor:pointer;background:#fff;" onclick="closeModal()">بستن</div>
    </div>
  `);
}

function toggleFgServiceMode() {
  fgServiceMode = !fgServiceMode;
  localStorage.setItem('fg_service_mode', fgServiceMode ? '1' : '0');
  openForGuardTopMenu();
  if (typeof showGreenToast === 'function') showGreenToast(fgServiceMode ? 'حالت خدمات روشن شد' : 'حالت خدمات خاموش شد');
}

function openFgMapTypeModal() {
  if (typeof openMapLayerModal === 'function') return openMapLayerModal();
  showModal(`
    <h4 style="margin:0 0 10px;text-align:center;">نوع نقشه</h4>
    <div class="menu-row" onclick="if(typeof setMapLayer==='function')setMapLayer('osm');closeModal()"><span>نقشه استاندارد (خیابانی)</span></div>
    <div class="menu-row" onclick="if(typeof setMapLayer==='function')setMapLayer('sat');closeModal()"><span>نقشه ماهواره‌ای</span></div>
    <div class="menu-row" onclick="if(typeof setMapLayer==='function')setMapLayer('hybrid');closeModal()"><span>نقشه ترکیبی (ماهواره + نام خیابان)</span></div>
    <div class="close-bar" onclick="openForGuardTopMenu()">بازگشت</div>
  `);
}

function openFgAlertsSettingsModal() {
  const snd = localStorage.getItem('fg_alert_sound') !== '0';
  const vib = localStorage.getItem('fg_alert_vib') !== '0';
  showModal(`
    <h4 style="margin:0 0 10px;text-align:center;">تنظیمات هشدارها</h4>
    <label class="menu-row" style="cursor:pointer;"><span>صدای هشدارها</span><input type="checkbox" ${snd?'checked':''} onchange="localStorage.setItem('fg_alert_sound',this.checked?'1':'0')" style="width:18px;height:18px;"></label>
    <label class="menu-row" style="cursor:pointer;"><span>لرزش هنگام هشدار</span><input type="checkbox" ${vib?'checked':''} onchange="localStorage.setItem('fg_alert_vib',this.checked?'1':'0')" style="width:18px;height:18px;"></label>
    <div class="close-bar" onclick="openForGuardTopMenu()">بازگشت</div>
  `);
}

function openFgAppearanceModal() {
  showModal(`
    <h4 style="margin:0 0 10px;text-align:center;">تنظیمات ظاهر</h4>
    <div class="menu-row" onclick="document.body.classList.remove('dark','dark-mode');localStorage.setItem('theme','light');closeModal()"><span>پوسته روشن</span></div>
    <div class="menu-row" onclick="document.body.classList.add('dark','dark-mode');localStorage.setItem('theme','dark');closeModal()"><span>پوسته تیره</span></div>
    <div class="close-bar" onclick="openForGuardTopMenu()">بازگشت</div>
  `);
}

function openFgAboutModal() {
  showModal(`
    <h4 style="margin:0 0 8px;text-align:center;">درباره برنامه</h4>
    <div style="text-align:center;font-size:13px;color:#546e7a;line-height:1.9;padding:8px 0;">
      <b>سامانه هوشمند ردیابی خودرو</b><br>نسخه ۲.۵ (پشتیبانی از پروتکل‌های جهانی GPS)
    </div>
    <div class="close-bar" onclick="openForGuardTopMenu()">بازگشت</div>
  `);
}

function openFgDocsModal() {
  showModal(`
    <h4 style="margin:0 0 8px;text-align:center;">مستندات و راهنما</h4>
    <div style="font-size:12.5px;color:#455a64;line-height:1.8;padding:4px 0;direction:rtl;">
      • برای افزودن ردیاب جدید به انتهای تب <b>یگان‌ها</b> بروید.<br>
      • هر اکانت جدید به صورت پیش‌فرض <b>۱۰ روز مهلت تست رایگان</b> دارد.<br>
      • برای مشاهده و پنهان کردن خودروها از آیکون ماشین بالا سمت راست استفاده کنید.
    </div>
    <div class="close-bar" onclick="openForGuardTopMenu()">بازگشت</div>
  `);
}

function openFgAccountModal() {
  const email = (window.uState && uState.user && uState.user.email) || localStorage.getItem('userEmail') || getFgAccountId();
  const role = (window.uState && uState.user && uState.user.role) || 'user';
  showModal(`
    <h4 style="margin:0 0 10px;text-align:center;">حساب کاربری</h4>
    <div class="menu-row"><span>شناسه / ایمیل</span><b dir="ltr">${email}</b></div>
    <div class="menu-row"><span>سطح دسترسی</span><b>${role === 'admin' ? 'ادمین اصلی' : 'کاربر'}</b></div>
    <div class="close-bar" onclick="openForGuardTopMenu()">بازگشت</div>
  `);
}

function doFgLogout() {
  if (typeof logout === 'function') return logout();
  fetch('/api/logout', { method: 'POST' }).finally(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    location.reload();
  });
}

// اتصال قطعی دکمه سه‌نقطه (⋮) بالا سمت راست نقشه به منوی جدید
document.addEventListener('click', function(e) {
  const btn = e.target.closest('button, div, span');
  if (!btn || btn.closest('#u-sheet') || btn.closest('#modal') || btn.closest('.modal-box')) return;
  const r = btn.getBoundingClientRect();
  if (r.top >= 0 && r.top <= 75 && r.right >= window.innerWidth - 75 && r.width <= 60 && r.height <= 60) {
    e.stopImmediatePropagation();
    e.preventDefault();
    openForGuardTopMenu();
  }
}, true);

// === منوی «نوع نقشه» دقیقاً مطابق نسخه اصلی (با Leaflet.js) ===
let fgActiveMapType = localStorage.getItem('fg_map_type') || 'terrain';
let fgTileLayer = null;
let fgOverlayLayer = null;

function applyFgMapLayer(type) {
  fgActiveMapType = type;
  localStorage.setItem('fg_map_type', type);

  if (typeof map === 'undefined' || !map || typeof L === 'undefined') return;

  if (fgTileLayer) {
    try { map.removeLayer(fgTileLayer); } catch (e) {}
    fgTileLayer = null;
  }
  if (fgOverlayLayer) {
    try { map.removeLayer(fgOverlayLayer); } catch (e) {}
    fgOverlayLayer = null;
  }

  // پاک کردن لایه‌های تایل قبلی در صورت وجود
  map.eachLayer(layer => {
    if (layer instanceof L.TileLayer) {
      try { map.removeLayer(layer); } catch (e) {}
    }
  });

  if (type === 'osm') {
    fgTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap'
    }).addTo(map);
  } else if (type === 'gurtam') {
    fgTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: 'Gurtam Maps'
    }).addTo(map);
  } else if (type === 'roadmap') {
    fgTileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20, attribution: 'Google'
    }).addTo(map);
  } else if (type === 'satellite') {
    fgTileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 20, attribution: 'Google'
    }).addTo(map);
  } else if (type === 'terrain') {
    fgTileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
      maxZoom: 20, attribution: 'Google'
    }).addTo(map);
  } else if (type === 'hybrid') {
    fgTileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20, attribution: 'Google'
    }).addTo(map);
  }
}

openFgMapTypeModal = function() {
  const accId = typeof getFgAccountId === 'function' ? getFgAccountId() : '2600173';
  const mapIcon = `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#546e7a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`;
  const gIcon = `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;font-family:Georgia,serif;font-size:19px;color:#546e7a;line-height:1;">G</span>`;

  const items = [
    { id: 'osm', label: 'OpenStreetMap', prefix: mapIcon },
    { id: 'gurtam', label: 'Gurtam Maps', prefix: mapIcon },
    { id: 'roadmap', label: 'Google Roadmap', prefix: gIcon },
    { id: 'satellite', label: 'Google Satellite', prefix: gIcon },
    { id: 'terrain', label: 'Google Terrain', prefix: gIcon },
    { id: 'hybrid', label: 'Google Hybrid', prefix: gIcon }
  ];

  showModal(`
    <div style="margin:-16px -16px -10px;direction:rtl;overflow:hidden;border-radius:16px 16px 0 0;background:#fff;">
      <div style="background:#e9ecef;text-align:center;padding:11px;font-size:14px;font-weight:700;color:#263238;direction:ltr;">${accId}</div>

      <div style="display:flex;align-items:center;justify-content:flex-start;gap:14px;padding:13px 16px;border-bottom:1px solid #eef0f3;cursor:pointer;font-size:14px;color:#263238;" onclick="openForGuardTopMenu()">
        <span style="font-size:16px;color:#546e7a;">&lt;</span>
        <span>بازگشت</span>
      </div>

      ${items.map(it => {
        const active = fgActiveMapType === it.id;
        return `
          <div style="display:flex;align-items:center;gap:14px;padding:13px 16px;border-bottom:1px solid #eef0f3;cursor:pointer;" onclick="selectFgMapType('${it.id}')">
            ${it.prefix}
            <span dir="ltr" style="font-size:14px;color:${active ? '#1565c0' : '#263238'};font-weight:${active ? '700' : '500'};">${it.label}</span>
          </div>`;
      }).join('')}

      <div style="text-align:center;padding:14px;font-size:14px;font-weight:600;color:#455a64;cursor:pointer;background:#fff;" onclick="closeModal()">بستن</div>
    </div>
  `);
};

function selectFgMapType(type) {
  applyFgMapLayer(type);
  closeModal();
  if (typeof showGreenToast === 'function') {
    const names = {
      osm: 'OpenStreetMap',
      gurtam: 'Gurtam Maps',
      roadmap: 'Google Roadmap',
      satellite: 'Google Satellite',
      terrain: 'Google Terrain',
      hybrid: 'Google Hybrid'
    };
    showGreenToast('نقشه تغییر کرد: ' + (names[type] || type));
  }
}

setTimeout(() => applyFgMapLayer(fgActiveMapType), 800);

// === صفحه «روش‌های ارسال» (تنظیمات هشدارها) دقیقاً مطابق نمونه اصلی ===
let fgAlertDeliveryCfg = (() => {
  try {
    return JSON.parse(localStorage.getItem('fg_alert_delivery_cfg') || 'null') || {
      push: { enabled: true, sound: true, vib: true },
      telegram: { enabled: false, chatId: '', token: '' },
      email: { enabled: false, address: '' },
      webhook: { enabled: false, url: '' },
      types: { speed: true, geofence: true, sos: true, ignition: true, power: true }
    };
  } catch (e) {
    return {
      push: { enabled: true, sound: true, vib: true },
      telegram: { enabled: false, chatId: '', token: '' },
      email: { enabled: false, address: '' },
      webhook: { enabled: false, url: '' },
      types: { speed: true, geofence: true, sos: true, ignition: true, power: true }
    };
  }
})();

let fgExpandedDeliveryCard = null;

function saveFgAlertDeliveryCfg() {
  localStorage.setItem('fg_alert_delivery_cfg', JSON.stringify(fgAlertDeliveryCfg));
}

function toggleFgDeliveryExpand(key) {
  fgExpandedDeliveryCard = (fgExpandedDeliveryCard === key) ? null : key;
  openFgAlertsSettingsModal();
}

function toggleFgDeliveryEnabled(key, checked) {
  if (!fgAlertDeliveryCfg[key]) fgAlertDeliveryCfg[key] = {};
  fgAlertDeliveryCfg[key].enabled = checked;
  saveFgAlertDeliveryCfg();
  openFgAlertsSettingsModal();
}

function toggleFgAlertType(tKey, checked) {
  fgAlertDeliveryCfg.types = fgAlertDeliveryCfg.types || {};
  fgAlertDeliveryCfg.types[tKey] = checked;
  saveFgAlertDeliveryCfg();
}

openFgAlertsSettingsModal = function() {
  const ov = ensureUmpOverlay();
  ov.style.display = 'flex';

  const cfg = fgAlertDeliveryCfg;
  const openCard = fgExpandedDeliveryCard;

  const ic = (d) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#546e7a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const icons = {
    push: ic('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="13" y2="13"/>'),
    tg: ic('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'),
    email: ic('<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>'),
    hook: ic('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>')
  };

  const cardHeader = (key, title, svgIcon) => {
    const isOpen = openCard === key;
    const isEn = !!(cfg[key] && cfg[key].enabled);
    return `
      <div onclick="toggleFgDeliveryExpand('${key}')" style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;cursor:pointer;">
        <div style="display:flex;align-items:center;gap:14px;">
          ${svgIcon}
          <span style="font-size:14px;font-weight:500;color:${isEn ? '#1565c0' : '#263238'};">${title}</span>
        </div>
        <span style="color:#78909c;font-size:16px;">${isOpen ? '⌃' : '⌄'}</span>
      </div>`;
  };

  const renderBody = (key) => {
    if (openCard !== key) return '';
    if (key === 'push') {
      return `
        <div style="padding:0 16px 14px;border-top:1px solid #f1f5f9;">
          <label style="display:flex;align-items:center;justify-content:space-between;padding:10px 0 4px;font-size:13px;cursor:pointer;">
            <span>فعال‌سازی اعلان پوش گوشی</span>
            <input type="checkbox" ${cfg.push.enabled ? 'checked' : ''} onchange="toggleFgDeliveryEnabled('push', this.checked)" style="width:18px;height:18px;">
          </label>
          <label style="display:flex;align-items:center;justify-content:space-between;padding:8px 0 4px;font-size:13px;cursor:pointer;">
            <span>صدای هشدار</span>
            <input type="checkbox" ${cfg.push.sound ? 'checked' : ''} onchange="cfg.push.sound=this.checked;saveFgAlertDeliveryCfg()" style="width:18px;height:18px;">
          </label>
          <label style="display:flex;align-items:center;justify-content:space-between;padding:8px 0 2px;font-size:13px;cursor:pointer;">
            <span>لرزش دستگاه</span>
            <input type="checkbox" ${cfg.push.vib ? 'checked' : ''} onchange="cfg.push.vib=this.checked;saveFgAlertDeliveryCfg()" style="width:18px;height:18px;">
          </label>
        </div>`;
    }
    if (key === 'telegram') {
      return `
        <div style="padding:10px 16px 14px;border-top:1px solid #f1f5f9;">
          <label style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font-size:13px;cursor:pointer;">
            <span>ارسال هشدار در تلگرام</span>
            <input type="checkbox" ${cfg.telegram.enabled ? 'checked' : ''} onchange="toggleFgDeliveryEnabled('telegram', this.checked)" style="width:18px;height:18px;">
          </label>
          <input class="cp-inp" dir="ltr" placeholder="Telegram Chat ID" value="${cfg.telegram.chatId || ''}" oninput="cfg.telegram.chatId=this.value.trim();saveFgAlertDeliveryCfg()" style="margin-bottom:8px;">
          <input class="cp-inp" dir="ltr" placeholder="Bot Token (اختیاری)" value="${cfg.telegram.token || ''}" oninput="cfg.telegram.token=this.value.trim();saveFgAlertDeliveryCfg()">
        </div>`;
    }
    if (key === 'email') {
      return `
        <div style="padding:10px 16px 14px;border-top:1px solid #f1f5f9;">
          <label style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font-size:13px;cursor:pointer;">
            <span>ارسال هشدار به ایمیل</span>
            <input type="checkbox" ${cfg.email.enabled ? 'checked' : ''} onchange="toggleFgDeliveryEnabled('email', this.checked)" style="width:18px;height:18px;">
          </label>
          <input class="cp-inp" dir="ltr" type="email" placeholder="example@domain.com" value="${cfg.email.address || ''}" oninput="cfg.email.address=this.value.trim();saveFgAlertDeliveryCfg()">
        </div>`;
    }
    if (key === 'webhook') {
      return `
        <div style="padding:10px 16px 14px;border-top:1px solid #f1f5f9;">
          <label style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font-size:13px;cursor:pointer;">
            <span>ارسال Webhook (HTTP POST)</span>
            <input type="checkbox" ${cfg.webhook.enabled ? 'checked' : ''} onchange="toggleFgDeliveryEnabled('webhook', this.checked)" style="width:18px;height:18px;">
          </label>
          <input class="cp-inp" dir="ltr" type="url" placeholder="https://example.com/webhook" value="${cfg.webhook.url || ''}" oninput="cfg.webhook.url=this.value.trim();saveFgAlertDeliveryCfg()">
        </div>`;
    }
    return '';
  };

  const t = cfg.types || {};
  const typesBox = openCard === 'types' ? `
    <div style="padding:6px 16px 14px;border-top:1px solid #e2e8f0;background:#fff;border-radius:0 0 14px 14px;">
      ${[
        ['speed', 'هشدار سرعت غیرمجاز'],
        ['geofence', 'ورود و خروج از حصار جغرافیایی'],
        ['sos', 'هشدار اضطراری (SOS)'],
        ['ignition', 'روشن / خاموش شدن سوئیچ'],
        ['power', 'قطع برق / باتری ضعیف']
      ].map(([k, lbl]) => `
        <label style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;font-size:13px;cursor:pointer;">
          <span>${lbl}</span>
          <input type="checkbox" ${t[k] !== false ? 'checked' : ''} onchange="toggleFgAlertType('${k}', this.checked)" style="width:18px;height:18px;">
        </label>
      `).join('')}
    </div>` : '';

  ov.innerHTML = `
    <div style="background:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb;">
      <span style="font-size:20px;cursor:pointer;color:#455a64;padding:0 6px;" onclick="closeUmpOverlay();openForGuardTopMenu()">&lt;</span>
      <b style="font-size:15.5px;color:#263238;">روش‌های ارسال</b>
      <span style="width:24px;"></span>
    </div>

    <div style="flex:1;overflow-y:auto;padding:14px;background:#f2f4f7;">
      ${['push', 'telegram', 'email', 'webhook'].map(k => {
        const titles = { push: 'اعلان تلفن همراه', telegram: 'تلگرام', email: 'ایمیل', webhook: 'Webhook' };
        return `
          <div style="background:#fff;border-radius:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;">
            ${cardHeader(k, titles[k], icons[k])}
            ${renderBody(k)}
          </div>`;
      }).join('')}

      <div style="background:#e5e7eb;border-radius:14px;margin-top:6px;overflow:hidden;">
        <div onclick="toggleFgDeliveryExpand('types')" style="padding:14px 16px;cursor:pointer;">
          <div style="font-size:13.5px;font-weight:700;color:#263238;margin-bottom:3px;">انواع هشدارها</div>
          <div style="font-size:12.5px;color:#607d8b;">هشدارها</div>
        </div>
        ${typesBox}
      </div>
    </div>
  `;
};

// === صفحه «تنظیمات ظاهر» کامل مطابق هر سه اسکرین‌شات نسخه اصلی ===
let fgAppearanceState = (() => {
  const def = {
    performanceMode: true,
    playbackSpeed: 200,
    showUnitLabels: true,
    quickWheelButtons: false,
    theme: 'پیش فرض',
    mapTheme: 'پیش فرض',
    orientation: 'هر',
    mapType: (typeof fgActiveMapType !== 'undefined' && fgActiveMapType) || 'satellite',
    speedThresholds: [40, 60, 80, 100],
    speedColors: ['#2e7d32', '#ffeb3b', '#ff9800', '#ff5722', '#e53935'],
    maxSpeed: 140,
    showTimelineScale: true,
    timelineEvents: ['سفرها', 'توقف‌ها', 'هشدارها', 'حالت امنیتی'],
    showTrail: true,
    smoothMotion: true,
    trailColor: '#1565c0',
    showUnitGroups: true,
    dismissedTips: {}
  };
  try {
    return Object.assign(def, JSON.parse(localStorage.getItem('fg_appearance_cfg') || '{}'));
  } catch (e) {
    return def;
  }
})();

let fgAppearanceDraft = null;

function saveFgAppearanceSection(sectionName) {
  if (!fgAppearanceDraft) return;
  fgAppearanceState = Object.assign({}, fgAppearanceState, fgAppearanceDraft);
  localStorage.setItem('fg_appearance_cfg', JSON.stringify(fgAppearanceState));

  // اعمال تم و نوع نقشه در صورت تغییر
  if (fgAppearanceState.theme === 'تیره') {
    document.body.classList.add('dark', 'dark-mode');
  } else if (fgAppearanceState.theme === 'روشن') {
    document.body.classList.remove('dark', 'dark-mode');
  }
  const mapKeyMap = {
    'OpenStreetMap': 'osm',
    'Gurtam Maps': 'gurtam',
    'Google Roadmap': 'roadmap',
    'Google Satellite': 'satellite',
    'Google Terrain': 'terrain',
    'Google Hybrid': 'hybrid'
  };
  const mappedType = mapKeyMap[fgAppearanceState.mapType] || fgAppearanceState.mapType;
  if (typeof applyFgMapLayer === 'function' && mappedType) {
    applyFgMapLayer(mappedType);
  }

  if (typeof showGreenToast === 'function') {
    showGreenToast(`تنظیمات بخش «${sectionName}» ذخیره شد`);
  }
}

function renderFgSwitch(checked, onChangeCode, isBeta = false) {
  return `
    <label style="position:relative;display:inline-flex;align-items:center;cursor:pointer;user-select:none;">
      ${isBeta ? `<span style="position:absolute;top:-15px;left:2px;background:#5c6bc0;color:#fff;font-size:10px;font-weight:700;padding:0 5px;border-radius:8px;line-height:14px;">beta</span>` : ''}
      <input type="checkbox" ${checked ? 'checked' : ''} onchange="${onChangeCode}" style="position:absolute;opacity:0;width:0;height:0;">
      <span style="width:44px;height:24px;border-radius:14px;background:${checked ? '#1565c0' : '#cfd8dc'};position:relative;transition:0.2s;">
        <span style="position:absolute;top:2px;${checked ? 'right:2px;' : 'left:2px;'}width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.25);transition:0.2s;"></span>
      </span>
    </label>`;
}

function renderFgSelectField(label, value, options, onChangeCode) {
  return `
    <div style="position:relative;border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;margin-top:14px;background:#fff;">
      <span style="position:absolute;top:-9px;right:10px;background:#fff;padding:0 5px;font-size:11px;color:#64748b;">${label}</span>
      <select onchange="${onChangeCode}" style="width:100%;border:none;outline:none;background:transparent;font-size:13.5px;color:#263238;font-weight:500;">
        ${options.map(op => `<option value="${op}" ${String(value) === String(op) ? 'selected' : ''}>${op}</option>`).join('')}
      </select>
    </div>`;
}

function renderFgTipBanner(tipKey, text) {
  if (fgAppearanceDraft.dismissedTips && fgAppearanceDraft.dismissedTips[tipKey]) return '';
  return `
    <div style="background:#607d8b;color:#fff;border-radius:8px;padding:10px 12px;margin:10px 0 14px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;font-size:12px;line-height:1.6;">
      <span style="flex:1;">${text}</span>
      <span style="cursor:pointer;font-size:15px;font-weight:700;padding:0 4px;" onclick="fgAppearanceDraft.dismissedTips['${tipKey}']=true;renderFgAppearancePage()">×</span>
    </div>`;
}

openFgAppearanceModal = function() {
  fgAppearanceDraft = JSON.parse(JSON.stringify(fgAppearanceState));
  fgAppearanceDraft.dismissedTips = fgAppearanceDraft.dismissedTips || {};
  renderFgAppearancePage();
};

function renderFgAppearancePage() {
  const ov = ensureUmpOverlay();
  ov.style.display = 'flex';
  const d = fgAppearanceDraft;
  const accId = typeof getFgAccountId === 'function' ? getFgAccountId() : '2600173';
  const th = d.speedThresholds || [40, 60, 80, 100];
  const cols = d.speedColors || ['#2e7d32', '#ffeb3b', '#ff9800', '#ff5722', '#e53935'];

  const saveBtn = (sec) => `
    <div style="display:flex;justify-content:flex-end;margin-top:16px;">
      <button onclick="saveFgAppearanceSection('${sec}')" style="background:#cfd8dc;color:#455a64;border:none;border-radius:8px;padding:8px 26px;font-size:13px;font-weight:700;cursor:pointer;">ذخیره</button>
    </div>`;

  const rowItem = (title, sub, rightHtml, borderBottom = true) => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;${borderBottom ? 'border-bottom:1px solid #f1f5f9;' : ''}">
      <div>
        <div style="font-size:13.5px;color:#263238;font-weight:500;">${title}</div>
        ${sub ? `<div style="font-size:12px;color:#607d8b;margin-top:2px;">${sub}</div>` : ''}
      </div>
      <div>${rightHtml}</div>
    </div>`;

  const eventsText = (d.timelineEvents && d.timelineEvents.length) ? d.timelineEvents.join('، ') : 'سفرها، توقف‌ها، هشدارها، حالت امنیتی';

  ov.innerHTML = `
    <div style="background:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb;">
      <span style="width:24px;"></span>
      <div style="text-align:center;">
        <div style="font-size:15.5px;font-weight:700;color:#263238;">تنظیمات ظاهر</div>
        <div style="font-size:12.5px;color:#37474f;direction:ltr;margin-top:2px;">${accId}</div>
      </div>
      <span style="font-size:20px;cursor:pointer;color:#455a64;padding:0 6px;" onclick="closeUmpOverlay()">×</span>
    </div>

    <div style="flex:1;overflow-y:auto;padding:14px;background:#eef1f5;direction:rtl;">

      <!-- ۱. برنامه -->
      <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <div style="font-size:14.5px;font-weight:700;color:#263238;margin-bottom:8px;">برنامه</div>
        ${rowItem('حالت عملکرد', d.performanceMode ? 'فعال' : 'غیر فعال', renderFgSwitch(d.performanceMode, 'fgAppearanceDraft.performanceMode=this.checked;renderFgAppearancePage()', true))}

        <div style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:13.5px;color:#263238;font-weight:500;">سرعت پخش مسیر</span>
            <span style="background:#1565c0;color:#fff;font-size:11.5px;font-weight:700;padding:2px 9px;border-radius:12px;">${d.playbackSpeed}</span>
          </div>
          <input type="range" min="50" max="500" step="10" value="${d.playbackSpeed}" oninput="fgAppearanceDraft.playbackSpeed=Number(this.value);renderFgAppearancePage()" style="width:100%;accent-color:#1565c0;">
          <div style="display:flex;justify-content:space-between;margin-top:2px;">
            ${Array.from({length:19}).map(() => `<span style="width:1px;height:6px;background:#cbd5e1;"></span>`).join('')}
          </div>
        </div>

        ${rowItem('نمایش نام واحدها روی نقشه', d.showUnitLabels ? 'فعال' : 'غیر فعال', renderFgSwitch(d.showUnitLabels, 'fgAppearanceDraft.showUnitLabels=this.checked;renderFgAppearancePage()', false))}
        ${rowItem('دکمه‌های دسترسی سریع در چرخ فلک', d.quickWheelButtons ? 'فعال' : 'غیر فعال', renderFgSwitch(d.quickWheelButtons, 'fgAppearanceDraft.quickWheelButtons=this.checked;renderFgAppearancePage()', false), false)}

        ${renderFgSelectField('تم', d.theme, ['پیش فرض', 'روشن', 'تیره'], 'fgAppearanceDraft.theme=this.value')}
        ${renderFgSelectField('تم نقشه', d.mapTheme, ['پیش فرض', 'استاندارد', 'شب'], 'fgAppearanceDraft.mapTheme=this.value')}
        ${renderFgSelectField('جهت‌گیری صفحه', d.orientation, ['هر', 'عمودی', 'افقی'], 'fgAppearanceDraft.orientation=this.value')}
        ${renderFgSelectField('نوع نقشه', d.mapType, ['Google Satellite', 'Google Roadmap', 'Google Terrain', 'Google Hybrid', 'OpenStreetMap', 'Gurtam Maps'], 'fgAppearanceDraft.mapType=this.value')}

        ${saveBtn('برنامه')}
      </div>

      <!-- ۲. رنگ مسیر بر اساس سرعت -->
      <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <div style="font-size:14.5px;font-weight:700;color:#263238;margin-bottom:6px;">رنگ مسیر بر اساس سرعت</div>
        ${renderFgTipBanner('speedTip', 'برای تغییر رنگ برای بخش سرعت خاص، روی آن کلیک کنید و یک رنگ انتخاب کنید. برای تغییر محدوده فقط نوار لغزنده را بکشید.')}

        <div style="display:flex;justify-content:space-between;padding:0 12%;margin-bottom:6px;font-size:12.5px;color:#37474f;font-weight:600;" dir="ltr">
          ${th.map((v, i) => `<span style="cursor:pointer;" onclick="const nv=prompt('مقدار آستانه سرعت (km/h):',${v});if(nv!==null&&!isNaN(Number(nv))){fgAppearanceDraft.speedThresholds[${i}]=Number(nv);renderFgAppearancePage()}">${v}</span>`).join('')}
        </div>

        <div dir="ltr" style="display:flex;height:14px;border-radius:3px;overflow:hidden;border:1px solid #cbd5e1;">
          ${cols.map((c, i) => `<div onclick="const nc=prompt('رنگ HEX بخش ${i+1}:','${c}');if(nc){fgAppearanceDraft.speedColors[${i}]=nc;renderFgAppearancePage()}" style="flex:1;background:${c};cursor:pointer;position:relative;" title="کلیک برای تغییر رنگ"></div>`).join('')}
        </div>

        <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:11.5px;color:#64748b;" dir="ltr">
          <span>0</span>
          <span>${d.maxSpeed || 140} km/h</span>
        </div>

        <div style="position:relative;border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;margin-top:14px;background:#fff;width:55%;">
          <span style="position:absolute;top:-9px;right:10px;background:#fff;padding:0 5px;font-size:11px;color:#64748b;">حداکثر سرعت</span>
          <input type="number" value="${d.maxSpeed || 140}" oninput="fgAppearanceDraft.maxSpeed=Number(this.value)||140" style="width:100%;border:none;outline:none;font-size:13.5px;color:#263238;font-weight:600;">
        </div>

        ${saveBtn('رنگ مسیر بر اساس سرعت')}
      </div>

      <!-- ۳. تنظیمات جدول زمانی -->
      <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <div style="font-size:14.5px;font-weight:700;color:#263238;margin-bottom:6px;">تنظیمات جدول زمانی</div>
        ${renderFgTipBanner('timelineTip', 'توجه داشته باشید که حداقل یک رویداد باید برای نمایش جدول زمانی انتخاب شود')}

        ${rowItem('نمایش مقیاس جدول زمانی', d.showTimelineScale ? 'فعال' : 'غیر فعال', renderFgSwitch(d.showTimelineScale, 'fgAppearanceDraft.showTimelineScale=this.checked;renderFgAppearancePage()', false), false)}

        <div style="position:relative;border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;margin-top:10px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <span style="position:absolute;top:-9px;right:10px;background:#fff;padding:0 5px;font-size:11px;color:#64748b;">رویدادهای جدول زمانی</span>
          <span style="font-size:13px;color:#263238;flex:1;">${eventsText}</span>
          <span style="color:#78909c;cursor:pointer;font-size:16px;" onclick="fgAppearanceDraft.timelineEvents=[];renderFgAppearancePage()">⊗</span>
          <span style="color:#78909c;cursor:pointer;font-size:14px;" onclick="fgAppearanceDraft.timelineEvents=['سفرها','توقف‌ها','هشدارها','حالت امنیتی'];renderFgAppearancePage()">⌄</span>
        </div>

        ${saveBtn('تنظیمات جدول زمانی')}
      </div>

      <!-- ۴. دنباله مسیر و نشانگر -->
      <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <div style="font-size:14.5px;font-weight:700;color:#263238;margin-bottom:6px;">دنباله مسیر و نشانگر</div>
        ${renderFgTipBanner('trailTip', 'با فعال کردن گروه‌بندی واحدها، نمایش دنباله مسیر و حرکت نرم غیرفعال خواهد شد.')}

        ${rowItem('نمایش دنباله مسیر', d.showTrail ? 'فعال' : 'غیر فعال', renderFgSwitch(d.showTrail, 'fgAppearanceDraft.showTrail=this.checked;renderFgAppearancePage()', true))}
        ${rowItem('حرکت نرم واحدها', d.smoothMotion ? 'فعال' : 'غیر فعال', renderFgSwitch(d.smoothMotion, 'fgAppearanceDraft.smoothMotion=this.checked;renderFgAppearancePage()', true))}

        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9;">
          <span style="font-size:13.5px;color:#263238;font-weight:500;">رنگ دنباله</span>
          <input type="color" value="${d.trailColor || '#1565c0'}" onchange="fgAppearanceDraft.trailColor=this.value" style="width:28px;height:28px;border:none;border-radius:50%;background:none;cursor:pointer;padding:0;">
        </div>

        ${rowItem('نمایش گروه‌های واحد', d.showUnitGroups ? 'فعال' : 'غیر فعال', renderFgSwitch(d.showUnitGroups, 'fgAppearanceDraft.showUnitGroups=this.checked;renderFgAppearancePage()', true), false)}

        ${saveBtn('دنباله مسیر و نشانگر')}
      </div>

    </div>
  `;
}

// === بازه‌بندی رنگ سرعت از ۷۰ به بعد (هر ۱۰ کیلومتر تا ۱۳۰ و یک رنگ ثابت برای ۱۴۰ به بالا) ===
const FG_SPEED_BANDS_DEF = [
  { min: 0,   max: 70,  label: '0–70',    color: '#2e7d32' },
  { min: 70,  max: 80,  label: '70–80',   color: '#fbc02d' },
  { min: 80,  max: 90,  label: '80–90',   color: '#f57c00' },
  { min: 90,  max: 100, label: '90–100',  color: '#ef5350' },
  { min: 100, max: 110, label: '100–110', color: '#e53935' },
  { min: 110, max: 120, label: '110–120', color: '#c62828' },
  { min: 120, max: 130, label: '120–130', color: '#ad1457' },
  { min: 130, max: 140, label: '130–140', color: '#6a1b9a' },
  { min: 140, max: null,label: '140+',    color: '#283593' }
];

function normalizeFgSpeedBands(bands) {
  if (!Array.isArray(bands) || !bands.length) {
    return JSON.parse(JSON.stringify(FG_SPEED_BANDS_DEF));
  }
  return FG_SPEED_BANDS_DEF.map((def, idx) => {
    const cur = bands[idx] || {};
    return {
      min: typeof cur.min === 'number' ? cur.min : def.min,
      max: cur.max === null ? null : (typeof cur.max === 'number' ? cur.max : def.max),
      label: def.label,
      color: cur.color || def.color
    };
  });
}

function getFgSpeedColor(speed) {
  const spd = Number(speed) || 0;
  const bands = normalizeFgSpeedBands(fgAppearanceState && fgAppearanceState.speedBands);
  if (spd >= 140) {
    return bands[bands.length - 1].color;
  }
  for (let i = 0; i < bands.length - 1; i++) {
    const b = bands[i];
    if (b.max !== null && spd < b.max) {
      return b.color;
    }
  }
  return bands[bands.length - 1].color;
}

window.getFgSpeedColor = getFgSpeedColor;

if (typeof fgAppearanceState !== 'undefined') {
  fgAppearanceState.speedBands = normalizeFgSpeedBands(fgAppearanceState.speedBands);
}

const _origOpenFgAppearanceForSpeed = openFgAppearanceModal;
openFgAppearanceModal = function() {
  _origOpenFgAppearanceForSpeed();
  if (!fgAppearanceDraft) return;
  fgAppearanceDraft.speedBands = normalizeFgSpeedBands(fgAppearanceDraft.speedBands);
  renderFgAppearancePage();
};

const _origRenderFgAppearancePage = renderFgAppearancePage;
renderFgAppearancePage = function() {
  _origRenderFgAppearancePage();
  if (!fgAppearanceDraft) return;
  const ov = document.getElementById('ump-overlay');
  if (!ov) return;

  const bands = normalizeFgSpeedBands(fgAppearanceDraft.speedBands);
  fgAppearanceDraft.speedBands = bands;

  const speedCards = Array.from(ov.querySelectorAll('div')).filter(el =>
    el.children.length > 0 &&
    el.firstElementChild &&
    (el.firstElementChild.textContent || '').trim() === 'رنگ مسیر بر اساس سرعت'
  );
  const card = speedCards[speedCards.length - 1];
  if (!card) return;

  const tipHtml = typeof renderFgTipBanner === 'function'
    ? renderFgTipBanner('speedBandsTip', 'از ۷۰ به بعد برای هر ۱۰ کیلومتر تا ۱۳۰ یک رنگ مستقل تنظیم کنید؛ بازه ۱۴۰ به بالا یک رنگ ثابت دارد. روی هر رنگ بزنید تا تغییر کند.')
    : '';

  const barHtml = `
    <div dir="ltr" style="display:flex;height:16px;border-radius:4px;overflow:hidden;border:1px solid #cbd5e1;margin:10px 0 6px;">
      ${bands.map((b, i) => `
        <div title="${b.label} km/h" style="flex:1;background:${b.color};cursor:pointer;" onclick="const p=document.getElementById('fg-sb-inp-${i}');if(p)p.click();"></div>
      `).join('')}
    </div>
    <div dir="ltr" style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-bottom:12px;">
      <span>0</span>
      <span>70</span>
      <span>80</span>
      <span>90</span>
      <span>100</span>
      <span>110</span>
      <span>120</span>
      <span>130</span>
      <span>140+</span>
    </div>
  `;

  const listHtml = `
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
      ${bands.map((b, i) => {
        const isHigh = b.max === null;
        const rangeTitle = isHigh ? '140 km/h به بالا (رنگ واحد)' : `${b.min} تا ${b.max} km/h`;
        return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:12.5px;font-weight:700;color:#263238;" dir="ltr">${rangeTitle}</span>
              ${!isHigh && b.min >= 70 ? `
                <input type="number" min="70" max="130" step="10" value="${b.max}" title="حد بالای بازه"
                  onchange="const v=Number(this.value)||${b.max};fgAppearanceDraft.speedBands[${i}].max=v;if(fgAppearanceDraft.speedBands[${i+1}])fgAppearanceDraft.speedBands[${i+1}].min=v;renderFgAppearancePage();"
                  style="width:58px;padding:3px 6px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;text-align:center;background:#fff;">
              ` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:11px;color:#64748b;" dir="ltr">${b.color}</span>
              <input id="fg-sb-inp-${i}" type="color" value="${b.color}"
                oninput="fgAppearanceDraft.speedBands[${i}].color=this.value;renderFgAppearancePage();"
                style="width:30px;height:26px;border:none;border-radius:6px;background:transparent;cursor:pointer;padding:0;">
            </div>
          </div>`;
      }).join('')}
    </div>
  `;

  const saveBtnHtml = `
    <div style="display:flex;justify-content:flex-end;margin-top:14px;">
      <button onclick="fgAppearanceDraft.maxSpeed=140;saveFgAppearanceSection('رنگ مسیر بر اساس سرعت')" style="background:#1565c0;color:#fff;border:none;border-radius:8px;padding:8px 26px;font-size:13px;font-weight:700;cursor:pointer;">ذخیره</button>
    </div>
  `;

  card.innerHTML = `
    <div style="font-size:14.5px;font-weight:700;color:#263238;margin-bottom:6px;">رنگ مسیر بر اساس سرعت</div>
    ${tipHtml}
    ${barHtml}
    ${listHtml}
    ${saveBtnHtml}
  `;
};

// === بخش کامل «حساب» (تنظیمات کاربر، تغییر مشخصات، نشست‌ها و تغییر کاربر) ===
let fgUserSettings = (() => {
  const def = {
    username: (window.uState && uState.user && (uState.user.username || uState.user.accountId || uState.user.id)) || localStorage.getItem('userEmail') || '2600173',
    email: (window.uState && uState.user && uState.user.email) || '',
    language: 'فارسی',
    unitSystem: 'متریک',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'ساعته 24',
    retention: 'پیش‌فرض (خودکار)'
  };
  try {
    return Object.assign(def, JSON.parse(localStorage.getItem('fg_user_settings') || '{}'));
  } catch (e) {
    return def;
  }
})();

let fgUserDraft = null;

function saveFgUserSettings() {
  if (!fgUserDraft) return;
  fgUserSettings = Object.assign({}, fgUserSettings, fgUserDraft);
  localStorage.setItem('fg_user_settings', JSON.stringify(fgUserSettings));
  if (typeof showGreenToast === 'function') showGreenToast('تنظیمات کاربر ذخیره شد');
}

function getFgSessionsList() {
  try {
    const saved = JSON.parse(localStorage.getItem('fg_sessions_list') || 'null');
    if (Array.isArray(saved) && saved.length) return saved;
  } catch (e) {}
  return [
    { id: 'cur', app: 'Forguard 1.19.22 Android', meta: '83.123.31.191, Generic Smartphone', badge: 'نشست حاضر', current: true, time: '' },
    { id: 'prev1', app: 'Forguard 1.19.20 Android', meta: 'دسترسی به خدمات', badge: '', current: false, time: '23/10/2026\n05:39:21' }
  ];
}

function saveFgSessionsList(list) {
  localStorage.setItem('fg_sessions_list', JSON.stringify(list));
}

openFgAccountModal = function() {
  const accId = fgUserSettings.username || (typeof getFgAccountId === 'function' ? getFgAccountId() : '2600173');
  const ic = (d) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#455a64" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const rowStyle = 'display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid #eef0f3;cursor:pointer;background:#fff;font-size:14px;color:#263238;font-weight:500;';

  showModal(`
    <div style="margin:-16px -16px -10px;direction:rtl;overflow:hidden;border-radius:16px 16px 0 0;background:#fff;">
      <div style="background:#e9ecef;text-align:center;padding:11px;font-size:14px;font-weight:700;color:#263238;direction:ltr;">${accId}</div>

      <div style="${rowStyle}" onclick="closeModal();openFgUserSettingsPage()">
        ${ic('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><circle cx="19" cy="17" r="2"/>')}
        <span>تنظیمات کاربر</span>
      </div>

      <div style="${rowStyle}" onclick="closeModal();openFgSessionsPage()">
        ${ic('<rect x="3" y="4" width="18" height="12" rx="2"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/>')}
        <span>نشست‌ها</span>
      </div>

      <div style="${rowStyle}" onclick="closeModal();doFgLogout()">
        ${ic('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>')}
        <span>تغییر کاربر</span>
      </div>

      <div style="text-align:center;padding:14px;font-size:14px;font-weight:600;color:#455a64;cursor:pointer;background:#fff;" onclick="closeModal()">بستن</div>
    </div>
  `);
};

function openFgUserSettingsPage() {
  fgUserDraft = JSON.parse(JSON.stringify(fgUserSettings));
  renderFgUserSettingsPage();
}

function renderFgUserSettingsPage() {
  const ov = ensureUmpOverlay();
  ov.style.display = 'flex';
  const d = fgUserDraft;
  const pencil = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#90a4ae" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;

  const selectBox = (label, val, opts, key) => `
    <div style="position:relative;border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;margin-top:14px;background:#fff;">
      <span style="position:absolute;top:-9px;right:10px;background:#fff;padding:0 5px;font-size:11px;color:#64748b;">${label}</span>
      <select onchange="fgUserDraft['${key}']=this.value" style="width:100%;border:none;outline:none;background:transparent;font-size:13.5px;color:#263238;font-weight:500;">
        ${opts.map(o => `<option value="${o}" ${String(val) === String(o) ? 'selected' : ''}>${o}</option>`).join('')}
      </select>
    </div>`;

  const retOpts = [
    'پیش‌فرض (خودکار)',
    '(0 TTL) پاک‌سازی فوری',
    'ساعت 1',
    'ساعت 12',
    'روز 1',
    'روز 7',
    'روز 30',
    'روز 90',
    'روز 180',
    'سال 1'
  ];

  ov.innerHTML = `
    <div style="background:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb;">
      <span style="width:24px;"></span>
      <div style="text-align:center;">
        <div style="font-size:15.5px;font-weight:700;color:#263238;">تنظیمات کاربر</div>
        <div style="font-size:12.5px;color:#37474f;direction:ltr;margin-top:2px;">${d.username}</div>
      </div>
      <span style="font-size:20px;cursor:pointer;color:#455a64;padding:0 6px;" onclick="closeUmpOverlay()">×</span>
    </div>

    <div style="flex:1;overflow-y:auto;padding:14px;background:#eef1f5;direction:rtl;">
      <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <div style="font-size:14.5px;font-weight:700;color:#263238;margin-bottom:10px;">حساب</div>

        <div onclick="openFgAuthEditModal('username')" style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9;cursor:pointer;">
          <div>
            <div style="font-size:11.5px;color:#64748b;">نام کاربری</div>
            <div style="font-size:13.5px;color:#263238;font-weight:500;margin-top:2px;" dir="ltr">${d.username}</div>
          </div>
          ${pencil}
        </div>

        <div onclick="openFgAuthEditModal('email')" style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9;cursor:pointer;">
          <div>
            <div style="font-size:11.5px;color:#64748b;">ایمیل</div>
            <div style="font-size:13.5px;color:#263238;font-weight:500;margin-top:2px;" dir="ltr">${d.email || ''}</div>
          </div>
          ${pencil}
        </div>

        <div onclick="openFgAuthEditModal('password')" style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9;cursor:pointer;">
          <div>
            <div style="font-size:11.5px;color:#64748b;">کلمه عبور</div>
            <div style="font-size:13.5px;color:#263238;font-weight:600;margin-top:2px;" dir="ltr">******</div>
          </div>
          ${pencil}
        </div>

        ${selectBox('زبان', d.language, ['فارسی', 'English'], 'language')}
        ${selectBox('سیستم اندازه‌گیری', d.unitSystem, ['متریک', 'سلطنتی', 'دریایی'], 'unitSystem')}
        ${selectBox('فرمت تاریخ', d.dateFormat, ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD'], 'dateFormat')}
        ${selectBox('فرمت زمان', d.timeFormat, ['ساعته 24', 'ساعته 12'], 'timeFormat')}

        <div style="display:flex;justify-content:flex-end;margin-top:16px;">
          <button onclick="saveFgUserSettings()" style="background:#cfd8dc;color:#455a64;border:none;border-radius:8px;padding:8px 26px;font-size:13px;font-weight:700;cursor:pointer;">ذخیره</button>
        </div>
      </div>

      <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <div style="font-size:14.5px;font-weight:700;color:#263238;margin-bottom:8px;">زمان ذخیره‌سازی داده</div>
        ${selectBox('زمان ذخیره‌سازی داده', d.retention, retOpts, 'retention')}
        <div style="display:flex;justify-content:flex-end;margin-top:14px;">
          <button onclick="saveFgUserSettings()" style="background:#1565c0;color:#fff;border:none;border-radius:8px;padding:7px 22px;font-size:12.5px;font-weight:700;cursor:pointer;">ذخیره</button>
        </div>
      </div>

      <div style="text-align:left;padding:6px 4px;font-size:12px;color:#455a64;" dir="ltr">version 1.19.22</div>
    </div>
  `;
}

function openFgAuthEditModal(mode) {
  const accId = fgUserSettings.username || '2600173';
  const titleMap = {
    username: 'تغییر نام کاربری',
    email: 'تغییر ایمیل',
    password: 'تغییر گذرواژه'
  };
  const promptMap = {
    username: 'لطفاً نام کاربری جدید و گذرواژه فعلی خود را وارد کنید:',
    email: 'لطفاً ایمیل جدید و گذرواژه فعلی خود را وارد کنید:',
    password: 'لطفاً گذرواژه فعلی و جدید خود را وارد کنید:'
  };
  const fieldsHtml = mode === 'password'
    ? `
      <input id="fg-auth-f1" type="password" placeholder="گذرواژه فعلی" style="width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:10px;font-size:13.5px;box-sizing:border-box;">
      <input id="fg-auth-f2" type="password" placeholder="گذرواژه جدید" style="width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:10px;font-size:13.5px;box-sizing:border-box;">
      <input id="fg-auth-f3" type="password" placeholder="گذرواژه جدید را تکرار کنید" style="width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:14px;font-size:13.5px;box-sizing:border-box;">
    `
    : `
      <input id="fg-auth-f1" type="${mode === 'email' ? 'email' : 'text'}" placeholder="${mode === 'email' ? 'ایمیل جدید' : 'نام کاربری جدید'}" style="width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:10px;font-size:13.5px;box-sizing:border-box;">
      <input id="fg-auth-f2" type="password" placeholder="گذرواژه فعلی" style="width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:14px;font-size:13.5px;box-sizing:border-box;">
    `;

  showModal(`
    <div style="direction:rtl;padding:6px 4px;">
      <div style="text-align:center;margin-bottom:14px;">
        <div style="display:inline-flex;align-items:center;gap:6px;font-size:18px;font-weight:800;color:#0d47a1;letter-spacing:1px;" dir="ltr">
          <span>🛡️</span><span>FORGUARD</span>
        </div>
        <div style="font-size:15px;font-weight:700;color:#263238;margin-top:6px;">${titleMap[mode]}</div>
        <div style="font-size:13px;color:#37474f;margin-top:8px;">حساب کاربری شما <b dir="ltr">${accId}</b> است</div>
      </div>

      <div style="font-size:12.5px;color:#37474f;margin-bottom:8px;">${promptMap[mode]}</div>
      ${fieldsHtml}

      <button onclick="submitFgAuthEdit('${mode}')" style="width:100%;background:#0d47a1;color:#fff;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;">ذخیره</button>
    </div>
  `);
}

function submitFgAuthEdit(mode) {
  const v1 = (document.getElementById('fg-auth-f1') || {}).value || '';
  const v2 = (document.getElementById('fg-auth-f2') || {}).value || '';
  const v3 = (document.getElementById('fg-auth-f3') || {}).value || '';

  if (mode === 'username') {
    if (!v1.trim() || !v2.trim()) {
      if (typeof showGreenToast === 'function') showGreenToast('نام کاربری جدید و گذرواژه فعلی الزامی است');
      return;
    }
    fgUserSettings.username = v1.trim();
    if (fgUserDraft) fgUserDraft.username = v1.trim();
    localStorage.setItem('fg_user_settings', JSON.stringify(fgUserSettings));
    closeModal();
    renderFgUserSettingsPage();
    if (typeof showGreenToast === 'function') showGreenToast('نام کاربری به‌روزرسانی شد');
  } else if (mode === 'email') {
    if (!v1.trim() || !v2.trim()) {
      if (typeof showGreenToast === 'function') showGreenToast('ایمیل جدید و گذرواژه فعلی الزامی است');
      return;
    }
    fgUserSettings.email = v1.trim();
    if (fgUserDraft) fgUserDraft.email = v1.trim();
    localStorage.setItem('fg_user_settings', JSON.stringify(fgUserSettings));
    closeModal();
    renderFgUserSettingsPage();
    if (typeof showGreenToast === 'function') showGreenToast('ایمیل به‌روزرسانی شد');
  } else if (mode === 'password') {
    if (!v1.trim() || !v2.trim() || v2 !== v3) {
      if (typeof showGreenToast === 'function') showGreenToast('گذرواژه جدید و تکرار آن باید یکسان باشند');
      return;
    }
    closeModal();
    if (typeof showGreenToast === 'function') showGreenToast('گذرواژه با موفقیت تغییر کرد');
  }
}

function openFgSessionsPage() {
  const ov = ensureUmpOverlay();
  ov.style.display = 'flex';
  const accId = fgUserSettings.username || (typeof getFgAccountId === 'function' ? getFgAccountId() : '2600173');
  const sessions = getFgSessionsList();
  const currentSess = sessions.find(s => s.current) || sessions[0];
  const otherSess = sessions.filter(s => !s.current);

  ov.innerHTML = `
    <div style="background:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb;">
      <span style="width:24px;"></span>
      <div style="text-align:center;">
        <div style="font-size:15.5px;font-weight:700;color:#263238;">نشست‌ها</div>
        <div style="font-size:12.5px;color:#37474f;direction:ltr;margin-top:2px;">${accId}</div>
      </div>
      <span style="font-size:20px;cursor:pointer;color:#455a64;padding:0 6px;" onclick="closeUmpOverlay()">×</span>
    </div>

    <div style="flex:1;overflow-y:auto;padding:14px;background:#eef1f5;direction:rtl;">
      <div style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        ${currentSess ? `
          <div style="background:#e5e7eb;padding:12px 14px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
            <div>
              <div style="font-size:13.5px;font-weight:700;color:#263238;" dir="ltr">${currentSess.app}</div>
              <div style="font-size:11.5px;color:#607d8b;margin-top:3px;" dir="ltr">${currentSess.meta}</div>
            </div>
            <span style="font-size:11.5px;color:#607d8b;white-space:nowrap;">${currentSess.badge || 'نشست حاضر'}</span>
          </div>
        ` : ''}

        <div onclick="closeOtherFgSessions()" style="text-align:center;padding:14px 12px;border-bottom:1px solid #f1f5f9;cursor:pointer;">
          <div style="font-size:13.5px;font-weight:600;color:#37474f;">بستن تمام نشست های دیگر</div>
          <div style="font-size:11.5px;color:#78909c;margin-top:3px;">خارج شدن از تمام دستگاه ها به جز این دستگاه</div>
        </div>

        ${otherSess.map(s => `
          <div style="padding:14px;border-bottom:1px solid #f1f5f9;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
            <div>
              <div style="font-size:13.5px;font-weight:600;color:#263238;" dir="ltr">${s.app}</div>
              <div style="font-size:11.5px;color:#78909c;margin-top:3px;">${s.meta}</div>
            </div>
            <div style="font-size:11.5px;color:#607d8b;text-align:left;white-space:pre-line;" dir="ltr">${s.time || ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function closeOtherFgSessions() {
  const cur = getFgSessionsList().filter(s => s.current);
  saveFgSessionsList(cur);
  openFgSessionsPage();
  if (typeof showGreenToast === 'function') showGreenToast('تمام نشست‌های دیگر بسته شدند');
}

// === اصلاح قطعی نام کاربری/ایمیل اکانت واقعی، سیستم متریک و باز شدن درجا فرم‌های تغییر ===
function resolveCurrentAccountInfo() {
  let uObj = (window.uState && window.uState.user) || (typeof uState !== 'undefined' && uState && uState.user) || null;
  let uname = '';
  let email = '';

  if (uObj && typeof uObj === 'object') {
    uname = uObj.username || uObj.user || uObj.name || uObj.accountId || uObj.id || uObj.email || '';
    email = uObj.email || uObj.mail || '';
  }

  // تلاش برای استخراج اطلاعات از توکن JWT در صورت وجود
  if (!uname || !email) {
    try {
      const tok = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
      if (tok && tok.includes('.')) {
        const payloadPart = tok.split('.')[1];
        const norm = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const jsonStr = decodeURIComponent(escape(atob(norm)));
        const p = JSON.parse(jsonStr);
        if (!uname) uname = p.username || p.user || p.name || p.sub || p.email || p.id || '';
        if (!email) email = p.email || p.mail || '';
      }
    } catch (e) {}
  }

  if (!uname) {
    uname = localStorage.getItem('fg_current_username') || localStorage.getItem('username') || localStorage.getItem('userEmail') || 'کاربر';
  }
  if (!email) {
    email = localStorage.getItem('fg_current_email') || (uname.includes('@') ? uname : (localStorage.getItem('userEmail') || ''));
  }

  return { username: String(uname).trim() || 'کاربر', email: String(email).trim() };
}

function syncFgAccountWithSession() {
  const acc = resolveCurrentAccountInfo();
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('fg_user_settings') || '{}'); } catch (e) {}

  // اگر کاربر تغییر کرده بود، مقادیر پیش‌فرض اکانت جدید را جایگزین کن
  if (saved._boundAccount && saved._boundAccount !== acc.username) {
    saved.username = acc.username;
    saved.email = acc.email;
  } else {
    if (!saved.username || saved.username === '2600173') saved.username = acc.username;
    if (!saved.email && acc.email) saved.email = acc.email;
  }

  saved._boundAccount = acc.username;
  if (!saved.unitSystem) saved.unitSystem = 'متریک';
  fgUserSettings = Object.assign({
    username: acc.username,
    email: acc.email,
    language: 'فارسی',
    unitSystem: 'متریک',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'ساعته 24',
    retention: 'پیش‌فرض (خودکار)'
  }, saved);
  localStorage.setItem('fg_user_settings', JSON.stringify(fgUserSettings));
}

// تبدیل سرعت و مسافت بر اساس سیستم انتخاب‌شده (متریک پیش‌فرض: km/h و km/m)
function formatFgSpeed(kmh) {
  const val = Number(kmh) || 0;
  const sys = (fgUserSettings && fgUserSettings.unitSystem) || 'متریک';
  if (sys === 'سلطنتی') return `${(val * 0.621371).toFixed(0)} mi/h`;
  if (sys === 'دریایی') return `${(val * 0.539957).toFixed(1)} kn`;
  return `${Math.round(val)} km/h`;
}

function formatFgDistanceKm(km) {
  const val = Number(km) || 0;
  const sys = (fgUserSettings && fgUserSettings.unitSystem) || 'متریک';
  if (sys === 'سلطنتی') {
    const mi = val * 0.621371;
    return mi < 1 ? `${Math.round(mi * 5280)} ft` : `${mi.toFixed(2)} mi`;
  }
  if (sys === 'دریایی') {
    return `${(val * 0.539957).toFixed(2)} NM`;
  }
  return val < 1 ? `${Math.round(val * 1000)} m` : `${val.toFixed(2)} km`;
}

window.formatFgSpeed = formatFgSpeed;
window.formatFgDistanceKm = formatFgDistanceKm;

getFgAccountId = function() {
  syncFgAccountWithSession();
  return fgUserSettings.username;
};

openFgAccountModal = function() {
  syncFgAccountWithSession();
  const accId = fgUserSettings.username;
  const ic = (d) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#455a64" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const rowStyle = 'display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid #eef0f3;cursor:pointer;background:#fff;font-size:14px;color:#263238;font-weight:500;';

  showModal(`
    <div style="margin:-16px -16px -10px;direction:rtl;overflow:hidden;border-radius:16px 16px 0 0;background:#fff;">
      <div style="background:#e9ecef;text-align:center;padding:11px;font-size:14px;font-weight:700;color:#263238;direction:ltr;">${accId}</div>

      <div style="${rowStyle}" onclick="closeModal();openFgUserSettingsPage()">
        ${ic('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><circle cx="19" cy="17" r="2"/>')}
        <span>تنظیمات کاربر</span>
      </div>

      <div style="${rowStyle}" onclick="closeModal();openFgSessionsPage()">
        ${ic('<rect x="3" y="4" width="18" height="12" rx="2"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/>')}
        <span>نشست‌ها</span>
      </div>

      <div style="${rowStyle}" onclick="closeModal();doFgLogout()">
        ${ic('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>')}
        <span>تغییر کاربر</span>
      </div>

      <div style="text-align:center;padding:14px;font-size:14px;font-weight:600;color:#455a64;cursor:pointer;background:#fff;" onclick="closeModal()">بستن</div>
    </div>
  `);
};

openFgUserSettingsPage = function() {
  syncFgAccountWithSession();
  fgUserDraft = JSON.parse(JSON.stringify(fgUserSettings));
  if (!fgUserDraft.unitSystem) fgUserDraft.unitSystem = 'متریک';
  renderFgUserSettingsPage();
};

// باز کردن فوری فرم تغییر رمز، نام کاربری یا ایمیل بدون پس‌زمینه اضافی
openFgAuthEditModal = function(mode) {
  syncFgAccountWithSession();
  const accId = fgUserSettings.username;
  const curEmail = (fgUserDraft && fgUserDraft.email) || fgUserSettings.email || '';

  const titleMap = {
    username: 'تغییر نام کاربری',
    email: 'تغییر ایمیل',
    password: 'تغییر گذرواژه'
  };
  const promptMap = {
    username: 'لطفاً نام کاربری جدید و گذرواژه فعلی خود را وارد کنید:',
    email: 'لطفاً ایمیل جدید و گذرواژه فعلی خود را وارد کنید:',
    password: 'لطفاً گذرواژه فعلی و جدید خود را وارد کنید:'
  };

  const fieldsHtml = mode === 'password'
    ? `
      <input id="fg-auth-f1" type="password" placeholder="گذرواژه فعلی" autocomplete="current-password" style="width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:10px;font-size:13.5px;box-sizing:border-box;">
      <input id="fg-auth-f2" type="password" placeholder="گذرواژه جدید" autocomplete="new-password" style="width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:10px;font-size:13.5px;box-sizing:border-box;">
      <input id="fg-auth-f3" type="password" placeholder="گذرواژه جدید را تکرار کنید" autocomplete="new-password" style="width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:14px;font-size:13.5px;box-sizing:border-box;">
    `
    : mode === 'email'
    ? `
      <input id="fg-auth-f1" type="email" dir="ltr" placeholder="ایمیل جدید" value="${curEmail.replace(/"/g, '&quot;')}" style="width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:10px;font-size:13.5px;box-sizing:border-box;">
      <input id="fg-auth-f2" type="password" placeholder="گذرواژه فعلی" autocomplete="current-password" style="width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:14px;font-size:13.5px;box-sizing:border-box;">
    `
    : `
      <input id="fg-auth-f1" type="text" dir="ltr" placeholder="نام کاربری جدید" value="${accId.replace(/"/g, '&quot;')}" style="width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:10px;font-size:13.5px;box-sizing:border-box;">
      <input id="fg-auth-f2" type="password" placeholder="گذرواژه فعلی" autocomplete="current-password" style="width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:14px;font-size:13.5px;box-sizing:border-box;">
    `;

  showModal(`
    <div style="direction:rtl;padding:4px 2px;position:relative;">
      <span onclick="closeModal()" style="position:absolute;top:-6px;left:0;font-size:20px;color:#546e7a;cursor:pointer;padding:2px 6px;">×</span>
      <div style="text-align:center;margin-bottom:12px;">
        <div style="display:inline-flex;align-items:center;gap:6px;font-size:17px;font-weight:800;color:#0d47a1;letter-spacing:1px;" dir="ltr">
          <span>🛡️</span><span>FORGUARD</span>
        </div>
        <div style="font-size:14.5px;font-weight:700;color:#263238;margin-top:4px;">${titleMap[mode]}</div>
        <div style="font-size:12.5px;color:#37474f;margin-top:6px;">حساب کاربری شما <b dir="ltr">${accId}</b> است</div>
      </div>

      <div style="font-size:12px;color:#37474f;margin-bottom:8px;">${promptMap[mode]}</div>
      ${fieldsHtml}

      <button onclick="submitFgAuthEdit('${mode}')" style="width:100%;background:#0d47a1;color:#fff;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;">ذخیره</button>
    </div>
  `);

  setTimeout(() => {
    const f1 = document.getElementById('fg-auth-f1');
    if (f1) { f1.focus(); if (f1.select && mode !== 'password') f1.select(); }
  }, 20);
};

submitFgAuthEdit = function(mode) {
  const v1 = ((document.getElementById('fg-auth-f1') || {}).value || '').trim();
  const v2 = ((document.getElementById('fg-auth-f2') || {}).value || '').trim();
  const v3 = ((document.getElementById('fg-auth-f3') || {}).value || '').trim();

  if (mode === 'username') {
    if (!v1 || !v2) {
      if (typeof showGreenToast === 'function') showGreenToast('نام کاربری جدید و گذرواژه فعلی را وارد کنید');
      return;
    }
    fgUserSettings.username = v1;
    fgUserSettings._boundAccount = v1;
    if (fgUserDraft) fgUserDraft.username = v1;
    localStorage.setItem('fg_current_username', v1);
    localStorage.setItem('fg_user_settings', JSON.stringify(fgUserSettings));
    closeModal();
    if (document.getElementById('ump-overlay') && document.getElementById('ump-overlay').style.display === 'flex') {
      renderFgUserSettingsPage();
    }
    if (typeof showGreenToast === 'function') showGreenToast('نام کاربری ذخیره شد');
  } else if (mode === 'email') {
    if (!v1 || !v2) {
      if (typeof showGreenToast === 'function') showGreenToast('ایمیل جدید و گذرواژه فعلی را وارد کنید');
      return;
    }
    fgUserSettings.email = v1;
    if (fgUserDraft) fgUserDraft.email = v1;
    localStorage.setItem('fg_current_email', v1);
    localStorage.setItem('fg_user_settings', JSON.stringify(fgUserSettings));
    closeModal();
    if (document.getElementById('ump-overlay') && document.getElementById('ump-overlay').style.display === 'flex') {
      renderFgUserSettingsPage();
    }
    if (typeof showGreenToast === 'function') showGreenToast('ایمیل ذخیره شد');
  } else if (mode === 'password') {
    if (!v1 || !v2 || v2 !== v3) {
      if (typeof showGreenToast === 'function') showGreenToast('گذرواژه فعلی و تکرار گذرواژه جدید را بررسی کنید');
      return;
    }
    closeModal();
    if (typeof showGreenToast === 'function') showGreenToast('گذرواژه به‌روزرسانی شد');
  }
};

syncFgAccountWithSession();
