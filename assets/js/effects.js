(function () {
  'use strict';

  // ── Scroll reveal (IntersectionObserver) ──────────────────────────────────────
  function initScrollReveal() {
    if (!window.IntersectionObserver) return;

    const els = document.querySelectorAll('.pub-card, .info-box');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('sr-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    els.forEach((el, i) => {
      el.classList.add('sr-hidden');
      el.style.transitionDelay = (i % 3) * 0.1 + 's';
      obs.observe(el);
    });
  }

  // ── Section heading underline grow ────────────────────────────────────────────
  function initHeadingLines() {
    if (!window.IntersectionObserver) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.post h2').forEach((h) => obs.observe(h));
  }

  // ── Typewriter for tagline ────────────────────────────────────────────────────
  function initTypewriter() {
    const tagline = document.querySelector('.tagline');
    if (!tagline) return;

    const text = tagline.textContent.trim();
    if (!text) return;

    tagline.textContent = '';

    const cursor = document.createElement('span');
    cursor.className = 'tw-cursor';
    tagline.appendChild(cursor);

    let i = 0;
    const type = () => {
      if (i < text.length) {
        cursor.insertAdjacentText('beforebegin', text[i++]);
        setTimeout(type, 60 + Math.random() * 50);
      } else {
        cursor.classList.add('tw-done');
      }
    };

    setTimeout(type, 700);
  }

  // ── Cursor spotlight (smooth lag follow) ─────────────────────────────────────
  function initCursorSpotlight() {
    const spot = document.createElement('div');
    spot.className = 'cursor-spotlight';
    document.body.appendChild(spot);

    let tx = -9999, ty = -9999;
    let cx = -9999, cy = -9999;
    let hidden = true;

    document.addEventListener('mousemove', (e) => {
      if (hidden) {
        cx = e.clientX; cy = e.clientY;
        hidden = false;
      }
      tx = e.clientX;
      ty = e.clientY;
    });

    document.addEventListener('mouseleave', () => { hidden = true; });

    const tick = () => {
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      spot.style.transform = `translate(${cx - 280}px, ${cy - 280}px)`;
      spot.style.opacity = hidden ? '0' : '1';
      requestAnimationFrame(tick);
    };
    tick();
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initHeadingLines();
    initTypewriter();
    initCursorSpotlight();
  });
})();
