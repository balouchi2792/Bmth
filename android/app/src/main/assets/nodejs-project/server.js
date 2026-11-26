
const BMTH_DATA_DIR = (() => {
  const envDir = process.env.BMTH_DATA_DIR;
  if (envDir) {
    try { fs.mkdirSync(envDir, { recursive: true }); return envDir; } catch {}
  }
  const fallbackDir = require("path").join(__dirname, "data");
  try { fs.mkdirSync(fallbackDir, { recursive: true }); return fallbackDir; } catch {}
  return __dirname;
})();
const protoEngine = require("./protocol-engine");
const express = require('express');
const net = require('net');
const fs = require('fs');
const path = require('path');

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const WEB_PORT = 8080;
const TCP_PORT = 5023;
const bundledDb = path.join(__dirname, "bmth_db.json");
const DB_FILE = path.join(BMTH_DATA_DIR, "bmth_db.json");
if (!fs.existsSync(DB_FILE) && fs.existsSync(bundledDb)) {
  try { fs.copyFileSync(bundledDb, DB_FILE); } catch {}
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.now();

const initialDB = {
    brandName: "bmth",
    themeColor: "#1976d2",
    subscriptionPrice: "150,000 تومان (ماهانه)",
    company: {
        name: "bmth GPS",
        email: "support@bmth.ir",
        website: "https://bmth.ir",
        country: "Iran",
        address: "سیستان و بلوچستان، نیک‌شهر",
        domain: "app.bmth.ir"
    },
    smtp: { sender: "noreply@bmth.ir", host: "smtp.bmth.ir", port: 587 },
    admin: {
        email: "admin@bmth.ir",
        password: "admin123",
        name: "مدیر کل bmth"
    },
    roles: [
        {
            id: "role_manager",
            name: "نقش مدیر",
            desc: "دسترسی کامل به تمام بخش‌ها و فرمان‌ها",
            perms: {
                service: { full: true, read: true, create: true, update: true, del: true },
                tools: { full: true, read: true, create: true, update: true, del: true },
                alerts: { full: true, read: true, create: true, update: true, del: true },
                events: { full: true, read: true, create: true, update: true, del: true },
                geofence: { full: true, read: true, create: true, update: true, del: true },
                timeline: { full: true, read: true, create: true, update: true, del: true },
                commands: { full: true, read: true, create: true, update: true, del: true },
                stats: { full: true, read: true, create: true, update: true, del: true },
                maintenance: { full: true, read: true, create: true, update: true, del: true },
                gmaps: { full: true, read: true, create: true, update: true, del: true }
            }
        },
        {
            id: "role_member",
            name: "عضو",
            desc: "مشاهده نقشه و سفرها بدون دسترسی به مسدودسازی",
            perms: {
                service: { full: false, read: true, create: false, update: false, del: false },
                tools: { full: false, read: false, create: false, update: false, del: false },
                alerts: { full: false, read: true, create: false, update: false, del: false },
                events: { full: false, read: true, create: false, update: false, del: false },
                geofence: { full: false, read: true, create: false, update: false, del: false },
                timeline: { full: false, read: true, create: false, update: false, del: false },
                commands: { full: false, read: false, create: false, update: false, del: false },
                stats: { full: false, read: true, create: false, update: false, del: false },
                maintenance: { full: false, read: true, create: false, update: false, del: false },
                gmaps: { full: false, read: true, create: false, update: false, del: false }
            }
        }
    ],
    plans: [
        { id: "plan_masoud", name: "مسعود", partnerPlan: "Advanced 2024", maxUnits: 25, maxGeofences: 30, storageMb: 200, price: "0.0 EUR" },
        { id: "plan_maka", name: "Maka", partnerPlan: "Starter Trial", maxUnits: 3, maxGeofences: 8, storageMb: 10, price: "0.0 EUR" }
    ],
    users: [
        {
            id: "2600173",
            name: "مسعود بلوچی",
            email: "balouchi2792@gmail.com",
            password: "123456",
            planId: "plan_masoud",
            roleId: "role_manager", allowDoorLock: true,
            status: "active",
            createdAt: "16:09, 16/10"
        },
        {
            id: "2599384",
            name: "کاربر Maka",
            email: "maka@bmth.ir",
            password: "123456",
            planId: "plan_maka",
            roleId: "role_member", allowDoorLock: false,
            status: "active",
            createdAt: "13:52, 16/10"
        }
    ],
    units: [
        {
            id: "unit_1",
            ownerId: "2600173",
            name: "مزدا دوکابین",
            imei: "353701092663117",
            model: "Micodus MV720",
            protocol: "H02",
            icon: "fa-truck-pickup",
            color: "#0284c7",
            trailColor: "#1976d2",
            hidden: false,
            expiresAt: now + (10 * DAY_MS),
            planType: "تست ۱۰ روزه رایگان",
            ignition: true,
            speed: 45,
            direction: 0,
            directionText: "شمال",
            battery: 100,
            voltage: 12.1,
            satellites: 6,
            gsmSignal: 50,
            mileage: 865.035,
            engineHoursText: "31 ساعت و 29 دقیقه",
            maintKm: { A: 864.9, B: 120.5, C: 0, limit: 5000 },
            maintHr: { A: 14.4, B: 5.2, C: 0, limit: 40.4 },
            extraFields: [],
            securityMode: false,
            secLat: 26.250875,
            secLng: 60.244280,
            lat: 26.250875,
            lng: 60.244280,
            address: "... صفرقدم, استان سیستان و بلوچستان شهرستان نیک شهر, ایران",
            lastTime: "05:55:01",
            history: [
                { lat: 26.245200, lng: 60.238200, speed: 32, time: "08:00:15" },
                { lat: 26.247400, lng: 60.240600, speed: 56, time: "08:12:40" },
                { lat: 26.249200, lng: 60.242500, speed: 84, time: "08:21:10" },
                { lat: 26.250875, lng: 60.244280, speed: 45, time: "08:30:00" }
            ],
            stops: [
                { lat: 26.247400, lng: 60.240600, duration: "08:29:41", time: "21:31:39" }
            ],
            dailyKm: [18.5, 42.0, 29.3, 64.1, 31.8, 55.4, 24.2]
        },
        {
            id: "unit_2",
            ownerId: "2600173",
            name: "نیسان آبی",
            imei: "7201143847",
            model: "Micodus MV720",
            protocol: "H02",
            icon: "fa-truck",
            color: "#1d4ed8",
            trailColor: "#2563eb",
            hidden: false,
            expiresAt: now + (10 * DAY_MS),
            planType: "تست ۱۰ روزه رایگان",
            ignition: false,
            speed: 0,
            direction: 90,
            directionText: "شرق",
            battery: 100,
            voltage: 12.7,
            satellites: 10,
            gsmSignal: 85,
            mileage: 2346.7,
            engineHoursText: "84 ساعت و 10 دقیقه",
            maintKm: { A: 2346.7, B: 410.0, C: 0, limit: 5000 },
            maintHr: { A: 28.0, B: 10.0, C: 0, limit: 50 },
            extraFields: [],
            securityMode: false,
            secLat: 26.254200,
            secLng: 60.247800,
            lat: 26.254200,
            lng: 60.247800,
            address: "... راتشهر, استان سیستان و بلوچستان شهرستان نیک شهر, ایران",
            lastTime: "05:54:38",
            history: [{ lat: 26.254200, lng: 60.247800, speed: 0, time: "05:54:38" }],
            stops: [],
            dailyKm: [40, 55, 30, 70, 65, 80, 20]
        },
        {
            id: "unit_3",
            ownerId: "2600173",
            name: "سورن پلاس",
            imei: "7201238273",
            model: "Micodus MV720",
            protocol: "H02",
            icon: "fa-car-side",
            color: "#d97706",
            trailColor: "#d97706",
            hidden: false,
            expiresAt: now + (10 * DAY_MS),
            planType: "تست ۱۰ روزه رایگان",
            ignition: false,
            speed: 0,
            direction: 210,
            directionText: "جنوب غربی",
            battery: 100,
            voltage: 12.8,
            satellites: 12,
            gsmSignal: 92,
            mileage: 412.5,
            engineHoursText: "12 ساعت و 05 دقیقه",
            maintKm: { A: 0, B: 0, C: 0, limit: 5000 },
            maintHr: { A: 10.6, B: 0, C: 0, limit: 40 },
            extraFields: [],
            securityMode: false,
            secLat: 26.248500,
            secLng: 60.246500,
            lat: 26.248500,
            lng: 60.246500,
            address: "... سرک آباد, استان سیستان و بلوچستان شهرستان نیک شهر, ایران",
            lastTime: "03:57:58",
            history: [{ lat: 26.248500, lng: 60.246500, speed: 0, time: "03:57:58" }],
            stops: [],
            dailyKm: [10, 15, 8, 22, 19, 30, 12]
        },
        {
            id: "unit_4",
            ownerId: "2600173",
            name: "موتور شکاری",
            imei: "7301067745",
            model: "Concox GT06",
            protocol: "GT06",
            icon: "fa-motorcycle",
            color: "#dc2626",
            trailColor: "#dc2626",
            hidden: false,
            expiresAt: now + (10 * DAY_MS),
            planType: "تست ۱۰ روزه رایگان",
            ignition: true,
            speed: 36,
            direction: 45,
            directionText: "شمال شرقی",
            battery: 100,
            voltage: 12.5,
            satellites: 9,
            gsmSignal: 88,
            mileage: 493.0,
            engineHoursText: "19 ساعت و 40 دقیقه",
            maintKm: { A: 493.0, B: 50, C: 0, limit: 2000 },
            maintHr: { A: 15.1, B: 2, C: 0, limit: 30 },
            extraFields: [],
            securityMode: false,
            secLat: 26.252800,
            secLng: 60.241200,
            lat: 26.252800,
            lng: 60.241200,
            address: "... کهورکان, استان سیستان و بلوچستان شهرستان نیک شهر, ایران",
            lastTime: "22:13:49",
            history: [
                { lat: 26.251200, lng: 60.239800, speed: 30, time: "09:00:00" },
                { lat: 26.252800, lng: 60.241200, speed: 36, time: "09:05:00" }
            ],
            stops: [],
            dailyKm: [18, 24, 15, 31, 20, 29, 14]
        },
        {
            id: "unit_5",
            ownerId: "2600173",
            name: "تویوتا",
            imei: "7201238276",
            model: "Micodus MV208",
            protocol: "H02",
            icon: "fa-truck-pickup",
            color: "#16a34a",
            trailColor: "#16a34a",
            hidden: false,
            expiresAt: now + (10 * DAY_MS),
            planType: "تست ۱۰ روزه رایگان",
            ignition: false,
            speed: 0,
            direction: 180,
            directionText: "جنوب",
            battery: 100,
            voltage: 12.9,
            satellites: 11,
            gsmSignal: 94,
            mileage: 0,
            engineHoursText: "5 ساعت و 12 دقیقه",
            maintKm: { A: 0, B: 0, C: 0, limit: 5000 },
            maintHr: { A: 5.2, B: 0, C: 0, limit: 40 },
            extraFields: [],
            securityMode: false,
            secLat: 26.246800,
            secLng: 60.249100,
            lat: 26.246800,
            lng: 60.249100,
            address: "... ایرانفشان, استان سیستان و بلوچستان شهرستان مهرستان, ایران",
            lastTime: "02:25:53",
            history: [{ lat: 26.246800, lng: 60.249100, speed: 0, time: "02:25:53" }],
            stops: [],
            dailyKm: [0, 12, 0, 18, 5, 22, 0]
        }
    ],
    geofences: [
        { id: "gf_1", ownerId: "2600173", name: "حصار جغرافیایی من", shape: "circle", lat: 26.250875, lng: 60.244280, radius: 461, area: "0.667 کیلومتر مربع", perimeter: "2.895 km", visible: true }
    ],
    customAlerts: [
        { id: "al_1", ownerId: "2600173", name: "سرعت غیرمجاز", param: "position.speed", type: "شرط پارامتر", active: true },
        { id: "al_2", ownerId: "2600173", name: "افت شارژ باتری", param: "battery.level", type: "تغییر پارامتر", active: true }
    ],
    alerts: [
        { id: 1, ownerId: "2600173", time: "05:54", unitName: "مزدا دوکابین", text: "مزدا دوکابین وارد حصار جغرافیایی من شد", type: "success" },
        { id: 2, ownerId: "2600173", time: "21:31", unitName: "مزدا دوکابین", text: "مزدا دوکابین سفر را تمام کرد", type: "info" },
        { id: 3, ownerId: "2600173", time: "21:22", unitName: "مزدا دوکابین", text: "مزدا دوکابین سفر را شروع کرد", type: "info" },
        { id: 4, ownerId: "2600173", time: "16:35", unitName: "مزدا دوکابین", text: "مزدا دوکابین از حصار جغرافیایی من خارج شد", type: "warning" }
    ],
    retranslators: [],
    channels: [],
    apiTokens: [],
    sharedLinks: []
};

let db = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : initialDB;

function ensureMaintenanceParts(u) {
    if (!u.customParts || !Array.isArray(u.customParts)) {
        u.customParts = [
            { id: "p_oil", name: "روغن موتور و فیلتر روغن", intervalKm: 5000, usedKm: Math.round(u.maintKm ? u.maintKm.A : 850), lastChangedShamsi: "۱۴۰۵/۰۷/۱۵" },
            { id: "p_air", name: "فیلتر هوا و فیلتر سوخت", intervalKm: 10000, usedKm: Math.round((u.maintKm ? u.maintKm.A : 850) + 1200), lastChangedShamsi: "۱۴۰۵/۰۶/۲۰" },
            { id: "p_brake", name: "لنت ترمز جلو و عقب", intervalKm: 25000, usedKm: 6400, lastChangedShamsi: "۱۴۰۵/۰۴/۱۰" },
            { id: "p_belt", name: "تسمه تایم و تسمه دینام", intervalKm: 60000, usedKm: 18500, lastChangedShamsi: "۱۴۰۴/۱۱/۰۵" },
            { id: "p_plug", name: "شمع موتور و وایرها", intervalKm: 30000, usedKm: 9200, lastChangedShamsi: "۱۴۰۵/۰۲/۱۲" }
        ];
    }
    if (typeof u.monthlyKm !== "number") {
        u.monthlyKm = Array.isArray(u.dailyKm) ? +(u.dailyKm.reduce((a, b) => a + b, 0) * 3.8).toFixed(1) : 420.5;
    }
    if (typeof u.monthlyHours !== "number") {
        u.monthlyHours = +(u.monthlyKm / 34).toFixed(1);
    }
}

function saveDB() { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
saveDB();

// شبیه‌ساز تله‌متری زنده برای خودروهای دارای اعتبار
setInterval(() => {
    const ts = Date.now();
    let dirty = false;
    db.units.forEach(u => {
        if (u.expiresAt > ts && u.ignition) {
            u.lat += (Math.random() - 0.35) * 0.00016;
            u.lng += (Math.random() - 0.35) * 0.00016;
            u.speed = Math.floor(28 + Math.random() * 58);
            u.mileage = +(u.mileage + 0.02).toFixed(3);
            u.maintKm.A = +(u.maintKm.A + 0.02).toFixed(1); ensureMaintenanceParts(u); u.monthlyKm = +(u.monthlyKm + 0.02).toFixed(2); u.customParts.forEach(p => p.usedKm = +(p.usedKm + 0.02).toFixed(1));
            const tStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            u.lastTime = tStr;
            u.history.push({ lat: u.lat, lng: u.lng, speed: u.speed, time: tStr });
            if (u.history.length > 70) u.history.shift();
            dirty = true;
        }
    });
    if (dirty) saveDB();
}, 3000);

// ================= احراز هویت مستقل =================
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (email === db.admin.email && password === db.admin.password) {
        return res.json({ ok: true, role: 'admin', admin: { name: db.admin.name, email: db.admin.email } });
    }
    const user = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password);
    if (!user) return res.status(401).json({ ok: false, message: "ایمیل یا رمز عبور اشتباه است." });
    if (user.status === 'blocked') return res.status(403).json({ ok: false, message: "حساب کاربری شما توسط مدیر کل مسدود شده است." });
    res.json({ ok: true, role: 'user', user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ ok: false, message: "تمام فیلدها را پر کنید." });
    if (email === db.admin.email || db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ ok: false, message: "این ایمیل قبلاً ثبت شده است." });
    }
    const newUser = {
        id: String(Math.floor(2600000 + Math.random() * 90000)),
        name, email, password,
        planId: "plan_masoud",
        roleId: "role_manager", allowDoorLock: true,
        status: "active",
        createdAt: new Date().toLocaleDateString('fa-IR')
    };
    db.users.push(newUser);
    saveDB();
    res.json({ ok: true, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
});

// ================= APIهای پنل کاربری (bmth Client) =================
app.get('/api/user/:userId/state', (req, res) => {
    const user = db.users.find(u => u.id === req.params.userId);
    if (!user || user.status === 'blocked') return res.status(403).json({ ok: false });

    const ts = Date.now();
    const role = db.roles.find(r => r.id === user.roleId) || db.roles[0];
    const plan = db.plans.find(p => p.id === user.planId) || db.plans[0];

    const units = db.units.filter(u => u.ownerId === user.id).map(u => {
        ensureMaintenanceParts(u); const remMs = u.expiresAt - ts;
        const remainingDays = Math.max(0, Math.ceil(remMs / DAY_MS));
        const isExpired = remMs <= 0;
        return { ...u, remainingDays, isExpired, speed: isExpired ? 0 : u.speed };
    });

    res.json({ ok: true,
        brandName: db.brandName,
        themeColor: db.themeColor,
        subscriptionPrice: db.subscriptionPrice,
        company: db.company,
        user, role, plan, units,
        geofences: db.geofences.filter(g => g.ownerId === user.id),
        customAlerts: db.customAlerts.filter(a => a.ownerId === user.id),
        alerts: db.alerts.filter(a => a.ownerId === user.id),
        sharedLinks: db.sharedLinks.filter(s => s.ownerId === user.id)
    , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.post('/api/user/:userId/units', (req, res) => {
    const { name, imei, model, icon, color } = req.body;
    if (!name || !imei) return res.status(400).json({ ok: false, message: "نام ماشین و شناسه IMEI الزامی است." });
    if (db.units.some(u => u.imei === imei)) return res.status(400).json({ ok: false, message: "این شماره سریال قبلاً ثبت شده است." });

    const newUnit = {
        id: 'unit_' + Date.now(),
        ownerId: req.params.userId,
        name, imei,
        model: model || "Micodus MV720",
        protocol: "H02",
        icon: icon || "fa-car-side",
        color: color || "#0284c7",
        trailColor: "#1976d2",
        hidden: false,
        expiresAt: Date.now() + (10 * DAY_MS), // ۱۰ روز مهلت تست رایگان
        planType: "تست ۱۰ روزه رایگان",
        ignition: false, speed: 0, direction: 0, directionText: "شمال",
        battery: 100, voltage: 12.8, satellites: 11, gsmSignal: 90, mileage: 0,
        engineHoursText: "0 ساعت",
        maintKm: { A: 0, B: 0, C: 0, limit: 5000 },
        maintHr: { A: 0, B: 0, C: 0, limit: 40 },
        extraFields: [],
        securityMode: false,
        secLat: 26.251200, secLng: 60.244800,
        lat: 26.251200, lng: 60.244800,
        address: "نیک‌شهر، موقعیت اولیه ثبت‌شده",
        lastTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        history: [{ lat: 26.251200, lng: 60.244800, speed: 0, time: "08:00:00" }],
        stops: [],
        dailyKm: [0, 0, 0, 0, 0, 0, 0]
    };
    db.units.push(newUnit);
    db.alerts.unshift({
        id: Date.now(), ownerId: req.params.userId,
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        unitName: name, text: "ماشین ثبت شد و ۱۰ روز مهلت تست رایگان فعال گردید", type: "success"
    });
    saveDB();
    res.json({ ok: true, unit: newUnit , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.put('/api/units/:unitId', (req, res) => {
    const u = db.units.find(x => x.id === req.params.unitId);
    if (!u) return res.status(404).json({ ok: false });
    Object.assign(u, req.body);
    saveDB();
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.post('/api/units/:unitId/extra-fields', (req, res) => {
    const u = db.units.find(x => x.id === req.params.unitId);
    if (u) {
        u.extraFields.push({ name: req.body.name, value: req.body.value, showOnCard: !!req.body.showOnCard });
        saveDB();
    }
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.post('/api/units/:unitId/command', (req, res) => {
    const u = db.units.find(x => x.id === req.params.unitId);
    if (!u) return res.status(404).json({ ok: false });
    if (u.expiresAt <= Date.now()) {
        return res.status(403).json({ ok: false, message: "مهلت ۱۰ روزه این خودرو تمام شده است. لطفاً پس از پرداخت هزینه، از طریق ادمین تمدید کنید." });
    }
    const { cmd, channel } = req.body;
    const t = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    let msg = "";

    const owner = db.users.find(x => x.id === u.ownerId);
    if ((cmd === 'DOOR_LOCK' || cmd === 'DOOR_UNLOCK') && owner && owner.allowDoorLock === false) {
        return res.status(403).json({ ok: false, message: "دسترسی باز و بسته کردن درب خودرو برای حساب شما توسط مدیر غیرفعال است." });
    }
    if (cmd === 'DOOR_LOCK') {
        msg = `فرمان قفل مرکزی درب‌ها (${req.body.payload || "LOCK#"}) برای ${u.model} ارسال شد.`;
        db.alerts.unshift({ id: Date.now(), ownerId: u.ownerId, time: t, unitName: u.name, text: "درب‌های خودرو از راه دور قفل شدند", type: "info" });
    } else if (cmd === 'DOOR_UNLOCK') {
        msg = `فرمان باز کردن درب‌های خودرو (${req.body.payload || "UNLOCK#"}) برای ${u.model} ارسال شد.`;
        db.alerts.unshift({ id: Date.now(), ownerId: u.ownerId, time: t, unitName: u.name, text: "درب‌های خودرو از راه دور باز شدند", type: "success" });
    } else if (cmd === 'STOP') {
        u.ignition = false; u.speed = 0;
        msg = "فرمان مسدود کردن (قطع سوخت RELAY 1) ارسال شد.";
        db.alerts.unshift({ id: Date.now(), ownerId: u.ownerId, time: t, unitName: u.name, text: "فرمان مسدود کردن اجرا شد", type: "danger" });
    } else if (cmd === 'START') {
        u.ignition = true; u.speed = 42;
        msg = "فرمان رفع انسداد (وصل سوخت) ارسال شد.";
        db.alerts.unshift({ id: Date.now(), ownerId: u.ownerId, time: t, unitName: u.name, text: "فرمان رفع انسداد اجرا شد", type: "success" });
    } else if (cmd === 'SECURITY') {
        u.securityMode = !u.securityMode;
        u.secLat = u.lat; u.secLng = u.lng;
        msg = u.securityMode ? "حالت امنیتی فعال است (شعاع ۱۰۰ متر)." : "حالت امنیتی غیر فعال است.";
    } else if (cmd === 'RESET_KM') {
        u.maintKm[channel || 'A'] = 0;
        msg = `شمارنده مسافت ${channel || 'A'} بازنشانی شد.`;
    } else if (cmd === 'RESET_HR') {
        u.maintHr[channel || 'A'] = 0;
        msg = `شمارنده ساعات موتور ${channel || 'A'} بازنشانی شد.`;
    } else if (cmd === 'CUSTOM') {
        msg = `دستور «${req.body.payload}» به سخت‌افزار ارسال شد.`;
    }
    saveDB();
    res.json({ ok: true, message: msg , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.post('/api/user/:userId/geofences', (req, res) => {
    const u = db.units.find(x => x.ownerId === req.params.userId);
    const lat = u ? u.lat : 26.250875;
    const lng = u ? u.lng : 60.244280;
    const r = Number(req.body.radius) || 460;
    db.geofences.push({
        id: 'gf_' + Date.now(), ownerId: req.params.userId,
        name: req.body.name || 'حصار جغرافیایی ۱',
        shape: req.body.shape || 'circle',
        lat, lng, radius: r,
        area: `${((Math.PI * r * r) / 1e6).toFixed(3)} کیلومتر مربع`,
        perimeter: `${((2 * Math.PI * r) / 1000).toFixed(3)} km`,
        visible: true
    });
    saveDB();
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.post('/api/user/:userId/geofences/toggle', (req, res) => {
    const gfs = db.geofences.filter(g => g.ownerId === req.params.userId);
    const anyVis = gfs.some(g => g.visible);
    gfs.forEach(g => g.visible = !anyVis);
    saveDB();
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.post('/api/user/:userId/share', (req, res) => {
    const token = Math.random().toString(36).substring(2, 10);
    db.sharedLinks.push({
        id: 'sh_' + Date.now(), ownerId: req.params.userId,
        name: req.body.name || 'پیوند اشتراک‌گذاری',
        hours: req.body.hours || 1,
        url: `http://localhost:${WEB_PORT}/?share=${token}`
    });
    saveDB();
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

// ================= APIهای پنل مستقل مدیریت (bmth Console) =================
app.get('/api/admin/state', (req, res) => {
    const ts = Date.now();
    const usersWithUnits = db.users.map(u => {
        const units = db.units.filter(x => x.ownerId === u.id).map(unit => ({
            ...unit,
            remainingDays: Math.max(0, Math.ceil((unit.expiresAt - ts) / DAY_MS)),
            isExpired: unit.expiresAt <= ts
        }));
        return { ...u, units };
    });
    res.json({ ok: true,
        brandName: db.brandName,
        themeColor: db.themeColor,
        subscriptionPrice: db.subscriptionPrice,
        company: db.company,
        smtp: db.smtp,
        admin: db.admin,
        roles: db.roles,
        plans: db.plans,
        users: usersWithUnits,
        allUnits: db.units.map(unit => ({
            ...unit,
            remainingDays: Math.max(0, Math.ceil((unit.expiresAt - ts) / DAY_MS)),
            isExpired: unit.expiresAt <= ts
        , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined })),
        retranslators: db.retranslators,
        channels: db.channels,
        apiTokens: db.apiTokens
    });
});

app.put('/api/admin/users/:userId', (req, res) => {
    const u = db.users.find(x => x.id === req.params.userId);
    if (!u) return res.status(404).json({ ok: false });
    Object.assign(u, req.body);
    saveDB();
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.post('/api/admin/users', (req, res) => {
    db.users.push({
        id: String(Math.floor(2600000 + Math.random() * 90000)),
        name: req.body.name,
        email: req.body.email,
        password: req.body.password || "123456",
        planId: req.body.planId || "plan_masoud",
        roleId: req.body.roleId || "role_manager",
        status: "active",
        createdAt: new Date().toLocaleDateString('fa-IR')
    });
    saveDB();
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.delete('/api/admin/users/:userId', (req, res) => {
    db.users = db.users.filter(u => u.id !== req.params.userId);
    db.units = db.units.filter(u => u.ownerId !== req.params.userId);
    saveDB();
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.post('/api/admin/units/:unitId/extend', (req, res) => {
    const unit = db.units.find(x => x.id === req.params.unitId);
    if (!unit) return res.status(404).json({ ok: false });
    const days = Number(req.body.days) || 30;
    unit.expiresAt = Math.max(Date.now(), unit.expiresAt) + (days * DAY_MS);
    unit.planType = `اشتراک پرداخت‌شده (${days} روزه)`;
    db.alerts.unshift({
        id: Date.now(), ownerId: unit.ownerId,
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        unitName: unit.name, text: `اشتراک خودرو به مدت ${days} روز توسط مدیریت bmth تمدید شد`, type: "success"
    });
    saveDB();
    res.json({ ok: true, message: `اشتراک ${unit.name} به مدت ${days} روز تمدید شد.` });
});

app.post('/api/admin/units/:unitId/expire', (req, res) => {
    const unit = db.units.find(x => x.id === req.params.unitId);
    if (unit) { unit.expiresAt = Date.now() - 1000; unit.ignition = false; unit.speed = 0; saveDB(); }
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.post('/api/admin/roles', (req, res) => {
    db.roles.push({ id: 'role_' + Date.now(), ...req.body });
    saveDB();
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.post('/api/admin/plans', (req, res) => {
    db.plans.push({ id: 'plan_' + Date.now(), ...req.body });
    saveDB();
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.post('/api/admin/retranslators', (req, res) => {
    db.retranslators.push({ id: 'ret_' + Date.now(), ...req.body });
    saveDB();
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.post('/api/admin/channels', (req, res) => {
    db.channels.push({ id: 'ch_' + Date.now(), ...req.body });
    saveDB();
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.post('/api/admin/tokens', (req, res) => {
    db.apiTokens.push({
        id: 'tok_' + Date.now(),
        name: req.body.name,
        expires: req.body.expires || "1406/12/29",
        token: "bmth_" + Math.random().toString(36).substring(2, 16)
    });
    saveDB();
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.post('/api/admin/copy-settings', (req, res) => {
    const { sourceUnitId, targetUnitId } = req.body;
    const src = db.units.find(u => u.id === sourceUnitId);
    const dst = db.units.find(u => u.id === targetUnitId);
    if (src && dst) {
        dst.color = src.color;
        dst.trailColor = src.trailColor;
        dst.maintKm.limit = src.maintKm.limit;
        saveDB();
    }
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.post('/api/admin/config', (req, res) => {
    if (req.body.themeColor) db.themeColor = req.body.themeColor;
    if (req.body.subscriptionPrice) db.subscriptionPrice = req.body.subscriptionPrice;
    if (req.body.adminPassword) db.admin.password = req.body.adminPassword;
    if (req.body.company) Object.assign(db.company, req.body.company);
    if (req.body.smtp) Object.assign(db.smtp, req.body.smtp);
    saveDB();
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

// سرور TCP 5023 برای دریافت مستقیم بسته‌های سخت‌افزار GPS
net.createServer(socket => {
    socket.on('data', data => {
        const pkt = data.toString().trim();
        if (pkt.startsWith('*HQ,')) {
            const p = pkt.split(',');
            const unit = db.units.find(u => u.imei === p[1]);
            if (unit && unit.expiresAt > Date.now() && p.length >= 9) {
                const rLat = parseFloat(p[5]), rLng = parseFloat(p[7]);
                if (!isNaN(rLat) && !isNaN(rLng)) {
                    unit.lat = Math.floor(rLat / 100) + (rLat % 100) / 60;
                    unit.lng = Math.floor(rLng / 100) + (rLng % 100) / 60;
                    unit.speed = Math.round(parseFloat(p[9] || 0) * 1.852);
                    saveDB();
                }
            }
        }
    });
}).listen(TCP_PORT);


app.post('/api/units/:unitId/parts', (req, res) => {
    const u = db.units.find(x => x.id === req.params.unitId);
    if (!u) return res.status(404).json({ ok: false });
    ensureMaintenanceParts(u);
    const { name, intervalKm, usedKm } = req.body;
    if (!name || !intervalKm) return res.status(400).json({ ok: false, message: "نام قطعه و دوره تعویض الزامی است." });
    u.customParts.push({
        id: "part_" + Date.now(),
        name: String(name).trim(),
        intervalKm: Number(intervalKm) || 5000,
        usedKm: Number(usedKm) || 0,
        lastChangedShamsi: new Date().toLocaleDateString("fa-IR")
    });
    saveDB();
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.post('/api/units/:unitId/parts/:partId/reset', (req, res) => {
    const u = db.units.find(x => x.id === req.params.unitId);
    if (!u) return res.status(404).json({ ok: false });
    ensureMaintenanceParts(u);
    const part = u.customParts.find(p => p.id === req.params.partId);
    if (part) {
        part.usedKm = 0;
        part.lastChangedShamsi = new Date().toLocaleDateString("fa-IR");
        db.alerts.unshift({
            id: Date.now(), ownerId: u.ownerId,
            time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
            unitName: u.name, text: `تعویض «${part.name}» ثبت و شمارنده صفر شد`, type: "success"
        });
        saveDB();
    }
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

app.delete('/api/units/:unitId/parts/:partId', (req, res) => {
    const u = db.units.find(x => x.id === req.params.unitId);
    if (!u) return res.status(404).json({ ok: false });
    ensureMaintenanceParts(u);
    u.customParts = u.customParts.filter(p => p.id !== req.params.partId);
    saveDB();
    res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});


app.put("/api/admin/roles/:roleId", (req, res) => {
  const r = db.roles.find(x => x.id === req.params.roleId);
  if (r && req.body.perms) { r.perms = req.body.perms; saveDB(); }
  res.json({ ok: true , dispatch: typeof _dispatchRes !== "undefined" ? _dispatchRes : undefined });
});

// === سیستم درخواست تمدید و تأیید رسید توسط ادمین ===
const RENEWALS_FILE = require("path").join(__dirname, "renewals.json");
function loadRenewals() {
  try { return JSON.parse(fs.readFileSync(RENEWALS_FILE, "utf8")); } catch (e) { return []; }
}
function saveRenewals(list) {
  fs.writeFileSync(RENEWALS_FILE, JSON.stringify(list, null, 2));
}

app.get("/api/renewals", (req, res) => {
  const list = loadRenewals();
  res.json(list);
});

app.post("/api/renewals", (req, res) => {
  const { unitId, unitName, planMonths, planLabel, amount, receiptCode, receiptImg } = req.body || {};
  if (!unitId || !planMonths || (!receiptCode && !receiptImg)) {
    return res.status(400).json({ error: "لطفاً پلن و شماره پیگیری یا تصویر رسید را وارد کنید." });
  }
  const list = loadRenewals();
  const item = {
    id: "rn_" + Date.now(),
    unitId,
    unitName: unitName || unitId,
    planMonths: Number(planMonths),
    planLabel: planLabel || (planMonths + " ماهه"),
    amount: Number(amount) || loadPrices()[String(planMonths)] || 0,
    receiptCode: String(receiptCode || "").trim(),
    receiptImg: receiptImg || "",
    status: "pending",
    createdAt: new Date().toISOString()
  };
  list.unshift(item);
  saveRenewals(list);
  res.json({ ok: true, item });
});

app.post("/api/renewals/:id/decision", (req, res) => {
  if (req.user && req.user.role !== "admin") return res.status(403).json({ error: "فقط ادمین اصلی مجاز است." });
  const { action } = req.body || {};
  const list = loadRenewals();
  const item = list.find(x => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: "درخواست پیدا نشد." });

  if (action === "approve") {
    item.status = "approved";
    item.decidedAt = new Date().toISOString();
    const days = item.planMonths === 12 ? 365 : item.planMonths * 30;
    if (typeof db !== "undefined" && Array.isArray(db.units)) {
      const u = db.units.find(x => x.id === item.unitId);
      if (u) {
        const base = (u.trialEndsAt && u.trialEndsAt > Date.now()) ? u.trialEndsAt : Date.now();
        u.trialEndsAt = base + days * 24 * 60 * 60 * 1000;
        u.isExpired = false;
        if (typeof saveDb === "function") saveDb();
      }
    }
  } else {
    item.status = "rejected";
    item.decidedAt = new Date().toISOString();
  }
  saveRenewals(list);
  res.json({ ok: true, item });
});


// === تنظیمات مالی و قیمت پلن‌های تمدید (ادمین) ===
const PRICES_FILE = require("path").join(__dirname, "prices.json");
const DEFAULT_PRICES = {
  "1": 150000,
  "2": 280000,
  "3": 400000,
  "6": 750000,
  "12": 1400000,
  "cardNumber": "",
  "cardOwner": ""
};
function loadPrices() {
  try { return Object.assign({}, DEFAULT_PRICES, JSON.parse(fs.readFileSync(PRICES_FILE, "utf8"))); }
  catch (e) { return Object.assign({}, DEFAULT_PRICES); }
}
function savePrices(obj) {
  fs.writeFileSync(PRICES_FILE, JSON.stringify(obj, null, 2));
}

app.get("/api/prices", (req, res) => {
  res.json(loadPrices());
});

app.post("/api/prices", (req, res) => {
  if (req.user && req.user.role !== "admin") return res.status(403).json({ error: "فقط ادمین اصلی مجاز است." });
  const p = loadPrices();
  ["1", "2", "3", "6", "12"].forEach(k => {
    if (req.body && req.body[k] !== undefined) p[k] = Math.max(0, Number(req.body[k]) || 0);
  });
  if (req.body && req.body.cardNumber !== undefined) p.cardNumber = String(req.body.cardNumber).trim();
  if (req.body && req.body.cardOwner !== undefined) p.cardOwner = String(req.body.cardOwner).trim();
  savePrices(p);
  res.json({ ok: true, prices: p });
});

app.listen(WEB_PORT, () => console.log(`✅ پلتفرم bmth روی http://localhost:${WEB_PORT} اجرا شد.`));
