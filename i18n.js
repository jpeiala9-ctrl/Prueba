// ==================== i18n.js ====================
// Versión: 1.0 - Selector de idioma Español / English.
// Funcionamiento: el código de la app sigue escribiendo en español; si el idioma elegido es
// inglés, este módulo traduce al vuelo (texto, placeholders, title, avisos, confirmaciones y
// voz del GPS) con el diccionario de i18n-en.js. Cambiar de idioma es inmediato (sin recargar).
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
    // Más específicos primero: gana el patrón con más texto fijo (evita que "{1} de {2} sesiones{3}" se coma frases largas)
    pairs.forEach(function (p, i) { p.lit = p[0].replace(/\{\d+\}/g, '').length; p.idx = i; });
    pairs.sort(function (x, y) { return (y.lit - x.lit) || (x.idx - y.idx); });
    compiled = pairs.map(function (p) {
      var order = [];
      var src = p[0].replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{\d+\}/g, function (m) { return m; });
      // los {n} contienen llaves: se escapan a mano
      // los {n} de los extremos exigen texto; los del interior pueden estar vacíos (p. ej. un aviso opcional entre dos frases)
      src = src.replace(/\{(\d+)\}/g, function (m, n, off, whole) { order.push(n); return (off === 0 || off + m.length === whole.length) ? '([\\s\\S]+?)' : '([\\s\\S]*?)'; });
      src = src.replace(/\{/g, '\\{').replace(/\}/g, '\\}');
      return { re: new RegExp('^' + src + '$'), order: order, en: p[1] };
    });
  }

  var MESES = { enero: 'January', febrero: 'February', marzo: 'March', abril: 'April', mayo: 'May', junio: 'June', julio: 'July', agosto: 'August', septiembre: 'September', setiembre: 'September', octubre: 'October', noviembre: 'November', diciembre: 'December',
    lunes: 'Monday', martes: 'Tuesday', 'miércoles': 'Wednesday', miercoles: 'Wednesday', jueves: 'Thursday', viernes: 'Friday', 'sábado': 'Saturday', sabado: 'Saturday', domingo: 'Sunday' };
  var MESES_RE = /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/gi;
  // Solo se traducen meses/días cuando el texto es únicamente una fecha ("lunes 14 de octubre"); una frase escrita por alguien ("nos vemos el lunes") no se toca
  function isDateOnly(s) {
    return s.replace(MESES_RE, '').replace(/\bde\b/gi, '').replace(/[\d\s,.\-–—·\/:]/g, '') === '';
  }
  function monthsWords(s) {
    s = s.replace(/(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)( de (\d{4}))?/gi, function (m, d, mo, x, y) { var en = MESES[mo.toLowerCase()] || mo; en = en.charAt(0).toUpperCase() + en.slice(1); return d + ' ' + en + (y ? ' ' + y : ''); });
    return s.replace(MESES_RE, function (w) {
      var en = MESES[w.toLowerCase()];
      if (!en) return w;
      if (w === w.toUpperCase()) return en.toUpperCase();
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
      if (k.length >= 14 && k.split(' ').length >= 3 && k.indexOf('{') < 0) longKeys.push(k);
    });
    (EN.patterns || []).forEach(function (p) { addStripped(p[0], p[1]); });
    longKeys.sort(function (a, b) { return b.length - a.length; });
  }
  function matchCase(src, en) {
    var letters = src.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
    var enHasLower = /[a-z]/.test(en);
    if (letters.length >= 2 && letters === letters.toUpperCase()) return en.toUpperCase();
    if (letters && letters === letters.toLowerCase()) {
      if (!enHasLower) return en.toLowerCase();                       // diccionario en MAYÚSCULAS, texto en minúsculas
      if (/^[A-Z][a-z]/.test(en)) return en.charAt(0).toLowerCase() + en.slice(1);
      return en;
    }
    if (letters.length >= 2 && /^[A-ZÁÉÍÓÚÑ]/.test(letters) && letters.slice(1) === letters.slice(1).toLowerCase()) {
      if (!enHasLower) return en.charAt(0) + en.slice(1).toLowerCase();  // "Principiante" desde "PRINCIPIANTE"
      if (/^[a-z]/.test(en)) return en.charAt(0).toUpperCase() + en.slice(1);
    }
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
    var parts = k.split(/( · | — | – | \| |\n)/);
    if (parts.length > 1) {
      var changed = false;
      var out = parts.map(function (p, i) {
        if (i % 2 === 1 || p.length < 2) return p;
        var t = tr(p); if (t !== p) changed = true; return t;
      }).join('');
      if (changed) return out;
    }
    // D) frases conocidas (≥ 3 palabras, palabra completa) dentro de un texto más largo; solo si cubren la mayor parte del texto
    if (k.length <= 400) {
      var cur = k, covered = 0;
      for (var i = 0; i < longKeys.length; i++) {
        var lk = longKeys[i], at = cur.indexOf(lk);
        while (at >= 0) {
          var before = at === 0 ? ' ' : cur.charAt(at - 1), after = cur.charAt(at + lk.length) || ' ';
          if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/.test(before) && !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/.test(after)) {
            cur = cur.slice(0, at) + '\u0001' + EN.exact[lk] + '\u0002' + cur.slice(at + lk.length);
            covered += lk.length;
            at = cur.indexOf(lk, at + 2 + EN.exact[lk].length);
          } else at = cur.indexOf(lk, at + 1);
        }
      }
      if (covered > 0 && covered >= k.length * 0.6) return cur.replace(/[\u0001\u0002]/g, '');
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
        if (isDateOnly(k)) { var mw = monthsWords(k); if (mw !== k) en = mw; }
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
    // Cambio de idioma INMEDIATO, sin recargar: traduce (o restaura) todo lo que hay en pantalla al instante
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
      // Sin saltos: se anota dónde está el botón pulsado, se cambia todo de una vez y se corrige el scroll para que el botón siga en el mismo sitio
      var anchor = null, top0 = 0, scroller = null;
      try {
        var btns = document.querySelectorAll('.lang-opt[data-lang="' + l + '"]');
        for (var bi = 0; bi < btns.length; bi++) { if (btns[bi].offsetParent !== null) { anchor = btns[bi]; break; } }
        if (anchor) {
          top0 = anchor.getBoundingClientRect().top;
          for (var el = anchor.parentElement; el && el !== document.body; el = el.parentElement) {
            var oy = getComputedStyle(el).overflowY;
            if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) { scroller = el; break; }
          }
          if (!scroller) scroller = document.scrollingElement || document.documentElement;
        }
      } catch (e) { anchor = null; }
      document.documentElement.classList.add('i18n-switching');
      lang = l; I18n.lang = l;
      cache.clear();
      markLang(); // el botón se marca al momento
      try {
        if (l === 'en') enable(); else disable();
      } catch (e) { try { location.reload(); } catch (e2) {} return; }
      try {
        if (anchor && scroller) {
          var delta = anchor.getBoundingClientRect().top - top0;
          if (delta) scroller.scrollTop += delta;
        }
      } catch (e) {}
      requestAnimationFrame(function () { requestAnimationFrame(function () { document.documentElement.classList.remove('i18n-switching'); }); });
      try { window.dispatchEvent(new CustomEvent('i18nchange', { detail: { lang: l } })); } catch (e) {}
    }
  };
  window.I18n = I18n;
  try {
    var st = document.createElement('style');
    st.textContent = 'html.i18n-switching *, html.i18n-switching *::before, html.i18n-switching *::after { transition: none !important; }';
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}
  // Marca el idioma activo en TODOS los selectores (login y Configuración), también los que aparecen más abajo en el HTML
  function markLang() {
    try { document.querySelectorAll('.lang-opt').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false'); }); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', markLang); else markLang();
  window.addEventListener('pageshow', markLang);

  // ---------- DOM ----------
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'data-titulo'];
  var OBS_ATTRS = ATTRS.concat(['value']);
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, CODE: 1 };
  var textOrig = new WeakMap();   // nodo de texto -> { o: original español, t: texto inglés puesto por nosotros }
  var attrOrig = new WeakMap();   // elemento -> { atributo: { o, t } }
  var titleOrig = null;

  function skipEl(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentNode) {
      if (SKIP_TAGS[n.tagName] || n.hasAttribute('data-no-i18n') || n.isContentEditable) return true;
    }
    return false;
  }
  function doText(node) {
    var v = node.nodeValue;
    if (!v) return;
    var rec = textOrig.get(node);
    if (rec && rec.t === v) return;
    var p = node.parentNode;
    if (p && p.nodeType === 1 && skipEl(p)) return;
    var t = tr(v);
    if (t !== v) { textOrig.set(node, { o: v, t: t }); node.nodeValue = t; }
  }
  function setAttrRec(el, a, o, t) {
    var r = attrOrig.get(el); if (!r) { r = {}; attrOrig.set(el, r); }
    r[a] = { o: o, t: t };
  }
  function doAttrs(el) {
    if (!el.getAttribute) return;
    var rec = attrOrig.get(el);
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i], v = el.getAttribute(a);
      if (v) {
        if (rec && rec[a] && rec[a].t === v) continue;
        var t = tr(v); if (t !== v) { setAttrRec(el, a, v, t); el.setAttribute(a, t); }
      }
    }
    if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit') && el.value) {
      if (rec && rec.value && rec.value.t === el.value) return;
      var tv = tr(el.value); if (tv !== el.value) { setAttrRec(el, 'value', el.value, tv); el.value = tv; }
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    if (root.hasAttribute('data-no-i18n')) return;
    if (SKIP_TAGS[root.tagName]) { if (root.tagName === 'TEXTAREA') doAttrs(root); return; } // el contenido escrito por el usuario no se toca, pero el placeholder sí
    doAttrs(root);
    for (var c = root.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) doText(c); else if (c.nodeType === 1) walk(c);
    }
  }

  var mo = new MutationObserver(function (list) {
    if (lang !== 'en') return;
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
        if (m.target.tagName === 'TEXTAREA' ? !m.target.hasAttribute('data-no-i18n') : !skipEl(m.target)) doAttrs(m.target);
      }
    }
  });
  var observing = false;
  function observe() {
    if (observing) return;
    mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: OBS_ATTRS });
    observing = true;
  }
  function unobserve() { mo.disconnect(); observing = false; }

  function translateTitle() {
    if (!document.title) return;
    if (titleOrig === null) titleOrig = document.title;
    document.title = tr(titleOrig);
  }
  function enable() {
    document.documentElement.lang = 'en';
    unobserve();
    walk(document.documentElement);
    translateTitle();
    observe();
  }
  // Vuelta a español: se restauran los textos originales de todo lo que tradujimos (solo si nadie los ha cambiado después)
  function disable() {
    unobserve();
    document.documentElement.lang = 'es';
    var tw = document.createTreeWalker(document.documentElement, 1 | 4, null, false), n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) {
        var r = textOrig.get(n);
        if (r && n.nodeValue === r.t) n.nodeValue = r.o;
        textOrig.delete(n);
      } else {
        var ar = attrOrig.get(n);
        if (ar) {
          for (var a in ar) {
            if (a === 'value') { if (n.value === ar[a].t) n.value = ar[a].o; }
            else if (n.getAttribute(a) === ar[a].t) n.setAttribute(a, ar[a].o);
          }
          attrOrig.delete(n);
        }
      }
    }
    if (titleOrig !== null) { document.title = titleOrig; titleOrig = null; }
  }

  if (lang === 'en') {
    document.documentElement.lang = 'en';
    if (document.readyState === 'loading') {
      // observar desde el principio para que no haya parpadeo en español
      observe();
      document.addEventListener('DOMContentLoaded', function () { walk(document.documentElement); translateTitle(); });
    } else { enable(); }
  }

  // ---------- Avisos nativos (traducen solo si el idioma activo es inglés) ----------
  ['alert', 'confirm', 'prompt'].forEach(function (fn) {
    var orig = window[fn];
    if (typeof orig !== 'function') return;
    window[fn] = function (msg) {
      if (lang !== 'en') return orig.apply(window, arguments);
      var a = Array.prototype.slice.call(arguments); if (typeof a[0] === 'string') a[0] = tr(a[0]); return orig.apply(window, a);
    };
  });

  // ---------- Fechas con nombre de mes / día ----------
  ['toLocaleDateString', 'toLocaleString'].forEach(function (fn) {
    var orig = Date.prototype[fn];
    Date.prototype[fn] = function (loc, opts) {
      if (lang === 'en' && typeof loc === 'string' && /^es/i.test(loc) && opts && (opts.month === 'long' || opts.month === 'short' || opts.weekday)) loc = 'en-GB';
      return orig.call(this, loc, opts);
    };
  });

  // ---------- Voz del GPS ----------
  try {
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      var origSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = function (u) {
        if (lang === 'en') {
          try { if (u && typeof u.text === 'string') { u.text = tr(u.text); if (/^es/i.test(u.lang || '') || !u.lang) u.lang = 'en-GB'; } } catch (e) {}
        }
        return origSpeak(u);
      };
    }
  } catch (e) {}
})();
