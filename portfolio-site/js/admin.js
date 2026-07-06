/**
 * admin.js
 * ------------------------------------------------------------------
 * Gates access behind Supabase Auth, then powers the dashboard: stats,
 * upload form, and the manage-artworks table (edit / delete / feature).
 * This page is never linked from the public nav and should also be
 * excluded from search engines (see <meta name="robots"> in admin.html).
 * ------------------------------------------------------------------
 */
(function () {
  const loginScreen = document.getElementById("loginScreen");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("loginError");

  let allArtworks = [];

  /* -------------------------------- Auth Gate -------------------------------- */
  async function init() {
    try {
      const session = await window.db.getSession();
      if (session) showDashboard();
      else showLogin();
    } catch {
      showLogin();
    }
  }

  function showLogin() {
    loginScreen.style.display = "flex";
    dashboard.classList.remove("active");
  }

  function showDashboard() {
    loginScreen.style.display = "none";
    dashboard.classList.add("active");
    loadAll();
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginBtn.classList.add("loading");
    loginError.classList.remove("show");
    try {
      await window.db.signIn(
        document.getElementById("loginEmail").value.trim(),
        document.getElementById("loginPassword").value,
      );
      showDashboard();
    } catch (err) {
      loginError.textContent = err.message || "Invalid email or password.";
      loginError.classList.add("show");
    } finally {
      loginBtn.classList.remove("loading");
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await window.db.signOut();
    showLogin();
  });

  /* ------------------------------ View Switching ------------------------------ */
  document.querySelectorAll(".sidebar nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".sidebar nav button")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".view")
        .forEach((v) => v.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.view).classList.add("active");
    });
  });

  /* --------------------------------- Toast ------------------------------------ */
  const toast = document.getElementById("adminToast");
  function showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.classList.toggle("error", isError);
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
  }

  /* ------------------------------ Load + Stats --------------------------------- */
  let allInquiries = [];

  async function loadAll() {
    try {
      allArtworks = await window.db.getArtworks();
      renderStats();
      renderRecent();
      renderTable("all");
    } catch (err) {
      showToast("Could not load artworks: " + err.message, true);
    }
    try {
      allInquiries = await window.db.getInquiries();
      renderMessages("all");
      renderUnreadBadge();
    } catch (err) {
      showToast("Could not load messages: " + err.message, true);
    }
  }

  function renderStats() {
    document.getElementById("statTotal").textContent = allArtworks.length;
    document.getElementById("statFeatured").textContent = allArtworks.filter(
      (a) => a.featured,
    ).length;
    document.getElementById("statCategories").textContent = new Set(
      allArtworks.map((a) => a.category),
    ).size;
  }

  function renderRecent() {
    const list = document.getElementById("recentList");
    const recent = allArtworks.slice(0, 5);
    if (recent.length === 0) {
      list.innerHTML =
        '<div class="empty-state">No artworks uploaded yet.</div>';
      return;
    }
    list.innerHTML = recent
      .map(
        (a) => `
      <div class="recent-row">
        <img src="${a.image_url}" alt="">
        <div>
          <div class="title">${a.title}</div>
          <div class="meta">${a.category} ${a.featured ? "· Featured" : ""}</div>
        </div>
      </div>
    `,
      )
      .join("");
  }

  /* -------------------------------- Upload Form ---------------------------------- */
  const uploadForm = document.getElementById("uploadForm");
  const uploadBtn = document.getElementById("uploadBtn");
  const upImage = document.getElementById("upImage");
  const upPreview = document.getElementById("upPreview");

  upImage.addEventListener("change", () => {
    const file = upImage.files[0];
    if (!file) return;
    upPreview.src = URL.createObjectURL(file);
    upPreview.style.display = "block";
  });

  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    uploadBtn.classList.add("loading");
    try {
      const record = {
        title: document.getElementById("upTitle").value.trim(),
        description: document.getElementById("upDesc").value.trim(),
        category: document.getElementById("upCategory").value,
        year_created: document.getElementById("upYear").value.trim(),
        featured: document.getElementById("upFeatured").checked,
      };
      const file = upImage.files[0];
      if (!file) throw new Error("Please choose an image.");

      await window.db.createArtwork(record, file);
      showToast("Artwork uploaded successfully.");
      uploadForm.reset();
      upPreview.style.display = "none";
      loadAll();
    } catch (err) {
      showToast("Upload failed: " + err.message, true);
    } finally {
      uploadBtn.classList.remove("loading");
    }
  });

  /* -------------------------------- Manage Table ---------------------------------- */
  const tableBody = document.getElementById("artworkTableBody");
  const manageEmpty = document.getElementById("manageEmpty");
  const manageFilter = document.getElementById("manageFilter");

  manageFilter.addEventListener("change", () =>
    renderTable(manageFilter.value),
  );

  function renderTable(filter) {
    const rows =
      filter === "all"
        ? allArtworks
        : allArtworks.filter((a) => a.category === filter);
    manageEmpty.style.display = rows.length ? "none" : "block";
    tableBody.innerHTML = rows
      .map(
        (a) => `
      <tr data-id="${a.id}">
        <td><img src="${a.image_url}" alt=""></td>
        <td>${a.title}</td>
        <td>${a.category}</td>
        <td>${a.year_created || "—"}</td>
        <td>${a.featured ? '<span class="badge-featured">Featured</span>' : "—"}</td>
        <td class="row-actions">
          <button class="btn btn-outline" data-action="feature">${a.featured ? "Unfeature" : "Feature"}</button>
          <button class="btn btn-outline" data-action="edit">Edit</button>
          <button class="btn btn-danger" data-action="delete">Delete</button>
        </td>
      </tr>
    `,
      )
      .join("");
  }

  tableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const row = btn.closest("tr");
    const id = row.dataset.id;
    const art = allArtworks.find((a) => String(a.id) === String(id));

    if (btn.dataset.action === "feature") {
      try {
        await window.db.updateArtwork(id, { featured: !art.featured });
        showToast(`Artwork ${!art.featured ? "featured" : "unfeatured"}.`);
        loadAll();
      } catch (err) {
        showToast("Update failed: " + err.message, true);
      }
    }

    if (btn.dataset.action === "delete") {
      if (!confirm(`Delete "${art.title}"? This cannot be undone.`)) return;
      try {
        await window.db.deleteArtwork(id);
        showToast("Artwork deleted.");
        loadAll();
      } catch (err) {
        showToast("Delete failed: " + err.message, true);
      }
    }

    if (btn.dataset.action === "edit") openEditModal(art);
  });

  /* --------------------------------- Edit Modal ----------------------------------- */
  const editModal = document.getElementById("editModal");
  const editForm = document.getElementById("editForm");
  const editCategory = document.getElementById("editCategory");

  // Mirror category options from the upload form
  editCategory.innerHTML = document.getElementById("upCategory").innerHTML;

  function openEditModal(art) {
    document.getElementById("editId").value = art.id;
    document.getElementById("editTitle").value = art.title;
    document.getElementById("editDesc").value = art.description || "";
    editCategory.value = art.category;
    document.getElementById("editYear").value = art.year_created || "";
    document.getElementById("editFeatured").checked = !!art.featured;
    document.getElementById("editImage").value = "";
    editModal.style.display = "flex";
  }

  document
    .getElementById("cancelEdit")
    .addEventListener("click", () => (editModal.style.display = "none"));

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editId").value;
    try {
      const record = {
        title: document.getElementById("editTitle").value.trim(),
        description: document.getElementById("editDesc").value.trim(),
        category: editCategory.value,
        year_created: document.getElementById("editYear").value.trim(),
        featured: document.getElementById("editFeatured").checked,
      };
      const file = document.getElementById("editImage").files[0];
      await window.db.updateArtwork(id, record, file);
      showToast("Artwork updated.");
      editModal.style.display = "none";
      loadAll();
    } catch (err) {
      showToast("Update failed: " + err.message, true);
    }
  });

  /* -------------------------------- Messages ---------------------------------- */
  const messagesTableBody = document.getElementById("messagesTableBody");
  const messagesEmpty = document.getElementById("messagesEmpty");
  const messagesFilter = document.getElementById("messagesFilter");
  const unreadBadge = document.getElementById("unreadBadge");

  messagesFilter.addEventListener("change", () =>
    renderMessages(messagesFilter.value),
  );

  function renderUnreadBadge() {
    const count = allInquiries.filter((m) => !m.read).length;
    unreadBadge.style.display = count > 0 ? "inline" : "none";
    unreadBadge.textContent = count;
  }

  function renderMessages(filter) {
    const rows =
      filter === "unread" ? allInquiries.filter((m) => !m.read) : allInquiries;
    messagesEmpty.style.display = rows.length ? "none" : "block";
    messagesTableBody.innerHTML = rows
      .map(
        (m) => `
      <tr data-id="${m.id}" class="${m.read ? "" : "unread-row"}">
        <td>${m.name}</td>
        <td>${m.email}${m.phone ? "<br>" + m.phone : ""}</td>
        <td>${m.service || "—"}</td>
        <td class="msg-cell">${m.message}</td>
        <td>${new Date(m.created_at).toLocaleDateString()}</td>
        <td class="row-actions">
          <button class="btn btn-outline" data-action="toggle-read">${m.read ? "Mark Unread" : "Mark Read"}</button>
          <button class="btn btn-danger" data-action="delete-msg">Delete</button>
        </td>
      </tr>
    `,
      )
      .join("");
  }

  messagesTableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const row = btn.closest("tr");
    const id = row.dataset.id;
    const msg = allInquiries.find((m) => String(m.id) === String(id));

    if (btn.dataset.action === "toggle-read") {
      try {
        await window.db.markInquiryRead(id, !msg.read);
        allInquiries = await window.db.getInquiries();
        renderMessages(messagesFilter.value);
        renderUnreadBadge();
      } catch (err) {
        showToast("Update failed: " + err.message, true);
      }
    }

    if (btn.dataset.action === "delete-msg") {
      if (!confirm(`Delete message from "${msg.name}"?`)) return;
      try {
        await window.db.deleteInquiry(id);
        allInquiries = allInquiries.filter((m) => String(m.id) !== String(id));
        renderMessages(messagesFilter.value);
        renderUnreadBadge();
        showToast("Message deleted.");
      } catch (err) {
        showToast("Delete failed: " + err.message, true);
      }
    }
  });

  init();
})();
