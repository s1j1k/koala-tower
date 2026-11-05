/* Drill runner: timed / trial Q&A engine, custom-drill context, results screen, multi-leg sessions. */
(function (A) {
  'use strict';
  const u = A.u, $ = u.$;
  let R = null;      // current run
  A.home = 'world';  // where to go back to

  function later(fn, ms) { const run = R; const t = setTimeout(() => { if (R === run && !run.done) fn(); }, ms); if (run) run.tm.push(t); return t; }
  function stopRun() {
    if (!R) return;
    R.done = true; R.tm.forEach(clearTimeout); clearInterval(R.iv);
    R.cleanup.forEach(f => { try { f(); } catch (e) { console.error(e); } });
    R.cleanup = [];
  }

  A.play = (id, L, opts = {}) => {
    const def = A.drills[id]; if (!def) return;
    stopRun(); A.closeSheet();
    if (A.cur === 'world' || A.cur === 'book') A.home = A.cur;
    L = u.clamp(L || 1, 1, A.MAXL);
    R = { def, L, opts, st: {}, correct: 0, attempts: 0, combo: 0, maxCombo: 0, misses: [], times: [], qn: 0, done: false, tm: [], cleanup: [] };
    $('pName').textContent = `${def.icon} ${def.name}`;
    $('pLevel').textContent = `Level ${L}` + (opts.queue ? ` · ${opts.queue.name} ${opts.queue.i + 1}/${opts.queue.list.length}` : '');
    $('pScore').textContent = '0'; $('pCombo').textContent = '';
    $('pBar').style.width = '100%'; $('pBar').classList.remove('low'); $('pTime').textContent = '';
    $('pStage').innerHTML = '';
    A.show('play');
    if (def.kind === 'custom') runCustom(); else startQA();
  };

  $('pQuit').addEventListener('click', () => {
    const q = R && R.opts.queue;
    stopRun(); R = null;
    if (document.activeElement) document.activeElement.blur();
    A.show(A.home);
    if (q) A.toast('Session stopped');
  });

  // ================= Q&A engine =================
  function startQA() {
    const s = A.prog.data.settings, def = R.def, o = R.opts;
    R.timed = !def.trials;
    if (R.timed) {
      R.len = o.len || def.len || s.len;
      R.endAt = performance.now() + R.len * 1000;
      R.iv = setInterval(tick, 100); tick();
    } else { R.trials = o.trials || def.trials; }
    nextQ();
  }

  function tick() {
    if (!R || R.done) return;
    const left = Math.max(0, R.endAt - performance.now()), s = Math.ceil(left / 1000);
    $('pTime').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    $('pBar').style.width = (left / (R.len * 1000) * 100) + '%';
    $('pBar').classList.toggle('low', left < 10000);
    if (left <= 0) endQA();
  }

  function updTrials() {
    $('pTime').textContent = `Question ${Math.min(R.qn, R.trials)} of ${R.trials}`;
    $('pBar').style.width = ((R.qn - 1) / R.trials * 100) + '%';
  }

  function nextQ() {
    if (!R || R.done) return;
    if (!R.timed && R.qn >= R.trials) { $('pBar').style.width = '100%'; return endQA(); }
    R.qn++; R.locked = false; R.next = null;
    const q = R.def.gen(R.L, R.st);
    q.type = q.type || 'num';
    R.q = q;
    if (!R.timed) updTrials();
    if (q.study) study(q, () => renderQ(q)); else renderQ(q);
  }

  function study(q, done) {
    const s = q.study, stage = $('pStage');
    if (s.frames) {
      stage.innerHTML = `<div class="card"><div class="study">${s.label || 'WATCH CLOSELY'}</div><div class="frame" id="sFrame"></div><div class="unit">${s.note || ''}</div></div>`;
      let i = 0; const f = $('sFrame');
      const step = () => {
        if (i >= s.frames.length) { f.innerHTML = ''; later(done, 250); return; }
        f.innerHTML = s.frames[i++];
        later(() => { f.innerHTML = ''; later(step, s.gap === undefined ? 200 : s.gap); }, s.ms);
      };
      later(step, 500);
    } else {
      stage.innerHTML = `<div class="card"><div class="study">${s.label || 'MEMORISE'}</div><div class="sbar"><i id="sBar"></i></div>
        <div class="studyBody">${s.html}</div><button class="btn ghost small" id="sReady">I'm ready ▶</button></div>`;
      const bar = $('sBar');
      bar.style.transition = `width ${s.ms}ms linear`;
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = '0%'; }));
      let fired = false; const go = () => { if (fired) return; fired = true; done(); };
      later(go, s.ms); $('sReady').onclick = go;
    }
  }

  function renderQ(q) {
    if (!R || R.done) return;
    R.qStart = performance.now();
    $('pStage').innerHTML = `<div class="card" id="qCard">
      ${q.kind ? `<div class="kind">${q.kind}</div>` : ''}${q.pre || ''}
      ${q.q ? `<div class="q ${q.size || ''}">${q.q}</div>` : ''}
      ${q.vis ? `<div class="vis">${q.vis}</div>` : ''}
      <div class="unit">${q.unit || ''}</div><div id="qAns"></div><div class="fb" id="qFb"></div></div><div id="qAct"></div>`;
    const box = $('qAns'), act = $('qAct');
    if (q.type === 'num' || q.type === 'hdg' || q.type === 'text') {
      const im = q.type === 'text' && !q.numeric ? 'text' : (q.numeric ? 'numeric' : 'decimal');
      box.innerHTML = `<form id="qForm" autocomplete="off"><input id="qIn" inputmode="${im}" enterkeyhint="go" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="${q.ph || 'Answer'}"></form>`;
      act.innerHTML = `<div class="row"><button class="btn ghost" id="qSkip">Skip</button><button class="btn" id="qGo">Check</button></div>`;
      const inp = $('qIn');
      $('qForm').onsubmit = e => { e.preventDefault(); if (R.locked) { if (R.next) R.next(); return; } submit(inp.value, false); };
      $('qGo').onclick = () => { if (R.locked) { if (R.next) R.next(); return; } submit(inp.value, false); };
      $('qSkip').onclick = () => submit('', true);
      inp.addEventListener('input', () => { if (R.locked || q.noAuto || q.tol) return; if (check(inp.value)) submit(inp.value, false); });
      setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); } }, 20);
    } else if (q.type === 'choice') {
      let html, cls = q.layout || (q.cols === 1 ? 'one' : q.cols === 3 ? 'three' : '');
      if (q.layout === 'compass') {
        const pos = [1, 2, 5, 8, 7, 6, 3, 0], cells = Array(9).fill(null);
        q.choices.forEach((c, i) => { cells[pos[i]] = i; });
        html = cells.map(ci => ci === null ? `<div class="ch ctr">${q.center || ''}</div>` : `<button class="ch" data-i="${ci}">${q.choices[ci]}</button>`).join('');
      } else html = q.choices.map((c, i) => `<button class="ch ${q.pic ? 'pic' : ''}" data-i="${i}">${c}</button>`).join('');
      box.innerHTML = `<div class="choices ${cls}">${html}</div>`;
      box.querySelectorAll('.ch[data-i]').forEach(b => { b.onclick = () => submit(+b.dataset.i, false); });
    } else if (q.type === 'tap') {
      R.sel = new Set();
      $('qCard').querySelectorAll('[data-t]').forEach(b => {
        b.onclick = () => { if (R.locked) return; const i = +b.dataset.t; if (R.sel.has(i)) R.sel.delete(i); else R.sel.add(i); b.classList.toggle('sel'); A.sfx('tick'); };
      });
      act.innerHTML = `<div class="row"><button class="btn ghost" id="qSkip">Skip</button><button class="btn" id="qGo">Done ✓</button></div>`;
      $('qGo').onclick = () => { if (R.locked) { if (R.next) R.next(); return; } submit(null, false); };
      $('qSkip').onclick = () => submit(null, true);
    }
  }

  function check(raw) {
    const q = R.q;
    if (q.type === 'text') {
      const n = s => String(s).toUpperCase().replace(/[\s,.-]/g, '');
      return [q.ans, ...(q.alts || [])].some(a => n(a) === n(raw));
    }
    const v = parseFloat(String(raw).replace(/,/g, '').trim());
    if (isNaN(v)) return false;
    if (q.type === 'hdg') return Math.abs(u.angDiff(v, q.ans)) <= (q.tolDeg || 0) + 0.01;
    if (!q.tol) return Math.abs(v - q.ans) < 0.011;
    return Math.abs(v - q.ans) <= Math.abs(q.ans) * q.tol + 1e-9;
  }

  function shownAns(q) {
    if (q.show !== undefined) return q.show;
    if (q.type === 'choice') return u.strip(q.choices[q.ans]);
    if (q.type === 'tap') return 'see the highlighted items';
    if (q.type === 'hdg') return u.hdg(q.ans) + '°';
    if (q.type === 'text') return q.ans;
    return q.tol ? '≈ ' + u.fmt(Math.round(q.ans)) : u.fmt(q.ans);
  }

  const praise = ['Nice!', 'Spot on!', 'Correct!', 'Ace!', 'Smooth!', 'Roger that!', 'Yes!'];

  function submit(given, skipped) {
    if (!R || R.locked || R.done) return;
    const q = R.q; let ok = false, you = '';
    if (q.type === 'choice') { ok = !skipped && given === q.ans; you = skipped ? 'skipped' : u.strip(q.choices[given]); }
    else if (q.type === 'tap') {
      const a = new Set(q.ans);
      ok = !skipped && R.sel.size === a.size && [...R.sel].every(i => a.has(i));
      you = skipped ? 'skipped' : `${R.sel.size} marked`;
    } else {
      if (!skipped && String(given).trim() === '') return;
      ok = !skipped && check(given); you = skipped ? 'skipped' : String(given);
    }
    R.attempts++; R.locked = true;
    const card = $('qCard'), fb = $('qFb'), inp = $('qIn');
    // mark visuals
    if (q.type === 'choice') {
      card.querySelectorAll('.ch[data-i]').forEach(b => {
        const i = +b.dataset.i;
        if (i === q.ans) b.classList.add('ok'); else if (i === given) b.classList.add('no');
      });
    } else if (q.type === 'tap') {
      const a = new Set(q.ans);
      card.querySelectorAll('[data-t]').forEach(b => {
        const i = +b.dataset.t, s = R.sel.has(i);
        b.classList.remove('sel');
        if (s && a.has(i)) b.classList.add('ok'); else if (s) b.classList.add('no'); else if (a.has(i)) b.classList.add('miss');
      });
    } else if (inp) inp.className = ok ? 'ok' : 'no';

    if (ok) {
      R.correct++; R.combo++; R.maxCombo = Math.max(R.maxCombo, R.combo);
      R.times.push((performance.now() - R.qStart) / 1000);
      A.sfx('ok'); card.classList.add('flash-ok');
      $('pScore').textContent = R.correct;
      $('pCombo').textContent = R.combo >= 3 ? `🔥 ${R.combo} streak` : '';
      fb.innerHTML = `<span class="good">✓ ${q.tol ? 'Close enough. Exact: ' + u.fmt(Math.round(q.ans * 10) / 10) : u.pick(praise)}</span>`;
      later(nextQ, q.okDelay || (q.tol ? 750 : q.type === 'num' || q.type === 'hdg' || q.type === 'text' ? 280 : 500));
    } else {
      R.combo = 0; $('pCombo').textContent = '';
      A.sfx('bad'); card.classList.add('flash-no');
      const ans = shownAns(q);
      R.misses.push({ q: q.review || u.strip(q.q || q.kind || ''), you, ans, tip: q.tip || '' });
      fb.innerHTML = `<span class="bad">${skipped ? 'Skipped' : '✗ Not quite'} · answer: ${u.esc(ans)}</span>${q.tip ? `<br><span class="tip">💡 ${q.tip}</span>` : ''}`;
      R.next = () => { R.next = null; nextQ(); };
      $('qAct').innerHTML = '<button class="btn" id="qNext">Next ▶</button>';
      $('qNext').onclick = () => R.next && R.next();
      if (R.timed) later(() => R.next && R.next(), (q.tip || '').length > 70 ? 4200 : 3000);
    }
  }

  document.addEventListener('keydown', e => {
    if (A.cur !== 'play' || !R || R.done || !R.q || R.def.kind === 'custom') return;
    if (e.target && e.target.tagName === 'INPUT') return;
    if (R.locked && (e.key === 'Enter' || e.key === ' ') && R.next) { e.preventDefault(); R.next(); return; }
    if (!R.locked && R.q.type === 'choice' && /^[1-9]$/.test(e.key)) {
      const i = +e.key - 1; if (i < R.q.choices.length) submit(i, false);
    }
    if (!R.locked && R.q.type === 'tap' && e.key === 'Enter') submit(null, false);
  });

  function endQA() {
    if (!R || R.done) return;
    R.done = true; clearInterval(R.iv); R.tm.forEach(clearTimeout);
    const def = R.def, L = R.L, acc = R.attempts ? R.correct / R.attempts : 0, lines = [];
    let stars;
    if (R.timed) {
      const t = Math.max(2, Math.round(def.target(L) * R.len / 90)), floor = def.accFloor || 0.6;
      const t1 = Math.ceil(t * 0.4), t2 = Math.ceil(t * 0.7);
      stars = acc < floor ? 0 : R.correct >= t ? 3 : R.correct >= t2 ? 2 : R.correct >= t1 ? 1 : 0;
      if (R.attempts && acc < floor) lines.push(`Accuracy under ${Math.round(floor * 100)}% earns no stars. Slow down a touch: in ATC, accuracy beats speed.`);
      lines.push(`Star targets (${R.len}s): ★ ${t1} · ★★ ${t2} · ★★★ ${t} correct`);
    } else {
      const pct = R.correct / R.trials;
      stars = pct >= 0.9 ? 3 : pct >= 0.75 ? 2 : pct >= 0.5 ? 1 : 0;
      lines.push('Star targets: ★ 50% · ★★ 75% · ★★★ 90% correct');
    }
    const avg = R.times.length ? R.times.reduce((a, b) => a + b, 0) / R.times.length : 0;
    if (R.maxCombo >= 5) lines.unshift(`🔥 Best streak: ${R.maxCombo} in a row`);
    finish({
      stars, score: R.correct, points: R.correct, acc, misses: R.misses, lines,
      stats: [[R.correct + (R.timed ? '' : '/' + R.trials), 'correct'], [Math.round(acc * 100) + '%', 'accuracy'], [avg ? avg.toFixed(1) + 's' : '–', 'per correct']]
    });
  }

  // ================= custom drills =================
  function runCustom() {
    const run = R;
    const ctx = {
      L: run.L, stage: $('pStage'), opts: run.opts, settings: A.prog.data.settings,
      alive: () => R === run && !run.done,
      score: (n, sub) => { $('pScore').textContent = n; $('pCombo').textContent = sub || ''; },
      info: t => { $('pTime').textContent = t; },
      bar: (frac, low) => { $('pBar').style.width = u.clamp(frac, 0, 1) * 100 + '%'; $('pBar').classList.toggle('low', !!low); },
      later,
      every: (fn, ms) => { const i = setInterval(() => { if (ctx.alive()) fn(); }, ms); run.cleanup.push(() => clearInterval(i)); return i; },
      loop: fn => { // requestAnimationFrame loop with dt (s)
        let last = performance.now(), id = 0;
        const f = now => { if (!ctx.alive()) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; fn(dt, now); id = requestAnimationFrame(f); };
        id = requestAnimationFrame(f); run.cleanup.push(() => cancelAnimationFrame(id));
      },
      countdown: (sec, onEnd) => {
        const end = performance.now() + sec * 1000;
        const i = ctx.every(() => {
          const left = Math.max(0, end - performance.now()), s = Math.ceil(left / 1000);
          ctx.info(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`); ctx.bar(left / (sec * 1000), left < 10000);
          if (left <= 0) { clearInterval(i); onEnd(); }
        }, 100);
        return { left: () => Math.max(0, end - performance.now()) / 1000 };
      },
      onEnd: fn => run.cleanup.push(fn),
      finish: res => { if (!ctx.alive()) return; stopRun(); finish(res); }
    };
    run.def.run(ctx);
  }

  // ================= results =================
  function finish(res) {
    const run = R, def = run.def, L = run.L;
    if (document.activeElement) document.activeElement.blur();
    const rec = A.prog.record(def.id, L, res);
    if (res.stars > 0) A.sfx('star');
    if (res.stars === 3) A.confetti(50);
    const q = run.opts.queue;
    if (q) q.results.push({ id: def.id, L, stars: res.stars, score: res.score, acc: res.acc });
    showResults(run, res, rec);
  }

  const titles = ['Keep practising! 🐨', 'Nice flying! ✈️', 'Great work! 🌟', 'Ace controller! 🏆'];

  function showResults(run, res, rec) {
    const def = run.def, L = run.L, q = run.opts.queue;
    const unlocked = A.prog.unlocked(def.id);
    let btns = '';
    if (q) {
      btns = q.i + 1 < q.list.length
        ? `<button class="btn" id="rCont">Continue ▶ ${q.i + 2}/${q.list.length}</button><button class="btn ghost" id="rStop">Stop session</button>`
        : `<button class="btn" id="rDone">Finish ${u.esc(q.name)} 🏁</button>`;
    } else {
      if (L < A.MAXL && unlocked > L) btns += `<button class="btn" id="rNext">Level ${L + 1} ▶</button>`;
      btns += `<div class="row"><button class="btn ghost" id="rAgain">↻ Again</button><button class="btn ghost" id="rHome">${A.home === 'book' ? '📖 Logbook' : '🗺️ Map'}</button></div>`;
    }
    const stars = [0, 1, 2].map(i => `<span class="${i < res.stars ? '' : 'off'}">⭐</span>`).join('');
    const best = res.stars > rec.prevStars && rec.prevStars > 0 ? ` · New best: ${res.stars}★` : '';
    const misses = (res.misses || []).slice(0, 25);
    $('resBody').innerHTML = `
      <div class="res-stars">${stars}</div>
      <div class="res-title">${titles[res.stars]}</div>
      <p class="sub" style="text-align:center">${def.icon} ${u.esc(def.name)} · Level ${L}</p>
      <div class="stats">${(res.stats || []).map(s => `<div class="stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div>
      <div class="note good">✨ +${rec.xp} XP${rec.unlockedNew ? ` · 🔓 Level ${L + 1} unlocked!` : ''}${best}</div>
      ${(res.lines || []).map(l => `<div class="note">${l}</div>`).join('')}
      ${btns}
      ${misses.length ? `<h2>Review</h2><div class="miss">${misses.map(m => `<div><b>${u.esc(m.q)}</b><br>You: ${u.esc(m.you)} · Answer: <b>${u.esc(m.ans)}</b>${m.tip ? `<br><span class="tip">💡 ${m.tip}</span>` : ''}</div>`).join('')}</div>` : ''}
      ${def.tips ? `<h2>Koala's tips 🐨</h2><div class="note howto"><ul>${def.tips.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}`;
    A.show('results');
    const on = (id, fn) => { const b = $(id); if (b) b.onclick = fn; };
    on('rNext', () => A.play(def.id, L + 1));
    on('rAgain', () => A.play(def.id, L));
    on('rHome', () => A.show(A.home));
    on('rCont', () => { q.i++; const leg = q.list[q.i]; A.play(leg.id, leg.L, { queue: q, len: leg.len, trials: leg.trials }); });
    on('rStop', () => A.show(A.home));
    on('rDone', () => { A.show(A.home); if (q.onDone) q.onDone(q); });
  }

  A._run = () => R; // for automated tests

  // Start a multi-leg session (daily flight, checkride)
  A.session = (name, list, onDone) => {
    if (!list.length) return;
    const q = { name, list, i: 0, results: [], onDone };
    A.play(list[0].id, list[0].L, { queue: q, len: list[0].len, trials: list[0].trials });
  };
})(window.ATC);
