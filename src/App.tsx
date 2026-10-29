import {useEffect, useRef, useState} from 'react'
import type {ReactNode} from 'react'
import {DATA_LABEL, editions, getPool, players} from './data'
import type {EditionId, Player} from './data'
import {advance, answer, formatValue, newMatch} from './game'
import type {Difficulty, Guess, Match} from './game'
import {readRecords, recordKey, writeRecords} from './storage'
import {Icon, Jersey, LeagueMark} from './Art'

function Modal({title, onClose, children}: { title: string; onClose: () => void; children: ReactNode }) {
    const ref = useRef<HTMLDialogElement>(null)
    useEffect(() => {
        const dialog = ref.current!
        dialog.showModal()
        return () => dialog.close()
    }, [])
    return <dialog className="modal" ref={ref} onCancel={onClose} onClick={e => {
        if (e.target === e.currentTarget) onClose()
    }}>
        <div className="modal-content">
            <div className="modal-heading"><h2>{title}</h2>
                <button className="icon-button" aria-label="닫기" onClick={onClose}><Icon name="close"/></button>
            </div>
            {children}</div>
    </dialog>
}

function PlayerCard({player, side, revealed, correct, preview = false}: {
    player: Player;
    side: 'left' | 'right';
    revealed: boolean;
    correct?: boolean | null;
    preview?: boolean
}) {
    return <article
        className={`player-card ${side} ${preview ? 'preview-card' : ''} ${revealed && side === 'right' ? (correct ? 'is-correct' : 'is-wrong') : ''}`}>
        <div className="card-grain" aria-hidden="true"/>
        <div className="card-top"><span
            className="card-label">{side === 'left' ? '기준 선수' : '도전 선수'}</span><span>{player.country}</span></div>
        <PlayerPhoto key={player.id} player={player}/>
        <div className="player-info"><p className="player-club">{player.club}</p><h2>{player.name}</h2><p
            className="player-latin">{player.latin}</p>
            <div className={`player-value ${revealed ? 'revealed' : 'hidden-value'}`}>
                <span>시장가치</span>
                <strong>{revealed ? formatValue(player.value) : <span aria-label="비공개">?</span>}</strong>
                {!preview && <small>{revealed ? '' : '더 높을까요, 더 낮을까요?'}</small>}
            </div>
        </div>
    </article>
}

function PlayerPhoto({player}: { player: Player }) {
    const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading')
    return <div className="shirt-stage">
        <span className="shirt-number" aria-hidden="true">MV</span>
        {state !== 'loaded' && <Jersey player={player}/>}
        {player.sourceImage && state !== 'failed' && <img
            className={`player-photo ${state === 'loaded' ? 'loaded' : ''}`}
            src={player.sourceImage}
            alt={`${player.name} 선수 사진`}
            referrerPolicy="no-referrer"
            onLoad={() => setState('loaded')}
            onError={() => setState('failed')}
        />}
    </div>
}

export default function App() {
    const [edition, setEdition] = useState<EditionId>('world')
    const [difficulty, setDifficulty] = useState<Difficulty>('easy')
    const [records, setRecords] = useState(readRecords)
    const [match, setMatch] = useState<Match | null>(null)
    const [modal, setModal] = useState<'help' | 'records' | 'exit' | null>(null)
    const [toast, setToast] = useState('')
    const [saveFailed, setSaveFailed] = useState(false)
    const [previousBest, setPreviousBest] = useState(0)
    const gameTitle = useRef<HTMLHeadingElement>(null)
    const finishedSaved = useRef(false)
    const currentEdition = editions.find(e => e.id === edition)!
    const best = records.best[recordKey(edition, difficulty)] ?? 0
    const allTimeBest = Math.max(0, ...Object.values(records.best))

    function start() {
        finishedSaved.current = false
        setPreviousBest(best)
        setMatch(newMatch(getPool(edition), Math.random, difficulty))
        setModal(null)
        window.scrollTo({top: 0, behavior: 'instant'})
    }

    function home() {
        setMatch(null);
        setModal(null);
        window.scrollTo({top: 0, behavior: 'instant'})
    }

    function guess(choice: Guess) {
        setMatch(m => m ? answer(m, choice, difficulty) : m)
    }

    useEffect(() => {
        if (match?.phase !== 'revealed' || modal) return
        const timer = window.setTimeout(() => setMatch(m => m ? advance(m, getPool(edition), Math.random, difficulty) : m), match.correct ? 4500 : 2700)
        return () => window.clearTimeout(timer)
    }, [match, edition, modal, difficulty])

    useEffect(() => {
        if (match?.phase !== 'finished' || finishedSaved.current) return
        finishedSaved.current = true
        const next = {
            best: {...records.best, [recordKey(edition, difficulty)]: Math.max(best, match.score)},
            history: [{
                edition,
                difficulty,
                score: match.score,
                totalValue: match.totalValue,
                date: new Date().toISOString()
            }, ...records.history].slice(0, 5),
        }
        setRecords(next)
        setSaveFailed(!writeRecords(next))
    }, [match, best, difficulty, edition, records])

    useEffect(() => {
        if (!match || modal || match.phase !== 'guessing') return

        function keydown(e: KeyboardEvent) {
            if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || (e.target instanceof HTMLElement && ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName))) return
            const choice = e.key === 'ArrowUp' ? 'higher' : e.key === 'ArrowDown' ? 'lower' : e.key === '=' ? 'equal' : null
            if (choice) {
                e.preventDefault();
                guess(choice)
            }
        }

        window.addEventListener('keydown', keydown)
        return () => window.removeEventListener('keydown', keydown)
    }, [match, difficulty, modal])

    useEffect(() => {
        if (!toast) return
        const timer = window.setTimeout(() => setToast(''), 3500)
        return () => window.clearTimeout(timer)
    }, [toast])
    const screen = match?.phase === 'finished' ? 'result' : match ? 'game' : 'home'
    useEffect(() => {
        if (screen !== 'home') gameTitle.current?.focus()
    }, [screen])

    async function share() {
        if (!match) return
        const text = `몸값 대결 | ${currentEdition.name} ${difficulty === 'easy' ? '쉬움' : '어려움'}에서 ${match.score}연속 정답! 내 축구 감각은 ${formatValue(match.totalValue)}.`
        try {
            if (navigator.share) await navigator.share({title: '몸값 대결', text})
            else if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                setToast('결과를 복사했어요. 친구에게 붙여넣어 보세요.')
            } else setToast(text)
        } catch (e) {
            if (!(e instanceof DOMException && e.name === 'AbortError')) setToast('공유를 완료하지 못했어요. 다시 시도해 주세요.')
        }
    }

    return <div className={`app screen-${screen}`}>
        <main className="shell">
            {screen === 'home' && <>
                <div className="masthead">
                    <div className="brand"><span className="brand-symbol"><Icon name="ball" size={25}/></span>축구 시장가치 퀴즈
                    </div>
                    <button className="record-button" onClick={() => setModal('records')}><Icon name="trophy"
                                                                                                size={18}/><span>내 최고기록</span><strong>{allTimeBest}</strong>
                    </button>
                </div>
                <section className="hero">
                    <div className="hero-copy"><h1>누가 더<br/> <span>비싸요?</span><span className="title-dot">.</span></h1>
                        <p className="hero-description">이름값 말고, 시장가치. <br/>두 선수 중 몸값이 더 높은 선수를 맞혀보세요.</p>
                        <button className="primary hero-start" onClick={start}>게임 시작하기<Icon name="arrow" size={20}/>
                        </button>
                        <span
                            className="hero-selected">{currentEdition.name} · {difficulty === 'easy' ? '쉬움' : '어려움'}</span>
                    </div>
                    <div className="hero-preview" aria-label="게임 예시: 라민 야말과 킬리안 음바페의 시장가치 비교">
                        <PlayerCard player={players.find(p => p.sourceId === 937958)!} side="left" revealed preview/>
                        <span className="preview-vs">VS</span>
                        <PlayerCard player={players.find(p => p.sourceId === 342229)!} side="right" revealed={false}
                                    preview/>
                        <span className="preview-sticker"><Icon name="up" size={17}/><span>당신의 선택은?</span><Icon
                            name="down" size={17}/></span>
                    </div>
                </section>
                <section className="edition-section" aria-labelledby="edition-title">
                    <div className="section-heading">
                        <div><p className="eyebrow muted">무대 선택</p><h2 id="edition-title">어느 리그에 자신 있나요?</h2></div>
                        <div className="difficulty-control" role="group" aria-label="난이도">
                            <button aria-pressed={difficulty === 'easy'} onClick={() => setDifficulty('easy')}>쉬움
                            </button>
                            <button aria-pressed={difficulty === 'hard'} onClick={() => setDifficulty('hard')}>어려움
                            </button>
                        </div>
                    </div>
                    <p className="difficulty-hint">{difficulty === 'easy' ? '높다 · 낮다 중 선택해요. 같은 몸값의 선수끼리는 출제하지 않아요.' : '높다 · 같다 · 낮다 중 선택해요. 같은 몸값도 정확히 맞혀야 해요.'}</p>
                    <div className="edition-grid">{editions.map(item => <button key={item.id}
                                                                                className={`edition-card ${edition === item.id ? 'selected' : ''}`}
                                                                                onClick={() => setEdition(item.id)}
                                                                                aria-pressed={edition === item.id}>
                        <LeagueMark edition={item.id} mark={item.mark} color={item.color}/><span
                        className="edition-info"><span className="edition-name">{item.name}{item.tag &&
                        <span className="edition-tag">{item.tag}</span>}</span><span
                        className="edition-meta">{item.subtitle} <span>· {getPool(item.id).length}명</span></span></span>
                        <span className="selection-indicator">{edition === item.id &&
                            <Icon name="check" size={16}/>}</span>
                    </button>)}</div>
                    <div className="edition-bottom"><p><span className="tiny-dot"/>선택한
                        무대 <strong>{currentEdition.name}</strong><span className="divider-text">/</span>최고 {best}점</p>
                        <button className="text-button" onClick={() => setModal('help')}><Icon name="help" size={18}/>게임
                            방법
                        </button>
                    </div>
                </section>
                <section className="how-strip" aria-label="게임 진행 방법">
                    <div><span>01</span><p>기준 선수의 <strong>몸값 확인</strong></p></div>
                    <Icon name="arrow" size={18}/>
                    <div><span>02</span><p>다음 선수의 <strong>몸값 예측</strong></p></div>
                    <Icon name="arrow" size={18}/>
                    <div><span>03</span><p>정답을 이어 <strong>기록 도전</strong></p></div>
                </section>
            </>}

            {screen === 'game' && match && <>
                <section className="game-heading">
                    <div><p className="eyebrow muted">{currentEdition.name} · {difficulty === 'easy' ? '쉬움' : '어려움'}</p>
                        <h1 tabIndex={-1} ref={gameTitle}>누가 더 비쌀까?</h1></div>
                    <div className="game-tools">
                        <button className="icon-button" aria-label="게임 방법" onClick={() => setModal('help')}><Icon
                            name="help"/></button>
                        <button className="icon-button" aria-label="게임 나가기" onClick={() => setModal('exit')}><Icon
                            name="close"/></button>
                    </div>
                </section>
                <div className="scoreboard">
                    <div className="current-score"><span>현재 점수</span><strong
                        aria-live="polite">{match.score.toString().padStart(2, '0')}</strong></div>
                    <div className="score-track" aria-hidden="true">{Array.from({length: 10}, (_, i) => <i key={i}
                                                                                                           className={i < match.score % 10 || match.score >= 10 ? 'filled' : ''}/>)}</div>
                    <div className="best-score"><Icon name="trophy"
                                                      size={18}/><span>최고기록</span><strong>{Math.max(best, match.score)}</strong>
                    </div>
                </div>
                <section className={`arena ${match.phase === 'revealed' ? 'show-answer' : ''}`} aria-label="시장가치 비교">
                    <PlayerCard key={`left-${match.left.id}`} player={match.left} side="left" revealed/>
                    <div className={`versus ${match.phase === 'revealed' ? match.correct ? 'correct' : 'wrong' : ''}`}
                         aria-hidden="true">{match.phase === 'revealed' ?
                        <Icon name={match.correct ? 'check' : 'close'} size={28}/> : 'VS'}</div>
                    <PlayerCard key={`right-${match.right.id}`} player={match.right} side="right"
                                revealed={match.phase !== 'guessing'} correct={match.correct}/>
                </section>
                <section className="answer-panel"><p className="question"
                                                     aria-live="polite">{match.phase === 'revealed' ? match.correct ? '정답이에요! 다음 선수와 대결합니다.' : `아쉬워요! ${match.right.name}의 몸값은 ${formatValue(match.right.value)}예요.` : <>
                    <strong>{match.right.name}</strong>의 시장가치는 <strong>{match.left.name}</strong>보다…</>}</p>
                    <div className={`answer-buttons ${difficulty === 'hard' ? 'hard' : ''}`}>
                        <button className="guess higher" disabled={match.phase !== 'guessing'}
                                onClick={() => guess('higher')}><Icon name="up"/><span>더 높다</span><kbd><Icon name="up"
                                                                                                             size={13}/></kbd>
                        </button>
                        {difficulty === 'hard' && <button className="guess equal" disabled={match.phase !== 'guessing'}
                                                          onClick={() => guess('equal')}><Icon
                            name="equal"/><span>같다</span><kbd aria-hidden="true">=</kbd></button>}
                        <button className="guess lower" disabled={match.phase !== 'guessing'}
                                onClick={() => guess('lower')}><Icon name="down"/><span>더 낮다</span><kbd><Icon
                            name="down" size={13}/></kbd></button>
                    </div>
                    {match.phase === 'revealed' ?
                        <div className="round-loading" role="status"><span className="round-spinner"
                                                                           aria-hidden="true"/><span>{match.correct ? '다음 선수를 준비하고 있어요' : '결과를 준비하고 있어요'}</span>
                        </div> :
                        <p className="answer-hint">{difficulty === 'easy' ? '쉬움 모드에서는 서로 다른 몸값의 선수를 비교해요.' : '몸값이 같다면 ‘같다’를 선택해야 정답이에요.'}</p>}
                </section>
            </>}

            {screen === 'result' && match && <section className="result-screen">
                <div className="result-top"><span className="brand"><span className="brand-symbol"><Icon name="ball"
                                                                                                         size={24}/></span>몸값 대결</span>
                    <button className="icon-button" aria-label="무대 선택으로" onClick={home}><Icon name="close"/></button>
                </div>
                <div className="result-card">
                    <div className="result-trophy"><Icon name="trophy" size={42}/></div>
                    <p className="eyebrow">{match.score > previousBest ? '새로운 최고기록' : '오늘의 축구 감각'}</p><h1 tabIndex={-1}
                                                                                                          ref={gameTitle}>{match.score >= 10 ? '스카우터의 눈을 가졌네요.' : match.score >= 3 ? '축구 좀 보셨는데요?' : '다음 대결이 기다리고 있어요.'}</h1>
                    <p className="result-edition">{currentEdition.name} · {difficulty === 'easy' ? '쉬움' : '어려움'}</p>
                    <div className="result-number"><strong>{match.score}</strong><span>연속 정답</span></div>
                    <div className="result-stats">
                        <div><span>나의 최고기록</span><strong>{Math.max(best, match.score)}점</strong></div>
                        <div><span>내 시장가치</span><strong>{formatValue(match.totalValue)}</strong></div>
                    </div>
                    <div className="last-answer"><span>마지막 대결</span>
                        <p>{match.left.name}<strong>{formatValue(match.left.value)}</strong></p><span
                            className="last-versus">VS</span>
                        <p>{match.right.name}<strong>{formatValue(match.right.value)}</strong></p></div>
                    <div className="result-actions">
                        <button className="primary" onClick={start}><Icon name="repeat" size={20}/>다시 도전하기</button>
                        <button className="secondary" onClick={home}><Icon name="grid" size={18}/>다른 무대 고르기</button>
                        <button className="text-button share-button" onClick={share}><Icon name="share" size={18}/>결과
                            공유하기
                        </button>
                    </div>
                    {saveFailed && <p className="storage-warning" role="status">브라우저 저장소를 사용할 수 없어 새로고침하면 기록이 사라져요.</p>}
                </div>
            </section>}
            <footer className="footer"></footer>
        </main>

        {modal === 'help' && <Modal title="게임 방법" onClose={() => setModal(null)}>
            <div className="help-intro"><Icon name="ball" size={32}/><p>당신의 축구 지식,<br/><strong>몸값으로 증명해 보세요.</strong>
            </p></div>
            <ol className="help-steps">
                <li><strong>두 선수를 비교하세요</strong><p>왼쪽에 있는 기준 선수의 시장가치를 확인하세요.</p></li>
                <li><strong>더 높다? 더 낮다?</strong><p>오른쪽 선수의 시장가치를 예측해 선택하세요. 정답을 맞히면 1점이 올라가요.</p></li>
                <li><strong>정답 행진을 이어가세요</strong><p>오른쪽 선수가 다음 기준 선수가 돼요. 오답이면 게임이 끝나고 다시 도전할 수 있어요.</p></li>
            </ol>
            <div className="help-note"><strong>쉬움과 어려움의 차이</strong><p>쉬움: ‘높다’와 ‘낮다’ 중 선택. 같은 몸값끼리는 출제하지 않아요.</p><p>어려움:
                ‘높다’, ‘같다’, ‘낮다’ 중 정확히 선택.</p></div>
            <p className="help-data">2026년 여름 이적시장 이후 수집한 시장가치를 사용해요.</p><p className="help-data">레전드 무대는 전성기 가치를
            비교해요.</p>
            <p className="help-data">1유로 = 1,489.26원 고정 환율로 환산해요</p>
            <button className="primary" onClick={() => setModal(null)}>알겠어요</button>
        </Modal>}
        {modal === 'records' && <Modal title="나의 기록" onClose={() => setModal(null)}>
            <div className="record-summary"><Icon name="trophy"
                                                  size={36}/><span>전체 최고기록</span><strong>{allTimeBest}<small>점</small></strong>
            </div>
            <h3>무대별 최고기록</h3>
            <div className="records-table">
                <div className="records-table-head"><span>무대</span><span>쉬움</span><span>어려움</span></div>
                {editions.map(e => <div key={e.id}>
                    <span>{e.name}</span><strong>{records.best[recordKey(e.id, 'easy')] ?? '—'}</strong><strong>{records.best[recordKey(e.id, 'hard')] ?? '—'}</strong>
                </div>)}</div>
            {records.history.length > 0 && <><h3>최근 대결</h3>
                <div className="recent-list" style={{ paddingBottom: "10px" }}>{records.history.map((r, i) => <div key={`${r.date}-${i}`}>
                    <span>{editions.find(e => e.id === r.edition)?.name}<small>{r.difficulty === 'easy' ? '쉬움' : '어려움'} · {new Date(r.date).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric'
                    })}</small></span><strong>{r.score}점</strong></div>)}</div>
            </>}
            <button className="primary" onClick={() => setModal(null)}>계속하기</button>
        </Modal>}
        {modal === 'exit' &&
            <Modal title="무대 선택으로 돌아갈까요?" onClose={() => setModal(null)}><p className="exit-description">진행
                중인 {match?.score}점 대결은 종료돼요. 완료한 대결의 최고기록은 유지돼요.</p>
                <div className="exit-actions">
                    <button className="primary" onClick={() => setModal(null)}>계속 대결하기</button>
                    <button className="secondary" onClick={home}>무대 선택으로</button>
                </div>
            </Modal>}
        {toast && <div className="toast" role="status">{toast}</div>}
    </div>
}
