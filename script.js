/* ========== INTRO ========== */
setTimeout(function() {
  document.getElementById('intro-view').classList.add('fade-out');
  setTimeout(function() {
    document.getElementById('intro-view').style.display = 'none';
    document.getElementById('login-view').classList.add('show');
  }, 700);
}, 2800);

/* ========== STORAGE KEYS ========== */
var USERS_KEY = 'rahmath_users';
var INV_KEY = 'rahmath_last_invoice';
var SVC_KEY = 'rahmath_services';
var SOFT_KEY = 'rahmath_cooked_softwares';
var BILLS_KEY = 'rahmath_bills';
var GDRIVE_KEY = 'rahmath_gdrive';
var CURRENT_USER_KEY = 'rahmath_current_user';
var CURRENCY_KEY = 'rahmath_currency';

/* ========== CURRENCY ========== */
var CURRENCY_MAP = {
  INR: { symbol: '₹', code: 'INR', locale: 'en-IN' },
  USD: { symbol: '$', code: 'USD', locale: 'en-US' },
  EUR: { symbol: '€', code: 'EUR', locale: 'de-DE' },
  GBP: { symbol: '£', code: 'GBP', locale: 'en-GB' },
  AED: { symbol: 'د.إ', code: 'AED', locale: 'en-AE' },
  LKR: { symbol: 'Rs', code: 'LKR', locale: 'en-LK' }
};
function getCurrency() {
  try {
    var c = localStorage.getItem(CURRENCY_KEY) || 'INR';
    return CURRENCY_MAP[c] ? c : 'INR';
  } catch (e) { return 'INR'; }
}
function setCurrency(code) {
  if (!CURRENCY_MAP[code]) code = 'INR';
  try { localStorage.setItem(CURRENCY_KEY, code); } catch (e) {}
}
function curSymbol() {
  return (CURRENCY_MAP[getCurrency()] || CURRENCY_MAP.INR).symbol;
}
function formatMoney(n) {
  n = Number(n) || 0;
  var c = CURRENCY_MAP[getCurrency()] || CURRENCY_MAP.INR;
  try {
    return c.symbol + n.toLocaleString(c.locale, { maximumFractionDigits: 2 });
  } catch (e) {
    return c.symbol + n.toLocaleString('en-IN');
  }
}
function applyCurrencyUI() {
  var sel = document.getElementById('set-currency');
  if (sel) sel.value = getCurrency();
  var sp = document.getElementById('svc-price-cur');
  if (sp) sp.textContent = curSymbol();
  calcBill();
  renderServices();
  renderReports();
  renderDashboardStats();
  renderTodayStats();
  renderDashRecent();
}

/* ========== USERS ========== */
function defaultUsers() {
  return [{ username: 'admin', password: 'admin', role: 'Owner' }];
}
function loadUsers() {
  try {
    var raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      var list = JSON.parse(raw);
      if (Array.isArray(list) && list.length) return list;
    }
  } catch (e) {}
  var d = defaultUsers();
  localStorage.setItem(USERS_KEY, JSON.stringify(d));
  return d;
}
function saveUsers(list) {
  localStorage.setItem(USERS_KEY, JSON.stringify(list));
}
function getCurrentUser() {
  try { return localStorage.getItem(CURRENT_USER_KEY) || 'admin'; } catch (e) { return 'admin'; }
}
function setCurrentUser(u) {
  try { localStorage.setItem(CURRENT_USER_KEY, u); } catch (e) {}
}

/* ========== BILLS ========== */
function loadBills() {
  try { return JSON.parse(localStorage.getItem(BILLS_KEY) || '[]'); }
  catch (e) { return []; }
}
function saveBills(list) {
  localStorage.setItem(BILLS_KEY, JSON.stringify(list));
}

/* ========== INVOICE AUTO INCREMENT ========== */
function getNextInvoiceNo() {
  var n = 1043;
  try {
    var v = parseInt(localStorage.getItem(INV_KEY), 10);
    if (!isNaN(v) && v >= 1000) n = v + 1;
  } catch (e) {}
  return 'INV-' + n;
}
function commitInvoiceNo(invStr) {
  var m = String(invStr).match(/(\d+)/);
  if (m) {
    try { localStorage.setItem(INV_KEY, m[1]); } catch (e) {}
  }
}
function refreshInvoiceField() {
  var el = document.getElementById('bill-inv');
  if (el) el.value = getNextInvoiceNo();
}

/* ========== LOGIN ========== */
var loginView = document.getElementById('login-view');
var appView = document.getElementById('app-view');
var loginForm = document.getElementById('login-form');
var loginError = document.getElementById('login-error');

loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  var user = document.getElementById('username').value.trim();
  var pass = document.getElementById('password').value;
  var users = loadUsers();
  var found = users.find(function(u) { return u.username === user && u.password === pass; });
  if (found) {
    setCurrentUser(found.username);
    loginView.classList.add('hidden');
    loginView.classList.remove('show');
    appView.classList.add('visible');
    document.body.style.overflow = 'auto';
    updateUserChip(found);
    showToast('Welcome back, ' + found.username + '!');
    setTimeout(function() { drawPLChart(); renderDashRecent(); renderDashboardStats(); renderTodayStats(); applyCurrencyUI(); }, 300);
  } else {
    loginError.classList.add('show');
    setTimeout(function() { loginError.classList.remove('show'); }, 3000);
  }
});

function updateUserChip(u) {
  var av = document.querySelector('.user-avatar');
  var strong = document.querySelector('.user-info strong');
  var span = document.querySelector('.user-info span');
  if (av) av.textContent = (u.username || 'A').charAt(0).toUpperCase();
  if (strong) strong.textContent = u.username || 'Admin';
  if (span) span.textContent = u.role || 'Staff';
}

document.getElementById('btn-logout').addEventListener('click', function() {
  appView.classList.remove('visible');
  loginView.classList.remove('hidden');
  loginView.classList.add('show');
  document.getElementById('password').value = '';
  document.getElementById('username').value = '';
});

/* ========== NAVIGATION ========== */
var titles = {
  dashboard: ['Dashboard', 'Welcome back · Overview of your business'],
  bill: ['Bill', 'Create and manage invoices'],
  inventory: ['Services', 'Manage your IT & business services'],
  report: ['Report', 'Sales analytics & unpaid dues'],
  customer: ['Customer', 'Customer directory & dues'],
  today: ['Today', 'Live activity for today'],
  cooked: ['Cooked Softwares', 'Upload & manage your softwares'],
  settings: ['Settings', 'Business profile & preferences']
};

document.querySelectorAll('.nav-item').forEach(function(item) {
  item.addEventListener('click', function() {
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    item.classList.add('active');
    var panel = item.dataset.panel;
    document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
    document.getElementById('panel-' + panel).classList.add('active');
    document.getElementById('page-title').textContent = titles[panel][0];
    document.getElementById('page-sub').textContent = titles[panel][1];
    document.getElementById('sidebar').classList.remove('open');
    if (panel === 'bill') refreshInvoiceField();
    if (panel === 'settings') { renderUsers(); refreshGdriveUI(); var cs = document.getElementById('set-currency'); if (cs) cs.value = getCurrency(); }
    if (panel === 'report') renderReports();
    if (panel === 'dashboard') { drawPLChart(); renderDashRecent(); renderDashboardStats(); }
    if (panel === 'today') renderTodayStats();
  });
});

document.getElementById('menu-toggle').addEventListener('click', function() {
  document.getElementById('sidebar').classList.toggle('open');
});

/* ========== BILL ========== */
document.getElementById('bill-date').valueAsDate = new Date();
var billItems = document.getElementById('bill-items');
var billPayStatus = 'Paid';
refreshInvoiceField();

document.getElementById('pay-paid').addEventListener('click', function() {
  billPayStatus = 'Paid';
  document.getElementById('pay-paid').classList.add('active-paid');
  document.getElementById('pay-paid').classList.remove('active-unpaid');
  document.getElementById('pay-unpaid').classList.remove('active-unpaid');
  document.getElementById('pay-unpaid').classList.remove('active-paid');
});
document.getElementById('pay-unpaid').addEventListener('click', function() {
  billPayStatus = 'Unpaid';
  document.getElementById('pay-unpaid').classList.add('active-unpaid');
  document.getElementById('pay-paid').classList.remove('active-paid');
  document.getElementById('pay-paid').classList.remove('active-unpaid');
});

function escapeAttr(s) {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}

function addBillRow(name, qty, rate, isCustom) {
  name = name || '';
  qty = (qty != null) ? qty : 1;
  rate = (rate != null) ? rate : 0;
  isCustom = !!isCustom;
  var row = document.createElement('div');
  row.className = 'bill-row';
  row.dataset.custom = isCustom ? '1' : '0';
  if (isCustom) {
    row.innerHTML =
      '<input type="text" placeholder="Description (custom)" value="' + escapeAttr(name) + '" class="bi-name" />' +
      '<input type="number" min="1" value="1" class="bi-qty" style="display:none" />' +
      '<span style="color:var(--ink-dim);font-size:12px;">Custom</span>' +
      '<input type="number" min="0" step="0.01" value="' + rate + '" class="bi-rate" placeholder="Amount" />' +
      '<span class="bi-amt">' + formatMoney(0) + '</span>' +
      '<button type="button" class="btn btn-ghost btn-sm bi-remove">✕</button>';
  } else {
    row.innerHTML =
      '<input type="text" placeholder="Service / item name" value="' + escapeAttr(name) + '" class="bi-name" />' +
      '<input type="number" min="1" value="' + qty + '" class="bi-qty" />' +
      '<input type="number" min="0" step="0.01" value="' + rate + '" class="bi-rate" />' +
      '<span class="bi-amt">' + formatMoney(0) + '</span>' +
      '<button type="button" class="btn btn-ghost btn-sm bi-remove">✕</button>';
  }
  billItems.appendChild(row);
  row.querySelectorAll('input').forEach(function(inp) {
    inp.addEventListener('input', calcBill);
  });
  row.querySelector('.bi-remove').addEventListener('click', function() {
    row.remove();
    calcBill();
  });
  calcBill();
}

function calcBill() {
  var total = 0;
  document.querySelectorAll('#bill-items .bill-row').forEach(function(row) {
    if (!row.querySelector('.bi-rate')) return;
    var isCustom = row.dataset.custom === '1';
    var q = isCustom ? 1 : (parseFloat(row.querySelector('.bi-qty').value) || 0);
    var r = parseFloat(row.querySelector('.bi-rate').value) || 0;
    var amt = q * r;
    var amtEl = row.querySelector('.bi-amt');
    if (amtEl) amtEl.textContent = formatMoney(amt);
    total += amt;
  });
  document.getElementById('bill-sub').textContent = formatMoney(total);
  document.getElementById('bill-total').textContent = formatMoney(total);
  return total;
}

/* Service picker modal */
var svcModal = document.getElementById('svc-modal');
var svcPickList = document.getElementById('svc-pick-list');
var svcPickSearch = document.getElementById('svc-pick-search');

function openSvcModal() {
  renderSvcPicker(svcPickSearch.value || '');
  svcModal.classList.add('show');
  setTimeout(function() { svcPickSearch.focus(); }, 50);
}
function closeSvcModal() {
  svcModal.classList.remove('show');
  svcPickSearch.value = '';
}

function renderSvcPicker(filter) {
  filter = (filter || '').toLowerCase().trim();
  var active = services.filter(function(s) {
    if (s.status !== 'Active') return false;
    if (!filter) return true;
    return (s.name + ' ' + s.category + ' ' + s.code).toLowerCase().indexOf(filter) !== -1;
  });
  svcPickList.innerHTML = '';
  if (active.length === 0) {
    svcPickList.innerHTML = '<div class="svc-pick-empty">No matching active services. Add services in Services panel.</div>';
    return;
  }
  active.forEach(function(s) {
    var item = document.createElement('div');
    item.className = 'svc-pick-item';
    item.innerHTML =
      '<div><strong>' + escapeHtml(s.name) + '</strong><span>' + escapeHtml(s.category) + ' · ' + escapeHtml(s.code) + '</span></div>' +
      '<div class="svc-pick-price">' + formatMoney(s.price) + '</div>';
    item.addEventListener('click', function() {
      addBillRow(s.name, 1, s.price, false);
      closeSvcModal();
      showToast(s.name + ' added to bill');
    });
    svcPickList.appendChild(item);
  });
}

document.getElementById('add-bill-item').addEventListener('click', openSvcModal);
document.getElementById('svc-modal-close').addEventListener('click', closeSvcModal);
svcModal.addEventListener('click', function(e) {
  if (e.target === svcModal) closeSvcModal();
});
svcPickSearch.addEventListener('input', function() {
  renderSvcPicker(svcPickSearch.value);
});

document.getElementById('add-custom-amount').addEventListener('click', function() {
  addBillRow('Custom charge', 1, 0, true);
});

document.getElementById('clear-bill').addEventListener('click', function() {
  billItems.querySelectorAll('.bill-row').forEach(function(r) {
    if (r.querySelector('.bi-rate')) r.remove();
  });
  calcBill();
  billPayStatus = 'Paid';
  document.getElementById('pay-paid').classList.add('active-paid');
  document.getElementById('pay-unpaid').classList.remove('active-unpaid');
  showToast('Bill cleared');
});

function collectBillItems() {
  var items = [];
  document.querySelectorAll('#bill-items .bill-row').forEach(function(row) {
    if (!row.querySelector('.bi-name')) return;
    var name = row.querySelector('.bi-name').value || '—';
    var isCustom = row.dataset.custom === '1';
    var q = isCustom ? 1 : (parseFloat(row.querySelector('.bi-qty').value) || 0);
    var r = parseFloat(row.querySelector('.bi-rate').value) || 0;
    items.push({ name: name, qty: q, rate: r, amount: q * r, custom: isCustom });
  });
  return items;
}

/* Rich colorful invoice HTML for web preview + print */
function buildPrintHTML(opts) {
  opts = opts || {};
  var cust = opts.customer || document.getElementById('bill-customer').value || 'Walk-in Customer';
  var inv = opts.invoice || document.getElementById('bill-inv').value;
  var date = opts.date || document.getElementById('bill-date').value;
  var status = opts.status || billPayStatus;
  var bizEl = document.getElementById('set-biz');
  var phoneEl = document.getElementById('set-phone');
  var emailEl = document.getElementById('set-email');
  var gstEl = document.getElementById('set-gst');
  var biz = opts.biz || (bizEl ? bizEl.value : 'RAHMATH IT SOLUTION');
  var phone = opts.phone || (phoneEl ? phoneEl.value : '');
  var email = opts.email || (emailEl ? emailEl.value : '');
  var gst = opts.gst || (gstEl ? gstEl.value : '');
  var items = opts.items || collectBillItems();
  var total = 0;
  var rows = '';
  items.forEach(function(it, i) {
    total += it.amount;
    var bg = i % 2 === 0 ? '#fffdf8' : '#ffffff';
    rows += '<tr style="background:' + bg + ';">' +
      '<td style="padding:12px 10px;border-bottom:1px solid #f0e6d0;color:#1a1200;">' + escapeHtml(it.name) + '</td>' +
      '<td style="padding:12px 10px;border-bottom:1px solid #f0e6d0;text-align:center;color:#333;">' + (it.custom ? '—' : it.qty) + '</td>' +
      '<td style="padding:12px 10px;border-bottom:1px solid #f0e6d0;text-align:right;color:#333;">' + formatMoney(it.rate) + '</td>' +
      '<td style="padding:12px 10px;border-bottom:1px solid #f0e6d0;text-align:right;font-weight:600;color:#1a1200;">' + formatMoney(it.amount) + '</td></tr>';
  });
  var statusColor = status === 'Paid' ? '#0a7a3e' : '#b91c1c';
  var statusBg = status === 'Paid' ? '#d1fae5' : '#fee2e2';
  var statusLabel = status === 'Paid' ? 'PAID' : 'UNPAID';

  return '<div class="inv-sheet" style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:680px;margin:0 auto;background:#ffffff;color:#111;box-shadow:0 8px 40px rgba(0,0,0,0.08);">' +
    /* top gold bar */
    '<div style="height:8px;background:linear-gradient(90deg,#ffb84d,#ffd88a,#ffb84d);"></div>' +
    /* header */
    '<div style="padding:28px 32px 20px;background:linear-gradient(180deg,#0d1b30 0%,#132a4d 100%);color:#fff;">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">' +
    '<div>' +
    '<div style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#ffd88a;margin-bottom:6px;">TAX INVOICE</div>' +
    '<h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:0.02em;">' + escapeHtml(biz) + '</h1>' +
    '<p style="margin:8px 0 0;font-size:12px;color:#b7c6e6;line-height:1.5;">' +
    (phone ? '☎ ' + escapeHtml(phone) + '<br>' : '') +
    (email ? '✉ ' + escapeHtml(email) + '<br>' : '') +
    (gst ? 'GSTIN: ' + escapeHtml(gst) : '') +
    '</p></div>' +
    '<div style="text-align:right;">' +
    '<div style="display:inline-block;padding:8px 16px;border-radius:999px;background:' + statusBg + ';color:' + statusColor + ';font-weight:800;font-size:13px;letter-spacing:0.08em;">' + statusLabel + '</div>' +
    '<div style="margin-top:14px;font-size:13px;color:#eaf1ff;">' +
    '<div><span style="color:#ffd88a;">Invoice</span> &nbsp;<strong>' + escapeHtml(inv) + '</strong></div>' +
    '<div style="margin-top:4px;"><span style="color:#ffd88a;">Date</span> &nbsp;<strong>' + escapeHtml(date) + '</strong></div>' +
    '</div></div></div></div>' +
    /* customer band */
    '<div style="padding:16px 32px;background:#fff8eb;border-bottom:1px solid #f0e0c0;">' +
    '<div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#9a7b3c;margin-bottom:4px;">Bill To</div>' +
    '<div style="font-size:16px;font-weight:700;color:#1a1200;">' + escapeHtml(cust) + '</div>' +
    '</div>' +
    /* table */
    '<div style="padding:8px 24px 8px;">' +
    '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
    '<thead><tr style="background:linear-gradient(90deg,#ffb84d,#ffd88a);">' +
    '<th style="padding:12px 10px;text-align:left;color:#1a1200;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;">Service / Item</th>' +
    '<th style="padding:12px 10px;text-align:center;color:#1a1200;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;">Qty</th>' +
    '<th style="padding:12px 10px;text-align:right;color:#1a1200;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;">Rate</th>' +
    '<th style="padding:12px 10px;text-align:right;color:#1a1200;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;">Amount</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
    /* totals */
    '<div style="padding:8px 32px 28px;display:flex;justify-content:flex-end;">' +
    '<div style="min-width:240px;background:linear-gradient(135deg,#0d1b30,#1a2f55);border-radius:14px;padding:18px 20px;color:#fff;">' +
    '<div style="display:flex;justify-content:space-between;font-size:13px;color:#b7c6e6;margin-bottom:8px;"><span>Subtotal</span><span>' + formatMoney(total) + '</span></div>' +
    '<div style="height:1px;background:rgba(255,216,138,0.25);margin:10px 0;"></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
    '<span style="font-size:14px;color:#ffd88a;font-weight:600;">Total</span>' +
    '<span style="font-size:22px;font-weight:800;color:#ffd88a;">' + formatMoney(total) + '</span>' +
    '</div></div></div>' +
    /* footer */
    '<div style="padding:16px 32px 24px;text-align:center;border-top:1px dashed #e8dcc0;background:#faf7f0;">' +
    '<p style="margin:0;font-size:12px;color:#6b5a3a;">Thank you for your business</p>' +
    '<p style="margin:6px 0 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#a08955;">' + escapeHtml(biz) + '</p>' +
    '</div>' +
    '<div style="height:6px;background:linear-gradient(90deg,#ffb84d,#ffd88a,#ffb84d);"></div>' +
    '</div>';
}

/* Web preview (not auto browser print) */
function showPreview(html) {
  var body = document.getElementById('preview-body');
  var overlay = document.getElementById('preview-overlay');
  var printArea = document.getElementById('print-area');
  if (!body || !overlay) {
    console.error('Preview elements missing');
    alert('Preview unavailable');
    return;
  }
  body.innerHTML = html;
  if (printArea) {
    printArea.innerHTML = html;
    printArea.style.display = 'none';
  }
  overlay.classList.add('show');
  overlay.style.display = 'flex';
  // scroll overlay to top
  overlay.scrollTop = 0;
}

function closePreview() {
  var overlay = document.getElementById('preview-overlay');
  if (overlay) {
    overlay.classList.remove('show');
    overlay.style.display = 'none';
  }
}

document.getElementById('preview-close').addEventListener('click', closePreview);
document.getElementById('preview-overlay').addEventListener('click', function(e) {
  if (e.target.id === 'preview-overlay') closePreview();
});
document.getElementById('preview-print').addEventListener('click', function() {
  var pa = document.getElementById('print-area');
  if (pa) {
    pa.style.display = 'block';
  }
  setTimeout(function() {
    window.print();
    setTimeout(function() {
      if (pa) pa.style.display = 'none';
    }, 400);
  }, 50);
});

function persistCurrentBill() {
  var items = collectBillItems();
  var total = items.reduce(function(s, it) { return s + it.amount; }, 0);
  var inv = document.getElementById('bill-inv').value;
  var bill = {
    invoice: inv,
    customer: document.getElementById('bill-customer').value || 'Walk-in Customer',
    date: document.getElementById('bill-date').value,
    status: billPayStatus,
    total: total,
    items: items,
    createdAt: new Date().toISOString()
  };
  var list = loadBills();
  // replace if same invoice exists
  var idx = list.findIndex(function(b) { return b.invoice === inv; });
  if (idx >= 0) list[idx] = bill;
  else list.unshift(bill);
  saveBills(list);
  commitInvoiceNo(inv);
  return bill;
}

document.getElementById('save-bill').addEventListener('click', function() {
  var items = collectBillItems();
  if (!items.length) { showToast('Add at least one item'); return; }
  var bill = persistCurrentBill();
  showPreview(buildPrintHTML({
    invoice: bill.invoice,
    customer: bill.customer,
    date: bill.date,
    status: bill.status,
    items: bill.items
  }));
  showToast('Bill ' + bill.invoice + ' saved (' + bill.status + ')');
  refreshInvoiceField();
  billItems.querySelectorAll('.bill-row').forEach(function(r) {
    if (r.querySelector('.bi-rate')) r.remove();
  });
  calcBill();
  billPayStatus = 'Paid';
  document.getElementById('pay-paid').classList.add('active-paid');
  document.getElementById('pay-unpaid').classList.remove('active-unpaid');
});

document.getElementById('print-bill').addEventListener('click', function() {
  var items = collectBillItems();
  if (!items.length) { showToast('Add at least one item'); return; }
  showPreview(buildPrintHTML());
  showToast('Invoice preview ready');
});

/* ========== SERVICES ========== */
var services = [];

function defaultServices() {
  return [
    { code: 'SVC-001', name: 'Website Design', category: 'Web', price: 8500, status: 'Active' },
    { code: 'SVC-002', name: 'IT Support (Monthly)', category: 'IT Support', price: 2500, status: 'Active' },
    { code: 'SVC-003', name: 'Custom Software', category: 'Software', price: 25000, status: 'Active' },
    { code: 'SVC-004', name: 'POS Setup', category: 'Software', price: 12000, status: 'Active' },
    { code: 'SVC-005', name: 'Network Cabling', category: 'Hardware', price: 4500, status: 'Inactive' }
  ];
}

function loadServices() {
  try {
    var raw = localStorage.getItem(SVC_KEY);
    if (raw) services = JSON.parse(raw);
    else { services = defaultServices(); saveServicesData(); }
  } catch (e) {
    services = defaultServices();
  }
  renderServices();
}

function saveServicesData() {
  localStorage.setItem(SVC_KEY, JSON.stringify(services));
}

function renderServices() {
  var body = document.getElementById('inventory-body');
  body.innerHTML = '';
  if (services.length === 0) {
    body.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--ink-dim);padding:28px;">No services yet. Add one above.</td></tr>';
    return;
  }
  services.forEach(function(s, idx) {
    var tr = document.createElement('tr');
    var badge = s.status === 'Active' ? 'green' : 'red';
    tr.innerHTML =
      '<td>' + escapeHtml(s.code) + '</td>' +
      '<td>' + escapeHtml(s.name) + '</td>' +
      '<td>' + escapeHtml(s.category) + '</td>' +
      '<td>' + formatMoney(s.price) + '</td>' +
      '<td><span class="badge ' + badge + '">' + escapeHtml(s.status) + '</span></td>' +
      '<td><button type="button" class="btn btn-danger btn-sm" data-del="' + idx + '">Delete</button></td>';
    body.appendChild(tr);
  });
  body.querySelectorAll('[data-del]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var i = parseInt(btn.getAttribute('data-del'), 10);
      if (confirm('Delete service "' + services[i].name + '"?')) {
        services.splice(i, 1);
        saveServicesData();
        renderServices();
        showToast('Service deleted');
      }
    });
  });
}

document.getElementById('add-service-btn').addEventListener('click', function() {
  document.getElementById('add-service-form').style.display = 'block';
});
document.getElementById('cancel-service-btn').addEventListener('click', function() {
  document.getElementById('add-service-form').style.display = 'none';
});
document.getElementById('save-service-btn').addEventListener('click', function() {
  var name = document.getElementById('svc-name').value.trim();
  var cat = document.getElementById('svc-cat').value;
  var price = parseFloat(document.getElementById('svc-price').value) || 0;
  var status = document.getElementById('svc-status').value;
  if (!name) { showToast('Enter service name'); return; }
  var code = 'SVC-' + String(services.length + 1).padStart(3, '0');
  services.push({ code: code, name: name, category: cat, price: price, status: status });
  saveServicesData();
  renderServices();
  document.getElementById('svc-name').value = '';
  document.getElementById('svc-price').value = '';
  document.getElementById('add-service-form').style.display = 'none';
  showToast('Service added');
});

loadServices();

/* ========== REPORTS ========== */
function renderReports() {
  var bills = loadBills();
  var paidTotal = 0, unpaidTotal = 0, unpaidCount = 0, allTotal = 0;
  bills.forEach(function(b) {
    var t = Number(b.total) || 0;
    allTotal += t;
    if (b.status === 'Unpaid') { unpaidTotal += t; unpaidCount++; }
    else paidTotal += t;
  });
  document.getElementById('rep-sales').textContent = formatMoney(allTotal);
  document.getElementById('rep-paid').textContent = formatMoney(paidTotal);
  document.getElementById('rep-unpaid').textContent = formatMoney(unpaidTotal);
  document.getElementById('rep-unpaid-count').textContent = unpaidCount + ' bill' + (unpaidCount === 1 ? '' : 's') + ' pending';

  var ub = document.getElementById('unpaid-body');
  var unpaid = bills.filter(function(b) { return b.status === 'Unpaid'; });
  if (!unpaid.length) {
    ub.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--ink-dim);padding:24px;">No unpaid bills 🎉</td></tr>';
  } else {
    ub.innerHTML = '';
    unpaid.forEach(function(b) {
      var tr = document.createElement('tr');
      tr.className = 'unpaid-row';
      tr.innerHTML =
        '<td>' + escapeHtml(b.invoice) + '</td>' +
        '<td>' + escapeHtml(b.customer) + '</td>' +
        '<td>' + formatMoney(b.total) + '</td>' +
        '<td>' + escapeHtml(b.date) + '</td>' +
        '<td><span class="badge red">Unpaid</span></td>' +
        '<td><button type="button" class="btn-mark-paid" data-inv="' + escapeAttr(b.invoice) + '">Mark Paid</button></td>';
      ub.appendChild(tr);
    });
    ub.querySelectorAll('.btn-mark-paid').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var inv = btn.getAttribute('data-inv');
        var list = loadBills();
        var bill = list.find(function(x) { return x.invoice === inv; });
        if (bill) {
          bill.status = 'Paid';
          saveBills(list);
          showToast(inv + ' marked as Paid');
          renderReports();
        }
      });
    });
  }

  var ab = document.getElementById('all-bills-body');
  if (!bills.length) {
    ab.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--ink-dim);padding:24px;">No bills saved yet</td></tr>';
  } else {
    ab.innerHTML = '';
    bills.forEach(function(b) {
      var badge = b.status === 'Paid' ? 'green' : 'red';
      var tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.innerHTML =
        '<td>' + escapeHtml(b.invoice) + '</td>' +
        '<td>' + escapeHtml(b.customer) + '</td>' +
        '<td>' + formatMoney(b.total) + '</td>' +
        '<td>' + escapeHtml(b.date) + '</td>' +
        '<td><span class="badge ' + badge + '">' + escapeHtml(b.status) + '</span></td>';
      tr.addEventListener('click', function() {
        showPreview(buildPrintHTML({
          invoice: b.invoice,
          customer: b.customer,
          date: b.date,
          status: b.status,
          items: b.items || []
        }));
      });
      ab.appendChild(tr);
    });
  }
}

/* ========== COOKED SOFTWARES ========== */
function loadSoftwares() {
  try { return JSON.parse(localStorage.getItem(SOFT_KEY) || '[]'); }
  catch (e) { return []; }
}

function saveSoftwares(list) {
  localStorage.setItem(SOFT_KEY, JSON.stringify(list));
  renderSoftwares();
}

function renderSoftwares() {
  var list = loadSoftwares();
  var grid = document.getElementById('soft-grid');
  var empty = document.getElementById('soft-empty');
  grid.innerHTML = '';
  if (list.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  list.forEach(function(s, idx) {
    var card = document.createElement('div');
    card.className = 'soft-card';
    var icon = s.name.match(/\.html?$/i) ? '🌐' : s.name.match(/\.zip$/i) ? '📦' : s.name.match(/\.exe$/i) ? '⚙️' : '📄';
    card.innerHTML =
      '<div class="soft-icon">' + icon + '</div>' +
      '<h4>' + escapeHtml(s.name) + '</h4>' +
      '<p>' + escapeHtml(s.desc || 'Uploaded software') + '</p>' +
      '<div class="soft-meta">' + formatSize(s.size) + ' · ' + escapeHtml(s.date) + '</div>' +
      '<div class="soft-actions">' +
      '<button type="button" class="btn btn-ghost btn-sm" data-dl="' + idx + '">Download</button>' +
      '<button type="button" class="btn btn-danger btn-sm" data-rm="' + idx + '">Delete</button>' +
      '</div>';
    grid.appendChild(card);
  });
  grid.querySelectorAll('[data-dl]').forEach(function(btn) {
    btn.addEventListener('click', function() { downloadSoft(parseInt(btn.getAttribute('data-dl'), 10)); });
  });
  grid.querySelectorAll('[data-rm]').forEach(function(btn) {
    btn.addEventListener('click', function() { deleteSoft(parseInt(btn.getAttribute('data-rm'), 10)); });
  });
}

function escapeHtml(text) {
  var d = document.createElement('div');
  d.textContent = text == null ? '' : text;
  return d.innerHTML;
}
function formatSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function downloadSoft(idx) {
  var list = loadSoftwares();
  var s = list[idx];
  if (!s || !s.data) return;
  var a = document.createElement('a');
  a.href = s.data;
  a.download = s.name;
  a.click();
  showToast('Downloading ' + s.name);
}

function deleteSoft(idx) {
  var list = loadSoftwares();
  list.splice(idx, 1);
  saveSoftwares(list);
  showToast('Software removed');
}

document.getElementById('clear-all-soft').addEventListener('click', function() {
  if (confirm('Remove all uploaded softwares?')) {
    saveSoftwares([]);
    showToast('All softwares cleared');
  }
});

var uploadZone = document.getElementById('upload-zone');
var softFile = document.getElementById('soft-file');

uploadZone.addEventListener('click', function() { softFile.click(); });
uploadZone.addEventListener('dragover', function(e) { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', function() { uploadZone.classList.remove('dragover'); });
uploadZone.addEventListener('drop', function(e) {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});
softFile.addEventListener('change', function() { handleFiles(softFile.files); });

function handleFiles(files) {
  var list = loadSoftwares();
  var pending = files.length;
  if (!pending) return;
  Array.from(files).forEach(function(file) {
    var reader = new FileReader();
    reader.onload = function(ev) {
      list.push({
        name: file.name,
        size: file.size,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        desc: 'Uploaded ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        data: ev.target.result
      });
      pending--;
      if (pending === 0) {
        saveSoftwares(list);
        showToast(files.length + ' software(s) uploaded & saved!');
      }
    };
    reader.readAsDataURL(file);
  });
}

renderSoftwares();

/* ========== SETTINGS ========== */
document.querySelectorAll('.toggle').forEach(function(tog) {
  tog.addEventListener('click', function() { tog.classList.toggle('on'); });
});
document.getElementById('save-settings').addEventListener('click', function() {
  var curSel = document.getElementById('set-currency');
  if (curSel) setCurrency(curSel.value);
  applyCurrencyUI();
  showToast('Settings saved · Currency: ' + getCurrency());
});

document.getElementById('save-password').addEventListener('click', function() {
  var cur = document.getElementById('pwd-current').value;
  var neu = document.getElementById('pwd-new').value;
  var conf = document.getElementById('pwd-confirm').value;
  if (!cur || !neu) { showToast('Fill all password fields'); return; }
  if (neu !== conf) { showToast('New passwords do not match'); return; }
  if (neu.length < 3) { showToast('Password too short'); return; }
  var users = loadUsers();
  var uname = getCurrentUser();
  var u = users.find(function(x) { return x.username === uname; });
  if (!u || u.password !== cur) { showToast('Current password is wrong'); return; }
  u.password = neu;
  saveUsers(users);
  document.getElementById('pwd-current').value = '';
  document.getElementById('pwd-new').value = '';
  document.getElementById('pwd-confirm').value = '';
  showToast('Password updated successfully');
});

function renderUsers() {
  var body = document.getElementById('users-body');
  if (!body) return;
  var users = loadUsers();
  body.innerHTML = '';
  users.forEach(function(u, idx) {
    var tr = document.createElement('tr');
    var canDel = u.username !== 'admin';
    tr.innerHTML =
      '<td>' + escapeHtml(u.username) + '</td>' +
      '<td>' + escapeHtml(u.role || 'Staff') + '</td>' +
      '<td>' + (canDel ? '<button type="button" class="btn btn-danger btn-sm" data-udel="' + idx + '">Delete</button>' : '<span style="font-size:12px;color:var(--ink-dim);">Protected</span>') + '</td>';
    body.appendChild(tr);
  });
  body.querySelectorAll('[data-udel]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var i = parseInt(btn.getAttribute('data-udel'), 10);
      var users = loadUsers();
      if (users[i].username === 'admin') return;
      if (confirm('Delete user "' + users[i].username + '"?')) {
        users.splice(i, 1);
        saveUsers(users);
        renderUsers();
        showToast('User deleted');
      }
    });
  });
}

document.getElementById('add-user-btn').addEventListener('click', function() {
  document.getElementById('add-user-form').style.display = 'block';
});
document.getElementById('cancel-user-btn').addEventListener('click', function() {
  document.getElementById('add-user-form').style.display = 'none';
});
document.getElementById('save-user-btn').addEventListener('click', function() {
  var name = document.getElementById('new-user-name').value.trim();
  var pass = document.getElementById('new-user-pass').value;
  var role = document.getElementById('new-user-role').value;
  if (!name || !pass) { showToast('Username and password required'); return; }
  var users = loadUsers();
  if (users.some(function(u) { return u.username === name; })) {
    showToast('Username already exists');
    return;
  }
  users.push({ username: name, password: pass, role: role });
  saveUsers(users);
  document.getElementById('new-user-name').value = '';
  document.getElementById('new-user-pass').value = '';
  document.getElementById('add-user-form').style.display = 'none';
  renderUsers();
  showToast('User "' + name + '" added');
});

/* ========== GOOGLE DRIVE (export/import backup helper) ========== */
function isGdriveConnected() {
  try { return localStorage.getItem(GDRIVE_KEY) === '1'; } catch (e) { return false; }
}
function refreshGdriveUI() {
  var on = isGdriveConnected();
  var st = document.getElementById('gdrive-status');
  var det = document.getElementById('gdrive-detail');
  var btn = document.getElementById('gdrive-connect');
  if (!st) return;
  if (on) {
    st.textContent = 'Connected';
    st.className = 'gdrive-status on';
    det.textContent = 'Backup mode on · Use Export to download JSON, upload that file to your Drive folder';
    btn.textContent = 'Disconnect';
  } else {
    st.textContent = 'Disconnected';
    st.className = 'gdrive-status off';
    det.textContent = 'Not connected · Export JSON then upload to Google Drive manually';
    btn.textContent = 'Connect';
  }
}

document.getElementById('gdrive-connect').addEventListener('click', function() {
  if (isGdriveConnected()) {
    localStorage.setItem(GDRIVE_KEY, '0');
    showToast('Google Drive disconnected');
  } else {
    localStorage.setItem(GDRIVE_KEY, '1');
    showToast('Connected · Use Export JSON & upload to Drive');
  }
  refreshGdriveUI();
});

document.getElementById('gdrive-export').addEventListener('click', function() {
  var payload = {
    exportedAt: new Date().toISOString(),
    app: 'RAHMATH IT SOLUTION',
    users: loadUsers(),
    services: services,
    bills: loadBills(),
    lastInvoice: localStorage.getItem(INV_KEY),
    softwaresMeta: loadSoftwares().map(function(s) { return { name: s.name, size: s.size, date: s.date, desc: s.desc }; })
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'rahmath-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Backup JSON downloaded — upload to Google Drive');
});

document.getElementById('gdrive-import').addEventListener('click', function() {
  document.getElementById('gdrive-file').click();
});
document.getElementById('gdrive-file').addEventListener('change', function() {
  var file = this.files && this.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    try {
      var data = JSON.parse(ev.target.result);
      if (data.users) saveUsers(data.users);
      if (data.services) { services = data.services; saveServicesData(); renderServices(); }
      if (data.bills) saveBills(data.bills);
      if (data.lastInvoice) localStorage.setItem(INV_KEY, String(data.lastInvoice));
      refreshInvoiceField();
      showToast('Backup imported successfully');
    } catch (err) {
      showToast('Invalid backup file');
    }
  };
  reader.readAsText(file);
  this.value = '';
});

/* ========== TOAST ========== */
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2800);
}

var acb = document.getElementById('add-customer-btn');
if (acb) acb.addEventListener('click', function() { showToast('Add customer form coming soon'); });


/* ========== DASHBOARD CHART ========== */
var chartAnimId = null;
function drawPLChart() {
  var canvas = document.getElementById('pl-chart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var cssW = canvas.clientWidth || 900;
  var cssH = 280;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  var months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  // demo data shaped by real bills if any
  var bills = loadBills();
  var sales = [42000, 51000, 48000, 62000, 58000, 71000];
  var profit = [12000, 15000, 11000, 18000, 16000, 21000];
  var loss = [8000, 9000, 12000, 7000, 10000, 8500];
  if (bills.length) {
    var total = bills.reduce(function(s, b) { return s + (Number(b.total) || 0); }, 0);
    var paid = bills.filter(function(b) { return b.status === 'Paid'; }).reduce(function(s, b) { return s + (Number(b.total) || 0); }, 0);
    var unpaid = total - paid;
    sales[5] = Math.max(sales[5], total);
    profit[5] = Math.max(profit[5], Math.round(paid * 0.28));
    loss[5] = Math.max(loss[5], Math.round(unpaid * 0.4) + 5000);
  }

  var pad = { t: 24, r: 16, b: 36, l: 48 };
  var W = cssW, H = cssH;
  var plotW = W - pad.l - pad.r;
  var plotH = H - pad.t - pad.b;
  var maxV = Math.max.apply(null, sales.concat(profit).concat(loss)) * 1.15;
  if (maxV < 1) maxV = 1;

  function xAt(i) { return pad.l + (plotW * i) / (months.length - 1); }
  function yAt(v) { return pad.t + plotH - (v / maxV) * plotH; }

  if (chartAnimId) cancelAnimationFrame(chartAnimId);
  var t0 = null;
  var duration = 1100;

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function frame(ts) {
    if (!t0) t0 = ts;
    var p = Math.min(1, (ts - t0) / duration);
    var e = easeOut(p);

    ctx.clearRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var gy = pad.t + (plotH * g) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.l, gy);
      ctx.lineTo(pad.l + plotW, gy);
      ctx.stroke();
      var val = Math.round(maxV * (1 - g / 4));
      ctx.fillStyle = 'rgba(183,198,230,0.55)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val >= 1000 ? (val / 1000).toFixed(0) + 'k' : String(val), pad.l - 8, gy + 4);
    }

    // month labels
    ctx.fillStyle = 'rgba(183,198,230,0.7)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    months.forEach(function(m, i) {
      ctx.fillText(m, xAt(i), H - 12);
    });

    function drawArea(data, colorTop, colorBot) {
      ctx.beginPath();
      data.forEach(function(v, i) {
        var x = xAt(i);
        var y = yAt(v * e);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(xAt(data.length - 1), pad.t + plotH);
      ctx.lineTo(xAt(0), pad.t + plotH);
      ctx.closePath();
      var grd = ctx.createLinearGradient(0, pad.t, 0, pad.t + plotH);
      grd.addColorStop(0, colorTop);
      grd.addColorStop(1, colorBot);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    function drawLine(data, stroke, width) {
      ctx.beginPath();
      data.forEach(function(v, i) {
        var x = xAt(i);
        var y = yAt(v * e);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
      // dots
      data.forEach(function(v, i) {
        var x = xAt(i);
        var y = yAt(v * e);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = stroke;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#0d1b30';
        ctx.fill();
      });
    }

    drawArea(sales, 'rgba(255,184,77,0.28)', 'rgba(255,184,77,0.02)');
    drawLine(sales, '#ffb84d', 2.5);
    drawLine(profit, '#7dffa3', 2.2);
    drawLine(loss, '#ff8b8b', 2.2);

    // glow tip on last points
    if (e > 0.85) {
      [[sales, '#ffb84d'], [profit, '#7dffa3'], [loss, '#ff8b8b']].forEach(function(pair) {
        var data = pair[0], col = pair[1];
        var x = xAt(data.length - 1);
        var y = yAt(data[data.length - 1] * e);
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = col.replace(')', ',0.25)').replace('rgb', 'rgba').replace('#ffb84d', 'rgba(255,184,77,0.25)').replace('#7dffa3', 'rgba(125,255,163,0.25)').replace('#ff8b8b', 'rgba(255,139,139,0.25)');
        // simpler glow
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fill();
      });
    }

    if (p < 1) chartAnimId = requestAnimationFrame(frame);
  }
  chartAnimId = requestAnimationFrame(frame);
}

function renderDashRecent() {
  var body = document.getElementById('dash-recent-body');
  if (!body) return;
  var bills = loadBills().slice(0, 6);
  if (!bills.length) {
    body.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--ink-dim);padding:20px;">Save bills to see them here</td></tr>';
    return;
  }
  body.innerHTML = '';
  bills.forEach(function(b) {
    var badge = b.status === 'Paid' ? 'green' : 'red';
    var tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.innerHTML =
      '<td>' + escapeHtml(b.invoice) + '</td>' +
      '<td>' + escapeHtml(b.customer) + '</td>' +
      '<td>' + formatMoney(b.total) + '</td>' +
      '<td><span class="badge ' + badge + '">' + escapeHtml(b.status) + '</span></td>' +
      '<td>' + escapeHtml(b.date) + '</td>';
    tr.addEventListener('click', function() {
      showPreview(buildPrintHTML({
        invoice: b.invoice,
        customer: b.customer,
        date: b.date,
        status: b.status,
        items: b.items || []
      }));
    });
    body.appendChild(tr);
  });
}

function renderDashboardStats() {
  var bills = loadBills();
  var totalSales = 0;
  var customers = {};
  bills.forEach(function(b) {
    totalSales += Number(b.total) || 0;
    if (b.customer) customers[b.customer] = true;
  });
  var activeSvc = (services || []).filter(function(s) { return s.status === 'Active'; }).length;
  var elSales = document.getElementById('dash-sales');
  var elOrders = document.getElementById('dash-orders');
  var elCust = document.getElementById('dash-customers');
  var elSvc = document.getElementById('dash-services');
  var elSalesSub = document.getElementById('dash-sales-sub');
  var elOrdersSub = document.getElementById('dash-orders-sub');
  var elCustSub = document.getElementById('dash-customers-sub');
  var elSvcSub = document.getElementById('dash-services-sub');
  if (elSales) elSales.textContent = formatMoney(totalSales);
  if (elOrders) elOrders.textContent = String(bills.length);
  if (elCust) elCust.textContent = String(Object.keys(customers).length);
  if (elSvc) elSvc.textContent = String(activeSvc);
  if (elSalesSub) elSalesSub.textContent = bills.length ? 'From saved bills' : 'No sales yet';
  if (elOrdersSub) elOrdersSub.textContent = bills.length ? 'Total bills' : 'No orders yet';
  if (elCustSub) elCustSub.textContent = Object.keys(customers).length ? 'Unique bill customers' : 'No customers yet';
  if (elSvcSub) elSvcSub.textContent = activeSvc ? 'Active services' : 'No active services';
}

function renderTodayStats() {
  var bills = loadBills();
  var todayStr = new Date().toISOString().slice(0, 10);
  var todayBills = bills.filter(function(b) { return (b.date || '').slice(0, 10) === todayStr; });
  var cash = 0;
  var pending = 0;
  todayBills.forEach(function(b) {
    var t = Number(b.total) || 0;
    if (b.status === 'Paid') cash += t;
    else pending++;
  });
  // also count all unpaid as pending if no date match — keep simple: unpaid overall for pending
  var unpaidAll = bills.filter(function(b) { return b.status === 'Unpaid'; }).length;
  var elCash = document.getElementById('today-cash');
  var elBills = document.getElementById('today-bills');
  var elPend = document.getElementById('today-pending');
  if (elCash) elCash.textContent = formatMoney(cash);
  if (elBills) elBills.textContent = String(todayBills.length);
  if (elPend) elPend.textContent = String(unpaidAll);
}

/* ========== RESET PASSWORD ========== */
var RESET_PWD_KEY = 'rahmath_reset_pwd';
function getResetPassword() {
  try {
    return localStorage.getItem(RESET_PWD_KEY) || 'reset@123';
  } catch (e) { return 'reset@123'; }
}
function setResetPassword(p) {
  localStorage.setItem(RESET_PWD_KEY, p);
}

var btnReset = document.getElementById('btn-system-reset');
if (btnReset) {
  btnReset.addEventListener('click', function() {
    var entered = (document.getElementById('reset-pwd-input').value || '');
    if (entered !== getResetPassword()) {
      showToast('Wrong reset password');
      return;
    }
    if (!confirm('This will erase bills, services, softwares and invoice counter. Continue?')) return;
    if (!confirm('Final confirm: RESET ALL DATA?')) return;
    try {
      localStorage.removeItem(BILLS_KEY);
      localStorage.removeItem(SVC_KEY);
      localStorage.removeItem(SOFT_KEY);
      localStorage.removeItem(INV_KEY);
      // keep users + reset password + gdrive flag + currency
    } catch (e) {}
    services = defaultServices();
    saveServicesData();
    renderServices();
    renderSoftwares();
    refreshInvoiceField();
    document.getElementById('reset-pwd-input').value = '';
    showToast('System data reset complete · Dashboard cleared');
    renderDashRecent();
    renderDashboardStats();
    renderTodayStats();
    renderReports();
    drawPLChart();
  });
}

var btnChgReset = document.getElementById('btn-change-reset-pwd');
if (btnChgReset) {
  btnChgReset.addEventListener('click', function() {
    var cur = document.getElementById('reset-pwd-cur').value;
    var neu = document.getElementById('reset-pwd-new').value;
    var conf = document.getElementById('reset-pwd-conf').value;
    if (!cur || !neu) { showToast('Fill reset password fields'); return; }
    if (cur !== getResetPassword()) { showToast('Current reset password is wrong'); return; }
    if (neu !== conf) { showToast('New passwords do not match'); return; }
    if (neu.length < 4) { showToast('Reset password too short'); return; }
    setResetPassword(neu);
    document.getElementById('reset-pwd-cur').value = '';
    document.getElementById('reset-pwd-new').value = '';
    document.getElementById('reset-pwd-conf').value = '';
    showToast('Reset password updated');
  });
}

// boot
loadUsers();
refreshGdriveUI();
var csBoot = document.getElementById('set-currency');
if (csBoot) csBoot.value = getCurrency();
setTimeout(function() {
  drawPLChart();
  renderDashRecent();
  renderDashboardStats();
  renderTodayStats();
  applyCurrencyUI();
}, 400);
