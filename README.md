# EK프로젝트 (EK Project) 가맹 안내 홈페이지

영어·국어 통합 학원 가맹 사업 소개 및 설명회 일정을 안내하는 원페이지 랜딩 사이트.
관리자 페이지를 통해 설명회 일정을 등록/수정/삭제할 수 있습니다.

---

## 🎯 프로젝트 목표
- 가맹 후보 원장님께 EK프로젝트의 운영 구조와 수익 구조를 명확히 전달
- 메인 페이지에 최신 설명회 일정 3개를 자동 노출 (가운데 카드는 강조)
- 관리자가 설명회 일정을 직접 등록/관리 (게시판 형태)
- 향후 GitHub 호스팅 + Supabase DB 마이그레이션 대비 코드 구조

---

## 📐 페이지 섹션 구조 (10개 영역)

| # | 영역 | 섹션 ID | 설명 |
|---|---|---|---|
| **01** | HEADER | `#header` | 보라/네이비 + 로고 + 5개 메뉴 + 카카오 상담 + 설명회 신청 버튼 |
| **02** | HERO | `#hero` | 학생 이미지 + 우측 텍스트 "같은 공간에서 / 수익은 두배로" + 진단 CTA |
| **03** | PRS (다크) | - | 문제 / 결과 / 해결 3블록 (좌측 텍스트 + 우측 이미지 교차) |
| **04** | ABOUT EK | `#about` | 흰 배경 - 3아이콘카드 + 01/02/03 카드 + 영어/수학 비교표 |
| **05** | OPERATION | `#operation` | 3타입 강사 시스템 (ROLE 01/02/03) |
| **06** | REVENUE | `#revenue` | 탭 (초등 EK / 중고등 영어 / 중고등 국어) + 1SET/2SET 수익표 |
| **07** | SUPPORT | `#support` | STEP 01~04 4단계 운영 지원 카드 |
| **08** | SEMINAR | `#seminar` | 🔥 **DB 연동** - 설명회 일정 카드 3개 (가운데 강조) + 안내 박스 |
| **09** | PROCESS | `#process` | 6단계 가맹 절차 + 다크 CTA 박스 (가맹비/로열티/연락처) |
| **10** | FOOTER | - | 회사 정보 + 관리자 링크 |

---

## ✅ 현재 완료된 기능

### 1. 메인 페이지 (`index.html`)
- 10개 섹션 시안에 맞춘 구현
- 헤더 메뉴 클릭 시 해당 섹션으로 부드러운 스크롤
- 현재 보고 있는 섹션의 메뉴 자동 강조
- **REVENUE 섹션 탭 동작** (초등 EK / 중고등 영어 / 중고등 국어 전환)
- **세미나 카드** DB에서 자동 로드 + 가운데 카드 주황 강조
- 모바일 반응형 (햄버거 메뉴, 1024px / 768px 브레이크포인트)

### 2. 관리자 페이지 (`admin.html`)
- 비밀번호 기반 간이 로그인 (12시간 유지)
- 통계 카드 (전체/접수중/예정/마감 종료)
- 세미나 일정 목록 테이블
- 새 일정 등록 / 수정 / 삭제 (모달)
- Toast 알림

### 3. 데이터 추상화 레이어 (`js/api.js`)
- `TableApiAdapter` (현재 사용 - 내장 RESTful Table API)
- `SupabaseAdapter` (주석 처리 - 향후 활성화)
- 어댑터 교체만으로 Supabase 마이그레이션 가능

---

## 🗂️ 페이지 / 관리자 URI

### 메인 페이지 앵커
- `index.html#about` - 가맹 소개
- `index.html#operation` - 운영 구조
- `index.html#revenue` - 수익 구조
- `index.html#seminar` - 설명회 일정
- `index.html#process` - 가맹 절차

### 관리자 페이지
- `admin.html` - 비밀번호 로그인 후 세미나 CRUD
- **기본 비밀번호**: `ekproject2026` (⚠ 운영 시 반드시 변경 — `js/admin.js` 상단 `ADMIN_PASSWORD`)

---

## 📊 데이터 모델

### 테이블: `seminars`
| 필드 | 타입 | 설명 |
|---|---|---|
| id | text | 고유 ID (자동 생성) |
| title | text | 세미나 제목 |
| description | rich_text | 상세 설명 |
| seminar_date | text | 날짜 (YYYY-MM-DD, 빈 값이면 "일정 조율 중" 표시) |
| seminar_time | text | 시간 (예: "오후 2시~4시") |
| location | text | 장소 (\\n 줄바꿈 가능) |
| capacity | number | 잔여 좌석 수 |
| status | text | 상태 (예정/접수중/마감/종료) |
| detail_link | text | 자세히보기 링크 |
| apply_link | text | 신청 링크 |
| display_order | number | 표시 순서 (낮을수록 먼저, 메인엔 상위 3개) |

### 메인 페이지 카드 표시 규칙
- `display_order` 오름차순으로 상위 3개 자동 노출
- 3개일 때 **가운데(2번째) 카드는 주황 테두리로 강조** + 신청 버튼이 주황색
- 좌/우 카드는 신청 버튼이 네이비색
- `seminar_date`가 비어있으면 "일정 조율 중" / "날짜 확정 후 공지 예정" 표시
- `capacity`가 0이면 "사전 신청시 우선 안내" 표시

### REST API 엔드포인트
- `GET tables/seminars` - 목록
- `GET tables/seminars/{id}` - 단건 조회
- `POST tables/seminars` - 등록
- `PATCH tables/seminars/{id}` - 수정
- `DELETE tables/seminars/{id}` - 삭제

---

## 📁 파일 구조

```
index.html              # 메인 페이지 (10개 섹션)
admin.html              # 관리자 페이지
README.md               # 이 문서

css/
  ├── style.css         # 메인 스타일 (10섹션)
  └── admin.css         # 관리자 페이지 스타일

js/
  ├── api.js            # 데이터 접근 추상화 (Supabase 마이그레이션 대비)
  ├── main.js           # 메인 페이지 + 탭 + 세미나 렌더링
  └── admin.js          # 관리자 페이지 CRUD

images/                 # 이미지 자산 (사용자가 동일 파일명으로 교체 가능)
  ├── logo.png
  ├── hero.jpg
  ├── about-meeting.jpg
  ├── profit-bg.jpg
  ├── franchise-bg.jpg
  ├── num-01.png ~ num-03.png
  └── icon-*.png (8개 아이콘)
```

---

## 🎨 디자인 토큰

| 요소 | 값 |
|---|---|
| 메인 컬러 (주황) | `#FF6B1A` |
| 헤더 보라/네이비 | `#1F0F72` |
| 다크 섹션 BG | `#22262B` |
| 카카오 노랑 | `#FEE500` |
| 푸터 회색 | `#6F7682` |
| 폰트 | Noto Sans KR (300~900) |
| 아이콘 | Font Awesome 6.4 |

---

## 🔮 추후 작업 / 미구현

### 🔗 외부 링크 연결 (모두 `href="#"` 임시값)
- [ ] 카카오 상담 채널 URL (헤더 / 가맹 절차 박스)
- [ ] "내 학원 수익 구조 진단받기" 링크 (HERO)
- [ ] "30초 수익구조 진단 시작하기" 링크 (PRS / PROCESS)
- [ ] 푸터 개인정보처리방침 / 이용약관

### 🗄️ Supabase 마이그레이션
- [ ] Supabase 프로젝트 + `seminars` 테이블 생성 (위 스키마 그대로)
- [ ] `js/api.js` 내 `SupabaseAdapter` 주석 해제 + URL/Anon Key 입력
- [ ] HTML `<head>`에 supabase-js CDN 추가
- [ ] `const SeminarAPI = new SupabaseAdapter('seminars');` 로 변경
- [ ] RLS(Row Level Security) 정책 설정

### 🔐 인증 강화
- [ ] 현재: 클라이언트 측 비밀번호 비교 (프로토타입)
- [ ] 추후: Supabase Auth 이메일/비밀번호 로그인으로 교체

### 📝 콘텐츠 다듬기
- [ ] 회사 정보 (대표명/사업자등록번호/주소) 실데이터 입력 (footer)
- [ ] REVENUE 섹션의 중고등 영어/국어 탭 실제 운영 수치 확정
- [ ] PRS 다크 섹션 본문 카피 다듬기

---

## 🛠 로컬 테스트
```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

> ⚠ 내장 RESTful Table API는 본 플랫폼 환경에서만 동작합니다.
> 로컬에서 그대로 띄우면 세미나 카드는 비어 보입니다.
> Supabase로 마이그레이션 후에는 어디서든 동작합니다.

---

## 📞 관리자 사용 가이드

1. 메인 페이지 푸터의 "관리자" 또는 `/admin.html` 직접 접속
2. 비밀번호 입력 (`ekproject2026`)
3. 우측 상단 "새 일정 등록"으로 추가
4. **표시 순서가 낮은 3개 일정**이 메인 페이지에 자동 노출됨 (가운데 강조)
5. 작업 완료 후 우측 상단 "로그아웃"

### 세미나 카드 작성 팁
- 날짜 미정 일정은 `seminar_date`를 비워두면 자동으로 "일정 조율 중 / 날짜 확정 후 공지 예정" 표시
- 장소에 줄바꿈이 필요하면 `\n` 또는 줄바꿈 문자 사용
- `display_order`로 순서 제어 (1, 2, 3 → 좌, 가운데(강조), 우)
