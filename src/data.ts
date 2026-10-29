import captured from './captured-data.json' with { type: 'json' }
import localized from './player-names.json' with { type: 'json' }
import wikiNames from './wikidata-ko.json' with { type: 'json' }
import transliterations from './name-transliterations.json' with { type: 'json' }
export type LeagueId = 'premier' | 'laliga' | 'bundesliga' | 'seriea' | 'ligue1' | 'superlig' | 'championship'
export type EditionId = 'world' | LeagueId | 'legends' | 'worldcup'
export interface Player {
  id: string; name: string; latin: string; club: string; country: string
  league: LeagueId | 'legends'; value: number; shirt: string; accent: string; number: number
  sourceId: number; sourceImage: string; sourceClub: string; year?: number
}
export interface Edition { id: EditionId; name: string; subtitle: string; mark: string; color: string; tag?: string }
export const DATA_VERSION = 'transfermarkt-captured-2026-10-29'
export const DATA_LABEL = 'Transfermarkt 게임 데이터 · 2026.10.29 수집'
export const editions: Edition[] = [
  { id: 'world', name: '월드 클래스', subtitle: '세계 몸값 상위 250명', mark: 'WC', color: '#bce878', tag: '추천' },
  { id: 'premier', name: '프리미어리그', subtitle: '잉글랜드', mark: 'PL', color: '#cbb5ef' },
  { id: 'laliga', name: '라리가', subtitle: '스페인', mark: 'LL', color: '#f4a58e' },
  { id: 'bundesliga', name: '분데스리가', subtitle: '독일', mark: 'BL', color: '#ed9da4' },
  { id: 'seriea', name: '세리에 A', subtitle: '이탈리아', mark: 'SA', color: '#96c9e6' },
  { id: 'legends', name: '21세기 레전드', subtitle: '전성기 가치로 대결', mark: 'LG', color: '#dbca9a', tag: '스페셜' },
]
interface SourcePlayer { id: number; name: string; value: number; club: string; image: string; year?: number }
const translations = localized as Record<string, { id: string; name: string; number: number; shirt: string; accent: string }>
const koreanNames = wikiNames as Record<string, string>
const transliteratedNames = transliterations as Record<string, string>
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/gi,'').toLowerCase()
const byName = new Map(Object.entries(translations).map(([name,v]) => [normalize(name),v]))
const pools = new Map<EditionId, Player[]>()
for (const [edition, raw] of Object.entries(captured)) {
  pools.set(edition as EditionId, (raw as SourcePlayer[]).map(p => {
    const local = byName.get(normalize(p.name))
    return {
      id: `${edition}-${p.id}`, sourceId: p.id,
      name: local?.name ?? (/[가-힣]/.test(koreanNames[String(p.id)] ?? '') ? koreanNames[String(p.id)] : transliteratedNames[String(p.id)]) ?? p.name, latin: p.name,
      club: p.year ? `${p.year}년 전성기` : '', country: '',
      league: (edition === 'world' || edition === 'worldcup' ? 'premier' : edition) as Player['league'],
      value: p.value / 1_000_000,
      // Decorative kit, not a claim about the player's current shirt or squad number.
      shirt: '#e7e9e4', accent: '#a5b597', number: 0,
      sourceImage: p.image, sourceClub: p.club, year: p.year,
    }
  }))
}
export const players: Player[] = editions.flatMap(e => pools.get(e.id) ?? [])
export function getPool(edition: EditionId): Player[] { return [...(pools.get(edition) ?? [])] }
