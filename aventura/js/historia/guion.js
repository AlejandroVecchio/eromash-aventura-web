// ---------- el guion y el estado de la partida (módulo HISTORIA) ----------
// Mismo guion que la aventura de Godot (docs/historia/misiones-principales-eldervald.md): misiones EL-01 a EL-07,
// banderas, diálogos, qué dice cada NPC según la etapa, dónde está cada uno y dónde reaparece Eromash.
// Las líneas son claves de js/textos/historia.js (prefijo av.). El guardado va en localStorage, en 3 ranuras.
window.HISTORIA = (function () {
  "use strict";

  // Las siete misiones en 23 etapas (EL-0X-N, documento «Eldervald — misiones secundarias y etapas», 23/10/2026):
  // cada objetivo dice a qué etapa pertenece; cuenta: [qué se cuenta, cuántos hacen falta] (lo lleva etapas.js).
  // Los tres encargos de preparación: Lif (EL-02-2), Svanhild y Ása (EL-03-2) y Orm (EL-06-2).
  const MISIONES = [
    { id: "EL-01", objetivos: [
      { etapa: 1, texto: "obj_el01_1", hecho: "el01_acepto", donde: "eydis" },
      { etapa: 1, texto: "obj_el01_2", hecho: "croquis_leido", donde: "" },
      { etapa: 2, texto: "obj_el01_3", hecho: "carro_visto", donde: "carro" },
      { etapa: 3, texto: "obj_el01_4", hecho: "orm_encontrado", donde: "orm" },
    ] },
    { id: "EL-02", objetivos: [
      { etapa: 1, texto: "obj_el02_1", hecho: "errantes_despejados", donde: "errantes" },
      { etapa: 2, texto: "obj_el02_musgo", hecho: "musgo_juntado", donde: "musgo", cuenta: ["musgo", 4] },
      { etapa: 2, texto: "obj_el02_cuero", hecho: "cuero_juntado", donde: "lobos_refugio", cuenta: ["cuero", 2] },
      { etapa: 2, texto: "obj_el02_lif", hecho: "bror_entablillado", donde: "trab_refugio_trabajador" },
      { etapa: 3, texto: "obj_el02_2", hecho: "piedra_puesta", donde: "piedra_caida" },
      { etapa: 3, texto: "obj_el02_3", hecho: "runa_refugio", donde: "runa_refugio" },
      { etapa: 4, texto: "obj_el02_4", hecho: "fragmento", donde: "orm" },
    ] },
    { id: "EL-03", objetivos: [
      { etapa: 1, texto: "obj_el03_1", hecho: "fragmento_entregado", donde: "svanhild" },
      { etapa: 2, texto: "obj_el03_residuos", hecho: "residuos_juntados", donde: "errantes_norte", cuenta: ["residuo", 3] },
      { etapa: 2, texto: "obj_el03_aro", hecho: "aro_ajustado", donde: "herreria_puerta" },
      { etapa: 3, texto: "obj_el03_2", hecho: "fragmento_examinado", donde: "mesa" },
      { etapa: 3, texto: "obj_el03_3", hecho: "huella_patio", donde: "losa" },
      { etapa: 3, texto: "obj_el03_4", hecho: "lente", donde: "svanhild" },
    ] },
    { id: "EL-04", objetivos: [
      { etapa: 1, texto: "obj_el04_1", hecho: "eydis_paso", donde: "eydis" },
      { etapa: 1, texto: "obj_el04_2", hecho: "pista_tablon", donde: "tablon" },
      { etapa: 2, texto: "obj_el04_3", hecho: "pista_raiz", donde: "raiz" },
      { etapa: 3, texto: "obj_el04_custodio", hecho: "custodio_vencido", donde: "custodio" },
      { etapa: 4, texto: "obj_el04_4", hecho: "pista_menhir", donde: "menhir" },
      { etapa: 4, texto: "obj_el04_5", hecho: "eydis_claro", donde: "eydis" },
    ] },
    { id: "EL-05", objetivos: [
      { etapa: 1, texto: "obj_el05_1", hecho: "anclajes_vistos", donde: "claro" },
      { etapa: 2, texto: "obj_el05_2", hecho: "ataduras_rotas", donde: "ciervo" },
      { etapa: 2, texto: "obj_el05_3", hecho: "ciervo_vencido", donde: "ciervo" },
      { etapa: 3, texto: "obj_el05_4", hecho: "nucleo", donde: "nucleo" },
    ] },
    { id: "EL-06", objetivos: [
      { etapa: 1, texto: "obj_el06_1", hecho: "vuelta_paso", donde: "pedestal" },
      { etapa: 1, texto: "obj_el06_2", hecho: "nucleo_puesto", donde: "pedestal" },
      { etapa: 1, texto: "obj_el06_3", hecho: "runa_paso", donde: "pedestal" },
      { etapa: 2, texto: "obj_el06_lobos", hecho: "lobos_cabecera", donde: "cabecera", cuenta: ["lobo", 5] },
      { etapa: 3, texto: "obj_el06_4", hecho: "puente_reparado", donde: "orm" },
    ] },
    { id: "EL-07", objetivos: [
      { etapa: 1, texto: "obj_el07_1", hecho: "santuario_llegada", donde: "santuario" },
      { etapa: 2, texto: "obj_el07_2", hecho: "sello_visto", donde: "sello" },
      { etapa: 2, texto: "obj_el07_3", hecho: "voz_santuario", donde: "sello" },
      { etapa: 2, texto: "obj_el07_4", hecho: "calco", donde: "sello" },
      { etapa: 3, texto: "obj_el07_5", hecho: "calco_entregado", donde: "svanhild" },
    ] },
  ];

  const REAPARECER = { "EL-01": "puesto", "EL-02": "refugio", "EL-03": "eikholt", "EL-04": "paso_sur", "EL-05": "claro_entrada", "EL-06": "paso_sur", "EL-07": "aserradero", fin: "eikholt" };

  // cada diálogo: [hablante, clave]; fin = bandera al terminar; diario = entrada que se anota
  const D = (lineas, fin, diario) => ({ lineas, fin, diario });
  const DIALOGOS = {
    eydis_inicio: D([["eydis", "dlg_eydis_inicio_1"], ["eydis", "dlg_eydis_inicio_2"], ["eromash", "dlg_eydis_inicio_3"], ["eydis", "dlg_eydis_inicio_4"], ["eydis", "dlg_eydis_inicio_5"]], "el01_acepto", "diario_croquis"),
    eydis_espera: D([["eydis", "dlg_eydis_espera"]]),
    carro: D([["eromash", "dlg_carro_1"], ["eromash", "dlg_carro_2"]], "carro_visto"),
    orm_encuentro: D([["orm", "dlg_orm_encuentro_1"], ["eromash", "dlg_orm_encuentro_2"], ["orm", "dlg_orm_encuentro_3"]], "orm_encontrado"),
    orm_errantes: D([["orm", "dlg_orm_errantes"]]),
    orm_piedra: D([["orm", "dlg_orm_piedra"]]),
    eydis_refugio: D([["eydis", "dlg_eydis_refugio"]]),
    runa_refugio: D([["runa", "dlg_runa_refugio_1"], ["eromash", "dlg_runa_refugio_2"], ["eydis", "dlg_runa_refugio_3"], ["runa", "dlg_runa_refugio_4"]], "runa_refugio"),
    orm_lif: D([["orm", "dlg_orm_lif"]]),
    orm_lobos: D([["orm", "dlg_orm_lobos_1"], ["orm", "dlg_orm_lobos_2"]]),
    svanhild_templar: D([["svanhild", "dlg_svanhild_templar_1"], ["svanhild", "dlg_svanhild_templar_2"]]),
    orm_fragmento: D([["orm", "dlg_orm_fragmento_1"], ["eydis", "dlg_orm_fragmento_2"]], "fragmento", "diario_fragmento"),
    trabajador: D([["trabajador", "dlg_trabajador_1"]]),
    herido: D([["trabajador", "dlg_herido_1"]]),
    svanhild_inicio: D([["svanhild", "dlg_svanhild_inicio_1"], ["eromash", "dlg_svanhild_inicio_2"], ["svanhild", "dlg_svanhild_inicio_3"], ["svanhild", "dlg_svanhild_inicio_4"]], "fragmento_entregado"),
    svanhild_mesa: D([["svanhild", "dlg_svanhild_mesa"]]),
    svanhild_asta: D([["svanhild", "dlg_svanhild_asta_1"], ["eromash", "dlg_svanhild_asta_2"], ["svanhild", "dlg_svanhild_asta_3"], ["svanhild", "dlg_svanhild_asta_4"]]),
    svanhild_patio: D([["svanhild", "dlg_svanhild_patio"]]),
    svanhild_lente: D([["svanhild", "dlg_svanhild_lente_1"], ["svanhild", "dlg_svanhild_lente_2"]], "lente", "diario_lente"),
    svanhild_espera: D([["svanhild", "dlg_svanhild_espera"]]),
    eydis_eikholt: D([["eydis", "dlg_eydis_eikholt"]]),
    orm_eikholt: D([["orm", "dlg_orm_eikholt"]]),
    eydis_paso: D([["eydis", "dlg_eydis_paso_1"], ["eydis", "dlg_eydis_paso_2"], ["orm", "dlg_eydis_paso_3"]], "eydis_paso"),
    orm_paso: D([["orm", "dlg_orm_paso"]]),
    eydis_rastro: D([["eydis", "dlg_eydis_rastro"]]),
    eydis_claro: D([["eydis", "dlg_eydis_claro_1"], ["eromash", "dlg_eydis_claro_2"], ["eydis", "dlg_eydis_claro_3"]], "eydis_claro"),
    eydis_antes_jefe: D([["eydis", "dlg_eydis_antes_jefe"]]),
    eydis_ciervo: D([["eydis", "dlg_eydis_ciervo"]]),
    eydis_vuelta: D([["eydis", "dlg_eydis_vuelta"]]),
    runa_paso: D([["eromash", "dlg_runa_paso"]], "runa_paso"),
    orm_puente: D([["orm", "dlg_orm_puente_1"], ["orm", "dlg_orm_puente_2"]]),
    eydis_marca: D([["eydis", "dlg_eydis_marca_1"], ["eromash", "dlg_eydis_marca_2"], ["eydis", "dlg_eydis_marca_3"], ["eromash", "dlg_eydis_marca_4"], ["eydis", "dlg_eydis_marca_5"]], "puente_reparado", "diario_marca"),
    eydis_despues: D([["eydis", "dlg_eydis_despues"]]),
    orm_despues: D([["orm", "dlg_orm_despues"]]),
    runa_santuario: D([["runa", "dlg_runa_santuario_1"], ["eromash", "dlg_runa_santuario_2"], ["runa", "dlg_runa_santuario_3"]], "voz_santuario"),
    svanhild_calco: D([["svanhild", "dlg_svanhild_calco_1"], ["eromash", "dlg_svanhild_calco_2"]], "calco_entregado"),
    svanhild_final: D([["svanhild", "dlg_svanhild_final"]]),
    salida_norte: D([["eromash", "dlg_salida_norte"]]),
    zarzas: D([["eromash", "dlg_zarzas"]]),
  };

  // ---------- estado ----------
  const E = { mision: 0, banderas: {}, diario: [], vistos: [], salud: 100, pos: null, tiempo: 0, ranura: 1, extra: {} }; // extra: lo de cada sistema (secretos, runas, grupos)
  const oyentes = [];
  const avisar = (tipo, dato) => oyentes.forEach((f) => f(tipo, dato));

  const mision = () => MISIONES[E.mision] || null;
  const idMision = () => (MISIONES[E.mision] ? MISIONES[E.mision].id : "fin");
  const tiene = (b) => E.banderas[b] === true;
  const en = (id) => idMision() === id;
  function objetivo() {
    const m = mision();
    if (!m) return null;
    return m.objetivos.find((o) => !tiene(o.hecho)) || null;
  }
  // lo que se va juntando para un encargo (musgo, cuero, residuos, lobos alejados)
  const cuenta = (k) => (E.extra.cuentas && E.extra.cuentas[k]) || 0;
  function sumar(k, n = 1) {
    E.extra.cuentas = E.extra.cuentas || {};
    E.extra.cuentas[k] = cuenta(k) + n;
    const o = objetivo();
    if (o && o.cuenta && o.cuenta[0] === k && cuenta(k) >= o.cuenta[1]) marcar(o.hecho);
    else {
      avisar("cambio");
      guardar();
    }
  }
  const etapa = () => {
    const o = objetivo();
    return o ? idMision() + "-" + o.etapa : idMision();
  };
  function completa(id) {
    for (let i = 0; i < E.mision; i++) if (MISIONES[i].id === id) return true;
    return E.mision >= MISIONES.length;
  }
  function marcar(b, v = true) {
    if ((E.banderas[b] === true) === v) return;
    E.banderas[b] = v;
    while (E.mision < MISIONES.length && !objetivo()) {
      E.mision++;
      if (E.mision < MISIONES.length) avisar("mensaje", "mision_nueva");
      else {
        anotar("diario_santuario");
        avisar("fin");
      }
    }
    avisar("cambio");
    guardar();
  }
  function anotar(k) {
    if (E.diario.includes(k)) return;
    E.diario.push(k);
    avisar("mensaje", "diario_nuevo");
    avisar("cambio");
  }
  function descubrir(lugar) {
    if (E.vistos.includes(lugar)) return;
    E.vistos.push(lugar);
    avisar("lugar", lugar);
    guardar();
  }

  // qué conversación tiene cada NPC ahora (Guion.dialogo_de)
  function dialogoDe(npc) {
    const m = idMision(),
      o = objetivo(),
      h = o ? o.hecho : "";
    switch (npc) {
      case "eydis":
        if (m === "EL-01") return h === "el01_acepto" ? "eydis_inicio" : "eydis_espera";
        if (m === "EL-02") return "eydis_refugio";
        if (m === "EL-03") return "eydis_eikholt";
        if (m === "EL-04") return h === "eydis_paso" ? "eydis_paso" : h === "eydis_claro" ? "eydis_claro" : "eydis_rastro";
        if (m === "EL-05") return tiene("ciervo_vencido") ? "eydis_ciervo" : "eydis_antes_jefe";
        if (m === "EL-06") return "eydis_vuelta";
        return "eydis_despues";
      case "orm":
        if (m === "EL-01") return "orm_encuentro";
        if (m === "EL-02") {
          if (h === "errantes_despejados") return "orm_errantes";
          if (h === "musgo_juntado" || h === "cuero_juntado" || h === "bror_entablillado") return "orm_lif";
          if (h === "piedra_puesta" || h === "runa_refugio") return "orm_piedra";
          return "orm_fragmento";
        }
        if (m === "EL-03") return "orm_eikholt";
        if (m === "EL-04" || m === "EL-05") return "orm_paso";
        if (m === "EL-06") return h === "puente_reparado" ? "orm_puente" : h === "lobos_cabecera" ? "orm_lobos" : "orm_paso";
        return "orm_despues";
      case "svanhild":
        if (m === "EL-03") {
          if (h === "fragmento_entregado") return "svanhild_inicio";
          if (h === "residuos_juntados" || h === "aro_ajustado") return "svanhild_templar";
          if (h === "fragmento_examinado") return "svanhild_mesa";
          if (h === "huella_patio") return "svanhild_patio";
          return "svanhild_lente";
        }
        if (m === "EL-07" && h === "calco_entregado") return "svanhild_calco";
        if (m === "fin") return "svanhild_final";
        return "svanhild_espera";
      case "herido":
        return "herido";
    }
    return "trabajador";
  }

  // dónde está cada NPC según la etapa (Guion.lugar_de): devuelve un punto de ELDERVALD.PUNTOS
  function lugarDe(npc) {
    const m = idMision(),
      o = objetivo(),
      h = o ? o.hecho : "";
    switch (npc) {
      case "eydis":
        if (m === "EL-01") return "eydis_puesto";
        if (m === "EL-02") return tiene("runa_refugio") ? "eydis_refugio_salida" : "eydis_refugio";
        if (m === "EL-03") return "eydis_eikholt";
        if (m === "EL-04") return tiene("pista_menhir") ? "eydis_claro" : "eydis_paso";
        if (m === "EL-05") return tiene("ciervo_vencido") ? "eydis_ciervo" : "eydis_claro";
        return "eydis_paso";
      case "orm":
        if (m === "EL-01" || m === "EL-02") return "orm_refugio";
        if (m === "EL-03") return "orm_eikholt";
        if (m === "EL-04" || m === "EL-05") return "orm_paso";
        return tiene("puente_reparado") ? "orm_puente" : "orm_paso";
      case "svanhild":
        return m === "EL-03" && h === "huella_patio" ? "svanhild_patio" : "svanhild_casa";
      case "trabajadores":
        if ((m === "EL-01" || m === "EL-02") && !tiene("runa_refugio")) return "trab_refugio";
        if (m === "EL-02" || m === "EL-03") return "trab_eikholt";
        return "trab_paso";
    }
    return "";
  }

  // ---------- guardado: 3 ranuras en localStorage (si el navegador lo bloquea, la partida sigue sin guardar) ----------
  const CLAVE = "eromash.aventura.ranura.";
  const leer = (n) => {
    try {
      const t = localStorage.getItem(CLAVE + n);
      return t ? JSON.parse(t) : null;
    } catch (e) {
      return null;
    }
  };
  let pedirPos = null; // el motor dice dónde está Eromash al guardar
  function hayAlgo() {
    return E.mision > 0 || Object.keys(E.banderas).length > 0 || E.pos;
  }
  function guardar() {
    if (!hayAlgo()) return false;
    if (pedirPos) {
      const p = pedirPos();
      if (p) {
        E.pos = p.pos;
        E.salud = p.salud;
      }
    }
    try {
      localStorage.setItem(CLAVE + E.ranura, JSON.stringify({ v: 1, fecha: Date.now(), tiempo: Math.round(E.tiempo), mision: E.mision, banderas: E.banderas, diario: E.diario, vistos: E.vistos, salud: E.salud, pos: E.pos, extra: E.extra }));
      return true;
    } catch (e) {
      return false;
    }
  }
  function cargar(n) {
    const d = leer(n);
    if (!d) return false;
    Object.assign(E, { ranura: n, mision: d.mision | 0, banderas: d.banderas || {}, diario: d.diario || [], vistos: d.vistos || [], salud: d.salud || 100, pos: d.pos || null, tiempo: d.tiempo || 0, extra: d.extra || {} });
    avisar("cambio");
    return true;
  }
  function nueva(n) {
    Object.assign(E, { ranura: n, mision: 0, banderas: {}, diario: [], vistos: [], salud: 100, pos: null, tiempo: 0, extra: {} });
    try {
      localStorage.removeItem(CLAVE + n);
    } catch (e) {}
    avisar("cambio");
  }
  function resumen(n) {
    const d = leer(n);
    if (!d) return null;
    return { mision: MISIONES[d.mision] ? MISIONES[d.mision].id : "fin", fecha: d.fecha, tiempo: d.tiempo };
  }
  function reciente() {
    let mejor = 0,
      f = -1;
    for (let n = 1; n <= 3; n++) {
      const r = resumen(n);
      if (r && r.fecha > f) {
        mejor = n;
        f = r.fecha;
      }
    }
    return mejor;
  }

  return {
    MISIONES, DIALOGOS, REAPARECER, E,
    mision, idMision, objetivo, tiene, en, completa, cuenta, sumar, etapa, marcar, anotar, descubrir, dialogoDe, lugarDe,
    guardar, cargar, nueva, resumen, reciente,
    oir: (f) => oyentes.push(f),
    avisar,
    alGuardar: (f) => (pedirPos = f),
  };
})();
