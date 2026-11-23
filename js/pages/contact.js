/* ==========================================================================
   YuTara Page — Contact Us (js/pages/contact.js -> contact.html)
   --------------------------------------------------------------------------
   QUICK DEBUG INDEX:
   1. initContactPage() — Validates #contact-form and stores inquiry in localStorage
   ========================================================================== */

function initContactPage() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (lockFormSubmission(form)) return;

    const feedback = document.getElementById("contact-feedback");
    const name = document.getElementById("contact-name").value.trim();
    const email = document.getElementById("contact-email").value.trim();
    const topicEl = document.getElementById("contact-topic");
    const topic = topicEl ? topicEl.value : "General Inquiry";
    const message = document.getElementById("contact-message").value.trim();

    // Step 1: Validate required inputs
    if (!name || !email.includes("@") || message.length < 10) {
      feedback.className = "alert alert-error";
      feedback.textContent = "Please enter your name, a valid email, and a message (at least 10 characters).";
      feedback.classList.remove("hidden");
      return;
    }

    // Step 2: Save inquiry to localStorage
    const inquiries = getInquiries();
    const newInq = {
      id: `INQ-${Math.floor(1000 + Math.random() * 9000)}`,
      type: topic,
      propertyTitle: "Panabo City Marketplace Inquiry",
      senderName: name,
      contactInfo: email,
      message: message,
      status: "Open",
      createdAt: new Date().toISOString().slice(0, 10)
    };
    inquiries.unshift(newInq);
    saveInquiries(inquiries);

    // Step 3: Show confirmation alert & toast
    feedback.className = "alert alert-success";
    feedback.innerHTML = `Thank you, <strong>${escapeHtml(name)}</strong>! Your inquiry (${escapeHtml(newInq.id)}) has been recorded.`;
    feedback.classList.remove("hidden");
    form.reset();
    showToast(`Inquiry ${newInq.id} sent`);
  });
}

document.addEventListener("DOMContentLoaded", initContactPage);
