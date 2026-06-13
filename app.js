/**
 * CELESTIAL CHURCH OF CHRIST - CLIENT PORTAL ENGINE (app.js)
 * Consolidated logic file strictly separated from presentation and styling.
 */

// ==========================================
// 1. GLOBAL SYSTEM CONSTANTS
// ==========================================
const CLERGY_RANKS = [
    "Pastor C.C.C. Worldwide",
    "Supreme Evangelist",
    "Most Superior Evangelist",
    "Assistant Most Superior Evangelist",
    "Superior Evangelist",
    "Venerable Evangelist",
    "Most Senior Evangelist",
    "Senior Evangelist",
    "Evangelist",
    "Assistant Evangelist"
];

const MALE_RANKS = [
    "Special Superior Evangelist",
    "Special Venerable Evangelist",
    "Special/Most Senior Evangelist",
    "Honorary Senior Evangelist",
    "Honorary Evangelist",
    "Honorary Assistant Evangelist",
    "Superior Senior Leader",
    "Senior Leader",
    "Leader",
    "Assistant Leader",
    "Superior Senior Elder Brother",
    "Senior Elder Brother",
    "Cape Elder Brother",
    "Elder Brother",
    "Brother"
];

const PROPHET_RANKS = [
    "Superior Senior Prophet",
    "Senior Prophet",
    "Cape Prophet (Wolidah)",
    "Anointed Prophet (Woli)"
];

const FEMALE_RANKS = [
    "Mother Celestial",
    "Lace Superior Senior Elder Sister",
    "Superior Senior Elder Sister",
    "Lace Senior Elder Sister",
    "Senior Elder Sister",
    "Cape Elder Sister",
    "Elder Sister",
    "Sister"
];

const PROPHETESS_RANKS = [
    "Mother Celestial Prophetess",
    "Lace Superior Senior Prophetess",
    "Superior Senior Prophetess",
    "Senior Prophetess",
    "Cape Prophetess",
    "Prophetess"
];

const OCCUPATIONS_LIST = [
    "Trader/Merchant", "Architect", "Engineer", "Medical Doctor", "Nurse", "Physiotherapist", 
    "Teacher/Lecturer", "Civil Servant", "Business Executive", "Lawyer", "Accountant", 
    "Student", "Retiree", "Self-Employed", "Other"
];

const MONTHS = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

// ==========================================
// 2. CENTRAL ENGINE STATE
// ==========================================
let state = {
    parishName: "Grace Parish, Lagos",
    logoBase64: "",
    adminPassword: "admin",
    adminGreeting: "Halleluyah Admin!",
    supabaseUrl: "",
    supabaseKey: "",
    currentParishId: "", 
    adultHarvestDate: "",
    isLoggedIn: false, 
    activeParishId: "", 
    parishes: [], 
    members: [],
    linkages: [],
    departments: {
        "THE PAROCHIAL COMMITTEE": { current: [], former: [] },
        "THE CHOIR": { current: [], former: [] },
        "THE ICT MEDIA": { current: [], former: [] },
        "THE SIDEMEN/WOMEN": { current: [], former: [] },
        "THE PROPHETS/PROPHETESS": { current: [], former: [] },
        "THE SUNDAY SCHOOL": { current: [], former: [] }
    },
    attendance: [],
    finances: [],
    births: [],
    deaths: [],
    committees: [] 
};

let supabaseClient = null;

// ==========================================
// 3. LIFECYCLE INITIALIZATION
// ==========================================
window.onload = async function() {
    const savedState = localStorage.getItem("ccc_database_state");
    if (savedState) {
        try {
            state = JSON.parse(savedState);
        } catch(e) {
            console.error("Local registry corruption detected. Performing system reset.", e);
        }
    } else {
        generateMockRecords();
    }

    if (!state.currentParishId) {
        state.currentParishId = generateUUID();
        saveStateToStorage();
    }

    // Baseline validation to prevent licensing panel lockout
    if (!Array.isArray(state.parishes) || state.parishes.length === 0 || !state.parishes[0].password) {
        state.parishes = [{
            id: state.currentParishId || generateUUID(),
            name: state.parishName || "Grace Parish, Lagos",
            password: state.adminPassword || "admin",
            status: "Approved" 
        }];
        state.currentParishId = state.parishes[0].id;
        state.parishName = state.parishes[0].name;
        state.adminPassword = state.parishes[0].password;
        saveStateToStorage();
    }

    populateDropdowns();
    initSupabaseClient();
    applyConfigToDOM();
    populateEntranceSelector();

    if (state.isLoggedIn) {
        if (!state.activeParishId) {
            state.activeParishId = state.currentParishId || state.parishes[0].id;
        }
        
        document.getElementById("landingPage").classList.add("hidden");
        document.getElementById("mainApp").classList.remove("hidden");
        
        if (state.activeParishId === 'aarinat') {
            document.getElementById("navBtnApprovals").classList.remove("hidden");
            renderHQApprovals();
        } else {
            state.currentParishId = state.activeParishId;
            const activeP = state.parishes.find(p => p.id === state.activeParishId);
            if (activeP) {
                state.parishName = activeP.name;
                state.adminPassword = activeP.password;
            }
            if (supabaseClient) {
                await loadCloudData();
            }
        }
        runAuditSimulation();
    }

    document.getElementById("dashboardDate").innerText = new Date().toDateString();
    processAgeTransitions();
    calculateLiturgicalDates();
    renderCommittees();
};

// ==========================================
// 4. DATABASE & CLOUD UTILITIES
// ==========================================
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function initSupabaseClient() {
    if (state.supabaseUrl && state.supabaseKey && window.supabase) {
        try {
            supabaseClient = window.supabase.createClient(state.supabaseUrl, state.supabaseKey);
            console.log("Supabase Client connection successful.");
        } catch (e) {
            console.error("Supabase Client failed to compile: ", e);
            supabaseClient = null;
        }
    } else {
        supabaseClient = null;
    }
}

function saveStateToStorage() {
    localStorage.setItem("ccc_database_state", JSON.stringify(state));
    applyConfigToDOM();
}

function clearLocalStorage() {
    if (confirm("Reset local database? Unsynchronized changes will be lost.")) {
        localStorage.removeItem("ccc_database_state");
        location.reload();
    }
}

function generateMockRecords() {
    state.members = [
        {
            id: "CCC-CLG-00001",
            classification: "CLERGY",
            name: "Leader Evang. Isaiah Sowande",
            gender: "Male",
            maritalStatus: "Married",
            phone: "+2348033190831",
            address: "CCC International HQ Compound, Ketu, Lagos",
            rank: "Senior Evangelist",
            specialPos: "None",
            specialScope: "Local",
            occupation: "Clergyman",
            anointmentDate: "2023-11-20",
            dob: "December 12",
            dobYear: "1972",
            isDiaspora: "No",
            status: "Active",
            nokName: "Sis. Sowande",
            nokPhone: "+2348033190832",
            nokAddress: "Ketu, Lagos",
            portrait_base64: ""
        },
        {
            id: "CCC-MBR-00001",
            classification: "MEMBER",
            name: "Bro. John Adeleke",
            gender: "Male",
            maritalStatus: "Married",
            phone: "+2348055102043",
            address: "15 Celestial Street, Lagos",
            rank: "Brother",
            specialPos: "Choir Master",
            specialScope: "Local",
            occupation: "Architect",
            anointmentDate: "2024-05-15",
            dob: "October 18",
            dobYear: "1980",
            isDiaspora: "No",
            status: "Active",
            nokName: "Mary Adeleke",
            nokPhone: "+2348055102044",
            nokAddress: "15 Celestial Street, Lagos",
            portrait_base64: ""
        }
    ];
    state.linkages = [];
    saveStateToStorage();
}

async function syncStateToCloud(table, payload, deleteId = null) {
    if (!supabaseClient || !state.currentParishId) return;
    try {
        if (deleteId) {
            await supabaseClient.from(table)
                .delete()
                .eq('id', deleteId)
                .eq('parish_id', state.currentParishId);
        } else {
            payload.parish_id = state.currentParishId;
            await supabaseClient.from(table).upsert([payload]);
        }
    } catch (err) {
        console.error("Supabase cloud sync failed on: " + table, err);
    }
}

async function loadCloudData() {
    if (!supabaseClient || !state.currentParishId) return;
    try {
        const { data: members, error: mErr } = await supabaseClient.from('members').select('*').eq('parish_id', state.currentParishId);
        if (members && !mErr) state.members = members;
        saveStateToStorage();
    } catch (e) {
        console.error("Cloud download execution halted: ", e);
    }
}

// ==========================================
// 5. VIEW PORT CONTROLLER
// ==========================================
function showSection(sectionId) {
    document.querySelectorAll('[id^="section-"]').forEach(sec => sec.classList.add("hidden"));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('bg-slate-800'));
    
    const activeSection = document.getElementById(`section-${sectionId}`);
    if (activeSection) {
        activeSection.classList.remove("hidden");
    }
    
    if (window.innerWidth < 768) {
        const sidebar = document.getElementById("appSidebar");
        sidebar.classList.add("hidden");
        sidebar.classList.remove("flex");
    }

    if (sectionId === 'dashboard') {
        renderDashboardMetrics();
        renderWeeklyCelebrations();
    } else if (sectionId === 'clergy') {
        renderClergyRegistry();
    } else if (sectionId === 'members') {
        renderMembersRegistry();
    } else if (sectionId === 'departments') {
        loadDepartmentView();
    } else if (sectionId === 'youth') {
        renderYouthPipeline();
    } else if (sectionId === 'family') {
        renderFamilyConnections();
    } else if (sectionId === 'attendance') {
        renderAttendanceLedger();
    } else if (sectionId === 'finance') {
        renderFinancialLedger();
    } else if (sectionId === 'certificates') {
        renderCertificatesLists();
    } else if (sectionId === 'committees') {
        renderCommittees();
    }
}

function renderDashboardMetrics() {
    const clergyCount = state.members.filter(m => m.classification === 'CLERGY' && m.status === 'Active').length;
    const memberCount = state.members.filter(m => m.classification === 'MEMBER' && !m.isYouthPipeline && m.isDiaspora === 'No').length;
    const youthCount = state.members.filter(m => {
        if (m.classification !== 'MEMBER' || !m.dobYear) return false;
        const age = getCalculatedAge(m.dobYear);
        return (age !== null && age >= 2 && age < 18);
    }).length;
    const diasporaCount = state.members.filter(m => m.isDiaspora === 'Yes').length;

    document.getElementById("metricClergy").innerText = clergyCount;
    document.getElementById("metricMembers").innerText = memberCount;
    document.getElementById("metricYouth").innerText = youthCount;
    document.getElementById("metricDiaspora").innerText = diasporaCount;
}

// ==========================================
// 6. CLERGY & MEMBER REGISTRIES
// ==========================================
let currentClergyTab = "active";
function toggleClergyTab(tab) {
    currentClergyTab = tab;
    document.getElementById("btn-clergy-active").className = tab === 'active' ? 'border-b-2 border-blue-600 text-blue-600 px-1 py-2 text-xs font-bold uppercase tracking-wider' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 px-1 py-2 text-xs font-bold uppercase tracking-wider';
    document.getElementById("btn-clergy-former").className = tab === 'former' ? 'border-b-2 border-blue-600 text-blue-600 px-1 py-2 text-xs font-bold uppercase tracking-wider' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 px-1 py-2 text-xs font-bold uppercase tracking-wider';
    renderClergyRegistry();
}

function renderClergyRegistry() {
    const activeCont = document.getElementById("clergy-active-container");
    const formerCont = document.getElementById("clergy-former-container");
    if (!activeCont || !formerCont) return;

    activeCont.innerHTML = "";
    formerCont.innerHTML = "";

    const clergy = state.members.filter(m => m.classification === 'CLERGY');
    clergy.forEach(c => {
        const card = document.createElement("div");
        card.className = "bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-3";
        
        let avatarHTML = `<div class="w-10 h-10 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold text-sm uppercase">${c.name.charAt(0)}</div>`;
        if (c.portrait_base64) {
            avatarHTML = `<img src="${c.portrait_base64}" class="w-10 h-10 object-cover rounded-full border border-gray-200" alt="Avatar">`;
        }

        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start gap-2">
                    <div class="flex items-center gap-2">
                        ${avatarHTML}
                        <div>
                            <h4 class="font-bold text-gray-800 text-xs">${c.name}</h4>
                            <p class="text-[9px] text-gray-400">ID: ${c.id}</p>
                        </div>
                    </div>
                    <span class="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">${c.rank}</span>
                </div>
                <div class="mt-2 space-y-0.5">
                    <p class="text-[10px] text-gray-500"><i class="fa-solid fa-phone"></i> ${c.phone || 'No Phone'}</p>
                    <p class="text-[10px] text-gray-500"><i class="fa-solid fa-map-pin"></i> ${c.address || 'No Address'}</p>
                </div>
            </div>
            <div class="flex gap-2 border-t pt-2 mt-2">
                <button onclick="openEditMember('${c.id}')" class="flex-1 py-1 bg-gray-100 text-gray-700 text-[10px] rounded hover:bg-gray-200 font-bold">Edit</button>
                <button onclick="toggleClergyStatus('${c.id}')" class="flex-1 py-1 bg-red-50 text-red-700 text-[10px] rounded hover:bg-red-100 font-bold">${c.status === 'Active' ? 'Transfer Out' : 'Restore Active'}</button>
            </div>
        `;

        if (c.status === 'Active') {
            activeCont.appendChild(card);
        } else {
            formerCont.appendChild(card);
        }
    });

    if (currentClergyTab === 'active') {
        activeCont.classList.remove("hidden");
        formerCont.classList.add("hidden");
    } else {
        activeCont.classList.add("hidden");
        formerCont.classList.remove("hidden");
    }
}

let currentMemberTab = "all";
function toggleMemberTab(tab) {
    currentMemberTab = tab;
    document.getElementById("btn-member-all").className = tab === 'all' ? 'border-b-2 border-blue-600 text-blue-600 px-1 py-2 text-xs font-bold uppercase tracking-wider' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 px-1 py-2 text-xs font-bold uppercase tracking-wider';
    document.getElementById("btn-member-diaspora").className = tab === 'diaspora' ? 'border-b-2 border-blue-600 text-blue-600 px-1 py-2 text-xs font-bold uppercase tracking-wider' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 px-1 py-2 text-xs font-bold uppercase tracking-wider';
    renderMembersRegistry();
}

function renderMembersRegistry() {
    const cont = document.getElementById("members-list-container");
    if (!cont) return;
    cont.innerHTML = "";

    const members = state.members.filter(m => m.classification === 'MEMBER' && !m.isYouthPipeline);
    const target = members.filter(m => currentMemberTab === 'all' ? m.isDiaspora === 'No' : m.isDiaspora === 'Yes');

    if (target.length === 0) {
        cont.innerHTML = `<div class="col-span-full text-center text-xs text-gray-400 p-6">No matching congregation profiles found.</div>`;
        return;
    }

    target.forEach(m => {
        let avatarHTML = `<div class="w-10 h-10 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center font-bold text-sm uppercase">${m.name.charAt(0)}</div>`;
        if (m.portrait_base64) {
            avatarHTML = `<img src="${m.portrait_base64}" class="w-10 h-10 object-cover rounded-full border border-gray-200" alt="Avatar">`;
        }

        cont.innerHTML += `
            <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-3">
                <div>
                    <div class="flex justify-between items-start gap-2">
                        <div class="flex items-center gap-2">
                            ${avatarHTML}
                            <div>
                                <h4 class="font-bold text-gray-800 text-xs">${m.name}</h4>
                                <p class="text-[9px] text-gray-400">ID: ${m.id}</p>
                            </div>
                        </div>
                        <span class="text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">${m.rank}</span>
                    </div>
                    <div class="mt-2 space-y-0.5">
                        <p class="text-[10px] text-gray-500">Occupation: <strong>${m.occupation || 'N/A'}</strong></p>
                        <p class="text-[10px] text-gray-500">Phone: ${m.phone || 'N/A'}</p>
                    </div>
                </div>
                <div class="flex gap-2 border-t pt-2 mt-3">
                    <button onclick="openEditMember('${m.id}')" class="flex-1 py-1 bg-gray-100 text-gray-700 text-[10px] rounded hover:bg-gray-200 font-bold">Edit Profile</button>
                    <button onclick="deleteMember('${m.id}')" class="flex-1 py-1 bg-red-50 text-red-700 text-[10px] rounded hover:bg-red-100 font-bold">Remove</button>
                </div>
            </div>
        `;
    });
}

// ==========================================
// 7. SECURITY & ACCESS GATES
// ==========================================
function togglePasswordVisibility() {
    const pInput = document.getElementById("adminPasswordInput");
    const icon = document.getElementById("passwordEyeIcon");
    if (pInput.type === "password") {
        pInput.type = "text";
        icon.className = "fa-solid fa-eye-slash text-sm";
    } else {
        pInput.type = "password";
        icon.className = "fa-solid fa-eye text-sm";
    }
}

function openAddMemberModal(classification) {
    document.getElementById("memberForm").reset();
    document.getElementById("member_edit_id").value = "";
    document.getElementById("member_classification").value = classification;
    document.getElementById("memberModalTitle").innerText = classification === 'CLERGY' ? 'Add New Clergyman' : 'Add New Member';
    
    document.getElementById("profilePortraitPreview").classList.add("hidden");
    document.getElementById("profilePortraitPlaceholder").classList.remove("hidden");
    
    updateRankDropdown();
    document.getElementById("memberModal").classList.remove("hidden");
}

function closeMemberModal() {
    document.getElementById("memberModal").classList.add("hidden");
}

function previewProfilePortrait(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById("profilePortraitPreview").src = e.target.result;
        document.getElementById("profilePortraitPreview").classList.remove("hidden");
        document.getElementById("profilePortraitPlaceholder").classList.add("hidden");
    };
    reader.readAsDataURL(file);
}

function saveMemberForm() {
    const editId = document.getElementById("member_edit_id").value;
    const classification = document.getElementById("member_classification").value;
    const name = document.getElementById("m_name").value.trim();
    if (!name) return alert("Full Name is required.");

    const portraitImg = document.getElementById("profilePortraitPreview");
    let base64 = "";
    if (!portraitImg.classList.contains("hidden")) {
        base64 = portraitImg.src;
    }

    const dobYear = document.getElementById("m_dob_year").value;
    const calculatedAge = getCalculatedAge(dobYear);
    const isYouthPipeline = (calculatedAge !== null && calculatedAge < 18);

    const mPayload = {
        id: editId || (classification === 'CLERGY' ? `CCC-CLG-${Date.now()}` : `CCC-MBR-${Date.now()}`),
        classification: classification,
        name: name,
        gender: document.getElementById("m_gender").value,
        maritalStatus: document.getElementById("m_marital").value,
        phone: document.getElementById("m_phone").value.trim(),
        address: document.getElementById("m_address").value.trim(),
        rank: document.getElementById("m_rank").value,
        specialPos: document.getElementById("m_special_pos").value,
        specialScope: document.getElementById("m_special_scope").value,
        occupation: document.getElementById("m_occupation").value,
        anointmentDate: document.getElementById("m_anointment").value,
        dob: `${document.getElementById("m_dob_month").value} ${document.getElementById("m_dob_day").value}`,
        dobYear: dobYear,
        isDiaspora: document.getElementById("m_diaspora").value,
        status: "Active",
        nokName: document.getElementById("m_nokName").value.trim(),
        nokPhone: document.getElementById("m_nokPhone").value.trim(),
        nokAddress: document.getElementById("m_nokAddress").value.trim(),
        portrait_base64: base64,
        isYouthPipeline: isYouthPipeline
    };

    if (editId) {
        const idx = state.members.findIndex(m => m.id === editId);
        if (idx !== -1) state.members[idx] = mPayload;
    } else {
        state.members.push(mPayload);
    }

    sortAndReassignRankIDs();
    syncStateToCloud('members', mPayload);
    closeMemberModal();
    runAuditSimulation();
    showSection(classification.toLowerCase() === 'clergy' ? 'clergy' : 'members');
}

function openEditMember(id) {
    const m = state.members.find(m => m.id === id);
    if (!m) return;

    openAddMemberModal(m.classification);
    document.getElementById("member_edit_id").value = m.id;
    document.getElementById("m_name").value = m.name;
    document.getElementById("m_gender").value = m.gender;
    document.getElementById("m_marital").value = m.maritalStatus;
    document.getElementById("m_phone").value = m.phone;
    document.getElementById("m_address").value = m.address;
    document.getElementById("m_special_pos").value = m.specialPos || "None";
    document.getElementById("m_special_scope").value = m.specialScope || "Local";
    document.getElementById("m_occupation").value = m.occupation;
    document.getElementById("m_anointment").value = m.anointmentDate || "";
    document.getElementById("m_dob_year").value = m.dobYear || "";
    document.getElementById("m_diaspora").value = m.isDiaspora || "No";
    document.getElementById("m_nokName").value = m.nokName || "";
    document.getElementById("m_nokPhone").value = m.nokPhone || "";
    document.getElementById("m_nokAddress").value = m.nokAddress || "";

    if (m.dob) {
        const parts = m.dob.split(" ");
        if (parts.length === 2) {
            document.getElementById("m_dob_month").value = parts[0];
            document.getElementById("m_dob_day").value = parts[1];
        }
    }

    if (m.portrait_base64) {
        document.getElementById("profilePortraitPreview").src = m.portrait_base64;
        document.getElementById("profilePortraitPreview").classList.remove("hidden");
        document.getElementById("profilePortraitPlaceholder").classList.add("hidden");
    }

    updateRankDropdown();
    document.getElementById("m_rank").value = m.rank;
}

function toggleClergyStatus(id) {
    const c = state.members.find(m => m.id === id);
    if (c) {
        c.status = c.status === 'Active' ? 'Transferred' : 'Active';
        saveStateToStorage();
        renderClergyRegistry();
    }
}

function deleteMember(id) {
    if (confirm("Remove this profile from database?")) {
        const idx = state.members.findIndex(m => m.id === id);
        if (idx !== -1) {
            state.members.splice(idx, 1);
            saveStateToStorage();
            renderMembersRegistry();
        }
    }
}

// ==========================================
// 8. DEPARTMENT ELECTION SERVICES
// ==========================================
function loadDepartmentView() {
    const dept = document.getElementById("departmentSelect").value;
    const activeCont = document.getElementById("deptActiveList");
    const formerCont = document.getElementById("deptFormerList");

    activeCont.innerHTML = "";
    formerCont.innerHTML = "";

    if (!state.departments[dept]) {
        state.departments[dept] = { current: [], former: [] };
    }

    const activeList = state.departments[dept].current;
    const formerList = state.departments[dept].former;

    activeList.forEach(mId => {
        const m = state.members.find(x => x.id === mId);
        if (m) {
            activeCont.innerHTML += `
                <div class="p-2 border rounded flex justify-between items-center text-xs">
                    <div>
                        <p class="font-bold text-slate-800">${m.name}</p>
                        <p class="text-[10px] text-blue-600">${m.rank}</p>
                    </div>
                    <button onclick="archiveDeptMember('${dept}', '${mId}')" class="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded font-bold hover:bg-amber-100">Archive</button>
                </div>`;
        }
    });

    formerList.forEach(mId => {
        const m = state.members.find(x => x.id === mId);
        if (m) {
            formerCont.innerHTML += `
                <div class="p-2 border rounded flex justify-between items-center text-xs bg-gray-50">
                    <div>
                        <p class="font-bold text-gray-500">${m.name}</p>
                        <p class="text-[10px] text-gray-400">${m.rank}</p>
                    </div>
                </div>`;
        }
    });
}

function archiveDeptMember(dept, mId) {
    const deptObj = state.departments[dept];
    const idx = deptObj.current.indexOf(mId);
    if (idx !== -1) {
        deptObj.current.splice(idx, 1);
        if (!deptObj.former.includes(mId)) {
            deptObj.former.push(mId);
        }
        saveStateToStorage();
        loadDepartmentView();
    }
}

function triggerDepartmentElection() {
    const dept = document.getElementById("departmentSelect").value;
    if (confirm(`Perform 2-year general reset for ${dept}? All current members will be archived.`)) {
        const deptObj = state.departments[dept];
        deptObj.current.forEach(id => {
            if (!deptObj.former.includes(id)) {
                deptObj.former.push(id);
            }
        });
        deptObj.current = [];
        saveStateToStorage();
        loadDepartmentView();
    }
}

function openAssignDeptModal() {
    const dept = document.getElementById("departmentSelect").value;
    const candidates = state.members.filter(m => m.classification === 'MEMBER' && !state.departments[dept].current.includes(m.id));
    
    if (candidates.length === 0) {
        alert("All members are already assigned to this department.");
        return;
    }

    let candOptions = "";
    candidates.forEach(c => {
        candOptions += `<option value="${c.id}">${c.name} (${c.rank})</option>`;
    });

    const selectorHTML = `
        <div id="assignDeptModal" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div class="bg-white p-6 rounded-xl w-full max-w-sm text-xs space-y-4">
                <h3 class="font-bold text-sm">Assign Member to ${dept}</h3>
                <select id="assignDeptSelect" class="w-full border p-2 bg-white rounded">${candOptions}</select>
                <div class="flex justify-end gap-2">
                    <button onclick="document.getElementById('assignDeptModal').remove()" class="px-3 py-1.5 border rounded">Cancel</button>
                    <button onclick="confirmAssignDept('${dept}')" class="px-3 py-1.5 bg-blue-600 text-white rounded font-bold">Assign</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', selectorHTML);
}

function confirmAssignDept(dept) {
    const mId = document.getElementById("assignDeptSelect").value;
    if (mId) {
        state.departments[dept].current.push(mId);
        saveStateToStorage();
        document.getElementById('assignDeptModal').remove();
        loadDepartmentView();
    }
}

// ==========================================
// 9. AGE DEVELOPMENT PIPELINE
// ==========================================
function getCalculatedAge(dobYear) {
    if (!dobYear) return null;
    const currentYear = new Date().getFullYear();
    return currentYear - parseInt(dobYear);
}

function renderYouthPipeline() {
    const kidsCont = document.getElementById("kidsPipelineList");
    const teensCont = document.getElementById("teensPipelineList");
    if (!kidsCont || !teensCont) return;

    kidsCont.innerHTML = "";
    teensCont.innerHTML = "";

    let kidsCount = 0;
    let teensCount = 0;

    state.members.forEach(m => {
        if (m.classification !== "MEMBER" || !m.dobYear) return;
        const age = getCalculatedAge(m.dobYear);
        if (age === null) return;

        if (age >= 2 && age < 12) {
            kidsCount++;
            kidsCont.innerHTML += `
                <div class="p-2 border rounded flex justify-between items-center bg-pink-50/40 text-xs">
                    <div>
                        <p class="font-bold text-gray-800">${m.name}</p>
                        <p class="text-[10px] text-pink-600">Calculated Age: ${age} years</p>
                    </div>
                </div>`;
        } else if (age >= 12 && age < 18) {
            teensCount++;
            teensCont.innerHTML += `
                <div class="p-2 border rounded flex justify-between items-center bg-indigo-50/40 text-xs">
                    <div>
                        <p class="font-bold text-gray-800">${m.name}</p>
                        <p class="text-[10px] text-indigo-600">Calculated Age: ${age} years</p>
                    </div>
                </div>`;
        }
    });

    document.getElementById("countKids").innerText = kidsCount;
    document.getElementById("countTeens").innerText = teensCount;
}

function checkYouthTransitions() {
    let count = 0;
    state.members.forEach(m => {
        if (m.classification === "MEMBER" && m.dobYear) {
            const age = getCalculatedAge(m.dobYear);
            if (age !== null && age >= 18 && m.isYouthPipeline) {
                delete m.isYouthPipeline;
                count++;
            }
        }
    });
    if (count > 0) {
        saveStateToStorage();
        alert(`${count} teenage members promoted to adult congregation.`);
    } else {
        alert("Pipeline audited: No pending promotions.");
    }
    runAuditSimulation();
}

// ==========================================
// 10. FAMILY RELATIONSHIP MAPS
// ==========================================
function renderFamilyConnections() {
    const primarySel = document.getElementById("familyPrimaryMember");
    const linkedSel = document.getElementById("familyLinkedMember");
    const mapArea = document.getElementById("familyTreeMapArea");

    if (!primarySel || !linkedSel || !mapArea) return;

    primarySel.innerHTML = "";
    linkedSel.innerHTML = "";
    mapArea.innerHTML = "";

    const members = state.members.filter(m => m.classification === 'MEMBER');
    members.forEach(m => {
        primarySel.innerHTML += `<option value="${m.id}">${m.name} (${m.rank})</option>`;
        linkedSel.innerHTML += `<option value="${m.id}">${m.name} (${m.rank})</option>`;
    });

    if (state.linkages.length === 0) {
        mapArea.innerHTML = `<p class="text-xs text-gray-400">No linkages recorded in database.</p>`;
        return;
    }

    state.linkages.forEach((link, idx) => {
        const m1 = state.members.find(x => x.id === link.id1);
        const m2 = state.members.find(x => x.id === link.id2);
        if (m1 && m2) {
            mapArea.innerHTML += `
                <div class="p-3 bg-gray-50 border rounded-lg flex justify-between items-center">
                    <div>
                        <p class="text-xs font-bold text-gray-800">${m1.name} <span class="text-pink-600">◀ ${link.type} ▶</span> ${m2.name}</p>
                        <p class="text-[9px] text-gray-400">Relationship established</p>
                    </div>
                    <button onclick="removeFamilyLink(${idx})" class="text-red-600 hover:underline text-[10px] font-bold">Disconnect</button>
                </div>`;
        }
    });
}

function linkFamilyMembers() {
    const id1 = document.getElementById("familyPrimaryMember").value;
    const id2 = document.getElementById("familyLinkedMember").value;
    const type = document.getElementById("familyConnectionType").value;

    if (id1 === id2) {
        alert("Self linkages cannot be established.");
        return;
    }

    const linkExists = state.linkages.some(l => (l.id1 === id1 && l.id2 === id2) || (l.id1 === id2 && l.id2 === id1));
    if (linkExists) {
        alert("This linkage is already mapped.");
        return;
    }

    const payload = { id1, id2, type };
    state.linkages.push(payload);
    syncStateToCloud('linkages', payload);
    saveStateToStorage();
    renderFamilyConnections();
    alert("Relationship map updated.");
}

function removeFamilyLink(idx) {
    if (confirm("Sever connection?")) {
        state.linkages.splice(idx, 1);
        saveStateToStorage();
        renderFamilyConnections();
    }
}

// ==========================================
// 11. LITURGICAL ATTENDANCE RENDERER
// ==========================================
function renderAttendanceLedger() {
    const tbody = document.getElementById("attendanceTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (state.attendance.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400">No logs found.</td></tr>`;
        return;
    }

    state.attendance.forEach((att, idx) => {
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 transition text-xs">
                <td class="p-3 font-mono">${att.date}</td>
                <td class="p-3 font-semibold text-blue-900">${att.type}</td>
                <td class="p-3">${att.count} Worshippers</td>
                <td class="p-3 text-right">
                    <button onclick="deleteAttendance(${idx})" class="text-red-600 hover:underline">Delete</button>
                </td>
            </tr>`;
    });
}

function openRecordAttendanceModal() {
    const date = new Date().toISOString().split('T')[0];
    const modalHTML = `
        <div id="attendanceModal" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div class="bg-white p-6 rounded-xl w-full max-w-sm text-xs space-y-4">
                <h3 class="font-bold text-sm">Record Attendance</h3>
                <div>
                    <label class="block mb-1 text-gray-600">Service Date</label>
                    <input type="date" id="att_date" value="${date}" class="w-full border p-2 rounded">
                </div>
                <div>
                    <label class="block mb-1 text-gray-600">Service Type</label>
                    <select id="att_type" class="w-full border p-2 bg-white rounded">
                        <option value="Sunday Devotional Service">Sunday Devotional Service</option>
                        <option value="Wednesday Mercy Service">Wednesday Mercy Service</option>
                        <option value="Friday Power Service">Friday Power Service</option>
                        <option value="New Moon Service">New Moon Service</option>
                    </select>
                </div>
                <div>
                    <label class="block mb-1 text-gray-600">Headcount</label>
                    <input type="number" id="att_count" class="w-full border p-2 rounded">
                </div>
                <div class="flex justify-end gap-2">
                    <button onclick="document.getElementById('attendanceModal').remove()" class="px-3 py-1.5 border rounded">Cancel</button>
                    <button onclick="confirmRecordAttendance()" class="px-3 py-1.5 bg-blue-600 text-white rounded font-bold">Save Record</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function confirmRecordAttendance() {
    const date = document.getElementById("att_date").value;
    const type = document.getElementById("att_type").value;
    const count = parseInt(document.getElementById("att_count").value);

    if (!date || isNaN(count)) {
        alert("Complete required inputs.");
        return;
    }

    const payload = { id: `ATT-${Date.now()}`, date, type, count };
    state.attendance.push(payload);
    syncStateToCloud('attendance', payload);
    saveStateToStorage();
    document.getElementById('attendanceModal').remove();
    renderAttendanceLedger();
}

function deleteAttendance(idx) {
    if (confirm("Delete entry?")) {
        state.attendance.splice(idx, 1);
        saveStateToStorage();
        renderAttendanceLedger();
    }
}

// ==========================================
// 12. FINANCIAL GENERAL LEDGER
// ==========================================
function renderFinancialLedger() {
    const tbody = document.getElementById("financeTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (state.finances.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400">No transactions recorded.</td></tr>`;
        return;
    }

    state.finances.forEach((f, idx) => {
        const contributor = state.members.find(m => m.id === f.memberId);
        const name = contributor ? contributor.name : "Anonymous Giver";

        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 transition text-xs">
                <td class="p-3 font-mono">${f.date}</td>
                <td class="p-3 font-bold">${name}</td>
                <td class="p-3 text-blue-950 font-semibold">${f.type}</td>
                <td class="p-3 font-mono text-emerald-700 font-bold">₦${parseFloat(f.amount).toLocaleString()}</td>
                <td class="p-3 text-right">
                    <button onclick="deleteFinance(${idx})" class="text-red-600 hover:underline">Delete</button>
                </td>
            </tr>`;
    });
}

function openAddTransactionModal() {
    const date = new Date().toISOString().split('T')[0];
    const options = state.members.map(m => `<option value="${m.id}">${m.name} (${m.rank})</option>`).join('');

    const modalHTML = `
        <div id="financeModal" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div class="bg-white p-6 rounded-xl w-full max-w-sm text-xs space-y-4">
                <h3 class="font-bold text-sm">Log Transaction</h3>
                <div>
                    <label class="block mb-1 text-gray-600">Member</label>
                    <select id="fin_member" class="w-full border p-2 bg-white rounded">
                        <option value="Anonymous">Anonymous</option>
                        ${options}
                    </select>
                </div>
                <div>
                    <label class="block mb-1 text-gray-600">Type</label>
                    <select id="fin_type" class="w-full border p-2 bg-white rounded">
                        <option value="Tithe">Tithe Payment</option>
                        <option value="Thanksgiving Offering">Thanksgiving Offering</option>
                        <option value="Building Pledge">Building Fund</option>
                        <option value="Juvenile Harvest Seed">Juvenile Harvest Seed</option>
                        <option value="Adult Harvest Seed">Adult Harvest Seed</option>
                    </select>
                </div>
                <div>
                    <label class="block mb-1 text-gray-600">Amount (₦)</label>
                    <input type="number" id="fin_amount" class="w-full border p-2 rounded">
                </div>
                <div>
                    <label class="block mb-1 text-gray-600">Date</label>
                    <input type="date" id="fin_date" value="${date}" class="w-full border p-2 rounded">
                </div>
                <div class="flex justify-end gap-2">
                    <button onclick="document.getElementById('financeModal').remove()" class="px-3 py-1.5 border rounded">Cancel</button>
                    <button onclick="confirmFinanceLog()" class="px-3 py-1.5 bg-blue-600 text-white rounded font-bold">Commit</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function confirmFinanceLog() {
    const memberId = document.getElementById("fin_member").value;
    const type = document.getElementById("fin_type").value;
    const amount = parseFloat(document.getElementById("fin_amount").value);
    const date = document.getElementById("fin_date").value;

    if (isNaN(amount) || !date) {
        alert("Fill in financial form fully.");
        return;
    }

    const payload = { id: `FIN-${Date.now()}`, memberId, type, amount, date };
    state.finances.push(payload);
    syncStateToCloud('finances', payload);
    saveStateToStorage();
    document.getElementById('financeModal').remove();
    renderFinancialLedger();
}

function deleteFinance(idx) {
    if (confirm("Delete ledger entry?")) {
        state.finances.splice(idx, 1);
        saveStateToStorage();
        renderFinancialLedger();
    }
}

// ==========================================
// 13. COMMUNICATION PORT
// ==========================================
function triggerBroadcast() {
    const target = document.getElementById("msgTarget").value;
    const body = document.getElementById("msgBody").value.trim();

    if (!body) {
        alert("Text input body empty.");
        return;
    }

    const history = document.getElementById("broadcastHistory");
    const date = new Date().toLocaleString();

    if (history.innerHTML === "No broadcasts logged.") {
        history.innerHTML = "";
    }

    history.innerHTML = `
        <div class="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-1 mb-2 text-xs">
            <p class="font-bold text-indigo-900">Target: ${target}</p>
            <p class="text-gray-700 font-mono text-[11px]">${body}</p>
            <p class="text-[9px] text-gray-400 text-right font-semibold">${date}</p>
        </div>
    ` + history.innerHTML;

    document.getElementById("msgBody").value = "";
    alert(`Success: Broadcast dispatched.`);
}

// ==========================================
// 14. HARVEST COMMITTEES & AI ENGINE
// ==========================================
function renderCommittees() {
    const cont = document.getElementById("committeesList");
    if (!cont) return;
    cont.innerHTML = "";

    if (state.committees.length === 0) {
        cont.innerHTML = `<p class="text-xs text-gray-400">No planning committees logged.</p>`;
        return;
    }

    state.committees.forEach((c, idx) => {
        cont.innerHTML += `
            <div class="p-4 bg-gray-50 border rounded-xl flex justify-between items-center text-xs">
                <div>
                    <h4 class="font-bold text-gray-800">${c.name}</h4>
                    <p class="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">${c.category}</p>
                </div>
                <button onclick="requestAICommitteeRecs('${idx}')" class="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-yellow-400 font-bold rounded text-[10px] flex items-center gap-1">
                    <i class="fa-solid fa-brain"></i> Recs
                </button>
            </div>`;
    });
}

function saveCommittee() {
    const name = document.getElementById("commName").value.trim();
    const category = document.getElementById("commCategory").value;

    if (!name) return alert("Committee Name required.");

    const payload = { name, category };
    state.committees.push(payload);
    saveStateToStorage();
    closeCreateCommitteeModal();
    renderCommittees();
}

function requestAICommitteeRecs(idx) {
    const comm = state.committees[idx];
    const out = document.getElementById("aiAdvisorOutput");
    if (!out) return;

    out.innerHTML = `Analyzing parish directory for <strong>${comm.name}</strong>...`;

    setTimeout(() => {
        const matchingMembers = state.members.filter(m => m.classification === 'MEMBER' && !m.isYouthPipeline).slice(0, 3);
        
        if (matchingMembers.length === 0) {
            out.innerHTML = `<p class="text-red-500">Add profiles to generate selections.</p>`;
            return;
        }

        let suggestions = `<p class="font-bold text-white mb-2">AI Recs for ${comm.name}:</p><ul class="space-y-2">`;
        matchingMembers.forEach((m, i) => {
            suggestions += `
                <li class="bg-slate-800 p-2 rounded border border-slate-700 text-xs">
                    <span class="text-yellow-400 font-bold">#${i+1} ${m.name}</span> (${m.rank})<br>
                    <span class="text-slate-400 text-[10px]">Weight: High (Occupation: ${m.occupation || 'Business'})</span>
                </li>`;
        });
        suggestions += "</ul>";
        out.innerHTML = suggestions;
    }, 1200);
}

function closeCreateCommitteeModal() {
    document.getElementById("committeeModal").classList.add("hidden");
}

// ==========================================
// 15. HEURISTIC PARSER / OCR INTERFACES
// ==========================================
function simulateFileRead(event) {
    const file = event.target.files[0];
    if (!file) return;

    const mockText = `
        MEMBER PROFILE SCAN
        Name: Woli Peter Olasunkanmi
        Gender: Male
        Marital Status: Married
        Address: 44 Celestial Way, Ketu, Lagos
        Phone: +2348035551234
        Rank: Anointed Prophet (Woli)
        Occupation: Engineer
        Birth Details: October 24, 1988
        Anointment Date: 2021-12-12
        Next of Kin Name: Funmi Olasunkanmi
        Next of Kin Phone: +2348035551235
        Next of Kin Address: 44 Celestial Way, Ketu, Lagos
    `;
    document.getElementById("aiRawTextarea").value = mockText.replace(/^[^\S\r\n]+/gm, "");
}

function executeAIHeuristics() {
    const raw = document.getElementById("aiRawTextarea").value;
    if (!raw.trim()) {
        alert("Draft parameters or paste document information first.");
        return;
    }

    const parseField = (regex) => {
        const match = raw.match(regex);
        return match ? match[1].trim() : "";
    };

    document.getElementById("ai_class").value = raw.includes("CLERGY") ? "CLERGY" : "MEMBER";
    document.getElementById("ai_name").value = parseField(/Name:\s*(.*)/i);
    document.getElementById("ai_gender").value = parseField(/Gender:\s*(.*)/i) || "Male";
    document.getElementById("ai_marital").value = parseField(/Marital\s*Status:\s*(.*)/i) || "Single";
    document.getElementById("ai_address").value = parseField(/Address:\s*(.*)/i);
    document.getElementById("ai_phone").value = parseField(/Phone:\s*(.*)/i);
    document.getElementById("ai_anointment").value = parseField(/Anointment\s*Date:\s*(.*)/i);
    document.getElementById("ai_nokName").value = parseField(/Next\s*of\s*Kin\s*Name:\s*(.*)/i);
    document.getElementById("ai_nokPhone").value = parseField(/Next\s*of\s*Kin\s*Phone:\s*(.*)/i);
    document.getElementById("ai_nokAddress").value = parseField(/Next\s*of\s*Kin\s*Address:\s*(.*)/i);
    document.getElementById("ai_dobYear").value = parseField(/Birth\s*Details:\s*\w+\s*\d+,\s*(\d{4})/i);

    const fullDob = parseField(/Birth\s*Details:\s*(\w+)\s*(\d+)/i);
    if (fullDob) {
        const dobParts = parseField(/Birth\s*Details:\s*(.*)/i).split(" ");
        if (dobParts.length >= 2) {
            document.getElementById("ai_dobMonth").value = dobParts[0].replace(",", "");
            document.getElementById("ai_dobDay").value = dobParts[1].replace(",", "");
        }
    }

    const extractedRank = parseField(/Rank:\s*(.*)/i);
    const rankSelector = document.getElementById("ai_rank");
    if (extractedRank) {
        rankSelector.innerHTML = `<option value="${extractedRank}">${extractedRank}</option>`;
    }

    const extractedOcc = parseField(/Occupation:\s*(.*)/i);
    if (extractedOcc) {
        document.getElementById("ai_occupation").value = extractedOcc;
    }

    alert("AI Parse Operation complete. Fields calculated.");
}

function saveAIExtractedProfile() {
    const name = document.getElementById("ai_name").value.trim();
    if (!name) return alert("Verify extracted name properties.");

    const classification = document.getElementById("ai_class").value;
    const payload = {
        id: classification === 'CLERGY' ? `CCC-CLG-${Date.now()}` : `CCC-MBR-${Date.now()}`,
        classification,
        name,
        gender: document.getElementById("ai_gender").value,
        maritalStatus: document.getElementById("ai_marital").value,
        address: document.getElementById("ai_address").value.trim(),
        phone: document.getElementById("ai_phone").value.trim(),
        rank: document.getElementById("ai_rank").value,
        occupation: document.getElementById("ai_occupation").value,
        anointmentDate: document.getElementById("ai_anointment").value,
        dob: `${document.getElementById("ai_dobMonth").value} ${document.getElementById("ai_dobDay").value}`,
        dobYear: document.getElementById("ai_dobYear").value,
        isDiaspora: "No",
        status: "Active",
        nokName: document.getElementById("ai_nokName").value.trim(),
        nokPhone: document.getElementById("ai_nokPhone").value.trim(),
        nokAddress: document.getElementById("ai_nokAddress").value.trim()
    };

    state.members.push(payload);
    sortAndReassignRankIDs();
    syncStateToCloud('members', payload);
    saveStateToStorage();
    
    document.getElementById("aiRawTextarea").value = "";
    document.getElementById("aiExtractedForm").reset();
    
    runAuditSimulation();
    alert("Profile saved to database successfully.");
}

// ==========================================
// 16. CERTIFICATES ENGINE
// ==========================================
function renderCertificatesLists() {
    const births = document.getElementById("birthsCertificatesList");
    const deaths = document.getElementById("deathsCertificatesList");

    if (!births || !deaths) return;

    births.innerHTML = "";
    deaths.innerHTML = "";

    if (state.births.length === 0) {
        births.innerHTML = `<p class="text-[10px] text-gray-400">No birth certificates registered.</p>`;
    } else {
        state.births.forEach((b, idx) => {
            births.innerHTML += `
                <div class="p-3 bg-blue-50/40 border rounded flex justify-between items-center text-xs">
                    <div>
                        <p class="font-bold text-slate-800">${b.childName}</p>
                        <p class="text-[9px] text-gray-500">DOB: ${b.dob} • Parents: ${b.parents}</p>
                    </div>
                    <button onclick="printBirthCert(${idx})" class="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-700">Print</button>
                </div>`;
        });
    }

    if (state.deaths.length === 0) {
        deaths.innerHTML = `<p class="text-[10px] text-gray-400">No death certificates registered.</p>`;
    } else {
        state.deaths.forEach((d, idx) => {
            deaths.innerHTML += `
                <div class="p-3 bg-red-50/40 border rounded flex justify-between items-center text-xs">
                    <div>
                        <p class="font-bold text-gray-700">${d.deceasedName}</p>
                        <p class="text-[9px] text-gray-500">Demise: ${d.dod} • Age: ${d.age}</p>
                    </div>
                    <button onclick="printDeathCert(${idx})" class="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded hover:bg-red-700">Print</button>
                </div>`;
        });
    }
}

function openBirthModal() {
    const modalHTML = `
        <div id="birthModal" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div class="bg-white p-6 rounded-xl w-full max-w-sm text-xs space-y-4">
                <h3 class="font-bold text-sm text-blue-900">Register Birth Record</h3>
                <div>
                    <label class="block mb-1 text-gray-600">Child's Name</label>
                    <input type="text" id="b_name" class="w-full border p-2 rounded">
                </div>
                <div>
                    <label class="block mb-1 text-gray-600">Date of Birth</label>
                    <input type="date" id="b_dob" class="w-full border p-2 rounded">
                </div>
                <div>
                    <label class="block mb-1 text-gray-600">Parents' Name(s)</label>
                    <input type="text" id="b_parents" class="w-full border p-2 rounded">
                </div>
                <div class="flex justify-end gap-2">
                    <button onclick="document.getElementById('birthModal').remove()" class="px-3 py-1.5 border rounded">Cancel</button>
                    <button onclick="confirmBirthLog()" class="px-3 py-1.5 bg-blue-600 text-white rounded font-bold">Register Birth</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function confirmBirthLog() {
    const childName = document.getElementById("b_name").value.trim();
    const dob = document.getElementById("b_dob").value;
    const parents = document.getElementById("b_parents").value.trim();

    if (!childName || !dob || !parents) return alert("Fill out certificate details.");

    const payload = { childName, dob, parents };
    state.births.push(payload);
    syncStateToCloud('births', payload);
    saveStateToStorage();
    document.getElementById('birthModal').remove();
    renderCertificatesLists();
}

function openDeathModal() {
    const modalHTML = `
        <div id="deathModal" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div class="bg-white p-6 rounded-xl w-full max-w-sm text-xs space-y-4">
                <h3 class="font-bold text-sm text-red-900">Register Demise Record</h3>
                <div>
                    <label class="block mb-1 text-gray-600">Deceased Member's Name</label>
                    <input type="text" id="d_name" class="w-full border p-2 rounded">
                </div>
                <div>
                    <label class="block mb-1 text-gray-600">Date of Demise</label>
                    <input type="date" id="d_dod" class="w-full border p-2 rounded">
                </div>
                <div>
                    <label class="block mb-1 text-gray-600">Age at Death</label>
                    <input type="number" id="d_age" class="w-full border p-2 rounded">
                </div>
                <div class="flex justify-end gap-2">
                    <button onclick="document.getElementById('deathModal').remove()" class="px-3 py-1.5 border rounded">Cancel</button>
                    <button onclick="confirmDeathLog()" class="px-3 py-1.5 bg-red-600 text-white rounded font-bold">Register Record</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function confirmDeathLog() {
    const deceasedName = document.getElementById("d_name").value.trim();
    const dod = document.getElementById("d_dod").value;
    const age = document.getElementById("d_age").value.trim();

    if (!deceasedName || !dod || !age) return alert("Fill out certificate details.");

    const payload = { deceasedName, dod, age };
    state.deaths.push(payload);
    syncStateToCloud('deaths', payload);
    saveStateToStorage();
    document.getElementById('deathModal').remove();
    renderCertificatesLists();
}

function printBirthCert(idx) {
    const b = state.births[idx];
    const area = document.getElementById("printArea");
    area.innerHTML = `
        <div style="text-align: center; border: 5px double #b45309; padding: 30px; font-family: serif; background: white; color: black;">
            <h1 style="margin: 0; font-size: 24px; color: #1e3a8a;">CELESTIAL CHURCH OF CHRIST</h1>
            <p style="margin: 5px 0 20px 0; font-style: italic; font-size: 14px;">Spiritual Headquarters, Imeko, Ogun State, Nigeria</p>
            <h2 style="text-decoration: underline; font-size: 18px; margin-bottom: 30px;">CERTIFICATE OF BIRTH & INFANT REGISTER</h2>
            <p style="font-size: 14px; text-align: left; line-height: 2;">
                This is to certify that the infant named <strong>${b.childName}</strong> born on the date of <strong>${b.dob}</strong> 
                to the lineage of <strong>${b.parents}</strong> has been officially registered within the archives of the Celestial Church of Christ, 
                <strong>${state.parishName}</strong>.
            </p>
            <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px;">
                <div>
                    <p style="border-top: 1px solid black; width: 150px; margin-top: 40px; text-align: center;">Parish Shepherd</p>
                </div>
                <div>
                    <p style="border-top: 1px solid black; width: 150px; margin-top: 40px; text-align: center;">Parish Secretary</p>
                </div>
            </div>
        </div>
    `;
    window.print();
}

function printDeathCert(idx) {
    const d = state.deaths[idx];
    const area = document.getElementById("printArea");
    area.innerHTML = `
        <div style="text-align: center; border: 5px double #000; padding: 30px; font-family: serif; background: white; color: black;">
            <h1 style="margin: 0; font-size: 24px;">CELESTIAL CHURCH OF CHRIST</h1>
            <h2 style="text-decoration: underline; font-size: 18px; margin-bottom: 30px;">CERTIFICATE OF TRANSITION TO GLORY</h2>
            <p style="font-size: 14px; text-align: left; line-height: 2;">
                This document serves to register the transition of our beloved member, <strong>${d.deceasedName}</strong>, 
                who passed on to eternity on <strong>${d.dod}</strong> at the age of <strong>${d.age}</strong> years, 
                leaving behind memory within <strong>${state.parishName}</strong>.
            </p>
            <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px;">
                <div>
                    <p style="border-top: 1px solid black; width: 150px; margin-top: 40px; text-align: center;">Parish Shepherd</p>
                </div>
                <div>
                    <p style="border-top: 1px solid black; width: 150px; margin-top: 40px; text-align: center;">Registrar</p>
                </div>
            </div>
        </div>
    `;
    window.print();
}

// ==========================================
// 17. GLOBAL DIRECTORY QUERY
// ==========================================
function handleGlobalSearch() {
    const val = document.getElementById("globalSearchInput").value.toLowerCase().trim();
    const overlay = document.getElementById("searchResultsOverlay");
    
    if (!val) {
        overlay.classList.add("hidden");
        return;
    }

    overlay.innerHTML = "";
    const hits = state.members.filter(m => m.name.toLowerCase().includes(val) || m.rank.toLowerCase().includes(val) || m.id.toLowerCase().includes(val));

    if (hits.length === 0) {
        overlay.innerHTML = `<div class="p-3 text-xs text-gray-400 italic">No corresponding records found.</div>`;
    } else {
        hits.forEach(m => {
            overlay.innerHTML += `
                <div onclick="navigateFromSearch('${m.id}', '${m.classification}')" class="p-3 border-b hover:bg-gray-50 cursor-pointer text-xs text-slate-800">
                    <p class="font-bold">${m.name} (${m.classification})</p>
                    <p class="text-[10px] text-blue-600">${m.rank} • ID: ${m.id}</p>
                </div>`;
        });
    }
    overlay.classList.remove("hidden");
}

function navigateFromSearch(id, classification) {
    document.getElementById("searchResultsOverlay").classList.add("hidden");
    document.getElementById("globalSearchInput").value = "";
    if (classification === 'CLERGY') {
        showSection('clergy');
    } else {
        showSection('members');
    }
}

// ==========================================
// 18. SYSTEM CONFIGURATION SETTINGS
// ==========================================
function openConfigModal() {
    document.getElementById("configParishName").value = state.parishName;
    document.getElementById("configAdminGreeting").value = state.adminGreeting;
    document.getElementById("configAdultHarvestDate").value = state.adultHarvestDate || "";
    document.getElementById("configSupaUrl").value = state.supabaseUrl;
    document.getElementById("configSupaKey").value = state.supabaseKey;
    document.getElementById("configAdminPassword").value = state.adminPassword;
    document.getElementById("configModal").classList.remove("hidden");
}

function closeConfigModal() {
    document.getElementById("configModal").classList.add("hidden");
}

function saveDashboardConfig() {
    state.parishName = document.getElementById("configParishName").value.trim() || state.parishName;
    state.adminGreeting = document.getElementById("configAdminGreeting").value.trim() || state.adminGreeting;
    state.adultHarvestDate = document.getElementById("configAdultHarvestDate").value;
    state.supabaseUrl = document.getElementById("configSupaUrl").value.trim();
    state.supabaseKey = document.getElementById("configSupaKey").value.trim();
    state.adminPassword = document.getElementById("configAdminPassword").value.trim() || state.adminPassword;

    const baseParish = state.parishes.find(p => p.id === state.currentParishId);
    if (baseParish) {
        baseParish.name = state.parishName;
        baseParish.password = state.adminPassword;
    }

    const fileInput = document.getElementById("configLogoInput");
    const saveAndInit = () => {
        saveStateToStorage();
        initSupabaseClient();
        calculateLiturgicalDates();
        closeConfigModal();
        location.reload();
    };

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            state.logoBase64 = e.target.result;
            saveAndInit();
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        saveAndInit();
    }
}

function sortAndReassignRankIDs() {
    let clergy = state.members.filter(m => m.classification === 'CLERGY');
    clergy.sort((a, b) => {
        const aPriority = CLERGY_RANKS.indexOf(a.rank);
        const bPriority = CLERGY_RANKS.indexOf(b.rank);
        if (aPriority !== bPriority) return aPriority - bPriority;
        const aYear = a.anointmentDate ? new Date(a.anointmentDate).getFullYear() : 9999;
        const bYear = b.anointmentDate ? new Date(b.anointmentDate).getFullYear() : 9999;
        return aYear - bYear;
    });

    clergy.forEach((c, idx) => {
        const oldId = c.id;
        const newId = `CCC-CLG-${String(idx + 1).padStart(5, '0')}`;
        if (oldId !== newId) {
            c.id = newId;
            updateIDRefsInState(oldId, newId);
        }
    });

    let members = state.members.filter(m => m.classification === 'MEMBER');
    members.sort((a, b) => {
        const getRankWeight = (m) => {
            let idx = MALE_RANKS.indexOf(m.rank);
            if (idx !== -1) return idx;
            idx = PROPHET_RANKS.indexOf(m.rank);
            if (idx !== -1) return idx;
            idx = FEMALE_RANKS.indexOf(m.rank);
            if (idx !== -1) return idx;
            idx = PROPHETESS_RANKS.indexOf(m.rank);
            if (idx !== -1) return idx;
            return 999;
        };
        const aWeight = getRankWeight(a);
        const bWeight = getRankWeight(b);
        if (aWeight !== bWeight) return aWeight - bWeight;
        const aYear = a.anointmentDate ? new Date(a.anointmentDate).getFullYear() : 9999;
        const bYear = b.anointmentDate ? new Date(b.anointmentDate).getFullYear() : 9999;
        return aYear - bYear;
    });

    members.forEach((m, idx) => {
        const oldId = m.id;
        const newId = `CCC-MBR-${String(idx + 1).padStart(5, '0')}`;
        if (oldId !== newId) {
            m.id = newId;
            updateIDRefsInState(oldId, newId);
        }
    });
    saveStateToStorage();
}

function updateIDRefsInState(oldId, newId) {
    state.linkages.forEach(l => {
        if (l.id1 === oldId) l.id1 = newId;
        if (l.id2 === oldId) l.id2 = newId;
    });
    for (let d in state.departments) {
        if (state.departments[d].current) {
            state.departments[d].current = state.departments[d].current.map(id => id === oldId ? newId : id);
        }
        if (state.departments[d].former) {
            state.departments[d].former = state.departments[d].former.map(id => id === oldId ? newId : id);
        }
    }
}

// ==========================================
// 19. SYSTEM HELPER UTILITIES
// ==========================================
function populateEntranceSelector() {
    const sel = document.getElementById("entranceSelector");
    if (!sel) return;
    
    sel.innerHTML = `
        <option value="aarinat" class="text-slate-900 font-bold">Aarinat Developer (Platform Super-Admin)</option>
        <option value="new_parish" class="text-slate-900 font-bold">+ Register New Parish</option>
    `;

    state.parishes.forEach(p => {
        const approvalText = p.status === 'Pending' ? ' (Pending HQ Approval)' : '';
        sel.innerHTML += `<option value="${p.id}" class="text-slate-900 font-bold">${p.name}${approvalText}</option>`;
    });
}

function handleEntranceChange() {
    const val = document.getElementById("entranceSelector").value;
    const regFields = document.getElementById("parishRegFields");
    const passContainer = document.getElementById("passwordFieldContainer");
    const accessBtn = document.getElementById("accessBtn");

    if (val === 'new_parish') {
        regFields.classList.remove("hidden");
        passContainer.classList.add("hidden");
        accessBtn.classList.add("hidden");
    } else {
        regFields.classList.add("hidden");
        passContainer.classList.remove("hidden");
        accessBtn.classList.remove("hidden");
    }
}

async function createNewParish() {
    const name = document.getElementById("regParishName").value.trim();
    const password = document.getElementById("regParishPassword").value.trim();

    if (!name || !password) {
        alert("Enter required registration details.");
        return;
    }

    const newId = generateUUID();
    const newParish = { 
        id: newId, 
        name: name, 
        password: password,
        status: "Pending" 
    };

    state.parishes.push(newParish);
    saveStateToStorage();

    if (supabaseClient) {
        try {
            await supabaseClient.from('parishes').insert([{
                id: newId,
                name: name,
                admin_password: password,
                status: "Pending"
            }]);
        } catch (e) {
            console.error("Cloud registration deferred:", e);
        }
    }

    alert(`Parish "${name}" registration complete.\n\nStatus: PENDING APPROVAL\n\nLicense registration must be approved by Aarinat Company Limited.`);
    
    document.getElementById("regParishName").value = "";
    document.getElementById("regParishPassword").value = "";
    document.getElementById("entranceSelector").value = "aarinat";
    handleEntranceChange();
    populateEntranceSelector();
}

function populateDropdowns() {
    const mSelect = document.getElementById("m_dob_month");
    const dSelect = document.getElementById("m_dob_day");
    const occSelect = document.getElementById("m_occupation");
    
    if(!mSelect) return;
    mSelect.innerHTML = "";
    dSelect.innerHTML = "";
    occSelect.innerHTML = "";

    MONTHS.forEach(m => mSelect.innerHTML += `<option value="${m}">${m}</option>`);
    for(let i=1; i<=31; i++) {
        dSelect.innerHTML += `<option value="${i}">${i}</option>`;
    }
    OCCUPATIONS_LIST.forEach(o => occSelect.innerHTML += `<option value="${o}">${o}</option>`);

    const aiM = document.getElementById("ai_dobMonth");
    const aiD = document.getElementById("ai_dobDay");
    const aiOcc = document.getElementById("ai_occupation");
    if(aiM) {
        aiM.innerHTML = mSelect.innerHTML;
        aiD.innerHTML = dSelect.innerHTML;
        aiOcc.innerHTML = occSelect.innerHTML;
    }

    updateRankDropdown();
}

function updateRankDropdown() {
    const mGender = document.getElementById("m_gender");
    if (!mGender) return;
    const gender = mGender.value;
    const rSelect = document.getElementById("m_rank");
    const classInput = document.getElementById("member_classification").value;
    
    rSelect.innerHTML = "";
    let rankArray = [];

    if (classInput === 'CLERGY') {
        rankArray = CLERGY_RANKS;
    } else {
        if (gender === 'Male') {
            rankArray = [...MALE_RANKS, ...PROPHET_RANKS];
        } else {
            rankArray = [...FEMALE_RANKS, ...PROPHETESS_RANKS];
        }
    }

    rankArray.forEach(r => rSelect.innerHTML += `<option value="${r}">${r}</option>`);

    const aiRank = document.getElementById("ai_rank");
    if (aiRank) {
        aiRank.innerHTML = "";
        rankArray.forEach(r => aiRank.innerHTML += `<option value="${r}">${r}</option>`);
    }
}

function applyConfigToDOM() {
    const mainTitleText = "CELESTIAL CHURCH OF CHRIST";
    const subTitleText = "DATA SOFTWARE";

    document.getElementById("landingMainTitle").innerText = mainTitleText;
    document.getElementById("landingSubTitle").innerText = subTitleText;
    document.getElementById("dashMainTitle").innerText = mainTitleText;

    if (state.activeParishId === 'aarinat') {
        document.getElementById("dashGreeting").innerText = "Aarinat Developer Mode";
        document.getElementById("dashUUID").innerText = "Licensing engine initialized.";
    } else {
        document.getElementById("dashGreeting").innerText = state.adminGreeting || "Halleluyah Admin!";
        document.getElementById("dashUUID").innerText = "Parish Key: " + state.currentParishId;
    }

    document.getElementById("landingParishName").innerText = "Parish: " + state.parishName;
    document.getElementById("dashParishName").innerText = state.parishName;
    document.getElementById("mobileParishName").innerText = state.parishName;

    const syncInd = document.getElementById("syncIndicator");
    const badge = document.getElementById("cloudStatusBadge");
    if (supabaseClient) {
        syncInd.innerHTML = `<span class="text-emerald-400"><i class="fa-solid fa-cloud"></i> Cloud Connected</span>`;
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Cloud Synced`;
        badge.className = "text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1.5 rounded-full font-bold flex items-center gap-1.5";
    } else {
        syncInd.innerHTML = `<span class="text-amber-400"><i class="fa-solid fa-wifi"></i> Local Storage Mode</span>`;
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Local Only`;
        badge.className = "text-[10px] bg-amber-100 text-amber-800 px-2.5 py-1.5 rounded-full font-bold flex items-center gap-1.5";
    }

    if (state.logoBase64) {
        const updateLogo = (imgId, placeholderId) => {
            const img = document.getElementById(imgId);
            const placeholder = document.getElementById(placeholderId);
            if (img && placeholder) {
                img.src = state.logoBase64;
                img.classList.remove("hidden");
                placeholder.classList.add("hidden");
            }
        };
        updateLogo("landingLogoImg", "landingLogoPlaceholder");
        updateLogo("dashboardLogoImg", "dashboardLogoPlaceholder");
        updateLogo("mobileLogoImg", "mobileLogoPlaceholder");
    } else {
        const resetLogo = (imgId, placeholderId) => {
            const img = document.getElementById(imgId);
            const placeholder = document.getElemen
