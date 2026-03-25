'use client';

export type TypedShapeKey = 'match' | 'miss' | 'empty';

export interface TypedShape {
  shape: TypedShapeKey;
  symbol: string;
}

/** 미션 TARGET 패널과 동일하게: ○△□ → 채움 기호(●▲■)로 통일해 시각 비교 가능 */
function toFilledSymbol(char: string): string {
  if (char === '○') return '●';
  if (char === '△') return '▲';
  if (char === '□') return '■';
  return char;
}

const shapeColorMap: Record<TypedShapeKey, string> = {
  match: 'text-emerald-400',
  miss: 'text-red-400',
  empty: 'text-zinc-500',
};

export interface PixelMonkeyProps {
  typing?: boolean;
  isResting?: boolean;
  isWaiting?: boolean;
  spriteType?: number;
  typedShapes?: TypedShape[];
  earnedGold?: number | null;
  /** 버튼 등에서 원숭이만 표시할 때 true */
  iconOnly?: boolean;
}

export function PixelMonkey({
  typing,
  isResting,
  isWaiting,
  spriteType = 0,
  typedShapes = [],
  earnedGold,
  iconOnly = false,
}: PixelMonkeyProps) {
  // Determine which sprite animation class to use
  let animationClass = 'animate-monkey-idle';

  if (typing) {
    animationClass = `animate-monkey-typing-${spriteType}`;
  } else if (isResting && !isWaiting) {
    animationClass = 'animate-monkey-resting';
  }

  return (
    <div className="flex flex-col items-center gap-1 relative w-full pt-6">
      {/* Gold earned floating text (iconOnly일 때 숨김, 상단 여유로 잘림 방지) */}
      {!iconOnly && earnedGold !== null && earnedGold !== undefined && (
        <div
          className="absolute top-4 w-full font-mono text-[10px] pointer-events-none z-10 text-amber-400 flex justify-center"
          style={{
            animation: 'floatUp 1.2s ease-out forwards',
          }}
        >
          {earnedGold > 0 ? `+${earnedGold}G` : '0'}
        </div>
      )}

      {/* Typed shapes above head — 실제 친 문자(○△□→●▲■) 표시, 일치/불일치만 색으로 구분 (2/3 크기) */}
      {!iconOnly && (
        <div className="symbol-row-sm h-6 mt-4">
          {typedShapes.map((item, i) => {
            const displayChar = toFilledSymbol(item.symbol);
            const colorClass = shapeColorMap[item.shape];
            return (
              <span
                key={i}
                className={`symbol-cell-sm ${colorClass}`}
                style={{ animation: 'popIn 0.2s ease-out' }}
                title={item.shape === 'match' ? '일치' : '불일치'}
              >
                {displayChar}
              </span>
            );
          })}
        </div>
      )}

      {/* Monkey body */}
      <div
        className={`monkey-sprite ${animationClass}`}
        style={{
          filter: isWaiting ? 'grayscale(100%) opacity(0.7)' : 'none',
          marginTop: '-8px',
        }}
      />
    </div>
  );
}
