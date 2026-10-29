import { useId, useState } from 'react'
import type { CSSProperties } from 'react'
import type { EditionId, Player } from './data'
import premierLogo from './assets/leagues/premier.png'
import laligaLogo from './assets/leagues/laliga.png'
import bundesligaLogo from './assets/leagues/bundesliga.png'
import serieaLogo from './assets/leagues/seriea.png'

export function Icon({ name, size = 22 }: { name: 'up' | 'down' | 'equal' | 'arrow' | 'trophy' | 'close' | 'check' | 'help' | 'repeat' | 'share' | 'grid' | 'ball'; size?: number }) {
  const paths: Record<typeof name, React.ReactNode> = {
    up: <><path d="m6 10 6-6 6 6M12 4v16" /></>,
    down: <><path d="m6 14 6 6 6-6M12 4v16" /></>,
    equal: <><path d="M5 8h14M5 16h14" /></>,
    arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
    trophy: <><path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm4 10v6m-4 2h8M8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-1.2.8-1.7 1.2-1.7 2.7m0 3.5h.01" /></>,
    repeat: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.3 8a7.5 7.5 0 0 1 12.5-3L20 8M4 16l2.2 3A7.5 7.5 0 0 0 18.7 16" /></>,
    share: <><path d="M12 16V3m-5 5 5-5 5 5M5 12H3v9h18v-9h-2" /></>,
    grid: <><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/></>,
    ball: <><circle cx="12" cy="12" r="9"/><path d="m12 7 5 4-2 6H9l-2-6 5-4Zm0 0V3m5 8 4-2m-6 8 2 3M9 17l-2 3M7 11 3 9"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export function Jersey({ player, className = '' }: { player: Player; className?: string }) {
  const id = useId().replaceAll(':', '')
  return <svg className={`jersey ${className}`} viewBox="0 0 300 320" fill="none" role="img" aria-label={`${player.name}의 선수 카드 장식 일러스트`}>
    <defs>
      <linearGradient id={`shade-${id}`} x1="60" y1="60" x2="240" y2="310" gradientUnits="userSpaceOnUse"><stop stopColor="white" stopOpacity=".18"/><stop offset=".5" stopColor="white" stopOpacity="0"/><stop offset="1" stopColor="#08141e" stopOpacity=".45"/></linearGradient>
      <filter id={`shadow-${id}`} x="-40%" y="-30%" width="180%" height="180%"><feDropShadow dx="0" dy="16" stdDeviation="13" floodColor="#08141e" floodOpacity=".25" /></filter>
      <clipPath id={`clip-${id}`}><path d="m102 38 27-10h42l27 10 62 42-30 57-31-17 8 167c-34 14-80 14-114 0l8-167-31 17-30-57 62-42Z"/></clipPath>
    </defs>
    <g filter={`url(#shadow-${id})`}>
      <path d="m102 38 27-10h42l27 10 62 42-30 57-31-17 8 167c-34 14-80 14-114 0l8-167-31 17-30-57 62-42Z" fill={player.shirt}/>
      <g clipPath={`url(#clip-${id})`}>
        <path d="M136 26h28v285h-28z" fill={player.accent} opacity=".9"/>
        <path d="m40 81 30 13 24-45M260 81l-30 13-24-45" stroke={player.accent} strokeWidth="8"/>
        <path d="M97 121c12 55 3 127-4 166m106-166c-12 55-3 127 4 166" stroke="#08141e" strokeOpacity=".12" strokeWidth="3"/>
        <path d="m90 274 16 5h88l16-5" stroke={player.accent} strokeWidth="3" opacity=".5"/>
        <path d="M35 15h240v300H35z" fill={`url(#shade-${id})`}/>
      </g>
      <path d="m129 28 21 19 21-19 10 5-19 27h-24l-19-27 10-5Z" fill={player.accent}/>
      <path d="m133 27 17 13 17-13h-34Z" fill="#182c36"/>
      <path d="M113 78h15v15l-7.5 5-7.5-5V78Z" fill={player.accent} opacity=".9"/>
      <text x="150" y="207" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="80" fontWeight="700" fill={player.accent} stroke={player.shirt} strokeWidth="1.5" paintOrder="stroke">{player.number || 'MV'}</text>
      <path d="m103 42 22 15m72-15-22 15" stroke="white" strokeOpacity=".15" strokeWidth="3"/>
    </g>
  </svg>
}

const leagueLogos: Partial<Record<EditionId, string>> = {
  premier: premierLogo,
  laliga: laligaLogo,
  bundesliga: bundesligaLogo,
  seriea: serieaLogo,
}

export function LeagueMark({ edition, mark, color }: { edition: EditionId; mark: string; color: string }) {
  const [failed, setFailed] = useState(false)
  const gradientId = `badge-${useId().replaceAll(':', '')}`
  const logo = leagueLogos[edition]
  return <span className={`league-mark ${logo ? 'official-mark' : 'custom-mark'}`} style={{ '--badge': color } as CSSProperties} aria-hidden="true">
    {logo && !failed ? <img src={logo} alt="" onError={() => setFailed(true)} /> : edition === 'world' ?
      <svg viewBox="0 0 64 64" fill="none"><defs><linearGradient id={gradientId} x1="6" y1="4" x2="59" y2="61"><stop stopColor="#66A7FF"/><stop offset="1" stopColor="#1554B9"/></linearGradient></defs><path d="M32 2.5 57 10v19.5c0 16-9.4 26.3-25 32C16.4 55.8 7 45.5 7 29.5V10L32 2.5Z" fill={`url(#${gradientId})`}/><path d="M32 8.5 51 14v15c0 11.6-6.8 19.9-19 24.9C19.8 48.9 13 40.6 13 29V14l19-5.5Z" stroke="#CDE2FF" strokeOpacity=".65"/><circle cx="32" cy="29" r="13.5" stroke="#fff" strokeWidth="1.7"/><ellipse cx="32" cy="29" rx="6" ry="13.5" stroke="#fff" strokeWidth="1.4"/><path d="M19 29h26M21.5 22h21M21.5 36h21" stroke="#fff" strokeWidth="1.4"/><path d="m32 43 2.3 2.1L32 48l-2.3-2.9L32 43Z" fill="#fff"/></svg>
      : edition === 'legends' ? <svg viewBox="0 0 64 64" fill="none"><defs><linearGradient id={gradientId} x1="7" y1="4" x2="56" y2="60"><stop stopColor="#31486C"/><stop offset="1" stopColor="#101E38"/></linearGradient></defs><path d="M32 2.5 57 10v19.5c0 16-9.4 26.3-25 32C16.4 55.8 7 45.5 7 29.5V10L32 2.5Z" fill={`url(#${gradientId})`}/><path d="M32 8.5 51 14v15c0 11.6-6.8 19.9-19 24.9C19.8 48.9 13 40.6 13 29V14l19-5.5Z" stroke="#E9C779"/><path d="m32 16 3.7 7.7 8.5 1.2-6.1 5.9 1.4 8.4L32 35.3l-7.5 3.9 1.4-8.4-6.1-5.9 8.5-1.2L32 16Z" fill="#E9C779"/><path d="M19 39c1.5 4.2 4.2 7 8 8.5M45 39c-1.5 4.2-4.2 7-8 8.5" stroke="#E9C779" strokeWidth="1.5" strokeLinecap="round"/><path d="m19 39-1-3m1 3 3-1m23 1 1-3m-1 3-3-1" stroke="#E9C779" strokeWidth="1.3" strokeLinecap="round"/></svg>
      : <svg viewBox="0 0 56 62" fill="none"><path d="M4 5 28 1l24 4v31c0 11-12 20-24 25C16 56 4 47 4 36V5Z" fill="currentColor"/><text x="28" y="36" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="700" fill="#152c34">{mark}</text></svg>}
  </span>
}
