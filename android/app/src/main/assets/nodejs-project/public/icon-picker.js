let ipColor = '#0284c7', ipIcon = 'pickup', ipProOpen = false;
let ipHue = 200, ipSat = 100, ipVal = 80;

function hsvToHex(h, s, v) {
  s /= 100; v /= 100;
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return '#' + [r + m, g + m, b + m].map(n => Math.round(n * 255).toString(16).padStart(2, '0')).join('');
}

openIconPicker = function() {
  const u = uState && uState.units.find(x => x.id === activeUnitId);
  if (u) { ipColor = u.color || '#0284c7'; ipIcon = u.icon || 'pickup'; }
  ipProOpen = false;
  renderForguardIconDialog();
};

function updateLiveIconsColor(hex) {
  ipColor = hex;
  const sw = document.getElementById('ip-cur-swatch');
  const hx = document.getElementById('ip-hex-inp');
  const pv = document.getElementById('ip-preview');
  const gr = document.getElementById('ip-grid');
  if (sw) sw.style.background = ipColor;
  if (hx && document.activeElement !== hx) hx.value = ipColor;
  if (pv) pv.innerHTML = getVehicleSvg(ipIcon, ipColor, 38);
  if (gr) {
    gr.innerHTML = VEHICLE_MODELS.map(m => `
      <div onclick="ipIcon='${m.key}';renderForguardIconDialog()" style="border-radius:10px;padding:8px 2px;text-align:center;cursor:pointer;background:${ipIcon===m.key?'#fff8e1':'transparent'};border:${ipIcon===m.key?'1.5px solid #ffb300':'1px solid #f0f0f0'};">
        ${getVehicleSvg(m.key, ipColor, 36)}
        <div style="font-size:9.5px;margin-top:3px;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.label}</div>
      </div>`).join('');
  }
}

function renderForguardIconDialog() {
  const bg = document.getElementById('modal-bg');
  const box = document.getElementById('modal-content');
  bg.style.alignItems = 'center';
  bg.style.justifyContent = 'center';
  bg.style.padding = '14px';
  box.style.borderRadius = '18px';
  box.style.maxWidth = '380px';

  const presets = ['#f44336', '#007bff', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];
  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div id="ip-preview">${getVehicleSvg(ipIcon, ipColor, 38)}</div>
        <b style="font-size:15px;">تغییر آیکون</b>
      </div>
      <label title="انتخاب عکس از گالری گوشی" style="cursor:pointer;color:#546e7a;display:flex;align-items:center;">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
        <input type="file" accept="image/*" style="display:none;" onchange="handleCustomIconUpload(this)">
      </label>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      ${presets.map(c => `<div onclick="pickPresetColor('${c}')" style="width:32px;height:32px;border-radius:50%;background:${c};cursor:pointer;border:${ipColor.toLowerCase()===c?'3px solid #212121':'2px solid #fff'};box-shadow:0 2px 5px rgba(0,0,0,0.2);"></div>`).join('')}
      <div onclick="ipProOpen=!ipProOpen;renderForguardIconDialog()" title="طیف کامل ۱۶ میلیون رنگ" style="width:34px;height:34px;border-radius:50%;background:conic-gradient(red,yellow,lime,aqua,blue,magenta,red);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;font-weight:900;text-shadow:0 1px 3px #000;">
        ${ipProOpen ? '⌃' : '⌄'}
      </div>
    </div>

    ${ipProOpen ? `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:10px;margin-bottom:12px;">
        <canvas id="pro-sv-canvas" width="310" height="130" style="width:100%;height:130px;border-radius:10px;cursor:crosshair;touch-action:none;display:block;margin-bottom:8px;"></canvas>
        <input type="range" id="pro-hue-rng" min="0" max="359" value="${ipHue}" oninput="onProHueChange(this.value)" style="width:100%;height:14px;border-radius:8px;appearance:none;background:linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00);outline:none;margin-bottom:8px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <div id="ip-cur-swatch" style="width:28px;height:28px;border-radius:50%;background:${ipColor};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>
          <input id="ip-hex-inp" value="${ipColor}" dir="ltr" onchange="if(/^#[0-9a-f]{6}$/i.test(this.value))updateLiveIconsColor(this.value)" style="flex:1;padding:5px 8px;border:1px solid #cbd5e1;border-radius:8px;font-family:monospace;font-size:12.5px;text-align:center;">
          <input type="color" value="${ipColor}" oninput="updateLiveIconsColor(this.value)" style="width:32px;height:30px;border:none;background:transparent;cursor:pointer;" title="انتخابگر سیستمی">
        </div>
      </div>
    ` : ''}

    <div id="ip-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-height:190px;overflow-y:auto;padding:4px 2px;margin-bottom:14px;">
      ${VEHICLE_MODELS.map(m => `
        <div onclick="ipIcon='${m.key}';renderForguardIconDialog()" style="border-radius:10px;padding:8px 2px;text-align:center;cursor:pointer;background:${ipIcon===m.key?'#fff8e1':'transparent'};border:${ipIcon===m.key?'1.5px solid #ffb300':'1px solid #f0f0f0'};">
          ${getVehicleSvg(m.key, ipColor, 36)}
          <div style="font-size:9.5px;margin-top:3px;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.label}</div>
        </div>
      `).join('')}
    </div>

    <div style="display:flex;gap:10px;">
      <button class="btn" style="flex:1;background:#eeeeee;color:#333;" onclick="closeForguardDialog()">لغو</button>
      <button class="btn" style="flex:1;background:#546e7a;color:#fff;" onclick="saveForguardIcon()">ذخیره</button>
    </div>`;

  bg.classList.add('open');
  if (ipProOpen) initProSVCanvas();
}

function drawSVCanvas() {
  const cv = document.getElementById('pro-sv-canvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = `hsl(${ipHue}, 100%, 50%)`;
  ctx.fillRect(0, 0, cv.width, cv.height);
  const wg = ctx.createLinearGradient(0, 0, cv.width, 0);
  wg.addColorStop(0, '#fff'); wg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = wg; ctx.fillRect(0, 0, cv.width, cv.height);
  const bg = ctx.createLinearGradient(0, 0, 0, cv.height);
  bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, '#000');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height);
}

function onProHueChange(h) {
  ipHue = Number(h);
  drawSVCanvas();
  updateLiveIconsColor(hsvToHex(ipHue, ipSat, ipVal));
}

function initProSVCanvas() {
  drawSVCanvas();
  const cv = document.getElementById('pro-sv-canvas');
  if (!cv) return;
  const pick = (e) => {
    const r = cv.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e;
    const x = Math.max(0, Math.min(r.width, pt.clientX - r.left));
    const y = Math.max(0, Math.min(r.height, pt.clientY - r.top));
    ipSat = Math.round((x / r.width) * 100);
    ipVal = Math.round(100 - (y / r.height) * 100);
    updateLiveIconsColor(hsvToHex(ipHue, ipSat, ipVal));
  };
  let drag = false;
  cv.onmousedown = (e) => { drag = true; pick(e); };
  window.onmouseup = () => { drag = false; };
  cv.onmousemove = (e) => { if (drag) pick(e); };
  cv.ontouchstart = (e) => { e.preventDefault(); pick(e); };
  cv.ontouchmove = (e) => { e.preventDefault(); pick(e); };
}

function pickPresetColor(c) { ipColor = c; renderForguardIconDialog(); }
function handleCustomIconUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => { ipIcon = ev.target.result; renderForguardIconDialog(); };
  reader.readAsDataURL(file);
}
function closeForguardDialog() {
  const bg = document.getElementById('modal-bg');
  const box = document.getElementById('modal-content');
  bg.style.alignItems = 'flex-end'; bg.style.padding = '0';
  box.style.borderRadius = '18px 18px 0 0'; box.style.maxWidth = '100%';
  closeModal();
}
async function saveForguardIcon() {
  await fetch(`/api/units/${activeUnitId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ color: ipColor, icon: ipIcon })
  });
  closeForguardDialog(); loadUserState();
}
