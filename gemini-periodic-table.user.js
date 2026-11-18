// ==UserScript==
// @name         Gemini Model Periodic Table
// @namespace    kobosh
// @version      1.6
// @description  periodic table model picker for gemini 4
// @match        https://gemini.google.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/koboshchan/gemini-periodic-table/main/gemini-periodic-table.user.js
// @downloadURL  https://raw.githubusercontent.com/koboshchan/gemini-periodic-table/main/gemini-periodic-table.user.js
// ==/UserScript==
(() => {
  const EL = "H,He,Li,Be,B,C,N,O,F,Ne,Na,Mg,Al,Si,P,S,Cl,Ar,K,Ca,Sc,Ti,V,Cr,Mn,Fe,Co,Ni,Cu,Zn,Ga,Ge,As,Se,Br,Kr,Rb,Sr,Y,Zr,Nb,Mo,Tc,Ru,Rh,Pd,Ag,Cd,In,Sn,Sb,Te,I,Xe,Cs,Ba,La,Ce,Pr,Nd,Pm,Sm,Eu,Gd,Tb,Dy,Ho,Er,Tm,Yb,Lu,Hf,Ta,W,Re,Os,Ir,Pt,Au,Hg,Tl,Pb,Bi,Po,At,Rn,Fr,Ra,Ac,Th,Pa,U,Np,Pu,Am,Cm,Bk,Cf,Es,Fm,Md,No,Lr,Rf,Db,Sg,Bh,Hs,Mt,Ds,Rg,Cn,Nh,Fl,Mc,Lv,Ts,Og".split(",");
  // released models: symbol -> [name, color]
  const LIVE = { H: ["Hydrogen", "#4a7fd4"], C: ["Carbon", "#9b6fd6"], Ne: ["Neon", "#e8553a"], Ar: ["Argon", "#3fb39a"] };
  const pos = z => {
    if (z === 1) return [1, 1]; if (z === 2) return [1, 18];
    if (z <= 10) return [2, z <= 4 ? z - 2 : z + 8];
    if (z <= 18) return [3, z <= 12 ? z - 10 : z];
    if (z <= 36) return [4, z - 18]; if (z <= 54) return [5, z - 36];
    if (z >= 57 && z <= 71) return [9, z - 54];
    if (z >= 89 && z <= 103) return [10, z - 86];
    if (z <= 86) return [6, z <= 56 ? z - 54 : z - 68];
    return [7, z <= 88 ? z - 86 : z - 100];
  };
  const css = `
  #ptbl{position:fixed;z-index:2147483647;box-sizing:border-box;width:min(720px,96vw);max-height:90vh;overflow:auto;background:#1e1f20;border:1px solid #333537;border-radius:20px;padding:16px 18px 18px;color:#e3e3e3;font-family:"Google Sans",Roboto,sans-serif;box-shadow:0 8px 32px #0008;display:none}
  #ptbl.open{display:block}
  #ptbl .hd{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:500;margin-bottom:10px}
  #ptbl .hd .x{margin-left:auto;cursor:pointer;color:#9aa0a6;font-size:18px}
  #ptbl .g{display:grid;grid-template-columns:14px repeat(18,1fr);gap:3px;position:relative}
  #ptbl .n{font-size:9px;color:#80868b;text-align:center}
  #ptbl .c{aspect-ratio:1/1;background:#2a2b2e;border:1px solid #333537;border-radius:4px;position:relative;font-size:clamp(9px,1.6vw,14px);display:flex;align-items:center;justify-content:center;color:#c4c7c5}
  #ptbl .c i{position:absolute;top:1px;left:3px;font-size:7px;font-style:normal;color:#80868b}
  #ptbl .c.live{color:#fff;cursor:pointer}
  #ptbl .c.live:not(.unavailable):not(.checking):hover{filter:brightness(1.25)}
  #ptbl .c.unavailable,#ptbl .c.checking{cursor:not-allowed;opacity:.6}
  #ptbl .c.sel{outline:2px solid #fff;outline-offset:1px}
  #ptbl .lab{font-size:8px;color:#80868b;display:flex;align-items:center;justify-content:flex-end;padding-right:4px}
  #ptbl .ttl{position:absolute;left:calc(14px + 100%/18*3);top:calc(100%/9*1.05);font-size:22px;font-weight:400;pointer-events:none}
  #ptbl .ttl small{display:flex;gap:12px;font-size:10px;color:#9aa0a6;margin-top:6px}
  #ptbl .ttl b{display:inline-block;width:6px;height:6px;border-radius:50%;background:#8ab4f8;margin-right:4px;vertical-align:middle}
  #ptbl .ttl u{display:inline-block;width:6px;height:6px;border-radius:50%;border:1px solid #9aa0a6;margin-right:4px;vertical-align:middle;text-decoration:none}
  `;
  document.head.append(Object.assign(document.createElement("style"), { textContent: css }));
  const box = document.createElement("div"); box.id = "ptbl";
  let sel = null;
  let opener = null;
  let bypass = false;
  let busy = false;
  let availability = null;
  const render = () => {
    box.replaceChildren();
    const el = (tag, cls, text) => {
      const node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text != null) node.textContent = text;
      return node;
    };
    const hd = el("div", "hd");
    const star = el("span", "", "✦"); star.style.color = "#8ab4f8";
    const x = el("span", "x", "✕"); x.onclick = close;
    hd.append(star, document.createTextNode("Model periodic table"), x);
    const grid = el("div", "g");
    grid.append(el("div"));
    for (let c = 1; c <= 18; c++) grid.append(el("div", "n", c));
    const cells = {};
    EL.forEach((s, i) => { const [r, c] = pos(i + 1); cells[r + "," + c] = [s, i + 1]; });
    cells["6,3"] = ["57–71", 0]; cells["7,3"] = ["89–103", 0];
    for (let r = 1; r <= 10; r++) {
      if (r === 8) { const gap = el("div"); gap.style.gridColumn = "1/-1"; gap.style.height = "8px"; grid.append(gap); continue; }
      const row = el("div", "n", r <= 7 ? r : ""); row.style.alignSelf = "center"; grid.append(row);
      for (let c = 1; c <= 18; c++) {
        const e = cells[r + "," + c];
        if (r >= 9 && c === 2) { grid.append(el("div", "lab", r === 9 ? "Ln" : "An")); continue; }
        if (!e) { grid.append(el("div")); continue; }
        const [s, z] = e, L = LIVE[s];
        const cell = el("div", "c" + (L ? " live" : "") + (L && s === sel ? " sel" : ""));
        if (!z) { cell.style.fontSize = "7px"; cell.style.color = "#80868b"; cell.textContent = s; }
        else {
          cell.append(el("i", "", z), document.createTextNode(s));
          if (L) {
            const available = availability?.[s];
            cell.dataset.s = s; cell.style.borderColor = L[1];
            if (available === false) {
              cell.classList.add("unavailable");
              cell.title = "not in your menu";
              cell.style.background = `repeating-linear-gradient(45deg, ${L[1]}66 0 5px, ${L[1]}22 5px 10px)`;
            } else if (available === true) {
              cell.title = "Gemini 4 " + L[0]; cell.style.background = L[1] + "55";
              cell.onclick = () => pick(s);
            } else {
              cell.classList.add("checking"); cell.title = "Could not check your menu";
              cell.style.background = L[1] + "33";
            }
          }
        }
        grid.append(cell);
      }
    }
    const title = el("div", "ttl", "Gemini 4");
    const small = el("small"), released = el("span"), coming = el("span");
    released.append(el("b"), document.createTextNode(Object.keys(LIVE).length + " released"));
    coming.append(el("u"), document.createTextNode("Coming soon"));
    small.append(released, coming); title.append(small); grid.append(title);
    box.append(hd, grid);
  };

  // Gemini's real opener in the supplied SingleFile snapshot.
  const OPENER = 'button[data-test-id="bard-mode-menu-button"]';
  const findOpener = () => document.querySelector(OPENER)
    || document.querySelector('bard-mode-switcher button[aria-haspopup][aria-label*="mode picker" i]');
  function syncSelection() {
    const label = opener?.getAttribute("aria-label") || opener?.textContent || "";
    const match = Object.entries(LIVE).find(([, [name]]) =>
      new RegExp("\\b" + name + "\\b", "i").test(label));
    sel = match?.[0] || null;
  }
  function position() {
    if (!opener?.isConnected || !box.classList.contains("open")) return;
    const r = opener.getBoundingClientRect();
    const w = box.offsetWidth, h = box.offsetHeight;
    const left = Math.max(8, Math.min(r.left, innerWidth - w - 8));
    const below = r.bottom + 8;
    const top = below + h <= innerHeight - 8 ? below : Math.max(8, r.top - h - 8);
    box.style.left = left + "px";
    box.style.top = top + "px";
  }
  function close() {
    box.classList.remove("open");
    opener?.setAttribute("data-ptbl-open", "false");
  }
  async function toggle(button) {
    opener = button;
    if (box.classList.contains("open")) { close(); return; }
    if (busy) return;
    busy = true;
    try {
      syncSelection();
      // Refresh before showing the table so stale availability can never be clicked.
      await checkAvailability(button);
      if (!button.isConnected) return;
      syncSelection();
      render();
      box.classList.add("open");
      button.setAttribute("data-ptbl-open", "true");
      position();
    } finally { busy = false; }
  }
  const visible = el => !!el.getClientRects().length && getComputedStyle(el).visibility !== "hidden";
  // Real menu rows for locked models stay enabled, so look for lock icons/labels.
  const lockTok = str => { const t = String(str || "").toLowerCase().split(/[^a-z]+/); return (t.includes("lock") || t.includes("locked")) && !t.includes("open") && !t.includes("unlocked"); };
  function isLocked(el) {
    if (lockTok(el.getAttribute("aria-label")) || lockTok(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className)) return true;
    return [...el.querySelectorAll("mat-icon,svg,[aria-label],[class],[data-mat-icon-name],[fonticon]")].some(n =>
      lockTok(n.getAttribute("data-mat-icon-name")) || lockTok(n.getAttribute("fonticon")) || lockTok(n.getAttribute("aria-label")) ||
      lockTok(n.getAttribute("class")) || (n.localName === "mat-icon" && lockTok(n.textContent)) || (n.localName === "svg" && lockTok(n.getAttribute("data-icon") || n.getAttribute("id"))));
  }
  function findItem(name) {
    // The snapshot has the picker closed, so menu entries were not captured.
    // Restrict candidates to the opened menu/overlay and match a model's label.
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const label = new RegExp("(?:^|\\b)(?:Gemini\\s*)?4\\s+" + escaped + "(?:\\b|$)", "i");
    const plain = new RegExp("^" + escaped + "$", "i");
    const roots = [...document.querySelectorAll('[role="menu"], .cdk-overlay-pane, [role="listbox"]')].filter(visible);
    const candidates = roots.flatMap(root => [...root.querySelectorAll('[role="menuitem"],[role="menuitemradio"],[role="option"],button,mat-option')]);
    return candidates.find(el => {
      if (!visible(el) || el.closest('[aria-disabled="true"],[disabled]') || el.disabled || isLocked(el)) return false;
      const text = ((el.getAttribute("aria-label") || "") + " " + el.textContent).replace(/\s+/g, " ").trim();
      // "4 Hydrogen Thinking" is a different menu option from "4 Hydrogen".
      if (name === "Hydrogen" && /\b4\s+Hydrogen\s+Thinking\b/i.test(text) && !/\b4\s+Hydrogen\b(?!\s+Thinking\b)/i.test(text)) return false;
      return label.test(text) || plain.test(text);
    });
  }
  async function checkAvailability(button) {
    const hide = document.createElement("style");
    hide.textContent = ".cdk-overlay-container{opacity:0!important;pointer-events:none!important}";
    document.head.append(hide);
    let foundMenu = false;
    try {
      bypass = true;
      try { button.click(); } finally { bypass = false; }
      // Wait for the actual menu and its entries rather than assuming a frame is enough.
      for (let i = 0; i < 30; i++) {
        const roots = [...document.querySelectorAll('[role="menu"], .cdk-overlay-pane, [role="listbox"]')].filter(visible);
        if (roots.some(root => root.querySelector('[role="menuitem"],[role="menuitemradio"],[role="option"],mat-option'))) {
          foundMenu = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (foundMenu) {
        availability = Object.fromEntries(Object.entries(LIVE).map(([symbol, [name]]) => [symbol, !!findItem(name)]));
      } else {
        availability = null;
      }
    } finally {
      // Escape closes Angular's menu without choosing a model.
      if (button.getAttribute("aria-expanded") === "true") {
        (document.activeElement || button).dispatchEvent(new KeyboardEvent("keydown", {key:"Escape", code:"Escape", keyCode:27, bubbles:true}));
        await new Promise(resolve => setTimeout(resolve, 50));
        if (button.getAttribute("aria-expanded") === "true") {
          bypass = true;
          try { button.click(); } finally { bypass = false; }
        }
      }
      // Keep it hidden during any close animation.
      for (let i = 0; i < 10 && button.getAttribute("aria-expanded") === "true"; i++)
        await new Promise(resolve => setTimeout(resolve, 30));
      hide.remove();
    }
  }
  async function pick(symbol) {
    if (busy || !opener?.isConnected || availability?.[symbol] !== true) return;
    busy = true;
    const button = opener, name = LIVE[symbol][0];
    close();
    bypass = true;
    try { button.click(); } finally { bypass = false; }
    let item;
    for (let i = 0; i < 30 && !(item = findItem(name)); i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (item) {
      item.click();
    } else {
      if (button.getAttribute("aria-expanded") === "true") {
        bypass = true;
        try { button.click(); } finally { bypass = false; }
      }
      syncSelection();
      availability = {...availability, [symbol]: false};
      render();
      box.classList.add("open");
      position();
    }
    busy = false;
  }
  // Delegate at capture phase, so dynamically replaced Angular buttons work too.
  document.addEventListener("click", event => {
    if (bypass) return;
    const button = event.target instanceof Element ? event.target.closest(OPENER + ', bard-mode-switcher button[aria-haspopup][aria-label*="mode picker" i]') : null;
    if (button) {
      event.preventDefault();
      event.stopImmediatePropagation();
      toggle(button);
    } else if (!box.contains(event.target)) close();
  }, true);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && box.classList.contains("open")) close();
  });
  addEventListener("resize", position);
  addEventListener("scroll", position, true);
  // Observe the SPA replacing the picker and changing its current model.
  const observer = new MutationObserver(() => {
    const current = findOpener();
    if (opener && current !== opener && box.classList.contains("open")) close();
    opener = current;
    if (box.classList.contains("open")) position();
  });
  function start() {
    if (!document.body) return;
    document.body.append(box);
    opener = findOpener();
    observer.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ["aria-label"]});
  }
  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, {once:true});
})();
