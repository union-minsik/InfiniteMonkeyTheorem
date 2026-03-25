'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

import { PixelMonkey, type TypedShape } from '@/components/game/PixelMonkey';
import { MISSIONS } from '@/config/missions';
import { useGameLoop } from '@/hooks/useGameLoop';
import { formatNumber } from '@/lib/format';
import { playMonkeySuccessSound } from '@/lib/sounds';
import { useGameStore, type Monkey } from '@/stores/gameStore';

function CelebrationOverlay({
  missionName,
  onDismiss,
}: {
  missionName: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    playMonkeySuccessSound();
  }, []);

  useEffect(() => {
    const timer = setTimeout(onDismiss, 2500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="celebration-overlay" onClick={onDismiss}>
      <div className="celebration-content">
        <div className="celebration-emoji">🎉</div>
        <div className="celebration-title">MISSION COMPLETE!</div>
        <div className="celebration-target font-mono">
          &quot;{missionName}&quot;
        </div>
        <div className="celebration-sub">완전 일치 달성!</div>
      </div>
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="confetti-particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1.5 + Math.random()}s`,
          }}
        />
      ))}
    </div>
  );
}

function MonkeyCard({
  monkey,
  target,
  isResting,
}: {
  monkey: Monkey;
  target: string;
  isResting: boolean;
}) {
  const isShowingLast = monkey.currentString.length === 0 && monkey.lastString;
  const currentChars = isShowingLast
    ? monkey.lastString!
    : monkey.currentString;

  const typedShapes: TypedShape[] = Array.from({
    length: currentChars.length,
  }).map((_, i) => {
    const isMatch = currentChars[i] === target[i];
    return {
      shape: isMatch ? ('match' as const) : ('miss' as const),
      symbol: currentChars[i],
    };
  });

  const typingSpeed = useGameStore((s) => s.typingSpeed);
  const globalTypingProgress = useGameStore((s) => s.globalTypingProgress);

  const timeUntilNextChar = typingSpeed * (1 - globalTypingProgress);
  const shouldBeTyping =
    !monkey.isWaiting &&
    monkey.currentString.length < target.length &&
    timeUntilNextChar <= 0.3;

  const [isTypingAnim, setIsTypingAnim] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (shouldBeTyping && !isTypingAnim) {
      setIsTypingAnim(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTypingAnim(false);
      }, 500);
    }
  }, [shouldBeTyping, isTypingAnim]);

  return (
    <div className="monkey-card relative pt-6">
      <div className="monkey-icon-wrapper">
        {/* Status texts positioned absolutely at the top of monkey-card */}
        {isResting && !monkey.isWaiting && (
          <div
            className="absolute top-20 right-6 font-mono text-[16px] text-blue-300 z-10 font-bold tracking-tighter drop-shadow-md"
            style={{ textShadow: '2px 2px 0 #0d1117' }}
          >
            <span className="zzz-1">z</span>
            <span className="zzz-2">z</span>
            <span className="zzz-3">Z</span>
          </div>
        )}
        {monkey.isWaiting && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 font-mono text-[12px] text-gray-400 animate-pulse whitespace-nowrap z-10">
            대기중
          </div>
        )}
        {monkey.isInspired && !monkey.isWaiting && (
          <div className="absolute top-10 left-1/4 font-mono text-[12px] text-yellow-300 animate-bounce whitespace-nowrap z-10">
            💡
          </div>
        )}

        <PixelMonkey
          typing={isTypingAnim}
          isResting={isResting}
          isWaiting={monkey.isWaiting}
          spriteType={monkey.spriteType}
          typedShapes={typedShapes}
          earnedGold={isShowingLast ? monkey.lastEarnedGold : undefined}
        />
      </div>
    </div>
  );
}

function StatsPopup({ onClose }: { onClose: () => void }) {
  const typingSpeed = useGameStore((s) => s.typingSpeed);
  const maxStamina = useGameStore((s) => s.maxStamina);
  const restTime = useGameStore((s) => s.restTime);
  const inspirationChance = useGameStore((s) => s.inspirationChance);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border-2 border-zinc-700 p-6 rounded-lg max-w-sm w-full font-mono text-sm text-zinc-300"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl text-white mb-4 text-center">능력치 정보</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>타자 속도:</span>
            <span className="text-white">{typingSpeed}초/글자</span>
          </div>
          <div className="flex justify-between">
            <span>집중력 (스태미나):</span>
            <span className="text-white">{maxStamina}자</span>
          </div>
          <div className="flex justify-between">
            <span>휴식 시간:</span>
            <span className="text-white">{restTime}초</span>
          </div>
          <div className="flex justify-between">
            <span>영감 확률:</span>
            <span className="text-white">
              {(inspirationChance * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <button
          className="mt-6 w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded border border-zinc-600 transition-colors"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const ZOOM_SENSITIVITY = 0.002;

function getTouchDistance(touches: React.TouchList | TouchList): number {
  if (touches.length < 2) return 0;
  const a = touches[0];
  const b = touches[1];
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const pinchStart = useRef({ distance: 0, scale: 1 });

  const gold = useGameStore((s) => s.gold);
  const monkeys = useGameStore((s) => s.monkeys);
  const monkeyCap = useGameStore((s) => s.monkeyCap);
  const purchaseCount = useGameStore((s) => s.purchaseCount);
  const currentMissionIndex = useGameStore((s) => s.currentMissionIndex);
  const showCelebration = useGameStore((s) => s.showCelebration);
  const completedMissionName = useGameStore((s) => s.completedMissionName);
  const buyMonkey = useGameStore((s) => s.buyMonkey);
  const dismissCelebration = useGameStore((s) => s.dismissCelebration);
  const resetGame = useGameStore((s) => s.resetGame);
  const typingSpeed = useGameStore((s) => s.typingSpeed);
  const globalIsResting = useGameStore((s) => s.globalIsResting);

  useGameLoop();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDismiss = useCallback(() => {
    dismissCelebration();
  }, [dismissCelebration]);

  const handleReset = useCallback(() => {
    if (confirm('게임을 초기화하시겠습니까? (모든 데이터가 삭제됩니다)')) {
      resetGame();
    }
  }, [resetGame]);

  const onPanStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if ('touches' in e && e.touches.length === 2) {
        pinchStart.current = {
          distance: getTouchDistance(e.touches),
          scale,
        };
        return;
      }
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setIsDragging(true);
      dragStart.current = { x: clientX, y: clientY, panX: pan.x, panY: pan.y };
    },
    [pan.x, pan.y, scale]
  );

  const onPanMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if ('touches' in e && e.touches.length === 2) {
        const dist = getTouchDistance(e.touches);
        if (pinchStart.current.distance > 0) {
          const ratio = dist / pinchStart.current.distance;
          const next = Math.min(
            MAX_ZOOM,
            Math.max(MIN_ZOOM, pinchStart.current.scale * ratio)
          );
          setScale(next);
        }
        return;
      }
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setPan({
        x: dragStart.current.panX + clientX - dragStart.current.x,
        y: dragStart.current.panY + clientY - dragStart.current.y,
      });
    },
    [isDragging]
  );

  const onPanEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('mousemove', onPanMove);
    window.addEventListener('mouseup', onPanEnd);
    window.addEventListener('touchmove', onPanMove, { passive: true });
    window.addEventListener('touchend', onPanEnd);
    return () => {
      window.removeEventListener('mousemove', onPanMove);
      window.removeEventListener('mouseup', onPanEnd);
      window.removeEventListener('touchmove', onPanMove);
      window.removeEventListener('touchend', onPanEnd);
    };
  }, [isDragging, onPanMove, onPanEnd]);

  const viewportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const el = viewportRef.current;
      if (!el || !el.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      setScale((s) => {
        const delta = -e.deltaY * ZOOM_SENSITIVITY;
        return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s + delta * s));
      });
    };
    document.addEventListener('wheel', onWheel, {
      passive: false,
      capture: true,
    });
    return () =>
      document.removeEventListener('wheel', onWheel, { capture: true });
  }, []);

  const pixelContainerStyle: React.CSSProperties = {
    backgroundColor: '#0d1117',
    color: '#e6edf3',
    fontFamily: '"Press Start 2P", cursive',
    backgroundImage: `
      linear-gradient(rgba(48,54,61,0.3) 1px, transparent 1px),
      linear-gradient(90deg, rgba(48,54,61,0.3) 1px, transparent 1px)
    `,
    backgroundSize: '16px 16px',
  };

  if (!mounted) {
    return (
      <div className="game-container" style={pixelContainerStyle}>
        <div className="loading-screen font-mono">Loading...</div>
      </div>
    );
  }

  const mission = MISSIONS[currentMissionIndex];
  const isLastMission = currentMissionIndex >= MISSIONS.length - 1;
  const cost = Math.floor(100 * Math.pow(1.07, purchaseCount));
  const canBuy = gold >= cost && monkeys.length < monkeyCap;

  // 초당 타자 사이클 수: (원숭이 수) / (목표 길이 * 타자속도)
  // 대략적인 추정치 (휴식 시간 제외)
  const cyclesPerSec =
    monkeys.length > 0 && mission.target.length > 0
      ? monkeys.length / (mission.target.length * typingSpeed)
      : 0;

  return (
    <div
      ref={viewportRef}
      className="game-container"
      style={pixelContainerStyle}
    >
      {/* Top Info Bar */}
      <header className="info-bar">
        <div className="info-item gold-display">
          <span className="info-label">GOLD</span>
          <span className="info-value gold-value font-mono">
            {formatNumber(gold)}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">MONKEYS</span>
          <span className="info-value font-mono">
            {monkeys.length}/{monkeyCap}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">CYCLES/s</span>
          <span className="info-value font-mono">
            {cyclesPerSec.toFixed(2)}
          </span>
        </div>
        <button
          className="reset-button"
          onClick={handleReset}
          title="Reset Game"
        >
          🔄
        </button>
      </header>

      {/* Center: 전체 화면 원숭이 그리드 (드래그·스크롤 줌) */}
      <main
        className="main-viewport"
        onMouseDown={onPanStart}
        onTouchStart={onPanStart}
      >
        {/* 배경: 원숭이 그리드 (드래그 패닝 + 스크롤/핀치 줌) */}
        <div
          className="world-layer"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            width: '1800px',
          }}
          role="presentation"
        >
          <div className="monkey-grid monkey-grid-background">
            {monkeys.length === 0 ? (
              <div className="results-empty font-mono">
                원숭이를 구매해주세요!
              </div>
            ) : (
              monkeys.map((monkey) => (
                <MonkeyCard
                  key={monkey.id}
                  monkey={monkey}
                  target={mission.target}
                  isResting={globalIsResting}
                />
              ))
            )}
          </div>
        </div>

        {/* 플로팅: 미션 패널 */}
        <section className="floating-panel mission-panel">
          <div className="mission-header">
            <span className="mission-number font-mono">
              MISSION #{mission.id}
            </span>
            {isLastMission && currentMissionIndex > 0 && (
              <span className="mission-final">FINAL</span>
            )}
          </div>
          <div className="mission-label">TARGET</div>
          <div className="mission-target font-mono symbol-row">
            {Array.from(mission.target).map((char, i) => {
              const filled =
                char === '○'
                  ? '●'
                  : char === '△'
                    ? '▲'
                    : char === '□'
                      ? '■'
                      : char;
              return (
                <span key={i} className="symbol-cell">
                  {filled}
                </span>
              );
            })}
          </div>
          <div className="mission-meta">
            <span>길이: {mission.target.length}자</span>
            <span>글자당: {formatNumber(mission.goldPerMatch)}G</span>
          </div>
        </section>
      </main>

      {/* Bottom Control Area */}
      <footer className="control-area relative">
        <button
          className="absolute left-4 bottom-4 w-10 h-10 bg-zinc-800 border-2 border-zinc-600 rounded-full flex items-center justify-center text-xl hover:bg-zinc-700 transition-colors z-10"
          onClick={() => setShowStats(true)}
          title="능력치 정보"
        >
          📊
        </button>

        <div className="flex-1 flex justify-center">
          <button
            className={`buy-button font-mono ${canBuy ? 'buy-active' : 'buy-disabled'}`}
            onClick={buyMonkey}
            disabled={!canBuy}
          >
            <span className="buy-icon" />
            <span className="buy-text">
              {monkeys.length >= monkeyCap ? '최대치 도달' : '원숭이 고용'}
            </span>
            {monkeys.length < monkeyCap && (
              <span className="buy-cost">{formatNumber(cost)} G</span>
            )}
          </button>
        </div>
      </footer>

      {/* Stats Popup */}
      {showStats && <StatsPopup onClose={() => setShowStats(false)} />}

      {/* Celebration Overlay */}
      {showCelebration && (
        <CelebrationOverlay
          missionName={completedMissionName}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}
