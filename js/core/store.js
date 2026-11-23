/* ==========================================================================
   YuTara Core — LocalStorage Data Store (js/core/store.js)
   --------------------------------------------------------------------------
   QUICK DEBUG INDEX:
   1. Properties CRUD     — getProperties(), saveProperties()
   2. Saved Bookmarks     — getSavedIds(), toggleSavedProperty()
   3. Reservations / TX   — getTransactions(), saveTransactions()
   4. Inquiries & Chat    — getInquiries(), getMessages(), addMessage()
   5. Accounts Directory  — getAllAccounts(), saveAllAccounts(), accountEmailExists()
   ========================================================================== */

function getProperties() {
  const raw = localStorage.getItem(STORAGE_KEYS.properties);
  if (!raw) return DEFAULT_PROPERTIES.slice();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROPERTIES.slice();
  } catch (err) {
    reportDiagnostic("DataStore", "Properties", "getProperties", err);
    return DEFAULT_PROPERTIES.slice();
  }
}

function saveProperties(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(list));
  } catch (err) {
    reportDiagnostic("DataStore", "Properties", "saveProperties", err);
  }
}

function getSavedIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.saved) || "[]");
    if (!Array.isArray(parsed)) return [];
    const validIds = new Set(
      getProperties().map(function (p) {
        return Number(p.id);
      })
    );
    return parsed
      .map(function (id) {
        return Number(id);
      })
      .filter(function (id) {
        return validIds.has(id);
      });
  } catch (err) {
    reportDiagnostic("DataStore", "SavedListings", "getSavedIds", err);
    return [];
  }
}

function toggleSavedProperty(propertyId) {
  const id = Number(propertyId);
  const saved = getSavedIds();
  const index = saved.indexOf(id);

  if (index >= 0) {
    saved.splice(index, 1);
  } else {
    saved.push(id);
  }

  try {
    localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(saved));
  } catch (err) {
    reportDiagnostic("DataStore", "SavedListings", "toggleSavedProperty", err);
  }
  return saved.includes(id);
}

function getTransactions() {
  const raw = localStorage.getItem(STORAGE_KEYS.transactions);
  if (!raw) return DEFAULT_TRANSACTIONS.slice();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TRANSACTIONS.slice();
  } catch (err) {
    reportDiagnostic("DataStore", "Transactions", "getTransactions", err);
    return DEFAULT_TRANSACTIONS.slice();
  }
}

function saveTransactions(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(list));
  } catch (err) {
    reportDiagnostic("DataStore", "Transactions", "saveTransactions", err);
  }
}

function getInquiries() {
  const fallback = typeof DEFAULT_INQUIRIES !== "undefined" ? DEFAULT_INQUIRIES.slice() : [];
  const raw = localStorage.getItem(STORAGE_KEYS.inquiries);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (err) {
    reportDiagnostic("DataStore", "Inquiries", "getInquiries", err);
    return fallback;
  }
}

function saveInquiries(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.inquiries, JSON.stringify(list));
  } catch (err) {
    reportDiagnostic("DataStore", "Inquiries", "saveInquiries", err);
  }
}

function getMessages() {
  const raw = localStorage.getItem(STORAGE_KEYS.messages);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    reportDiagnostic("DataStore", "Messages", "getMessages", err);
    return [];
  }
}

function saveMessages(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(list));
  } catch (err) {
    reportDiagnostic("DataStore", "Messages", "saveMessages", err);
  }
}

function addMessage(propertyId, transactionId, senderName, senderEmail, message) {
  const messages = getMessages();
  const newMsg = {
    id: "MSG-" + Math.floor(1000 + Math.random() * 9000),
    propertyId: Number(propertyId),
    transactionId: transactionId || null,
    senderName: senderName,
    senderEmail: senderEmail,
    message: message,
    createdAt: new Date().toISOString().slice(0, 16),
    read: false
  };
  messages.push(newMsg);
  saveMessages(messages);
  return newMsg;
}

function getDefaultSeededAccounts() {
  const builtIn = typeof DEMO_ACCOUNTS !== "undefined" ? DEMO_ACCOUNTS : [];
  return builtIn.map(function (b) {
    return {
      id: "DEMO-" + b.key,
      name: b.name,
      email: b.email,
      password: b.password,
      role: b.role,
      status: "APPROVED",
      builtIn: true
    };
  });
}

function getAllAccounts() {
  const raw = localStorage.getItem(STORAGE_KEYS.accounts);
  if (!raw) return getDefaultSeededAccounts();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultSeededAccounts();
  } catch (err) {
    reportDiagnostic("DataStore", "Accounts", "getAllAccounts", err);
    return getDefaultSeededAccounts();
  }
}

function saveAllAccounts(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(list));
  } catch (err) {
    reportDiagnostic("DataStore", "Accounts", "saveAllAccounts", err);
  }
}

function getCustomAccounts() {
  return getAllAccounts().filter(function (acc) {
    return !acc.builtIn;
  });
}

function saveCustomAccounts(customList) {
  const builtIns = getAllAccounts().filter(function (acc) {
    return acc.builtIn;
  });
  saveAllAccounts(builtIns.concat(customList));
}

function accountEmailExists(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return false;
  return getAllAccounts().some(function (acc) {
    return String(acc.email || "").toLowerCase() === normalized;
  });
}
