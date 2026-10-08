const STORAGE_KEY = 'ps-cookie-clicker-save';

const cookieButton = document.getElementById('cookieButton');
const cookieCountEl = document.getElementById('cookieCount');
const clickPowerEl = document.getElementById('clickPower');
const cpsValueEl = document.getElementById('cpsValue');
const totalCookiesEl = document.getElementById('totalCookies');
const playerLevelEl = document.getElementById('playerLevel');
const boostValueEl = document.getElementById('boostValue');
const achievementCountEl = document.getElementById('achievementCount');
const shopListEl = document.getElementById('shopList');
const achievementListEl = document.getElementById('achievementList');

const defaultState = {
  cookies: 0,
  totalCookies: 0,
  clickPower: 1,
  cps: 0,
  level: 1,
  upgrades: {
    cursor: 0,
    grandpa: 0,
    duo: 0,
    factory: 0,
    lab: 0,
  },
  achievements: {
    starter: false,
    firstHundred: false,
    speedster: false,
    baker: false,
    boss: false,
  },
};

const shop = [
  { key: 'cursor', name: 'Cursor', baseCost: 15, cps: 0.5, clickBonus: 0, icon: '🖱️' },
  { key: 'grandpa', name: 'Grandma', baseCost: 60, cps: 2.5, clickBonus: 0, icon: '👵' },
  { key: 'duo', name: 'DualSense', baseCost: 180, cps: 8, clickBonus: 1, icon: '🎮' },
  { key: 'factory', name: 'Factory', baseCost: 500, cps: 18, clickBonus: 2, icon: '🏭' },
  { key: 'lab', name: 'Lab', baseCost: 1400, cps: 45, clickBonus: 5, icon: '🧪' },
];

const achievements = [
  { key: 'starter', title: 'First Bite', detail: 'Bake 1 cookie', icon: '🍪', threshold: 1 },
  { key: 'firstHundred', title: 'Cookie Hunter', detail: 'Bake 100 cookies', icon: '🎯', threshold: 100 },
  { key: 'speedster', title: 'Speedster', detail: 'Reach 5 cookies/sec', icon: '⚡', threshold: 5 },
  { key: 'baker', title: 'Baker Pro', detail: 'Bake 500 cookies', icon: '🧁', threshold: 500 },
  { key: 'boss', title: 'Legend', detail: 'Bake 5000 cookies', icon: '👑', threshold: 5000 },
];

let state = loadState();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultState);

  try {
    const parsed = JSON.parse(saved);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      upgrades: { ...defaultState.upgrades, ...(parsed.upgrades || {}) },
      achievements: { ...defaultState.achievements, ...(parsed.achievements || {}) },
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function calculateCps() {
  return shop.reduce((sum, item) => {
    return sum + (state.upgrades[item.key] * item.cps);
  }, 0);
}

function calculateClickPower() {
  return shop.reduce((sum, item) => {
    return sum + (state.upgrades[item.key] * item.clickBonus);
  }, defaultState.clickPower);
}

function getUpgradeCost(item) {
  return Math.floor(item.baseCost * Math.pow(1.18, state.upgrades[item.key]));
}

function updateLevel() {
  state.level = Math.max(1, Math.floor(Math.sqrt(state.totalCookies / 25)) + 1);
}

function unlockAchievements() {
  achievements.forEach((achievement) => {
    if (!state.achievements[achievement.key] && state.totalCookies >= achievement.threshold) {
      state.achievements[achievement.key] = true;
    }

    if (state.cps >= 5 && !state.achievements.speedster) {
      state.achievements.speedster = true;
    }
  });
}

function renderShop() {
  shopListEl.innerHTML = '';

  shop.forEach((item) => {
    const itemElement = document.createElement('button');
    itemElement.type = 'button';
    itemElement.className = 'shop-item';

    const owned = state.upgrades[item.key];
    const cost = getUpgradeCost(item);
    const canAfford = state.cookies >= cost;

    itemElement.classList.toggle('locked', !canAfford);
    itemElement.innerHTML = `
      <div class="info">
        <span class="name">${item.icon} ${item.name}</span>
        <span class="meta">Owned: ${owned}</span>
      </div>
      <span class="buy">${cost} 🍪</span>
    `;

    itemElement.addEventListener('click', () => buyUpgrade(item.key));
    shopListEl.appendChild(itemElement);
  });
}

function renderAchievements() {
  achievementListEl.innerHTML = '';

  achievements.forEach((achievement) => {
    const unlocked = state.achievements[achievement.key];
    const element = document.createElement('div');
    element.className = `achievement ${unlocked ? 'unlocked' : ''}`;
    element.innerHTML = `
      <div class="icon">${achievement.icon}</div>
      <div class="title">${achievement.title}</div>
      <div class="detail">${achievement.detail}</div>
    `;
    achievementListEl.appendChild(element);
  });
}

function renderStats() {
  cookieCountEl.textContent = Math.floor(state.cookies).toLocaleString();
  totalCookiesEl.textContent = Math.floor(state.totalCookies).toLocaleString();
  clickPowerEl.textContent = Math.floor(calculateClickPower()).toLocaleString();
  cpsValueEl.textContent = calculateCps().toFixed(1).toLocaleString();
  playerLevelEl.textContent = state.level;
  boostValueEl.textContent = `x${(1 + state.level * 0.1).toFixed(1)}`;

  const unlockedCount = Object.values(state.achievements).filter(Boolean).length;
  achievementCountEl.textContent = `${unlockedCount}/${achievements.length}`;
}

function buyUpgrade(key) {
  const item = shop.find((entry) => entry.key === key);
  if (!item) return;

  const cost = getUpgradeCost(item);
  if (state.cookies < cost) return;

  state.cookies -= cost;
  state.upgrades[key] += 1;
  state.clickPower = calculateClickPower();
  state.cps = calculateCps();
  updateLevel();
  unlockAchievements();
  render();
}

function clickCookie() {
  const gain = calculateClickPower();
  state.cookies += gain;
  state.totalCookies += gain;
  unlockAchievements();
  render();
}

function autoTick() {
  const gain = calculateCps();
  if (gain > 0) {
    state.cookies += gain;
    state.totalCookies += gain;
    unlockAchievements();
    render();
  }
}

function render() {
  renderStats();
  renderShop();
  renderAchievements();
  saveState();
}

cookieButton.addEventListener('click', clickCookie);

setInterval(autoTick, 1000);
render();
