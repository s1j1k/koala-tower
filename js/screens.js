/* Sheets and pages: region & drill pickers, HQ (daily flight, checkride), logbook, profile, settings, start-up. */
(function (A) {
  'use strict';
  const u = A.u, $ = u.$, P = A.prog;

  // ---------- rank pill ----------
  function updRank() {
    const r = P.rank();
    $('wRankIcon').textContent = r.icon; $('wRankName').textContent = r.name; $('wXp').textContent = `${u.fmt(P.data.xp)} XP`;
  }
  A.on('xp', updRank);

  // ---------- drill rows ----------
  function drillRow(d) {
    const L = P.playLevel(d.id), s = P.stars(d.id, L);
    return `<button class="drow" data-d="${d.id}"><span class="ic">${d.icon}</span><span class="nm"><b>${u.esc(d.name)}</b><small>${u.esc(d.desc)}</small></span>
      <span class="lv">${u.starsHtml(s)}<br>Lv ${L}/${A.MAXL}</span></button>`;
  }
  const wireRows = (el, back, onClose) => el.querySelectorAll('[data-d]').forEach(b => { b.onclick = () => openDrill(b.dataset.d, back, onClose); });
  const wireX = el => el.querySelectorAll('[data-x]').forEach(b => { b.onclick = A.closeSheet; });

  // ---------- region sheet ----------
  A.openRegion = (id, onClose) => {
    if (id === 'hq') return openHQ(onClose);
    const a = A.area(id), st = P.areaStats(id);
    const el = A.sheet(`<div class="shead"><span class="big">${a.icon}</span><h1>${a.name}</h1><button class="iconbtn" data-x aria-label="Close">✕</button></div>
      <div class="real">🎯 <b>In the real test:</b> ${a.real}</div>
      <div class="prog"><i style="width:${st.stars / st.max * 100}%"></i></div><small>${st.stars} / ${st.max} stars in this area</small>
      ${A.drillsIn(id).map(drillRow).join('')}`, onClose);
    wireX(el); wireRows(el, () => A.openRegion(id, onClose), onClose);
  };

  // ---------- drill sheet ----------
  function openDrill(id, back, onClose) {
    const d = A.drills[id], un = P.unlocked(id);
    let L = P.playLevel(id);
    const render = () => {
      const timed = d.kind !== 'custom' && !d.trials, len = P.data.settings.len;
      const goal = d.kind === 'custom' ? 'Live task · stars for score, accuracy and safety' : timed ? `${len}s round · ★★★ at ${Math.max(2, Math.round(d.target(L) * len / 90))} correct` : `${d.trials} questions · ★★★ at 90% correct`;
      const el = A.sheet(`<div class="shead"><span class="big">${d.icon}</span><h1>${u.esc(d.name)}</h1><button class="iconbtn" data-x aria-label="Close">✕</button></div>
        <p class="sub">${u.esc(d.desc)}</p>
        <div class="lvgrid">${u.range(A.MAXL).map(i => { const l = i + 1, lock = l > un; return `<button class="lvb ${l === L ? 'on' : ''} ${lock ? 'lock' : ''}" data-l="${l}"><b>${lock ? '🔒' : l}</b>${u.starsHtml(P.stars(id, l))}</button>`; }).join('')}</div>
        <div class="note">Level ${L}: ${goal}</div>
        <button class="btn" id="dPlay">▶ Play level ${L}</button>
        ${back ? '<button class="btn ghost" id="dBack">← Back</button>' : ''}
        ${d.tips ? `<h2>How to ace it 🐨</h2><div class="note howto"><ul>${d.tips.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}`, onClose);
      wireX(el);
      el.querySelectorAll('[data-l]').forEach(b => {
        b.onclick = () => { const l = +b.dataset.l; if (l > un) { A.toast(`Earn a ★ on level ${un} to unlock`); return; } L = l; render(); };
      });
      $('dPlay').onclick = () => A.play(id, L);
      if (back) $('dBack').onclick = back;
    };
    render();
  }
  A.openDrill = openDrill;

  // ---------- HQ: daily flight & checkride ----------
  let ckLevel = 6;
  function openHQ(onClose) {
    const done = P.data.dailyDone === u.today(), s = P.data.streak;
    const el = A.sheet(`<div class="shead"><span class="big">🐨</span><h1>Koala Tower HQ</h1><button class="iconbtn" data-x aria-label="Close">✕</button></div>
      <p class="sub">G'day, ${P.rank().name}! 🔥 Streak: <b>${s.days || 0} day${s.days === 1 ? '' : 's'}</b> (best ${s.best || 0}).</p>
      <h2>☀️ Daily flight</h2>
      <div class="note">Five quick legs from your weakest areas, about 6–8 minutes. ${done ? '✅ Done today, but you can fly it again.' : 'Bonus +40 XP for finishing.'}</div>
      <button class="btn" id="hDaily">${done ? 'Fly it again' : 'Start daily flight'} ✈️</button>
      <h2>📝 Checkride (SureSelect-style mock test)</h2>
      <div class="note">A practice run in test order: Skill Simulations first (memory, rotation, relationships, radar), then the Cognitive Suite (detail accuracy, coded reasoning) plus number series. About 12–15 minutes.</div>
      <div class="chips" id="hLv">${[[3, 'Practice'], [6, 'Realistic'], [9, 'Tough']].map(([l, n]) => `<button class="chip ${l === ckLevel ? 'on' : ''}" data-l="${l}">${n} (Lv ${l})</button>`).join('')}</div>
      <button class="btn" id="hCheck">Start checkride 🎧</button>
      <div class="row"><button class="btn ghost" id="hBook">📖 Logbook</button><button class="btn ghost" id="hProf">👤 Profile</button></div>`, onClose);
    wireX(el);
    el.querySelectorAll('#hLv .chip').forEach(c => { c.onclick = () => { ckLevel = +c.dataset.l; el.querySelectorAll('#hLv .chip').forEach(x => x.classList.toggle('on', x === c)); }; });
    $('hDaily').onclick = startDaily;
    $('hCheck').onclick = () => startCheckride(ckLevel);
    $('hBook').onclick = () => { A.closeSheet(); A.show('book'); };
    $('hProf').onclick = () => { A.closeSheet(); A.show('profile'); };
  }
  const leg = (id, L) => ({ id, L, len: 60, trials: A.drills[id].trials ? 5 : undefined });
  function startDaily() {
    const areas = P.weakAreas().slice(0, 5);
    const list = u.shuffle(areas).map(a => { const d = P.weakDrill(a.id); return leg(d.id, P.playLevel(d.id)); });
    A.session('Daily flight', list, q => {
      const first = P.data.dailyDone !== u.today();
      P.data.dailyDone = u.today(); P.save();
      if (first) P.addXp(40);
      A.confetti(70); A.sfx('star');
      showSummary('☀️ Daily flight complete!', q, first ? '+40 XP bonus. See you tomorrow, controller!' : 'Extra practice logged.');
      if (A.world) A.world.pickTarget();
    });
  }
  function startCheckride(L) {
    const list = [
      { id: 'strips', L, trials: 6 }, { id: 'rotation', L, len: 60 }, { id: 'relations', L, trials: 6 }, { id: 'sector', L },
      { id: 'samediff', L, len: 60 }, { id: 'tables', L, trials: 4 }, { id: 'rules', L, len: 75 }, { id: 'codebook', L, len: 60 }, { id: 'series', L, len: 60 }
    ];
    A.session('Checkride', list, q => {
      const sims = q.results.slice(0, 4), cog = q.results.slice(4);
      const avg = a => a.length ? a.reduce((s, r) => s + r.stars, 0) / a.length : 0;
      const tot = avg(q.results);
      if (tot >= 2) A.confetti(80);
      P.addXp(Math.round(30 + tot * 20));
      showSummary(`📝 Checkride complete (Lv ${L})`, q, `Skill Simulations: ${avg(sims).toFixed(1)}★ average · Cognitive Suite: ${avg(cog).toFixed(1)}★ average. ${tot >= 2.5 ? 'Ready for a tougher checkride!' : tot >= 1.5 ? 'Solid. Drill your lowest legs, then go again.' : 'Keep at it: practise the low-star legs in the logbook.'}`);
    });
  }
  function showSummary(title, q, msg) {
    const el = A.sheet(`<div class="shead"><span class="big">🏁</span><h1>${title}</h1><button class="iconbtn" data-x aria-label="Close">✕</button></div>
      <div class="note good">${msg}</div>
      ${q.results.map(r => { const d = A.drills[r.id]; return `<button class="drow" data-d="${r.id}"><span class="ic">${d.icon}</span><span class="nm"><b>${u.esc(d.name)}</b><small>Level ${r.L} · ${Math.round((r.acc || 0) * 100)}% accuracy</small></span><span class="lv">${u.starsHtml(r.stars)}</span></button>`; }).join('')}
      <button class="btn" data-x>Back to flying ✈️</button>`, () => { if (A.cur === 'world' && A.world) A.world.start(); });
    wireX(el); wireRows(el, null, null);
  }

  // ---------- logbook ----------
  function renderBook() {
    const body = $('bookBody');
    body.innerHTML = `<p class="sub">Every lesson in one list. Tap one to pick a level. Each has ${A.MAXL} levels: earn a ★ to unlock the next.</p>
      <button class="drow" id="bHQ"><span class="ic">🐨</span><span class="nm"><b>Koala Tower HQ</b><small>Daily flight · Checkride (SureSelect-style mock test)</small></span><span class="lv">🔥 ${P.data.streak.days || 0}</span></button>
      ${A.areas.map(a => { const st = P.areaStats(a.id); return `<div class="areahead"><span class="ic">${a.icon}</span><b>${a.name}</b><small>${st.stars}/${st.max}★</small></div>
        <div class="prog"><i style="width:${st.stars / st.max * 100}%"></i></div>${A.drillsIn(a.id).map(drillRow).join('')}`; }).join('')}`;
    $('bHQ').onclick = () => openHQ();
    wireRows(body, null, null);
  }

  // ---------- profile ----------
  function renderProfile() {
    const r = P.rank(), d = P.data, plays = d.history.length;
    const name = id => (A.drills[id] || { name: id, icon: '•' });
    const areaRows = A.areas.map(a => { const st = P.areaStats(a.id); return `<div class="areahead"><span class="ic">${a.icon}</span><b>${a.name}</b><small>avg level ${st.avgLevel.toFixed(1)} · ${st.stars}★</small></div><div class="prog"><i style="width:${st.stars / st.max * 100}%"></i></div>`; }).join('');
    const weak = P.weakAreas()[0], strong = [...A.areas].sort((a, b) => P.areaStats(b.id).stars - P.areaStats(a.id).stars)[0];
    // last 14 days activity
    const days = u.range(14).map(i => { const t = new Date(); t.setDate(t.getDate() - 13 + i); t.setHours(0, 0, 0, 0); const t2 = t.getTime() + 864e5; return d.history.filter(h => h.t >= t.getTime() && h.t < t2).length; });
    const mx = Math.max(1, ...days);
    const chart = `<svg viewBox="0 0 280 70" width="100%" height="70" role="img" aria-label="Sessions per day, last 14 days">${days.map((n, i) => `<rect x="${i * 20 + 3}" y="${62 - n / mx * 52}" width="14" height="${Math.max(2, n / mx * 52)}" rx="3" fill="${n ? '#5ee0a8' : '#2b4560'}"/>`).join('')}<line x1="0" y1="63" x2="280" y2="63" stroke="#2b4560"/></svg>`;
    $('profBody').innerHTML = `
      <div class="note" style="text-align:center"><div style="font-size:46px">${r.icon}</div><b style="font-size:19px">${r.name}</b><br><small>${u.fmt(d.xp)} XP${r.next ? ` · ${u.fmt(r.next.xp - d.xp)} to ${r.next.name}` : ' · top rank!'}</small>
        <div class="prog"><i style="width:${r.pct * 100}%"></i></div></div>
      <div class="stats"><div class="stat"><b>🔥 ${d.streak.days || 0}</b><span>day streak</span></div><div class="stat"><b>${plays}</b><span>lessons flown</span></div><div class="stat"><b>💍 ${d.rings || 0}</b><span>rings</span></div></div>
      <h2>Last 14 days</h2>${chart}
      ${plays ? `<div class="note">💪 Strongest: ${strong.icon} ${strong.name}<br>🎯 Focus next: ${weak.icon} ${weak.name}</div>` : ''}
      <h2>Areas</h2>${areaRows}
      <h2>Recent flights</h2>
      <div class="note hist">${plays ? d.history.slice(0, 20).map(h => `<div><span>${name(h.id).icon} ${u.esc(name(h.id).name)} · Lv ${h.L}</span><span>${u.starsHtml(h.st)}</span></div>`).join('') : 'No flights yet. Go fly!'}</div>
      <h2>Ranks</h2><div class="note hist">${A.ranks.map(x => `<div><span>${x.icon} ${x.name}</span><span>${u.fmt(x.xp)} XP</span></div>`).join('')}</div>${tipHtml()}`;
  }

  // optional links (hidden when not set in js/config.js). External forms only: nothing typed is collected on this site.
  const okUrl = x => typeof x === 'string' && /^https:\/\/[^\s"'<>]+$/.test(x);
  const linkBtn = (url, label) => `<a class="btn ghost small" style="text-align:center;text-decoration:none" href="${u.esc(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  const tipHtml = () => {
    const c = A.config, parts = [];
    if (okUrl(c.feedbackUrl)) parts.push(linkBtn(c.feedbackUrl, '💬 Send feedback or report a bug'));
    if (okUrl(c.tipUrl)) parts.push(linkBtn(c.tipUrl, '☕ Enjoying it? Buy me a coffee') + '<p class="sub" style="text-align:center">Totally optional. The app stays free, with no ads and no accounts.</p>');
    return parts.join('');
  };

  // ---------- settings ----------
  let resetArm = false;
  function renderSettings() {
    const s = P.data.settings;
    const tog = (k, label, sub) => `<button class="toggle ${s[k] ? 'on' : ''}" data-k="${k}"><span><b>${label}</b><br><small>${sub}</small></span><i></i></button>`;
    $('setBody').innerHTML = `
      <h2>Timed round length</h2><div class="chips" id="sLen">${[60, 90, 120, 180].map(v => `<button class="chip ${s.len === v ? 'on' : ''}" data-v="${v}">${v < 120 ? v + 's' : v / 60 + ' min'}</button>`).join('')}</div>
      <p class="sub">Star targets scale with the length.</p>
      ${tog('sound', 'Sound effects', 'Little dings and buzzes')}
      ${tog('buzz', 'Vibration', 'Buzz on a wrong answer (Android)')}
      ${tog('aids', 'Radar helpers', 'Conflict warnings in Sector control (levels 1–6)')}
      ${tog('unlockAll', 'Unlock all levels', 'Jump straight to any level, any lesson')}
      <h2>Your data</h2><p class="sub">Progress is saved on this device only (localStorage). No account, no server.</p>
      <button class="btn ghost" id="sReset">${resetArm ? 'Tap again to erase everything' : 'Reset all progress'}</button>
      <h2>About</h2><p class="sub">Free practice for air traffic controller selection testing, built around the skill areas of the SureSelect battery used by Airservices Australia. Unofficial and independent: not affiliated with or endorsed by Airservices Australia or Airways. Every task is original and only resembles the style of the real tests. Good luck, future controller! 🐨</p>
      <p class="sub">Privacy: no accounts and no cookies. Your progress stays on this device. We count visits anonymously with Cloudflare Web Analytics. <a class="link" href="about.html">More about Koala Tower</a></p>${tipHtml()}`;
    $('sLen').querySelectorAll('.chip').forEach(c => { c.onclick = () => { s.len = +c.dataset.v; P.save(); renderSettings(); }; });
    $('setBody').querySelectorAll('.toggle').forEach(t => { t.onclick = () => { s[t.dataset.k] = !s[t.dataset.k]; P.save(); renderSettings(); if (t.dataset.k === 'sound' && s.sound) A.sfx('ok'); }; });
    $('sReset').onclick = () => {
      if (!resetArm) { resetArm = true; renderSettings(); setTimeout(() => { resetArm = false; if (A.cur === 'settings') renderSettings(); }, 4000); return; }
      resetArm = false; P.reset(); updRank(); A.toast('Progress reset'); renderSettings();
    };
  }

  A.on('screen', id => {
    if (id === 'book') renderBook();
    if (id === 'profile') renderProfile();
    if (id === 'settings') renderSettings();
    if (id === 'world') updRank();
  });
  document.querySelectorAll('[data-back]').forEach(b => { b.onclick = () => A.show('world'); });
  $('wBook').onclick = () => A.show('book');
  $('wSet').onclick = () => A.show('settings');
  $('wRank').onclick = () => A.show('profile');
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && A.sheetOpen()) A.closeSheet(); });

  // ---------- start ----------
  updRank();
  A.world.pickTarget();
  A.show('world');
  if (!P.data.seenIntro) {
    A.world.stop();
    const el = A.sheet(`<div class="shead"><span class="big">🐨</span><h1>Welcome, future controller!</h1></div>
      <p class="sub">I'm Koala Tower. This is focused practice for ATC selection testing (the SureSelect-style battery Airservices Australia uses), wrapped in a game to keep it fun. Unofficial and independent.</p>
      <div class="note howto"><ul>
        <li>🗺️ <b>Map view:</b> steer with ⟲ ⟳ (or tap the map, or arrow keys). Follow my headings and fly into an airport's dashed circle to open its lessons.</li>
        <li>📈 <b>Side view:</b> climb and descend through the gates at the right flight level. Each gate opens a lesson area.</li>
        <li>🧭 <b>AUTO</b> flies you to my suggestion. 📖 lists every lesson.</li>
        <li>⭐ Every lesson has ${A.MAXL} levels. Earn a star to unlock the next one. Golden rings give bonus XP.</li>
      </ul></div>
      <div class="real">Covers all of it: short-term memory, spatial awareness, remembering relationships, radar simulation and multi-tasking, detail accuracy, coded reasoning, number puzzles and mental maths.</div>
      <button class="btn" data-x>Let's fly! ✈️</button>`, () => { P.data.seenIntro = true; P.save(); A.world.start(); });
    wireX(el);
  }
})(window.ATC);
