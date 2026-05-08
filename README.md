# EK프로젝트 (EK Project) 가맹 안내 홈페이지

영어·국어 통합 학원 가맹 사업 소개 및 설명회 일정을 안내하는 원페이지 랜딩 사이트.
관리자 페이지를 통해 설명회 일정을 등록/수정/삭제할 수 있습니다.

---

## 🎯 프로젝트 목표
- 가맹 후보 원장님께 EK프로젝트의 운영 구조와 수익 구조를 명확히 전달
- 메인 페이지에 최신 설명회 일정 3개를 자동 노출 (상태별 UI 차별화)
- 관리자가 설명회 일정을 직접 등록/관리 (게시판 형태)
- GitHub + Supabase + Vercel 기반 배포 구조

---

## 🚀 배포 구조

| 서비스 | 역할 | 연결 상태 |
|---|---|---|
| **GitHub** | 코드 저장소 (`etcflower/ekproject`) | ✅ 연결 완료 |
| **Supabase** | 세미나 일정 DB | ✅ 연결 완료 |
| **Vercel** | 정적 호스팅 + 도메인 | 연결 필요 |

### Supabase 정보
- **Project URL**: `https://pbiyyrrujhxnxwyujssi.supabase.co`
- **Table**: `seminars`
- **RLS**: anon 읽기/쓰기 모두 허용 (세미나 일정은 공개 데이터)

---

## 📐 페이지 섹션 구조 (10개 영역)

| # | 영역 | 섹션 ID | 설명 |
|---|---|---|---|
| **01** | HEADER | `#header` | 보라/네이비 + 로고 + 5개 메뉴 + 카카오 상담 + 설명회 신청 버튼 |
| **02** | HERO | `#hero` | 학생 이미지 + 우측 텍스트 "같은 공간에서 / 수익은 두배로" + 진단 CTA (전체 너비 버튼) |
| **03** | PRS (다크) | - | 문제 / 결과 / 해결 3블록 (좌측 텍스트 + 우측 이미지 교차) |
| **04** | ABOUT EK | `#about` | 흰 배경 - 3아이콘카드(56×56) + 01/02/03 카드 + 영어/수학 비교표 |
| **05** | OPERATION | `#operation` | 3타입 강사 시스템 (ROLE 01/02/03) |
| **06** | REVENUE | `#revenue` | 탭 (초등 EK / 중고등 영어 / 중고등 국어) + 1SET/2SET 수익표 |
| **07** | SUPPORT | `#support` | STEP 01~04 4단계 운영 지원 카드 |
| **08** | SEMINAR | `#seminar` | 🔥 **Supabase 연동** - 설명회 일정 카드 3개 (상태별 UI) |
| **09** | PROCESS | `#process` | 6단계 가맹 절차 + 다크 CTA 박스 (가맹비/로열티/연락처) |
| **10** | FOOTER | - | 실제 회사 정보 + 문의하기(카카오) + 관리자 링크 |

---

## ✅ 현재 완료된 기능

### 1. 메인 페이지 (`index.html`)
- 10개 섹션 시안에 맞춘 구현
- 헤더 메뉴 클릭 시 해당 섹션으로 부드러운 스크롤
- 현재 보고 있는 섹션의 메뉴 자동 강조
- **REVENUE 섹션 탭 동작** (초등 EK / 중고등 영어 / 중고등 국어 전환)
- **세미나 카드** Supabase DB에서 자동 로드, 상태별 배지/버튼 UI 차별화
- Hero CTA 버튼 전체 너비 적용
- 우측 하단 플로팅 카카오 상담 버튼 (반응형: PC=텍스트, 모바일=원형)
- 모바일 반응형 (햄버거 메뉴, 1024px / 768px 브레이크포인트)
- 카카오 채널 URL 연결 완료 (`http://pf.kakao.com/_MZTZX/chat`)

### 2. 관리자 페이지 (`admin.html`)
- 비밀번호 기반 간이 로그인 (12시간 유지)
- 통계 카드 (전체/접수중/예정/마감 종료)
- 세미나 일정 목록 테이블
- 새 일정 등록 / 수정 / 삭제 (모달)
- `display_order` 중복 입력 방지 검증
- Toast 알림

### 3. 데이터 레이어 (`js/api.js`)
- `SupabaseAdapter` **활성화 완료** (Supabase 실데이터 연동)
- `TableApiAdapter` 코드 유지 (참고용, 현재 미사용)

### 4. SEO (`index.html` `<head>`)
- `<title>`, `<meta description>`, `<meta keywords>`, `<meta author>`, `<meta robots>`
- `<link rel="canonical">`
- Open Graph (카카오/페이스북 SNS 공유 미리보기)
- Twitter Card
- JSON-LD 구조화 데이터 (`LocalBusiness` 스키마)
- `robots.txt` — 관리자 페이지 크롤링 차단
- `sitemap.xml` — 메인 페이지 색인 안내

### 5. 파비콘
- `favicon.ico` 루트 경로 배치 (`/favicon.ico`)
- `shortcut icon` + `icon` 태그 이중 적용 (구형 브라우저 호환)

---

## 📊 데이터 모델

### 테이블: `seminars` (Supabase)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | uuid | 고유 ID (자동 생성) |
| title | text | 세미나 제목 |
| description | text | 상세 설명 |
| seminar_date | text | 날짜 (YYYY-MM-DD, 빈 값이면 "일정 조율 중" 표시) |
| seminar_time | text | 시간 (예: "오후 2시~4시") |
| location | text | 장소 (\n 줄바꿈 가능) |
| capacity | integer | 잔여 좌석 수 |
| status | text | 상태 (예정/접수중/마감/종료) |
| detail_link | text | 자세히보기 링크 |
| apply_link | text | 신청 링크 |
| display_order | integer | 표시 순서 (낮을수록 먼저, 메인엔 상위 3개, 중복 불가) |
| created_at | timestamptz | 등록일시 (자동) |

### 세미나 카드 상태별 UI
| 상태 | 배지 색상 | 버튼 | 카드 |
|---|---|---|---|
| **접수중** | 🟠 주황 | 주황 "지금 신청하기 →" | 일반 (hover=강조) |
| **예정** | 🔵 네이비 | 네이비 "신청 예정" (비활성) | 일반 |
| **마감** | ⬜ 회색 | 회색 "마감" (비활성) | 투명도 72% |
| **종료** | ⬜ 회색 | 회색 "종료" (비활성) | 투명도 50% + 회색조 |

### 메인 페이지 카드 표시 규칙
- `display_order` 오름차순으로 **상위 3개** 자동 노출 (개수 제한 없이 등록 가능)
- 3개 카드 모두 **동일한 기본 스타일**, hover 시 주황 강조 (3개 모두 동일 적용)
- `display_order`는 중복 불가 (관리자 저장 시 자동 검증)
- `seminar_date`가 비어있으면 "일정 조율 중" 표시
- `capacity`가 0이면 "사전 신청시 우선 안내" 표시

---

## 📁 파일 구조

```
index.html              # 메인 페이지 (10개 섹션)
admin.html              # 관리자 페이지
favicon.ico             # 파비콘 (루트 배치 필수)
robots.txt              # 검색 크롤러 설정
sitemap.xml             # 사이트맵
README.md               # 이 문서

css/
  ├── style.css         # 메인 스타일 (10섹션 + 플로팅 버튼)
  └── admin.css         # 관리자 페이지 스타일

js/
  ├── api.js            # 데이터 접근 추상화 (Supabase 연동)
  ├── main.js           # 메인 페이지 + 탭 + 세미나 렌더링
  └── admin.js          # 관리자 페이지 CRUD

images/                 # 이미지 자산
  ├── logo.png
  ├── favicon.ico       # (images/ 내 원본, 루트에도 복사본 필요)
  ├── og-image.jpg      # SNS 공유 이미지 (1200×630px 권장)
  ├── hero.jpg
  ├── about-meeting.jpg
  ├── profit-bg.jpg
  ├── franchise-bg.jpg
  ├── num-01.png ~ num-03.png
  └── icon-*.png (8개 아이콘, 56×56px 표시)
```

---

## 🎨 디자인 토큰

| 요소 | 값 |
|---|---|
| 메인 컬러 (주황) | `#FF6B1A` |
| 헤더 보라/네이비 | `#1F0F72` |
| 다크 섹션 BG | `#22262B` |
| 카카오 노랑 | `#FEE500` |
| 폰트 | **Pretendard** (200~900, CDN) |
| 아이콘 | Font Awesome 6.4 |

### Pretendard 폰트 굵기 적용 기준
| 용도 | weight |
|---|---|
| 히어로/섹션 제목 | 900 |
| 카드 제목 | 800 |
| 버튼 | 700 |
| 본문 강조 | 600 |
| 일반 본문 | 300 |
| 히어로 조사(얇게) | 200 |

---

## 🔮 추후 작업 / 미구현

### 🔗 외부 링크
- [ ] "내 학원 수익 구조 진단받기" 링크 (HERO)
- [ ] "30초 수익구조 진단 시작하기" 링크 (PRS / PROCESS)
- [ ] 푸터 개인정보처리방침 / 이용약관

### 🌐 배포
- [ ] Vercel 프로젝트 연결 (GitHub `etcflower/ekproject` → Vercel)
- [ ] 커스텀 도메인 `ekproject.co.kr` DNS 설정
- [ ] `canonical`, `og:url`, `sitemap.xml` URL 실 도메인으로 확인
- [ ] `og:image` (`images/og-image.jpg`) 1200×630px 이미지 준비

### 🔐 인증 강화
- [ ] 현재: 클라이언트 측 비밀번호 비교 (프로토타입)
- [ ] 추후: Supabase Auth 이메일/비밀번호 로그인으로 교체

### 📝 콘텐츠
- [ ] REVENUE 섹션 중고등 영어/국어 탭 실제 운영 수치 확정
- [ ] PRS 다크 섹션 본문 카피 다듬기
- [ ] PROCESS 섹션 CTA 연락처 `010-4798-9421` → 대표번호 `043-716-1008` 검토

---

## 🏢 사업자 정보

| 항목 | 내용 |
|---|---|
| 상호 | EK 프로젝트 사업본부 |
| 대표 | 박신영 |
| 사업자등록번호 | 757-10-03188 |
| 주소 | 충북 청주시 서원구 복대로 7, 703호 (개신동, 대상마스터빌딩) |
| TEL | 043-716-1008 |
| 카카오 채널 | http://pf.kakao.com/_MZTZX/chat |
| 도메인 | ekproject.co.kr |

---

## 🛠 로컬 테스트
```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

> ⚠ Supabase 연동 후에는 어디서든 세미나 카드가 동작합니다.
> 로컬에서도 Supabase 연결이 유지되면 정상 동작합니다.

---

## 📞 관리자 사용 가이드

1. 메인 페이지 푸터의 "관리자" 또는 `/admin.html` 직접 접속
2. 비밀번호 입력
3. 우측 상단 "새 일정 등록"으로 추가
4. **표시 순서가 낮은 3개 일정**이 메인 페이지에 자동 노출됨
5. 작업 완료 후 우측 상단 "로그아웃"

### 세미나 카드 작성 팁
- 날짜 미정 일정은 `seminar_date`를 비워두면 "일정 조율 중" 자동 표시
- 장소에 줄바꿈이 필요하면 `\n` 사용
- `display_order` 숫자가 낮을수록 메인 페이지 우선 노출 (중복 불가, 저장 시 자동 검증)
- 상태에 따라 버튼/배지 자동 변경 (접수중=주황, 예정=네이비, 마감/종료=회색 비활성)

### 관리자 비밀번호
- **현재 비밀번호**: `0123456789`
- 변경 위치: `js/admin.js` 상단 `ADMIN_PASSWORD` 상수

---

## 📋 변경 이력

### v2.0 (2026-05-08)
- **Supabase 연동 완료** (`SupabaseAdapter` 활성화, CDN 추가)
- **세미나 카드 UI 개선**: 3개 균등 스타일, hover 강조, 상태별 배지/버튼
- **display_order 중복 방지** 검증 추가 (관리자)
- **플로팅 카카오 상담 버튼** 추가 (우측 하단, 반응형)
- **SEO 완비**: OG/Twitter Card/JSON-LD/canonical/robots.txt/sitemap.xml
- **파비콘** 루트 경로 배치 및 타입 수정
- **Pretendard 폰트** 전면 교체 (Noto Sans KR → Pretendard, 굵기 체계 적용)
- **About 섹션 아이콘** 56×56px 통일
- **Hero CTA 버튼** 전체 너비 적용
- **카카오 채널 URL** 전체 연결
- **푸터 실데이터** 입력 (대표명/사업자번호/주소/전화)
- **GitHub 연결** (`etcflower/ekproject`)
- **관리자 비밀번호** 변경

### v1.0 (초기)
- 10개 섹션 원페이지 구현
- 관리자 CRUD 기능
- 내장 RESTful Table API 연동
