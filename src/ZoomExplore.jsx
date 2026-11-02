import { useEffect, useMemo, useRef, useState } from 'react';

/* ---------- TUNING KNOBS ---------- */
const UNIT_VH = 150;  // scroll distance (vh) per category
const HOLD = 0.25;    // how long each image stays still before zooming on (in units)
const ZOOM_OUT = 1.0; // how much the current image grows while flying past (1 = up to 2x)
const ZOOM_IN = 0.12; // next image starts this much smaller (0.12 = 88%)

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => { const x = clamp(t); return x * x * (3 - 2 * x); };

export default function ZoomExplore({ categories, data, onOpen, bgFor }) {
  const N = categories.length;       // slide 0 = intro, slides 1..N = categories
  const TMAX = N + HOLD;

  const wrapRef = useRef(null);
  const nodes = useRef([]);
  const [active, setActive] = useState(0);

  const slides = useMemo(
    () => [{ kind: 'intro' }, ...categories.map((c, i) => ({ kind: 'cat', c, i }))],
    [categories]
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    let target = 0, current = 0, raf = 0, lastActive = -1;

    const render = (T) => {
      slides.forEach((_, i) => {
        const el = nodes.current[i];
        if (!el) return;

        const u = T - i; // < 0: still coming in, > 0: already passing
        let s, o;
        if (u < 0) {
          const e = smooth((u + 0.75) / 0.5);          // coming in from behind
          s = 1 - ZOOM_IN + ZOOM_IN * e;
          o = smooth(e * 1.6);
        } else {
          const e = smooth((u - HOLD) / 0.5);          // camera flies through it
          s = 1 + ZOOM_OUT * e;
          o = 1 - e;
        }

        el.style.transform = `scale(${s})`;
        el.style.opacity = o;
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
        el.style.zIndex = u >= 0 ? 20 : 10;
        el.style.pointerEvents = o > 0.9 && Math.abs(u) < HOLD ? 'auto' : 'none';
      });

      const a = clamp(Math.round(T), 0, N);
      if (a !== lastActive) { lastActive = a; setActive(a); }
    };

    const readTarget = () => {
      const range = wrap.offsetHeight - window.innerHeight;
      target = clamp(-wrap.getBoundingClientRect().top / range) * TMAX;
    };

    // ease the camera toward the scroll position so motion stays smooth
    const tick = () => {
      current += (target - current) * 0.1;
      if (Math.abs(target - current) < 0.0004) current = target;
      render(current);
      raf = current === target ? 0 : requestAnimationFrame(tick);
    };

    const onScroll = () => { readTarget(); if (!raf) raf = requestAnimationFrame(tick); };
    const onResize = () => { readTarget(); render(current); };

    readTarget();
    current = target;
    render(current);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, [slides, N, TMAX]);

  const jumpTo = (k) => {
    const top = wrapRef.current.offsetTop + (k * UNIT_VH / 100) * window.innerHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <section
      id="explore"
      className="zoom"
      ref={wrapRef}
      style={{ height: `${100 + TMAX * UNIT_VH}vh` }}
    >
      <div className="zoom-stage">
        {slides.map((s, i) => (
          <div
            key={s.kind === 'intro' ? 'intro' : s.c.id}
            className="zlayer"
            ref={(el) => (nodes.current[i] = el)}
          >
            {s.kind === 'intro' ? (
          <div className="zintro">
            <h2>Select your category</h2>
            <p>Keep scrolling to fly through each one. Click a category to open its places.</p>
            <span className="scroll-hint">↓</span>
          </div>
            ) : (
              <button
                className="zslide"
                style={{ backgroundImage: bgFor(s.c.id, s.i) }}
                onClick={() => onOpen(s.c.id, 0)}
              >
                <span className="zslide-text">
                  <h3>{s.c.title}</h3>
                  <p>{s.c.sub}</p>
                  <span className="cloud-cta">{data[s.c.id].length} places →</span>
                </span>
              </button>
            )}
          </div>
        ))}

        <div className="zoom-rail" role="group" aria-label="Jump to category">
          {categories.map((c, i) => (
            <button
              key={c.id}
              className={active === i + 1 ? 'on' : ''}
              aria-label={c.title}
              title={c.title}
              onClick={() => jumpTo(i + 1)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}