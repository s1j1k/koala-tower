/* Code Canyon: code book, rule follower, symbol operations, code breaker. */
(function (A) {
  'use strict';
  const { rnd, pick, shuffle, sample, pad3 } = A.u;
  const WORDS = ['RADAR', 'PLANE', 'TOWER', 'CLIMB', 'APRON', 'TAXI', 'HOLD', 'FINAL', 'FLARE', 'WIND', 'CLOUD', 'PILOT', 'ROUTE', 'LEVEL', 'SPEED', 'ORBIT', 'TRACK', 'DELTA', 'ALPHA', 'BRAVO', 'KOALA', 'EMU', 'DINGO', 'WOMBAT', 'RUNWAY', 'VECTOR', 'SQUAWK', 'METAR', 'HEADING', 'DESCEND', 'CONTACT', 'TRAFFIC'];
  const SYMS = ['▲', '●', '■', '◆', '★', '♥', '♣', '♠', '☾', '✚', '⬟', '✦'];
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // ---------- Code book ----------
  function codebook(L) {
    const maxLen = L <= 2 ? 4 : L <= 4 ? 5 : L <= 7 ? 6 : 7;
    const word = pick(WORDS.filter(w => w.length <= maxLen));
    const size = Math.max(new Set(word).size, [0, 5, 6, 6, 7, 8, 8, 9, 10, 11, 12][L]);
    const letters = [...new Set(word)]; while (letters.length < size) { const c = pick(ABC.split('')); if (!letters.includes(c)) letters.push(c); }
    const useSym = L >= 4 && size <= 12 && (L >= 7 || Math.random() < 0.5);
    const vals = useSym ? sample(SYMS, size) : sample('0123456789'.split(''), size).concat(sample(SYMS, Math.max(0, size - 10)));
    const key = {}; shuffle(letters).forEach((c, i) => { key[c] = vals[i]; });
    const keyHtml = `<div class="keytbl mono">${Object.keys(key).sort().map(c => `<span><b>${c}</b>=${key[c]}</span>`).join('')}</div>`;
    const enc = w => w.split('').map(c => key[c]).join('');
    const decode = L >= 3 && Math.random() < 0.45;
    if (decode) {
      const code = enc(word), ks = Object.keys(key);
      const opts = new Set([word]); let g = 0;
      while (opts.size < 4 && g++ < 100) { const i = rnd(0, word.length - 1); const w2 = word.slice(0, i) + pick(ks.filter(c => c !== word[i])) + word.slice(i + 1); opts.add(w2); }
      const ch = shuffle([...opts]);
      return { kind: 'Decode', pre: keyHtml, q: `<span class="mono">${code}</span>`, size: 'small', type: 'choice', choices: ch, ans: ch.indexOf(word), tip: `${code} → ${word}. Decode one symbol at a time.`, review: `Decode ${code}` };
    }
    if (useSym) {
      const right = enc(word), opts = new Set([right]); let g = 0;
      while (opts.size < 4 && g++ < 100) {
        const a = right.match(/./gu); const i = rnd(0, a.length - 1);
        if (Math.random() < 0.5 && i < a.length - 1) [a[i], a[i + 1]] = [a[i + 1], a[i]]; else a[i] = pick(Object.values(key).filter(v => v !== a[i]));
        opts.add(a.join(''));
      }
      const ch = shuffle([...opts]);
      return { kind: 'Encode', pre: keyHtml, q: word, size: 'small', type: 'choice', choices: ch.map(c => `<span class="mono">${c}</span>`), ans: ch.indexOf(right), tip: `${word} → ${right}.`, review: `Encode ${word}` };
    }
    return { kind: 'Encode', pre: keyHtml, q: word, size: 'small', type: 'text', numeric: true, ans: enc(word), show: enc(word), unit: 'type the digits', tip: `${word.split('').map(c => `${c}=${key[c]}`).join(', ')}.`, review: `Encode ${word}` };
  }
  A.drill({
    id: 'codebook', area: 'coded', name: 'Code book', icon: '📕', desc: 'Use the key to encode and decode words. Keys get bigger and switch to symbols as you level up.',
    target: L => [0, 14, 13, 12, 11, 10, 9, 8, 8, 7, 7][L], gen: codebook,
    tips: ['Look each letter up once and hold the code in short chunks.', 'For decoding, rule options out at the first wrong symbol.']
  });

  // ---------- Rule follower ----------
  const CONDS = [
    { l: 1, mk() { const x = pick([150, 200, 250, 300]); return { t: `FL${x} or above`, f: a => a.fl >= x }; } },
    { l: 1, mk() { const x = pick([150, 200, 250, 300]); return { t: `below FL${x}`, f: a => a.fl < x }; } },
    { l: 2, mk() { return { t: 'heading 001–180 (eastbound)', f: a => a.hdg >= 1 && a.hdg <= 180 }; } },
    { l: 2, mk() { return { t: 'heading 181–360 (westbound)', f: a => a.hdg > 180 }; } },
    { l: 3, mk() { const s = pick([300, 350, 400]); return { t: `faster than ${s} kt`, f: a => a.spd > s }; } },
    { l: 3, mk() { const ty = pick(['JET', 'PROP']); return { t: `a ${ty}`, f: a => a.type === ty }; } },
    { l: 4, mk() { const p = pick(['QFA', 'VOZ', 'JST']); return { t: `callsign starts ${p}`, f: a => a.cs.startsWith(p) }; } },
    { l: 7, mk() { return { t: 'an odd level (e.g. FL330)', f: a => (a.fl / 10) % 2 === 1 }; } }
  ];
  function makeRules(L) {
    const n = L <= 2 ? 1 : L <= 5 ? 2 : L <= 8 ? 3 : 4;
    const andP = L <= 4 ? 0 : L <= 6 ? 0.35 : 0.6;
    const pool = CONDS.filter(c => c.l <= L);
    const rules = [];
    for (let i = 0; i < n; i++) {
      const c1 = pick(pool).mk(); let conds = [c1];
      if (Math.random() < andP) { let c2; do { c2 = pick(pool).mk(); } while (c2.t === c1.t); conds.push(c2); }
      rules.push({ conds, code: 'ABCD'[i] });
    }
    return { rules, def: 'ABCDE'[n] };
  }
  const evalR = (R, a) => { for (const r of R.rules) if (r.conds.every(c => c.f(a))) return r.code; return R.def; };
  function randAc() {
    const type = Math.random() < 0.7 ? 'JET' : 'PROP';
    return { cs: pick(['QFA', 'VOZ', 'JST', 'RXA', 'ANZ', 'QLK']) + rnd(1, 999), fl: (type === 'JET' ? rnd(12, 41) : rnd(5, 25)) * 10, hdg: rnd(1, 72) * 5, spd: type === 'JET' ? rnd(28, 49) * 10 : rnd(15, 30) * 10, type };
  }
  function rules(L, st) {
    st.n = (st.n || 0) + 1;
    let fresh = false;
    if (!st.R || (L >= 9 && st.n % 8 === 1 && st.n > 1)) { st.R = makeRules(L); fresh = st.n > 1; }
    const R = st.R, codes = [...R.rules.map(r => r.code), R.def];
    const want = pick(codes); let a, g = 0;
    do { a = randAc(); } while (evalR(R, a) !== want && g++ < 80);
    const ans = evalR(R, a);
    const card = `<div class="rulecard">${fresh ? '<b>🔄 New rules!</b><br>' : ''}<b>First rule that matches wins:</b><ol>${R.rules.map(r => `<li>If ${r.conds.map(c => c.t).join(' <b>and</b> ')} → <b>${r.code}</b></li>`).join('')}</ol><span class="def">Otherwise → <b>${R.def}</b></span></div>`;
    const item = `<div class="strip mono" style="font-size:15px"><b>${a.cs}</b> ${a.type} FL${pad3(a.fl)} H${pad3(a.hdg)} ${a.spd}kt</div>`;
    const firing = R.rules.findIndex(r => r.conds.every(c => c.f(a)));
    return { kind: 'Rule follower', pre: card + item, q: '', type: 'choice', cols: codes.length === 3 ? 3 : 2, choices: codes, ans: codes.indexOf(ans), okDelay: 300,
      tip: firing >= 0 ? `Rule ${firing + 1} is the first that matches.` : 'None of the rules matched, so it\'s the "otherwise" code.', review: `${a.cs} ${a.type} FL${pad3(a.fl)} H${pad3(a.hdg)} ${a.spd}kt` };
  }
  A.drill({
    id: 'rules', area: 'coded', name: 'Rule follower', icon: '📜', desc: 'Classify each aircraft with a rule card, checking rules in order. More rules and AND-conditions as you level up; from level 9 the rules change mid-round.',
    target: L => [0, 24, 22, 20, 18, 16, 15, 14, 13, 12, 11][L], gen: rules,
    tips: ['Check rules strictly top to bottom: the first match wins, even if a later one also fits.', 'For AND rules, test the condition most likely to fail first.']
  });

  // ---------- Symbol operations ----------
  function makeOps(L) {
    const pool = [
      () => { const k = rnd(2, 9); return { t: `+${k}`, f: v => v + k }; },
      () => { const k = rnd(2, 9); return { t: `−${k}`, f: v => v - k }; },
      () => { const k = rnd(2, 4); return { t: `×${k}`, f: v => v * k }; }
    ];
    if (L >= 5) pool.push(() => ({ t: '÷2', f: v => v % 2 === 0 ? v / 2 : NaN }));
    if (L >= 8) pool.push(() => ({ t: 'squared', f: v => v <= 31 ? v * v : NaN }));
    if (L >= 9) pool.push(() => ({ t: 'digits reversed', f: v => +String(v).split('').reverse().join('') }));
    const syms = sample(['▲', '●', '■', '◆', '★', '☾'], Math.min(pool.length + 1, 5)), key = {};
    const ts = new Set();
    syms.forEach((s, i) => { let o; let g = 0; do { o = pool[i < pool.length ? i : rnd(0, pool.length - 1)](); } while (ts.has(o.t) && g++ < 20); ts.add(o.t); key[s] = o; });
    return key;
  }
  function opcodes(L, st) {
    if (!st.key || L >= 7) st.key = makeOps(L);
    const key = st.key, syms = Object.keys(key), n = [0, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5][L];
    for (let g = 0; g < 300; g++) {
      const start = rnd(2, 20), seq = Array.from({ length: n }, () => pick(syms));
      let v = start, ok = true, trail = [start];
      for (const s of seq) { v = key[s].f(v); if (!Number.isInteger(v) || v < 0 || v > 9999) { ok = false; break; } trail.push(v); }
      if (!ok) continue;
      const kh = `<div class="keytbl">${syms.map(s => `<span><b>${s}</b> ${key[s].t}</span>`).join('')}</div>`;
      return { kind: 'Symbol operations', pre: kh, q: `${start} ${seq.join(' ')}`, unit: 'work left to right', ans: v, tip: `${trail.join(' → ')}`, review: `${start} ${seq.join(' ')} (${syms.map(s => s + key[s].t).join(', ')})` };
    }
    st.key = null; return opcodes(L, st);
  }
  A.drill({
    id: 'opcodes', area: 'coded', name: 'Symbol operations', icon: '🔣', desc: 'Each symbol is an operation. Apply them left to right. From level 7 the meanings change every question.',
    target: L => [0, 16, 15, 14, 13, 12, 11, 10, 9, 8, 8][L], gen: opcodes,
    tips: ['Keep a running total and say it after each symbol.', 'Re-read the key whenever it changes, before you start.']
  });

  // ---------- Code breaker ----------
  const sh = (c, k) => ABC[((ABC.indexOf(c) + k) % 26 + 26) % 26];
  const T = {
    shift: k => ({ f: w => w.split('').map(c => sh(c, k)).join(''), t: `each letter moves ${Math.abs(k)} ${k > 0 ? 'forward' : 'back'}` }),
    rev: k => ({ f: w => w.split('').reverse().map(c => sh(c, k)).join(''), t: `reverse the word${k ? `, then move each letter ${Math.abs(k)} ${k > 0 ? 'forward' : 'back'}` : ''}` }),
    alt: () => ({ f: w => w.split('').map((c, i) => sh(c, i % 2 ? -1 : 1)).join(''), t: 'letters alternately move +1, −1' }),
    pos: () => ({ f: w => w.split('').map((c, i) => sh(c, i + 1)).join(''), t: '1st letter +1, 2nd +2, 3rd +3…' }),
    swap: () => ({ f: w => w.split('').map((c, i, a) => i % 2 === 0 ? (a[i + 1] || c) : a[i - 1]).join(''), t: 'swap each pair of letters' }),
    num: () => ({ f: w => w.split('').map(c => ABC.indexOf(c) + 1).join('-'), t: 'A=1, B=2, C=3…' })
  };
  function lseries(L) {
    const start = rnd(0, 10);
    let idx = [start], rule;
    if (L <= 4) { const k = rnd(2, 4); for (let i = 1; i < 6; i++) idx.push(idx[i - 1] + k); rule = `+${k} letters each time`; }
    else if (L <= 7) { for (let i = 1; i < 6; i++) idx.push(idx[i - 1] + i); rule = 'gap grows: +1, +2, +3…'; }
    else { const a = rnd(2, 4), b = rnd(1, 2); for (let i = 1; i < 6; i++) idx.push(idx[i - 1] + (i % 2 ? a : -b)); rule = `alternately +${a} and −${b}`; }
    idx = idx.map(i => ((i % 26) + 26) % 26);
    const ans = ABC[idx[5]], opts = shuffle([...new Set([ans, ABC[(idx[5] + 1) % 26], ABC[(idx[5] + 25) % 26], ABC[(idx[5] + 2) % 26]])]);
    return { kind: 'Letter series', q: idx.slice(0, 5).map(i => ABC[i]).join(', ') + ', ?', size: 'small', type: 'choice', choices: opts, ans: opts.indexOf(ans), tip: `Rule: ${rule}. Wrap from Z back to A.` };
  }
  function breaker(L) {
    if (L >= 2 && Math.random() < 0.25) return lseries(L);
    const pool = L <= 1 ? [T.shift(1)] : L <= 2 ? [T.shift(pick([1, 2, -1]))] : L <= 4 ? [T.shift(pick([1, 2, 3, -1, -2])), T.num()] :
      L <= 6 ? [T.shift(pick([2, 3, -2, -3])), T.rev(pick([0, 1])), T.num()] : L <= 8 ? [T.rev(pick([1, -1, 2])), T.alt(), T.swap(), T.shift(pick([3, 4, -3]))] : [T.pos(), T.alt(), T.rev(pick([1, 2, -1])), T.swap()];
    const tr = pick(pool);
    const [w1, w2] = sample(WORDS.filter(w => w.length >= 4 && w.length <= (L <= 4 ? 5 : 7)), 2);
    const right = tr.f(w2);
    const alts = [T.shift(1), T.shift(-1), T.shift(2), T.rev(0), T.rev(1), T.alt(), T.pos(), T.swap()].map(t => t.f(w2));
    if (right.includes('-')) { alts.push(w2.split('').map(c => ABC.indexOf(c)).join('-'), w2.split('').map(c => ABC.indexOf(c) + 2).join('-'), w2.split('').reverse().map(c => ABC.indexOf(c) + 1).join('-')); }
    const opts = new Set([right]); for (const a of shuffle(alts)) { if (opts.size >= 4) break; if (a !== right && (a.includes('-') === right.includes('-'))) opts.add(a); }
    const ch = shuffle([...opts]);
    return { kind: 'Code breaker', q: `${w1} → <span class="mono" style="color:var(--sky)">${tr.f(w1)}</span>`, size: 'small', unit: `So what is ${w2}?`, type: 'choice', cols: 1,
      choices: ch.map(c => `<span class="mono">${c}</span>`), ans: ch.indexOf(right), tip: `Rule: ${tr.t}.`, review: `${w1} → ${tr.f(w1)}; ${w2} → ?` };
  }
  A.drill({
    id: 'breaker', area: 'coded', name: 'Code breaker', icon: '🕵️', desc: 'Work out how a word was coded, then apply the same code to another word. Includes letter series.',
    target: L => [0, 14, 13, 12, 11, 10, 9, 8, 8, 7, 7][L], gen: breaker,
    tips: ['Compare the first letter of the word and its code: how far did it move?', 'If the code looks like the word backwards, it probably is.', 'Know your alphabet positions: E=5, J=10, O=15, T=20.']
  });
})(window.ATC);
