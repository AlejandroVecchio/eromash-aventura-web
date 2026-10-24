// ---------- idioma: español / inglés (módulo I18N) ----------
// Los textos viven en js/textos/<tema>.js (menu, controles, en-linea, partida, jefes, campamento, inventario, arbol,
// equipo, tutoriales). Cada archivo llama I18N.textos({ 'clave': { es: '…', en: '…' } }) y se carga justo después de este.
// El juego usa: I18N.t(clave, vars?) (vars reemplaza {token} en el texto), I18N.lang, I18N.setLang('es'|'en'),
// I18N.LANGS, I18N.apply(root?) (vuelve a poner el texto de [data-i18n]/[data-i18n-ph]/[data-i18n-aria]),
// I18N.on(fn) (fn(lang) se llama al cambiar de idioma, para que cada panel abierto se vuelva a dibujar).
// Regla del proyecto: todo texto nuevo se agrega en js/textos/, en los dos idiomas, no como string suelto en otro archivo.
window.I18N = (function () {
  const KEY = "eromash-opciones";
  const LANGS = ["es", "en"];
  const D = { es: {}, en: {} };
  // suma un grupo de textos: { 'clave': { es: '…', en: '…' } }. Si falta un idioma, t() usa el español.
  function textos(tabla) {
    for (const k in tabla)
      for (const l of LANGS) if (tabla[k][l] !== undefined) D[l][k] = tabla[k][l];
  }
  // Idioma por defecto: inglés. Quien ya eligió idioma lo conserva (queda guardado en las opciones).
  let lang = "en";
  try {
    const o = JSON.parse(localStorage.getItem(KEY));
    if (o && LANGS.includes(o.lang)) lang = o.lang;
  } catch (e) {}
  const listeners = [];
  function t(key, vars) {
    let s = D[lang] && D[lang][key] !== undefined ? D[lang][key] : D.es[key];
    if (s === undefined) return key;
    if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
    return s;
  }
  function apply(root) {
    const r = root || document;
    if (!root) document.documentElement.lang = lang;
    r.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    r.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      el.placeholder = t(el.dataset.i18nPh);
    });
    r.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(el.dataset.i18nAria));
    });
  }
  function setLang(l) {
    if (!LANGS.includes(l) || l === lang) return;
    lang = l;
    try {
      const o = JSON.parse(localStorage.getItem(KEY)) || {};
      o.lang = l;
      localStorage.setItem(KEY, JSON.stringify(o));
    } catch (e) {}
    apply(document);
    listeners.slice().forEach((fn) => fn(l));
  }
  function on(fn) {
    listeners.push(fn);
  }
  document.addEventListener("DOMContentLoaded", () => apply(document));
  return {
    t,
    get lang() {
      return lang;
    },
    setLang,
    LANGS,
    apply,
    on,
    textos,
  };
})();
