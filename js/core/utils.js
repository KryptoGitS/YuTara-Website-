/* ==========================================================================
   YuTara Core — Utilities, Diagnostics & Animation Debugger (js/core/utils.js)
   Shared helpers loaded on every page. Inspect errors via window.YuTaraDiagnostics
   and control animations via window.YuTaraAnimDebug (.slow() / .off() / .normal()).
   ========================================================================== */

const STORAGE_KEYS = {
  properties: "yutara_v7_properties",
  saved: "yutara_v6_saved",
  transactions: "yutara_v6_transactions",
  inquiries: "yutara_v6_inquiries",
  accounts: "yutara_v6_accounts",
  messages: "yutara_v6_messages",
  session: "yutara_v6_session"
};

/* --------------------------------------------------------------------------
   EASY-TO-DEBUG ANIMATION CONTROLLER
   Usage in Browser DevTools Console or URL (?debugAnim=slow | ?debugAnim=off):
     YuTaraAnimDebug.slow()   -> slows all animations 5x for visual inspection
     YuTaraAnimDebug.off()    -> disables all animations to debug layout
     YuTaraAnimDebug.normal() -> restores default 180ms/260ms transitions
     YuTaraAnimDebug.status() -> prints current animation mode & [data-anim] count
   -------------------------------------------------------------------------- */
const YuTaraAnimDebug = {
  mode: "normal",
  setMode: function (mode) {
    this.mode = mode;
    document.body.classList.remove("anim-debug-slow", "anim-debug-off");
    if (mode === "slow") {
      document.body.classList.add("anim-debug-slow");
    } else if (mode === "off") {
      document.body.classList.add("anim-debug-off");
    }
    console.info("[YuTaraAnimDebug] Animation mode set to:", mode);
    return mode;
  },
  slow: function () {
    return this.setMode("slow");
  },
  off: function () {
    return this.setMode("off");
  },
  normal: function () {
    return this.setMode("normal");
  },
  status: function () {
    const nodes = document.querySelectorAll("[data-anim]");
    const summary = {
      mode: this.mode,
      animatedElements: nodes.length,
      keyframes: Array.from(nodes).map(function (el) {
        return el.getAttribute("data-anim");
      })
    };
    console.info("[YuTaraAnimDebug] Status:", summary);
    return summary;
  }
};
window.YuTaraAnimDebug = YuTaraAnimDebug;

function initAnimationDebugFromUrl() {
  const mode = getQueryParam("debugAnim");
  if (mode === "slow" || mode === "off" || mode === "normal") {
    YuTaraAnimDebug.setMode(mode);
  }
}

function replayTabAnimation(panel) {
  if (!panel) return;
  panel.classList.remove("anim-tab-enter");
  // Trigger predictable single reflow so the named CSS keyframe replays cleanly
  void panel.offsetWidth;
  panel.classList.add("anim-tab-enter");
}

let toastTimer = null;

function reportDiagnostic(layer, component, operation, err) {
  console.warn(
    "[YuTara Diagnostic] Layer=" +
      layer +
      " | Component=" +
      component +
      " | Operation=" +
      operation +
      " | Reason=" +
      (err && err.message ? err.message : String(err))
  );
}

function lockFormSubmission(form) {
  if (!form) return false;
  if (form.getAttribute("data-submitting") === "true") {
    return true;
  }
  form.setAttribute("data-submitting", "true");
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
  }
  setTimeout(function () {
    form.removeAttribute("data-submitting");
    if (submitBtn) {
      submitBtn.disabled = false;
    }
  }, 600);
  return false;
}

function showToast(message) {
  let toast = document.getElementById("yutara-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "yutara-toast";
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 2600);
}

function formatPeso(amount) {
  return "₱" + Number(amount || 0).toLocaleString("en-PH");
}

function formatPropertyPrice(prop) {
  if (prop.priceLabel) return prop.priceLabel;
  if (!prop.price || Number(prop.price) <= 0) return "Negotiable (For Sale)";
  return formatPeso(prop.price);
}

function formatPricePerSqm(prop) {
  if (!prop.price || Number(prop.price) <= 0) {
    return prop.priceNote || "Price negotiable for serious buyers";
  }
  const perSqm = Math.round(Number(prop.price) / Math.max(Number(prop.area), 1));
  return formatPeso(perSqm) + " / sqm" + (prop.priceNote ? " • " + prop.priceNote : "");
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function getInitials(name) {
  const parts = String(name || "YU").trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return String(name || "YU").slice(0, 2).toUpperCase();
}
