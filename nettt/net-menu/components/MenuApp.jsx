"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { MENU } from "../data/menu";
import { UI, TAG, CART_TXT } from "../data/text";
import { price, imgPath } from "../lib/format";

const CART_KEY = "net-menu-order";

/* ---------- flags ---------- */
function Flag({ lang }) {
  const id = useId().replace(/:/g, "");
  if (lang === "ku") {
    const pts = [];
    for (let i = 0; i < 42; i++) {
      const r = i % 2 ? 4.1 : 6.8;
      const a = -Math.PI / 2 + (i * Math.PI) / 21;
      pts.push((18 + r * Math.cos(a)).toFixed(2) + "," + (12 + r * Math.sin(a)).toFixed(2));
    }
    return (
      <svg viewBox="0 0 36 24" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <rect width="36" height="8" fill="#ED1C24" />
        <rect y="8" width="36" height="8" fill="#fff" />
        <rect y="16" width="36" height="8" fill="#278E43" />
        <polygon points={pts.join(" ")} fill="#FDBA12" />
      </svg>
    );
  }
  if (lang === "ar") {
    return (
      <svg viewBox="0 0 36 24" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <rect width="36" height="8" fill="#CE1126" />
        <rect y="8" width="36" height="8" fill="#fff" />
        <rect y="16" width="36" height="8" fill="#000" />
        <text x="18" y="14.6" fontSize="5.2" textAnchor="middle" fill="#007A3D"
          fontFamily="Noto Kufi Arabic, Vazirmatn, Tahoma, sans-serif" fontWeight="700">الله أكبر</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <clipPath id={"s" + id}><path d="M0,0v30h60v-30z" /></clipPath>
      <clipPath id={"t" + id}><path d="M30,15h30v15zv15h-30zh-30v-15zv-15h30z" /></clipPath>
      <g clipPath={`url(#s${id})`}>
        <path d="M0,0v30h60v-30z" fill="#012169" />
        <path d="M0,0L60,30M60,0L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0L60,30M60,0L0,30" clipPath={`url(#t${id})`} stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0v30M0,15h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0v30M0,15h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

/* ---------- food photo with graceful fallback ---------- */
function Photo({ item, eager }) {
  const src = imgPath(item.img);
  const [bad, setBad] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    setBad(false);
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setBad(true);
  }, [src]);
  if (!src) return null;
  return (
    <>
      {!bad && (
        <img ref={ref} src={src} className="art" alt={item.n.en}
          loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setBad(true)} />
      )}
      {bad && (
        <div className="photo-missing">
          <img src="/images/logo.jpg" className="logo-fallback" alt="NET Caffe & Restaurant" />
        </div>
      )}
    </>
  );
}

/* ---------- quantity buttons ---------- */
function Qty({ k, q, lang, onSet }) {
  const c = CART_TXT[lang];
  return (
    <>
      {q > 0 && (
        <>
          <button className="qbtn minus" type="button" aria-label={c.less}
            onClick={(e) => { e.stopPropagation(); onSet(k, q - 1); }}>&minus;</button>
          <span className="qnum">{price(q, lang)}</span>
        </>
      )}
      <button className="qbtn plus" type="button" aria-label={c.add}
        onClick={(e) => { e.stopPropagation(); onSet(k, q + 1); }}>+</button>
    </>
  );
}

export default function MenuApp() {
  const [screen, setScreen] = useState("picker"); // picker | menu
  const [lang, setLang] = useState("en");
  const [cart, setCart] = useState({});
  const [active, setActive] = useState(MENU[0].id);
  const [lbIdx, setLbIdx] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [splash, setSplash] = useState(false);
  const [splashOut, setSplashOut] = useState(false);
  const [bump, setBump] = useState(0);

  const menuRef = useRef(null);
  const catsRef = useRef(null);
  const chipsRef = useRef(null);
  const titleRef = useRef(null);
  const pickerFirstRef = useRef(null);
  const lastFocus = useRef(null);
  const spy = useRef({ lock: false, settled: false, y: 0, timer: 0 });

  const t = UI[lang];
  const ct = CART_TXT[lang];
  const rtl = lang !== "en";

  /* flat list of every dish (for cart + lightbox) */
  const ALL = useMemo(() => {
    const out = [];
    MENU.forEach((cat) => cat.items.forEach((it) => out.push({ key: cat.id + "|" + it.n.en, it })));
    return out;
  }, []);
  const offsets = useMemo(() => {
    let n = 0;
    return MENU.map((c) => { const o = n; n += c.items.length; return o; });
  }, []);

  /* ---------- cart ---------- */
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
      if (v && typeof v === "object") {
        const valid = {};
        Object.keys(v).forEach((key) => { if (ALL.some((a) => a.key === key)) valid[key] = v[key]; });
        setCart(valid);
      }
    } catch (e) {}
  }, [ALL]);

  const setQty = useCallback((k, q) => {
    const key = ALL[k].key;
    setCart((prev) => {
      const next = { ...prev };
      if (q <= 0) delete next[key]; else next[key] = Math.min(q, 99);
      try { localStorage.setItem(CART_KEY, JSON.stringify(next)); } catch (e) {}
      if (q > (prev[key] || 0)) setBump((b) => b + 1);
      return next;
    });
  }, [ALL]);

  const clearCart = () => {
    setCart({});
    try { localStorage.setItem(CART_KEY, "{}"); } catch (e) {}
  };

  const qtyOf = (k) => cart[ALL[k].key] || 0;
  const cartN = ALL.reduce((s, a) => s + (cart[a.key] || 0), 0);
  const cartTotal = ALL.reduce((s, a) => s + a.it.p * (cart[a.key] || 0), 0);
  const money = (n) => price(n, lang) + " " + t.cur;

  useEffect(() => { if (cartN === 0) setSheetOpen(false); }, [cartN]);

  /* ---------- page scroll lock for popups ---------- */
  const anyOpen = lbIdx !== null || sheetOpen || splash;
  useEffect(() => {
    if (!anyOpen) return;
    const y = window.pageYOffset || document.documentElement.scrollTop || 0;
    const b = document.body.style;
    b.position = "fixed"; b.top = -y + "px"; b.left = "0"; b.right = "0"; b.width = "100%";
    document.documentElement.classList.add("lock");
    return () => {
      document.documentElement.classList.remove("lock");
      b.position = ""; b.top = ""; b.left = ""; b.right = ""; b.width = "";
      const root = document.documentElement;
      const old = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, y);
      requestAnimationFrame(() => { window.scrollTo(0, y); root.style.scrollBehavior = old; });
    };
  }, [anyOpen]);

  /* language picker is a fixed full screen with no page scroll */
  useEffect(() => {
    document.documentElement.classList.toggle("nos", screen === "picker");
    return () => document.documentElement.classList.remove("nos");
  }, [screen]);

  /* ---------- splash ---------- */
  const closeSplash = useCallback(() => {
    if (!splash || splashOut) return;
    setSplashOut(true);
    setTimeout(() => { setSplash(false); setSplashOut(false); }, 450);
    if (titleRef.current) titleRef.current.focus({ preventScroll: true });
  }, [splash, splashOut]);

  useEffect(() => {
    if (!splash) return;
    const id = setTimeout(closeSplash, 2000);
    return () => clearTimeout(id);
  }, [splash, closeSplash]);

  /* ---------- scroll: dock height, parallax, scroll-spy ---------- */
  const measure = useCallback(() => {
    if (catsRef.current && menuRef.current)
      menuRef.current.style.setProperty("--dock-h", catsRef.current.offsetHeight + "px");
  }, []);

  const runSpy = useCallback(() => {
    const s = spy.current;
    if (s.lock) {
      if (!s.settled || Math.abs((window.scrollY || 0) - s.y) < 24) return;
      s.lock = false;
    }
    const secs = document.querySelectorAll("#content .sec");
    if (!secs.length || !catsRef.current) return;
    const dockH = catsRef.current.offsetHeight;
    const line = dockH + (window.innerHeight - dockH) * 0.4;
    let id = secs[0].id.replace("sec-", "");
    secs.forEach((sec) => { if (sec.getBoundingClientRect().top <= line) id = sec.id.replace("sec-", ""); });
    const foot = document.querySelector(".foot");
    if (foot && (window.scrollY || 0) > 0 && foot.getBoundingClientRect().bottom <= window.innerHeight + 4)
      id = secs[secs.length - 1].id.replace("sec-", "");
    setActive(id);
  }, []);

  useEffect(() => {
    if (screen !== "menu") return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!reduce && menuRef.current) menuRef.current.style.setProperty("--sy", window.scrollY || 0);
        runSpy();
      });
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    let ro;
    if (window.ResizeObserver && catsRef.current) { ro = new ResizeObserver(measure); ro.observe(catsRef.current); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      if (ro) ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [screen, measure, runSpy]);

  /* keep the active chip centred */
  useEffect(() => {
    const wrap = chipsRef.current;
    if (!wrap) return;
    const chip = wrap.querySelector(`[data-target="sec-${active}"]`);
    if (!chip) return;
    const a = chip.getBoundingClientRect(), b = wrap.getBoundingClientRect();
    const delta = a.left + a.width / 2 - (b.left + b.width / 2);
    try { wrap.scrollTo({ left: wrap.scrollLeft + delta, behavior: "smooth" }); } catch (e) { wrap.scrollLeft += delta; }
  }, [active, lang, screen]);

  /* cards fade/slide in while scrolling */
  useEffect(() => {
    if (screen !== "menu") return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const cell = en.target, card = cell.firstElementChild;
        if (!card) return;
        if (en.isIntersecting) {
          card.style.transitionDelay = (+cell.getAttribute("data-i") % 3) * 90 + "ms";
          card.classList.remove("rv");
        } else {
          card.style.transitionDelay = "0ms";
          card.style.setProperty("--dy", (en.boundingClientRect.top > 0 ? 32 : -32) + "px");
          card.classList.add("rv");
        }
      });
    }, { rootMargin: "0px 0px -5% 0px", threshold: 0.05 });
    document.querySelectorAll("#content .sec").forEach((sec) =>
      sec.querySelectorAll(".cell").forEach((cell, i) => { cell.setAttribute("data-i", i); io.observe(cell); }));
    return () => io.disconnect();
  }, [screen, lang]);

  const goTo = (id) => {
    const sec = document.getElementById("sec-" + id);
    if (!sec || !catsRef.current) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const s = spy.current;
    s.lock = true; s.settled = false;
    clearTimeout(s.timer);
    s.timer = setTimeout(() => { s.settled = true; s.y = window.scrollY || 0; }, reduce ? 80 : 1100);
    setActive(id);
    const top = sec.getBoundingClientRect().top + (window.scrollY || 0) - catsRef.current.offsetHeight - 6;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
  };

  /* ---------- lightbox ---------- */
  const openPhoto = (k, el) => { lastFocus.current = el || null; setLbIdx(k); };
  const closePhoto = useCallback(() => {
    setLbIdx(null);
    if (lastFocus.current) { try { lastFocus.current.focus({ preventScroll: true }); } catch (e) {} }
  }, []);
  const stepPhoto = useCallback((d) => setLbIdx((i) => (i === null ? i : (i + d + ALL.length) % ALL.length)), [ALL]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (sheetOpen) setSheetOpen(false);
        else if (lbIdx !== null) closePhoto();
        else if (splash) closeSplash();
        return;
      }
      if (lbIdx === null) return;
      if (e.key === "ArrowRight") stepPhoto(rtl ? -1 : 1);
      if (e.key === "ArrowLeft") stepPhoto(rtl ? 1 : -1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen, lbIdx, splash, rtl, closePhoto, closeSplash, stepPhoto]);

  /* ---------- navigation between picker and menu ---------- */
  const pickLang = (l) => {
    setLang(l);
    setActive(MENU[0].id);
    setScreen("menu");
    setSplashOut(false);
    setSplash(true);
    window.scrollTo(0, 0);
  };
  const changeLang = () => {
    closePhoto();
    setSheetOpen(false);
    setScreen("picker");
    window.scrollTo(0, 0);
    setTimeout(() => pickerFirstRef.current && pickerFirstRef.current.focus({ preventScroll: true }), 0);
  };

  const arrow = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  );
  const closeIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
      strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
  );
  const heartPath = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

  const lbItem = lbIdx !== null ? ALL[lbIdx].it : null;

  return (
    <>
      {/* ================= language picker ================= */}
      {screen === "picker" && (
        <main id="picker" className="screen stage fs" lang="en">
          <div className="fs-in">
            <div className="fs-logo"><div className="net net-fs" role="img" aria-label="NET Caffe & Restaurant" /></div>
            <div className="fs-main">
              <header className="fs-title">
                <h1 id="pick-title" className="fs-ku display" lang="ckb" dir="rtl">زمانەکەت هەڵبژێرە</h1>
                <div className="fs-rule" aria-hidden="true"><i /><b className="fs-dia" /><i /></div>
                <p className="fs-sub">
                  <span lang="ar" dir="rtl">اختر لغتك</span><b aria-hidden="true">&#9670;</b>
                  <span lang="en" dir="ltr">Choose your language</span>
                </p>
              </header>
              <ul className="fs-langs">
                {[
                  { l: "ku", tag: "ckb", name: "کوردی", sub: "Kurdish · Sorani" },
                  { l: "ar", tag: "ar", name: "العربية", sub: "Arabic" },
                  { l: "en", tag: "en", name: "English", sub: "English" },
                ].map((o, i) => (
                  <li key={o.l}>
                    <button ref={i === 0 ? pickerFirstRef : null} className="fs-lang" type="button"
                      lang={o.tag} dir="ltr" onClick={() => pickLang(o.l)}>
                      <span className="flag"><Flag lang={o.l} /></span>
                      <span className="fs-name"><b>{o.name}</b><small lang="en">{o.sub}</small></span>
                      <span className="go">{arrow}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      )}

      {/* ================= menu ================= */}
      {screen === "menu" && (
        <div id="menu" ref={menuRef} className={"screen" + (cartN > 0 ? " has-cart" : "")}
          lang={TAG[lang]} dir={rtl ? "rtl" : "ltr"}>
          <header className="bar">
            <div className="wrap wide bar-in">
              <span className="brand">
                <span className="net net-s" role="img" aria-label="NET Caffe & Restaurant" />
                <span className="display">{t.brand}</span>
              </span>
              <button className="change" type="button" aria-label={t.change} onClick={changeLang}>
                <span className="globe">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
                  </svg>
                </span>
                <span>{t.name}</span>
              </button>
            </div>
          </header>

          <nav className="cats" id="cats-nav" ref={catsRef}>
            <div className="wrap wide cats-in" ref={chipsRef}>
              {MENU.map((c) => (
                <button key={c.id} className="chip" type="button" data-target={"sec-" + c.id}
                  aria-current={active === c.id ? "true" : undefined} onClick={() => goTo(c.id)}>
                  {c.name[lang]}
                </button>
              ))}
            </div>
          </nav>

          <section className="hero">
            <div className="wrap wide hero-in">
              <div className="net net-mark" aria-hidden="true" />
              <h1 id="menu-title" className="display" tabIndex={-1} ref={titleRef}>{t.menu}</h1>
              <p className="tag">{t.tag}</p>
              <div className="thanks">
                <span className="heart">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={heartPath} /></svg>
                </span>
                <div><b>{t.thanks}</b><span>{t.enjoy}</span></div>
              </div>
            </div>
          </section>

          <main className="wrap wide" id="content">
            {MENU.map((cat, ci) => (
              <section className="sec" id={"sec-" + cat.id} key={cat.id}>
                <div className="sec-head"><h2 className="display">{cat.name[lang]}</h2><i aria-hidden="true" /></div>
                <div className="grid">
                  {cat.items.map((it, ii) => {
                    const k = offsets[ci] + ii;
                    const hasPhoto = !!imgPath(it.img);
                    return (
                      <div className="cell" key={ALL[k].key}>
                        <article className={"card open" + (hasPhoto ? "" : " no-pic")} role="button" tabIndex={0}
                          aria-label={it.n[lang]}
                          onClick={(e) => { if (!e.target.closest(".buy")) openPhoto(k, e.currentTarget); }}
                          onKeyDown={(e) => {
                            if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
                              e.preventDefault(); openPhoto(k, e.currentTarget);
                            }
                          }}>
                          {hasPhoto && <div className="pic"><Photo item={it} /></div>}
                          <div className="info">
                            <h3>{it.n[lang]}</h3>
                            <p className="desc">{it.d[lang]}</p>
                            <div className="buy">
                              <p className="price">{price(it.p, lang)} <small>{t.cur}</small></p>
                              <span className="qty"><Qty k={k} q={qtyOf(k)} lang={lang} onSet={setQty} /></span>
                            </div>
                          </div>
                        </article>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </main>

          <footer className="foot">
            <div className="wrap wide foot-in">
              <span className="net" role="img" aria-label="NET Caffe & Restaurant" />
              <p><b>{t.thanks}</b><span>{t.note}</span></p>
            </div>
          </footer>

          {/* basket button */}
          {cartN > 0 && (
            <button className="basket" type="button" onClick={() => setSheetOpen(true)}>
              <span className="bag" key={bump}
                style={bump ? { animation: "bump .35s ease" } : undefined}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5.5 8h13l-1.1 12.5H6.6L5.5 8z" /><path d="M9 8V7a3 3 0 0 1 6 0v1" />
                </svg>
                <b className="bn">{price(cartN, lang)}</b>
              </span>
              <span className="bl">{ct.view}</span>
              <span className="bt">{money(cartTotal)}</span>
            </button>
          )}

          {/* order sheet */}
          {sheetOpen && (
            <div className="sheet-wrap" id="sheet">
              <div className="sheet-back" onClick={() => setSheetOpen(false)} />
              <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
                <div className="sheet-band" aria-hidden="true" />
                <header className="sheet-head">
                  <h2 id="sheet-title" className="display">{ct.order}</h2>
                  <button className="sx" type="button" aria-label={t.close} onClick={() => setSheetOpen(false)} autoFocus>{closeIcon}</button>
                </header>
                <ul className="sheet-list">
                  {cartN === 0 && <li className="sempty">{ct.empty}</li>}
                  {ALL.map((a, k) => {
                    const q = cart[a.key];
                    if (!q) return null;
                    return (
                      <li className="srow" key={a.key}>
                        {imgPath(a.it.img) && <span className="sthumb"><Photo item={a.it} /></span>}
                        <div className="sinfo"><b>{a.it.n[lang]}</b><span>{money(a.it.p)} &times; {price(q, lang)}</span></div>
                        <div className="sright">
                          <span className="qty"><Qty k={k} q={q} lang={lang} onSet={setQty} /></span>
                          <b className="sline">{money(a.it.p * q)}</b>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <footer className="sheet-foot">
                  <p className="sheet-total"><span>{ct.total}</span><b>{money(cartTotal)}</b></p>
                  <p className="sheet-note">{ct.note}</p>
                  {cartN > 0 && <button className="ghost" type="button" onClick={clearCart}>{ct.clear}</button>}
                </footer>
              </section>
            </div>
          )}

          {/* thank-you splash */}
          {splash && (
            <div className={"splash" + (splashOut ? " out" : "")} id="splash" role="dialog" aria-modal="true"
              aria-labelledby="splash-title" onClick={closeSplash}>
              <div className="splash-in">
                <div className="splash-logo">
                  <div className="net net-splash" role="img" aria-label="NET Caffe & Restaurant" />
                  <span className="heart badge">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={heartPath} /></svg>
                  </span>
                </div>
                <h2 id="splash-title" className="display">{t.thanks}</h2>
                <p>{t.enjoy}</p>
              </div>
            </div>
          )}

          {/* photo lightbox */}
          {lbItem && (
            <div className="lb" id="lb" role="dialog" aria-modal="true" aria-label={lbItem.n[lang]}
              onClick={(e) => { if (e.target === e.currentTarget) closePhoto(); }}>
              <figure className={"lb-card" + (imgPath(lbItem.img) ? "" : " no-food-photo")}>
                <div className="lb-art">
                  <div className="lb-pic"><Photo item={lbItem} eager /></div>
                  <button className="lb-btn lb-close" type="button" aria-label={t.close} onClick={closePhoto} autoFocus>{closeIcon}</button>
                  <button className="lb-btn lb-prev" type="button" aria-label={t.prev} onClick={() => stepPhoto(-1)}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                  </button>
                  <button className="lb-btn lb-next" type="button" aria-label={t.next} onClick={() => stepPhoto(1)}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
                <figcaption className="lb-cap">
                  <h3>{lbItem.n[lang]}</h3>
                  <p>{lbItem.d[lang]}</p>
                  <div className="lb-buy">
                    <p className="price">{price(lbItem.p, lang)} <small>{t.cur}</small></p>
                    <span className="qty"><Qty k={lbIdx} q={qtyOf(lbIdx)} lang={lang} onSet={setQty} /></span>
                  </div>
                </figcaption>
              </figure>
            </div>
          )}
        </div>
      )}
    </>
  );
}
