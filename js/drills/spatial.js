/* Spatial Sands: heading turns, clock-code, bearings, mental rotation, path tracking, pointing. */
(function (A) {
  'use strict';
  const { rnd, pick, shuffle, norm, hdg, pad3, angDiff } = A.u;
  const PLANE = 'M0,-12 L2.6,-5 L11,0.5 L11,3 L2.6,1.2 L1.8,7.5 L5,10.5 L5,12 L0,10.8 L-5,12 L-5,10.5 L-1.8,7.5 L-2.6,1.2 L-11,3 L-11,0.5 L-2.6,-5 Z';
  const plane = (x, y, h, s = 1, fill = '#ffffff') => `<path d="${PLANE}" fill="${fill}" stroke="#0d1b2a" stroke-width="0.8" transform="translate(${x},${y}) rotate(${h}) scale(${s})"/>`;
  const pt = (cx, cy, ang, r) => [cx + r * Math.sin(ang * Math.PI / 180), cy - r * Math.cos(ang * Math.PI / 180)];
  const north = (x, y, rot) => `<g transform="translate(${x},${y}) rotate(${rot})"><path d="M0,-16 L6,6 L0,2 L-6,6 Z" fill="#ff7a7a"/><text x="0" y="-19" fill="#ff9e9e" font-size="12" font-weight="800" text-anchor="middle" transform="rotate(${-rot} 0 -23)">N</text></g>`;

  // ---------- Heading turns ----------
  function turns(L) {
    const r = Math.random();
    if (L >= 6 && r < 0.25) {
      const a = rnd(1, 360), d = rnd(10, 170) * (Math.random() < 0.5 ? 1 : -1), b = norm(a + d);
      const right = d > 0, ad = Math.abs(d);
      const opts = shuffle([`Right ${ad}°`, `Left ${ad}°`, `${right ? 'Left' : 'Right'} ${360 - ad}°`, `${right ? 'Right' : 'Left'} ${ad + pick([10, 20, 30])}°`]);
      const good = `${right ? 'Right' : 'Left'} ${ad}°`;
      return { kind: 'Shortest turn', q: `${hdg(a)}° → ${hdg(b)}°`, unit: 'which way, and how far?', type: 'choice', choices: opts, ans: opts.indexOf(good), tip: `Difference ${ad}°; it's shorter to go ${right ? 'right' : 'left'}.` };
    }
    const nT = L >= 9 && r < 0.6 ? 3 : L >= 7 && r < 0.6 ? 2 : 1;
    const step = L <= 2 ? 10 : L <= 4 ? 10 : 1;
    let h = L <= 2 ? rnd(1, 36) * 10 : step === 10 ? rnd(1, 36) * 10 : rnd(1, 360);
    const start = h, parts = [];
    for (let i = 0; i < nT; i++) {
      let t = L <= 1 ? pick([90, 180]) : L <= 2 ? pick([30, 60, 90, 120, 180]) : L <= 4 ? rnd(2, 17) * 10 : rnd(5, 175);
      const right = Math.random() < 0.5;
      if (L === 1 && (right ? h + t > 360 : h - t < 1)) t = 90;
      parts.push(`${right ? 'right' : 'left'} ${t}°`); h = norm(h + (right ? t : -t));
    }
    return { kind: 'New heading', q: `Heading ${hdg(start)}°, turn ${parts.join(', then ')}`, size: 'small', type: 'hdg', ans: h, unit: 'new heading (3 digits)', tip: 'Right = add, left = subtract. Past 360, take off 360; below 0, add 360.' };
  }
  A.drill({
    id: 'turns', area: 'spatial', name: 'Heading turns', icon: '🔄', desc: 'Work out the new heading after turns, and the shortest way to turn. Later levels chain several turns.',
    target: L => [0, 22, 20, 18, 16, 15, 14, 13, 12, 11, 10][L], gen: turns,
    tips: ['Right turn = add, left turn = subtract, then wrap around 360.', '000 and 360 are the same heading; we say 360.', 'Shortest turn: if the difference is over 180, go the other way.']
  });

  // ---------- Clock code ----------
  function clockSvg(h, b) {
    const [tx, ty] = pt(110, 110, b, 78);
    return `<svg viewBox="0 0 220 220" width="220" height="220"><circle cx="110" cy="110" r="96" fill="#06261a" stroke="#1f6b4a"/><circle cx="110" cy="110" r="50" fill="none" stroke="#1f6b4a" stroke-dasharray="3 4"/>
      ${north(195, 26, 0)}${plane(110, 110, h, 1.6)}<rect x="${tx - 7}" y="${ty - 7}" width="14" height="14" fill="#ffd166" transform="rotate(45 ${tx} ${ty})"/><text x="${tx}" y="${ty - 12}" fill="#ffd166" font-size="11" text-anchor="middle" font-weight="700">TFC</text></svg>`;
  }
  function clock(L) {
    const H = L <= 1 ? pick([0, 90, 180, 270]) : L <= 2 ? rnd(0, 7) * 45 : rnd(0, 35) * 10;
    const c = rnd(1, 12), rel = (c % 12) * 30, jit = L >= 5 ? rnd(-10, 10) : 0;
    const B = norm(H + rel + jit);
    const tip = `Relative bearing = traffic bearing − your heading = ${Math.round(norm(B - H))}°. Divide by 30 → ${c} o'clock.`;
    if (L <= 4) return { kind: 'Clock code', q: 'Where is the traffic, as a clock position?', size: 'tiny', vis: clockSvg(H, B), unit: '12 = straight ahead, 3 = right, 6 = behind, 9 = left', ans: c, noAuto: true, tip: 'Imagine sitting in the plane: its nose is 12 o\'clock.', review: `Heading ${hdg(H)}, traffic bearing ${hdg(B)}` };
    if (L >= 6 && Math.random() < 0.45) {
      return { kind: 'Clock → bearing', q: `Heading ${hdg(H)}°. Traffic at your ${c} o'clock.`, size: 'small', unit: 'bearing of the traffic from you (±15°)', type: 'hdg', ans: norm(H + rel), tolDeg: 15, tip: `Clock × 30 = ${rel}°, then add your heading.` };
    }
    return { kind: 'Clock code', q: `Heading ${hdg(H)}°. Traffic bears ${hdg(B)}° from you.`, size: 'small', unit: 'clock position (1–12)', ans: c, noAuto: true, tip };
  }
  A.drill({
    id: 'clock', area: 'spatial', name: 'Clock-code traffic', icon: '🕐', desc: 'Turn compass bearings into "traffic at 2 o\'clock" positions and back. Picture yourself in the cockpit.',
    target: L => [0, 18, 16, 15, 14, 12, 11, 10, 9, 9, 8][L], gen: clock,
    tips: ['Clock position = (traffic bearing − your heading) ÷ 30.', 'Each hour is 30°. 3 o\'clock = 90° right, 9 o\'clock = 90° left.']
  });

  // ---------- Bearings from a map ----------
  function bearing(L) {
    const step = L <= 5 ? 10 : 5;
    const b = rnd(0, 360 / step - 1) * step;
    const rot = L >= 8 ? rnd(0, 359) : L >= 6 ? rnd(1, 7) * 45 : 0;
    const d = rnd(70, 100), cx = 130 + rnd(-15, 15), cy = 130 + rnd(-15, 15);
    const [ax, ay] = pt(cx, cy, b + rot + 180, d / 2), [bx, by] = pt(cx, cy, b + rot, d / 2);
    const gap = [0, 90, 60, 45, 40, 30, 30, 25, 20, 15, 10][L];
    const set = new Set([b]);
    for (const o of shuffle([-3, -2, -1, 1, 2, 3])) { if (set.size >= 4) break; set.add(norm(b + o * gap)); }
    const opts = shuffle([...set]).map(v => hdg(v) + '°');
    const vis = `<svg viewBox="0 0 260 260" width="250" height="250"><rect x="2" y="2" width="256" height="256" rx="18" fill="#0f3a2c" stroke="#2b6d55"/>
      ${[0, 1, 2, 3].map(i => `<line x1="${65 * i + 2}" y1="2" x2="${65 * i + 2}" y2="258" stroke="#184d3b"/><line y1="${65 * i + 2}" x1="2" y2="${65 * i + 2}" x2="258" stroke="#184d3b"/>`).join('')}
      ${north(228, 34, rot)}
      <line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="#ffffff" stroke-opacity=".25" stroke-dasharray="4 5"/>
      <circle cx="${ax}" cy="${ay}" r="9" fill="#7cc8ff"/><text x="${ax}" y="${ay + 4}" font-size="11" text-anchor="middle" font-weight="800" fill="#0d1b2a">A</text>
      <circle cx="${bx}" cy="${by}" r="9" fill="#ffd166"/><text x="${bx}" y="${by + 4}" font-size="11" text-anchor="middle" font-weight="800" fill="#0d1b2a">B</text></svg>`;
    return {
      kind: rot ? 'Bearing (map is rotated!)' : 'Bearing', q: 'Bearing from A to B?', size: 'tiny', vis, type: 'choice', choices: opts, ans: opts.indexOf(hdg(b) + '°'),
      tip: rot ? 'Follow the red north arrow, not the top of the screen. Measure clockwise from it.' : 'Measure clockwise from north (up). East = 090, south = 180, west = 270.', review: `Bearing A→B (true ${hdg(b)})`
    };
  }
  A.drill({
    id: 'bearing', area: 'spatial', name: 'Map bearings', icon: '📐', desc: 'Judge the bearing from one point to another. From level 6 the map is rotated, so watch the north arrow.',
    target: L => [0, 18, 17, 16, 15, 14, 12, 11, 10, 9, 8][L], gen: bearing,
    tips: ['Find the nearest cardinal (000/090/180/270) first, then adjust.', 'On a rotated map, turn your head (in your mind) until north points up.']
  });

  // ---------- Mental rotation ----------
  const key = cells => { const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1])); return cells.map(c => [c[0] - mx, c[1] - my]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(c => c.join(',')).join(';'); };
  const rot90 = cells => cells.map(([x, y]) => [-y, x]);
  const mirror = cells => cells.map(([x, y]) => [-x, y]);
  const rots = cells => { const out = []; let c = cells; for (let i = 0; i < 4; i++) { out.push(c); c = rot90(c); } return out; };
  const rotKeys = cells => new Set(rots(cells).map(key));
  function polyo(n) {
    const cells = [[0, 0]], has = new Set(['0,0']);
    while (cells.length < n) {
      const [x, y] = pick(cells), [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), k = `${x + dx},${y + dy}`;
      if (!has.has(k)) { has.add(k); cells.push([x + dx, y + dy]); }
    }
    return cells;
  }
  function connected(cells) {
    const ks = new Set(cells.map(c => c.join(','))), seen = new Set([cells[0].join(',')]), st = [cells[0]];
    while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = `${x + dx},${y + dy}`; if (ks.has(k) && !seen.has(k)) { seen.add(k); st.push([x + dx, y + dy]); } } }
    return seen.size === cells.length;
  }
  function polySvg(cells, size, color) {
    const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
    const w = Math.max(...cells.map(c => c[0])) - mx + 1, h = Math.max(...cells.map(c => c[1])) - my + 1, s = Math.min(22, (size - 8) / Math.max(w, h, 4));
    const ox = (size - w * s) / 2, oy = (size - h * s) / 2;
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${cells.map(([x, y]) => `<rect x="${ox + (x - mx) * s}" y="${oy + (y - my) * s}" width="${s}" height="${s}" rx="3" fill="${color}" stroke="#0d1b2a" stroke-width="2"/>`).join('')}</svg>`;
  }
  function rotation(L) {
    const n = [0, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9][L];
    let shape;
    do { shape = polyo(n); } while (rotKeys(shape).has(key(mirror(shape))));
    const tk = rotKeys(shape), correct = rots(shape)[rnd(1, 3)];
    const used = new Set([key(correct)]), opts = [correct];
    const mirrors = shuffle(rots(mirror(shape)));
    const nMirror = L <= 2 ? 0 : L <= 5 ? 1 : 3;
    for (const m of mirrors) { if (opts.length > nMirror) break; const k = key(m); if (!used.has(k)) { used.add(k); opts.push(m); } }
    let guard = 0;
    while (opts.length < 4 && guard++ < 500) {
      let o;
      if (L >= 6) { o = rots(shape)[rnd(0, 3)].map(c => [...c]); const i = rnd(0, n - 1); o.splice(i, 1); const [x, y] = pick(o); const nb = [x + pick([-1, 1]), y]; if (Math.random() < 0.5) { nb[0] = x; nb[1] = y + pick([-1, 1]); } if (o.some(c => c[0] === nb[0] && c[1] === nb[1])) continue; o.push(nb); if (!connected(o)) continue; }
      else o = polyo(n);
      const k = key(o); if (tk.has(k) || used.has(k) || rotKeys(mirror(shape)).has(k)) continue;
      used.add(k); opts.push(o);
    }
    const ord = shuffle(opts.map((o, i) => i));
    return {
      kind: 'Mental rotation', q: 'Same shape, just rotated?', size: 'tiny', vis: polySvg(shape, 120, '#ffd166'), type: 'choice', pic: true,
      choices: ord.map(i => polySvg(opts[i], 110, '#7cc8ff')), ans: ord.indexOf(0), unit: 'No flipping allowed: mirror images are traps',
      tip: 'Pick one distinctive corner or bump on the shape and follow it as you turn it.', show: 'the highlighted shape', review: `Rotation puzzle (${n} blocks)`
    };
  }
  A.drill({
    id: 'rotation', area: 'spatial', name: 'Mental rotation', icon: '🧊', desc: 'Find the shape that is the same as the yellow one, only turned. Mirror images are traps from level 3.',
    target: L => [0, 14, 13, 12, 11, 10, 9, 9, 8, 8, 7][L], gen: rotation,
    tips: ['Anchor on a distinctive feature (a lone bump or an L-corner) and track it.', 'If an option matches but the bump is on the wrong side, it is a mirror image.']
  });

  // ---------- Path tracking ----------
  const DIRN = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  function path(L) {
    const moves = [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7][L];
    for (let g = 0; g < 500; g++) {
      let f = L >= 5 ? rnd(0, 3) * 90 : 0; const start = f;
      let x = 0, y = 0; const steps = [];
      for (let i = 0; i < moves; i++) {
        if (i > 0) {
          const t = L <= 4 ? pick([90, -90]) : L <= 6 ? pick([90, -90, 45, -45]) : pick([90, -90, 45, -45, 135, -135, 180]);
          f = norm(f + t);
          steps.push(t === 180 ? 'Turn around' : `Turn ${t > 0 ? 'right' : 'left'}${Math.abs(t) === 90 ? '' : ' ' + Math.abs(t) + '°'}`);
        }
        const d = rnd(1, 5); x += d * Math.sin(f * Math.PI / 180); y += d * Math.cos(f * Math.PI / 180);
        steps.push(`Fly ${d} NM`);
      }
      const dist = Math.hypot(x, y); if (dist < 1.2) continue;
      const askFacing = L >= 4 && Math.random() < 0.3;
      let ansIdx;
      if (askFacing) ansIdx = Math.round(f / 45) % 8;
      else { const ang = norm(Math.atan2(x, y) * 180 / Math.PI); ansIdx = Math.round(ang / 45) % 8; if (Math.abs(angDiff(ansIdx * 45, ang)) > 14) continue; }
      const head = `Start at ✈ facing ${DIRN[start / 45]}.`;
      const q = askFacing ? 'Which way are you facing now?' : 'Where are you now, from the start?';
      const tip = `You end ${Math.abs(x).toFixed(1)} NM ${x >= 0 ? 'east' : 'west'} and ${Math.abs(y).toFixed(1)} NM ${y >= 0 ? 'north' : 'south'} of the start, facing ${DIRN[Math.round(f / 45) % 8]}.`;
      const base = { kind: 'Path tracking', q, size: 'tiny', type: 'choice', layout: 'compass', choices: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'], ans: ansIdx, center: askFacing ? '🧭' : '✈ start', tip, review: head + ' ' + steps.join(', ') };
      if (L >= 6) return { ...base, study: { label: 'FOLLOW THE ROUTE', frames: [head, ...steps].map(s => `<span style="font-size:26px">${s}</span>`), ms: L >= 9 ? 1300 : 1700, gap: 150 } };
      return { ...base, pre: `<div class="q tiny" style="text-align:left;line-height:1.6">${head}<br>${steps.map((s, i) => `${i + 1}. ${s}`).join('<br>')}</div>` };
    }
    return path(1);
  }
  A.drill({
    id: 'path', area: 'spatial', name: 'Path tracking', icon: '🗺️', desc: 'Follow a route of legs and turns in your head, then say where you ended up. From level 6 the route flashes past one step at a time.',
    trials: 10, gen: path,
    tips: ['Keep a running total: how far north/south and how far east/west.', 'Say your facing direction to yourself after every turn.']
  });

  // ---------- Pointing (egocentric turns) ----------
  const ARROWS = ['⬆', '⬈', '➡', '⬊', '⬇', '⬋', '⬅', '⬉'];
  function pointer(L) {
    const start = rnd(0, 7) * 45;
    const pool = L <= 2 ? [90, -90, 180] : L <= 4 ? [45, -45, 90, -90, 135, -135, 180] : [45, -45, 90, -90, 135, -135, 180, 270, -270];
    const n = L >= 8 ? 3 : L >= 5 ? 2 : 1;
    const ts = Array.from({ length: n }, () => pick(pool));
    const end = norm(start + ts.reduce((a, b) => a + b, 0));
    const words = ts.map(t => t === 180 ? 'turn around' : `${t > 0 ? 'right' : 'left'} ${Math.abs(t)}°`);
    return {
      kind: 'Point the way', q: words.map((w, i) => i ? w : w[0].toUpperCase() + w.slice(1)).join(', then '), size: 'small', type: 'choice', layout: 'compass', choices: ARROWS,
      center: `<svg viewBox="-16 -16 32 32" width="54" height="54">${plane(0, 0, start, 1.15, '#ffd166')}</svg>`, ans: end / 45,
      unit: 'Tap where the yellow plane\'s nose points afterwards', tip: 'Right turns are clockwise. 45° = one arrow step, 90° = two.', show: ARROWS[end / 45], review: `Facing ${ARROWS[start / 45]}, ${words.join(', ')}`
    };
  }
  A.drill({
    id: 'pointer', area: 'spatial', name: 'Point the way', icon: '👉', desc: 'The plane is pointing somewhere on screen. After the turns, which way is its nose pointing?',
    target: L => [0, 24, 22, 20, 19, 17, 16, 15, 14, 13, 12][L], gen: pointer,
    tips: ['Count arrow steps: each 45° is one step clockwise (right) or anticlockwise (left).', 'Right 270 = left 90.']
  });
})(window.ATC);
