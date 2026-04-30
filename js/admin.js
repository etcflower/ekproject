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
const ADMIN_PASSWORD = 'ekproject2026';   // ⬅ 운영 시 반드시 변경
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
    loadList();
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
            (a.display_order ?? 9999) - (b.display_order ?? 9999)
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
    tableBody.innerHTML = list.map(item => {
        const status = item.status || '예정';
        return `
            <tr>
                <td>${item.display_order ?? '-'}</td>
                <td><strong>${escapeHtml(item.title || '')}</strong></td>
                <td>${escapeHtml(item.seminar_date || '')}</td>
                <td>${escapeHtml(item.seminar_time || '')}</td>
                <td><span class="status-badge ${escapeHtml(status)}">${escapeHtml(status)}</span></td>
                <td>${item.capacity ?? '-'}</td>
                <td>
                    <div class="row-actions">
                        <button class="btn-edit" data-id="${escapeHtml(item.id)}">
                            <i class="fas fa-pen"></i> 수정
                        </button>
                        <button class="btn-delete" data-id="${escapeHtml(item.id)}">
                            <i class="fas fa-trash"></i> 삭제
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // 이벤트 바인딩
    tableBody.querySelectorAll('.btn-edit').forEach(b => {
        b.addEventListener('click', () => openModal(b.dataset.id));
    });
    tableBody.querySelectorAll('.btn-delete').forEach(b => {
        b.addEventListener('click', () => handleDelete(b.dataset.id));
    });
}

function renderStats(list) {
    const total = list.length;
    const open = list.filter(x => x.status === '접수중').length;
    const upcoming = list.filter(x => x.status === '예정').length;
    const closed = list.filter(x => x.status === '마감' || x.status === '종료').length;
    $('#statTotal').textContent = total;
    $('#statOpen').textContent = open;
    $('#statUpcoming').textContent = upcoming;
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
            $('#formTime').value = item.seminar_time || '';
            $('#formLocation').value = item.location || '';
            $('#formCapacity').value = item.capacity ?? '';
            $('#formOrder').value = item.display_order ?? '';
            $('#formStatus').value = item.status || '예정';
            $('#formDetailLink').value = item.detail_link || '#';
            $('#formApplyLink').value = item.apply_link || '#';
            $('#formDescription').value = item.description || '';
        } catch (err) {
            showToast('일정 정보를 불러오지 못했습니다.', 'error');
            return;
        }
    } else {
        modalTitle.textContent = '새 일정 등록';
        $('#formStatus').value = '예정';
        $('#formDetailLink').value = '#';
        $('#formApplyLink').value = '#';
        // 다음 표시 순서 자동 추천
        $('#formOrder').value = await suggestNextOrder();
    }

    modal.style.display = 'flex';
    setTimeout(() => $('#formTitle').focus(), 50);
}

async function suggestNextOrder() {
    try {
        const list = await SeminarAPI.list();
        const max = list.reduce((m, x) =>
            Math.max(m, x.display_order ?? 0), 0);
        return max + 1;
    } catch {
        return 1;
    }
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
        seminar_time: $('#formTime').value,
        location: $('#formLocation').value.trim(),
        capacity: $('#formCapacity').value ? Number($('#formCapacity').value) : 0,
        display_order: $('#formOrder').value ? Number($('#formOrder').value) : 9999,
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
