/**
 * gallery.js
 * ------------------------------------------------------------------
 * Loads artworks from Supabase and renders the masonry gallery.
 * No artwork is ever hardcoded — everything comes from the database.
 * Also drives the filter buttons and the lightbox modal.
 * ------------------------------------------------------------------
 */
(function () {
  const grid = document.getElementById("masonryGrid");
  const filterRow = document.getElementById("filterRow");
  let artworks = [];
  let activeFilter = "all";
  let lightboxIndex = 0;
  let filteredList = [];
  const visibleRows = 5;

  function updateGridScroll() {
    const cards = grid.querySelectorAll(".art-card, .skeleton-card");
    const firstCard = cards[0];

    grid.classList.remove("is-scrollable");
    grid.style.maxHeight = "";
    if (!firstCard) return;

    const gridStyles = getComputedStyle(grid);
    const columns = gridStyles.gridTemplateColumns.split(" ").length;
    const rows = Math.ceil(cards.length / columns);
    if (rows <= visibleRows) return;

    const cardHeight = firstCard.getBoundingClientRect().height;
    const rowGap = parseFloat(gridStyles.rowGap) || 0;
    grid.style.maxHeight = `${cardHeight * visibleRows + rowGap * (visibleRows - 1)}px`;
    grid.classList.add("is-scrollable");
  }

  async function loadGallery() {
    try {
      artworks = await window.db.getArtworks();
      renderGrid();
    } catch (err) {
      console.error("Failed to load artworks:", err);
      grid.innerHTML = `<p class="gallery-error">We couldn't load the gallery right now. Please refresh, or check back shortly.</p>`;
    }
  }

  function renderGrid() {
    filteredList =
      activeFilter === "all"
        ? artworks
        : artworks.filter((a) => a.category === activeFilter);

    if (filteredList.length === 0) {
      grid.innerHTML = `<p class="gallery-empty">No pieces in this category yet — check back soon.</p>`;
      updateGridScroll();
      return;
    }

    grid.scrollTop = 0;
    grid.innerHTML = "";
    filteredList.forEach((art, i) => {
      const card = document.createElement("div");
      card.className = "art-card";
      card.dataset.index = i;
      card.innerHTML = `
        <figure>
          <img src="${art.image_url}" alt="${escapeHtml(art.title)}" loading="lazy">
          <span class="art-badge">${escapeHtml(art.category)}</span>
          <figcaption class="art-overlay">
            <h4>${escapeHtml(art.title)}</h4>
          </figcaption>
        </figure>
      `;
      card.addEventListener("click", () => openLightbox(i));
      grid.appendChild(card);
      window.observeReveal
        ? window.observeReveal(card)
        : card.classList.add("visible");

      // Fade card in once its image has loaded
      const img = card.querySelector("img");
      img.addEventListener("load", () => card.classList.add("visible"));
      if (img.complete) card.classList.add("visible");
    });

    requestAnimationFrame(updateGridScroll);
  }

  function escapeHtml(str = "") {
    return String(str).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }

  /* ------------------------------ Filters -------------------------------- */
  filterRow.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    filterRow
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    renderGrid();
  });

  /* ------------------------------ Lightbox -------------------------------- */
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightboxImg");
  const lbTitle = document.getElementById("lightboxTitle");
  const lbDesc = document.getElementById("lightboxDesc");
  const lbCategory = document.getElementById("lightboxCategory");
  const lbYear = document.getElementById("lightboxYear");

  function openLightbox(index) {
    lightboxIndex = index;
    populateLightbox();
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function populateLightbox() {
    const art = filteredList[lightboxIndex];
    if (!art) return;
    lbImg.src = art.image_url;
    lbImg.alt = art.title;
    lbTitle.textContent = art.title;
    lbDesc.textContent = art.description || "";
    lbCategory.textContent = art.category;
    lbYear.textContent = art.year_created ? `Year: ${art.year_created}` : "";
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
  }

  document
    .getElementById("lightboxClose")
    .addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.getElementById("lightboxPrev").addEventListener("click", () => {
    lightboxIndex =
      (lightboxIndex - 1 + filteredList.length) % filteredList.length;
    populateLightbox();
  });
  document.getElementById("lightboxNext").addEventListener("click", () => {
    lightboxIndex = (lightboxIndex + 1) % filteredList.length;
    populateLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") document.getElementById("lightboxPrev").click();
    if (e.key === "ArrowRight") document.getElementById("lightboxNext").click();
  });

  let resizeFrame;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(updateGridScroll);
  });

  requestAnimationFrame(updateGridScroll);
  loadGallery();
})();
