# CLAUDE.md — Infinite Monkey Theorem

## 프로젝트 개요

원숭이들이 무작위로 타자를 쳐서 목표 문자열을 맞추면 골드를 버는 **방치형(Idle) 웹 게임**.
"무한 원숭이 정리(Infinite Monkey Theorem)"를 게임으로 구현한 것.

- **장르**: 방치형 클리커
- **배포**: Cloudflare Workers
- **언어**: 한국어/영어 (next-intl)

## 기술 스택

- Next.js 15 (App Router) + TypeScript (strict)
- Tailwind CSS v4 + 픽셀아트 커스텀 테마
- Zustand (상태 관리, localStorage 자동 저장)
- next-intl (i18n)
- Cloudflare Workers (@opennextjs/cloudflare)
- Node >= 22.0.0

## 명령어

```bash
npm install          # 의존성 설치
npm run dev          # 로컬 개발 서버 (http://localhost:3000)
npm run build        # Next.js 빌드 + Cloudflare Worker 빌드
npm run lint         # ESLint 검사
npm run lint:fix     # ESLint 자동 수정
npm run format       # Prettier 포맷팅
npm run format:check # 포맷 검사만
```

## 폴더 구조

```
src/
├── app/
│   ├── layout.tsx          # 루트 레이아웃 (폰트, 메타데이터, i18n)
│   ├── page.tsx            # ★ 메인 게임 페이지 (UI 전체)
│   ├── globals.css         # 전역 CSS + 원숭이 스프라이트 애니메이션
│   └── pixel-theme.css     # 픽셀아트 테마 스타일
├── components/
│   ├── game/               # ★ 게임 전용 컴포넌트
│   │   ├── PixelMonkey.tsx    # 원숭이 스프라이트 렌더링
│   │   └── PixelTypewriter.tsx # 타자기 텍스트 표시
│   ├── ui/                 # 공통 UI (Shadcn 기반: button, card, dialog 등)
│   ├── layout/             # 공통 레이아웃 (Shell, AppLayoutWrapper)
│   └── common/             # 공통 유틸 (GoogleAnalytics, Icon)
├── stores/
│   └── gameStore.ts        # ★ 게임 상태 관리 (Zustand) — 핵심 로직
├── config/
│   ├── missions.ts         # ★ 미션 정의 (목표 문자열, 보상, 난이도)
│   └── constants.ts        # 환경 상수 (GA ID 등)
├── hooks/
│   └── useGameLoop.ts      # ★ requestAnimationFrame 게임 루프
├── lib/
│   ├── sounds.ts           # ★ 효과음 관리
│   ├── format.ts           # 숫자 포맷팅
│   ├── utils.ts            # cn() 등 공통 유틸
│   └── gtag.ts             # Google Analytics 헬퍼
├── i18n.ts                 # i18n 설정
└── middleware.ts            # Next.js 미들웨어 (로케일 라우팅)

public/
├── assets/
│   ├── units/              # ★ 캐릭터/유닛 스프라이트 (원숭이 등)
│   │   └── _reference/    # 참고용 원본 (git 제외)
│   ├── items/              # ★ 아이템 아이콘
│   ├── ui/                 # ★ 게임 내 UI 요소 (버튼, 프레임 등)
│   ├── maps/               # ★ 배경, 타일, 맵
│   ├── effects/            # ★ 이펙트, 파티클
│   ├── audio/              # ★ 효과음, BGM
│   └── og/                 # 소셜 미디어 미리보기 이미지
├── icons/                  # 웹앱 아이콘 (16~192px)
└── favicon.ico

messages/                   # i18n 번역 파일
├── en.json, ko.json        # 공통 번역
├── en/home.json            # 영어 게임 텍스트
└── ko/home.json            # 한국어 게임 텍스트
```

> ★ 표시 = 게임 전용 파일. 새 게임을 만들 때 이 파일들을 수정/교체합니다.

## 게임 로직 핵심 흐름

```
useGameLoop (매 프레임 tick 호출)
  → gameStore.tick(delta)
    → 글로벌 타이핑 진행도 업데이트
    → 스태미나 소모 → 0이면 휴식 모드
    → 모든 원숭이가 동시에 한 글자씩 타이핑
    → 목표 길이 도달 시 매칭 계산 → 골드 지급
    → 완전 일치 시 미션 클리어 + 다음 미션
```

**상태 저장**: Zustand persist → localStorage 키 `monkey-game-storage`

## 코드 규칙

- TypeScript strict 모드, `any` 금지
- `"use client"` 최소 범위 적용
- Import 순서: builtin → external → internal(@/) → parent → sibling
- Prettier: singleQuote, printWidth 80, tabWidth 2, semi, trailingComma es5
- 커밋: Conventional Commits (feat/fix/chore/refactor)
- `<img>` 사용 가능 (Cloudflare Workers에서 next/image 미지원), alt 필수

## 새 게임 만들 때 참고

이 프로젝트를 복사해서 새 게임을 만들 때 수정할 파일:

1. `src/stores/gameStore.ts` — 게임 상태 + 로직 교체
2. `src/config/missions.ts` — 미션/레벨 데이터 교체
3. `src/hooks/useGameLoop.ts` — 게임 루프 수정
4. `src/app/page.tsx` — 게임 UI 교체
5. `src/components/game/` — 게임 컴포넌트 교체
6. `src/lib/sounds.ts` — 효과음 교체
7. `src/app/pixel-theme.css` — 테마 스타일 교체
8. `public/assets/` — 게임 에셋 교체
9. `messages/` — 번역 텍스트 교체
10. `package.json` — name, version 변경

유지할 파일 (공통 인프라):

- `src/components/ui/`, `layout/`, `common/` — UI 컴포넌트
- `src/lib/utils.ts`, `format.ts`, `gtag.ts` — 유틸리티
- 설정 파일들 (tsconfig, eslint, prettier, wrangler 등)
