(function () {
  const BLOCKED_DOMAINS = new Set([
    "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com",
    "yopmail.com", "trashmail.com", "getnada.com", "throwawaymail.com",
    "sharklasers.com", "dispostable.com", "fakeinbox.com", "temp-mail.org"
  ]);

  function isValidEmail(em) {
    const clean = String(em || "").trim().toLowerCase();
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(clean)) {
      return { ok: false, msg: "فرمت ایمیل معتبر نیست" };
    }
    const domain = clean.split("@")[1] || "";
    if (BLOCKED_DOMAINS.has(domain) || domain.startsWith("fake") || domain.startsWith("temp")) {
      return { ok: false, msg: "استفاده از ایمیل‌های موقت یا فیک مجاز نیست" };
    }
    return { ok: true, email: clean };
  }

  function toast(msg, isErr) {
    if (typeof window.showGreenToast === "function") {
      window.showGreenToast(msg);
      return;
    }
    let el = document.getElementById("bmth-auth-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "bmth-auth-toast";
      el.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:99999;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:700;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.22);";
      document.body.appendChild(el);
    }
    el.style.background = isErr ? "#c62828" : "#1b5e20";
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.display = "none"; }, 3200);
  }

  function ensureStyles() {
    if (document.getElementById("bmth-clean-auth-style")) return;
    const s = document.createElement("style");
    s.id = "bmth-clean-auth-style";
    s.textContent = `
      #bmth-auth-overlay {
        position: fixed;
        inset: 0;
        z-index: 9000;
        background: linear-gradient(160deg, #0b3c78 0%, #1565c0 55%, #1e88e5 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        direction: rtl;
        font-family: inherit;
        overflow-y: auto;
      }
      #bmth-auth-overlay.hidden {
        display: none !important;
      }
      .bmth-auth-card {
        width: 100%;
        max-width: 410px;
        background: #ffffff;
        border-radius: 18px;
        padding: 22px 20px;
        box-shadow: 0 18px 45px rgba(8, 28, 60, 0.35);
        box-sizing: border-box;
      }
      .bmth-auth-brand {
        text-align: center;
        margin-bottom: 16px;
      }
      .bmth-auth-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #0d47a1;
        color: #fff;
        font-weight: 800;
        font-size: 16px;
        padding: 6px 14px;
        border-radius: 10px;
        letter-spacing: .5px;
      }
      .bmth-auth-title {
        margin: 10px 0 2px;
        font-size: 17px;
        font-weight: 800;
        color: #1e293b;
      }
      .bmth-auth-sub {
        font-size: 12px;
        color: #64748b;
      }
      .bmth-auth-tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        background: #f1f5f9;
        padding: 4px;
        border-radius: 11px;
        margin-bottom: 16px;
        gap: 4px;
      }
      .bmth-auth-tab {
        border: none;
        background: transparent;
        padding: 9px 8px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        color: #475569;
        cursor: pointer;
      }
      .bmth-auth-tab.active {
        background: #ffffff;
        color: #0d47a1;
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
      }
      .bmth-auth-field {
        margin-bottom: 12px;
      }
      .bmth-auth-label {
        display: block;
        font-size: 12.5px;
        font-weight: 700;
        color: #334155;
        margin-bottom: 5px;
      }
      .bmth-auth-input {
        width: 100%;
        padding: 11px 12px;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        font-size: 13.5px;
        color: #0f172a;
        background: #fff;
        box-sizing: border-box;
        outline: none;
      }
      .bmth-auth-input:focus {
        border-color: #0d47a1;
        box-shadow: 0 0 0 3px rgba(13, 71, 161, 0.12);
      }
      .bmth-auth-submit {
        width: 100%;
        border: none;
        border-radius: 10px;
        background: #0d47a1;
        color: #fff;
        padding: 11.5px;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        margin-top: 4px;
      }
      .bmth-auth-submit:disabled {
        opacity: .65;
        cursor: not-allowed;
      }
      .bmth-auth-footer {
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12.5px;
        color: #475569;
      }
      .bmth-auth-link {
        background: none;
        border: none;
        color: #0d47a1;
        font-weight: 800;
        font-size: 12.5px;
        cursor: pointer;
        padding: 0;
      }
      .bmth-auth-modal-bg {
        position: fixed;
        inset: 0;
        z-index: 9500;
        background: rgba(15, 23, 42, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        direction: rtl;
      }
      .bmth-auth-modal-box {
        width: 100%;
        max-width: 380px;
        background: #fff;
        border-radius: 16px;
        padding: 18px;
        box-shadow: 0 16px 40px rgba(0,0,0,.28);
        box-sizing: border-box;
      }
      .bmth-auth-row {
        display: flex;
        gap: 8px;
      }
      .bmth-auth-sec-btn {
        border: 1px solid #93c5fd;
        background: #eff6ff;
        color: #0d47a1;
        border-radius: 10px;
        padding: 0 12px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(s);
  }

  function closeAuthModal() {
    const m = document.getElementById("bmth-auth-modal");
    if (m) m.remove();
  }

  function openAuthModal(html) {
    closeAuthModal();
    const bg = document.createElement("div");
    bg.id = "bmth-auth-modal";
    bg.className = "bmth-auth-modal-bg";
    bg.innerHTML = `<div class="bmth-auth-modal-box" onclick="event.stopPropagation()">${html}</div>`;
    bg.addEventListener("click", closeAuthModal);
    document.body.appendChild(bg);
  }

  function hasActiveSession() {
    try {
      const s = JSON.parse(localStorage.getItem("bmth_session") || "null");
      if (s && ((s.user && s.user.id) || s.role === "admin")) return true;
    } catch (e) {}
    return false;
  }

  function setLoggedInSession(userObj) {
    const u = (userObj && typeof userObj === "object") ? userObj : {};
    const sess = {
      role: u.role || "user",
      user: u.role === "admin" ? undefined : {
        id: String(u.id || ""),
        name: u.name || u.username || "",
        email: (u.email || "").toLowerCase()
      },
      admin: u.role === "admin" ? {
        name: u.name || "مدیر کل",
        email: (u.email || "").toLowerCase()
      } : undefined
    };
    try {
      localStorage.setItem("bmth_session", JSON.stringify(sess));
      localStorage.setItem("bmth_user", JSON.stringify(u));
      if (u.id) localStorage.setItem("fg_user_id", String(u.id));
      if (u.name || u.username) localStorage.setItem("fg_current_username", String(u.name || u.username));
      if (u.email) localStorage.setItem("fg_current_email", String(u.email).toLowerCase());
    } catch (e) {}

    const ov = document.getElementById("bmth-auth-overlay");
    if (ov) ov.classList.add("hidden");

    if (typeof window.initApp === "function") {
      try { window.initApp(); } catch (e) {}
    } else if (typeof window.loadUserState === "function") {
      try { window.loadUserState(); } catch (e) {}
    } else {
      window.location.reload();
    }
  }

  function showAuthOverlay(tab) {
    ensureStyles();
    let ov = document.getElementById("bmth-auth-overlay");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "bmth-auth-overlay";
      ov.innerHTML = `
        <div class="bmth-auth-card">
          <div class="bmth-auth-brand">
            <div class="bmth-auth-badge" dir="ltr">bmth</div>
            <div class="bmth-auth-title">سامانه ردیابی هوشمند bmth</div>
            <div class="bmth-auth-sub">ورود و مدیریت حساب کاربری</div>
          </div>

          <div class="bmth-auth-tabs">
            <button type="button" id="tab-login-btn" class="bmth-auth-tab active">ورود به حساب</button>
            <button type="button" id="tab-reg-btn" class="bmth-auth-tab">ثبت‌نام کاربر جدید</button>
          </div>

          <form id="bmth-login-form" autocomplete="off">
            <div class="bmth-auth-field">
              <label class="bmth-auth-label" for="bmth-login-identifier">نام کاربری یا ایمیل</label>
              <input id="bmth-login-identifier" name="identifier" type="text" dir="ltr" autocomplete="username"
                class="bmth-auth-input" placeholder="username یا email@example.com">
            </div>
            <div class="bmth-auth-field">
              <label class="bmth-auth-label" for="bmth-login-password">رمز عبور</label>
              <input id="bmth-login-password" name="password" type="password" dir="ltr" autocomplete="current-password"
                class="bmth-auth-input" placeholder="رمز عبور">
            </div>
            <button type="submit" id="bmth-login-submit" class="bmth-auth-submit">ورود به bmth</button>
          </form>

          <form id="bmth-reg-form" style="display:none;" autocomplete="off">
            <div class="bmth-auth-field">
              <label class="bmth-auth-label" for="bmth-reg-username">نام کاربری (انگلیسی، حروف و اعداد)</label>
              <input id="bmth-reg-username" name="username" type="text" dir="ltr" autocomplete="off"
                class="bmth-auth-input" placeholder="مثال: masoud123">
            </div>
            <div class="bmth-auth-field">
              <label class="bmth-auth-label" for="bmth-reg-email">ایمیل معتبر</label>
              <input id="bmth-reg-email" name="email" type="email" dir="ltr" autocomplete="off"
                class="bmth-auth-input" placeholder="name@example.com">
            </div>
            <div class="bmth-auth-field">
              <label class="bmth-auth-label" for="bmth-reg-password">رمز عبور (حداقل ۶ کاراکتر)</label>
              <input id="bmth-reg-password" name="password" type="password" dir="ltr" autocomplete="new-password"
                class="bmth-auth-input" placeholder="رمز عبور">
            </div>
            <button type="submit" id="bmth-reg-submit" class="bmth-auth-submit">ارسال کد تایید به ایمیل</button>
          </form>

          <div class="bmth-auth-footer">
            <span>رمز عبور را فراموش کرده‌اید؟</span>
            <button type="button" id="bmth-open-forgot-btn" class="bmth-auth-link">فراموشی رمز با تایید ایمیل</button>
          </div>
        </div>
      `;
      document.body.appendChild(ov);

      const tLogin = document.getElementById("tab-login-btn");
      const tReg = document.getElementById("tab-reg-btn");
      const fLogin = document.getElementById("bmth-login-form");
      const fReg = document.getElementById("bmth-reg-form");
      const regUserInp = document.getElementById("bmth-reg-username");

      regUserInp.addEventListener("input", function () {
        const cleaned = this.value.replace(/[^a-zA-Z0-9]/g, "");
        if (this.value !== cleaned) {
          this.value = cleaned;
          toast("نام کاربری فقط حروف انگلیسی و اعداد مجاز است", true);
        }
      });

      function switchTab(mode) {
        if (mode === "register") {
          tReg.classList.add("active");
          tLogin.classList.remove("active");
          fReg.style.display = "block";
          fLogin.style.display = "none";
        } else {
          tLogin.classList.add("active");
          tReg.classList.remove("active");
          fLogin.style.display = "block";
          fReg.style.display = "none";
        }
      }

      tLogin.addEventListener("click", () => switchTab("login"));
      tReg.addEventListener("click", () => switchTab("register"));

      fLogin.addEventListener("submit", async function (e) {
        e.preventDefault();
        const identifier = document.getElementById("bmth-login-identifier").value.trim();
        const password = document.getElementById("bmth-login-password").value;
        if (!identifier || !password) {
          toast("نام کاربری/ایمیل و رمز عبور را وارد کنید", true);
          return;
        }
        const btn = document.getElementById("bmth-login-submit");
        btn.disabled = true;
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: identifier, identifier, password })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.error) {
            toast(data.error || "اطلاعات ورود نادرست است یا ایمیل تایید نشده است", true);
            return;
          }
          setLoggedInSession(data.user || { username: identifier, token: data.token });
          toast("ورود با موفقیت انجام شد");
        } catch (err) {
          toast("خطا در ارتباط با سرور", true);
        } finally {
          btn.disabled = false;
        }
      });

      fReg.addEventListener("submit", async function (e) {
        e.preventDefault();
        const username = document.getElementById("bmth-reg-username").value.trim();
        const email = document.getElementById("bmth-reg-email").value.trim().toLowerCase();
        const password = document.getElementById("bmth-reg-password").value;

        if (!/^[a-zA-Z0-9]{3,32}$/.test(username)) {
          toast("نام کاربری باید فقط شامل حروف انگلیسی و اعداد (۳ تا ۳۲ کاراکتر) باشد", true);
          return;
        }
        const emCheck = isValidEmail(email);
        if (!emCheck.ok) {
          toast(emCheck.msg, true);
          return;
        }
        if (password.length < 6) {
          toast("رمز عبور باید حداقل ۶ کاراکتر باشد", true);
          return;
        }

        const btn = document.getElementById("bmth-reg-submit");
        btn.disabled = true;
        try {
          const res = await fetch("/api/auth/register/request-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email: emCheck.email, password })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.error) {
            toast(data.error || "امکان ثبت‌نام با این مشخصات وجود ندارد", true);
            return;
          }
          openVerifyRegistrationModal(emCheck.email);
          toast("کد تایید ۶ رقمی به ایمیل ارسال شد");
        } catch (err) {
          toast("خطا در ارسال کد تایید ایمیل", true);
        } finally {
          btn.disabled = false;
        }
      });

      document.getElementById("bmth-open-forgot-btn").addEventListener("click", openForgotEmailModal);
    }

    ov.classList.remove("hidden");
    if (tab === "register") {
      const rBtn = document.getElementById("tab-reg-btn");
      if (rBtn) rBtn.click();
    } else {
      const lBtn = document.getElementById("tab-login-btn");
      if (lBtn) lBtn.click();
    }
  }

  function openVerifyRegistrationModal(email) {
    openAuthModal(`
      <div style="font-size:15.5px;font-weight:800;color:#1e293b;margin-bottom:6px;text-align:center;">تایید ایمیل ثبت‌نام</div>
      <div style="font-size:12px;color:#475569;line-height:1.7;margin-bottom:12px;text-align:center;">
        کد ۶ رقمی ارسال‌شده به <b dir="ltr">${email}</b> را وارد کنید:
      </div>
      <input id="bmth-reg-otp-input" type="text" inputmode="numeric" maxlength="6" dir="ltr"
        class="bmth-auth-input" placeholder="کد ۶ رقمی" style="text-align:center;letter-spacing:4px;margin-bottom:12px;">
      <div class="bmth-auth-row">
        <button type="button" id="bmth-reg-otp-cancel" class="bmth-auth-sec-btn" style="padding:10px 14px;">انصراف</button>
        <button type="button" id="bmth-reg-otp-confirm" class="bmth-auth-submit" style="margin-top:0;">تایید و فعال‌سازی حساب</button>
      </div>
    `);

    document.getElementById("bmth-reg-otp-cancel").addEventListener("click", closeAuthModal);
    document.getElementById("bmth-reg-otp-confirm").addEventListener("click", async function () {
      const code = document.getElementById("bmth-reg-otp-input").value.trim();
      if (!/^\d{6}$/.test(code)) {
        toast("کد ۶ رقمی معتبر وارد کنید", true);
        return;
      }
      try {
        const res = await fetch("/api/auth/register/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) {
          toast(data.error || "کد تایید نامعتبر یا منقضی است", true);
          return;
        }
        closeAuthModal();
        setLoggedInSession(data.user || { email, token: data.token });
        toast("ایمیل تایید شد و حساب شما فعال گردید");
      } catch (err) {
        toast("خطا در تایید کد ایمیل", true);
      }
    });
  }

  function openForgotEmailModal() {
    const curId = (document.getElementById("bmth-login-identifier") || {}).value || "";
    const preEmail = curId.includes("@") ? curId.trim().toLowerCase() : "";

    openAuthModal(`
      <div style="font-size:15.5px;font-weight:800;color:#1e293b;margin-bottom:6px;text-align:center;">فراموشی رمز با تایید ایمیل</div>
      <div style="font-size:12px;color:#475569;line-height:1.7;margin-bottom:12px;text-align:center;">
        ایمیل حساب خود را وارد کنید تا کد تایید به ایمیل شما ارسال شود. پس از تایید کد، رمز جدید صادر می‌شود.
      </div>

      <label class="bmth-auth-label" for="bmth-forgot-email">ایمیل حساب کاربری</label>
      <div class="bmth-auth-row" style="margin-bottom:10px;">
        <input id="bmth-forgot-email" type="email" dir="ltr" value="${preEmail.replace(/"/g, "&quot;")}"
          class="bmth-auth-input" placeholder="name@example.com" style="flex:1;">
        <button type="button" id="bmth-forgot-send-btn" class="bmth-auth-sec-btn">ارسال کد</button>
      </div>

      <label class="bmth-auth-label" for="bmth-forgot-code">کد تایید ایمیل (۶ رقمی)</label>
      <input id="bmth-forgot-code" type="text" inputmode="numeric" maxlength="6" dir="ltr"
        class="bmth-auth-input" placeholder="کد ۶ رقمی" style="text-align:center;letter-spacing:4px;margin-bottom:12px;">

      <div class="bmth-auth-row">
        <button type="button" id="bmth-forgot-cancel-btn" class="bmth-auth-sec-btn" style="padding:10px 14px;">بستن</button>
        <button type="button" id="bmth-forgot-verify-btn" class="bmth-auth-submit" style="margin-top:0;">تایید ایمیل و دریافت رمز جدید</button>
      </div>
    `);

    document.getElementById("bmth-forgot-cancel-btn").addEventListener("click", closeAuthModal);

    document.getElementById("bmth-forgot-send-btn").addEventListener("click", async function () {
      const emVal = document.getElementById("bmth-forgot-email").value.trim().toLowerCase();
      const check = isValidEmail(emVal);
      if (!check.ok) {
        toast(check.msg, true);
        return;
      }
      this.disabled = true;
      try {
        const res = await fetch("/api/auth/forgot-password/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: check.email })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) {
          toast(data.error || "ارسال کد تایید انجام نشد", true);
          return;
        }
        toast("اگر این ایمیل ثبت شده باشد، کد تایید ارسال شد");
      } catch (err) {
        toast("خطا در ارتباط با سرور برای ارسال کد", true);
      } finally {
        this.disabled = false;
      }
    });

    document.getElementById("bmth-forgot-verify-btn").addEventListener("click", async function () {
      const emVal = document.getElementById("bmth-forgot-email").value.trim().toLowerCase();
      const codeVal = document.getElementById("bmth-forgot-code").value.trim();
      const check = isValidEmail(emVal);
      if (!check.ok) {
        toast(check.msg, true);
        return;
      }
      if (!/^\d{6}$/.test(codeVal)) {
        toast("کد ۶ رقمی ارسال‌شده به ایمیل را وارد کنید", true);
        return;
      }

      this.disabled = true;
      try {
        const res = await fetch("/api/auth/forgot-password/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: check.email, code: codeVal })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error || !data.newPassword) {
          toast(data.error || "کد تایید اشتباه یا منقضی شده است", true);
          return;
        }
        showIssuedPasswordModal(check.email, String(data.newPassword));
      } catch (err) {
        toast("خطا در تایید کد بازیابی", true);
      } finally {
        this.disabled = false;
      }
    });
  }

  function showIssuedPasswordModal(email, newPassword) {
    openAuthModal(`
      <div style="font-size:15.5px;font-weight:800;color:#1b5e20;margin-bottom:6px;text-align:center;">رمز عبور جدید شما صادر شد</div>
      <div style="font-size:12px;color:#475569;line-height:1.7;margin-bottom:10px;text-align:center;">
        پس از تایید ایمیل <b dir="ltr">${email}</b> رمز جدید زیر فعال شد:
      </div>
      <div dir="ltr" style="background:#f1f5f9;border:1px dashed #0d47a1;border-radius:10px;padding:12px;font-size:15px;font-weight:800;color:#0d47a1;text-align:center;user-select:all;margin-bottom:12px;">
        ${newPassword}
      </div>
      <button type="button" id="bmth-use-new-pass-btn" class="bmth-auth-submit">کپی و قرار دادن در فرم ورود</button>
    `);

    document.getElementById("bmth-use-new-pass-btn").addEventListener("click", function () {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(newPassword).catch(() => {});
        }
      } catch (e) {}
      closeAuthModal();
      showAuthOverlay("login");
      const idInp = document.getElementById("bmth-login-identifier");
      const pwInp = document.getElementById("bmth-login-password");
      if (idInp) idInp.value = email;
      if (pwInp) pwInp.value = newPassword;
      toast("رمز جدید کپی و در فرم ورود قرار داده شد");
    });
  }

  window.openBmthAuthScreen = showAuthOverlay;
  window.logoutBmthUser = function () {
    localStorage.removeItem("bmth_auth_token");
    localStorage.removeItem("fg_auth_token");
    localStorage.removeItem("fg_current_username");
    localStorage.removeItem("fg_current_email");
    showAuthOverlay("login");
  };

  window.addEventListener("DOMContentLoaded", function () {
    if (!hasActiveSession()) {
      showAuthOverlay("login");
    }
  });
})();

// === قابلیت تعیین IP ثابت یا آدرس سرور دلخواه در اپ و وب ===
(function attachConfigurableServerEndpoint() {
  const STORAGE_KEY = "bmth_custom_server_url";

  function normalizeServerUrl(raw) {
    let u = String(raw || "").trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) {
      u = "http://" + u;
    }
    u = u.replace(/\/+$/, "");
    return u;
  }

  window.getBmthServerBase = function () {
    const saved = normalizeServerUrl(localStorage.getItem(STORAGE_KEY) || "");
    if (saved) return saved;
    if (window.location && /^https?:\/\//i.test(window.location.origin)) {
      return window.location.origin.replace(/\/+$/, "");
    }
    return "http://localhost:8080";
  };

  window.setBmthServerBase = function (rawUrl) {
    const norm = normalizeServerUrl(rawUrl);
    if (!norm) {
      localStorage.removeItem(STORAGE_KEY);
      return "";
    }
    localStorage.setItem(STORAGE_KEY, norm);
    return norm;
  };

  // هدایت خودکار درخواست‌های /api/ به سرور تعیین‌شده توسط کاربر
  if (!window.__bmthFetchWrapped) {
    window.__bmthFetchWrapped = true;
    const origFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      if (typeof input === "string" && input.startsWith("/api/")) {
        const base = window.getBmthServerBase();
        return origFetch(base + input, init);
      }
      return origFetch(input, init);
    };
  }

  function injectServerConfigBox() {
    const card = document.querySelector(".bmth-auth-card");
    if (!card || document.getElementById("bmth-server-config-box")) return;

    const currentServer = window.getBmthServerBase();
    const box = document.createElement("div");
    box.id = "bmth-server-config-box";
    box.style.cssText = "margin-top:12px;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:12px;color:#334155;";
    box.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <span>سرور / IP: <b id="bmth-active-server-label" dir="ltr" style="color:#0d47a1;">${currentServer}</b></span>
        <button type="button" id="bmth-toggle-srv-editor" style="background:none;border:none;color:#0d47a1;font-weight:800;font-size:12px;cursor:pointer;padding:0;">تغییر سرور</button>
      </div>
      <div id="bmth-srv-editor-panel" style="display:none;margin-top:8px;">
        <input id="bmth-srv-url-input" type="text" dir="ltr" value="${currentServer.replace(/"/g, "&quot;")}"
          placeholder="http://185.x.x.x:8080 یا https://domain.com"
          style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:12.5px;margin-bottom:8px;box-sizing:border-box;background:#fff;">
        <div style="display:flex;gap:8px;">
          <button type="button" id="bmth-srv-test-btn" style="flex:1;background:#eff6ff;color:#0d47a1;border:1px solid #93c5fd;border-radius:8px;padding:7px;font-size:12px;font-weight:700;cursor:pointer;">تست اتصال</button>
          <button type="button" id="bmth-srv-save-btn" style="flex:1;background:#0d47a1;color:#fff;border:none;border-radius:8px;padding:7px;font-size:12px;font-weight:700;cursor:pointer;">ذخیره سرور</button>
        </div>
      </div>
    `;
    card.appendChild(box);

    const toggleBtn = document.getElementById("bmth-toggle-srv-editor");
    const panel = document.getElementById("bmth-srv-editor-panel");
    const inp = document.getElementById("bmth-srv-url-input");
    const testBtn = document.getElementById("bmth-srv-test-btn");
    const saveBtn = document.getElementById("bmth-srv-save-btn");
    const lbl = document.getElementById("bmth-active-server-label");

    toggleBtn.addEventListener("click", () => {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });

    testBtn.addEventListener("click", async () => {
      const target = normalizeServerUrl(inp.value);
      if (!target) return;
      try {
        const res = await fetch(target + "/api/health").catch(() => fetch(target + "/"));
        if (res && res.ok) {
          if (typeof window.showGreenToast === "function") window.showGreenToast("اتصال به سرور برقرار است");
        } else {
          if (typeof window.showGreenToast === "function") window.showGreenToast("سرور پاسخ داد اما وضعیت نامشخص است");
        }
      } catch (e) {
        if (typeof window.showGreenToast === "function") window.showGreenToast("امکان اتصال به سرور وجود ندارد");
      }
    });

    saveBtn.addEventListener("click", () => {
      const saved = window.setBmthServerBase(inp.value);
      if (saved) {
        inp.value = saved;
        lbl.textContent = saved;
        panel.style.display = "none";
        if (typeof window.showGreenToast === "function") window.showGreenToast("آدرس سرور ذخیره شد");
      }
    });
  }

  window.addEventListener("DOMContentLoaded", () => setTimeout(injectServerConfigBox, 100));
  setTimeout(injectServerConfigBox, 400);
})();
