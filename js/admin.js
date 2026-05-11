/**
 * EK프로젝트 - Admin Page Script
 * - 비밀번호 기반 간이 인증 (localStorage)
 * - 세미나 일정 CRUD
 *
 * ⚠️ 보안 주의:
 * 현재는 프로토타입용으로 클라이언트 측에 비밀번호가 노출됩니다.
 * 실서비스로 전환 시 Supabase Auth 또는 별도 인증 서버 사용 필수.
 */

/* ============ 설정 ============ */
const ADMIN_PASSWORD = '0123456789';      // ⬅ 운영 시 반드시 변경
const AUTH_KEY = 'ek_admin_auth';
const AUTH_TTL_HOURS = 12;                 // 12시간 유지

/* ============ DOM ============ */
const $ = (sel) => document.querySelector(sel);

const loginScreen = $('#loginScreen');
const adminScreen = $('#adminScreen');
const loginForm = $('#loginForm');
const loginPassword = $('#loginPassword');
const loginError = $('#loginError');
const logoutBtn = $('#logoutBtn');
const newSeminarBtn = $('#newSeminarBtn');
const tableBody = $('#seminarTableBody');
const modal = $('#seminarModal');
const modalTitle = $('#modalTitle');
const modalCloseBtn = $('#modalCloseBtn');
const modalCancelBtn = $('#modalCancelBtn');
const seminarForm = $('#seminarForm');
const toast = $('#toast');

/* ============ Init ============ */
document.addEventListener('DOMContentLoaded', () => {
    if (isAuthenticated()) {
        showAdmin();
    } else {
        showLogin();
    }
    bindEvents();
});

function bindEvents() {
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    newSeminarBtn.addEventListener('click', () => openModal());
    modalCloseBtn.addEventListener('click', closeModal);
    modalCancelBtn.addEventListener('click', closeModal);
    modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    seminarForm.addEventListener('submit', handleSubmit);
    document.getElementById('refreshConsultBtn').addEventListener('click', loadConsultations);
}

/* ============ 인증 ============ */
function isAuthenticated() {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (!raw) return false;
        const obj = JSON.parse(raw);
        if (!obj.expires) return false;
        return Date.now() < obj.expires;
    } catch (e) {
        return false;
    }
}

function setAuthenticated() {
    const expires = Date.now() + AUTH_TTL_HOURS * 60 * 60 * 1000;
    localStorage.setItem(AUTH_KEY, JSON.stringify({ expires }));
}

function clearAuthenticated() {
    localStorage.removeItem(AUTH_KEY);
}

function handleLogin(e) {
    e.preventDefault();
    loginError.textContent = '';
    if (loginPassword.value === ADMIN_PASSWORD) {
        setAuthenticated();
        loginPassword.value = '';
        showAdmin();
    } else {
        loginError.textContent = '비밀번호가 일치하지 않습니다.';
        loginPassword.focus();
    }
}

function handleLogout() {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    clearAuthenticated();
    showLogin();
}

function showLogin() {
    loginScreen.style.display = 'flex';
    adminScreen.style.display = 'none';
    setTimeout(() => loginPassword?.focus(), 50);
}

function showAdmin() {
    loginScreen.style.display = 'none';
    adminScreen.style.display = 'block';
    initTabs();
    loadList();
    checkConsultBadge();
}

/* ============ 목록 로드 ============ */
async function loadList() {
    tableBody.innerHTML = `
        <tr><td colspan="7" class="loading-row">
            <i class="fas fa-spinner fa-spin"></i> 불러오는 중...
        </td></tr>`;
    try {
        const list = await SeminarAPI.list();
        const sorted = list.sort((a, b) =>
            (a.seminar_date || '9999-99-99').localeCompare(b.seminar_date || '9999-99-99')
        );
        renderTable(sorted);
        renderStats(sorted);
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `
            <tr><td colspan="7" class="empty-row">
                목록을 불러오지 못했습니다.
            </td></tr>`;
        showToast('목록을 불러오지 못했습니다.', 'error');
    }
}

function renderTable(list) {
    if (!list.length) {
        tableBody.innerHTML = `
            <tr><td colspan="7" class="empty-row">
                <i class="far fa-calendar-times"></i>
                등록된 일정이 없습니다. 우측 상단의 "새 일정 등록" 버튼을 눌러 추가하세요.
            </td></tr>`;
        return;
    }
    /* 메인 페이지에 실제 노출될 항목 ID 집합 (공개 + 날짜순 상위 3개) */
    const mainIds = new Set(
        list
            .filter(x => x.display_order === 1)
            .sort((a, b) => (a.seminar_date || '9999-99-99').localeCompare(b.seminar_date || '9999-99-99'))
            .slice(0, 3)
            .map(x => x.id)
    );

    tableBody.innerHTML = list.map(item => {
        const status   = item.status || '접수중';
        const isPublic = item.display_order === 1;
        const isMain   = mainIds.has(item.id);
        const pubClass = isPublic ? 'pub-공개' : 'pub-비공개';
        const id       = escapeHtml(String(item.id));
        return `
            <tr class="${isMain ? 'row-main-exposed' : ''}">
                <td>
                    <select class="pub-select ${pubClass}" data-id="${id}">
                        <option value="1" ${isPublic  ? 'selected' : ''}>공개</option>
                        <option value="0" ${!isPublic ? 'selected' : ''}>비공개</option>
                    </select>
                </td>
                <td>
                    <strong>${escapeHtml(item.title || '')}</strong>
                </td>
                <td>${escapeHtml(item.seminar_date || '')}</td>
                <td>${escapeHtml(item.seminar_time || '')}</td>
                <td><span class="status-badge ${escapeHtml(status)}">${escapeHtml(status)}</span></td>
                <td>${item.capacity ?? '-'}</td>
                <td>
                    <div class="row-actions">
                        <button class="btn-edit" data-id="${id}">
                            <i class="fas fa-pen"></i> 수정
                        </button>
                        <button class="btn-delete" data-id="${id}">
                            <i class="fas fa-trash"></i> 삭제
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // 공개여부 즉시 변경
    tableBody.querySelectorAll('.pub-select').forEach(sel => {
        sel.addEventListener('change', async () => {
            const newOrder = Number(sel.value);
            sel.className = 'pub-select ' + (newOrder === 1 ? 'pub-공개' : 'pub-비공개');
            try {
                await SeminarAPI.update(sel.dataset.id, { display_order: newOrder });
                showToast('공개여부가 변경되었습니다.', 'success');
                const list = await SeminarAPI.list();
                renderStats(list);
            } catch (err) {
                showToast('변경에 실패했습니다.', 'error');
            }
        });
    });

    tableBody.querySelectorAll('.btn-edit').forEach(b => {
        b.addEventListener('click', () => openModal(b.dataset.id));
    });
    tableBody.querySelectorAll('.btn-delete').forEach(b => {
        b.addEventListener('click', () => handleDelete(b.dataset.id));
    });
}

function renderStats(list) {
    const total = list.length;
    const pubCount = list.filter(x => x.display_order === 1).length;
    const hidCount = list.filter(x => x.display_order !== 1).length;
    const closed = list.filter(x => x.status === '마감').length;
    $('#statTotal').textContent = total;
    $('#statOpen').textContent = pubCount;
    $('#statUpcoming').textContent = hidCount;
    $('#statClosed').textContent = closed;
}

/* ============ 모달 (등록/수정) ============ */
async function openModal(id = null) {
    seminarForm.reset();
    $('#formId').value = '';

    if (id) {
        modalTitle.textContent = '일정 수정';
        try {
            const item = await SeminarAPI.get(id);
            $('#formId').value = item.id;
            $('#formTitle').value = item.title || '';
            $('#formDate').value = item.seminar_date || '';
            $('#formTime').value = (item.seminar_time || '').replace('~', '');
            $('#formLocation').value = item.location || '';
            $('#formCapacity').value = item.capacity ?? 0;
            $('#formOrder').value = item.display_order === 0 ? '0' : '1';
            $('#formStatus').value = item.status === '마감' ? '마감' : '접수중';
            $('#formDetailLink').value = item.detail_link || '#';
            $('#formApplyLink').value = item.apply_link || '#';
            $('#formDescription').value = item.description || '';
        } catch (err) {
            showToast('일정 정보를 불러오지 못했습니다.', 'error');
            return;
        }
    } else {
        modalTitle.textContent = '새 일정 등록';
        $('#formStatus').value = '접수중';
        $('#formOrder').value = '1';
        $('#formCapacity').value = '0';
        $('#formDetailLink').value = '#';
        $('#formApplyLink').value = '#';
    }

    modal.style.display = 'flex';
    setTimeout(() => $('#formTitle').focus(), 50);
}

function closeModal() {
    modal.style.display = 'none';
}

async function handleSubmit(e) {
    e.preventDefault();
    const id = $('#formId').value;

    const data = {
        title: $('#formTitle').value.trim(),
        seminar_date: $('#formDate').value,
        seminar_time: $('#formTime').value ? $('#formTime').value + '~' : '',
        location: $('#formLocation').value.trim(),
        capacity: Number($('#formCapacity').value) || 0,
        display_order: Number($('#formOrder').value),
        status: $('#formStatus').value,
        detail_link: $('#formDetailLink').value.trim() || '#',
        apply_link: $('#formApplyLink').value.trim() || '#',
        description: $('#formDescription').value.trim()
    };

    if (!data.title || !data.seminar_date) {
        showToast('제목과 날짜는 필수입니다.', 'error');
        return;
    }

    const saveBtn = $('#modalSaveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';

    try {
        if (id) {
            await SeminarAPI.update(id, data);
            showToast('수정되었습니다.', 'success');
        } else {
            await SeminarAPI.create(data);
            showToast('등록되었습니다.', 'success');
        }
        closeModal();
        await loadList();
    } catch (err) {
        console.error(err);
        showToast('저장에 실패했습니다.', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '저장';
    }
}

/* ============ 삭제 ============ */
async function handleDelete(id) {
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
        await SeminarAPI.remove(id);
        showToast('삭제되었습니다.', 'success');
        await loadList();
    } catch (err) {
        console.error(err);
        showToast('삭제에 실패했습니다.', 'error');
    }
}

/* ============ Helpers ============ */
let toastTimer = null;
function showToast(msg, type = '') {
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ============ 탭 ============ */
function initTabs() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t === tab));
            const isSeminar = tab.dataset.tab === 'seminar';
            document.getElementById('seminarSection').style.display      = isSeminar ? 'block' : 'none';
            document.getElementById('consultationSection').style.display = isSeminar ? 'none'  : 'block';
            if (!isSeminar) loadConsultations();
        });
    });
}

/* ============ 상담 신청 내역 ============ */
async function loadConsultations() {
    const tbody = document.getElementById('consultTableBody');
    tbody.innerHTML = `<tr><td colspan="7" class="loading-row">
        <i class="fas fa-spinner fa-spin"></i> 불러오는 중...</td></tr>`;
    try {
        const list = await ConsultationAPI.list({ sort: 'created_at', ascending: false });
        renderConsultTable(list);
        renderConsultStats(list);
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="7" class="empty-row">목록을 불러오지 못했습니다.</td></tr>`;
        showToast('목록을 불러오지 못했습니다.', 'error');
    }
}

function renderConsultTable(list) {
    const tbody = document.getElementById('consultTableBody');
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-row">
            <i class="far fa-inbox"></i> 접수된 상담 신청이 없습니다.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(item => {
        const dt = item.created_at
            ? new Date(item.created_at).toLocaleString('ko-KR', {
                month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
              })
            : '-';
        const diagParts  = [item.diag_q1, item.diag_q2, item.diag_q3].filter(Boolean);
        const diagShort  = diagParts.join(' · ') || '-';
        const diagTitle  = `규모: ${item.diag_q1 || '-'}\n강사 의존도: ${item.diag_q2 || '-'}\n학년 연결도: ${item.diag_q3 || '-'}`;
        const status     = item.status || '미확인';
        const id         = escapeHtml(String(item.id));

        return `
            <tr>
                <td style="white-space:nowrap;font-size:13px;color:var(--color-text-sub)">${escapeHtml(dt)}</td>
                <td><strong>${escapeHtml(item.name)}</strong></td>
                <td><a href="tel:${escapeHtml(item.phone)}" class="consult-phone">${escapeHtml(item.phone)}</a></td>
                <td style="font-size:13px">${escapeHtml(item.preferred_time || '-')}</td>
                <td><span class="consult-diag" title="${escapeHtml(diagTitle)}">${escapeHtml(diagShort)}</span></td>
                <td>
                    <select class="consult-status-select ${escapeHtml(status)}" data-id="${id}">
                        <option value="미확인"  ${status === '미확인'  ? 'selected' : ''}>미확인</option>
                        <option value="연락완료" ${status === '연락완료' ? 'selected' : ''}>연락완료</option>
                        <option value="상담완료" ${status === '상담완료' ? 'selected' : ''}>상담완료</option>
                        <option value="보류"    ${status === '보류'    ? 'selected' : ''}>보류</option>
                    </select>
                </td>
                <td>
                    <div class="row-actions">
                        <button class="btn-delete" data-id="${id}" title="삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');

    /* 상태 변경 */
    tbody.querySelectorAll('.consult-status-select').forEach(sel => {
        sel.addEventListener('change', async () => {
            const newStatus = sel.value;
            sel.className = 'consult-status-select ' + newStatus;
            try {
                await ConsultationAPI.update(sel.dataset.id, { status: newStatus });
                showToast('상태가 변경되었습니다.', 'success');
                const list = await ConsultationAPI.list({ sort: 'created_at', ascending: false });
                renderConsultStats(list);
            } catch (err) {
                showToast('상태 변경에 실패했습니다.', 'error');
            }
        });
    });

    /* 삭제 */
    tbody.querySelectorAll('.btn-delete').forEach(b => {
        b.addEventListener('click', async () => {
            if (!confirm('이 신청 내역을 삭제하시겠습니까?')) return;
            try {
                await ConsultationAPI.remove(b.dataset.id);
                showToast('삭제되었습니다.', 'success');
                loadConsultations();
            } catch (err) {
                showToast('삭제에 실패했습니다.', 'error');
            }
        });
    });
}

function renderConsultStats(list) {
    document.getElementById('cStatTotal').textContent     = list.length;
    document.getElementById('cStatNew').textContent       = list.filter(x => x.status === '미확인').length;
    document.getElementById('cStatContacted').textContent = list.filter(x => x.status === '연락완료').length;
    document.getElementById('cStatDone').textContent      = list.filter(x => x.status === '상담완료').length;

    const newCount = list.filter(x => x.status === '미확인').length;
    const badge = document.getElementById('tabBadge');
    if (badge) {
        badge.textContent      = newCount;
        badge.style.display    = newCount > 0 ? 'inline-flex' : 'none';
    }
}

async function checkConsultBadge() {
    try {
        const list = await ConsultationAPI.list({ sort: 'created_at', ascending: false });
        const newCount = list.filter(x => x.status === '미확인').length;
        const badge = document.getElementById('tabBadge');
        if (badge && newCount > 0) {
            badge.textContent   = newCount;
            badge.style.display = 'inline-flex';
        }
    } catch (e) { /* 조용히 무시 */ }
}
