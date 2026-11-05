/* The flying world: top-down map (headings) and side view (pitch & flight levels). Flying into an airport or gate opens its lessons. */
(function (A) {
  'use strict';
  const u = A.u, $ = u.$, P = A.prog;
  const cv = $('worldCanvas'), g = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, z = 1, safeTop = 0;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:env(safe-area-inset-top);visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    z = u.clamp(Math.min(W, H) / 640, 0.55, 1); safeTop = probe.offsetHeight || 0;
  }
  window.addEventListener('resize', resize); resize();

  // ---------- seeded random ----------
  const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };

  // ---------- world layout ----------
  const WORLD = 2600, CX = 1300, CY = 1300, NMPX = 20;
  const HQ = { id: 'hq', name: 'Koala Tower HQ', icon: '🐨', color: '#ffe3a3', deco: ['🌴', '🦘', '🌺'], x: CX, y: CY, r: 170 };
  const regions = [HQ, ...A.areas.map((a, i) => { const an = (-90 + i * 360 / 7) * Math.PI / 180; return { ...a, x: CX + Math.cos(an) * 840, y: CY + Math.sin(an) * 840, r: 215 }; })];
  A.regions = regions;

  function makeIsland(reg, seed) {
    const rnd = mulberry(seed), size = Math.ceil(reg.r * 2.7), k = 1.5;
    const c = document.createElement('canvas'); c.width = c.height = Math.ceil(size * k);
    const x = c.getContext('2d'); x.scale(k, k);
    const m = size / 2, p1 = rnd() * 6, p2 = rnd() * 6, p3 = rnd() * 6;
    const R = th => reg.r * (1 + 0.15 * Math.sin(3 * th + p1) + 0.08 * Math.sin(5 * th + p2) + 0.05 * Math.sin(8 * th + p3));
    const blob = (sc, fill) => { x.beginPath(); for (let i = 0; i <= 90; i++) { const th = i / 90 * Math.PI * 2, r = R(th) * sc; x[i ? 'lineTo' : 'moveTo'](m + Math.cos(th) * r, m + Math.sin(th) * r); } x.closePath(); x.fillStyle = fill; x.fill(); };
    blob(1.2, 'rgba(160,230,255,.18)'); blob(1.07, '#f6e3b4'); blob(1, reg.color); blob(0.72, 'rgba(0,0,0,.07)');
    // decorations
    x.font = '26px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let i = 0; i < 16; i++) {
      const th = rnd() * Math.PI * 2, d = (0.42 + rnd() * 0.42) * R(th);
      const dx = Math.cos(th) * d, dy = Math.sin(th) * d;
      if (Math.abs(dy) < 40 && Math.abs(dx) < 95) continue;
      x.fillText(reg.deco[i % reg.deco.length], m + dx, m + dy);
    }
    // runway
    const ang = rnd() * Math.PI;
    x.save(); x.translate(m, m); x.rotate(ang);
    x.fillStyle = '#44515e'; x.beginPath(); x.roundRect ? x.roundRect(-82, -13, 164, 26, 6) : x.rect(-82, -13, 164, 26); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 2; x.setLineDash([10, 9]); x.beginPath(); x.moveTo(-70, 0); x.lineTo(70, 0); x.stroke(); x.setLineDash([]);
    x.fillStyle = '#fff'; for (let i = -3; i <= 3; i++) { x.fillRect(-78, i * 3 - 1, 7, 2); x.fillRect(71, i * 3 - 1, 7, 2); }
    x.restore();
    // landing circle
    x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 2; x.setLineDash([6, 6]); x.beginPath(); x.arc(m, m, reg.r * 0.36, 0, 7); x.stroke(); x.setLineDash([]);
    // label
    x.font = '800 21px ui-rounded,"Segoe UI",system-ui,sans-serif';
    const label = `${reg.icon} ${reg.name}`, w = x.measureText(label).width + 26;
    x.fillStyle = 'rgba(13,27,42,.82)'; x.beginPath(); x.roundRect ? x.roundRect(m - w / 2, m + 34, w, 34, 17) : x.rect(m - w / 2, m + 34, w, 34); x.fill();
    x.fillStyle = '#fff'; x.fillText(label, m, m + 52);
    return { c, size };
  }
  const islands = regions.map((r, i) => makeIsland(r, 1234 + i * 977));

  // ocean pattern
  const wave = document.createElement('canvas'); wave.width = wave.height = 180;
  (() => { const x = wave.getContext('2d'), rnd = mulberry(7); x.strokeStyle = 'rgba(255,255,255,.07)'; x.lineWidth = 2; for (let i = 0; i < 9; i++) { const a = rnd() * 180, b = rnd() * 180; x.beginPath(); x.arc(a, b, 9, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); } })();
  const wavePat = g.createPattern(wave, 'repeat');

  // ---------- state ----------
  const saved = P.data.world || {};
  const plane = { x: saved.x || CX, y: saved.y || CY + 60, hdg: saved.hdg === undefined ? 0 : saved.hdg, spd: 165, ap: null, turn: 0, trail: [] };
  const side = { x: 0, alt: 9000, pitch: 0, pin: 0, gates: [], order: [], trail: [], warnT: 0 };
  let view = saved.view === 'side' ? 'side' : 'top';
  const clouds = Array.from({ length: 10 }, (_, i) => { const r = mulberry(99 + i); return { x: r() * WORLD, y: r() * WORLD, s: 0.7 + r() * 0.8 }; });
  const rings = [];
  const ringSpot = () => { for (let i = 0; i < 50; i++) { const x = 150 + Math.random() * (WORLD - 300), y = 150 + Math.random() * (WORLD - 300); if (regions.every(r => Math.hypot(r.x - x, r.y - y) > r.r * 1.1)) return { x, y, ph: Math.random() * 6 }; } return { x: 200, y: 200, ph: 0 }; };
  for (let i = 0; i < 14; i++) rings.push(ringSpot());
  let target = null, cooldown = null, running = false, last = 0, tAcc = 0, aligned = 0, lastReward = -99, tNow = 0, tapMark = null, saveT = 0;

  cooldown = regions.find(r => Math.hypot(r.x - plane.x, r.y - plane.y) < r.r * 0.55) || null;
  A.world = {};
  A.world.setTarget = id => { target = regions.find(r => r.id === id) || regions[1]; aligned = 0; };
  A.world.pickTarget = () => {
    if (P.data.dailyDone !== u.today() && P.data.history.length > 0) return A.world.setTarget('hq');
    const weak = P.weakAreas(); A.world.setTarget((weak.find(a => !target || a.id !== target.id) || weak[0]).id);
  };

  // ---------- controls ----------
  const holdBtn = (el, down, up) => {
    el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture && el.setPointerCapture(e.pointerId); el.classList.add('on'); down(); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => el.addEventListener(ev, () => { el.classList.remove('on'); up(); }));
  };
  holdBtn($('wLeft'), () => { if (view === 'top') { plane.turn = -1; plane.ap = null; } else side.pin = 1; }, () => { plane.turn = 0; side.pin = 0; });
  holdBtn($('wRight'), () => { if (view === 'top') { plane.turn = 1; plane.ap = null; } else side.pin = -1; }, () => { plane.turn = 0; side.pin = 0; });
  $('wMid').addEventListener('click', () => {
    if (view === 'side') { side.pitch = 0; A.toast('Levelling off'); return; }
    if (!target) A.world.pickTarget();
    plane.ap = { reg: target }; A.toast(`Autopilot: heading for ${target.name}`);
  });
  const keys = {};
  window.addEventListener('keydown', e => {
    if (A.cur !== 'world' || A.sheetOpen()) return;
    keys[e.key] = true;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  cv.addEventListener('pointerdown', e => {
    if (view === 'top') {
      const wx = (e.clientX - W / 2) / z + cam.x, wy = (e.clientY - H / 2) / z + cam.y;
      plane.ap = { x: wx, y: wy }; tapMark = { x: wx, y: wy, t: 1.2 };
    } else { side.pin = e.clientY < H / 2 ? 1 : -1; }
  });
  ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { if (view === 'side') side.pin = 0; }));

  function setView(v) {
    view = v;
    $('wView').textContent = v === 'top' ? '📈' : '🗺️';
    $('wView').setAttribute('aria-label', v === 'top' ? 'Switch to side view' : 'Switch to map view');
    $('wLeft').innerHTML = v === 'top' ? '⟲<small>LEFT</small>' : '▲<small>CLIMB</small>';
    $('wRight').innerHTML = v === 'top' ? '⟳<small>RIGHT</small>' : '▼<small>DESCEND</small>';
    $('wMid').innerHTML = v === 'top' ? '🧭<small>AUTO</small>' : '➖<small>LEVEL</small>';
    if (v === 'side' && !side.gates.length) { side.alt = 9000; genGates(); }
    persist();
  }
  $('wView').addEventListener('click', () => { setView(view === 'top' ? 'side' : 'top'); A.toast(view === 'top' ? 'Map view: steer by heading' : 'Side view: fly through the gates at the right flight level', 2200); });

  function persist() { P.data.world = { x: Math.round(plane.x), y: Math.round(plane.y), hdg: Math.round(plane.hdg), view }; P.save(); }

  // ---------- open lessons ----------
  function arrive(reg) {
    A.sfx('ring'); stop();
    A.openRegion(reg.id, () => { cooldown = reg; if (A.cur === 'world') start(); });
  }

  // ---------- top view ----------
  const cam = { x: plane.x, y: plane.y };
  const bearingTo = (x, y) => u.norm(Math.atan2(x - plane.x, -(y - plane.y)) * 180 / Math.PI);
  function updateTop(dt) {
    let turn = plane.turn;
    if (keys.ArrowLeft || keys.a) { turn = -1; plane.ap = null; }
    if (keys.ArrowRight || keys.d) { turn = 1; plane.ap = null; }
    if (turn) plane.hdg = u.norm(plane.hdg + turn * 85 * dt);
    else if (plane.ap) {
      const tx = plane.ap.reg ? plane.ap.reg.x : plane.ap.x, ty = plane.ap.reg ? plane.ap.reg.y : plane.ap.y;
      const d = u.angDiff(plane.hdg, bearingTo(tx, ty)), step = 70 * dt;
      plane.hdg = Math.abs(d) < step ? bearingTo(tx, ty) : u.norm(plane.hdg + Math.sign(d) * step);
      if (!plane.ap.reg && Math.hypot(tx - plane.x, ty - plane.y) < 20) plane.ap = null;
    }
    const r = plane.hdg * Math.PI / 180;
    plane.x += Math.sin(r) * plane.spd * dt; plane.y -= Math.cos(r) * plane.spd * dt;
    // keep inside the world: gentle turn back
    if (plane.x < 60 || plane.y < 60 || plane.x > WORLD - 60 || plane.y > WORLD - 60) { plane.ap = { x: CX, y: CY }; plane.x = u.clamp(plane.x, 40, WORLD - 40); plane.y = u.clamp(plane.y, 40, WORLD - 40); }
    if ((tAcc += dt) > 0.07) { tAcc = 0; plane.trail.push([plane.x, plane.y]); if (plane.trail.length > 26) plane.trail.shift(); }
    cam.x += (plane.x + Math.sin(r) * 60 - cam.x) * Math.min(1, dt * 3); cam.y += (plane.y - Math.cos(r) * 60 - cam.y) * Math.min(1, dt * 3);
    // rings
    rings.forEach((ri, i) => {
      if (Math.hypot(ri.x - plane.x, ri.y - plane.y) < 30) {
        rings[i] = ringSpot(); P.data.rings = (P.data.rings || 0) + 1; P.addXp(2); A.sfx('ring');
        A.floaty('+2 XP', W / 2 - 20, H / 2 - 60);
      }
    });
    // landing
    if (cooldown && Math.hypot(cooldown.x - plane.x, cooldown.y - plane.y) > cooldown.r * 0.55) cooldown = null;
    for (const reg of regions) {
      if (reg !== cooldown && Math.hypot(reg.x - plane.x, reg.y - plane.y) < reg.r * 0.36) { if (plane.ap && plane.ap.reg === reg) plane.ap = null; arrive(reg); return; }
    }
    // tower + heading reward
    if (target) {
      const b = bearingTo(target.x, target.y), d = u.angDiff(plane.hdg, b);
      if (Math.abs(d) <= 8 && !plane.ap) { aligned += dt; if (aligned > 2.5 && tNow - lastReward > 25) { lastReward = tNow; P.addXp(1); A.floaty('Nice heading! +1', W / 2 - 60, H / 2 - 80); A.sfx('ok'); } }
      else aligned = 0;
    }
  }

  function drawPlaneTop(x, y, hdg, s, col) {
    g.save(); g.translate(x, y); g.rotate(hdg * Math.PI / 180); g.scale(s, s);
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(13,27,42,.55)';
    g.fillStyle = col; rr(-24, -3, 48, 11, 5.5); g.fill(); g.stroke();
    rr(-10, 15, 20, 7, 3.5); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(0, 2, 6.5, 21, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#7cc8ff'; g.beginPath(); g.ellipse(0, -9, 3.6, 5, 0, 0, 7); g.fill();
    g.fillStyle = '#ff9ecb'; g.beginPath(); g.arc(-15, 2.5, 2.2, 0, 7); g.arc(15, 2.5, 2.2, 0, 7); g.fill();
    g.strokeStyle = 'rgba(40,40,40,.55)'; g.lineWidth = 2; const sp = (tNow * 40) % Math.PI; g.beginPath(); g.moveTo(Math.cos(sp) * -8, -20); g.lineTo(Math.cos(sp) * 8, -20); g.stroke();
    g.restore();
  }
  const S = (wx, wy) => [(wx - cam.x) * z + W / 2, (wy - cam.y) * z + H / 2];

  function drawTop() {
    g.fillStyle = '#2f8fd0'; g.fillRect(0, 0, W, H);
    g.save(); g.translate(-(cam.x * z) % 180, -(cam.y * z) % 180); g.fillStyle = wavePat; g.fillRect(-180, -180, W + 360, H + 360); g.restore();
    // world edge
    const [ex, ey] = S(0, 0); g.strokeStyle = 'rgba(255,255,255,.25)'; g.setLineDash([12, 10]); g.lineWidth = 2; g.strokeRect(ex, ey, WORLD * z, WORLD * z); g.setLineDash([]);
    regions.forEach((reg, i) => { const [x, y] = S(reg.x, reg.y), sz = islands[i].size * z; if (x + sz / 2 < 0 || x - sz / 2 > W || y + sz / 2 < 0 || y - sz / 2 > H) return; g.drawImage(islands[i].c, x - sz / 2, y - sz / 2, sz, sz); });
    // rings
    rings.forEach(ri => {
      const [x, y] = S(ri.x, ri.y); if (x < -30 || x > W + 30 || y < -30 || y > H + 30) return;
      const p = 1 + Math.sin(tNow * 4 + ri.ph) * 0.08; g.strokeStyle = '#ffd166'; g.lineWidth = 4 * z; g.beginPath(); g.ellipse(x, y, 16 * z * p, 16 * z * p, 0, 0, 7); g.stroke();
      g.fillStyle = 'rgba(255,209,102,.25)'; g.fill();
    });
    if (tapMark) { const [x, y] = S(tapMark.x, tapMark.y); g.strokeStyle = `rgba(255,255,255,${tapMark.t})`; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 14 + (1.2 - tapMark.t) * 20, 0, 7); g.stroke(); }
    // trail
    plane.trail.forEach(([tx, ty], i) => { const [x, y] = S(tx, ty); g.fillStyle = `rgba(255,255,255,${i / plane.trail.length * 0.5})`; g.beginPath(); g.arc(x, y, (1 + i / 9) * z * 1.6, 0, 7); g.fill(); });
    // plane + shadow
    const [px, py] = S(plane.x, plane.y), col = P.rank().plane;
    g.globalAlpha = 0.25; drawPlaneTop(px + 14 * z, py + 22 * z, plane.hdg, 1.25 * z, '#000'); g.globalAlpha = 1;
    drawPlaneTop(px, py, plane.hdg, 1.25 * z, col);
    // clouds above
    clouds.forEach(c => {
      c.x += 6 * 0.016; if (c.x > WORLD + 200) c.x = -200;
      const [x, y] = S(c.x, c.y); if (x < -150 || x > W + 150 || y < -100 || y > H + 100) return;
      g.fillStyle = 'rgba(255,255,255,.55)'; [[0, 0, 40], [34, 8, 30], [-32, 10, 28], [10, 18, 30]].forEach(([dx, dy, r]) => { g.beginPath(); g.arc(x + dx * c.s * z, y + dy * c.s * z, r * c.s * z, 0, 7); g.fill(); });
    });
    drawTargetArrow(); drawHeadingTape(); drawMini();
  }

  function drawTargetArrow() {
    if (!target) return;
    const [tx, ty] = S(target.x, target.y);
    if (tx > 30 && tx < W - 30 && ty > 140 && ty < H - 120) return;
    const a = Math.atan2(ty - H / 2, tx - W / 2), mx = W / 2 - 34, my = H / 2 - 120;
    const k = Math.min(Math.abs(mx / Math.cos(a)), Math.abs(my / Math.sin(a)));
    const x = W / 2 + Math.cos(a) * k, y = H / 2 + 10 + Math.sin(a) * k;
    g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.moveTo(16, 0); g.lineTo(-8, -11); g.lineTo(-3, 0); g.lineTo(-8, 11); g.closePath(); g.fill(); g.restore();
    g.font = '20px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(target.icon, x - Math.cos(a) * 26, y - Math.sin(a) * 26);
  }

  function drawHeadingTape() {
    const y = 56 + safeTop, w = Math.min(300, W - 40), x0 = W / 2 - w / 2, pxDeg = w / 90;
    g.fillStyle = 'rgba(13,27,42,.78)'; rr(x0, y, w, 38, 12); g.fill();
    g.save(); rr(x0, y, w, 38, 12); g.clip();
    g.strokeStyle = '#cfe0f0'; g.fillStyle = '#eef4fb'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineWidth = 1.5;
    const h = plane.hdg;
    for (let d = Math.floor(h - 50); d <= h + 50; d++) {
      if (d % 5) continue;
      const x = W / 2 + (d - h) * pxDeg, dd = u.norm(d), big = dd % 10 === 0;
      g.beginPath(); g.moveTo(x, y + 38); g.lineTo(x, y + 38 - (big ? 10 : 5)); g.stroke();
      if (dd % 30 === 0) { const lbl = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' }[dd] || String(dd / 10).padStart(2, '0'); g.font = `${lbl.length === 1 ? 800 : 600} 12px system-ui`; g.fillStyle = lbl.length === 1 ? '#ffd166' : '#eef4fb'; g.fillText(lbl, x, y + 20); }
    }
    if (target) { const b = bearingTo(target.x, target.y), x = W / 2 + u.angDiff(h, b) * pxDeg; const cx = u.clamp(x, x0 + 6, x0 + w - 6); g.fillStyle = '#ff9ecb'; g.beginPath(); g.moveTo(cx, y + 3); g.lineTo(cx - 6, y - 0); g.lineTo(cx + 6, y - 0); g.fill(); g.fillRect(cx - 1.5, y, 3, 9); }
    g.restore();
    g.fillStyle = '#5ee0a8'; rr(W / 2 - 30, y + 36, 60, 24, 8); g.fill();
    g.fillStyle = '#06261a'; g.font = '800 15px system-ui'; g.textAlign = 'center'; g.fillText(`${u.hdg(plane.hdg)}°`, W / 2, y + 53);
  }

  function drawMini() {
    const s = 86, x0 = W - s - 10, y0 = H - 110 - s - 6, k = s / WORLD;
    g.fillStyle = 'rgba(13,27,42,.7)'; rr(x0, y0, s, s, 14); g.fill();
    regions.forEach(r => { g.fillStyle = r.color; g.beginPath(); g.arc(x0 + r.x * k, y0 + r.y * k, r === target ? 6 : 4.5, 0, 7); g.fill(); if (r === target) { g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); } });
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x0 + plane.x * k, y0 + plane.y * k, 3, 0, 7); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0 + plane.x * k, y0 + plane.y * k);
    g.lineTo(x0 + plane.x * k + Math.sin(plane.hdg * Math.PI / 180) * 9, y0 + plane.y * k - Math.cos(plane.hdg * Math.PI / 180) * 9); g.stroke();
  }

  // ---------- side view ----------
  const NMPS = 1.05, SPAN = 16000;
  const terr = x => Math.max(0, 900 + 1500 * Math.sin(x / 9) + 700 * Math.sin(x / 3.7 + 1.3) + 260 * Math.sin(x / 1.3));
  function genGates() {
    while (side.gates.length < 3) {
      const lastG = side.gates[side.gates.length - 1];
      const x = lastG ? lastG.x + 12 : side.x + 9, prev = lastG ? lastG.fl : Math.round(side.alt / 1000) * 10;
      let fl, gg = 0; do { fl = u.rnd(5, 38) * 10; } while ((Math.abs(fl - prev) > 100 || Math.abs(fl - prev) < 20) && gg++ < 100);
      if (!side.order.length) side.order = u.shuffle(regions);
      side.gates.push({ x, fl, reg: side.order.shift() });
    }
  }
  function updateSide(dt) {
    let pin = side.pin;
    if (keys.ArrowUp || keys.w) pin = 1;
    if (keys.ArrowDown || keys.s) pin = -1;
    if (pin) side.pitch = u.clamp(side.pitch + pin * 14 * dt, -14, 14);
    side.x += NMPS * dt;
    side.alt += 6076 * Math.tan(side.pitch * Math.PI / 180) * NMPS * dt;
    const tg = terr(side.x);
    side.warn = side.alt < tg + 600;
    if (side.alt < tg + 120) { side.alt = tg + 120; side.pitch = Math.max(side.pitch, 8); if (side.warnT <= 0) { A.sfx('alarm'); A.toast('🏔️ Terrain! Pull up!'); side.warnT = 3; } }
    side.warnT -= dt;
    if (side.alt > 45000) { side.alt = 45000; side.pitch = Math.min(side.pitch, 0); }
    if ((tAcc += dt) > 0.08) { tAcc = 0; side.trail.push([side.x, side.alt]); if (side.trail.length > 30) side.trail.shift(); }
    genGates();
    const gt = side.gates[0];
    if (gt && side.x >= gt.x) {
      side.gates.shift(); genGates();
      const miss = Math.abs(side.alt - gt.fl * 100);
      if (miss <= 1500) { P.addXp(1); A.floaty('Through the gate! +1', W * 0.24, H / 2 - 70); arrive(gt.reg); }
      else { A.sfx('bad'); A.toast(`Missed by ${u.fmt(Math.round(miss / 100) * 100)} ft. Next gate coming up!`); }
    }
  }
  function drawSide() {
    const top = 186 + safeTop, bot = H - 104, mid = (top + bot) / 2, pxFt = (bot - top) / SPAN, pxNM = W / 15, px0 = W * 0.24;
    const camA = u.clamp(side.alt, SPAN / 2 - 1800, 45000 - SPAN / 2 + 2000);
    const Y = alt => mid - (alt - camA) * pxFt, X = nm => px0 + (nm - side.x) * pxNM;
    const hi = u.clamp(camA / 40000, 0, 1);
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, `rgb(${Math.round(110 - 85 * hi)},${Math.round(190 - 150 * hi)},${Math.round(250 - 140 * hi)})`);
    grd.addColorStop(1, `rgb(${Math.round(190 - 120 * hi)},${Math.round(228 - 140 * hi)},${Math.round(255 - 110 * hi)})`);
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    if (hi > 0.55) { g.fillStyle = `rgba(255,255,255,${(hi - 0.55) * 1.6})`; for (let i = 0; i < 40; i++) { const sx = ((i * 97.3 - side.x * 3) % W + W) % W, sy = (i * 53.7) % (H * 0.6); g.fillRect(sx, sy, 1.6, 1.6); } }
    // FL grid
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1;
    for (let a = Math.ceil((camA - SPAN) / 5000) * 5000; a < camA + SPAN; a += 5000) { const y = Y(a); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    // clouds (parallax)
    for (let i = 0; i < 9; i++) {
      const cx = ((i * 41 - side.x * 0.6 * pxNM / 10) % (W + 300) + W + 300) % (W + 300) - 150, ca = 4000 + (i * 7919) % 32000, cy = Y(ca);
      if (cy < -60 || cy > H + 60) continue;
      g.fillStyle = 'rgba(255,255,255,.7)'; [[0, 0, 26], [24, 6, 20], [-22, 8, 18]].forEach(([dx, dy, r]) => { g.beginPath(); g.arc(cx + dx, cy + dy, r, 0, 7); g.fill(); });
    }
    // gates
    side.gates.forEach(gt => {
      const x = X(gt.x), yc = Y(gt.fl * 100), hh = 1500 * pxFt;
      if (x < -60 || x > W + 80) return;
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(px0, yc); g.lineTo(x, yc); g.stroke(); g.setLineDash([]);
      g.lineWidth = 7; g.strokeStyle = gt.reg.color; g.beginPath(); g.ellipse(x, yc, 13, hh, 0, 0, 7); g.stroke(); g.lineWidth = 1;
      g.fillStyle = 'rgba(13,27,42,.8)'; g.font = '800 13px system-ui'; const lb = `${gt.reg.icon} FL${u.pad3(gt.fl)}`, w = g.measureText(lb).width + 16;
      rr(x - w / 2, yc - hh - 30, w, 24, 12); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(lb, x, yc - hh - 18);
    });
    // terrain & sea
    const seaY = Y(0); g.fillStyle = '#2f8fd0'; g.fillRect(0, seaY, W, H - seaY);
    g.fillStyle = '#6fbf73'; g.beginPath(); g.moveTo(0, H);
    for (let sx = 0; sx <= W + 6; sx += 6) { const nm = side.x + (sx - px0) / pxNM, t = terr(nm); g.lineTo(sx, t > 0 ? Y(t) : seaY + 2); }
    g.lineTo(W, H); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, seaY + 6, W, H);
    // trail + plane
    side.trail.forEach(([tx, ta], i) => { g.fillStyle = `rgba(255,255,255,${i / side.trail.length * 0.6})`; g.beginPath(); g.arc(X(tx), Y(ta), 1.5 + i / 12, 0, 7); g.fill(); });
    drawPlaneSide(px0, Y(side.alt), side.pitch, 1.35, P.rank().plane);
    // altitude tape
    g.fillStyle = 'rgba(13,27,42,.65)'; g.fillRect(0, top - 6, 54, bot - top + 12);
    g.fillStyle = '#eef4fb'; g.font = '600 11px system-ui'; g.textAlign = 'left'; g.textBaseline = 'middle';
    for (let a = Math.ceil((camA - SPAN / 2) / 1000) * 1000; a <= camA + SPAN / 2; a += 1000) {
      const y = Y(a); if (y < top || y > bot) continue;
      g.fillRect(44, y, a % 5000 ? 6 : 10, 1.5); if (a % 5000 === 0) g.fillText(`FL${u.pad3(a / 100)}`, 4, y);
    }
    const fl = Math.round(side.alt / 100);
    g.fillStyle = '#5ee0a8'; rr(2, Y(side.alt) - 12, 58, 24, 8); g.fill(); g.fillStyle = '#06261a'; g.font = '800 12.5px system-ui'; g.fillText(`FL${u.pad3(Math.max(0, fl))}`, 7, Y(side.alt));
    // HUD
    const vs = Math.round(280 * 101.27 * Math.sin(side.pitch * Math.PI / 180) / 50) * 50;
    const hud = `PITCH ${side.pitch >= 0 ? '+' : ''}${side.pitch.toFixed(0)}°   V/S ${vs >= 0 ? '+' : ''}${u.fmt(vs)} fpm   GS 280 kt`;
    g.font = '700 12.5px system-ui'; const hw = g.measureText(hud).width + 22;
    g.fillStyle = 'rgba(13,27,42,.8)'; rr(W / 2 - hw / 2, 56 + safeTop, hw, 30, 12); g.fill();
    g.fillStyle = '#eef4fb'; g.textAlign = 'center'; g.fillText(hud, W / 2, 71 + safeTop);
    // pitch indicator
    g.save(); g.translate(W - 38, bot - 40); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 24, 0, 7); g.stroke();
    g.rotate(-side.pitch * Math.PI / 180); g.strokeStyle = '#ffd166'; g.lineWidth = 3; g.beginPath(); g.moveTo(-20, 0); g.lineTo(20, 0); g.stroke(); g.restore();
    if (side.warn) { g.fillStyle = '#ff5f5f'; g.font = '900 20px system-ui'; g.textAlign = 'center'; g.fillText('TERRAIN · PULL UP', W / 2, bot - 18); }
  }
  function drawPlaneSide(x, y, pitch, s, col) {
    g.save(); g.translate(x, y); g.rotate(-pitch * Math.PI / 180); g.scale(s, s);
    g.strokeStyle = 'rgba(13,27,42,.6)'; g.lineWidth = 1.5; g.fillStyle = col;
    g.beginPath(); g.moveTo(-20, -2); g.lineTo(-27, -15); g.lineTo(-19, -15); g.lineTo(-10, -3); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(0, 0, 23, 6.5, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(2, 2.5, 10, 2.6, 0, 0, 7); g.fill();
    g.fillStyle = '#7cc8ff'; g.beginPath(); g.ellipse(13, -2.4, 4.5, 2.6, 0, 0, 7); g.fill();
    g.fillStyle = '#ff9ecb'; g.beginPath(); g.arc(8, 1.5, 1.8, 0, 7); g.fill();
    g.fillStyle = 'rgba(60,60,60,.6)'; const ph = Math.abs(Math.sin(tNow * 30)); g.fillRect(23, -8 * ph, 2, 16 * ph);
    g.restore();
  }

  // ---------- tower text ----------
  function towerText() {
    let t;
    if (view === 'top') {
      if (!target) A.world.pickTarget();
      const b = bearingTo(target.x, target.y), d = u.angDiff(plane.hdg, b), nm = Math.hypot(target.x - plane.x, target.y - plane.y) / NMPX;
      const instr = Math.abs(d) <= 8 ? `continue heading ${u.hdg(b)}` : `turn ${d > 0 ? 'right' : 'left'} heading ${u.hdg(b)}`;
      t = `Koala Tower: <b>${instr}</b> for ${target.icon} ${target.name}, ${Math.max(1, Math.round(nm))} NM.`;
      if (plane.ap && plane.ap.reg) t = `Koala Tower: autopilot engaged, ${target.icon} ${target.name} in ${Math.max(1, Math.round(nm))} NM. Watch the heading change!`;
    } else {
      const gt = side.gates[0];
      if (gt) {
        const dist = gt.x - side.x, dft = gt.fl * 100 - side.alt, need = dft / (100 * Math.max(dist, 0.5));
        const what = Math.abs(dft) < 700 ? `<b>hold FL${u.pad3(gt.fl)}</b>` : `<b>${dft > 0 ? 'climb' : 'descend'} to FL${u.pad3(gt.fl)}</b>, about ${Math.abs(need).toFixed(1)}° ${dft > 0 ? 'up' : 'down'}`;
        t = `Koala Tower: ${what} for the ${gt.reg.icon} ${gt.reg.name} gate, ${dist.toFixed(1)} NM. <small>1-in-60: 1° ≈ 100 ft per NM</small>`;
      }
    }
    $('wTowerTxt').innerHTML = t || '';
  }

  // ---------- loop ----------
  let towerT = 0;
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now; tNow += dt;
    if (tapMark && (tapMark.t -= dt) <= 0) tapMark = null;
    if (view === 'top') updateTop(dt); else updateSide(dt);
    if (!running) return;
    if (view === 'top') drawTop(); else drawSide();
    if ((towerT -= dt) <= 0) { towerT = 0.3; towerText(); }
    if ((saveT += dt) > 6) { saveT = 0; persist(); }
    requestAnimationFrame(frame);
  }
  function start() { if (running || A.sheetOpen()) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  function stop() { running = false; }
  A.world.start = start; A.world.stop = stop; A.world.persist = persist;
  A.world.drawOnce = () => { if (view === 'top') drawTop(); else drawSide(); towerText(); };
  A.on('screen', id => { if (id === 'world') { resize(); start(); } else { stop(); persist(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); persist(); } else if (A.cur === 'world' && !A.sheetOpen()) start(); });
  setView(view);
})(window.ATC);
