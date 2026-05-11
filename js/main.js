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

        /* display_order=1(공개)만 필터 → 날짜 오름차순 → 최대 3개 */
        const visible = list
            .filter(item => item.display_order === 1)
            .sort((a, b) => {
                const da = a.seminar_date || '9999-99-99';
                const db = b.seminar_date || '9999-99-99';
                return da.localeCompare(db);
            })
            .slice(0, 3);

        if (!visible.length) {
            container.innerHTML = `
                <div class="seminar-empty">
                    <i class="far fa-calendar-times"></i>
                    등록된 설명회 일정이 없습니다.
                </div>`;
            return;
        }

        container.innerHTML = visible
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

/* ===== 상태 자동 결정 =====
 * 우선순위: 수동 마감 > 자동 접수중 > 자동 종료
 * - DB status = '마감' → 마감 (수동 우선)
 * - seminar_date가 오늘 이후 → 접수중 (자동)
 * - seminar_date가 오늘 이전 → 종료 (자동)
 */
function resolveStatus(item) {
    if (item.status === '마감') return '마감';
    if (item.seminar_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const seminarDate = new Date(item.seminar_date);
        seminarDate.setHours(0, 0, 0, 0);
        if (seminarDate < today) return '종료';
    }
    return '접수중';
}

/* ===== 세미나 카드 렌더 ===== */
function renderSeminarCard(item) {
    const status = resolveStatus(item);
    const dateText = formatSeminarDate(item.seminar_date);
    const timeText = item.seminar_time ? escapeHtml(item.seminar_time) : '';
    const locationName = escapeHtml((item.location || '').trim());
    const address = escapeHtml((item.description || '').trim());
    const capacityText = formatCapacity(item, status);
    const applyLink = escapeHtml(item.apply_link || '#');

    return `
        <article class="seminar-card status-${escapeHtml(status)}">
            ${getStatusBadge(status)}
            <div class="seminar-date-row">
                <span class="seminar-date-large">${dateText}</span>
                ${timeText ? `<span class="seminar-time-text">${timeText}</span>` : ''}
            </div>
            <div class="seminar-meta">
                ${locationName ? `
                    <div class="seminar-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <div class="seminar-meta-text">
                            <strong>${locationName}</strong>
                            ${address ? `<span class="seminar-address">${address}</span>` : ''}
                        </div>
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
        '마감':   '<span class="seminar-status-badge badge-closed">마감</span>',
        '종료':   '<span class="seminar-status-badge badge-ended">종료</span>',
    };
    return map[status] || `<span class="seminar-status-badge badge-open">${escapeHtml(status)}</span>`;
}

/* ===== 상태별 버튼 ===== */
function getStatusButton(status, applyLink) {
    switch (status) {
        case '접수중':
            return `<a href="${applyLink}" class="btn btn-primary seminar-btn">지금 신청하기</a>`;
        case '마감':
            return `<button class="btn btn-seminar-closed seminar-btn" disabled>마감</button>`;
        case '종료':
            return `<button class="btn btn-seminar-closed seminar-btn" disabled>종료</button>`;
        default:
            return `<a href="${applyLink}" class="btn btn-primary seminar-btn">지금 신청하기</a>`;
    }
}

/* ===== Format Helpers ===== */
function formatSeminarDate(dateStr) {
    if (!dateStr) return '일정 조율 중';
    const m = String(dateStr).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${parseInt(m[2], 10)}월 ${parseInt(m[3], 10)}일`;
    return escapeHtml(dateStr);
}

function formatCapacity(item, status) {
    if (status === '마감') return '접수 마감';
    if (status === '종료') return '';
    if (!item.seminar_date) return '사전 신청시 우선 안내';
    if (item.capacity > 0) return `잔여 좌석 ${item.capacity}석`;
    return '선착순 신청 마감';
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

/* ===== 30초 수익구조 진단 모달 ===== */
const diagAnswers = {};

function openModal() {
    Object.keys(diagAnswers).forEach(k => delete diagAnswers[k]);
    document.querySelectorAll('.modal-step').forEach(s => s.style.display = 'none');
    document.getElementById('step-0').style.display = 'block';
    document.querySelectorAll('.diag-option').forEach(o => o.classList.remove('selected'));
    [1, 2, 3].forEach(n => { const b = document.getElementById('next-' + n); if (b) b.disabled = true; });
    ['f-name', 'f-phone'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('f-time').value = '';
    document.getElementById('f-agree').checked = false;
    document.getElementById('diagModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('diagModal').classList.remove('open');
    document.body.style.overflow = '';
}

function handleOverlayClick(e) {
    if (e.target === document.getElementById('diagModal')) closeModal();
}

function goStep(n) {
    document.querySelectorAll('.modal-step').forEach(s => s.style.display = 'none');
    document.getElementById('step-' + n).style.display = 'block';
}

function selectOption(q, val, el) {
    el.closest('.diag-options').querySelectorAll('.diag-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    diagAnswers[q] = val;
    const nextBtn = document.getElementById('next-' + q.replace('q', ''));
    if (nextBtn) nextBtn.disabled = false;
}

function showResult() {
    document.querySelectorAll('.modal-step').forEach(s => s.style.display = 'none');
    document.getElementById('step-result').style.display = 'block';

    const q1 = diagAnswers.q1 || '';
    const q2 = diagAnswers.q2 || '';
    const q3 = diagAnswers.q3 || '';

    let badge, crisis, solution, value;

    const isCritical = (q3 === '전혀 아니다') || (q2 === '바로 흔들린다');
    const isMid      = (q3 === '애매하다')    || (q2 === '조금 영향 있다');

    if (isCritical) {
        badge    = '⚠ 지금 구조로는 매출이 멈출 수 있습니다';
        crisis   = '학생은 있는데 수입이 안 되는 구조입니다. 강사 한 명에 매출이 흔들리고, 초등에서 중등으로 이어지지 않는 상태입니다.';
        solution = '구조만 바꾸면 해결됩니다. 같은 공간에서 수익을 두 배로 늘릴 수 있는 구조가 있습니다.';
        value    = q1 === '50명 이상' ? '순이익 최대 +1,550만원 추가 가능' : '순이익 최대 +770만원 추가 가능';
    } else if (isMid) {
        badge    = '구조는 있지만 ⚡ 시스템화가 안 된 상태입니다';
        crisis   = '지금은 돌아가고 있지만, 강사 의존도가 높고 수입이 더 나올 수 있는 구조가 아닙니다.';
        solution = '강사 역할을 분리하고 과목 구조를 정비하면 같은 인원으로도 수입이 달라집니다.';
        value    = '강사 의존도 낮추고 이중 수입 구조 가능';
    } else if (q3 === '만족한다' && q2 === '거의 없다') {
        badge    = '현재 구조는 안정적입니다 → 확장이 관건입니다';
        crisis   = '지금은 잘 굴러가고 있습니다. 하지만 같은 공간에서 수입을 두 배로 키울 수 있는 구조가 없습니다.';
        solution = '초등 → 중등 → 고등 연결 구조로 확장하면 학생이 쌓이고 구조로 바뀝니다.';
        value    = '동일 공간에서 수입 구조 추가 가능';
    } else {
        badge    = '지금 구조를 점검할 필요가 있습니다';
        crisis   = '학생이 이어지고 있지만 구조적인 문제가 숨어 있을 수 있습니다.';
        solution = '초등부터 고등까지 끊기지 않는 구조로 바꾸면 학생이 쌓입니다.';
        value    = '구조 진단 후 맞춤 설계 제공';
    }

    document.getElementById('result-badge').textContent = badge;
    document.getElementById('result-crisis').textContent = crisis;
    document.getElementById('result-solution').textContent = solution;
    document.getElementById('result-value').textContent = value;
    document.getElementById('result-title').textContent = q1 ? q1 + ' 규모 진단 완료' : '진단 완료';
}

async function submitForm() {
    const name  = document.getElementById('f-name').value.trim();
    const phone = document.getElementById('f-phone').value.trim();
    const agree = document.getElementById('f-agree').checked;
    if (!name || !phone) { alert('이름과 연락처를 입력해주세요.'); return; }
    if (!agree)          { alert('개인정보 수집에 동의해주세요.'); return; }

    const btn = document.querySelector('#step-contact .btn-submit');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';
    }

    try {
        await ConsultationAPI.create({
            name,
            phone,
            preferred_time: document.getElementById('f-time').value || null,
            diag_q1: diagAnswers.q1 || null,
            diag_q2: diagAnswers.q2 || null,
            diag_q3: diagAnswers.q3 || null,
        });
    } catch (err) {
        console.error('상담 신청 저장 실패:', err);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '상담 신청 완료 <i class="fas fa-check"></i>';
        }
    }

    document.querySelectorAll('.modal-step').forEach(s => s.style.display = 'none');
    document.getElementById('step-done').style.display = 'block';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
