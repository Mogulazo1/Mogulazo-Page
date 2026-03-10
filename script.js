const prankKey = "mogulazo-instagram-prank";
const instagramPrank = document.getElementById("instagramPrank");
const prankToast = document.getElementById("prankToast");

const YOUTUBE_CONFIG = {
  apiKey: "AIzaSyDbsg9AA0ozf2O7_BZGW7hPNHnh7z-YucQ",
  channelUrl: "https://www.youtube.com/@MoguIazo",
  channelHandle: "",
  channelId: ""
};

const SUGGESTIONS_CONFIG = {
  // Completa estos datos de tu proyecto para activar Supabase.
  supabaseUrl: "https://fwfwfpdneltpwtemabko.supabase.co",
  supabaseAnonKey: "sb_publishable_jOEIyflnooJoE4PQdFvB4Q_brJMHVz4",
  tableName: "challenge_suggestions",
  // Opcional: ademas de guardar en BD, abre app de correo.
  sendByMailto: false,
  recipientEmail: "",
  subject: "Sugerencia para Mogulazo"
};

const DEV_MODE_CONFIG = {
  allowedEmails: ["lautaroull2010@gmail.com", "lautaro_ull@hotmail.com"],
  password: ""
};

const SUGGESTION_MAX = 5000;
const SUGGESTION_STATUS_NEW = "new";
const SUGGESTION_STATUS_PENDING = "pending";
const SUGGESTION_STATUS_COMPLETED = "completed";
const LOCAL_STORAGE_KEY = "mogulazo-suggestions-v1";

const latestYoutubeEmbed = document.getElementById("latestYoutubeEmbed");
const latestYoutubeTitle = document.getElementById("latestYoutubeTitle");
const latestYoutubeDate = document.getElementById("latestYoutubeDate");
const ytSubscribers = document.getElementById("ytSubscribers");
const ytViews = document.getElementById("ytViews");
const ytVideos = document.getElementById("ytVideos");

// Social button redirects
const youtubeBtn = document.querySelector(".social-btn.youtube");
const tiktokBtn = document.querySelector(".social-btn.tiktok");

if (youtubeBtn) {
  youtubeBtn.addEventListener("click", function () {
    window.open("https://www.youtube.com/@MoguIazo", "_blank");
  });
}

if (tiktokBtn) {
  tiktokBtn.addEventListener("click", function () {
    window.open("https://www.tiktok.com/@mogulazo4", "_blank");
  });
}

const suggestionForm = document.getElementById("suggestionForm");
const suggestionEmail = document.getElementById("suggestionEmail");
const suggestionText = document.getElementById("suggestionText");
const charCount = document.getElementById("charCount");
const suggestionStatus = document.getElementById("suggestionStatus");

const adminSection = document.getElementById("desarrollador");
const adminWarning = document.getElementById("adminWarning");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminLoginEmail = document.getElementById("adminLoginEmail");
const adminLoginPassword = document.getElementById("adminLoginPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const adminStatus = document.getElementById("adminStatus");
const adminList = document.getElementById("adminList");
const reviewedBlock = document.getElementById("reviewedBlock");
const reviewedToggleBtn = document.getElementById("reviewedToggleBtn");
const reviewedStatus = document.getElementById("reviewedStatus");
const reviewedList = document.getElementById("reviewedList");

let devSessionEnabled = false;
let reviewedFilter = "pending";
let supabaseClient = null;
let currentDataSource = "local";

function isFileProtocol() {
  return window.location.protocol === "file:";
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("es-AR").format(Number(value || 0));
}

function formatDate(isoDate) {
  if (!isoDate) {
    return "Publicacion pendiente";
  }

  const date = new Date(isoDate);
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function formatDateTime(isoDate) {
  if (!isoDate) {
    return "Sin fecha";
  }

  return new Date(isoDate).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function stripHtmlTags(value) {
  return String(value || "").replace(/<[^>]*>/g, "").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeSuggestionStatus(value) {
  const normalized = String(value || "").toLowerCase().trim();
  if (normalized === SUGGESTION_STATUS_PENDING || normalized === SUGGESTION_STATUS_COMPLETED) {
    return normalized;
  }

  return SUGGESTION_STATUS_NEW;
}

function setSuggestionStatus(message, isError = false) {
  if (!suggestionStatus) {
    return;
  }

  suggestionStatus.textContent = message;
  suggestionStatus.style.color = isError ? "#ff8c8c" : "#8fd9ff";
}

function setAdminStatus(message, isError = false) {
  if (!adminStatus) {
    return;
  }

  adminStatus.textContent = message;
  adminStatus.style.color = isError ? "#ff8c8c" : "#8fd9ff";
}

function setReviewedStatus(message, isError = false) {
  if (!reviewedStatus) {
    return;
  }

  reviewedStatus.textContent = message;
  reviewedStatus.style.color = isError ? "#ff8c8c" : "#8fd9ff";
}

function updateCharCounter() {
  if (!charCount || !suggestionText) {
    return;
  }

  charCount.textContent = String(suggestionText.value.length);
}

function showPrankMessage() {
  if (!prankToast) {
    return;
  }

  prankToast.classList.add("is-visible");
  window.setTimeout(() => {
    prankToast.classList.remove("is-visible");
  }, 3200);
}

function initInstagramPrank() {
  if (!instagramPrank) {
    return;
  }

  instagramPrank.addEventListener("click", () => {
    sessionStorage.setItem(prankKey, "1");
  });

  window.addEventListener("pageshow", () => {
    const shouldShow = sessionStorage.getItem(prankKey) === "1";
    if (!shouldShow) {
      return;
    }

    sessionStorage.removeItem(prankKey);
    showPrankMessage();
  });
}

function buildEmbedUrl(videoId) {
  const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
  embedUrl.searchParams.set("rel", "0");

  if (window.location.origin && window.location.origin !== "null") {
    embedUrl.searchParams.set("origin", window.location.origin);
  }

  return embedUrl.toString();
}

function parseChannelHandle() {
  const explicit = String(YOUTUBE_CONFIG.channelHandle || "").replace("@", "").trim();
  if (explicit) {
    return explicit;
  }

  const fromUrl = String(YOUTUBE_CONFIG.channelUrl || "").match(/youtube\.com\/@([^/?#]+)/i);
  return fromUrl?.[1] || "";
}

function getUploadsPlaylistId(channelId) {
  const normalizedId = String(channelId || "").trim();
  if (!normalizedId.startsWith("UC")) {
    return "";
  }

  return `UU${normalizedId.slice(2)}`;
}

function applyYoutubeNoApiFallback(reasonMessage = "") {
  const uploadsPlaylistId = getUploadsPlaylistId(YOUTUBE_CONFIG.channelId);
  if (!uploadsPlaylistId) {
    latestYoutubeTitle.textContent = "No se pudo mostrar YouTube sin API";
    latestYoutubeDate.textContent = "Configura channelId para usar fallback de playlist";
    return;
  }

  const playlistEmbed = new URL("https://www.youtube.com/embed/videoseries");
  playlistEmbed.searchParams.set("list", uploadsPlaylistId);
  playlistEmbed.searchParams.set("rel", "0");

  latestYoutubeEmbed.src = playlistEmbed.toString();
  latestYoutubeTitle.textContent = "Mostrando ultimos videos del canal (modo fallback)";

  const cleanReason = stripHtmlTags(reasonMessage);
  latestYoutubeDate.textContent = cleanReason
    ? `YouTube API no disponible: ${cleanReason}`
    : "YouTube API no disponible";

  ytSubscribers.textContent = "N/D";
  ytViews.textContent = "N/D";
  ytVideos.textContent = "N/D";
}

function parseIsoDurationToSeconds(isoDuration) {
  const match = isoDuration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {
    return 0;
  }

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function isLikelyShort(video) {
  const durationSeconds = parseIsoDurationToSeconds(video.contentDetails?.duration || "");
  const title = String(video.snippet?.title || "").toLowerCase();
  return durationSeconds > 0 && (durationSeconds <= 60 || title.includes("#shorts"));
}

async function buildYoutubeApiError(response, fallbackMessage) {
  let reason = "";
  let message = "";

  try {
    const body = await response.json();
    reason = body?.error?.errors?.[0]?.reason || "";
    message = body?.error?.message || "";
  } catch (error) {
    // Body no JSON.
  }

  const detail = [reason, message].filter(Boolean).join(" - ");
  return new Error(detail ? `${fallbackMessage}: ${detail}` : fallbackMessage);
}

async function fetchChannelById(channelId) {
  const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  channelUrl.searchParams.set("key", YOUTUBE_CONFIG.apiKey);
  channelUrl.searchParams.set("id", channelId);
  channelUrl.searchParams.set("part", "statistics,snippet,contentDetails");

  const response = await fetch(channelUrl.toString());
  if (!response.ok) {
    throw await buildYoutubeApiError(response, "No se pudieron cargar los datos del canal");
  }

  const data = await response.json();
  return data.items?.[0] || null;
}

async function resolveChannelId() {
  if (YOUTUBE_CONFIG.channelId) {
    return String(YOUTUBE_CONFIG.channelId).trim();
  }

  const handle = parseChannelHandle();
  if (!handle) {
    throw new Error("Falta channelHandle o channelUrl con @handle");
  }

  const channelByHandleUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  channelByHandleUrl.searchParams.set("key", YOUTUBE_CONFIG.apiKey);
  channelByHandleUrl.searchParams.set("part", "id");
  channelByHandleUrl.searchParams.set("forHandle", handle);

  const byHandleResponse = await fetch(channelByHandleUrl.toString());
  if (byHandleResponse.ok) {
    const byHandleData = await byHandleResponse.json();
    const channelId = byHandleData.items?.[0]?.id;
    if (channelId) {
      return channelId;
    }
  }

  const fallbackUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  fallbackUrl.searchParams.set("key", YOUTUBE_CONFIG.apiKey);
  fallbackUrl.searchParams.set("part", "snippet");
  fallbackUrl.searchParams.set("type", "channel");
  fallbackUrl.searchParams.set("q", `@${handle}`);
  fallbackUrl.searchParams.set("maxResults", "1");

  const fallbackResponse = await fetch(fallbackUrl.toString());
  if (!fallbackResponse.ok) {
    throw await buildYoutubeApiError(fallbackResponse, "No se pudo resolver el canal");
  }

  const fallbackData = await fallbackResponse.json();
  const fallbackChannelId = fallbackData.items?.[0]?.snippet?.channelId;
  if (!fallbackChannelId) {
    throw new Error("No se encontro el canal en YouTube");
  }

  return fallbackChannelId;
}

async function fetchVideoDetails(videoIds) {
  if (!videoIds.length) {
    return [];
  }

  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("key", YOUTUBE_CONFIG.apiKey);
  videosUrl.searchParams.set("id", videoIds.join(","));
  videosUrl.searchParams.set("part", "contentDetails,snippet,status");

  const response = await fetch(videosUrl.toString());
  if (!response.ok) {
    throw await buildYoutubeApiError(response, "No se pudieron cargar detalles de videos");
  }

  const data = await response.json();
  return data.items || [];
}

async function loadLatestYoutubeVideo(channelId) {
  const channel = await fetchChannelById(channelId);
  const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new Error("No se encontro la playlist de subidas del canal");
  }

  const playlistItemsUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  playlistItemsUrl.searchParams.set("key", YOUTUBE_CONFIG.apiKey);
  playlistItemsUrl.searchParams.set("playlistId", uploadsPlaylistId);
  playlistItemsUrl.searchParams.set("part", "snippet,contentDetails");
  playlistItemsUrl.searchParams.set("maxResults", "12");

  const response = await fetch(playlistItemsUrl.toString());
  if (!response.ok) {
    throw await buildYoutubeApiError(response, "No se pudo obtener el ultimo video");
  }

  const data = await response.json();
  const playlistItems = data.items || [];
  const searchItems = playlistItems
    .map((item) => ({
      id: { videoId: item?.contentDetails?.videoId || "" },
      snippet: item?.snippet || {}
    }))
    .filter((item) => item?.id?.videoId);

  const videoIds = searchItems.map((item) => item.id.videoId).filter(Boolean);
  if (!videoIds.length) {
    latestYoutubeTitle.textContent = "No se encontraron videos recientes";
    return;
  }

  let selectedVideo = null;

  try {
    const videoDetails = await fetchVideoDetails(videoIds);
    selectedVideo = videoDetails.find((video) => {
      const isEmbeddable = video.status?.embeddable !== false;
      return isEmbeddable && !isLikelyShort(video);
    });
  } catch (error) {
    console.warn("Fallo videos.list, usando fallback:", error);
  }

  if (!selectedVideo?.id) {
    const fallbackItem = searchItems.find((item) => item?.id?.videoId);
    if (!fallbackItem?.id?.videoId) {
      latestYoutubeTitle.textContent = "No hay videos embebibles recientes";
      latestYoutubeDate.textContent = "Intenta con un video publico y embebible";
      return;
    }

    latestYoutubeEmbed.src = buildEmbedUrl(fallbackItem.id.videoId);
    latestYoutubeTitle.textContent = fallbackItem.snippet?.title || "Ultimo video";
    latestYoutubeDate.textContent = `Publicado: ${formatDate(fallbackItem.snippet?.publishedAt)}`;
    return;
  }

  latestYoutubeEmbed.src = buildEmbedUrl(selectedVideo.id);
  latestYoutubeTitle.textContent = selectedVideo.snippet?.title || "Ultimo video";
  latestYoutubeDate.textContent = `Publicado: ${formatDate(selectedVideo.snippet?.publishedAt)}`;
}

async function loadYoutubeChannelStats(channelId) {
  const channel = await fetchChannelById(channelId);
  if (!channel) {
    return;
  }

  const stats = channel.statistics || {};
  ytSubscribers.textContent = formatCompactNumber(stats.subscriberCount);
  ytViews.textContent = formatCompactNumber(stats.viewCount);
  ytVideos.textContent = formatCompactNumber(stats.videoCount);
}

async function initYoutubeSection() {
  if (!YOUTUBE_CONFIG.apiKey) {
    latestYoutubeTitle.textContent = "Configura apiKey en script.js";
    latestYoutubeDate.textContent = "Falta API key";
    return;
  }

  if (isFileProtocol()) {
    latestYoutubeTitle.textContent = "Abre la web con servidor local (no file://)";
    latestYoutubeDate.textContent = "Error 153: YouTube requiere referer/origin valido";
    return;
  }

  try {
    const channelId = await resolveChannelId();
    // Guardamos para fallback de playlist.
    YOUTUBE_CONFIG.channelId = channelId;

    const results = await Promise.allSettled([
      loadLatestYoutubeVideo(channelId),
      loadYoutubeChannelStats(channelId)
    ]);

    const bothFailed = results.every((result) => result.status === "rejected");
    if (bothFailed) {
      const reasons = results
        .map((result) => result.status === "rejected" ? result.reason?.message || "error desconocido" : "")
        .filter(Boolean)
        .join(" | ");
      throw new Error(reasons || "No se pudo cargar ni video ni estadisticas");
    }
  } catch (error) {
    console.error("Error YouTube detallado:", error);
    applyYoutubeNoApiFallback(String(error?.message || "Revisa API key y canal"));
  }
}

function buildMailtoLink(email, suggestion) {
  const recipient = String(SUGGESTIONS_CONFIG.recipientEmail || "").trim();
  const subject = String(SUGGESTIONS_CONFIG.subject || "Sugerencia").trim();

  const body = [
    "Nueva sugerencia desde la web:",
    "",
    `Correo del usuario: ${email}`,
    "",
    "Sugerencia:",
    suggestion
  ].join("\n");

  const mailto = new URL(`mailto:${recipient}`);
  mailto.searchParams.set("subject", subject);
  mailto.searchParams.set("body", body);
  return mailto.toString();
}

function createSupabaseClient() {
  const url = String(SUGGESTIONS_CONFIG.supabaseUrl || "").trim();
  const key = String(SUGGESTIONS_CONFIG.supabaseAnonKey || "").trim();

  if (!url || !key || !window.supabase) {
    return null;
  }

  return window.supabase.createClient(url, key);
}

function initSuggestionDataSource() {
  supabaseClient = createSupabaseClient();
  currentDataSource = supabaseClient ? "supabase" : "local";
}

function mapSupabaseRowToSuggestion(row) {
  return {
    id: Number(row.id),
    email: String(row.email || ""),
    suggestion: String(row.suggestion || ""),
    createdAt: String(row.created_at || new Date().toISOString()),
    status: normalizeSuggestionStatus(row.status),
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null
  };
}

function readLocalSuggestions() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => ({
        id: Number(item.id) || Date.now(),
        email: String(item.email || ""),
        suggestion: String(item.suggestion || ""),
        createdAt: String(item.createdAt || new Date().toISOString()),
        status: normalizeSuggestionStatus(item.status),
        reviewedAt: item.reviewedAt ? String(item.reviewedAt) : null,
        completedAt: item.completedAt ? String(item.completedAt) : null
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("No se pudo leer localStorage:", error);
    return [];
  }
}

function saveLocalSuggestions(items) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
}

async function fetchSuggestions() {
  if (currentDataSource !== "supabase" || !supabaseClient) {
    return readLocalSuggestions();
  }

  const { data, error } = await supabaseClient
    .from(SUGGESTIONS_CONFIG.tableName)
    .select("id,email,suggestion,created_at,status,reviewed_at,completed_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error leyendo Supabase:", error);
    setAdminStatus("Error en Supabase. Usando almacenamiento local.", true);
    currentDataSource = "local";
    return readLocalSuggestions();
  }

  return (data || []).map(mapSupabaseRowToSuggestion);
}

async function createSuggestion(payload) {
  if (currentDataSource !== "supabase" || !supabaseClient) {
    const all = readLocalSuggestions();
    saveLocalSuggestions([payload, ...all]);
    return;
  }

  const { error } = await supabaseClient
    .from(SUGGESTIONS_CONFIG.tableName)
    .insert([{
      email: payload.email,
      suggestion: payload.suggestion,
      status: payload.status,
      reviewed_at: payload.reviewedAt,
      completed_at: payload.completedAt
    }]);

  if (error) {
    console.error("Error insert Supabase:", error);
    throw new Error(error.message || "No se pudo guardar en Supabase");
  }
}

async function setSuggestionStatusById(id, nextStatus) {
  const nowIso = new Date().toISOString();

  if (currentDataSource !== "supabase" || !supabaseClient) {
    const all = readLocalSuggestions();
    const next = all.map((item) => {
      if (item.id !== id) {
        return item;
      }

      if (nextStatus === SUGGESTION_STATUS_PENDING) {
        return { ...item, status: nextStatus, reviewedAt: nowIso, completedAt: null };
      }

      if (nextStatus === SUGGESTION_STATUS_COMPLETED) {
        return { ...item, status: nextStatus, completedAt: nowIso };
      }

      return { ...item, status: SUGGESTION_STATUS_NEW };
    });
    saveLocalSuggestions(next);
    return;
  }

  const payload = { status: nextStatus };
  if (nextStatus === SUGGESTION_STATUS_PENDING) {
    payload.reviewed_at = nowIso;
    payload.completed_at = null;
  }
  if (nextStatus === SUGGESTION_STATUS_COMPLETED) {
    payload.completed_at = nowIso;
  }

  const { error } = await supabaseClient
    .from(SUGGESTIONS_CONFIG.tableName)
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("Error update Supabase:", error);
    throw new Error(error.message || "No se pudo actualizar en Supabase");
  }
}

async function deleteSuggestionById(id) {
  if (currentDataSource !== "supabase" || !supabaseClient) {
    const all = readLocalSuggestions();
    saveLocalSuggestions(all.filter((item) => item.id !== id));
    return;
  }

  const { error } = await supabaseClient
    .from(SUGGESTIONS_CONFIG.tableName)
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error delete Supabase:", error);
    throw new Error(error.message || "No se pudo eliminar en Supabase");
  }
}

function hasDevCredentialsConfigured() {
  return Boolean(getAllowedDeveloperEmails().length && String(DEV_MODE_CONFIG.password || "").trim());
}

function getAllowedDeveloperEmails() {
  const configured = DEV_MODE_CONFIG.allowedEmails;
  if (Array.isArray(configured)) {
    return configured
      .map((email) => String(email || "").trim().toLowerCase())
      .filter(Boolean);
  }

  // Compatibilidad con configuraciones antiguas con allowedEmail.
  const legacy = String(DEV_MODE_CONFIG.allowedEmail || "").trim().toLowerCase();
  return legacy ? [legacy] : [];
}

function hasSupabaseConfigured() {
  return Boolean(supabaseClient && String(SUGGESTIONS_CONFIG.supabaseUrl || "").trim() && String(SUGGESTIONS_CONFIG.supabaseAnonKey || "").trim());
}

function isAllowedDeveloperEmail(email) {
  const allowedEmails = getAllowedDeveloperEmails();
  if (!allowedEmails.length) {
    return true;
  }

  return allowedEmails.includes(String(email || "").trim().toLowerCase());
}

function updateReviewedToggleLabel() {
  if (!reviewedToggleBtn) {
    return;
  }

  reviewedToggleBtn.textContent = reviewedFilter === "pending" ? "Ver completadas" : "Ver pendientes";
}

function buildSuggestionItemMarkup(item, mode) {
  const safeEmail = escapeHtml(item.email || "sin-correo");
  const safeSuggestion = escapeHtml(item.suggestion || "");
  const safeDate = formatDateTime(item.createdAt);
  const id = Number(item.id);
  const actionButtons = [];

  if (mode === "new") {
    actionButtons.push(`<button class="action-btn accept" type="button" data-action="accept" data-id="${id}">Aceptar idea</button>`);
    actionButtons.push(`<button class="action-btn reject" type="button" data-action="reject" data-id="${id}">Rechazar</button>`);
  }

  if (mode === "reviewed-pending") {
    actionButtons.push(`<button class="action-btn complete" type="button" data-action="complete" data-id="${id}">Marcar completada</button>`);
    actionButtons.push(`<button class="action-btn reject" type="button" data-action="delete" data-id="${id}">Eliminar</button>`);
  }

  if (mode === "reviewed-completed") {
    actionButtons.push(`<button class="action-btn reset" type="button" data-action="uncomplete" data-id="${id}">Desmarcar completada</button>`);
    actionButtons.push(`<button class="action-btn reject" type="button" data-action="delete" data-id="${id}">Eliminar</button>`);
  }

  const tagMarkup = mode === "reviewed-completed"
    ? '<span class="reviewed-tag completed">Completada</span>'
    : mode === "reviewed-pending"
      ? '<span class="reviewed-tag pending">Pendiente por completar</span>'
      : "";

  return `
    <article class="suggestion-item">
      <div class="suggestion-item-head">
        <span class="suggestion-item-email">${safeEmail}</span>
        <div class="suggestion-meta-actions">
          <span class="suggestion-item-date">${safeDate}</span>
          ${actionButtons.join("")}
        </div>
      </div>
      <p class="suggestion-item-body">${safeSuggestion}</p>
      ${tagMarkup}
    </article>
  `;
}

async function renderDeveloperSuggestions() {
  if (!adminList || !reviewedList) {
    return;
  }

  try {
    const all = await fetchSuggestions();

    const newItems = all.filter((item) => normalizeSuggestionStatus(item.status) === SUGGESTION_STATUS_NEW);
    const pendingItems = all.filter((item) => normalizeSuggestionStatus(item.status) === SUGGESTION_STATUS_PENDING);
    const completedItems = all.filter((item) => normalizeSuggestionStatus(item.status) === SUGGESTION_STATUS_COMPLETED);

    adminList.innerHTML = !newItems.length
      ? '<p class="form-status">No hay solicitudes nuevas por revisar.</p>'
      : newItems.map((item) => buildSuggestionItemMarkup(item, "new")).join("");

    const reviewedItems = reviewedFilter === "pending" ? pendingItems : completedItems;
    const reviewedMode = reviewedFilter === "pending" ? "reviewed-pending" : "reviewed-completed";

    reviewedList.innerHTML = !reviewedItems.length
      ? '<p class="form-status">No hay solicitudes en esta vista.</p>'
      : reviewedItems.map((item) => buildSuggestionItemMarkup(item, reviewedMode)).join("");

    updateReviewedToggleLabel();
    setReviewedStatus(`Vista: ${reviewedFilter === "pending" ? "pendientes" : "completadas"} (${reviewedItems.length})`);
    setAdminStatus(`Origen: ${currentDataSource} | Nuevas: ${newItems.length} | Pendientes: ${pendingItems.length} | Completadas: ${completedItems.length}`);
  } catch (error) {
    console.error(error);
    setAdminStatus(String(error?.message || "No se pudieron cargar sugerencias"), true);
  }
}

function setDeveloperLockedState(locked) {
  const unlocked = !locked;

  if (adminLoginEmail) {
    adminLoginEmail.disabled = unlocked;
  }
  if (adminLoginPassword) {
    adminLoginPassword.disabled = unlocked;
  }
  if (adminLoginBtn) {
    adminLoginBtn.disabled = unlocked;
  }
  if (adminLogoutBtn) {
    adminLogoutBtn.disabled = locked;
  }
  if (reviewedToggleBtn) {
    reviewedToggleBtn.disabled = locked;
  }
  if (reviewedBlock) {
    reviewedBlock.style.display = locked ? "none" : "";
  }
  if (adminWarning) {
    adminWarning.style.display = locked ? "block" : "none";
  }

  if (locked) {
    adminList.innerHTML = "";
    reviewedList.innerHTML = "";
    setReviewedStatus("");
  }
}

async function loginDeveloper(event) {
  event.preventDefault();

  const email = String(adminLoginEmail?.value || "").trim().toLowerCase();
  const password = String(adminLoginPassword?.value || "");

  if (!email || !password) {
    setAdminStatus("Completa correo y contrasena.", true);
    return;
  }

  if (!isAllowedDeveloperEmail(email)) {
    setAdminStatus("Correo no permitido para modo desarrollador.", true);
    return;
  }

  if (hasSupabaseConfigured() && isFileProtocol()) {
    setAdminStatus("Abre la pagina con un servidor local (http://localhost), no con file://, para iniciar sesion en Supabase.", true);
    return;
  }

  if (hasSupabaseConfigured()) {
    let result;
    try {
      result = await supabaseClient.auth.signInWithPassword({ email, password });
    } catch (networkError) {
      setAdminStatus("No se pudo conectar con Supabase. Revisa internet, URL del proyecto y que uses http://localhost.", true);
      return;
    }

    const { error } = result;

    if (error) {
      setAdminStatus(`No se pudo iniciar sesion: ${error.message || "credenciales invalidas"}`, true);
      return;
    }

    devSessionEnabled = true;
    setDeveloperLockedState(false);
    renderDeveloperSuggestions();
    return;
  }

  if (!hasDevCredentialsConfigured()) {
    setAdminStatus("Configura Supabase (URL + anon key) o DEV_MODE_CONFIG.password para login local.", true);
    return;
  }

  const expectedPassword = String(DEV_MODE_CONFIG.password || "");

  if (!isAllowedDeveloperEmail(email) || password !== expectedPassword) {
    setAdminStatus("Credenciales invalidas.", true);
    return;
  }

  devSessionEnabled = true;
  setDeveloperLockedState(false);
  await renderDeveloperSuggestions();
}

async function logoutDeveloper() {
  if (hasSupabaseConfigured()) {
    await supabaseClient.auth.signOut();
  }

  devSessionEnabled = false;
  adminLoginForm?.reset();
  setDeveloperLockedState(true);
  setAdminStatus("Sesion cerrada.");
}

async function onAdminListClick(event) {
  const button = event.target.closest("button[data-action][data-id]");
  if (!button || !devSessionEnabled) {
    return;
  }

  const action = String(button.dataset.action || "");
  const id = Number(button.dataset.id);
  if (!id) {
    return;
  }

  try {
    if (action === "accept") {
      await setSuggestionStatusById(id, SUGGESTION_STATUS_PENDING);
      await renderDeveloperSuggestions();
      return;
    }

    if (action === "reject") {
      const mustDelete = window.confirm("Estas seguro de borrar esta solicitud?");
      if (!mustDelete) {
        return;
      }

      await deleteSuggestionById(id);
      await renderDeveloperSuggestions();
    }
  } catch (error) {
    setAdminStatus(String(error?.message || "No se pudo actualizar"), true);
  }
}

async function onReviewedListClick(event) {
  const button = event.target.closest("button[data-action][data-id]");
  if (!button || !devSessionEnabled) {
    return;
  }

  const action = String(button.dataset.action || "");
  const id = Number(button.dataset.id);
  if (!id) {
    return;
  }

  try {
    if (action === "complete") {
      await setSuggestionStatusById(id, SUGGESTION_STATUS_COMPLETED);
      await renderDeveloperSuggestions();
      return;
    }

    if (action === "uncomplete") {
      await setSuggestionStatusById(id, SUGGESTION_STATUS_PENDING);
      await renderDeveloperSuggestions();
      return;
    }

    if (action === "delete") {
      const mustDelete = window.confirm("Estas seguro de borrar esta solicitud?");
      if (!mustDelete) {
        return;
      }

      await deleteSuggestionById(id);
      await renderDeveloperSuggestions();
    }
  } catch (error) {
    setAdminStatus(String(error?.message || "No se pudo actualizar"), true);
  }
}

function syncDeveloperHashVisibility() {
  if (!adminSection) {
    return;
  }

  const isSecretMode = window.location.hash === "#desarrollador";
  adminSection.hidden = !isSecretMode;

  if (!isSecretMode) {
    return;
  }

  setDeveloperLockedState(!devSessionEnabled);
  if (!devSessionEnabled) {
    setAdminStatus("Ingresa con tus credenciales para activar el modo desarrollador.");
  }
}

function initSecretMode() {
  if (!adminSection) {
    return;
  }

  adminLoginForm?.addEventListener("submit", loginDeveloper);
  adminLogoutBtn?.addEventListener("click", logoutDeveloper);
  adminList?.addEventListener("click", onAdminListClick);
  reviewedList?.addEventListener("click", onReviewedListClick);

  reviewedToggleBtn?.addEventListener("click", () => {
    reviewedFilter = reviewedFilter === "pending" ? "completed" : "pending";
    renderDeveloperSuggestions();
  });

  if (hasSupabaseConfigured()) {
    supabaseClient.auth.getSession().then(({ data }) => {
      const sessionEmail = data?.session?.user?.email || "";
      devSessionEnabled = Boolean(data?.session && isAllowedDeveloperEmail(sessionEmail));
      syncDeveloperHashVisibility();
      if (devSessionEnabled) {
        renderDeveloperSuggestions();
      }
    });

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      const sessionEmail = session?.user?.email || "";
      devSessionEnabled = Boolean(session && isAllowedDeveloperEmail(sessionEmail));
      syncDeveloperHashVisibility();
      if (devSessionEnabled) {
        renderDeveloperSuggestions();
      }
    });
  }

  window.addEventListener("hashchange", syncDeveloperHashVisibility);
  syncDeveloperHashVisibility();
}

async function submitSuggestion(event) {
  event.preventDefault();

  const email = String(suggestionEmail?.value || "").trim();
  const suggestion = String(suggestionText?.value || "").trim();

  if (!email || !suggestion) {
    setSuggestionStatus("Completa correo y sugerencia.", true);
    return;
  }

  if (suggestion.length > SUGGESTION_MAX) {
    setSuggestionStatus("La sugerencia supera el limite de 5000 caracteres.", true);
    return;
  }

  const payload = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    email,
    suggestion,
    createdAt: new Date().toISOString(),
    status: SUGGESTION_STATUS_NEW,
    reviewedAt: null,
    completedAt: null
  };

  try {
    await createSuggestion(payload);

    if (SUGGESTIONS_CONFIG.sendByMailto && SUGGESTIONS_CONFIG.recipientEmail.trim()) {
      const mailtoLink = buildMailtoLink(email, suggestion);
      window.location.href = mailtoLink;
    }

    setSuggestionStatus("Tu sugerencia fue enviada. Gracias por aportar");
    suggestionForm.reset();
    updateCharCounter();

    if (devSessionEnabled) {
      await renderDeveloperSuggestions();
    }
  } catch (error) {
    setSuggestionStatus(String(error?.message || "No se pudo guardar la sugerencia"), true);
  }
}

function initSuggestionForm() {
  if (!suggestionForm || !suggestionText) {
    return;
  }

  suggestionText.maxLength = SUGGESTION_MAX;
  updateCharCounter();
  suggestionText.addEventListener("input", updateCharCounter);
  suggestionForm.addEventListener("submit", submitSuggestion);
}

initSuggestionDataSource();
initInstagramPrank();
initYoutubeSection();
initSuggestionForm();
initSecretMode();
