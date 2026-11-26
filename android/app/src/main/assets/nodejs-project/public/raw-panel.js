let rpUnitId = null, rpView = 'raw';

function ensureRawOverlay() {
  let el = document.getElementById('raw-panel-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'raw-panel-overlay';
    document.body.appendChild(el);
  }
  return el;
}

function openRawPanel(uid) {
  rpUnitId = uid || activeUnitId;
  ensureRawOverlay().classList.add('open');
  renderRawPanel();
}

function closeRawPanel() {
  const el = document.getElementById('raw-panel-overlay');
  if (el) el.classList.remove('open');
}

function copyText(txt, msg) {
  if (navigator.clipboard) navigator.clipboard.writeText(txt);
  alert(msg || 'کپی شد');
}

function buildOrderedMessages(u) {
  const now = Date.now();
  const baseLat = u.lat || 26.249509;
  const baseLng = u.lng || 60.280716;
  const bat = u.battery || 100;
  const sig = u.gsmSignal || 65;
  const sat = u.satellites || 7;
  const defOn = !!u.securityMode;
  const ignOn = !!u.ignition;
  const blkOn = u.status === 'blocked';
  const dirTxt = u.directionText || 'شمال 0°';

  const pts = (u.history && u.history.length) ? [...u.history].reverse() : [];
  const list = [];

  for (let i = 0; i < 6; i++) {
    const p = pts[i];
    const tDate = new Date(now - i * 60000);
    const tStr = (p && p.time) ? p.time : tDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const lat = (p ? p.lat : baseLat - i * 0.0002).toFixed(6);
    const lng = (p ? p.lng : baseLng - i * 0.0002).toFixed(6);
    const spd = p ? p.speed : (i === 0 ? u.speed : Math.max(0, (u.speed || 0) - i * 2));
    list.push({
      time: tStr,
      seq: 72 - i,
      tsKey: ((now - i * 60000) / 1000).toFixed(5),
      lat, lng, spd, bat, sig: Math.max(30, sig - i * 3), sat, defOn, ignOn, blkOn, dirTxt
    });
  }
  return list;
}

function renderRawPanel() {
  const el = ensureRawOverlay();
  const u = uState && (uState.units.find(x => x.id === rpUnitId) || uState.units[0]);
  if (!u) return;

  const msgs = buildOrderedMessages(u);
  const latest = msgs[0];

  let contentHtml = '';
  if (rpView === 'smart') {
    contentHtml = `
      <div class="rp-kpi-grid">
        <div class="rp-kpi">
          <div class="rp-kpi-ico" style="background:#e8f5e9;color:#2e7d32;"><span class="ms">battery_charging_full</span></div>
          <div><div style="font-size:11px;color:#64748b;">باتری</div><b style="font-size:15px;">${latest.bat}%</b></div>
        </div>
        <div class="rp-kpi">
          <div class="rp-kpi-ico" style="background:#e3f2fd;color:#1565c0;"><span class="ms">signal_cellular_alt</span></div>
          <div><div style="font-size:11px;color:#64748b;">آنتن GSM</div><b style="font-size:15px;">${latest.sig}%</b></div>
        </div>
        <div class="rp-kpi">
          <div class="rp-kpi-ico" style="background:#fff3e0;color:#e65100;"><span class="ms">satellite_alt</span></div>
          <div><div style="font-size:11px;color:#64748b;">ماهواره GPS</div><b style="font-size:15px;">${latest.sat} قفل</b></div>
        </div>
        <div class="rp-kpi">
          <div class="rp-kpi-ico" style="background:${latest.defOn?'#e8f5e9':'#f1f5f9'};color:${latest.defOn?'#2e7d32':'#64748b'};"><span class="ms">shield</span></div>
          <div><div style="font-size:11px;color:#64748b;">دزدگیر / امنیت</div><b style="font-size:13.5px;">${latest.defOn?'روشن':'خاموش'}</b></div>
        </div>
      </div>

      <div class="rp-group">
        <div class="rp-group-title">
          <span>فهرست آخرین پیام‌ها به ترتیب زمانی</span>
          <button class="btn btn-sm" onclick="copyText('${latest.lat},${latest.lng}','مختصات کپی شد')">کپی مختصات</button>
        </div>
        ${msgs.map(m => `
          <div class="rp-kv">
            <span><b style="color:#2e7d32;">● ${m.time}</b> • ${m.spd} km/h</span>
            <b style="font-size:11px;color:#475569;">${m.lat}, ${m.lng}</b>
          </div>`).join('')}
      </div>`;
  } else {
    contentHtml = `
      <div class="rp-tl-wrap">
        ${msgs.map((m, idx) => `
          <div class="rp-tl-block">
            <div class="rp-tl-dot"></div>
            <div style="font-weight:700;font-size:12px;color:#2e7d32;margin-bottom:6px;">${m.time}</div>
            ${idx % 2 === 0 ? `
              <div class="rp-raw-line"><span class="rp-raw-k">alarm.code:</span> 0</div>
              <div class="rp-raw-line"><span class="rp-raw-k">battery.charging.status:</span> true</div>
              <div class="rp-raw-line"><span class="rp-raw-k">battery.level:</span> ${m.bat} %</div>
              <div class="rp-raw-line"><span class="rp-raw-k">defense.active.status:</span> ${m.defOn?'روشن':'خاموش'}</div>
              <div class="rp-raw-line"><span class="rp-raw-k">engine.blocked.status:</span> ${m.blkOn?'روشن':'خاموش'}</div>
              <div class="rp-raw-line"><span class="rp-raw-k">engine.ignition.status:</span> ${m.ignOn?'روشن':'خاموش'}</div>
              <div class="rp-raw-line"><span class="rp-raw-k">gnss.status:</span> true</div>
              <div class="rp-raw-line"><span class="rp-raw-k">gsm.signal.level:</span> ${m.sig} %</div>
              <div class="rp-raw-line"><span class="rp-raw-k">peer:</span> app.bmth.ir:5023</div>
              <div class="rp-raw-line"><span class="rp-raw-k">protocol.number:</span> 19 | <span class="rp-raw-k">record.seqnum:</span> ${m.seq}</div>
            ` : `
              <div class="rp-raw-line"><span class="rp-raw-k">gnss.realtime.status:</span> true</div>
              <div class="rp-raw-line"><span class="rp-raw-k">gsm.cellid:</span> 10374 | <span class="rp-raw-k">gsm.lac:</span> 20542</div>
              <div class="rp-raw-line"><span class="rp-raw-k">gsm.mcc:</span> 432 | <span class="rp-raw-k">gsm.mnc:</span> 11</div>
              <div class="rp-raw-line"><span class="rp-raw-k">position.direction:</span> ${m.dirTxt}</div>
              <div class="rp-raw-line"><span class="rp-raw-k">position.latitude:</span> ${m.lat}</div>
              <div class="rp-raw-line"><span class="rp-raw-k">position.longitude:</span> ${m.lng}</div>
              <div class="rp-raw-line"><span class="rp-raw-k">position.satellites:</span> ${m.sat}</div>
              <div class="rp-raw-line"><span class="rp-raw-k">position.speed:</span> ${m.spd} km/h</div>
              <div class="rp-raw-line"><span class="rp-raw-k">position.valid:</span> true</div>
              <div class="rp-raw-line"><span class="rp-raw-k">timestamp.key:</span> ${m.tsKey}</div>
            `}
          </div>
        `).join('')}
      </div>`;
  }

  el.innerHTML = `
    <div class="rp-head">
      <span class="rp-live-pill">● آنلاین</span>
      <div style="text-align:center;">
        <div style="font-weight:700;font-size:15px;">آخرین پیام‌ها</div>
        <div style="font-size:12px;color:#64748b;">${u.name}</div>
      </div>
      <span style="font-size:22px;cursor:pointer;color:#455a64;" onclick="closeRawPanel()">×</span>
    </div>
    <div class="rp-body">
      <div class="rp-seg">
        <div class="rp-seg-btn ${rpView==='raw'?'active':''}" onclick="rpView='raw';renderRawPanel()">خط زمانی پیام‌ها</div>
        <div class="rp-seg-btn ${rpView==='smart'?'active':''}" onclick="rpView='smart';renderRawPanel()">نمای هوشمند</div>
      </div>
      ${contentHtml}
    </div>`;
}

const _prevOpenTabForRaw2 = openUserTab;
openUserTab = function(tab) {
  if (tab === 'raw') {
    openRawPanel(activeUnitId);
    return;
  }
  _prevOpenTabForRaw2(tab);
};
