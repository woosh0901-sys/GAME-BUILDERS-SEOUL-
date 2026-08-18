"use strict";

const fs = require("fs");
const vm = require("vm");

function fakeElement() {
  const classes = new Set();
  return {
    hidden: false, disabled: false, textContent: "", innerHTML: "", dataset: {}, style: {}, children: [], className: "",
    classList: {
      add(...names) { names.forEach((name) => classes.add(name)); },
      remove(...names) { names.forEach((name) => classes.delete(name)); },
      toggle(name, force) { if (force) classes.add(name); else classes.delete(name); },
      contains(name) { return classes.has(name); },
    },
    addEventListener() {}, append(child) { this.children.push(child); }, remove() {},
    querySelector() { return fakeElement(); }, querySelectorAll() { return []; }, closest() { return null; },
  };
}

const elements = new Map();
const modes = ["build", "link", "sell", "develop", "finance", "scout"];
const actionTabs = modes.map((mode) => { const element = fakeElement(); element.dataset.mode = mode; return element; });
const documentStub = {
  querySelector(selector) { if (!elements.has(selector)) elements.set(selector, fakeElement()); return elements.get(selector); },
  querySelectorAll(selector) { if (selector === ".action-tab") return actionTabs; return []; },
  createElement() { return fakeElement(); }, addEventListener() {},
};
const storage = new Map();
const localStorageStub = {
  getItem(key) { return storage.get(key) ?? null; }, setItem(key, value) { storage.set(key, value); }, removeItem(key) { storage.delete(key); },
};
const mathStub = Object.create(Math);
mathStub.random = () => 0.2;
let stamp = 1000;
class FakeDate extends Date { static now() { stamp += 1; return stamp; } }
const context = {
  console, document: documentStub, localStorage: localStorageStub, Math: mathStub, Promise, Date: FakeDate,
  window: { setTimeout(callback) { callback(); return 1; } },
};
context.globalThis = context;

const source = fs.readFileSync("game.js", "utf8");
const assertions = `
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function giveCard(playerId, kind = "wildIndustry") {
    const card = makeCard(kind, null, "test-" + playerId + "-" + Date.now());
    state.hands[playerId].push(card);
    if (playerId === "human") state.selectedCard = card.uid;
    return card;
  }

  (async () => {
    showStart();
    assert(!dom.startMenuView.hidden && dom.setupView.hidden, "첫 화면에 시작 메뉴가 보여야 합니다.");
    openRules(0);
    assert(!dom.rulebookModal.hidden, "첫 화면에서 규칙서를 열 수 있어야 합니다.");
    assert(RULE_PAGES.length === 8, "새 규칙서는 8쪽이어야 합니다.");
    assert(dom.rulebookPage.innerHTML.includes("두 시대"), "목표 페이지가 두 시대 구조를 설명해야 합니다.");
    rulePageIndex = RULE_PAGES.length - 1;
    renderRulebook();
    assert(!dom.rulebookStart.hidden, "마지막 규칙 페이지에 시작 버튼이 보여야 합니다.");
    finishRulebook();
    assert(!dom.setupView.hidden, "규칙서를 마치면 헌장 선택으로 이동해야 합니다.");

    startNewGame("merchant");
    assert(state.version === 2 && state.players.human.cash === 28, "새 규칙 상태와 상인 헌장 보너스가 적용되어야 합니다.");
    assert(dom.inspectorPanel.classList.contains("collapsed"), "게임 시작 시 지도 집중을 위해 투자 사무실이 접혀야 합니다.");
    selectMode("finance");
    assert(!dom.inspectorPanel.classList.contains("collapsed"), "행동을 선택하면 투자 사무실이 열려야 합니다.");
    setInspectorOpen(false);
    assert(state.hands.human.length === 8 && state.deck.length === 3, "수로기는 각 회사 8장과 공용 덱 3장으로 시작해야 합니다.");
    assert(actionLimit() === 1, "수로기 첫 라운드는 행동 1회여야 합니다.");

    state.selectedCard = null;
    let result = performBuild("human", "lumen", "power");
    assert(!result.ok, "카드 없이는 산업을 건설할 수 없어야 합니다.");
    giveCard("human");
    result = performBuild("human", "lumen", "power");
    assert(result.ok && totalResource("fuel").total === 2, "동력소 건설은 연료를 공급해야 합니다.");

    giveCard("morrow");
    result = performBuild("morrow", "lumen", "machine");
    assert(result.ok && totalResource("fuel").total === 1, "AI가 연결된 플레이어 연료를 공유해야 합니다.");
    giveCard("aurel");
    result = performBuild("aurel", "lumen", "textile");
    assert(result.ok, "AI가 공유 연료로 직물공방을 건설할 수 있어야 합니다.");
    assert(state.cities.lumen.buildings[0].flipped, "마지막 연료 소비 시 동력소가 뒤집혀야 합니다.");
    assert(state.players.human.income > 3, "공유 자원 소진 보상은 소유자 수입으로 가야 합니다.");

    giveCard("human");
    result = performLink("human", "lumen-vale");
    assert(result.ok && areConnected("lumen", "vale"), "수로가 두 도시를 연결해야 합니다.");

    const incomeBefore = state.players.human.income;
    giveCard("human");
    result = performFinance("human");
    assert(result.ok && state.players.human.income === incomeBefore - 3, "대출은 현금 18과 수입 -3을 적용해야 합니다.");

    state.players.human.spent = 9;
    state.players.morrow.spent = 2;
    state.players.aurel.spent = 5;
    state.round = 2;
    state.turnOrder = ["human", "morrow", "aurel"];
    state.turnIndex = 3;
    finishRound();
    assert(state.turnOrder.join(",") === "morrow,aurel,human", "다음 턴은 직전 지출이 적은 순이어야 합니다.");

    locked = true;
    state.round = 5;
    state.turnIndex = 3;
    state.routes["lumen-vale"] = { owner: "human", era: "water" };
    const fameBefore = state.players.human.fame;
    finishRound();
    assert(state.round === 6 && getEra() === "rail", "5라운드 결산 뒤 철도기로 넘어가야 합니다.");
    assert(Object.values(state.routes).every((route) => !route.owner), "수로기 운송로는 결산 뒤 제거되어야 합니다.");
    assert(state.cities.lumen.buildings.every((building) => !building || building.level > 1), "수로기 뒤 1단계 산업이 제거되어야 합니다.");
    assert(state.players.human.fame >= fameBefore, "뒤집힌 산업과 운송로 점수가 명성에 반영되어야 합니다.");
    assert(state.hands.human.length === 8 && state.deck.length === 6, "철도기 새 손패와 덱을 받아야 합니다.");

    console.log(JSON.stringify({
      result: "ok", rules: RULE_PAGES.length, rounds: MAX_ROUNDS, cities: Object.keys(state.cities).length,
      routes: Object.keys(state.routes).length, industries: Object.keys(INDUSTRIES).length,
      turnOrder: state.turnOrder, railHand: state.hands.human.length, humanFame: state.players.human.fame,
    }, null, 2));
  })();
`;

const run = vm.runInNewContext(`${source}\n${assertions}`, context, { filename: "steam-ledger-smoke.js" });
Promise.resolve(run).catch((error) => { console.error(error); process.exitCode = 1; });
