# 몸값 대결 — 한국어 축구 시장가치 퀴즈

React + TypeScript + Vite 게임입니다. REA MCP로 사용자의 조사용 Chrome에 연결해 Transfermarkt 공개 게임의 실제 선수 데이터와 규칙을 확인했습니다.

## 실행

Node.js 24 이상에서:

```sh
npm install
npm run dev
```

미리보기: http://127.0.0.1:5174

```sh
npm run build
npm test
npm run test:e2e
```

브라우저 테스트는 Windows 기본 Edge 경로를 사용합니다. 다른 환경에서는 BROWSER_PATH를 설정하세요.

## 데이터

2026-10-29 수집한 원본 게임 데이터입니다. 월드 클래스와 4개 리그는 각각 250명, 레전드는 170명입니다. 같은 선수의 무대 간 중복이 있습니다. 튀르키예, 프랑스, 챔피언십 리그는 선택 화면에서 제외했습니다.

- 공개 원본 응답: docs/evidence/transfermarkt-source.json, source-*.json
- 앱용 데이터: src/captured-data.json
- 한국어 이름 대응표: src/player-names.json, src/wikidata-ko.json, src/name-transliterations.json
- 원본 점수 환산표: src/captured-score.json
- 출처·증거·검증 범위: [실제 브라우저 조사](docs/live-data-capture.md)

원자료의 유로 값으로 판정하며 화면에는 원화로 환산해 표시합니다. 고정 환율은 2026-10-29 06:00 UTC 중간시장 기준 1유로당 1,489.26원입니다. 데이터와 환율은 자동으로 갱신되지 않습니다.

선수 이름은 기존 한국어 이름표, 위키데이터 P2446(Transfermarkt 선수 ID)의 한국어 라벨, 별도로 작성한 음역표를 사용합니다. 현재 선택할 수 있는 무대의 고유 선수 1,203명을 모두 한글로 표시합니다. 음역표의 일부 이름은 통용 표기와 다를 수 있으며 src/name-transliterations.txt와 대응 JSON에서 수정할 수 있습니다. 위키데이터 수집 스크립트는 scripts/fetch-korean-names.ps1입니다.

## 게임

쉬움은 높다/낮다를 선택하며 같은 가치끼리는 출제하지 않습니다. 어려움은 높다/같다/낮다를 선택합니다. 정답 후 4.5초에 다음 선수로, 오답 후 2.7초에 결과 화면으로 이동합니다. 결과의 내 시장가치는 원본 점수표로 계산합니다.

무대·난이도별 최고기록과 최근 대결은 현재 브라우저에 저장됩니다. 예시 데이터 시절의 기록과 섞이지 않도록 별도 저장 키를 사용합니다. 키보드 위/아래 방향키 및 =, 결과 공유, 저장소 오류 처리와 모바일 레이아웃을 지원합니다.

화면은 파란색 디자인으로, 원본 데이터의 외부 선수 사진 URL을 표시합니다. 사진이 로드되지 않을 때는 SVG 유니폼을 대신 보여줍니다. 리그 엠블럼은 원본 게임 이미지를 `src/assets/leagues/`에 저장해 사용하며, 월드 클래스·레전드 엠블럼은 자체 SVG로 그렸습니다. 원본 애니메이션과 최근 25명 제외 추출 방식까지 동일하게 구현한 것은 아닙니다.

## 구조

- src/data.ts: 수집 데이터의 앱 모델 변환, 무대 정의
- src/game.ts: 게임 판정·진행·점수 환산
- src/App.tsx: 무대 선택·대결·결과·기록
- src/storage.ts: 기록 검증·저장
- src/Art.tsx, src/styles.css: 벡터 그림·화면 스타일
- tests/, e2e/: 데이터 일치·규칙·브라우저 테스트

scripts/import-captured-data.mjs는 REA로 확보한 응답과 artifacts/original-bundle.js의 리터럴을 앱 데이터로 변환하는 로컬 도구입니다. 번들 파일은 조사 산출물로 Git에서 제외돼 있습니다.

초기 403 조사 내용은 docs/reference-analysis.md에 남아 있으며, 현재 확인 결과는 docs/live-data-capture.md를 기준으로 합니다. 로컬 Vite 프로젝트이며 호스팅 배포나 앱인토스 등록은 하지 않았습니다.
