/**
 * main.js
 * ------------------------------------------------------------------
 * Mobile nav, services content, testimonials carousel, contact form
 * validation + submission, footer/social link binding.
 * ------------------------------------------------------------------
 */
(function () {
  const cfg = window.SITE_CONFIG || {};

  /* ------------------------------ Mobile Nav ------------------------------- */
  const navToggle = document.getElementById("navToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  navToggle.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open);
    navToggle.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  mobileMenu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      document.body.style.overflow = "";
    }),
  );

  /* -------------------------------- Icons ---------------------------------- */
  const ICONS = {
    "fine-arts":
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21c1-4 3-9 8-14 2 1 3 2 4 4-5 5-10 7-14 8-.6.1-1-.2-.9-.8"/><path d="M15 5l4 4"/><circle cx="18" cy="4" r="2"/></svg>',
    "graphic-design":
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8M12 16v4"/></svg>',
    digital:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4L12 2z"/></svg>',
  };

  /* ------------------------------ Services Data ----------------------------- */
  const SERVICES = {
    "fine-arts": [
      [
        "Pencil Portraits",
        "Graphite likenesses built from light, shadow and a steady hand.",
      ],
      [
        "Charcoal Portraits",
        "Bold, expressive tonal portraits with dramatic depth.",
      ],
      ["Oil Paintings", "Rich, layered oil work for lasting statement pieces."],
      [
        "Acrylic Paintings",
        "Vivid, fast-drying acrylic work for bold color palettes.",
      ],
      [
        "Watercolor Paintings",
        "Light, luminous washes for a softer, airy feel.",
      ],
      [
        "Canvas Paintings",
        "Gallery-ready canvas pieces in your choice of medium.",
      ],
      ["Realistic Portraits", "Hyper-detailed, photo-accurate likeness work."],
      ["Family Portraits", "Group compositions that capture a shared moment."],
      ["Pet Portraits", "Character-filled portraits of the family pet."],
      [
        "Customized Portraits",
        "Fully bespoke concepts built around your brief.",
      ],
      [
        "Wall Paintings",
        "Statement pieces sized and styled for a specific wall.",
      ],
      ["Murals", "Large-scale hand-painted murals for homes and businesses."],
    ],
    "graphic-design": [
      ["Logo Design", "A distinct mark built to work at any size."],
      ["Brand Identity", "Complete visual systems — color, type, and voice."],
      [
        "Business Cards",
        "First-impression print design that fits in a pocket.",
      ],
      ["Flyers", "Clear, eye-catching flyers for events and promotions."],
      ["Posters", "Bold poster layouts built to stop a scroll or a hallway."],
      ["Brochures", "Structured, informative brochures that read well."],
      ["Banner Design", "Web and print banners sized to your placements."],
      ["Packaging Design", "Shelf-ready packaging that earns a second look."],
      ["Book Cover Design", "Covers that set the tone before page one."],
      ["Album Cover Design", "Artwork that matches the sound."],
      ["Invitation Cards", "Considered invitations for any occasion."],
      [
        "Wedding Invitations",
        "A visual language for your wedding, start to finish.",
      ],
      ["Resume Design", "Resumes that read clearly and stand out fairly."],
      [
        "Presentation Design",
        "Slide decks built to support the story, not distract.",
      ],
      ["Social Media Posts", "On-brand posts designed for the feed."],
      [
        "Social Media Banners",
        "Profile and cover art sized for every platform.",
      ],
      [
        "Advertisement Designs",
        "Ad creative built around a single clear message.",
      ],
    ],
    digital: [
      ["Photo Editing", "Color, exposure and composition refinement."],
      [
        "Photo Restoration",
        "Bringing damaged or faded photographs back to life.",
      ],
      ["Photo Retouching", "Detail-level cleanup for portraits and products."],
      ["Digital Illustrations", "Original illustration work for any use case."],
      ["Vector Art", "Crisp, scalable vector artwork and icons."],
      ["AI Image Enhancement", "Upscaling and refinement using modern tools."],
    ],
  };

  const serviceGrid = document.getElementById("serviceGrid");
  const serviceTabs = document.getElementById("serviceTabs");

  function renderServices(cat) {
    serviceGrid.innerHTML = SERVICES[cat]
      .map(
        ([title, desc]) => `
      <div class="service-card" data-reveal="up">
        <div class="service-icon">${ICONS[cat]}</div>
        <h4>${title}</h4>
        <p>${desc}</p>
      </div>
    `,
      )
      .join("");
    serviceGrid
      .querySelectorAll(".service-card")
      .forEach((el) => window.observeReveal && window.observeReveal(el));
  }
  renderServices("fine-arts");

  serviceTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".service-tab");
    if (!btn) return;
    serviceTabs
      .querySelectorAll(".service-tab")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderServices(btn.dataset.cat);
  });

  /* --------------------------- Testimonial Carousel --------------------------- */
  const track = document.getElementById("testiTrack");
  const dotsWrap = document.getElementById("testiDots");
  const slides = track.children.length;
  let current = 0;
  let autoplay;

  for (let i = 0; i < slides; i++) {
    const dot = document.createElement("button");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  }

  function goTo(i) {
    current = i;
    track.style.transform = `translateX(-${i * 100}%)`;
    dotsWrap
      .querySelectorAll("button")
      .forEach((d, idx) => d.classList.toggle("active", idx === i));
  }

  function startAutoplay() {
    autoplay = setInterval(() => goTo((current + 1) % slides), 5000);
  }
  function stopAutoplay() {
    clearInterval(autoplay);
  }

  track.parentElement.addEventListener("mouseenter", stopAutoplay);
  track.parentElement.addEventListener("mouseleave", startAutoplay);
  startAutoplay();

  /* -------------------------------- Contact Form ------------------------------- */
  const form = document.getElementById("contactForm");
  const submitBtn = document.getElementById("submitBtn");
  const toast = document.getElementById("toast");

  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.toggle("error", isError);
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 4000);
  }

  function validateField(field, testFn) {
    const group = field.closest(".form-group");
    const valid = testFn(field.value.trim());
    group.classList.toggle("invalid", !valid);
    return valid;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("cName");
    const email = document.getElementById("cEmail");
    const service = document.getElementById("cService");
    const message = document.getElementById("cMessage");

    const validName = validateField(name, (v) => v.length > 1);
    const validEmail = validateField(email, (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    );
    const validService = validateField(service, (v) => v.length > 0);
    const validMessage = validateField(message, (v) => v.length > 4);

    if (!(validName && validEmail && validService && validMessage)) {
      showToast("Please check the highlighted fields.", true);
      return;
    }

    submitBtn.classList.add("loading");
    try {
      await window.db.createInquiry({
        name: name.value.trim(),
        email: email.value.trim(),
        phone: document.getElementById("cPhone").value.trim(),
        service: service.value,
        message: message.value.trim(),
        read: false,
      });
      showToast("Message sent — thank you! I'll be in touch soon.");
      form.reset();
    } catch (err) {
      console.error(err);
      showToast("Something went wrong. Please try again.", true);
    } finally {
      submitBtn.classList.remove("loading");
    }
  });

  /* ------------------------------ Social + Footer -------------------------------- */
  const bindings = {
    contactEmail: `mailto:${cfg.email}`,
    contactPhone: `tel:${cfg.phone}`,
    contactWhatsapp: cfg.whatsapp,
    socialInstagram: cfg.instagram,
    footerInstagram: cfg.instagram,
    socialFacebook: cfg.facebook,
    footerFacebook: cfg.facebook,
    socialBehance: cfg.behance,
    footerBehance: cfg.behance,
    socialLinkedin: cfg.linkedin,
    footerLinkedin: cfg.linkedin,
  };
  Object.entries(bindings).forEach(([id, href]) => {
    const el = document.getElementById(id);
    if (el && href) el.href = href;
  });
  const emailEl = document.getElementById("contactEmail");
  if (emailEl && cfg.email) emailEl.textContent = cfg.email;
  const phoneEl = document.getElementById("contactPhone");
  if (phoneEl && cfg.phone) phoneEl.textContent = cfg.phone;

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
