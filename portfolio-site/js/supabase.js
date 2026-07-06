/**
 * supabase.js
 * ------------------------------------------------------------------
 * Thin wrapper around the Supabase JS client.
 * Loaded after the Supabase UMD script and config.js.
 * Exposes `window.db` with everything the gallery + admin need.
 * ------------------------------------------------------------------
 */
(function () {
  const { createClient } = supabase; // global from CDN UMD build

  const client = createClient(
    window.SUPABASE_CONFIG.url,
    window.SUPABASE_CONFIG.anonKey,
  );

  const TABLE = window.SUPABASE_CONFIG.table;
  const BUCKET = window.SUPABASE_CONFIG.storageBucket;

  /* ---------------------------- Auth ---------------------------- */

  async function signIn(email, password) {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  async function getSession() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  function onAuthChange(callback) {
    client.auth.onAuthStateChange((_event, session) => callback(session));
  }

  /* -------------------------- Artworks --------------------------- */

  async function getArtworks({ category = null } = {}) {
    let query = client
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async function getFeaturedArtworks() {
    const { data, error } = await client
      .from(TABLE)
      .select("*")
      .eq("featured", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async function getArtworkById(id) {
    const { data, error } = await client
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  async function createArtwork(record, file) {
    let image_url = record.image_url || null;

    if (file) {
      image_url = await uploadImage(file);
    }

    const { data, error } = await client
      .from(TABLE)
      .insert([{ ...record, image_url }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function updateArtwork(id, record, file) {
    const payload = { ...record };

    if (file) {
      payload.image_url = await uploadImage(file);
    }

    const { data, error } = await client
      .from(TABLE)
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteArtwork(id) {
    const { error } = await client.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  }

  async function uploadImage(file) {
    const ext = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (uploadError) throw uploadError;

    const { data } = client.storage.from(BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
  }

  /* -------------------------- Contact Inquiries ------------------------- */
  const INQUIRIES_TABLE = "inquiries";

  async function createInquiry(record) {
    // Public insert — no auth required, so visitors can submit the form.
    const { data, error } = await client
      .from(INQUIRIES_TABLE)
      .insert([record])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function getInquiries() {
    // Requires an authenticated session (admin) — protected by RLS.
    const { data, error } = await client
      .from(INQUIRIES_TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async function markInquiryRead(id, read = true) {
    const { data, error } = await client
      .from(INQUIRIES_TABLE)
      .update({ read })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteInquiry(id) {
    const { error } = await client.from(INQUIRIES_TABLE).delete().eq("id", id);
    if (error) throw error;
  }

  window.db = {
    signIn,
    signOut,
    getSession,
    onAuthChange,
    getArtworks,
    getFeaturedArtworks,
    getArtworkById,
    createArtwork,
    updateArtwork,
    deleteArtwork,
    createInquiry,
    getInquiries,
    markInquiryRead,
    deleteInquiry,
  };
})();
