import type { Player } from './data.ts'
import scoreValues from './captured-score.json' with { type: 'json' }
export type Difficulty = 'easy' | 'hard'
export type Guess = 'higher' | 'lower' | 'equal'
export type Random = () => number

export function isCorrect(a: number, b: number, guess: Guess, difficulty: Difficulty): boolean {
  if (guess === 'equal') return difficulty === 'hard' && a === b
  if (guess === 'higher') return b > a
  return b < a
}

export function scoreValue(score: number, difficulty: Difficulty): number {
  const max = scoreValues.length - 1
  const euros = score <= max ? scoreValues[score] : scoreValues[max] + 5_000_000 * (score - max)
  return (euros <= 1 ? euros : euros * (difficulty === 'hard' ? 1.5 : 1)) / 1_000_000
}

export function shuffle<T>(items: readonly T[], random: Random = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export interface Match {
  phase: 'guessing' | 'revealed' | 'finished'
  left: Player
  right: Player
  remaining: Player[]
  score: number
  totalValue: number
  correct: boolean | null
  guess: Guess | null
}

export function newMatch(pool: Player[], random: Random = Math.random, difficulty: Difficulty = 'easy'): Match {
  if (pool.length < 2 || new Set(pool.map(p => p.id)).size !== pool.length) throw new Error('서로 다른 선수가 2명 이상 필요합니다.')
  const [left, ...deck] = shuffle(pool, random)
  const index = difficulty === 'easy' ? deck.findIndex(p => p.value !== left.value) : 0
  if (index < 0) throw new Error('쉬움 모드에는 서로 다른 가치의 선수가 필요합니다.')
  const [right] = deck.splice(index, 1)
  const remaining = deck
  return { phase: 'guessing', left, right, remaining, score: 0, totalValue: 0, correct: null, guess: null }
}

export function answer(match: Match, guess: Guess, difficulty: Difficulty): Match {
  if (match.phase !== 'guessing' || (guess === 'equal' && difficulty === 'easy')) return match
  const correct = isCorrect(match.left.value, match.right.value, guess, difficulty)
  return { ...match, phase: 'revealed', correct, guess,
    score: match.score + (correct ? 1 : 0), totalValue: scoreValue(match.score + (correct ? 1 : 0), difficulty) }
}

export function advance(match: Match, pool: Player[], random: Random = Math.random, difficulty: Difficulty = 'easy'): Match {
  if (match.phase !== 'revealed') return match
  if (!match.correct) return { ...match, phase: 'finished' }
  let remaining = [...match.remaining]
  const eligible = (p: Player) => p.id !== match.right.id && (difficulty !== 'easy' || p.value !== match.right.value)
  if (!remaining.some(eligible)) remaining = shuffle(pool.filter(eligible), random)
  const index = remaining.findIndex(eligible)
  const [right] = remaining.splice(index, 1)
  if (!right) throw new Error('다음 선수를 찾을 수 없습니다.')
  return { ...match, phase: 'guessing', left: match.right, right, remaining, correct: null, guess: null }
}

// Indicative EUR/KRW mid-market rate, fixed for reproducible rounds.
// Source: https://exchangerates.me/eur/krw, 2026-10-29 06:00 UTC.
export const EUR_TO_KRW = 1489.26
export function formatValue(value: number): string {
  const won = Math.round(value * 1_000_000 * EUR_TO_KRW)
  const n = new Intl.NumberFormat('ko-KR')
  if (won < 10_000) return `${n.format(won)}원`
  const man = Math.round(won / 10_000)
  const eok = Math.floor(man / 10_000)
  const rest = man % 10_000
  return `${eok ? `${n.format(eok)}억` : ''}${eok && rest ? ' ' : ''}${rest ? `${n.format(rest)}만` : ''} 원`
}
