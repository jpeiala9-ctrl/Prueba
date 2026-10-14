// ==================== i18n.js ====================
// Versión: 1.0 - Selector de idioma Español / English.
// Funcionamiento: el código de la app sigue escribiendo en español; si el idioma elegido es
// inglés, este módulo traduce al vuelo (texto, placeholders, title, avisos, confirmaciones y
// voz del GPS) con el diccionario de i18n-en.js. Cambiar de idioma recarga la app.
// Idioma guardado en localStorage 'ri5_lang' ('es' por defecto). Debe cargarse ANTES que el resto.
(function () {
  'use strict';
  var KEY = 'ri5_lang';
  var lang = 'es';
  try { var saved = localStorage.getItem(KEY); if (saved === 'en' || saved === 'es') lang = saved; } catch (e) {}

  var EN = window.RI5_I18N_EN || { exact: {}, patterns: [] };
  var cache = new Map();
  var LEAD_RE = /^[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9{¿¡]+/;
  var TRAIL_RE = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9}.!?…)%'"]+$/;
  var compiled = null;

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

  function compilePatterns() {
    var pairs = (EN.patterns || []).slice(), seen = {};
    pairs.forEach(function (p) { seen[p[0]] = 1; });
    // variantes sin símbolos/emojis en los extremos (para trozos sueltos de un texto compuesto)
    (EN.patterns || []).forEach(function (p) {
      var a = p[0].replace(LEAD_RE, '').replace(TRAIL_RE, ''), b = p[1].replace(LEAD_RE, '').replace(TRAIL_RE, '');
      if (a && b && a !== p[0] && !seen[a] && a.length >= 4 && /[A-Za-zÁÉÍÓÚñáéíóúñ]{3}/.test(a.replace(/\{\d+\}/g, ''))) { seen[a] = 1; pairs.push([a, b]); }
    });
    compiled = pairs.map(function (p) {
      var order = [];
      var src = p[0].replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{\d+\}/g, function (m) { return m; });
      // los {n} contienen llaves: se escapan a mano
      src = src.replace(/\{(\d+)\}/g, function (m, n) { order.push(n); return '([\\s\\S]+?)'; });
      src = src.replace(/\{/g, '\\{').replace(/\}/g, '\\}');
      return { re: new RegExp('^' + src + '$'), order: order, en: p[1] };
    });
  }

  var MESES = { enero: 'January', febrero: 'February', marzo: 'March', abril: 'April', mayo: 'May', junio: 'June', julio: 'July', agosto: 'August', septiembre: 'September', setiembre: 'September', octubre: 'October', noviembre: 'November', diciembre: 'December',
    lunes: 'Monday', martes: 'Tuesday', 'miércoles': 'Wednesday', miercoles: 'Wednesday', jueves: 'Thursday', viernes: 'Friday', 'sábado': 'Saturday', sabado: 'Saturday', domingo: 'Sunday' };
  var MESES_RE = /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/gi;
  function monthsWords(s) {
    s = s.replace(/(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)( de (\d{4}))?/gi, function (m, d, mo, x, y) { return d + ' ' + mo + (y ? ' ' + y : ''); });
    return s.replace(MESES_RE, function (w) {
      var en = MESES[w.toLowerCase()];
      if (!en) return w;
      if (w === w.toUpperCase()) return en.toUpperCase();
      if (w === w.toLowerCase()) return en.toLowerCase();
      return en;
    });
  }

  // ---- Búsqueda básica: exacto y patrones {n} ----
  function lookup(k) {
    var en = EN.exact[k];
    if (en !== undefined) return en;
    if (!compiled) compilePatterns();
    for (var i = 0; i < compiled.length; i++) {
      var m = compiled[i].re.exec(k);
      if (m) {
        var vals = {};
        compiled[i].order.forEach(function (n, j) { vals[n] = m[j + 1]; });
        return compiled[i].en.replace(/\{(\d+)\}/g, function (x, n) { return vals[n] !== undefined ? tr(vals[n]) : x; });
      }
    }
    return undefined;
  }

  var lowerIdx = null, strippedIdx = null, longKeys = null;
  function buildIdx() {
    lowerIdx = Object.create(null); strippedIdx = Object.create(null); longKeys = [];
    function addStripped(es, en) {
      var a = es.replace(LEAD_RE, '').replace(TRAIL_RE, ''), b = en.replace(LEAD_RE, '').replace(TRAIL_RE, '');
      if (a && b && a !== es && a.length >= 3 && strippedIdx[a] === undefined && EN.exact[a] === undefined) strippedIdx[a] = b;
    }
    Object.keys(EN.exact).forEach(function (k) {
      var lk = k.toLowerCase();
      if (lowerIdx[lk] === undefined) lowerIdx[lk] = EN.exact[k];
      addStripped(k, EN.exact[k]);
      if (k.length >= 10 && k.indexOf(' ') > 0 && k.indexOf('{') < 0) longKeys.push(k);
    });
    (EN.patterns || []).forEach(function (p) { addStripped(p[0], p[1]); });
    longKeys.sort(function (a, b) { return b.length - a.length; });
  }
  function matchCase(src, en) {
    var letters = src.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
    if (letters.length >= 2 && letters === letters.toUpperCase()) return en.toUpperCase();
    if (letters && letters === letters.toLowerCase() && /^[A-Z][a-z]/.test(en)) return en.charAt(0).toLowerCase() + en.slice(1);
    return en;
  }
  var depth = 0;
  // Alternativas cuando no hay coincidencia exacta: mayúsculas/minúsculas, símbolos pegados, trozos separados por « · », y frases conocidas dentro de un texto
  function fallback(k) {
    if (!lowerIdx) buildIdx();
    var en, hit;
    // A) mismo texto con otra capitalización ("distancia", "DISTANCIA")
    hit = lowerIdx[k.toLowerCase()];
    if (hit !== undefined) return matchCase(k, hit);
    // B) quitando emojis/símbolos de los extremos ("➖ Tu forma…", "🔥 predomina Z1")
    var lead = (k.match(LEAD_RE) || [''])[0];
    var core = k.slice(lead.length);
    var trail = (core.match(TRAIL_RE) || [''])[0];
    if (trail) core = core.slice(0, core.length - trail.length);
    if ((lead || trail) && core.length >= 2) {
      en = lookup(core);
      if (en === undefined) en = strippedIdx[core];
      if (en === undefined) { hit = lowerIdx[core.toLowerCase()]; if (hit !== undefined) en = matchCase(core, hit); }
      if (en !== undefined) return lead + en + trail;
    }
    // C) trozos unidos con « · », « — », « | » o saltos de línea
    var parts = k.split(/( · | — | \| |\n)/);
    if (parts.length > 1) {
      var changed = false;
      var out = parts.map(function (p, i) {
        if (i % 2 === 1 || p.length < 2) return p;
        var t = tr(p); if (t !== p) changed = true; return t;
      }).join('');
      if (changed) return out;
    }
    // D) frases conocidas (≥ 2 palabras) dentro de un texto más largo
    if (k.length <= 400) {
      var cur = k, did = false;
      for (var i = 0; i < longKeys.length; i++) {
        var lk = longKeys[i];
        if (cur.indexOf(lk) >= 0) { cur = cur.split(lk).join(EN.exact[lk]); did = true; }
      }
      if (did) return cur;
    }
    return undefined;
  }

  // Traduce una cadena (conserva espacios iniciales/finales). Devuelve la misma cadena si no hay traducción.
  function tr(str) {
    if (lang !== 'en' || typeof str !== 'string' || str.length < 2) return str;
    var hit = cache.get(str);
    if (hit !== undefined) return hit;
    var res = str;
    var k = norm(str);
    if (k && /[A-Za-zÁÉÍÓÚñáéíóúñ]/.test(k)) {
      var en = lookup(k);
      if (en === undefined) {
        var mw = monthsWords(k);
        if (mw !== k) en = mw;
      }
      if (en === undefined && depth < 4) {
        depth++;
        try { en = fallback(k); } finally { depth--; }
      }
      if (en !== undefined) {
        var lead = (str.match(/^\s*/) || [''])[0];
        var trail = (str.match(/\s*$/) || [''])[0];
        res = lead + en + trail;
      }
    }
    if (cache.size > 6000) cache.clear();
    cache.set(str, res);
    return res;
  }

  var I18n = {
    lang: lang,
    t: tr,
    locale: function () { return lang === 'en' ? 'en-GB' : 'es-ES'; },
    setLang: function (l) {
      if (l !== 'en' && l !== 'es') return;
      if (l === lang) return;
      try {
        if (window.GPSTracker && GPSTracker.isRunning) {
          var msg = lang === 'en' ? 'Finish your GPS session before changing language' : 'Termina tu sesión GPS antes de cambiar de idioma';
          if (window.Utils && Utils.showToast) Utils.showToast(msg, 'warning'); else alert(msg);
          return;
        }
      } catch (e) {}
      try { localStorage.setItem(KEY, l); } catch (e) {}
      location.reload();
    }
  };
  window.I18n = I18n;
  // Marca el idioma activo en TODOS los selectores (login y Configuración), también los que aparecen más abajo en el HTML
  function markLang() {
    try { document.querySelectorAll('.lang-opt').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false'); }); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', markLang); else markLang();
  window.addEventListener('pageshow', markLang);
  if (lang !== 'en') return; // en español no se toca nada

  document.documentElement.lang = 'en';

  // ---------- DOM ----------
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'data-titulo'];
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, CODE: 1 };
  var lastSet = new WeakMap();

  function skipEl(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentNode) {
      if (SKIP_TAGS[n.tagName] || n.hasAttribute('data-no-i18n') || n.isContentEditable) return true;
    }
    return false;
  }
  function doText(node) {
    var v = node.nodeValue;
    if (!v || lastSet.get(node) === v) return;
    var p = node.parentNode;
    if (p && p.nodeType === 1 && skipEl(p)) return;
    var t = tr(v);
    if (t !== v) { lastSet.set(node, t); node.nodeValue = t; }
  }
  function doAttrs(el) {
    if (!el.getAttribute) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i], v = el.getAttribute(a);
      if (v) { var t = tr(v); if (t !== v) el.setAttribute(a, t); }
    }
    if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit') && el.value) {
      var tv = tr(el.value); if (tv !== el.value) el.value = tv;
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    if (SKIP_TAGS[root.tagName] || root.hasAttribute('data-no-i18n')) return;
    doAttrs(root);
    for (var c = root.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) doText(c); else if (c.nodeType === 1) walk(c);
    }
  }

  var mo = new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (m.type === 'childList') {
        for (var j = 0; j < m.addedNodes.length; j++) {
          var n = m.addedNodes[j];
          if (n.nodeType === 3) { doText(n); } else if (n.nodeType === 1 && !skipEl(n.parentNode)) walk(n);
        }
      } else if (m.type === 'characterData') {
        doText(m.target);
      } else if (m.type === 'attributes') {
        if (!skipEl(m.target)) doAttrs(m.target);
      }
    }
  });
  function start() {
    walk(document.documentElement);
    if (document.title) document.title = tr(document.title);
    mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS.concat(['value']) });
  }
  if (document.readyState === 'loading') {
    // observar desde el principio para que no haya parpadeo en español
    mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS.concat(['value']) });
    document.addEventListener('DOMContentLoaded', function () { walk(document.documentElement); if (document.title) document.title = tr(document.title); });
  } else { start(); }

  // ---------- Avisos nativos ----------
  ['alert', 'confirm', 'prompt'].forEach(function (fn) {
    var orig = window[fn];
    if (typeof orig !== 'function') return;
    window[fn] = function (msg) { var a = Array.prototype.slice.call(arguments); if (typeof a[0] === 'string') a[0] = tr(a[0]); return orig.apply(window, a); };
  });

  // ---------- Fechas con nombre de mes / día ----------
  ['toLocaleDateString', 'toLocaleString'].forEach(function (fn) {
    var orig = Date.prototype[fn];
    Date.prototype[fn] = function (loc, opts) {
      if (typeof loc === 'string' && /^es/i.test(loc) && opts && (opts.month === 'long' || opts.month === 'short' || opts.weekday)) loc = 'en-GB';
      return orig.call(this, loc, opts);
    };
  });

  // ---------- Voz del GPS ----------
  try {
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      var origSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = function (u) {
        try { if (u && typeof u.text === 'string') { u.text = tr(u.text); if (/^es/i.test(u.lang || '') || !u.lang) u.lang = 'en-GB'; } } catch (e) {}
        return origSpeak(u);
      };
    }
  } catch (e) {}
})();
