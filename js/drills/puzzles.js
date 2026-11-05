/* Puzzle Peaks: number series, number machines, missing operators, symbol sums, odd one out. */
(function (A) {
  'use strict';
  const { rnd, pick, fmt, shuffle } = A.u;
  const arr = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199];

  // ---------- Number series ----------
  const SERIES = [
    { l: 1, f() { const a = rnd(1, 20), d = rnd(2, 9); return { s: arr(6, i => a + i * d), r: `add ${d} each time` }; } },
    { l: 1, f() { const d = rnd(2, 9), a = d * 6 + rnd(3, 40); return { s: arr(6, i => a - i * d), r: `subtract ${d} each time` }; } },
    { l: 2, f() { const a = rnd(1, 6); return { s: arr(6, i => a * 2 ** i), r: 'double each time' }; } },
    { l: 2, f() { const a = rnd(2, 9) * 32; return { s: arr(6, i => a / 2 ** i), r: 'halve each time' }; } },
    { l: 3, f() { const a = rnd(1, 4); return { s: arr(6, i => a * 3 ** i), r: '× 3 each time' }; } },
    { l: 3, f() { const a = rnd(1, 15), x = rnd(2, 9), y = rnd(1, 9); const s = [a]; for (let i = 1; i < 7; i++) s.push(s[i - 1] + (i % 2 ? x : y)); return { s, r: `alternately add ${x} and ${y}` }; } },
    { l: 4, f() { const a = rnd(1, 20), d = rnd(1, 4); const s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + d + i - 1); return { s, r: `the gap grows by 1 each time (+${d}, +${d + 1}, +${d + 2}…)` }; } },
    { l: 4, f() { const k = rnd(1, 7); return { s: arr(6, i => (i + k) ** 2), r: `square numbers: ${k}², ${k + 1}², ${k + 2}²…` }; } },
    { l: 5, f() { const a = rnd(1, 5), c = rnd(1, 3); const s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] * 2 + c); return { s, r: `× 2 then + ${c}` }; } },
    { l: 5, f() { const a = rnd(1, 9), d = rnd(2, 6), b = rnd(40, 70), e = rnd(2, 6); const s = arr(8, i => i % 2 === 0 ? a + (i / 2) * d : b - ((i - 1) / 2) * e); return { s, r: `two series interleaved: ${a}, ${a + d}… (+${d}) and ${b}, ${b - e}… (−${e})` }; } },
    { l: 6, f() { const a = rnd(1, 6), b = rnd(1, 8); const s = [a, b]; for (let i = 2; i < 7; i++) s.push(s[i - 1] + s[i - 2]); return { s, r: 'each term is the sum of the two before it' }; } },
    { l: 6, f() { const k = rnd(1, 3); return { s: arr(6, i => (i + k) ** 3), r: `cube numbers: ${k}³, ${k + 1}³…` }; } },
    { l: 6, f() { const a = rnd(1, 30); const s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + 2 ** (i - 1)); return { s, r: 'the gap doubles: +1, +2, +4, +8…' }; } },
    { l: 7, f() { const k = rnd(1, 4), a = rnd(k + 1, 9); const s = [a]; for (let i = 1; i < 7; i++) s.push(i % 2 ? s[i - 1] * 2 : s[i - 1] - k); return { s, r: `alternately × 2 and − ${k}` }; } },
    { l: 7, f() { const st = rnd(2, 12); return { s: PRIMES.slice(st, st + 6), r: 'consecutive prime numbers' }; } },
    { l: 8, f() { const k = rnd(1, 6); return { s: arr(6, i => (i + k) * (i + k + 1) / 2), r: 'triangular numbers (the gap grows by 1)' }; } },
    { l: 8, f() { const a = rnd(1, 20), d = rnd(1, 5), dd = rnd(2, 4); const s = [a]; let g = d; for (let i = 1; i < 6; i++) { s.push(s[i - 1] + g); g += dd; } return { s, r: `the gap grows by ${dd} each time` }; } },
    { l: 8, f() { const k = rnd(1, 6); return { s: arr(6, i => (i + k) ** 2 + (i + k)), r: 'n² + n (n × (n + 1))' }; } },
    { l: 9, f() { const a = rnd(1, 6), m = rnd(2, 3), c = rnd(1, 5); const s = [a]; for (let i = 1; i < 7; i++) s.push(i % 2 ? s[i - 1] * m : s[i - 1] + c); return { s, r: `alternately × ${m} and + ${c}` }; } },
    { l: 9, f() { const a = rnd(3, 6), c = rnd(1, 4); const s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] * 3 - c); return { s, r: `× 3 then − ${c}` }; } },
    { l: 10, f() { const a = rnd(1, 30); const s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + PRIMES[i - 1]); return { s, r: 'the gaps are prime numbers: +2, +3, +5, +7…' }; } },
    { l: 10, f() { const a = rnd(1, 3); const s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] * (i + 1)); return { s, r: '× 2, × 3, × 4, × 5…' }; } },
    { l: 10, f() { const a = rnd(1, 20); const fib = [1, 1, 2, 3, 5, 8]; const s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + fib[i - 1]); return { s, r: 'the gaps are 1, 1, 2, 3, 5 (each gap = sum of the two before)' }; } },
    { l: 10, f() { const k = rnd(2, 5); return { s: arr(6, i => (i + k) ** 2 - (i + k) * 2), r: 'n² − 2n' }; } }
  ];
  function series(L) {
    const pool = SERIES.filter(p => p.l <= L && p.l >= L - 3);
    const { s, r } = pick(pool).f();
    if (L >= 4 && Math.random() < 0.3) {
      const k = rnd(1, s.length - 2), ans = s[k];
      return { kind: 'Fill the gap', q: s.map((v, i) => i === k ? '?' : fmt(v)).join(', '), size: 'small', ans, tip: `Rule: ${r}.` };
    }
    const ans = s[s.length - 1];
    return { kind: 'What comes next?', q: s.slice(0, -1).map(fmt).join(', ') + ', ?', size: 'small', ans, tip: `Rule: ${r}.` };
  }
  A.drill({
    id: 'series', area: 'puzzle', name: 'Number series', icon: '🔢', desc: 'Find the rule and the next (or missing) number. Rules go from +3 to primes, interleaved series and growing gaps.',
    target: L => [0, 16, 15, 13, 12, 11, 10, 9, 8, 7, 7][L], gen: series,
    tips: ['Write the gaps in your head first. If the gaps make a pattern, you have it.', 'If the numbers grow very fast, try × or squares.', 'If it zig-zags, it may be two series woven together: look at every second number.']
  });

  // ---------- Number machines ----------
  const RULES = [
    { l: 1, mk() { const k = rnd(2, 15); return { f: x => x + k, t: `add ${k}` }; } },
    { l: 1, mk() { const k = rnd(2, 6); return { f: x => x * k, t: `× ${k}` }; } },
    { l: 2, mk() { const k = rnd(2, 5), c = rnd(1, 9); return { f: x => x * k + c, t: `× ${k}, then + ${c}` }; } },
    { l: 3, mk() { const k = rnd(3, 6), c = rnd(1, 5); return { f: x => x * k - c, t: `× ${k}, then − ${c}`, min: 2 }; } },
    { l: 4, mk() { return { f: x => x * x, t: 'square it' }; } },
    { l: 4, mk() { const c = rnd(1, 9); return { f: x => x * x + c, t: `square it, then + ${c}` }; } },
    { l: 5, mk() { const a = rnd(1, 5), b = rnd(2, 4); return { f: x => (x + a) * b, t: `+ ${a}, then × ${b}` }; } },
    { l: 5, mk() { const c = rnd(2, 5); return { f: x => x * x - c, t: `square it, then − ${c}`, min: 3 }; } },
    { l: 6, mk() { return { f: x => x * (x + 1), t: 'x × (x + 1)' }; } },
    { l: 6, mk() { const c = rnd(1, 4); return { f: x => 2 * x * x - c, t: `square it, × 2, then − ${c}`, min: 2 }; } },
    { l: 7, mk() { return { f: x => x ** 3, t: 'cube it', max: 7 }; } },
    { l: 7, mk() { const a = rnd(2, 4); return { f: x => (x - a) ** 2, t: `− ${a}, then square it`, min: a + 1 }; } },
    { l: 8, mk() { return { f: x => x * x - x, t: 'x² − x' }; } },
    { l: 8, mk() { const k = rnd(2, 4); return { f: x => (x * k) + (x * x), t: `x² + ${k}x` }; } },
    { l: 9, mk() { return { f: x => 3 * x * x - 2 * x, t: '3x² − 2x' }; } },
    { l: 9, mk() { const c = rnd(1, 3); return { f: x => x ** 3 - c, t: `cube it, then − ${c}`, min: 2, max: 7 }; } },
    { l: 10, mk() { return { f: x => (x + 1) ** 2 + x, t: '(x + 1)² + x' }; } },
    { l: 10, mk() { return { f: x => 2 * x * x + x, t: '2x² + x' }; } }
  ];
  function machine(L) {
    const pool = RULES.filter(p => p.l <= L && p.l >= L - 3);
    const r = pick(pool).mk(), lo = r.min || 1, hi = r.max || (L <= 3 ? 12 : 10);
    const xs = shuffle(arr(hi - lo + 1, i => lo + i)).slice(0, 4);
    const ex = xs.slice(0, 3), x = xs[3];
    return {
      kind: 'Number machine', pre: `<div class="pair mono">${ex.map(v => `${v} → ${fmt(r.f(v))}`).join('<br>')}</div>`,
      q: `${x} → ?`, ans: r.f(x), tip: `Rule: ${r.t}.`, review: ex.map(v => `${v}→${r.f(v)}`).join(', ') + `; ${x} → ?`
    };
  }
  A.drill({
    id: 'machine', area: 'puzzle', name: 'Number machines', icon: '⚙️', desc: 'Work out the rule from three examples, then run it on a new number.',
    target: L => [0, 14, 13, 12, 11, 10, 9, 8, 7, 7, 6][L], gen: machine,
    tips: ['Check the smallest input first. Its output usually gives the rule away.', 'If outputs jump faster than the inputs, think squares or cubes.']
  });

  // ---------- Missing operators ----------
  function evalOps(nums, ops) {
    const n = [...nums], o = [...ops];
    for (let i = 0; i < o.length;) {
      if (o[i] === '×' || o[i] === '÷') {
        if (o[i] === '÷') { if (n[i + 1] === 0 || n[i] % n[i + 1] !== 0) return null; n.splice(i, 2, n[i] / n[i + 1]); }
        else n.splice(i, 2, n[i] * n[i + 1]);
        o.splice(i, 1);
      } else i++;
    }
    let v = n[0]; o.forEach((op, i) => { v = op === '+' ? v + n[i + 1] : v - n[i + 1]; });
    return v;
  }
  const combos = (pool, k) => k === 0 ? [[]] : combos(pool, k - 1).flatMap(c => pool.map(p => [...c, p]));
  function operators(L) {
    const pool = L <= 3 ? ['+', '−'] : ['+', '−', '×', '÷'];
    const cnt = L >= 7 ? 4 : 3, top = L <= 3 ? 25 : L <= 6 ? 12 : 15;
    for (let g = 0; g < 300; g++) {
      const nums = arr(cnt, () => rnd(1, top));
      const all = combos(pool, cnt - 1).map(o => ({ o, v: evalOps(nums, o) })).filter(c => c.v !== null && c.v >= 0);
      if (all.length < 4) continue;
      const pickC = pick(all), target = pickC.v;
      const wrong = shuffle(all.filter(c => c.v !== target));
      if (wrong.length < 3) continue;
      const opts = shuffle([pickC, ...wrong.slice(0, 3)]);
      return {
        kind: 'Missing operators', q: nums.join(' ◻ ') + ` = ${target}`, size: 'small', type: 'choice',
        choices: opts.map(c => c.o.map(o => `<span style="margin:0 7px">${o}</span>`).join('')), ans: opts.indexOf(pickC),
        unit: '× and ÷ come before + and −', show: `${nums.map((v, i) => i ? pickC.o[i - 1] + ' ' + v : v).join(' ')} = ${target}`, tip: 'Try each option, doing × and ÷ first.'
      };
    }
    return operators(1);
  }
  A.drill({
    id: 'operators', area: 'puzzle', name: 'Missing operators', icon: '➗', desc: 'Which signs make the sum work? Normal order of operations (× ÷ before + −).',
    target: L => [0, 16, 15, 14, 12, 11, 10, 9, 8, 7, 7][L], gen: operators,
    tips: ['Look at the size of the answer: big answers need ×, small ones need − or ÷.', 'Remember × and ÷ happen before + and −.']
  });

  // ---------- Symbol sums ----------
  const SYM = ['✈️', '⭐', '☁️', '🌙', '🎈'];
  function symbols(L) {
    const S = shuffle(SYM), mx = L <= 4 ? 9 : 12, v = arr(4, () => rnd(2, mx));
    const [a, b, c, d] = S, [x, y, z, w] = v;
    let eqs, ask, ans, tip;
    const T = Math.min(L, 10);
    if (T === 1) { eqs = [`${a} + ${a} + ${a} = ${3 * x}`]; ask = `${a} = ?`; ans = x; tip = `${3 * x} ÷ 3 = ${x}.`; }
    else if (T === 2) { eqs = [`${a} + ${a} = ${2 * x}`, `${a} + ${b} = ${x + y}`]; ask = `${b} = ?`; ans = y; tip = `${a} = ${x}, so ${b} = ${x + y} − ${x}.`; }
    else if (T === 3) { eqs = [`${a} + ${a} + ${a} = ${3 * x}`, `${a} + ${b} + ${b} = ${x + 2 * y}`]; ask = `${a} + ${b} = ?`; ans = x + y; tip = `${a} = ${x}, ${b} = ${y}.`; }
    else if (T === 4) { eqs = [`${a} + ${a} = ${2 * x}`, `${a} + ${b} = ${x + y}`, `${b} + ${c} = ${y + z}`]; ask = `${c} = ?`; ans = z; tip = `${a} = ${x}, ${b} = ${y}, ${c} = ${z}.`; }
    else if (T === 5) { eqs = [`${a} × ${a} = ${x * x}`, `${a} + ${b} = ${x + y}`]; ask = `${a} × ${b} = ?`; ans = x * y; tip = `${a} = ${x}, ${b} = ${y}.`; }
    else if (T === 6) { const hi = Math.max(x, y) + 1, lo = Math.min(x, y); eqs = [`${a} + ${b} = ${hi + lo}`, `${a} − ${b} = ${hi - lo}`]; ask = `${a} × ${b} = ?`; ans = hi * lo; tip = `Add both lines: 2 × ${a} = ${2 * hi}, so ${a} = ${hi} and ${b} = ${lo}.`; }
    else if (T === 7) { eqs = [`${a} × ${a} = ${x * x}`, `${a} + ${b} = ${x + y}`, `${b} × ${c} = ${y * z}`]; ask = `${a} + ${b} × ${c} = ?`; ans = x + y * z; tip = `${a} = ${x}, ${b} = ${y}, ${c} = ${z}. × before +.`; }
    else if (T === 8) { eqs = [`${a} + ${b} = ${x + y}`, `${b} + ${c} = ${y + z}`, `${a} + ${c} = ${x + z}`]; ask = `${a} + ${b} + ${c} = ?`; ans = x + y + z; tip = `Add all three lines: that's 2 × (${a} + ${b} + ${c}) = ${2 * (x + y + z)}. Halve it.`; }
    else if (T === 9) { eqs = [`${a} × ${b} = ${x * y}`, `${a} + ${a} = ${2 * x}`, `${c} − ${b} = ${z}`, `${d} = ${a} + ${c}`]; ask = `${d} − ${b} = ?`; ans = x + z; tip = `${a} = ${x}, ${b} = ${y}, ${c} = ${z + y}, ${d} = ${x + z + y}.`; }
    else { eqs = [`${a} × ${b} = ${x * y}`, `${a} + ${b} = ${x + y}`, `${b} × ${b} = ${y * y}`, `${c} = ${a} × ${a} − ${b}`]; ask = `${c} + ${d}, if ${d} = ${b} + ${b}`; ans = x * x - y + 2 * y; tip = `${b} = ${y} (from ${b}×${b}), ${a} = ${x}, ${c} = ${x * x - y}, ${d} = ${2 * y}.`; }
    if (T === 10 && x * x - y < 0) return symbols(L);
    return { kind: 'Symbol sums', pre: `<div class="eqs">${eqs.join('<br>')}</div>`, q: ask, size: 'small', ans, tip, review: eqs.join(' · ') + ' → ' + ask };
  }
  A.drill({
    id: 'symbols', area: 'puzzle', name: 'Symbol sums', icon: '✈️', desc: 'Each picture stands for a number. Crack them and finish the last sum. Like algebra, but cuter.',
    target: L => [0, 14, 12, 11, 10, 9, 8, 7, 6, 6, 5][L], gen: symbols,
    tips: ['Start with the line that has only one kind of symbol.', 'Two lines with the same pair? Add or subtract the lines.']
  });

  // ---------- Odd one out ----------
  const isSq = n => Number.isInteger(Math.sqrt(n));
  const isCube = n => Number.isInteger(Math.round(Math.cbrt(n))) && Math.round(Math.cbrt(n)) ** 3 === n;
  const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
  const dsum = n => String(n).split('').reduce((a, b) => a + +b, 0);
  const isPal = n => n > 10 && String(n) === String(n).split('').reverse().join('');
  const isTri = n => isSq(8 * n + 1);
  const asc = n => n > 99 && String(n).split('').every((c, i, s) => i === 0 || +c > +s[i - 1]);
  const PROPS = [
    { l: 1, id: 'even', t: 'even', test: n => n % 2 === 0, gen: hi => 2 * rnd(1, hi / 2) },
    { l: 1, id: 'odd', t: 'odd', test: n => n % 2 === 1, gen: hi => 2 * rnd(0, hi / 2 - 1) + 1 },
    ...[3, 4, 5, 6, 7, 9].map(k => ({ l: k <= 5 ? 2 : 3, id: 'm' + k, t: `multiples of ${k}`, test: n => n % k === 0, gen: hi => k * rnd(2, Math.floor(hi / k)) })),
    { l: 4, id: 'sq', t: 'square numbers', test: isSq, gen: hi => rnd(2, Math.floor(Math.sqrt(hi))) ** 2 },
    { l: 5, id: 'pr', t: 'prime numbers', test: isPrime, gen: hi => pick(PRIMES.filter(p => p <= hi && p > 10)) },
    { l: 5, id: 'm11', t: 'multiples of 11', test: n => n % 11 === 0, gen: hi => 11 * rnd(2, Math.floor(hi / 11)) },
    { l: 6, id: 'ds', t: 'numbers whose digits add to 10', test: n => dsum(n) === 10, gen: hi => { let n; do { n = rnd(19, hi); } while (dsum(n) !== 10); return n; } },
    { l: 7, id: 'cu', t: 'cube numbers', test: isCube, gen: () => rnd(2, 9) ** 3 },
    { l: 7, id: 'pal', t: 'palindromes (same both ways)', test: isPal, gen: hi => { let n; do { n = rnd(11, hi); } while (!isPal(n)); return n; } },
    { l: 8, id: 'asc', t: 'numbers with digits in rising order', test: asc, gen: () => { const d = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3).sort(); return +d.join(''); } },
    { l: 9, id: 'tri', t: 'triangular numbers (1, 3, 6, 10, 15…)', test: isTri, gen: hi => { const k = rnd(3, Math.floor(Math.sqrt(2 * hi)) - 1); return k * (k + 1) / 2; } }
  ];
  function oddone(L) {
    const hi = L <= 3 ? 60 : L <= 6 ? 200 : 999;
    const avail = PROPS.filter(p => p.l <= L);
    const pool = avail.filter(p => p.l >= L - 3);
    for (let g = 0; g < 400; g++) {
      const p = pick(pool);
      const set = new Set(); let guard = 0;
      while (set.size < 4 && guard++ < 100) { const n = p.gen(hi); if (n > 1 && n <= hi && p.test(n)) set.add(n); }
      if (set.size < 4) continue;
      // odd one: looks plausible but fails the test
      let odd, gg = 0;
      do { const base = pick([...set]); odd = gg < 30 ? base + pick([-3, -2, -1, 1, 2, 3]) : rnd(2, hi); gg++; } while ((odd < 2 || p.test(odd) || set.has(odd)) && gg < 200);
      if (p.test(odd) || odd < 2) continue;
      const all = [...set, odd];
      // reject if another property also picks out exactly one different number
      const ambiguous = avail.some(q => q.id !== p.id && (() => { const fails = all.filter(n => !q.test(n)); return fails.length === 1 && fails[0] !== odd; })());
      if (ambiguous) continue;
      const ch = shuffle(all);
      return { kind: 'Odd one out', q: 'Which number doesn\'t belong?', size: 'tiny', type: 'choice', cols: 3, choices: ch.map(String), ans: ch.indexOf(odd), tip: `The others are ${p.t}; ${odd} isn't.` };
    }
    return oddone(1);
  }
  A.drill({
    id: 'oddone', area: 'puzzle', name: 'Odd one out', icon: '🦄', desc: 'Four numbers share a secret property. Find the one that doesn\'t.',
    target: L => [0, 18, 16, 14, 13, 12, 11, 10, 9, 8, 8][L], gen: oddone,
    tips: ['Run a quick checklist: even/odd, multiples (3, 4, 5, 7, 9, 11), squares, primes, digit sums.']
  });
})(window.ATC);
