// ============================================================================
// 1. FIREBASE INITIALIZATION & SYSTEM CONFIG
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCVYtRMfZFTBFT6TYzFT-zGCCdieFickdM",
  authDomain: "jsw-dolvi-mis.firebaseapp.com",
  projectId: "jsw-dolvi-mis",
  storageBucket: "jsw-dolvi-mis.firebasestorage.app",
  messagingSenderId: "665121130225",
  appId: "1:665121130225:web:9fb35d9091c7737c1c4b50",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Prevent right click on desktop
document.addEventListener("contextmenu", (e) => {
  if (window.innerWidth >= 768) {
    e.preventDefault();
  }
});

const GOOGLE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbyzydefb_jHkmoL6VTbE6WyOCkSSDJSNbeZXxL3Sy-zYzXfzwqClrZ0G6uUIOpKj4do/exec";

let GLOBAL_MASTER = { zones: [], cranes: [], manpower: [] };

const FALLBACK_SEED = {
  zones: [
    "BF-Shell",
    "Furnace Proper",
    "Middle Tower",
    "Cast House West",
    "Cast House East",
    "Main ECR",
    "DGCP",
    "Cyclone",
    "HS#01",
    "HS#02",
    "HS#03",
    "HS#04",
    "Stove Housing",
    "Chimney",
    "MCC Gallery",
    "Stock House",
    "Pump house",
  ],
  cranes: [
    { id: "CR-TE-001", name: "TEREX 80T" },
    { id: "CR-ZL-042", name: "Zoomlion 80T" },
    { id: "CR-SN-080", name: "SANY 80T" },
    { id: "CR-SN-085", name: "SANY 85T" },
    { id: "CR-MT-085A", name: "Manitowoc 85T (A)" },
    { id: "CR-MT-085B", name: "Manitowoc 85T (B)" },
    { id: "CR-SN-909", name: "SANY 90T" },
    { id: "CR-KB-100", name: "Kobelco 100T" },
    { id: "CR-ZL-110", name: "Zoomlion 110T" },
    { id: "CR-XCMG-160", name: "XCMG 160T" },
    { id: "CR-SN-150A", name: "Sany 150T (A)" },
    { id: "CR-SN-150B", name: "Sany 150T (B)" },
    { id: "CR-ZL-150", name: "Zoomlion 150T" },
    { id: "CR-XCMG-150", name: "XCMG 150T" },
    { id: "CR-XCMG-080", name: "XCMG 80T" },
    { id: "CR-TX-400", name: "Terex 400T" },
    { id: "CR-TX-600A", name: "Terex 600T (A)" },
    { id: "CR-TX-600B", name: "Terex 600T (B)" },
    { id: "CR-LG-750", name: "LIEBHERR 750T" },
  ].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  ),
  manpower: [
    { id: "eng", name: "Engineers", sub: "Supervisory Grade" },
    { id: "sup", name: "Supervisors", sub: "Mid-level Mgmt" },
    { id: "form", name: "Foreman", sub: "Site Execution" },
    { id: "fit", name: "Fitters", sub: "Skilled Labor" },
    { id: "fab", name: "Fabricater", sub: "Production Grade" },
    { id: "weld", name: "Welder", sub: "High Skill Grade" },
    { id: "rig", name: "Riggers", sub: "Material Handling" },
    { id: "khal", name: "Khalasi", sub: "Support Crew" },
    { id: "grin", name: "Grinder", sub: "Finishing Grade" },
    { id: "gas", name: "Gas cutter", sub: "Metal Preparation" },
    { id: "tw", name: "T/W", sub: "Watch & Monitor" },
    { id: "store", name: "Store-keeper", sub: "Inventory Mgmt" },
    { id: "help", name: "Helper", sub: "General Labor" },
  ],
};

let todaysDraft = {
  date: "",
  shift: "",
  erection: {},
  equipment: {},
  manpower: {},
};

// ============================================================================
// 2. FIREBASE DATA PIPELINE
// ============================================================================
async function fetchMasterDataFromCloud() {
  try {
    const docRef = db.collection("config").doc("master_lists");
    const docSnap = await docRef.get();
    if (docSnap.exists) GLOBAL_MASTER = docSnap.data();
    else {
      GLOBAL_MASTER = FALLBACK_SEED;
      await docRef.set(FALLBACK_SEED);
    }
  } catch (error) {
    GLOBAL_MASTER = FALLBACK_SEED;
  }
}

// ============================================================================
// 3. ADMIN PANEL CONTROLLER
// ============================================================================
function renderAdminPanel() {
  document.getElementById("admin-zones-list").innerHTML = GLOBAL_MASTER.zones
    .map(
      (z, i) =>
        `<div class="admin-list-item"><span>${z}</span> <div><button class="btn-edit-item" onclick="editAdminItem('zones', ${i})" style="background:none;border:none;cursor:pointer;margin-right:8px;font-size:1rem;" title="Edit">✏️</button><button class="btn-delete-item" onclick="deleteAdminItem('zones', ${i})">Delete</button></div></div>`,
    )
    .join("");
  document.getElementById("admin-cranes-list").innerHTML = GLOBAL_MASTER.cranes
    .map(
      (c, i) =>
        `<div class="admin-list-item"><span>${c.name}</span> <div><button class="btn-edit-item" onclick="editAdminItem('cranes', ${i})" style="background:none;border:none;cursor:pointer;margin-right:8px;font-size:1rem;" title="Edit">✏️</button><button class="btn-delete-item" onclick="deleteAdminItem('cranes', ${i})">Delete</button></div></div>`,
    )
    .join("");
  document.getElementById("admin-mp-list").innerHTML = GLOBAL_MASTER.manpower
    .map(
      (m, i) =>
        `<div class="admin-list-item"><span>${m.name}</span> <div><button class="btn-edit-item" onclick="editAdminItem('manpower', ${i})" style="background:none;border:none;cursor:pointer;margin-right:8px;font-size:1rem;" title="Edit">✏️</button><button class="btn-delete-item" onclick="deleteAdminItem('manpower', ${i})">Delete</button></div></div>`,
    )
    .join("");
}

function editAdminItem(category, index) {
  let currentName =
    category === "zones"
      ? GLOBAL_MASTER.zones[index]
      : GLOBAL_MASTER[category][index].name;
  let newVal = prompt("Edit name:", currentName);
  if (newVal !== null && newVal.trim() !== "") {
    if (category === "zones") GLOBAL_MASTER.zones[index] = newVal.trim();
    else GLOBAL_MASTER[category][index].name = newVal.trim();
    renderAdminPanel();
  }
}

function addAdminItem(category) {
  if (category === "zones") {
    let input = document.getElementById("new-zone-name");
    if (input.value.trim() !== "") GLOBAL_MASTER.zones.push(input.value.trim());
    input.value = "";
  } else if (category === "cranes") {
    let input = document.getElementById("new-crane-name");
    if (input.value.trim() !== "")
      GLOBAL_MASTER.cranes.push({
        id: "CR-NEW-" + Math.floor(Math.random() * 10000),
        name: input.value.trim(),
      });
    input.value = "";
  } else if (category === "manpower") {
    let input = document.getElementById("new-mp-name");
    if (input.value.trim() !== "")
      GLOBAL_MASTER.manpower.push({
        id: "mp-" + Math.floor(Math.random() * 1000),
        name: input.value.trim(),
        sub: "Custom Role",
      });
    input.value = "";
  }
  renderAdminPanel();
}

function deleteAdminItem(category, index) {
  if (confirm("Are you sure you want to delete this item?")) {
    GLOBAL_MASTER[category].splice(index, 1);
    renderAdminPanel();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let adminSaveBtn = document.getElementById("btn-save-master-data");
  if (adminSaveBtn) {
    adminSaveBtn.onclick = async () => {
      adminSaveBtn.innerText = "⏳ SAVING...";
      try {
        await db.collection("config").doc("master_lists").set(GLOBAL_MASTER);
        alert("✅ Cloud Database Updated!");
      } catch (err) {
        alert("❌ Failed to save to cloud.");
      }
      adminSaveBtn.innerText = "SAVE DATABASE TO CLOUD";
    };
  }
});

// ============================================================================
// 4. INDUSTRIAL TIME & SEGREGATED STATE LOADER
// ============================================================================
function getLiveShiftInfo() {
  const now = new Date();
  const hrs = now.getHours();
  let shiftName = "";
  let prodDate = new Date(now);
  if (hrs >= 6 && hrs < 14) shiftName = "Shift A (06:00 - 14:00)";
  else if (hrs >= 14 && hrs < 22) shiftName = "Shift B (14:00 - 22:00)";
  else {
    shiftName = "Shift C (22:00 - 06:00)";
    if (hrs < 6) prodDate.setDate(prodDate.getDate() - 1);
  }
  const y = prodDate.getFullYear();
  const m = String(prodDate.getMonth() + 1).padStart(2, "0");
  const d = String(prodDate.getDate()).padStart(2, "0");
  return { shift: shiftName, dateStr: `${y}-${m}-${d}` };
}

function loadTodaysStateIfSaved() {
  const live = getLiveShiftInfo();
  let role = localStorage.getItem("jsw_role") || "guest";
  let storeKey =
    role === "eng" || role === "admin"
      ? "mis_reports_eng"
      : "mis_reports_guest";
  let saved = JSON.parse(localStorage.getItem(storeKey) || "{}");

  if (saved[live.dateStr]) todaysDraft = saved[live.dateStr];
  else {
    let prevEquipment = {};
    let pastDates = Object.keys(saved).filter(d => d < live.dateStr).sort().reverse();
    if (pastDates.length > 0) {
      prevEquipment = saved[pastDates[0]].equipment || {};
    }

    todaysDraft = {
      date: live.dateStr,
      shift: live.shift,
      erection: {},
      equipment: JSON.parse(JSON.stringify(prevEquipment)),
      manpower: {},
    };
  }
}

// ============================================================================
// 5. THE 3-TIER ROUTER & AUTH
// ============================================================================
window.addEventListener("beforeunload", (e) => {
  e.preventDefault();
  e.returnValue = "";
});

function renderActiveScreen(targetId, title, isSubView) {
  // 1. Wipe old animation classes off all screens
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.remove("active", "slide-in-right", "tab-fade");
  });

  let el =
    document.getElementById(targetId) ||
    document.getElementById(targetId.replace("view-", ""));
  if (el) {
    el.classList.add("active");
    document.body.setAttribute("data-active-view", el.id);

    // 🔥 THE PHYSICS ROUTER:
    // If clicking into a sub-page -> Slide in from the right.
    // If clicking a bottom tab -> Do a snappy scale wipe.
    if (isSubView) el.classList.add("slide-in-right");
    else el.classList.add("tab-fade");
  }

  let tDom = document.getElementById("header-title");
  if (tDom) tDom.innerText = title;
  let bDom = document.getElementById("back-btn");
  if (bDom) bDom.classList.toggle("hidden", !isSubView);
  let dIcon = document.getElementById("nav-dash-icon");
  if (dIcon) {
    dIcon.innerText = isSubView ? "↩" : "🏠";
    dIcon.style.transform = isSubView ? "scale(1.4)" : "";
    dIcon.style.fontWeight = isSubView ? "900" : "";
    dIcon.style.display = isSubView ? "inline-block" : "";
  }
}
function navigateTo(targetId, title, isSubView) {
  history.pushState(
    { view: targetId },
    "",
    `#${targetId.replace("view-", "")}`,
  );
  renderActiveScreen(targetId, title, isSubView);
}

function setupSmartRouter() {
  history.replaceState({ view: "view-login" }, "", "#login");
  window.addEventListener("popstate", (event) => {
    let activeRole = localStorage.getItem("jsw_role");
    let state = event.state;
    if (!activeRole) {
      history.replaceState({ view: "view-login" }, "", "#login");
      renderActiveScreen("view-login", "", false);
      return;
    }
    if (state && state.view === "view-admin" && activeRole === "admin") {
      renderActiveScreen("view-admin", "Admin Portal", false);
      return;
    }
    if (state && state.view === "view-dashboard") {
      renderActiveScreen("view-dashboard", "Construction MIS", false);
      return;
    }
    if (!state || state.view !== "view-dashboard") {
      if (
        activeRole !== "admin" &&
        confirm(
          "⚠️ Tapping 'Back' will close the Dashboard. Do you want to stay?",
        )
      ) {
        history.pushState({ view: "view-dashboard" }, "", "#dashboard");
        renderActiveScreen("view-dashboard", "Construction MIS", false);
      }
    }
  });
}

function setupLoginScreen() {
  const loginBtn = document.getElementById("btn-submit-login");
  const errDom = document.getElementById("login-error-msg");
  const uidInput = document.getElementById("login-uid");
  const pwdInput = document.getElementById("login-pwd");
  if (!loginBtn) return;

  function executeAuth() {
    let u = uidInput.value.trim();
    let p = pwdInput.value.trim();

    let targetRole = null;
    if (u === "@JSWadmin84r") {
      if (p !== "789438") {
        triggerErr("❌ Invalid PIN");
        return;
      }
      targetRole = "admin";
    } else if (u === "@JswmisBF3") {
      if (p !== "123456") {
        triggerErr("❌ Invalid PIN");
        return;
      }
      targetRole = "eng";
    } else if (u === "@Guest0") {
      if (p !== "0000") {
        triggerErr("❌ Invalid PIN");
        return;
      }
      if (window.innerWidth >= 768) {
        triggerErr("❌ Guests cannot login from Desktop");
        return;
      }
      targetRole = "guest";
    } else {
      triggerErr("❌ Unauthorized User ID");
      return;
    }

    // 1. Lock the login button & show the cinematic glass overlay
    let loader = document.getElementById("auth-loading-overlay");
    if (loader) loader.classList.remove("hidden");
    loginBtn.disabled = true;

    // 2. Hold the illusion for exactly 1 rotation of the reactor ring (750ms)
    setTimeout(() => {
      if (loader) loader.classList.add("hidden");
      loginBtn.disabled = false;
      grantAccess(targetRole);
    }, 750);
  }

  function triggerErr(msg) {
    if (errDom) errDom.innerText = msg;
    pwdInput.value = "";
    pwdInput.focus();
  }

  loginBtn.onclick = executeAuth;
  pwdInput.onkeydown = (e) => {
    if (e.key === "Enter") executeAuth();
  };
  uidInput.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      pwdInput.focus();
    }
  };
}

function grantAccess(role) {
  localStorage.setItem("jsw_role", role);
  document.body.classList.remove("auth-locked");
  let badge = document.getElementById("role-badge");
  if (badge)
    badge.innerText =
      role === "admin" ? "ADMIN" : role === "eng" ? "ENGINEER" : "GUEST";

  let adminTab = document.getElementById("nav-tab-admin");
  let dashTab = document.querySelector('.nav-tab[data-view="view-dashboard"]');
  document
    .querySelectorAll(".nav-tab")
    .forEach((t) => t.classList.remove("active"));

  loadTodaysStateIfSaved();
  renderSavedReportsHistory();

  if (role === "admin") {
    if (adminTab) {
      adminTab.classList.remove("hidden");
      adminTab.classList.add("active");
    }
    renderAdminPanel();
    history.pushState({ view: "view-admin" }, "", "#admin");
    renderActiveScreen("view-admin", "Admin Portal", false);
  } else {
    if (adminTab) adminTab.classList.add("hidden");
    if (dashTab) dashTab.classList.add("active");
    history.pushState({ view: "view-dashboard" }, "", "#dashboard");
    renderActiveScreen("view-dashboard", "Construction MIS", false);
  }
}

function logout() {
  localStorage.removeItem("jsw_role");
  document.body.classList.add("auth-locked");
  let adminTab = document.getElementById("nav-tab-admin");
  if (adminTab) adminTab.classList.add("hidden");
  history.pushState({ view: "view-login" }, "", "#login");
  renderActiveScreen("view-login", "", false);
  document.getElementById("login-pwd").value = "";
  document.getElementById("login-error-msg").innerText = "";
}

// ============================================================================
// 6. DASHBOARD DATA RENDERERS
// ============================================================================
function renderErectionZones() {
  const container = document.getElementById("zones-accordion");
  if (!container) return;
  container.innerHTML = GLOBAL_MASTER.zones
    .map((z) => {
      let d = todaysDraft.erection[z] || { mt: "", remarks: "" };
      let hasVal = parseFloat(d.mt) > 0;
      return `<div class="zone-acc-item" data-zone="${z}"><div class="zone-acc-header" onclick="toggleAcc(this)"><div><span>${z}</span><small class="preview-text">${hasVal ? `Logged: ${d.mt} MT` : "No data"}</small></div><span class="acc-arrow">🔻</span></div><div class="zone-acc-body"><div class="input-group"><label>Quantity (MT)</label><input type="number" step="0.1" value="${d.mt}" placeholder="0.00" oninput="saveErection('${z}', 'mt', this.value)"></div><div class="input-group"><label>Remarks</label><input type="text" value="${d.remarks}" placeholder="e.g. Columns C4-C8" oninput="saveErection('${z}', 'remarks', this.value)"></div></div></div>`;
    })
    .join("");
}
function saveErection(z, f, v) {
  if (!todaysDraft.erection[z])
    todaysDraft.erection[z] = { mt: "", remarks: "" };
  todaysDraft.erection[z][f] = v;
  let pDom = document.querySelector(
    `.zone-acc-item[data-zone="${z}"] .preview-text`,
  );
  if (pDom)
    pDom.innerText =
      parseFloat(todaysDraft.erection[z].mt) > 0
        ? `Logged: ${todaysDraft.erection[z].mt} MT`
        : "No data";
}
function toggleAcc(el) {
  el.parentElement.classList.toggle("open");
}

function renderManpowerList() {
  const container = document.getElementById("manpower-list");
  if (!container) return;
  container.innerHTML = GLOBAL_MASTER.manpower
    .map((t) => {
      let count = todaysDraft.manpower[t.name] || 0;
      let displayVal = count === 0 ? "" : count;
      return `<div class="mp-card"><div class="mp-info"><h4>${t.name}</h4><small>${t.sub}</small></div><div class="stepper"><button onclick="changeMp('${t.name}', -1)">−</button><input type="number" class="mp-type-input" id="mp-val-${t.id}" value="${displayVal}" placeholder="0" oninput="typeMp('${t.name}', this.value)" onblur="cleanMpInput(this, '${t.name}')"><button onclick="changeMp('${t.name}', 1)">+</button></div></div>`;
    })
    .join("");
  updateMpTotal();
}
function changeMp(n, delta) {
  if (todaysDraft.manpower[n] === undefined) todaysDraft.manpower[n] = 0;
  let nxt = Math.max(0, todaysDraft.manpower[n] + delta);
  todaysDraft.manpower[n] = nxt;
  let found = GLOBAL_MASTER.manpower.find((m) => m.name === n);
  if (found) {
    let iDom = document.getElementById(`mp-val-${found.id}`);
    if (iDom) iDom.value = nxt === 0 ? "" : nxt;
  }
  updateMpTotal();
}
function typeMp(n, vStr) {
  todaysDraft.manpower[n] = vStr === "" ? 0 : Math.max(0, parseInt(vStr) || 0);
  updateMpTotal();
}
function cleanMpInput(dom, n) {
  if (dom.value === "" || parseInt(dom.value) <= 0) {
    dom.value = "";
    todaysDraft.manpower[n] = 0;
    updateMpTotal();
  }
}
function updateMpTotal() {
  let tot = Object.values(todaysDraft.manpower).reduce((s, v) => s + v, 0);
  let tDom = document.getElementById("total-mp-count");
  if (tDom) tDom.innerText = tot;
  let sDom = document.getElementById("stat-mp");
  if (sDom) sDom.innerText = tot;
}

function renderEquipmentCranes() {
  const container = document.getElementById("cranes-list");
  if (!container) return;
  const zoneOptions =
    GLOBAL_MASTER.zones
      .map((z) => `<option value="${z}">${z}</option>`)
      .join("") +
    `<option value="Others" style="font-weight:bold; color:#1e3a8a;">Others (Outside Plant Area)</option>`;
  container.innerHTML = GLOBAL_MASTER.cranes
    .map((crane) => {
      let data = todaysDraft.equipment[crane.id] || {
        state: "IDLE",
        zone: "",
        load: "",
      };
      let isEngaged = data.state === "ENGAGED";
      return `<div class="crane-card ${isEngaged ? "engaged" : ""}" data-crane-id="${crane.id}"><div class="crane-top"><h4 style="margin:2px 0;">${crane.name}</h4></div><div class="toggle-switch"><button class="${!isEngaged ? "active" : ""}" onclick="setCraneState('${crane.id}', 'IDLE')">IDLE</button><button class="${isEngaged ? "active engaged-btn" : ""}" onclick="setCraneState('${crane.id}', 'ENGAGED')">ENGAGED</button></div><div class="crane-details-form"><div class="input-group"><label>Operational Area <span style="color:red;">*</span></label><select onchange="saveCraneData('${crane.id}', 'zone', this.value)"><option value="">-- Select Work Zone --</option>${zoneOptions}</select></div><div class="input-group"><label>Current Load / Task <span style="color:red;">*</span></label><input type="text" value="${data.load}" placeholder="Mandatory task description..." oninput="saveCraneData('${crane.id}', 'load', this.value)"></div></div></div>`;
    })
    .join("");
  GLOBAL_MASTER.cranes.forEach((c) => {
    let d = todaysDraft.equipment[c.id];
    if (d && d.state === "ENGAGED" && d.zone) {
      let sDom = document.querySelector(
        `.crane-card[data-crane-id="${c.id}"] select`,
      );
      if (sDom) sDom.value = d.zone;
    }
  });
  updateCraneCounter();
}
function setCraneState(id, st) {
  if (!todaysDraft.equipment[id])
    todaysDraft.equipment[id] = { state: "IDLE", zone: "", load: "" };
  todaysDraft.equipment[id].state = st;
  renderEquipmentCranes();
}
function saveCraneData(id, f, v) {
  if (!todaysDraft.equipment[id])
    todaysDraft.equipment[id] = { state: "IDLE", zone: "", load: "" };
  todaysDraft.equipment[id][f] = v;
}
function updateCraneCounter() {
  let act = Object.values(todaysDraft.equipment).filter(
    (c) => c.state === "ENGAGED",
  ).length;
  let cDom = document.getElementById("active-crane-count");
  if (cDom) cDom.innerText = String(act).padStart(2, "0");
  let tDom = document.getElementById("total-crane-count");
  if (tDom) tDom.innerText = GLOBAL_MASTER.cranes.length;
  let sDom = document.getElementById("stat-eq");
  if (sDom) sDom.innerText = `${act} / ${GLOBAL_MASTER.cranes.length}`;
}

// 🔥 REPORTS FEED (WITH ROLE-SCOPED PURGE BUTTONS)
async function renderSavedReportsHistory() {
  const feed = document.getElementById("reports-list-container");
  if (!feed) return;
  let role = localStorage.getItem("jsw_role") || "guest";
  const live = getLiveShiftInfo();
  let allReports = {};

  // 30 days cutoff
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  cutoffDate.setHours(0, 0, 0, 0);

  if (role === "eng" || role === "admin") {
    try {
      const querySnap = await db.collection("reports_live").get();
      querySnap.forEach((doc) => {
        let repDate = new Date(doc.id);
        if (repDate < cutoffDate) {
          // Auto-delete reports older than 30 days
          db.collection("reports_live").doc(doc.id).delete().catch(console.error);
        } else {
          allReports[doc.id] = doc.data();
        }
      });
      localStorage.setItem("mis_reports_eng", JSON.stringify(allReports));
    } catch (e) {
      allReports = JSON.parse(localStorage.getItem("mis_reports_eng") || "{}");
      let changed = false;
      Object.keys(allReports).forEach(dateStr => {
        if (new Date(dateStr) < cutoffDate) {
          delete allReports[dateStr];
          changed = true;
        }
      });
      if (changed) localStorage.setItem("mis_reports_eng", JSON.stringify(allReports));
    }
  } else {
    allReports = JSON.parse(localStorage.getItem("mis_reports_guest") || "{}");
    let changed = false;
    Object.keys(allReports).forEach(dateStr => {
      if (new Date(dateStr) < cutoffDate) {
        delete allReports[dateStr];
        changed = true;
      }
    });
    if (changed) localStorage.setItem("mis_reports_guest", JSON.stringify(allReports));
  }

  let dates = Object.keys(allReports).sort().reverse();
  if (dates.length === 0) {
    feed.innerHTML = `<p style="color:#94a3b8; text-align:center; padding:32px;">No reports logged.</p>`;
    return;
  }

  // 🛡️ CHECK: Is active user Admin?
  let isAdmin = role === "admin";

  feed.innerHTML = dates
    .map((dStr) => {
      let r = allReports[dStr];
      let tMp = Object.values(r.manpower || {}).reduce((a, b) => a + b, 0);
      let aEq = Object.values(r.equipment || {}).filter(
        (e) => e.state === "ENGAGED",
      ).length;

      let erHtml =
        Object.entries(r.erection || {})
          .filter(([z, d]) => parseFloat(d.mt) > 0)
          .map(
            ([z, d]) => {
              let remarksHtml = d.remarks ? ` <span style="color:#64748b; font-size:0.85em;">(${d.remarks})</span>` : '';
              return `<li><span>${z}:</span> <strong>${d.mt} MT</strong>${remarksHtml}</li>`;
            }
          )
          .join("") || `<div class="empty-log">No steel logged</div>`;
      let eqHtml =
        Object.entries(r.equipment || {})
          .filter(([id, d]) => d.state === "ENGAGED")
          .map(([id, d]) => {
            let fC = GLOBAL_MASTER.cranes.find((c) => c.id === id);
            return `<li><span>${fC ? fC.name : "Archived Asset"}:</span> <strong>${d.zone}</strong> (${d.load})</li>`;
          })
          .join("") || `<div class="empty-log">All cranes idle</div>`;
      let mpHtml =
        Object.entries(r.manpower || {})
          .filter(([t, c]) => c > 0)
          .map(([t, c]) => `<li><span>${t}:</span> <strong>${c}</strong></li>`)
          .join("") || `<div class="empty-log">0 workforce</div>`;

      // 🛡️ CONDITIONAL BUTTON: Only injects the red trashcan if isAdmin == true
      let deleteBtnHtml = isAdmin
        ? `<button type="button" style="background:#dc2626; color:white; border:none; padding:6px 10px; border-radius:4px; font-weight:bold; font-size:0.8rem; cursor:pointer;" onclick="deleteReport('${dStr}', event)" title="Permanently Delete Report">🗑️</button>`
        : "";

      return `<div class="report-item-card" id="rep-${dStr}">
            <div class="report-card-summary">
                <div>
                    <small>MIS-${dStr.replace(/-/g, "").slice(2)}</small>
                    <h4>${dStr === live.dateStr ? "Today" : dStr}</h4>
                    <span class="status-synced">✓ SYNCED</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    ${deleteBtnHtml}
                    <button type="button" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; font-size:0.8rem; cursor:pointer;" onclick="triggerExcel('${dStr}', event)">⬇️ Excel</button>
                    <button type="button" class="expand-view-btn" onclick="toggleRepView('${dStr}')">View 🔻</button>
                </div>
            </div>
            <div class="report-detail-dropdown">
                <div class="rep-sect"><h5>🏗️ Erection</h5><ul>${erHtml}</ul></div>
                <div class="rep-sect"><h5>🦾 Cranes</h5><ul>${eqHtml}</ul></div>
                <div class="rep-sect"><h5>👥 Workforce</h5><ul>${mpHtml}</ul></div>
            </div>
        </div>`;
    })
    .join("");
}
function toggleRepView(d) {
  let c = document.getElementById(`rep-${d}`);
  c.classList.toggle("open");
  c.querySelector(".expand-view-btn").innerText = c.classList.contains("open")
    ? "Close 🔺"
    : "View 🔻";
}

// 💥 THE PURGE FUNCTION
async function deleteReport(dateStr, e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  let role = localStorage.getItem("jsw_role");
  if (role !== "admin") {
    showToast("⛔ SECURITY BLOCK: Unauthorized account.", "error");
    return;
  }

  const isConfirmed = await customConfirm(
    `Are you sure you want to completely destroy the site report for [ ${dateStr} ]? This will erase it from the cloud database forever.`,
  );
  if (!isConfirmed) return;

  try {
    await db.collection("reports_live").doc(dateStr).delete();

    // Wipe from local cache too
    let storeKey = "mis_reports_eng";
    let localDrawer = JSON.parse(localStorage.getItem(storeKey) || "{}");
    delete localDrawer[dateStr];
    localStorage.setItem(storeKey, JSON.stringify(localDrawer));

    showToast(`Record ${dateStr} destroyed.`, "success");
    renderSavedReportsHistory(); // Instantly clears it off the UI
  } catch (err) {
    console.error(err);
    showToast(
      "Error: Could not reach Firebase server to execute deletion.",
      "error",
    );
  }
}

// ============================================================================
// 6.5 CORPORATE EXCEL COMPILER (MATCHING JSW PRESET FORMAT)
// ============================================================================
function triggerExcel(dateStr, e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  let role = localStorage.getItem("jsw_role") || "guest";
  let storeKey =
    role === "eng" || role === "admin"
      ? "mis_reports_eng"
      : "mis_reports_guest";
  let allReports = JSON.parse(localStorage.getItem(storeKey) || "{}");
  let rep = allReports[dateStr];

  if (!rep) {
    alert("Report data not found!");
    return;
  }

  const BORDER_THIN = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };
  const STYLE_TITLE = {
    font: { bold: true, sz: 16 },
    alignment: { horizontal: "center", vertical: "center" },
    fill: { fgColor: { rgb: "FFF2CC" } },
    border: BORDER_THIN,
  };
  const STYLE_SUBTITLE = {
    font: { bold: true, sz: 12 },
    alignment: { horizontal: "center", vertical: "center" },
    fill: { fgColor: { rgb: "F4B183" } },
    border: BORDER_THIN,
  };
  const STYLE_DATE = {
    font: { bold: true, sz: 11 },
    alignment: { horizontal: "center", vertical: "center" },
    border: BORDER_THIN,
  };
  const STYLE_HEADER = {
    font: { bold: true, sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    fill: { fgColor: { rgb: "EDEDED" } },
    border: BORDER_THIN,
  };

  const STYLE_DATA = {
    font: { sz: 10 },
    border: BORDER_THIN,
    alignment: { vertical: "center" },
  };
  const STYLE_DATA_BOLD = {
    font: { bold: true, sz: 10 },
    border: BORDER_THIN,
    alignment: { vertical: "center" },
  };
  const STYLE_DATA_CENTER = {
    font: { sz: 10 },
    border: BORDER_THIN,
    alignment: { horizontal: "center", vertical: "center" },
  };
  const STYLE_TOTAL = {
    font: { bold: true, sz: 11 },
    border: BORDER_THIN,
    fill: { fgColor: { rgb: "E2EFDA" } },
  };

  let maxRows = Math.max(
    GLOBAL_MASTER.zones.length,
    GLOBAL_MASTER.cranes.length,
    GLOBAL_MASTER.manpower.length,
  );
  let totalRowsCount = 5 + maxRows + 2;
  let ws_data = [];
  for (let r = 0; r < totalRowsCount; r++) {
    let row = [];
    for (let c = 0; c < 11; c++) {
      row.push({ v: "", s: STYLE_DATA });
    }
    ws_data.push(row);
  }

  ws_data[0][0] = { v: "MIS REPORT", s: STYLE_TITLE };
  ws_data[1][0] = { v: "JSW STEEL - BLAST FURNACE #3", s: STYLE_SUBTITLE };
  ws_data[2][0] = {
    v: `Report Date: ${rep.date}  |  Shift: ${rep.shift}`,
    s: STYLE_DATE,
  };

  const headersR3 = [
    { c: 1, v: "Work Area" },
    { c: 2, v: "Erection Status" },
    { c: 4, v: "Equipment Available" },
    { c: 8, v: "Man Power Details" },
  ];
  headersR3.forEach((h) => (ws_data[3][h.c] = { v: h.v, s: STYLE_HEADER }));

  const headersR4 = [
    "S.No.",
    "BF#03 Zones",
    "Erection MT",
    "Remarks",
    "Crane Details",
    "Capacity",
    "Status",
    "Task / Remarks",
    "Category",
    "No. of Persons",
    "Remarks",
  ];
  headersR4.forEach(
    (text, colIdx) => (ws_data[4][colIdx] = { v: text, s: STYLE_HEADER }),
  );

  let totalMT = 0;
  let totalMP = 0;

  for (let i = 0; i < maxRows; i++) {
    let rIdx = 5 + i;

    if (i < GLOBAL_MASTER.zones.length) {
      let zoneName = GLOBAL_MASTER.zones[i];
      let erData = rep.erection[zoneName] || { mt: "", remarks: "" };
      let mtVal = parseFloat(erData.mt) || 0;
      totalMT += mtVal;

      ws_data[rIdx][0] = { v: i + 1, s: STYLE_DATA_CENTER };
      ws_data[rIdx][1] = { v: zoneName, s: STYLE_DATA_BOLD };
      ws_data[rIdx][2] = {
        v: mtVal > 0 ? mtVal : "",
        t: mtVal > 0 ? "n" : "s",
        s: STYLE_DATA_CENTER,
      };
      ws_data[rIdx][3] = { v: erData.remarks || "", s: STYLE_DATA };
    }

    if (i < GLOBAL_MASTER.cranes.length) {
      let crane = GLOBAL_MASTER.cranes[i];
      let eqData = rep.equipment[crane.id] || {
        state: "IDLE",
        zone: "",
        load: "",
      };

      let swlMatch = crane.name.match(/\d+T/i);
      let capacityVal = swlMatch ? swlMatch[0].toUpperCase() : "";
      let cleanCraneName = crane.name
        .replace(/\d+T/i, "")
        .replace(/\s+/g, " ")
        .trim();

      ws_data[rIdx][4] = {
        v: cleanCraneName || crane.name,
        s: STYLE_DATA_BOLD,
      };
      ws_data[rIdx][5] = { v: capacityVal, s: STYLE_DATA_CENTER };
      ws_data[rIdx][6] = { v: eqData.state, s: STYLE_DATA_CENTER };
      ws_data[rIdx][7] = {
        v: eqData.state === "ENGAGED" ? `${eqData.zone}: ${eqData.load}` : "",
        s: STYLE_DATA,
      };
    }

    if (i < GLOBAL_MASTER.manpower.length) {
      let mp = GLOBAL_MASTER.manpower[i];
      let count = rep.manpower[mp.name] || 0;
      totalMP += count;

      ws_data[rIdx][8] = { v: mp.name, s: STYLE_DATA_BOLD };
      ws_data[rIdx][9] = {
        v: count > 0 ? count : "",
        t: count > 0 ? "n" : "s",
        s: STYLE_DATA_CENTER,
      };
      ws_data[rIdx][10] = { v: "", s: STYLE_DATA };
    }
  }

  let totalRowIdx = 5 + maxRows;
  ws_data[totalRowIdx][1] = { v: "Cumulative Total", s: STYLE_TOTAL };
  ws_data[totalRowIdx][2] = { v: totalMT, t: "n", s: STYLE_TOTAL };
  ws_data[totalRowIdx][8] = { v: "Total Workforce", s: STYLE_TOTAL };
  ws_data[totalRowIdx][9] = { v: totalMP, t: "n", s: STYLE_TOTAL };

  let ws = XLSX.utils.aoa_to_sheet(ws_data);

  ws["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 12 },
    { wch: 22 },
    { wch: 18 },
    { wch: 10 },
    { wch: 12 },
    { wch: 25 },
    { wch: 16 },
    { wch: 14 },
    { wch: 15 },
  ];

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } },
    { s: { r: 3, c: 2 }, e: { r: 3, c: 3 } },
    { s: { r: 3, c: 4 }, e: { r: 3, c: 7 } },
    { s: { r: 3, c: 8 }, e: { r: 3, c: 10 } },
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
  ];

  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Daily_MIS");
  XLSX.writeFile(wb, `MIS_REPORT_${rep.date}.xlsx`);
}

// ============================================================================
// 7. DASHBOARD CLOUD TRANSMITTER
// ============================================================================
function setupNavigationHandlers() {
  let headerLogoutBtn = document.getElementById("header-logout-btn");
  if (headerLogoutBtn) headerLogoutBtn.onclick = () => logout();

  document.querySelectorAll(".nav-card").forEach((c) => {
    if (
      c.parentElement.id !== "view-admin" &&
      c.parentElement.id !== "view-login"
    ) {
      c.addEventListener("click", () =>
        navigateTo(c.dataset.target, c.querySelector("h3").innerText, true),
      );
    }
  });

  let bDom = document.getElementById("back-btn");
  if (bDom) bDom.onclick = () => history.back();
  const bTabs = document.querySelectorAll(".nav-tab");
  bTabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      bTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      let title = "Construction MIS";
      if (tab.dataset.view === "view-reports") title = "Saved Reports";
      if (tab.dataset.view === "view-admin") title = "Admin Portal";
      navigateTo(tab.dataset.view, title, false);
    }),
  );

  let mSaveBtn = document.getElementById("save-master-report");
  if (mSaveBtn) {
    mSaveBtn.onclick = async () => {
      const timeAtSave = getLiveShiftInfo();
      todaysDraft.date = timeAtSave.dateStr;
      todaysDraft.shift = timeAtSave.shift;

      // CLEANUP: Remove any drafts for items that were deleted from GLOBAL_MASTER
      const activeZoneNames = GLOBAL_MASTER.zones;
      if (todaysDraft.erection) {
        Object.keys(todaysDraft.erection).forEach((z) => {
          if (!activeZoneNames.includes(z)) delete todaysDraft.erection[z];
        });
      }
      const activeCraneIds = GLOBAL_MASTER.cranes.map((c) => c.id);
      if (todaysDraft.equipment) {
        Object.keys(todaysDraft.equipment).forEach((id) => {
          if (!activeCraneIds.includes(id)) delete todaysDraft.equipment[id];
        });
      }
      const activeMpNames = GLOBAL_MASTER.manpower.map((m) => m.name);
      if (todaysDraft.manpower) {
        Object.keys(todaysDraft.manpower).forEach((n) => {
          if (!activeMpNames.includes(n)) delete todaysDraft.manpower[n];
        });
      }

      let violatingCrane = null;
      for (let c of GLOBAL_MASTER.cranes) {
        let draft = todaysDraft.equipment[c.id];
        if (draft && draft.state === "ENGAGED") {
          let noZ = !draft.zone || draft.zone.trim() === "";
          let noL = !draft.load || draft.load.trim() === "";
          if (noZ || noL) {
            violatingCrane = { name: c.name, id: c.id, noZ, noL };
            break;
          }
        }
      }
      if (violatingCrane) {
        let msg = violatingCrane.noZ
          ? "select an Operational Area"
          : "write a Task Description";
        if (violatingCrane.noZ && violatingCrane.noL)
          msg = "select an Area AND write a Task";
        alert(
          `⚠️ SUBMISSION BLOCKED:\n\nCrane [${violatingCrane.name}] is ENGAGED, but you forgot to ${msg}.`,
        );
        navigateTo("view-equipment", "Equipment Deployment", true);
        setTimeout(() => {
          let badCard = document.querySelector(
            `.crane-card[data-crane-id="${violatingCrane.id}"]`,
          );
          if (badCard)
            badCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
        return;
      }

      let role = localStorage.getItem("jsw_role") || "guest";
      let storeKey =
        role === "eng" || role === "admin"
          ? "mis_reports_eng"
          : "mis_reports_guest";
      let localDrawer = JSON.parse(localStorage.getItem(storeKey) || "{}");
      localDrawer[timeAtSave.dateStr] = todaysDraft;
      localStorage.setItem(storeKey, JSON.stringify(localDrawer));

      mSaveBtn.innerText = "⏳ TRANSMITTING...";
      mSaveBtn.style.backgroundColor = "#b45309";
      mSaveBtn.disabled = true;

      try {
        if (role === "eng" || role === "admin") {
          await db
            .collection("reports_live")
            .doc(timeAtSave.dateStr)
            .set(todaysDraft, { merge: true });
          showToast(`Report logged to cloud database!`, "success");
        } else if (role === "guest") {
          if (GOOGLE_SHEET_URL.includes("YOUR_ACTUAL"))
            throw new Error("Google script unlinked");
          await fetch(GOOGLE_SHEET_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(todaysDraft),
          });
          showToast(`Report saved via Google Sheets bridge.`, "success");
        }
      } catch (err) {
        showToast("Network offline. Saved safely to local memory.", "warning");
      } finally {
        mSaveBtn.innerText = "SAVE MASTER REPORT";
        mSaveBtn.style.backgroundColor = "";
        mSaveBtn.disabled = false;
        renderSavedReportsHistory();
        if (window.innerWidth < 768) {
          let repTab = document.querySelector(
            '.nav-tab[data-view="view-reports"]',
          );
          if (repTab) repTab.click();
        }
      }
    };
  }
}

// ============================================================================
// 8. ASYNC MASTER BOOTSTRAP TRIGGER
// ============================================================================
async function initApp() {
  const live = getLiveShiftInfo();
  let dDom = document.getElementById("display-date");
  if (dDom) dDom.innerText = live.dateStr;
  let bDom = document.getElementById("banner-date");
  if (bDom) bDom.innerText = live.dateStr;
  let sDom = document.getElementById("display-shift");
  if (sDom) sDom.innerText = live.shift;

  let codeDom = document.querySelector("#view-manpower .sub-header-info p");
  if (codeDom) codeDom.innerText = "Site Code: JSW-Dolvi-BF#3";

  setupLoginScreen();
  setupSmartRouter();

  await fetchMasterDataFromCloud();

  loadTodaysStateIfSaved();
  renderErectionZones();
  renderEquipmentCranes();
  renderManpowerList();
  renderSavedReportsHistory();
  setupNavigationHandlers();

  let savedRole = localStorage.getItem("jsw_role");
  if (savedRole) grantAccess(savedRole);
}

document.addEventListener("DOMContentLoaded", initApp);

// ============================================================================
// 9. TOAST NOTIFICATION SYSTEM
// ============================================================================
function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  let icon = type === "success" ? "✅" : type === "error" ? "❌" : "⚠️";
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => toast.classList.add("show"));

  // Remove after 3.5s
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function customConfirm(message) {
  return new Promise((resolve) => {
    let modal = document.getElementById("custom-confirm-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "custom-confirm-modal";
      modal.className = "custom-modal";
      modal.innerHTML = `
                <div class="custom-modal-content">
                    <h3 style="color:#dc2626; margin-bottom:8px; font-weight:800;">⚠️ CONFIRM DELETION</h3>
                    <p id="custom-confirm-msg" style="color:#475569; font-size:0.9rem; margin-bottom:24px; line-height:1.5;"></p>
                    <div style="display:flex; gap:12px; justify-content:flex-end;">
                        <button id="custom-confirm-cancel" style="background:#64748b; color:white; border:none; border-radius:6px; padding:10px 16px; font-weight:bold; cursor:pointer;">CANCEL</button>
                        <button id="custom-confirm-ok" style="background:#dc2626; color:white; border:none; border-radius:6px; padding:10px 16px; font-weight:bold; cursor:pointer;">DESTROY REPORT</button>
                    </div>
                </div>
            `;
      document.body.appendChild(modal);
    }
    document.getElementById("custom-confirm-msg").innerText = message;
    modal.classList.add("show");

    document.getElementById("custom-confirm-cancel").onclick = () => {
      modal.classList.remove("show");
      resolve(false);
    };
    document.getElementById("custom-confirm-ok").onclick = () => {
      modal.classList.remove("show");
      resolve(true);
    };
  });
}
