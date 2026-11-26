
function isMainAdmin() {
  const role = (window.uState && ((uState.user && uState.user.role) || uState.role))
    || (window.currentUser && currentUser.role)
    || localStorage.getItem("role")
    || "";
  return String(role).toLowerCase() === "admin";
}

const RENEWAL_PLANS = [
  { months: 1, label: '۱ ماهه' },
  { months: 2, label: '۲ ماهه' },
  { months: 3, label: '۳ ماهه' },
  { months: 6, label: '۶ ماهه' },
  { months: 12, label: '۱ ساله' }
];

let rnSelectedMonths = 1;
let rnReceiptImgData = '';
let rnPricesCache = { "1": 150000, "2": 280000, "3": 400000, "6": 750000, "12": 1400000, cardNumber: '', cardOwner: '' };

function fmtToman(n) {
  return (Number(n) || 0).toLocaleString('fa-IR') + ' تومان';
}

async function fetchRenewalPrices() {
  try {
    const r = await fetch('/api/prices');
    if (r.ok) rnPricesCache = await r.json();
  } catch (e) {}
  return rnPricesCache;
}

async function openRenewalModal(unitId) {
  await fetchRenewalPrices();
  const u = uState && uState.units.find(x => x.id === unitId);
  const uName = u ? u.name : 'خودرو';
  rnSelectedMonths = 1;
  rnReceiptImgData = '';

  const curPrice = rnPricesCache[String(rnSelectedMonths)] || 0;

  showModal(`
    <div style="direction:rtl;">
      <h4 style="margin:0 0 6px;text-align:center;">تمدید اشتراک «${uName}»</h4>
      <div style="font-size:12px;color:#546e7a;text-align:center;margin-bottom:10px;">مدت زمان مورد نظر را انتخاب و رسید پرداخت را ثبت کنید:</div>

      <div id="rn-plans" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;">
        ${RENEWAL_PLANS.map(p => {
          const pr = rnPricesCache[String(p.months)] || 0;
          return `
            <div onclick="selectRenewalPlan(${p.months})" id="rn-p-${p.months}" style="padding:8px 4px;border-radius:10px;text-align:center;cursor:pointer;border:1.5px solid ${p.months===1?'#1565c0':'#cfd8dc'};background:${p.months===1?'#e3f2fd':'#fff'};color:${p.months===1?'#1565c0':'#37474f'};">
              <div style="font-size:12.5px;font-weight:700;">${p.label}</div>
              <div style="font-size:10.5px;margin-top:2px;opacity:0.85;">${fmtToman(pr)}</div>
            </div>`;
        }).join('')}
      </div>

      <div id="rn-price-box" style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:10px;padding:10px;text-align:center;margin-bottom:10px;">
        <div style="font-size:11.5px;color:#2e7d32;">مبلغ قابل پرداخت:</div>
        <div id="rn-price-val" style="font-size:16px;font-weight:800;color:#1b5e20;margin-top:2px;">${fmtToman(curPrice)}</div>
        ${rnPricesCache.cardNumber ? `<div style="font-size:11.5px;color:#37474f;margin-top:6px;border-top:1px dashed #a5d6a7;padding-top:5px;">شماره کارت: <b dir="ltr">${rnPricesCache.cardNumber}</b> ${rnPricesCache.cardOwner ? `(${rnPricesCache.cardOwner})` : ''}</div>` : ''}
      </div>

      <input id="rn-code" class="cp-inp" placeholder="شماره پیگیری / کد تراکنش پرداخت" dir="ltr" style="margin-bottom:8px;">

      <label style="display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border:1.5px dashed #90a4ae;border-radius:10px;cursor:pointer;font-size:12px;color:#455a64;margin-bottom:10px;">
        <span>📎 انتخاب تصویر رسید پرداخت (اختیاری)</span>
        <input type="file" accept="image/*" style="display:none;" onchange="handleReceiptUpload(this)">
      </label>
      <div id="rn-img-prev" style="text-align:center;margin-bottom:10px;"></div>

      <div style="display:flex;gap:10px;">
        <button class="btn" style="flex:1;background:#2e7d32;color:#fff;" onclick="submitRenewalRequest('${unitId}','${uName}')">ارسال رسید برای ادمین</button>
        <button class="btn" style="flex:1;background:#eeeeee;color:#37474f;" onclick="closeModal()">بستن</button>
      </div>
    </div>
  `);
}

function selectRenewalPlan(m) {
  rnSelectedMonths = m;
  RENEWAL_PLANS.forEach(p => {
    const el = document.getElementById('rn-p-' + p.months);
    if (!el) return;
    const on = p.months === m;
    el.style.borderColor = on ? '#1565c0' : '#cfd8dc';
    el.style.background = on ? '#e3f2fd' : '#fff';
    el.style.color = on ? '#1565c0' : '#37474f';
  });
  const priceEl = document.getElementById('rn-price-val');
  if (priceEl) priceEl.innerText = fmtToman(rnPricesCache[String(m)] || 0);
}

function handleReceiptUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    rnReceiptImgData = e.target.result;
    const prev = document.getElementById('rn-img-prev');
    if (prev) prev.innerHTML = `<img src="${rnReceiptImgData}" style="max-height:110px;border-radius:8px;border:1px solid #cbd5e1;">`;
  };
  reader.readAsDataURL(file);
}

async function submitRenewalRequest(unitId, unitName) {
  const receiptCode = (document.getElementById('rn-code').value || '').trim();
  if (!receiptCode && !rnReceiptImgData) {
    return alert('لطفاً شماره پیگیری یا تصویر رسید پرداخت را وارد کنید.');
  }
  const plan = RENEWAL_PLANS.find(p => p.months === rnSelectedMonths) || RENEWAL_PLANS[0];
  const amount = rnPricesCache[String(plan.months)] || 0;
  const r = await fetch('/api/renewals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      unitId, unitName,
      planMonths: plan.months,
      planLabel: plan.label,
      amount,
      receiptCode,
      receiptImg: rnReceiptImgData
    })
  });
  const d = await r.json();
  if (!r.ok || d.error) return alert(d.error || 'خطا در ثبت رسید');
  closeModal();
  if (typeof showGreenToast === 'function') showGreenToast('رسید ثبت شد و در انتظار تأیید ادمین است');
  refreshAdminRenewalBadge();
}

// === پنل مدیریت رسیدها و بخش مالی برای ادمین ===
async function openAdminRenewalsModal(tab = 'receipts') {
  if (!isMainAdmin()) return;
  await fetchRenewalPrices();
  const r = await fetch('/api/renewals');
  const list = await r.json();

  let contentHtml = '';
  if (tab === 'finance') {
    contentHtml = `
      <div style="direction:rtl;max-height:58vh;overflow-y:auto;padding:2px;">
        <div style="font-size:12px;color:#546e7a;margin-bottom:10px;">مبلغ هر پلن را به <b>تومان</b> وارد و ذخیره کنید:</div>
        ${RENEWAL_PLANS.map(p => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
            <label style="font-size:13px;font-weight:700;min-width:65px;">${p.label}:</label>
            <input id="fin-p-${p.months}" type="number" class="cp-inp" dir="ltr" value="${rnPricesCache[String(p.months)] || 0}" style="flex:1;">
          </div>
        `).join('')}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:10px 0;">
        <input id="fin-card" class="cp-inp" dir="ltr" placeholder="شماره کارت جهت واریز (اختیاری)" value="${rnPricesCache.cardNumber || ''}" style="margin-bottom:8px;">
        <input id="fin-owner" class="cp-inp" placeholder="نام صاحب حساب (اختیاری)" value="${rnPricesCache.cardOwner || ''}" style="margin-bottom:12px;">
        <button class="btn btn-full" style="background:#1565c0;color:#fff;" onclick="saveAdminPrices()">ذخیره قیمت‌ها و اطلاعات مالی</button>
      </div>`;
  } else {
    contentHtml = `<div style="max-height:58vh;overflow-y:auto;">` + (list.length ? list.map(it => {
      const stBadge = it.status === 'pending'
        ? '<span style="background:#fff3e0;color:#e65100;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700;">در انتظار تأیید</span>'
        : (it.status === 'approved'
          ? '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700;">تأیید شده</span>'
          : '<span style="background:#ffebee;color:#c62828;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700;">رد شده</span>');

      return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px;margin-bottom:10px;direction:rtl;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <b style="font-size:13.5px;">${it.unitName} (${it.planLabel})</b>
          ${stBadge}
        </div>
        <div style="font-size:12px;color:#1b5e20;font-weight:700;margin-bottom:4px;">مبلغ: ${fmtToman(it.amount || rnPricesCache[String(it.planMonths)] || 0)}</div>
        ${it.receiptCode ? `<div style="font-size:12px;color:#334155;margin-bottom:6px;">کد پیگیری: <b dir="ltr">${it.receiptCode}</b></div>` : ''}
        ${it.receiptImg ? `<div style="margin-bottom:8px;"><img src="${it.receiptImg}" style="max-width:100%;max-height:150px;border-radius:8px;border:1px solid #cbd5e1;"></div>` : ''}
        ${it.status === 'pending' ? `
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm" style="flex:1;background:#2e7d32;color:#fff;" onclick="decideRenewal('${it.id}','approve')">تأیید و تمدید</button>
            <button class="btn btn-sm" style="flex:1;background:#d32f2f;color:#fff;" onclick="decideRenewal('${it.id}','reject')">رد درخواست</button>
          </div>` : ''}
      </div>`;
    }).join('') : '<div style="text-align:center;color:#78909c;padding:20px;font-size:13px;">هیچ درخواست تمدیدی ثبت نشده است.</div>') + `</div>`;
  }

  showModal(`
    <h4 style="margin:0 0 10px;text-align:center;">مدیریت مالی و رسیدهای تمدید (ادمین)</h4>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;direction:rtl;">
      <button class="btn btn-sm" style="background:${tab==='receipts'?'#1565c0':'#eceff1'};color:${tab==='receipts'?'#fff':'#37474f'};" onclick="openAdminRenewalsModal('receipts')">رسیدهای کاربران</button>
      <button class="btn btn-sm" style="background:${tab==='finance'?'#1565c0':'#eceff1'};color:${tab==='finance'?'#fff':'#37474f'};" onclick="openAdminRenewalsModal('finance')">بخش مالی (قیمت‌ها)</button>
    </div>
    ${contentHtml}
    <div class="close-bar" onclick="closeModal()">بستن</div>
  `);
}

async function saveAdminPrices() {
  const payload = {
    cardNumber: document.getElementById('fin-card').value.trim(),
    cardOwner: document.getElementById('fin-owner').value.trim()
  };
  RENEWAL_PLANS.forEach(p => {
    payload[String(p.months)] = Number(document.getElementById('fin-p-' + p.months).value) || 0;
  });
  const r = await fetch('/api/prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (r.ok) {
    rnPricesCache = (await r.json()).prices;
    if (typeof showGreenToast === 'function') showGreenToast('قیمت پلن‌ها و اطلاعات مالی ذخیره شد');
  }
}

async function decideRenewal(id, action) {
  await fetch(`/api/renewals/${id}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  if (typeof showGreenToast === 'function') {
    showGreenToast(action === 'approve' ? 'درخواست تأیید و اشتراک تمدید شد' : 'درخواست تمدید رد شد');
  }
  refreshAdminRenewalBadge();
  if (typeof loadUserState === 'function') loadUserState();
  openAdminRenewalsModal('receipts');
}

async function refreshAdminRenewalBadge() {
  const existingBtn = document.getElementById("admin-rn-fab");
  if (!isMainAdmin()) {
    if (existingBtn) existingBtn.remove();
    return;
  }
  try {
    const r = await fetch('/api/renewals');
    const list = await r.json();
    const pending = list.filter(x => x.status === 'pending').length;
    let btn = document.getElementById('admin-rn-fab');
    if (!btn) {
      btn = document.createElement('div');
      btn.id = 'admin-rn-fab';
      btn.style.cssText = 'position:fixed;top:62px;left:12px;z-index:1200;background:#1565c0;color:#fff;padding:7px 12px;border-radius:20px;font-size:12px;font-weight:700;box-shadow:0 3px 10px rgba(0,0,0,0.22);cursor:pointer;display:flex;align-items:center;gap:6px;direction:rtl;';
      btn.onclick = () => openAdminRenewalsModal('receipts');
      document.body.appendChild(btn);
    }
    btn.innerHTML = `<span>مالی و رسیدها</span>${pending > 0 ? `<span style="background:#ef4444;color:#fff;border-radius:10px;padding:1px 6px;font-size:11px;">${pending}</span>` : ''}`;
  } catch (e) {}
}

setTimeout(refreshAdminRenewalBadge, 1200);

if (typeof loadUserState === "function") {
  const _origLoadUserStateForRn = loadUserState;
  loadUserState = async function(...args) {
    const res = await _origLoadUserStateForRn.apply(this, args);
    refreshAdminRenewalBadge();
    return res;
  };
}
