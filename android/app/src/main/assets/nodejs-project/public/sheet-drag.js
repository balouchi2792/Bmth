(function initFreeSheetDrag() {
  const sheet = document.getElementById('u-sheet');
  const head = sheet && sheet.querySelector('.u-sheet-head');
  if (!sheet || !head) return;

  // افزودن دستگیره کشیدن و دکمه جمع‌کردن روی لبه بالا-چپ پنل
  if (!head.querySelector('.sheet-drag-bar')) {
    const bar = document.createElement('div');
    bar.className = 'sheet-drag-bar';
    head.appendChild(bar);
  }
  if (!sheet.querySelector('.sheet-pin-btn')) {
    const pin = document.createElement('div');
    pin.className = 'sheet-pin-btn';
    pin.title = 'جمع کردن پنل و نمایش نقشه';
    pin.innerHTML = '<span class="ms" style="font-size:19px;">keyboard_arrow_down</span>';
    pin.onclick = (e) => { e.stopPropagation(); collapseSheetNow(); };
    sheet.appendChild(pin);
  }

  function getNavH() {
    return document.body.classList.contains('nav-open') ? 116 : 58;
  }

  window.setSheetHeightPx = function(px) {
    const minH = 54;
    const maxH = window.innerHeight - getNavH() - 24;
    const clamped = Math.max(minH, Math.min(maxH, Math.round(px)));
    sheet.style.setProperty('--sheet-h', clamped + 'px');
    if (clamped <= 64) {
      uSheetMode = 'collapsed';
      sheet.classList.add('collapsed');
    } else {
      uSheetMode = 'expanded';
      sheet.classList.remove('collapsed');
    }
    if (typeof updateLeftBtnIcon === 'function') updateLeftBtnIcon();
    if (typeof map !== 'undefined' && map) setTimeout(() => map.invalidateSize(), 150);
  };

  window.collapseSheetNow = function() {
    setSheetHeightPx(54);
  };

  // بازنویسی toggleUSheet برای باز شدن نیم‌صفحه (تا نقشه بالا دیده شود) یا جمع شدن کامل
  window.toggleUSheet = function() {
    if (uSheetMode === 'collapsed') {
      setSheetHeightPx(Math.round(window.innerHeight * 0.48));
    } else {
      collapseSheetNow();
    }
  };

  // کشیدن آزاد پنل به هر ارتفاعی با لمس یا ماوس
  let dragging = false, startY = 0, startH = 54;

  function onStart(clientY) {
    dragging = true;
    startY = clientY;
    startH = sheet.getBoundingClientRect().height;
    sheet.classList.add('dragging');
  }

  function onMove(clientY) {
    if (!dragging) return;
    const delta = startY - clientY;
    setSheetHeightPx(startH + delta);
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    sheet.classList.remove('dragging');
  }

  head.addEventListener('touchstart', (e) => {
    if (e.target.closest('.head-left, .head-right-group')) return;
    onStart(e.touches[0].clientY);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    onMove(e.touches[0].clientY);
  }, { passive: true });

  window.addEventListener('touchend', onEnd);

  head.addEventListener('mousedown', (e) => {
    if (e.target.closest('.head-left, .head-right-group')) return;
    onStart(e.clientY);
  });
  window.addEventListener('mousemove', (e) => { if (dragging) onMove(e.clientY); });
  window.addEventListener('mouseup', onEnd);

  // افزودن گزینه «جمع کردن پنل» به منوی سه‌نقطه/خودرو
  const _origUnitsMenu = window.openUnitsDotsMenu;
  window.openUnitsDotsMenu = function() {
    showModal(`
      <div class="menu-row" onclick="closeModal();compactView=!compactView;renderUserTab()"><div class="menu-row-r"><span class="ms">view_list</span><span>${compactView ? 'نمای پیشخوان (کارتی)' : 'نمای فهرستی'}</span></div></div>
      <div class="menu-row" onclick="openAddUnitModal()"><div class="menu-row-r"><span class="ms" style="color:#2e7d32;">add_circle</span><span>ثبت ماشین جدید (۱۰ روز تست رایگان)</span></div></div>
      <div class="menu-row" onclick="closeModal();collapseSheetNow()"><div class="menu-row-r"><span class="ms" style="color:var(--primary);">keyboard_arrow_down</span><span>جمع کردن پنل (نمایش نقشه)</span></div></div>
      <div class="close-bar" onclick="closeModal()">بستن</div>
    `);
  };

  setSheetHeightPx(54);
})();

let unitSortMode = 'default';

window.openUnitsDotsMenu = function() {
  showModal(`
    <div class="menu-row" onclick="closeModal();compactView=!compactView;renderUserTab()">
      <div class="menu-row-r"><span class="ms">view_list</span><span>${compactView ? 'نمای پیشخوان (کارتی)' : 'نمای فهرستی'}</span></div>
    </div>
    <div class="menu-row" onclick="openUnitsSortModal()">
      <div class="menu-row-r"><span class="ms">sort</span><span>مرتب سازی</span></div>
    </div>
    <div class="menu-row" onclick="openShareUnitsModal()">
      <div class="menu-row-r"><span class="ms">share</span><span>اشتراک‌گذاری واحدها</span></div>
    </div>
    <div class="close-bar" onclick="closeModal()">بستن</div>
  `);
};

function openUnitsSortModal() {
  showModal(`
    <h4 style="margin:0 0 10px;text-align:center;">مرتب‌سازی یگان‌ها</h4>
    <div class="menu-row" onclick="applyUnitsSort('name')"><span>بر اساس نام (الفبا)</span>${unitSortMode==='name'?'<b>✓</b>':''}</div>
    <div class="menu-row" onclick="applyUnitsSort('speed')"><span>بر اساس بیشترین سرعت</span>${unitSortMode==='speed'?'<b>✓</b>':''}</div>
    <div class="menu-row" onclick="applyUnitsSort('online')"><span>بر اساس وضعیت (آنلاین اول)</span>${unitSortMode==='online'?'<b>✓</b>':''}</div>
    <div class="menu-row" onclick="applyUnitsSort('default')"><span>حالت پیش‌فرض</span>${unitSortMode==='default'?'<b>✓</b>':''}</div>
    <div class="close-bar" onclick="closeModal()">بستن</div>
  `);
}

function applyUnitsSort(mode) {
  unitSortMode = mode;
  if (uState && Array.isArray(uState.units)) {
    if (mode === 'name') uState.units.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fa'));
    else if (mode === 'speed') uState.units.sort((a, b) => (b.speed || 0) - (a.speed || 0));
    else if (mode === 'online') uState.units.sort((a, b) => Number(!!a.isExpired) - Number(!!b.isExpired));
  }
  closeModal();
  renderUserTab();
}

function openShareUnitsModal() {
  const units = (uState && uState.units) || [];
  showModal(`
    <h4 style="margin:0 0 8px;text-align:center;">اشتراک‌گذاری واحدها</h4>
    <div style="font-size:12px;color:#546e7a;text-align:center;margin-bottom:10px;">واحدهای مورد نظر برای ساخت لینک اشتراک‌گذاری را انتخاب کنید:</div>
    <div style="max-height:42vh;overflow-y:auto;margin-bottom:12px;">
      ${units.map(u => `
        <label class="menu-row" style="cursor:pointer;">
          <div class="menu-row-r">${getVehicleSvg(u.icon, u.color, 26)}<span>${u.name}</span></div>
          <input type="checkbox" class="sh-u-chk" value="${u.id}" checked>
        </label>
      `).join('')}
    </div>
    <button class="btn btn-full" onclick="copyUnitsShareLink()">ساخت و کپی لینک اشتراک‌گذاری</button>
    <div class="close-bar" onclick="closeModal()">بستن</div>
  `);
}

function copyUnitsShareLink() {
  const ids = Array.from(document.querySelectorAll('.sh-u-chk:checked')).map(el => el.value);
  if (!ids.length) return alert('حداقل یک واحد را انتخاب کنید.');
  const url = `${location.origin}/?share=${encodeURIComponent(ids.join(','))}`;
  if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
  closeModal();
  if (typeof showGreenToast === 'function') showGreenToast('لینک اشتراک‌گذاری واحدها کپی شد');
}

// اتصال مستقیم دکمه سه‌خط (≡) بالا سمت چپ یگان‌ها به منوی ۳ گزینه‌ای
(function bindUnitsHamburgerMenu() {
  const head = document.querySelector('#u-sheet .u-sheet-head');
  if (!head) return;
  head.addEventListener('click', function(e) {
    const leftBtn = e.target.closest('#u-left-btn, .head-left');
    if (!leftBtn) return;
    if (typeof userTab !== 'undefined' && userTab === 'units' && typeof uSheetMode !== 'undefined' && uSheetMode !== 'collapsed') {
      e.stopImmediatePropagation();
      e.preventDefault();
      window.openUnitsDotsMenu();
    }
  }, true);
})();
