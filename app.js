// ============================================================================
// 1. MASTER DATA ARRAYS (CRANES NOW AUTO-SORTED BY "NATURAL" ALPHABET)
// ============================================================================
const ZONES = ["BF-Shell", "Furnace Proper", "Middle Tower", "Cast House West", "Cast House East", "Main ECR", "DGCP", "Cyclone", "HS#01", "HS#02", "HS#03", "HS#04", "Stove Housing", "Chimney", "MCC Gallery", "Stock House", "Pump house"];

const CRANES = [
    { id: "CR-TE-001", name: "TEREX 80T" }, { id: "CR-ZL-042", name: "Zoomlion 110T" },
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

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyzydefb_jHkmoL6VTbE6WyOCkSSDJSNbeZXxL3Sy-zYzXfzwqClrZ0G6uUIOpKj4do/exec";


// ============================================================================
// 2. INDUSTRIAL CLOCK & SHIFT CALCULATOR
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
// 3. SECURE AUTHENTICATION & SPA ROUTER
// ============================================================================

const FIXED_UID = "Jswmis@5";
const FIXED_PWD = "1234";

window.addEventListener('beforeunload', (e) => { e.preventDefault(); e.returnValue = ''; });

function setupSmartRouter() {
    history.replaceState({ view: 'view-login' }, "", "#login");

    window.addEventListener('popstate', (event) => {
        let isAuth = localStorage.getItem("jsw_portal_auth") === "granted";
        let state = event.state;

        // If user hits back and isn't logged in, keep them trapped on Login
        if (!isAuth) {
            history.replaceState({ view: 'view-login' }, "", "#login");
            renderActiveScreen('view-login', '', false);
            return;
        }

        if (state && state.view === 'view-dashboard') {
            renderActiveScreen('view-dashboard', 'Construction MIS', false);
            return;
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
    document.getElementById(targetId).classList.add("active");
    document.getElementById("header-title").innerText = title;
    document.getElementById("back-btn").classList.toggle("hidden", !isSubView);
}

function navigateTo(targetId, title, isSubView) {
    history.pushState({ view: targetId }, "", `#${targetId.replace('view-', '')}`);
    renderActiveScreen(targetId, title, isSubView);
}


// ============================================================================
// 4. BOOTSTRAP APP ON LOAD (WITH SESSION MEMORY)
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
    const live = getLiveShiftInfo();
    document.getElementById("display-date").innerText = live.dateStr;
    document.getElementById("banner-date").innerText = live.dateStr;
    const shiftDom = document.getElementById("display-shift");
    if (shiftDom) shiftDom.innerText = live.shift;

    const siteCodeDom = document.querySelector("#view-manpower .sub-header-info p");
    if (siteCodeDom) siteCodeDom.innerText = "Site Code: JSW-Dolvi-BF#3";

    setupSmartRouter();
    loadTodaysStateIfSaved();
    renderErectionZones(); renderEquipmentCranes();
    renderManpowerList();  renderSavedReportsHistory();
    setupNavigationHandlers();

    // --- CHECK SESSION MEMORY ON BOOT ---
    if (localStorage.getItem("jsw_portal_auth") === "granted") {
        unlockPortal();
    } else {
        setupLoginScreen();
    }
});


function setupLoginScreen() {
    const loginBtn = document.getElementById("btn-submit-login");
    const errDom = document.getElementById("login-error-msg");

    loginBtn.addEventListener("click", () => {
        let enteredUid = document.getElementById("login-uid").value.trim();
        let enteredPwd = document.getElementById("login-pwd").value.trim();

        if (enteredUid === FIXED_UID && enteredPwd === FIXED_PWD) {
            errDom.innerText = "";
            localStorage.setItem("jsw_portal_auth", "granted"); // Save session
            unlockPortal();
        } else {
            errDom.innerText = "❌ Authentication Rejected: Invalid ID or PIN";
            document.getElementById("login-pwd").value = ""; // Clear PIN box
            document.getElementById("login-pwd").focus();
        }
    });
}


function unlockPortal() {
    // 1. Rip the invisibility cloak off the body
    document.body.classList.remove("auth-locked");

    // 2. Push user into the dashboard
    history.pushState({ view: 'view-dashboard' }, "", "#dashboard");
    renderActiveScreen('view-dashboard', 'Construction MIS', false);
}



// ============================================================================
// 5. ERECTION & MANPOWER (NOW WITH DIRECT NUMBER TYPING)
// ============================================================================
function renderErectionZones() {
    const container = document.getElementById("zones-accordion");
    container.innerHTML = ZONES.map(z => {
        let d = todaysDraft.erection[z] || { mt: "", remarks: "" };
        let hasVal = parseFloat(d.mt) > 0;
        return `<div class="zone-acc-item" data-zone="${z}"><div class="zone-acc-header" onclick="toggleAcc(this)"><div><span>${z}</span><small class="preview-text">${hasVal ? `Logged: ${d.mt} MT` : 'No data'}</small></div><span class="acc-arrow">🔻</span></div><div class="zone-acc-body"><div class="input-group"><label>Quantity (MT)</label><input type="number" step="0.1" value="${d.mt}" placeholder="0.00" oninput="saveErection('${z}', 'mt', this.value)"></div><div class="input-group"><label>Remarks</label><input type="text" value="${d.remarks}" placeholder="e.g. Columns C4-C8" oninput="saveErection('${z}', 'remarks', this.value)"></div></div></div>`;
    }).join("");
}
function saveErection(z, f, v) {
    if (!todaysDraft.erection[z]) todaysDraft.erection[z] = { mt: "", remarks: "" };
    todaysDraft.erection[z][f] = v;
    document.querySelector(`.zone-acc-item[data-zone="${z}"] .preview-text`).innerText = parseFloat(todaysDraft.erection[z].mt) > 0 ? `Logged: ${todaysDraft.erection[z].mt} MT` : 'No data';
}
function toggleAcc(el) { el.parentElement.classList.toggle("open"); }

// function renderManpowerList() {
//     document.getElementById("manpower-list").innerHTML = MANPOWER.map(t => {
//         let count = todaysDraft.manpower[t.name] || 0;
//         return `
//             <div class="mp-card">
//                 <div class="mp-info"><h4>${t.name}</h4><small>${t.sub}</small></div>
//                 <div class="stepper">
//                     <button onclick="changeMp('${t.name}', -1)">−</button>
//                     <input type="number" class="mp-type-input" id="mp-val-${t.id}" value="${count}" 
//                            oninput="typeMp('${t.name}', this.value)" 
//                            onfocus="this.select()" 
//                            onblur="cleanMpInput(this, '${t.name}')">
//                     <button onclick="changeMp('${t.name}', 1)">+</button>
//                 </div>
//             </div>
//         `;
//     }).join("");
//     updateMpTotal();
// }

function renderManpowerList() {
    document.getElementById("manpower-list").innerHTML = MANPOWER.map(t => {
        let count = todaysDraft.manpower[t.name] || 0;
        
        // THE PLACEHOLDER HACK: If count is 0, pass an empty string ""
        let displayVal = count === 0 ? "" : count; 

        return `
            <div class="mp-card">
                <div class="mp-info"><h4>${t.name}</h4><small>${t.sub}</small></div>
                <div class="stepper">
                    <button onclick="changeMp('${t.name}', -1)">−</button>
                    <input type="number" class="mp-type-input" id="mp-val-${t.id}" 
                           value="${displayVal}" placeholder="0"
                           oninput="typeMp('${t.name}', this.value)" 
                           onblur="cleanMpInput(this, '${t.name}')">
                    <button onclick="changeMp('${t.name}', 1)">+</button>
                </div>
            </div>
        `;
    }).join("");
    updateMpTotal();
}

function changeMp(n, delta) {
    let current = todaysDraft.manpower[n] || 0;
    let nxt = Math.max(0, current + delta);
    todaysDraft.manpower[n] = nxt;
    
    // If the math results in 0, turn it back into an empty string
    document.getElementById(`mp-val-${MANPOWER.find(m => m.name === n).id}`).value = nxt === 0 ? "" : nxt; 
    updateMpTotal();
}

function typeMp(n, valStr) {
    let clean = valStr === "" ? 0 : Math.max(0, parseInt(valStr) || 0);
    todaysDraft.manpower[n] = clean;
    updateMpTotal();
}

function cleanMpInput(inputDom, tradeName) {
    if (inputDom.value === "" || parseInt(inputDom.value) <= 0) {
        inputDom.value = ""; // Keep it empty so the placeholder '0' sits there
        todaysDraft.manpower[tradeName] = 0;
        updateMpTotal();
    }
}

// Fired when clicking the + or - buttons
function changeMp(n, delta) {
    let current = todaysDraft.manpower[n] || 0;
    let nxt = Math.max(0, current + delta);
    todaysDraft.manpower[n] = nxt;
    document.getElementById(`mp-val-${MANPOWER.find(m => m.name === n).id}`).value = nxt;
    updateMpTotal();
}

// Fired instantly as the user types digits on their keyboard
function typeMp(n, valStr) {
    let clean = valStr === "" ? 0 : Math.max(0, parseInt(valStr) || 0);
    todaysDraft.manpower[n] = clean;
    updateMpTotal();
}

// Fired when user clicks away from the input box
function cleanMpInput(inputDom, tradeName) {
    if (inputDom.value === "" || parseInt(inputDom.value) < 0) {
        inputDom.value = "0";
        todaysDraft.manpower[tradeName] = 0;
        updateMpTotal();
    }
}

function updateMpTotal() {
    let tot = Object.values(todaysDraft.manpower).reduce((s, v) => s + v, 0);
    document.getElementById("total-mp-count").innerText = tot;
    document.getElementById("stat-mp").innerText = tot;
}


// ============================================================================
// 6. EQUIPMENT RENDERER (ASSET IDs STRIPPED)
// ============================================================================
function renderEquipmentCranes() {
    const container = document.getElementById("cranes-list");
    const zoneOptions = ZONES.map(z => `<option value="${z}">${z}</option>`).join("") + 
        `<option value="Others" style="font-weight:bold; color:#1e3a8a;">Others (Outside Plant Area)</option>`;

    container.innerHTML = CRANES.map(crane => {
        let data = todaysDraft.equipment[crane.id] || { state: "IDLE", zone: "", load: "" };
        let isEngaged = data.state === "ENGAGED";
        return `
            <div class="crane-card ${isEngaged ? 'engaged' : ''}" data-crane-id="${crane.id}">
                <div class="crane-top"><h4 style="margin:2px 0;">${crane.name}</h4></div>
                <div class="toggle-switch">
                    <button class="${!isEngaged ? 'active' : ''}" onclick="setCraneState('${crane.id}', 'IDLE')">IDLE</button>
                    <button class="${isEngaged ? 'active engaged-btn' : ''}" onclick="setCraneState('${crane.id}', 'ENGAGED')">ENGAGED</button>
                </div>
                <div class="crane-details-form">
                    <div class="input-group">
                        <label>Operational Area <span style="color:red;">*</span></label>
                        <select onchange="saveCraneData('${crane.id}', 'zone', this.value)">
                            <option value="">-- Select Work Zone --</option>
                            ${zoneOptions}
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Current Load / Task <span style="color:red;">*</span></label>
                        <input type="text" value="${data.load}" placeholder="Mandatory task description..." oninput="saveCraneData('${crane.id}', 'load', this.value)">
                    </div>
                </div>
            </div>
        `;
    }).join("");

    CRANES.forEach(c => {
        let d = todaysDraft.equipment[c.id];
        if (d && d.state === "ENGAGED" && d.zone) {
            document.querySelector(`.crane-card[data-crane-id="${c.id}"] select`).value = d.zone;
        }
    });

    updateCraneCounter();
}

function setCraneState(craneId, state) { todaysDraft.equipment[craneId].state = state; renderEquipmentCranes(); }
function saveCraneData(craneId, field, val) { todaysDraft.equipment[craneId][field] = val; }
function updateCraneCounter() {
    let active = Object.values(todaysDraft.equipment).filter(c => c.state === "ENGAGED").length;
    document.getElementById("active-crane-count").innerText = String(active).padStart(2, '0');
    document.getElementById("stat-eq").innerText = `${active} / 19`;
}


// ============================================================================
// 7. MASTER SAVE TRANSMITTER
// ============================================================================
document.getElementById("save-master-report").addEventListener("click", async () => {
    const timeAtSave = getLiveShiftInfo();
    todaysDraft.date = timeAtSave.dateStr; todaysDraft.shift = timeAtSave.shift;

    let violatingCrane = null;
    for (let c of CRANES) {
        let draft = todaysDraft.equipment[c.id];
        if (draft && draft.state === "ENGAGED") {
            let noZone = (!draft.zone || draft.zone.trim() === "");
            let noLoad = (!draft.load || draft.load.trim() === "");
            if (noZone || noLoad) { violatingCrane = { name: c.name, id: c.id, noZone, noLoad }; break; }
        }
    }

    if (violatingCrane) {
        let msg = violatingCrane.noZone ? "select an Operational Area" : "write a Task Description";
        if (violatingCrane.noZone && violatingCrane.noLoad) msg = "select an Area AND write a Task";

        alert(`⚠️ SUBMISSION BLOCKED:\n\nCrane [${violatingCrane.name}] is toggled to ENGAGED, but you forgot to ${msg}.`);
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

    const saveBtn = document.getElementById("save-master-report");
    saveBtn.innerText = "⏳ TRANSMITTING..."; saveBtn.style.backgroundColor = "#b45309"; saveBtn.disabled = true;

    try {
        if(GOOGLE_SHEET_URL.includes("YOUR_ACTUAL")) throw new Error("Unlinked URL");
        await fetch(GOOGLE_SHEET_URL, {
            method: "POST", mode: "no-cors",
            headers: { "Content-Type": "text/plain" }, body: JSON.stringify(todaysDraft)
        });
        alert(`✅ Master Report for ${timeAtSave.dateStr} (${timeAtSave.shift}) logged successfully!`);
    } catch (err) { console.log("Offline mode: Saved safely to phone memory."); } 
    finally {
        saveBtn.innerText = "SAVE MASTER REPORT"; saveBtn.style.backgroundColor = ""; saveBtn.disabled = false;
        renderSavedReportsHistory(); document.querySelector('.nav-tab[data-view="view-reports"]').click();
    }
});


// ============================================================================
// 8. HISTORIC FEED & NAVIGATION
// ============================================================================
function renderSavedReportsHistory() {
    const feed = document.getElementById("reports-list-container");
    let allReports = JSON.parse(localStorage.getItem("mis_reports") || "{}");
    let dates = Object.keys(allReports).sort().reverse();
    const live = getLiveShiftInfo();

    if (dates.length === 0) { feed.innerHTML = `<p style="color:#94a3b8; text-align:center;">No synced reports yet.</p>`; return; }

    feed.innerHTML = dates.map(dStr => {
        let r = allReports[dStr];
        let tMp = Object.values(r.manpower).reduce((a,b)=>a+b, 0);
        let aEq = Object.values(r.equipment).filter(e => e.state === "ENGAGED").length;

        let erHtml = Object.entries(r.erection).filter(([z, d]) => parseFloat(d.mt) > 0).map(([z, d]) => `<li><span>${z}:</span> <strong>${d.mt} MT</strong></li>`).join('') || `<div class="empty-log">No steel logged</div>`;
        let eqHtml = Object.entries(r.equipment).filter(([id, d]) => d.state === "ENGAGED").map(([id, d]) => `<li><span>${CRANES.find(c=>c.id===id)?.name || id}:</span> <strong>${d.zone}</strong> (${d.load})</li>`).join('') || `<div class="empty-log">All cranes idle</div>`;
        let mpHtml = Object.entries(r.manpower).filter(([t, c]) => c > 0).map(([t, c]) => `<li><span>${t}:</span> <strong>${c}</strong></li>`).join('') || `<div class="empty-log">0 workforce</div>`;

        return `<div class="report-item-card" id="rep-${dStr}"><div class="report-card-summary"><div><small>MIS-${dStr.replace(/-/g, '').slice(2)}</small><h4>${dStr === live.dateStr ? 'Today' : dStr}</h4><span class="status-synced">✓ SYNCED</span></div><div class="summary-right"><small>MP: <strong>${tMp}</strong> | Eq: <strong>${aEq}</strong></small><button class="expand-view-btn" onclick="toggleRepView('${dStr}')">View 🔻</button></div></div><div class="report-detail-dropdown"><div class="rep-sect"><h5>🏗️ Erection</h5><ul>${erHtml}</ul></div><div class="rep-sect"><h5>🦾 Cranes</h5><ul>${eqHtml}</ul></div><div class="rep-sect"><h5>👥 Workforce</h5><ul>${mpHtml}</ul></div></div></div>`;
    }).join("");
}

function toggleRepView(d) { 
    let c = document.getElementById(`rep-${d}`); c.classList.toggle('open'); 
    c.querySelector('.expand-view-btn').innerText = c.classList.contains('open') ? 'Close 🔺' : 'View 🔻'; 
}

function setupNavigationHandlers() {
    document.querySelectorAll(".nav-card").forEach(c => c.addEventListener("click", () => navigateTo(c.dataset.target, c.querySelector("h3").innerText, true)));
    document.getElementById("back-btn").addEventListener("click", () => history.back());
    const bTabs = document.querySelectorAll(".nav-tab");
    bTabs.forEach(tab => tab.addEventListener("click", () => {
        bTabs.forEach(t => t.classList.remove("active")); tab.classList.add("active");
        navigateTo(tab.dataset.view, tab.dataset.view === "view-reports" ? "Saved Reports" : "Construction MIS", false);
    }));
}
