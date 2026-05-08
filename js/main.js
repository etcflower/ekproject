/**
 * EK프로젝트 - Main Page Script
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initSmoothScroll();
    initActiveNav();
    initRevenueTabs();
    loadSeminars();
});

/* ===== 모바일 메뉴 토글 ===== */
function initMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const nav = document.getElementById('mainNav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        nav.classList.toggle('active');
    });
    nav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => nav.classList.remove('active'));
    });
}

/* ===== 스무스 스크롤 (헤더 보정) ===== */
function initSmoothScroll() {
    const HEADER_OFFSET = 72;
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#' || href.length < 2) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
}

/* ===== 메뉴 활성 강조 ===== */
function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === '#' + id);
                });
            }
        });
    }, { rootMargin: '-30% 0px -60% 0px' });

    sections.forEach(s => observer.observe(s));
}

/* ===== REVENUE 탭 ===== */
function initRevenueTabs() {
    const tabs = document.querySelectorAll('.revenue-tab');
    const panes = document.querySelectorAll('.revenue-pane');
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.toggle('active', t === tab));
            panes.forEach(p => p.classList.toggle('active', p.dataset.pane === target));
        });
    });
}

/* ===== 세미나 카드 로드 ===== */
async function loadSeminars() {
    const container = document.getElementById('seminarGrid');
    if (!container) return;

    try {
        const list = await SeminarAPI.list();
        /* display_order 1→2→3 순 정렬, 최대 3개 */
        const sorted = list
            .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
            .slice(0, 3);

        if (!sorted.length) {
            container.innerHTML = `
                <div class="seminar-empty">
                    <i class="far fa-calendar-times"></i>
                    등록된 설명회 일정이 없습니다.
                </div>`;
            return;
        }

        /* 모든 카드 동일 기본 스타일 — hover 시 강조 효과는 CSS에서 처리 */
        container.innerHTML = sorted
            .map((item) => renderSeminarCard(item))
            .join('');
    } catch (err) {
        console.error('세미나 로드 실패:', err);
        container.innerHTML = `
            <div class="seminar-empty">
                일정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </div>`;
    }
}

/* ===== 세미나 카드 렌더 ===== */
function renderSeminarCard(item) {
    const status = item.status || '예정';
    const dateText = formatSeminarDate(item.seminar_date);
    const timeText = item.seminar_time ? escapeHtml(item.seminar_time) : '';
    const rawLocation = item.location || '';
    const capacityText = formatCapacity(item);
    const applyLink = escapeHtml(item.apply_link || '#');

    return `
        <article class="seminar-card status-${escapeHtml(status)}">
            ${getStatusBadge(status)}
            <div class="seminar-date-large">${dateText}</div>
            ${timeText ? `<div class="seminar-time-status">${timeText}</div>` : '<div class="seminar-time-status"></div>'}
            <div class="seminar-meta">
                ${rawLocation ? `
                    <div class="seminar-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${rawLocation.split('\n').map(l => escapeHtml(l)).join('<br>')}</span>
                    </div>
                ` : ''}
                ${capacityText ? `
                    <div class="seminar-meta-item">
                        <i class="fas fa-user-friends"></i>
                        <span>${capacityText}</span>
                    </div>
                ` : ''}
            </div>
            ${getStatusButton(status, applyLink)}
        </article>
    `;
}

/* ===== 상태별 배지 ===== */
function getStatusBadge(status) {
    const map = {
        '접수중': '<span class="seminar-status-badge badge-open">접수중</span>',
        '예정':   '<span class="seminar-status-badge badge-upcoming">예정</span>',
        '마감':   '<span class="seminar-status-badge badge-closed">마감</span>',
        '종료':   '<span class="seminar-status-badge badge-ended">종료</span>',
    };
    return map[status] || `<span class="seminar-status-badge badge-upcoming">${escapeHtml(status)}</span>`;
}

/* ===== 상태별 버튼 ===== */
function getStatusButton(status, applyLink) {
    switch (status) {
        case '접수중':
            return `<a href="${applyLink}" class="btn btn-primary seminar-btn">지금 신청하기 <i class="fas fa-chevron-right"></i></a>`;
        case '예정':
            return `<button class="btn btn-navy seminar-btn" disabled>신청 예정</button>`;
        case '마감':
            return `<button class="btn btn-seminar-closed seminar-btn" disabled>마감</button>`;
        case '종료':
            return `<button class="btn btn-seminar-closed seminar-btn" disabled>종료</button>`;
        default:
            return `<a href="${applyLink}" class="btn btn-navy seminar-btn">신청하기</a>`;
    }
}

/* ===== Format Helpers ===== */
function formatSeminarDate(dateStr) {
    if (!dateStr) return '일정 조율 중';
    const m = String(dateStr).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${parseInt(m[2], 10)}월 ${parseInt(m[3], 10)}일`;
    return escapeHtml(dateStr);
}

function formatCapacity(item) {
    if (item.status === '마감') return '접수가 마감되었습니다';
    if (item.status === '종료') return '종료된 일정입니다';
    if (!item.seminar_date) return '사전 신청시 우선 안내';
    if (item.capacity) return `잔여 좌석 ${item.capacity}석`;
    return '';
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
