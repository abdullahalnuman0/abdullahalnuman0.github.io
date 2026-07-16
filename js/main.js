/* ============================================================
   Abdullah Al Numan — Portfolio
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Theme ---------------- */
  const Theme = {
    KEY: 'aan-theme',

    init() {
      const saved = localStorage.getItem(this.KEY);
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      this.apply(saved || (prefersLight ? 'light' : 'dark'));

      $('#theme-toggle')?.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
        this.apply(next);
        localStorage.setItem(this.KEY, next);
      });

      // Follow the OS only while the user hasn't picked a theme themselves.
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        if (!localStorage.getItem(this.KEY)) this.apply(e.matches ? 'light' : 'dark');
      });
    },

    apply(theme) {
      document.documentElement.dataset.theme = theme;
    }
  };

  /* ---------------- Mobile nav ---------------- */
  const Nav = {
    init() {
      const burger = $('#nav-burger');
      const links  = $('#nav-links');
      const nav    = $('#nav');
      if (!burger || !links) return;

      const close = () => {
        burger.classList.remove('is-open');
        links.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Open menu');
      };

      burger.addEventListener('click', () => {
        const open = links.classList.toggle('is-open');
        burger.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });

      $$('.nav__link', links).forEach((a) => a.addEventListener('click', close));

      document.addEventListener('click', (e) => {
        if (!nav.contains(e.target)) close();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
      });

      // A resize past the mobile breakpoint should drop the menu state.
      window.addEventListener('resize', () => {
        if (window.innerWidth > 900) close();
      });
    }
  };

  /* ---------------- Scroll state: nav shadow + back-to-top ---------------- */
  const ScrollFx = {
    init() {
      const nav   = $('#nav');
      const toTop = $('#to-top');
      let ticking = false;

      const update = () => {
        const y = window.scrollY;
        nav?.classList.toggle('is-scrolled', y > 10);
        toTop?.classList.toggle('is-visible', y > 600);
        ticking = false;
      };

      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      }, { passive: true });

      update();

      toTop?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  };

  /* ---------------- Active nav link ---------------- */
  const ActiveLink = {
    init() {
      const links = $$('.nav__link');
      const map = new Map();
      links.forEach((l) => {
        const id = l.getAttribute('href');
        if (id?.startsWith('#')) {
          const section = $(id);
          if (section) map.set(section, l);
        }
      });
      if (!map.size) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            links.forEach((l) => l.classList.remove('is-active'));
            map.get(entry.target)?.classList.add('is-active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

      map.forEach((_, section) => observer.observe(section));
    }
  };

  /* ---------------- Reveal on scroll ---------------- */
  const Reveal = {
    init() {
      const items = $$('.reveal');
      if (!items.length) return;

      if (reduceMotion || !('IntersectionObserver' in window)) {
        items.forEach((el) => el.classList.add('is-visible'));
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
          if (!entry.isIntersecting) return;
          // Stagger items that scroll into view together.
          setTimeout(() => entry.target.classList.add('is-visible'), i * 70);
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

      items.forEach((el) => observer.observe(el));
    }
  };

  /* ---------------- Typing effect ---------------- */
  const Typer = {
    phrases: [
      'native Android apps.',
      'Spring Boot APIs.',
      'apps and the backends behind them.',
      'with Kotlin & Jetpack Compose.',
      'for Android, iOS & Desktop.'
    ],

    init() {
      const el = $('#typed');
      if (!el) return;

      if (reduceMotion) {
        el.textContent = this.phrases[0];
        return;
      }

      let phrase = 0;
      let char = 0;
      let deleting = false;

      const tick = () => {
        const current = this.phrases[phrase];
        char += deleting ? -1 : 1;
        el.textContent = current.slice(0, char);

        let delay = deleting ? 35 : 65;

        if (!deleting && char === current.length) {
          delay = 1900;            // hold the finished phrase
          deleting = true;
        } else if (deleting && char === 0) {
          deleting = false;
          phrase = (phrase + 1) % this.phrases.length;
          delay = 350;
        }

        setTimeout(tick, delay);
      };

      setTimeout(tick, 700);
    }
  };

  /* ---------------- Project filter ---------------- */
  const Filter = {
    init() {
      const buttons = $$('.filter');
      const cards = $$('.p-card');
      if (!buttons.length || !cards.length) return;

      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const want = btn.dataset.filter;

          buttons.forEach((b) => {
            const on = b === btn;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-selected', String(on));
          });

          cards.forEach((card) => {
            const cats = (card.dataset.cat || '').split(/\s+/);
            const show = want === 'all' || cats.includes(want);

            card.classList.remove('is-entering');
            card.classList.toggle('is-hidden', !show);

            if (show && !reduceMotion) {
              // Restart the entry animation on every pass through the filter.
              void card.offsetWidth;
              card.classList.add('is-entering');
            }
          });
        });
      });
    }
  };

  /* ---------------- Count-up stats ---------------- */
  const Counter = {
    init() {
      const nums = $$('.stat__num');
      if (!nums.length) return;

      if (reduceMotion || !('IntersectionObserver' in window)) {
        nums.forEach((n) => (n.textContent = n.dataset.count));
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          this.run(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.5 });

      nums.forEach((n) => observer.observe(n));
    },

    run(el) {
      const target = parseInt(el.dataset.count, 10);
      if (Number.isNaN(target)) return;

      // Years read as a label, not a quantity — count from something near it.
      const isYear = target > 1900;
      const from = isYear ? target - 12 : 0;
      const duration = 1400;
      const start = performance.now();

      const frame = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(from + (target - from) * eased);
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = target;
      };

      requestAnimationFrame(frame);
    }
  };

  /* ---------------- Footer year ---------------- */
  const Year = {
    init() {
      const el = $('#year');
      if (el) el.textContent = new Date().getFullYear();
    }
  };

  /* ---------------- Boot ---------------- */
  const boot = () => {
    Theme.init();
    Nav.init();
    ScrollFx.init();
    ActiveLink.init();
    Reveal.init();
    Typer.init();
    Filter.init();
    Counter.init();
    Year.init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
