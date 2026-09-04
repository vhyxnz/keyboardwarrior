(function(root) {
    'use strict';
    const actions = {clear:'Clear text', freeze:'Ice', nova:'Boom', repair:'Repair'};
    const defaults = {clear:'Delete', freeze:'F2', nova:'F4', repair:'F8'};
    const keys = ['', 'Delete', 'Insert', 'Home', 'End', 'PageUp', 'PageDown', 'F2', 'F4', 'F7', 'F8', 'F9'];
    function normalize(raw) {
        const result = {}, used = new Set();
        Object.keys(actions).forEach(action => {
            const key = raw && Object.hasOwn(raw, action) ? raw[action] : defaults[action];
            result[action] = keys.includes(key) && !used.has(key) ? key : '';
            if (result[action]) used.add(result[action]);
        });
        return result;
    }
    function actionFor(bindings, event) {
        if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return null;
        return Object.keys(actions).find(action => bindings[action] && bindings[action] === event.key) || null;
    }
    root.ShortcutRules = {normalize, actionFor, defaults, keys};
    if (typeof document === 'undefined') return;
    let bindings;
    try { bindings = normalize(JSON.parse(localStorage.getItem('kw_keybindings'))); }
    catch(error) { bindings = normalize(null); }
    const section = document.createElement('section');
    section.className = 'setting keyboard-shortcuts';
    section.setAttribute('aria-labelledby', 'shortcutHeading');
    section.innerHTML = '<div class="setting-title" id="shortcutHeading">Desktop Key Bindings</div><p class="setting-description">Shortcuts for Keyboard Defense and Typing Survival. Choose a key or turn an action off. Power-ups only activate when their matching pickup is visible. Normal letters, spaces, and modifier combinations stay available for typing and browser commands.</p><div id="shortcutFields"></div><p class="setting-description">Some laptops require Fn with function keys. Choose Delete, Insert, or a navigation key if a function key is handled by your device. Saved on this device and included in backups.</p><button type="button" class="action-btn secondary-btn" id="resetShortcuts">RESTORE DEFAULT KEYS</button><p id="shortcutStatus" role="status"></p>';
    document.querySelector('#settingsScreen .setting').after(section);
    const fields = section.querySelector('#shortcutFields');
    Object.entries(actions).forEach(([action, name]) => {
        const row = document.createElement('label'); row.className = 'shortcut-row';
        const text = document.createElement('span'); text.textContent = name + (action === 'clear' ? ' · both modes' : ' · Defense');
        const select = document.createElement('select'); select.id = 'shortcut-' + action;
        keys.forEach(key => { const option = document.createElement('option'); option.value = key; option.textContent = key || 'Off'; select.appendChild(option); });
        select.addEventListener('change', () => {
            const conflict = Object.keys(actions).find(other => other !== action && select.value && bindings[other] === select.value);
            if (conflict) { status(select.value + ' is already assigned to ' + actions[conflict] + '. Choose another key or turn that binding off first.'); render(); return; }
            save({...bindings, [action]:select.value});
        });
        row.append(text, select); fields.appendChild(row);
    });
    section.querySelector('#resetShortcuts').addEventListener('click', () => save({...defaults}));
    const hint = document.createElement('p'); hint.id = 'arcadeShortcutHint'; hint.className = 'arcade-shortcut-hint';
    document.querySelector('.arcade-input-row').after(hint);
    function status(message) { document.getElementById('shortcutStatus').textContent = message; }
    function save(next) {
        try { localStorage.setItem('kw_keybindings', JSON.stringify(next)); bindings = next; status('Key bindings saved.'); }
        catch(error) { status('Could not save key bindings. Check available device storage.'); }
        render();
    }
    function decoratePower(el, type) {
        const key = bindings[type];
        el.querySelector('.power-shortcut-key')?.remove();
        el.removeAttribute('aria-keyshortcuts');
        el.title = actions[type] + (key ? ' — ' + key : ' — Click or tap');
        if (key) {
            el.setAttribute('aria-keyshortcuts', key);
            const badge = document.createElement('kbd'); badge.className = 'power-shortcut-key'; badge.textContent = key; badge.setAttribute('aria-hidden','true'); el.appendChild(badge);
        }
    }
    function render() {
        Object.keys(actions).forEach(action => { document.getElementById('shortcut-' + action).value = bindings[action]; });
        const clear = document.getElementById('arcadeClearText');
        clear.title = 'Clear text' + (bindings.clear ? ' — ' + bindings.clear : '');
        clear.removeAttribute('aria-keyshortcuts');
        if (bindings.clear) clear.setAttribute('aria-keyshortcuts', bindings.clear);
        const available = Object.keys(actions).filter(action => bindings[action] && (action === 'clear' || arcadeLastMode === 'defense'));
        hint.textContent = available.length ? 'KEYS: ' + available.map(action => actions[action] + ' ' + bindings[action]).join(' · ') : 'Keyboard shortcuts are off. Configure them in Settings.';
        if (arcadePowerPickup) decoratePower(arcadePowerPickup.el, arcadePowerPickup.type);
    }
    function handleShortcut(event) {
        if (!arcadeActive || !['defense','survival'].includes(arcadeLastMode) || !document.getElementById('arcadeModeScreen').classList.contains('active')) return;
        if (document.querySelector('dialog[open]')) return;
        const target = document.activeElement;
        const input = document.getElementById('arcadeInput');
        if (target !== input && target !== document.getElementById('arcadeClearText') && !target?.classList.contains('power-pickup')) return;
        const action = actionFor(bindings, event);
        if (!action || (action !== 'clear' && arcadeLastMode !== 'defense')) return;
        event.preventDefault(); event.stopImmediatePropagation();
        if (event.repeat) return;
        if (action === 'clear') clearArcadeText();
        else if (arcadePowerPickup && arcadePowerPickup.type === action) arcadePowerPickup.el.click();
    }
    document.addEventListener('keydown', handleShortcut, true);
    root.KeyboardShortcuts = {render, decoratePower};
    render();
})(globalThis);
