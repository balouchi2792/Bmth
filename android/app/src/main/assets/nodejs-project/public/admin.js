let aState = null, adminTab = 'dash', accFilter = 'all';

async function loadAdminState() {
  const r = await fetch('/api/admin/state');
  aState = await r.json();
  document.documentElement.style.setProperty('--primary', aState.themeColor);
  renderAdmin();
}

function openAdminTab(t) {
  adminTab = t;
  document.querySelectorAll('.rail-btn').forEach(b => b.classList.remove('active'));
  const el = document.getElementById('ar-' + t);
  if (el) el.classList.add('active');
  renderAdmin();
}

function renderAdmin() {
  if (!aState) return;
  const main = document.getElementById('admin-main');
  const actCnt = aState.users.filter(u => u.status === 'active').length;
  const blkCnt = aState.users.filter(u => u.status === 'blocked').length;
  const expCnt = aState.allUnits.filter(c => c.isExpired).length;

  if (adminTab === 'dash') {
    main.innerHTML = `<h3 style="margin-top:0;">داشبورد bmth Console</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
        <div class="fg-card" style="margin:0;"><b style="font-size:20px;color:var(--primary);">${aState.users.length}</b><div style="font-size:11px;color:var(--muted);">کل حساب‌ها</div></div>
        <div class="fg-card" style="margin:0;"><b style="font-size:20px;color:#2e7d32;">${actCnt}</b><div style="font-size:11px;color:var(--muted);">حساب‌های فعال</div></div>
        <div class="fg-card" style="margin:0;"><b style="font-size:20px;color:#d32f2f;">${blkCnt}</b><div style="font-size:11px;color:var(--muted);">مسدود شده</div></div>
        <div class="fg-card" style="margin:0;"><b style="font-size:20px;color:#f59e0b;">${aState.allUnits.length}</b><div style="font-size:11px;color:var(--muted);">کل خودروها (${expCnt} منقضی)</div></div>
      </div>
      <div class="fg-card">
        <b>توزیع حساب‌ها بر اساس طرح مشتری</b>
        ${aState.plans.map(p => {
          const cnt = aState.users.filter(u => u.planId === p.id).length;
          const pct = aState.users.length ? Math.round((cnt / aState.users.length) * 100) : 0;
          return `<div style="margin-top:8px;font-size:12px;">${p.name}: <b>${cnt} (${pct}%)</b><div style="height:8px;background:#e0e0e0;border-radius:4px;margin-top:4px;"><div style="width:${pct}%;height:100%;background:var(--primary);border-radius:4px;"></div></div></div>`;
        }).join('')}
      </div>`;
  } else if (adminTab === 'accounts') {
    const list = aState.users.filter(u => accFilter === 'all' ? true : u.status === accFilter);
    main.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3 style="margin:0;">مدیریت حساب‌ها و رمزها</h3>
        <button class="btn btn-green btn-sm" onclick="addAdmUser()">+ حساب جدید</button>
      </div>
      <div class="filter-pills">
        <div class="f-pill ${accFilter==='all'?'active':''}" onclick="accFilter='all';renderAdmin()">همه (${aState.users.length})</div>
        <div class="f-pill ${accFilter==='active'?'active':''}" onclick="accFilter='active';renderAdmin()">فعال (${actCnt})</div>
        <div class="f-pill ${accFilter==='blocked'?'active':''}" onclick="accFilter='blocked';renderAdmin()">مسدود (${blkCnt})</div>
      </div>
      ${list.map(u => `<div class="fg-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div><b>${u.name}</b> <small style="color:var(--muted);">(#${u.id})</small><div style="font-size:11.5px;color:var(--muted);" dir="ltr">${u.email}</div></div>
          <span class="tag ${u.status==='active'?'tag-green':'tag-red'}">${u.status==='active'?'فعال':'مسدود'}</span>
        </div>
        <div style="font-size:12px;margin:8px 0;display:flex;justify-content:space-between;align-items:center;">
          <span>رمز: <code dir="ltr" style="background:#ffebee;color:#c62828;padding:2px 6px;border-radius:6px;">${u.password}</code></span>
          <span>مجوز درب: <b style="color:${u.allowDoorLock!==false?'#2e7d32':'#d32f2f'};">${u.allowDoorLock!==false?'فعال':'غیرفعال'}</b></span>
        </div>
        <div style="background:var(--bg);padding:8px;border-radius:8px;font-size:11.5px;margin-bottom:8px;">
          <b>خودروها (${u.units.length}):</b>
          ${u.units.map(c => `<div style="margin-top:4px;">• ${c.name} (${c.imei}) — <b style="color:${c.isExpired?'#d32f2f':'#2e7d32'};">${c.isExpired?'منقضی':c.remainingDays+' روز'}</b></div>`).join('') || ' ندارد'}
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-sm" onclick="editAdmUser('${u.id}')">ویرایش و رمز</button>
          <button class="btn btn-green btn-sm" onclick="impersonateUser('${u.id}')">ورود به پنل کاربر</button>
          <button class="btn btn-red btn-sm" onclick="delAdmUser('${u.id}')">حذف</button>
        </div>
      </div>`).join('')}`;
  } else if (adminTab === 'roles') {
    main.innerHTML = `<h3 style="margin-top:0;">مدیریت نقش‌ها (RBAC)</h3>` + aState.roles.map(r => `<div class="fg-card">
      <b>${r.name}</b><div style="font-size:11px;color:var(--muted);margin-bottom:8px;">${r.desc}</div>
      <table class="rbac-tbl"><tr><th>ماژول</th><th>کامل</th><th>خواندن</th><th>ایجاد</th><th>حذف</th></tr>
      ${Object.entries(r.perms).map(([k, v]) => `<tr><td>${k}</td>
        <td><label class="ios-switch"><input type="checkbox" ${v.full?'checked':''} onchange="togglePerm('${r.id}','${k}','full',this.checked)"><span class="ios-slider"></span></label></td>
        <td><label class="ios-switch"><input type="checkbox" ${v.read?'checked':''} onchange="togglePerm('${r.id}','${k}','read',this.checked)"><span class="ios-slider"></span></label></td>
        <td><label class="ios-switch"><input type="checkbox" ${v.create?'checked':''} onchange="togglePerm('${r.id}','${k}','create',this.checked)"><span class="ios-slider"></span></label></td>
        <td><label class="ios-switch"><input type="checkbox" ${v.del?'checked':''} onchange="togglePerm('${r.id}','${k}','del',this.checked)"><span class="ios-slider"></span></label></td>
      </tr>`).join('')}</table></div>`).join('');
  } else if (adminTab === 'units') {
    main.innerHTML = `<h3 style="margin-top:0;">واحدها و تمدید اشتراک</h3>` + aState.allUnits.map(c => `<div class="fg-card" style="border-right:4px solid ${c.isExpired?'#d32f2f':'#2e7d32'};">
      <div style="display:flex;justify-content:space-between;"><b>${c.name} (${c.model})</b><span class="tag ${c.isExpired?'tag-red':'tag-green'}">${c.isExpired?'منقضی':c.remainingDays+' روز'}</span></div>
      <div style="font-size:11.5px;color:var(--muted);margin:6px 0;" dir="ltr">IMEI: ${c.imei} | Host: app.bmth.ir | Port: 5023</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button class="btn btn-green btn-sm" onclick="extUnit('${c.id}',30)">+ تمدید ۳۰ روزه</button>
        <button class="btn btn-sm" onclick="extUnit('${c.id}',365)">+ تمدید ۱ ساله</button>
        <button class="btn btn-red btn-sm" onclick="expUnit('${c.id}')">انقضای فوری</button>
      </div>
    </div>`).join('');
  } else if (adminTab === 'design') {
    main.innerHTML = `<h3 style="margin-top:0;">طراحی برنامه، تعرفه و امنیت ادمین</h3><div class="fg-card">
      <div style="font-size:12px;font-weight:700;margin-bottom:8px;">رنگ اصلی برند bmth:</div>
      <div style="display:flex;gap:10px;margin-bottom:14px;">${['#1976d2','#0d9488','#7c3aed','#d32f2f','#f59e0b','#2e7d32'].map(c => `<div onclick="saveCfg('${c}')" style="width:32px;height:32px;border-radius:50%;background:${c};cursor:pointer;border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,0.2);"></div>`).join('')}</div>
      <label style="font-size:12px;font-weight:700;">تعرفه اشتراک نمایشی:</label><input id="c-pr" class="inp" value="${aState.subscriptionPrice}">
      <label style="font-size:12px;font-weight:700;">رمز عبور ادمین:</label><input id="c-pw" class="inp" value="${aState.admin.password}" dir="ltr">
      <button class="btn btn-full" onclick="saveCfg()">ذخیره تنظیمات</button>
    </div>`;
  }
}

function editAdmUser(uid) {
  const u = aState.users.find(x => x.id === uid);
  showModal(`<h4 style="margin:0 0 10px;text-align:center;">ویرایش کاربر و تغییر رمز عبور</h4>
    <label style="font-size:11.5px;">نام:</label><input id="eu-n" class="inp" value="${u.name}">
    <label style="font-size:11.5px;">ایمیل:</label><input id="eu-e" class="inp" value="${u.email}" dir="ltr">
    <label style="font-size:11.5px;">رمز عبور:</label><input id="eu-p" class="inp" value="${u.password}" dir="ltr">
    <label style="font-size:11.5px;">وضعیت:</label>
    <select id="eu-s" class="inp"><option value="active" ${u.status==='active'?'selected':''}>فعال</option><option value="blocked" ${u.status==='blocked'?'selected':''}>مسدود</option></select>
    <label style="display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:12.5px;background:var(--primary-soft);padding:8px;border-radius:8px;cursor:pointer;">
      <input type="checkbox" id="eu-d" ${u.allowDoorLock!==false?'checked':''}> <span>مجوز باز و بسته کردن درب خودرو (Lock/Unlock)</span>
    </label>
    <button class="btn btn-full" onclick="saveAdmUser('${u.id}')">ذخیره تغییرات</button>
    <div class="close-bar" onclick="closeModal()">بستن</div>`);
}

async function saveAdmUser(id) {
  await fetch(`/api/admin/users/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('eu-n').value,
      email: document.getElementById('eu-e').value,
      password: document.getElementById('eu-p').value,
      status: document.getElementById('eu-s').value,
      allowDoorLock: document.getElementById('eu-d').checked
    })
  });
  closeModal(); loadAdminState();
}

function impersonateUser(uid) {
  const u = aState.users.find(x => x.id === uid);
  if (!u) return;
  session = { ok: true, role: 'user', user: { id: u.id, name: u.name, email: u.email } };
  localStorage.setItem('bmth_session', JSON.stringify(session));
  startApp();
}

async function togglePerm(rid, key, field, val) {
  const r = aState.roles.find(x => x.id === rid);
  if (!r) return;
  r.perms[key][field] = val;
  await fetch(`/api/admin/roles/${rid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ perms: r.perms }) });
}

async function addAdmUser() {
  const name = prompt('نام کاربر جدید:'); if (!name) return;
  const email = prompt('ایمیل کاربر:'); const password = prompt('رمز عبور:', '123456');
  await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
  loadAdminState();
}

async function delAdmUser(id) {
  if (!confirm('کاربر و تمام خودروهایش حذف شوند؟')) return;
  await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
  loadAdminState();
}

async function extUnit(id, days) {
  const r = await fetch(`/api/admin/units/${id}/extend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days }) });
  alert((await r.json()).message); loadAdminState();
}

async function expUnit(id) {
  await fetch(`/api/admin/units/${id}/expire`, { method: 'POST' });
  loadAdminState();
}

async function saveCfg(color) {
  await fetch('/api/admin/config', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      themeColor: color || aState.themeColor,
      subscriptionPrice: document.getElementById('c-pr')?.value,
      adminPassword: document.getElementById('c-pw')?.value
    })
  });
  loadAdminState();
}

startApp();
