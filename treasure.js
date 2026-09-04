(function () {
    'use strict';
    const icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 10V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v3M3 10h18v10H3zM8 3v7m8-7v7M3 14h7m4 0h7"/><path d="M10 12h4v5h-4z"/></svg>';
    const card = document.createElement('div');
    card.className = 'mode-card treasure-mode-card';
    card.innerHTML = '<h2>' + icon + 'Cursed Treasure</h2><p>Explore five chambers. Bank your treasure or stack a curse for a higher score multiplier. No corrections, fading ink, and a faster clock await.</p><button type="button" class="action-btn">ENTER THE VAULT</button>';
    document.querySelector('#chaosScreen > button:last-child').before(card);
    card.querySelector('button').addEventListener('click', open);
    const screen = document.createElement('section');
    screen.id = 'treasureScreen';
    screen.className = 'screen';
    screen.innerHTML = '<div class="treasure-heading">' + icon + '<h1>Cursed Treasure</h1></div><div id="treasureContent"></div>';
    document.getElementById('chaosScreen').after(screen);
    const content = screen.querySelector('#treasureContent');
    let run, tick;
    function stop() { clearInterval(tick); tick = null; }
    function leave() { stop(); run = null; }
    function button(label, action, secondary) {
        const el = document.createElement('button');
        el.type = 'button'; el.className = 'action-btn' + (secondary ? ' secondary-btn' : '');
        el.textContent = label; el.addEventListener('click', action); content.appendChild(el); return el;
    }
    function open() {
        stopTimer(); clearArcadeRuntime(); leave();
        document.body.className = '';
        showScreen('treasureScreen');
        content.innerHTML = '<div class="treasure-intro"><h2>A fortune with strings attached.</h2><p>Type each phrase exactly. The clock starts with your first character. After each chamber, bank your score or accept a permanent curse to go deeper.</p><ul><li>Each curse adds +0.5× to future chamber scores.</li><li>Five chambers per expedition. Timeout ends the run; cleared-chamber treasure is kept.</li><li>Corrections are allowed until you choose Sealed Keys. Paste is disabled.</li><li>Earn normal XP and coin rewards once per expedition with at least one cleared chamber. Treasure points are not spendable coins.</li><li>Leaving through navigation abandons the expedition without rewards.</li></ul></div>';
        button('OPEN THE FIRST CHAMBER', start);
        button('BACK TO CHAOS', () => showScreen('chaosScreen'), true);
    }
    function start() {
        const pool = [...new Set(phrases[language][attitude])];
        for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
        run = {id:Date.now(), pool, chamber:0, cleared:0, score:0, multiplier:1, sealed:false, faded:false, haste:0, seconds:0, errors:0, correct:0, phase:'ready'};
        chamber();
    }
    function chamber() {
        stop(); run.chamber++; run.phase = 'typing';
        run.phrase = run.pool[(run.chamber - 1) % run.pool.length];
        run.limit = Math.max(12, Math.ceil(12 + run.phrase.length / 3) * Math.pow(.8, run.haste));
        run.started = 0; run.penalty = 0; run.peekUntil = 0; run.previous = ''; run.roundErrors = 0;
        content.innerHTML = '<div class="treasure-hud"><span id="treasureChamber"></span><strong id="treasureClock"></strong><span id="treasureScore"></span></div><p id="treasureCurses"></p><div id="treasurePhrase" class="treasure-phrase"></div><p id="treasureHint" role="status">Start typing when ready.</p><label for="treasureInput">Your transcription</label><textarea id="treasureInput" rows="3" autocomplete="off" autocapitalize="off" spellcheck="false" autocorrect="off"></textarea>';
        document.getElementById('treasureChamber').textContent = 'CHAMBER ' + run.chamber + '/5';
        document.getElementById('treasureScore').textContent = run.score + ' POINTS · ' + run.multiplier.toFixed(1) + '×';
        document.getElementById('treasureCurses').textContent = 'CURSES: ' + [run.sealed && 'Sealed Keys', run.faded && 'Fading Ink', run.haste && 'Haste ×' + run.haste].filter(Boolean).join(' · ').replace(/^$/, 'None');
        const input = document.getElementById('treasureInput');
        let composing = false;
        input.addEventListener('paste', e => e.preventDefault());
        input.addEventListener('drop', e => e.preventDefault());
        input.addEventListener('compositionstart', () => { composing = true; });
        input.addEventListener('compositionend', () => { composing = false; acceptInput(); });
        input.addEventListener('beforeinput', e => {
            if (composing && /Composition/.test(e.inputType)) return;
            if (run && run.sealed && (e.inputType !== 'insertText' || input.selectionStart !== input.value.length || input.selectionEnd !== input.value.length)) e.preventDefault();
        });
        function acceptInput() {
            if (!run || run.phase !== 'typing') return;
            if (!run.started) {
                run.started = performance.now();
                document.getElementById('treasureHint').textContent = run.faded ? 'The ink fades after 8 seconds. Peek restores it briefly.' : 'Match the phrase exactly before time runs out.';
            }
            if (remaining() <= 0) { finish(false); return; }
            if (composing) return;
            const value = input.value;
            if (run.sealed && !value.startsWith(run.previous)) { input.value = run.previous; return; }
            let changed = 0;
            while (changed < value.length && value[changed] === run.previous[changed]) changed++;
            for (let i = changed; i < value.length; i++) if (value[i] !== run.phrase[i]) run.roundErrors++;
            run.previous = value;
            if (value === run.phrase) { clearChamber(); return; }
            if (run.sealed && !run.phrase.startsWith(value)) { finish(false, 'The sealed keys trapped a mistake.'); return; }
            renderPhrase();
        }
        input.addEventListener('input', acceptInput);
        if (run.faded) button('PEEK AT PHRASE (−3 SECONDS)', () => {
            if (!run || run.phase !== 'typing' || !run.started) return;
            run.penalty += 3; run.peekUntil = performance.now() + 2000; update(); input.focus();
        }, true);
        button('ABANDON EXPEDITION', () => showScreen('chaosScreen'), true);
        update(); tick = setInterval(update, 100); input.focus();
    }
    function remaining() { return run.limit - (run.started ? (performance.now() - run.started) / 1000 : 0) - run.penalty; }
    function renderPhrase() {
        const el = document.getElementById('treasurePhrase');
        const hidden = run.faded && run.started && performance.now() - run.started >= 8000 && performance.now() > run.peekUntil;
        el.replaceChildren();
        if (hidden) { el.textContent = 'The ink has vanished. Recall the phrase or use Peek.'; el.classList.add('faded'); return; }
        el.classList.remove('faded');
        Array.from(run.phrase).forEach((char, i) => { const span = document.createElement('span'); span.textContent = char; if (i < run.previous.length) span.className = char === run.previous[i] ? 'treasure-correct' : 'treasure-wrong'; el.appendChild(span); });
    }
    function update() {
        if (!run || run.phase !== 'typing') return;
        const left = remaining();
        document.getElementById('treasureClock').textContent = Math.max(0, left).toFixed(1) + 's';
        if (left <= 0) { finish(false); return; }
        renderPhrase();
    }
    function clearChamber() {
        stop(); run.phase = 'choice'; run.cleared++;
        run.seconds += (performance.now() - run.started) / 1000;
        run.errors += run.roundErrors; run.correct += run.phrase.length;
        run.score += Math.round(100 * run.multiplier);
        if (run.cleared === 5) { finish(true); return; }
        content.innerHTML = '<h2>Chamber cleared</h2><p>Your haul: <strong>' + run.score + ' treasure points</strong>. Bank it now, or choose a curse. Curses stack for the rest of this expedition.</p>';
        button('BANK ' + run.score + ' POINTS', () => finish(true));
        if (!run.sealed) button('SEALED KEYS · +0.5× — No corrections; one wrong character ends the run.', () => choose('sealed'), true);
        if (!run.faded) button('FADING INK · +0.5× — Phrase vanishes after 8s; a 2s peek costs 3s.', () => choose('faded'), true);
        button('HASTE · +0.5× — 20% less time per chamber; stacks.', () => choose('haste'), true);
    }
    function choose(curse) {
        if (!run || run.phase !== 'choice') return;
        if (curse === 'haste') run.haste++; else run[curse] = true;
        run.multiplier += .5; chamber();
    }
    function finish(banked, reason) {
        if (!run || run.phase === 'done') return;
        stop();
        if (run.phase === 'typing' && run.started) { run.seconds += (performance.now() - run.started) / 1000; run.errors += run.roundErrors; }
        run.phase = 'done';
        if (run.cleared) {
            arcadeStartTime = run.id;
            recordArcadeStats('treasure', Math.round(run.correct / (run.correct + run.errors) * 100), run.errors, run.correct, Math.max(.1, run.seconds), run.score);
        }
        content.innerHTML = '<h2>' + (banked ? 'Treasure secured' : 'The vault claims this run') + '</h2><p></p><div class="treasure-total">' + run.score + '<small>TREASURE POINTS</small></div><p>' + run.cleared + '/5 chambers cleared · ' + run.multiplier.toFixed(1) + '× final multiplier</p><p>Cleared-chamber points are kept. Treasure score is separate from Key Coins.</p>';
        content.querySelector('p').textContent = reason || (banked ? 'You escaped with your haul.' : 'Time ran out.');
        button('NEW EXPEDITION', start); button('BACK TO CHAOS', () => showScreen('chaosScreen'), true);
    }
    window.CursedTreasure = {open, leave};
})();
