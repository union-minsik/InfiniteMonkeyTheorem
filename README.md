# Infinite Monkey Theorem

원숭이들이 무작위로 타자를 쳐서 목표 문자열을 완성하면 골드를 버는 **방치형(Idle) 웹 게임**입니다.

> "무한한 시간이 주어지면 원숭이가 타자기를 무작위로 쳐서 셰익스피어의 전집을 완성할 수 있다"는 [무한 원숭이 정리](https://ko.wikipedia.org/wiki/%EB%AC%B4%ED%95%9C_%EC%9B%90%EC%88%AD%EC%9D%B4_%EC%A0%95%EB%A6%AC)를 게임으로 만들었습니다.

<!-- 스크린샷이나 데모 GIF를 여기에 추가하세요 -->
<!-- ![gameplay](docs/screenshot.png) -->

## 시작하기

### 필수 요구사항

- **Node.js** >= 22.0.0
- **npm** (Node.js와 함께 설치됨)

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev
# → http://localhost:3000 에서 게임 플레이 가능
```

### 빌드 및 배포

```bash
# 프로덕션 빌드 (Next.js + Cloudflare Worker)
npm run build

# 코드 품질 체크
npm run lint          # ESLint 검사
npm run format:check  # Prettier 포맷 검사
npm run format        # 자동 포맷팅
```

배포는 Cloudflare Workers를 사용합니다. `wrangler.toml`에 설정이 정의되어 있습니다.

## 게임 소개

### 플레이 방식

1. **원숭이 고용**: 골드로 원숭이를 구매합니다 (비용은 구매할수록 증가)
2. **자동 타이핑**: 원숭이들이 자동으로 무작위 글자를 타이핑합니다
3. **골드 획득**: 목표 문자열과 일치하는 글자가 있으면 골드를 획득합니다
4. **미션 클리어**: 목표를 완벽히 일치시키면 다음 미션으로 진행합니다

### 미션 구성

- **Phase 1** (미션 1~10): 도형 기호 (○, △, □) — 3종류 중 맞추기
- **Phase 2** (미션 11~22): 알파벳 (A~Z) — 26종류 중 맞추기, GO → SHAKESPEARE → MONKEYTHEOREM까지

### 게임 시스템

| 시스템    | 설명                                     |
| --------- | ---------------------------------------- |
| 스태미나  | 원숭이들이 일정량 타이핑 후 휴식         |
| 영감      | 확률적으로 정답 글자를 타이핑            |
| 골드 배율 | 일치 글자 수에 따라 보상 기하급수적 증가 |
| 자동 저장 | 브라우저 localStorage에 자동 저장        |

## 기술 스택

| 기술                                                   | 용도                                    |
| ------------------------------------------------------ | --------------------------------------- |
| [Next.js 15](https://nextjs.org/) (App Router)         | 웹 프레임워크                           |
| [TypeScript](https://www.typescriptlang.org/) (strict) | 타입 안전성                             |
| [Tailwind CSS v4](https://tailwindcss.com/)            | 스타일링                                |
| [Zustand](https://zustand-demo.pmnd.rs/)               | 게임 상태 관리 (localStorage 자동 저장) |
| [next-intl](https://next-intl-docs.vercel.app/)        | 다국어 지원 (한국어/영어)               |
| [Cloudflare Workers](https://workers.cloudflare.com/)  | 배포                                    |

## 폴더 구조

```
InfiniteMonkeyTheorem/
├── src/
│   ├── app/                    # Next.js 페이지
│   │   ├── page.tsx               # 🎮 메인 게임 화면
│   │   ├── layout.tsx             # 루트 레이아웃
│   │   ├── globals.css            # 전역 CSS + 스프라이트 애니메이션
│   │   └── pixel-theme.css        # 🎮 픽셀아트 테마
│   ├── components/
│   │   ├── game/               # 🎮 게임 전용 컴포넌트
│   │   ├── ui/                 # 공통 UI (Shadcn 기반)
│   │   ├── layout/             # 공통 레이아웃
│   │   └── common/             # 공통 유틸리티 컴포넌트
│   ├── stores/
│   │   └── gameStore.ts        # 🎮 게임 상태 + 핵심 로직 (Zustand)
│   ├── config/
│   │   ├── missions.ts         # 🎮 미션 데이터 (목표, 보상, 난이도)
│   │   └── constants.ts        # 환경 상수
│   ├── hooks/
│   │   └── useGameLoop.ts      # 🎮 게임 루프 (requestAnimationFrame)
│   ├── lib/
│   │   ├── sounds.ts           # 🎮 효과음
│   │   ├── format.ts           # 숫자 포맷팅
│   │   ├── utils.ts            # 공통 유틸리티
│   │   └── gtag.ts             # Google Analytics
│   ├── i18n.ts                 # 다국어 설정
│   └── middleware.ts           # Next.js 미들웨어
├── public/
│   ├── assets/
│   │   ├── units/              # 🎮 캐릭터/유닛 스프라이트
│   │   ├── items/              # 🎮 아이템 아이콘
│   │   ├── ui/                 # 🎮 게임 내 UI 요소
│   │   ├── maps/               # 🎮 배경, 타일, 맵
│   │   ├── effects/            # 🎮 이펙트, 파티클
│   │   ├── audio/              # 🎮 효과음, BGM
│   │   └── og/                 # 소셜 미디어 미리보기 이미지
│   ├── icons/                  # 웹앱 아이콘 (16px ~ 192px)
│   └── favicon.ico             # 브라우저 탭 아이콘
├── messages/                   # 다국어 번역 파일 (ko/en)
├── CLAUDE.md                   # Claude AI 작업 규칙서
├── .cursorrules                # Cursor AI 작업 규칙서
└── 설정 파일들                  # tsconfig, eslint, prettier, wrangler 등
```

> 🎮 = 게임 전용 파일. 새 게임을 만들 때 이 파일들을 수정합니다.

## 새 게임 만들기 (이 프로젝트를 템플릿으로 사용)

이 프로젝트를 복사해서 다른 웹 게임을 만들 수 있습니다.

### 수정할 파일 (게임 전용)

| 파일                       | 역할                       |
| -------------------------- | -------------------------- |
| `src/stores/gameStore.ts`  | 게임 상태와 핵심 로직 교체 |
| `src/config/missions.ts`   | 미션/레벨 데이터 교체      |
| `src/hooks/useGameLoop.ts` | 게임 루프 수정             |
| `src/app/page.tsx`         | 게임 UI 전체 교체          |
| `src/components/game/`     | 게임 컴포넌트 교체         |
| `src/lib/sounds.ts`        | 효과음 교체                |
| `src/app/pixel-theme.css`  | 비주얼 테마 교체           |
| `public/assets/`           | 이미지, 스프라이트 교체    |
| `messages/`                | 게임 텍스트 번역 교체      |
| `package.json`             | name, version 변경         |

### 그대로 유지할 파일 (공통 인프라)

- `src/components/ui/` — Shadcn UI 컴포넌트
- `src/components/layout/`, `common/` — 레이아웃, 애널리틱스
- `src/lib/utils.ts`, `format.ts`, `gtag.ts` — 유틸리티
- 설정 파일들 — tsconfig, eslint, prettier, wrangler, postcss 등
