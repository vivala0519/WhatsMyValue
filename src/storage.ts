import { editions } from './data'
import type { EditionId } from './data'
import type { Difficulty } from './game'
export const STORAGE_KEY = 'wmv-ko.records.tm-20261029'
export interface GameRecord { edition: EditionId; difficulty: Difficulty; score: number; totalValue: number; date: string }
export interface Records { best: Record<string, number>; history: GameRecord[] }
export function recordKey(edition: EditionId, difficulty: Difficulty) { return `${edition}:${difficulty}` }
export function readRecords(): Records {
  const empty: Records = { best: {}, history: [] }
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (!raw || typeof raw !== 'object') return empty
    const data = raw as Record<string, unknown>
    const validNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0
    const best: Record<string, number> = {}
    if (data.best && typeof data.best === 'object') for (const [key, value] of Object.entries(data.best)) {
      if (editions.some(e => ['easy', 'hard'].some(d => key === recordKey(e.id, d as Difficulty))) && validNumber(value) && Number.isInteger(value)) best[key] = value
    }
    const history: GameRecord[] = Array.isArray(data.history) ? data.history.filter((r): r is GameRecord =>
      r && typeof r === 'object' && editions.some(e => e.id === r.edition) && ['easy','hard'].includes(r.difficulty) &&
      validNumber(r.score) && Number.isInteger(r.score) && validNumber(r.totalValue) && typeof r.date === 'string' && Number.isFinite(Date.parse(r.date)),
    ).slice(0, 5) : []
    return { best, history }
  } catch { return empty }
}
export function writeRecords(records: Records): boolean {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); return true } catch { return false }
}
