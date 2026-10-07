/* RI5 · Iconos de línea
 * Sustituye al pintarse cualquier emoticono por un icono de línea (un trazo, color del texto).
 * - Texto normal: se cambia por un <svg> inline.
 * - <option>, title, placeholder, aria-label, alert/confirm/prompt: se quita el emoticono (no admiten iconos).
 * - Se respeta el texto escrito por usuarios (.message-text, [data-keep-emoji]).
 * - Un emoticono sin icono asignado se elimina.
 */
(function () {
  'use strict';
  var I = {
    flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.5.3 1.2 1 2 2 2.3C11 8.5 11.5 5.5 12 3z"/>',
    dumbbell: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.7 2.7L16 9.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.3v.2"/>',
    'x-circle': '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    ruler: '<path d="M3.5 15.5l12-12 5 5-12 12z"/><path d="M7 12l2 2M10 9l1.5 1.5M13 6l2 2"/>',
    track: '<rect x="3" y="7" width="18" height="10" rx="5"/><rect x="7" y="10.5" width="10" height="3" rx="1.5"/>',
    footprints: '<path d="M8 4c2 0 3 2 3 5s-1 4-3 4-3-1-3-4 1-5 3-5z"/><path d="M16 11c2 0 3 2 3 5s-1 4-3 4-3-1-3-4 1-5 3-5z"/>',
    shoe: '<path d="M3 17v-4.5l3.5-1 2 2h3.5l3.5 1.5c2.5.8 5.5 1.2 5.5 3.5V19H3z"/><path d="M3 19.5h18M9 12.5l1.2-1.8"/>',
    bolt: '<path d="M13 3L5.5 13.5H11L10 21l8-11h-5.5z"/>',
    wind: '<path d="M3 9h11a2.5 2.5 0 1 0-2.5-2.5M3 14h15a2.5 2.5 0 1 1-2.5 2.5M3 19h7"/>',
    hourglass: '<path d="M6 3h12M6 21h12M7 3v3.5L12 12l-5 5.5V21M17 3v3.5L12 12l5 5.5V21"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    chart: '<path d="M5 20v-8M12 20V4M19 20v-5"/>',
    'trend-up': '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
    'trend-down': '<path d="M3 7l6 6 4-4 8 8M15 17h6v-6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    stopwatch: '<circle cx="12" cy="14" r="7"/><path d="M12 14l3-3M9.5 3h5M12 3v4"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l2.5 2.5M14 9l2 2"/>',
    heart: '<path d="M12 20S4 15.2 4 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.2 12 20 12 20z"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14c1 1.5 2.2 2.2 3.5 2.2s2.5-.7 3.5-2.2M9 9.5v.5M15 9.5v.5"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4v1.5A3.5 3.5 0 0 0 8 11M16 6h4v1.5A3.5 3.5 0 0 1 16 11M12 13v4M8 20h8M10 17h4"/>',
    medal: '<circle cx="12" cy="15" r="5.5"/><path d="M8.5 10.5L6 3M15.5 10.5L18 3M12 12.5v5"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17v4M17 19h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14.2c2.6.2 4.5 2.2 4.5 5.3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7.5L12 13l8.5-5.5"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    chat: '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4.5 4v-4H6a2 2 0 0 1-2-2z"/>',
    feed: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    send: '<path d="M21 3L3 10.5l7 2.5 2.5 7z"/><path d="M21 3L10 13"/>',
    inbox: '<path d="M12 4v10M8 10.5l4 4 4-4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4V3h6v1M9 11h6M9 15h6"/>',
    paperclip: '<path d="M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.5 17a1.7 1.7 0 0 1-2.4-2.4L15 6.7"/>',
    pencil: '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z"/><path d="M14.5 6.5l3 3"/>',
    file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    package: '<path d="M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="M3.5 8L12 12.5 20.5 8M12 12.5v8"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 6.8M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/>',
    battery: '<rect x="3" y="8" width="16" height="9" rx="2.5"/><path d="M21 11v3M7 11.5v2M11 11.5v2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    cake: '<rect x="4" y="12" width="16" height="8" rx="2"/><path d="M4 16c3 2 5-2 8 0s5 2 8 0M12 12V8M12 4.5v1"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2-.6-1.2.2-2.5 1.5-2.5H17a4 4 0 0 0 4-4 9 9 0 0 0-9-9.5z"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16" cy="10" r="1"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
    scale: '<path d="M12 4v16M7 20h10M5 8h14M5 8l-2.5 6a3 3 0 0 0 5 0zM19 8l-2.5 6a3 3 0 0 0 5 0z"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5A3.8 3.8 0 0 1 17 18z"/>',
    'cloud-sun': '<path d="M8 18a4 4 0 0 1-.4-8 5.5 5.5 0 0 1 10.4 1.5A3.4 3.4 0 0 1 17 18z"/><path d="M8 5l.5 1.5M3.5 9L5 9.5M13 3.5l-1 1.3"/>',
    rain: '<path d="M7 14a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5A3.8 3.8 0 0 1 17 14z"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/>',
    snow: '<path d="M7 14a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5A3.8 3.8 0 0 1 17 14z"/><path d="M8 18v.1M12 19v.1M16 18v.1M10 21v.1M14 21v.1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
    droplet: '<path d="M12 3.5s6 6.2 6 10.5a6 6 0 0 1-12 0c0-4.3 6-10.5 6-10.5z"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-4.5L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4.5L20 15M20 20v-5h-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    dot: '<circle cx="12" cy="12" r="3.2" fill="currentColor"/>',
    square: '<rect x="5" y="5" width="14" height="14" rx="3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.2"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    volume: '<path d="M4 10v4h4l5 4V6l-5 4zM16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>',
    'volume-off': '<path d="M4 10v4h4l5 4V6l-5 4zM17 9.5l4 5M21 9.5l-4 5"/>',
    hash: '<path d="M9 4L7 20M17 4l-2 16M4 9h16M3.5 15h16"/>',
    leaf: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19l8-8"/>',
    utensils: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 1.5-3 4-3 7v3h3"/>',
    mountain: '<path d="M2.5 20L9 7l4 7 2.5-4 6 10z"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    store: '<path d="M3 9l2-5h14l2 5"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/><path d="M10 20v-4h4v4"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/><path d="M22 9v6"/>'
  };
  var G = {
    flame: '🔥🌋', dumbbell: '💪🦾🏋🎽', 'check-circle': '✅☑', check: '✔', alert: '⚠🚦',
    'x-circle': '❌', x: '✖', ruler: '📏', hash: '🧮🔢', track: '🏃', footprints: '🚶👣', shoe: '👟',
    bolt: '⚡🚀🐇', wind: '💨', hourglass: '⏳⌛', pin: '📍📌🛰', map: '🗺🛣', compass: '🧭',
    chart: '📊', 'trend-up': '📈', 'trend-down': '📉', calendar: '📅📆🗓', clock: '🕒🕓🕐⏰',
    stopwatch: '⏱⏲', lock: '🔒🔐', unlock: '🔓', key: '🔑', heart: '❤💚💜💙', smile: '😌👋🙂',
    moon: '😴💤🌙🌑🌒🌓🌔🌕🌖🌗🌘', trophy: '🏆', medal: '🏅🎖🥇🥈🥉🎗', flag: '🏁',
    target: '🎯', star: '⭐🌟', sparkle: '✨🎉🆕🌈🧩', user: '👤', users: '👥🤝', mail: '📧✉📨',
    trash: '🗑', chat: '💬', feed: '📢', search: '🔎🔍', send: '📤📲', inbox: '📥',
    clipboard: '📋📝🗒', paperclip: '📎', pencil: '✏', file: '📄📜', folder: '📁', package: '📦',
    tag: '🏷', link: '🔗', battery: '🔋', globe: '🌐🌍', cake: '🎂', palette: '🎨', bulb: '💡',
    save: '💾', camera: '📷', image: '🖼', scale: '⚖', shield: '🛡', cloud: '☁🌫',
    'cloud-sun': '⛅🌤🌦', rain: '🌧⛈', snow: '🌨', sun: '☀🌞🌅🌇🔆', droplet: '💧',
    refresh: '🔁🔄🌀↩', plus: '➕', minus: '➖', dot: '🔹', square: '⬜', info: 'ℹ', ban: '🚫',
    volume: '🔊', 'volume-off': '🔇', leaf: '🧘', utensils: '🍽', mountain: '⛰', activity: '🧬',
    store: '🏬', cap: '🎓', home: '🏠', sliders: '⚙', calendar2: ''
  };
  var MAP = {};
  Object.keys(G).forEach(function (n) { Array.from(G[n]).forEach(function (c) { if (c !== '\uFE0F') MAP[c] = n; }); });
  var TEXT = { '♂': '♂\uFE0E', '♀': '♀\uFE0E', '⬆': '↑', '⬇': '↓', '➡': '→', '⬅': '←', '🔜': '→', '👆': '↑', '👉': '→', '↔': '↔\uFE0E', '↕': '↕\uFE0E' };
  var KEEP = '▶◀↗↘↖↙⚥';
  var RE = /\p{Extended_Pictographic}(?:[\uFE0E\uFE0F]|\u200D\p{Extended_Pictographic}[\uFE0E\uFE0F]?|[\u{1F3FB}-\u{1F3FF}])*/gu;
  var HAS = /\p{Extended_Pictographic}/u;
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, NOSCRIPT: 1, TITLE: 1, OPTION: 1 };

  function base(m) { var c = Array.from(m)[0]; return c; }
  function segments(str, stripOnly) {
    var out = [], last = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(str))) {
      if (m.index > last) out.push({ t: str.slice(last, m.index) });
      var b = base(m[0]);
      if (KEEP.indexOf(b) >= 0) out.push({ t: b === '▶' || b === '◀' ? b + '\uFE0E' : b });
      else if (TEXT[b]) out.push({ t: TEXT[b] });
      else if (!stripOnly && MAP[b]) out.push({ i: MAP[b] });
      last = RE.lastIndex;
    }
    if (last < str.length) out.push({ t: str.slice(last) });
    return out;
  }
  function stripEmoji(s) {
    if (!s || !HAS.test(s)) return s;
    return segments(s, true).map(function (x) { return x.t || ''; }).join('').replace(/^\s+/, '').replace(/ {2,}/g, ' ');
  }

  if (typeof document === 'undefined') { // pruebas en Node
    module.exports = { segments: segments, stripEmoji: stripEmoji, MAP: MAP, ICONS: I };
    return;
  }

  function injectBase() {
    if (document.getElementById('ri5IconsSprite')) return;
    var sp = '<svg id="ri5IconsSprite" xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false">' +
      Object.keys(I).map(function (k) { return '<symbol id="ri-' + k + '" viewBox="0 0 24 24">' + I[k] + '</symbol>'; }).join('') + '</svg>';
    document.body.insertAdjacentHTML('afterbegin', sp);
    var st = document.createElement('style');
    st.textContent = '.ri-i{width:1.15em;height:1.15em;vertical-align:-0.22em;display:inline-block;flex:none;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;margin:0 .12em}';
    document.head.appendChild(st);
  }
  function mk(name) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('class', 'ri-i'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
    var u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    u.setAttribute('href', '#ri-' + name); s.appendChild(u);
    return s;
  }
  function skipEl(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentNode) {
      if (SKIP[e.tagName] || e.namespaceURI === 'http://www.w3.org/2000/svg' && e.tagName !== 'foreignObject') return true;
      if (e.hasAttribute && (e.hasAttribute('data-keep-emoji') || e.isContentEditable === true)) return true;
      if (e.classList && e.classList.contains('message-text')) return true;
    }
    return false;
  }
  function doText(n) {
    var s = n.nodeValue;
    if (!s || !HAS.test(s)) return;
    var p = n.parentNode;
    if (!p) return;
    if (p.tagName === 'OPTION') { var cl = stripEmoji(s); if (cl !== s) n.nodeValue = cl; return; }
    if (skipEl(p)) return;
    var segs = segments(s);
    if (!segs.some(function (x) { return x.i; }) && segs.map(function (x) { return x.t || ''; }).join('') === s) return;
    var f = document.createDocumentFragment();
    segs.forEach(function (x) { f.appendChild(x.i ? mk(x.i) : document.createTextNode(x.t)); });
    p.replaceChild(f, n);
  }
  var ATTR = ['title', 'placeholder', 'aria-label', 'alt'];
  function doAttrs(el) {
    ATTR.forEach(function (a) {
      var v = el.getAttribute && el.getAttribute(a);
      if (v && HAS.test(v)) { var cl = stripEmoji(v); if (cl !== v) el.setAttribute(a, cl); }
    });
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { doAttrs(root); if (SKIP[root.tagName] && root.tagName !== 'OPTION') return; }
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
    var texts = [], n;
    while ((n = tw.nextNode())) { if (n.nodeType === 3) { if (HAS.test(n.nodeValue)) texts.push(n); } else doAttrs(n); }
    texts.forEach(doText);
  }
  function start() {
    injectBase();
    if (HAS.test(document.title)) document.title = stripEmoji(document.title);
    walk(document.body);
    new MutationObserver(function (list) {
      list.forEach(function (r) {
        if (r.type === 'characterData') doText(r.target);
        else if (r.type === 'attributes') doAttrs(r.target);
        else r.addedNodes.forEach(function (n) { if (!(n.nodeType === 1 && n.id === 'ri5IconsSprite')) walk(n); });
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR });
    ['alert', 'confirm', 'prompt'].forEach(function (f) {
      var o = window[f]; if (typeof o !== 'function') return;
      window[f] = function (a, b) { return o.call(window, stripEmoji(String(a == null ? '' : a)), b); };
    });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
