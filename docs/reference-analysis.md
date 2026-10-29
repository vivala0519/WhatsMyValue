# REA MCP 공개 게임 조사

조사일: 2026-10-29 (Asia/Seoul).

## 직접 관찰

| 대상 | REA Evidence | 관찰 |
| --- | --- | --- |
| `https://www.transfermarkt.co.uk/whatsMyValue` | `ev_78caf1b01c81fcaceadcc03aaf100a730687d0e61ee7a3654457605e368d338c` | Edge 156, HTTP 403, CloudFront “Request blocked”. 실제 앱 DOM 없음. |
| `https://www.transfermarkt.com/whatsMyValue/index` | `ev_c9f95f2a4e9baf23015e0b44dce0bf8a0a4bcb6f1f9ec9d5a35cb8264148c923` | 동일하게 HTTP 403. |
| `http://127.0.0.1:5174/` | `ev_fd040fba35fc2dfe6d61404be55677ef45f88ff30c4575d8b3c03b073d021d89` | 시작 → 높다 선택 → 가치 공개 → 다음 라운드, 모든 단계 완료. 세루 기라시 €40M / 데클런 라이스 €110M에서 높다 정답 후 1점, 다음 기준 선수가 데클런 라이스로 이동. page-error 이벤트 0. |

도구: `mcp__rea__capture_browser_scenario`. 공개 URL 방문, DOM/접근성 트리/네트워크 상태를 관찰했습니다. 로그인·비공개 API 호출·접근 제한 우회는 수행하지 않았습니다.

## 공개 자료로 확인한 규칙

1. 첫 선수의 시장가치를 공개하고 다음 선수가 더 높은지 낮은지 선택.
2. 정답을 고르면 1점, 두 번째 선수가 기준 위치로 이동해 새로운 선수와 비교.
3. 오답이면 처음부터 다시 도전.
4. 어려움 모드는 높다/같다/낮다 세 가지 선택.
5. 레전드 모드는 전성기 시장가치를 비교.
6. 게임 색인에 리그 무대, 쉬움/어려움, 점수/최고기록, 결과/다시 시작/모드 변경 표시.

공식 출처:

- [게임 페이지의 공개 검색 색인](https://www.transfermarkt.com/whatsMyValue/index)
- [New LaLiga edition — 공식 기본 규칙](https://www.transfermarkt.com/new-laliga-edition-test-your-market-value-and-play-the-whats-my-value-game/view/news/361960)
- [The Premier League kicks off — 어려움 모드의 같은 가치 선택](https://www.transfermarkt.com/the-premier-league-kicks-off-test-your-market-value-knowledge-in-quot-whats-my-value-quot-/view/news/370383)
- [Ronaldinho or Kaká — 레전드 전성기 가치](https://www.transfermarkt.com/new-legends-edition-test-your-market-value-knowledge-in-the-quot-whats-my-value-quot-game/view/news/363448)

검색 색인은 과거 수집본일 수 있습니다. 이 자료는 현재 게임의 모든 동작을 관찰한 증거가 아닙니다.

## 미확인 사항과 구현 선택

원본의 실제 선수 풀, 가치 기준일, 랜덤 추출 방식, 가치 합계 산식, 로컬 저장 형식, 쉬움에서 동률을 처리하는 방식, 애니메이션 시간, 반응형 CSS, 원본 에셋은 미확인입니다.

로컬 구현은 별도의 예시 데이터, 쉬움 동률 양쪽 허용, 1.5초 공개, 덱 소진 시 재구성, 정답 선수 가치 누적, 무대·난이도별 로컬 기록을 사용합니다. 원본과의 동등성 검증 결과로 해석하면 안 됩니다.

REA가 반환한 브라우저는 시나리오 종료 시 도구가 소유한 프로세스를 정리했습니다. 활성 바이너리 분석 세션은 열지 않았습니다.
