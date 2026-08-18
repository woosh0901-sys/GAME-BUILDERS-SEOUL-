"use strict";

const SAVE_KEY = "steam-and-ledger-save-v2";
const MAX_ROUNDS = 10;
const ERA_END_ROUNDS = [5, 10];
const PLAYER_IDS = ["human", "morrow", "aurel"];

const PLAYER_DEFS = {
  human: { name: "청람 산업사", short: "나", color: "#3c99a1", className: "human" },
  morrow: { name: "메로우 상회", short: "M", color: "#b6544d", className: "morrow" },
  aurel: { name: "오렐 공업회", short: "A", color: "#c49a46", className: "aurel" },
};

const INDUSTRIES = {
  power: { name: "동력소", icon: "●", cost: 5, produces: "fuel", baseStock: 2, score: 2, income: 1, description: "연료를 생산합니다. 전량 소비되면 뒤집혀 시대마다 점수를 냅니다." },
  machine: { name: "기계소", icon: "◆", cost: 6, produces: "machine", baseStock: 2, needs: ["fuel"], score: 3, income: 1, description: "기계를 생산합니다. 기술 개발과 정밀 산업에 꼭 필요합니다." },
  textile: { name: "직물공방", icon: "◇", cost: 8, saleable: true, baseStock: 1, needs: ["fuel"], score: 4, income: 2, description: "직물 주문을 생산합니다. 항구에 판매해야 뒤집힙니다." },
  goods: { name: "정밀제작소", icon: "✦", cost: 10, saleable: true, baseStock: 1, needs: ["fuel", "machine"], score: 6, income: 2, description: "비싼 정밀품을 생산합니다. 판매 보상과 시대 점수가 큽니다." },
  warehouse: { name: "물류창고", icon: "▣", cost: 7, produces: "cargo", baseStock: 2, needs: ["machine"], score: 3, income: 1, description: "판매에 필요한 화물 허가를 공급합니다. 모든 회사가 공유합니다." },
};

const CITIES = {
  lumen: { name: "루멘항", x: 12, y: 51, description: "서부 수로의 관문. 직물과 정밀품을 모두 매입합니다.", slots: [["power", "warehouse"], ["textile", "warehouse"], ["machine", "goods"]] },
  vale: { name: "베일 교차로", x: 29, y: 28, description: "북부와 서부가 만나는 핵심 운송 도시.", slots: [["power", "machine"], ["textile", "warehouse"], ["machine", "goods"]] },
  arco: { name: "아르코", x: 49, y: 14, description: "정밀 공구로 이름난 북부의 장인 도시.", slots: [["machine"], ["goods", "machine"], ["warehouse", "textile"]] },
  iron: { name: "아이언브룩", x: 68, y: 29, description: "거대한 수차가 돌아가는 원료 산업 도시.", slots: [["power"], ["machine"], ["power", "goods"]] },
  silva: { name: "실바턴", x: 47, y: 49, description: "모든 회사가 노리는 아르델 중앙의 산업 부지.", slots: [["textile", "machine"], ["warehouse", "goods"], ["power", "machine"]] },
  glass: { name: "글라스미어", x: 76, y: 57, description: "동부 호수 항구. 정밀품 주문이 특히 많습니다.", slots: [["warehouse"], ["goods", "warehouse"], ["machine", "textile"]] },
  copper: { name: "코퍼힐", x: 29, y: 73, description: "광산과 제련 작업장이 모인 남서부 언덕.", slots: [["power", "machine"], ["machine"], ["textile", "power"]] },
  rowan: { name: "로언필드", x: 54, y: 79, description: "값싼 토지로 제작업체가 몰려드는 신흥 도시.", slots: [["textile"], ["power", "machine"], ["warehouse", "goods"]] },
  nova: { name: "노바 부두", x: 89, y: 33, description: "해외 주문이 기다리는 동부의 대항구.", slots: [["warehouse"], ["warehouse", "textile"], ["machine", "goods"]] },
};

const MERCHANT_DEFS = {
  lumen: { accepts: ["textile", "goods"], bonus: 1 },
  glass: { accepts: ["goods"], bonus: 2 },
  nova: { accepts: ["textile", "goods"], bonus: 1 },
};

const ROUTES = [
  ["lumen", "vale"], ["lumen", "copper"], ["vale", "arco"], ["vale", "silva"],
  ["vale", "copper"], ["arco", "iron"], ["arco", "silva"], ["iron", "nova"],
  ["iron", "glass"], ["iron", "silva"], ["silva", "glass"], ["silva", "rowan"],
  ["silva", "copper"], ["copper", "rowan"], ["rowan", "glass"], ["glass", "nova"],
].map(([a, b]) => ({ id: `${a}-${b}`, a, b }));

const HELP = {
  cash: { icon: "₡", title: "현금", text: "건설과 개발에 사용합니다. 이번 라운드에 쓴 현금이 적을수록 다음 라운드 턴이 빨라집니다." },
  income: { icon: "+", title: "수입", text: "라운드 끝에 받는 현금입니다. 산업을 뒤집으면 오르고, 대출을 받으면 3칸 내려갑니다." },
  fame: { icon: "★", title: "명성", text: "승리 점수입니다. 각 시대 끝에 뒤집힌 산업과 운송로를 채점해 얻습니다." },
  fuel: { icon: "●", title: "연료 시장", text: "연결된 동력소에서 먼저 가져오며, 없으면 변동 가격 시장에서 삽니다. 시장 재고가 적을수록 비쌉니다." },
  machine: { icon: "◆", title: "기계 시장", text: "연결된 기계소에서 먼저 가져오며, 없으면 변동 가격 시장에서 삽니다. 기술 개발에도 사용됩니다." },
  cargo: { icon: "▣", title: "화물 허가", text: "직물이나 정밀품을 한 번 판매할 때 1개가 필요합니다. 연결된 물류창고 또는 해당 항구의 무료 허가를 씁니다." },
};

const RULE_PAGES = [
  {
    tab: "목표·구성", icon: "★", eyebrow: "01 · OBJECTIVE", title: "두 시대의 산업 장부에서 가장 많은 명성을 남기세요",
    lead: "당신은 청람 산업사를 운영하고 두 AI 회사와 도시 부지, 운송로, 공동 자원을 놓고 경쟁합니다. 이 버전은 산업 네트워크 게임의 핵심 흐름을 웹 1인용에 맞게 재구성했습니다.",
    body: `<div class="rule-grid"><div class="rule-card"><span>플레이 인원</span><strong>인간 1명 + AI 2명</strong><p>메로우는 판매를, 오렐은 자원과 운송망을 선호하지만 항상 가능한 행동을 다시 계산합니다.</p></div><div class="rule-card"><span>게임 길이</span><strong>수로기 5R + 철도기 5R</strong><p>수로기 첫 라운드만 회사마다 1행동, 나머지는 2행동입니다.</p></div><div class="rule-card wide"><span>승리 조건</span><strong>두 시대 결산 명성의 합</strong><p>시대마다 <b>뒤집힌 산업 타일</b>과 <b>운송로</b>를 채점합니다. 마지막에 현금 ₡10당 1점을 더해 가장 높은 회사가 승리합니다.</p></div></div>`,
  },
  {
    tab: "카드·행동", icon: "▤", eyebrow: "02 · HAND OF CARDS", title: "모든 행동은 손의 카드 1장을 버리며 시작합니다",
    lead: "각 시대에 카드 8장을 받고 행동 뒤 다시 8장까지 보충합니다. 덱이 떨어지면 남은 손패만 사용합니다. 화면 아래에서 카드를 먼저 고르세요.",
    body: `<div class="rule-grid"><div class="rule-card"><span>도시 카드</span><strong>해당 도시 건설</strong><p>카드에 적힌 도시의 빈 부지에 허용된 산업을 건설합니다.</p></div><div class="rule-card"><span>산업 카드</span><strong>해당 산업 건설</strong><p>내 연결망 안의 어느 도시든 카드에 적힌 산업을 건설합니다.</p></div><div class="rule-card"><span>그 밖의 행동</span><strong>아무 카드나 1장</strong><p>운송로, 판매, 개발, 대출은 선택한 카드 종류와 상관없이 버립니다.</p></div><div class="rule-card"><span>정찰</span><strong>카드 3장 → 만능 카드 2장</strong><p>선택 카드와 추가 2장을 버리고 만능 도시·산업 카드를 받습니다. 행동 1회를 씁니다.</p></div></div>`,
  },
  {
    tab: "라운드·순서", icon: "Ⅱ", eyebrow: "03 · TURN ORDER", title: "이번에 적게 쓴 회사가 다음 라운드에 먼저 움직입니다",
    lead: "현재 턴 순서대로 각 회사가 자신의 행동을 모두 수행합니다. AI가 당신보다 앞선 순서라면 먼저 움직이는 과정을 화면에서 공개합니다.",
    body: `<div class="rule-grid"><div class="rule-card"><span>1. 회사 턴</span><strong>첫 수로 라운드 1행동, 이후 2행동</strong><p>행동을 남기고 턴을 끝낼 수 있지만 카드는 보충되지 않습니다.</p></div><div class="rule-card"><span>2. 지출 비교</span><strong>현금 지출 오름차순</strong><p>건설·시장 구매·개발에 쓴 돈을 비교합니다. 동률이면 기존 상대 순서를 유지합니다.</p></div><div class="rule-card"><span>3. 수입</span><strong>각 회사가 수입만큼 현금 획득</strong><p>수입은 음수가 될 수 있지만 이 웹 버전에서는 현금이 0 아래로 내려가지는 않습니다.</p></div><div class="rule-card"><span>4. 다음 라운드</span><strong>지출을 0으로 초기화</strong><p>새 순서의 첫 회사부터 다시 행동합니다.</p></div></div>`,
  },
  {
    tab: "산업", icon: "⚙", eyebrow: "04 · INDUSTRIES", title: "자원 산업은 소진하고, 상품 산업은 판매해서 뒤집습니다",
    lead: "뒤집힌 산업만 시대 결산 점수를 냅니다. 높은 단계 산업은 건설비가 조금 늘지만 생산량, 수입, 점수가 더 큽니다.",
    body: `<div class="industry-flow"><div class="flow-item"><i>●</i><strong>동력소</strong><small>연료</small></div><span class="flow-arrow">→</span><div class="flow-item"><i>◆</i><strong>기계소</strong><small>기계</small></div><span class="flow-arrow">→</span><div class="flow-item"><i>◇</i><strong>직물공방</strong><small>판매</small></div><span class="flow-arrow">/</span><div class="flow-item"><i>✦</i><strong>정밀제작소</strong><small>고득점 판매</small></div><span class="flow-arrow">←</span><div class="flow-item"><i>▣</i><strong>물류창고</strong><small>화물 허가</small></div></div><div class="rule-grid"><div class="rule-card"><span>자원 산업</span><strong>마지막 자원이 사용되면 뒤집기</strong><p>소유 회사의 수입이 오릅니다. 경쟁사가 마지막 자원을 써도 소유자가 보상받습니다.</p></div><div class="rule-card"><span>상품 산업</span><strong>항구에 판매하면 뒤집기</strong><p>직물·정밀품은 연결된 항구와 화물 허가가 있어야 판매할 수 있습니다.</p></div></div>`,
  },
  {
    tab: "연결·시장", icon: "⌁", eyebrow: "05 · NETWORK & MARKET", title: "경쟁사의 길과 자원도 이용할 수 있습니다",
    lead: "지도에 놓인 어느 회사의 운송로든 자원 운송과 상품 판매에 사용할 수 있습니다. 공급 시설이 목적지와 이어져 있어야 합니다.",
    body: `<div class="rule-grid"><div class="rule-card"><span>공동 자원</span><strong>연결된 공급원 우선</strong><p>연료·기계·화물은 소유자와 관계없이 사용합니다. 소진 보상은 공급 시설 소유자에게 갑니다.</p></div><div class="rule-card"><span>변동 시장</span><strong>재고가 줄수록 ₡2 → ₡6</strong><p>연료나 기계 공급원이 없으면 거래소에서 자동 구매합니다. 재고 0이면 그 자원을 요구하는 행동을 할 수 없습니다.</p></div><div class="rule-card"><span>수로</span><strong>₡3 · 수로기에만 건설</strong><p>자신의 산업이나 운송로가 닿은 경로에 놓습니다.</p></div><div class="rule-card"><span>철도</span><strong>₡5 + 연료 1</strong><p>철도기에 건설합니다. 두 시대 끝에 모든 운송로는 점수화 후 제거됩니다.</p></div></div>`,
  },
  {
    tab: "6가지 행동", icon: "⌂", eyebrow: "06 · SIX ACTIONS", title: "건설·운송·판매·개발·대출·정찰 중 선택하세요",
    lead: "모든 행동은 카드 1장과 행동 1회를 씁니다. 오른쪽 투자 사무실은 현재 불가능한 이유와 최종 비용을 미리 보여줍니다.",
    body: `<div class="rule-grid"><div class="rule-card"><span>건설</span><strong>카드와 부지가 모두 일치</strong><p>비용과 필요 자원을 내고 현재 기술 단계 산업을 놓습니다.</p></div><div class="rule-card"><span>운송로</span><strong>내 망에 닿은 빈 경로</strong><p>수로 또는 철도를 놓아 도시를 연결합니다.</p></div><div class="rule-card"><span>판매</span><strong>상품 + 항구 + 화물 허가</strong><p>상품 산업을 뒤집고 현금과 수입을 얻습니다.</p></div><div class="rule-card"><span>개발</span><strong>₡4 + 기계 1</strong><p>선택 산업의 가장 낮은 타일을 제거해 다음 건물을 한 단계 높입니다.</p></div><div class="rule-card"><span>대출</span><strong>현금 +₡18 · 수입 -3</strong><p>쓴 돈으로 계산하지 않으므로 턴 순서가 느려지지 않습니다.</p></div><div class="rule-card"><span>정찰</span><strong>손패 교정</strong><p>카드 3장을 만능 도시·산업 카드 2장으로 바꿉니다.</p></div></div>`,
  },
  {
    tab: "시대 결산", icon: "⌛", eyebrow: "07 · ERA SCORING", title: "5라운드와 10라운드 끝에 지도를 결산합니다",
    lead: "수로기 결산은 중간 점수이자 지도 정리입니다. 철도기 결산 뒤에는 현금 보너스를 포함해 최종 순위를 정합니다.",
    body: `<div class="rule-grid"><div class="rule-card"><span>산업 점수</span><strong>뒤집힌 산업의 단계·종류별 명성</strong><p>뒤집히지 않은 산업은 점수가 없습니다. 수로기에 남은 고단계 산업은 철도기에도 다시 뒤집힌 상태로 점수화될 수 있습니다.</p></div><div class="rule-card"><span>운송로 점수</span><strong>양 끝 도시의 뒤집힌 산업 + 항구</strong><p>각 운송로는 인접 도시의 활성 산업 수와 항구 문장 수만큼 점수를 냅니다.</p></div><div class="rule-card"><span>수로기 정리</span><strong>수로와 1단계 산업 제거</strong><p>2단계 이상 산업은 지도에 남습니다. 시장과 항구 허가를 다시 채우고 철도기 카드를 새로 받습니다.</p></div><div class="rule-card"><span>철도기 정리</span><strong>최종 현금 보너스</strong><p>두 번째 시대 점수 뒤 현금 ₡10당 1점을 더합니다.</p></div></div>`,
  },
  {
    tab: "첫 게임", icon: "▶", eyebrow: "08 · FIRST GAME", title: "첫 수로는 공급 시설과 판매 항구를 잇는 방향으로 놓으세요",
    lead: "카드가 계획을 제한하지만 막히게 만들지는 않습니다. 산업 카드로 연결망 안을 확장하고, 도시 카드로 멀리 떨어진 새 거점을 열 수 있습니다.",
    body: `<div class="rule-grid"><div class="rule-card"><span>추천 첫 행동</span><strong>동력소 또는 기계소</strong><p>자원을 남겨 두면 AI가 소비해도 당신의 산업이 뒤집혀 수입과 점수를 얻습니다.</p></div><div class="rule-card"><span>판매 준비</span><strong>직물공방 + 항구 연결 + 화물</strong><p>루멘항·글라스미어·노바 부두의 주문 종류를 확인하세요.</p></div><div class="rule-card"><span>AI 읽기</span><strong>경쟁사 동향과 산업 연보</strong><p>AI가 버린 카드, 쓴 돈, 건설 장소와 결과가 모두 기록됩니다.</p></div><div class="rule-card"><span>중요</span><strong>원작의 완전한 디지털 복제는 아닙니다</strong><p>가상 지도와 독자 산업·수치를 사용하며, 1인 웹 플레이에 맞춰 자원 시장과 시대 길이를 조정했습니다.</p></div></div>`,
  },
];

let state = null;
let locked = true;
let rulePageIndex = 0;
let rulebookOpenedFromStart = true;

const dom = {
  era: document.querySelector("#era-label"), round: document.querySelector("#round-value"), eraProgress: document.querySelector("#era-progress"),
  cash: document.querySelector("#cash-value"), income: document.querySelector("#income-value"), fame: document.querySelector("#fame-value"), actions: document.querySelector("#actions-value"), actionLimit: document.querySelector("#action-limit"),
  standings: document.querySelector("#standings"), aiStatusTitle: document.querySelector("#ai-status-title"), aiStatusDetail: document.querySelector("#ai-status-detail"), aiDesk: document.querySelector(".ai-desk"),
  tutorialTitle: document.querySelector("#tutorial-title"), tutorialText: document.querySelector("#tutorial-text"), advance: document.querySelector("#advance-turn"), advanceLabel: document.querySelector("#advance-turn-label"), advanceHint: document.querySelector("#advance-turn-hint"),
  cityLayer: document.querySelector("#city-layer"), routeLayer: document.querySelector("#route-layer"), modePrompt: document.querySelector("#mode-prompt"), inspector: document.querySelector("#inspector-content"), technology: document.querySelector("#technology-list"), hand: document.querySelector("#hand-list"), handCount: document.querySelector("#hand-count"), deckCount: document.querySelector("#deck-count"),
  fuelTotal: document.querySelector("#fuel-total"), fuelSources: document.querySelector("#fuel-sources"), machineTotal: document.querySelector("#machine-total"), machineSources: document.querySelector("#machine-sources"), cargoTotal: document.querySelector("#cargo-total"), cargoSources: document.querySelector("#cargo-sources"), contracts: document.querySelector("#contract-list"), history: document.querySelector("#history-list"),
  startModal: document.querySelector("#start-modal"), startMenuView: document.querySelector("#start-menu-view"), setupView: document.querySelector("#setup-view"), openSetup: document.querySelector("#open-setup"), backToMenu: document.querySelector("#back-to-menu"), startGame: document.querySelector("#start-game"), continueGame: document.querySelector("#continue-game"), newGame: document.querySelector("#new-game"),
  rulebookModal: document.querySelector("#rulebook-modal"), openRulebook: document.querySelector("#open-rulebook"), rulesButton: document.querySelector("#rules-button"), closeRulebook: document.querySelector("#close-rulebook"), rulebookTabs: document.querySelector("#rulebook-tabs"), rulebookPage: document.querySelector("#rulebook-page"), rulePrev: document.querySelector("#rule-prev"), ruleNext: document.querySelector("#rule-next"), rulePageNumber: document.querySelector("#rule-page-number"), ruleProgress: document.querySelector("#rule-progress-fill"), rulebookStart: document.querySelector("#rulebook-start"),
  resultModal: document.querySelector("#result-modal"), resultTitle: document.querySelector("#result-title"), resultDescription: document.querySelector("#result-description"), resultEmblem: document.querySelector("#result-emblem"), finalRanking: document.querySelector("#final-ranking"), resultQuote: document.querySelector("#result-quote"), restart: document.querySelector("#restart-game"),
  contextHelp: document.querySelector("#context-help"), contextHelpIcon: document.querySelector("#context-help-icon"), contextHelpTitle: document.querySelector("#context-help-title"), contextHelpText: document.querySelector("#context-help-text"), contextHelpClose: document.querySelector("#context-help-close"), toastStack: document.querySelector("#toast-stack"),
  inspectorPanel: document.querySelector("#inspector-panel"), inspectorToggle: document.querySelector("#inspector-toggle"), closeInspector: document.querySelector("#close-inspector"), historyStrip: document.querySelector("#history-strip"), historyToggle: document.querySelector("#history-toggle"),
};

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

function createPlayer(id) {
  return { id, cash: id === "human" ? 22 : 24, income: 3, fame: 0, tech: { power: 1, machine: 1, textile: 1, goods: 1, warehouse: 1 }, spent: 0, lastSpent: 0, firstRouteFree: false };
}

function makeCard(kind, value, serial) {
  const label = kind === "city" ? CITIES[value].name : kind === "industry" ? INDUSTRIES[value].name : kind === "wildCity" ? "만능 도시" : "만능 산업";
  return { uid: `${kind}-${value || "all"}-${serial}`, kind, value, label };
}

function createEraCards(era) {
  const total = era === "water" ? 27 : 30;
  const cityIds = Object.keys(CITIES);
  const industryIds = Object.keys(INDUSTRIES);
  const cards = [];
  for (let index = 0; index < total; index += 1) {
    if (index % 3 !== 2) cards.push(makeCard("city", cityIds[index % cityIds.length], `${era}-${index}`));
    else cards.push(makeCard("industry", industryIds[index % industryIds.length], `${era}-${index}`));
  }
  return shuffle(cards);
}

function dealEra(stateToDeal, era) {
  stateToDeal.deck = createEraCards(era);
  stateToDeal.hands = { human: [], morrow: [], aurel: [] };
  PLAYER_IDS.forEach((id) => {
    while (stateToDeal.hands[id].length < 8) stateToDeal.hands[id].push(stateToDeal.deck.pop());
  });
  stateToDeal.selectedCard = null;
}

function createState(charter = "engineer") {
  const cities = {};
  Object.entries(CITIES).forEach(([id, city]) => { cities[id] = { buildings: Array(city.slots.length).fill(null) }; });
  const routes = {};
  ROUTES.forEach((route) => { routes[route.id] = { owner: null, era: null }; });
  const players = { human: createPlayer("human"), morrow: createPlayer("morrow"), aurel: createPlayer("aurel") };
  if (charter === "engineer") players.human.tech.machine = 2;
  if (charter === "merchant") players.human.cash += 6;
  if (charter === "navigator") players.human.firstRouteFree = true;
  const created = {
    version: 2, round: 1, phase: "human", turnOrder: [...PLAYER_IDS], turnIndex: 0, actionsRemaining: 1,
    mode: "build", selectedCity: null, selectedCard: null, players, cities, routes, market: { fuel: 6, machine: 6 },
    merchants: Object.fromEntries(Object.entries(MERCHANT_DEFS).map(([id, def]) => [id, { ...def, cargo: 1 }])),
    hands: {}, deck: [], logs: [], aiStatus: { title: "시장 조사 중", detail: "두 경쟁사가 손패와 투자 비용을 비교하고 있습니다." }, charter, over: false,
  };
  dealEra(created, "water");
  return created;
}

function getEra() { return state.round <= 5 ? "water" : "rail"; }
function eraName() { return getEra() === "water" ? "수로기" : "철도기"; }
function actionLimit() { return state.round === 1 ? 1 : 2; }
function playerDef(id) { return PLAYER_DEFS[id]; }
function routeDef(id) { return ROUTES.find((route) => route.id === id); }

function allBuildings() {
  const result = [];
  Object.entries(state.cities).forEach(([cityId, city]) => city.buildings.forEach((building, slot) => { if (building) result.push({ ...building, cityId, slot }); }));
  return result;
}

function playerBuildings(playerId) { return allBuildings().filter((building) => building.owner === playerId); }
function playerRoutes(playerId) { return Object.values(state.routes).filter((route) => route.owner === playerId).length; }

function addLog(text, category = "산업 보고", important = false) {
  state.logs.unshift({ round: state.round, text, category, important });
  state.logs = state.logs.slice(0, 28);
}

function showToast(text, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = text;
  dom.toastStack.append(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function saveGame() { if (state && !state.over) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* optional */ } } }
function loadGame() { try { const saved = JSON.parse(localStorage.getItem(SAVE_KEY)); return saved?.version === 2 && !saved.over ? saved : null; } catch { return null; } }

function areConnected(start, end) {
  if (start === end) return true;
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const city = queue.shift();
    for (const route of ROUTES) {
      if (!state.routes[route.id].owner) continue;
      const next = route.a === city ? route.b : route.b === city ? route.a : null;
      if (!next || seen.has(next)) continue;
      if (next === end) return true;
      seen.add(next); queue.push(next);
    }
  }
  return false;
}

function cityTouchedByPlayerNetwork(playerId, cityId) {
  if (state.cities[cityId].buildings.some((building) => building?.owner === playerId)) return true;
  return ROUTES.some((route) => state.routes[route.id].owner === playerId && (route.a === cityId || route.b === cityId));
}

function cityInPlayerNetwork(playerId, cityId) { return playerBuildings(playerId).length === 0 || cityTouchedByPlayerNetwork(playerId, cityId); }
function routeAvailableFor(playerId, routeId) { const route = routeDef(routeId); return Boolean(route && !state.routes[routeId].owner && (cityTouchedByPlayerNetwork(playerId, route.a) || cityTouchedByPlayerNetwork(playerId, route.b))); }

function marketPrice(type) {
  const stock = state.market[type];
  if (stock <= 0) return null;
  return Math.max(2, 7 - stock);
}

function findResourceSource(type, targetCity = null) {
  const sourceType = type === "fuel" ? "power" : type === "machine" ? "machine" : "warehouse";
  return allBuildings().find((building) => building.type === sourceType && building.stock > 0 && (!targetCity || areConnected(building.cityId, targetCity))) || null;
}

function resourceQuote(type, targetCity = null) {
  const source = findResourceSource(type, targetCity);
  if (source) return { ok: true, source, marketCost: 0 };
  if (type === "cargo") return { ok: false, reason: "연결된 물류창고의 화물 허가가 없습니다." };
  const price = marketPrice(type);
  return price === null ? { ok: false, reason: `${HELP[type].title} 재고가 없습니다.` } : { ok: true, source: null, marketCost: price };
}

function activateBuilding(cityId, slot) {
  const building = state.cities[cityId].buildings[slot];
  if (!building || building.flipped) return;
  building.flipped = true;
  building.active = true;
  const reward = INDUSTRIES[building.type].income + Math.max(0, building.level - 1);
  state.players[building.owner].income += reward;
  addLog(`${playerDef(building.owner).name}의 ${CITIES[cityId].name} ${INDUSTRIES[building.type].name}가 뒤집혀 수입 +${reward}.`, "산업 활성화", true);
}

function consumeResource(type, targetCity, buyerId) {
  const source = findResourceSource(type, targetCity);
  if (source) {
    const original = state.cities[source.cityId].buildings[source.slot];
    original.stock -= 1;
    if (original.stock === 0) activateBuilding(source.cityId, source.slot);
    return { ok: true, from: `${playerDef(source.owner).name} ${INDUSTRIES[source.type].name}`, marketCost: 0 };
  }
  if (type === "cargo") return { ok: false, reason: "화물 허가가 없습니다." };
  const price = marketPrice(type);
  if (price === null) return { ok: false, reason: `${HELP[type].title} 재고가 없습니다.` };
  state.market[type] -= 1;
  return { ok: true, from: "변동 거래소", marketCost: price, buyerId };
}

function getCard(playerId, uid) { return state.hands[playerId].find((card) => card.uid === uid) || null; }
function cardMatchesBuild(card, cityId, type) { return Boolean(card && (card.kind === "wildCity" || card.kind === "wildIndustry" || (card.kind === "city" && card.value === cityId) || (card.kind === "industry" && card.value === type))); }

function chooseCard(playerId, requirement = {}) {
  const hand = state.hands[playerId];
  if (!hand.length) return null;
  if (playerId === "human") {
    const selected = getCard(playerId, state.selectedCard);
    if (!selected) return null;
    if (requirement.build && !cardMatchesBuild(selected, requirement.cityId, requirement.type)) return null;
    return selected;
  }
  if (requirement.build) return hand.find((card) => cardMatchesBuild(card, requirement.cityId, requirement.type)) || null;
  return hand[0];
}

function discardCard(playerId, uid) {
  const index = state.hands[playerId].findIndex((card) => card.uid === uid);
  if (index < 0) return null;
  const [card] = state.hands[playerId].splice(index, 1);
  addLog(`${playerDef(playerId).name}가 ${card.label} 카드를 버렸습니다.`, "카드 사용");
  if (state.selectedCard === uid) state.selectedCard = null;
  return card;
}

function refillHand(playerId) { while (state.hands[playerId].length < 8 && state.deck.length) state.hands[playerId].push(state.deck.pop()); }
function pay(playerId, amount) { state.players[playerId].cash -= amount; state.players[playerId].spent += amount; }

function firstOpenSlot(cityId, type) { return CITIES[cityId].slots.findIndex((types, index) => types.includes(type) && !state.cities[cityId].buildings[index]); }

function buildQuote(playerId, cityId, type, cardUid = playerId === "human" ? state.selectedCard : undefined) {
  const player = state.players[playerId];
  const card = playerId === "human" ? getCard(playerId, cardUid) : chooseCard(playerId, { build: true, cityId, type });
  if (!card) return { ok: false, reason: playerId === "human" ? "이 도시 또는 산업과 맞는 카드를 먼저 선택하세요." : "맞는 건설 카드가 없습니다." };
  if (!cardMatchesBuild(card, cityId, type)) return { ok: false, reason: "선택 카드가 이 건설과 맞지 않습니다." };
  if (firstOpenSlot(cityId, type) < 0) return { ok: false, reason: "허용되는 빈 산업 부지가 없습니다." };
  if (card.kind !== "city" && card.kind !== "wildCity" && !cityInPlayerNetwork(playerId, cityId)) return { ok: false, reason: "산업 카드 건설은 내 연결망 안에서만 가능합니다." };
  const level = player.tech[type];
  const needs = INDUSTRIES[type].needs || [];
  let marketCost = 0;
  for (const need of needs) {
    const quote = resourceQuote(need, cityId);
    if (!quote.ok) return { ok: false, reason: quote.reason };
    marketCost += quote.marketCost;
  }
  const baseCost = INDUSTRIES[type].cost + (level - 1) * 2;
  const totalCost = baseCost + marketCost;
  if (player.cash < totalCost) return { ok: false, reason: `현금이 ₡${totalCost - player.cash} 부족합니다.` };
  return { ok: true, card, level, baseCost, marketCost, totalCost, needs };
}

function performBuild(playerId, cityId, type, cardUid) {
  const quote = buildQuote(playerId, cityId, type, cardUid);
  if (!quote.ok) return quote;
  pay(playerId, quote.totalCost);
  quote.needs.forEach((need) => consumeResource(need, cityId, playerId));
  const slot = firstOpenSlot(cityId, type);
  const def = INDUSTRIES[type];
  state.cities[cityId].buildings[slot] = { owner: playerId, type, level: quote.level, stock: def.baseStock + Math.max(0, quote.level - 1), flipped: false, active: false };
  discardCard(playerId, quote.card.uid); refillHand(playerId);
  const text = `${playerDef(playerId).name}가 ${CITIES[cityId].name}에 ${quote.level}단계 ${def.name} 건설 · ₡${quote.totalCost} 지출.`;
  addLog(text, "산업 건설", true);
  return { ok: true, text, cityId, spent: quote.totalCost };
}

function linkQuote(playerId, routeId) {
  const card = chooseCard(playerId);
  if (!card) return { ok: false, reason: playerId === "human" ? "버릴 카드를 먼저 선택하세요." : "사용할 카드가 없습니다." };
  if (!routeAvailableFor(playerId, routeId)) return { ok: false, reason: "내 산업망에 닿은 빈 경로가 아닙니다." };
  const rail = getEra() === "rail";
  const resource = rail ? resourceQuote("fuel", routeDef(routeId).a) : { ok: true, marketCost: 0 };
  if (!resource.ok) return resource;
  const baseCost = state.players[playerId].firstRouteFree ? 0 : rail ? 5 : 3;
  const totalCost = baseCost + resource.marketCost;
  if (state.players[playerId].cash < totalCost) return { ok: false, reason: `현금이 ₡${totalCost - state.players[playerId].cash} 부족합니다.` };
  return { ok: true, card, rail, totalCost };
}

function performLink(playerId, routeId) {
  const quote = linkQuote(playerId, routeId);
  if (!quote.ok) return quote;
  pay(playerId, quote.totalCost);
  if (quote.rail) consumeResource("fuel", routeDef(routeId).a, playerId);
  state.routes[routeId] = { owner: playerId, era: getEra() };
  state.players[playerId].firstRouteFree = false;
  discardCard(playerId, quote.card.uid); refillHand(playerId);
  const route = routeDef(routeId);
  const text = `${playerDef(playerId).name}가 ${CITIES[route.a].name}–${CITIES[route.b].name} ${quote.rail ? "철도" : "수로"} 건설 · ₡${quote.totalCost}.`;
  addLog(text, "운송망", true);
  return { ok: true, text, routeId, spent: quote.totalCost };
}

function cargoOption(targetCity) {
  const source = findResourceSource("cargo", targetCity);
  if (source) return { ok: true, source, label: `${CITIES[source.cityId].name} 물류창고` };
  const merchant = state.merchants[targetCity];
  if (merchant?.cargo > 0) return { ok: true, merchantCity: targetCity, label: `${CITIES[targetCity].name} 무료 허가` };
  return { ok: false };
}

function tradeOptions(playerId) {
  const result = [];
  for (const building of playerBuildings(playerId).filter((item) => INDUSTRIES[item.type].saleable && !item.flipped)) {
    for (const [merchantCity, merchant] of Object.entries(state.merchants)) {
      if (!merchant.accepts.includes(building.type) || !areConnected(building.cityId, merchantCity)) continue;
      const cargo = cargoOption(merchantCity);
      if (cargo.ok) result.push({ building, merchantCity, merchant, cargo });
    }
  }
  return result;
}

function performSell(playerId, cityId, slot, merchantCity) {
  const card = chooseCard(playerId);
  if (!card) return { ok: false, reason: playerId === "human" ? "버릴 카드를 먼저 선택하세요." : "사용할 카드가 없습니다." };
  const option = tradeOptions(playerId).find((entry) => entry.building.cityId === cityId && entry.building.slot === slot && entry.merchantCity === merchantCity);
  if (!option) return { ok: false, reason: "상품·항구·화물 허가가 연결되지 않았습니다." };
  if (option.cargo.source) {
    const source = state.cities[option.cargo.source.cityId].buildings[option.cargo.source.slot];
    source.stock -= 1;
    if (source.stock === 0) activateBuilding(option.cargo.source.cityId, option.cargo.source.slot);
  } else state.merchants[merchantCity].cargo -= 1;
  const building = state.cities[cityId].buildings[slot];
  building.stock = 0;
  activateBuilding(cityId, slot);
  const cashGain = 5 + building.level + option.merchant.bonus;
  state.players[playerId].cash += cashGain;
  discardCard(playerId, card.uid); refillHand(playerId);
  const text = `${playerDef(playerId).name}가 ${CITIES[cityId].name} ${INDUSTRIES[building.type].name}을 ${CITIES[merchantCity].name}에 판매 · 현금 +₡${cashGain}.`;
  addLog(text, "상품 판매", true);
  return { ok: true, text, cityId };
}

function developQuote(playerId, type) {
  const card = chooseCard(playerId);
  if (!card) return { ok: false, reason: playerId === "human" ? "버릴 카드를 먼저 선택하세요." : "사용할 카드가 없습니다." };
  const player = state.players[playerId];
  if (player.tech[type] >= 3) return { ok: false, reason: "이미 최고 단계입니다." };
  const resource = resourceQuote("machine");
  if (!resource.ok) return resource;
  const totalCost = 4 + resource.marketCost;
  if (player.cash < totalCost) return { ok: false, reason: `현금이 ₡${totalCost - player.cash} 부족합니다.` };
  return { ok: true, card, totalCost };
}

function performDevelop(playerId, type) {
  const quote = developQuote(playerId, type);
  if (!quote.ok) return quote;
  pay(playerId, quote.totalCost); consumeResource("machine", null, playerId);
  state.players[playerId].tech[type] += 1;
  discardCard(playerId, quote.card.uid); refillHand(playerId);
  const text = `${playerDef(playerId).name}가 ${INDUSTRIES[type].name}을 ${state.players[playerId].tech[type]}단계로 개발 · ₡${quote.totalCost}.`;
  addLog(text, "기술 개발", true);
  return { ok: true, text };
}

function performFinance(playerId) {
  const card = chooseCard(playerId);
  if (!card) return { ok: false, reason: playerId === "human" ? "버릴 카드를 먼저 선택하세요." : "사용할 카드가 없습니다." };
  state.players[playerId].cash += 18;
  state.players[playerId].income = Math.max(-5, state.players[playerId].income - 3);
  discardCard(playerId, card.uid); refillHand(playerId);
  const text = `${playerDef(playerId).name}가 대출로 ₡18 확보 · 수입 -3.`;
  addLog(text, "금융", true);
  return { ok: true, text };
}

function performScout(playerId) {
  const hand = state.hands[playerId];
  const card = chooseCard(playerId);
  if (!card) return { ok: false, reason: playerId === "human" ? "버릴 카드를 먼저 선택하세요." : "사용할 카드가 없습니다." };
  if (hand.length < 3) return { ok: false, reason: "정찰하려면 손에 카드가 3장 이상 있어야 합니다." };
  const discarded = [card, ...hand.filter((item) => item.uid !== card.uid).slice(0, 2)];
  discarded.forEach((item) => discardCard(playerId, item.uid));
  const stamp = `${getEra()}-${state.round}-${playerId}-${Date.now()}`;
  state.hands[playerId].push(makeCard("wildCity", null, `${stamp}-c`), makeCard("wildIndustry", null, `${stamp}-i`));
  const text = `${playerDef(playerId).name}가 카드 3장을 정찰해 만능 카드 2장을 확보.`;
  addLog(text, "정찰", true);
  return { ok: true, text };
}

function spendHumanAction(result) {
  if (!result.ok) { showToast(result.reason, "error"); render(); return; }
  state.actionsRemaining -= 1;
  showToast(result.text, "success");
  saveGame(); render();
}

function totalResource(type) {
  const sourceType = type === "fuel" ? "power" : type === "machine" ? "machine" : "warehouse";
  const buildings = allBuildings().filter((building) => building.type === sourceType && building.stock > 0);
  return { total: buildings.reduce((sum, building) => sum + building.stock, 0), sources: buildings.length };
}

function routeValue(routeId) {
  const route = routeDef(routeId);
  let value = 0;
  [route.a, route.b].forEach((cityId) => {
    value += state.cities[cityId].buildings.filter((building) => building?.flipped).length;
    if (MERCHANT_DEFS[cityId]) value += 1;
  });
  return value;
}

function routeScore(playerId) { return ROUTES.filter((route) => state.routes[route.id].owner === playerId).reduce((sum, route) => sum + routeValue(route.id), 0); }
function finalScore(playerId) { return state.players[playerId].fame + Math.floor(state.players[playerId].cash / 10); }

function render() {
  const human = state.players.human;
  dom.era.textContent = eraName(); dom.round.textContent = state.round;
  dom.eraProgress.style.width = `${((state.round - 1) % 5 + 1) * 20}%`;
  dom.cash.textContent = human.cash; dom.income.textContent = human.income; dom.fame.textContent = human.fame;
  dom.actions.textContent = state.phase === "human" ? state.actionsRemaining : "–";
  if (dom.actionLimit) dom.actionLimit.textContent = actionLimit();
  dom.aiStatusTitle.textContent = state.aiStatus.title; dom.aiStatusDetail.textContent = state.aiStatus.detail;
  renderStandings(); renderMap(); renderInspector(); renderTechnology(); renderMarket(); renderHand(); renderHistory(); renderModePrompt(); updateActionState(); updateTutorial();
}

function renderStandings() {
  dom.standings.innerHTML = state.turnOrder.map((id, index) => {
    const player = state.players[id], def = playerDef(id);
    return `<article class="company-row ${id === state.phase ? "current" : ""}"><div class="company-rank">${index + 1}</div><i class="company-medallion" style="--company-color:${def.color}">${def.short}</i><div class="company-info"><strong>${def.name}</strong><small>★ ${player.fame} · ₡${player.cash} · 수입 ${player.income >= 0 ? "+" : ""}${player.income}</small><em>지난 지출 ₡${player.lastSpent}</em></div></article>`;
  }).join("");
}

function cityIsValidTarget(cityId) {
  if (state.mode === "build") return Object.keys(INDUSTRIES).some((type) => buildQuote("human", cityId, type).ok);
  if (state.mode === "link") return ROUTES.some((route) => (route.a === cityId || route.b === cityId) && linkQuote("human", route.id).ok);
  return false;
}

function renderMap() {
  dom.routeLayer.innerHTML = ROUTES.map((route) => {
    const from = CITIES[route.a], to = CITIES[route.b], placed = state.routes[route.id], available = !locked && state.phase === "human" && state.mode === "link" && linkQuote("human", route.id).ok;
    return `<line x1="${from.x * 10}" y1="${from.y * 6.5}" x2="${to.x * 10}" y2="${to.y * 6.5}" class="route-hit ${available ? "available" : ""}" data-route-id="${route.id}"></line><line x1="${from.x * 10}" y1="${from.y * 6.5}" x2="${to.x * 10}" y2="${to.y * 6.5}" class="${placed.owner ? `route-owned ${playerDef(placed.owner).className} ${placed.era}` : `route-base ${available ? "route-preview" : ""}`}"></line>`;
  }).join("");
  dom.cityLayer.innerHTML = Object.entries(CITIES).map(([cityId, city]) => {
    const selected = state.selectedCity === cityId, valid = cityIsValidTarget(cityId), merchant = state.merchants[cityId];
    const tokens = state.cities[cityId].buildings.map((building, slot) => building
      ? `<i class="industry-token ${playerDef(building.owner).className} ${building.flipped ? "active flipped" : ""}" title="${playerDef(building.owner).name} ${INDUSTRIES[building.type].name} ${building.level}단계">${INDUSTRIES[building.type].icon}<b>${building.flipped ? "✓" : building.stock}</b></i>`
      : `<i class="industry-token empty">${CITIES[cityId].slots[slot].map((type) => INDUSTRIES[type].icon).join("")}</i>`).join("");
    return `<button class="city-node ${selected ? "selected" : ""} ${valid ? "valid-target" : ""}" data-city-id="${cityId}" style="left:${city.x}%;top:${city.y}%" type="button"><span class="city-pin"></span><div class="city-content"><strong class="city-name">${city.name}</strong>${merchant ? `<small class="merchant-mark">항구 · 허가 ${merchant.cargo}</small>` : ""}<div class="city-slots">${tokens}</div></div></button>`;
  }).join("");
}

function emptyInspector(icon, title, text) { dom.inspector.innerHTML = `<div class="inspector-empty"><i>${icon}</i><strong>${title}</strong><p>${text}</p></div>`; }
function cityHeader(cityId) { return `<div class="city-inspector-header"><span>선택 도시</span><h3>${CITIES[cityId].name}</h3><p>${CITIES[cityId].description}</p></div>`; }

function renderInspector() {
  if (state.mode === "build") return renderBuildInspector();
  if (state.mode === "link") return renderLinkInspector();
  if (state.mode === "sell") return renderSellInspector();
  if (state.mode === "develop") return renderDevelopInspector();
  if (state.mode === "finance") return renderFinanceInspector();
  return renderScoutInspector();
}

function renderBuildInspector() {
  if (!state.selectedCity) return emptyInspector("⌂", "도시를 선택하세요", "손의 도시 카드 또는 산업 카드를 고른 뒤 지도에서 건설할 도시를 선택하세요.");
  const cityId = state.selectedCity;
  const cards = Object.keys(INDUSTRIES).map((type) => {
    const def = INDUSTRIES[type], quote = buildQuote("human", cityId, type);
    return `<button class="slot-card" data-build-type="${type}" type="button" ${!quote.ok || locked || state.actionsRemaining < 1 ? "disabled" : ""}><div class="slot-top"><strong>${def.icon} ${def.name} Lv.${state.players.human.tech[type]}</strong><b>${quote.ok ? `₡${quote.totalCost}` : "–"}</b></div><p>${def.description}</p>${!quote.ok ? `<small>${quote.reason}</small>` : ""}</button>`;
  }).join("");
  dom.inspector.innerHTML = `${cityHeader(cityId)}<div class="section-label"><span>건설 후보</span><small>카드·부지·연결 확인</small></div><div class="slot-list">${cards}</div>`;
}

function renderLinkInspector() {
  const rail = getEra() === "rail";
  const available = ROUTES.filter((route) => linkQuote("human", route.id).ok).length;
  emptyInspector("⌁", `${rail ? "철도" : "수로"} 건설`, `버릴 카드를 선택한 뒤 지도에서 황금색 경로를 누르세요. ${rail ? "기본 ₡5와 연료 1" : "기본 ₡3"} · 현재 가능 ${available}곳.`);
}

function renderSellInspector() {
  const options = tradeOptions("human");
  if (!options.length) return emptyInspector("◇", "판매 가능한 주문이 없습니다", "뒤집히지 않은 직물/정밀품, 연결된 항구, 화물 허가가 모두 필요합니다.");
  dom.inspector.innerHTML = `<div class="city-inspector-header"><span>상품 판매</span><h3>항구 주문 선택</h3><p>카드 1장과 화물 허가 1개를 사용합니다.</p></div><div class="sell-list">${options.map((option, index) => `<button class="office-action" data-sell-index="${index}" type="button" ${!chooseCard("human") || locked || state.actionsRemaining < 1 ? "disabled" : ""}><div class="slot-top"><strong>${CITIES[option.building.cityId].name} → ${CITIES[option.merchantCity].name}</strong><b>₡${5 + option.building.level + option.merchant.bonus}</b></div><p>${INDUSTRIES[option.building.type].name} · ${option.cargo.label}</p></button>`).join("")}</div>`;
}

function renderDevelopInspector() {
  dom.inspector.innerHTML = `<div class="city-inspector-header"><span>기술 개발</span><h3>낮은 단계 타일 제거</h3><p>카드 1장, 기계 1개와 ₡4를 사용합니다.</p></div><div class="develop-list">${Object.entries(INDUSTRIES).map(([type, def]) => { const quote = developQuote("human", type), level = state.players.human.tech[type]; return `<button class="office-action" data-develop-type="${type}" type="button" ${!quote.ok || locked || state.actionsRemaining < 1 ? "disabled" : ""}><div class="slot-top"><strong>${def.icon} ${def.name}</strong><b>Lv.${level} → ${Math.min(3, level + 1)}</b></div><p>${quote.ok ? `총 ₡${quote.totalCost}` : quote.reason}</p></button>`; }).join("")}</div>`;
}

function renderFinanceInspector() { emptyInspector("₡", "대출", "선택 카드 1장을 버리고 현금 ₡18을 얻는 대신 수입이 3 내려갑니다."); dom.inspector.innerHTML += `<button class="office-action finance-confirm" id="confirm-finance" type="button" ${!chooseCard("human") || locked || state.actionsRemaining < 1 ? "disabled" : ""}><div class="slot-top"><strong>대출 실행</strong><b>+₡18</b></div><p>수입 -3 · 이번 라운드 지출에는 포함되지 않음</p></button>`; }
function renderScoutInspector() { emptyInspector("◈", "정찰", "선택 카드와 추가 카드 2장을 버리고 만능 도시·산업 카드 2장을 받습니다."); dom.inspector.innerHTML += `<button class="office-action finance-confirm" id="confirm-scout" type="button" ${state.hands.human.length < 3 || !chooseCard("human") || locked || state.actionsRemaining < 1 ? "disabled" : ""}><div class="slot-top"><strong>정찰 실행</strong><b>3 → 2장</b></div><p>행동 1회 사용 · 덱에서는 보충하지 않음</p></button>`; }

function renderTechnology() { dom.technology.innerHTML = Object.entries(INDUSTRIES).map(([type, def]) => `<div class="tech-pill"><i>${def.icon}</i><strong>Lv.${state.players.human.tech[type]}</strong><small>${def.name}</small></div>`).join(""); }

function renderMarket() {
  const fuel = totalResource("fuel"), machine = totalResource("machine"), cargo = totalResource("cargo");
  dom.fuelTotal.textContent = fuel.total; dom.fuelSources.textContent = `${fuel.sources}곳 · 시장 ${state.market.fuel}개 / ₡${marketPrice("fuel") ?? "품절"}`;
  dom.machineTotal.textContent = machine.total; dom.machineSources.textContent = `${machine.sources}곳 · 시장 ${state.market.machine}개 / ₡${marketPrice("machine") ?? "품절"}`;
  if (dom.cargoTotal) dom.cargoTotal.textContent = cargo.total + Object.values(state.merchants).reduce((sum, item) => sum + item.cargo, 0);
  if (dom.cargoSources) dom.cargoSources.textContent = `${cargo.sources}개 창고 · 항구 무료 ${Object.values(state.merchants).reduce((sum, item) => sum + item.cargo, 0)}`;
  dom.contracts.innerHTML = Object.entries(state.merchants).map(([cityId, merchant]) => `<span class="contract-chip">${CITIES[cityId].name} ${merchant.accepts.map((type) => INDUSTRIES[type].icon).join("")} <b>허가 ${merchant.cargo}</b></span>`).join("");
}

function renderHand() {
  if (!dom.hand) return;
  const hand = state.hands.human;
  dom.handCount.textContent = hand.length; dom.deckCount.textContent = state.deck.length;
  dom.hand.innerHTML = hand.map((card) => `<button class="hand-card ${state.selectedCard === card.uid ? "selected" : ""} ${card.kind.startsWith("wild") ? "wild" : card.kind}" data-card-uid="${card.uid}" type="button" ${locked || state.phase !== "human" ? "disabled" : ""}><small>${card.kind === "city" ? "도시" : card.kind === "industry" ? "산업" : "만능"}</small><strong>${card.label}</strong><span>${card.kind === "city" ? "이 도시 건설" : card.kind === "industry" ? "이 산업 건설" : "건설 제한 해제"}</span></button>`).join("");
}

function renderHistory() { dom.history.innerHTML = state.logs.slice(0, 12).map((log) => `<article class="history-entry ${log.important ? "important" : ""}"><span>${log.round}R · ${log.category}</span><p>${log.text}</p></article>`).join(""); }

function renderModePrompt() {
  const selected = getCard("human", state.selectedCard);
  const prompts = {
    build: ["⌂", "산업 건설", selected ? `${selected.label} 카드 사용 · 도시를 선택하세요.` : "먼저 아래 손패에서 도시 또는 산업 카드를 선택하세요."],
    link: ["⌁", "운송로", selected ? `${selected.label} 카드를 버리고 경로를 선택하세요.` : "아무 카드나 먼저 선택하세요."],
    sell: ["◇", "상품 판매", selected ? "오른쪽에서 연결된 항구 주문을 고르세요." : "아무 카드나 먼저 선택하세요."],
    develop: ["⚙", "기술 개발", selected ? "오른쪽에서 개발할 산업을 고르세요." : "아무 카드나 먼저 선택하세요."],
    finance: ["₡", "대출", selected ? "현금 +₡18, 수입 -3을 확인하세요." : "아무 카드나 먼저 선택하세요."],
    scout: ["◈", "정찰", selected ? "선택 카드 포함 3장을 만능 카드 2장으로 바꿉니다." : "버릴 카드 중 1장을 먼저 선택하세요."],
  };
  const [icon, title, text] = prompts[state.mode];
  dom.modePrompt.innerHTML = `<span class="prompt-icon">${icon}</span><div><strong>${title}</strong><p>${text}</p></div>`;
}

function updateActionState() {
  document.querySelectorAll(".action-tab").forEach((button) => { button.classList.toggle("selected", button.dataset.mode === state.mode); button.disabled = locked || state.phase !== "human" || state.actionsRemaining < 1; });
  dom.advance.disabled = locked || state.phase !== "human" || state.over;
  dom.advanceLabel.textContent = state.actionsRemaining === 0 ? "턴 종료하고 다음 회사 진행" : "남은 행동을 포기하고 턴 종료";
  dom.advanceHint.textContent = `현재 순서 ${state.turnIndex + 1}/${state.turnOrder.length} · 다음 라운드는 지출 적은 순`;
}

function updateTutorial() {
  if (state.round === 1 && playerBuildings("human").length === 0) { dom.tutorialTitle.textContent = "카드를 먼저 고르세요"; dom.tutorialText.textContent = "손패의 도시 카드면 그 도시, 산업 카드면 내 연결망 안에서 해당 산업을 지을 수 있습니다."; }
  else if (state.round <= 2 && playerRoutes("human") === 0) { dom.tutorialTitle.textContent = "판매 항구로 연결하세요"; dom.tutorialText.textContent = "수로를 놓아 직물공방과 루멘항·글라스미어·노바 부두를 잇습니다."; }
  else { dom.tutorialTitle.textContent = `${eraName()} · 지출 ₡${state.players.human.spent}`; dom.tutorialText.textContent = "지금 덜 쓰면 다음 라운드 순서가 빨라집니다. 뒤집힌 산업만 시대 점수를 냅니다."; }
}

function setInspectorOpen(open) {
  dom.inspectorPanel.classList.toggle("collapsed", !open);
  dom.inspectorToggle.classList.toggle("active", open);
  const label = dom.inspectorToggle.querySelector("b");
  if (label) label.textContent = open ? "닫기" : "열기";
  if (dom.inspectorToggle.setAttribute) dom.inspectorToggle.setAttribute("aria-expanded", String(open));
}

function setHistoryOpen(open) {
  dom.historyStrip.classList.toggle("collapsed", !open);
  const hint = dom.historyToggle.querySelector("small");
  if (hint) hint.textContent = open ? "최근 기록 접기 ↑" : "최근 기록 펼치기 ↓";
  if (dom.historyToggle.setAttribute) dom.historyToggle.setAttribute("aria-expanded", String(open));
}

function selectMode(mode) { if (!locked && state.phase === "human" && state.actionsRemaining > 0) { state.mode = mode; if (mode !== "build") state.selectedCity = null; setInspectorOpen(true); render(); } }
function handleCityClick(cityId) { if (!locked && state.phase === "human") { state.selectedCity = cityId; if (state.mode === "build") setInspectorOpen(true); render(); } }
function handleRouteClick(routeId) { if (!locked && state.mode === "link" && state.phase === "human" && state.actionsRemaining > 0) spendHumanAction(performLink("human", routeId)); }

function chooseAiAction(playerId) {
  if (!state.hands[playerId].length) return { ok: true, text: `${playerDef(playerId).name}는 카드가 없어 행동을 넘겼습니다.` };
  const sales = tradeOptions(playerId);
  if (sales.length) { const option = sales[0]; return performSell(playerId, option.building.cityId, option.building.slot, option.merchantCity); }
  if (state.players[playerId].cash < 7) return performFinance(playerId);
  const priority = playerId === "morrow" ? ["textile", "goods", "warehouse", "power", "machine"] : ["power", "machine", "warehouse", "goods", "textile"];
  for (const type of priority) {
    const cities = Object.keys(CITIES).filter((cityId) => buildQuote(playerId, cityId, type).ok);
    if (cities.length) return performBuild(playerId, cities[Math.floor(Math.random() * cities.length)], type);
  }
  const links = ROUTES.filter((route) => linkQuote(playerId, route.id).ok);
  if (links.length) return performLink(playerId, links[Math.floor(Math.random() * links.length)].id);
  const development = priority.find((type) => developQuote(playerId, type).ok);
  if (development) return performDevelop(playerId, development);
  if (state.hands[playerId].length >= 3) return performScout(playerId);
  return performFinance(playerId);
}

function delay(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }

async function proceedTurns() {
  if (state.over) return;
  locked = true;
  while (state.turnIndex < state.turnOrder.length) {
    const playerId = state.turnOrder[state.turnIndex];
    state.phase = playerId;
    if (playerId === "human") {
      state.actionsRemaining = Math.min(actionLimit(), state.hands.human.length);
      state.aiStatus = { title: "청람 산업사 차례", detail: `이번 라운드 지출 ₡${state.players.human.spent}. 손패를 고르고 행동하세요.` };
      locked = false; render(); saveGame(); return;
    }
    const def = playerDef(playerId);
    const count = Math.min(actionLimit(), state.hands[playerId].length);
    for (let action = 0; action < count; action += 1) {
      state.aiStatus = { title: `${def.name} 계산 중`, detail: `${action + 1}/${count} 행동 · 손패와 시장 가격을 비교합니다…` };
      dom.aiDesk.classList.add("thinking"); render(); await delay(420);
      const result = chooseAiAction(playerId);
      state.aiStatus = { title: `${def.name} 행동 공개`, detail: result.text || result.reason };
      render(); if (result.cityId) animateAiCity(result.cityId); showToast(result.text || result.reason, "ai"); await delay(560);
    }
    state.turnIndex += 1;
  }
  dom.aiDesk.classList.remove("thinking");
  finishRound();
}

async function runAiRound() {
  if (locked || state.phase !== "human" || state.over) return;
  locked = true; state.selectedCard = null; state.selectedCity = null; state.turnIndex += 1; render();
  await proceedTurns();
}

function animateAiCity(cityId) { const node = dom.cityLayer.querySelector(`[data-city-id="${cityId}"]`); if (node) { node.classList.add("ai-focus"); window.setTimeout(() => node.classList.remove("ai-focus"), 1000); } }

function scoreEra() {
  const era = getEra();
  PLAYER_IDS.forEach((id) => {
    const industryPoints = playerBuildings(id).filter((building) => building.flipped).reduce((sum, building) => sum + INDUSTRIES[building.type].score + Math.max(0, building.level - 1), 0);
    const networkPoints = routeScore(id);
    state.players[id].fame += industryPoints + networkPoints;
    addLog(`${playerDef(id).name} ${eraName()} 결산 · 산업 ${industryPoints}점 + 운송로 ${networkPoints}점.`, "시대 결산", true);
  });
  Object.keys(state.routes).forEach((routeId) => { state.routes[routeId] = { owner: null, era: null }; });
  if (era === "water") {
    Object.values(state.cities).forEach((city) => city.buildings.forEach((building, index) => { if (building?.level === 1) city.buildings[index] = null; }));
  }
  state.market = { fuel: 6, machine: 6 };
  Object.keys(state.merchants).forEach((cityId) => { state.merchants[cityId].cargo = 1; });
}

function finishRound() {
  PLAYER_IDS.forEach((id) => {
    const gain = state.players[id].income;
    state.players[id].cash = Math.max(0, state.players[id].cash + gain);
    addLog(`${playerDef(id).name} 수입 ${gain >= 0 ? "+" : ""}₡${gain}.`, "수입 결산");
  });
  const previousOrder = [...state.turnOrder];
  state.turnOrder = [...PLAYER_IDS].sort((a, b) => state.players[a].spent - state.players[b].spent || previousOrder.indexOf(a) - previousOrder.indexOf(b));
  PLAYER_IDS.forEach((id) => { state.players[id].lastSpent = state.players[id].spent; state.players[id].spent = 0; });
  if (ERA_END_ROUNDS.includes(state.round)) {
    scoreEra();
    if (state.round === MAX_ROUNDS) return endGame();
  }
  state.round += 1;
  if (state.round === 6) {
    dealEra(state, "rail");
    addLog("수로기 결산 완료. 1단계 산업과 수로를 제거하고 철도기 새 손패를 받았습니다.", "시대 전환", true);
    showToast("철도기 시작 · 새 카드 8장, 철도는 연료 1 필요", "success");
  } else showToast(`${state.round}라운드 시작 · ${state.turnOrder.map((id) => playerDef(id).short).join(" → ")} 순서`, "success");
  state.turnIndex = 0; state.phase = state.turnOrder[0]; state.actionsRemaining = 0; state.mode = "build"; state.selectedCity = null; state.selectedCard = null;
  state.aiStatus = { title: "새 턴 순서 확정", detail: state.turnOrder.map((id) => `${playerDef(id).name} (지난 지출 ₡${state.players[id].lastSpent})`).join(" → ") };
  saveGame(); render(); proceedTurns();
}

function endGame() {
  state.over = true; locked = true; state.phase = "over";
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
  const ranking = PLAYER_IDS.map((id) => ({ id, score: finalScore(id) })).sort((a, b) => b.score - a.score);
  const humanRank = ranking.findIndex((entry) => entry.id === "human") + 1;
  const won = humanRank === 1;
  dom.resultEmblem.textContent = won ? "★" : "⌁"; dom.resultTitle.textContent = won ? "아르델 최고의 기업가" : `${humanRank}위로 결산`;
  dom.resultDescription.textContent = won ? "두 시대의 산업과 운송망 가치가 경쟁사를 앞질렀습니다." : "뒤집히지 않은 산업과 시대 종료 운송망 가치를 다시 살펴보세요.";
  dom.finalRanking.innerHTML = ranking.map((entry, index) => `<div class="final-row ${index === 0 ? "winner" : ""}"><span>${index + 1}</span><div><strong>${playerDef(entry.id).name}</strong><small>시대 명성 ${state.players[entry.id].fame} · 현금 보너스 ${Math.floor(state.players[entry.id].cash / 10)}</small></div><b>${entry.score}점</b></div>`).join("");
  dom.resultQuote.textContent = won ? "길을 소유한 회사보다 흐름을 읽은 회사가 시대를 소유한다." : "다음 장부에서는 경쟁사가 필요로 할 자원을 먼저 공급해 보십시오.";
  dom.resultModal.hidden = false; render();
}

function openHelp(id) { const info = HELP[id]; if (info) { dom.contextHelpIcon.textContent = info.icon; dom.contextHelpTitle.textContent = info.title; dom.contextHelpText.textContent = info.text; dom.contextHelp.hidden = false; } }

function renderRulebook() {
  const page = RULE_PAGES[rulePageIndex];
  dom.rulebookTabs.innerHTML = RULE_PAGES.map((candidate, index) => `<button class="rulebook-tab ${index === rulePageIndex ? "active" : ""}" data-rule-page="${index}" type="button">${index + 1}. ${candidate.tab}</button>`).join("");
  dom.rulebookPage.innerHTML = `<header class="rule-page-heading"><div class="rule-page-icon">${page.icon}</div><div><span>${page.eyebrow}</span><h3>${page.title}</h3></div></header><p class="rule-lead">${page.lead}</p>${page.body}`;
  dom.rulePageNumber.textContent = `${rulePageIndex + 1} / ${RULE_PAGES.length}`; dom.ruleProgress.style.width = `${(rulePageIndex + 1) / RULE_PAGES.length * 100}%`;
  dom.rulePrev.disabled = rulePageIndex === 0; dom.ruleNext.disabled = rulePageIndex === RULE_PAGES.length - 1; dom.rulebookStart.hidden = rulePageIndex !== RULE_PAGES.length - 1;
  dom.rulebookStart.textContent = rulebookOpenedFromStart ? "이제 게임 시작하기" : "규칙서 닫고 게임 계속하기";
}

function openRules(page = 0) { rulebookOpenedFromStart = !dom.startModal.hidden; rulePageIndex = Math.max(0, Math.min(RULE_PAGES.length - 1, page)); renderRulebook(); dom.rulebookModal.hidden = false; }
function closeRules() { dom.rulebookModal.hidden = true; }
function showStartMenu() { dom.startMenuView.hidden = false; dom.setupView.hidden = true; }
function showSetup() { closeRules(); dom.startModal.hidden = false; dom.startMenuView.hidden = true; dom.setupView.hidden = false; }
function finishRulebook() { if (rulebookOpenedFromStart) showSetup(); else closeRules(); }

function startNewGame(charter) {
  state = createState(charter); locked = false;
  addLog(`${charter === "engineer" ? "기술자 조합" : charter === "merchant" ? "상인 연합" : "수로 측량단"} 헌장으로 청람 산업사가 설립되었습니다.`, "회사 설립", true);
  addLog("수로기 첫 라운드는 각 회사가 카드 1장으로 1행동만 합니다.", "경쟁 개시", true);
  dom.startModal.hidden = true; dom.rulebookModal.hidden = true; dom.resultModal.hidden = true;
  state.turnIndex = 0; setInspectorOpen(false); setHistoryOpen(false); updateTutorial(); render(); saveGame(); proceedTurns();
}

function continueSavedGame() {
  const saved = loadGame();
  if (!saved) return showToast("이어갈 수 있는 저장 장부가 없습니다.", "error");
  state = saved; dom.startModal.hidden = true; dom.rulebookModal.hidden = true; updateTutorial();
  if (state.phase === "human") { locked = false; render(); }
  else { locked = true; render(); proceedTurns(); }
}

function showStart() { locked = true; dom.resultModal.hidden = true; dom.startModal.hidden = false; showStartMenu(); dom.continueGame.hidden = !loadGame(); }

function bindEvents() {
  document.querySelectorAll(".action-tab").forEach((button) => button.addEventListener("click", () => selectMode(button.dataset.mode)));
  dom.cityLayer.addEventListener("click", (event) => { const city = event.target.closest("[data-city-id]"); if (city) handleCityClick(city.dataset.cityId); });
  dom.routeLayer.addEventListener("click", (event) => { if (event.target.dataset.routeId) handleRouteClick(event.target.dataset.routeId); });
  dom.hand.addEventListener("click", (event) => { const card = event.target.closest("[data-card-uid]"); if (card && !locked) { state.selectedCard = card.dataset.cardUid; render(); } });
  dom.inspector.addEventListener("click", (event) => {
    const build = event.target.closest("[data-build-type]"); if (build && state.selectedCity) return spendHumanAction(performBuild("human", state.selectedCity, build.dataset.buildType));
    const sell = event.target.closest("[data-sell-index]"); if (sell) { const option = tradeOptions("human")[Number(sell.dataset.sellIndex)]; if (option) spendHumanAction(performSell("human", option.building.cityId, option.building.slot, option.merchantCity)); return; }
    const develop = event.target.closest("[data-develop-type]"); if (develop) return spendHumanAction(performDevelop("human", develop.dataset.developType));
    if (event.target.closest("#confirm-finance")) return spendHumanAction(performFinance("human"));
    if (event.target.closest("#confirm-scout")) spendHumanAction(performScout("human"));
  });
  dom.advance.addEventListener("click", runAiRound); dom.newGame.addEventListener("click", showStart); dom.restart.addEventListener("click", showStart);
  dom.openSetup.addEventListener("click", showSetup); dom.backToMenu.addEventListener("click", showStartMenu); dom.openRulebook.addEventListener("click", () => openRules(0)); dom.rulesButton.addEventListener("click", () => openRules(0)); dom.closeRulebook.addEventListener("click", closeRules);
  dom.rulePrev.addEventListener("click", () => { if (rulePageIndex > 0) { rulePageIndex -= 1; renderRulebook(); } }); dom.ruleNext.addEventListener("click", () => { if (rulePageIndex < RULE_PAGES.length - 1) { rulePageIndex += 1; renderRulebook(); } });
  dom.rulebookTabs.addEventListener("click", (event) => { const tab = event.target.closest("[data-rule-page]"); if (tab) { rulePageIndex = Number(tab.dataset.rulePage); renderRulebook(); } });
  dom.rulebookStart.addEventListener("click", finishRulebook); dom.startGame.addEventListener("click", () => startNewGame(document.querySelector('input[name="charter"]:checked').value)); dom.continueGame.addEventListener("click", continueSavedGame);
  dom.contextHelpClose.addEventListener("click", () => { dom.contextHelp.hidden = true; }); document.addEventListener("click", (event) => { const help = event.target.closest("[data-help]"); if (help) openHelp(help.dataset.help); });
  dom.inspectorToggle.addEventListener("click", () => setInspectorOpen(dom.inspectorPanel.classList.contains("collapsed")));
  dom.closeInspector.addEventListener("click", () => setInspectorOpen(false));
  dom.historyToggle.addEventListener("click", () => setHistoryOpen(dom.historyStrip.classList.contains("collapsed")));
  document.querySelectorAll(".charter-option input").forEach((input) => input.addEventListener("change", () => { document.querySelectorAll(".charter-option").forEach((option) => option.classList.remove("selected")); input.closest(".charter-option").classList.add("selected"); }));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !dom.rulebookModal.hidden) closeRules(); });
}

function bootstrap() { bindEvents(); state = createState("engineer"); dom.continueGame.hidden = !loadGame(); showStartMenu(); updateTutorial(); render(); }
bootstrap();
