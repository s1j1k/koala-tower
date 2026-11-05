/* Radar Reef: conflict spotter, live sector control sim, multi-tasking. */
(function (A) {
  'use strict';
  const { rnd, pick, shuffle, sample, pad3, norm, angDiff, clamp } = A.u;
  const CS = () => pick(['QF', 'VA', 'JQ', 'NZ', 'EK', 'SQ', 'CX', 'TT', 'ZL']) + rnd(1, 99);
  const vel = (h, kt) => [Math.sin(h * Math.PI / 180) * kt / 60, Math.cos(h * Math.PI / 180) * kt / 60]; // NM/min, y = north
  function cpa(a, b, T) {
    const [vax, vay] = vel(a.h, a.s), [vbx, vby] = vel(b.h, b.s);
    const px = b.x - a.x, py = b.y - a.y, vx = vbx - vax, vy = vby - vay, vv = vx * vx + vy * vy;
    const t = vv < 1e-9 ? 0 : clamp(-(px * vx + py * vy) / vv, 0, T);
    return { d: Math.hypot(px + vx * t, py + vy * t), t };
  }

  // ---------- Conflict spotter ----------
  function conflict(L) {
    const n = [0, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7][L], LOOK = 8, vecMin = L <= 5 ? 3 : L <= 8 ? 2 : 1;
    for (let g = 0; g < 400; g++) {
      const has = L <= 3 || Math.random() < 0.8;
      const fls = shuffle([280, 290, 300, 310, 320, 330, 340, 350, 360, 370, 380]);
      const ac = [], names = new Set();
      const nm = () => { let c; do { c = CS(); } while (names.has(c)); names.add(c); return c; };
      if (has) {
        const fl = fls.pop(), t = rnd(2, 7) + Math.random(), mx = rnd(-12, 12), my = rnd(-12, 12);
        const ha = rnd(0, 359), catchUp = L >= 6 && Math.random() < 0.25;
        const hb = catchUp ? norm(ha + rnd(-10, 10)) : norm(ha + pick([1, -1]) * rnd(50, 180));
        const sa = rnd(26, 46) * 10, sb = catchUp ? sa - rnd(10, 18) * 10 : rnd(26, 46) * 10;
        const [vax, vay] = vel(ha, sa), [vbx, vby] = vel(hb, sb), off = rnd(-20, 20) / 10;
        ac.push({ c: nm(), x: mx - vax * t, y: my - vay * t, h: ha, s: sa, fl });
        ac.push({ c: nm(), x: mx - vbx * t + off, y: my - vby * t + off * 0.5, h: hb, s: sb, fl });
      }
      while (ac.length < n) {
        const fl = L <= 3 ? fls.pop() : (Math.random() < 0.45 && ac.length ? pick(ac).fl + pick([0, 0, 10, -10]) : fls.pop());
        ac.push({ c: nm(), x: rnd(-24, 24), y: rnd(-24, 24), h: rnd(0, 359), s: rnd(24, 48) * 10, fl });
      }
      if (ac.some(a => Math.hypot(a.x, a.y) > 27)) continue;
      // check: exactly the intended conflict
      const pairs = []; let bad = false;
      for (let i = 0; i < ac.length; i++) for (let j = i + 1; j < ac.length; j++) {
        const same = ac[i].fl === ac[j].fl, c = cpa(ac[i], ac[j], LOOK);
        const now = Math.hypot(ac[i].x - ac[j].x, ac[i].y - ac[j].y);
        if (now < 7) { bad = true; break; }
        const conf = same && c.d < 5;
        if (has && i === 0 && j === 1) { if (!conf || c.d > 3.5) bad = true; }
        else if (same && c.d < 7.5) bad = true;
        pairs.push({ i, j, same, conf, d: c.d, t: c.t });
      }
      if (bad) continue;
      // options
      const correct = has ? `${ac[0].c} & ${ac[1].c}` : 'No conflict';
      const others = shuffle(pairs.filter(p => !(has && p.i === 0 && p.j === 1))).sort((a, b) => (b.same - a.same)).map(p => `${ac[p.i].c} & ${ac[p.j].c}`);
      const opts = [correct];
      if (L >= 4 && has) opts.push('No conflict');
      for (const o of others) { if (opts.length >= 4) break; if (!opts.includes(o)) opts.push(o); }
      const ch = shuffle(opts);
      // draw
      const S = 4.8, C = 150, P = (x, y) => [C + x * S, C - y * S];
      const vis = `<svg viewBox="0 0 300 300" width="300" height="300"><circle cx="150" cy="150" r="146" fill="#04140d" stroke="#1f6b4a"/>
        ${[10, 20].map(r => `<circle cx="150" cy="150" r="${r * S}" fill="none" stroke="#134a33" stroke-dasharray="3 4"/><text x="${150 + r * S - 2}" y="146" fill="#2c7a57" font-size="9" text-anchor="end">${r}NM</text>`).join('')}
        <text x="150" y="16" fill="#ff9e9e" font-size="11" text-anchor="middle" font-weight="800">N</text>
        ${ac.map(a => {
          const [x, y] = P(a.x, a.y), [vx, vy] = vel(a.h, a.s), [ex, ey] = P(a.x + vx * vecMin, a.y + vy * vecMin);
          const lx = x + (vx >= 0 ? -6 : 8), anchor = vx >= 0 ? 'end' : 'start';
          return `<line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" stroke="#7dffbf" stroke-width="1.5"/><rect x="${x - 3.5}" y="${y - 3.5}" width="7" height="7" fill="#7dffbf"/>
            <text x="${lx}" y="${y - 4}" fill="#d9ffe9" font-size="10.5" font-weight="700" text-anchor="${anchor}">${a.c}</text><text x="${lx}" y="${y + 8}" fill="#ffd166" font-size="10" text-anchor="${anchor}">${a.fl} ${Math.round(a.s / 10)}</text>`;
        }).join('')}</svg>`;
      const cp = has ? pairs.find(p => p.i === 0 && p.j === 1) : null;
      return {
        kind: 'Conflict spotter', q: 'Which pair will lose separation?', size: 'tiny', vis, type: 'choice', cols: 1, choices: ch, ans: ch.indexOf(correct),
        unit: `Lines show ${vecMin} min of flight · labels: callsign, FL, speed÷10 · conflict = same FL and under 5 NM`,
        tip: has ? `${ac[0].c} and ${ac[1].c} are both at FL${ac[0].fl} and get within ${cp.d.toFixed(1)} NM in about ${Math.round(cp.t)} min.` : 'No same-level pair comes within 5 NM. Aircraft 1,000 ft apart (e.g. FL330 vs FL340) are separated.',
        review: `${n} aircraft: ${ac.map(a => a.c + ' FL' + a.fl).join(', ')}`
      };
    }
    return conflict(Math.max(1, L - 1));
  }
  A.drill({
    id: 'conflict', area: 'radar', name: 'Conflict spotter', icon: '⚠️', desc: 'A radar snapshot with speed vectors. Find the pair that will come within 5 NM at the same level, or call "No conflict".',
    target: L => [0, 11, 10, 10, 9, 9, 8, 8, 7, 7, 6][L], gen: conflict,
    tips: ['First filter by level: only aircraft at the same FL can conflict. 1,000 ft apart is safe.', 'Then extend the vector lines: do the paths cross, and do they get there at about the same time?', 'A faster aircraft behind a slower one on the same track will catch up.']
  });

  // ---------- Sector control (live sim) ----------
  const GATE_COL = ['#ff9ecb', '#7cc8ff', '#ffd166', '#c7a6ff', '#ffa96b', '#5ee0a8'];
  A.drill({
    id: 'sector', area: 'radar', name: 'Sector control', icon: '🎮', kind: 'custom',
    desc: 'Live radar. Guide every aircraft out through its exit gate (and at its exit level from level 4) without any pair coming within 5 NM at the same level.',
    tips: ['Fix conflicts early with a level change: it is the quickest separation.', 'Use "Direct" to send aircraft straight to their gate, then watch where tracks cross.', 'Orange lines warn of a future conflict; red means separation is lost.', 'Scan the whole screen every few seconds rather than staring at one aircraft.'],
    run(ctx) {
      const L = ctx.L, R = 30, N = [0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14][L], gap = [0, 9, 8.2, 7.5, 7, 6.5, 6, 5.6, 5.2, 4.8, 4.4][L];
      const F = 20 + L, aids = ctx.settings.aids && L <= 6, needFl = L >= 4;
      const FLS = L <= 3 ? [300, 320, 340] : [280, 300, 320, 340, 360, 380];
      ctx.stage.innerHTML = `<div class="radarwrap"><canvas id="rc"></canvas></div>
        <div class="rinfo"><span id="rSel">Tap an aircraft to select it</span><span id="rStat"></span></div>
        <div class="rpanel"><button data-a="-30">⟲ 30°</button><button data-a="-10">⟲ 10°</button><button data-a="10">10° ⟳</button><button data-a="30">30° ⟳</button>
        <button data-a="dn">▼ FL−10</button><button data-a="up">▲ FL+10</button><button data-a="dct" class="wide">➜ Direct to gate</button></div>`;
      const cv = document.getElementById('rc'), g = cv.getContext('2d');
      const W = Math.min(ctx.stage.clientWidth || 360, 420), dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * dpr; cv.height = W * dpr; cv.style.height = W + 'px'; g.scale(dpr, dpr);
      const S = (W / 2 - 6) / R, C = W / 2;
      const P = (x, y) => [C + x * S, C - y * S];
      const gates = Array.from({ length: 6 }, (_, i) => ({ ang: i * 60 + 30, letter: 'ABCDEF'[i], col: GATE_COL[i] }));
      const gpos = gi => [R * Math.sin(gates[gi].ang * Math.PI / 180), R * Math.cos(gates[gi].ang * Math.PI / 180)];
      const ac = [];
      let spawned = 0, nextSpawn = 0.8, t = 0, sel = null, score = 0, losses = 0, goodExits = 0, exits = 0;
      const lossPairs = new Set(), names = new Set(), log = [];
      const btns = ctx.stage.querySelectorAll('.rpanel button');
      const updBtns = () => btns.forEach(b => { b.disabled = !sel; });
      updBtns();

      function spawn() {
        let entry, exit;
        do { entry = rnd(0, 5); exit = rnd(0, 5); } while (Math.abs(entry - exit) < 2 || Math.abs(entry - exit) > 4);
        const [x, y] = gpos(entry), [ex, ey] = gpos(exit);
        const fl = pick(FLS);
        if (ac.some(a => !a.done && Math.hypot(a.x - x, a.y - y) < 10 && Math.abs(a.fl - fl) < 10)) return false;
        let c; do { c = CS(); } while (names.has(c)); names.add(c);
        const toExit = norm(Math.atan2(ex - x, ey - y) * 180 / Math.PI), toCtr = norm(Math.atan2(-x, -y) * 180 / Math.PI);
        const h = L <= 2 ? toExit : norm(toCtr + rnd(-25, 25));
        ac.push({ c, x: x * 0.97, y: y * 0.97, h, th: h, s: rnd(26, 44) * 10, fl, tfl: fl, gate: exit, xfl: needFl ? pick(FLS) : null, dist: 0, sx: x, sy: y, trail: [], done: false });
        return true;
      }
      const selected = () => ac.find(a => a === sel && !a.done);
      ctx.stage.querySelector('.rpanel').onclick = e => {
        const b = e.target.closest('button'); const a = selected(); if (!b || !a) return;
        const v = b.dataset.a;
        if (v === 'up') a.tfl = Math.min(400, a.tfl + 10);
        else if (v === 'dn') a.tfl = Math.max(240, a.tfl - 10);
        else if (v === 'dct') { const [gx, gy] = gpos(a.gate); a.th = norm(Math.atan2(gx - a.x, gy - a.y) * 180 / Math.PI); }
        else a.th = norm(a.th + +v);
        A.sfx('tick'); info();
      };
      cv.addEventListener('pointerdown', e => {
        const r = cv.getBoundingClientRect(), px = (e.clientX - r.left) * (W / r.width), py = (e.clientY - r.top) * (W / r.width);
        let best = null, bd = 34;
        ac.forEach(a => { if (a.done) return; const [x, y] = P(a.x, a.y); const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = a; } });
        sel = best; updBtns(); info(); if (best) A.sfx('tick');
      });
      function info() {
        const a = selected();
        document.getElementById('rSel').innerHTML = a ? `<b>${a.c}</b> FL${pad3(a.fl)}${a.tfl !== a.fl ? (a.tfl > a.fl ? '↑' : '↓') + pad3(a.tfl) : ''} · H${pad3(Math.round(a.th) || 360)} · exit <b style="color:${gates[a.gate].col}">${gates[a.gate].letter}</b>${a.xfl ? ' at ' + a.xfl : ''}` : 'Tap an aircraft to select it';
      }
      function status() {
        document.getElementById('rStat').innerHTML = `✈ ${exits}/${N} · ⚠ <b style="color:${losses ? 'var(--bad)' : 'inherit'}">${losses}</b>`;
        ctx.score(Math.max(0, Math.round(score)), losses ? `${losses} separation loss${losses > 1 ? 'es' : ''}` : '');
      }
      status();

      function end(timeout) {
        const left = ac.filter(a => !a.done).length;
        const max = N * 150, pct = Math.max(0, score) / max;
        const stars = pct >= 0.72 && losses === 0 ? 3 : pct >= 0.5 && losses <= 1 ? 2 : pct >= 0.28 ? 1 : 0;
        ctx.finish({
          stars, score: Math.max(0, Math.round(score)), points: goodExits * 2 + Math.max(0, 4 - losses), acc: exits ? goodExits / N : 0,
          stats: [[`${goodExits}/${N}`, 'correct exits'], [losses, 'separation losses'], [Math.max(0, Math.round(score)), 'points']],
          lines: [`Safety: ${losses === 0 ? '✅ no losses of separation' : `❌ ${losses} loss${losses > 1 ? 'es' : ''} of separation (−150 each)`}`,
            `Efficiency: ${goodExits} of ${N} out the right gate${needFl ? ' at the right level' : ''}${left ? `, ${left} still in your sector when time ran out` : ''}.`,
            'Stars: ★ 28% of max points · ★★ 50% and ≤1 loss · ★★★ 72% and no losses', ...log.slice(0, 6)]
        });
      }
      const limit = N * gap + 45;
      ctx.loop(dt => {
        t += dt;
        ctx.info(`${Math.max(0, Math.ceil(limit - t))}s left`); ctx.bar(1 - t / limit, limit - t < 10);
        if (spawned < N && t >= nextSpawn) { if (spawn()) { spawned++; nextSpawn = t + gap; } else nextSpawn = t + 1; }
        // move
        ac.forEach(a => {
          if (a.done) return;
          const d = angDiff(a.h, a.th), tr = 32 * dt;
          a.h = Math.abs(d) <= tr ? a.th : norm(a.h + Math.sign(d) * tr);
          if (a.fl !== a.tfl) a.fl = a.fl < a.tfl ? Math.min(a.tfl, a.fl + 7 * dt) : Math.max(a.tfl, a.fl - 7 * dt);
          const [vx, vy] = vel(a.h, a.s), m = F * dt / 60; // sim minutes elapsed
          a.x += vx * m; a.y += vy * m; a.dist += Math.hypot(vx, vy) * m;
          if ((a.tt = (a.tt || 0) + dt) > 0.6) { a.tt = 0; a.trail.push([a.x, a.y]); if (a.trail.length > 5) a.trail.shift(); }
          if (Math.hypot(a.x, a.y) > R) {
            a.done = true; exits++;
            const ang = norm(Math.atan2(a.x, a.y) * 180 / Math.PI), gOk = Math.abs(angDiff(gates[a.gate].ang, ang)) <= 13, fOk = !a.xfl || Math.abs(a.fl - a.xfl) < 5;
            const [gx, gy] = gpos(a.gate), ideal = Math.hypot(gx - a.sx, gy - a.sy), eff = clamp(ideal / Math.max(a.dist, 1), 0, 1);
            if (gOk && fOk) { goodExits++; score += 100 + Math.round(50 * eff); A.sfx('ok'); }
            else if (gOk) { score += 40; log.push(`${a.c} used gate ${gates[a.gate].letter} but at FL${Math.round(a.fl)}, not ${a.xfl}.`); A.sfx('bad'); }
            else { score -= 50; log.push(`${a.c} left the sector through the wrong side (should be gate ${gates[a.gate].letter}).`); A.sfx('bad'); }
            if (sel === a) { sel = null; updBtns(); }
            status(); info();
          }
        });
        // separation
        const live = ac.filter(a => !a.done), warn = [], lost = [];
        for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
          const a = live[i], b = live[j], key = a.c + '|' + b.c, vsep = Math.abs(a.fl - b.fl) >= 9.5, d = Math.hypot(a.x - b.x, a.y - b.y);
          if (!vsep && d < 5) { lost.push([a, b]); if (!lossPairs.has(key)) { lossPairs.add(key); losses++; score -= 150; A.sfx('alarm'); log.unshift(`Separation lost: ${a.c} and ${b.c}.`); status(); } }
          else { if (d > 6) lossPairs.delete(key); const sameBand = Math.abs(a.tfl - b.tfl) < 10 || !vsep; if (aids && sameBand && cpa({ x: a.x, y: a.y, h: a.h, s: a.s }, { x: b.x, y: b.y, h: b.h, s: b.s }, 1.4 * F / 20).d < 5) warn.push([a, b]); }
        }
        draw(live, warn, lost);
        if (selected()) info();
        if ((spawned >= N && live.length === 0) || t >= limit) end(t >= limit);
      });

      function draw(live, warn, lost) {
        g.clearRect(0, 0, W, W);
        g.fillStyle = '#04140d'; g.beginPath(); g.arc(C, C, R * S, 0, 7); g.fill();
        g.strokeStyle = '#134a33'; g.setLineDash([3, 4]); [10, 20].forEach(r => { g.beginPath(); g.arc(C, C, r * S, 0, 7); g.stroke(); }); g.setLineDash([]);
        g.strokeStyle = '#1f6b4a'; g.lineWidth = 2; g.beginPath(); g.arc(C, C, R * S - 1, 0, 7); g.stroke(); g.lineWidth = 1;
        gates.forEach(gt => {
          const a0 = (gt.ang - 90 - 13) * Math.PI / 180, a1 = (gt.ang - 90 + 13) * Math.PI / 180;
          g.strokeStyle = gt.col; g.lineWidth = 6; g.beginPath(); g.arc(C, C, R * S - 3, a0, a1); g.stroke(); g.lineWidth = 1;
          const [lx, ly] = P(...gpos(gates.indexOf(gt)).map(v => v * 0.88));
          g.fillStyle = gt.col; g.font = '800 14px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(gt.letter, lx, ly);
        });
        warn.forEach(([a, b]) => { g.strokeStyle = '#ffa94d'; g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(...P(a.x, a.y)); g.lineTo(...P(b.x, b.y)); g.stroke(); g.setLineDash([]); g.lineWidth = 1; });
        lost.forEach(([a, b]) => [a, b].forEach(x => { g.strokeStyle = '#ff5f5f'; g.lineWidth = 2; g.beginPath(); g.arc(...P(x.x, x.y), 2.5 * S, 0, 7); g.stroke(); g.lineWidth = 1; }));
        live.forEach(a => {
          const [x, y] = P(a.x, a.y);
          a.trail.forEach(([tx, ty], i) => { g.fillStyle = `rgba(125,255,191,${0.15 + i * 0.1})`; const [px, py] = P(tx, ty); g.fillRect(px - 1.5, py - 1.5, 3, 3); });
          if (L <= 4) { g.strokeStyle = 'rgba(125,255,191,.18)'; g.beginPath(); g.arc(x, y, 2.5 * S, 0, 7); g.stroke(); }
          const [vx, vy] = vel(a.h, a.s); const [ex, ey] = P(a.x + vx * 1.2, a.y + vy * 1.2);
          g.strokeStyle = '#7dffbf'; g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.stroke();
          if (a === sel) { g.strokeStyle = '#fff'; g.setLineDash([4, 4]); g.beginPath(); g.arc(x, y, 5 * S, 0, 7); g.stroke(); g.setLineDash([]); g.lineWidth = 2; g.beginPath(); g.arc(x, y, 9, 0, 7); g.stroke(); g.lineWidth = 1; }
          g.fillStyle = '#7dffbf'; g.fillRect(x - 3.5, y - 3.5, 7, 7);
          const right = x < C + R * S * 0.55, lx = right ? x + 8 : x - 8; g.textAlign = right ? 'left' : 'right'; g.textBaseline = 'alphabetic';
          g.font = '700 11px system-ui'; g.fillStyle = '#e6fff2'; g.fillText(a.c, lx, y - 3);
          const fl = Math.round(a.fl), arrow = a.tfl > fl ? '↑' : a.tfl < fl ? '↓' : '';
          g.font = '600 10.5px system-ui'; g.fillStyle = '#ffd166'; g.fillText(`${fl}${arrow}`, lx, y + 9);
          const gw = g.measureText(`${fl}${arrow} `).width; g.fillStyle = gates[a.gate].col;
          g.fillText(`${gates[a.gate].letter}${a.xfl ? a.xfl : ''}`, right ? lx + gw : lx - gw, y + 9);
        });
      }
    }
  });

  // ---------- Multi-tasking ----------
  A.drill({
    id: 'multitask', area: 'radar', name: 'Multi-tasking', icon: '🤹', kind: 'custom',
    desc: 'Answer quick sums while keeping every fuel gauge out of the red. Tap a gauge to refuel it when it drops below the red line, not before.',
    tips: ['Glance at the gauges after every answer, like a radar scan.', 'Refuel only once a tank is below the red line: early taps cost points.'],
    run(ctx) {
      const L = ctx.L, len = ctx.opts.len || ctx.settings.len, Lm = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5][L];
      const nG = L >= 6 ? 4 : 3, base = 0.045 + L * 0.006, names = sample(['QF1', 'VA7', 'JQ3', 'NZ9', 'EK4'], nG);
      const tanks = names.map(n => ({ n, v: 0.6 + Math.random() * 0.4, r: base * (0.6 + Math.random() * 0.9) }));
      let correct = 0, attempts = 0, good = 0, emerg = 0, early = 0, q = null, locked = false;
      ctx.stage.innerHTML = `<div class="gauges">${tanks.map((t, i) => `<button class="gauge" data-g="${i}"><span>${t.n}</span><div class="line" style="bottom:25%"></div><i></i></button>`).join('')}</div>
        <div class="card" id="mtCard"><div class="kind" id="mtKind"></div><div class="q small" id="mtQ"></div><div class="unit" id="mtU"></div>
        <form id="mtF" autocomplete="off"><input id="mtIn" inputmode="decimal" enterkeyhint="go" placeholder="Answer"></form><div class="fb" id="mtFb"></div></div>`;
      const gEls = [...ctx.stage.querySelectorAll('.gauge')], inp = document.getElementById('mtIn');
      gEls.forEach((el, i) => {
        el.addEventListener('pointerdown', e => {
          e.preventDefault(); const t = tanks[i];
          if (t.v < 0.25) { good++; A.sfx('ring'); } else if (t.v < 0.5) { A.sfx('tick'); } else { early++; A.sfx('bad'); }
          t.v = 1; upd(); inp.focus({ preventScroll: true });
        });
      });
      function ask() {
        const gen = A.drills[pick(['arith', 'arith', 'sdt'])].gen;
        let x; do { x = gen(Lm); } while (x.type && x.type !== 'num');
        q = x; locked = false;
        document.getElementById('mtKind').textContent = q.kind; document.getElementById('mtQ').textContent = q.q; document.getElementById('mtU').textContent = q.unit || '';
        inp.value = ''; inp.className = ''; document.getElementById('mtFb').innerHTML = '';
      }
      const right = v => q.tol ? Math.abs(v - q.ans) <= Math.abs(q.ans) * q.tol : Math.abs(v - q.ans) < 0.011;
      function submit() {
        if (locked) return; const v = parseFloat(inp.value.replace(/,/g, '')); if (isNaN(v)) return;
        attempts++; locked = true;
        if (right(v)) { correct++; inp.className = 'ok'; A.sfx('ok'); ctx.later(ask, 250); }
        else { inp.className = 'no'; A.sfx('bad'); document.getElementById('mtFb').innerHTML = `<span class="bad">✗ ${A.u.fmt(q.ans)}</span>`; ctx.later(ask, 1300); }
        upd();
      }
      document.getElementById('mtF').onsubmit = e => { e.preventDefault(); submit(); };
      inp.addEventListener('input', () => { if (!locked && !q.tol) { const v = parseFloat(inp.value.replace(/,/g, '')); if (!isNaN(v) && right(v)) submit(); } });
      function upd() {
        tanks.forEach((t, i) => { const el = gEls[i].querySelector('i'); el.style.height = (t.v * 100) + '%'; el.classList.toggle('low', t.v < 0.25); });
        ctx.score(correct * 10 + good * 5 - emerg * 20 - early * 3, emerg ? `⛽ ${emerg} emergenc${emerg > 1 ? 'ies' : 'y'}` : '');
      }
      ctx.every(() => {
        tanks.forEach(t => { t.v -= t.r * 0.1; if (t.v <= 0) { t.v = 1; emerg++; A.sfx('alarm'); A.toast(`⛽ ${t.n} fuel emergency!`); } });
        upd();
      }, 100);
      ask(); upd(); setTimeout(() => inp.focus({ preventScroll: true }), 50);
      ctx.countdown(len, () => {
        const tgt = Math.max(3, Math.round(A.drills.arith.target(Lm) * 0.55 * len / 90));
        const mPct = Math.min(1, correct / tgt), gPct = (good) / Math.max(1, good + emerg * 2 + early * 0.5);
        const acc = attempts ? correct / attempts : 0, comb = 0.5 * mPct + 0.5 * gPct;
        const stars = acc < 0.6 ? 0 : comb >= 0.85 ? 3 : comb >= 0.65 ? 2 : comb >= 0.4 ? 1 : 0;
        const pts = correct * 10 + good * 5 - emerg * 20 - early * 3;
        ctx.finish({ stars, score: Math.max(0, pts), points: correct + good, acc,
          stats: [[`${correct}/${tgt}`, 'sums (target)'], [good, 'timely refuels'], [emerg, 'emergencies']],
          lines: [`Early refuels (above half): ${early}. Points: ${pts}.`, 'Stars combine sums vs target (half) and fuel management (half). ★ 40% · ★★ 65% · ★★★ 85%'] });
      });
    }
  });
})(window.ATC);
