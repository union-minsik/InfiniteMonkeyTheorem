import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { MISSIONS } from '@/config/missions';

export interface Monkey {
  id: string;
  currentString: string;
  isInspired: boolean;
  lastString?: string;
  lastEarnedGold?: number;
  isWaiting?: boolean;
  spriteType: number; // 0, 1, or 2 for typing_0, typing_1, typing_2
}

interface PersistedState {
  gold: number;
  monkeys: Monkey[];
  purchaseCount: number;
  currentMissionIndex: number;
  globalStamina: number;
  globalIsResting: boolean;
  globalRestTimeRemaining: number;
  globalTypingProgress: number;
}

interface TransientState {
  typingSpeed: number;
  maxStamina: number;
  restTime: number;
  inspirationChance: number;
  goldMultiplier: number;
  monkeyCap: number;
  showCelebration: boolean;
  completedMissionName: string;
}

interface Actions {
  tick: (delta: number) => void;
  buyMonkey: () => void;
  dismissCelebration: () => void;
  resetGame: () => void;
}

export type GameState = PersistedState & TransientState & Actions;

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      // Persisted State
      gold: 0,
      monkeys: [
        {
          id: 'monkey-initial',
          currentString: '',
          isInspired: false,
          isWaiting: false,
          spriteType: Math.floor(Math.random() * 3),
        },
      ],
      purchaseCount: 0,
      currentMissionIndex: 0,
      globalStamina: 10,
      globalIsResting: false,
      globalRestTimeRemaining: 0,
      globalTypingProgress: 0,

      // Transient State
      typingSpeed: 1.5,
      maxStamina: 10,
      restTime: 5.0,
      inspirationChance: 0.0,
      goldMultiplier: 1.0,
      monkeyCap: 20,
      showCelebration: false,
      completedMissionName: '',

      tick: (delta: number) => {
        set((state) => {
          if (state.currentMissionIndex >= MISSIONS.length) return state;

          const mission = MISSIONS[state.currentMissionIndex];
          const { target, charPool, goldPerMatch, completionBonus } = mission;
          const L = target.length;

          let totalGoldEarned = 0;
          let foundPerfect = false;
          let nextShowCelebration = state.showCelebration;
          let nextCompletedName = state.completedMissionName;

          let newGlobalStamina = state.globalStamina;
          let newGlobalIsResting = state.globalIsResting;
          let newGlobalRestTime = state.globalRestTimeRemaining;
          let newGlobalProgress = state.globalTypingProgress || 0;

          if (newGlobalIsResting) {
            newGlobalRestTime -= delta;
            if (newGlobalRestTime <= 0) {
              newGlobalIsResting = false;
              newGlobalStamina = state.maxStamina;
              newGlobalRestTime = 0;
            }
            // While resting, monkeys do not type
            return {
              globalIsResting: newGlobalIsResting,
              globalStamina: newGlobalStamina,
              globalRestTimeRemaining: newGlobalRestTime,
            };
          }

          newGlobalProgress += delta / state.typingSpeed;

          let updatedMonkeys = [...state.monkeys];

          while (newGlobalProgress >= 1) {
            let activeMonkeys = updatedMonkeys.filter((m) => !m.isWaiting);
            if (activeMonkeys.length === 0) {
              updatedMonkeys = updatedMonkeys.map((m) => ({
                ...m,
                isWaiting: false,
              }));
              activeMonkeys = updatedMonkeys;
            }

            if (activeMonkeys.length === 0) break;

            const currentLen = activeMonkeys[0].currentString.length;

            if (currentLen < L) {
              newGlobalProgress -= 1;
              newGlobalStamina -= 1;

              updatedMonkeys = updatedMonkeys.map((monkey) => {
                if (monkey.isWaiting) return monkey;

                let newLastString = monkey.lastString;
                let newLastEarnedGold = monkey.lastEarnedGold;
                if (monkey.currentString.length === 0) {
                  newLastString = undefined;
                  newLastEarnedGold = undefined;
                }

                let char = '';
                if (monkey.isInspired && Math.random() < 0.5) {
                  char = target[monkey.currentString.length];
                } else {
                  char = charPool[Math.floor(Math.random() * charPool.length)];
                }

                return {
                  ...monkey,
                  currentString: monkey.currentString + char,
                  lastString: newLastString,
                  lastEarnedGold: newLastEarnedGold,
                };
              });

              if (newGlobalStamina <= 0) {
                newGlobalIsResting = true;
                newGlobalRestTime = state.restTime;
                break;
              }
            }

            const newLen =
              updatedMonkeys.find((m) => !m.isWaiting)?.currentString.length ||
              0;
            if (newLen === L) {
              updatedMonkeys = updatedMonkeys.map((monkey) => {
                if (monkey.isWaiting) return monkey;

                let matches = 0;
                for (let i = 0; i < L; i++) {
                  if (monkey.currentString[i] === target[i]) matches++;
                }

                let reward = 0;
                if (matches >= 1) {
                  reward = goldPerMatch * Math.pow(2, matches - 1);
                  if (matches === L) {
                    reward = reward * 3 + completionBonus;
                    foundPerfect = true;
                  }
                  totalGoldEarned += reward * state.goldMultiplier;
                }

                return {
                  ...monkey,
                  lastString: monkey.currentString,
                  lastEarnedGold: reward * state.goldMultiplier,
                  currentString: '',
                  isInspired: Math.random() < state.inspirationChance,
                  isWaiting: false,
                };
              });

              updatedMonkeys = updatedMonkeys.map((m) => ({
                ...m,
                isWaiting: false,
              }));

              if (foundPerfect) {
                break;
              }
            }
          }

          let nextIndex = state.currentMissionIndex;
          if (foundPerfect) {
            nextIndex = Math.min(
              state.currentMissionIndex + 1,
              MISSIONS.length - 1
            );
            nextShowCelebration = true;
            nextCompletedName = target;

            updatedMonkeys.forEach((m) => {
              m.currentString = '';
              m.isInspired = Math.random() < state.inspirationChance;
              m.isWaiting = false;
            });
          }

          return {
            monkeys: updatedMonkeys,
            gold: state.gold + totalGoldEarned,
            currentMissionIndex: nextIndex,
            showCelebration: nextShowCelebration,
            completedMissionName: nextCompletedName,
            globalStamina: newGlobalStamina,
            globalIsResting: newGlobalIsResting,
            globalRestTimeRemaining: newGlobalRestTime,
            globalTypingProgress: newGlobalProgress,
          };
        });
      },

      buyMonkey: () => {
        set((state) => {
          if (state.monkeys.length >= state.monkeyCap) return state;

          const cost = Math.floor(100 * Math.pow(1.07, state.purchaseCount));
          if (state.gold >= cost) {
            const activeMonkeys = state.monkeys.filter((m) => !m.isWaiting);
            const isMidCycle =
              activeMonkeys.length > 0 &&
              activeMonkeys[0].currentString.length > 0;

            const newMonkey: Monkey = {
              id: `monkey-${Date.now()}-${Math.random()}`,
              currentString: '',
              isInspired: Math.random() < state.inspirationChance,
              isWaiting: isMidCycle,
              spriteType: Math.floor(Math.random() * 3),
            };
            return {
              gold: state.gold - cost,
              purchaseCount: state.purchaseCount + 1,
              monkeys: [...state.monkeys, newMonkey],
            };
          }
          return state;
        });
      },

      dismissCelebration: () => set({ showCelebration: false }),

      resetGame: () =>
        set({
          gold: 0,
          monkeys: [
            {
              id: 'monkey-initial',
              currentString: '',
              isInspired: false,
              isWaiting: false,
              spriteType: Math.floor(Math.random() * 3),
            },
          ],
          purchaseCount: 0,
          currentMissionIndex: 0,
          showCelebration: false,
          completedMissionName: '',
          globalStamina: 10,
          globalIsResting: false,
          globalRestTimeRemaining: 0,
          globalTypingProgress: 0,
        }),
    }),
    {
      name: 'monkey-game-storage',
      partialize: (state) => ({
        gold: state.gold,
        monkeys: state.monkeys,
        purchaseCount: state.purchaseCount,
        currentMissionIndex: state.currentMissionIndex,
        globalStamina: state.globalStamina,
        globalIsResting: state.globalIsResting,
        globalRestTimeRemaining: state.globalRestTimeRemaining,
        globalTypingProgress: state.globalTypingProgress,
      }),
    }
  )
);
