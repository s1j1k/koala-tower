/* Maths Meadows: arithmetic, conversions, speed/distance/time, estimation, percentages. */
(function (A) {
  'use strict';
  const { rnd, pick, fmt, pad3, shuffle } = A.u;

  // ---------- Arithmetic ----------
  function arith(L) {
    if (L >= 6 && Math.random() < 0.28) return twoStep(L);
    if (L >= 8 && Math.random() < 0.22) return decimals(L);
    if (L >= 5 && Math.random() < 0.12) { const n = rnd(11, L >= 8 ? 35 : 20); return { kind: 'Square it', q: `${n}²`, ans: n * n, tip: `${n}² = (${n - n % 10} + ${n % 10})² = ${(n - n % 10) ** 2} + 2×${n - n % 10}×${n % 10} + ${(n % 10) ** 2}.` }; }
    const ops = L === 1 ? ['+', '−'] : L === 2 ? ['+', '−', '×'] : ['+', '−', '×', '÷'];
    const op = pick(ops);
    const max = [0, 60, 99, 250, 600, 999, 2500, 5000, 9999, 9999, 25000][L];
    let a, b, ans, tip;
    if (op === '+') { a = rnd(Math.floor(max * 0.15) + 3, max); b = rnd(Math.floor(max * 0.1) + 3, max); ans = a + b; tip = 'Add the biggest place values first, then the rest.'; }
    else if (op === '−') { a = rnd(Math.floor(max * 0.4) + 5, max); b = rnd(Math.floor(a * 0.15) + 1, a - 1); ans = a - b; tip = 'Count up from the smaller number to the bigger one.'; }
    else if (op === '×') {
      const r = [null, [2, 9, 2, 9], [2, 10, 2, 10], [2, 12, 2, 12], [3, 9, 13, 49], [3, 9, 13, 99], [6, 19, 11, 19], [11, 30, 11, 60], [12, 99, 12, 99], [12, 25, 101, 400], [15, 60, 101, 999]][L];
      a = rnd(r[0], r[1]); b = rnd(r[2], r[3]); ans = a * b;
      tip = b >= 10 ? `Split it: ${a} × ${b} = ${a} × ${b - b % 10} + ${a} × ${b % 10} = ${a * (b - b % 10)} + ${a * (b % 10)}.` : 'Times tables: practise the ones that feel slow.';
    } else {
      const r = [null, null, null, [2, 10, 2, 12], [3, 12, 5, 20], [3, 15, 10, 50], [6, 20, 12, 60], [11, 30, 15, 99], [12, 40, 20, 120], [12, 60, 25, 150], [15, 99, 30, 300]][L];
      b = rnd(r[0], r[1]); ans = rnd(r[2], r[3]); a = ans * b; tip = `Ask: ${b} × what = ${fmt(a)}? Try ${b} × ${Math.round(ans / 10) * 10 || 10} first, then adjust.`;
    }
    return { kind: 'Arithmetic', q: `${fmt(a)} ${op} ${fmt(b)}`, ans, tip };
  }
  function twoStep(L) {
    const t = rnd(0, 2);
    if (t === 0) { const a = rnd(3, 12), b = rnd(6, L >= 8 ? 40 : 15), c = rnd(5, 99); return { kind: 'Two steps', q: `${a} × ${b} + ${c}`, ans: a * b + c, tip: '× before +.' }; }
    if (t === 1) { const a = rnd(5, 40), b = rnd(5, 40), c = rnd(2, 9); return { kind: 'Two steps', q: `(${a} + ${b}) × ${c}`, ans: (a + b) * c, tip: 'Brackets first.' }; }
    const a = rnd(6, 15), b = rnd(6, 25), c = rnd(2, a * b - 1); return { kind: 'Two steps', q: `${a} × ${b} − ${c}`, ans: a * b - c, tip: '× before −.' };
  }
  function decimals(L) {
    const t = rnd(0, 3);
    if (t === 0) { const x = pick([0.5, 1.5, 2.5, 0.25, 0.75]), y = rnd(2, 40) * 4; return { kind: 'Decimals', q: `${x} × ${y}`, ans: x * y, tip: '0.5 = half, 0.25 = quarter, 1.5 = one and a half lots.' }; }
    if (t === 1) { const y = rnd(3, 90); return { kind: 'Decimals', q: `${y} ÷ 0.5`, ans: y * 2, tip: 'Dividing by 0.5 doubles it.' }; }
    if (t === 2) { const a = rnd(11, 99) / 10, b = rnd(11, 99) / 10; return { kind: 'Decimals', q: `${a} + ${b}`, ans: Math.round((a + b) * 10) / 10, tip: 'Line up the decimal points.' }; }
    const a = rnd(2, 9), b = rnd(11, 99) / 10; return { kind: 'Decimals', q: `${a} × ${b}`, ans: Math.round(a * b * 10) / 10, tip: `${a} × ${b} = ${a} × ${Math.floor(b)} + ${a} × ${Math.round((b % 1) * 10) / 10}.` };
  }
  A.drill({
    id: 'arith', area: 'maths', name: 'Arithmetic', icon: '➕', desc: 'Fast adding, subtracting, multiplying and dividing. Later levels add two-step sums, squares and decimals.',
    target: L => [0, 28, 25, 22, 20, 17, 15, 13, 12, 11, 10][L], gen: arith,
    tips: ['Split multiplications: 7 × 48 = 7 × 50 − 7 × 2.', 'For subtraction, count up from the smaller number.', 'Exact answers advance by themselves: no need to press Check.']
  });

  // ---------- Unit conversions ----------
  function conv(L) {
    const types = L <= 2 ? ['fl', 'recip', 'hm'] : L <= 4 ? ['fl', 'recip', 'hm', 'm2ft', 'ft2m'] : L <= 6 ? ['recip', 'hm', 'm2ft', 'ft2m', 'nm2km', 'kt2kmh', 'fl'] :
      ['recip', 'm2ft', 'ft2m', 'nm2km', 'km2nm', 'kt2kmh', 'kmh2kt', 'hm', 'flm', 'hhmm'];
    const tol = L >= 9 ? 0.03 : 0.05, pct = Math.round(tol * 100);
    switch (pick(types)) {
      case 'fl': {
        if (Math.random() < 0.5) { const fl = rnd(5, 45) * 10; return { kind: 'Flight level → feet', q: `FL${pad3(fl)}`, unit: 'feet', ans: fl * 100, tip: 'FL × 100 = feet.' }; }
        const ft = rnd(5, 45) * 1000; return { kind: 'Feet → flight level', q: `${fmt(ft)} ft`, unit: 'FL (number only)', ans: ft / 100, tip: 'Feet ÷ 100 = FL.' };
      }
      case 'recip': {
        const h = L <= 2 ? rnd(1, 36) * 10 : rnd(1, 360);
        const r = h < 180 ? h + 180 : h - 180;
        return { kind: 'Reciprocal heading', q: `Heading ${pad3(h)}°`, unit: 'the opposite direction', type: 'hdg', ans: r, tip: 'Under 180, add 180. Otherwise subtract 180. Shortcut: +200 then −20.' };
      }
      case 'hm': {
        if (Math.random() < 0.5) { const h = pick(L <= 2 ? [0.5, 1, 1.5, 2, 2.5, 3] : [0.25, 0.75, 1.25, 1.5, 1.75, 2.25, 2.5, 3.5, 0.1, 0.2]); return { kind: 'Hours → minutes', q: `${fmt(h)} h`, unit: 'minutes', ans: h * 60, tip: '0.1 h = 6 min, 0.25 h = 15 min, 0.5 h = 30 min, 0.75 h = 45 min.' }; }
        const m = pick(L <= 2 ? [30, 60, 90, 120, 150, 180] : [15, 45, 75, 105, 135, 165, 195, 225, 6, 12, 18]); return { kind: 'Minutes → hours', q: `${m} min`, unit: 'hours (decimal)', ans: m / 60, tip: 'Divide by 60. 6 min = 0.1 h, 15 min = 0.25 h.' };
      }
      case 'hhmm': { const a = rnd(0, 23), am = rnd(0, 59), add = rnd(25, 190); const tot = a * 60 + am + add; const h2 = Math.floor(tot / 60) % 24, m2 = tot % 60; return { kind: 'Clock time', q: `${String(a).padStart(2, '0')}${String(am).padStart(2, '0')} + ${add} min`, unit: '24-hour time, 4 digits', type: 'text', numeric: true, ans: `${String(h2).padStart(2, '0')}${String(m2).padStart(2, '0')}`, tip: 'Add whole hours first, then minutes; roll over at 60 and at 2400.' }; }
      case 'm2ft': { const m = L <= 4 ? rnd(1, 10) * 100 : rnd(3, 90) * 100; return { kind: 'Metres → feet', q: `${fmt(m)} m`, unit: `feet (within ${pct}%)`, ans: m * 3.28084, tol, tip: 'Multiply by 3.3: ×3, then add 10%.' }; }
      case 'ft2m': { const f = L <= 4 ? rnd(1, 10) * 1000 : rnd(5, 400) * 100; return { kind: 'Feet → metres', q: `${fmt(f)} ft`, unit: `metres (within ${pct}%)`, ans: f * 0.3048, tol, tip: 'Multiply by 0.3: drop a zero, then ×3.' }; }
      case 'nm2km': { const n = L <= 6 ? rnd(1, 20) * 10 : rnd(15, 400); return { kind: 'NM → km', q: `${fmt(n)} NM`, unit: `kilometres (within ${pct}%)`, ans: n * 1.852, tol, tip: '×2, then take off about 7.5%. 100 NM ≈ 185 km.' }; }
      case 'km2nm': { const k = rnd(20, 600); return { kind: 'km → NM', q: `${fmt(k)} km`, unit: `nautical miles (within ${pct}%)`, ans: k / 1.852, tol, tip: 'Halve it, then add about 8%. 185 km ≈ 100 NM.' }; }
      case 'kt2kmh': { const k = L <= 6 ? rnd(10, 50) * 10 : rnd(120, 520); return { kind: 'Knots → km/h', q: `${fmt(k)} kt`, unit: `km/h (within ${pct}%)`, ans: k * 1.852, tol, tip: 'Same as NM → km: ×1.85.' }; }
      case 'kmh2kt': { const k = rnd(20, 90) * 10; return { kind: 'km/h → knots', q: `${fmt(k)} km/h`, unit: `knots (within ${pct}%)`, ans: k / 1.852, tol, tip: 'Halve it, then add about 8%.' }; }
      default: { const fl = rnd(10, 40) * 10; return { kind: 'Flight level → metres', q: `FL${pad3(fl)}`, unit: `metres (within ${pct}%)`, ans: fl * 100 * 0.3048, tol, tip: 'FL × 100 = feet, then × 0.3.' }; }
    }
  }
  A.drill({
    id: 'conv', area: 'maths', name: 'Unit conversions', icon: '📏', desc: 'Flight levels, reciprocal headings, hours and minutes, feet/metres, NM/km, knots/km·h. Estimates within 5% count.',
    target: L => [0, 26, 24, 21, 19, 17, 16, 15, 14, 13, 12][L], gen: conv,
    tips: ['Reciprocal: +200 then −20 (070 → 250), or −200 then +20 (250 → 070).', 'Metres → feet ×3.3; feet → metres ×0.3.', 'NM → km ×1.85: double it, then take off 7.5%.']
  });

  // ---------- Speed / distance / time ----------
  function sdt(L) {
    const speeds = L <= 2 ? [60, 120, 180, 240, 300, 360] : L <= 5 ? [120, 180, 240, 300, 360, 420, 480] : [90, 150, 210, 270, 330, 390, 450, 510, 135, 225];
    const types = L === 1 ? ['nmpm', 'dist', 'time'] : L <= 3 ? ['nmpm', 'dist', 'time', 'speed'] : L <= 5 ? ['dist', 'time', 'speed', 'close', 'sep'] :
      L <= 7 ? ['dist', 'time', 'speed', 'close', 'sep', 'eta', 'catch'] : ['time', 'speed', 'sep', 'eta', 'catch', 'fuel', 'rod'];
    const s = pick(speeds), npm = s / 60;
    switch (pick(types)) {
      case 'nmpm': return { kind: 'Speed → NM per minute', q: `${s} kt`, unit: 'NM per minute', ans: npm, tip: 'Knots ÷ 60. 60 kt = 1 NM/min, 240 kt = 4 NM/min.' };
      case 'dist': { const m = L <= 2 ? pick([5, 10, 15, 20, 30]) : rnd(3, 25); return { kind: 'Distance covered', q: `${s} kt for ${m} min`, size: 'small', unit: 'NM travelled', ans: npm * m, tol: L >= 6 ? 0.03 : 0, tip: `${s} kt = ${fmt(npm)} NM/min, × ${m} min.` }; }
      case 'time': { const m = L <= 2 ? pick([5, 10, 15, 20, 30]) : rnd(4, 30); const d = npm * m; return { kind: 'Time to go', q: `${fmt(d)} NM at ${s} kt`, size: 'small', unit: 'minutes', ans: m, tip: `${s} kt = ${fmt(npm)} NM/min. ${fmt(d)} ÷ ${fmt(npm)} = ${m}.` }; }
      case 'speed': { const m = pick([5, 6, 10, 12, 15, 20, 30]); const d = npm * m; return { kind: 'Find the speed', q: `${fmt(d)} NM in ${m} min`, size: 'small', unit: 'knots', ans: s, tip: `NM per min × 60: ${fmt(d)} ÷ ${m} = ${fmt(npm)}, × 60 = ${s}.` }; }
      case 'close': {
        const a = pick(speeds), b = pick(speeds), head = Math.random() < 0.5;
        return head ? { kind: 'Closing speed', q: `Head-on: ${a} kt and ${b} kt`, size: 'small', unit: 'closing speed, kt', ans: a + b, tip: 'Head-on: add the speeds.' }
          : { kind: 'Closing speed', q: `Same track: ${Math.max(a, b)} kt catching ${Math.min(a, b)} kt`, size: 'small', unit: 'closing speed, kt', ans: Math.abs(a - b), tip: 'Same direction: subtract.' };
      }
      case 'sep': {
        const a = pick([180, 240, 300, 360, 420]), b = pick([180, 240, 300, 360]), close = (a + b) / 60, m = rnd(2, 10), d = close * m;
        return { kind: 'Time to meet', q: `${fmt(d)} NM apart, head-on, ${a} kt and ${b} kt`, size: 'small', unit: 'minutes until they meet', ans: m, tip: `Closing ${a + b} kt = ${fmt(close)} NM/min. ${fmt(d)} ÷ ${fmt(close)} = ${m}.` };
      }
      case 'eta': {
        const sp = pick([180, 240, 300, 360, 420, 480]), m = rnd(5, 40), d = sp / 60 * m, hh = rnd(0, 23), mm = rnd(0, 59), tot = hh * 60 + mm + m;
        return { kind: 'Estimate arrival', q: `Time ${String(hh).padStart(2, '0')}${String(mm).padStart(2, '0')}. ${fmt(d)} NM to go at ${sp} kt.`, size: 'small', unit: 'ETA, 24-hour time (4 digits)', type: 'text', numeric: true, ans: `${String(Math.floor(tot / 60) % 24).padStart(2, '0')}${String(tot % 60).padStart(2, '0')}`, tip: `${sp} kt = ${sp / 60} NM/min → ${m} min to go, then add to the clock.` };
      }
      case 'catch': {
        const slow = pick([240, 270, 300]), fast = slow + pick([60, 120, 180]), m = rnd(2, 12), d = (fast - slow) / 60 * m;
        return { kind: 'Catch-up', q: `Fast jet ${fast} kt is ${fmt(d)} NM behind a ${slow} kt jet on the same track`, size: 'small', unit: 'minutes until it catches up', ans: m, tip: `Closing speed ${fast - slow} kt = ${fmt((fast - slow) / 60)} NM/min. ${fmt(d)} ÷ ${fmt((fast - slow) / 60)}.` };
      }
      case 'fuel': {
        const burn = pick([1800, 2400, 3000, 3600, 4200, 4800]), m = pick([10, 15, 20, 25, 30, 40, 45, 50]);
        return { kind: 'Fuel burn', q: `Burning ${fmt(burn)} kg/h for ${m} min`, size: 'small', unit: 'kg used', ans: burn / 60 * m, tip: `${fmt(burn)} kg/h = ${fmt(burn / 60)} kg/min, × ${m}.` };
      }
      default: {
        const gs = pick([120, 150, 180, 240, 300]), deg = 3;
        return { kind: 'Rate of descent', q: `${deg}° descent at ${gs} kt ground speed`, size: 'small', unit: 'feet per minute (within 10%)', ans: gs * 5, tol: 0.1, tip: 'Rule of thumb: on a 3° slope, rate of descent ≈ ground speed × 5.' };
      }
    }
  }
  A.drill({
    id: 'sdt', area: 'maths', name: 'Speed · distance · time', icon: '⏱️', desc: 'NM per minute, time to go, closing speed, time to meet, catch-ups, ETAs and fuel burn.',
    target: L => [0, 20, 18, 16, 14, 13, 12, 11, 10, 9, 8][L], gen: sdt,
    tips: ['Turn knots into NM per minute first (÷ 60). Everything else is easy from there.', 'Head-on: add speeds. Same direction: subtract.', 'Time = distance ÷ (NM per minute).']
  });

  // ---------- Estimation ----------
  const nice = v => { if (v === 0) return 0; const p = Math.pow(10, Math.floor(Math.log10(Math.abs(v))) - 1); return Math.round(v / p) * p; };
  function estimate(L) {
    let q, exact;
    const t = rnd(0, L >= 5 ? 3 : 1);
    if (t === 0) { const a = rnd(L >= 6 ? 120 : 21, L >= 6 ? 990 : 99), b = rnd(11, L >= 8 ? 99 : 49); q = `${a} × ${b}`; exact = a * b; }
    else if (t === 1) { const b = rnd(6, 49), a = b * rnd(15, 300) + rnd(1, b - 1); q = `${fmt(a)} ÷ ${b}`; exact = a / b; }
    else if (t === 2) { const p = rnd(11, 89), n = rnd(150, 9999); q = `${p}% of ${fmt(n)}`; exact = p / 100 * n; }
    else { const a = rnd(1200, 9800), b = rnd(1200, 9800), c = rnd(100, 999); q = `${fmt(a)} + ${fmt(b)} − ${c}`; exact = a + b - c; }
    const gap = [0, 0.5, 0.45, 0.4, 0.33, 0.28, 0.24, 0.2, 0.16, 0.13, 0.1][L];
    const right = nice(exact);
    const opts = new Set([right]);
    const cands = shuffle([right * (1 + gap), right * (1 - gap), right * (1 + 2 * gap), right * (1 - gap * 1.6), right * 10, right / 10]).map(nice);
    for (const c of cands) { if (opts.size >= 4) break; if (c > 0 && !opts.has(c)) opts.add(c); }
    const ch = shuffle([...opts]);
    return { kind: 'Pick the closest', q, choices: ch.map(c => '≈ ' + fmt(c)), ans: ch.indexOf(right), type: 'choice', tip: `Exact: ${fmt(Math.round(exact * 10) / 10)}. Round each number first, work it out, then adjust.` };
  }
  A.drill({
    id: 'estimate', area: 'maths', name: 'Quick estimates', icon: '🎯', desc: 'Pick the closest answer without working it out fully. Options get closer together as you level up.',
    target: L => [0, 26, 24, 22, 20, 18, 16, 15, 14, 13, 12][L], gen: estimate,
    tips: ['Round to one or two significant figures first.', 'Check the size: is it in the hundreds or the thousands?']
  });

  // ---------- Percentages & fractions ----------
  function percent(L) {
    const ps = L <= 2 ? [10, 25, 50] : L <= 4 ? [5, 10, 15, 20, 25, 50, 75] : [5, 12.5, 15, 20, 30, 35, 40, 60, 65, 75, 80, 90];
    const types = L <= 2 ? ['of'] : L <= 4 ? ['of', 'frac'] : L <= 6 ? ['of', 'frac', 'what', 'inc'] : ['of', 'frac', 'what', 'inc', 'fuel', 'rev'];
    switch (pick(types)) {
      case 'of': { const p = pick(ps), n = rnd(2, L <= 2 ? 20 : 60) * (p === 12.5 ? 8 : 20); return { kind: 'Percentage', q: `${p}% of ${fmt(n)}`, ans: p / 100 * n, tip: '10% = move the decimal one place. 5% = half of 10%. 25% = a quarter.' }; }
      case 'frac': { const [a, b] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 6], [5, 6], [1, 8], [3, 8], [5, 8]]); const n = b * rnd(3, L <= 4 ? 25 : 90); return { kind: 'Fraction', q: `${a}/${b} of ${fmt(n)}`, ans: a * n / b, tip: `Divide by ${b}, then multiply by ${a}.` }; }
      case 'what': { const p = pick([10, 20, 25, 40, 50, 75, 5, 15, 60]), n = rnd(2, 40) * 20, part = p / 100 * n; return { kind: 'What percent?', q: `${fmt(part)} out of ${fmt(n)}`, unit: 'percent', ans: p, tip: `part ÷ whole × 100: ${fmt(part)} ÷ ${fmt(n)} × 100.` }; }
      case 'inc': { const p = pick([10, 20, 25, 50, 5, 15]), n = rnd(2, 40) * 20, up = Math.random() < 0.5; return { kind: up ? 'Increase' : 'Decrease', q: `${fmt(n)} ${up ? '+' : '−'} ${p}%`, ans: up ? n * (1 + p / 100) : n * (1 - p / 100), tip: `Find ${p}% (${fmt(n * p / 100)}), then ${up ? 'add' : 'subtract'} it.` }; }
      case 'fuel': { const cap = rnd(4, 24) * 1000, p = pick([15, 20, 25, 35, 40, 45, 60, 65, 70, 85]); return { kind: 'Fuel check', q: `Tank holds ${fmt(cap)} kg and shows ${p}%`, size: 'small', unit: 'kg on board', ans: cap * p / 100, tip: `1% of ${fmt(cap)} is ${fmt(cap / 100)}; × ${p}.` }; }
      default: { const p = pick([10, 20, 25, 40, 50]), whole = rnd(2, 40) * 40, part = whole * p / 100; return { kind: 'Find the whole', q: `${p}% is ${fmt(part)}. What is 100%?`, size: 'small', ans: whole, tip: `${fmt(part)} ÷ ${p} = 1%, then × 100.` }; }
    }
  }
  A.drill({
    id: 'percent', area: 'maths', name: 'Percentages & fractions', icon: '🥧', desc: 'Percentages of, fractions of, what-percent, increases, fuel checks and working backwards.',
    target: L => [0, 22, 20, 18, 16, 15, 14, 13, 12, 11, 10][L], gen: percent,
    tips: ['10% → shift the decimal. 5% → half of 10%. 15% → 10% + 5%.', 'Fractions: divide by the bottom, multiply by the top.']
  });
})(window.ATC);
