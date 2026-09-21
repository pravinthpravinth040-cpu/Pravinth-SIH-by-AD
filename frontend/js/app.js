/**
 * NarcoLocker - Secure Evidence Platform
 * Core Frontend Application Logic & Forensic Simulation Engine
 */

// -------------------------------------------------------------
// 1. Initial State & Forensic Mock Database
// -------------------------------------------------------------

const NarcoLockerDB = {
    currentUser: {
        name: "Officer Alex Mercer",
        badge: "INV-7842",
        role: "Forensic Investigator",
        roleId: "investigator",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
    },

    stats: {
        totalEvidence: 1248,
        activeCases: 42,
        aiVerified: 1196,
        tamperDetected: 3,
        systemStatus: "Operational",
        blockchainAnchor: "Block #892,114 (Verified)"
    },

    cases: [
        {
            id: "CASE-2024-0891",
            title: "Operation Blue Mist",
            leadOfficer: "Alex Mercer (INV-7842)",
            evidenceCount: 18,
            status: "Active",
            createdDate: "2024-08-14",
            summary: "Investigation into regional trafficking network operating near Harbor Bay."
        },
        {
            id: "CASE-2024-0742",
            title: "Metro Transit Interdiction",
            leadOfficer: "Elena Vance (FOR-9021)",
            evidenceCount: 7,
            status: "Pending Court",
            createdDate: "2024-07-28",
            summary: "Contraband interception at Central Terminal Gate 4 locker unit."
        },
        {
            id: "CASE-2024-0619",
            title: "Highland Courier Incident",
            leadOfficer: "David Miller (INV-4410)",
            evidenceCount: 12,
            status: "Closed",
            createdDate: "2024-06-03",
            summary: "Forensic analysis completed for suspect vehicle seizure. Conviction finalized."
        },
        {
            id: "CASE-2024-0550",
            title: "Warehouse District Sweep",
            leadOfficer: "Sarah Chen (ADM-1002)",
            evidenceCount: 24,
            status: "Under Review",
            createdDate: "2024-05-19",
            summary: "Multiple packages collected from abandoned commercial facility."
        }
    ],

    evidence: [
        {
            id: "EVD-2024-00891",
            caseId: "CASE-2024-0891",
            type: "Chemical Substance",
            thumbnail: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400",
            timestamp: "2024-09-18 14:22:10 UTC",
            officer: "Alex Mercer (INV-7842)",
            location: {
                name: "Pier 14 Cargo Bay, Sector 7",
                lat: 40.7128,
                lng: -74.0060
            },
            sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
            originalHash: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
            isTampered: false,
            status: "Verified",
            aiVerdict: "Positive (Cocaine HCl)",
            aiConfidence: 98.4,
            weightGrams: "254.5 g",
            colorCardDetected: true,
            detectedColor: "#f3ede3",
            referenceColor: "#ffffff",
            notes: "Crystalline white powder discovered inside sealed plastic heat-wrapped brick.",
            chainOfCustody: [
                { time: "2024-09-18 14:22:10", actor: "Officer Mercer", action: "Seized at Pier 14, initial photographic capture with Card #04" },
                { time: "2024-09-18 15:10:45", actor: "NarcoLocker Engine", action: "Cryptographic SHA-256 registered and anchored to secure vault" },
                { time: "2024-09-18 17:02:11", actor: "Dr. L. Reyes", action: "Evidence checked into Central Forensics Locker A-14" },
                { time: "2024-09-19 09:30:00", actor: "DA Office", action: "Chain-of-custody cryptographic audit verified for grand jury preview" }
            ]
        },
        {
            id: "EVD-2024-00892",
            caseId: "CASE-2024-0891",
            type: "Pills / Tablets",
            thumbnail: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=400",
            timestamp: "2024-09-18 16:45:30 UTC",
            officer: "Alex Mercer (INV-7842)",
            location: {
                name: "Atlantic Ave & 4th St",
                lat: 40.6892,
                lng: -73.9870
            },
            sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            originalHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            isTampered: false,
            status: "Verified",
            aiVerdict: "Positive (MDMA)",
            aiConfidence: 94.7,
            weightGrams: "48.2 g",
            colorCardDetected: true,
            detectedColor: "#38bdf8",
            referenceColor: "#0284c7",
            notes: "Pressed blue shield-shaped tablets with embossed crown logo.",
            chainOfCustody: [
                { time: "2024-09-18 16:45:30", actor: "Officer Mercer", action: "Seized from glove compartment" },
                { time: "2024-09-18 17:30:12", actor: "NarcoLocker Engine", action: "SHA-256 anchored into immutable storage" }
            ]
        },
        {
            id: "EVD-2024-00742",
            caseId: "CASE-2024-0742",
            type: "Chemical Substance",
            thumbnail: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=400",
            timestamp: "2024-09-15 08:14:02 UTC",
            officer: "Elena Vance (FOR-9021)",
            location: {
                name: "Central Rail Terminal Locker #84",
                lat: 40.7527,
                lng: -73.9772
            },
            sha256: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
            originalHash: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
            isTampered: false,
            status: "Verified",
            aiVerdict: "Positive (Methamphetamine)",
            aiConfidence: 99.1,
            weightGrams: "112.0 g",
            colorCardDetected: true,
            detectedColor: "#e2e8f0",
            referenceColor: "#ffffff",
            notes: "High purity translucent shard crystalline structure.",
            chainOfCustody: [
                { time: "2024-09-15 08:14:02", actor: "Elena Vance", action: "Initial forensic intake with certified card #02" }
            ]
        },
        {
            id: "EVD-2024-00619",
            caseId: "CASE-2024-0619",
            type: "Paraphernalia",
            thumbnail: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=400",
            timestamp: "2024-09-10 11:32:00 UTC",
            officer: "David Miller (INV-4410)",
            location: {
                name: "Highland Expressway Rest Stop",
                lat: 40.8448,
                lng: -73.8648
            },
            sha256: "7d793037a0760186574b0282f2f435e7b1e737b69da6d9091cacfa2c3683f59d",
            originalHash: "7d793037a0760186574b0282f2f435e7b1e737b69da6d9091cacfa2c3683f59d",
            isTampered: false,
            status: "Verified",
            aiVerdict: "Negative (Inert Sugar Substrate)",
            aiConfidence: 89.2,
            weightGrams: "310.0 g",
            colorCardDetected: true,
            detectedColor: "#fef3c7",
            referenceColor: "#ffffff",
            notes: "Suspected cutting agent and digital micro-scale with trace residues.",
            chainOfCustody: [
                { time: "2024-09-10 11:32:00", actor: "David Miller", action: "Logged into evidence locker" }
            ]
        },
        {
            id: "EVD-2024-00550",
            caseId: "CASE-2024-0550",
            type: "Chemical Substance",
            thumbnail: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?auto=format&fit=crop&q=80&w=400",
            timestamp: "2024-09-02 22:11:45 UTC",
            officer: "Sarah Chen (ADM-1002)",
            location: {
                name: "Industrial Sector Warehouse 9B",
                lat: 40.7061,
                lng: -73.9969
            },
            sha256: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
            originalHash: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
            isTampered: false,
            status: "Under Review",
            aiVerdict: "Inconclusive (Requires GC-MS)",
            aiConfidence: 61.3,
            weightGrams: "75.4 g",
            colorCardDetected: false,
            detectedColor: "#cbd5e1",
            referenceColor: "#94a3b8",
            notes: "Substance packaged under irregular lighting without physical color reference card.",
            chainOfCustody: [
                { time: "2024-09-02 22:11:45", actor: "Sarah Chen", action: "Dispatched to toxicological laboratory for secondary chromatography" }
            ]
        }
    ],

    auditLogs: [
        { id: "LOG-9921", time: "2024-09-21 04:12:00 UTC", user: "Officer Mercer", action: "Cryptographic SHA-256 re-verification on EVD-2024-00891", status: "SUCCESS" },
        { id: "LOG-9920", time: "2024-09-20 19:44:18 UTC", user: "Dr. L. Reyes", action: "Exported chain-of-custody report CASE-2024-0891", status: "SUCCESS" },
        { id: "LOG-9919", time: "2024-09-20 12:15:03 UTC", user: "Sarah Chen (Admin)", action: "User permission elevation: Elena Vance granted Senior Lab Tech", status: "AUDITED" },
        { id: "LOG-9918", time: "2024-09-19 16:22:11 UTC", user: "System Watchdog", action: "Zero-Knowledge hash consensus anchored to distributed vault", status: "CONFIRMED" },
        { id: "LOG-9917", time: "2024-09-18 14:23:01 UTC", user: "AI Inference v4.2", action: "Spectral colorimetric analysis matched Cocaine HCl (98.4%)", status: "PROCESSED" }
    ],

    users: [
        { id: "USR-01", name: "Alex Mercer", email: "a.mercer@forensics.narc.gov", badge: "INV-7842", role: "Forensic Investigator", status: "Active" },
        { id: "USR-02", name: "Elena Vance", email: "e.vance@lab.narc.gov", badge: "FOR-9021", role: "Senior Lab Technician", status: "Active" },
        { id: "USR-03", name: "Sarah Chen", email: "s.chen@admin.narc.gov", badge: "ADM-1002", role: "Super Administrator", status: "Active" },
        { id: "USR-04", name: "David Miller", email: "d.miller@forensics.narc.gov", badge: "INV-4410", role: "Forensic Investigator", status: "Suspended" },
        { id: "USR-05", name: "Hon. Marcus Thorne", email: "m.thorne@courts.gov", badge: "CRT-3301", role: "Courtroom Observer / DA", status: "Active" }
    ],

    notifications: [
        { id: 1, title: "Zero-Knowledge Checksum Anchored", desc: "Block #892,114 verified on immutable ledger.", time: "10m ago", read: false, type: "system" },
        { id: 2, title: "Lab Results Ready", desc: "GC-MS confirmation ready for EVD-2024-00891.", time: "1h ago", read: false, type: "lab" },
        { id: 3, title: "Card Detection Verified", desc: "Ref card calibration passed delta E < 0.8.", time: "3h ago", read: true, type: "audit" }
    ]
};

// -------------------------------------------------------------
// 2. Cryptographic Engine (Web Crypto API SHA-256)
// -------------------------------------------------------------

async function generateSHA256(textOrBuffer) {
    const encoder = new TextEncoder();
    const data = typeof textOrBuffer === "string" ? encoder.encode(textOrBuffer) : textOrBuffer;
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// -------------------------------------------------------------
// 3. UI Navigation & View Switcher
// -------------------------------------------------------------

function switchView(viewId) {
    document.querySelectorAll(".view-panel").forEach(panel => {
        panel.classList.remove("active");
    });
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
    });

    const targetPanel = document.getElementById(viewId);
    if (targetPanel) {
        targetPanel.classList.add("active");
    }

    const activeLink = document.querySelector(`.nav-link[data-view="${viewId}"]`);
    if (activeLink) {
        activeLink.classList.add("active");
    }

    // Trigger responsive render for charts or map if switching to them
    if (viewId === "view-analytics") {
        renderAnalyticsCharts();
    } else if (viewId === "view-map") {
        setTimeout(initOrInvalidateMap, 200);
    } else if (viewId === "view-dashboard") {
        renderDashboardSummary();
    } else if (viewId === "view-evidence") {
        renderEvidenceTable();
    } else if (viewId === "view-cases") {
        renderCasesList();
    } else if (viewId === "view-admin") {
        renderAdminTables();
    }

    // Close mobile nav drawer if open
    const navDrawer = document.getElementById("mobileNavDrawer");
    if (navDrawer && navDrawer.classList.contains("open")) {
        navDrawer.classList.remove("open");
    }
}

// -------------------------------------------------------------
// 4. Toast Notification Alert System
// -------------------------------------------------------------

function showToast(message, type = "info", duration = 4000) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast-card ${type}`;
    
    let icon = "fa-circle-info";
    if (type === "success") icon = "fa-shield-check";
    if (type === "error") icon = "fa-triangle-exclamation";
    if (type === "warning") icon = "fa-shield-halved";

    toast.innerHTML = `
        <div class="toast-icon"><i class="fa-solid ${icon}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${type.toUpperCase()}</div>
            <div class="toast-body">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("fade-out");
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// -------------------------------------------------------------
// 5. Dashboard View Components
// -------------------------------------------------------------

function renderDashboardSummary() {
    // Stat counters
    const evCount = NarcoLockerDB.evidence.length;
    const tamperedCount = NarcoLockerDB.evidence.filter(e => e.isTampered).length;
    const verifiedCount = NarcoLockerDB.evidence.filter(e => e.status === "Verified").length;
    
    document.getElementById("statTotalEvidence").textContent = evCount;
    document.getElementById("statActiveCases").textContent = NarcoLockerDB.cases.filter(c => c.status === "Active").length;
    document.getElementById("statVerified").textContent = verifiedCount;
    document.getElementById("statTampered").textContent = tamperedCount;
    
    // Quick integrity alert badge
    const integrityBanner = document.getElementById("vaultIntegrityBanner");
    if (integrityBanner) {
        if (tamperedCount > 0) {
            integrityBanner.className = "alert-banner danger";
            integrityBanner.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>SECURITY ALERT:</strong> ${tamperedCount} Evidence record(s) failed cryptographic checksum comparison! Review immediately.`;
        } else {
            integrityBanner.className = "alert-banner safe";
            integrityBanner.innerHTML = `<i class="fa-solid fa-shield-halved"></i> <strong>SECURE LOCKER STATE:</strong> All ${evCount} digital evidence items verified against cryptographic hashes. Vault Zero-Knowledge proof valid.`;
        }
    }

    // Recent activity list
    const recentActivityEl = document.getElementById("recentActivityList");
    if (recentActivityEl) {
        recentActivityEl.innerHTML = NarcoLockerDB.auditLogs.slice(0, 5).map(log => `
            <div class="activity-row">
                <div class="act-badge ${log.status.toLowerCase()}">${log.status}</div>
                <div class="act-details">
                    <span class="act-action">${log.action}</span>
                    <span class="act-meta"><i class="fa-regular fa-user"></i> ${log.user} &bull; <i class="fa-regular fa-clock"></i> ${log.time}</span>
                </div>
            </div>
        `).join("");
    }

    // Quick Evidence Carousel / Grid
    const recentGridEl = document.getElementById("recentEvidenceGrid");
    if (recentGridEl) {
        recentGridEl.innerHTML = NarcoLockerDB.evidence.slice(0, 4).map(item => `
            <div class="evidence-card glass-card">
                <div class="card-thumb" style="background-image: url('${item.thumbnail}')">
                    <span class="status-badge ${item.isTampered ? 'tampered' : item.status.toLowerCase().replace(' ', '-')}">
                        ${item.isTampered ? 'TAMPERED' : item.status}
                    </span>
                    <span class="type-pill">${item.type}</span>
                </div>
                <div class="card-body">
                    <div class="card-id-row">
                        <span class="mono-code">${item.id}</span>
                        <span class="card-case">${item.caseId}</span>
                    </div>
                    <h4 class="card-title">${item.aiVerdict}</h4>
                    <p class="card-meta"><i class="fa-solid fa-location-dot"></i> ${item.location.name}</p>
                    <div class="hash-preview">
                        <span class="hash-label">SHA-256</span>
                        <span class="mono-hash">${item.sha256.substring(0, 16)}...</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-secondary btn-sm" onclick="openVerificationModal('${item.id}')">
                            <i class="fa-solid fa-fingerprint"></i> Verify Hash
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="openReportView('${item.id}')">
                            <i class="fa-solid fa-file-contract"></i> View Report
                        </button>
                    </div>
                </div>
            </div>
        `).join("");
    }
}

// -------------------------------------------------------------
// 6. Evidence Management Library (Search, Filter, Table/Card)
// -------------------------------------------------------------

let currentDisplayMode = "table"; // 'table' or 'grid'

function setDisplayMode(mode) {
    currentDisplayMode = mode;
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    const activeBtn = document.getElementById(`modeBtn_${mode}`);
    if (activeBtn) activeBtn.classList.add("active");
    renderEvidenceTable();
}

function renderEvidenceTable() {
    const searchVal = (document.getElementById("evidenceSearch")?.value || "").toLowerCase().trim();
    const caseVal = document.getElementById("filterCase")?.value || "ALL";
    const typeVal = document.getElementById("filterType")?.value || "ALL";
    const statusVal = document.getElementById("filterStatus")?.value || "ALL";
    const sortBy = document.getElementById("sortEvidence")?.value || "date_desc";

    let filtered = NarcoLockerDB.evidence.filter(item => {
        const matchesSearch = item.id.toLowerCase().includes(searchVal) ||
                              item.caseId.toLowerCase().includes(searchVal) ||
                              item.aiVerdict.toLowerCase().includes(searchVal) ||
                              item.officer.toLowerCase().includes(searchVal) ||
                              item.sha256.toLowerCase().includes(searchVal);
        const matchesCase = caseVal === "ALL" || item.caseId === caseVal;
        const matchesType = typeVal === "ALL" || item.type === typeVal;
        const matchesStatus = statusVal === "ALL" || 
                              (statusVal === "Tampered" ? item.isTampered : item.status === statusVal && !item.isTampered);
        return matchesSearch && matchesCase && matchesType && matchesStatus;
    });

    // Sorting
    filtered.sort((a, b) => {
        if (sortBy === "date_desc") return new Date(b.timestamp) - new Date(a.timestamp);
        if (sortBy === "date_asc") return new Date(a.timestamp) - new Date(b.timestamp);
        if (sortBy === "id_asc") return a.id.localeCompare(b.id);
        if (sortBy === "confidence") return b.aiConfidence - a.aiConfidence;
        return 0;
    });

    const countEl = document.getElementById("evidenceFilterCount");
    if (countEl) countEl.textContent = `Showing ${filtered.length} of ${NarcoLockerDB.evidence.length} evidence records`;

    const container = document.getElementById("evidenceContainer");
    if (!container) return;

    if (currentDisplayMode === "table") {
        container.innerHTML = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Evidence ID</th>
                            <th>Case Ref</th>
                            <th>Type</th>
                            <th>Substance / AI Verdict</th>
                            <th>Reference Card</th>
                            <th>Timestamp</th>
                            <th>Cryptographic Status</th>
                            <th style="text-align: right;">Forensic Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.length === 0 ? `<tr><td colspan="8" class="text-center py-4 text-muted">No evidence matching current criteria.</td></tr>` : 
                        filtered.map(item => `
                            <tr class="${item.isTampered ? 'row-tampered' : ''}">
                                <td><span class="mono-code">${item.id}</span></td>
                                <td><span class="badge-soft">${item.caseId}</span></td>
                                <td>${item.type}</td>
                                <td>
                                    <div class="verdict-cell">
                                        <span class="verdict-text ${item.aiVerdict.includes('Positive') ? 'pos' : (item.aiVerdict.includes('Negative') ? 'neg' : 'inc')}">${item.aiVerdict}</span>
                                        <span class="confidence-tag">${item.aiConfidence}%</span>
                                    </div>
                                </td>
                                <td>
                                    ${item.colorCardDetected ? 
                                        `<span class="badge-tag card-detected"><i class="fa-solid fa-check"></i> Calibrated</span>` : 
                                        `<span class="badge-tag card-missing"><i class="fa-solid fa-xmark"></i> Missing</span>`}
                                </td>
                                <td><span class="mono-sm">${item.timestamp.replace(' UTC', '')}</span></td>
                                <td>
                                    <span class="status-badge ${item.isTampered ? 'tampered' : item.status.toLowerCase().replace(' ', '-')}">
                                        <i class="fa-solid ${item.isTampered ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i> 
                                        ${item.isTampered ? 'TAMPER DETECTED' : item.status}
                                    </span>
                                </td>
                                <td style="text-align: right;">
                                    <div class="action-btn-group">
                                        <button class="icon-action-btn" title="Cryptographic Hash Verification" onclick="openVerificationModal('${item.id}')">
                                            <i class="fa-solid fa-fingerprint"></i>
                                        </button>
                                        <button class="icon-action-btn" title="Simulate File Tampering" onclick="toggleTamperSimulation('${item.id}')">
                                            <i class="fa-solid ${item.isTampered ? 'fa-rotate-left' : 'fa-skull-crossbones'}"></i>
                                        </button>
                                        <button class="icon-action-btn" title="Generate Forensic Custody Report" onclick="openReportView('${item.id}')">
                                            <i class="fa-solid fa-file-shield"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="evidence-grid-layout">
                ${filtered.map(item => `
                    <div class="evidence-card glass-card ${item.isTampered ? 'card-tampered' : ''}">
                        <div class="card-thumb" style="background-image: url('${item.thumbnail}')">
                            <span class="status-badge ${item.isTampered ? 'tampered' : item.status.toLowerCase().replace(' ', '-')}">
                                ${item.isTampered ? 'TAMPERED' : item.status}
                            </span>
                            <span class="type-pill">${item.type}</span>
                        </div>
                        <div class="card-body">
                            <div class="card-id-row">
                                <span class="mono-code">${item.id}</span>
                                <span class="card-case">${item.caseId}</span>
                            </div>
                            <h4 class="card-title">${item.aiVerdict}</h4>
                            <div class="card-metrics-row">
                                <span><i class="fa-solid fa-scale-balanced"></i> ${item.weightGrams}</span>
                                <span><i class="fa-solid fa-brain"></i> ${item.aiConfidence}% match</span>
                            </div>
                            <p class="card-meta"><i class="fa-solid fa-location-dot"></i> ${item.location.name}</p>
                            <div class="hash-preview">
                                <span class="hash-label">SHA-256</span>
                                <span class="mono-hash">${item.sha256.substring(0, 16)}...</span>
                            </div>
                            <div class="card-actions">
                                <button class="btn btn-secondary btn-sm" onclick="openVerificationModal('${item.id}')">
                                    <i class="fa-solid fa-fingerprint"></i> Verify
                                </button>
                                <button class="btn btn-primary btn-sm" onclick="openReportView('${item.id}')">
                                    <i class="fa-solid fa-file-contract"></i> Report
                                </button>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
    }
}

// -------------------------------------------------------------
// 7. Cryptographic Verification Modal & Tamper Simulation
// -------------------------------------------------------------

function openVerificationModal(evidenceId) {
    const item = NarcoLockerDB.evidence.find(e => e.id === evidenceId);
    if (!item) return;

    const modal = document.getElementById("verificationModal");
    const titleEl = document.getElementById("verifyModalTitle");
    const originalHashEl = document.getElementById("verifyOriginalHash");
    const currentHashEl = document.getElementById("verifyCurrentHash");
    const statusBannerEl = document.getElementById("verifyStatusBanner");
    const auditChainEl = document.getElementById("verifyAuditChain");
    const tamperBtn = document.getElementById("verifyTamperActionBtn");

    titleEl.innerHTML = `<i class="fa-solid fa-fingerprint text-accent"></i> Cryptographic Audit &bull; ${item.id}`;
    originalHashEl.textContent = item.originalHash;
    currentHashEl.textContent = item.sha256;

    const isMatch = item.sha256 === item.originalHash;

    if (isMatch) {
        statusBannerEl.className = "verify-banner banner-safe";
        statusBannerEl.innerHTML = `
            <div class="banner-icon"><i class="fa-solid fa-shield-check"></i></div>
            <div class="banner-text">
                <strong>CRYPTOGRAPHIC INTEGRITY CONFIRMED (100% MATCH)</strong>
                <p>Calculated SHA-256 matches the original ledger state. No byte alterations detected. Admissible in court proceedings.</p>
            </div>
        `;
    } else {
        statusBannerEl.className = "verify-banner banner-tampered";
        statusBannerEl.innerHTML = `
            <div class="banner-icon"><i class="fa-solid fa-skull-crossbones"></i></div>
            <div class="banner-text">
                <strong>TAMPER DETECTED: CHECKSUM MISMATCH</strong>
                <p>The stored binary signature does not correspond to original capture hash. Chain of custody is compromised!</p>
            </div>
        `;
    }

    // Tamper button label
    tamperBtn.textContent = item.isTampered ? "Restore Original Hash (Re-secure)" : "Simulate Metadata/File Tampering";
    tamperBtn.className = item.isTampered ? "btn btn-outline-cyan" : "btn btn-outline-danger";
    tamperBtn.onclick = () => {
        toggleTamperSimulation(item.id);
        openVerificationModal(item.id); // Refresh modal view
    };

    // Chain of custody list
    auditChainEl.innerHTML = item.chainOfCustody.map(entry => `
        <div class="custody-step">
            <div class="step-point"></div>
            <div class="step-body">
                <div class="step-header">
                    <span class="step-actor">${entry.actor}</span>
                    <span class="step-time">${entry.time}</span>
                </div>
                <div class="step-action">${entry.action}</div>
            </div>
        </div>
    `).join("");

    modal.classList.add("open");
}

function closeVerificationModal() {
    const modal = document.getElementById("verificationModal");
    if (modal) modal.classList.remove("open");
}

function toggleTamperSimulation(evidenceId) {
    const item = NarcoLockerDB.evidence.find(e => e.id === evidenceId);
    if (!item) return;

    if (!item.isTampered) {
        item.isTampered = true;
        // Inject a simulated corrupted hash
        item.sha256 = "b7a982103fca9138e404b92bdf6c1092a95c9931818274d89a9f24da014f3319";
        item.status = "Tampered";
        showToast(`Tampering simulated on ${evidenceId}: Hash altered!`, "error");
        NarcoLockerDB.auditLogs.unshift({
            id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
            time: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
            user: NarcoLockerDB.currentUser.name,
            action: `SECURITY AUDIT VIOLATION: Checksum mismatch on ${evidenceId}`,
            status: "ALERT"
        });
    } else {
        item.isTampered = false;
        item.sha256 = item.originalHash;
        item.status = "Verified";
        showToast(`Evidence ${evidenceId} restored to certified cryptographically verified state.`, "success");
        NarcoLockerDB.auditLogs.unshift({
            id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
            time: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
            user: NarcoLockerDB.currentUser.name,
            action: `RESTORATION: Checksum re-validated on ${evidenceId}`,
            status: "SUCCESS"
        });
    }

    renderDashboardSummary();
    renderEvidenceTable();
}

// -------------------------------------------------------------
// 8. Capture Evidence & 8-Step AI Analysis Pipeline
// -------------------------------------------------------------

let simulatedMediaStream = null;
let captureCardDetected = true;
let currentSampleType = "cocaine";

const sampleLibrary = {
    cocaine: {
        name: "Cocaine HCl (High Purity)",
        verdict: "Positive (Cocaine HCl)",
        type: "Chemical Substance",
        confidence: 98.6,
        detectedColor: "#f1ece1",
        refColor: "#ffffff",
        weight: "185.0 g",
        notes: "Fine crystalline powder, spectral reflectance matching cocaine monohydrochloride.",
        img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600"
    },
    meth: {
        name: "Methamphetamine Shards",
        verdict: "Positive (Methamphetamine)",
        type: "Chemical Substance",
        confidence: 99.2,
        detectedColor: "#d9e2ec",
        refColor: "#ffffff",
        weight: "62.4 g",
        notes: "Translucent angular crystal formation.",
        img: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=600"
    },
    mdma: {
        name: "Pressed Ecstasy Tablets",
        verdict: "Positive (MDMA)",
        type: "Pills / Tablets",
        confidence: 95.1,
        detectedColor: "#38bdf8",
        refColor: "#0284c7",
        weight: "35.8 g",
        notes: "Blue circular tablets stamped with interlocking geometric motif.",
        img: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=600"
    },
    negative: {
        name: "Inert Organic / Flour Substrate",
        verdict: "Negative (Inert Starch / Talc)",
        type: "Chemical Substance",
        confidence: 91.8,
        detectedColor: "#fef9c3",
        refColor: "#ffffff",
        weight: "500.0 g",
        notes: "Non-narcotic composition. No synthetic alkaloid response.",
        img: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?auto=format&fit=crop&q=80&w=600"
    }
};

function setSamplePreset(presetKey) {
    if (!sampleLibrary[presetKey]) return;
    currentSampleType = presetKey;
    const sample = sampleLibrary[presetKey];
    
    // Update preview image
    const previewImg = document.getElementById("cameraFeedPreview");
    if (previewImg) {
        previewImg.src = sample.img;
    }
    
    const weightInput = document.getElementById("captureWeight");
    if (weightInput) weightInput.value = sample.weight;

    const descInput = document.getElementById("captureNotes");
    if (descInput) descInput.value = sample.notes;

    showToast(`Loaded sample preset: ${sample.name}`, "info");
}

function toggleColorCardDetection() {
    captureCardDetected = !captureCardDetected;
    const badge = document.getElementById("cardDetectionBadge");
    const warning = document.getElementById("cardDetectionWarning");
    const reticle = document.getElementById("colorCardReticle");
    
    if (captureCardDetected) {
        badge.className = "status-badge verified";
        badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Calibrated Reference Card Detected`;
        if (warning) warning.style.display = "none";
        if (reticle) reticle.classList.remove("invalid");
    } else {
        badge.className = "status-badge warning";
        badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Card NOT Detected in Frame`;
        if (warning) warning.style.display = "block";
        if (reticle) reticle.classList.add("invalid");
    }
}

const pipelineSteps = [
    { title: "Initializing Camera & Calibrating Optics", desc: "Verifying camera sensor calibration and lighting integrity..." },
    { title: "Locating Reference Colour Card", desc: "Detecting 4-corner fiducial anchors on physical calibration target..." },
    { title: "Executing White-Balance & Color Normalization", desc: "Compensating ambient color temperature and LUX levels..." },
    { title: "Extracting Region of Interest (ROI)", desc: "Isolating chemical powder / packaging contours from substrate..." },
    { title: "Deep CNN Feature Extraction", desc: "Querying forensic spectral fingerprint and texture classification nodes..." },
    { title: "Matching Reference Substance Database", desc: "Comparing optical density and reagent colorimetric spectrum..." },
    { title: "Generating Cryptographic Evidence Package", desc: "Computing client-side SHA-256 digest & preparing ledger anchoring..." },
    { title: "Verification Completed & Ready to Commit", desc: "Analysis verified with cryptographic proof." }
];

async function startAIAnalysisPipeline() {
    const caseSelect = document.getElementById("captureCaseSelect");
    const caseId = caseSelect ? caseSelect.value : "CASE-2024-0891";
    const sample = sampleLibrary[currentSampleType];

    // Open Pipeline Modal
    const modal = document.getElementById("pipelineModal");
    modal.classList.add("open");

    const stepsContainer = document.getElementById("pipelineStepsContainer");
    const progressFill = document.getElementById("pipelineProgressFill");
    const progressPercent = document.getElementById("pipelineProgressPercent");
    const resultBox = document.getElementById("pipelineResultCard");
    const commitBtn = document.getElementById("pipelineCommitBtn");

    resultBox.style.display = "none";
    commitBtn.style.display = "none";
    progressFill.style.width = "0%";
    progressPercent.textContent = "0%";

    // Render step items
    stepsContainer.innerHTML = pipelineSteps.map((step, idx) => `
        <div class="pipeline-step-row" id="step_row_${idx}">
            <div class="step-indicator" id="step_dot_${idx}"><i class="fa-solid fa-circle-notch fa-spin"></i></div>
            <div class="step-text-wrap">
                <span class="step-name">${step.title}</span>
                <span class="step-subtext" id="step_sub_${idx}">${step.desc}</span>
            </div>
        </div>
    `).join("");

    // Animate each step
    for (let i = 0; i < pipelineSteps.length; i++) {
        const dot = document.getElementById(`step_dot_${i}`);
        const row = document.getElementById(`step_row_${i}`);
        
        row.classList.add("active");
        
        // Progress update
        const pct = Math.round(((i + 1) / pipelineSteps.length) * 100);
        progressFill.style.width = `${pct}%`;
        progressPercent.textContent = `${pct}%`;

        await new Promise(r => setTimeout(r, 650));

        dot.innerHTML = `<i class="fa-solid fa-check"></i>`;
        dot.classList.add("done");
        row.classList.remove("active");
        row.classList.add("completed");
    }

    // Generate real SHA-256 for this evidence item
    const rawSignature = `${caseId}-${sample.verdict}-${Date.now()}-${Math.random()}`;
    const generatedHash = await generateSHA256(rawSignature);
    const newId = `EVD-2024-0${Math.floor(1000 + Math.random() * 9000)}`;

    // Display verdict card
    resultBox.style.display = "block";
    resultBox.innerHTML = `
        <div class="verdict-banner ${sample.verdict.includes('Positive') ? 'positive' : 'negative'}">
            <div class="verdict-head">
                <i class="fa-solid ${sample.verdict.includes('Positive') ? 'fa-shield-virus' : 'fa-circle-check'}"></i>
                <div>
                    <h3 class="verdict-title">${sample.verdict}</h3>
                    <span class="verdict-conf">AI Confidence: <strong>${sample.confidence}%</strong></span>
                </div>
            </div>
        </div>
        <div class="color-comparison-grid">
            <div class="color-swatch-box">
                <span class="swatch-label">Detected Color</span>
                <div class="swatch-preview" style="background-color: ${sample.detectedColor}; border: 1px solid #ffffff44;"></div>
                <span class="mono-sm">${sample.detectedColor}</span>
            </div>
            <div class="color-delta-badge">
                <span>&Delta;E = 0.42</span>
                <small class="text-success">Match &lt; 1.0</small>
            </div>
            <div class="color-swatch-box">
                <span class="swatch-label">Reference Standard</span>
                <div class="swatch-preview" style="background-color: ${sample.refColor}; border: 1px solid #ffffff44;"></div>
                <span class="mono-sm">${sample.refColor}</span>
            </div>
        </div>
        <div class="crypto-preview-box">
            <span class="hash-tag-label"><i class="fa-solid fa-lock"></i> Generated SHA-256 Checksum:</span>
            <span class="mono-hash break-all">${generatedHash}</span>
        </div>
    `;

    commitBtn.style.display = "inline-flex";
    commitBtn.onclick = () => {
        commitNewEvidence(newId, caseId, sample, generatedHash);
        modal.classList.remove("open");
    };
}

function commitNewEvidence(newId, caseId, sample, generatedHash) {
    const weightVal = document.getElementById("captureWeight")?.value || sample.weight;
    const notesVal = document.getElementById("captureNotes")?.value || sample.notes;
    const locationVal = document.getElementById("captureLocation")?.value || "Field Station Sector 4";

    const newEvidenceItem = {
        id: newId,
        caseId: caseId,
        type: sample.type,
        thumbnail: sample.img,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
        officer: `${NarcoLockerDB.currentUser.name} (${NarcoLockerDB.currentUser.badge})`,
        location: {
            name: locationVal,
            lat: 40.7128 + (Math.random() - 0.5) * 0.08,
            lng: -74.0060 + (Math.random() - 0.5) * 0.08
        },
        sha256: generatedHash,
        originalHash: generatedHash,
        isTampered: false,
        status: "Verified",
        aiVerdict: sample.verdict,
        aiConfidence: sample.confidence,
        weightGrams: weightVal,
        colorCardDetected: captureCardDetected,
        detectedColor: sample.detectedColor,
        referenceColor: sample.refColor,
        notes: notesVal,
        chainOfCustody: [
            {
                time: new Date().toISOString().replace("T", " ").substring(0, 19),
                actor: NarcoLockerDB.currentUser.name,
                action: `Intake captured with Reference Colour Card (${captureCardDetected ? 'Passed' : 'Overridden'})`
            },
            {
                time: new Date().toISOString().replace("T", " ").substring(0, 19),
                actor: "NarcoLocker AI Engine",
                action: `Spectrophotometric analysis completed (${sample.confidence}% match)`
            },
            {
                time: new Date().toISOString().replace("T", " ").substring(0, 19),
                actor: "Cryptographic Vault",
                action: `SHA-256 anchored to ledger (${generatedHash.substring(0, 16)}...)`
            }
        ]
    };

    NarcoLockerDB.evidence.unshift(newEvidenceItem);
    
    // Update case evidence count
    const targetCase = NarcoLockerDB.cases.find(c => c.id === caseId);
    if (targetCase) targetCase.evidenceCount++;

    // Add audit log
    NarcoLockerDB.auditLogs.unshift({
        id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        time: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
        user: NarcoLockerDB.currentUser.name,
        action: `NEW EVIDENCE SECURED: ${newId} assigned to ${caseId}`,
        status: "SUCCESS"
    });

    showToast(`Evidence ${newId} successfully encrypted and saved to locker!`, "success");
    switchView("view-evidence");
}

function closePipelineModal() {
    const modal = document.getElementById("pipelineModal");
    if (modal) modal.classList.remove("open");
}

// -------------------------------------------------------------
// 9. Case Management System
// -------------------------------------------------------------

function renderCasesList() {
    const container = document.getElementById("casesContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="cases-grid">
            ${NarcoLockerDB.cases.map(c => `
                <div class="case-card glass-card">
                    <div class="case-card-header">
                        <div>
                            <span class="mono-code">${c.id}</span>
                            <h3 class="case-card-title">${c.title}</h3>
                        </div>
                        <span class="badge-soft ${c.status.toLowerCase().replace(' ', '-')}">${c.status}</span>
                    </div>
                    <p class="case-desc">${c.summary}</p>
                    <div class="case-meta-list">
                        <div class="meta-row">
                            <span class="meta-lbl"><i class="fa-solid fa-user-shield"></i> Lead Officer:</span>
                            <span class="meta-val">${c.leadOfficer}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-lbl"><i class="fa-solid fa-boxes-stacked"></i> Evidence Items:</span>
                            <span class="meta-val highlight">${c.evidenceCount} registered</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-lbl"><i class="fa-solid fa-calendar"></i> Opened:</span>
                            <span class="meta-val">${c.createdDate}</span>
                        </div>
                    </div>
                    <div class="case-card-footer">
                        <button class="btn btn-secondary btn-sm" onclick="filterByCaseAndOpenEvidence('${c.id}')">
                            <i class="fa-solid fa-folder-open"></i> View Case Evidence
                        </button>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function filterByCaseAndOpenEvidence(caseId) {
    const filterSelect = document.getElementById("filterCase");
    if (filterSelect) filterSelect.value = caseId;
    switchView("view-evidence");
}

function openCreateCaseModal() {
    const modal = document.getElementById("createCaseModal");
    if (modal) modal.classList.add("open");
}

function closeCreateCaseModal() {
    const modal = document.getElementById("createCaseModal");
    if (modal) modal.classList.remove("open");
}

function handleCreateCaseSubmit(e) {
    e.preventDefault();
    const title = document.getElementById("newCaseTitle").value.trim();
    const lead = document.getElementById("newCaseLead").value.trim();
    const summary = document.getElementById("newCaseSummary").value.trim();

    const newId = `CASE-2024-0${Math.floor(100 + Math.random() * 900)}`;

    NarcoLockerDB.cases.unshift({
        id: newId,
        title: title || "Untitled Narcotics Operation",
        leadOfficer: lead || NarcoLockerDB.currentUser.name,
        evidenceCount: 0,
        status: "Active",
        createdDate: new Date().toISOString().substring(0, 10),
        summary: summary || "Preliminary incident investigation initiated."
    });

    // Populate dropdowns across views
    updateCaseDropdowns();

    showToast(`Case ${newId} created successfully.`, "success");
    closeCreateCaseModal();
    renderCasesList();
}

function updateCaseDropdowns() {
    const selects = ["filterCase", "captureCaseSelect"];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const currentVal = el.value;
        const isFilter = id === "filterCase";

        el.innerHTML = (isFilter ? `<option value="ALL">All Active Cases</option>` : '') +
            NarcoLockerDB.cases.map(c => `<option value="${c.id}">${c.id} - ${c.title}</option>`).join("");
        
        if (currentVal) el.value = currentVal;
    });
}

// -------------------------------------------------------------
// 10. Official Forensic Reports & Chain-of-Custody Export
// -------------------------------------------------------------

function openReportView(evidenceId) {
    const item = NarcoLockerDB.evidence.find(e => e.id === evidenceId) || NarcoLockerDB.evidence[0];
    const reportContainer = document.getElementById("officialReportContainer");
    if (!reportContainer) return;

    reportContainer.innerHTML = `
        <div class="report-paper">
            <div class="report-watermark">CONFIDENTIAL FORENSIC DRAFT</div>
            
            <div class="report-header">
                <div class="dept-seal">
                    <i class="fa-solid fa-shield-halved"></i>
                </div>
                <div class="dept-details">
                    <h2>NATIONAL FORENSIC EVIDENCE & NARCOTICS IDENTIFICATION BUREAU</h2>
                    <p>DIVISION OF DIGITAL INTEGRITY & CHAIN-OF-CUSTODY &bull; ISO/IEC 17025 ACCREDITED</p>
                    <span class="report-badge">LABORATORY ANALYSIS CERTIFICATE #NAR-${item.id.replace('EVD-', '')}</span>
                </div>
                <div class="qr-mock">
                    <i class="fa-solid fa-qrcode"></i>
                    <span>VERIFY LEDGER</span>
                </div>
            </div>

            <hr class="report-divider"/>

            <div class="report-grid-two">
                <div class="report-sec">
                    <h4>EVIDENCE SPECIFICATION</h4>
                    <table class="report-table-mini">
                        <tr><td>Evidence ID:</td><td class="mono-bold">${item.id}</td></tr>
                        <tr><td>Case Reference:</td><td>${item.caseId}</td></tr>
                        <tr><td>Intake Category:</td><td>${item.type}</td></tr>
                        <tr><td>Gross Mass:</td><td>${item.weightGrams}</td></tr>
                        <tr><td>Date & Time:</td><td>${item.timestamp}</td></tr>
                        <tr><td>Seizure Location:</td><td>${item.location.name}</td></tr>
                        <tr><td>Investigating Officer:</td><td>${item.officer}</td></tr>
                    </table>
                </div>
                <div class="report-sec">
                    <h4>SPECTRAL & AI VERDICT</h4>
                    <table class="report-table-mini">
                        <tr><td>Substance Classification:</td><td class="text-accent bold">${item.aiVerdict}</td></tr>
                        <tr><td>Confidence Level:</td><td>${item.aiConfidence}%</td></tr>
                        <tr><td>Colour Card Calibration:</td><td>${item.colorCardDetected ? 'PASSED (&Delta;E &lt; 1.0)' : 'UNVERIFIED (Warning)'}</td></tr>
                        <tr><td>Color Sample Code:</td><td><span class="color-inline" style="background:${item.detectedColor}"></span> ${item.detectedColor}</td></tr>
                        <tr><td>Current Vault Status:</td><td class="${item.isTampered ? 'text-danger bold' : 'text-success bold'}">${item.isTampered ? 'TAMPER COMPROMISED' : 'VERIFIED & ANCHORED'}</td></tr>
                    </table>
                </div>
            </div>

            <div class="report-sec crypto-box">
                <h4>CRYPTOGRAPHIC PROOF OF CUSTODY (SHA-256)</h4>
                <p class="crypto-hash-line mono-hash">${item.sha256}</p>
                <div class="crypto-meta-sub">
                    <span>Algorithm: SHA-256 (NIST FIPS 180-4)</span>
                    <span>State: ${item.isTampered ? 'MISMATCH (Audit Failure)' : 'Zero-Knowledge Ledger Anchor Confirmed'}</span>
                </div>
            </div>

            <div class="report-sec">
                <h4>AUDIT TRAIL & CHAIN-OF-CUSTODY HISTORY</h4>
                <table class="report-custody-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Officer / Authority</th>
                            <th>Action / Custody Transfer</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${item.chainOfCustody.map(c => `
                            <tr>
                                <td class="mono-sm">${c.time}</td>
                                <td><strong>${c.actor}</strong></td>
                                <td>${c.action}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>

            <div class="report-sec notes-sec">
                <h4>FORENSIC NOTES & OBSERVATIONS</h4>
                <p class="report-notes-text">${item.notes}</p>
            </div>

            <div class="report-signatures">
                <div class="sig-block">
                    <div class="sig-line"></div>
                    <span>Investigating Officer Signature</span>
                    <small>${item.officer}</small>
                </div>
                <div class="sig-block">
                    <div class="sig-line"></div>
                    <span>Forensic Laboratory Director</span>
                    <small>Dr. L. Reyes, PhD (Chief Toxicologist)</small>
                </div>
                <div class="sig-block">
                    <div class="sig-line"></div>
                    <span>Clerk of Court Certification</span>
                    <small>Official Vault Verification Seal</small>
                </div>
            </div>
        </div>
    `;

    switchView("view-reports");
}

function printCurrentReport() {
    window.print();
}

// -------------------------------------------------------------
// 11. Chart.js Analytics Engine
// -------------------------------------------------------------

let timelineChart = null;
let substanceChart = null;
let outcomeChart = null;

function renderAnalyticsCharts() {
    // Check if Chart library is available
    if (typeof Chart === "undefined") {
        console.warn("Chart.js not yet loaded.");
        return;
    }

    Chart.defaults.color = "#94a3b8";
    Chart.defaults.borderColor = "#1e293b";
    Chart.defaults.font.family = "'Inter', sans-serif";

    // 1. Evidence Intake Timeline Chart
    const ctxTimeline = document.getElementById("chartTimeline")?.getContext("2d");
    if (ctxTimeline) {
        if (timelineChart) timelineChart.destroy();
        timelineChart = new Chart(ctxTimeline, {
            type: "line",
            data: {
                labels: ["Sep 14", "Sep 15", "Sep 16", "Sep 17", "Sep 18", "Sep 19", "Sep 20", "Sep 21"],
                datasets: [
                    {
                        label: "Evidence Processed",
                        data: [14, 22, 18, 35, 42, 29, 38, 45],
                        borderColor: "#00f0ff",
                        backgroundColor: "rgba(0, 240, 255, 0.12)",
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2,
                        pointBackgroundColor: "#00f0ff"
                    },
                    {
                        label: "AI Validations",
                        data: [12, 20, 17, 33, 40, 28, 37, 44],
                        borderColor: "#1d4ed8",
                        backgroundColor: "transparent",
                        borderDash: [5, 5],
                        tension: 0.35,
                        borderWidth: 2,
                        pointBackgroundColor: "#1d4ed8"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "top", labels: { boxWidth: 12 } }
                }
            }
        });
    }

    // 2. Substance Breakdown Doughnut Chart
    const ctxSubstance = document.getElementById("chartSubstance")?.getContext("2d");
    if (ctxSubstance) {
        if (substanceChart) substanceChart.destroy();
        substanceChart = new Chart(ctxSubstance, {
            type: "doughnut",
            data: {
                labels: ["Cocaine HCl", "Methamphetamine", "MDMA / Ecstasy", "Cannabinoids", "Negative / Inert", "Inconclusive"],
                datasets: [{
                    data: [42, 28, 16, 9, 3, 2],
                    backgroundColor: [
                        "#00f0ff",
                        "#38bdf8",
                        "#818cf8",
                        "#34d399",
                        "#94a3b8",
                        "#f59e0b"
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "right", labels: { boxWidth: 12 } }
                },
                cutout: "68%"
            }
        });
    }

    // 3. Field Results Bar Chart
    const ctxOutcome = document.getElementById("chartOutcome")?.getContext("2d");
    if (ctxOutcome) {
        if (outcomeChart) outcomeChart.destroy();
        outcomeChart = new Chart(ctxOutcome, {
            type: "bar",
            data: {
                labels: ["Positive Detection", "Negative / Inert", "Secondary Lab Required", "Tamper Flagged"],
                datasets: [{
                    label: "Cases Count",
                    data: [86, 12, 4, 1],
                    backgroundColor: [
                        "rgba(0, 240, 255, 0.7)",
                        "rgba(148, 163, 184, 0.5)",
                        "rgba(245, 158, 11, 0.7)",
                        "rgba(239, 68, 68, 0.85)"
                    ],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

// -------------------------------------------------------------
// 12. Interactive Geospatial Intelligence Map (Leaflet)
// -------------------------------------------------------------

let evidenceMap = null;
let mapMarkersGroup = null;

function initOrInvalidateMap() {
    const mapEl = document.getElementById("geoMapContainer");
    if (!mapEl || typeof L === "undefined") return;

    if (!evidenceMap) {
        // Initialize Leaflet
        evidenceMap = L.map("geoMapContainer", {
            zoomControl: true,
            attributionControl: false
        }).setView([40.7128, -74.0060], 12);

        // Dark Matter tiles for sleek cybersecurity aesthetic
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            maxZoom: 19
        }).addTo(evidenceMap);

        mapMarkersGroup = L.layerGroup().addTo(evidenceMap);
    }

    evidenceMap.invalidateSize();
    populateMapMarkers();
}

function populateMapMarkers() {
    if (!mapMarkersGroup) return;
    mapMarkersGroup.clearLayers();

    NarcoLockerDB.evidence.forEach(item => {
        const isTampered = item.isTampered;
        const color = isTampered ? "#ef4444" : (item.aiVerdict.includes("Positive") ? "#00f0ff" : "#94a3b8");

        const customIcon = L.divIcon({
            className: "map-custom-marker",
            html: `
                <div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 10px ${color}; border: 2px solid #fff;"></div>
            `,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        const marker = L.marker([item.location.lat, item.location.lng], { icon: customIcon });
        
        marker.bindPopup(`
            <div class="map-popup-card">
                <div class="popup-title">${item.id} &bull; ${item.type}</div>
                <div class="popup-verdict ${isTampered ? 'text-danger' : 'text-accent'}">
                    <strong>${isTampered ? 'TAMPER COMPROMISED' : item.aiVerdict}</strong>
                </div>
                <div class="popup-meta">
                    <div><i class="fa-solid fa-location-dot"></i> ${item.location.name}</div>
                    <div><i class="fa-solid fa-user"></i> ${item.officer}</div>
                    <div><i class="fa-solid fa-clock"></i> ${item.timestamp}</div>
                </div>
                <button class="btn btn-secondary btn-xs mt-2" onclick="openVerificationModal('${item.id}')">
                    <i class="fa-solid fa-fingerprint"></i> Inspect Evidence
                </button>
            </div>
        `);

        mapMarkersGroup.addLayer(marker);
    });
}

// -------------------------------------------------------------
// 13. Admin Suite & User Access Management
// -------------------------------------------------------------

function renderAdminTables() {
    const userTableBody = document.getElementById("adminUserTableBody");
    if (userTableBody) {
        userTableBody.innerHTML = NarcoLockerDB.users.map(u => `
            <tr>
                <td><span class="mono-code">${u.id}</span></td>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td><span class="badge-soft">${u.badge}</span></td>
                <td><span class="role-pill ${u.role.toLowerCase().replace(/[^a-z]/g, '')}">${u.role}</span></td>
                <td>
                    <span class="status-badge ${u.status === 'Active' ? 'verified' : 'tampered'}">
                        ${u.status}
                    </span>
                </td>
                <td style="text-align: right;">
                    <button class="icon-action-btn" title="Toggle Status" onclick="toggleUserStatus('${u.id}')">
                        <i class="fa-solid ${u.status === 'Active' ? 'fa-user-slash' : 'fa-user-check'}"></i>
                    </button>
                    <button class="icon-action-btn" title="Edit Role" onclick="promptRoleChange('${u.id}')">
                        <i class="fa-solid fa-user-gear"></i>
                    </button>
                </td>
            </tr>
        `).join("");
    }

    const auditTableBody = document.getElementById("adminAuditTableBody");
    if (auditTableBody) {
        auditTableBody.innerHTML = NarcoLockerDB.auditLogs.map(log => `
            <tr>
                <td><span class="mono-code">${log.id}</span></td>
                <td><span class="mono-sm">${log.time}</span></td>
                <td><strong>${log.user}</strong></td>
                <td>${log.action}</td>
                <td><span class="act-badge ${log.status.toLowerCase()}">${log.status}</span></td>
            </tr>
        `).join("");
    }
}

function toggleUserStatus(userId) {
    const user = NarcoLockerDB.users.find(u => u.id === userId);
    if (!user) return;
    user.status = user.status === "Active" ? "Suspended" : "Active";
    showToast(`User ${user.name} status updated to ${user.status}.`, "info");
    renderAdminTables();
}

function promptRoleChange(userId) {
    const user = NarcoLockerDB.users.find(u => u.id === userId);
    if (!user) return;
    const roles = ["Forensic Investigator", "Senior Lab Technician", "Super Administrator", "Courtroom Observer / DA"];
    const currentIdx = roles.indexOf(user.role);
    const nextRole = roles[(currentIdx + 1) % roles.length];
    user.role = nextRole;
    showToast(`Updated ${user.name}'s role to "${nextRole}".`, "success");
    renderAdminTables();
}

function openAddUserModal() {
    const modal = document.getElementById("addUserModal");
    if (modal) modal.classList.add("open");
}

function closeAddUserModal() {
    const modal = document.getElementById("addUserModal");
    if (modal) modal.classList.remove("open");
}

function handleAddUserSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("newUserName").value.trim();
    const email = document.getElementById("newUserEmail").value.trim();
    const badge = document.getElementById("newUserBadge").value.trim();
    const role = document.getElementById("newUserRole").value;

    const newId = `USR-0${NarcoLockerDB.users.length + 1}`;
    NarcoLockerDB.users.push({
        id: newId,
        name: name || "New Agent",
        email: email || "agent@narc.gov",
        badge: badge || "INV-0000",
        role: role,
        status: "Active"
    });

    NarcoLockerDB.auditLogs.unshift({
        id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        time: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
        user: NarcoLockerDB.currentUser.name,
        action: `SECURITY AUDIT: Created credentials for ${name} (${badge})`,
        status: "AUDITED"
    });

    showToast(`Officer account ${name} added to NarcoLocker authorization vault.`, "success");
    closeAddUserModal();
    renderAdminTables();
}

// -------------------------------------------------------------
// 14. Notifications Drawer
// -------------------------------------------------------------

function toggleNotificationsDrawer() {
    const drawer = document.getElementById("notificationsDrawer");
    if (drawer) drawer.classList.toggle("open");
}

function renderNotifications() {
    const list = document.getElementById("notificationsList");
    const countBadge = document.getElementById("navNotificationCount");
    if (!list) return;

    const unread = NarcoLockerDB.notifications.filter(n => !n.read).length;
    if (countBadge) {
        countBadge.textContent = unread;
        countBadge.style.display = unread > 0 ? "inline-flex" : "none";
    }

    list.innerHTML = NarcoLockerDB.notifications.map(n => `
        <div class="notification-item ${n.read ? 'read' : 'unread'}">
            <div class="notif-header">
                <strong>${n.title}</strong>
                <span class="notif-time">${n.time}</span>
            </div>
            <p class="notif-desc">${n.desc}</p>
        </div>
    `).join("");
}

function markAllNotificationsRead() {
    NarcoLockerDB.notifications.forEach(n => n.read = true);
    renderNotifications();
    showToast("All security alerts marked as acknowledged.", "info");
}

// -------------------------------------------------------------
// 15. Initialization & DOM Bindings
// -------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    // 1. Navigation clicks
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const view = link.getAttribute("data-view");
            if (view) switchView(view);
        });
    });

    // 2. Mobile nav toggle
    const hamburgerBtn = document.getElementById("mobileHamburgerBtn");
    const mobileDrawer = document.getElementById("mobileNavDrawer");
    if (hamburgerBtn && mobileDrawer) {
        hamburgerBtn.addEventListener("click", () => {
            mobileDrawer.classList.toggle("open");
        });
    }

    // 3. Filters
    const searchInput = document.getElementById("evidenceSearch");
    if (searchInput) searchInput.addEventListener("input", renderEvidenceTable);

    const filterCase = document.getElementById("filterCase");
    if (filterCase) filterCase.addEventListener("change", renderEvidenceTable);

    const filterType = document.getElementById("filterType");
    if (filterType) filterType.addEventListener("change", renderEvidenceTable);

    const filterStatus = document.getElementById("filterStatus");
    if (filterStatus) filterStatus.addEventListener("change", renderEvidenceTable);

    const sortSelect = document.getElementById("sortEvidence");
    if (sortSelect) sortSelect.addEventListener("change", renderEvidenceTable);

    // 4. Initial rendering
    updateCaseDropdowns();
    renderDashboardSummary();
    renderEvidenceTable();
    renderNotifications();

    // Default sample preset in capture page
    setSamplePreset("cocaine");

    console.log("NarcoLocker Secure Evidence Platform initialized.");
});
