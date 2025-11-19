// script.js (updated) - includes search + delete + edit for view-report.html
// Keeps your DEBUGGING logs and API_URL variable

const API_URL = 'http://localhost/api.php';

console.log('=== SCRIPT LOADED ===');
console.log('API URL:', API_URL);

let lastClubsData = [];
let lastMembersData = [];

async function fetchJson(url, opts = {}) {
    try {
        const res = await fetch(url, opts);
        const json = await res.json();
        return { ok: res.ok, status: res.status, json };
    } catch (err) {
        console.error('Fetch error for', url, err);
        return { ok: false, status: 0, json: { success: false, error: err.message || String(err) } };
    }
}

async function loadStatistics() {
    console.log('Attempting to load statistics...');
    try {
        console.log('Fetching from:', API_URL + '/statistics');
        const { ok, status, json: result } = await fetchJson(API_URL + '/statistics');
        console.log('Response status:', status);
        console.log('Response OK:', ok, 'Result:', result);

        if (result && result.success) {
            console.log('SUCCESS! Updating DOM elements...');
            const totalClubsEl = document.getElementById('totalClubs');
            const totalMembersEl = document.getElementById('totalMembers');
            if (totalClubsEl) totalClubsEl.textContent = result.data.totalClubs;
            if (totalMembersEl) totalMembersEl.textContent = result.data.totalMembers;
            const activeClubs = (result.data.membersByClub || []).filter(club => club.member_count > 0).length;
            const activeClubsEl = document.getElementById('activeClubs');
            if (activeClubsEl) activeClubsEl.textContent = activeClubs;
            console.log('Statistics loaded successfully!');
        } else {
            console.error('Result success is false or missing', result);
        }
    } catch (error) {
        console.error('ERROR loading statistics:', error);
        console.error('Error details:', error.message);
        alert('Cannot connect to backend!\n\nCheck:\n1. Is XAMPP running?\n2. Is api.php in htdocs?\n3. Did you import database?\n\nPress F12 and check Console for details.');
    }
}

async function loadClubs() {
    console.log('Attempting to load clubs...');
    try {
        console.log('Fetching from:', API_URL + '/clubs');
        const { json: result } = await fetchJson(API_URL + '/clubs');
        console.log('Clubs result:', result);
        console.log('Number of clubs:', result.data ? result.data.length : 0);

        const container = document.getElementById('clubsContainer');
        if (result && result.success && result.data.length > 0) {
            console.log('Rendering', result.data.length, 'clubs...');
            container.innerHTML = result.data.map(club => `
                <div class="club-card">
                    <h3>${escapeHtml(club.club_name)}</h3>
                    <span class="club-category">${escapeHtml(club.club_category)}</span>
                    <p>${escapeHtml(club.description || 'No description')}</p>
                    <p class="club-advisor">Advisor: ${escapeHtml(club.advisor_name || 'Not assigned')}</p>
                </div>
            `).join('');
            console.log('Clubs loaded successfully!');
        } else {
            console.log('No clubs found');
            if (container) container.innerHTML = '<p>No clubs available</p>';
        }
    } catch (error) {
        console.error('ERROR loading clubs:', error);
        console.error('Error details:', error.message);
    }
}

async function registerClub(event) {
    event.preventDefault();
    console.log('Attempting to register club...');

    const formData = {
        club_name: document.getElementById('clubName').value,
        club_category: document.getElementById('clubCategory').value,
        description: document.getElementById('description').value,
        advisor_name: document.getElementById('advisorName').value
    };

    console.log('Form data:', formData);

    try {
        const { ok, json: result } = await fetchJson(API_URL + '/clubs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        console.log('Response ok:', ok, 'Result:', result);

        if (result && result.success) {
            showAlert('Club registered successfully', 'success');
            const f = document.getElementById('clubForm');
            if (f) f.reset();
            setTimeout(() => window.location.href = 'view-report.html', 1500);
        } else {
            showAlert('Failed: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('ERROR:', error);
        showAlert('Failed to register club', 'error');
    }
}

async function registerMember(event) {
    event.preventDefault();
    console.log('Attempting to register member...');

    const formData = {
        student_id: document.getElementById('studentId').value,
        full_name: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        club_id: document.getElementById('clubSelect').value,
        membership_type: document.getElementById('membershipType').value
    };

    console.log('Form data:', formData);

    try {
        const { ok, json: result } = await fetchJson(API_URL + '/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        console.log('Response ok:', ok, 'Result:', result);

        if (result && result.success) {
            showAlert('Member registered successfully', 'success');
            const f = document.getElementById('memberForm');
            if (f) f.reset();
            setTimeout(() => window.location.href = 'view-report.html', 1500);
        } else {
            showAlert('Failed: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('ERROR:', error);
        showAlert('Failed to register member', 'error');
    }
}

async function loadClubsForSelect() {
    console.log('Loading clubs for select dropdown...');
    try {
        const { json: result } = await fetchJson(API_URL + '/clubs');
        console.log('Clubs for select:', result);

        const select = document.getElementById('clubSelect');
        if (select && result && result.success && result.data.length > 0) {
            select.innerHTML = '<option value="">Select a Club</option>' +
                result.data.map(club => `<option value="${club.club_id}">${escapeHtml(club.club_name)}</option>`).join('');
            console.log('Dropdown populated with', result.data.length, 'clubs');
        } else {
            console.log('No clubs to populate dropdown');
        }
    } catch (error) {
        console.error('ERROR:', error);
    }
}

// ---------- Reports loading + rendering with search + edit injection ----------

function createOrGetSearchInput(tableId, placeholder) {
    // If the page already has an input with id `${tableId}-search`, use it; otherwise create one and insert above table
    const existing = document.getElementById(`${tableId}-search`);
    if (existing) return existing;

    const table = document.getElementById(tableId);
    if (!table) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'table-search-wrapper';
    const input = document.createElement('input');
    input.type = 'search';
    input.id = `${tableId}-search`;
    input.placeholder = placeholder || 'Search...';
    input.className = 'table-search-input';
    wrapper.appendChild(input);
    table.parentNode.insertBefore(wrapper, table);
    return input;
}

function renderClubsReport(data, filterText = '') {
    lastClubsData = Array.isArray(data) ? data : [];
    const tbody = document.getElementById('clubsTableBody');
    if (!tbody) return;
    filterText = (filterText || '').toLowerCase().trim();
    const filtered = lastClubsData.filter(club => {
        if (!filterText) return true;
        return (club.club_name || '').toLowerCase().includes(filterText)
            || (club.club_category || '').toLowerCase().includes(filterText)
            || (club.description || '').toLowerCase().includes(filterText)
            || (club.advisor_name || '').toLowerCase().includes(filterText)
            || String(club.club_id).toLowerCase().includes(filterText);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No clubs found</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(club => `
        <tr data-club-id="${club.club_id}">
            <td>${escapeHtml(club.club_name)}</td>
            <td>${escapeHtml(club.club_category)}</td>
            <td>${escapeHtml(club.description || 'N/A')}</td>
            <td>${escapeHtml(club.advisor_name || 'N/A')}</td>
            <td>
                <button class="btn-edit" data-type="club" data-id="${club.club_id}" onclick="editClubPrompt(${club.club_id})">Edit</button>
                <button class="btn-delete" onclick="deleteClub(${club.club_id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderMembersReport(data, filterText = '') {
    lastMembersData = Array.isArray(data) ? data : [];
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;
    filterText = (filterText || '').toLowerCase().trim();

    const filtered = lastMembersData.filter(member => {
        if (!filterText) return true;
        return (member.student_id || '').toLowerCase().includes(filterText)
            || (member.full_name || '').toLowerCase().includes(filterText)
            || (member.email || '').toLowerCase().includes(filterText)
            || (member.club_name || '').toLowerCase().includes(filterText)
            || (member.membership_type || '').toLowerCase().includes(filterText)
            || String(member.member_id).toLowerCase().includes(filterText);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No members found</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(member => `
        <tr data-member-id="${member.member_id}">
            <td>${escapeHtml(member.student_id)}</td>
            <td>${escapeHtml(member.full_name)}</td>
            <td>${escapeHtml(member.email)}</td>
            <td>${escapeHtml(member.club_name || 'N/A')}</td>
            <td>${escapeHtml(member.membership_type)}</td>
            <td>
                <button class="btn-edit" data-type="member" data-id="${member.member_id}" onclick="editMemberPrompt(${member.member_id})">Edit</button>
                <button class="btn-delete" onclick="deleteMember(${member.member_id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function loadClubsReport() {
    console.log('Loading clubs report...');
    try {
        const { json: result } = await fetchJson(API_URL + '/clubs');
        console.log('Clubs report:', result);

        if (result && result.success && Array.isArray(result.data)) {
            renderClubsReport(result.data);
            // ensure search input exists and wired
            const search = createOrGetSearchInput('clubsTable', 'Search clubs...');
            if (search) {
                search.oninput = (e) => renderClubsReport(result.data, e.target.value);
            }
        } else {
            console.warn('No clubs data or success false', result);
            renderClubsReport([]);
        }
    } catch (error) {
        console.error('ERROR:', error);
    }
}

async function loadMembersReport() {
    console.log('Loading members report...');
    try {
        const { json: result } = await fetchJson(API_URL + '/members');
        console.log('Members report:', result);

        if (result && result.success && Array.isArray(result.data)) {
            renderMembersReport(result.data);
            const search = createOrGetSearchInput('membersTable', 'Search members...');
            if (search) {
                search.oninput = (e) => renderMembersReport(result.data, e.target.value);
            }
        } else {
            console.warn('No members data or success false', result);
            renderMembersReport([]);
        }
    } catch (error) {
        console.error('ERROR:', error);
    }
}

// ---------- Delete functions (kept, but now reloads table after success) ----------

async function deleteClub(id) {
    if (!confirm('Delete this club?')) return;
    console.log('Deleting club:', id);
    try {
        const { ok, json: result } = await fetchJson(API_URL + '/clubs/' + id, { method: 'DELETE' });
        console.log('Delete result:', result);
        if (result && result.success) {
            showAlert('Club deleted', 'success');
        } else {
            showAlert('Delete failed: ' + (result.error || 'Unknown'), 'error');
        }
        await loadClubsReport();
        await loadMembersReport(); // update member table (in case of cascade)
    } catch (error) {
        console.error('ERROR:', error);
    }
}

async function deleteMember(id) {
    if (!confirm('Delete this member?')) return;
    console.log('Deleting member:', id);
    try {
        const { ok, json: result } = await fetchJson(API_URL + '/members/' + id, { method: 'DELETE' });
        console.log('Delete result:', result);
        if (result && result.success) {
            showAlert('Member deleted', 'success');
        } else {
            showAlert('Delete failed: ' + (result.error || 'Unknown'), 'error');
        }
        await loadMembersReport();
    } catch (error) {
        console.error('ERROR:', error);
    }
}

// ---------- Edit (prompt-based) functions ----------
// These use PUT to /clubs/:id and /members/:id. If your PHP rejects non-POST, the helper will
// try a fallback POST with _method=PUT.

async function sendUpdate(url, bodyObj) {
    // Try PUT first
    const putAttempt = await fetchJson(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj)
    });
    if (putAttempt.ok || (putAttempt.json && putAttempt.json.success)) return putAttempt.json;
    // fallback to POST with _method override
    const fallbackBody = Object.assign({}, bodyObj, { _method: 'PUT' });
    const fallback = await fetchJson(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackBody)
    });
    return fallback.json;
}

window.editClubPrompt = async function (id) {
    // find current data from lastClubsData
    const club = lastClubsData.find(c => String(c.club_id) === String(id));
    if (!club) return alert('Club not found (try reload page)');

    const newName = prompt('Club name:', club.club_name || '');
    if (newName === null) return;
    const newCategory = prompt('Category:', club.club_category || '');
    if (newCategory === null) return;
    const newDesc = prompt('Description:', club.description || '');
    if (newDesc === null) return;
    const newAdvisor = prompt('Advisor name:', club.advisor_name || '');

    const payload = {
        club_name: newName,
        club_category: newCategory,
        description: newDesc,
        advisor_name: newAdvisor
    };

    console.log('Updating club', id, payload);
    const result = await sendUpdate(API_URL + '/clubs/' + id, payload);
    console.log('Update result:', result);
    if (result && result.success) {
        showAlert('Club updated', 'success');
    } else {
        showAlert('Failed to update club: ' + (result.error || JSON.stringify(result)), 'error');
    }
    await loadClubsReport();
};

window.editMemberPrompt = async function (id) {
    const member = lastMembersData.find(m => String(m.member_id) === String(id));
    if (!member) return alert('Member not found (try reload page)');

    const newStudentId = prompt('Student ID:', member.student_id || '');
    if (newStudentId === null) return;
    const newName = prompt('Full name:', member.full_name || '');
    if (newName === null) return;
    const newEmail = prompt('Email:', member.email || '');
    if (newEmail === null) return;
    const newPhone = prompt('Phone:', member.phone || '');
    if (newPhone === null) return;
    // For club selection, try to let user input club id; show available clubs list
    let clubListText = '';
    if (lastClubsData && lastClubsData.length > 0) {
        clubListText = '\nAvailable clubs:\n' + lastClubsData.map(c => `${c.club_id}: ${c.club_name}`).join('\n');
    }
    const newClubId = prompt('Club ID:' + clubListText, member.club_id || '');
    if (newClubId === null) return;
    const newType = prompt('Membership type:', member.membership_type || member.membership_type || '');
    if (newType === null) return;

    const payload = {
        student_id: newStudentId,
        full_name: newName,
        email: newEmail,
        phone: newPhone,
        club_id: newClubId,
        membership_type: newType
    };

    console.log('Updating member', id, payload);
    const result = await sendUpdate(API_URL + '/members/' + id, payload);
    console.log('Update result:', result);
    if (result && result.success) {
        showAlert('Member updated', 'success');
    } else {
        showAlert('Failed to update member: ' + (result.error || JSON.stringify(result)), 'error');
    }
    await loadMembersReport();
};

// ---------- small helpers ----------

function showAlert(message, type) {
    const alert = document.getElementById('alert');
    if (alert) {
        alert.textContent = message;
        alert.className = `alert alert-${type} show`;
        setTimeout(() => alert.classList.remove('show'), 3000);
    } else {
        console.log(type.toUpperCase(), message);
    }
}

function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/[&<>"']/g, function (m) {
        return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[m];
    });
}

// ---------- bootstrapping: page detection ----------

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== PAGE LOADED ===');
    console.log('Current page:', window.location.pathname);
    console.log('API URL configured as:', API_URL);

    const page = window.location.pathname.split('/').pop();
    console.log('Page name:', page);

    if (page === 'index.html' || page === '') {
        console.log('Loading home page data...');
        loadStatistics();
        loadClubs();
    } else if (page === 'member-registration.html') {
        console.log('Loading member registration page...');
        loadClubsForSelect();
    } else if (page === 'view-report.html') {
        console.log('Loading reports page...');
        // load both data sets and render; search inputs will be created automatically
        loadClubsReport();
        loadMembersReport();
        // also fetch clubs for local use when editing members (club list)
        (async () => {
            const { json: clubsRes } = await fetchJson(API_URL + '/clubs');
            if (clubsRes && clubsRes.success && Array.isArray(clubsRes.data)) {
                lastClubsData = clubsRes.data;
            }
        })();
    }
});

console.log('=== SCRIPT SETUP COMPLETE ===');
