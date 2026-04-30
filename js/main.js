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

        // 가운데(2번째) 카드는 강조(featured)
        container.innerHTML = sorted
            .map((item, idx) => renderSeminarCard(item, idx === 1 && sorted.length === 3))
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
function renderSeminarCard(item, featured = false) {
    const dateText = formatSeminarDate(item.seminar_date, item.status);
    const timeStatus = formatTimeStatus(item);
    const location = escapeHtml(item.location || '');
    const capacity = formatCapacity(item);
    const applyLink = item.apply_link || '#';

    const btnClass = featured ? 'btn btn-primary' : 'btn btn-navy';

    return `
        <article class="seminar-card${featured ? ' featured' : ''}">
            <div class="seminar-date-large">${dateText}</div>
            <div class="seminar-time-status">${timeStatus}</div>
            <div class="seminar-meta">
                ${location ? `
                    <div class="seminar-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${location.split('\n').map(l => escapeHtml(l)).join('<br>')}</span>
                    </div>
                ` : ''}
                ${capacity ? `
                    <div class="seminar-meta-item">
                        <i class="fas fa-user-friends"></i>
                        <span>${capacity}</span>
                    </div>
                ` : ''}
            </div>
            <a href="${applyLink}" class="${btnClass}">신청하기</a>
        </article>
    `;
}

/* ===== Format Helpers ===== */
function formatSeminarDate(dateStr, status) {
    if (!dateStr) {
        return status === '예정' ? '일정 조율 중' : escapeHtml(status || '');
    }
    // YYYY-MM-DD → "M월 D일" or "M월 중"
    const m = String(dateStr).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
        const month = parseInt(m[2], 10);
        const day = parseInt(m[3], 10);
        return `${month}월 ${day}일`;
    }
    return escapeHtml(dateStr);
}

function formatTimeStatus(item) {
    // 일정 미정인 경우
    if (!item.seminar_date) {
        return '날짜 확정 후 공지 예정';
    }
    const time = item.seminar_time ? escapeHtml(item.seminar_time) : '';
    const statusText = item.status ? `(${escapeHtml(item.status)})` : '';
    if (time) {
        return `${time} ${statusText}`.trim();
    }
    return statusText;
}

function formatCapacity(item) {
    if (item.status === '마감') return '마감되었습니다';
    if (item.status === '종료') return '종료된 일정입니다';
    if (!item.seminar_date) return '사전 신청시 우선 안내';
    if (item.capacity) return `잔여 좌석 ${item.capacity}석 (예정)`;
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
