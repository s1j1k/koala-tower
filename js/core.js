/* ATC Trainer core: helpers, storage, progress, sound, screens, sheets. */
window.ATC = {};
(function (A) {
  'use strict';

  // ---------- site config ----------
  // Set in js/config.js.
  A.config = Object.assign({ site: '', tipUrl: '', feedbackUrl: '' }, window.ATC_CONFIG || {});

  // ---------- helpers ----------
  const u = A.u = {};
  u.$ = id => document.getElementById(id);
  u.rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  u.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  u.shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  u.sample = (arr, n) => u.shuffle(arr).slice(0, n);
  u.fmt = n => Number(n).toLocaleString('en-AU', { maximumFractionDigits: 2 });
  u.pad3 = n => String(Math.round(n)).padStart(3, '0');
  u.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  u.norm = h => ((h % 360) + 360) % 360;
  u.hdg = h => { const n = Math.round(u.norm(h)) % 360; return u.pad3(n === 0 ? 360 : n); };
  u.angDiff = (a, b) => { const d = u.norm(b - a); return d > 180 ? d - 360 : d; }; // signed, + = right turn
  u.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  u.strip = s => String(s).replace(/<br\s*\/?>/g, ' · ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  u.range = n => Array.from({ length: n }, (_, i) => i);
  u.today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  u.airlines = ['QFA', 'VOZ', 'JST', 'RXA', 'QLK', 'ANZ', 'SIA', 'UAE', 'CPA', 'FDX'];
  u.callsign = (L = 5) => u.pick(u.airlines) + u.rnd(1, L < 4 ? 99 : 999);
  u.callsigns = (n, L) => { const s = new Set(); while (s.size < n) s.add(u.callsign(L)); return [...s]; };
  u.dirs8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  u.starsHtml = (n, max = 3) => `<span class="stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(max - n)}</span></span>`;
  // Unique numeric distractors near an answer
  u.distract = (ans, n, spread, opts = {}) => {
    const out = new Set([ans]); let guard = 0;
    while (out.size < n + 1 && guard++ < 400) {
      let d = ans + u.pick([-1, 1]) * u.rnd(1, Math.max(1, spread));
      if (opts.min !== undefined && d < opts.min) continue;
      out.add(d);
    }
    return u.shuffle([...out]);
  };
  // choice question helper: options array (strings), correct value
  u.mc = (opts, correct) => { const ch = u.shuffle(opts); return { choices: ch.map(String), ans: ch.indexOf(correct) }; };

  // ---------- storage ----------
  A.store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  // ---------- areas ----------
  A.MAXL = 10;
  A.areas = [
    { id: 'maths', name: 'Maths Meadows', icon: '🧮', color: '#8fd694', deco: ['🌳', '🌼', '🐑', '🌻'],
      real: 'Supporting skill. No calculator in the real tests, and radar and timing tasks need quick mental arithmetic, conversions and speed–distance–time.' },
    { id: 'puzzle', name: 'Puzzle Peaks', icon: '🧩', color: '#c7a6ff', deco: ['⛰️', '🌲', '🍄'],
      real: 'Numerical reasoning: number series, number machines, missing operators, symbol sums and odd-one-out. Builds the logic used in coded reasoning.' },
    { id: 'spatial', name: 'Spatial Sands', icon: '🧭', color: '#f3d27a', deco: ['🌵', '🐪', '🏜️'],
      real: 'ATC Skill Simulations: spatial awareness. Headings, bearings, clock-code positions, mental rotation and keeping track of direction after turns.' },
    { id: 'memory', name: 'Memory Mountains', icon: '🧠', color: '#9fd3f0', deco: ['🏔️', '❄️', '🐧'],
      real: 'ATC Skill Simulations: short-term memory and remembering relationships. Digit span, flight strips, n-back, position memory and linked facts.' },
    { id: 'detail', name: 'Detail Docks', icon: '🔍', color: '#f7a8a8', deco: ['⚓', '⛵', '🦀'],
      real: 'Cognitive Ability Suite: detail accuracy (about 15 min). Fast, careful comparison of codes, strings and tables.' },
    { id: 'coded', name: 'Code Canyon', icon: '🔐', color: '#f0a46c', deco: ['🪨', '🦎', '🌵'],
      real: 'Cognitive Ability Suite: coded reasoning (about 30 min). Apply code keys and rule sets quickly and exactly.' },
    { id: 'radar', name: 'Radar Reef', icon: '📡', color: '#6fe0c8', deco: ['🐠', '🪸', '🐢'],
      real: 'ATC Skill Simulations: radar simulation. Spot conflicts, keep aircraft separated (safety), get them out the right exit (efficiency), and multi-task.' }
  ];
  A.area = id => A.areas.find(a => a.id === id);
  A.drills = {};
  A.drillList = [];
  A.drill = def => { A.drills[def.id] = def; A.drillList.push(def); };
  A.drillsIn = areaId => A.drillList.filter(d => d.area === areaId);

  // ---------- ranks ----------
  A.ranks = [
    { xp: 0, name: 'Student Pilot', icon: '🐣', plane: '#ffffff' },
    { xp: 250, name: 'Cadet', icon: '🐥', plane: '#ffd166' },
    { xp: 700, name: 'Tower Trainee', icon: '🗼', plane: '#7cc8ff' },
    { xp: 1400, name: 'Ground Controller', icon: '🚦', plane: '#ff9ecb' },
    { xp: 2500, name: 'Tower Controller', icon: '🎧', plane: '#5ee0a8' },
    { xp: 4000, name: 'Approach Controller', icon: '🛬', plane: '#c7a6ff' },
    { xp: 6000, name: 'En-route Controller', icon: '🌏', plane: '#ffa96b' },
    { xp: 9000, name: 'Senior Controller', icon: '⭐', plane: '#ffe17a' },
    { xp: 13000, name: 'Chief of the Skies', icon: '👑', plane: '#ff6b9d' }
  ];

  // ---------- progress ----------
  const KEY = 'atctrainer:v2';
  const blank = () => ({
    xp: 0, drills: {}, history: [], streak: { last: null, days: 0, best: 0 }, rings: 0,
    settings: { len: 90, sound: true, buzz: true, unlockAll: false, aids: true },
    world: null, dailyDone: null
  });
  const P = A.prog = {};
  P.data = Object.assign(blank(), A.store.get(KEY) || {});
  P.data.settings = Object.assign(blank().settings, P.data.settings || {});
  P.save = () => A.store.set(KEY, P.data);
  P.reset = () => { P.data = blank(); P.save(); };
  P.d = id => (P.data.drills[id] = P.data.drills[id] || { unlocked: 1, stars: {}, best: {}, plays: 0 });
  P.peek = id => P.data.drills[id] || { unlocked: 1, stars: {}, best: {}, plays: 0 };
  P.unlocked = id => P.data.settings.unlockAll ? A.MAXL : P.peek(id).unlocked;
  P.stars = (id, L) => P.peek(id).stars[L] || 0;
  P.topLevel = id => { const d = P.peek(id); let t = 0; for (const k in d.stars) if (d.stars[k] > 0) t = Math.max(t, +k); return t; };
  P.totalStars = id => Object.values(P.peek(id).stars).reduce((a, b) => a + b, 0);
  P.rank = (xp = P.data.xp) => {
    let i = 0; A.ranks.forEach((r, k) => { if (xp >= r.xp) i = k; });
    const r = A.ranks[i], nx = A.ranks[i + 1];
    return { i, ...r, next: nx, pct: nx ? (xp - r.xp) / (nx.xp - r.xp) : 1 };
  };
  P.addXp = n => {
    const before = P.rank().i; P.data.xp += Math.max(0, Math.round(n)); P.save();
    const after = P.rank();
    if (after.i > before) { A.toast(`${after.icon} Rank up: ${after.name}!`, 2600); A.sfx('up'); A.confetti(60); }
    A.emit('xp');
  };
  P.bumpStreak = () => {
    const s = P.data.streak, t = u.today();
    if (s.last === t) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yd = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    s.days = s.last === yd ? s.days + 1 : 1; s.best = Math.max(s.best || 0, s.days); s.last = t;
  };
  // res: {stars, score, acc}
  P.record = (id, L, res) => {
    const d = P.d(id), out = { prevStars: d.stars[L] || 0, prevBest: d.best[L] || 0, unlockedNew: false };
    d.plays++;
    if (res.stars > (d.stars[L] || 0)) d.stars[L] = res.stars;
    if ((res.score || 0) > (d.best[L] || 0)) d.best[L] = res.score;
    if (res.stars >= 1 && L >= d.unlocked && L < A.MAXL) { d.unlocked = L + 1; out.unlockedNew = true; }
    P.data.history.unshift({ t: Date.now(), id, L, st: res.stars, sc: res.score || 0, acc: Math.round((res.acc || 0) * 100) });
    P.data.history.length = Math.min(P.data.history.length, 300);
    P.bumpStreak();
    // XP: effort + level + stars, bonus for first time getting more stars
    let xp = 4 + (res.points || 0) * (1 + 0.18 * (L - 1)) + res.stars * 8;
    if (res.stars > out.prevStars) xp += (res.stars - out.prevStars) * 10 * (1 + 0.1 * L);
    out.xp = Math.round(xp);
    P.save();
    P.addXp(out.xp);
    return out;
  };
  P.areaStats = areaId => {
    const ds = A.drillsIn(areaId); let st = 0, played = 0, lv = 0;
    ds.forEach(d => { st += P.totalStars(d.id); if (P.peek(d.id).plays) played++; lv += P.topLevel(d.id); });
    return { stars: st, max: ds.length * A.MAXL * 3, played, n: ds.length, avgLevel: ds.length ? lv / ds.length : 0 };
  };
  // Weakest area / drill, for the tower and the daily flight
  P.weakAreas = () => [...A.areas].sort((a, b) => {
    const sa = P.areaStats(a.id), sb = P.areaStats(b.id);
    return (sa.avgLevel + sa.played * 0.1) - (sb.avgLevel + sb.played * 0.1) || Math.random() - 0.5;
  });
  P.weakDrill = areaId => [...A.drillsIn(areaId)].sort((a, b) =>
    (P.topLevel(a.id) + P.peek(a.id).plays * 0.05) - (P.topLevel(b.id) + P.peek(b.id).plays * 0.05) || Math.random() - 0.5)[0];
  P.playLevel = id => { const top = P.topLevel(id), un = P.peek(id).unlocked; return Math.max(1, Math.min(un, A.MAXL, (P.stars(id, top) === 3 ? top + 1 : top) || 1)); };

  // ---------- tiny event bus ----------
  const subs = {};
  A.on = (ev, fn) => (subs[ev] = subs[ev] || []).push(fn);
  A.emit = (ev, x) => (subs[ev] || []).forEach(fn => fn(x));

  // ---------- sound & haptics ----------
  let ac = null;
  function tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slide) {
    const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  A.sfx = type => {
    const s = P.data.settings;
    if (type === 'bad' && s.buzz && navigator.vibrate) { try { navigator.vibrate(35); } catch (e) { /* ignore */ } }
    if (!s.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      if (type === 'ok') { tone(880, 0.09, 'sine', 0.1); tone(1320, 0.12, 'sine', 0.08, 0.06); }
      else if (type === 'bad') tone(240, 0.22, 'triangle', 0.13, 0, 150);
      else if (type === 'tick') tone(1200, 0.03, 'square', 0.03);
      else if (type === 'ring') { tone(1046, 0.08, 'sine', 0.08); tone(1568, 0.14, 'sine', 0.07, 0.07); }
      else if (type === 'alarm') { tone(660, 0.12, 'square', 0.05); tone(660, 0.12, 'square', 0.05, 0.18); }
      else if (type === 'star' || type === 'up') [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'sine', 0.09, i * 0.09));
    } catch (e) { /* audio not available */ }
  };

  // ---------- screens ----------
  A.cur = 'world'; A.prev = 'world';
  A.show = id => {
    if (id !== A.cur) { A.prev = A.cur; A.cur = id; }
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('hidden', s.id !== 'scr-' + id));
    const el = u.$('scr-' + id); if (el && el.classList.contains('page')) el.scrollTop = 0;
    A.emit('screen', id);
  };

  // ---------- sheet (bottom modal) ----------
  let sheetClose = null;
  A.sheet = (html, onClose) => {
    u.$('sheet').innerHTML = '<div class="grab"></div>' + html;
    u.$('sheetWrap').classList.remove('hidden');
    u.$('sheet').scrollTop = 0;
    sheetClose = onClose || null;
    return u.$('sheet');
  };
  A.closeSheet = () => {
    if (u.$('sheetWrap').classList.contains('hidden')) return;
    u.$('sheetWrap').classList.add('hidden');
    const f = sheetClose; sheetClose = null; if (f) f();
  };
  A.sheetOpen = () => !u.$('sheetWrap').classList.contains('hidden');
  u.$('sheetBack').addEventListener('click', A.closeSheet);

  // ---------- toast & effects ----------
  let toastT = 0;
  A.toast = (txt, ms = 1600) => {
    const t = u.$('toast'); t.textContent = txt; t.classList.remove('hidden');
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('hidden'), ms);
  };
  A.confetti = (n = 40) => {
    const fx = u.$('fx'), cols = ['#5ee0a8', '#ffd166', '#ff9ecb', '#7cc8ff', '#c7a6ff', '#ffa96b'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i'); c.className = 'conf';
      c.style.left = Math.random() * 100 + 'vw'; c.style.background = u.pick(cols);
      c.style.animationDuration = (1.4 + Math.random() * 1.6) + 's'; c.style.animationDelay = Math.random() * 0.4 + 's';
      fx.appendChild(c); setTimeout(() => c.remove(), 3600);
    }
  };
  A.floaty = (txt, x, y) => {
    const f = document.createElement('div'); f.className = 'floaty'; f.textContent = txt;
    f.style.left = x + 'px'; f.style.top = y + 'px'; u.$('fx').appendChild(f); setTimeout(() => f.remove(), 950);
  };
})(window.ATC);
