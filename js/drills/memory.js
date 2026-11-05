/* Memory Mountains: digit span, flight strips, n-back, blip grid, relationships. */
(function (A) {
  'use strict';
  const { rnd, pick, shuffle, sample, pad3, callsigns } = A.u;

  // ---------- Digit span ----------
  function digits(L) {
    let [n, dir] = [null, [4, 'f'], [5, 'f'], [4, 'b'], [6, 'f'], [5, 'b'], [7, 'f'], [6, 'b'], [8, 'f'], [7, 'b'], [9, 'm']][L];
    if (dir === 'm') { dir = Math.random() < 0.5 ? 'f' : 'b'; if (dir === 'b') n = 8; }
    const ds = []; while (ds.length < n) { const d = rnd(0, 9); if (d !== ds[ds.length - 1]) ds.push(d); }
    const ans = (dir === 'f' ? ds : [...ds].reverse()).join('');
    const ms = L <= 3 ? 900 : L <= 6 ? 750 : 620;
    return {
      kind: dir === 'f' ? 'Digit span' : 'Digit span · backwards', study: { frames: ds.map(String), ms, label: dir === 'b' ? 'WATCH, THEN TYPE THEM BACKWARDS' : 'WATCH THE DIGITS' },
      q: dir === 'f' ? 'Type the digits in order' : 'Type them in REVERSE order', size: 'tiny', type: 'text', numeric: true, ans, show: ans, ph: `${n} digits`,
      tip: dir === 'b' ? 'Chunk into groups of 3, then reverse chunk by chunk.' : 'Chunk them in threes, like a phone number: 482-913.', review: ds.join(' ') + (dir === 'b' ? ' (backwards)' : '')
    };
  }
  A.drill({
    id: 'digits', area: 'memory', name: 'Digit span', icon: '🔟', desc: 'Digits flash one at a time. Type them back, and at some levels backwards. Spans grow from 4 to 9.',
    trials: 8, gen: digits, tips: ['Chunk digits into groups of 2–3 and say them in your head with a rhythm.', 'For backwards, hold the chunks, then reverse the last chunk first.']
  });

  // ---------- Flight strips ----------
  const DEST = ['SYD', 'MEL', 'BNE', 'PER', 'ADL', 'CNS', 'CBR', 'HBA', 'DRW', 'OOL', 'AKL', 'NAN'];
  function strips(L) {
    const n = [0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6][L];
    const fields = L <= 2 ? ['fl'] : L <= 4 ? ['fl', 'hdg'] : L <= 6 ? ['fl', 'hdg', 'spd'] : ['fl', 'hdg', 'spd', 'dest'];
    let cs = callsigns(n, L);
    if (L >= 8) { // confusable callsigns: same airline, shuffled digits
      const al = pick(A.u.airlines); const used = new Set();
      cs = cs.map((c, i) => { if (i % 2) return c; let k; do { k = al + rnd(10, 99); } while (used.has(k)); used.add(k); return k; });
      if (cs.length > 1) { const d = cs[0].slice(3); const sw = al + d.split('').reverse().join(''); if (!cs.includes(sw) && d[0] !== d[1] && d[1] !== '0') cs[1] = sw; }
    }
    const fls = sample([...Array(37)].map((_, i) => 60 + i * 10), n);
    const ac = cs.map((c, i) => ({ c, fl: fls[i], hdg: L <= 5 ? rnd(1, 36) * 10 : rnd(1, 72) * 5, spd: rnd(25, 48) * 10, dest: pick(DEST) }));
    const show = a => `<div class="strip mono ${a.c.length % 2 ? 'alt' : ''}"><b>${a.c}</b>&nbsp; FL${pad3(a.fl)}${fields.includes('hdg') ? `&nbsp; H${pad3(a.hdg)}` : ''}${fields.includes('spd') ? `&nbsp; ${a.spd}kt` : ''}${fields.includes('dest') ? `&nbsp; →${a.dest}` : ''}</div>`;
    const ms = Math.round(n * (1600 + fields.length * 800) * (1 - 0.035 * (L - 1)));
    const t = pick(ac), f = pick(fields);
    let q;
    if (n >= 2 && Math.random() < 0.3) {
      const opts = shuffle(ac.map(a => a.c));
      q = { q: `Which aircraft was at FL${pad3(t.fl)}?`, type: 'choice', choices: opts, ans: opts.indexOf(t.c) };
    } else if (f === 'fl') q = { q: `${t.c}: flight level?`, ans: t.fl, ph: 'e.g. 350', show: pad3(t.fl) };
    else if (f === 'hdg') q = { q: `${t.c}: heading?`, ans: t.hdg, show: pad3(t.hdg) };
    else if (f === 'spd') q = { q: `${t.c}: speed (kt)?`, ans: t.spd };
    else { const opts = shuffle([...new Set([t.dest, ...shuffle(DEST)])].slice(0, 4)); const o2 = opts.includes(t.dest) ? opts : [t.dest, ...opts.slice(1)]; const fin = shuffle(o2); q = { q: `${t.c}: destination?`, type: 'choice', choices: fin, ans: fin.indexOf(t.dest) }; }
    return { kind: 'Flight strip recall', size: 'small', study: { html: ac.map(show).join(''), ms, label: `MEMORISE ${n} STRIP${n > 1 ? 'S' : ''}` }, noAuto: true, ...q,
      tip: 'Link each callsign to a picture: "QFA4 at FL350 = 4 kangaroos on a cloud".', review: ac.map(a => `${a.c} FL${pad3(a.fl)}${fields.includes('hdg') ? ' H' + pad3(a.hdg) : ''}${fields.includes('spd') ? ' ' + a.spd + 'kt' : ''}${fields.includes('dest') ? ' →' + a.dest : ''}`).join(' | ') };
  }
  A.drill({
    id: 'strips', area: 'memory', name: 'Flight strip recall', icon: '🎫', desc: 'Memorise flight strips (callsign, level, heading, speed, destination), then answer a question. More strips, less time, look-alike callsigns at the top levels.',
    trials: 8, gen: strips, tips: ['Read each strip once as a sentence: "Qantas 12, three-five-zero, heading two-seven-zero".', 'Group numbers into a story or picture.', 'From level 8 callsigns look alike (QFA21 vs QFA12): check digit order.']
  });

  // ---------- N-back (custom) ----------
  A.drill({
    id: 'nback', area: 'memory', name: 'N-back', icon: '🔁', kind: 'custom',
    desc: 'Letters appear one by one. Tap MATCH when the letter is the same as the one N steps back. N grows from 1 to 4.',
    tips: ['Keep a little rolling queue in your head and say it under your breath.', 'Don\'t tap if unsure: false alarms cost points.'],
    run(ctx) {
      const L = ctx.L, n = [0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4][L], iv = [0, 2600, 2100, 2800, 2400, 2000, 2900, 2500, 2100, 3000, 2600][L];
      const letters = sample('BCDFGHJKLMNPQRSTVXZ'.split(''), L >= 6 ? 6 : 8);
      const total = 20 + n, seq = [];
      for (let i = 0; i < total; i++) {
        if (i >= n && Math.random() < 0.32) seq.push(seq[i - n]);
        else { let c; do { c = pick(letters); } while (i >= n && c === seq[i - n]); seq.push(c); }
      }
      const targets = seq.filter((c, i) => i >= n && c === seq[i - n]).length;
      ctx.stage.innerHTML = `<div class="card"><div class="kind">${n}-back</div><div class="q tiny">Same as ${n === 1 ? 'the one before' : n + ' letters back'}?</div>
        <div class="nback-item" id="nbItem"></div><div class="unit" id="nbPos"></div><div class="fb" id="nbFb"></div></div>
        <button class="btn bigbtn" id="nbBtn">MATCH!</button><p class="sub" style="text-align:center">Space bar works too</p>`;
      const item = document.getElementById('nbItem'), fb = document.getElementById('nbFb'), pos = document.getElementById('nbPos');
      let i = -1, pressed = false, hits = 0, misses = 0, fa = 0;
      const isT = k => k >= n && seq[k] === seq[k - n];
      const press = () => {
        if (i < 0 || pressed || !ctx.alive()) return; pressed = true;
        if (isT(i)) { hits++; A.sfx('ok'); fb.innerHTML = '<span class="good">✓ Match!</span>'; }
        else { fa++; A.sfx('bad'); fb.innerHTML = '<span class="bad">✗ Not a match</span>'; }
        ctx.score(hits, fa ? `${fa} false alarm${fa > 1 ? 's' : ''}` : '');
      };
      document.getElementById('nbBtn').onclick = press;
      const key = e => { if (e.key === ' ' || e.key === 'm' || e.key === 'M') { e.preventDefault(); press(); } };
      document.addEventListener('keydown', key); ctx.onEnd(() => document.removeEventListener('keydown', key));
      const next = () => {
        if (i >= 0 && isT(i) && !pressed) { misses++; fb.innerHTML = `<span class="tip">Missed one: ${seq[i]} matched</span>`; }
        i++; pressed = false;
        if (i >= total) {
          const pct = Math.max(0, hits - fa) / Math.max(1, targets);
          const stars = pct >= 0.85 ? 3 : pct >= 0.65 ? 2 : pct >= 0.4 ? 1 : 0;
          const cr = total - n - targets - fa;
          return ctx.finish({ stars, score: Math.max(0, hits - fa), points: hits * 1.5, acc: (hits + cr) / Math.max(1, total - n),
            stats: [[`${hits}/${targets}`, 'matches caught'], [fa, 'false alarms'], [Math.round(pct * 100) + '%', 'score']],
            lines: ['Score = (matches − false alarms) ÷ matches. ★ 40% · ★★ 65% · ★★★ 85%'] });
        }
        item.textContent = ''; ctx.later(() => { item.textContent = seq[i]; if (i % 4 === 0) fb.innerHTML = ''; }, 160);
        pos.textContent = `${i + 1} / ${total}`; ctx.bar(1 - i / total);
        ctx.later(next, iv);
      };
      ctx.score(0); ctx.info(`${n}-back · ${(iv / 1000).toFixed(1)}s per letter`);
      ctx.later(next, 700);
    }
  });

  // ---------- Blip grid (spatial memory) ----------
  function grid(L) {
    const [c, k] = [null, [3, 3], [3, 4], [4, 4], [4, 5], [4, 6], [5, 6], [5, 7], [5, 8], [6, 8], [6, 10]][L];
    const lit = sample(Array.from({ length: c * c }, (_, i) => i), k);
    const ms = Math.round(2600 - L * 100);
    const g = (fn) => `<div class="cells" style="grid-template-columns:repeat(${c},1fr);max-width:${c * 58}px">${Array.from({ length: c * c }, (_, i) => fn(i)).join('')}</div>`;
    return {
      kind: 'Radar blips', study: { html: g(i => `<div class="cell ${lit.includes(i) ? 'lit' : ''}"></div>`), ms, label: `REMEMBER ${k} BLIPS` },
      q: 'Tap where the blips were', size: 'tiny', type: 'tap', pre: '', vis: g(i => `<button class="cell" data-t="${i}"></button>`), ans: lit,
      tip: 'Group blips into shapes (a line, a triangle) rather than remembering single squares.', review: `${k} blips on a ${c}×${c} grid`
    };
  }
  A.drill({
    id: 'blips', area: 'memory', name: 'Blip grid', icon: '🟩', desc: 'Blips light up on a radar grid. Tap them back from memory. Grids and blip counts grow, time shrinks.',
    trials: 8, gen: grid, tips: ['See shapes, not squares: "an L in the top corner plus one in the middle".']
  });

  // ---------- Relationships ----------
  const GATES = ['Gate A', 'Gate B', 'Gate C', 'Gate D', 'Gate E', 'Gate F', 'Gate G'];
  const SECT = ['RIVER', 'OCEAN', 'DESERT', 'HILLS', 'BAY', 'CORAL'];
  const FREQ = ['118.1', '119.4', '121.7', '124.5', '126.2', '128.9', '132.3'];
  function relations(L) {
    if (L <= 5) {
      const n = [0, 3, 4, 4, 5, 6][L], cs = callsigns(n, L), gs = sample(GATES, n);
      const lines = cs.map((c, i) => `${c} → <b>${gs[i]}</b>`);
      const i = rnd(0, n - 1), rev = L >= 3 && Math.random() < 0.5;
      const opts = shuffle(rev ? cs : gs);
      return { kind: 'Remember the links', study: { html: `<div class="pair">${lines.join('<br>')}</div>`, ms: 1800 + n * (1700 - L * 120), label: 'MEMORISE THE LINKS' },
        q: rev ? `Which aircraft goes to ${gs[i]}?` : `Where does ${cs[i]} go?`, size: 'small', type: 'choice', choices: opts, ans: opts.indexOf(rev ? cs[i] : gs[i]),
        tip: 'Make a silly link: "QFA12 → C": 12 cats.', review: u2(lines) };
    }
    if (L <= 7 || (L >= 9 && Math.random() < 0.4)) {
      const na = L <= 6 ? 3 : 4, ns = 3, cs = callsigns(na, L), ss = sample(SECT, ns), fs = sample(FREQ, ns);
      const asg = cs.map(() => rnd(0, ns - 1));
      const l1 = cs.map((c, i) => `${c} → ${ss[asg[i]]}`), l2 = ss.map((s, i) => `${s} → <b>${fs[i]}</b>`);
      const i = rnd(0, na - 1), opts = shuffle(fs);
      return { kind: 'Linked facts', study: { html: `<div class="pair">${shuffle(l1).join('<br>')}</div><hr style="border-color:#2b4560"><div class="pair">${l2.join('<br>')}</div>`, ms: 9000 + na * 1800 - L * 350, label: 'AIRCRAFT → SECTOR → FREQUENCY' },
        q: `Which frequency will ${cs[i]} use?`, size: 'small', type: 'choice', choices: opts, ans: opts.indexOf(fs[asg[i]]),
        tip: `${cs[i]} is in ${ss[asg[i]]}, and ${ss[asg[i]]} uses ${fs[asg[i]]}. Chain the two links.`, review: u2([...l1, ...l2]) };
    }
    // order relations (transitive)
    const k = L <= 8 ? 4 : 5, order = callsigns(k, L); // order[0] = highest
    const st = shuffle(order.slice(0, -1).map((c, i) => Math.random() < 0.5 ? `${c} is above ${order[i + 1]}` : `${order[i + 1]} is below ${c}`));
    const t = rnd(0, 3);
    let q, ans, opts;
    if (t === 0) { q = 'Which aircraft is lowest?'; ans = order[k - 1]; opts = sample(order, k); }
    else if (t === 1) { q = 'Which aircraft is highest?'; ans = order[0]; opts = sample(order, k); }
    else if (t === 2) { const i = rnd(0, k - 2); q = `Which aircraft is directly below ${order[i]}?`; ans = order[i + 1]; opts = shuffle(order.filter((c, j) => j !== i)); }
    else { const [i, j] = sample(order.map((c, x) => x), 2); q = `Is ${order[i]} higher than ${order[j]}?`; ans = i < j ? 'Yes' : 'No'; opts = ['Yes', 'No']; }
    if (opts.length > 4) { opts = shuffle([ans, ...sample(opts.filter(o => o !== ans), 3)]); }
    return { kind: 'Who is where?', study: { html: `<div class="pair">${st.join('<br>')}</div>`, ms: 4500 + k * 1900 - L * 200, label: 'STACK THEM IN YOUR HEAD' },
      q, size: 'small', type: 'choice', choices: opts, ans: opts.indexOf(ans), tip: `Top to bottom: ${order.join(', ')}.`, review: st.join('; ') };
  }
  const u2 = lines => lines.map(A.u.strip).join('; ');
  A.drill({
    id: 'relations', area: 'memory', name: 'Remembering relationships', icon: '🔗', desc: 'Memorise links (aircraft → gate, sector → frequency, who is above whom), then answer. Later levels need two links chained or a mental stack.',
    trials: 8, gen: relations, tips: ['Build a picture or a story for each link.', 'For "above/below", build the stack one statement at a time, top to bottom.']
  });
})(window.ATC);
