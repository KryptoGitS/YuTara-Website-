/* ==========================================================================
   YuTara Page — Reservation Checkout (js/pages/reservation.js -> reservation.html)
   Auth-guarded simulated reservation request creation.
   ========================================================================== */

function initReservationPage() {
  const form = document.getElementById("reservation-form");
  if (!form) return;

  const idParam = Number(getQueryParam("id")) || 1;
  const allProperties = getProperties();
  const prop = allProperties.find(function (item) {
    return item.id === idParam;
  }) || allProperties[0];

  document.getElementById("res-prop-title").textContent = prop.title;
  document.getElementById("res-prop-location").textContent = "Brgy. " + prop.barangay + ", " + prop.city;
  document.getElementById("res-prop-price").textContent = formatPropertyPrice(prop);
  document.getElementById("res-back-link").href = "property.html?id=" + prop.id;

  const session = getSession();
  const buyerInput = document.getElementById("res-buyer-name");
  const quickLoginBox = document.getElementById("res-login-notice");
  const resLoginLink = document.getElementById("res-login-link");

  if (session) {
    buyerInput.value = session.name;
    if (quickLoginBox) quickLoginBox.classList.add("hidden");
  } else {
    if (quickLoginBox) quickLoginBox.classList.remove("hidden");
    if (resLoginLink) {
      resLoginLink.setAttribute("href", buildLoginUrl("reservation.html?id=" + prop.id));
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!requireLoginForAction("reserve this property", "reservation.html?id=" + prop.id)) return;
    if (lockFormSubmission(form)) return;

    const feedback = document.getElementById("res-feedback");
    const buyerName = buyerInput.value.trim();
    const buyerPhone = document.getElementById("res-buyer-phone").value.trim();
    const agreed = document.getElementById("res-agree").checked;

    if (!buyerName || !buyerPhone || !agreed) {
      feedback.className = "alert alert-error";
      feedback.textContent = "Please complete all fields and confirm the MVP simulation notice.";
      feedback.classList.remove("hidden");
      return;
    }

    const session = getSession();
    const buyerEmail = session && session.email ? session.email : "";
    const sellerEmail = prop.ownerEmail || "";

    const transactions = getTransactions();
    const newTx = {
      id: "TX-" + Math.floor(1000 + Math.random() * 9000),
      propertyId: prop.id,
      propertyTitle: prop.title,
      location: "Brgy. " + prop.barangay + ", " + prop.city,
      buyerName: buyerName,
      buyerEmail: buyerEmail,
      sellerName: prop.seller,
      sellerEmail: sellerEmail,
      salePrice: prop.price,
      priceLabel: formatPropertyPrice(prop),
      reservationFee: 25000,
      stageIndex: 0,
      approvalStatus: "pending",
      status: "pending_approval",
      documents: [
        { name: "Reservation Request Form (Simulated)", status: "Submitted" },
        { name: "Clean Transfer Certificate of Title (TCT Copy)", status: "Requested" },
        { name: "Updated Real Property Tax Declaration", status: "Requested" }
      ]
    };

    transactions.unshift(newTx);
    saveTransactions(transactions);

    feedback.className = "alert alert-success";
    feedback.innerHTML =
      "<strong>Reservation Request Sent (" +
      escapeHtml(newTx.id) +
      ")!</strong> No real money was collected. Your request is now with <strong>" +
      escapeHtml(prop.seller) +
      "</strong> for approval. You will be notified once the seller accepts.<br />" +
      '<a href="tracker.html" class="inline-action-link inline-block-link">View My Reservations &rarr;</a>';
    feedback.classList.remove("hidden");
    form.reset();
    showToast("Reservation request " + newTx.id + " sent to seller");
  });
}

document.addEventListener("DOMContentLoaded", initReservationPage);
