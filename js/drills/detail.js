/* Detail Docks: same/different strings, spot-the-difference tables, scan & count. */
(function (A) {
  'use strict';
  const { rnd, pick, shuffle, sample, pad3 } = A.u;
  const LOOK = { '0': 'O', 'O': '0', '1': 'I', 'I': '1', '5': 'S', 'S': '5', '8': 'B', 'B': '8', '2': 'Z', 'Z': '2', '6': 'G', 'G': '6', 'M': 'N', 'N': 'M', 'E': 'F', 'F': 'E', '3': '8', '7': '1', 'U': 'V', 'V': 'U', 'P': 'R', 'R': 'P', 'C': 'G', 'Q': 'O', 'D': '0', 'H': 'N', 'K': 'X', 'X': 'K', 'W': 'V', '4': 'A', 'A': '4', '9': '6', 'T': '7' };
  const AN = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  const TYPES = ['B738', 'A320', 'DH8D', 'E190', 'B77W', 'A388', 'B789', 'A333', 'SF34', 'C172'];
  const DEST = ['SYD', 'MEL', 'BNE', 'PER', 'ADL', 'CNS', 'CBR', 'HBA', 'DRW', 'OOL'];
  const tok = () => pick([
    () => A.u.callsign(9), () => pick(TYPES), () => 'FL' + pad3(rnd(5, 45) * 10), () => pick(DEST) + '-' + pick(DEST),
    () => 'A' + Array.from({ length: 4 }, () => rnd(0, 7)).join(''), () => String(rnd(0, 23)).padStart(2, '0') + String(rnd(0, 59)).padStart(2, '0') + 'Z',
    () => rnd(118, 135) + '.' + pick(['05', '15', '25', '35', '45', '55', '1', '4', '7']), () => Array.from({ length: 5 }, () => pick(AN.split(''))).join('')
  ])();
  function makeStr(len, L) {
    if (L <= 3) return Array.from({ length: len }, () => pick(AN.split(''))).join('');
    let s = ''; while (s.length < len) s += (s ? ' ' : '') + tok();
    return s;
  }
  function mutate(s, L) {
    const idx = s.split('').map((c, i) => i).filter(i => s[i] !== ' ' && s[i] !== '-' && s[i] !== '.');
    const t = L >= 3 && Math.random() < 0.3 ? 'swap' : L >= 7 && Math.random() < 0.15 ? 'drop' : 'sub';
    if (t === 'swap') {
      const ok = idx.filter(i => idx.includes(i + 1) && s[i] !== s[i + 1]);
      if (ok.length) { const i = pick(ok); return s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2); }
    }
    if (t === 'drop') { const i = pick(idx); return s.slice(0, i) + s.slice(i + 1); }
    const look = idx.filter(i => LOOK[s[i]]);
    const i = L >= 4 && look.length ? pick(look) : pick(idx);
    let c = L >= 4 && LOOK[s[i]] ? LOOK[s[i]] : pick(AN.split('').filter(x => x !== s[i]));
    if (c === s[i]) c = s[i] === 'X' ? 'Y' : 'X';
    return s.slice(0, i) + c + s.slice(i + 1);
  }

  // ---------- Same or different ----------
  function samediff(L) {
    const len = [0, 5, 6, 8, 10, 12, 14, 16, 18, 21, 24][L];
    const a = makeStr(len, L), same = Math.random() < 0.5, b = same ? a : mutate(a, L);
    let diffAt = -1; if (!same) for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { diffAt = i; break; }
    return {
      kind: 'Same or different?', q: '', pre: `<div class="cmp mono">${a}</div><div class="cmp mono">${b}</div>`, type: 'choice', choices: ['✓ Same', '✗ Different'], ans: same ? 0 : 1,
      tip: same ? 'They were identical.' : `Look near character ${diffAt + 1}: “${a.slice(Math.max(0, diffAt - 2), diffAt + 3)}” vs “${b.slice(Math.max(0, diffAt - 2), diffAt + 3)}”.`, review: `${a}  vs  ${b}`, okDelay: 260
    };
  }
  A.drill({
    id: 'samediff', area: 'detail', name: 'Same or different', icon: '👯', desc: 'Two codes, one glance: identical or not? Later levels use flight-plan strings and look-alike characters (0/O, 1/I, 8/B, 5/S).',
    target: L => [0, 30, 28, 26, 24, 22, 20, 18, 17, 16, 15][L], accFloor: 0.75, gen: samediff,
    tips: ['Scan in chunks of 3–4 characters, left to right, comparing chunk by chunk.', 'Watch the classic traps: 0/O, 1/I, 5/S, 8/B, 2/Z, swapped neighbours.']
  });

  // ---------- Spot the differences (tables) ----------
  function table(L) {
    const [rows, cols] = [null, [3, 3], [3, 4], [4, 4], [4, 5], [5, 5], [5, 6], [6, 5], [6, 6], [7, 6], [8, 6]][L];
    const heads = ['Callsign', 'FL', 'Type', 'Hdg', 'Spd', 'Dest'].slice(0, cols);
    const data = Array.from({ length: rows }, () => [A.u.callsign(9), pad3(rnd(5, 45) * 10), pick(TYPES), pad3(rnd(1, 72) * 5), String(rnd(18, 49) * 10), pick(DEST)].slice(0, cols));
    const nErr = L === 1 ? 1 : L <= 3 ? rnd(1, 2) : L <= 6 ? rnd(1, 3) : rnd(0, 4);
    const errs = sample(Array.from({ length: rows * cols }, (_, i) => i), nErr);
    const copy = data.map(r => [...r]);
    errs.forEach(e => { const r = Math.floor(e / cols), c = e % cols; let m; do { m = mutate(copy[r][c], Math.max(L, 4)); } while (m === data[r][c]); copy[r][c] = m; });
    const th = `<tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr>`;
    const tA = `<table class="tbl mono">${th}${data.map(r => `<tr>${r.map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</table>`;
    const tB = `<table class="tbl mono tap">${th}${copy.map((r, ri) => `<tr>${r.map((v, ci) => `<td data-t="${ri * cols + ci}">${v}</td>`).join('')}</tr>`).join('')}</table>`;
    return {
      kind: 'Spot the differences', pre: `<div class="unit">Original</div>${tA}<div class="unit" style="margin-top:8px">Copy: tap every cell that's different${L >= 7 ? ' (there may be none)' : ''}</div>${tB}`,
      type: 'tap', ans: errs, tip: `There ${nErr === 1 ? 'was 1 difference' : `were ${nErr} differences`}. Compare row by row, cell by cell.`, show: `${nErr} difference${nErr === 1 ? '' : 's'}`, review: `${rows}×${cols} table, ${nErr} error(s)`
    };
  }
  A.drill({
    id: 'tables', area: 'detail', name: 'Spot the differences', icon: '📋', desc: 'Compare a copied table against the original and tap every cell that was copied wrong. Tables grow; from level 7 there may be no errors at all.',
    trials: 6, gen: table, tips: ['Work column by column: your eyes compare one kind of data faster.', 'Use a finger (or your eyes) as a ruler so you don\'t skip a row.']
  });

  // ---------- Scan & count ----------
  function count(L) {
    const [w, h] = [null, [5, 4], [6, 5], [6, 6], [7, 6], [8, 6], [8, 7], [8, 8], [9, 8], [10, 8], [10, 9]][L];
    let pool = L <= 3 ? '0123456789'.split('') : 'ABCDEFGHKMNPRSTUVXZ0123456789'.split('');
    let target = pick(pool);
    if (L >= 7) { target = pick(Object.keys(LOOK)); const lk = LOOK[target]; pool = [...new Set([lk, lk, LOOK[lk] || lk, ...sample(AN.split(''), 8)])].filter(c => c !== target); pool.push(lk, lk); }
    else pool = pool.filter(c => c !== target);
    const n = w * h, k = rnd(Math.max(2, Math.floor(n * 0.06)), Math.max(4, Math.floor(n * 0.14)));
    const cells = Array.from({ length: n }, () => pick(pool)); sample(Array.from({ length: n }, (_, i) => i), k).forEach(i => { cells[i] = target; });
    return {
      kind: 'Scan & count', q: `How many <span style="color:var(--warn)">${target}</span>?`, size: 'small', noAuto: true,
      pre: `<div class="chargrid mono" style="grid-template-columns:repeat(${w},1fr)">${cells.map(c => `<span>${c}</span>`).join('')}</div>`, ans: k,
      tip: 'Scan row by row and keep count with a steady rhythm. Don\'t jump around.', review: `Count “${target}” in a ${w}×${h} grid`
    };
  }
  A.drill({
    id: 'count', area: 'detail', name: 'Scan & count', icon: '🔎', desc: 'Count how many times one character appears in a grid. Higher levels hide it among look-alikes.',
    target: L => [0, 14, 13, 12, 11, 10, 9, 8, 8, 7, 7][L], gen: count,
    tips: ['Go row by row. Tap your finger on each row as you go.', 'Look-alikes (8 vs B, 0 vs O): check shape, not just outline.']
  });
})(window.ATC);
