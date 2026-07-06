/**
 * animations.js
 * ------------------------------------------------------------------
 * All motion for the public site: page loader, Lenis smooth scroll,
 * scroll-triggered reveals (IntersectionObserver), navbar behavior,
 * counters, skill bars, magnetic buttons, ripple clicks, scroll
 * progress bar and back-to-top ring.
 * Respects prefers-reduced-motion throughout.
 * ------------------------------------------------------------------
 */
(function () {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* ------------------------------ Loader ------------------------------ */
  window.addEventListener("load", () => {
    const loader = document.getElementById("loader");
    setTimeout(
      () => loader && loader.classList.add("hidden"),
      reduceMotion ? 0 : 900,
    );
  });

  /* --------------------------- Smooth Scroll --------------------------- */
  let lenis;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
  window.__lenis = lenis;

  /* ------------------------------ Navbar -------------------------------- */
  const navbar = document.getElementById("navbar");
  const backToTop = document.getElementById("backToTop");
  const progressBar = document.getElementById("scroll-progress");

  function onScroll() {
    const y = window.scrollY;
    navbar && navbar.classList.toggle("scrolled", y > 40);
    backToTop && backToTop.classList.toggle("show", y > 500);

    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docH > 0 ? (y / docH) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + "%";
    if (backToTop) backToTop.style.setProperty("--p", pct + "%");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  backToTop &&
    backToTop.addEventListener("click", () => {
      if (lenis) lenis.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });

  /* Active nav link on scroll */
  const sections = document.querySelectorAll("main section[id], main #home");
  const navLinks = document.querySelectorAll(".nav-links a");
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((l) =>
            l.classList.toggle(
              "active",
              l.getAttribute("href") === `#${entry.target.id}`,
            ),
          );
        }
      });
    },
    { rootMargin: "-45% 0px -45% 0px" },
  );
  sections.forEach((s) => s.id && sectionObserver.observe(s));

  /* --------------------------- Scroll Reveals ---------------------------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          // Stagger children if marked
          if (entry.target.classList.contains("stagger")) {
            Array.from(entry.target.children).forEach((child, i) =>
              child.style.setProperty("--i", i),
            );
          }
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  /* Re-observe dynamically injected gallery cards */
  window.observeReveal = function (el) {
    el.setAttribute("data-reveal", el.getAttribute("data-reveal") || "up");
    revealObserver.observe(el);
  };

  /* ------------------------------ Counters -------------------------------- */
  document.querySelectorAll("[data-counter]").forEach((el) => {
    const target = parseInt(el.dataset.target, 10);
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(el, target);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
  });

  function animateCounter(el, target) {
    if (reduceMotion) {
      el.textContent = target;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ----------------------------- Skill Bars -------------------------------- */
  document.querySelectorAll("[data-skill]").forEach((el) => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.width = entry.target.dataset.skill + "%";
            obs.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
  });

  /* --------------------------- Magnetic Buttons ----------------------------- */
  if (!reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.25;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });
  }

  /* ------------------------------- Ripple ----------------------------------- */
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.left = e.clientX - rect.left + "px";
      ripple.style.top = e.clientY - rect.top + "px";
      ripple.style.width = ripple.style.height =
        Math.max(rect.width, rect.height) + "px";
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  });
})();
