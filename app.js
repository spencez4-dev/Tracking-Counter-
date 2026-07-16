
const STORAGE_KEY = 'loadQuestStateV1';
const HOURLY_GOAL = 20;

const defaults = {
  log: [],
  dailyGoal: 150,
  minutesPerUpdate: 5,
  raceWins: 0,
  completedHours: [],
  selectedVehicle: 'starter-semi',
  theme: 'light',
  sound: true,
  particles: true
};

const state = {
  ...defaults,
  ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
};

const $ = id => document.getElementById(id);
let audioContext;
let lastHourKey = currentHourKey();

const vehicles = [
  { id:'starter-semi', icon:'🚛', name:'Starter Semi', type:'SEMI', rule:'Unlocked from the start', unlocked:s=>true },
  { id:'red-racer', icon:'🏎️', name:'Redline Racer', type:'RACE CAR', rule:'Reach Level 3', unlocked:s=>lifetimeLevel()>=3 },
  { id:'box-truck', icon:'🚚', name:'Box Truck Blitz', type:'TRUCK', rule:'Win 5 hourly races', unlocked:s=>s.raceWins>=5 },
  { id:'taxi', icon:'🚕', name:'Yellow Jacket', type:'STREET', rule:'Reach Level 6', unlocked:s=>lifetimeLevel()>=6 },
  { id:'police', icon:'🚓', name:'Interceptor', type:'PURSUIT', rule:'Win 12 hourly races', unlocked:s=>s.raceWins>=12 },
  { id:'fire', icon:'🚒', name:'Code Red', type:'HEAVY', rule:'Reach Level 10', unlocked:s=>lifetimeLevel()>=10 },
  { id:'bus', icon:'🚌', name:'People Mover', type:'ODDBALL', rule:'Track 500 lifetime loads', unlocked:s=>lifetimeXP()>=500 },
  { id:'formula', icon:'🏁', name:'Formula Freight', type:'RACE CAR', rule:'Win 25 hourly races', unlocked:s=>s.raceWins>=25 },
  { id:'monster', icon:'🛻', name:'Mud Titan', type:'OFF-ROAD', rule:'Reach Level 15', unlocked:s=>lifetimeLevel()>=15 },
  { id:'rocket', icon:'🚀', name:'Rocket Hauler', type:'LEGENDARY', rule:'Track 1,000 lifetime loads', unlocked:s=>lifetimeXP()>=1000 },
  { id:'ufo', icon:'🛸', name:'Alien Dispatch', type:'MYTHIC', rule:'Reach Level 25', unlocked:s=>lifetimeLevel()>=25 },
  { id:'crown-semi', icon:'👑', name:'King of Freight', type:'MYTHIC SEMI', rule:'Win 50 hourly races', unlocked:s=>s.raceWins>=50 }
];

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...state,
    log: state.log.slice(0, 1000),
    completedHours: state.completedHours.slice(-300)
  }));
}

function currentHourKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
}

function todayKey(date = new Date()) {
  return date.toDateString();
}

function todaysEntries() {
  const key = todayKey();
  return state.log.filter(entry => todayKey(new Date(entry.time)) === key);
}

function todayCount() {
  return todaysEntries().reduce((sum, entry) => sum + entry.delta, 0);
}

function positiveTodayCount() {
  return Math.max(0, todaysEntries().reduce((sum, entry) => sum + entry.delta, 0));
}


function lifetimeXP() {
  return Math.max(0, state.log.reduce((sum, entry) => sum + entry.delta, 0));
}

function lifetimeLevel() {
  return Math.floor(lifetimeXP() / 100) + 1;
}

function levelProgress() {
  return lifetimeXP() % 100;
}

function hourlyPositiveCount(date = new Date()) {
  const key = currentHourKey(date);
  return Math.max(0, state.log.reduce((sum, entry) => {
    if (currentHourKey(new Date(entry.time)) !== key) return sum;
    return sum + entry.delta;
  }, 0));
}

function hourlyTotalsToday() {
  const totals = {};
  for (const entry of todaysEntries()) {
    const key = currentHourKey(new Date(entry.time));
    totals[key] = (totals[key] || 0) + entry.delta;
  }
  return totals;
}

function bestHour() {
  return Math.max(0, ...Object.values(hourlyTotalsToday()).map(total => Math.max(0, total)));
}

function hourlyStreak() {
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now);
    d.setHours(now.getHours() - i, 0, 0, 0);
    const count = hourlyPositiveCount(d);
    if (count >= HOURLY_GOAL) streak += 1;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}

function selectedVehicle() {
  return vehicles.find(h => h.id === state.selectedVehicle) || vehicles[0];
}

function secondsUntilNextHour() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(now.getHours() + 1, 0, 0, 0);
  return Math.max(0, Math.floor((next - now) / 1000));
}

function formatCountdown(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
}

function formatTime(ts) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(ts));
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours ? `${hours}h ${mins}m` : `${mins} min`;
}

function render() {
  const current = todayCount();
  const positive = positiveTodayCount();
  const hourly = hourlyPositiveCount();
  const raceProgress = Math.min(100, (hourly / HOURLY_GOAL) * 100);
  const xp = lifetimeXP();
  const level = lifetimeLevel();
  const currentLevelProgress = levelProgress();
  const goalPct = Math.min(100, Math.round((positive / Math.max(1, state.dailyGoal)) * 100));

  $('mainCount').textContent = current;
  $('timeEstimate').textContent = formatDuration(positive * state.minutesPerUpdate);
  $('bestHour').textContent = `${bestHour()} loads`;
  $('hourStreak').textContent = hourlyStreak();

  $('trackFill').style.width = `${raceProgress}%`;
  $('horse').style.left = `${raceProgress}%`;
  $('horse').textContent = selectedVehicle().icon;
  $('horse').classList.toggle('finished', hourly >= HOURLY_GOAL);
  $('raceCount').textContent = `${Math.min(HOURLY_GOAL, hourly)} / ${HOURLY_GOAL}`;

  if (hourly >= HOURLY_GOAL) {
    $('raceMessage').textContent = 'Checkered flag claimed. Hourly quest complete.';
  } else if (hourly >= 12) {
    $('raceMessage').textContent = `${HOURLY_GOAL-hourly} loads left — final lap.`;
  } else if (hourly >= 8) {
    $('raceMessage').textContent = `${HOURLY_GOAL-hourly} loads left — gaining ground.`;
  } else if (hourly > 0) {
    $('raceMessage').textContent = `${HOURLY_GOAL-hourly} loads left — engines are warming up.`;
  } else {
    $('raceMessage').textContent = 'Green flag. Let it rip.';
  }

  $('shiftScore').textContent = xp;
  $('xpFill').style.width = `${currentLevelProgress}%`;
  $('levelText').textContent = `Level ${level} · ${currentLevelProgress} / 100 XP`;

  $('goalRing').style.setProperty('--pct', goalPct);
  $('goalPct').textContent = `${goalPct}%`;
  $('goalProgress').textContent = `${positive} / ${state.dailyGoal}`;

  $('raceWins').textContent = state.raceWins;
  $('selectedVehicleLabel').textContent = `Driving: ${selectedVehicle().name}`;

  $('goalInput').value = state.dailyGoal;
  $('minutesInput').value = state.minutesPerUpdate;

  renderLog();
  renderStable();
  applyTheme();
}

function renderLog() {
  if (!state.log.length) {
    $('log').innerHTML = '<div class="empty">No load updates yet. Saddle up.</div>';
    return;
  }

  $('log').innerHTML = state.log.slice(0, 100).map(entry => `
    <div class="log-entry">
      <div class="delta ${entry.delta > 0 ? 'plus' : ''}">${entry.delta > 0 ? '+1' : '−1'}</div>
      <div>Load board: ${entry.value}</div>
      <time class="log-time">${formatTime(entry.time)}</time>
    </div>
  `).join('');
}

function renderStable() {
  const unlockedCount = vehicles.filter(vehicle => vehicle.unlocked(state)).length;

  $('stableGrid').innerHTML = `
    <div class="garage-summary" style="grid-column:1/-1">
      <div class="garage-chip"><span>Lifetime Level</span><strong>${lifetimeLevel()}</strong></div>
      <div class="garage-chip"><span>Lifetime XP</span><strong>${lifetimeXP()}</strong></div>
      <div class="garage-chip"><span>Rigs Unlocked</span><strong>${unlockedCount} / ${vehicles.length}</strong></div>
    </div>
    ${vehicles.map(vehicle => {
      const unlocked = vehicle.unlocked(state);
      return `
        <button
          class="skin-card ${unlocked ? 'unlocked' : ''} ${state.selectedVehicle === vehicle.id ? 'selected' : ''}"
          type="button"
          data-vehicle="${vehicle.id}"
          ${unlocked ? '' : 'disabled'}
        >
          <span class="skin-icon">${vehicle.icon}</span>
          <span class="skin-name">${vehicle.name}</span>
          <span class="skin-type">${vehicle.type}</span>
          <span class="skin-rule">${vehicle.rule}</span>
        </button>
      `;
    }).join('')}
  `;

  document.querySelectorAll('[data-vehicle]').forEach(button => {
    button.addEventListener('click', () => {
      state.selectedVehicle = button.dataset.vehicle;
      save();
      render();
      showToast(`${selectedVehicle().name} selected`);
    });
  });
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  document.querySelector('meta[name="theme-color"]').setAttribute(
    'content',
    state.theme === 'dark' ? '#12110f' : '#f5f1e8'
  );

  $('soundToggle').classList.toggle('on', state.sound);
  $('soundToggle').setAttribute('aria-checked', String(state.sound));
  $('particlesToggle').classList.toggle('on', state.particles);
  $('particlesToggle').setAttribute('aria-checked', String(state.particles));
}

function animateCount(delta) {
  const count = $('mainCount');
  count.classList.remove('bump', 'drop');
  void count.offsetWidth;
  count.classList.add(delta > 0 ? 'bump' : 'drop');

  if (delta > 0) {
    $('plusBtn').classList.remove('flash');
    void $('plusBtn').offsetWidth;
    $('plusBtn').classList.add('flash');
  }
}

function tone(kind = 'plus', special = false) {
  if (!state.sound) return;

  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = kind === 'plus' ? 'sine' : 'triangle';
  oscillator.frequency.setValueAtTime(special ? 680 : kind === 'plus' ? 510 : 280, now);
  oscillator.frequency.exponentialRampToValueAtTime(special ? 1020 : kind === 'plus' ? 780 : 215, now + .09);

  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(special ? .1 : .065, now + .008);
  gain.gain.exponentialRampToValueAtTime(.0001, now + .14);

  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + .15);
}

function particleBurst(source, amount = 14, scale = 1) {
  if (!state.particles) return;

  const rect = source.getBoundingClientRect();

  for (let i = 0; i < amount; i++) {
    const particle = document.createElement('i');
    particle.className = 'particle';
    particle.style.left = `${rect.left + rect.width / 2}px`;
    particle.style.top = `${rect.top + rect.height / 2}px`;
    particle.style.width = `${(5 + Math.random() * 6) * scale}px`;
    particle.style.height = `${(6 + Math.random() * 10) * scale}px`;
    particle.style.setProperty('--x', `${(Math.random() - .5) * 220 * scale}px`);
    particle.style.setProperty('--y', `${(-35 - Math.random() * 150) * scale}px`);
    particle.style.setProperty('--r', `${Math.random() * 800 - 400}deg`);

    if (i % 3 === 1) particle.style.background = 'var(--accent-2)';
    if (i % 3 === 2) particle.style.background = 'var(--gold)';

    $('fx').appendChild(particle);
    setTimeout(() => particle.remove(), 1300);
  }
}

function dustBurst() {
  const scene = document.querySelector('.race-scene');
  const horseRect = $('horse').getBoundingClientRect();
  const sceneRect = scene.getBoundingClientRect();

  for (let i = 0; i < 8; i++) {
    const dust = document.createElement('i');
    dust.className = 'dust';
    dust.style.left = `${horseRect.left - sceneRect.left + horseRect.width * .12}px`;
    dust.style.top = `${horseRect.bottom - sceneRect.top - 16}px`;
    dust.style.setProperty('--dx', `${-20 - Math.random() * 70}px`);
    dust.style.setProperty('--dy', `${(Math.random() - .5) * 32}px`);
    scene.appendChild(dust);
    setTimeout(() => dust.remove(), 750);
  }
}

function fullCelebration() {
  const trophy = $('trophy');
  trophy.classList.remove('show');
  void trophy.offsetWidth;
  trophy.classList.add('show');

  flashWord('CHECKERED FLAG!');
  particleBurst($('horse'), 95, 2.5);
  [0, 90, 180, 280].forEach(delay => setTimeout(() => tone('plus', true), delay));
}

function flashWord(text) {
  const word = $('megaWord');
  word.textContent = text;
  word.classList.remove('show');
  void word.offsetWidth;
  word.classList.add('show');
}

function maybeCompleteRace() {
  const key = currentHourKey();
  const hourly = hourlyPositiveCount();

  if (hourly < HOURLY_GOAL || state.completedHours.includes(key)) return;

  state.completedHours.push(key);
  state.raceWins += 1;
  save();
  fullCelebration();
  showToast(`Hourly race won · ${state.raceWins} total`);
}

function changeLoad(delta) {
  const next = todayCount() + delta;

  state.log.unshift({
    delta,
    value: next,
    time: Date.now()
  });

  const messages = delta > 0
    ? ['Load secured.', 'Driver updated.', 'Another one on the board.', 'Dispatch magic.', 'Momentum acquired.']
    : ['Load removed.', 'All scores corrected.', 'Load removed everywhere.'];

  $('heroMessage').textContent = messages[Math.floor(Math.random() * messages.length)];

  save();
  render();
  animateCount(delta);
  tone(delta > 0 ? 'plus' : 'minus');

  if (delta > 0) {
    particleBurst($('plusBtn'));
    dustBurst();
    maybeCompleteRace();

    const netLoads = positiveTodayCount();
    if (netLoads === state.dailyGoal) {
      flashWord('SHIFT GOAL CRUSHED!');
      particleBurst($('mainCount'), 100, 2.4);
      showToast('Daily load goal complete');
    }
  } else {
    showToast('Load removed from every score');
  }
}

function undo() {
  if (!state.log.length) {
    showToast('Nothing to undo');
    return;
  }

  state.log.shift();
  save();
  render();
  showToast('Last update removed');
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `load-quest-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast('Backup exported');
}

function showToast(text) {
  const toast = $('toast');
  toast.textContent = text;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1700);
}

function tickClock() {
  const key = currentHourKey();

  if (key !== lastHourKey) {
    lastHourKey = key;
    render();
    showToast('New hour. Back to the starting gate.');
  }

  $('hourCountdown').textContent = formatCountdown(secondsUntilNextHour());
}

$('plusBtn').addEventListener('click', () => changeLoad(1));
$('minusBtn').addEventListener('click', () => changeLoad(-1));
$('undoBtn').addEventListener('click', undo);
$('exportBtn').addEventListener('click', exportBackup);

$('themeBtn').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  save();
  render();
});

$('stableBtn').addEventListener('click', () => {
  renderStable();
  $('stableDialog').showModal();
});

$('closeStable').addEventListener('click', () => $('stableDialog').close());
$('settingsBtn').addEventListener('click', () => $('settingsDialog').showModal());

$('closeSettings').addEventListener('click', () => {
  state.dailyGoal = Math.max(1, Number($('goalInput').value) || defaults.dailyGoal);
  state.minutesPerUpdate = Math.max(1, Number($('minutesInput').value) || defaults.minutesPerUpdate);
  save();
  render();
  $('settingsDialog').close();
});

$('soundToggle').addEventListener('click', () => {
  state.sound = !state.sound;
  save();
  applyTheme();
});

$('particlesToggle').addEventListener('click', () => {
  state.particles = !state.particles;
  save();
  applyTheme();
});

$('importBtn').addEventListener('click', () => $('importInput').click());

$('importInput').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());
    Object.assign(state, defaults, imported);
    save();
    render();
    showToast('Backup imported');
    $('settingsDialog').close();
  } catch {
    alert('That backup file could not be read.');
  }

  event.target.value = '';
});

$('resetBtn').addEventListener('click', () => {
  if (!confirm('Reset all Load Quest data? This cannot be undone.')) return;
  Object.assign(state, defaults);
  save();
  render();
  $('settingsDialog').close();
  showToast('Load Quest reset');
});

document.addEventListener('keydown', event => {
  if (event.key === '+' || event.key === '=' || event.key === 'ArrowUp') changeLoad(1);
  if (event.key === '-' || event.key === '_' || event.key === 'ArrowDown') changeLoad(-1);

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    undo();
  }
});

render();
tickClock();
setInterval(tickClock, 1000);

if ('serviceWorker' in navigator) {
  addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js?v=1', {
        updateViaCache: 'none'
      });

      await registration.update();

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;

        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            worker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        location.reload();
      });
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  });
}
