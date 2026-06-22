// ============================================================================
// 1. SYSTEM CONFIGURATION & AUTHENTICATION CONSTANTS
// ============================================================================
const FIXED_UID = "Jswmis@5";
const FIXED_PWD = "1234";
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID_HERE/exec";

const ZONES = ["BF-Shell", "Furnace Proper", "Middle Tower", "Cast House West", "Cast House East", "Main ECR", "DGCP", "Cyclone", "HS#01", "HS#02", "HS#03", "HS#04", "Stove Housing", "Chimney", "MCC Gallery", "Stock House", "Pump house"];

const CRANES = [
    { id: "CR-TE-001", name: "TEREX 80T" }, { id: "CR-ZL-042", name: "Zoomlion 80T" },
    { id: "CR-SN-080", name: "SANY 80T" }, { id: "CR-SN-085", name: "SANY 85T" },
    { id: "CR-MT-085A", name: "Manitowoc 85T (A)" }, { id: "CR-MT-085B", name: "Manitowoc 85T (B)" },
    { id: "CR-SN-909", name: "SANY 90T" }, { id: "CR-KB-100", name: "Kobelco 100T" },
    { id: "CR-ZL-110", name: "Zoomlion 110T" }, { id: "CR-XCMG-160", name: "XCMG 160T" },
    { id: "CR-SN-150A", name: "Sany 150T (A)" }, { id: "CR-SN-150B", name: "Sany 150T (B)" },
    { id: "CR-ZL-150", name: "Zoomlion 150T" }, { id: "CR-XCMG-150", name: "XCMG 150T" },
    { id: "CR-XCMG-080", name: "XCMG 80T" }, { id: "CR-TX-400", name: "Terex 400T" },
    { id: "CR-TX-600A", name: "Terex 600T (A)" }, { id: "CR-TX-600B", name: "Terex 600T (B)" },
    { id: "CR-LG-750", name: "LIEBHERR 750T" }
].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

const MANPOWER = [{ id: "eng", name: "Engineers", sub: "Supervisory Grade" }, { id: "sup", name: "Supervisors", sub: "Mid-level Mgmt" }, { id: "form", name: "Foreman", sub: "Site Execution" }, { id: "fit", name: "Fitters", sub: "Skilled Labor" }, { id: "fab", name: "Fabricater", sub: "Production Grade" }, { id: "weld", name: "Welder", sub: "High Skill Grade" }, { id: "rig", name: "Riggers", sub: "Material Handling" }, { id: "khal", name: "Khalasi", sub: "Support Crew" }, { id: "grin", name: "Grinder", sub: "Finishing Grade" }, { id: "gas", name: "Gas cutter", sub: "Metal Preparation" }, { id: "tw", name: "T/W", sub: "Watch & Monitor" }, { id: "store", name: "Store-keeper", sub: "Inventory Mgmt" }, { id: "help", name: "Helper", sub: "General Labor" }];


// ============================================================================
// 2. INDUSTRIAL TIME ENGINE
// ============================================================================
function getLiveShiftInfo() {
    const now = new Date(); const hrs = now.getHours();
    let shiftName = ""; let prodDate = new Date(now);

    if (hrs >= 6 && hrs < 14) shiftName = "Shift A (06:00 - 14:00)";
    else if (hrs >= 14 && hrs < 22) shiftName = "Shift B (14:00 - 22:00)";
    else {
        shiftName = "Shift C (22:00 - 06:00)";
        if (hrs < 6) prodDate.setDate(prodDate.getDate() - 1);
    }
    return { shift: shiftName, dateStr: prodDate.toISOString().split('T')[0] };
}

let initialMeta = getLiveShiftInfo();
let todaysDraft = {
    date: initialMeta.dateStr, shift: initialMeta.shift, 
    erection: {}, equipment: {}, manpower: {}
};


// ============================================================================
// 3. SMART SPA ROUTER & VIEW CONTROLLER
// ============================================================================
window.addEventListener('beforeunload', (e) => { e.preventDefault(); e.returnValue = ''; });

function setupSmartRouter() {
    history.replaceState({ view: 'view-login' }, "", "#login");

    window.addEventListener('popstate', (event) => {
        let isAuth = localStorage.getItem("jsw_portal_auth") === "granted";
        let state = event.state;

        if (!isAuth) {
            history.replaceState({ view: 'view-login' }, "", "#login");
            renderActiveScreen('view-login', '', false); return;
        }

        if (state && state.view === 'view-dashboard') {
            renderActiveScreen('view-dashboard', 'Construction MIS', false); return;
        }

        if (!state || state.view !== 'view-dashboard') {
            if (confirm("⚠️ Tapping 'Back' will close the MIS Dashboard. Do you want to stay?")) {
                history.pushState({ view: 'view-dashboard' }, "", "#dashboard");
                renderActiveScreen('view-dashboard', 'Construction MIS', false);
            }
        }
    });
}

function renderActiveScreen(targetId, title, isSubView) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    
    // Forgiving DOM finder: Try exact ID first, if failed, try stripping "view-" 
    let targetEl = document.getElementById(targetId) || document.getElementById(targetId.replace('view-', ''));
    
    if (targetEl) {
        targetEl.classList.add("active");
    } else {
        console.error("CRITICAL ERROR: Could not find HTML tag with id=", targetId);
    }

    let titleDom = document.getElementById("header-title");
    if (titleDom) titleDom.innerText = title;

    let backBtn = document.getElementById("back-btn");
    if (backBtn) backBtn.classList.toggle("hidden", !isSubView);
}

function navigateTo(targetId, title, isSubView) {
    history.pushState({ view: targetId }, "", `#${targetId.replace('view-', '')}`);
    renderActiveScreen(targetId, title, isSubView);
}


// ============================================================================
// 4. BOOTSTRAP INITIALIZER
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    const live = getLiveShiftInfo();
    let dDom = document.getElementById("display-date"); if(dDom) dDom.innerText = live.dateStr;
    let bDom = document.getElementById("banner-date");  if(bDom) bDom.innerText = live.dateStr;
    let sDom = document.getElementById("display-shift"); if(sDom) sDom.innerText = live.shift;

    let codeDom = document.querySelector("#view-manpower .sub-header-info p");
    if (codeDom) codeDom.innerText = "Site Code: JSW-Dolvi-BF#3";

    setupSmartRouter();
    loadTodaysStateIfSaved();
    renderErectionZones(); renderEquipmentCranes();
    renderManpowerList();  renderSavedReportsHistory();
    setupNavigationHandlers();

    // Session Gatekeeper
    if (localStorage.getItem("jsw_portal_auth") === "granted") {
        unlockPortal();
    } else {
        setupLoginScreen();
    }
});

function loadTodaysStateIfSaved() {
    const live = getLiveShiftInfo();
    let saved = JSON.parse(localStorage.getItem("mis_reports") || "{}");
    if (saved[live.dateStr]) todaysDraft = saved[live.dateStr]; 
    else {
        todaysDraft.date = live.dateStr; todaysDraft.shift = live.shift;
        MANPOWER.forEach(m => todaysDraft.manpower[m.name] = 0);
        CRANES.forEach(c => todaysDraft.equipment[c.id] = { state: "IDLE", zone: "", load: "" });
    }
}


// ============================================================================
// 5. LOGIN SCREEN CONTROLLER (WITH FAILSAFE OVERRIDES)
// ============================================================================
function setupLoginScreen() {
    const loginBtn = document.getElementById("btn-submit-login");
    const errDom = document.getElementById("login-error-msg");
    const uidInput = document.getElementById("login-uid");
    const pwdInput = document.getElementById("login-pwd");

    if (!loginBtn || !uidInput || !pwdInput) {
        console.error("LOGIN ABORTED: Check your HTML login input IDs!");
        return;
    }

    function executeAuth() {
        let enteredUid = uidInput.value.trim();
        let enteredPwd = pwdInput.value.trim();

        if (enteredUid === FIXED_UID && enteredPwd === FIXED_PWD) {
            if(errDom) errDom.innerText = "";
            localStorage.setItem("jsw_portal_auth", "granted"); 
            unlockPortal();
        } else {
            if(errDom) errDom.innerText = "❌ Authentication Rejected: Invalid ID or PIN";
            pwdInput.value = ""; 
            pwdInput.focus();
        }
    }

    // Using .onclick guarantees we don't accidentally stack multiple event listeners
    loginBtn.onclick = executeAuth;

    pwdInput.addEventListener("keydown", (e) => { if (e.key === "Enter") executeAuth(); });
    uidInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); pwdInput.focus(); } });
}

function unlockPortal() {
    document.body.classList.remove("auth-locked");
    history.pushState({ view: 'view-dashboard' }, "", "#dashboard");
    renderActiveScreen('view-dashboard', 'Construction MIS', false);
}


// ============================================================================
// 6. ERECTION & MANPOWER RENDERERS
// ============================================================================
function renderErectionZones() {
    const container = document.getElementById("zones-accordion");
    if(!container) return;
    container.innerHTML = ZONES.map(z => {
        let d = todaysDraft.erection[z] || { mt: "", remarks: "" };
        let hasVal = parseFloat(d.mt) > 0;
        return `<div class="zone-acc-item" data-zone="${z}"><div class="zone-acc-header" onclick="toggleAcc(this)"><div><span>${z}</span><small class="preview-text">${hasVal ? `Logged: ${d.mt} MT` : 'No data'}</small></div><span class="acc-arrow"></span></div><div class="zone-acc-body"><div class="input-group"><label>Quantity (MT)</label><input type="number" step="0.1" value="${d.mt}" placeholder="0.00" oninput="saveErection('${z}', 'mt', this.value)"></div><div class="input-group"><label>Remarks</label><input type="text" value="${d.remarks}" placeholder="e.g. Columns C4-C8" oninput="saveErection('${z}', 'remarks', this.value)"></div></div></div>`;
    }).join("");
}
function saveErection(z, f, v) {
    if (!todaysDraft.erection[z]) todaysDraft.erection[z] = { mt: "", remarks: "" };
    todaysDraft.erection[z][f] = v;
    let pDom = document.querySelector(`.zone-acc-item[data-zone="${z}"] .preview-text`);
    if(pDom) pDom.innerText = parseFloat(todaysDraft.erection[z].mt) > 0 ? `Logged: ${todaysDraft.erection[z].mt} MT` : 'No data';
}
function toggleAcc(el) { el.parentElement.classList.toggle("open"); }

function renderManpowerList() {
    const container = document.getElementById("manpower-list");
    if(!container) return;
    container.innerHTML = MANPOWER.map(t => {
        let count = todaysDraft.manpower[t.name] || 0;
        let displayVal = count === 0 ? "" : count; 
        return `<div class="mp-card"><div class="mp-info"><h4>${t.name}</h4><small>${t.sub}</small></div><div class="stepper"><button onclick="changeMp('${t.name}', -1)">−</button><input type="number" class="mp-type-input" id="mp-val-${t.id}" value="${displayVal}" placeholder="0" oninput="typeMp('${t.name}', this.value)" onblur="cleanMpInput(this, '${t.name}')"><button onclick="changeMp('${t.name}', 1)">+</button></div></div>`;
    }).join("");
    updateMpTotal();
}
function changeMp(n, delta) {
    let nxt = Math.max(0, (todaysDraft.manpower[n] || 0) + delta);
    todaysDraft.manpower[n] = nxt;
    let iDom = document.getElementById(`mp-val-${MANPOWER.find(m => m.name === n).id}`);
    if(iDom) iDom.value = nxt === 0 ? "" : nxt; 
    updateMpTotal();
}
function typeMp(n, vStr) { todaysDraft.manpower[n] = vStr === "" ? 0 : Math.max(0, parseInt(vStr) || 0); updateMpTotal(); }
function cleanMpInput(dom, n) { if (dom.value === "" || parseInt(dom.value) <= 0) { dom.value = ""; todaysDraft.manpower[n] = 0; updateMpTotal(); } }
function updateMpTotal() {
    let tot = Object.values(todaysDraft.manpower).reduce((s, v) => s + v, 0);
    let tDom = document.getElementById("total-mp-count"); if(tDom) tDom.innerText = tot;
    let sDom = document.getElementById("stat-mp");        if(sDom) sDom.innerText = tot;
}


// ============================================================================
// 7. EQUIPMENT RENDERER
// ============================================================================
function renderEquipmentCranes() {
    const container = document.getElementById("cranes-list");
    if(!container) return;
    const zoneOptions = ZONES.map(z => `<option value="${z}">${z}</option>`).join("") + `<option value="Others" style="font-weight:bold; color:#1e3a8a;">Others (Outside Plant Area)</option>`;

    container.innerHTML = CRANES.map(crane => {
        let data = todaysDraft.equipment[crane.id] || { state: "IDLE", zone: "", load: "" };
        let isEngaged = data.state === "ENGAGED";
        return `<div class="crane-card ${isEngaged ? 'engaged' : ''}" data-crane-id="${crane.id}"><div class="crane-top"><h4 style="margin:2px 0;">${crane.name}</h4></div><div class="toggle-switch"><button class="${!isEngaged ? 'active' : ''}" onclick="setCraneState('${crane.id}', 'IDLE')">IDLE</button><button class="${isEngaged ? 'active engaged-btn' : ''}" onclick="setCraneState('${crane.id}', 'ENGAGED')">ENGAGED</button></div><div class="crane-details-form"><div class="input-group"><label>Operational Area <span style="color:red;">*</span></label><select onchange="saveCraneData('${crane.id}', 'zone', this.value)"><option value="">-- Select Work Zone --</option>${zoneOptions}</select></div><div class="input-group"><label>Current Load / Task <span style="color:red;">*</span></label><input type="text" value="${data.load}" placeholder="Mandatory task description..." oninput="saveCraneData('${crane.id}', 'load', this.value)"></div></div></div>`;
    }).join("");

    CRANES.forEach(c => {
        let d = todaysDraft.equipment[c.id];
        if (d && d.state === "ENGAGED" && d.zone) {
            let sDom = document.querySelector(`.crane-card[data-crane-id="${c.id}"] select`);
            if(sDom) sDom.value = d.zone;
        }
    });
    updateCraneCounter();
}
function setCraneState(id, st) { todaysDraft.equipment[id].state = st; renderEquipmentCranes(); }
function saveCraneData(id, f, v) { todaysDraft.equipment[id][f] = v; }
function updateCraneCounter() {
    let act = Object.values(todaysDraft.equipment).filter(c => c.state === "ENGAGED").length;
    let cDom = document.getElementById("active-crane-count"); if(cDom) cDom.innerText = String(act).padStart(2, '0');
    let sDom = document.getElementById("stat-eq");            if(sDom) sDom.innerText = `${act} / 19`;
}


// ============================================================================
// 8. CLOUD TRANSMITTER
// ============================================================================
let mSaveBtn = document.getElementById("save-master-report");
if (mSaveBtn) {
    mSaveBtn.addEventListener("click", async () => {
        const timeAtSave = getLiveShiftInfo();
        todaysDraft.date = timeAtSave.dateStr; todaysDraft.shift = timeAtSave.shift;

        let violatingCrane = null;
        for (let c of CRANES) {
            let draft = todaysDraft.equipment[c.id];
            if (draft && draft.state === "ENGAGED") {
                let noZ = (!draft.zone || draft.zone.trim() === "");
                let noL = (!draft.load || draft.load.trim() === "");
                if (noZ || noL) { violatingCrane = { name: c.name, id: c.id, noZ, noL }; break; }
            }
        }

        if (violatingCrane) {
            let msg = violatingCrane.noZ ? "select an Operational Area" : "write a Task Description";
            if (violatingCrane.noZ && violatingCrane.noL) msg = "select an Area AND write a Task";
            alert(`⚠️ SUBMISSION BLOCKED:\n\nCrane [${violatingCrane.name}] is ENGAGED, but you forgot to ${msg}.`);
            navigateTo('view-equipment', 'Equipment Deployment', true);
            setTimeout(() => {
                let badCard = document.querySelector(`.crane-card[data-crane-id="${violatingCrane.id}"]`);
                if (badCard) badCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 200);
            return;
        }

        let allReports = JSON.parse(localStorage.getItem("mis_reports") || "{}");
        allReports[timeAtSave.dateStr] = todaysDraft;
        localStorage.setItem("mis_reports", JSON.stringify(allReports));

        mSaveBtn.innerText = "⏳ TRANSMITTING..."; mSaveBtn.style.backgroundColor = "#b45309"; mSaveBtn.disabled = true;

        try {
            if(GOOGLE_SHEET_URL.includes("YOUR_ACTUAL")) throw new Error("Unlinked URL");
            await fetch(GOOGLE_SHEET_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(todaysDraft) });
            alert(`✅ Master Report for ${timeAtSave.dateStr} logged successfully!`);
        } catch (err) { console.log("Offline cache active."); } 
        finally {
            mSaveBtn.innerText = "SAVE MASTER REPORT"; mSaveBtn.style.backgroundColor = ""; mSaveBtn.disabled = false;
            renderSavedReportsHistory(); document.querySelector('.nav-tab[data-view="view-reports"]').click();
        }
    });
}


// ============================================================================
// 9. HISTORY FEED RENDERER
// ============================================================================
function renderSavedReportsHistory() {
    const feed = document.getElementById("reports-list-container");
    if(!feed) return;
    let allReports = JSON.parse(localStorage.getItem("mis_reports") || "{}");
    let dates = Object.keys(allReports).sort().reverse(); const live = getLiveShiftInfo();

    if (dates.length === 0) { feed.innerHTML = `<p style="color:#94a3b8; text-align:center;">No synced reports yet.</p>`; return; }

    feed.innerHTML = dates.map(dStr => {
        let r = allReports[dStr];
        let tMp = Object.values(r.manpower).reduce((a,b)=>a+b, 0);
        let aEq = Object.values(r.equipment).filter(e => e.state === "ENGAGED").length;

        let erHtml = Object.entries(r.erection).filter(([z, d]) => parseFloat(d.mt) > 0).map(([z, d]) => `<li><span>${z}:</span> <strong>${d.mt} MT</strong></li>`).join('') || `<div class="empty-log">No steel logged</div>`;
        let eqHtml = Object.entries(r.equipment).filter(([id, d]) => d.state === "ENGAGED").map(([id, d]) => `<li><span>${CRANES.find(c=>c.id===id)?.name || id}:</span> <strong>${d.zone}</strong> (${d.load})</li>`).join('') || `<div class="empty-log">All cranes idle</div>`;
        let mpHtml = Object.entries(r.manpower).filter(([t, c]) => c > 0).map(([t, c]) => `<li><span>${t}:</span> <strong>${c}</strong></li>`).join('') || `<div class="empty-log">0 workforce</div>`;

        return `<div class="report-item-card" id="rep-${dStr}"><div class="report-card-summary"><div><small>MIS-${dStr.replace(/-/g, '').slice(2)}</small><h4>${dStr === live.dateStr ? 'Today' : dStr}</h4><span class="status-synced">✓ SYNCED</span></div><div class="summary-right"><small>MP: <strong>${tMp}</strong> | Eq: <strong>${aEq}</strong></small><button class="expand-view-btn" onclick="toggleRepView('${dStr}')">View </button></div></div><div class="report-detail-dropdown"><div class="rep-sect"><h5>️ Erection</h5><ul>${erHtml}</ul></div><div class="rep-sect"><h5>🦾 Cranes</h5><ul>${eqHtml}</ul></div><div class="rep-sect"><h5> Workforce</h5><ul>${mpHtml}</ul></div></div></div>`;
    }).join("");
}

function toggleRepView(d) { let c = document.getElementById(`rep-${d}`); c.classList.toggle('open'); c.querySelector('.expand-view-btn').innerText = c.classList.contains('open') ? 'Close ' : 'View '; }

function setupNavigationHandlers() {
    document.querySelectorAll(".nav-card").forEach(c => c.addEventListener("click", () => navigateTo(c.dataset.target, c.querySelector("h3").innerText, true)));
    let bDom = document.getElementById("back-btn"); if(bDom) bDom.addEventListener("click", () => history.back());
    const bTabs = document.querySelectorAll(".nav-tab");
    bTabs.forEach(tab => tab.addEventListener("click", () => {
        bTabs.forEach(t => t.classList.remove("active")); tab.classList.add("active");
        navigateTo(tab.dataset.view, tab.dataset.view === "view-reports" ? "Saved Reports" : "

