



// ── Users ──
let allUsersCache = [];


function sendMessageToUser(userId, displayName) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
  const inner = document.createElement('div');
  inner.style.cssText = 'background:var(--navy2);border:1px solid var(--border);border-radius:16px;padding:28px;width:100%;max-width:440px;';
  inner.innerHTML = '<h3 style="color:var(--white);margin-bottom:16px;">Message ' + (displayName||'User').replace(/</g,'') + '</h3>'
    + '<label style="color:var(--white);font-size:13px;display:block;margin-bottom:6px;">Subject (optional)</label>'
    + '<input type="text" id="dm-subject" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:10px;padding:10px;color:var(--white);margin-bottom:14px;box-sizing:border-box;" />'
    + '<label style="color:var(--white);font-size:13px;display:block;margin-bottom:6px;">Message</label>'
    + '<textarea id="dm-body" rows="5" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:10px;padding:10px;color:var(--white);margin-bottom:14px;box-sizing:border-box;resize:vertical;"></textarea>'
    + '<div id="dm-err" style="display:none;color:#e05555;font-size:13px;margin-bottom:12px;"></div>'
    + '<div style="display:flex;gap:10px;">'
    + '<button id="dm-cancel" style="flex:1;background:transparent;border:1px solid var(--border);color:var(--text-muted);border-radius:10px;padding:10px;cursor:pointer;">Cancel</button>'
    + '<button id="dm-send" style="flex:1;background:var(--gold);color:var(--navy);border:none;border-radius:10px;padding:10px;cursor:pointer;font-weight:700;">Send</button>'
    + '</div>';
  modal.appendChild(inner);
  document.body.appendChild(modal);
  inner.querySelector('#dm-cancel').onclick = function() { modal.remove(); };
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
  inner.querySelector('#dm-send').onclick = async function() {
    const subject = inner.querySelector('#dm-subject').value.trim();
    const body = inner.querySelector('#dm-body').value.trim();
    const err = inner.querySelector('#dm-err');
    if (!body) { err.textContent = 'Please enter a message.'; err.style.display = 'block'; return; }
    try {
      const data = await api('/api/admin/message', 'POST', { to_user_id: userId, subject: subject || null, body });
      if (data.error) { err.textContent = data.error; err.style.display = 'block'; return; }
      modal.remove();
      showToast(`✉ Message sent to ${displayName}`);
    } catch(e) {
      err.textContent = e.message || 'Failed to send message';
      err.style.display = 'block';
    }
  };
}

async function loadUsers() {
  const el = document.getElementById('users-list');
  if (!el) return;
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading…</div>';
  try {
    const data = await api('/api/admin/users?limit=100');
    allUsersCache = data?.users || data || [];
    renderUsers(allUsersCache);
  } catch(e) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><h3>Failed to load users</h3></div>';
  }
}

function filterUsers() {
  const q = (document.getElementById('users-search')?.value || '').toLowerCase();
  renderUsers(q ? allUsersCache.filter(u => (u.display_name+u.email+u.username).toLowerCase().includes(q)) : allUsersCache);
}

function renderUsers(list) {
  const el = document.getElementById('users-list');
  if (!list.length) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><h3 data-i18n="no_users">No users found</h3></div>'; return; }
  const ROLE_RANK = { listener: 0, pastor: 0, moderator: 1, admin: 2, owner: 3 };
  const canActOn = (actorRole, targetRole) => (ROLE_RANK[actorRole] ?? 0) > (ROLE_RANK[targetRole] ?? 0);
  const adminMode = ['admin', 'moderator', 'owner'].includes(user?.role);
  const isAdmin = ['admin', 'owner'].includes(user?.role);
  const isOwner = user?.role === 'owner';
  el.innerHTML = `<div class="sermon-list">${list.map(u => `
    <div class="sermon-card">
      <div style="width:44px;height:44px;border-radius:22px;background:var(--navy3);border:2px solid var(--gold-border);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">
        ${u.avatar_url ? `<img src="${u.avatar_url}" style="width:44px;height:44px;border-radius:22px;object-fit:cover;"/>` : '👤'}
      </div>
      <div class="sermon-info" style="min-width:0;overflow:hidden;">
        <div class="sermon-title">${u.display_name||u.username||'User'}${(['admin','owner'].includes(user?.role) && u.is_pro) ? ' <span style="color:#D4AF37;background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.4);border-radius:10px;padding:1px 7px;font-size:10px;font-weight:700;letter-spacing:0.5px;">👑 PRO</span>' : ''}</div>
        <div class="sermon-meta">
          <span style="word-break:break-all;">${u.email||''}</span>
          <span style="padding:2px 8px;border-radius:8px;font-size:11px;background:${u.role==='owner'?'rgba(186,104,255,0.15)':u.role==='admin'?'rgba(212,175,55,0.15)':u.role==='moderator'?'rgba(100,150,255,0.15)':u.role==='pastor'?'rgba(64,201,106,0.15)':'rgba(255,255,255,0.05)'};color:${u.role==='owner'?'#ba68ff':u.role==='admin'?'#D4AF37':u.role==='moderator'?'#6496ff':u.role==='pastor'?'#40c96a':'var(--text-muted)'};">${u.role||'listener'}</span>
          ${u.is_active===false?'<span style="padding:2px 8px;border-radius:8px;font-size:11px;background:rgba(224,85,85,0.15);color:#e05555;">Suspended</span>':''}
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end;">
        ${u.id === user?.id ? `<span style="color:var(--text-muted);font-size:11px;padding:6px 4px;">This is you</span>` : adminMode ? `
        ${isAdmin && canActOn(user?.role, u.role) ? `<button class="btn btn-sm" style="background:rgba(100,150,255,0.1);border:1px solid rgba(100,150,255,0.3);color:#6496ff;" onclick="changeUserRole('${u.id}','${(u.display_name||u.username||'').replace(/'/g,'')}','${u.role||'listener'}')">👤 Role</button>` : ''}
        ${canActOn(user?.role, u.role) ? `<button class="btn btn-sm" style="background:${u.is_active===false?'rgba(64,201,106,0.1)':'rgba(224,85,85,0.1)'};border:1px solid ${u.is_active===false?'rgba(64,201,106,0.3)':'rgba(224,85,85,0.3)'};color:${u.is_active===false?'#40c96a':'#e05555'};" onclick="suspendUser('${u.id}','${(u.display_name||u.username||'').replace(/'/g,'')}',${u.is_active===false})">${u.is_active===false?'✓ Reinstate':'⊘ Suspend'}</button>` : ''}
        ${isAdmin && canActOn(user?.role, u.role) ? `<button class="btn btn-sm" style="background:rgba(224,85,85,0.15);border:1px solid rgba(224,85,85,0.4);color:#e05555;" onclick="deleteUser('${u.id}','${(u.display_name||u.username||'').replace(/'/g,'')}')">🗑 Delete</button>` : ''}
        <button class="btn btn-sm" style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.2);color:#D4AF37;" onclick="sendMessageToUser('${u.id}','${(u.display_name||u.username||'').replace(/'/g,'')}')">✉ Message</button>
        ` : ''}
      </div>
    </div>
  `).join('')}</div>`;
}

async function suspendUser(id, name, isSuspended) {
  const action = isSuspended ? 'reinstate' : 'suspend';
  const reason = isSuspended ? null : prompt('Reason for suspending ' + name + ' (optional):');
  if (!isSuspended && reason === null) return;
  try {
    await api('/api/admin/users/' + id + '/suspend', 'PUT', { suspended: !isSuspended, reason });
    showToast(isSuspended ? 'User reinstated successfully' : 'User suspended successfully');
    loadUsers();
  } catch(e) { showToast(pdTr('failed_update_user_status'), 'error'); }
}

async function deleteUser(id, name) {
  const typed = prompt('This will permanently delete "' + name + '"\'s account (email, username and profile will be anonymised). Their sermons and comments are not affected.\n\nType the account name exactly to confirm:');
  if (typed !== name) {
    if (typed !== null) showToast(pdTr('name_did_not_match'));
    return;
  }
  try {
    await api('/api/admin/users/' + id, 'DELETE');
    showToast(pdTr('account_deleted_successfully'));
    loadUsers();
  } catch(e) { showToast(e?.message || 'Failed to delete account', 'error'); }
}

async function changeUserRole(id, name, currentRole) {
  const roles = ['listener', 'pastor', 'moderator', ...(user?.role === 'owner' ? ['admin'] : [])];
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
  const inner = document.createElement('div');
  inner.style.cssText = 'background:var(--navy2);border:1px solid var(--border);border-radius:16px;padding:28px;width:100%;max-width:400px;';
  inner.innerHTML = '<h3 style="color:var(--white);margin-bottom:16px;">Change Role: ' + name + '</h3>'
    + '<select id="role-select-inner" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:10px;padding:10px;color:var(--white);margin-bottom:12px;">'
    + roles.map(r => `<option value="${r}" ${r===currentRole?'selected':''}>${r}</option>`).join('')
    + '</select>'
    + '<div id="role-err-inner" style="display:none;color:#e05555;font-size:13px;margin-bottom:12px;"></div>'
    + '<div style="display:flex;gap:10px;">'
    + '<button id="role-cancel-inner" style="flex:1;background:transparent;border:1px solid var(--border);color:var(--text-muted);border-radius:10px;padding:10px;cursor:pointer;">Cancel</button>'
    + '<button id="role-save-inner" style="flex:1;background:var(--gold);color:var(--navy);border:none;border-radius:10px;padding:10px;cursor:pointer;font-weight:700;">Save</button>'
    + '</div>';
  modal.appendChild(inner);
  document.body.appendChild(modal);
  inner.querySelector('#role-cancel-inner').onclick = function() { modal.remove(); };
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
  inner.querySelector('#role-save-inner').onclick = async function() {
    const newRole = inner.querySelector('#role-select-inner').value;
    if (newRole === currentRole) { modal.remove(); return; }
    try {
      await api('/api/admin/users/' + id + '/role', 'PUT', { role: newRole });
      modal.remove();
      showToast(pdTr('role_updated') + newRole);
      loadUsers();
    } catch(e) {
      const err = inner.querySelector('#role-err-inner');
      err.textContent = e.message || 'Failed to update role';
      err.style.display = 'block';
    }
  };
}

// ── Ownership Transfer (owner only) ──
async function openTransferOwnershipModal() {
  if (user?.role !== 'owner') return;

  // Always fetch a fresh list rather than trusting a possibly-stale cache
  let candidates = [];
  try {
    const data = await api('/api/admin/users?limit=100');
    allUsersCache = data?.users || data || [];
    candidates = allUsersCache.filter(u => u.id !== user.id && u.is_active !== false);
  } catch(e) {
    candidates = allUsersCache.filter(u => u.id !== user.id && u.is_active !== false);
  }

  let selectedId = null;

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
  const inner = document.createElement('div');
  inner.style.cssText = 'background:var(--navy2);border:1px solid var(--border);border-radius:16px;padding:28px;width:100%;max-width:440px;max-height:85vh;overflow-y:auto;';
  inner.innerHTML = '<h3 style="color:#e05555;margin-bottom:8px;">⚠️ Transfer Ownership</h3>'
    + '<p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">This will make the selected user the sole Owner and demote you to Admin. This cannot be undone by you.</p>'
    + '<label style="color:var(--white);font-size:13px;display:block;margin-bottom:6px;">Select new owner</label>'
    + '<input type="text" id="transfer-user-search" placeholder="🔍 Search by name or username..." style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:10px;padding:10px;color:var(--white);margin-bottom:8px;box-sizing:border-box;" />'
    + '<div id="transfer-user-list" style="max-height:180px;overflow-y:auto;border:1px solid var(--border);border-radius:10px;margin-bottom:14px;"></div>'
    + '<div id="transfer-selected-label" style="color:var(--gold);font-size:12px;margin-bottom:14px;display:none;"></div>'
    + '<label style="color:var(--white);font-size:13px;display:block;margin-bottom:6px;">Your password</label>'
    + '<div style="position:relative;margin-bottom:14px;">'
    + '<input type="password" id="transfer-password" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:10px;padding:10px;padding-right:60px;color:var(--white);box-sizing:border-box;" />'
    + '<span onclick="const i=document.getElementById(\'transfer-password\');i.type=i.type===\'password\'?\'text\':\'password\';this.textContent=i.type===\'password\'?\'SHOW\':\'HIDE\';" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:var(--gold);font-size:11px;font-weight:700;cursor:pointer;">SHOW</span>'
    + '</div>'
    + '<label style="color:var(--white);font-size:13px;display:block;margin-bottom:6px;">Type TRANSFER OWNERSHIP to confirm</label>'
    + '<div style="position:relative;margin-bottom:14px;">'
    + '<input type="password" id="transfer-confirm" style="width:100%;background:var(--navy3);border:1px solid var(--border);border-radius:10px;padding:10px;padding-right:60px;color:var(--white);box-sizing:border-box;text-transform:uppercase;" />'
    + '<span onclick="const i=document.getElementById(\'transfer-confirm\');i.type=i.type===\'password\'?\'text\':\'password\';this.textContent=i.type===\'password\'?\'SHOW\':\'HIDE\';" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:var(--gold);font-size:11px;font-weight:700;cursor:pointer;">SHOW</span>'
    + '</div>'
    + '<div id="transfer-err" style="display:none;color:#e05555;font-size:13px;margin-bottom:12px;"></div>'
    + '<div style="display:flex;gap:10px;">'
    + '<button id="transfer-cancel" style="flex:1;background:transparent;border:1px solid var(--border);color:var(--text-muted);border-radius:10px;padding:10px;cursor:pointer;">Cancel</button>'
    + '<button id="transfer-save" style="flex:1;background:#e05555;color:#fff;border:none;border-radius:10px;padding:10px;cursor:pointer;font-weight:700;">Transfer</button>'
    + '</div>';
  modal.appendChild(inner);
  document.body.appendChild(modal);

  function renderCandidateList(filterText) {
    const listEl = inner.querySelector('#transfer-user-list');
    const q = (filterText || '').toLowerCase();
    const filtered = candidates.filter(u =>
      !q || (u.display_name||'').toLowerCase().includes(q) || (u.username||'').toLowerCase().includes(q)
    );
    if (!filtered.length) {
      listEl.innerHTML = '<div style="padding:14px;color:var(--text-muted);font-size:13px;text-align:center;">No matching users</div>';
      return;
    }
    listEl.innerHTML = filtered.map(u => `
      <div class="transfer-user-row" data-id="${u.id}" style="padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--border);background:${selectedId===u.id?'rgba(212,175,55,0.12)':'transparent'};color:var(--white);font-size:13px;">
        ${(u.display_name||u.username||'User').replace(/</g,'')} <span style="color:var(--text-muted);">· ${u.role||'listener'}</span>
      </div>
    `).join('');
    listEl.querySelectorAll('.transfer-user-row').forEach(row => {
      row.onclick = function() {
        selectedId = row.getAttribute('data-id');
        const u = candidates.find(c => c.id === selectedId);
        const label = inner.querySelector('#transfer-selected-label');
        label.style.display = 'block';
        label.textContent = 'Selected: ' + (u?.display_name || u?.username || 'User');
        renderCandidateList(inner.querySelector('#transfer-user-search').value);
      };
    });
  }
  renderCandidateList('');
  inner.querySelector('#transfer-user-search').oninput = function() { renderCandidateList(this.value); };

  inner.querySelector('#transfer-cancel').onclick = function() { modal.remove(); };
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
  inner.querySelector('#transfer-save').onclick = async function() {
    const newOwnerId = selectedId;
    const password = inner.querySelector('#transfer-password').value;
    const confirmationText = inner.querySelector('#transfer-confirm').value;
    const err = inner.querySelector('#transfer-err');
    if (!newOwnerId) { err.textContent = 'Please select a user.'; err.style.display = 'block'; return; }
    if (confirmationText !== 'TRANSFER OWNERSHIP') { err.textContent = 'Confirmation text does not match.'; err.style.display = 'block'; return; }
    try {
      const res = await api('/api/admin/users/transfer-ownership', 'POST', { newOwnerId, password, confirmationText });
      if (res?.success) {
        modal.remove();
        alert(pdTr('ownership_transferred_now_admin'));
        localStorage.removeItem('pastor_token');
        localStorage.removeItem('pastor_user');
        location.reload();
      } else {
        err.textContent = res?.error || 'Transfer failed';
        err.style.display = 'block';
      }
    } catch(e) {
      err.textContent = e.message || 'Transfer failed';
      err.style.display = 'block';
    }
  };
}

// ── Audit Log (owner only) ──
async function loadAuditLog() {
  const el = document.getElementById('audit-list');
  if (!el) return;
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading…</div>';
  try {
    const data = await api('/api/admin/audit/role-changes');
    renderAuditLog(data?.logs || []);
  } catch(e) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><h3>Failed to load audit log</h3></div>';
  }
}

function renderAuditLog(logs) {
  const el = document.getElementById('audit-list');
  if (!logs.length) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">📜</div><h3>No role changes yet</h3></div>'; return; }
  el.innerHTML = `<div class="sermon-list">${logs.map(log => `
    <div class="sermon-card">
      <div class="sermon-info">
        <div class="sermon-title" style="font-size:13px;font-weight:400;">
          <strong>${log.actor_name||'Someone'}</strong> changed <strong>${log.target_name||'a user'}</strong>'s role from
          <span style="color:var(--gold);">${log.old_role}</span> to <span style="color:var(--gold);">${log.new_role}</span>
        </div>
        <div class="sermon-meta"><span>${log.changed_at ? new Date(log.changed_at).toLocaleString() : ''}</span></div>
      </div>
      <div style="display:flex;flex-shrink:0;">
        <button class="btn btn-sm" style="background:rgba(224,85,85,0.1);border:1px solid rgba(224,85,85,0.3);color:#e05555;" onclick="deleteAuditEntry(${log.id})">🗑</button>
      </div>
    </div>
  `).join('')}</div>`;
}

async function deleteAuditEntry(id) {
  if (!confirm(pdTr('delete_audit_log_entry'))) return;
  try {
    await api('/api/admin/audit/role-changes/' + id, 'DELETE');
    loadAuditLog();
  } catch(e) { showToast(pdTr('failed_delete_entry'), 'error'); }
}

async function clearAuditLog() {
  if (!confirm(pdTr('delete_all_audit_log'))) return;
  try {
    await api('/api/admin/audit/role-changes', 'DELETE');
    loadAuditLog();
  } catch(e) { showToast(pdTr('failed_clear_audit_log'), 'error'); }
}

// ── Pastors ──
let allPastorsCache = [];
let pastorSortMode = 'alphabetical';
let pastorProOnly = false;

async function loadPastorsList() {
  try {
    const sortParam = pastorSortMode === 'followers' ? '&sort=followers' : '';
    const proParam = pastorProOnly ? '&is_pro=true' : '';
    const data = await api('/api/pastors?limit=100' + sortParam + proParam);
    allPastorsCache = Array.isArray(data) ? data : (data?.pastors||[]);
    renderPastors(allPastorsCache);
  } catch(e) {
    const el = document.getElementById('pastors-list');
    if (el) el.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><h3>Failed to load pastors</h3></div>';
  }
}

function setPastorSort(mode) {
  pastorSortMode = mode;
  const btnAz = document.getElementById('pastor-sort-az');
  const btnFollowers = document.getElementById('pastor-sort-followers');
  const activeStyle = 'padding:7px 14px;border-radius:18px;border:1px solid var(--gold-border);background:var(--gold-light);color:var(--gold);font-size:12px;font-weight:600;cursor:pointer;';
  const inactiveStyle = 'padding:7px 14px;border-radius:18px;border:1px solid var(--border);background:transparent;color:var(--text-muted);font-size:12px;font-weight:600;cursor:pointer;';
  if (btnAz) btnAz.style.cssText = mode === 'alphabetical' ? activeStyle : inactiveStyle;
  if (btnFollowers) btnFollowers.style.cssText = mode === 'followers' ? activeStyle : inactiveStyle;
  loadPastorsList();
}

function togglePastorPro() {
  pastorProOnly = !pastorProOnly;
  const btn = document.getElementById('pastor-pro-only');
  const activeStyle = 'padding:7px 14px;border-radius:18px;border:1px solid var(--gold-border);background:var(--gold-light);color:var(--gold);font-size:12px;font-weight:600;cursor:pointer;';
  const inactiveStyle = 'padding:7px 14px;border-radius:18px;border:1px solid var(--border);background:transparent;color:var(--text-muted);font-size:12px;font-weight:600;cursor:pointer;';
  if (btn) btn.style.cssText = pastorProOnly ? activeStyle : inactiveStyle;
  loadPastorsList();
}

function filterPastors() {
  const q = (document.getElementById('pastor-search')?.value || '').toLowerCase();
  renderPastors(q ? allPastorsCache.filter(p => (p.display_name+p.username+(p.church_name||'')).toLowerCase().includes(q)) : allPastorsCache);
}

function renderPastors(list) {
  const el = document.getElementById('pastors-list');
  if (!el) return;
  if (!list.length) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">✝️</div><h3 data-i18n="no_pastors_yet">No verified pastors yet</h3><p data-i18n="no_apps">Approved pastor applications will appear here.</p></div>'; return; }
  el.innerHTML = `<div class="sermon-list">${list.map(p => `
    <div class="sermon-card">
      <div style="width:44px;height:44px;border-radius:22px;background:rgba(212,175,55,0.1);border:2px solid var(--gold-border);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">✝</div>
      <div class="sermon-info">
        <div class="sermon-title">${p.display_name||p.username||'Pastor'}${(p.is_pro && (['admin','owner'].includes(user?.role) || p.id === user?.id)) ? ' <span style="color:#D4AF37;background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.4);border-radius:10px;padding:1px 7px;font-size:10px;font-weight:700;letter-spacing:0.5px;">👑 PRO</span>' : ''}</div>
        <div class="sermon-meta">
          <span>${p.church_name||'—'}</span>
          <span>${p.denomination||''}</span>
          <span>${p.country||''}</span>
        </div>
        <div class="sermon-meta" style="margin-top:4px;">
          <span>📖 ${p.sermons_count||0} sermons</span>
          <span>👥 ${p.followers_count||0} followers</span>
          <span>👁 ${parseInt(p.total_views||0).toLocaleString()} views</span>
        </div>
      </div>
      <div><span class="status-badge status-live" data-i18n="verified_label">VERIFIED</span></div>
    </div>
    <div style="display:flex;gap:6px;margin-top:8px;">

    </div>
  `).join('')}</div>`;
}

// ── Explore ──
let exploreAllSermons = [];
let exploreActiveCat = 'All';
let exploreSearchQ = '';

async function loadExplore() {
  const el = document.getElementById('explore-sermons');
  if (!el) return;
  el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);" data-i18n="loading">Loading...</div>';
  try {
    const data = await api('/api/sermons?limit=100&sort=recent');
    exploreAllSermons = (data?.sermons || data || []).sort((a,b) => new Date(b.published_at||b.created_at).getTime() - new Date(a.published_at||a.created_at).getTime());
    exploreRender();
  } catch(e) {
    el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">Could not load sermons.</div>';
  }
}

function exploreSetCat(cat) {
  exploreActiveCat = cat;
  document.querySelectorAll('.explore-cat').forEach(function(b) {
    const active = b.textContent.trim() === cat;
    b.style.background = active ? 'rgba(212,175,55,0.15)' : 'transparent';
    b.style.color = active ? 'var(--gold)' : 'var(--text-muted)';
    b.style.borderColor = active ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.15)';
  });
  exploreRender();
}

function exploreFilter() {
  exploreSearchQ = (document.getElementById('explore-search')?.value || '').toLowerCase();
  exploreRender();
}

function exploreRender() {
  const el = document.getElementById('explore-sermons');
  if (!el) return;
  const ICONS = { video:'🎬', audio:'🎧', text:'📄', article:'📰' };
  let list = exploreAllSermons;
  if (exploreActiveCat !== 'All') {
    list = list.filter(s => s.category === exploreActiveCat || (s.tags && s.tags.includes(exploreActiveCat)));
  }
  if (exploreSearchQ) {
    list = list.filter(s => (s.title||'').toLowerCase().includes(exploreSearchQ) || (s.pastor_name||'').toLowerCase().includes(exploreSearchQ));
  }
  if (!list.length) {
    el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">No sermons found.</div>';
    return;
  }
  el.innerHTML = '';
  list.forEach(function(s) {
    const card = document.createElement('div');
    card.style.cssText = 'background:var(--navy2);border:1px solid var(--border);border-radius:14px;padding:16px;cursor:pointer;';
    card.onmouseover = function() { card.style.borderColor = 'rgba(212,175,55,0.4)'; };
    card.onmouseout = function() { card.style.borderColor = 'var(--border)'; };
    card.onclick = function() { viewSermon(s.id); };
    const thumbHtml = s.thumbnail_url
      ? '<img src="' + s.thumbnail_url.replace(/"/g, '&quot;') + '" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:10px;" onerror="this.outerHTML=\'<div style=&quot;font-size:32px;margin-bottom:10px;&quot;>' + (ICONS[s.type]||'🎧') + '</div>\';"/>'
      : '<div style="font-size:32px;margin-bottom:10px;">' + (ICONS[s.type]||'🎧') + '</div>';
    card.innerHTML = thumbHtml
      + '<div style="color:var(--white);font-size:14px;font-weight:600;margin-bottom:6px;line-height:1.4;">' + s.title + '</div>'
      + '<div style="color:var(--text-muted);font-size:12px;margin-bottom:4px;">✝ ' + (s.pastor_name||'Pastor') + '</div>'
      + '<div style="color:var(--text-muted);font-size:11px;">👁 ' + parseInt(s.views_count||0).toLocaleString() + ' · ' + (s.type||'').toUpperCase() + (s.published_at ? ' · <span style="color:#c3d4e8;">' + new Date(s.published_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) + '</span>' : '') + '</div>';
    el.appendChild(card);
  });
}
const PD_TRANS={
  en:{could_not_download_title:'Could not download "{title}". Please check your connection and try again.',pro_status_granted:'Pro status granted',pro_status_revoked:'Pro status revoked',grant_label:'grant',revoke_label:'revoke',approve_pastor_confirm:'Approve {name} as a verified pastor?',change_pro_status_confirm:'Are you sure you want to {label} Pro status for this user?',pause_auto_approval_confirm:'Pause auto-approval for {name}? This application will then require manual review.',reject_application_confirm:'Reject {name}\'s application?',download_sermons_confirm:'This will download {count} sermon file(s) to your device, one at a time. Continue?',account_deleted_successfully:'Account deleted successfully',account_deleted:'Account deleted.',account_deleted_sorry_see:'Account deleted. Sorry to see you go.',all_escalations_cleared:'All escalations cleared',all_messages_cleared:'All messages cleared',all_messages_marked_as:'All messages marked as read',all_notifications_messages_cleared:'All notifications and messages cleared',all_notifications_cleared:'All notifications cleared',all_past_streams_deleted:'All past streams deleted',all_reports_cleared:'All reports cleared',all_reports_resolved:'All reports resolved',already_going_live_please:'Already going live — please wait.',archive_all_live_sermons:'Archive all live sermons?',archive_sermon:'Archive this sermon?',sure_want_sign_out:'Are you sure you want to sign out?',auto_approval_paused_now:'Auto-approval paused — now requires manual review',clear_all_escalations_cannot:'Clear all escalations? This cannot be undone.',clear_all_messages_cannot:'Clear all messages? This cannot be undone.',clear_all_notifications_sent:'Clear all notifications and sent messages? This cannot be undone.',clear_all_notifications_cannot:'Clear all notifications? This cannot be undone.',clear_all_reports_cannot:'Clear all reports? This cannot be undone.',clear_all_support_messages:'Clear all support messages? This cannot be undone.',clear_entire_listening_watching:'Clear your entire listening/watching history? This cannot be undone.',confirmation_text_did_not:'Confirmation text did not match — deletion cancelled.',confirmation_text_did_not_2:'Confirmation text did not match — nothing was deleted.',connection_error_please_try:'Connection error, please try again',connection_error_please_try_2:'Connection error. Please try again.',content_removed:'Content removed',could_not_change_quality:'Could not change quality',could_not_connect_stream:'Could not connect to stream',could_not_delete_all:'Could not delete all streams',could_not_delete_stream:'Could not delete stream',could_not_join_stream:'Could not join stream: ',could_not_load_sermon:'Could not load sermon.',could_not_open_message:'Could not open message',could_not_read_image:'Could not read image file',could_not_resend_please:'Could not resend. Please try again.',could_not_submit_report:'Could not submit report. Please check your connection and try again.',could_not_switch_camera:'Could not switch camera — your device may only have one, or a browser permission is blocking it.',could_not_update_photo:'Could not update photo',delete_all_audit_log:'Delete ALL audit log entries? This cannot be undone.',delete_all_past_streams:'Delete ALL past streams from your history? This cannot be undone.',delete_failed_please_try:'Delete failed. Please try again.',delete_audit_log_entry:'Delete this audit log entry?',delete_comment:'Delete this comment?',delete_stream_from_history:'Delete this stream from your history? This cannot be undone.',delete_stream_cannot_be:'Delete this stream? This cannot be undone.',deletion_failed_email_support:'Deletion failed. Email support@trinitarian.app to request deletion.',deletion_failed_please_email:'Deletion failed. Please email support@trinitarian.app to request account deletion.',download_failed:'Download failed',edit_failed_please_try:'Edit failed. Please try again.',end_live_stream:'End this live stream?',error_ending_stream:'Error ending stream',failed_approve_application:'Failed to approve application',failed_archive_sermon:'Failed to archive sermon',failed_archive_sermons:'Failed to archive sermons',failed_clear_audit_log:'Failed to clear audit log',failed_clear_escalations:'Failed to clear escalations',failed_clear_messages:'Failed to clear messages',failed_clear_notifications:'Failed to clear notifications',failed_clear_reports:'Failed to clear reports',failed_delete:'Failed to delete',failed_delete_all_sermons:'Failed to delete all sermons.',failed_delete_comment:'Failed to delete comment',failed_delete_comment_2:'Failed to delete comment.',failed_delete_entry:'Failed to delete entry',failed_delete_stream_live:'Failed to delete stream. Live streams must be ended first.',failed_end_stream:'Failed to end stream',failed_end_stream_2:'Failed to end stream.',failed_go_live:'Failed to go live',failed_mark_as_read:'Failed to mark as read',failed_open_sermon:'Failed to open sermon',failed_pause_auto_approval:'Failed to pause auto-approval',failed_reject_application:'Failed to reject application',failed_resolve_reports:'Failed to resolve reports',failed_save_profile:'Failed to save profile',failed_send_message:'Failed to send message',failed_send_please_try:'Failed to send. Please try again.',failed_start_stream:'Failed to start stream: ',failed_submit_report:'Failed to submit report.',failed_update_pro_status:'Failed to update Pro status',failed_update_sermon:'Failed to update sermon',failed_update_user_status:'Failed to update user status',failed_upload_photo:'Failed to upload photo',font_size_updated:'Font size updated',font_style_updated:'Font style updated',image_must_be_under:'Image must be under 5MB',language_updated:'Language updated',link_copied:'Link copied!',live_streaming_coming_soon:'Live streaming coming soon!',live_streaming_launching_soon:'Live streaming is launching soon. Stay tuned!',message_not_found:'Message not found',message_sent_successfully:'Message sent successfully',name_did_not_match:'Name did not match — deletion cancelled',no_past_streams_delete:'No past streams to delete',no_sermons_delete:'No sermons to delete.',not_currently_live:'Not currently live',notification_preference_saved:'Notification preference saved',notification_preferences_saved:'Notification preferences saved',ownership_transferred_now_admin:'Ownership transferred. You are now an Admin. Please log in again.',photo_saved_locally:'Photo saved locally',please_choose_when_stream:'Please choose when this stream should happen',please_enter_message:'Please enter a message',please_enter_message_2:'Please enter a message.',please_enter_response:'Please enter a response',please_enter_stream_title:'Please enter a stream title',please_pick_time_future:'Please pick a time in the future',please_read_accept_terms:'Please read and accept the Terms of Service and disclaimer to continue.',please_select_jpg_png:'Please select a JPG or PNG image.',please_select_reason_provide:'Please select a reason or provide details.',please_select_video_audio:'Please select a video, audio, .docx, or .txt file. PDF and legacy .doc are not supported.',please_select_image_file:'Please select an image file',please_sign_report_content:'Please sign in to report content.',please_sign_watch_live:'Please sign in to watch live streams',profile_photo_removed:'Profile photo removed',profile_photo_updated:'Profile photo updated',profile_updated_successfully:'Profile updated successfully!',remove_sermon_permanently:'Remove this sermon permanently?',report_resolved:'Report resolved',report_submitted:'Report submitted',report_comment_review:'Report this comment for review?',resolve_all_pending_reports:'Resolve all pending reports?',response_sent_moderator:'Response sent to moderator',role_updated:'Role updated to ',sermon_not_found:'Sermon not found',sermon_updated_successfully:'Sermon updated successfully',confirm_sign_out_q:'Sign out?',spacing_updated:'Spacing updated',stream_deleted:'Stream deleted',stream_ended:'Stream ended',stream_ended_great_job:'Stream ended. Great job!',stream_scheduled:'Stream scheduled for ',live_stream_has_ended:'The live stream has ended',sermon_has_no_media:'This sermon has no media file to download.',thumbnail_must_be_under:'Thumbnail must be under 5MB.',title_cannot_be_empty:'Title cannot be empty',now_live:'You are now live!',have_no_sermons_with:'You have no sermons with media files to download.',coming_soon:'Coming Soon',coming_soon_sub:'This feature is coming soon',live_coming_soon_desc:'Live streaming is under development and will be available in a future update. Stay tuned!',notify_when_ready:'You will be notified when this feature launches.',extra_large:'XL',admin_label:'ADMIN',delete_account:'Delete My Account',sermon_title_label:'Sermon Title *',content_type_label:'Content Type *',transcript_label:'Transcript / Full Text (optional)',start_dictation:'🎙 Start dictation',file_select_hint:'Click to select a video, audio or document file',search_sermons_ph:'🔍 Search sermons...',search_users_ph:'🔍 Search users...',search_pastors_ph:'🔍 Search pastors...',desc_ph:'Brief description of this sermon…',transcript_ph:'Paste the full sermon transcript here, or use dictation above…',support_ph:'Type your message to Trinitarian support…',send_to_admin:'📨 Contact Trinitarian Support',status_approved:'✅ Approved',status_rejected:'❌ Rejected',status_pending:'⏳ Pending',support_messages:'Support Messages',reports_tab:'Reports',flagged_tab:'Flagged Content',escalations_tab:'Escalations',no_sermons_upload:'No sermons yet. Click "Upload Sermon" to share your first message.',cert_note:'Uploading a certificate speeds up verification but is not required.',article:'Article',text:'Text',video:'Video',audio:'Audio',no_sermons_data:'No sermon data yet',create_account:'Create Your Account',create_password:'Create a Password',failed_notifs:'Failed to load notifications',all_pastors:'All verified pastors on Trinitarian',overview:'Overview',my_sermons:'My Sermons',upload_sermon:'Upload Sermon',live_stream:'Live Stream',settings:'Settings',profile:'Profile',notifications:'Notifications',inbox:'Inbox',pastors:'Pastors',users:'Users',analytics:'Analytics',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',sign_out:'Sign Out',sign_in:'Sign In',total_sermons:'Total Sermons',total_views:'Total Views',total_users:'Total Users',new_followers:'New Followers',new_sermons:'New Sermons',followers:'Followers',views:'Views',recent_sermons:'Recent Sermons',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'Here\'s how your ministry is performing',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Manage your account preferences',manage_profile:'Manage your pastor profile',go_live:'Go Live',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',language:'Language',publish_sermon:'Publish Sermon',edit_sermon:'Edit Sermon',remove_sermon:'Remove Sermon',save:'Save',cancel:'Cancel',delete:'Delete',dismiss:'Dismiss',preview:'Preview',save_changes:'Save Changes',send_message:'Send Message',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Font & Display',font_size:'Font Size',font_style:'Font Style',line_spacing:'Line Spacing',security:'Security',legal:'Legal',account:'Account',change_password:'Change Password',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',my_profile:'My Profile',display_name:'Display Name',email:'Email',email_address:'Email Address',username:'Username',church_name:'Church Name',denomination:'Denomination',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',create_account:'Create Your Account',create_password:'Create a Password',confirm_password:'Confirm Password',password:'Password',role:'Role',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons:'No sermons found.',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_sermons_data:'No sermon data yet',no_notifs:'No notifications yet',no_messages:'No messages yet',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading:'Loading...',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',mark_all_read:'Mark all read',small:'Small',medium:'Medium',large:'Large',normal:'Normal',compact:'Compact',relaxed:'Relaxed',default_style:'Default',serif:'Serif',mono:'Mono',video:'Video',audio:'Audio',text:'Text',article:'Article',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',privacy_policy:'Privacy Policy',terms_of_service:'Terms of Service',dmca_policy:'DMCA Policy',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Explore',nav_messages:'Messages',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'When pastors you follow go live',notif_upload:'When pastors you follow upload',notif_msg:'When you receive a message'},
  fr:{could_not_download_title:'Impossible de télécharger « {title} ». Vérifiez votre connexion et réessayez.',pro_status_granted:'Statut Pro accordé',pro_status_revoked:'Statut Pro révoqué',grant_label:'accorder',revoke_label:'révoquer',approve_pastor_confirm:'Approuver {name} en tant que pasteur vérifié ?',change_pro_status_confirm:'Êtes-vous sûr de vouloir {label} le statut Pro de cet utilisateur ?',pause_auto_approval_confirm:'Suspendre l\'approbation automatique pour {name} ? Cette candidature nécessitera alors une révision manuelle.',reject_application_confirm:'Rejeter la candidature de {name} ?',download_sermons_confirm:'Ceci téléchargera {count} fichier(s) de sermon sur votre appareil, un à la fois. Continuer ?',account_deleted_successfully:'Compte supprimé avec succès',account_deleted:'Compte supprimé.',account_deleted_sorry_see:'Compte supprimé. Désolé de vous voir partir.',all_escalations_cleared:'Toutes les escalades effacées',all_messages_cleared:'Tous les messages effacés',all_messages_marked_as:'Tous les messages marqués comme lus',all_notifications_messages_cleared:'Toutes les notifications et messages effacés',all_notifications_cleared:'Toutes les notifications effacées',all_past_streams_deleted:'Toutes les diffusions passées supprimées',all_reports_cleared:'Tous les signalements effacés',all_reports_resolved:'Tous les signalements résolus',already_going_live_please:'Diffusion déjà en cours — veuillez patienter.',archive_all_live_sermons:'Archiver tous les sermons en direct ?',archive_sermon:'Archiver ce sermon ?',sure_want_sign_out:'Êtes-vous sûr de vouloir vous déconnecter ?',auto_approval_paused_now:'Approbation automatique suspendue — révision manuelle requise',clear_all_escalations_cannot:'Effacer toutes les escalades ? Action irréversible.',clear_all_messages_cannot:'Effacer tous les messages ? Action irréversible.',clear_all_notifications_sent:'Effacer toutes les notifications et messages envoyés ? Action irréversible.',clear_all_notifications_cannot:'Effacer toutes les notifications ? Action irréversible.',clear_all_reports_cannot:'Effacer tous les signalements ? Action irréversible.',clear_all_support_messages:'Effacer tous les messages d\'assistance ? Action irréversible.',clear_entire_listening_watching:'Effacer tout votre historique d\'écoute/visionnage ? Action irréversible.',confirmation_text_did_not:'Le texte de confirmation ne correspond pas — suppression annulée.',confirmation_text_did_not_2:'Le texte de confirmation ne correspond pas — rien n\'a été supprimé.',connection_error_please_try:'Erreur de connexion, veuillez réessayer',connection_error_please_try_2:'Erreur de connexion. Veuillez réessayer.',content_removed:'Contenu supprimé',could_not_change_quality:'Impossible de changer la qualité',could_not_connect_stream:'Impossible de se connecter à la diffusion',could_not_delete_all:'Impossible de supprimer toutes les diffusions',could_not_delete_stream:'Impossible de supprimer la diffusion',could_not_join_stream:'Impossible de rejoindre la diffusion : ',could_not_load_sermon:'Impossible de charger le sermon.',could_not_open_message:'Impossible d\'ouvrir le message',could_not_read_image:'Impossible de lire le fichier image',could_not_resend_please:'Impossible de renvoyer. Veuillez réessayer.',could_not_submit_report:'Impossible de soumettre le signalement. Vérifiez votre connexion et réessayez.',could_not_switch_camera:'Impossible de changer de caméra — votre appareil n\'en a peut-être qu\'une, ou une autorisation du navigateur le bloque.',could_not_update_photo:'Impossible de mettre à jour la photo',delete_all_audit_log:'Supprimer TOUTES les entrées du journal d\'audit ? Action irréversible.',delete_all_past_streams:'Supprimer TOUTES les diffusions passées de votre historique ? Action irréversible.',delete_failed_please_try:'Échec de la suppression. Veuillez réessayer.',delete_audit_log_entry:'Supprimer cette entrée du journal d\'audit ?',delete_comment:'Supprimer ce commentaire ?',delete_stream_from_history:'Supprimer cette diffusion de votre historique ? Action irréversible.',delete_stream_cannot_be:'Supprimer cette diffusion ? Action irréversible.',deletion_failed_email_support:'Échec de la suppression. Contactez support@trinitarian.app pour demander la suppression.',deletion_failed_please_email:'Échec de la suppression. Veuillez contacter support@trinitarian.app pour demander la suppression du compte.',download_failed:'Échec du téléchargement',edit_failed_please_try:'Échec de la modification. Veuillez réessayer.',end_live_stream:'Terminer cette diffusion en direct ?',error_ending_stream:'Erreur lors de la fin de la diffusion',failed_approve_application:'Échec de l\'approbation de la candidature',failed_archive_sermon:'Échec de l\'archivage du sermon',failed_archive_sermons:'Échec de l\'archivage des sermons',failed_clear_audit_log:'Échec de l\'effacement du journal d\'audit',failed_clear_escalations:'Échec de l\'effacement des escalades',failed_clear_messages:'Échec de l\'effacement des messages',failed_clear_notifications:'Échec de l\'effacement des notifications',failed_clear_reports:'Échec de l\'effacement des signalements',failed_delete:'Échec de la suppression',failed_delete_all_sermons:'Échec de la suppression de tous les sermons.',failed_delete_comment:'Échec de la suppression du commentaire',failed_delete_comment_2:'Échec de la suppression du commentaire.',failed_delete_entry:'Échec de la suppression de l\'entrée',failed_delete_stream_live:'Échec de la suppression. Les diffusions en direct doivent d\'abord être terminées.',failed_end_stream:'Échec de la fin de la diffusion',failed_end_stream_2:'Échec de la fin de la diffusion.',failed_go_live:'Échec du démarrage de la diffusion',failed_mark_as_read:'Échec du marquage comme lu',failed_open_sermon:'Échec de l\'ouverture du sermon',failed_pause_auto_approval:'Échec de la suspension de l\'approbation automatique',failed_reject_application:'Échec du rejet de la candidature',failed_resolve_reports:'Échec de la résolution des signalements',failed_save_profile:'Échec de l\'enregistrement du profil',failed_send_message:'Échec de l\'envoi du message',failed_send_please_try:'Échec de l\'envoi. Veuillez réessayer.',failed_start_stream:'Échec du démarrage de la diffusion : ',failed_submit_report:'Échec de la soumission du signalement.',failed_update_pro_status:'Échec de la mise à jour du statut Pro',failed_update_sermon:'Échec de la mise à jour du sermon',failed_update_user_status:'Échec de la mise à jour du statut de l\'utilisateur',failed_upload_photo:'Échec du téléversement de la photo',font_size_updated:'Taille de police mise à jour',font_style_updated:'Style de police mis à jour',image_must_be_under:'L\'image doit faire moins de 5 Mo',language_updated:'Langue mise à jour',link_copied:'Lien copié !',live_streaming_coming_soon:'Diffusion en direct bientôt disponible !',live_streaming_launching_soon:'La diffusion en direct arrive bientôt. Restez à l\'écoute !',message_not_found:'Message introuvable',message_sent_successfully:'Message envoyé avec succès',name_did_not_match:'Le nom ne correspond pas — suppression annulée',no_past_streams_delete:'Aucune diffusion passée à supprimer',no_sermons_delete:'Aucun sermon à supprimer.',not_currently_live:'Pas en direct actuellement',notification_preference_saved:'Préférence de notification enregistrée',notification_preferences_saved:'Préférences de notification enregistrées',ownership_transferred_now_admin:'Propriété transférée. Vous êtes maintenant Administrateur. Veuillez vous reconnecter.',photo_saved_locally:'Photo enregistrée localement',please_choose_when_stream:'Veuillez choisir quand cette diffusion aura lieu',please_enter_message:'Veuillez saisir un message',please_enter_message_2:'Veuillez saisir un message.',please_enter_response:'Veuillez saisir une réponse',please_enter_stream_title:'Veuillez saisir un titre de diffusion',please_pick_time_future:'Veuillez choisir une heure future',please_read_accept_terms:'Veuillez lire et accepter les Conditions d\'utilisation et l\'avis de non-responsabilité pour continuer.',please_select_jpg_png:'Veuillez sélectionner une image JPG ou PNG.',please_select_reason_provide:'Veuillez sélectionner un motif ou fournir des détails.',please_select_video_audio:'Veuillez sélectionner une vidéo, un audio, un .docx ou un .txt. Le PDF et l\'ancien .doc ne sont pas pris en charge.',please_select_image_file:'Veuillez sélectionner un fichier image',please_sign_report_content:'Veuillez vous connecter pour signaler ce contenu.',please_sign_watch_live:'Veuillez vous connecter pour regarder les diffusions en direct',profile_photo_removed:'Photo de profil supprimée',profile_photo_updated:'Photo de profil mise à jour',profile_updated_successfully:'Profil mis à jour avec succès !',remove_sermon_permanently:'Supprimer définitivement ce sermon ?',report_resolved:'Signalement résolu',report_submitted:'Signalement soumis',report_comment_review:'Signaler ce commentaire pour examen ?',resolve_all_pending_reports:'Résoudre tous les signalements en attente ?',response_sent_moderator:'Réponse envoyée au modérateur',role_updated:'Rôle mis à jour vers ',sermon_not_found:'Sermon introuvable',sermon_updated_successfully:'Sermon mis à jour avec succès',confirm_sign_out_q:'Se déconnecter ?',spacing_updated:'Espacement mis à jour',stream_deleted:'Diffusion supprimée',stream_ended:'Diffusion terminée',stream_ended_great_job:'Diffusion terminée. Bien joué !',stream_scheduled:'Diffusion programmée pour ',live_stream_has_ended:'La diffusion en direct est terminée',sermon_has_no_media:'Ce sermon n\'a pas de fichier média à télécharger.',thumbnail_must_be_under:'La miniature doit faire moins de 5 Mo.',title_cannot_be_empty:'Le titre ne peut pas être vide',now_live:'Vous êtes maintenant en direct !',have_no_sermons_with:'Vous n\'avez aucun sermon avec des fichiers média à télécharger.',coming_soon:'Bientôt disponible',coming_soon_sub:'Cette fonctionnalité arrive bientôt',live_coming_soon_desc:'La diffusion en direct est en cours de développement et sera disponible prochainement.',notify_when_ready:'Vous serez notifié lorsque cette fonctionnalité sera lancée.',extra_large:'TG',admin_label:'ADMIN',delete_account:'Supprimer mon compte',sermon_title_label:'Titre du Sermon *',content_type_label:'Type de Contenu *',transcript_label:'Transcription / Texte Complet (optionnel)',start_dictation:'🎙 Démarrer la dictée',file_select_hint:'Cliquez pour sélectionner un fichier vidéo, audio ou document',search_sermons_ph:'🔍 Rechercher des sermons...',search_users_ph:'🔍 Rechercher des utilisateurs...',search_pastors_ph:'🔍 Rechercher des pasteurs...',desc_ph:'Brève description de ce sermon…',transcript_ph:'Collez la transcription complète ici, ou utilisez la dictée ci-dessus…',support_ph:'Tapez votre message au support Trinitarian…',send_to_admin:'📨 Envoyer un Message à l\'Admin',status_approved:'✅ Approuvé',status_rejected:'❌ Rejeté',status_pending:'⏳ En attente',support_messages:'Messages de Support',reports_tab:'Signalements',flagged_tab:'Contenu Signalé',escalations_tab:'Escalades',no_sermons_upload:'Pas encore de sermons. Cliquez sur "Télécharger Sermon" pour partager votre premier message.',cert_note:'Télécharger un certificat accélère la vérification mais n\'est pas obligatoire.',article:'Article',text:'Texte',video:'Vidéo',audio:'Audio',no_sermons_data:'Pas encore de données',create_account:'Créer votre compte',create_password:'Créer un mot de passe',failed_notifs:'Impossible de charger les notifications',all_pastors:'Tous les pasteurs vérifiés sur Trinitarian',overview:'Aperçu',my_sermons:'Mes Sermons',upload_sermon:'Télécharger Sermon',live_stream:'Direct',settings:'Paramètres',profile:'Profil',notifications:'Notifications',inbox:'Messages',pastors:'Pasteurs',users:'Utilisateurs',analytics:'Analytique',pastor_portal:'Portail Pasteur',admin_panel:'Panneau Admin',sign_out:'Se déconnecter',sign_in:'Se connecter',total_sermons:'Total Sermons',total_views:'Total Vues',total_users:'Total Utilisateurs',new_followers:'Nouveaux Abonnés',new_sermons:'Nouveaux Sermons',followers:'Abonnés',views:'Vues',recent_sermons:'Sermons Récents',verified_pastors:'Pasteurs Vérifiés',pending_apps:'Candidatures en attente',unresolved_flags:'Signalements non résolus',here_how:'Voici les performances de votre ministère',track_ministry:'Suivez la portée de votre ministère',share_message:'Partagez votre message avec le monde',share_worldwide:'Partagez vos sermons avec les croyants du monde entier',manage_content:'Gérez tout votre contenu téléchargé',manage_users:'Gérer les utilisateurs',manage_platform:'Gérer la plateforme',manage_account:'Gérez vos préférences de compte',manage_profile:'Gérez votre profil de pasteur',go_live:'Passer en Direct',go_live_sub:'Diffusez en direct et connectez-vous avec votre congrégation',ministry_activity:'Restez informé de votre activité ministérielle',notifs_support:'Notifications et messages de support',browse_pastors:'Parcourir les sermons de tous les pasteurs vérifiés',title:'Titre',description:'Description',category:'Catégorie',type:'Type',media_file:'Fichier Média',scripture_ref:'Référence Biblique',language:'Langue',publish_sermon:'Publier le Sermon',edit_sermon:'Modifier le Sermon',remove_sermon:'Supprimer le Sermon',save:'Enregistrer',cancel:'Annuler',delete:'Supprimer',dismiss:'Ignorer',preview:'Aperçu',save_changes:'Enregistrer',send_message:'Envoyer',stream_title:'Titre du Direct',stream_key:'Clé de Diffusion',schedule_stream:'Planifier',scheduled_dt:'Date et Heure Planifiées',go_live_btn:'Passer en Direct',your_streams:'Vos Diffusions',font_display:'Police et Affichage',font_size:'Taille de Police',font_style:'Style de Police',line_spacing:'Interligne',security:'Sécurité',legal:'Mentions légales',account:'Compte',change_password:'Changer le mot de passe',new_password:'Nouveau mot de passe',current_password:'Mot de passe actuel',confirm_new_pwd:'Confirmer le nouveau mot de passe',update_password:'Mettre à jour le mot de passe',pwd_sub:'Mettre à jour votre mot de passe',reset_password:'Réinitialiser le mot de passe',email_reset:'Entrez votre email et nous vous enverrons un lien de réinitialisation',my_profile:'Mon Profil',display_name:'Nom affiché',email:'E-mail',email_address:'Adresse e-mail',username:'Nom d\'utilisateur',church_name:'Nom de l\'Église',denomination:'Dénomination',ordaining_body:'Corps Ordonnateur',years_ministry:'Années de Ministère',bio:'Biographie',your_full_name:'Votre Nom Complet',choose_username:'Choisissez un nom d\'utilisateur',no_spaces:'Pas d\'espaces. Lettres et chiffres uniquement.',click_photo:'Cliquez sur la photo pour mettre à jour',create_account:'Créer votre compte',create_password:'Créer un mot de passe',confirm_password:'Confirmer le mot de passe',password:'Mot de passe',role:'Rôle',pastor_role:'Pasteur',pastor_label:'PASTEUR',verified_label:'VÉRIFIÉ',suspended_label:'Suspendu',change_role:'Changer le rôle',all_users:'Tous les utilisateurs',no_users:'Aucun utilisateur trouvé',failed_users:'Échec du chargement des utilisateurs',failed_pastors:'Échec du chargement des pasteurs',failed_admin:'Échec du chargement des données admin',failed_streams:'Échec du chargement des diffusions',failed_load:'Échec du chargement',no_sermons:'Aucun sermon trouvé.',no_sermons_yet:'Pas encore de sermons',upload_first:'Téléchargez votre premier sermon pour commencer',no_sermons_data:'Pas encore de données',no_notifs:'Pas encore de notifications',no_messages:'Pas encore de messages',no_streams:'Pas encore de diffusions.',no_support:'Pas encore de messages de support',no_reports:'Aucun signalement',no_flagged:'Aucun contenu signalé',no_apps:'Aucune candidature trouvée',no_content_reported:'Aucun contenu signalé pour l\'instant.',no_escalations:'Pas encore d\'escalades.',no_prev_escalations:'Pas d\'escalades précédentes.',no_pastors_yet:'Pas encore de pasteurs vérifiés',loading:'Chargement...',loading_sermons:'Chargement des sermons...',loading_reports:'Chargement des signalements...',loading_escalations:'Chargement des escalades...',could_not_sermons:'Impossible de charger les sermons.',could_not_reports:'Impossible de charger les signalements',could_not_support:'Impossible de charger les messages',mark_all_read:'Tout marquer comme lu',small:'Petit',medium:'Moyen',large:'Grand',normal:'Normal',compact:'Compact',relaxed:'Détendu',default_style:'Par défaut',serif:'Serif',mono:'Mono',video:'Vidéo',audio:'Audio',text:'Texte',article:'Article',all:'Tous',faith:'Foi',healing:'Guérison',marriage:'Mariage',leadership:'Leadership',prayer:'Prière',prophecy:'Prophétie',prosperity:'Prospérité',salvation:'Salut',bible_study:'Étude biblique',live_streaming:'Diffusion en Direct',live_streams:'Diffusions en Direct',messages:'Messages',subject:'Sujet',end:'Terminer',archive:'Archiver',privacy_policy:'Politique de confidentialité',terms_of_service:'Conditions d\'utilisation',dmca_policy:'Politique DMCA',pastor_apps:'Candidatures Pasteur',pastor_verify:'Vérification Pasteur',ordained_pastor:'Un pasteur ordonné ou licencié',leading_church:'Dirigeant ou servant dans une église ou un ministère reconnu',new_escalation:'Nouvelle Escalade à l\'Admin',prev_escalations:'Vos Escalades Précédentes',accept:'Accepter',decline:'Refuser',explore:'Explorer',nav_messages:'Messages',trinitarian:'Trinitarian',an_overview:'Aperçu',notif_live:'Quand les pasteurs que vous suivez sont en direct',notif_upload:'Quand les pasteurs que vous suivez téléchargent',notif_msg:'Quand vous recevez un message'},
  yo:{could_not_download_title:'A kò lè gba "{title}". Jọ̀wọ́ ṣàyẹ̀wò ìjápọ̀ rẹ kí o sì tún gbìyànjú.',pro_status_granted:'A ti fún ni ipò Pro',pro_status_revoked:'A ti yọ ipò Pro kúrò',grant_label:'fún',revoke_label:'yọ',approve_pastor_confirm:'Ṣé kí a fọwọ́sí {name} gẹ́gẹ́ bí pastọ̀ tí a jẹ́rìísí?',change_pro_status_confirm:'Ṣé o dá ọ lójú pé o fẹ́ {label} ipò Pro fún olùmùlò yìí?',pause_auto_approval_confirm:'Ṣé kí a dá ìfọwọ́sí àdáṣe dúró fún {name}? Ìbéèrè yìí yóò nílò àyẹ̀wò ọwọ́ nígbà náà.',reject_application_confirm:'Ṣé kí a kọ ìbéèrè {name} sílẹ̀?',download_sermons_confirm:'Èyí yóò gba fáìlì iwaasu {count} sí ẹ̀rọ rẹ, ọ̀kan ní àkókò kan. Ṣé kí a tẹ̀síwájú?',account_deleted_successfully:'A ti pa àkọọ́lẹ̀ rẹ rẹ́ dáadáa',account_deleted:'A ti pa àkọọ́lẹ̀ rẹ.',account_deleted_sorry_see:'A ti pa àkọọ́lẹ̀ rẹ. Ó bà wa nínú jẹ́ pé o ń lọ.',all_escalations_cleared:'Gbogbo àwọn ìdìde ti di mímọ́',all_messages_cleared:'Gbogbo ìránṣẹ́ ti di mímọ́',all_messages_marked_as:'Gbogbo ìránṣẹ́ ti di àmì kíkà',all_notifications_messages_cleared:'Gbogbo ìtàkurọ̀sọ àti ìránṣẹ́ ti di mímọ́',all_notifications_cleared:'Gbogbo ìtàkurọ̀sọ ti di mímọ́',all_past_streams_deleted:'Gbogbo ìgbóhùnsáfẹ́fẹ́ tí ó ti kọjá ti di rírẹ́',all_reports_cleared:'Gbogbo ìròyìn ti di mímọ́',all_reports_resolved:'Gbogbo ìròyìn ti di yíyanjú',already_going_live_please:'Ó ti ń gbé lọ́wọ́ tẹ́lẹ̀ — jọ̀wọ́ dúró.',archive_all_live_sermons:'Ṣé kí a fi gbogbo iwaasu tí ń gbé lọ́wọ́ pamọ́?',archive_sermon:'Ṣé kí a fi iwaasu yìí pamọ́?',sure_want_sign_out:'Ṣé o dá ọ lójú pé o fẹ́ jáde?',auto_approval_paused_now:'A ti dá ìfọwọ́sí àdáṣe dúró — nísisìyí ó nílò àyẹ̀wò ọwọ́',clear_all_escalations_cannot:'Ṣé kí a mú gbogbo ìdìde kúrò? A kò lè yí èyí padà.',clear_all_messages_cannot:'Ṣé kí a mú gbogbo ìránṣẹ́ kúrò? A kò lè yí èyí padà.',clear_all_notifications_sent:'Ṣé kí a mú gbogbo ìtàkurọ̀sọ àti ìránṣẹ́ tí a ránṣẹ́ kúrò? A kò lè yí èyí padà.',clear_all_notifications_cannot:'Ṣé kí a mú gbogbo ìtàkurọ̀sọ kúrò? A kò lè yí èyí padà.',clear_all_reports_cannot:'Ṣé kí a mú gbogbo ìròyìn kúrò? A kò lè yí èyí padà.',clear_all_support_messages:'Ṣé kí a mú gbogbo ìránṣẹ́ ìrànlọ́wọ́ kúrò? A kò lè yí èyí padà.',clear_entire_listening_watching:'Ṣé kí a mú gbogbo ìtàn ìgbọ́rọ̀/wíwo rẹ kúrò? A kò lè yí èyí padà.',confirmation_text_did_not:'Ọ̀rọ̀ ìjẹ́rìísí kò bá a mu — a ti dá ìparẹ́ dúró.',confirmation_text_did_not_2:'Ọ̀rọ̀ ìjẹ́rìísí kò bá a mu — kò sí ohun tí a parẹ́.',connection_error_please_try:'Àṣìṣe ìjápọ̀, jọ̀wọ́ tún gbìyànjú',connection_error_please_try_2:'Àṣìṣe ìjápọ̀. Jọ̀wọ́ tún gbìyànjú.',content_removed:'A ti mú àkóónú kúrò',could_not_change_quality:'A kò lè yí ìwọ̀n padà',could_not_connect_stream:'A kò lè sopọ̀ mọ́ ìgbóhùnsáfẹ́fẹ́',could_not_delete_all:'A kò lè parẹ́ gbogbo ìgbóhùnsáfẹ́fẹ́',could_not_delete_stream:'A kò lè parẹ́ ìgbóhùnsáfẹ́fẹ́',could_not_join_stream:'A kò lè dara pọ̀ mọ́ ìgbóhùnsáfẹ́fẹ́: ',could_not_load_sermon:'A kò lè kó iwaasu wọlé.',could_not_open_message:'A kò lè ṣí ìránṣẹ́',could_not_read_image:'A kò lè ka fáìlì àwòrán',could_not_resend_please:'A kò lè tún ránṣẹ́. Jọ̀wọ́ tún gbìyànjú.',could_not_submit_report:'A kò lè fi ìròyìn ránṣẹ́. Jọ̀wọ́ ṣàyẹ̀wò ìjápọ̀ rẹ kí o sì tún gbìyànjú.',could_not_switch_camera:'A kò lè yí kamẹra padà — ó ṣeéṣe kí ẹ̀rọ rẹ ní ọ̀kan péré, tàbí ìyọ̀nda ẹ̀rọ àwárí ni ó ń dí i lọ́wọ́.',could_not_update_photo:'A kò lè ṣàtúnṣe fọ́tò',delete_all_audit_log:'Ṣé kí a parẹ́ GBOGBO àwọn àkọsílẹ̀ ìṣàyẹ̀wò? A kò lè yí èyí padà.',delete_all_past_streams:'Ṣé kí a parẹ́ GBOGBO ìgbóhùnsáfẹ́fẹ́ tí ó ti kọjá nínú ìtàn rẹ? A kò lè yí èyí padà.',delete_failed_please_try:'Ìparẹ́ kùnà. Jọ̀wọ́ tún gbìyànjú.',delete_audit_log_entry:'Ṣé kí a parẹ́ àkọsílẹ̀ ìṣàyẹ̀wò yìí?',delete_comment:'Ṣé kí a parẹ́ ọ̀rọ̀ ìjíròrò yìí?',delete_stream_from_history:'Ṣé kí a parẹ́ ìgbóhùnsáfẹ́fẹ́ yìí nínú ìtàn rẹ? A kò lè yí èyí padà.',delete_stream_cannot_be:'Ṣé kí a parẹ́ ìgbóhùnsáfẹ́fẹ́ yìí? A kò lè yí èyí padà.',deletion_failed_email_support:'Ìparẹ́ kùnà. Fi ìméèlì ránṣẹ́ sí support@trinitarian.app láti béèrè fún ìparẹ́.',deletion_failed_please_email:'Ìparẹ́ kùnà. Jọ̀wọ́ fi ìméèlì ránṣẹ́ sí support@trinitarian.app láti béèrè fún ìparẹ́ àkọọ́lẹ̀.',download_failed:'Gbígbà kùnà',edit_failed_please_try:'Àtúnṣe kùnà. Jọ̀wọ́ tún gbìyànjú.',end_live_stream:'Ṣé kí a parí ìgbóhùnsáfẹ́fẹ́ yìí?',error_ending_stream:'Àṣìṣe nínú parí ìgbóhùnsáfẹ́fẹ́',failed_approve_application:'Ìfọwọ́sí ìbéèrè kùnà',failed_archive_sermon:'Fífi iwaasu pamọ́ kùnà',failed_archive_sermons:'Fífi àwọn iwaasu pamọ́ kùnà',failed_clear_audit_log:'Mímú àkọsílẹ̀ ìṣàyẹ̀wò kúrò kùnà',failed_clear_escalations:'Mímú àwọn ìdìde kúrò kùnà',failed_clear_messages:'Mímú àwọn ìránṣẹ́ kúrò kùnà',failed_clear_notifications:'Mímú àwọn ìtàkurọ̀sọ kúrò kùnà',failed_clear_reports:'Mímú àwọn ìròyìn kúrò kùnà',failed_delete:'Ìparẹ́ kùnà',failed_delete_all_sermons:'Ìparẹ́ gbogbo iwaasu kùnà.',failed_delete_comment:'Ìparẹ́ ọ̀rọ̀ ìjíròrò kùnà',failed_delete_comment_2:'Ìparẹ́ ọ̀rọ̀ ìjíròrò kùnà.',failed_delete_entry:'Ìparẹ́ àkọsílẹ̀ kùnà',failed_delete_stream_live:'Ìparẹ́ kùnà. Ó gbọ́dọ̀ kọ́kọ́ parí ìgbóhùnsáfẹ́fẹ́ tí ń gbé lọ́wọ́.',failed_end_stream:'Parí ìgbóhùnsáfẹ́fẹ́ kùnà',failed_end_stream_2:'Parí ìgbóhùnsáfẹ́fẹ́ kùnà.',failed_go_live:'Ìbẹ̀rẹ̀ ìgbóhùnsáfẹ́fẹ́ kùnà',failed_mark_as_read:'Àmì kíkà kùnà',failed_open_sermon:'Ṣíṣí iwaasu kùnà',failed_pause_auto_approval:'Ìdádúró ìfọwọ́sí àdáṣe kùnà',failed_reject_application:'Ìkọ̀sílẹ̀ ìbéèrè kùnà',failed_resolve_reports:'Yíyanjú àwọn ìròyìn kùnà',failed_save_profile:'Fífi profaili pamọ́ kùnà',failed_send_message:'Fífi ìránṣẹ́ ránṣẹ́ kùnà',failed_send_please_try:'Fífiránṣẹ́ kùnà. Jọ̀wọ́ tún gbìyànjú.',failed_start_stream:'Ìbẹ̀rẹ̀ ìgbóhùnsáfẹ́fẹ́ kùnà: ',failed_submit_report:'Fífi ìròyìn ránṣẹ́ kùnà.',failed_update_pro_status:'Àtúnṣe ipò Pro kùnà',failed_update_sermon:'Àtúnṣe iwaasu kùnà',failed_update_user_status:'Àtúnṣe ipò olùmùlò kùnà',failed_upload_photo:'Gbígbé fọ́tò sókè kùnà',font_size_updated:'A ti ṣàtúnṣe ìwọ̀n lẹ́tà',font_style_updated:'A ti ṣàtúnṣe ìrísí lẹ́tà',image_must_be_under:'Àwòrán gbọ́dọ̀ kéré ju 5MB lọ',language_updated:'A ti ṣàtúnṣe èdè',link_copied:'A ti dàako ọ̀nà asopọ̀!',live_streaming_coming_soon:'Ìgbóhùnsáfẹ́fẹ́ tí ń gbé lọ́wọ́ ń bọ̀ láìpẹ́!',live_streaming_launching_soon:'Ìgbóhùnsáfẹ́fẹ́ tí ń gbé lọ́wọ́ ń bọ̀ láìpẹ́. Dúró de!',message_not_found:'A kò rí ìránṣẹ́',message_sent_successfully:'Ìránṣẹ́ ti dé dáadáa',name_did_not_match:'Orúkọ kò bá a mu — a ti dá ìparẹ́ dúró',no_past_streams_delete:'Kò sí ìgbóhùnsáfẹ́fẹ́ tí ó ti kọjá láti parẹ́',no_sermons_delete:'Kò sí iwaasu láti parẹ́.',not_currently_live:'Kò ń gbé lọ́wọ́ nísisìyí',notification_preference_saved:'A ti fi àṣàyàn ìtàkurọ̀sọ pamọ́',notification_preferences_saved:'A ti fi àwọn àṣàyàn ìtàkurọ̀sọ pamọ́',ownership_transferred_now_admin:'A ti gbé ìní lọ. O jẹ́ Alábojútó nísisìyí. Jọ̀wọ́ tún wọlé.',photo_saved_locally:'A ti fi fọ́tò pamọ́ sí ẹ̀rọ',please_choose_when_stream:'Jọ̀wọ́ yan ìgbà tí ìgbóhùnsáfẹ́fẹ́ yìí yóò ṣẹlẹ̀',please_enter_message:'Jọ̀wọ́ tẹ ìránṣẹ́ kan sí',please_enter_message_2:'Jọ̀wọ́ tẹ ìránṣẹ́ kan sí.',please_enter_response:'Jọ̀wọ́ tẹ ìdáhùn kan sí',please_enter_stream_title:'Jọ̀wọ́ tẹ àkọlé ìgbóhùnsáfẹ́fẹ́ sí',please_pick_time_future:'Jọ̀wọ́ yan àkókò kan ní ọjọ́ iwájú',please_read_accept_terms:'Jọ̀wọ́ ka kí o sì gba Òfin Iṣẹ́ àti ìkéde àìlẹ́gbẹ́ láti tẹ̀síwájú.',please_select_jpg_png:'Jọ̀wọ́ yan àwòrán JPG tàbí PNG.',please_select_reason_provide:'Jọ̀wọ́ yan ìdí kan tàbí fi àlàyé kún un.',please_select_video_audio:'Jọ̀wọ́ yan fídíò, ohùn, .docx, tàbí fáìlì .txt. A kò gba PDF àti .doc àtijọ́.',please_select_image_file:'Jọ̀wọ́ yan fáìlì àwòrán',please_sign_report_content:'Jọ̀wọ́ wọlé láti fi àkóónú yìí ránṣẹ́.',please_sign_watch_live:'Jọ̀wọ́ wọlé láti wo ìgbóhùnsáfẹ́fẹ́ tí ń gbé lọ́wọ́',profile_photo_removed:'A ti mú fọ́tò profaili kúrò',profile_photo_updated:'A ti ṣàtúnṣe fọ́tò profaili',profile_updated_successfully:'A ti ṣàtúnṣe profaili dáadáa!',remove_sermon_permanently:'Ṣé kí a mú iwaasu yìí kúrò pátápátá?',report_resolved:'Ìròyìn ti di yíyanjú',report_submitted:'A ti fi ìròyìn ránṣẹ́',report_comment_review:'Ṣé kí a fi ọ̀rọ̀ ìjíròrò yìí ránṣẹ́ fún àyẹ̀wò?',resolve_all_pending_reports:'Ṣé kí a yanjú gbogbo ìròyìn tí ń dúró?',response_sent_moderator:'A ti fi ìdáhùn ránṣẹ́ sí olùdarí',role_updated:'A ti ṣàtúnṣe ipò sí ',sermon_not_found:'A kò rí iwaasu',sermon_updated_successfully:'A ti ṣàtúnṣe iwaasu dáadáa',confirm_sign_out_q:'Ṣé kí o jáde?',spacing_updated:'A ti ṣàtúnṣe àyè',stream_deleted:'A ti parẹ́ ìgbóhùnsáfẹ́fẹ́',stream_ended:'Ìgbóhùnsáfẹ́fẹ́ ti parí',stream_ended_great_job:'Ìgbóhùnsáfẹ́fẹ́ ti parí. Iṣẹ́ dáadáa!',stream_scheduled:'A ti ṣètò ìgbóhùnsáfẹ́fẹ́ fún ',live_stream_has_ended:'Ìgbóhùnsáfẹ́fẹ́ tí ń gbé lọ́wọ́ ti parí',sermon_has_no_media:'Iwaasu yìí kò ní fáìlì ìsọfúnni láti gbà.',thumbnail_must_be_under:'Àwòrán kékeré gbọ́dọ̀ kéré ju 5MB lọ.',title_cannot_be_empty:'Àkọlé kò lè ṣófo',now_live:'O ń gbé lọ́wọ́ nísisìyí!',have_no_sermons_with:'O kò ní iwaasu pẹ̀lú fáìlì ìsọfúnni láti gbà.',coming_soon:'N bọ Laipẹ',coming_soon_sub:'Ẹya yii n bọ laipẹ',live_coming_soon_desc:'Igbohunsafẹfẹ taara wa ninu idagbasoke ati pe yoo wa ni imudojuiwọn iwaju.',notify_when_ready:'A o fi ifitonileti ranṣẹ si ọ nigbati ẹya yii ba ṣi silẹ.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'Awọn Iwaasu Titun',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'Bẹ ni iṣẹ-iranṣẹ rẹ ṣe n ṣe',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Ṣakoso awọn ayanfẹ akaunti rẹ',manage_profile:'Ṣakoso profaili woli rẹ',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'Wiwo Iṣaaju',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Fonti ati Ìfihàn',font_size:'Iwọn Fonti',font_style:'Ara Fonti',line_spacing:'Aye Laini',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'Oruko Ifihan',email:'Email',email_address:'Email Address',username:'Oruko Olumulo',church_name:'Church Name',denomination:'Ẹgbẹ Ẹsin',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'Ipa',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'Kekere',medium:'Aarin',large:'Nla',normal:'Deede',compact:'Kekere',relaxed:'Isinmi',default_style:'Atilẹba',serif:'Serif',mono:'Mono',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'Ilana DMCA',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Ṣawari',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'Nigbati awọn woli ti o n tele ba gbe taara',notif_upload:'Nigbati awọn woli ti o n tele ba gbekalẹ',notif_msg:'Nigbati o ba gba ifiranṣẹ',extra_large:'XL',admin_label:'ADMIN',delete_account:'Pa Akaunti Mi',sermon_title_label:'Akọle Iwaasu *',content_type_label:'Iru Akoonu *',transcript_label:'Akosile / Ọrọ Kikun (aṣayan)',start_dictation:'🎙 Bẹrẹ gbigbọ ohun',file_select_hint:'Tẹ lati yan faili fídíò, ohun tabi iwe',search_sermons_ph:'🔍 Wa iwaasu...',search_users_ph:'🔍 Wa awọn olumulo...',search_pastors_ph:'🔍 Wa awọn woli...',desc_ph:'Apejuwe kukuru iwaasu yii…',transcript_ph:'Lẹ akosile iwaasu kikun nibi…',support_ph:'Tẹ ifiranṣẹ rẹ si atilẹyin…',send_to_admin:'📨 Fi Ifiranṣẹ Ranṣẹ si Admin',status_approved:'✅ Fọwọsi',status_rejected:'❌ Kọ',status_pending:'⏳ Nduro',support_messages:'Awọn Ifiranṣẹ Atilẹyin',reports_tab:'Ìjábọ̀',flagged_tab:'Akoonu Ti a Samisi',escalations_tab:'Igbesoke',no_sermons_upload:'Ko si iwaasu. Tẹ "Gbekalẹ Iwaasu" lati pin ifiranṣẹ akọkọ rẹ.',cert_note:'Fifiṣe iwe-ẹri soke yara ijẹrisi ṣugbọn ko nilo.',article:'Àpilẹ̀kọ',text:'Ọrọ',video:'Fídíò',audio:'Ohun',no_sermons_data:'Ko si data iwaasu',create_account:'Ṣẹda Akaunti Rẹ',create_password:'Ṣẹda Ọrọ Aṣina',failed_notifs:'Ko le gba ìwifunni',all_pastors:'Gbogbo awọn woli ti a fidi mule lori Trinitarian',overview:'Akopọ',my_sermons:'Awọn Iwaasu Mi',upload_sermon:'Gbekalẹ Iwaasu',live_stream:'Igbohunsafẹfẹ Taara',settings:'Ìtòlẹsẹẹsẹ',profile:'Profaili',notifications:'Ìwifunni',inbox:'Àpòpọ̀',pastors:'Awọn Woli',users:'Awọn Olumulo',analytics:'Ìtúpalẹ̀',sign_out:'Jade',sign_in:'Wole',total_sermons:'Àpapọ̀ Iwaasu',total_views:'Àpapọ̀ Wiwo',new_followers:'Awọn Alabapin Tuntun',followers:'Awọn Alabapin',views:'Wiwo',recent_sermons:'Awọn Iwaasu Aipẹ',save:'Fipamọ',cancel:'Fagilee',publish_sermon:'Gbejade Iwaasu',edit_sermon:'Ṣatunkọ Iwaasu',remove_sermon:'Yọ Iwaasu Kuro',save_changes:'Fipamọ Awọn Ayipada',send_message:'Fi Ifiranṣẹ Ranṣẹ',loading:'N gbe...',no_sermons:'Ko si iwaasu',no_notifs:'Ko si ìwifunni',no_messages:'Ko si ifiranṣẹ',mark_all_read:'Samisi gbogbo bi a ti ka',language:'Ede',privacy_policy:'Eto Asiri',terms_of_service:'Awọn Ofin Iṣẹ',go_live:'Gbe Taara',my_profile:'Profaili Mi',change_password:'Yi Ọrọ Aṣina Pada',security:'Aabo',legal:'Ofin',account:'Akaunti',nav_messages:'Awọn ifiranṣẹ'},
  ig:{could_not_download_title:'Enweghị ike ibudata "{title}". Biko lelee njikọ gị wee gbalịa ọzọ.',pro_status_granted:'Enyela ọnọdụ Pro',pro_status_revoked:'Ewepụla ọnọdụ Pro',grant_label:'nye',revoke_label:'wepụ',approve_pastor_confirm:'Kwado {name} dịka pasto akwadoro?',change_pro_status_confirm:'Ị ji n\'aka na ị chọrọ {label} ọnọdụ Pro nke onye ọrụ a?',pause_auto_approval_confirm:'Kwụsị nkwado akpaaka maka {name}? Arịrịọ a ga-achọzi nyocha aka mgbe ahụ.',reject_application_confirm:'Jụ arịrịọ {name}?',download_sermons_confirm:'Nke a ga-ebudata faịlụ nkwuputa {count} n\'ime ngwaọrụ gị, otu n\'otu. Gaa n\'ihu?',account_deleted_successfully:'Ehichapụla akaụntụ nke ọma',account_deleted:'Ehichapụla akaụntụ.',account_deleted_sorry_see:'Ehichapụla akaụntụ. Ọ dị mwute na ị na-apụ.',all_escalations_cleared:'Ehichapụla mbuli elu niile',all_messages_cleared:'Ehichapụla ozi niile',all_messages_marked_as:'Akaralarị ozi niile dịka agụọla',all_notifications_messages_cleared:'Ehichapụla ọkwa na ozi niile',all_notifications_cleared:'Ehichapụla ọkwa niile',all_past_streams_deleted:'Ehichapụla ndaịgba gara aga niile',all_reports_cleared:'Ehichapụla mkpesa niile',all_reports_resolved:'Edozila mkpesa niile',already_going_live_please:'Ọ na-eme ugbu a — biko chere.',archive_all_live_sermons:'Chekwaa nkwuputa niile na-eme ugbu a?',archive_sermon:'Chekwaa nkwuputa a?',sure_want_sign_out:'Ị ji n\'aka na ị chọrọ ịpụ?',auto_approval_paused_now:'Akwụsịla nkwado akpaaka — ugbu a chọrọ nyocha aka',clear_all_escalations_cannot:'Hichapụ mbuli elu niile? Enweghị ike imegharị nke a.',clear_all_messages_cannot:'Hichapụ ozi niile? Enweghị ike imegharị nke a.',clear_all_notifications_sent:'Hichapụ ọkwa na ozi ezipụtara niile? Enweghị ike imegharị nke a.',clear_all_notifications_cannot:'Hichapụ ọkwa niile? Enweghị ike imegharị nke a.',clear_all_reports_cannot:'Hichapụ mkpesa niile? Enweghị ike imegharị nke a.',clear_all_support_messages:'Hichapụ ozi enyemaka niile? Enweghị ike imegharị nke a.',clear_entire_listening_watching:'Hichapụ akụkọ ntị na nlele gị niile? Enweghị ike imegharị nke a.',confirmation_text_did_not:'Ederede nkwenye adabaghị — akwụsịla ihichapụ.',confirmation_text_did_not_2:'Ederede nkwenye adabaghị — ehichapụghị ihe ọbụla.',connection_error_please_try:'Njehie njikọ, biko gbalịa ọzọ',connection_error_please_try_2:'Njehie njikọ. Biko gbalịa ọzọ.',content_removed:'Ewepụla ọdịnaya',could_not_change_quality:'Enweghị ike ịgbanwe ogo',could_not_connect_stream:'Enweghị ike ijikọ na ndaịgba',could_not_delete_all:'Enweghị ike ihichapụ ndaịgba niile',could_not_delete_stream:'Enweghị ike ihichapụ ndaịgba',could_not_join_stream:'Enweghị ike isonye na ndaịgba: ',could_not_load_sermon:'Enweghị ike ibudata nkwuputa.',could_not_open_message:'Enweghị ike imepe ozi',could_not_read_image:'Enweghị ike ịgụ faịlụ onyonyo',could_not_resend_please:'Enweghị ike izipụghachi. Biko gbalịa ọzọ.',could_not_submit_report:'Enweghị ike inyefe mkpesa. Biko lelee njikọ gị wee gbalịa ọzọ.',could_not_switch_camera:'Enweghị ike ịgbanwe igwefoto — ngwaọrụ gị nwere ike inwe naanị otu, ma ọ bụ ikike ihuenyo na-egbochi ya.',could_not_update_photo:'Enweghị ike imelite foto',delete_all_audit_log:'Hichapụ NDEKỌ nyocha niile? Enweghị ike imegharị nke a.',delete_all_past_streams:'Hichapụ ndaịgba gara aga niile n\'akụkọ gị? Enweghị ike imegharị nke a.',delete_failed_please_try:'Ihichapụ dara. Biko gbalịa ọzọ.',delete_audit_log_entry:'Hichapụ ndekọ nyocha a?',delete_comment:'Hichapụ okwu a?',delete_stream_from_history:'Hichapụ ndaịgba a n\'akụkọ gị? Enweghị ike imegharị nke a.',delete_stream_cannot_be:'Hichapụ ndaịgba a? Enweghị ike imegharị nke a.',deletion_failed_email_support:'Ihichapụ dara. Zipu email na support@trinitarian.app ịrịọ ihichapụ.',deletion_failed_please_email:'Ihichapụ dara. Biko zipu email na support@trinitarian.app ịrịọ ihichapụ akaụntụ.',download_failed:'Nbudata dara',edit_failed_please_try:'Idezi dara. Biko gbalịa ọzọ.',end_live_stream:'Kwụsị ndaịgba a na-eme ugbu a?',error_ending_stream:'Njehie na ikwụsị ndaịgba',failed_approve_application:'Ikwado arịrịọ dara',failed_archive_sermon:'Ichekwa nkwuputa dara',failed_archive_sermons:'Ichekwa nkwuputa niile dara',failed_clear_audit_log:'Ihichapụ ndekọ nyocha dara',failed_clear_escalations:'Ihichapụ mbuli elu dara',failed_clear_messages:'Ihichapụ ozi dara',failed_clear_notifications:'Ihichapụ ọkwa dara',failed_clear_reports:'Ihichapụ mkpesa dara',failed_delete:'Ihichapụ dara',failed_delete_all_sermons:'Ihichapụ nkwuputa niile dara.',failed_delete_comment:'Ihichapụ okwu dara',failed_delete_comment_2:'Ihichapụ okwu dara.',failed_delete_entry:'Ihichapụ ndekọ dara',failed_delete_stream_live:'Ihichapụ dara. Ekwesịrị ịkwụsị ndaịgba na-eme ugbu a mbụ.',failed_end_stream:'Ikwụsị ndaịgba dara',failed_end_stream_2:'Ikwụsị ndaịgba dara.',failed_go_live:'Ịmalite ndaịgba dara',failed_mark_as_read:'Ikara dịka agụọla dara',failed_open_sermon:'Imepe nkwuputa dara',failed_pause_auto_approval:'Ịkwụsị nkwado akpaaka dara',failed_reject_application:'Ijụ arịrịọ dara',failed_resolve_reports:'Idozi mkpesa dara',failed_save_profile:'Ichekwa profaịlụ dara',failed_send_message:'Izipu ozi dara',failed_send_please_try:'Izipu dara. Biko gbalịa ọzọ.',failed_start_stream:'Ịmalite ndaịgba dara: ',failed_submit_report:'Inyefe mkpesa dara.',failed_update_pro_status:'Imelite ọnọdụ Pro dara',failed_update_sermon:'Imelite nkwuputa dara',failed_update_user_status:'Imelite ọnọdụ onye ọrụ dara',failed_upload_photo:'Ibulite foto dara',font_size_updated:'Emeliteala nha mkpụrụedemede',font_style_updated:'Emeliteala ụdị mkpụrụedemede',image_must_be_under:'Onyonyo aghaghị ịdị ntakịrị karịa 5MB',language_updated:'Emeliteala asụsụ',link_copied:'Edepụtala njikọ!',live_streaming_coming_soon:'Ndaịgba na-eme ugbu a na-abịa n\'oge na-adịghị anya!',live_streaming_launching_soon:'Ndaịgba na-eme ugbu a na-abịa n\'oge na-adịghị anya. Nọgide na-ege ntị!',message_not_found:'Ahụghị ozi',message_sent_successfully:'Ezipula ozi nke ọma',name_did_not_match:'Aha adabaghị — akwụsịla ihichapụ',no_past_streams_delete:'Enweghị ndaịgba gara aga izipu',no_sermons_delete:'Enweghị nkwuputa izipu.',not_currently_live:'Anaghị eme ugbu a',notification_preference_saved:'Echekwala mmasị ọkwa',notification_preferences_saved:'Echekwala mmasị ọkwa niile',ownership_transferred_now_admin:'Enyefela onwe. Ị bụzi Ọchịchị. Biko banyeghachi.',photo_saved_locally:'Echekwala foto na ngwaọrụ',please_choose_when_stream:'Biko họrọ mgbe ndaịgba a ga-eme',please_enter_message:'Biko tinye ozi',please_enter_message_2:'Biko tinye ozi.',please_enter_response:'Biko tinye azịza',please_enter_stream_title:'Biko tinye aha ndaịgba',please_pick_time_future:'Biko họrọ oge n\'ọdịnihu',please_read_accept_terms:'Biko gụọ ma nabata Usoro Ọrụ na nkwupụta ka ị gaa n\'ihu.',please_select_jpg_png:'Biko họrọ onyonyo JPG ma ọ bụ PNG.',please_select_reason_provide:'Biko họrọ ihe kpatara ya ma ọ bụ nye nkọwa.',please_select_video_audio:'Biko họrọ vidiyo, ụda, .docx, ma ọ bụ faịlụ .txt. Anaghị akwado PDF na .doc ochie.',please_select_image_file:'Biko họrọ faịlụ onyonyo',please_sign_report_content:'Biko banye ịkpesa ọdịnaya a.',please_sign_watch_live:'Biko banye ikiri ndaịgba na-eme ugbu a',profile_photo_removed:'Ewepụla foto profaịlụ',profile_photo_updated:'Emeliteala foto profaịlụ',profile_updated_successfully:'Emeliteala profaịlụ nke ọma!',remove_sermon_permanently:'Wepụ nkwuputa a kpamkpam?',report_resolved:'Edozila mkpesa',report_submitted:'Enyefela mkpesa',report_comment_review:'Kpesa okwu a maka nyocha?',resolve_all_pending_reports:'Dozie mkpesa niile na-echere?',response_sent_moderator:'Ezipula azịza nye onye nlekọta',role_updated:'Emeliteala ọrụ gaa na ',sermon_not_found:'Ahụghị nkwuputa',sermon_updated_successfully:'Emeliteala nkwuputa nke ọma',confirm_sign_out_q:'Ịpụ?',spacing_updated:'Emeliteala oghere',stream_deleted:'Ehichapụla ndaịgba',stream_ended:'Ndaịgba akwụsịla',stream_ended_great_job:'Ndaịgba akwụsịla. Ọrụ ọma!',stream_scheduled:'Ahaziala ndaịgba maka ',live_stream_has_ended:'Ndaịgba na-eme ugbu a akwụsịla',sermon_has_no_media:'Nkwuputa a enweghị faịlụ mgbasa ozi ibudata.',thumbnail_must_be_under:'Obere onyonyo aghaghị ịdị ntakịrị karịa 5MB.',title_cannot_be_empty:'Aha enweghị ike ịbụ efu',now_live:'Ị na-eme ugbu a ugbu a!',have_no_sermons_with:'Ị nweghị nkwuputa nwere faịlụ mgbasa ozi ibudata.',coming_soon:'Na-abịa n\'oge',coming_soon_sub:'Atụmatụ a na-abịa n\'oge',live_coming_soon_desc:'Mgbasa ozi ndụ dị n\'ọrụ mmepe ma ọ ga-adị n\'mmelite ọzọ.',notify_when_ready:'Anyị ga-eziga gị ozi mgbe atụmatụ a malitere.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'Ozizi Ọhụrụ',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'Ọ bụ otú ozi gị si arụ ọrụ',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Chịkwaa nhọrọ akaụntụ gị',manage_profile:'Chịkwaa profaịlụ ukochukwu gị',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'Nlele',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Mkpụrụedemede na Ngosi',font_size:'Nha Mkpụrụedemede',font_style:'Ụdị Mkpụrụedemede',line_spacing:'Oge Akara',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'Aha Ngosi',email:'Email',email_address:'Email Address',username:'Aha Njirimara',church_name:'Church Name',denomination:'Ọchichi Chọọchị',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'Ọrụ',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'Obere',medium:'Etiti',large:'Nnukwu',normal:'Nkịtị',compact:'Nchikota',relaxed:'Ezumike',default_style:'Ọdịnala',serif:'Serif',mono:'Mono',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'Iwu DMCA',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Chọpụta',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'Mgbe ndi ukochukwu i na-eso na-agbasa ndụ',notif_upload:'Mgbe ndi ukochukwu i na-eso na-ebugo',notif_msg:'Mgbe i natara ozi',extra_large:'XL',admin_label:'ADMIN',delete_account:'Hichapụ Akaunti M',sermon_title_label:'Aha Ozizi *',content_type_label:'Udi Ọdịnaya *',transcript_label:'Ihe Edeturu / Ederede Zuru Ezu (ọ dị mma)',start_dictation:'🎙 Bido ịde site n\'olu',file_select_hint:'Pịa iji họọ faịlụ vidiyo, ụda ma ọ bụ akwụkwọ',search_sermons_ph:'🔍 Chọọ ozizi...',search_users_ph:'🔍 Chọọ ndị ọrụ...',search_pastors_ph:'🔍 Chọọ ndi ukochukwu...',desc_ph:'Nkọwa dị mkpụmkpụ nke ozizi a…',transcript_ph:'Tinye ihe edeturu ozizi zuru ezu ebe a…',support_ph:'Dee ozi gị na nkwado…',send_to_admin:'📨 Ziga Ozi Admin',status_approved:'✅ Akwadoro',status_rejected:'❌ Akagbuo',status_pending:'⏳ Na-atọ ụzọ',support_messages:'Ozi Nkwado',reports_tab:'Nkọwa',flagged_tab:'Ọdịnaya Akọwapụtara',escalations_tab:'Ọkwa Dị Elu',no_sermons_upload:'Ọ dịghị ozizi. Pịa "Bulite Ozizi" iji kesaa ozi gị nke mbụ.',cert_note:'Ibugo asambodo na-eme ka nkwado mee ngwa ngwa mana ọ dị mkpa.',article:'Akụkọ',text:'Ederede',video:'Vidiyo',audio:'Ụda',no_sermons_data:'Ọ dịghị data ozizi',create_account:'Mepee Akaunti Gị',create_password:'Mepee Okwuntughe',failed_notifs:'Enweghị ike ibute ozi',all_pastors:'Ndi ukochukwu niile akwadoro na Trinitarian',overview:'Nchoputa',my_sermons:'Ozizi M',upload_sermon:'Bulite Ozizi',live_stream:'Mgbasa Ozi Ndụ',settings:'Ntọala',profile:'Profaịlụ',notifications:'Ozi',inbox:'Ozi',pastors:'Ndi Ukochukwu',users:'Ndi Ọrụ',analytics:'Nyocha',sign_out:'Pụọ',sign_in:'Banye',total_sermons:'Ozizi Niile',total_views:'Nlele Niile',new_followers:'Ndị Ọhụrụ Na-eso',followers:'Ndị Na-eso',views:'Nlele',recent_sermons:'Ozizi Ọhụrụ',save:'Chekwaa',cancel:'Kagbuo',publish_sermon:'Bipute Ozizi',edit_sermon:'Dezie Ozizi',remove_sermon:'Hichapụ Ozizi',save_changes:'Chekwaa Mgbanwe',send_message:'Ziga Ozi',loading:'Na ebu...',no_sermons:'Ọ dịghị ozizi',no_notifs:'Ọ dịghị ozi',no_messages:'Ọ dịghị ozi',mark_all_read:'Maa niile ka agụọla',language:'Asụsụ',privacy_policy:'Iwu Nzuzo',terms_of_service:'Usoro Ọrụ',go_live:'Bido Ndụ',my_profile:'Profaịlụ M',change_password:'Gbanwee Okwuntughe',security:'Nchekwa',legal:'Iwu',account:'akaụntụ',nav_messages:'Ozi'},
  ha:{could_not_download_title:'Ba a iya saukewa "{title}" ba. Da fatan za a duba haɗin ku a sake gwadawa.',pro_status_granted:'An bayar da matsayin Pro',pro_status_revoked:'An soke matsayin Pro',grant_label:'bayar',revoke_label:'soke',approve_pastor_confirm:'Amince da {name} a matsayin fasto da aka tabbatar?',change_pro_status_confirm:'Ka tabbata kana son {label} matsayin Pro na wannan mai amfani?',pause_auto_approval_confirm:'Dakatar da amincewa ta atomatik don {name}? Wannan nema zai buƙaci bincike na hannu bayan haka.',reject_application_confirm:'Ƙin nemar {name}?',download_sermons_confirm:'Wannan zai sauke fayil(oli) na wa\'azi {count} zuwa na\'urarka, ɗaya bayan ɗaya. Ci gaba?',account_deleted_successfully:'An share asusun cikin nasara',account_deleted:'An share asusun.',account_deleted_sorry_see:'An share asusun. Bakin ciki ganin ka tafi.',all_escalations_cleared:'An share duk ƙarin matsayi',all_messages_cleared:'An share duk saƙonni',all_messages_marked_as:'An sanya duk saƙonni a matsayin an karanta',all_notifications_messages_cleared:'An share duk sanarwa da saƙonni',all_notifications_cleared:'An share duk sanarwa',all_past_streams_deleted:'An share duk watsa shirye-shiryen da suka gabata',all_reports_cleared:'An share duk rahotanni',all_reports_resolved:'An warware duk rahotanni',already_going_live_please:'Ana kai tsaye tuni — da fatan za a jira.',archive_all_live_sermons:'A adana duk wa\'azin kai tsaye?',archive_sermon:'A adana wannan wa\'azin?',sure_want_sign_out:'Ka tabbata kana son fita?',auto_approval_paused_now:'An dakatar da amincewa ta atomatik — yanzu tana buƙatar bincike na hannu',clear_all_escalations_cannot:'Share duk ƙarin matsayi? Ba za a iya soke wannan ba.',clear_all_messages_cannot:'Share duk saƙonni? Ba za a iya soke wannan ba.',clear_all_notifications_sent:'Share duk sanarwa da saƙonnin da aka aika? Ba za a iya soke wannan ba.',clear_all_notifications_cannot:'Share duk sanarwa? Ba za a iya soke wannan ba.',clear_all_reports_cannot:'Share duk rahotanni? Ba za a iya soke wannan ba.',clear_all_support_messages:'Share duk saƙonnin tallafi? Ba za a iya soke wannan ba.',clear_entire_listening_watching:'Share duk tarihin sauraro/kallo naka? Ba za a iya soke wannan ba.',confirmation_text_did_not:'Rubutun tabbatarwa bai dace ba — an soke sharewa.',confirmation_text_did_not_2:'Rubutun tabbatarwa bai dace ba — ba a share komai ba.',connection_error_please_try:'Kuskuren haɗi, da fatan za a sake gwadawa',connection_error_please_try_2:'Kuskuren haɗi. Da fatan za a sake gwadawa.',content_removed:'An cire abun ciki',could_not_change_quality:'Ba a iya canza inganci ba',could_not_connect_stream:'Ba a iya haɗi da watsa shirye-shirye ba',could_not_delete_all:'Ba a iya share duk watsa shirye-shirye ba',could_not_delete_stream:'Ba a iya share watsa shirye-shirye ba',could_not_join_stream:'Ba a iya shiga watsa shirye-shirye ba: ',could_not_load_sermon:'Ba a iya loda wa\'azin ba.',could_not_open_message:'Ba a iya buɗe saƙo ba',could_not_read_image:'Ba a iya karanta fayil ɗin hoto ba',could_not_resend_please:'Ba a iya sake aikawa ba. Da fatan za a sake gwadawa.',could_not_submit_report:'Ba a iya aika rahoto ba. Da fatan za a duba haɗin ku a sake gwadawa.',could_not_switch_camera:'Ba a iya canza kyamara ba — na\'urarka na iya samun ɗaya kawai, ko izinin mai bincike yana toshe shi.',could_not_update_photo:'Ba a iya sabunta hoto ba',delete_all_audit_log:'Share DUK bayanan rijistar bincike? Ba za a iya soke wannan ba.',delete_all_past_streams:'Share DUK watsa shirye-shiryen da suka gabata daga tarihinka? Ba za a iya soke wannan ba.',delete_failed_please_try:'Sharewa ta kasa. Da fatan za a sake gwadawa.',delete_audit_log_entry:'Share wannan bayanin rijistar bincike?',delete_comment:'Share wannan sharhin?',delete_stream_from_history:'Share wannan watsa shirye-shirye daga tarihinka? Ba za a iya soke wannan ba.',delete_stream_cannot_be:'Share wannan watsa shirye-shirye? Ba za a iya soke wannan ba.',deletion_failed_email_support:'Sharewa ta kasa. Aika imel zuwa support@trinitarian.app don neman sharewa.',deletion_failed_please_email:'Sharewa ta kasa. Da fatan za a aika imel zuwa support@trinitarian.app don neman share asusun.',download_failed:'Saukewa ta kasa',edit_failed_please_try:'Gyara ta kasa. Da fatan za a sake gwadawa.',end_live_stream:'Kare wannan watsa shirye-shiryen kai tsaye?',error_ending_stream:'Kuskure wajen kare watsa shirye-shirye',failed_approve_application:'Amincewa da nema ta kasa',failed_archive_sermon:'Adana wa\'azin ta kasa',failed_archive_sermons:'Adana wa\'azin ta kasa',failed_clear_audit_log:'Sharewar rijistar bincike ta kasa',failed_clear_escalations:'Sharewar ƙarin matsayi ta kasa',failed_clear_messages:'Sharewar saƙonni ta kasa',failed_clear_notifications:'Sharewar sanarwa ta kasa',failed_clear_reports:'Sharewar rahotanni ta kasa',failed_delete:'Sharewa ta kasa',failed_delete_all_sermons:'Sharewar duk wa\'azi ta kasa.',failed_delete_comment:'Sharewar sharhi ta kasa',failed_delete_comment_2:'Sharewar sharhi ta kasa.',failed_delete_entry:'Sharewar bayani ta kasa',failed_delete_stream_live:'Sharewa ta kasa. Dole a fara kare watsa shirye-shiryen kai tsaye.',failed_end_stream:'Karewar watsa shirye-shirye ta kasa',failed_end_stream_2:'Karewar watsa shirye-shirye ta kasa.',failed_go_live:'Farawar watsa shirye-shirye ta kasa',failed_mark_as_read:'Sanya a matsayin an karanta ta kasa',failed_open_sermon:'Buɗe wa\'azin ta kasa',failed_pause_auto_approval:'Dakatar da amincewa ta atomatik ta kasa',failed_reject_application:'Ƙin nema ta kasa',failed_resolve_reports:'Warware rahotanni ta kasa',failed_save_profile:'Ajiye bayanan martaba ta kasa',failed_send_message:'Aika saƙo ta kasa',failed_send_please_try:'Aikawa ta kasa. Da fatan za a sake gwadawa.',failed_start_stream:'Farawar watsa shirye-shirye ta kasa: ',failed_submit_report:'Aika rahoto ta kasa.',failed_update_pro_status:'Sabunta matsayin Pro ta kasa',failed_update_sermon:'Sabunta wa\'azin ta kasa',failed_update_user_status:'Sabunta matsayin mai amfani ta kasa',failed_upload_photo:'Loda hoto ta kasa',font_size_updated:'An sabunta girman rubutu',font_style_updated:'An sabunta salon rubutu',image_must_be_under:'Hoton dole ya zama ƙasa da 5MB',language_updated:'An sabunta harshe',link_copied:'An kwafa hanyar haɗi!',live_streaming_coming_soon:'Watsa shirye-shirye kai tsaye nan ba da jimawa ba!',live_streaming_launching_soon:'Watsa shirye-shirye kai tsaye zai fara nan ba da jimawa ba. Ci gaba da kasancewa!',message_not_found:'Ba a sami saƙo ba',message_sent_successfully:'An aika saƙo cikin nasara',name_did_not_match:'Sunan bai dace ba — an soke sharewa',no_past_streams_delete:'Babu watsa shirye-shiryen da suka gabata don sharewa',no_sermons_delete:'Babu wa\'azin da za a share.',not_currently_live:'Ba kai tsaye yanzu ba',notification_preference_saved:'An ajiye zaɓin sanarwa',notification_preferences_saved:'An ajiye zaɓuɓɓukan sanarwa',ownership_transferred_now_admin:'An canja mallaka. Yanzu kai Admin ne. Da fatan za a sake shiga.',photo_saved_locally:'An ajiye hoto a na\'ura',please_choose_when_stream:'Da fatan za a zaɓi lokacin da wannan watsa shirye-shirye zai gudana',please_enter_message:'Da fatan za a shigar da saƙo',please_enter_message_2:'Da fatan za a shigar da saƙo.',please_enter_response:'Da fatan za a shigar da amsa',please_enter_stream_title:'Da fatan za a shigar da taken watsa shirye-shirye',please_pick_time_future:'Da fatan za a zaɓi lokaci a nan gaba',please_read_accept_terms:'Da fatan za a karanta kuma a yarda da Sharuɗɗan Sabis da sanarwar hana alhaki don ci gaba.',please_select_jpg_png:'Da fatan za a zaɓi hoto JPG ko PNG.',please_select_reason_provide:'Da fatan za a zaɓi dalili ko a ba da bayani.',please_select_video_audio:'Da fatan za a zaɓi bidiyo, sauti, .docx, ko fayil ɗin .txt. Ba a goyi bayan PDF da tsohon .doc ba.',please_select_image_file:'Da fatan za a zaɓi fayil ɗin hoto',please_sign_report_content:'Da fatan za a shiga don kai rahoton wannan abun ciki.',please_sign_watch_live:'Da fatan za a shiga don kallon watsa shirye-shirye kai tsaye',profile_photo_removed:'An cire hoton bayanan martaba',profile_photo_updated:'An sabunta hoton bayanan martaba',profile_updated_successfully:'An sabunta bayanan martaba cikin nasara!',remove_sermon_permanently:'Cire wannan wa\'azin har abada?',report_resolved:'An warware rahoto',report_submitted:'An aika rahoto',report_comment_review:'Kai rahoton wannan sharhin don bita?',resolve_all_pending_reports:'Warware duk rahotannin da ake jira?',response_sent_moderator:'An aika amsa zuwa mai kulawa',role_updated:'An sabunta matsayi zuwa ',sermon_not_found:'Ba a sami wa\'azin ba',sermon_updated_successfully:'An sabunta wa\'azin cikin nasara',confirm_sign_out_q:'Fita?',spacing_updated:'An sabunta tazara',stream_deleted:'An share watsa shirye-shirye',stream_ended:'Watsa shirye-shirye ya ƙare',stream_ended_great_job:'Watsa shirye-shirye ya ƙare. Kyakkyawan aiki!',stream_scheduled:'An tsara watsa shirye-shirye don ',live_stream_has_ended:'Watsa shirye-shiryen kai tsaye ya ƙare',sermon_has_no_media:'Wa\'azin nan bai da fayil na kafofin watsa labarai don saukewa.',thumbnail_must_be_under:'Ƙaramin hoto dole ya zama ƙasa da 5MB.',title_cannot_be_empty:'Taken ba zai iya zama fanko ba',now_live:'Yanzu kana kai tsaye!',have_no_sermons_with:'Ba ku da wa\'azin da ke da fayilolin kafofin watsa labarai don saukewa.',coming_soon:'Zuwa Nan',coming_soon_sub:'Wannan fasalin yana zuwa nan',live_coming_soon_desc:'Ana haɓaka yaɗa kai tsaye kuma zai samu a cikin sabuntawa mai zuwa.',notify_when_ready:'Za a sanar da ku lokacin da aka ƙaddamar da wannan fasalin.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'Sabon Wa azi',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'Ga-ga ne aikin hidimarka',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Sarrafa zaɓuɓɓukan asusun ka',manage_profile:'Sarrafa bayananka na fasto',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'Duba',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Rubutu da Nuni',font_size:'Girman Rubutu',font_style:'Siffar Rubutu',line_spacing:'Tazarar Layi',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'Sunan Nuni',email:'Email',email_address:'Email Address',username:'Sunan Mai Amfani',church_name:'Church Name',denomination:'Ƙungiyar Coci',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'Matsayi',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'Karami',medium:'Matsakaici',large:'Babba',normal:'Al\'ada',compact:'Ƙarami',relaxed:'Shakatawa',default_style:'Na\'asali',serif:'Serif',mono:'Mono',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'Manufofin DMCA',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Bincika',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'Lokacin da fastocin da kake bin suna yaɗa kai tsaye',notif_upload:'Lokacin da fastocin da kake bin suke loda',notif_msg:'Lokacin da ka karɓi sako',extra_large:'XL',admin_label:'ADMIN',delete_account:'Share Asusuna',sermon_title_label:'Taken Wa azi *',content_type_label:'Nau\'in Abun Ciki *',transcript_label:'Rubutu / Cikakken Rubutu (zaɓi)',start_dictation:'🎙 Fara karanta ta murya',file_select_hint:'Danna don zaɓar fayil ɗin bidiyo, sauti ko takardar',search_sermons_ph:'🔍 Nemi wa azi...',search_users_ph:'🔍 Nemi masu amfani...',search_pastors_ph:'🔍 Nemi fastoci...',desc_ph:'Taƙaitaccen bayanin wa azin nan…',transcript_ph:'Manna cikakken rubutun wa azin nan anan…',support_ph:'Rubuta saƙonka ga tallafin…',send_to_admin:'📨 Aika Sako ga Admin',status_approved:'✅ An yarda',status_rejected:'❌ An ƙi',status_pending:'⏳ Ana jira',support_messages:'Saƙonnin Tallafi',reports_tab:'Rahotanni',flagged_tab:'Abun Ciki Da Aka Nuna',escalations_tab:'Matsayin Sama',no_sermons_upload:'Babu wa azi tukuna. Danna "Loda Wa azi" don raba saƙonka na farko.',cert_note:'Loda takardar shaidar ta hanzarta tabbatarwa amma ba dole ba.',article:'Labari',text:'Rubutu',video:'Bidiyo',audio:'Sauti',no_sermons_data:'Babu bayanan wa azi',create_account:'Ƙirƙiri Asusunku',create_password:'Ƙirƙiri Kalmar Sirri',failed_notifs:'Ba a iya lodi sanarwa',all_pastors:'Duk fastocin da aka tabbatar a Trinitarian',overview:'Takaitawa',my_sermons:'Wa azina',upload_sermon:'Loda Wa azi',live_stream:'Yaɗa Kai Tsaye',settings:'Saiti',profile:'Bayanai',notifications:'Sanarwa',inbox:'Saƙo',pastors:'Fastoci',users:'Masu Amfani',analytics:'Bincike',sign_out:'Fita',sign_in:'Shiga',total_sermons:'Jimilar Wa azi',total_views:'Jimilar Kallon',new_followers:'Sabon Mabiya',followers:'Mabiya',views:'Kallo',recent_sermons:'Wa azin Kwanan nan',save:'Ajiye',cancel:'Soke',publish_sermon:'Buga Wa azi',edit_sermon:'Gyara Wa azi',remove_sermon:'Cire Wa azi',save_changes:'Adana Canje-canje',send_message:'Aika Sako',loading:'Ana lodi...',no_sermons:'Babu wa azi',no_notifs:'Babu sanarwa',no_messages:'Babu saƙo',mark_all_read:'Sanya duka an karanta',language:'Harshe',privacy_policy:'Manufofin Sirri',terms_of_service:'Sharuddan Amfani',go_live:'Fara Yaɗa',my_profile:'Bayanaina',change_password:'Canza Kalmar Sirri',security:'Tsaro',legal:'Doka',account:'Asusu',nav_messages:'Saƙonni'},
  pt:{could_not_download_title:'Não foi possível baixar "{title}". Verifique sua conexão e tente novamente.',pro_status_granted:'Status Pro concedido',pro_status_revoked:'Status Pro revogado',grant_label:'conceder',revoke_label:'revogar',approve_pastor_confirm:'Aprovar {name} como pastor verificado?',change_pro_status_confirm:'Tem certeza que deseja {label} o status Pro deste usuário?',pause_auto_approval_confirm:'Pausar a aprovação automática para {name}? Esta candidatura exigirá então revisão manual.',reject_application_confirm:'Rejeitar a candidatura de {name}?',download_sermons_confirm:'Isso baixará {count} arquivo(s) de sermão para o seu dispositivo, um de cada vez. Continuar?',account_deleted_successfully:'Conta excluída com sucesso',account_deleted:'Conta excluída.',account_deleted_sorry_see:'Conta excluída. Sentiremos sua falta.',all_escalations_cleared:'Todas as escalações removidas',all_messages_cleared:'Todas as mensagens removidas',all_messages_marked_as:'Todas as mensagens marcadas como lidas',all_notifications_messages_cleared:'Todas as notificações e mensagens removidas',all_notifications_cleared:'Todas as notificações removidas',all_past_streams_deleted:'Todas as transmissões anteriores excluídas',all_reports_cleared:'Todas as denúncias removidas',all_reports_resolved:'Todas as denúncias resolvidas',already_going_live_please:'Já está ao vivo — aguarde.',archive_all_live_sermons:'Arquivar todos os sermões ao vivo?',archive_sermon:'Arquivar este sermão?',sure_want_sign_out:'Tem certeza que deseja sair?',auto_approval_paused_now:'Aprovação automática pausada — agora requer revisão manual',clear_all_escalations_cannot:'Limpar todas as escalações? Esta ação não pode ser desfeita.',clear_all_messages_cannot:'Limpar todas as mensagens? Esta ação não pode ser desfeita.',clear_all_notifications_sent:'Limpar todas as notificações e mensagens enviadas? Esta ação não pode ser desfeita.',clear_all_notifications_cannot:'Limpar todas as notificações? Esta ação não pode ser desfeita.',clear_all_reports_cannot:'Limpar todas as denúncias? Esta ação não pode ser desfeita.',clear_all_support_messages:'Limpar todas as mensagens de suporte? Esta ação não pode ser desfeita.',clear_entire_listening_watching:'Limpar todo o seu histórico de audição/visualização? Esta ação não pode ser desfeita.',confirmation_text_did_not:'O texto de confirmação não corresponde — exclusão cancelada.',confirmation_text_did_not_2:'O texto de confirmação não corresponde — nada foi excluído.',connection_error_please_try:'Erro de conexão, tente novamente',connection_error_please_try_2:'Erro de conexão. Tente novamente.',content_removed:'Conteúdo removido',could_not_change_quality:'Não foi possível alterar a qualidade',could_not_connect_stream:'Não foi possível conectar à transmissão',could_not_delete_all:'Não foi possível excluir todas as transmissões',could_not_delete_stream:'Não foi possível excluir a transmissão',could_not_join_stream:'Não foi possível entrar na transmissão: ',could_not_load_sermon:'Não foi possível carregar o sermão.',could_not_open_message:'Não foi possível abrir a mensagem',could_not_read_image:'Não foi possível ler o arquivo de imagem',could_not_resend_please:'Não foi possível reenviar. Tente novamente.',could_not_submit_report:'Não foi possível enviar a denúncia. Verifique sua conexão e tente novamente.',could_not_switch_camera:'Não foi possível trocar de câmera — seu dispositivo pode ter apenas uma, ou uma permissão do navegador está bloqueando.',could_not_update_photo:'Não foi possível atualizar a foto',delete_all_audit_log:'Excluir TODAS as entradas do registro de auditoria? Esta ação não pode ser desfeita.',delete_all_past_streams:'Excluir TODAS as transmissões anteriores do seu histórico? Esta ação não pode ser desfeita.',delete_failed_please_try:'Falha ao excluir. Tente novamente.',delete_audit_log_entry:'Excluir esta entrada do registro de auditoria?',delete_comment:'Excluir este comentário?',delete_stream_from_history:'Excluir esta transmissão do seu histórico? Esta ação não pode ser desfeita.',delete_stream_cannot_be:'Excluir esta transmissão? Esta ação não pode ser desfeita.',deletion_failed_email_support:'Falha na exclusão. Envie um e-mail para support@trinitarian.app para solicitar a exclusão.',deletion_failed_please_email:'Falha na exclusão. Envie um e-mail para support@trinitarian.app para solicitar a exclusão da conta.',download_failed:'Falha no download',edit_failed_please_try:'Falha na edição. Tente novamente.',end_live_stream:'Encerrar esta transmissão ao vivo?',error_ending_stream:'Erro ao encerrar a transmissão',failed_approve_application:'Falha ao aprovar a candidatura',failed_archive_sermon:'Falha ao arquivar o sermão',failed_archive_sermons:'Falha ao arquivar os sermões',failed_clear_audit_log:'Falha ao limpar o registro de auditoria',failed_clear_escalations:'Falha ao limpar as escalações',failed_clear_messages:'Falha ao limpar as mensagens',failed_clear_notifications:'Falha ao limpar as notificações',failed_clear_reports:'Falha ao limpar as denúncias',failed_delete:'Falha ao excluir',failed_delete_all_sermons:'Falha ao excluir todos os sermões.',failed_delete_comment:'Falha ao excluir o comentário',failed_delete_comment_2:'Falha ao excluir o comentário.',failed_delete_entry:'Falha ao excluir a entrada',failed_delete_stream_live:'Falha ao excluir. Transmissões ao vivo devem ser encerradas primeiro.',failed_end_stream:'Falha ao encerrar a transmissão',failed_end_stream_2:'Falha ao encerrar a transmissão.',failed_go_live:'Falha ao iniciar a transmissão',failed_mark_as_read:'Falha ao marcar como lida',failed_open_sermon:'Falha ao abrir o sermão',failed_pause_auto_approval:'Falha ao pausar a aprovação automática',failed_reject_application:'Falha ao rejeitar a candidatura',failed_resolve_reports:'Falha ao resolver as denúncias',failed_save_profile:'Falha ao salvar o perfil',failed_send_message:'Falha ao enviar a mensagem',failed_send_please_try:'Falha ao enviar. Tente novamente.',failed_start_stream:'Falha ao iniciar a transmissão: ',failed_submit_report:'Falha ao enviar a denúncia.',failed_update_pro_status:'Falha ao atualizar o status Pro',failed_update_sermon:'Falha ao atualizar o sermão',failed_update_user_status:'Falha ao atualizar o status do usuário',failed_upload_photo:'Falha ao enviar a foto',font_size_updated:'Tamanho da fonte atualizado',font_style_updated:'Estilo da fonte atualizado',image_must_be_under:'A imagem deve ter menos de 5MB',language_updated:'Idioma atualizado',link_copied:'Link copiado!',live_streaming_coming_soon:'Transmissão ao vivo em breve!',live_streaming_launching_soon:'A transmissão ao vivo está chegando em breve. Fique ligado!',message_not_found:'Mensagem não encontrada',message_sent_successfully:'Mensagem enviada com sucesso',name_did_not_match:'O nome não corresponde — exclusão cancelada',no_past_streams_delete:'Nenhuma transmissão anterior para excluir',no_sermons_delete:'Nenhum sermão para excluir.',not_currently_live:'Não está ao vivo no momento',notification_preference_saved:'Preferência de notificação salva',notification_preferences_saved:'Preferências de notificação salvas',ownership_transferred_now_admin:'Propriedade transferida. Você agora é Administrador. Faça login novamente.',photo_saved_locally:'Foto salva localmente',please_choose_when_stream:'Escolha quando esta transmissão deve acontecer',please_enter_message:'Digite uma mensagem',please_enter_message_2:'Digite uma mensagem.',please_enter_response:'Digite uma resposta',please_enter_stream_title:'Digite um título para a transmissão',please_pick_time_future:'Escolha um horário no futuro',please_read_accept_terms:'Leia e aceite os Termos de Serviço e o aviso legal para continuar.',please_select_jpg_png:'Selecione uma imagem JPG ou PNG.',please_select_reason_provide:'Selecione um motivo ou forneça detalhes.',please_select_video_audio:'Selecione um vídeo, áudio, .docx ou .txt. PDF e o antigo .doc não são suportados.',please_select_image_file:'Selecione um arquivo de imagem',please_sign_report_content:'Faça login para denunciar este conteúdo.',please_sign_watch_live:'Faça login para assistir às transmissões ao vivo',profile_photo_removed:'Foto de perfil removida',profile_photo_updated:'Foto de perfil atualizada',profile_updated_successfully:'Perfil atualizado com sucesso!',remove_sermon_permanently:'Remover este sermão permanentemente?',report_resolved:'Denúncia resolvida',report_submitted:'Denúncia enviada',report_comment_review:'Denunciar este comentário para revisão?',resolve_all_pending_reports:'Resolver todas as denúncias pendentes?',response_sent_moderator:'Resposta enviada ao moderador',role_updated:'Função atualizada para ',sermon_not_found:'Sermão não encontrado',sermon_updated_successfully:'Sermão atualizado com sucesso',confirm_sign_out_q:'Sair?',spacing_updated:'Espaçamento atualizado',stream_deleted:'Transmissão excluída',stream_ended:'Transmissão encerrada',stream_ended_great_job:'Transmissão encerrada. Bom trabalho!',stream_scheduled:'Transmissão agendada para ',live_stream_has_ended:'A transmissão ao vivo terminou',sermon_has_no_media:'Este sermão não tem arquivo de mídia para baixar.',thumbnail_must_be_under:'A miniatura deve ter menos de 5MB.',title_cannot_be_empty:'O título não pode estar vazio',now_live:'Você está ao vivo agora!',have_no_sermons_with:'Você não tem sermões com arquivos de mídia para baixar.',coming_soon:'Em Breve',coming_soon_sub:'Este recurso está chegando em breve',live_coming_soon_desc:'A transmissão ao vivo está em desenvolvimento e estará disponível em uma atualização futura.',notify_when_ready:'Você será notificado quando este recurso for lançado.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'Novos Sermões',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'Como seu ministério está se saindo',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Gerencie suas preferências de conta',manage_profile:'Gerencie seu perfil de pastor',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'Visualização',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Fonte e Exibição',font_size:'Tamanho da Fonte',font_style:'Estilo da Fonte',line_spacing:'Espaçamento',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'Nome de Exibição',email:'Email',email_address:'Email Address',username:'Nome de Usuário',church_name:'Church Name',denomination:'Denominação',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'Função',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'Pequeno',medium:'Médio',large:'Grande',normal:'Normal',compact:'Compacto',relaxed:'Relaxado',default_style:'Padrão',serif:'Serif',mono:'Mono',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'Política DMCA',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Explorar',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'Quando pastores que você segue vão ao vivo',notif_upload:'Quando pastores que você segue fazem upload',notif_msg:'Quando receber uma mensagem',extra_large:'XL',admin_label:'ADMIN',delete_account:'Excluir Minha Conta',sermon_title_label:'Título do Sermão *',content_type_label:'Tipo de Conteúdo *',transcript_label:'Transcrição / Texto Completo (opcional)',start_dictation:'🎙 Iniciar ditado',file_select_hint:'Clique para selecionar um arquivo de vídeo, áudio ou documento',search_sermons_ph:'🔍 Pesquisar sermões...',search_users_ph:'🔍 Pesquisar usuários...',search_pastors_ph:'🔍 Pesquisar pastores...',desc_ph:'Breve descrição deste sermão…',transcript_ph:'Cole a transcrição completa aqui, ou use o ditado acima…',support_ph:'Digite sua mensagem para o suporte Trinitarian…',send_to_admin:'📨 Enviar Mensagem ao Admin',status_approved:'✅ Aprovado',status_rejected:'❌ Rejeitado',status_pending:'⏳ Pendente',support_messages:'Mensagens de Suporte',reports_tab:'Denúncias',flagged_tab:'Conteúdo Sinalizado',escalations_tab:'Escalações',no_sermons_upload:'Sem sermões ainda. Clique em "Carregar Sermão" para compartilhar sua primeira mensagem.',cert_note:'Enviar um certificado acelera a verificação mas não é obrigatório.',article:'Artigo',text:'Texto',video:'Vídeo',audio:'Áudio',no_sermons_data:'Sem dados de sermões',create_account:'Criar Sua Conta',create_password:'Criar uma Senha',failed_notifs:'Falha ao carregar notificações',all_pastors:'Todos os pastores verificados no Trinitarian',overview:'Visão Geral',my_sermons:'Meus Sermões',upload_sermon:'Carregar Sermão',live_stream:'Transmissão ao Vivo',settings:'Configurações',profile:'Perfil',notifications:'Notificações',inbox:'Mensagens',pastors:'Pastores',users:'Usuários',analytics:'Análise',sign_out:'Sair',sign_in:'Entrar',total_sermons:'Total de Sermões',total_views:'Total de Visualizações',new_followers:'Novos Seguidores',followers:'Seguidores',views:'Visualizações',recent_sermons:'Sermões Recentes',save:'Salvar',cancel:'Cancelar',publish_sermon:'Publicar Sermão',edit_sermon:'Editar Sermão',remove_sermon:'Remover Sermão',save_changes:'Salvar Alterações',send_message:'Enviar Mensagem',loading:'Carregando...',no_sermons:'Nenhum sermão encontrado',no_notifs:'Nenhuma notificação',no_messages:'Nenhuma mensagem',mark_all_read:'Marcar tudo como lido',language:'Idioma',privacy_policy:'Política de Privacidade',terms_of_service:'Termos de Serviço',go_live:'Ir ao Vivo',my_profile:'Meu Perfil',change_password:'Alterar Senha',security:'Segurança',legal:'Jurídico',account:'Conta',nav_messages:'Mensagens'},
  tw:{could_not_download_title:'Wontumi nnya "{title}". Yɛsrɛ wo hwɛ wo ntokwa mu na sɔ hwɛ bio.',pro_status_granted:'Wɔama Pro tebea',pro_status_revoked:'Wɔagye Pro tebea',grant_label:'ma',revoke_label:'gye',approve_pastor_confirm:'Pensi {name} sɛ ɔsɔfo a wɔahwehwɛ mu?',change_pro_status_confirm:'Wote nka sɛ wopɛ sɛ wo{label} odwumayɛfoɔ yi Pro tebea?',pause_auto_approval_confirm:'Gyae ho hyɛ mmara nnidiso ma {name}? Saa abisade yi bɛhia ankasa nhwehwɛmu afei.',reject_application_confirm:'Po {name} abisade?',download_sermons_confirm:'Eyi bɛgye asɛnka fael {count} akɔ wo adwinnade so, baako baako. Toa so?',account_deleted_successfully:'Wɔayi akawnt no yiye',account_deleted:'Wɔayi akawnt no.',account_deleted_sorry_see:'Wɔayi akawnt no. Ɛyɛ yaw sɛ worekɔ.',all_escalations_cleared:'Wɔayi nkɔanim nyinaa',all_messages_cleared:'Wɔayi nkrasɛm nyinaa',all_messages_marked_as:'Wɔahyɛ nkrasɛm nyinaa sɛ wɔakenkan',all_notifications_messages_cleared:'Wɔayi amanneɛbɔ ne nkrasɛm nyinaa',all_notifications_cleared:'Wɔayi amanneɛbɔ nyinaa',all_past_streams_deleted:'Wɔayi asɛnka a atwam nyinaa',all_reports_cleared:'Wɔayi amanneɛbɔ nyinaa',all_reports_resolved:'Wɔasiesie amanneɛbɔ nyinaa',already_going_live_please:'Ɛrekɔ so dedaw — yɛsrɛ wo twɛn.',archive_all_live_sermons:'Fa asɛnka a ɛrekɔ so nyinaa kɔsie?',archive_sermon:'Fa saa asɛnka yi kɔsie?',sure_want_sign_out:'Wote nka sɛ wopɛ sɛ wufi?',auto_approval_paused_now:'Wɔagyae ho hyɛ mmara nnidiso — ɛho hia sɛ wɔhwɛ mu ankasa seesei',clear_all_escalations_cannot:'Yi nkɔanim nyinaa? Wontumi nsakra eyi.',clear_all_messages_cannot:'Yi nkrasɛm nyinaa? Wontumi nsakra eyi.',clear_all_notifications_sent:'Yi amanneɛbɔ ne nkrasɛm a wɔasoma nyinaa? Wontumi nsakra eyi.',clear_all_notifications_cannot:'Yi amanneɛbɔ nyinaa? Wontumi nsakra eyi.',clear_all_reports_cannot:'Yi amanneɛbɔ nyinaa? Wontumi nsakra eyi.',clear_all_support_messages:'Yi mmoa nkrasɛm nyinaa? Wontumi nsakra eyi.',clear_entire_listening_watching:'Yi wo tie/hwɛ abakɔsɛm nyinaa? Wontumi nsakra eyi.',confirmation_text_did_not:'Nsɛm a wɔde asi so no nhyia — wɔagyae ɛyi.',confirmation_text_did_not_2:'Nsɛm a wɔde asi so no nhyia — wɔanyi hwee.',connection_error_please_try:'Ntokwa ho mfomso, yɛsrɛ wo sɔ hwɛ bio',connection_error_please_try_2:'Ntokwa ho mfomso. Yɛsrɛ wo sɔ hwɛ bio.',content_removed:'Wɔayi mu nsɛm',could_not_change_quality:'Wontumi nsesa kwan pa',could_not_connect_stream:'Wontumi mfa ho nka asɛnka no',could_not_delete_all:'Wontumi nyi asɛnka nyinaa',could_not_delete_stream:'Wontumi nyi asɛnka no',could_not_join_stream:'Wontumi nka asɛnka no ho: ',could_not_load_sermon:'Wontumi mfa asɛnka no mma.',could_not_open_message:'Wontumi mmue krataa no',could_not_read_image:'Wontumi nkenkan mfoniniyɛ fael no',could_not_resend_please:'Wontumi nsoma bio. Yɛsrɛ wo sɔ hwɛ bio.',could_not_submit_report:'Wontumi mfa amanneɛbɔ nkɔ. Yɛsrɛ wo hwɛ wo ntokwa mu na sɔ hwɛ bio.',could_not_switch_camera:'Wontumi nsesa mfoniniyɛ adwinnade — ebia wo dea no wɔ baako pɛ, anaasɛ browser tumi bi resiw ho kwan.',could_not_update_photo:'Wontumi nsesa mfonini no',delete_all_audit_log:'Yi nsɛmmapɛ krataa mu nsɛm NYINAA? Wontumi nsakra eyi.',delete_all_past_streams:'Yi asɛnka a atwam NYINAA fi wo abakɔsɛm mu? Wontumi nsakra eyi.',delete_failed_please_try:'Ɛyi anyɛ yie. Yɛsrɛ wo sɔ hwɛ bio.',delete_audit_log_entry:'Yi saa nsɛmmapɛ krataa mu ade yi?',delete_comment:'Yi saa nsɛm yi?',delete_stream_from_history:'Yi saa asɛnka yi fi wo abakɔsɛm mu? Wontumi nsakra eyi.',delete_stream_cannot_be:'Yi saa asɛnka yi? Wontumi nsakra eyi.',deletion_failed_email_support:'Ɛyi anyɛ yie. Soma email kɔ support@trinitarian.app sɛ wɔmpepa.',deletion_failed_please_email:'Ɛyi anyɛ yie. Yɛsrɛ wo soma email kɔ support@trinitarian.app sɛ wɔmpepa akawnt no.',download_failed:'Nya no anyɛ yie',edit_failed_please_try:'Nsakraeɛ no anyɛ yie. Yɛsrɛ wo sɔ hwɛ bio.',end_live_stream:'Wie saa asɛnka a ɛrekɔ so yi?',error_ending_stream:'Mfomso wɔ asɛnka no awiei mu',failed_approve_application:'Abisade no ho hyɛ mmara anyɛ yie',failed_archive_sermon:'Asɛnka no kɔsie anyɛ yie',failed_archive_sermons:'Asɛnka no kɔsie anyɛ yie',failed_clear_audit_log:'Nsɛmmapɛ krataa yi anyɛ yie',failed_clear_escalations:'Nkɔanim yi anyɛ yie',failed_clear_messages:'Nkrasɛm yi anyɛ yie',failed_clear_notifications:'Amanneɛbɔ yi anyɛ yie',failed_clear_reports:'Amanneɛbɔ yi anyɛ yie',failed_delete:'Ɛyi anyɛ yie',failed_delete_all_sermons:'Asɛnka nyinaa yi anyɛ yie.',failed_delete_comment:'Nsɛm yi anyɛ yie',failed_delete_comment_2:'Nsɛm yi anyɛ yie.',failed_delete_entry:'Ade a ɛwɔ mu no yi anyɛ yie',failed_delete_stream_live:'Ɛyi anyɛ yie. Ɛsɛ sɛ wodi kan wie asɛnka a ɛrekɔ so.',failed_end_stream:'Asɛnka no awiei anyɛ yie',failed_end_stream_2:'Asɛnka no awiei anyɛ yie.',failed_go_live:'Asɛnka no mfiase anyɛ yie',failed_mark_as_read:'Hyɛ sɛ wɔakenkan anyɛ yie',failed_open_sermon:'Asɛnka no bue anyɛ yie',failed_pause_auto_approval:'Ho hyɛ mmara nnidiso gyae anyɛ yie',failed_reject_application:'Abisade no po anyɛ yie',failed_resolve_reports:'Amanneɛbɔ no siesie anyɛ yie',failed_save_profile:'Profael no sie anyɛ yie',failed_send_message:'Krataa no soma anyɛ yie',failed_send_please_try:'Ɛsoma anyɛ yie. Yɛsrɛ wo sɔ hwɛ bio.',failed_start_stream:'Asɛnka no mfiase anyɛ yie: ',failed_submit_report:'Amanneɛbɔ no soma anyɛ yie.',failed_update_pro_status:'Pro tebea no sesa anyɛ yie',failed_update_sermon:'Asɛnka no sesa anyɛ yie',failed_update_user_status:'Odwumayɛfoɔ tebea no sesa anyɛ yie',failed_upload_photo:'Mfonini no mena anyɛ yie',font_size_updated:'Wɔasesa nkyerɛwde kɛse',font_style_updated:'Wɔasesa nkyerɛwde su',image_must_be_under:'Mfonini no sɛ ɛnyɛ kɛse sen 5MB',language_updated:'Wɔasesa kasa',link_copied:'Wɔakopi ho ntɛnkyerɛwde!',live_streaming_coming_soon:'Asɛnka a ɛrekɔ so reba nnansa yi!',live_streaming_launching_soon:'Asɛnka a ɛrekɔ so reba nnansa yi. Wo ho hwɛ!',message_not_found:'Wɔanhu krataa no',message_sent_successfully:'Wɔasoma krataa no yiye',name_did_not_match:'Din no nhyia — wɔagyae ɛyi',no_past_streams_delete:'Asɛnka a atwam biara nni hɔ sɛ wobɛyi',no_sermons_delete:'Asɛnka biara nni hɔ sɛ wobɛyi.',not_currently_live:'Ɛnkɔ so seesei',notification_preference_saved:'Wɔasie amanneɛbɔ pɛ',notification_preferences_saved:'Wɔasie amanneɛbɔ pɛ ahodoɔ',ownership_transferred_now_admin:'Wɔafa ahonya no akɔ. Woyɛ Admin seesei. Yɛsrɛ wo kɔfa wo ho bio.',photo_saved_locally:'Wɔasie mfonini no wɔ adwinnade no so',please_choose_when_stream:'Yɛsrɛ wo paw da a saa asɛnka yi bɛba',please_enter_message:'Yɛsrɛ wo kyerɛw krataa bi',please_enter_message_2:'Yɛsrɛ wo kyerɛw krataa bi.',please_enter_response:'Yɛsrɛ wo kyerɛw mmuae bi',please_enter_stream_title:'Yɛsrɛ wo kyerɛw asɛnka no din',please_pick_time_future:'Yɛsrɛ wo paw bere bi a ɛreba',please_read_accept_terms:'Yɛsrɛ wo kenkan na fa Adwuma Ho Mmara ne ho amanneɛbɔ to mu na woatoa so.',please_select_jpg_png:'Yɛsrɛ wo paw JPG anaa PNG mfonini.',please_select_reason_provide:'Yɛsrɛ wo paw ntease anaa fa nkyerɛkyerɛmu ma.',please_select_video_audio:'Yɛsrɛ wo paw video, nnyigyei, .docx, anaa .txt fael. Wɔmma PDF ne tete .doc kwan.',please_select_image_file:'Yɛsrɛ wo paw mfoniniyɛ fael',please_sign_report_content:'Yɛsrɛ wo kɔfa wo ho na fa saa nsɛm yi ma amanneɛbɔ.',please_sign_watch_live:'Yɛsrɛ wo kɔfa wo ho na hwɛ asɛnka a ɛrekɔ so',profile_photo_removed:'Wɔayi profael mfonini no',profile_photo_updated:'Wɔasesa profael mfonini no',profile_updated_successfully:'Wɔasesa profael no yiye!',remove_sermon_permanently:'Yi saa asɛnka yi koraa?',report_resolved:'Wɔasiesie amanneɛbɔ',report_submitted:'Wɔasoma amanneɛbɔ',report_comment_review:'Fa saa nsɛm yi ma wɔnhwɛ mu?',resolve_all_pending_reports:'Siesie amanneɛbɔ a ɛretwɛn nyinaa?',response_sent_moderator:'Wɔasoma mmuae akɔ ɔhwɛfo hɔ',role_updated:'Wɔasesa dwuma akɔ ',sermon_not_found:'Wɔanhu asɛnka no',sermon_updated_successfully:'Wɔasesa asɛnka no yiye',confirm_sign_out_q:'Fi?',spacing_updated:'Wɔasesa ntam',stream_deleted:'Wɔayi asɛnka no',stream_ended:'Asɛnka no aba awiei',stream_ended_great_job:'Asɛnka no aba awiei. Adwuma pa!',stream_scheduled:'Wɔahyehyɛ asɛnka ama ',live_stream_has_ended:'Asɛnka a ɛrekɔ so no aba awiei',sermon_has_no_media:'Saa asɛnka yi nni fael biara a wobɛnya.',thumbnail_must_be_under:'Mfonini ketewa no sɛ ɛnyɛ kɛse sen 5MB.',title_cannot_be_empty:'Din no ntumi nyɛ hunu',now_live:'Wo ho rekɔ so seesei!',have_no_sermons_with:'Wonni asɛnka a ɛwɔ fael a wubetumi anya.',coming_soon:'Bɛba',coming_soon_sub:'Adwuma yi bɛba',live_coming_soon_desc:'Tee nkrato wɔ ase sɛ wɔreboa na ɛbɛba mmɛhyɛ atoatoo kɛse mu.',notify_when_ready:'Wɔbɛka akyɛ wo sɛ adwuma yi aba.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'Asenka Foforo',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'Saa na wo asɔredan dwuma te',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Hwɛ wo akawnt nhyehyɛe',manage_profile:'Hwɛ wo osofo ho nsɛm',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'Nhwɛso',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Nkyerɛwde ne Nhwɛso',font_size:'Nkyerɛwde Tenten',font_style:'Nkyerɛwde Suban',line_spacing:'Nkyerɛwde Ahorow',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'Din a Wokyere',email:'Email',email_address:'Email Address',username:'Dinto',church_name:'Church Name',denomination:'Ɔsore Foforo',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'Asɛe',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'Ketewa',medium:'Mfimfini',large:'Kɛse',normal:'Ɔsrane',compact:'Ketewa',relaxed:'Ahomgyee',default_style:'Ɔsrane',serif:'Serif',mono:'Mono',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'DMCA Mmara',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Explore',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'Bere a asofo a wodi wɔn akyi reba tee so',notif_upload:'Bere a asofo a wodi wɔn akyi toa',notif_msg:'Bere a wunya krasɛm',extra_large:'XL',admin_label:'ADMIN',delete_account:'Popa Me Akawnt',sermon_title_label:'Asenka Din *',content_type_label:'Akodie Suban *',transcript_label:'Nkyerɛwee / Nkyerɛwde Nyinaa (sɛ wopɛ)',start_dictation:'🎙 Hyɛ dictation ase',file_select_hint:'Klik sɛ wobɛyi video, nnyigyei anaa krataa fayl',search_sermons_ph:'🔍 Hwehwɛ asenka...',search_users_ph:'🔍 Hwehwɛ nnipa...',search_pastors_ph:'🔍 Hwehwɛ asofo...',desc_ph:'Nteasɛm kakra fa asenka yi ho…',transcript_ph:'Hyɛ nkyerɛwee nyinaa ha…',support_ph:'Kyerɛw wo krasɛm kɔ Trinitarian mmoa…',send_to_admin:'📨 Kra Admin',status_approved:'✅ Wɔagye to mu',status_rejected:'❌ Wɔanye',status_pending:'⏳ Retwɛn',support_messages:'Mmoa Nkrasɛm',reports_tab:'Amaneɛ',flagged_tab:'Akodie a Wɔakyerɛ',escalations_tab:'Kɔsoro Asɛm',no_sermons_upload:'Asenka biara nni ho. Klik "Toa Asenka" sɛ wobɛkyɛ ɔkrasɛm a ɛdi kan.',cert_note:'Toa krataa bi bɛma verification ntɛm nnɛ enye nsɔ.',article:'Asɛm',text:'Nkyerɛwee',video:'Video',audio:'Nnyigyei',no_sermons_data:'Asenka data nni ho',create_account:'Bue Wo Akawnt',create_password:'Bue Ahintasɛm',failed_notifs:'Nkrasɛm reload nni ho',all_pastors:'Asofo nyinaa a wɔagyina ho din wɔ Trinitarian',overview:'Nhwɛso',my_sermons:'Me Asenka',upload_sermon:'Toa Asenka',live_stream:'Tee so',settings:'Nhyehyɛe',profile:'Ho Nsɛm',notifications:'Nkrasɛm',inbox:'Nkrasɛm',pastors:'Asofo',users:'Nnipa',analytics:'Nsɛnkyerɛnne',sign_out:'Pue',sign_in:'Hyen mu',total_sermons:'Asenka nyinaa',total_views:'Nhwɛso nyinaa',new_followers:'Mpɔnwahyɛ Foforo',followers:'Mpɔnwahyɛ',views:'Nhwɛso',recent_sermons:'Asenka a Ɛdi Kan',save:'Kora so',cancel:'Gyae',publish_sermon:'Tene Asenka',edit_sermon:'Sesa Asenka',remove_sermon:'Yi Asenka',save_changes:'Kora Nsesa',send_message:'Kra',loading:'Reload...',no_sermons:'Asenka biara nni ho',no_notifs:'Nkrasɛm biara nni ho',no_messages:'Nkrasɛm biara nni ho',mark_all_read:'Hyɛ nkae sɛ wɔakenkan',language:'Kasa',privacy_policy:'Nnimdee Mmara',terms_of_service:'Dwumadie Mmara',go_live:'Kɔ Tee So',my_profile:'Me Ho Nsɛm',change_password:'Sesa Ahintasɛm',security:'Bammɔ',legal:'Mmara',account:'Akawnt'},
  zu:{could_not_download_title:'Ayikwazanga ukulanda i-"{title}". Sicela uhlole uxhumano lwakho bese uzama futhi.',pro_status_granted:'Isimo se-Pro sinikeziwe',pro_status_revoked:'Isimo se-Pro sihoxisiwe',grant_label:'nika',revoke_label:'hoxisa',approve_pastor_confirm:'Gunyaza {name} njengomfundisi oqinisekisiwe?',change_pro_status_confirm:'Uqinisekile ufuna uku-{label} isimo se-Pro salomsebenzisi?',pause_auto_approval_confirm:'Misa ukugunyazwa okuzenzakalelayo kwa-{name}? Lesi sicelo sizodinga ukubuyekezwa ngesandla ngemuva kwalokho.',reject_application_confirm:'Nqaba isicelo sika-{name}?',download_sermons_confirm:'Lokhu kuzolanda amafayela entshumayelo angu-{count} kudivayisi yakho, elilodwa ngesikhathi. Qhubeka?',account_deleted_successfully:'I-akhawunti isuswe ngempumelelo',account_deleted:'I-akhawunti isuswe.',account_deleted_sorry_see:'I-akhawunti isuswe. Kuyadabukisa ukukubona uhamba.',all_escalations_cleared:'Konke ukukhushulwa kususiwe',all_messages_cleared:'Yonke imilayezo isusiwe',all_messages_marked_as:'Yonke imilayezo iphawulwe njengefundiwe',all_notifications_messages_cleared:'Zonke izaziso nemilayezo kususiwe',all_notifications_cleared:'Zonke izaziso zisusiwe',all_past_streams_deleted:'Konke ukusakaza kwangaphambili kususiwe',all_reports_cleared:'Yonke imibiko isusiwe',all_reports_resolved:'Yonke imibiko ixazululiwe',already_going_live_please:'Sekuvele kusakaza — sicela ulinde.',archive_all_live_sermons:'Godla zonke izintshumayelo eziphilayo?',archive_sermon:'Godla le ntshumayelo?',sure_want_sign_out:'Uqinisekile ufuna ukuphuma?',auto_approval_paused_now:'Ukugunyazwa okuzenzakalelayo kumisiwe — manje kudinga ukubuyekezwa ngesandla',clear_all_escalations_cannot:'Susa konke ukukhushulwa? Lokhu ngeke kubuyiselwe.',clear_all_messages_cannot:'Susa yonke imilayezo? Lokhu ngeke kubuyiselwe.',clear_all_notifications_sent:'Susa zonke izaziso nemilayezo ethunyelwe? Lokhu ngeke kubuyiselwe.',clear_all_notifications_cannot:'Susa zonke izaziso? Lokhu ngeke kubuyiselwe.',clear_all_reports_cannot:'Susa yonke imibiko? Lokhu ngeke kubuyiselwe.',clear_all_support_messages:'Susa yonke imilayezo yosekelo? Lokhu ngeke kubuyiselwe.',clear_entire_listening_watching:'Susa yonke umlando wakho wokulalela/wokubuka? Lokhu ngeke kubuyiselwe.',confirmation_text_did_not:'Umbhalo wokuqinisekisa awuhambisani — ukususwa kukhanseliwe.',confirmation_text_did_not_2:'Umbhalo wokuqinisekisa awuhambisani — akukho okususiwe.',connection_error_please_try:'Iphutha loxhumano, sicela uzame futhi',connection_error_please_try_2:'Iphutha loxhumano. Sicela uzame futhi.',content_removed:'Okuqukethwe kususiwe',could_not_change_quality:'Ayikwazanga ukushintsha ikhwalithi',could_not_connect_stream:'Ayikwazanga ukuxhuma ekusakazeni',could_not_delete_all:'Ayikwazanga ukususa konke ukusakaza',could_not_delete_stream:'Ayikwazanga ukususa ukusakaza',could_not_join_stream:'Ayikwazanga ukujoyina ukusakaza: ',could_not_load_sermon:'Ayikwazanga ukulayisha intshumayelo.',could_not_open_message:'Ayikwazanga ukuvula umlayezo',could_not_read_image:'Ayikwazanga ukufunda ifayela lomfanekiso',could_not_resend_please:'Ayikwazanga ukuthumela kabusha. Sicela uzame futhi.',could_not_submit_report:'Ayikwazanga ukuthumela umbiko. Sicela uhlole uxhumano lwakho bese uzama futhi.',could_not_switch_camera:'Ayikwazanga ukushintsha ikhamera — idivayisi yakho ingase ibe nekhamera eyodwa kuphela, noma imvume yesiphequluli iyayivimbela.',could_not_update_photo:'Ayikwazanga ukubuyekeza isithombe',delete_all_audit_log:'Susa ZONKE izingxenye zerekhodi lokuhlola? Lokhu ngeke kubuyiselwe.',delete_all_past_streams:'Susa KONKE ukusakaza kwangaphambili emlandweni wakho? Lokhu ngeke kubuyiselwe.',delete_failed_please_try:'Ukususa kwehlulekile. Sicela uzame futhi.',delete_audit_log_entry:'Susa lengxenye yerekhodi lokuhlola?',delete_comment:'Susa lo mbono?',delete_stream_from_history:'Susa lokhu kusakaza emlandweni wakho? Lokhu ngeke kubuyiselwe.',delete_stream_cannot_be:'Susa lokhu kusakaza? Lokhu ngeke kubuyiselwe.',deletion_failed_email_support:'Ukususa kwehlulekile. Thumela i-imeyili ku-support@trinitarian.app ukucela ukususwa.',deletion_failed_please_email:'Ukususa kwehlulekile. Sicela uthumele i-imeyili ku-support@trinitarian.app ukucela ukususwa kwe-akhawunti.',download_failed:'Ukulanda kwehlulekile',edit_failed_please_try:'Ukuhlela kwehlulekile. Sicela uzame futhi.',end_live_stream:'Qeda lokhu kusakaza okuphilayo?',error_ending_stream:'Iphutha ekuqedeni ukusakaza',failed_approve_application:'Ukugunyaza isicelo kwehlulekile',failed_archive_sermon:'Ukugodla intshumayelo kwehlulekile',failed_archive_sermons:'Ukugodla izintshumayelo kwehlulekile',failed_clear_audit_log:'Ukususa irekhodi lokuhlola kwehlulekile',failed_clear_escalations:'Ukususa ukukhushulwa kwehlulekile',failed_clear_messages:'Ukususa imilayezo kwehlulekile',failed_clear_notifications:'Ukususa izaziso kwehlulekile',failed_clear_reports:'Ukususa imibiko kwehlulekile',failed_delete:'Ukususa kwehlulekile',failed_delete_all_sermons:'Ukususa zonke izintshumayelo kwehlulekile.',failed_delete_comment:'Ukususa umbono kwehlulekile',failed_delete_comment_2:'Ukususa umbono kwehlulekile.',failed_delete_entry:'Ukususa ingxenye kwehlulekile',failed_delete_stream_live:'Ukususa kwehlulekile. Ukusakaza okuphilayo kufanele kuqedwe kuqala.',failed_end_stream:'Ukuqeda ukusakaza kwehlulekile',failed_end_stream_2:'Ukuqeda ukusakaza kwehlulekile.',failed_go_live:'Ukuqala ukusakaza kwehlulekile',failed_mark_as_read:'Ukuphawula njengefundiwe kwehlulekile',failed_open_sermon:'Ukuvula intshumayelo kwehlulekile',failed_pause_auto_approval:'Ukumisa ukugunyazwa okuzenzakalelayo kwehlulekile',failed_reject_application:'Ukwenqaba isicelo kwehlulekile',failed_resolve_reports:'Ukuxazulula imibiko kwehlulekile',failed_save_profile:'Ukulondoloza iphrofayela kwehlulekile',failed_send_message:'Ukuthumela umlayezo kwehlulekile',failed_send_please_try:'Ukuthumela kwehlulekile. Sicela uzame futhi.',failed_start_stream:'Ukuqala ukusakaza kwehlulekile: ',failed_submit_report:'Ukuthumela umbiko kwehlulekile.',failed_update_pro_status:'Ukubuyekeza isimo se-Pro kwehlulekile',failed_update_sermon:'Ukubuyekeza intshumayelo kwehlulekile',failed_update_user_status:'Ukubuyekeza isimo somsebenzisi kwehlulekile',failed_upload_photo:'Ukulayisha isithombe kwehlulekile',font_size_updated:'Usayizi wamagama ubuyekeziwe',font_style_updated:'Isitayela samagama sibuyekeziwe',image_must_be_under:'Isithombe kufanele sibe ngaphansi kuka-5MB',language_updated:'Ulimi lubuyekeziwe',link_copied:'Isixhumanisi sikopishiwe!',live_streaming_coming_soon:'Ukusakaza okuphilayo kuzofika maduze!',live_streaming_launching_soon:'Ukusakaza okuphilayo kuzethulwa maduze. Hlala ulindele!',message_not_found:'Umlayezo awutholakalanga',message_sent_successfully:'Umlayezo uthunyelwe ngempumelelo',name_did_not_match:'Igama alihambisani — ukususwa kukhanseliwe',no_past_streams_delete:'Azikho izinsakazo zangaphambili zokususa',no_sermons_delete:'Azikho izintshumayelo zokususa.',not_currently_live:'Ayikho okwamanje ephilayo',notification_preference_saved:'Okuthandwayo kwesaziso kulondoloziwe',notification_preferences_saved:'Okuthandwayo kwezaziso kulondoloziwe',ownership_transferred_now_admin:'Ubunikazi budluliselwe. Manje ungumphathi. Sicela ungene kabusha.',photo_saved_locally:'Isithombe silondoloze kule divayisi',please_choose_when_stream:'Sicela ukhethe ukuthi lokhu kusakaza kuzokwenzeka nini',please_enter_message:'Sicela ufake umlayezo',please_enter_message_2:'Sicela ufake umlayezo.',please_enter_response:'Sicela ufake impendulo',please_enter_stream_title:'Sicela ufake isihloko sokusakaza',please_pick_time_future:'Sicela ukhethe isikhathi esizayo',please_read_accept_terms:'Sicela ufunde bese wamukela Imigomo Yesevisi kanye nesaziso sokuzikhulula ukuze uqhubeke.',please_select_jpg_png:'Sicela ukhethe isithombe se-JPG noma i-PNG.',please_select_reason_provide:'Sicela ukhethe isizathu noma unikeze imininingwane.',please_select_video_audio:'Sicela ukhethe ividiyo, umsindo, i-.docx, noma ifayela le-.txt. I-PDF nendala i-.doc azisekelwa.',please_select_image_file:'Sicela ukhethe ifayela lesithombe',please_sign_report_content:'Sicela ungene ukuze ubike lokhu okuqukethwe.',please_sign_watch_live:'Sicela ungene ukuze ubukele ukusakaza okuphilayo',profile_photo_removed:'Isithombe sephrofayela sisusiwe',profile_photo_updated:'Isithombe sephrofayela sibuyekeziwe',profile_updated_successfully:'Iphrofayela ibuyekeziwe ngempumelelo!',remove_sermon_permanently:'Susa le ntshumayelo unomphela?',report_resolved:'Umbiko uxazululiwe',report_submitted:'Umbiko uthunyelwe',report_comment_review:'Bika lo mbono ukuze ubuyekezwe?',resolve_all_pending_reports:'Xazulula yonke imibiko elindile?',response_sent_moderator:'Impendulo ithunyelwe kumphathi',role_updated:'Indima ibuyekezwe yaba ',sermon_not_found:'Intshumayelo ayitholakalanga',sermon_updated_successfully:'Intshumayelo ibuyekeziwe ngempumelelo',confirm_sign_out_q:'Phuma?',spacing_updated:'Isikhala sibuyekeziwe',stream_deleted:'Ukusakaza kususiwe',stream_ended:'Ukusakaza kuphelile',stream_ended_great_job:'Ukusakaza kuphelile. Umsebenzi omuhle!',stream_scheduled:'Ukusakaza kuhleliwe ku ',live_stream_has_ended:'Ukusakaza okuphilayo kuphelile',sermon_has_no_media:'Le ntshumayelo ayinalo ifayela lemidiya lokulanda.',thumbnail_must_be_under:'Isithombe esincane kufanele sibe ngaphansi kuka-5MB.',title_cannot_be_empty:'Isihloko asikwazi ukuba akunalutho',now_live:'Usuphila manje!',have_no_sermons_with:'Awunazo izintshumayelo ezinamafayela emidiya okulanda.',coming_soon:'Kuyeza',coming_soon_sub:'Lesi sici siyeza',live_coming_soon_desc:'Ukusakaza bukhoma kusathuthukiswa futhi kuzothola uhlaziyo lwesikhathi esizayo.',notify_when_ready:'Uzaziswa uma lesi sici siqaliswa.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'Izintshumayelo Ezintsha',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'Nansi indlela inkonzo yakho esebenza ngayo',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Phatha izintandokazi ze-akhawunti yakho',manage_profile:'Phatha iphrofayili yakho yomfundisi',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'Isibonelo',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Ifonti Nokubonisa',font_size:'Usayizi Weffonti',font_style:'Isitayela Seffonti',line_spacing:'Isikhala Semigqa',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'Igama Lokubonisa',email:'Email',email_address:'Email Address',username:'Igama Lomsebenzisi',church_name:'Church Name',denomination:'Inhlangano Yenkonzo',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'Indima',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'Encane',medium:'Phakathi',large:'Enkulu',normal:'Okujwayelekile',compact:'Omfinyeleziwe',relaxed:'Khulukulwayo',default_style:'Okuzenzakalelayo',serif:'Serif',mono:'Mono',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'Inqubomgomo ye-DMCA',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Explore',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'Uma abefundisi obelandelayo besakaza bukhoma',notif_upload:'Uma abefundisi obelandelayo belayisha',notif_msg:'Uma uthole umlayezo',extra_large:'XL',admin_label:'ADMIN',delete_account:'Susa I-akhawunti Yami',sermon_title_label:'Isihloko Sentshumayelo *',content_type_label:'Uhlobo Lokuqukethwe *',transcript_label:'Umbhalo / Umbhalo Ophelele (okukhethwa)',start_dictation:'🎙 Qala ukuhuba',file_select_hint:'Chofoza ukuze ukhethe ifayela levidiyo, umsindo noma idokhumenti',search_sermons_ph:'🔍 Sesha izintshumayelo...',search_users_ph:'🔍 Sesha abasebenzisi...',search_pastors_ph:'🔍 Sesha abefundisi...',desc_ph:'Incazelo emfushane yale ntshumayelo…',transcript_ph:'Namathisela umbhalo ophelele lapha…',support_ph:'Bhala umlayezo wakho kusupodi ye-Trinitarian…',send_to_admin:'📨 Thumela Umlayezo ku-Admin',status_approved:'✅ Yamukelwa',status_rejected:'❌ Yaliwa',status_pending:'⏳ Ilindile',support_messages:'Imilayezo Yosizo',reports_tab:'Imibiko',flagged_tab:'Okuqukethwe Okuphawuliwe',escalations_tab:'Ukuphakamisa',no_sermons_upload:'Azikho izintshumayelo. Chofoza "Layisha Intshumayelo" ukuze wabelane ngesiqephu sakho sokuqala.',cert_note:'Ukulayisha isitifiketi kuyakhawulezisa ukuqinisekiswa kodwa akudingi.',article:'Indatshana',text:'Umbhalo',video:'Ividiyo',audio:'Umsindo',no_sermons_data:'Asikho idatha',create_account:'Dala I-akhawunti Yakho',create_password:'Dala Iphasiwedi',failed_notifs:'Yehlulekile ukulayisha izaziso',all_pastors:'Bonke abefundisi abaqinisekisiwe ku-Trinitarian',overview:'Isifinyezo',my_sermons:'Izintshumayelo Zami',upload_sermon:'Layisha Intshumayelo',live_stream:'Ukusakaza Bukhoma',settings:'Izilungiselelo',profile:'Iphrofayili',notifications:'Izaziso',inbox:'Imilayezo',pastors:'Abefundisi',users:'Abasebenzisi',analytics:'Uhlalutyo',sign_out:'Phuma',sign_in:'Ngena',total_sermons:'Izintshumayelo Zonke',total_views:'Ukubukwa Konke',new_followers:'Abalandeli Abasha',followers:'Abalandeli',views:'Ukubukwa',recent_sermons:'Izintshumayelo Zakamuva',save:'Londoloza',cancel:'Khansela',publish_sermon:'Shicilela Intshumayelo',edit_sermon:'Hlela Intshumayelo',remove_sermon:'Susa Intshumayelo',save_changes:'Gcina Izinguquko',send_message:'Thumela Umlayezo',loading:'Iyalayisha...',no_sermons:'Azikho izintshumayelo',no_notifs:'Azikho izaziso',no_messages:'Awekho amilayezo',mark_all_read:'Maka konke njengokufundiwe',language:'Ulimi',privacy_policy:'Inqubomgomo Yobumfihlo',terms_of_service:'Imigomo Yesevisi',go_live:'Sakaza Bukhoma',my_profile:'Iphrofayili Yami',change_password:'Shintsha Iphasiwedi',security:'Ezokuphepha',legal:'Ezomthetho',account:'I-akhawunti'},
  ar:{could_not_download_title:'تعذر تنزيل "{title}". يرجى التحقق من اتصالك والمحاولة مرة أخرى.',pro_status_granted:'تم منح حالة برو',pro_status_revoked:'تم إلغاء حالة برو',grant_label:'منح',revoke_label:'إلغاء',approve_pastor_confirm:'الموافقة على {name} كقس موثق؟',change_pro_status_confirm:'هل أنت متأكد من أنك تريد {label} حالة برو لهذا المستخدم؟',pause_auto_approval_confirm:'إيقاف الموافقة التلقائية لـ {name} مؤقتًا؟ سيتطلب هذا الطلب حينئذ مراجعة يدوية.',reject_application_confirm:'رفض طلب {name}؟',download_sermons_confirm:'سيؤدي هذا إلى تنزيل {count} ملف(ات) عظة إلى جهازك، واحدًا تلو الآخر. المتابعة؟',account_deleted_successfully:'تم حذف الحساب بنجاح',account_deleted:'تم حذف الحساب.',account_deleted_sorry_see:'تم حذف الحساب. يؤسفنا رحيلك.',all_escalations_cleared:'تم مسح جميع التصعيدات',all_messages_cleared:'تم مسح جميع الرسائل',all_messages_marked_as:'تم تحديد جميع الرسائل كمقروءة',all_notifications_messages_cleared:'تم مسح جميع الإشعارات والرسائل',all_notifications_cleared:'تم مسح جميع الإشعارات',all_past_streams_deleted:'تم حذف جميع البثوث السابقة',all_reports_cleared:'تم مسح جميع البلاغات',all_reports_resolved:'تم حل جميع البلاغات',already_going_live_please:'البث المباشر قيد التشغيل بالفعل — يرجى الانتظار.',archive_all_live_sermons:'أرشفة جميع العظات المباشرة؟',archive_sermon:'أرشفة هذه العظة؟',sure_want_sign_out:'هل أنت متأكد من تسجيل الخروج؟',auto_approval_paused_now:'تم إيقاف الموافقة التلقائية مؤقتًا — تتطلب الآن مراجعة يدوية',clear_all_escalations_cannot:'مسح جميع التصعيدات؟ لا يمكن التراجع عن هذا.',clear_all_messages_cannot:'مسح جميع الرسائل؟ لا يمكن التراجع عن هذا.',clear_all_notifications_sent:'مسح جميع الإشعارات والرسائل المرسلة؟ لا يمكن التراجع عن هذا.',clear_all_notifications_cannot:'مسح جميع الإشعارات؟ لا يمكن التراجع عن هذا.',clear_all_reports_cannot:'مسح جميع البلاغات؟ لا يمكن التراجع عن هذا.',clear_all_support_messages:'مسح جميع رسائل الدعم؟ لا يمكن التراجع عن هذا.',clear_entire_listening_watching:'مسح سجل الاستماع/المشاهدة بالكامل؟ لا يمكن التراجع عن هذا.',confirmation_text_did_not:'نص التأكيد غير مطابق — تم إلغاء الحذف.',confirmation_text_did_not_2:'نص التأكيد غير مطابق — لم يتم حذف أي شيء.',connection_error_please_try:'خطأ في الاتصال، يرجى المحاولة مرة أخرى',connection_error_please_try_2:'خطأ في الاتصال. يرجى المحاولة مرة أخرى.',content_removed:'تمت إزالة المحتوى',could_not_change_quality:'تعذر تغيير الجودة',could_not_connect_stream:'تعذر الاتصال بالبث',could_not_delete_all:'تعذر حذف جميع البثوث',could_not_delete_stream:'تعذر حذف البث',could_not_join_stream:'تعذر الانضمام إلى البث: ',could_not_load_sermon:'تعذر تحميل العظة.',could_not_open_message:'تعذر فتح الرسالة',could_not_read_image:'تعذر قراءة ملف الصورة',could_not_resend_please:'تعذر إعادة الإرسال. يرجى المحاولة مرة أخرى.',could_not_submit_report:'تعذر إرسال البلاغ. يرجى التحقق من الاتصال والمحاولة مرة أخرى.',could_not_switch_camera:'تعذر تبديل الكاميرا — قد يحتوي جهازك على كاميرا واحدة فقط، أو أن إذن المتصفح يمنع ذلك.',could_not_update_photo:'تعذر تحديث الصورة',delete_all_audit_log:'حذف جميع إدخالات سجل التدقيق؟ لا يمكن التراجع عن هذا.',delete_all_past_streams:'حذف جميع البثوث السابقة من سجلك؟ لا يمكن التراجع عن هذا.',delete_failed_please_try:'فشل الحذف. يرجى المحاولة مرة أخرى.',delete_audit_log_entry:'حذف إدخال سجل التدقيق هذا؟',delete_comment:'حذف هذا التعليق؟',delete_stream_from_history:'حذف هذا البث من سجلك؟ لا يمكن التراجع عن هذا.',delete_stream_cannot_be:'حذف هذا البث؟ لا يمكن التراجع عن هذا.',deletion_failed_email_support:'فشل الحذف. راسل support@trinitarian.app لطلب الحذف.',deletion_failed_please_email:'فشل الحذف. يرجى مراسلة support@trinitarian.app لطلب حذف الحساب.',download_failed:'فشل التنزيل',edit_failed_please_try:'فشل التعديل. يرجى المحاولة مرة أخرى.',end_live_stream:'إنهاء هذا البث المباشر؟',error_ending_stream:'خطأ في إنهاء البث',failed_approve_application:'فشل في الموافقة على الطلب',failed_archive_sermon:'فشل في أرشفة العظة',failed_archive_sermons:'فشل في أرشفة العظات',failed_clear_audit_log:'فشل في مسح سجل التدقيق',failed_clear_escalations:'فشل في مسح التصعيدات',failed_clear_messages:'فشل في مسح الرسائل',failed_clear_notifications:'فشل في مسح الإشعارات',failed_clear_reports:'فشل في مسح البلاغات',failed_delete:'فشل الحذف',failed_delete_all_sermons:'فشل في حذف جميع العظات.',failed_delete_comment:'فشل في حذف التعليق',failed_delete_comment_2:'فشل في حذف التعليق.',failed_delete_entry:'فشل في حذف الإدخال',failed_delete_stream_live:'فشل الحذف. يجب إنهاء البثوث المباشرة أولاً.',failed_end_stream:'فشل في إنهاء البث',failed_end_stream_2:'فشل في إنهاء البث.',failed_go_live:'فشل في بدء البث',failed_mark_as_read:'فشل في التحديد كمقروء',failed_open_sermon:'فشل في فتح العظة',failed_pause_auto_approval:'فشل في إيقاف الموافقة التلقائية مؤقتًا',failed_reject_application:'فشل في رفض الطلب',failed_resolve_reports:'فشل في حل البلاغات',failed_save_profile:'فشل في حفظ الملف الشخصي',failed_send_message:'فشل في إرسال الرسالة',failed_send_please_try:'فشل الإرسال. يرجى المحاولة مرة أخرى.',failed_start_stream:'فشل في بدء البث: ',failed_submit_report:'فشل في إرسال البلاغ.',failed_update_pro_status:'فشل في تحديث حالة برو',failed_update_sermon:'فشل في تحديث العظة',failed_update_user_status:'فشل في تحديث حالة المستخدم',failed_upload_photo:'فشل في رفع الصورة',font_size_updated:'تم تحديث حجم الخط',font_style_updated:'تم تحديث نمط الخط',image_must_be_under:'يجب أن تكون الصورة أقل من 5 ميجابايت',language_updated:'تم تحديث اللغة',link_copied:'تم نسخ الرابط!',live_streaming_coming_soon:'البث المباشر قريبًا!',live_streaming_launching_soon:'البث المباشر قادم قريبًا. ترقبوا!',message_not_found:'الرسالة غير موجودة',message_sent_successfully:'تم إرسال الرسالة بنجاح',name_did_not_match:'الاسم غير مطابق — تم إلغاء الحذف',no_past_streams_delete:'لا توجد بثوث سابقة للحذف',no_sermons_delete:'لا توجد عظات للحذف.',not_currently_live:'غير مباشر حاليًا',notification_preference_saved:'تم حفظ تفضيل الإشعارات',notification_preferences_saved:'تم حفظ تفضيلات الإشعارات',ownership_transferred_now_admin:'تم نقل الملكية. أنت الآن مسؤول. يرجى تسجيل الدخول مرة أخرى.',photo_saved_locally:'تم حفظ الصورة محليًا',please_choose_when_stream:'يرجى اختيار موعد هذا البث',please_enter_message:'يرجى إدخال رسالة',please_enter_message_2:'يرجى إدخال رسالة.',please_enter_response:'يرجى إدخال رد',please_enter_stream_title:'يرجى إدخال عنوان للبث',please_pick_time_future:'يرجى اختيار وقت في المستقبل',please_read_accept_terms:'يرجى قراءة والموافقة على شروط الخدمة وإخلاء المسؤولية للمتابعة.',please_select_jpg_png:'يرجى اختيار صورة بصيغة JPG أو PNG.',please_select_reason_provide:'يرجى اختيار سبب أو تقديم تفاصيل.',please_select_video_audio:'يرجى اختيار فيديو أو صوت أو .docx أو .txt. لا يتم دعم PDF و .doc القديم.',please_select_image_file:'يرجى اختيار ملف صورة',please_sign_report_content:'يرجى تسجيل الدخول للإبلاغ عن هذا المحتوى.',please_sign_watch_live:'يرجى تسجيل الدخول لمشاهدة البث المباشر',profile_photo_removed:'تمت إزالة صورة الملف الشخصي',profile_photo_updated:'تم تحديث صورة الملف الشخصي',profile_updated_successfully:'تم تحديث الملف الشخصي بنجاح!',remove_sermon_permanently:'إزالة هذه العظة نهائيًا؟',report_resolved:'تم حل البلاغ',report_submitted:'تم إرسال البلاغ',report_comment_review:'الإبلاغ عن هذا التعليق للمراجعة؟',resolve_all_pending_reports:'حل جميع البلاغات المعلقة؟',response_sent_moderator:'تم إرسال الرد إلى المشرف',role_updated:'تم تحديث الدور إلى ',sermon_not_found:'العظة غير موجودة',sermon_updated_successfully:'تم تحديث العظة بنجاح',confirm_sign_out_q:'تسجيل الخروج؟',spacing_updated:'تم تحديث التباعد',stream_deleted:'تم حذف البث',stream_ended:'انتهى البث',stream_ended_great_job:'انتهى البث. أحسنت!',stream_scheduled:'تمت جدولة البث في ',live_stream_has_ended:'انتهى البث المباشر',sermon_has_no_media:'لا يحتوي هذا العظة على ملف وسائط للتنزيل.',thumbnail_must_be_under:'يجب أن تكون الصورة المصغرة أقل من 5 ميجابايت.',title_cannot_be_empty:'لا يمكن أن يكون العنوان فارغًا',now_live:'أنت الآن مباشر!',have_no_sermons_with:'ليس لديك عظات تحتوي على ملفات وسائط للتنزيل.',coming_soon:'قريباً',coming_soon_sub:'هذه الميزة قادمة قريباً',live_coming_soon_desc:'البث المباشر قيد التطوير وسيكون متاحاً في تحديث مستقبلي.',notify_when_ready:'ستتلقى إشعاراً عند إطلاق هذه الميزة.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'عظات جديدة',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'هكذا يؤدي خدمتك',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'إدارة تفضيلات حسابك',manage_profile:'إدارة ملف القسيس',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'معاينة',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'الخط والعرض',font_size:'حجم الخط',font_style:'نمط الخط',line_spacing:'تباعد الأسطر',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'الاسم المعروض',email:'Email',email_address:'Email Address',username:'اسم المستخدم',church_name:'Church Name',denomination:'المذهب',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'الدور',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'صغير',medium:'متوسط',large:'كبير',normal:'عادي',compact:'مضغوط',relaxed:'مريح',default_style:'افتراضي',serif:'سيريف',mono:'أحادي',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'سياسة DMCA',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'استكشاف',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'عندما يبث القساوسة الذين تتابعهم مباشرة',notif_upload:'عندما يرفع القساوسة الذين تتابعهم',notif_msg:'عند استلام رسالة',extra_large:'XL',admin_label:'مدير',delete_account:'حذف حسابي',sermon_title_label:'عنوان العظة *',content_type_label:'نوع المحتوى *',transcript_label:'نص العظة / النص الكامل (اختياري)',start_dictation:'🎙 بدء الإملاء',file_select_hint:'انقر لتحديد ملف فيديو أو صوت أو مستند',search_sermons_ph:'🔍 البحث في العظات...',search_users_ph:'🔍 البحث في المستخدمين...',search_pastors_ph:'🔍 البحث في القساوسة...',desc_ph:'وصف مختصر لهذه العظة…',transcript_ph:'الصق النص الكامل للعظة هنا…',support_ph:'اكتب رسالتك لدعم Trinitarian…',send_to_admin:'📨 إرسال رسالة للمدير',status_approved:'✅ موافق عليه',status_rejected:'❌ مرفوض',status_pending:'⏳ قيد الانتظار',support_messages:'رسائل الدعم',reports_tab:'التقارير',flagged_tab:'المحتوى المُبلَّغ عنه',escalations_tab:'التصعيدات',no_sermons_upload:'لا توجد عظات بعد. انقر على "رفع عظة" لمشاركة رسالتك الأولى.',cert_note:'رفع شهادة يسرّع التحقق لكنه غير مطلوب.',article:'مقالة',text:'نص',video:'فيديو',audio:'صوت',no_sermons_data:'لا بيانات عظات بعد',create_account:'إنشاء حسابك',create_password:'إنشاء كلمة المرور',failed_notifs:'فشل تحميل الإشعارات',all_pastors:'جميع القساوسة الموثقين على Trinitarian',overview:'نظرة عامة',my_sermons:'عظاتي',upload_sermon:'رفع عظة',live_stream:'بث مباشر',settings:'الإعدادات',profile:'الملف الشخصي',notifications:'الإشعارات',inbox:'الرسائل',pastors:'القساوسة',users:'المستخدمون',analytics:'التحليلات',sign_out:'تسجيل الخروج',sign_in:'تسجيل الدخول',total_sermons:'إجمالي العظات',total_views:'إجمالي المشاهدات',new_followers:'متابعون جدد',followers:'المتابعون',views:'المشاهدات',recent_sermons:'العظات الأخيرة',save:'حفظ',cancel:'إلغاء',publish_sermon:'نشر العظة',edit_sermon:'تعديل العظة',remove_sermon:'حذف العظة',save_changes:'حفظ التغييرات',send_message:'إرسال رسالة',loading:'جار التحميل...',no_sermons:'لا توجد عظات',no_notifs:'لا توجد إشعارات',no_messages:'لا رسائل',mark_all_read:'وضع علامة مقروء على الكل',language:'اللغة',privacy_policy:'سياسة الخصوصية',terms_of_service:'شروط الخدمة',go_live:'بدء البث',my_profile:'ملفي الشخصي',change_password:'تغيير كلمة المرور',security:'الأمان',legal:'قانوني',account:'الحساب',nav_messages:'الرسائل'},
  zh:{could_not_download_title:'无法下载"{title}"。请检查您的网络连接并重试。',pro_status_granted:'已授予专业版状态',pro_status_revoked:'已撤销专业版状态',grant_label:'授予',revoke_label:'撤销',approve_pastor_confirm:'批准{name}成为认证牧师？',change_pro_status_confirm:'您确定要{label}此用户的专业版状态吗？',pause_auto_approval_confirm:'暂停{name}的自动批准？此申请随后将需要人工审核。',reject_application_confirm:'拒绝{name}的申请？',download_sermons_confirm:'这将把{count}个讲道文件逐个下载到您的设备。继续吗？',account_deleted_successfully:'账户已成功删除',account_deleted:'账户已删除。',account_deleted_sorry_see:'账户已删除。很遗憾看到您离开。',all_escalations_cleared:'所有升级处理已清除',all_messages_cleared:'所有消息已清除',all_messages_marked_as:'所有消息已标记为已读',all_notifications_messages_cleared:'所有通知和消息已清除',all_notifications_cleared:'所有通知已清除',all_past_streams_deleted:'所有往期直播已删除',all_reports_cleared:'所有举报已清除',all_reports_resolved:'所有举报已处理',already_going_live_please:'已在直播中 — 请稍候。',archive_all_live_sermons:'归档所有直播讲道？',archive_sermon:'归档此讲道？',sure_want_sign_out:'确定要退出登录吗？',auto_approval_paused_now:'自动批准已暂停 — 现需人工审核',clear_all_escalations_cannot:'清除所有升级处理？此操作无法撤销。',clear_all_messages_cannot:'清除所有消息？此操作无法撤销。',clear_all_notifications_sent:'清除所有通知和已发送消息？此操作无法撤销。',clear_all_notifications_cannot:'清除所有通知？此操作无法撤销。',clear_all_reports_cannot:'清除所有举报？此操作无法撤销。',clear_all_support_messages:'清除所有支持消息？此操作无法撤销。',clear_entire_listening_watching:'清除您的整个收听/观看历史记录？此操作无法撤销。',confirmation_text_did_not:'确认文本不匹配 — 已取消删除。',confirmation_text_did_not_2:'确认文本不匹配 — 未删除任何内容。',connection_error_please_try:'连接错误，请重试',connection_error_please_try_2:'连接错误。请重试。',content_removed:'内容已移除',could_not_change_quality:'无法更改画质',could_not_connect_stream:'无法连接到直播',could_not_delete_all:'无法删除所有直播',could_not_delete_stream:'无法删除直播',could_not_join_stream:'无法加入直播：',could_not_load_sermon:'无法加载讲道。',could_not_open_message:'无法打开消息',could_not_read_image:'无法读取图像文件',could_not_resend_please:'无法重新发送。请重试。',could_not_submit_report:'无法提交举报。请检查您的网络连接并重试。',could_not_switch_camera:'无法切换摄像头 — 您的设备可能只有一个摄像头，或浏览器权限阻止了此操作。',could_not_update_photo:'无法更新照片',delete_all_audit_log:'删除所有审计日志条目？此操作无法撤销。',delete_all_past_streams:'从您的历史记录中删除所有往期直播？此操作无法撤销。',delete_failed_please_try:'删除失败。请重试。',delete_audit_log_entry:'删除此审计日志条目？',delete_comment:'删除此评论？',delete_stream_from_history:'从您的历史记录中删除此直播？此操作无法撤销。',delete_stream_cannot_be:'删除此直播？此操作无法撤销。',deletion_failed_email_support:'删除失败。请发送邮件至 support@trinitarian.app 申请删除。',deletion_failed_please_email:'删除失败。请发送邮件至 support@trinitarian.app 申请删除账户。',download_failed:'下载失败',edit_failed_please_try:'编辑失败。请重试。',end_live_stream:'结束此直播？',error_ending_stream:'结束直播时出错',failed_approve_application:'批准申请失败',failed_archive_sermon:'归档讲道失败',failed_archive_sermons:'归档讲道失败',failed_clear_audit_log:'清除审计日志失败',failed_clear_escalations:'清除升级处理失败',failed_clear_messages:'清除消息失败',failed_clear_notifications:'清除通知失败',failed_clear_reports:'清除举报失败',failed_delete:'删除失败',failed_delete_all_sermons:'删除所有讲道失败。',failed_delete_comment:'删除评论失败',failed_delete_comment_2:'删除评论失败。',failed_delete_entry:'删除条目失败',failed_delete_stream_live:'删除失败。必须先结束直播。',failed_end_stream:'结束直播失败',failed_end_stream_2:'结束直播失败。',failed_go_live:'开始直播失败',failed_mark_as_read:'标记为已读失败',failed_open_sermon:'打开讲道失败',failed_pause_auto_approval:'暂停自动批准失败',failed_reject_application:'拒绝申请失败',failed_resolve_reports:'处理举报失败',failed_save_profile:'保存资料失败',failed_send_message:'发送消息失败',failed_send_please_try:'发送失败。请重试。',failed_start_stream:'开始直播失败：',failed_submit_report:'提交举报失败。',failed_update_pro_status:'更新专业版状态失败',failed_update_sermon:'更新讲道失败',failed_update_user_status:'更新用户状态失败',failed_upload_photo:'上传照片失败',font_size_updated:'字体大小已更新',font_style_updated:'字体样式已更新',image_must_be_under:'图片必须小于5MB',language_updated:'语言已更新',link_copied:'链接已复制！',live_streaming_coming_soon:'直播即将上线！',live_streaming_launching_soon:'直播即将推出，敬请期待！',message_not_found:'未找到消息',message_sent_successfully:'消息发送成功',name_did_not_match:'姓名不匹配 — 已取消删除',no_past_streams_delete:'没有可删除的往期直播',no_sermons_delete:'没有可删除的讲道。',not_currently_live:'当前未直播',notification_preference_saved:'通知偏好已保存',notification_preferences_saved:'通知偏好设置已保存',ownership_transferred_now_admin:'所有权已转移。您现在是管理员。请重新登录。',photo_saved_locally:'照片已保存到本地',please_choose_when_stream:'请选择此直播应何时进行',please_enter_message:'请输入消息',please_enter_message_2:'请输入消息。',please_enter_response:'请输入回复',please_enter_stream_title:'请输入直播标题',please_pick_time_future:'请选择未来的时间',please_read_accept_terms:'请阅读并接受服务条款和免责声明以继续。',please_select_jpg_png:'请选择JPG或PNG图片。',please_select_reason_provide:'请选择原因或提供详细信息。',please_select_video_audio:'请选择视频、音频、.docx或.txt文件。不支持PDF和旧版.doc格式。',please_select_image_file:'请选择图片文件',please_sign_report_content:'请登录以举报此内容。',please_sign_watch_live:'请登录以观看直播',profile_photo_removed:'头像已移除',profile_photo_updated:'头像已更新',profile_updated_successfully:'资料更新成功！',remove_sermon_permanently:'永久移除此讲道？',report_resolved:'举报已处理',report_submitted:'举报已提交',report_comment_review:'举报此评论以供审核？',resolve_all_pending_reports:'处理所有待处理举报？',response_sent_moderator:'回复已发送给版主',role_updated:'角色已更新为 ',sermon_not_found:'未找到讲道',sermon_updated_successfully:'讲道更新成功',confirm_sign_out_q:'退出登录？',spacing_updated:'间距已更新',stream_deleted:'直播已删除',stream_ended:'直播已结束',stream_ended_great_job:'直播已结束。做得好！',stream_scheduled:'直播已安排于 ',live_stream_has_ended:'直播已结束',sermon_has_no_media:'此讲道没有可供下载的媒体文件。',thumbnail_must_be_under:'缩略图必须小于5MB。',title_cannot_be_empty:'标题不能为空',now_live:'您现在正在直播！',have_no_sermons_with:'您没有包含媒体文件的讲道可供下载。',coming_soon:'即将推出',coming_soon_sub:'此功能即将推出',live_coming_soon_desc:'直播功能正在开发中，将在未来的更新中推出。',notify_when_ready:'此功能推出时您将收到通知。',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'新讲道',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'您的事工表现如何',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'管理您的账户偏好',manage_profile:'管理您的牧师资料',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'预览',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'字体与显示',font_size:'字体大小',font_style:'字体样式',line_spacing:'行距',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'显示名称',email:'Email',email_address:'Email Address',username:'用户名',church_name:'Church Name',denomination:'宗派',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'角色',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'小',medium:'中',large:'大',normal:'正常',compact:'紧凑',relaxed:'宽松',default_style:'默认',serif:'衬线',mono:'等宽',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'DMCA政策',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'探索',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'当您关注的牧师开始直播时',notif_upload:'当您关注的牧师上传时',notif_msg:'当您收到消息时',extra_large:'XL',admin_label:'管理员',delete_account:'删除我的账户',sermon_title_label:'讲道标题 *',content_type_label:'内容类型 *',transcript_label:'文字稿 / 全文（可选）',start_dictation:'🎙 开始听写',file_select_hint:'点击选择视频、音频或文档文件',search_sermons_ph:'🔍 搜索讲道...',search_users_ph:'🔍 搜索用户...',search_pastors_ph:'🔍 搜索牧师...',desc_ph:'本讲道的简短描述…',transcript_ph:'在此粘贴完整的讲道文字稿…',support_ph:'输入您的消息给 Trinitarian 支持…',send_to_admin:'📨 发送消息给管理员',status_approved:'✅ 已批准',status_rejected:'❌ 已拒绝',status_pending:'⏳ 待处理',support_messages:'支持消息',reports_tab:'举报',flagged_tab:'已标记内容',escalations_tab:'升级',no_sermons_upload:'暂无讲道。点击"上传讲道"分享您的第一条消息。',cert_note:'上传证书可加快验证速度，但不是必须的。',article:'文章',text:'文本',video:'视频',audio:'音频',no_sermons_data:'暂无讲道数据',create_account:'创建您的账户',create_password:'创建密码',failed_notifs:'无法加载通知',all_pastors:'Trinitarian上所有认证牧师',overview:'概览',my_sermons:'我的讲道',upload_sermon:'上传讲道',live_stream:'直播',settings:'设置',profile:'个人资料',notifications:'通知',inbox:'消息',pastors:'牧师',users:'用户',analytics:'分析',sign_out:'退出',sign_in:'登录',total_sermons:'讲道总数',total_views:'总观看次数',new_followers:'新粉丝',followers:'粉丝',views:'观看次数',recent_sermons:'最近讲道',save:'保存',cancel:'取消',publish_sermon:'发布讲道',edit_sermon:'编辑讲道',remove_sermon:'删除讲道',save_changes:'保存更改',send_message:'发送消息',loading:'加载中...',no_sermons:'未找到讲道',no_notifs:'暂无通知',no_messages:'暂无消息',mark_all_read:'全部标为已读',language:'语言',privacy_policy:'隐私政策',terms_of_service:'服务条款',go_live:'开始直播',my_profile:'我的主页',change_password:'更改密码',security:'安全',legal:'法律',account:'账户',nav_messages:'消息'},
  hi:{could_not_download_title:'"{title}" डाउनलोड नहीं हो सका। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।',pro_status_granted:'प्रो स्थिति प्रदान की गई',pro_status_revoked:'प्रो स्थिति रद्द की गई',grant_label:'प्रदान करना',revoke_label:'रद्द करना',approve_pastor_confirm:'{name} को सत्यापित पास्टर के रूप में स्वीकृत करें?',change_pro_status_confirm:'क्या आप वाकई इस उपयोगकर्ता की प्रो स्थिति को {label} करना चाहते हैं?',pause_auto_approval_confirm:'{name} के लिए स्वचालित अनुमोदन रोकें? इस आवेदन को फिर मैन्युअल समीक्षा की आवश्यकता होगी।',reject_application_confirm:'{name} का आवेदन अस्वीकार करें?',download_sermons_confirm:'यह {count} उपदेश फ़ाइल(ओं) को आपके डिवाइस पर एक-एक करके डाउनलोड करेगा। जारी रखें?',account_deleted_successfully:'खाता सफलतापूर्वक हटा दिया गया',account_deleted:'खाता हटा दिया गया।',account_deleted_sorry_see:'खाता हटा दिया गया। आपको जाते देखकर दुख हुआ।',all_escalations_cleared:'सभी एस्केलेशन साफ़ किए गए',all_messages_cleared:'सभी संदेश साफ़ किए गए',all_messages_marked_as:'सभी संदेश पढ़े गए के रूप में चिह्नित',all_notifications_messages_cleared:'सभी सूचनाएं और संदेश साफ़ किए गए',all_notifications_cleared:'सभी सूचनाएं साफ़ की गईं',all_past_streams_deleted:'सभी पिछली स्ट्रीम हटा दी गईं',all_reports_cleared:'सभी रिपोर्ट साफ़ की गईं',all_reports_resolved:'सभी रिपोर्ट हल की गईं',already_going_live_please:'पहले से ही लाइव है — कृपया प्रतीक्षा करें।',archive_all_live_sermons:'सभी लाइव उपदेशों को संग्रहित करें?',archive_sermon:'इस उपदेश को संग्रहित करें?',sure_want_sign_out:'क्या आप वाकई साइन आउट करना चाहते हैं?',auto_approval_paused_now:'स्वचालित अनुमोदन रोका गया — अब मैन्युअल समीक्षा आवश्यक है',clear_all_escalations_cannot:'सभी एस्केलेशन साफ़ करें? इसे पूर्ववत नहीं किया जा सकता।',clear_all_messages_cannot:'सभी संदेश साफ़ करें? इसे पूर्ववत नहीं किया जा सकता।',clear_all_notifications_sent:'सभी सूचनाएं और भेजे गए संदेश साफ़ करें? इसे पूर्ववत नहीं किया जा सकता।',clear_all_notifications_cannot:'सभी सूचनाएं साफ़ करें? इसे पूर्ववत नहीं किया जा सकता।',clear_all_reports_cannot:'सभी रिपोर्ट साफ़ करें? इसे पूर्ववत नहीं किया जा सकता।',clear_all_support_messages:'सभी सहायता संदेश साफ़ करें? इसे पूर्ववत नहीं किया जा सकता।',clear_entire_listening_watching:'अपना पूरा सुनने/देखने का इतिहास साफ़ करें? इसे पूर्ववत नहीं किया जा सकता।',confirmation_text_did_not:'पुष्टिकरण पाठ मेल नहीं खाता — विलोपन रद्द किया गया।',confirmation_text_did_not_2:'पुष्टिकरण पाठ मेल नहीं खाता — कुछ भी हटाया नहीं गया।',connection_error_please_try:'कनेक्शन त्रुटि, कृपया पुनः प्रयास करें',connection_error_please_try_2:'कनेक्शन त्रुटि। कृपया पुनः प्रयास करें।',content_removed:'सामग्री हटाई गई',could_not_change_quality:'गुणवत्ता बदली नहीं जा सकी',could_not_connect_stream:'स्ट्रीम से कनेक्ट नहीं हो सका',could_not_delete_all:'सभी स्ट्रीम हटाई नहीं जा सकीं',could_not_delete_stream:'स्ट्रीम हटाई नहीं जा सकी',could_not_join_stream:'स्ट्रीम में शामिल नहीं हो सके: ',could_not_load_sermon:'उपदेश लोड नहीं हो सका।',could_not_open_message:'संदेश खोला नहीं जा सका',could_not_read_image:'छवि फ़ाइल पढ़ी नहीं जा सकी',could_not_resend_please:'पुनः भेजा नहीं जा सका। कृपया पुनः प्रयास करें।',could_not_submit_report:'रिपोर्ट सबमिट नहीं हो सकी। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।',could_not_switch_camera:'कैमरा बदला नहीं जा सका — आपके डिवाइस में केवल एक हो सकता है, या ब्राउज़र अनुमति इसे अवरुद्ध कर रही है।',could_not_update_photo:'फ़ोटो अपडेट नहीं हो सकी',delete_all_audit_log:'सभी ऑडिट लॉग प्रविष्टियां हटाएं? इसे पूर्ववत नहीं किया जा सकता।',delete_all_past_streams:'अपने इतिहास से सभी पिछली स्ट्रीम हटाएं? इसे पूर्ववत नहीं किया जा सकता।',delete_failed_please_try:'हटाना विफल रहा। कृपया पुनः प्रयास करें।',delete_audit_log_entry:'इस ऑडिट लॉग प्रविष्टि को हटाएं?',delete_comment:'इस टिप्पणी को हटाएं?',delete_stream_from_history:'इस स्ट्रीम को अपने इतिहास से हटाएं? इसे पूर्ववत नहीं किया जा सकता।',delete_stream_cannot_be:'इस स्ट्रीम को हटाएं? इसे पूर्ववत नहीं किया जा सकता।',deletion_failed_email_support:'विलोपन विफल रहा। विलोपन का अनुरोध करने के लिए support@trinitarian.app पर ईमेल करें।',deletion_failed_please_email:'विलोपन विफल रहा। खाता विलोपन का अनुरोध करने के लिए कृपया support@trinitarian.app पर ईमेल करें।',download_failed:'डाउनलोड विफल रहा',edit_failed_please_try:'संपादन विफल रहा। कृपया पुनः प्रयास करें।',end_live_stream:'इस लाइव स्ट्रीम को समाप्त करें?',error_ending_stream:'स्ट्रीम समाप्त करने में त्रुटि',failed_approve_application:'आवेदन स्वीकृत करने में विफल',failed_archive_sermon:'उपदेश संग्रहित करने में विफल',failed_archive_sermons:'उपदेश संग्रहित करने में विफल',failed_clear_audit_log:'ऑडिट लॉग साफ़ करने में विफल',failed_clear_escalations:'एस्केलेशन साफ़ करने में विफल',failed_clear_messages:'संदेश साफ़ करने में विफल',failed_clear_notifications:'सूचनाएं साफ़ करने में विफल',failed_clear_reports:'रिपोर्ट साफ़ करने में विफल',failed_delete:'हटाने में विफल',failed_delete_all_sermons:'सभी उपदेश हटाने में विफल।',failed_delete_comment:'टिप्पणी हटाने में विफल',failed_delete_comment_2:'टिप्पणी हटाने में विफल।',failed_delete_entry:'प्रविष्टि हटाने में विफल',failed_delete_stream_live:'हटाने में विफल। लाइव स्ट्रीम पहले समाप्त होनी चाहिए।',failed_end_stream:'स्ट्रीम समाप्त करने में विफल',failed_end_stream_2:'स्ट्रीम समाप्त करने में विफल।',failed_go_live:'लाइव जाने में विफल',failed_mark_as_read:'पढ़ा गया चिह्नित करने में विफल',failed_open_sermon:'उपदेश खोलने में विफल',failed_pause_auto_approval:'स्वचालित अनुमोदन रोकने में विफल',failed_reject_application:'आवेदन अस्वीकार करने में विफल',failed_resolve_reports:'रिपोर्ट हल करने में विफल',failed_save_profile:'प्रोफ़ाइल सहेजने में विफल',failed_send_message:'संदेश भेजने में विफल',failed_send_please_try:'भेजने में विफल। कृपया पुनः प्रयास करें।',failed_start_stream:'स्ट्रीम शुरू करने में विफल: ',failed_submit_report:'रिपोर्ट सबमिट करने में विफल।',failed_update_pro_status:'प्रो स्थिति अपडेट करने में विफल',failed_update_sermon:'उपदेश अपडेट करने में विफल',failed_update_user_status:'उपयोगकर्ता स्थिति अपडेट करने में विफल',failed_upload_photo:'फ़ोटो अपलोड करने में विफल',font_size_updated:'फ़ॉन्ट आकार अपडेट किया गया',font_style_updated:'फ़ॉन्ट शैली अपडेट की गई',image_must_be_under:'छवि 5MB से कम होनी चाहिए',language_updated:'भाषा अपडेट की गई',link_copied:'लिंक कॉपी किया गया!',live_streaming_coming_soon:'लाइव स्ट्रीमिंग जल्द आ रही है!',live_streaming_launching_soon:'लाइव स्ट्रीमिंग जल्द शुरू हो रही है। बने रहें!',message_not_found:'संदेश नहीं मिला',message_sent_successfully:'संदेश सफलतापूर्वक भेजा गया',name_did_not_match:'नाम मेल नहीं खाता — विलोपन रद्द किया गया',no_past_streams_delete:'हटाने के लिए कोई पिछली स्ट्रीम नहीं',no_sermons_delete:'हटाने के लिए कोई उपदेश नहीं।',not_currently_live:'वर्तमान में लाइव नहीं',notification_preference_saved:'सूचना प्राथमिकता सहेजी गई',notification_preferences_saved:'सूचना प्राथमिकताएं सहेजी गईं',ownership_transferred_now_admin:'स्वामित्व स्थानांतरित। अब आप एडमिन हैं। कृपया फिर से लॉगिन करें।',photo_saved_locally:'फ़ोटो स्थानीय रूप से सहेजी गई',please_choose_when_stream:'कृपया चुनें कि यह स्ट्रीम कब होनी चाहिए',please_enter_message:'कृपया एक संदेश दर्ज करें',please_enter_message_2:'कृपया एक संदेश दर्ज करें।',please_enter_response:'कृपया एक प्रतिक्रिया दर्ज करें',please_enter_stream_title:'कृपया स्ट्रीम शीर्षक दर्ज करें',please_pick_time_future:'कृपया भविष्य में एक समय चुनें',please_read_accept_terms:'जारी रखने के लिए कृपया सेवा की शर्तें और अस्वीकरण पढ़ें और स्वीकार करें।',please_select_jpg_png:'कृपया एक JPG या PNG छवि चुनें।',please_select_reason_provide:'कृपया एक कारण चुनें या विवरण दें।',please_select_video_audio:'कृपया एक वीडियो, ऑडियो, .docx, या .txt फ़ाइल चुनें। PDF और पुराना .doc समर्थित नहीं है।',please_select_image_file:'कृपया एक छवि फ़ाइल चुनें',please_sign_report_content:'इस सामग्री की रिपोर्ट करने के लिए कृपया साइन इन करें।',please_sign_watch_live:'लाइव स्ट्रीम देखने के लिए कृपया साइन इन करें',profile_photo_removed:'प्रोफ़ाइल फ़ोटो हटाई गई',profile_photo_updated:'प्रोफ़ाइल फ़ोटो अपडेट की गई',profile_updated_successfully:'प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!',remove_sermon_permanently:'इस उपदेश को स्थायी रूप से हटाएं?',report_resolved:'रिपोर्ट हल की गई',report_submitted:'रिपोर्ट सबमिट की गई',report_comment_review:'समीक्षा के लिए इस टिप्पणी की रिपोर्ट करें?',resolve_all_pending_reports:'सभी लंबित रिपोर्ट हल करें?',response_sent_moderator:'प्रतिक्रिया मॉडरेटर को भेजी गई',role_updated:'भूमिका अपडेट की गई: ',sermon_not_found:'उपदेश नहीं मिला',sermon_updated_successfully:'उपदेश सफलतापूर्वक अपडेट किया गया',confirm_sign_out_q:'साइन आउट करें?',spacing_updated:'स्पेसिंग अपडेट की गई',stream_deleted:'स्ट्रीम हटाई गई',stream_ended:'स्ट्रीम समाप्त हुई',stream_ended_great_job:'स्ट्रीम समाप्त हुई। बहुत बढ़िया काम!',stream_scheduled:'स्ट्रीम शेड्यूल की गई: ',live_stream_has_ended:'लाइव स्ट्रीम समाप्त हो गई है',sermon_has_no_media:'इस उपदेश में डाउनलोड करने के लिए कोई मीडिया फ़ाइल नहीं है।',thumbnail_must_be_under:'थंबनेल 5MB से कम होना चाहिए।',title_cannot_be_empty:'शीर्षक खाली नहीं हो सकता',now_live:'आप अभी लाइव हैं!',have_no_sermons_with:'आपके पास मीडिया फ़ाइलों वाले कोई उपदेश नहीं हैं जिन्हें डाउनलोड किया जा सके।',coming_soon:'जल्द आ रहा है',coming_soon_sub:'यह सुविधा जल्द आ रही है',live_coming_soon_desc:'लाइव स्ट्रीमिंग विकास में है और भविष्य के अपडेट में उपलब्ध होगी।',notify_when_ready:'जब यह सुविधा लॉन्च होगी तो आपको सूचित किया जाएगा।',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'नए उपदेश',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'आपकी सेवकाई कैसी चल रही है',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'अपनी खाता प्राथमिकताएं प्रबंधित करें',manage_profile:'अपनी पादरी प्रोफ़ाइल प्रबंधित करें',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'पूर्वावलोकन',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'फ़ॉन्ट और प्रदर्शन',font_size:'फ़ॉन्ट आकार',font_style:'फ़ॉन्ट शैली',line_spacing:'लाइन स्पेसिंग',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'प्रदर्शित नाम',email:'Email',email_address:'Email Address',username:'उपयोगकर्ता नाम',church_name:'Church Name',denomination:'संप्रदाय',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'भूमिका',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'छोटा',medium:'मध्यम',large:'बड़ा',normal:'सामान्य',compact:'संक्षिप्त',relaxed:'आरामदायक',default_style:'डिफ़ॉल्ट',serif:'सेरिफ़',mono:'मोनो',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'DMCA नीति',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Explore',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'जब आप जिन पादरियों को फॉलो करते हैं वे लाइव हों',notif_upload:'जब आप जिन पादरियों को फॉलो करते हैं वे अपलोड करें',notif_msg:'जब आपको संदेश मिले',extra_large:'XL',admin_label:'एडमिन',delete_account:'मेरा खाता हटाएं',sermon_title_label:'उपदेश शीर्षक *',content_type_label:'सामग्री प्रकार *',transcript_label:'प्रतिलेख / पूर्ण पाठ (वैकल्पिक)',start_dictation:'🎙 श्रुतलेख शुरू करें',file_select_hint:'वीडियो, ऑडियो या दस्तावेज़ फ़ाइल चुनने के लिए क्लिक करें',search_sermons_ph:'🔍 उपदेश खोजें...',search_users_ph:'🔍 उपयोगकर्ता खोजें...',search_pastors_ph:'🔍 पादरी खोजें...',desc_ph:'इस उपदेश का संक्षिप्त विवरण…',transcript_ph:'यहाँ पूरा प्रतिलेख पेस्ट करें…',support_ph:'Trinitarian सहायता को अपना संदेश टाइप करें…',send_to_admin:'📨 एडमिन को संदेश भेजें',status_approved:'✅ स्वीकृत',status_rejected:'❌ अस्वीकृत',status_pending:'⏳ लंबित',support_messages:'सहायता संदेश',reports_tab:'रिपोर्ट',flagged_tab:'चिह्नित सामग्री',escalations_tab:'एस्केलेशन',no_sermons_upload:'अभी कोई उपदेश नहीं। पहला संदेश साझा करने के लिए "उपदेश अपलोड करें" पर क्लिक करें।',cert_note:'प्रमाणपत्र अपलोड करने से सत्यापन तेज होता है लेकिन यह आवश्यक नहीं है।',article:'लेख',text:'पाठ',video:'वीडियो',audio:'ऑडियो',no_sermons_data:'अभी कोई उपदेश डेटा नहीं',create_account:'अपना खाता बनाएं',create_password:'पासवर्ड बनाएं',failed_notifs:'सूचनाएं लोड नहीं हो सकीं',all_pastors:'Trinitarian पर सभी सत्यापित पादरी',overview:'अवलोकन',my_sermons:'मेरे उपदेश',upload_sermon:'उपदेश अपलोड करें',live_stream:'लाइव स्ट्रीम',settings:'सेटिंग्स',profile:'प्रोफ़ाइल',notifications:'सूचनाएं',inbox:'संदेश',pastors:'पादरी',users:'उपयोगकर्ता',analytics:'विश्लेषण',sign_out:'साइन आउट',sign_in:'साइन इन',total_sermons:'कुल उपदेश',total_views:'कुल व्यूज़',new_followers:'नए अनुयायी',followers:'अनुयायी',views:'व्यूज़',recent_sermons:'हाल के उपदेश',save:'सहेजें',cancel:'रद्द करें',publish_sermon:'उपदेश प्रकाशित करें',edit_sermon:'उपदेश संपादित करें',remove_sermon:'उपदेश हटाएं',save_changes:'परिवर्तन सहेजें',send_message:'संदेश भेजें',loading:'लोड हो रहा है...',no_sermons:'कोई उपदेश नहीं',no_notifs:'कोई सूचना नहीं',no_messages:'कोई संदेश नहीं',mark_all_read:'सभी को पढ़ा हुआ चिह्नित करें',language:'भाषा',privacy_policy:'गोपनीयता नीति',terms_of_service:'सेवा की शर्तें',go_live:'लाइव जाएं',my_profile:'मेरी प्रोफ़ाइल',change_password:'पासवर्ड बदलें',security:'सुरक्षा',legal:'कानूनी',account:'खाता'},
  es:{could_not_download_title:'No se pudo descargar "{title}". Verifica tu conexión e inténtalo de nuevo.',pro_status_granted:'Estado Pro otorgado',pro_status_revoked:'Estado Pro revocado',grant_label:'otorgar',revoke_label:'revocar',approve_pastor_confirm:'¿Aprobar a {name} como pastor verificado?',change_pro_status_confirm:'¿Estás seguro de que deseas {label} el estado Pro de este usuario?',pause_auto_approval_confirm:'¿Pausar la aprobación automática para {name}? Esta solicitud requerirá entonces revisión manual.',reject_application_confirm:'¿Rechazar la solicitud de {name}?',download_sermons_confirm:'Esto descargará {count} archivo(s) de sermón a tu dispositivo, uno a la vez. ¿Continuar?',account_deleted_successfully:'Cuenta eliminada correctamente',account_deleted:'Cuenta eliminada.',account_deleted_sorry_see:'Cuenta eliminada. Lamentamos verte partir.',all_escalations_cleared:'Todas las escaladas eliminadas',all_messages_cleared:'Todos los mensajes eliminados',all_messages_marked_as:'Todos los mensajes marcados como leídos',all_notifications_messages_cleared:'Todas las notificaciones y mensajes eliminados',all_notifications_cleared:'Todas las notificaciones eliminadas',all_past_streams_deleted:'Todas las transmisiones anteriores eliminadas',all_reports_cleared:'Todos los reportes eliminados',all_reports_resolved:'Todos los reportes resueltos',already_going_live_please:'Ya está en vivo — espera por favor.',archive_all_live_sermons:'¿Archivar todos los sermones en vivo?',archive_sermon:'¿Archivar este sermón?',sure_want_sign_out:'¿Seguro que deseas cerrar sesión?',auto_approval_paused_now:'Aprobación automática pausada — ahora requiere revisión manual',clear_all_escalations_cannot:'¿Eliminar todas las escaladas? Esto no se puede deshacer.',clear_all_messages_cannot:'¿Eliminar todos los mensajes? Esto no se puede deshacer.',clear_all_notifications_sent:'¿Eliminar todas las notificaciones y mensajes enviados? Esto no se puede deshacer.',clear_all_notifications_cannot:'¿Eliminar todas las notificaciones? Esto no se puede deshacer.',clear_all_reports_cannot:'¿Eliminar todos los reportes? Esto no se puede deshacer.',clear_all_support_messages:'¿Eliminar todos los mensajes de soporte? Esto no se puede deshacer.',clear_entire_listening_watching:'¿Borrar todo tu historial de escucha/visualización? Esto no se puede deshacer.',confirmation_text_did_not:'El texto de confirmación no coincide — eliminación cancelada.',confirmation_text_did_not_2:'El texto de confirmación no coincide — no se eliminó nada.',connection_error_please_try:'Error de conexión, inténtalo de nuevo',connection_error_please_try_2:'Error de conexión. Inténtalo de nuevo.',content_removed:'Contenido eliminado',could_not_change_quality:'No se pudo cambiar la calidad',could_not_connect_stream:'No se pudo conectar a la transmisión',could_not_delete_all:'No se pudieron eliminar todas las transmisiones',could_not_delete_stream:'No se pudo eliminar la transmisión',could_not_join_stream:'No se pudo unir a la transmisión: ',could_not_load_sermon:'No se pudo cargar el sermón.',could_not_open_message:'No se pudo abrir el mensaje',could_not_read_image:'No se pudo leer el archivo de imagen',could_not_resend_please:'No se pudo reenviar. Inténtalo de nuevo.',could_not_submit_report:'No se pudo enviar el reporte. Verifica tu conexión e inténtalo de nuevo.',could_not_switch_camera:'No se pudo cambiar de cámara — tu dispositivo puede tener solo una, o un permiso del navegador lo está bloqueando.',could_not_update_photo:'No se pudo actualizar la foto',delete_all_audit_log:'¿Eliminar TODAS las entradas del registro de auditoría? Esto no se puede deshacer.',delete_all_past_streams:'¿Eliminar TODAS las transmisiones anteriores de tu historial? Esto no se puede deshacer.',delete_failed_please_try:'Error al eliminar. Inténtalo de nuevo.',delete_audit_log_entry:'¿Eliminar esta entrada del registro de auditoría?',delete_comment:'¿Eliminar este comentario?',delete_stream_from_history:'¿Eliminar esta transmisión de tu historial? Esto no se puede deshacer.',delete_stream_cannot_be:'¿Eliminar esta transmisión? Esto no se puede deshacer.',deletion_failed_email_support:'Error al eliminar. Envía un correo a support@trinitarian.app para solicitar la eliminación.',deletion_failed_please_email:'Error al eliminar. Envía un correo a support@trinitarian.app para solicitar la eliminación de la cuenta.',download_failed:'Error en la descarga',edit_failed_please_try:'Error al editar. Inténtalo de nuevo.',end_live_stream:'¿Finalizar esta transmisión en vivo?',error_ending_stream:'Error al finalizar la transmisión',failed_approve_application:'Error al aprobar la solicitud',failed_archive_sermon:'Error al archivar el sermón',failed_archive_sermons:'Error al archivar los sermones',failed_clear_audit_log:'Error al borrar el registro de auditoría',failed_clear_escalations:'Error al borrar las escaladas',failed_clear_messages:'Error al borrar los mensajes',failed_clear_notifications:'Error al borrar las notificaciones',failed_clear_reports:'Error al borrar los reportes',failed_delete:'Error al eliminar',failed_delete_all_sermons:'Error al eliminar todos los sermones.',failed_delete_comment:'Error al eliminar el comentario',failed_delete_comment_2:'Error al eliminar el comentario.',failed_delete_entry:'Error al eliminar la entrada',failed_delete_stream_live:'Error al eliminar. Las transmisiones en vivo deben finalizarse primero.',failed_end_stream:'Error al finalizar la transmisión',failed_end_stream_2:'Error al finalizar la transmisión.',failed_go_live:'Error al iniciar la transmisión',failed_mark_as_read:'Error al marcar como leído',failed_open_sermon:'Error al abrir el sermón',failed_pause_auto_approval:'Error al pausar la aprobación automática',failed_reject_application:'Error al rechazar la solicitud',failed_resolve_reports:'Error al resolver los reportes',failed_save_profile:'Error al guardar el perfil',failed_send_message:'Error al enviar el mensaje',failed_send_please_try:'Error al enviar. Inténtalo de nuevo.',failed_start_stream:'Error al iniciar la transmisión: ',failed_submit_report:'Error al enviar el reporte.',failed_update_pro_status:'Error al actualizar el estado Pro',failed_update_sermon:'Error al actualizar el sermón',failed_update_user_status:'Error al actualizar el estado del usuario',failed_upload_photo:'Error al subir la foto',font_size_updated:'Tamaño de fuente actualizado',font_style_updated:'Estilo de fuente actualizado',image_must_be_under:'La imagen debe pesar menos de 5MB',language_updated:'Idioma actualizado',link_copied:'¡Enlace copiado!',live_streaming_coming_soon:'¡Transmisión en vivo próximamente!',live_streaming_launching_soon:'La transmisión en vivo llega pronto. ¡Mantente atento!',message_not_found:'Mensaje no encontrado',message_sent_successfully:'Mensaje enviado correctamente',name_did_not_match:'El nombre no coincide — eliminación cancelada',no_past_streams_delete:'No hay transmisiones anteriores para eliminar',no_sermons_delete:'No hay sermones para eliminar.',not_currently_live:'No está en vivo actualmente',notification_preference_saved:'Preferencia de notificación guardada',notification_preferences_saved:'Preferencias de notificación guardadas',ownership_transferred_now_admin:'Propiedad transferida. Ahora eres Administrador. Inicia sesión de nuevo.',photo_saved_locally:'Foto guardada localmente',please_choose_when_stream:'Elige cuándo debe ocurrir esta transmisión',please_enter_message:'Ingresa un mensaje',please_enter_message_2:'Ingresa un mensaje.',please_enter_response:'Ingresa una respuesta',please_enter_stream_title:'Ingresa un título para la transmisión',please_pick_time_future:'Elige una hora en el futuro',please_read_accept_terms:'Lee y acepta los Términos de Servicio y el descargo de responsabilidad para continuar.',please_select_jpg_png:'Selecciona una imagen JPG o PNG.',please_select_reason_provide:'Selecciona un motivo o proporciona detalles.',please_select_video_audio:'Selecciona un video, audio, .docx o .txt. PDF y el antiguo .doc no son compatibles.',please_select_image_file:'Selecciona un archivo de imagen',please_sign_report_content:'Inicia sesión para reportar este contenido.',please_sign_watch_live:'Inicia sesión para ver transmisiones en vivo',profile_photo_removed:'Foto de perfil eliminada',profile_photo_updated:'Foto de perfil actualizada',profile_updated_successfully:'¡Perfil actualizado correctamente!',remove_sermon_permanently:'¿Eliminar este sermón permanentemente?',report_resolved:'Reporte resuelto',report_submitted:'Reporte enviado',report_comment_review:'¿Reportar este comentario para revisión?',resolve_all_pending_reports:'¿Resolver todos los reportes pendientes?',response_sent_moderator:'Respuesta enviada al moderador',role_updated:'Rol actualizado a ',sermon_not_found:'Sermón no encontrado',sermon_updated_successfully:'Sermón actualizado correctamente',confirm_sign_out_q:'¿Cerrar sesión?',spacing_updated:'Espaciado actualizado',stream_deleted:'Transmisión eliminada',stream_ended:'Transmisión finalizada',stream_ended_great_job:'Transmisión finalizada. ¡Buen trabajo!',stream_scheduled:'Transmisión programada para ',live_stream_has_ended:'La transmisión en vivo ha finalizado',sermon_has_no_media:'Este sermón no tiene archivo multimedia para descargar.',thumbnail_must_be_under:'La miniatura debe pesar menos de 5MB.',title_cannot_be_empty:'El título no puede estar vacío',now_live:'¡Ya estás en vivo!',have_no_sermons_with:'No tienes sermones con archivos multimedia para descargar.',coming_soon:'Próximamente',coming_soon_sub:'Esta función llega pronto',live_coming_soon_desc:'La transmisión en vivo está en desarrollo y estará disponible en una futura actualización.',notify_when_ready:'Se le notificará cuando se lance esta función.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'Nuevos Sermones',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'Así está funcionando tu ministerio',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Gestiona tus preferencias de cuenta',manage_profile:'Gestiona tu perfil de pastor',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'Vista Previa',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Fuente y Pantalla',font_size:'Tamaño de Fuente',font_style:'Estilo de Fuente',line_spacing:'Espaciado',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'Nombre Visible',email:'Email',email_address:'Email Address',username:'Nombre de Usuario',church_name:'Church Name',denomination:'Denominación',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'Rol',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'Pequeño',medium:'Mediano',large:'Grande',normal:'Normal',compact:'Compacto',relaxed:'Relajado',default_style:'Por Defecto',serif:'Serif',mono:'Mono',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'Política DMCA',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Explorar',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'Cuando los pastores que sigues van en vivo',notif_upload:'Cuando los pastores que sigues suben',notif_msg:'Cuando recibes un mensaje',extra_large:'XL',admin_label:'ADMIN',delete_account:'Eliminar Mi Cuenta',sermon_title_label:'Título del Sermón *',content_type_label:'Tipo de Contenido *',transcript_label:'Transcripción / Texto Completo (opcional)',start_dictation:'🎙 Iniciar dictado',file_select_hint:'Haz clic para seleccionar un archivo de video, audio o documento',search_sermons_ph:'🔍 Buscar sermones...',search_users_ph:'🔍 Buscar usuarios...',search_pastors_ph:'🔍 Buscar pastores...',desc_ph:'Breve descripción de este sermón…',transcript_ph:'Pega la transcripción completa aquí, o usa el dictado de arriba…',support_ph:'Escribe tu mensaje al soporte de Trinitarian…',send_to_admin:'📨 Enviar Mensaje al Admin',status_approved:'✅ Aprobado',status_rejected:'❌ Rechazado',status_pending:'⏳ Pendiente',support_messages:'Mensajes de Soporte',reports_tab:'Reportes',flagged_tab:'Contenido Marcado',escalations_tab:'Escalaciones',no_sermons_upload:'Sin sermones aún. Haz clic en "Subir Sermón" para compartir tu primer mensaje.',cert_note:'Subir un certificado acelera la verificación pero no es obligatorio.',article:'Artículo',text:'Texto',video:'Vídeo',audio:'Audio',no_sermons_data:'Sin datos de sermones aún',create_account:'Crear Tu Cuenta',create_password:'Crear una Contraseña',failed_notifs:'Error al cargar notificaciones',all_pastors:'Todos los pastores verificados en Trinitarian',overview:'Resumen',my_sermons:'Mis Sermones',upload_sermon:'Subir Sermón',live_stream:'Transmisión en Vivo',settings:'Ajustes',profile:'Perfil',notifications:'Notificaciones',inbox:'Mensajes',pastors:'Pastores',users:'Usuarios',analytics:'Análisis',sign_out:'Cerrar Sesión',sign_in:'Iniciar Sesión',total_sermons:'Total Sermones',total_views:'Total Vistas',new_followers:'Nuevos Seguidores',followers:'Seguidores',views:'Vistas',recent_sermons:'Sermones Recientes',save:'Guardar',cancel:'Cancelar',publish_sermon:'Publicar Sermón',edit_sermon:'Editar Sermón',remove_sermon:'Eliminar Sermón',save_changes:'Guardar Cambios',send_message:'Enviar Mensaje',loading:'Cargando...',no_sermons:'No se encontraron sermones',no_notifs:'No hay notificaciones',no_messages:'No hay mensajes',mark_all_read:'Marcar todo como leído',language:'Idioma',privacy_policy:'Política de Privacidad',terms_of_service:'Términos de Servicio',go_live:'Ir en Vivo',my_profile:'Mi Perfil',change_password:'Cambiar Contraseña',security:'Seguridad',legal:'Legal',account:'Cuenta',nav_messages:'Mensajes'},
  de:{could_not_download_title:'"{title}" konnte nicht heruntergeladen werden. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',pro_status_granted:'Pro-Status gewährt',pro_status_revoked:'Pro-Status widerrufen',grant_label:'gewähren',revoke_label:'widerrufen',approve_pastor_confirm:'{name} als verifizierten Pastor genehmigen?',change_pro_status_confirm:'Sind Sie sicher, dass Sie den Pro-Status für diesen Nutzer {label} möchten?',pause_auto_approval_confirm:'Automatische Genehmigung für {name} pausieren? Dieser Antrag erfordert dann eine manuelle Überprüfung.',reject_application_confirm:'Antrag von {name} ablehnen?',download_sermons_confirm:'Dies wird {count} Predigtdatei(en) auf Ihr Gerät herunterladen, eine nach der anderen. Fortfahren?',account_deleted_successfully:'Konto erfolgreich gelöscht',account_deleted:'Konto gelöscht.',account_deleted_sorry_see:'Konto gelöscht. Schade, dass Sie gehen.',all_escalations_cleared:'Alle Eskalationen gelöscht',all_messages_cleared:'Alle Nachrichten gelöscht',all_messages_marked_as:'Alle Nachrichten als gelesen markiert',all_notifications_messages_cleared:'Alle Benachrichtigungen und Nachrichten gelöscht',all_notifications_cleared:'Alle Benachrichtigungen gelöscht',all_past_streams_deleted:'Alle vergangenen Übertragungen gelöscht',all_reports_cleared:'Alle Meldungen gelöscht',all_reports_resolved:'Alle Meldungen bearbeitet',already_going_live_please:'Bereits live — bitte warten.',archive_all_live_sermons:'Alle Live-Predigten archivieren?',archive_sermon:'Diese Predigt archivieren?',sure_want_sign_out:'Möchten Sie sich wirklich abmelden?',auto_approval_paused_now:'Automatische Genehmigung pausiert — erfordert nun manuelle Überprüfung',clear_all_escalations_cannot:'Alle Eskalationen löschen? Dies kann nicht rückgängig gemacht werden.',clear_all_messages_cannot:'Alle Nachrichten löschen? Dies kann nicht rückgängig gemacht werden.',clear_all_notifications_sent:'Alle Benachrichtigungen und gesendeten Nachrichten löschen? Dies kann nicht rückgängig gemacht werden.',clear_all_notifications_cannot:'Alle Benachrichtigungen löschen? Dies kann nicht rückgängig gemacht werden.',clear_all_reports_cannot:'Alle Meldungen löschen? Dies kann nicht rückgängig gemacht werden.',clear_all_support_messages:'Alle Support-Nachrichten löschen? Dies kann nicht rückgängig gemacht werden.',clear_entire_listening_watching:'Ihren gesamten Wiedergabeverlauf löschen? Dies kann nicht rückgängig gemacht werden.',confirmation_text_did_not:'Bestätigungstext stimmt nicht überein — Löschung abgebrochen.',confirmation_text_did_not_2:'Bestätigungstext stimmt nicht überein — nichts wurde gelöscht.',connection_error_please_try:'Verbindungsfehler, bitte erneut versuchen',connection_error_please_try_2:'Verbindungsfehler. Bitte erneut versuchen.',content_removed:'Inhalt entfernt',could_not_change_quality:'Qualität konnte nicht geändert werden',could_not_connect_stream:'Verbindung zur Übertragung fehlgeschlagen',could_not_delete_all:'Nicht alle Übertragungen konnten gelöscht werden',could_not_delete_stream:'Übertragung konnte nicht gelöscht werden',could_not_join_stream:'Beitritt zur Übertragung fehlgeschlagen: ',could_not_load_sermon:'Predigt konnte nicht geladen werden.',could_not_open_message:'Nachricht konnte nicht geöffnet werden',could_not_read_image:'Bilddatei konnte nicht gelesen werden',could_not_resend_please:'Erneutes Senden fehlgeschlagen. Bitte erneut versuchen.',could_not_submit_report:'Meldung konnte nicht gesendet werden. Bitte Verbindung prüfen und erneut versuchen.',could_not_switch_camera:'Kamera konnte nicht gewechselt werden — Ihr Gerät hat möglicherweise nur eine, oder eine Browser-Berechtigung blockiert dies.',could_not_update_photo:'Foto konnte nicht aktualisiert werden',delete_all_audit_log:'ALLE Einträge im Prüfprotokoll löschen? Dies kann nicht rückgängig gemacht werden.',delete_all_past_streams:'ALLE vergangenen Übertragungen aus Ihrem Verlauf löschen? Dies kann nicht rückgängig gemacht werden.',delete_failed_please_try:'Löschen fehlgeschlagen. Bitte erneut versuchen.',delete_audit_log_entry:'Diesen Prüfprotokolleintrag löschen?',delete_comment:'Diesen Kommentar löschen?',delete_stream_from_history:'Diese Übertragung aus Ihrem Verlauf löschen? Dies kann nicht rückgängig gemacht werden.',delete_stream_cannot_be:'Diese Übertragung löschen? Dies kann nicht rückgängig gemacht werden.',deletion_failed_email_support:'Löschen fehlgeschlagen. E-Mail an support@trinitarian.app senden, um die Löschung zu beantragen.',deletion_failed_please_email:'Löschen fehlgeschlagen. Bitte E-Mail an support@trinitarian.app senden, um die Kontolöschung zu beantragen.',download_failed:'Download fehlgeschlagen',edit_failed_please_try:'Bearbeitung fehlgeschlagen. Bitte erneut versuchen.',end_live_stream:'Diese Live-Übertragung beenden?',error_ending_stream:'Fehler beim Beenden der Übertragung',failed_approve_application:'Genehmigung des Antrags fehlgeschlagen',failed_archive_sermon:'Archivierung der Predigt fehlgeschlagen',failed_archive_sermons:'Archivierung der Predigten fehlgeschlagen',failed_clear_audit_log:'Löschen des Prüfprotokolls fehlgeschlagen',failed_clear_escalations:'Löschen der Eskalationen fehlgeschlagen',failed_clear_messages:'Löschen der Nachrichten fehlgeschlagen',failed_clear_notifications:'Löschen der Benachrichtigungen fehlgeschlagen',failed_clear_reports:'Löschen der Meldungen fehlgeschlagen',failed_delete:'Löschen fehlgeschlagen',failed_delete_all_sermons:'Löschen aller Predigten fehlgeschlagen.',failed_delete_comment:'Löschen des Kommentars fehlgeschlagen',failed_delete_comment_2:'Löschen des Kommentars fehlgeschlagen.',failed_delete_entry:'Löschen des Eintrags fehlgeschlagen',failed_delete_stream_live:'Löschen fehlgeschlagen. Live-Übertragungen müssen zuerst beendet werden.',failed_end_stream:'Beenden der Übertragung fehlgeschlagen',failed_end_stream_2:'Beenden der Übertragung fehlgeschlagen.',failed_go_live:'Start der Übertragung fehlgeschlagen',failed_mark_as_read:'Als gelesen markieren fehlgeschlagen',failed_open_sermon:'Öffnen der Predigt fehlgeschlagen',failed_pause_auto_approval:'Pausieren der automatischen Genehmigung fehlgeschlagen',failed_reject_application:'Ablehnung des Antrags fehlgeschlagen',failed_resolve_reports:'Bearbeitung der Meldungen fehlgeschlagen',failed_save_profile:'Speichern des Profils fehlgeschlagen',failed_send_message:'Senden der Nachricht fehlgeschlagen',failed_send_please_try:'Senden fehlgeschlagen. Bitte erneut versuchen.',failed_start_stream:'Start der Übertragung fehlgeschlagen: ',failed_submit_report:'Senden der Meldung fehlgeschlagen.',failed_update_pro_status:'Aktualisierung des Pro-Status fehlgeschlagen',failed_update_sermon:'Aktualisierung der Predigt fehlgeschlagen',failed_update_user_status:'Aktualisierung des Nutzerstatus fehlgeschlagen',failed_upload_photo:'Hochladen des Fotos fehlgeschlagen',font_size_updated:'Schriftgröße aktualisiert',font_style_updated:'Schriftstil aktualisiert',image_must_be_under:'Bild muss unter 5MB sein',language_updated:'Sprache aktualisiert',link_copied:'Link kopiert!',live_streaming_coming_soon:'Live-Übertragung bald verfügbar!',live_streaming_launching_soon:'Live-Übertragung startet bald. Bleiben Sie dran!',message_not_found:'Nachricht nicht gefunden',message_sent_successfully:'Nachricht erfolgreich gesendet',name_did_not_match:'Name stimmt nicht überein — Löschung abgebrochen',no_past_streams_delete:'Keine vergangenen Übertragungen zum Löschen',no_sermons_delete:'Keine Predigten zum Löschen.',not_currently_live:'Derzeit nicht live',notification_preference_saved:'Benachrichtigungseinstellung gespeichert',notification_preferences_saved:'Benachrichtigungseinstellungen gespeichert',ownership_transferred_now_admin:'Eigentum übertragen. Sie sind jetzt Administrator. Bitte erneut anmelden.',photo_saved_locally:'Foto lokal gespeichert',please_choose_when_stream:'Bitte wählen Sie, wann diese Übertragung stattfinden soll',please_enter_message:'Bitte geben Sie eine Nachricht ein',please_enter_message_2:'Bitte geben Sie eine Nachricht ein.',please_enter_response:'Bitte geben Sie eine Antwort ein',please_enter_stream_title:'Bitte geben Sie einen Übertragungstitel ein',please_pick_time_future:'Bitte wählen Sie eine Zeit in der Zukunft',please_read_accept_terms:'Bitte lesen und akzeptieren Sie die Nutzungsbedingungen und den Haftungsausschluss, um fortzufahren.',please_select_jpg_png:'Bitte wählen Sie ein JPG- oder PNG-Bild.',please_select_reason_provide:'Bitte wählen Sie einen Grund oder geben Sie Details an.',please_select_video_audio:'Bitte wählen Sie ein Video, Audio, .docx oder .txt. PDF und altes .doc werden nicht unterstützt.',please_select_image_file:'Bitte wählen Sie eine Bilddatei',please_sign_report_content:'Bitte melden Sie sich an, um diesen Inhalt zu melden.',please_sign_watch_live:'Bitte melden Sie sich an, um Live-Übertragungen anzusehen',profile_photo_removed:'Profilfoto entfernt',profile_photo_updated:'Profilfoto aktualisiert',profile_updated_successfully:'Profil erfolgreich aktualisiert!',remove_sermon_permanently:'Diese Predigt endgültig entfernen?',report_resolved:'Meldung bearbeitet',report_submitted:'Meldung gesendet',report_comment_review:'Diesen Kommentar zur Überprüfung melden?',resolve_all_pending_reports:'Alle ausstehenden Meldungen bearbeiten?',response_sent_moderator:'Antwort an Moderator gesendet',role_updated:'Rolle aktualisiert zu ',sermon_not_found:'Predigt nicht gefunden',sermon_updated_successfully:'Predigt erfolgreich aktualisiert',confirm_sign_out_q:'Abmelden?',spacing_updated:'Abstand aktualisiert',stream_deleted:'Übertragung gelöscht',stream_ended:'Übertragung beendet',stream_ended_great_job:'Übertragung beendet. Gut gemacht!',stream_scheduled:'Übertragung geplant für ',live_stream_has_ended:'Die Live-Übertragung ist beendet',sermon_has_no_media:'Diese Predigt hat keine Mediendatei zum Herunterladen.',thumbnail_must_be_under:'Miniaturbild muss unter 5MB sein.',title_cannot_be_empty:'Titel darf nicht leer sein',now_live:'Sie sind jetzt live!',have_no_sermons_with:'Sie haben keine Predigten mit Mediendateien zum Herunterladen.',coming_soon:'Demnächst',coming_soon_sub:'Diese Funktion kommt bald',live_coming_soon_desc:'Live-Streaming befindet sich in der Entwicklung und wird in einem zukünftigen Update verfügbar sein.',notify_when_ready:'Sie werden benachrichtigt, wenn diese Funktion gestartet wird.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'Neue Predigten',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'So entwickelt sich dein Dienst',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Kontopräferenzen verwalten',manage_profile:'Pastor-Profil verwalten',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'Vorschau',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Schrift & Anzeige',font_size:'Schriftgröße',font_style:'Schriftstil',line_spacing:'Zeilenabstand',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'Anzeigename',email:'Email',email_address:'Email Address',username:'Benutzername',church_name:'Church Name',denomination:'Konfession',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'Rolle',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'Klein',medium:'Mittel',large:'Groß',normal:'Normal',compact:'Kompakt',relaxed:'Entspannt',default_style:'Standard',serif:'Serif',mono:'Mono',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'DMCA-Richtlinie',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Entdecken',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'Wenn Pastoren denen du folgst live gehen',notif_upload:'Wenn Pastoren denen du folgst hochladen',notif_msg:'Wenn du eine Nachricht erhältst',extra_large:'XL',admin_label:'ADMIN',delete_account:'Mein Konto löschen',sermon_title_label:'Predigttitel *',content_type_label:'Inhaltstyp *',transcript_label:'Transkript / Volltext (optional)',start_dictation:'🎙 Diktat starten',file_select_hint:'Klicken zum Auswählen einer Video-, Audio- oder Dokumentdatei',search_sermons_ph:'🔍 Predigten suchen...',search_users_ph:'🔍 Benutzer suchen...',search_pastors_ph:'🔍 Pastoren suchen...',desc_ph:'Kurze Beschreibung dieser Predigt…',transcript_ph:'Fügen Sie hier das vollständige Transkript ein…',support_ph:'Ihre Nachricht an den Trinitarian-Support…',send_to_admin:'📨 Nachricht an Admin senden',status_approved:'✅ Genehmigt',status_rejected:'❌ Abgelehnt',status_pending:'⏳ Ausstehend',support_messages:'Support-Nachrichten',reports_tab:'Meldungen',flagged_tab:'Gemeldete Inhalte',escalations_tab:'Eskalationen',no_sermons_upload:'Noch keine Predigten. Klicke auf "Predigt hochladen" um deine erste Nachricht zu teilen.',cert_note:'Das Hochladen eines Zertifikats beschleunigt die Verifizierung, ist aber nicht erforderlich.',article:'Artikel',text:'Text',video:'Video',audio:'Audio',no_sermons_data:'Noch keine Predigtdaten',create_account:'Ihr Konto erstellen',create_password:'Passwort erstellen',failed_notifs:'Benachrichtigungen konnten nicht geladen werden',all_pastors:'Alle verifizierten Pastoren auf Trinitarian',overview:'Überblick',my_sermons:'Meine Predigten',upload_sermon:'Predigt hochladen',live_stream:'Live-Übertragung',settings:'Einstellungen',profile:'Profil',notifications:'Benachrichtigungen',inbox:'Nachrichten',pastors:'Pastoren',users:'Benutzer',analytics:'Analysen',sign_out:'Abmelden',sign_in:'Anmelden',total_sermons:'Predigten gesamt',total_views:'Aufrufe gesamt',new_followers:'Neue Follower',followers:'Follower',views:'Aufrufe',recent_sermons:'Neueste Predigten',save:'Speichern',cancel:'Abbrechen',publish_sermon:'Predigt veröffentlichen',edit_sermon:'Predigt bearbeiten',remove_sermon:'Predigt entfernen',save_changes:'Änderungen speichern',send_message:'Nachricht senden',loading:'Wird geladen...',no_sermons:'Keine Predigten gefunden',no_notifs:'Keine Benachrichtigungen',no_messages:'Keine Nachrichten',mark_all_read:'Alle als gelesen markieren',language:'Sprache',privacy_policy:'Datenschutzrichtlinie',terms_of_service:'Nutzungsbedingungen',go_live:'Live gehen',my_profile:'Mein Profil',change_password:'Passwort ändern',security:'Sicherheit',legal:'Rechtliches',account:'Konto',nav_messages:'Nachrichten'},
  it:{could_not_download_title:'Impossibile scaricare "{title}". Controlla la connessione e riprova.',pro_status_granted:'Stato Pro concesso',pro_status_revoked:'Stato Pro revocato',grant_label:'concedere',revoke_label:'revocare',approve_pastor_confirm:'Approvare {name} come pastore verificato?',change_pro_status_confirm:'Sei sicuro di voler {label} lo stato Pro per questo utente?',pause_auto_approval_confirm:'Sospendere l\'approvazione automatica per {name}? Questa candidatura richiederà quindi una revisione manuale.',reject_application_confirm:'Rifiutare la candidatura di {name}?',download_sermons_confirm:'Questo scaricherà {count} file di sermone sul tuo dispositivo, uno alla volta. Continuare?',account_deleted_successfully:'Account eliminato con successo',account_deleted:'Account eliminato.',account_deleted_sorry_see:'Account eliminato. Ci dispiace vederti andare via.',all_escalations_cleared:'Tutte le escalation cancellate',all_messages_cleared:'Tutti i messaggi cancellati',all_messages_marked_as:'Tutti i messaggi contrassegnati come letti',all_notifications_messages_cleared:'Tutte le notifiche e i messaggi cancellati',all_notifications_cleared:'Tutte le notifiche cancellate',all_past_streams_deleted:'Tutte le dirette passate eliminate',all_reports_cleared:'Tutte le segnalazioni cancellate',all_reports_resolved:'Tutte le segnalazioni risolte',already_going_live_please:'Già in diretta — attendere prego.',archive_all_live_sermons:'Archiviare tutti i sermoni in diretta?',archive_sermon:'Archiviare questo sermone?',sure_want_sign_out:'Sei sicuro di voler uscire?',auto_approval_paused_now:'Approvazione automatica sospesa — ora richiede revisione manuale',clear_all_escalations_cannot:'Cancellare tutte le escalation? Questa azione non può essere annullata.',clear_all_messages_cannot:'Cancellare tutti i messaggi? Questa azione non può essere annullata.',clear_all_notifications_sent:'Cancellare tutte le notifiche e i messaggi inviati? Questa azione non può essere annullata.',clear_all_notifications_cannot:'Cancellare tutte le notifiche? Questa azione non può essere annullata.',clear_all_reports_cannot:'Cancellare tutte le segnalazioni? Questa azione non può essere annullata.',clear_all_support_messages:'Cancellare tutti i messaggi di supporto? Questa azione non può essere annullata.',clear_entire_listening_watching:'Cancellare l\'intera cronologia di ascolto/visualizzazione? Questa azione non può essere annullata.',confirmation_text_did_not:'Il testo di conferma non corrisponde — eliminazione annullata.',confirmation_text_did_not_2:'Il testo di conferma non corrisponde — nulla è stato eliminato.',connection_error_please_try:'Errore di connessione, riprova',connection_error_please_try_2:'Errore di connessione. Riprova.',content_removed:'Contenuto rimosso',could_not_change_quality:'Impossibile cambiare la qualità',could_not_connect_stream:'Impossibile connettersi alla diretta',could_not_delete_all:'Impossibile eliminare tutte le dirette',could_not_delete_stream:'Impossibile eliminare la diretta',could_not_join_stream:'Impossibile unirsi alla diretta: ',could_not_load_sermon:'Impossibile caricare il sermone.',could_not_open_message:'Impossibile aprire il messaggio',could_not_read_image:'Impossibile leggere il file immagine',could_not_resend_please:'Impossibile reinviare. Riprova.',could_not_submit_report:'Impossibile inviare la segnalazione. Controlla la connessione e riprova.',could_not_switch_camera:'Impossibile cambiare fotocamera — il tuo dispositivo potrebbe averne solo una, oppure un permesso del browser lo sta bloccando.',could_not_update_photo:'Impossibile aggiornare la foto',delete_all_audit_log:'Eliminare TUTTE le voci del registro di controllo? Questa azione non può essere annullata.',delete_all_past_streams:'Eliminare TUTTE le dirette passate dalla cronologia? Questa azione non può essere annullata.',delete_failed_please_try:'Eliminazione fallita. Riprova.',delete_audit_log_entry:'Eliminare questa voce del registro di controllo?',delete_comment:'Eliminare questo commento?',delete_stream_from_history:'Eliminare questa diretta dalla cronologia? Questa azione non può essere annullata.',delete_stream_cannot_be:'Eliminare questa diretta? Questa azione non può essere annullata.',deletion_failed_email_support:'Eliminazione fallita. Invia un\'email a support@trinitarian.app per richiedere l\'eliminazione.',deletion_failed_please_email:'Eliminazione fallita. Invia un\'email a support@trinitarian.app per richiedere l\'eliminazione dell\'account.',download_failed:'Download fallito',edit_failed_please_try:'Modifica fallita. Riprova.',end_live_stream:'Terminare questa diretta?',error_ending_stream:'Errore durante la chiusura della diretta',failed_approve_application:'Approvazione della candidatura fallita',failed_archive_sermon:'Archiviazione del sermone fallita',failed_archive_sermons:'Archiviazione dei sermoni fallita',failed_clear_audit_log:'Cancellazione del registro di controllo fallita',failed_clear_escalations:'Cancellazione delle escalation fallita',failed_clear_messages:'Cancellazione dei messaggi fallita',failed_clear_notifications:'Cancellazione delle notifiche fallita',failed_clear_reports:'Cancellazione delle segnalazioni fallita',failed_delete:'Eliminazione fallita',failed_delete_all_sermons:'Eliminazione di tutti i sermoni fallita.',failed_delete_comment:'Eliminazione del commento fallita',failed_delete_comment_2:'Eliminazione del commento fallita.',failed_delete_entry:'Eliminazione della voce fallita',failed_delete_stream_live:'Eliminazione fallita. Le dirette devono prima essere terminate.',failed_end_stream:'Chiusura della diretta fallita',failed_end_stream_2:'Chiusura della diretta fallita.',failed_go_live:'Avvio della diretta fallito',failed_mark_as_read:'Contrassegno come letto fallito',failed_open_sermon:'Apertura del sermone fallita',failed_pause_auto_approval:'Sospensione dell\'approvazione automatica fallita',failed_reject_application:'Rifiuto della candidatura fallito',failed_resolve_reports:'Risoluzione delle segnalazioni fallita',failed_save_profile:'Salvataggio del profilo fallito',failed_send_message:'Invio del messaggio fallito',failed_send_please_try:'Invio fallito. Riprova.',failed_start_stream:'Avvio della diretta fallito: ',failed_submit_report:'Invio della segnalazione fallito.',failed_update_pro_status:'Aggiornamento dello stato Pro fallito',failed_update_sermon:'Aggiornamento del sermone fallito',failed_update_user_status:'Aggiornamento dello stato utente fallito',failed_upload_photo:'Caricamento della foto fallito',font_size_updated:'Dimensione del carattere aggiornata',font_style_updated:'Stile del carattere aggiornato',image_must_be_under:'L\'immagine deve essere inferiore a 5MB',language_updated:'Lingua aggiornata',link_copied:'Link copiato!',live_streaming_coming_soon:'Diretta streaming in arrivo!',live_streaming_launching_soon:'La diretta streaming arriva presto. Resta sintonizzato!',message_not_found:'Messaggio non trovato',message_sent_successfully:'Messaggio inviato con successo',name_did_not_match:'Il nome non corrisponde — eliminazione annullata',no_past_streams_delete:'Nessuna diretta passata da eliminare',no_sermons_delete:'Nessun sermone da eliminare.',not_currently_live:'Non attualmente in diretta',notification_preference_saved:'Preferenza di notifica salvata',notification_preferences_saved:'Preferenze di notifica salvate',ownership_transferred_now_admin:'Proprietà trasferita. Ora sei Amministratore. Accedi di nuovo.',photo_saved_locally:'Foto salvata localmente',please_choose_when_stream:'Scegli quando dovrà avvenire questa diretta',please_enter_message:'Inserisci un messaggio',please_enter_message_2:'Inserisci un messaggio.',please_enter_response:'Inserisci una risposta',please_enter_stream_title:'Inserisci un titolo per la diretta',please_pick_time_future:'Scegli un orario futuro',please_read_accept_terms:'Leggi e accetta i Termini di Servizio e il disclaimer per continuare.',please_select_jpg_png:'Seleziona un\'immagine JPG o PNG.',please_select_reason_provide:'Seleziona un motivo o fornisci dettagli.',please_select_video_audio:'Seleziona un video, audio, .docx o .txt. PDF e il vecchio .doc non sono supportati.',please_select_image_file:'Seleziona un file immagine',please_sign_report_content:'Accedi per segnalare questo contenuto.',please_sign_watch_live:'Accedi per guardare le dirette streaming',profile_photo_removed:'Foto profilo rimossa',profile_photo_updated:'Foto profilo aggiornata',profile_updated_successfully:'Profilo aggiornato con successo!',remove_sermon_permanently:'Rimuovere definitivamente questo sermone?',report_resolved:'Segnalazione risolta',report_submitted:'Segnalazione inviata',report_comment_review:'Segnalare questo commento per la revisione?',resolve_all_pending_reports:'Risolvere tutte le segnalazioni in sospeso?',response_sent_moderator:'Risposta inviata al moderatore',role_updated:'Ruolo aggiornato a ',sermon_not_found:'Sermone non trovato',sermon_updated_successfully:'Sermone aggiornato con successo',confirm_sign_out_q:'Uscire?',spacing_updated:'Spaziatura aggiornata',stream_deleted:'Diretta eliminata',stream_ended:'Diretta terminata',stream_ended_great_job:'Diretta terminata. Ottimo lavoro!',stream_scheduled:'Diretta programmata per ',live_stream_has_ended:'La diretta è terminata',sermon_has_no_media:'Questo sermone non ha un file multimediale da scaricare.',thumbnail_must_be_under:'La miniatura deve essere inferiore a 5MB.',title_cannot_be_empty:'Il titolo non può essere vuoto',now_live:'Sei ora in diretta!',have_no_sermons_with:'Non hai sermoni con file multimediali da scaricare.',coming_soon:'Prossimamente',coming_soon_sub:'Questa funzione è in arrivo',live_coming_soon_desc:'Lo streaming live è in fase di sviluppo e sarà disponibile in un futuro aggiornamento.',notify_when_ready:'Verrai notificato quando questa funzione verrà lanciata.',extra_large:'XL',admin_label:'ADMIN',delete_account:'Elimina il Mio Account',sermon_title_label:'Titolo del Sermone *',content_type_label:'Tipo di Contenuto *',transcript_label:'Trascrizione / Testo Completo (opzionale)',start_dictation:'🎙 Avvia dettatura',file_select_hint:'Clicca per selezionare un file video, audio o documento',search_sermons_ph:'🔍 Cerca sermoni...',search_users_ph:'🔍 Cerca utenti...',search_pastors_ph:'🔍 Cerca pastori...',desc_ph:'Breve descrizione di questo sermone…',transcript_ph:'Incolla qui la trascrizione completa…',support_ph:'Scrivi il tuo messaggio al supporto Trinitarian…',send_to_admin:'📨 Invia Messaggio all\'Admin',status_approved:'✅ Approvato',status_rejected:'❌ Rifiutato',status_pending:'⏳ In attesa',support_messages:'Messaggi di Supporto',reports_tab:'Segnalazioni',flagged_tab:'Contenuto Segnalato',escalations_tab:'Escalation',no_sermons_upload:'Nessun sermone ancora. Clicca "Carica Sermone" per condividere il tuo primo messaggio.',cert_note:'Caricare un certificato velocizza la verifica ma non è obbligatorio.',article:'Articolo',text:'Testo',video:'Video',audio:'Audio',no_sermons_data:'Nessun dato sermone ancora',create_account:'Crea il Tuo Account',create_password:'Crea una Password',failed_notifs:'Impossibile caricare le notifiche',all_pastors:'Tutti i pastori verificati su Trinitarian',overview:'Panoramica',my_sermons:'I Miei Sermoni',upload_sermon:'Carica Sermone',live_stream:'Diretta',settings:'Impostazioni',profile:'Profilo',notifications:'Notifiche',explore:'Esplora',nav_messages:'Messaggi',explore:'Esplora',inbox:'Messaggi',pastors:'Pastori',users:'Utenti',analytics:'Analisi',sign_out:'Esci',sign_in:'Accedi',total_sermons:'Totale Sermoni',total_views:'Totale Visualizzazioni',new_followers:'Nuovi Follower',followers:'Follower',views:'Visualizzazioni',recent_sermons:'Sermoni Recenti',save:'Salva',cancel:'Annulla',publish_sermon:'Pubblica Sermone',edit_sermon:'Modifica Sermone',remove_sermon:'Rimuovi Sermone',save_changes:'Salva Modifiche',send_message:'Invia Messaggio',loading:'Caricamento...',no_sermons:'Nessun sermone trovato',no_notifs:'Nessuna notifica',no_messages:'Nessun messaggio',mark_all_read:'Segna tutto come letto',language:'Lingua',privacy_policy:'Informativa sulla Privacy',terms_of_service:'Termini di Servizio',go_live:'Vai in Diretta',my_profile:'Il Mio Profilo',change_password:'Cambia Password',security:'Sicurezza',legal:'Note legali',account:'Account'},
};
let pdCurrentLang=localStorage.getItem('trinitarian_pd_lang')||'en';

function pdApplyTranslations(lang){
  localStorage.setItem('trinitarian_pd_lang', lang);
  pdCurrentLang=lang;
  localStorage.setItem('trinitarian_pd_lang',lang);
  const tt=PD_TRANS[lang]||PD_TRANS.en;
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    const key=el.getAttribute('data-i18n');
    if(tt[key]){el.textContent=tt[key];}
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
    const key=el.getAttribute('data-i18n-ph');
    if(tt[key]){el.placeholder=tt[key];}
  });
  try{document.documentElement.dir=(lang==='ar')?'rtl':'ltr';}catch(e){}
  const sel=document.getElementById('pd-lang-select');
  if(sel)sel.value=lang;
  // Sync settings language buttons
  document.querySelectorAll('.lang-setting-btn').forEach(function(b){
    const btnLang=b.getAttribute('onclick');
    if(btnLang&&btnLang.includes("'"+lang+"'")){
      b.style.background='var(--gold-light)';b.style.borderColor='var(--gold-border)';
      try{b.querySelector('div:last-child').style.color='var(--gold)';}catch(e){}
    } else {
      b.style.background='var(--navy2)';b.style.borderColor='var(--border)';
      try{b.querySelector('div:last-child').style.color='var(--text-muted)';}catch(e){}
    }
  });
}

// Lookup helper for dynamic strings (alerts, confirms, toasts) that the
// data-i18n system doesn't reach, since that only processes static DOM
// elements present at page load.
function pdTr(key){
  const tt=(PD_TRANS[pdCurrentLang]||PD_TRANS.en);
  return tt[key]||PD_TRANS.en[key]||key;
}

// Same lookup, but substitutes {placeholder} tokens with runtime values -
// e.g. pdTrF('approve_pastor_confirm', {name: 'John'}) replaces {name}.
function pdTrF(key, params){
  let str = pdTr(key);
  for (const k in params) {
    str = str.split('{'+k+'}').join(params[k]);
  }
  return str;
}

async function pdLoadProSection(){
  const el = document.getElementById('pd-pro-section');
  if (!el) return;
  try {
    const data = await api('/api/billing/status');
    if (data.is_pro) {
      const renewText = data.current_period_end ? ('Renews ' + new Date(data.current_period_end).toLocaleDateString()) : '';
      el.innerHTML = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><span style="color:var(--gold);font-size:15px;font-weight:700;">👑 You are Pro</span></div>' +
        (renewText ? '<div style="color:var(--text-muted);font-size:12px;margin-bottom:14px;">' + renewText + '</div>' : '') +
        '<button onclick="pdOpenBillingPortal()" style="background:transparent;border:1px solid var(--gold-border);color:var(--gold);padding:10px 18px;border-radius:10px;font-size:14px;cursor:pointer;width:100%;">Manage Subscription</button>';
    } else {
      el.innerHTML = '<div style="color:var(--text);font-size:14px;margin-bottom:6px;">Upgrade to unlock Pro features.</div>' +
        '<div style="color:var(--text-muted);font-size:12px;margin-bottom:14px;">Ad-free experience and more.</div>' +
        '<button onclick="pdStartCheckout()" style="background:var(--gold);border:none;color:var(--navy);font-weight:700;padding:10px 18px;border-radius:10px;font-size:14px;cursor:pointer;width:100%;">Upgrade to Pro</button>';
    }
  } catch (e) {
    el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Could not load billing status.</div>';
  }
}

async function pdStartCheckout(){
  try {
    const data = await api('/api/billing/create-checkout-session', 'POST');
    if (data.url) window.location.href = data.url;
  } catch (e) {
    showToast(e.message || 'Could not start checkout', 'error');
  }
}

async function pdOpenBillingPortal(){
  try {
    const data = await api('/api/billing/create-portal-session', 'POST');
    if (data.url) window.location.href = data.url;
  } catch (e) {
    showToast(e.message || 'Could not open billing portal', 'error');
  }
}


const API = 'https://trinitarian-backend-production.up.railway.app';
let token = localStorage.getItem('pastor_token');
let user = JSON.parse(localStorage.getItem('pastor_user') || 'null');
let badgePollInterval = null;
let uploadType = 'video';

// ── Web push registration ──
// Reuses the same /sw.js and VAPID key as the public listener site - a
// service worker registered at the root path covers the whole origin
// (including /pastor/*), so this registers the same single service worker
// rather than a separate one.
const VAPID_PUBLIC_KEY = 'BIIKJwa4T53dVpnHLi4qGizEUgAcL9VpLuu9LbKKFKQ1d3ASmiU1E1TdXOPU_COwcNGlmfBDDLGhUurWWYjb2RE';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function registerPastorPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    if (!token) return;
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await fetch(API + '/api/users/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ subscription: sub.toJSON(), type: 'web' }),
    });
  } catch (e) { console.log('Push registration:', e.message); }
}
let uploadLang = 'en';

// ── Logo (embedded) ──
const LOGO = '/index.html';


// ── API Helper ──
async function api(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API + endpoint, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401 && token) {
      // Only treat as session expiry if we were already authenticated
      token = null; user = null;
      localStorage.removeItem('pastor_token');
      localStorage.removeItem('pastor_user');
      showScreen('login');
      throw new Error('Session expired. Please sign in again.');
    }
    throw new Error(data.error || 'Request failed (' + res.status + ')');
  }
  return data;
}

// ── Screen Management ──
// Clears the given field ids immediately, then again after short delays —
// Chrome's saved-password autofill often injects its value AFTER page
// scripts finish running, so a single immediate clear isn't always enough.
// Defensive backup on top of removing the saved credential from the
// browser's own password manager, which is the real fix.
function deferredClear(ids) {
  const doClear = function() {
    ids.forEach(function(id) {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  };
  doClear();
  setTimeout(doClear, 150);
  setTimeout(doClear, 400);
  setTimeout(doClear, 900);
}

function showScreen(name) {
  document.querySelectorAll('.auth-wrap, .dash-wrap').forEach(el => {
    el.style.display = 'none';
    el.classList.remove('active');
  });
  const el = document.getElementById('screen-' + name);
  if (el) {
    el.style.display = 'flex';
    if (el.classList.contains('dash-wrap')) el.classList.add('active');
  }
  // Explicitly clear the username and password fields every time the
  // registration screen opens — some browsers ignore autocomplete hints and
  // kept persistently offering/filling previously-entered values here.
  if (name === 'register') {
    deferredClear(['reg-username', 'reg-password', 'reg-confirm']);
  }
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.getAttribute('onclick') && n.getAttribute('onclick').includes(name)) n.classList.add('active');
  });
  if (name === 'overview') loadOverview();
  if (name === 'changepass') {
    // Same fix as registration — clear stale autofilled password values
    // every time this page opens, including delayed re-clears.
    deferredClear(['cp-current', 'cp-new', 'cp-confirm']);
  }
  if (name === 'live') initLivePage();
  if (name === 'sermons') loadSermons();
  if (name === 'analytics') loadAnalytics(7, document.querySelector('.period-tab.active'));
  if (name === 'notifications') loadNotifications();
  if (name === 'admin' && ['admin','moderator','owner'].includes(user?.role)) loadAdmin();
  if (name === 'profile') loadProfile();
  if (name === 'inbox') loadInbox();
  if (name === 'explore') loadExplore();
  if (name === 'users') loadUsers();
  if (name === 'pastors') loadPastorsList();
  if (name === 'audit') loadAuditLog();
  // Apply translations after all content loads
  setTimeout(() => pdApplyTranslations(pdCurrentLang), 400);
  if (name === 'settings') {
    loadNotifPrefs();
    pdLoadProSection();
    if(document.getElementById('set-name')) document.getElementById('set-name').textContent = user?.display_name || '—';
    if(document.getElementById('set-username')) document.getElementById('set-username').textContent = user?.username || '—';
    if(document.getElementById('set-email')) document.getElementById('set-email').textContent = user?.email || '—';
    if(document.getElementById('set-denom')) document.getElementById('set-denom').textContent = user?.denomination || localStorage.getItem('pastor_denom') || '—';
    if(document.getElementById('set-role')){const _tt=PD_TRANS[pdCurrentLang]||PD_TRANS.en;const _roleLabels={owner:'OWNER',admin:(_tt.admin_label||'ADMIN'),moderator:'MODERATOR',pastor:(_tt.pastor_label||'PASTOR'),listener:'LISTENER'};document.getElementById('set-role').textContent=_roleLabels[user?.role]||(_tt.pastor_label||'PASTOR');}
    loadFontSettings();
    loadNotifPrefs();
  }

  setTimeout(function(){pdApplyTranslations(pdCurrentLang);},200);}

function showAlert(id, msg, type = 'error', isHtml = false) {
  const el = document.getElementById(id);
  if (el) {
    if (isHtml) { el.innerHTML = msg; } else { el.textContent = msg; }
    el.className = `alert alert-${type} show`;
    el.style.display = 'block';
  }
}
function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) { el.style.display = 'none'; el.textContent = ''; }
}

// ── Auth ──
async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return showAlert('login-error', 'Please enter email and password');
  hideAlert('login-error');
  document.getElementById('login-btn').disabled = true;
  try {
    const data = await api('/api/auth/login', 'POST', { email: email.toLowerCase(), password });
    if (data.token) {
      // Fetch fresh role from server BEFORE storing anything — previously
      // pastor_token/pastor_user were stored immediately, before the role
      // check below ran. If anything else ever restored a session from
      // localStorage without re-checking role, a listener-role account
      // could have slipped through without this validation running again.
      let freshUser = data.user;
      try {
        const meRes = await fetch(API + '/api/auth/me', { headers: { 'Authorization': 'Bearer ' + data.token } });
        const fresh = await meRes.json();
        if (fresh?.id) {
          const roleOrder = {listener:0,pastor:1,moderator:2,admin:3,owner:4};
          freshUser = (roleOrder[fresh.role]||0) >= (roleOrder[data.user?.role]||0) ? fresh : { ...fresh, role: data.user.role };
        }
      } catch(e) {}
      const role = freshUser?.role || 'listener';
      if (role === 'listener') {
        showAlert('login-error',
          'Your account is awaiting pastor verification. If you have not applied yet, <a onclick="showScreen(\'apply\')" style="color:#D4AF37;cursor:pointer;text-decoration:underline;">click here to apply</a>. Otherwise please wait for admin approval.',
          false, true);
        return;
      }
      if (role === 'pending') {
        showAlert('login-error', '⏳ Your pastor application is under review. You will be notified once approved.', false, true);
        return;
      }
      if (!['pastor','admin','moderator','owner'].includes(role)) {
        showAlert('login-error', 'Your account does not have pastor access.');
        return;
      }
      token = data.token;
      user = freshUser;
      localStorage.setItem('pastor_token', token);
      localStorage.setItem('pastor_user', JSON.stringify(user));
      if (window.location.search) window.history.replaceState({}, '', window.location.pathname);
      initDashboard();
    } else {
      showAlert('login-error', data.error || 'Invalid credentials');
    }
  } catch(e) {
    const msg = e?.message || '';
    if (msg && msg !== 'Failed to fetch' && !msg.includes('NetworkError') && !msg.includes('network')) {
      showAlert('login-error', msg);
    } else {
      showAlert('login-error', 'Connection failed. Please try again.');
    }
  }
  document.getElementById('login-btn').disabled = false;
}

async function handleRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  if (!name || !email || !username || !password) return showAlert('register-error', 'Please fill in all fields');
  if (password.length < 8) return showAlert('register-error', 'Password must be at least 8 characters');
  if (password !== confirm) return showAlert('register-error', 'Passwords do not match');
  hideAlert('register-error');
  try {
    const data = await api('/api/auth/register', 'POST', { display_name: name, email: email.toLowerCase(), username: username.toLowerCase(), password });
    if (data.token) {
      token = data.token; user = data.user;
      localStorage.setItem('pastor_token', token);
      localStorage.setItem('pastor_user', JSON.stringify(user));
      // New accounts are listeners - send to apply screen
      if (user.role === 'listener' || user.role === 'pending') {
        showAlert('register-success', '✅ Account created! Now complete your pastor application below.', 'success');
        showScreen('apply');
      } else {
        initDashboard();
      }
    } else {
      showAlert('register-error', data.error || (data.errors && data.errors.map(e=>e.msg).join(', ')) || 'Registration failed');
    }
  } catch(e) { showAlert('register-error', 'Connection failed'); }
}

function showFMsg(msg, type) {
  const el = document.getElementById('ll-fmsg');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.style.padding = '12px 16px';
  el.style.borderRadius = '10px';
  el.style.fontSize = '13px';
  el.style.marginBottom = '16px';
  if (type === 'success') {
    el.style.background = 'rgba(64,201,106,0.1)';
    el.style.border = '1px solid rgba(64,201,106,0.3)';
    el.style.color = '#40c96a';
  } else {
    el.style.background = 'rgba(224,85,85,0.1)';
    el.style.border = '1px solid rgba(224,85,85,0.3)';
    el.style.color = '#e05555';
  }
}

async function handleForgot() {
  const email = (document.getElementById('ll-femail') || document.getElementById('forgot-email'))?.value.trim();
  if (!email) { showFMsg('Please enter your email address.', 'error'); return; }
  const btn = document.querySelector('#screen-forgot .btn-gold');
  if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }
  try {
    await fetch(API + '/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    showFMsg('✅ Reset link sent! Check your inbox and spam folder.', 'success');
    if (btn) { btn.textContent = 'Send Reset Link'; btn.disabled = false; }
  } catch(e) {
    showFMsg('Request failed. Please check your connection.', 'error');
    if (btn) { btn.textContent = 'Send Reset Link'; btn.disabled = false; }
  }
}

function prefillApply() {
  if (!user) return;
  const nameEl = document.getElementById('apply-name');
  const emailEl = document.getElementById('apply-email');
  const cityEl = document.getElementById('apply-city');
  if (nameEl && !nameEl.value) nameEl.value = user.display_name || '';
  if (emailEl && !emailEl.value) emailEl.value = user.email || '';
}

function updateCertLabel(input) {
  const label = document.getElementById('cert-label');
  if (input.files && input.files[0]) {
    label.innerHTML = '✅ ' + input.files[0].name + 
      ' <span onclick="removeCert(event)" style="color:#e05555;cursor:pointer;margin-left:8px;font-size:12px;">✕ Remove</span>';
    label.style.color = '#40c96a';
  }
}

function removeCert(e) {
  e.stopPropagation();
  const input = document.getElementById('cert-file');
  input.value = '';
  const label = document.getElementById('cert-label');
  label.innerHTML = '📎 Click to attach document';
  label.style.color = 'var(--text-muted)';
}

async function handleApply() {
  const denom = document.getElementById('apply-denom').value;
  const denomOther = document.getElementById('apply-denom-other').value.trim();
  const finalDenom = denom === 'Other' ? denomOther : denom;
  const statement = document.getElementById('apply-statement').value.trim();
  if (!document.getElementById('apply-declaration')?.checked) {
    showAlert('apply-error', 'Please confirm the declaration before submitting.');
    return;
  }
  const wordCount = statement.split(/\s+/).filter(Boolean).length;
  if (wordCount < 100) return showAlert('apply-error', `Personal statement must be at least 100 words. Currently ${wordCount} words.`);
  if (!finalDenom) return showAlert('apply-error', 'Please select or enter your denomination');
  // Use pastor token, or fall back to listener token
  const activeToken = token;
  if (!activeToken) {
    showAlert('apply-error', 'Please sign in here on the Pastor Dashboard first before applying.');
    return;
  }
  try {
    const certFile = document.getElementById('cert-file')?.files?.[0];
      let res;
      if (certFile) {
        const fd = new FormData();
        fd.append('full_name', document.getElementById('apply-name').value.trim());
        fd.append('church_name', document.getElementById('apply-church').value.trim());
        fd.append('denomination', finalDenom);
        fd.append('country', document.getElementById('apply-country').value.trim());
        fd.append('city', document.getElementById('apply-city').value.trim());
        fd.append('ordination_body', (document.getElementById('apply-ordination')?.value || '').trim());
        fd.append('years_in_ministry', parseInt(document.getElementById('apply-years')?.value) || '');
        fd.append('statement', statement);
        fd.append('phone', phone);
        fd.append('congregation_size', document.getElementById('apply-congregation')?.value||'');
        fd.append('certificate', certFile);
        res = await fetch(API + '/api/pastors/apply', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + activeToken },
          body: fd
        });
      } else {
        res = await fetch(API + '/api/pastors/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + activeToken },
          body: JSON.stringify({
            full_name: document.getElementById('apply-name').value.trim(),
            church_name: document.getElementById('apply-church').value.trim(),
            denomination: finalDenom,
            country: document.getElementById('apply-country').value.trim(),
            city: document.getElementById('apply-city').value.trim(),
            ordination_body: (document.getElementById('apply-ordination')?.value || '').trim(),
            years_in_ministry: parseInt(document.getElementById('apply-years')?.value) || null,
            phone,
            congregation_size: document.getElementById('apply-congregation')?.value||null,
            statement
          })
        });
      }
    const data = await res.json();
    if (data.id || data.status || data.message) {
      if (data.auto_verified) {
        // Auto-verified - reload user and go to dashboard
        try {
          const fresh = await api('/api/auth/me');
          if (fresh?.id) { user = fresh; localStorage.setItem('pastor_user', JSON.stringify(user)); }
        } catch(e) {}
        showAlert('apply-success', '🎉 Congratulations! You are now a Verified Pastor. Loading your dashboard...', 'success');
        setTimeout(() => initDashboard(), 1500);
      } else {
        showAlert('apply-success',
          '✅ Application submitted! We will review it within 1–2 business days and notify you by email at the address you registered with. Once approved, simply sign in here to access your Pastor Dashboard.',
          'success');
      }
    } else {
      showAlert('apply-error', data.error || 'Submission failed. Please ensure you are signed in.');
    }
  } catch(e) { showAlert('apply-error', 'Submission failed. Please check your connection.'); }
}

async function deletePastorAccount(){
  const typed=prompt('This will permanently delete your account and all your data.\n\nType DELETE to confirm:');
  if(typed!=='DELETE'){ if(typed!==null) alert(pdTr('confirmation_text_did_not')); return; }
  try{
    await api('/api/users/me','DELETE');
    token=null; user=null;
    localStorage.removeItem('pastor_token');
    localStorage.removeItem('pastor_user');
    alert(pdTr('account_deleted_sorry_see'));
    window.location.href='/';
  }catch(e){ alert(pdTr('deletion_failed_please_email')); }
}

async function handleLogout() {
  if (!confirm(pdTr('sure_want_sign_out'))) return;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub && token) {
        await fetch(API + '/api/users/push-subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
    }
  } catch (e) {}
  token = null; user = null;
  if (badgePollInterval) { clearInterval(badgePollInterval); badgePollInterval = null; }
  localStorage.removeItem('pastor_token');
  localStorage.removeItem('pastor_user');
  showScreen('login');
}

// ── Dashboard Init ──
function initDashboard() {
  showScreen('dashboard');
  registerPastorPush();
  // Apply saved language immediately
  const savedLang = localStorage.getItem('trinitarian_pd_lang') || 'en';
  if (savedLang !== 'en') pdApplyTranslations(savedLang);
  // Show notification badge on load
  updateBadges();
  // Poll every 60s
  if (badgePollInterval) clearInterval(badgePollInterval);
  badgePollInterval = setInterval(updateBadges, 60000);
  document.getElementById('sidebar-name').textContent = user?.display_name || 'Pastor';
  const savedAvatar=localStorage.getItem('pastor_avatar');
  if(savedAvatar){const av=document.getElementById('profile-avatar');if(av){av.style.backgroundImage='url('+savedAvatar+')';av.style.backgroundSize='cover';av.style.backgroundPosition='center';av.textContent='';const rb=document.getElementById('remove-photo-btn');if(rb)rb.style.display='block';}}
  document.getElementById('sidebar-church').textContent = user?.role?.toUpperCase() || 'PASTOR';
  document.getElementById('dash-role').textContent = (user?.role || 'pastor').toUpperCase();
  document.getElementById('overview-name').textContent = user?.display_name || 'Pastor';
  if (['admin', 'moderator', 'owner'].includes(user?.role)) {
    document.getElementById('admin-nav').style.display = 'flex';
    if(document.getElementById('users-nav')) document.getElementById('users-nav').style.display = 'flex';
    if(document.getElementById('pastors-nav')) document.getElementById('pastors-nav').style.display = 'flex';
  }
  if (user?.role === 'owner') {
    if(document.getElementById('audit-nav')) document.getElementById('audit-nav').style.display = 'flex';
    if(document.getElementById('transfer-ownership-btn')) document.getElementById('transfer-ownership-btn').style.display = 'inline-block';
  }
  // Verify role - if listener somehow got here, redirect
  if(user?.role === 'listener'){
    showAlert('login-error', 'Your account does not have pastor access. Apply for verification first.');
    token=null; user=null;
    localStorage.removeItem('pastor_token');
    localStorage.removeItem('pastor_user');
    showScreen('login');
    return;
  }
  // Populate settings
  if(document.getElementById('set-name')) document.getElementById('set-name').textContent = user?.display_name || '—';
  if(document.getElementById('set-email')) document.getElementById('set-email').textContent = user?.email || '—';
  if(document.getElementById('set-role')){const _tt=PD_TRANS[pdCurrentLang]||PD_TRANS.en;const _roleLabels={owner:'OWNER',admin:(_tt.admin_label||'ADMIN'),moderator:'MODERATOR',pastor:(_tt.pastor_label||'PASTOR'),listener:'LISTENER'};document.getElementById('set-role').textContent=_roleLabels[user?.role]||(_tt.pastor_label||'PASTOR');}
  // Hide admin items unless admin/moderator/owner
  const isAdmin = ['admin', 'owner'].includes(user?.role);
  const isModerator = user?.role === 'moderator';
  const isOwner = user?.role === 'owner';
  ['admin-nav'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display=(isAdmin||isModerator)?'flex':'none';
  });
  ['users-nav','pastors-nav'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display=(isAdmin||isModerator)?'flex':'none';
  });
  const proOnlyBtnEl = document.getElementById('pastor-pro-only');
  if (proOnlyBtnEl) proOnlyBtnEl.style.display = isAdmin ? 'inline-block' : 'none';
  const auditNavEl = document.getElementById('audit-nav');
  if (auditNavEl) auditNavEl.style.display = isOwner ? 'flex' : 'none';
  const transferBtnEl = document.getElementById('transfer-ownership-btn');
  if (transferBtnEl) transferBtnEl.style.display = isOwner ? 'inline-block' : 'none';
  const supportTab=document.getElementById('tab-support');
  if(supportTab) supportTab.style.display=(isAdmin||isModerator)?'block':'none';
  // Show escalations tab for admins, mod-escalate for moderators
  const escTab=document.getElementById('tab-escalations');
  if(escTab) escTab.style.display=isAdmin?'inline-flex':'none';
  const modEscTab=document.getElementById('tab-mod-escalate');
  if(modEscTab) modEscTab.style.display=(isModerator||user?.role==='admin')?'inline-flex':'none';
  const reportsTab=document.getElementById('tab-reports');
  if(reportsTab) reportsTab.style.display=isAdmin||isModerator?'inline-flex':'none';
  const flaggedTab=document.getElementById('tab-flagged');
  if(flaggedTab) flaggedTab.style.display=isAdmin||isModerator?'inline-flex':'none';
  loadOverview();
}

// ── Update notification/inbox badges ──
async function updateBadges() {
  try {
    const data = await api('/api/notifications');
    const allNotifs = data?.notifications || [];
    const unread = allNotifs.filter(n => !n.is_read).length;
    const badge = document.getElementById('notif-badge');
    if (badge) {
      if (unread > 0) { badge.textContent = unread > 99 ? '99+' : unread; badge.style.display = 'inline'; }
      else { badge.style.display = 'none'; }
    }
    // Check support messages if admin
    if (['admin', 'moderator', 'owner'].includes(user?.role)) {
      const sData = await api('/api/admin/support');
      const unreadSupport = (sData?.messages || []).filter(m => !m.is_read).length;
      // Previously only counted support messages, completely ignoring
      // admin_message-type notifications (received from another admin/mod
      // via the peer messaging feature) — those notifications were created
      // correctly on the backend, but this badge never reflected them, so
      // the "Messages" nav item looked empty even with an unread message
      // waiting.
      const unreadAdminMessages = allNotifs.filter(n => !n.is_read && n.type === 'admin_message').length;
      const iBadge = document.getElementById('inbox-badge');
      if (iBadge) {
        const total = unreadSupport + unreadAdminMessages;
        if (total > 0) { iBadge.textContent = total > 99 ? '99+' : total; iBadge.style.display = 'inline'; }
        else { iBadge.style.display = 'none'; }
      }
    }
  } catch(e) {}
}


// ── Overview ──
function scrollToPastStreams() {
  showPage('live');
  // Give the page a moment to render before scrolling — differentiates this
  // from the sidebar's Live Stream link, which lands at the studio controls.
  // This lands directly on stream history instead, since that's what the
  // Overview card is actually about.
  setTimeout(() => {
    const el = document.getElementById('past-streams-list');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 150);
}

async function loadOverview() {
  const isAdminTier = ['admin', 'moderator', 'owner'].includes(user?.role);
  if (isAdminTier) {
    // Admin/moderator/owner get genuine platform-wide totals - this
    // endpoint already existed and was fully built on the backend, but
    // this page only ever queried this specific account's own sermons,
    // which is correctly-but-uselessly all zero for an account (like
    // Owner) that has never published anything of its own.
    try {
      const analytics = await api('/api/admin/analytics?period=30');
      document.getElementById('stat-sermons').textContent = analytics?.total_sermons ?? '—';
      document.getElementById('stat-views').textContent = (analytics?.total_views ?? 0).toLocaleString();
      document.getElementById('stat-followers').textContent = analytics?.new_users ?? '—';
      const followersLabel = document.querySelector('#stat-followers')?.closest('.stat-card')?.querySelector('.stat-label');
      if (followersLabel) followersLabel.textContent = 'New Users (30d)';
      document.getElementById('stat-streams').textContent = analytics?.top_pastors?.length ?? '—';
      const streamsLabel = document.querySelector('#stat-streams')?.closest('.stat-card')?.querySelector('.stat-label');
      if (streamsLabel) streamsLabel.textContent = 'Top Pastors';
      const topSermons = (analytics?.top_sermons || []).map(s => ({ ...s, pastor_name: s.pastor_name }));
      renderSermonList(topSermons.slice(0, 5), 'recent-sermons');
    } catch(e) {
      document.getElementById('recent-sermons').innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><h3>Could not load platform data</h3></div>';
    }
    return;
  }
  try {
    // Previously Promise.all — if the admin-only analytics call failed (as
    // it always would for a regular pastor without admin/moderator access),
    // the WHOLE thing failed, even though the sermon data would have loaded
    // fine on its own. Promise.allSettled lets each succeed or fail
    // independently.
    const [sermonsResult, profileResult, streamsResult] = await Promise.allSettled([
      api('/api/sermons/my/sermons'),
      user?.id ? api('/api/pastors/' + user.id) : Promise.resolve(null),
      fetch(API + '/api/streams/history', { headers: { 'Authorization': 'Bearer ' + (user ? localStorage.getItem('pastor_token') : '') } }).then(r => r.json())
    ]);
    const sermons = sermonsResult.status === 'fulfilled' ? sermonsResult.value : null;
    const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
    const streams = streamsResult.status === 'fulfilled' ? streamsResult.value : null;
    const list = Array.isArray(sermons) ? sermons : [];
    document.getElementById('stat-sermons').textContent = list.length || allSermonsCache?.length || 0;
    document.getElementById('stat-views').textContent = list.reduce((a, s) => a + (parseInt(s.views_count) || 0), 0).toLocaleString();
    // Was pulling analytics.total_users — the platform-wide user count from
    // an admin-only endpoint that regular pastors can't even access, and
    // not this pastor's own follower count even when it did load. Now uses
    // the pastor's own profile data.
    document.getElementById('stat-followers').textContent = (profile?.pastor?.followers_count ?? '—');
    document.getElementById('stat-streams').textContent = (streams?.streams?.length ?? '—');
    renderSermonList(list.slice(0, 5), 'recent-sermons');
  } catch(e) {
    document.getElementById('recent-sermons').innerHTML = '<div class="empty-state"><div class="empty-icon">🎧</div><h3 data-i18n="no_sermons_yet">No sermons yet</h3><p data-i18n="upload_first">Upload your first sermon to get started</p></div>';
  }
}

// ── Sermons ──


function renderSermonList(sermons, containerId) {
  const el = document.getElementById(containerId);
  if (!sermons.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🎧</div><h3 data-i18n="no_sermons_yet">No sermons yet</h3><p>Click "Upload Sermon" to share your first message</p></div>';
    return;
  }
  el.innerHTML = sermons.map(s => {
    const safeTitle = (s.title||'').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    // HTML entity escaping (safeTitle above) is correct for displayed text,
    // but wrong inside a JS string literal within an onclick attribute — the
    // browser decodes &#39; back to a literal apostrophe before JS ever
    // runs, breaking the string boundary for any title containing one
    // (e.g. "God's Grace"). This is what was causing Delete to silently do
    // nothing for some sermons but not others.
    const jsSafeTitle = (s.title||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const safeDesc = (s.description||'').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    return `
    <div class="sermon-card" style="cursor:pointer;">
      <div class="sermon-thumb" onclick="viewSermon('${s.id}')">${s.type === 'video' ? '🎬' : s.type === 'audio' ? '🎧' : '📄'}</div>
      <div class="sermon-info" onclick="viewSermon('${s.id}')">
        <div class="sermon-title">${s.title}</div>
        <div class="sermon-meta">
          <span>👁 ${parseInt(s.views_count || 0).toLocaleString()} views</span>
          ${s.category?`<span style="color:#D4AF37;">🏷 ${s.category}</span>`:''}
          <span>${s.published_at?new Date(s.published_at).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):''}</span>
        </div>
      </div>
      <div class="sermon-actions">
        <span class="status-badge ${s.status === 'live' ? 'status-live' : s.status === 'archived' ? 'status-archived' : 'status-pending'}">${s.status === 'live' ? 'PUBLISHED' : s.status === 'archived' ? 'ARCHIVED' : (s.status||'').toUpperCase()}</span>
        <button class="btn btn-ghost btn-sm" onclick="viewSermonComments('${s.id}','${jsSafeTitle}')">💬 Comments</button>
        <button class="btn btn-ghost btn-sm" onclick="openEditSermon(this.dataset.id,this.dataset.title,this.dataset.desc)" data-id="${s.id}" data-title="${(s.title||'').replace(/"/g,'&quot;')}" data-desc="${(s.description||'').replace(/"/g,'&quot;')}" style="background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.3);color:#D4AF37;border-radius:10px;padding:9px 18px;cursor:pointer;font-size:13px;">✏ Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText('https://trinitarian.app/?sermon=${s.id}').then(function(){showToast(pdTr('link_copied'))})">🔗 Copy Link</button>
        ${s.media_url ? `<button class="btn btn-ghost btn-sm" onclick="downloadSermonMedia('${s.id}','${jsSafeTitle}','${s.type}','${(s.media_url||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')">⬇ Download</button>` : ''}
        <button class="btn btn-ghost btn-sm" style="color:var(--error);" onclick="deleteSermon('${s.id}','${jsSafeTitle}')">🗑 Delete</button>
      </div>
    </div>`;
  }).join('');
}

async function viewSermonComments(sermonId, sermonTitle) {
  const existing = document.getElementById('sermon-comments-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'sermon-comments-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.innerHTML = `
    <div style="background:var(--navy2);border:1px solid var(--border);border-radius:16px;padding:28px;width:100%;max-width:560px;max-height:80vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
        <div>
          <h3 style="color:var(--white);margin:0 0 4px;">💬 Comments</h3>
          <p style="color:var(--text-muted);font-size:13px;margin:0;">${sermonTitle}</p>
        </div>
        <span onclick="document.getElementById('sermon-comments-modal').remove()" style="cursor:pointer;color:var(--text-muted);font-size:20px;">✕</span>
      </div>
      <div id="sermon-comments-list"><p style="color:var(--text-muted);text-align:center;padding:20px;">Loading...</p></div>
    </div>
  `;
  document.body.appendChild(modal);

  const list = document.getElementById('sermon-comments-list');
  try {
    const res = await fetch(API + '/api/sermons/' + sermonId + '/comments', { headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
    const data = await res.json();
    const comments = data.comments || [];
    if (!comments.length) {
      list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No comments yet on this sermon.</p>';
      return;
    }
    const canDelete = ['admin', 'moderator', 'owner'].includes(user?.role);
    list.innerHTML = comments.map(c => `
      <div style="background:#071528;border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="color:#D4AF37;font-size:12px;font-weight:600;">${c.display_name || c.username || 'Anonymous'}</div>
          ${canDelete ? `<span onclick="deleteSermonComment('${sermonId}','${c.id}')" style="cursor:pointer;color:var(--text-muted);font-size:12px;" title="Delete">🗑</span>` : ''}
        </div>
        <div style="color:var(--white);font-size:13px;margin-top:4px;">${(c.content || '').replace(/</g, '&lt;')}</div>
        <div style="color:var(--text-muted);font-size:11px;margin-top:6px;">${c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : ''}${c.like_count > 0 ? ' · ♥ ' + c.like_count : ''}</div>
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = '<p style="color:var(--error);text-align:center;padding:20px;">Could not load comments.</p>';
  }
}

async function deleteSermonComment(sermonId, commentId) {
  if (!confirm(pdTr('delete_comment'))) return;
  try {
    const res = await fetch(API + '/api/sermons/' + sermonId + '/comments/' + commentId, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) { showToast(pdTr('failed_delete_comment')); return; }
    const item = document.getElementById('sermon-comments-list');
    // Re-fetch the sermon's title from the modal's own header rather than
    // threading it through again - simplest way to refresh in place.
    const titleEl = document.querySelector('#sermon-comments-modal p');
    viewSermonComments(sermonId, titleEl ? titleEl.textContent : '');
  } catch (e) {
    showToast(pdTr('connection_error_please_try'));
  }
}

async function openEditSermon(id, title, description){
  const existing = document.getElementById('edit-sermon-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'edit-sermon-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.innerHTML = `
    <div style="background:var(--navy2);border:1px solid var(--border);border-radius:16px;padding:28px;width:100%;max-width:560px;max-height:85vh;overflow-y:auto;">
      <h3 style="color:var(--white);margin-bottom:20px;">Edit Sermon</h3>
      <label style="display:block;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Title</label>
      <input id="edit-sermon-title" type="text" value="${(title||'').replace(/"/g,'&quot;')}" style="width:100%;background:#071528;border:1px solid var(--border);border-radius:10px;padding:12px;color:var(--white);font-size:16px;margin-bottom:16px;box-sizing:border-box;"/>
      <label style="display:block;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Description</label>
      <textarea id="edit-sermon-description" rows="3" style="width:100%;background:#071528;border:1px solid var(--border);border-radius:10px;padding:12px;color:var(--white);font-size:16px;margin-bottom:16px;box-sizing:border-box;resize:vertical;">${description||''}</textarea>
      <label style="display:block;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Transcript</label>
      <textarea id="edit-sermon-transcript" rows="10" placeholder="Loading current transcript…" style="width:100%;background:#071528;border:1px solid var(--border);border-radius:10px;padding:12px;color:var(--white);font-size:14px;line-height:1.6;margin-bottom:20px;box-sizing:border-box;resize:vertical;"></textarea>
      <div style="display:flex;gap:10px;">
        <button onclick="document.getElementById('edit-sermon-modal').remove()" style="flex:1;padding:12px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text-sec);cursor:pointer;">Cancel</button>
        <button onclick="saveEditSermon('${id}')" style="flex:1;padding:12px;border-radius:10px;border:none;background:var(--gold);color:#071528;font-weight:700;cursor:pointer;">Save Changes</button>
      </div>
    </div>`;
  modal.addEventListener('click', function(e){ if(e.target===modal) modal.remove(); });
  document.body.appendChild(modal);
  document.getElementById('edit-sermon-title').focus();

  // Fetch the current transcript fresh, since callers only pass title/description
  try {
    const sermon = await api('/api/sermons/' + id);
    const ta = document.getElementById('edit-sermon-transcript');
    if (ta) {
      ta.value = sermon?.transcript || '';
      ta.placeholder = 'No transcript yet — paste or type the full sermon text here…';
    }
  } catch (e) {
    const ta = document.getElementById('edit-sermon-transcript');
    if (ta) ta.placeholder = 'Could not load existing transcript. You can still type or paste one here.';
  }
}

async function saveEditSermon(id){
  const title = document.getElementById('edit-sermon-title').value.trim();
  const description = document.getElementById('edit-sermon-description').value.trim();
  const transcript = document.getElementById('edit-sermon-transcript').value.trim();
  if (!title) return showToast(pdTr('title_cannot_be_empty'));
  try {
    await api('/api/sermons/'+id, 'PUT', { title, description, transcript });
    document.getElementById('edit-sermon-modal').remove();
    loadSermons();
    showToast(pdTr('sermon_updated_successfully'));
  } catch(e) {
    showToast(pdTr('failed_update_sermon'));
  }
}

async function deleteSermon(id, title){
  if(!confirm('Delete "'+title+'"?\n\nThis cannot be undone.')) return;
  try{
    await api('/api/sermons/'+id,'DELETE');
    loadSermons();
    const toast=document.createElement('div');
    toast.textContent='Sermon deleted';
    toast.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#40c96a;color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;z-index:9999;';
    document.body.appendChild(toast);
    setTimeout(()=>toast.remove(),2500);
  }catch(e){alert(pdTr('delete_failed_please_try'));}
}

async function editSermon(id, title, description, type, language) {
  const newTitle = prompt('Edit sermon title:', title);
  if (!newTitle || newTitle === title) return;
  try {
    const res = await api('/api/admin/sermons/' + id, 'PUT', { title: newTitle });
    if (res?.sermon) {
      loadSermons();
      const toast = document.createElement('div');
      toast.textContent = '✅ Sermon updated';
      toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#40c96a;color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;z-index:9999;';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    } else {
      alert(res?.error || 'Failed to edit sermon');
    }
  } catch(e) { alert(pdTr('edit_failed_please_try')); }
}

function copySermonLink(id) {
  const url = 'https://trinitarian.app/?sermon=' + id;
  navigator.clipboard.writeText(url).then(function() {
    const toast = document.createElement('div');
    toast.textContent = '🔗 Link copied!';
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#40c96a;color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;z-index:9999;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }).catch(function() { prompt('Copy this link:', url); });
}


async function archiveSermon(id) {
  if (!confirm(pdTr('archive_sermon'))) return;
  try {
    await api(`/api/sermons/${id}/archive`, 'PUT');
    loadSermons();
  } catch(e) { alert(pdTr('failed_archive_sermon')); }
}

async function archiveAll() {
  if (!confirm(pdTr('archive_all_live_sermons'))) return;
  try {
    const data = await api('/api/sermons/my/sermons');
    const live = (Array.isArray(data) ? data : []).filter(s => s.status === 'live');
    await Promise.all(live.map(s => api(`/api/sermons/${s.id}/archive`, 'PUT')));
    alert(`${live.length} sermon(s) archived.`);
    loadSermons();
  } catch(e) { alert(pdTr('failed_archive_sermons')); }
}

// This is permanent and affects potentially every sermon a pastor has ever
// uploaded, so it gets a stronger confirmation than the simple OK/Cancel
// used for the less-destructive archive action above.
async function deleteAllSermons() {
  const data = await api('/api/sermons/my/sermons').catch(() => []);
  const sermons = Array.isArray(data) ? data.filter(s => s.status !== 'deleted') : [];
  if (!sermons.length) { alert(pdTr('no_sermons_delete')); return; }
  const typed = prompt(`This will PERMANENTLY delete all ${sermons.length} of your sermons. This cannot be undone.\n\nType DELETE to confirm:`);
  if (typed !== 'DELETE') { if (typed !== null) alert(pdTr('confirmation_text_did_not_2')); return; }
  try {
    await Promise.all(sermons.map(s => api(`/api/sermons/${s.id}`, 'DELETE')));
    alert(`${sermons.length} sermon(s) deleted.`);
    loadSermons();
  } catch(e) { alert(pdTr('failed_delete_all_sermons')); }
}

// ── Upload ──
function selectType(el, type) {
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  uploadType = type;
  document.getElementById('up-type').value = type;
}

function selectLang(el, lang) {
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  uploadLang = lang;
  document.getElementById('up-lang').value = lang;
}

function handleThumbnailSelect(input) {
  const file = input.files[0];
  const preview = document.getElementById('thumbnail-preview');
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert(pdTr('please_select_jpg_png'));
    input.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert(pdTr('thumbnail_must_be_under'));
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
}

function handleFileSelect(input) {
  const file = input.files[0];
  const nameEl = document.getElementById('file-name');
  if (!file) return;
  const name = file.name.toLowerCase();
  // Matches the mobile app's upload restriction: video/audio always allowed,
  // but documents are limited to .docx/.txt since those are the only formats
  // that extract cleanly to readable text. PDF and legacy .doc can't be
  // reliably converted, so they're excluded for consistency across platforms.
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const isValidDoc = name.endsWith('.docx') || name.endsWith('.txt');
  if (!isVideo && !isAudio && !isValidDoc) {
    alert(pdTr('please_select_video_audio'));
    input.value = '';
    if (nameEl) nameEl.innerHTML = '';
    return;
  }
  // Cross-check against the selected Content Type — previously this was
  // never checked, so selecting "Video" and uploading an audio file (or any
  // other mismatched combination) was silently accepted.
  const selectedType = document.getElementById('up-type')?.value;
  const typeMismatch =
    (selectedType === 'video' && !isVideo) ||
    (selectedType === 'audio' && !isAudio) ||
    ((selectedType === 'text' || selectedType === 'article') && !isValidDoc);
  if (typeMismatch) {
    const expected = selectedType === 'video' ? 'a video file' : selectedType === 'audio' ? 'an audio file' : 'a .docx or .txt file';
    alert(`You selected "${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}" as the content type, but this file doesn't match — please upload ${expected}, or change the content type above.`);
    input.value = '';
    if (nameEl) nameEl.innerHTML = '';
    return;
  }
  nameEl.innerHTML = `📎 ${file.name} <span onclick="removeMediaFile(event)" style="color:#e05555;cursor:pointer;margin-left:8px;font-size:12px;">✕ Remove</span>`;
}

function removeMediaFile(e) {
  e.stopPropagation();
  const input = document.getElementById('file-input');
  input.value = '';
  const nameEl = document.getElementById('file-name');
  if (nameEl) nameEl.innerHTML = '';
}

async function loadCategories() {
  try {
    const data = await api('/api/categories');
    const sel = document.getElementById('up-category');
    if (Array.isArray(data)) {
      data.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id; opt.textContent = c.name;
        sel.appendChild(opt);
      });
    }
  } catch(e) {}
}

async function handleUpload(isDraft) {
  const title = document.getElementById('up-title').value.trim();
  if (!title) return showAlert('upload-error', 'Please enter a sermon title');
  const type = document.getElementById('up-type')?.value;
  const transcript = document.getElementById('up-transcript')?.value?.trim();
  const mediaFile = document.getElementById('file-input')?.files?.[0];
  if ((type === 'video' || type === 'audio') && !mediaFile) {
    return showAlert('upload-error', `Please select a ${type} file to upload`);
  }
  if ((type === 'text' || type === 'article') && !transcript && !mediaFile) {
    return showAlert('upload-error', 'Please enter sermon content or upload a document file');
  }
  hideAlert('upload-error');
  // Show progress
  const btn = document.getElementById('upload-submit-btn');
  const wrap = document.getElementById('upload-progress-wrap');
  const bar = document.getElementById('upload-progress-bar');
  const pct = document.getElementById('upload-progress-pct');
  if (btn) { btn.disabled = true; btn.textContent = 'Uploading...'; }
  if (wrap) wrap.style.display = 'block';
  // Simulate progress
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress = Math.min(progress + Math.random() * 15, 90);
    if (bar) bar.style.width = progress + '%';
    if (pct) pct.textContent = Math.round(progress) + '%';
  }, 500);
  try {
    const mediaFile = document.getElementById('file-input')?.files[0];
    const thumbFile = document.getElementById('thumbnail-input')?.files[0];
    let data;
    if (mediaFile || thumbFile) {
      // Use FormData for file uploads
      const fd = new FormData();
      fd.append('is_draft', isDraft||false);
      fd.append('title', title);
      fd.append('description', document.getElementById('up-desc').value.trim());
      fd.append('transcript', document.getElementById('up-transcript').value.trim());
      fd.append('type', uploadType);
      fd.append('language', uploadLang);
      const catId = document.getElementById('up-category').value;
      if (catId) fd.append('category_id', catId);
      fd.append('scripture_reference', document.getElementById('up-scripture').value.trim());
      if (mediaFile) fd.append('media', mediaFile);
      if (thumbFile) fd.append('thumbnail', thumbFile);
      const headers = {};
      if (token) headers['Authorization'] = 'Bearer ' + token;
      const res = await fetch(API + '/api/sermons', { method: 'POST', headers, body: fd });
      data = await res.json();
    } else {
      data = await api('/api/sermons', 'POST', {
        is_draft: isDraft||false,
        title,
        description: document.getElementById('up-desc').value.trim(),
        transcript: document.getElementById('up-transcript').value.trim(),
        type: type || uploadType,
        language: uploadLang,
        category_id: document.getElementById('up-category').value || undefined,
        scripture_reference: document.getElementById('up-scripture').value.trim()
      });
    }
    clearInterval(progressInterval);
    if (bar) bar.style.width = '100%';
    if (pct) pct.textContent = '100%';
    if (data.id) {
      const msg = isDraft ? '✝ Sermon saved as draft!' : '✝ Sermon published successfully!';
      showAlert('upload-success', msg, 'success');
      showAlert('upload-success-bottom', msg, 'success');
      setTimeout(() => hideAlert('upload-success-bottom'), 5000);
      hideAlert('upload-error-bottom');
      document.getElementById('up-title').value = '';
      document.getElementById('up-desc').value = '';
      document.getElementById('up-transcript').value = '';
      document.getElementById('up-scripture').value = '';
      document.getElementById('file-name').textContent = '';
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (wrap) setTimeout(() => wrap.style.display = 'none', 1000);
      // Refresh My Sermons list
      setTimeout(() => loadSermons(), 500);
    } else {
      const errMsg = data.error || 'Upload failed. Make sure you are a verified pastor.';
      showAlert('upload-error', errMsg);
      showAlert('upload-error-bottom', errMsg);
      if (wrap) wrap.style.display = 'none';
    }
  } catch(e) {
    clearInterval(progressInterval);
    console.error('Upload error:', e);
    const msg = e?.message && !e.message.includes('Failed to fetch') ? e.message : 'Connection failed. Please try again.';
    showAlert('upload-error', msg);
    showAlert('upload-error-bottom', msg);
    if (wrap) wrap.style.display = 'none';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Publish Sermon'; }
  }
}

// ── Live Streams ──
async function loadStreams() {
  try {
    const data = await api('/api/streams?my=true');
    const streams = Array.isArray(data) ? data : [];
    const el = document.getElementById('my-streams');
    if (!streams.length) {
      el.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:12px 0;" data-i18n="no_streams">No streams yet. Schedule your first live stream above.</p>';
      return;
    }
    el.innerHTML = streams.map(s => `
      <div class="sermon-card" style="margin-bottom:10px;">
        <div class="sermon-thumb">📡</div>
        <div class="sermon-info">
          <div class="sermon-title">${s.title}</div>
          <div class="sermon-meta">
            <span>${s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : ''}</span>
          </div>
        </div>
        <div class="sermon-actions">
          <span class="status-badge ${s.status === 'live' ? 'status-live' : s.status === 'ended' ? 'status-archived' : 'status-pending'}">${s.status === 'live' ? 'PUBLISHED' : (s.status||'').toUpperCase()}</span>
          ${s.status === 'scheduled' ? `<button class="btn btn-gold btn-sm" onclick="goLive('${s.id}')">Go Live</button>` : ''}
          ${s.status === 'live' ? `<button class="btn btn-danger btn-sm" onclick="endStream('${s.id}')">End</button>` : ''}
        </div>
      </div>
      ${s.stream_key && s.status !== 'ended' ? `<div style="margin-bottom:12px;"><span class="section-label" data-i18n="stream_key">Stream Key</span><div class="stream-key-box">${s.stream_key}</div><p style="color:var(--text-muted);font-size:11px;">Use this key in OBS or your streaming software (RTMP)</p></div>` : ''}
      <div style="display:flex;gap:6px;margin-top:8px;">
      <button onclick="event.stopPropagation();openEditSermon(this.dataset.id,this.dataset.title,this.dataset.desc)" data-id="${s.id}" data-title="${(s.title||''  ).replace(/"/g,'&quot;')}" data-desc="${(s.description||''  ).replace(/"/g,'&quot;')}" class="btn btn-ghost btn-sm">✏ Edit</button>
      <button onclick="event.stopPropagation();deleteSermon(s.id,s.title)" class="btn btn-ghost btn-sm" style="color:var(--error);">🗑 Delete</button>
      <button onclick="event.stopPropagation();navigator.clipboard.writeText('https://trinitarian.app/?sermon='+s.id).then(function(){showToast(pdTr('link_copied'));});" class="btn btn-ghost btn-sm" title="Copy link">🔗 Copy Link</button>
    </div>
  `).join('');
  } catch(e) { document.getElementById('my-streams').innerHTML = '<p style="color:var(--text-muted);padding:12px 0;" data-i18n="failed_streams">Failed to load streams</p>'; }
}

async function scheduleStream() {
  const title = document.getElementById('live-title').value.trim();
  const scheduled_at = document.getElementById('live-time').value;
  if (!title) return showAlert('live-error', 'Please enter a stream title');
  try {
    const data = await api('/api/streams', 'POST', {
      title,
      description: document.getElementById('live-desc').value.trim(),
      scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : new Date().toISOString()
    });
    if (data.id) {
      showAlert('live-success', '✅ Stream scheduled successfully!', 'success');
      document.getElementById('live-title').value = '';
      document.getElementById('live-desc').value = '';
      loadStreams();
    } else { showAlert('live-error', data.error || 'Failed to schedule stream'); }
  } catch(e) { showAlert('live-error', 'Connection failed'); }
}

async function goLive(id) {
  try { await api(`/api/streams/${id}/go-live`, 'PUT'); loadStreams(); } catch(e) { alert(pdTr('failed_go_live')); }
}
async function endStream(id) {
  if (!confirm(pdTr('end_live_stream'))) return;
  try { await api(`/api/streams/${id}/end`, 'PUT'); loadStreams(); } catch(e) { alert(pdTr('failed_end_stream')); }
}

// ── Analytics ──
async function loadAnalytics(period, btn) {
  if (btn) {
    document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
  }
  try {
    const data = await api(`/api/sermons/my/analytics?period=${period}`);
    document.getElementById('an-views').textContent = (data?.period_views || 0).toLocaleString();
    const labelEl = document.getElementById('an-views-label');
    // Honest label — this reflects all-time views, not a true period-specific
    // breakdown (no per-view timestamp log exists yet to compute that).
    if(labelEl) labelEl.textContent = `Total Views`;
    const allTimeEl = document.getElementById('an-views-alltime');
    if(allTimeEl) allTimeEl.textContent = '';
    document.getElementById('an-sermons').textContent = data?.live_sermons || data?.total_sermons || 0;
    const top = document.getElementById('top-sermons');
    if (data?.top_sermons?.length) {
      top.innerHTML = '<p style="color:var(--text-muted);font-size:12px;text-align:center;padding:8px;">💡 Click any sermon to view or edit it</p>' + data.top_sermons.map((s, i) => `
        <div class="top-sermon-item">
          <div class="rank">#${i+1}</div>
          <div style="flex:1;min-width:0;"><div style="color:var(--white);font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.title}</div></div>
          <div style="color:var(--text-muted);font-size:15px;font-weight:600;">👁 ${parseInt(s.views_count||0).toLocaleString()}</div>
        </div>
        <div style="display:flex;gap:6px;margin-top:8px;">
      <button onclick="event.stopPropagation();openEditSermon(this.dataset.id,this.dataset.title,this.dataset.desc)" data-id="${s.id}" data-title="${(s.title||''  ).replace(/"/g,'&quot;')}" data-desc="${(s.description||''  ).replace(/"/g,'&quot;')}" class="btn btn-ghost btn-sm">✏ Edit</button>
      <button onclick="event.stopPropagation();deleteSermon(s.id,s.title)" class="btn btn-ghost btn-sm" style="color:var(--error);">🗑 Delete</button>
      <button onclick="event.stopPropagation();navigator.clipboard.writeText('https://trinitarian.app/?sermon='+s.id).then(function(){showToast(pdTr('link_copied'));});" class="btn btn-ghost btn-sm" title="Copy link">🔗 Copy Link</button>
    </div>
  `).join('');
    } else {
      top.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:12px 0;" data-i18n="no_sermons_data">No sermon data yet</p>';
    }
  } catch(e) {}
}

// ── Notifications ──
async function markRead(id) {
  try {
    await api('/api/notifications/' + id + '/read', 'PUT');
    updateBadges();
  } catch(e) {}
}

async function deleteNotification(id) {
  try {
    await api('/api/notifications/' + id, 'DELETE');
    loadNotifications();
    updateBadges();
  } catch(e) { showToast(pdTr('failed_delete'), 'error'); }
}

async function pdOpenNotifSermon(sermonId) {
  try {
    const sermon = await api('/api/sermons/' + sermonId);
    if (sermon && sermon.id) viewSermon(sermon.id);
    else showToast(pdTr('sermon_not_found'), 'error');
  } catch(e) { showToast(pdTr('failed_open_sermon'), 'error'); }
}

async function loadNotifications() {
  try {
    const data = await api('/api/notifications');
    const notifs = data?.notifications || [];
    const el = document.getElementById('notifications-list');
    // Mark as read after a delay - gives user time to see what's new
    if (notifs.some(n => !n.is_read)) {
      setTimeout(() => {
        api('/api/notifications/read-all', 'PUT').then(() => updateBadges()).catch(() => {});
      }, 2000);
    }
    const ICONS = { new_sermon:'🎧', live_stream:'📡', download_ready:'⬇️', admin_message:'📬', follow:'👤', application_update:'🛡️', report:'⚑' };
    if (!notifs.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">🔔</div><h3>All caught up!</h3><p data-i18n="no_notifs">No notifications yet</p></div>';
      return;
    }
    el.innerHTML = notifs.map(n => {
      let d = null;
      try { d = typeof n.data === 'string' ? JSON.parse(n.data) : n.data; } catch(e) {}
      const sermonId = d && (d.sermon_id || d.id);
      let clickAttr = '';
      if (sermonId && n.type === 'new_sermon') clickAttr = `onclick="pdOpenNotifSermon('${sermonId}')" style="cursor:pointer;"`;
      else if (n.type === 'live_stream') clickAttr = `onclick="showPage('live')" style="cursor:pointer;"`;
      else if (n.type === 'admin_message') clickAttr = `onclick="showPage('inbox')" style="cursor:pointer;"`;
      // Previously every new_sermon notification showed the same fixed icon
      // regardless of the sermon's actual type.
      let icon = ICONS[n.type] || '🔔';
      if (n.type === 'new_sermon' && d?.sermon_type) {
        icon = { video:'🎬', audio:'🎧', text:'📄', article:'📰' }[d.sermon_type] || icon;
      }
      return `
      <div class="notif-item ${!n.is_read ? 'notif-unread' : ''}" ${clickAttr}>
        <div class="notif-icon">${icon}</div>
        <div style="flex:1;">
          <div style="color:${n.is_read?'var(--text-sec)':'var(--white)'};font-size:14px;font-weight:${n.is_read?'400':'600'};margin-bottom:3px;">${n.title}</div>
          ${n.body ? `<div style="color:var(--text-muted);font-size:12px;line-height:1.6;">${n.body}</div>` : ''}
          ${n.created_at ? `<div style="color:var(--text-muted);font-size:11px;margin-top:4px;">${new Date(n.created_at).toLocaleString()}</div>` : ''}
        </div>
        ${!n.is_read ? '<div class="notif-dot"></div>' : ''}
        <button onclick="event.stopPropagation();deleteNotification('${n.id}')" class="btn btn-ghost btn-sm" style="color:var(--text-muted);padding:4px 8px;" title="Delete">✕</button>
      </div>
    `;}).join('');
  } catch(e) { document.getElementById('notifications-list').innerHTML = '<p style="color:var(--text-muted);padding:20px;" data-i18n="failed_load">Failed to load notifications</p>'; }
}


async function markAllReadInbox() {
  // Determine active tab
  const notifTab = document.getElementById('tab-notifications');
  const isNotifActive = notifTab && notifTab.classList.contains('btn-gold');
  const reportsTab = document.getElementById('tab-reports');
  const isReportsActive = reportsTab && reportsTab.classList.contains('btn-gold');
  const flaggedTab = document.getElementById('tab-flagged');
  const isFlaggedActive = flaggedTab && flaggedTab.classList.contains('btn-gold');

  if (isReportsActive || isFlaggedActive) {
    if (!confirm(pdTr('resolve_all_pending_reports'))) return;
    try {
      await api('/api/admin/reports/resolve-all', 'PUT');
      loadReports();
      showToast(pdTr('all_reports_resolved'));
    } catch(e) { showToast(pdTr('failed_resolve_reports'), 'error'); }
    return;
  }

  if (isNotifActive) {
    // Mark notifications as read
    await markAllRead();
    // Also mark Sent Messages (admin_messages) read, since they render
    // inline in this same view but live in a separate table.
    api('/api/admin/messages/mark-all-read', 'PUT').catch(() => {});
  } else {
    // Mark support messages as read
    try {
      const data = await api('/api/admin/support');
      const msgs = data?.messages || [];
      const unread = msgs.filter(m => !m.is_read);
      // Mark each unread message
      await Promise.all(unread.map(m => 
        api('/api/admin/support/' + m.id + '/read', 'PUT').catch(() => {})
      ));
      // Update UI immediately
      document.querySelectorAll('#support-list .notif-item.notif-unread').forEach(el => {
        el.classList.remove('notif-unread');
      });
      document.querySelectorAll('#support-list .notif-dot').forEach(el => el.remove());
      // Update badge
      const badge = document.getElementById('inbox-badge');
      if (badge) badge.style.display = 'none';
      setTimeout(() => loadSupportMessages(), 500);
      showToast(pdTr('all_messages_marked_as'));
    } catch(e) { showToast(pdTr('failed_mark_as_read'), 'error'); }
  }
}


async function clearAllNotifications() {
  if (!confirm(pdTr('clear_all_notifications_cannot'))) return;
  try {
    await api('/api/notifications', 'DELETE');
    loadNotifications();
    updateBadges();
    showToast(pdTr('all_notifications_cleared'));
  } catch(e) { showToast(pdTr('failed_clear_notifications'), 'error'); }
}

async function clearAllInbox() {
  // Determine active tab
  const notifTab = document.getElementById('tab-notifications');
  const isNotifActive = notifTab && notifTab.classList.contains('btn-gold');
  const reportsTab = document.getElementById('tab-reports');
  const isReportsActive = reportsTab && reportsTab.classList.contains('btn-gold');
  const flaggedTab = document.getElementById('tab-flagged');
  const isFlaggedActive = flaggedTab && flaggedTab.classList.contains('btn-gold');
  const escalationsTab = document.getElementById('tab-escalations');
  const isEscalationsActive = escalationsTab && escalationsTab.classList.contains('btn-gold');

  if (isEscalationsActive) {
    if (!confirm(pdTr('clear_all_escalations_cannot'))) return;
    try {
      await api('/api/admin/escalations', 'DELETE');
      loadAdminEscalations();
      updateBadges();
      showToast(pdTr('all_escalations_cleared'));
    } catch(e) { showToast(pdTr('failed_clear_escalations'), 'error'); }
    return;
  }

  if (isReportsActive || isFlaggedActive) {
    if (!confirm(pdTr('clear_all_reports_cannot'))) return;
    try {
      await api('/api/admin/reports', 'DELETE');
      loadReports();
      updateBadges();
      showToast(pdTr('all_reports_cleared'));
    } catch(e) { showToast(pdTr('failed_clear_reports'), 'error'); }
    return;
  }

  if (isNotifActive) {
    if (!confirm(pdTr('clear_all_notifications_sent'))) return;
    try {
      // Sent Messages render inline within this same Notifications view, but
      // live in a separate table (admin_messages) — previously only
      // notifications got cleared, leaving Sent Messages behind untouched.
      await Promise.all([
        api('/api/notifications', 'DELETE'),
        api('/api/admin/messages', 'DELETE').catch(() => {}),
      ]);
      loadInbox();
      updateBadges();
      showToast(pdTr('all_notifications_messages_cleared'));
    } catch(e) { showToast(pdTr('failed_clear_notifications'), 'error'); }
  } else {
    if (!confirm(pdTr('clear_all_support_messages'))) return;
    try {
      await api('/api/admin/support', 'DELETE');
      loadSupportMessages();
      updateBadges();
      showToast(pdTr('all_messages_cleared'));
    } catch(e) { showToast(pdTr('failed_clear_messages'), 'error'); }
  }
}

async function markAllRead() {
  try {
    await api('/api/notifications/read-all', 'PUT');
    // Update UI immediately - mark all items as read visually
    document.querySelectorAll('.notif-item.notif-unread').forEach(el => {
      el.classList.remove('notif-unread');
    });
    document.querySelectorAll('.notif-dot').forEach(el => el.remove());
    // Update badge
    const badge = document.getElementById('notif-badge');
    if (badge) badge.style.display = 'none';
    // Reload to confirm
    setTimeout(() => loadNotifications(), 500);
  } catch(e) { showToast(pdTr('failed_mark_as_read'), 'error'); }
}

// ── Admin ──
let currentAppFilter = 'pending';
let currentAppList = [];
let currentAppRenderer = renderApplications;

function filterApplicationsSearch() {
  const q = (document.getElementById('app-search-input')?.value || '').trim().toLowerCase();
  if (!q) { currentAppRenderer(currentAppList); return; }
  const filtered = currentAppList.filter(a =>
    (a.full_name||'').toLowerCase().includes(q) ||
    (a.email||'').toLowerCase().includes(q) ||
    (a.church_name||'').toLowerCase().includes(q)
  );
  currentAppRenderer(filtered);
}

async function filterApps(status, btn) {
  currentAppFilter = status;
  const searchInput = document.getElementById('app-search-input');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.app-filter-btn').forEach(b=>{
    b.style.background='transparent';b.style.color='var(--text-muted)';b.style.borderColor='var(--border)';
  });
  if(btn){
    const colors={pending:'rgba(240,165,0,0.1)',approved:'rgba(64,201,106,0.1)',rejected:'rgba(224,85,85,0.1)',all:'rgba(212,175,55,0.1)','auto-approval':'rgba(100,150,255,0.1)','auto-approved':'rgba(100,150,255,0.1)'};
    const textColors={pending:'var(--warning)',approved:'var(--success)',rejected:'var(--error)',all:'var(--gold)','auto-approval':'#6496ff','auto-approved':'#6496ff'};
    btn.style.background=colors[status]||colors.all;
    btn.style.color=textColors[status]||textColors.all;
  }
  if (status === 'auto-approval') {
    try {
      const data = await api('/api/pastors/applications/pending-auto-approval');
      currentAppList = data?.applications || [];
      currentAppRenderer = renderAutoApprovalQueue;
      renderAutoApprovalQueue(currentAppList);
    } catch(e) {}
    return;
  }
  if (status === 'auto-approved') {
    try {
      const data = await api('/api/pastors/applications/auto-approved');
      currentAppList = data?.applications || [];
      currentAppRenderer = renderAutoApprovedList;
      renderAutoApprovedList(currentAppList);
    } catch(e) {}
    return;
  }
  const url = status==='all' ? '/api/pastors/applications' : '/api/pastors/applications?status='+status;
  try {
    const apps = await api(url);
    const applications = apps?.applications || [];
    currentAppList = applications;
    currentAppRenderer = renderApplications;
    renderApplications(applications);
  } catch(e) {}
}

function renderAutoApprovalQueue(applications) {
  const el = document.getElementById('admin-applications');
  if (!applications.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">⏱</div><h3>Nothing currently counting down</h3><p style="color:var(--text-muted);">Applications appear here once auto-verification schedules them for approval.</p></div>';
    return;
  }
  el.innerHTML = applications.map(a => {
    const hoursLeft = Math.max(0, Math.round((new Date(a.auto_approve_at).getTime() - Date.now()) / 3600000));
    return `
    <div class="sermon-card" style="margin-bottom:12px;flex-direction:column;align-items:flex-start;gap:10px;">
      <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
        <div>
          <div style="color:var(--white);font-size:15px;font-weight:700;">${a.full_name}</div>
          <div style="color:var(--text-muted);font-size:13px;">${a.denomination||''} · ${a.church_name||''} · ${a.country||''}</div>
        </div>
        <span class="status-badge" style="background:rgba(100,150,255,0.15);color:#6496ff;">⏱ ~${hoursLeft}h left</span>
      </div>
      ${a.verification_score !== null && a.verification_score !== undefined ? `<div style="color:#6496ff;font-size:12px;">Verification score: ${a.verification_score}/100</div>` : ''}
      ${a.statement ? `<div style="color:var(--text-sec);font-size:13px;line-height:1.6;border-left:2px solid var(--gold-border);padding-left:12px;">${a.statement.substring(0,200)}…</div>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-sm" style="background:rgba(64,201,106,0.1);border:1px solid rgba(64,201,106,0.4);color:var(--success);" onclick="approveApp('${a.id}','${a.full_name}')">✓ Approve Now</button>
        <button class="btn btn-sm btn-danger" onclick="rejectApp('${a.id}','${a.full_name}')">✕ Reject</button>
        <button class="btn btn-sm" style="background:rgba(100,150,255,0.1);border:1px solid rgba(100,150,255,0.4);color:#6496ff;" onclick="cancelAutoApproval('${a.id}','${a.full_name}')">⏸ Pause Auto-Approval</button>
      </div>
    </div>
  `;}).join('');
}

async function cancelAutoApproval(id, name) {
  if (!confirm(pdTrF('pause_auto_approval_confirm', {name}))) return;
  try {
    await api(`/api/pastors/applications/${id}/cancel-auto-approval`, 'PUT');
    showToast(pdTr('auto_approval_paused_now'));
    filterApps('auto-approval', document.querySelector('.app-filter-btn[onclick*="auto-approval"]'));
  } catch(e) {
    showToast(pdTr('failed_pause_auto_approval'), 'error');
  }
}

function renderAutoApprovedList(applications) {
  const el = document.getElementById('admin-applications');
  if (!applications.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">⏱</div><h3>No auto-approved applications yet</h3><p style="color:var(--text-muted);">Applications that were approved automatically without manual review will appear here, so you always have a reviewable record of who was approved and what they submitted.</p></div>';
    return;
  }
  el.innerHTML = applications.map(a => {
    const approvedDate = a.reviewed_at ? new Date(a.reviewed_at).toLocaleDateString(undefined, {year:'numeric',month:'short',day:'numeric'}) : '';
    return `
    <div class="sermon-card" style="margin-bottom:12px;flex-direction:column;align-items:flex-start;gap:10px;">
      <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
        <div>
          <div style="color:var(--white);font-size:15px;font-weight:700;">${a.full_name}</div>
          <div style="color:var(--text-muted);font-size:13px;">${a.denomination||''} · ${a.church_name||''} · ${a.country||''}${a.city ? ', '+a.city : ''}</div>
        </div>
        <span class="status-badge" style="background:rgba(100,150,255,0.15);color:#6496ff;">⏱ Auto-approved ${approvedDate}</span>
      </div>
      <div style="color:var(--text-muted);font-size:13px;">${a.email}${a.phone ? ' · '+a.phone : ''}</div>
      ${a.congregation_size ? `<div style="color:var(--text-muted);font-size:12px;">Congregation size: ${a.congregation_size}</div>` : ''}
      ${a.verification_score !== null && a.verification_score !== undefined ? `<div style="color:#6496ff;font-size:12px;">Verification score: ${a.verification_score}/100</div>` : ''}
      ${a.statement ? `<div style="color:var(--text-sec);font-size:13px;line-height:1.6;border-left:2px solid var(--gold-border);padding-left:12px;">${a.statement}</div>` : ''}
    </div>
  `;}).join('');
}

let proSearchTimer = null;
function searchProUsers() {
  clearTimeout(proSearchTimer);
  const q = document.getElementById('pro-search-input').value.trim();
  const container = document.getElementById('pro-search-results');
  if (q.length < 2) { container.innerHTML = ''; return; }
  proSearchTimer = setTimeout(async () => {
    try {
      const data = await api('/api/pro/search?q=' + encodeURIComponent(q));
      const users = data?.users || [];
      if (!users.length) {
        container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:12px;">No matching users found.</p>';
        return;
      }
      container.innerHTML = users.map(u => `
        <div style="display:flex;justify-content:space-between;align-items:center;background:var(--navy2);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:8px;">
          <div>
            <div style="color:var(--white);font-size:14px;font-weight:600;">${u.display_name || 'Unnamed'} ${u.subscription_status === 'active' ? '<span style="color:#6496ff;font-size:11px;">💳 Paid Subscriber</span>' : ''}</div>
            <div style="color:var(--text-muted);font-size:12px;">${u.email} · ${u.role}</div>
          </div>
          <button onclick="toggleProStatus('${u.id}', ${!u.is_pro}, this)" ${u.is_pro && u.subscription_status === 'active' ? `title="This user has an active paid subscription - ask them to cancel via their own settings instead" style="background:rgba(100,100,100,0.1);border:1px solid rgba(100,100,100,0.3);color:var(--text-muted);border-radius:10px;padding:8px 16px;font-size:13px;cursor:not-allowed;font-weight:600;" disabled` : `style="background:${u.is_pro ? 'rgba(224,85,85,0.1)' : 'rgba(212,175,55,0.15)'};border:1px solid ${u.is_pro ? 'rgba(224,85,85,0.3)' : 'rgba(212,175,55,0.3)'};color:${u.is_pro ? '#e05555' : '#D4AF37'};border-radius:10px;padding:8px 16px;font-size:13px;cursor:pointer;font-weight:600;"`}>
            ${u.is_pro ? '✕ Revoke Pro' : '👑 Grant Pro'}
          </button>
        </div>
      `).join('');
    } catch(e) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:12px;">Search failed.</p>';
    }
  }, 300);
}

async function toggleProStatus(userId, newStatus, btn) {
  const label = newStatus ? pdTr('grant_label') : pdTr('revoke_label');
  if (!confirm(pdTrF('change_pro_status_confirm', {label}))) return;
  btn.disabled = true;
  try {
    await api('/api/pro/' + userId + '/toggle', 'PUT', { is_pro: newStatus });
    showToast(newStatus ? pdTr('pro_status_granted') : pdTr('pro_status_revoked'));
    searchProUsers();
  } catch(e) {
    showToast(pdTr('failed_update_pro_status'), 'error');
    btn.disabled = false;
  }
}

async function loadAdminStreams(status) {
  document.querySelectorAll('#admin-stream-filter-live, #admin-stream-filter-scheduled, #admin-stream-filter-ended').forEach(b => {
    const active = b.id === 'admin-stream-filter-' + status;
    b.style.borderColor = active ? 'rgba(212,175,55,0.4)' : 'var(--border)';
    b.style.background = active ? 'rgba(212,175,55,0.15)' : 'transparent';
    b.style.color = active ? 'var(--gold)' : 'var(--text-muted)';
  });
  const el = document.getElementById('admin-streams-results');
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading…</div>';
  try {
    const data = await api('/api/streams?status=' + status);
    const streams = Array.isArray(data) ? data : (data?.streams || []);
    if (!streams.length) {
      el.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:30px;">No ${status} streams.</p>`;
      return;
    }
    el.innerHTML = streams.map(s => `
      <div style="background:var(--navy3);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="color:#e8e8e8;font-size:13px;font-weight:600;">${s.title || 'Untitled stream'}</div>
          <div style="color:var(--text-muted);font-size:11px;margin-top:2px;">${s.display_name || 'Unknown pastor'}${s.viewer_count != null ? ' · 👥 ' + s.viewer_count + ' watching' : ''}</div>
        </div>
        ${status !== 'live' ? `<button onclick="deleteAdminStream('${s.id}', '${status}')" style="background:rgba(224,85,85,0.1);border:1px solid rgba(224,85,85,0.3);color:#e05555;border-radius:8px;padding:6px 12px;font-size:11px;cursor:pointer;">🗑 Delete</button>` : ''}
        ${status === 'live' ? `<button onclick="forceEndAdminStream('${s.id}')" style="background:rgba(224,85,85,0.1);border:1px solid rgba(224,85,85,0.3);color:#e05555;border-radius:8px;padding:6px 12px;font-size:11px;cursor:pointer;">⏹ Force End</button>` : ''}
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:30px;">Could not load streams.</p>';
  }
}

async function deleteAdminStream(id, status) {
  if (!confirm(pdTr('delete_stream_cannot_be'))) return;
  try {
    await api('/api/streams/' + id, 'DELETE');
    showToast(pdTr('stream_deleted'));
    loadAdminStreams(status);
  } catch (e) {
    showToast(pdTr('failed_delete_stream_live'), 'error');
  }
}

async function forceEndAdminStream(id) {
  if (!confirm('End this stream? Use this if it is stuck showing as live but the pastor is no longer actually broadcasting.')) return;
  try {
    await api('/api/streams/' + id + '/force-end', 'PUT');
    showToast(pdTr('stream_ended'));
    loadAdminStreams('live');
  } catch (e) {
    showToast(pdTr('failed_end_stream_2'), 'error');
  }
}

async function loadAdmin() {
  try {
    const [dash, apps] = await Promise.all([
      api('/api/admin/dashboard'),
      api('/api/pastors/applications?status=pending')
    ]);
    if (dash) {
      document.getElementById('ad-users').textContent = dash.total_users || 0;
      document.getElementById('ad-sermons').textContent = dash.live_sermons || 0;
      document.getElementById('ad-pending').textContent = dash.pending_applications || 0;
      document.getElementById('ad-flags').textContent = dash.unresolved_flags || 0;
    }
    const applications = apps?.applications || [];
    renderApplications(applications);
    loadAdminStreams('live');
  } catch(e) { document.getElementById('admin-applications').innerHTML = '<p style="color:var(--text-muted);padding:20px;" data-i18n="failed_admin">Failed to load admin data</p>'; }
}

function renderApplications(applications) {
  const el = document.getElementById('admin-applications');
  if (!applications.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><h3 data-i18n="no_apps">No applications found</h3></div>';
    return;
  }
  const statusColors = {pending:'status-pending',approved:'status-live',rejected:'status-archived'};
  el.innerHTML = applications.map(a => `
    <div class="sermon-card" style="margin-bottom:12px;flex-direction:column;align-items:flex-start;gap:10px;">
      <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
        <div>
          <div style="color:var(--white);font-size:15px;font-weight:700;">${a.full_name}</div>
          <div style="color:var(--text-muted);font-size:15px;font-weight:600;">${a.denomination||''} · ${a.church_name||''} · ${a.country||''}${a.city ? ', '+a.city : ''}</div>
        </div>
        <span class="status-badge ${statusColors[a.status]||'status-pending'}">● ${(a.status||'pending').toUpperCase()}</span>
      </div>
      <div style="color:var(--text-muted);font-size:13px;">${a.email||''}${a.phone ? ' · '+a.phone : ''}</div>
      ${a.congregation_size ? `<div style="color:var(--text-muted);font-size:12px;">Congregation size: ${a.congregation_size}</div>` : ''}
      ${a.years_in_ministry ? `<div style="color:var(--text-muted);font-size:12px;">Years in ministry: ${a.years_in_ministry}</div>` : ''}
      ${a.verification_score !== null && a.verification_score !== undefined ? `<div style="color:#6496ff;font-size:12px;">Verification score: ${a.verification_score}/100</div>` : ''}
      ${a.statement ? `<div style="color:var(--text-sec);font-size:13px;line-height:1.6;border-left:2px solid var(--gold-border);padding-left:12px;">${a.statement}</div>` : '<div style="color:var(--warning);font-size:12px;">⚠ No statement submitted</div>'}
      ${a.certificate_url ? `<a href="${a.certificate_url}" target="_blank" style="color:var(--gold);font-size:12px;text-decoration:underline;">📎 View submitted proof document</a>` : ''}
      ${a.status==='pending'?`<div style="display:flex;gap:8px;">
        <button class="btn btn-sm" style="background:rgba(64,201,106,0.1);border:1px solid rgba(64,201,106,0.4);color:var(--success);" onclick="approveApp('${a.id}','${a.full_name}')">✓ Approve</button>
        <button class="btn btn-sm btn-danger" onclick="rejectApp('${a.id}','${a.full_name}')">✕ Reject</button>
      </div>`:''}
    </div>
  `).join('');
}

async function approveApp(id, name) {
  if (!confirm(pdTrF('approve_pastor_confirm', {name}))) return;
  try {
    await api(`/api/pastors/applications/${id}/approve`, 'PUT');
    alert(`${name} is now a verified pastor!`);
    loadAdmin();
  } catch(e) { alert(pdTr('failed_approve_application')); }
}

async function rejectApp(id, name) {
  if (!confirm(pdTrF('reject_application_confirm', {name}))) return;
  try {
    await api(`/api/pastors/applications/${id}/reject`, 'PUT', { reason: 'Application did not meet requirements' });
    loadAdmin();
  } catch(e) { alert(pdTr('failed_reject_application')); }
}

// ── Profile ──
async function loadProfile() {
  try {
    const data = await api('/api/auth/me');
    if (data?.id) {
      user = data;
      localStorage.setItem('pastor_user', JSON.stringify(user));
      document.getElementById('profile-name').textContent = user.display_name;
      document.getElementById('profile-email').textContent = user.email;
      document.getElementById('profile-avatar').textContent = (user.display_name || 'P')[0].toUpperCase();
      document.getElementById('profile-role-badge').textContent = (user.role || 'listener').toUpperCase();
      document.getElementById('prof-name').value = user.display_name || '';
      document.getElementById('prof-email').value = user.email || '';
    }
  } catch(e) {}
}

function uploadPhoto(input){
  const file=input.files[0];
  if(!file) return;
  // Validate file type and size
  if(!file.type.startsWith('image/')){showToast(pdTr('please_select_image_file'));return;}
  if(file.size > 5*1024*1024){showToast(pdTr('image_must_be_under'));return;}
  try{
    const reader=new FileReader();
    reader.onload=function(e){
      try{
        const avatar=document.getElementById('profile-avatar');
        if(avatar){
          avatar.style.backgroundImage='url('+e.target.result+')';
          avatar.style.backgroundSize='cover';
          avatar.style.backgroundPosition='center';
          avatar.textContent='';
          localStorage.setItem('pastor_avatar',e.target.result);const rb=document.getElementById('remove-photo-btn');if(rb)rb.style.display='block';
        }
        // Also upload to server
        const fd=new FormData();
        fd.append('avatar',file);
        const headers={};
        if(token) headers['Authorization']='Bearer '+token;
        fetch(API+'/api/users/avatar',{method:'POST',headers,body:fd})
          .then(r=>r.json())
          .then(d=>{if(d.avatar_url)showToast(pdTr('profile_photo_updated'));})
          .catch(()=>{showToast(pdTr('photo_saved_locally'));});
      }catch(err){console.error('Avatar display error:',err);}
    };
    reader.onerror=function(){showToast(pdTr('could_not_read_image'));};
    reader.readAsDataURL(file);
  }catch(err){
    console.error('uploadPhoto error:',err);
    showToast(pdTr('could_not_update_photo'));
  }
}

async function saveProfile() {
  try {
    const data = await api('/api/users/me', 'PUT', {
      display_name: document.getElementById('prof-name').value.trim(),
      church_name: document.getElementById('prof-church').value.trim(),
      bio: document.getElementById('prof-bio').value.trim()
    });
    if (data.id || data.message) alert(pdTr('profile_updated_successfully'));
    else alert(data.error || 'Update failed');
  } catch(e) { alert(pdTr('failed_save_profile')); }
}

async function changePassword() {
  const current = document.getElementById('cp-current').value;
  const newPwd = document.getElementById('cp-new').value;
  const confirm = document.getElementById('cp-confirm').value;
  if (!current || !newPwd || !confirm) return showAlert('cp-error', 'Please fill in all fields');
  if (newPwd.length < 8) return showAlert('cp-error', 'New password must be at least 8 characters');
  if (newPwd !== confirm) return showAlert('cp-error', 'Passwords do not match');
  try {
    const data = await api('/api/auth/change-password', 'PUT', { current_password: current, new_password: newPwd });
    if (data.message) { showAlert('cp-success', 'Password changed successfully!', 'success'); document.getElementById('cp-current').value = ''; document.getElementById('cp-new').value = ''; document.getElementById('cp-confirm').value = ''; }
    else showAlert('cp-error', data.error || 'Failed to change password');
  } catch(e) { showAlert('cp-error', 'Connection failed'); }
}

// ── Sermon View Reading Helpers ──
function vsAdjFont(btn, delta) {
  var t = document.getElementById('vs-text-content');
  if (!t) return;
  var sz = parseInt(t.style.fontSize || 16) + delta;
  sz = Math.max(12, Math.min(28, sz));
  t.style.fontSize = sz + 'px';
  t.querySelectorAll('p').forEach(function(p) { p.style.fontSize = sz + 'px'; });
}
function vsSetFont(f) {
  var t = document.getElementById('vs-text-content');
  if (!t) return;
  var ff = f === 'sans' ? 'system-ui,sans-serif' : 'Georgia,serif';
  t.style.fontFamily = ff;
  t.querySelectorAll('p').forEach(function(p) { p.style.fontFamily = ff; });
  var sansBtn = document.getElementById('vs-font-sans');
  var serifBtn = document.getElementById('vs-font-serif');
  if (sansBtn) { sansBtn.style.background = f === 'sans' ? '#D4AF37' : 'rgba(212,175,55,0.1)'; sansBtn.style.color = f === 'sans' ? '#071528' : '#D4AF37'; sansBtn.style.borderColor = f === 'sans' ? '#b8972a' : 'rgba(212,175,55,0.3)'; }
  if (serifBtn) { serifBtn.style.background = f === 'serif' ? '#D4AF37' : 'rgba(212,175,55,0.1)'; serifBtn.style.color = f === 'serif' ? '#071528' : '#D4AF37'; serifBtn.style.borderColor = f === 'serif' ? '#b8972a' : 'rgba(212,175,55,0.3)'; }
}

function vsToggleExpand(btn) {
  var w = document.getElementById('vs-reading-area');
  if (!w) return;
  var expanded = w.dataset.expanded === 'true';
  if (expanded) {
    w.style.maxWidth = 'min(650px,92vw)';
    w.dataset.expanded = 'false';
    btn.textContent = '⟺ Wider';
  } else {
    // Capped well within comfortable reading line-length, not unlimited —
    // this used to jump to 100% width, producing uncomfortably long lines.
    w.style.maxWidth = 'min(920px,94vw)';
    w.dataset.expanded = 'true';
    btn.textContent = '⟺ Narrower';
  }
}


// ── Denomination Other ──
document.getElementById('apply-denom')?.addEventListener('change', function() {
  document.getElementById('denom-other-wrap').style.display = this.value === 'Other' ? 'block' : 'none';
});

// ── Word Count ──
document.getElementById('apply-statement')?.addEventListener('input', function() {
  const count = this.value.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('word-count').textContent = `${count} words`;
  document.getElementById('word-count').style.color = count >= 100 ? 'var(--success)' : 'var(--text-muted)';
});

// ── Enter Key Login ──
document.getElementById('login-password')?.addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });

// ── Init ──
// ── Settings Functions ──
function setLang(lang, btn) {
  document.querySelectorAll('.lang-setting-btn').forEach(b => {
    b.classList.remove('active-lang');
    b.style.background = 'transparent';
    b.style.borderColor = 'var(--border)';
    b.querySelector('div').style.color = 'var(--text-sec)';
  });
  if (btn) {
    btn.classList.add('active-lang');
    btn.style.background = 'var(--gold-light)';
    btn.style.borderColor = 'var(--gold-border)';
    btn.querySelector('div').style.color = 'var(--gold)';
  }
  pdCurrentLang = lang;
  localStorage.setItem('trinitarian_pd_lang', lang);
  pdApplyTranslations(lang);
  showToast(pdTr('language_updated'));
}

function setFontSize(size) {
  const sizes = { small: 13, medium: 15, large: 17, xlarge: 20 };
  const px = sizes[size] || 15;
  localStorage.setItem('pd_font_size', px);
  const preview = document.getElementById('pd-font-preview');
  if (preview) preview.style.fontSize = px + 'px';
  document.querySelectorAll('.fs-btn').forEach(b => {
    b.style.background = 'var(--navy2)';
    b.style.color = 'var(--text-muted)';
    b.style.borderColor = 'var(--border)';
  });
  const active = document.getElementById('fs-' + size);
  if (active) { active.style.background = 'var(--gold-light)'; active.style.color = 'var(--gold)'; active.style.borderColor = 'var(--gold-border)'; }
  showToast(pdTr('font_size_updated'));
}

function setSpacing(spacing) {
  const spacings = { compact: '1.4', normal: '1.7', relaxed: '2.1' };
  const val = spacings[spacing] || '1.7';
  localStorage.setItem('pd_spacing', spacing);
  document.body.style.lineHeight = val;
  document.querySelectorAll('.sp-btn').forEach(b => { b.classList.remove('active-sp'); b.style.background = 'var(--navy2)'; });
  const active = document.getElementById('sp-' + spacing);
  if (active) { active.classList.add('active-sp'); active.style.background = 'var(--gold-light)'; }
  showToast(pdTr('spacing_updated'));
}

function setFont(font) {
  const fonts = { default: "'DM Sans',system-ui,sans-serif", serif: 'Georgia,serif', mono: 'monospace' };
  const val = fonts[font] || "'DM Sans',system-ui,sans-serif";
  localStorage.setItem('pd_font', font);
  // Update preview element
  const preview = document.getElementById('pd-font-preview');
  if (preview) preview.style.fontFamily = val;
  // Update active button state
  document.querySelectorAll('.ff-btn').forEach(b => {
    b.style.background = 'var(--navy2)';
    b.style.color = 'var(--text-muted)';
    b.style.borderColor = 'var(--border)';
  });
  const active = document.getElementById('ff-' + font);
  if (active) { active.style.background = 'var(--gold-light)'; active.style.color = 'var(--gold)'; active.style.borderColor = 'var(--gold-border)'; }
  showToast(pdTr('font_style_updated'));
}

function saveNotifPref() {
  // Find all checkboxes in the notification settings section
  const notifSection = document.getElementById('notif-settings-section') ||
                       document.querySelector('[data-section="notifications"]') ||
                       document.querySelector('.notif-settings');
  
  // Try specific IDs first, then fall back to all checkboxes in settings
  const knownKeys = ['sermons', 'live', 'stream', 'comments', 'followers', 'messages', 'inbox', 'new_sermon', 'live_stream'];
  knownKeys.forEach(k => {
    const cb = document.getElementById('notif-' + k);
    if (!cb) return;
    localStorage.setItem('pd_notif_' + k, cb.checked ? 'on' : 'off');
    updateToggleVisual(cb);
  });
  
  // Also handle any checkbox with id starting with notif-
  document.querySelectorAll('input[type="checkbox"][id^="notif-"]').forEach(cb => {
    const key = cb.id.replace('notif-', '');
    localStorage.setItem('pd_notif_' + key, cb.checked ? 'on' : 'off');
    updateToggleVisual(cb);
  });
  
  showToast(pdTr('notification_preferences_saved'));
}

function updateToggleVisual(cb) {
  const isOn = cb.checked;
  // Try knob by convention ID
  const knobId = cb.id + '-knob';
  const knob = document.getElementById(knobId);
  if (knob) knob.style.left = isOn ? '22px' : '3px';
  // Find background span via parent label
  const label = cb.closest ? cb.closest('label') : cb.parentElement;
  if (label) {
    const spans = label.querySelectorAll('span');
    if (spans[0]) spans[0].style.background = isOn ? 'var(--gold)' : '#2a3a55';
    if (spans[1] && !knob) spans[1].style.left = isOn ? '22px' : '3px';
  }
}

function loadNotifPrefs() {
  document.querySelectorAll('input[type="checkbox"][id^="notif-"]').forEach(cb => {
    const key = cb.id.replace('notif-', '');
    const isOn = localStorage.getItem('pd_notif_' + key) !== 'off';
    cb.checked = isOn;
    updateToggleVisual(cb);
  });
}

function toggleNotifSetting(type, el) {
  const key = 'pd_notif_' + type;
  const current = localStorage.getItem(key) !== 'off';
  localStorage.setItem(key, current ? 'off' : 'on');
  if (el) {
    el.textContent = current ? 'Off' : 'On';
    el.style.background = current ? 'var(--navy2)' : 'var(--gold)';
    el.style.color = current ? 'var(--text-muted)' : '#071528';
  }
  showToast(pdTr('notification_preference_saved'));
}

// ── Message Open Function ──
async function openMessage(id) {
  try {
    // Previously called /api/admin/inbox/:id, which never existed at all —
    // same broken endpoint pattern found and fixed on mobile earlier today.
    // "Sent Messages" come from /api/admin/messages (the admin's own sent
    // log), so we re-fetch that and find the matching entry client-side,
    // rather than a single-item route that was never built.
    const data = await api('/api/admin/messages');
    const messages = data?.messages || [];
    const msg = messages.find(m => String(m.id) === String(id));
    if (!msg) return showToast(pdTr('message_not_found'), 'error');
    // Show in modal
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = `<div style="background:var(--navy2);border:1px solid var(--border);border-radius:16px;padding:28px;width:100%;max-width:520px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
        <div>
          <div style="color:var(--white);font-size:16px;font-weight:700;">\${msg.subject || 'Message'}</div>
          <div style="color:var(--text-muted);font-size:12px;margin-top:4px;">To: \${msg.to_name || msg.to_email || 'User'} · \${msg.created_at ? new Date(msg.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : ''}</div>
        </div>
        <button onclick="this.closest('div[style]').remove()" style="background:transparent;border:none;color:var(--text-muted);font-size:20px;cursor:pointer;">✕</button>
      </div>
      <div style="color:var(--text-sec);font-size:14px;line-height:1.8;white-space:pre-wrap;background:#071528;padding:16px;border-radius:10px;">\${msg.body || msg.content || msg.message || 'No content'}</div>
    </div>`;
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  } catch(e) {
    showToast(pdTr('could_not_open_message'), 'error');
  }
}


// ── Function aliases to match HTML onclick calls ──
function handleChangePassword() { changePassword(); }

function acceptCookies() {
  localStorage.setItem('pd_cookies', 'accepted');
  const el = document.getElementById('cookie-banner');
  if (el) el.style.display = 'none';
}
function declineCookies() {
  const el = document.getElementById('cookie-banner');
  if (el) el.style.display = 'none';
}

async function sendInboxMessage() {
  const msg = document.getElementById('inbox-msg');
  const text = msg?.value?.trim();
  if (!text) return showToast(pdTr('please_enter_message'));
  try {
    await api('/api/admin/support', 'POST', { message: text });
    msg.value = '';
    showToast(pdTr('message_sent_successfully'));
  } catch(e) { showToast(pdTr('failed_send_message'), 'error'); }
}

async function uploadAvatar() {
  const input = document.getElementById('avatar-upload') || document.getElementById('photo-upload');
  if (!input || !input.files?.[0]) return;
  const file = input.files[0];
  const fd = new FormData();
  fd.append('avatar', file);
  try {
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API + '/api/users/avatar', { method: 'POST', headers, body: fd });
    const data = await res.json();
    if (data.avatar_url) {
      if (user) { user.avatar_url = data.avatar_url; localStorage.setItem('pastor_user', JSON.stringify(user)); }
      const img = document.getElementById('profile-avatar');
      if (img) img.src = data.avatar_url;
      showToast(pdTr('profile_photo_updated'));
    }
  } catch(e) { showToast(pdTr('failed_upload_photo'), 'error'); }
}

// Apply saved settings on load
function applyStoredSettings() {
  // Restore active button states only - don't override body/document styles
  const size = localStorage.getItem('pd_font_size');
  const sizeMap = { 13: 'small', 15: 'medium', 17: 'large', 20: 'xlarge' };
  const sizeKey = sizeMap[size] || 'medium';
  document.querySelectorAll('.fs-btn').forEach(b => { b.style.background = 'var(--navy2)'; b.style.color = 'var(--text-muted)'; b.style.borderColor = 'var(--border)'; });
  const fsActive = document.getElementById('fs-' + sizeKey);
  if (fsActive) { fsActive.style.background = 'var(--gold-light)'; fsActive.style.color = 'var(--gold)'; fsActive.style.borderColor = 'var(--gold-border)'; }

  const spacing = localStorage.getItem('pd_spacing') || 'normal';
  document.querySelectorAll('.sp-btn').forEach(b => { b.style.background = 'var(--navy2)'; b.style.color = 'var(--text-muted)'; });
  const spActive = document.getElementById('sp-' + spacing);
  if (spActive) { spActive.style.background = 'var(--gold-light)'; spActive.style.color = 'var(--gold)'; }

  const font = localStorage.getItem('pd_font') || 'default';
  document.querySelectorAll('.ff-btn').forEach(b => { b.style.background = 'var(--navy2)'; b.style.color = 'var(--text-muted)'; b.style.borderColor = 'var(--border)'; });
  const ffActive = document.getElementById('ff-' + font);
  if (ffActive) { ffActive.style.background = 'var(--gold-light)'; ffActive.style.color = 'var(--gold)'; ffActive.style.borderColor = 'var(--gold-border)'; }
}


async function init() {
  // Inject CSS fix for badge centering
  const styleEl = document.createElement('style');
  styleEl.textContent = `.status-badge { text-align:center !important; }`;
  document.head.appendChild(styleEl);
  // Apply saved language and settings immediately
  const savedLang = localStorage.getItem('trinitarian_pd_lang') || 'en';
  pdApplyTranslations(savedLang);
  applyStoredSettings();
  await loadCategories();

  // If this tab was opened via a link on the listener site, confirm any
  // existing session here actually belongs to whoever clicked that link,
  // before trusting it - otherwise a session left logged in on a shared
  // computer (e.g. Owner, forgotten) could silently be handed to a
  // different person who clicks the same link later, including access to
  // sensitive actions like Transfer Ownership.
  const urlParams = new URLSearchParams(window.location.search);
  const cameFrom = urlParams.get('from');
  if (cameFrom === 'apply' || cameFrom === 'login') {
    const expectId = urlParams.get('expect') || '';
    if (!expectId || expectId !== user?.id) {
      token = null; user = null;
      localStorage.removeItem('pastor_token');
      localStorage.removeItem('pastor_user');
      // "Pastor Login" always means sign in as an existing pastor - never
      // silently redirect that intent into the application form the way
      // an empty "apply" case does.
      showScreen(cameFrom === 'login' ? 'login' : 'apply');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    // Validation passed - this check is meant to run once, at the moment
    // this tab was opened. Leaving from/expect in the URL would mean a
    // later refresh re-validates against this same, now-stale value even
    // after someone has since legitimately logged in as someone else here.
    window.history.replaceState({}, '', window.location.pathname);
  }

  if (token && user) {
    try {
      const fresh = await api('/api/auth/me');
      if (fresh?.id) {
        user = fresh;
        localStorage.setItem('pastor_user', JSON.stringify(user));
        initDashboard();
        return;
      }
    } catch(e) {}
  }
  showScreen('login');
}

init();

// ── Download All Sermons ──
// Downloads a single sermon's actual media file (audio/video) to the
// user's device. The browser can already play these files directly, so
// they're fetchable cross-origin without extra CORS setup - fetching as a
// blob and triggering a synthetic download link is the standard way to
// force a real file save rather than a same-tab navigation, which is what
// a plain <a href> with the download attribute would otherwise risk for a
// cross-origin URL.
async function downloadSermonMedia(id, title, type, mediaUrl) {
  if (!mediaUrl) { alert(pdTr('sermon_has_no_media')); return; }
  try {
    const res = await fetch(mediaUrl);
    if (!res.ok) throw new Error('Fetch failed');
    const blob = await res.blob();
    const ext = type === 'video' ? 'mp4' : 'mp3';
    const safeName = (title || 'sermon').replace(/[^\w\- ]+/g, '').trim().slice(0, 60) || 'sermon';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${safeName}.${ext}`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert(pdTrF('could_not_download_title', {title}));
  }
}

async function downloadAllSermons() {
  try {
    const data = await api('/api/sermons/my/sermons');
    const list = Array.isArray(data) ? data : [];
    const exportable = list.filter(s => s.media_url);
    if (!exportable.length) { alert(pdTr('have_no_sermons_with')); return; }
    if (!confirm(pdTrF('download_sermons_confirm', {count: exportable.length}))) return;
    for (const s of exportable) {
      await downloadSermonMedia(s.id, s.title, s.type, s.media_url);
    }
  } catch(e) { alert(pdTr('download_failed')); }
}

// ── Search sermons ──
let allSermonsCache = [];
async function loadSermons() {
  try {
    const data = await api('/api/sermons/my/sermons');
    allSermonsCache = (Array.isArray(data) ? data : (data?.sermons || [])).sort((a,b) => new Date(b.published_at||b.created_at||0).getTime() - new Date(a.published_at||a.created_at||0).getTime());
    renderFilteredSermons(allSermonsCache);
  } catch(e) {
    const el = document.getElementById('all-sermons');
    if(el) el.innerHTML = '<p style="color:var(--text-muted);padding:20px;text-align:center;">Could not load sermons. Please refresh the page.</p>';
  }
}
function filterSermons() {
  const q = document.getElementById('sermon-search').value.toLowerCase();
  document.getElementById('sermon-search-clear').style.display = q ? 'block' : 'none';
  renderFilteredSermons(q ? allSermonsCache.filter(s => s.title.toLowerCase().includes(q)) : allSermonsCache);
}
function clearSermonSearch() { document.getElementById('sermon-search').value=''; document.getElementById('sermon-search-clear').style.display='none'; renderFilteredSermons(allSermonsCache); }
function renderFilteredSermons(list) { renderSermonList(list, 'all-sermons'); }

// ── Inbox ──
function showInboxTab(tab, btn) {
  document.querySelectorAll('#inbox-tabs .btn').forEach(b => { b.className = 'btn btn-ghost btn-sm'; });
  if (btn) btn.className = 'btn btn-gold btn-sm';
  document.getElementById('inbox-list').style.display = tab === 'notifications' ? 'block' : 'none';
  document.getElementById('support-list').style.display = tab === 'support' ? 'block' : 'none';
  const supportSendEl = document.getElementById('support-send-section');
  if (supportSendEl) supportSendEl.style.display = tab === 'support' ? 'block' : 'none';
  const reportsEl = document.getElementById('reports-list');
  const flaggedEl = document.getElementById('flagged-list');
  const escEl = document.getElementById('escalations-list');
  const modEscEl = document.getElementById('mod-escalate-panel');
  if (reportsEl) reportsEl.style.display = tab === 'reports' ? 'block' : 'none';
  if (flaggedEl) flaggedEl.style.display = tab === 'flagged' ? 'block' : 'none';
  if (escEl) escEl.style.display = tab === 'escalations' ? 'block' : 'none';
  if (modEscEl) modEscEl.style.display = tab === 'mod-escalate' ? 'block' : 'none';
  if (tab === 'support') loadSupportMessages();
  if (tab === 'reports') loadReports();
  if (tab === 'flagged') loadReports();
  if (tab === 'escalations') loadAdminEscalations();
  if (tab === 'mod-escalate') showEscalationPanel();
}

async function loadSupportMessages() {
  const el = document.getElementById('support-list');
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading…</div>';
  try {
    const data = await api('/api/admin/support');
    const msgs = data?.messages || [];
    const disclaimer = '';
    if (!msgs.length) {
      el.innerHTML = disclaimer + '<div style="padding:30px;text-align:center;color:var(--text-muted);" data-i18n="no_support">No support messages yet</div>';
      return;
    }
    el.innerHTML = disclaimer + '<div>' + msgs.map(m => `
      <div onclick="markSupportRead('${m.id}',this)" style="display:flex;gap:12px;padding:14px 20px;border-bottom:1px solid var(--border);cursor:pointer;background:${m.is_read ? 'transparent' : 'rgba(212,175,55,0.03)'}">
        <div style="font-size:20px;flex-shrink:0;">📩</div>
        <div style="flex:1;">
          <div style="color:${m.is_read ? 'var(--text-sec)' : 'var(--white)'};font-weight:${m.is_read ? '400' : '600'};font-size:14px;margin-bottom:2px;">${m.display_name || m.email || 'Listener'}</div>
          <div style="color:var(--gold);font-size:12px;margin-bottom:4px;">${m.subject || 'Support Request'}</div>
          <div style="color:var(--text-muted);font-size:13px;line-height:1.5;">${m.body}</div>
          <div style="color:var(--text-muted);font-size:11px;margin-top:4px;">${new Date(m.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
        </div>
        ${!m.is_read ? '<div style="width:8px;height:8px;border-radius:4px;background:var(--gold);flex-shrink:0;margin-top:4px;"></div>' : ''}
      </div>
    `).join('');
  } catch(e) {
    el.innerHTML = '<div style="padding:20px;color:var(--text-muted);" data-i18n="could_not_support">Could not load support messages</div>';
  }
}

async function markSupportRead(id, row) {
  try {
    await api('/api/admin/support/' + id + '/read', 'PUT');
    row.style.background = 'transparent';
    const dot = row.querySelector('[style*="border-radius:4px"]');
    if (dot) dot.remove();
    const name = row.querySelector('div[style*="font-weight"]');
    if (name) { name.style.fontWeight = '400'; name.style.color = 'var(--text-sec)'; }
  } catch(e) {}
}

async function loadInbox() {
  try {
    // Load notifications, admin messages and support messages
    const [notifData, msgData, supportData] = await Promise.all([
      api('/api/notifications'),
      ['admin', 'moderator', 'owner'].includes(user?.role) ? api('/api/admin/messages') : Promise.resolve({messages:[]}),
      ['admin', 'moderator', 'owner'].includes(user?.role) ? api('/api/admin/support') : Promise.resolve({messages:[]})
    ]);
    const notifs = notifData?.notifications || [];
    const msgs = msgData?.messages || [];
    const supportMsgs = supportData?.messages || [];
    const el = document.getElementById('inbox-list');
    const ICONS = { new_sermon:'🎧', live_stream:'📡', admin_message:'📬', follow:'👤', application_update:'🛡️', report:'⚑' };
    if (!notifs.length && !msgs.length && !supportMsgs.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><h3 data-i18n="no_messages">No messages yet</h3></div>';
      return;
    }
    
    // Show support messages (from listeners/pastors) if admin
    let html = '';
    if (supportMsgs.length) {
      html += '<div style="color:#D4AF37;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;padding:0 4px;">Messages from Users</div>';
      html += supportMsgs.map(m => `
        <div class="notif-item ${!m.is_read?'notif-unread':''}" onclick="openSupportMessage('${m.id}')" style="cursor:pointer;">
          <div style="font-size:20px;flex-shrink:0;">💬</div>
          <div style="flex:1;">
            <div style="color:#e8e8e8;font-size:14px;font-weight:600;">${m.subject||'Support Request'} ${!m.is_read?'<span style=\"background:#e05555;color:#fff;font-size:9px;padding:2px 6px;border-radius:10px;margin-left:6px;\">NEW</span>':''}</div>
            <div style="color:#8fa3c0;font-size:12px;">From: ${m.display_name||m.email||'Listener'} · ${new Date(m.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
          </div>
        </div>`).join('');
      if (msgs.length || notifs.length) html += '<div style="height:1px;background:rgba(212,175,55,0.1);margin:16px 0;"></div>';
    }
    
    // Show admin messages section if any
    if (msgs.length) {
      html += '<div style="color:#D4AF37;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;padding:0 4px;">Sent Messages</div>';
      html += msgs.map(m => `
        <div class="notif-item" onclick="openMessage('${m.id}')" style="cursor:pointer;">
          <div style="font-size:20px;flex-shrink:0;">📬</div>
          <div style="flex:1;">
            <div style="color:#e8e8e8;font-size:14px;font-weight:600;">${m.subject||'Message'}</div>
            <div style="color:#8fa3c0;font-size:12px;">To: ${m.to_name||m.to_email||'User'} · ${new Date(m.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
          </div>
        </div>`).join('');
      if (notifs.length) html += '<div style="height:1px;background:rgba(212,175,55,0.1);margin:16px 0;"></div>';
    }
    
    if (!notifs.length && !msgs.length) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><h3>No messages yet</h3></div>'; return; }
    el.innerHTML = html + notifs.map(n => {
      let nData = null; try { nData = typeof n.data === 'string' ? JSON.parse(n.data) : n.data; } catch(e) {}
      const nSermonId = nData?.sermon_id || nData?.id || null;
      const nHasSermon = nSermonId && n.type === 'new_sermon';
      const nIsLiveStream = n.type === 'live_stream';
      const nIsMessage = n.type === 'admin_message';
      const nTimestamp = n.created_at ? new Date(n.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
      // Previously every new_sermon notification showed the same fixed icon
      // regardless of the sermon's actual type.
      let nIcon = ICONS[n.type] || '🔔';
      if (n.type === 'new_sermon' && nData?.sermon_type) {
        nIcon = { video:'🎬', audio:'🎧', text:'📄', article:'📰' }[nData.sermon_type] || nIcon;
      }
      return `
      <div class="notif-item ${!n.is_read?'notif-unread':''}" onclick="markRead('${n.id}')">
        <div class="notif-icon">${nIcon}</div>
        <div style="flex:1;">
          <div style="color:${n.is_read?'var(--text-sec)':'var(--white)'};font-size:14px;font-weight:${n.is_read?'400':'600'};margin-bottom:3px;">${n.title}</div>
          ${n.body?`<div style="color:var(--text-muted);font-size:13px;margin-bottom:6px;">${n.body}</div>`:''}
          ${nTimestamp?`<div style="color:#c3d4e8;font-size:11px;margin-bottom:6px;">${nTimestamp}</div>`:''}
          ${nHasSermon ? `<button onclick="event.stopPropagation();viewSermon('${nSermonId}')" style="background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.3);color:#D4AF37;border-radius:10px;padding:4px 12px;font-size:12px;cursor:pointer;">🎧 Open Sermon</button>` : ''}
          ${nIsLiveStream ? `<button onclick="event.stopPropagation();showPage('live')" style="background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.3);color:#D4AF37;border-radius:10px;padding:4px 12px;font-size:12px;cursor:pointer;">📡 View Live</button>` : ''}
          ${nIsMessage ? `<button onclick="event.stopPropagation();showPage('inbox')" style="background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.3);color:#D4AF37;border-radius:10px;padding:4px 12px;font-size:12px;cursor:pointer;">📬 View Message</button>` : ''}
        </div>
        ${!n.is_read?'<div class="notif-dot"></div>':''}
      </div>`;
    }).join('');
  } catch(e) { console.error('Inbox load error', e); }
}

function _unused_select_fragment() { return ''
    +'</select>'
    +'<div id="role-err-inner" style="display:none;color:#e05555;font-size:13px;margin-bottom:12px;"></div>'
    +'<div style="display:flex;gap:10px;">'
    +'<button id="role-save-inner" class="btn btn-gold" style="flex:1;" data-i18n="save">Save</button>'
    +'<button id="role-cancel-inner" class="btn btn-ghost" style="flex:1;" data-i18n="cancel">Cancel</button>'
    +'</div>';
  modal.appendChild(inner);
  document.body.appendChild(modal);
  inner.querySelector('#role-cancel-inner').onclick=function(){modal.remove();};
  modal.onclick=function(e){if(e.target===modal)modal.remove();};
  inner.querySelector('#role-save-inner').onclick=async function(){
    const newRole=inner.querySelector('#role-select-inner').value;
    if(newRole===currentRole){modal.remove();return;}
    try{
      await api('/api/admin/users/'+id+'/role','PUT',{role:newRole});
      showToast(name+' is now '+newRole);
      modal.remove();
      loadUsers();
    }catch(e){
      const err=inner.querySelector('#role-err-inner');
      err.textContent=e.message||'Failed to update role';
      err.style.display='block';
    }
  };
}


function removePhoto(){
  const avatar=document.getElementById('profile-avatar');
  const btn=document.getElementById('remove-photo-btn');
  if(avatar){
    avatar.style.backgroundImage='';
    avatar.style.backgroundSize='';
    avatar.style.backgroundPosition='';
    avatar.textContent=(user?.display_name||'P')[0].toUpperCase();
  }
  localStorage.removeItem('pastor_avatar');
  if(btn)btn.style.display='none';
  // Remove from server
  const headers={'Content-Type':'application/json'};
  if(token)headers['Authorization']='Bearer '+token;
  fetch(API+'/api/users/profile',{method:'PUT',headers,body:JSON.stringify({avatar_url:null})})
    .then(()=>showToast(pdTr('profile_photo_removed')))
    .catch(()=>{});
}


async function loadAdminEscalations(){
  const content=document.getElementById('escalations-list');
  if(!content)return;
  content.innerHTML='<div style="color:var(--text-muted);padding:20px;" data-i18n="loading_escalations">Loading escalations...</div>';
  try{
    const data=await api('/api/admin/escalations');
    const list=data.escalations||[];
    if(!list.length){content.innerHTML='<p style="color:var(--text-muted);padding:20px;" data-i18n="no_escalations">No escalations yet.</p>';return;}
    content.innerHTML='<div style="max-width:700px;">'+list.map(function(e){return `
      <div style="background:var(--navy2);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <div>
            <span style="color:var(--white);font-size:14px;font-weight:500;">${e.subject}</span>
            <span style="color:var(--text-muted);font-size:12px;margin-left:10px;">${e.type||''}</span>
          </div>
          <span style="padding:3px 10px;border-radius:10px;font-size:11px;background:${e.status==='resolved'?'rgba(64,201,106,0.15)':'rgba(212,175,55,0.15)'};color:${e.status==='resolved'?'#40c96a':'#D4AF37'};">${e.status}</span>
        </div>
        <p style="color:var(--text-muted);font-size:12px;margin:0 0 8px;">From: ${e.moderator_name||'Moderator'} · ${new Date(e.created_at).toLocaleDateString()}</p>
        <p style="color:#b0c4d8;font-size:13px;margin:0 0 12px;">${e.description}</p>
        ${e.reference_id?`<p style="color:var(--text-muted);font-size:12px;">Reference: ${e.reference_id}</p>`:''}
        ${e.status==='pending'?`
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
          <textarea id="esc-response-${e.id}" class="form-control" rows="3" placeholder="Your response..." style="margin-bottom:8px;"></textarea>
          <div style="display:flex;gap:8px;">
            <button onclick="respondToEscalation('${e.id}','resolved')" class="btn btn-gold btn-sm">✓ Resolve</button>
            <button onclick="respondToEscalation('${e.id}','actioned')" class="btn btn-ghost btn-sm">⚡ Action Taken</button>
          </div>
        </div>`:`<p style="color:#b0c4d8;font-size:13px;margin-top:8px;padding:8px;background:rgba(212,175,55,0.05);border-radius:8px;border-left:3px solid #D4AF37;"><strong>Admin response:</strong> ${e.admin_response||''}</p>`}
      </div>`;}).join('')+'</div>';
  }catch(e){content.innerHTML='<p style="color:var(--error);padding:20px;">Failed to load escalations: '+e.message+'</p>';}
}

async function respondToEscalation(id,status){
  const response=document.getElementById('esc-response-'+id)?.value.trim();
  if(!response){alert(pdTr('please_enter_response'));return;}
  try{
    await api('/api/admin/escalations/'+id,'PUT',{response,status});
    showToast(pdTr('response_sent_moderator'));
    loadAdminEscalations();
  }catch(e){alert('Failed to respond: '+e.message);}
}


async function loadEscalations(){
  const wrap=document.getElementById('escalations-list-wrap');
  if(!wrap)return;
  try{
    const data=await api('/api/admin/escalations/mine');
    const list=data.escalations||[];
    if(!list.length){wrap.innerHTML='<p style="color:var(--text-muted);font-size:13px;" data-i18n="no_prev_escalations">No previous escalations.</p>';return;}
    wrap.innerHTML='<h3 style="color:var(--white);font-size:15px;margin-bottom:12px;" data-i18n="prev_escalations">Your Previous Escalations</h3>'
      +list.map(function(e){return `<div style="background:var(--navy2);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="color:var(--white);font-size:14px;">${e.subject}</span>
          <span style="padding:3px 10px;border-radius:10px;font-size:11px;background:${e.status==='resolved'?'rgba(64,201,106,0.15)':'rgba(212,175,55,0.15)'};color:${e.status==='resolved'?'#40c96a':'#D4AF37'};">${e.status}</span>
        </div>
        ${e.admin_response?`<p style="color:#b0c4d8;font-size:13px;margin:8px 0 0;padding:8px;background:rgba(212,175,55,0.05);border-radius:8px;border-left:3px solid #D4AF37;"><strong>Admin:</strong> ${e.admin_response}</p>`:''}
      </div>`;}).join('');
  }catch(e){wrap.innerHTML='';}
}

function showEscalationPanel(){
  const content=document.getElementById('mod-escalate-panel');
  if(!content)return;
  const escalatesTo=user?.role==='admin'?'Owner':'Admin';
  content.innerHTML=`<div style="max-width:720px;">
    <div id="escalations-list-wrap" style="margin-bottom:24px;"></div>
    <div class="card">
      <h3 style="color:var(--white);font-size:15px;margin-bottom:16px;">New Escalation to ${escalatesTo}</h3>
      <div class="alert alert-error" id="escalation-error"></div>
      <div class="alert alert-success" id="escalation-success"></div>
      <div class="form-group">
        <label class="form-label" data-i18n="type">Type</label>
        <select id="esc-type" class="form-control">
          <option value="user_conduct">User Conduct</option>
          <option value="content_violation">Content Violation</option>
          <option value="technical">Technical Issue</option>
          <option value="policy">Policy Question</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" data-i18n="subject">Subject</label>
        <input type="text" id="esc-subject" class="form-control" placeholder="Brief summary" style="padding:14px 16px;font-size:15px;height:auto;"/>
      </div>
      <div class="form-group">
        <label class="form-label" data-i18n="description">Description</label>
        <textarea id="esc-description" class="form-control" rows="10" placeholder="Describe the issue in detail..." style="padding:14px 16px;font-size:15px;min-height:220px;line-height:1.6;resize:vertical;"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Reference ID (optional)</label>
        <input type="text" id="esc-reference" class="form-control" placeholder="User ID, Sermon ID, etc."/>
      </div>
      <button class="btn btn-gold" onclick="submitEscalation()">⬆ Submit Escalation</button>
    </div>
  </div>`;
  loadEscalations();
}

async function submitEscalation(){
  const subject=document.getElementById('esc-subject')?.value.trim();
  const description=document.getElementById('esc-description')?.value.trim();
  const type=document.getElementById('esc-type')?.value;
  const reference=document.getElementById('esc-reference')?.value.trim();
  if(!subject||!description){showAlert('escalation-error','Please fill in subject and description');return;}
  const btn=event&&event.target?event.target:null;
  if(btn){btn.disabled=true;btn.textContent='Submitting...';}
  try{
    await api('/api/admin/escalate','POST',{subject,description,type,reference_id:reference||null});
    showToast(`✅ Escalation submitted. ${user?.role==='admin'?'Owner':'Admin'} has been notified.`);
    document.getElementById('esc-subject').value='';
    document.getElementById('esc-description').value='';
    if(document.getElementById('esc-reference'))document.getElementById('esc-reference').value='';
    loadEscalations();
  }catch(e){showToast(e.message||'Failed to submit escalation','error');}
  finally{if(btn){btn.disabled=false;btn.textContent='⬆ Submit Escalation';}}
}


async function loadReports(){
  const content=document.getElementById('reports-list');
  if(!content)return;
  content.innerHTML='<div style="color:var(--text-muted);padding:20px;" data-i18n="loading_reports">Loading reports...</div>';
  try{
    const data=await api('/api/admin/reports');
    const list=Array.isArray(data)?data:(data.reports||[]);
    if(!list.length){
      content.innerHTML='<div class="empty-state"><div class="empty-icon">⚑</div><h3 data-i18n="no_reports">No reports</h3><p data-i18n="no_content_reported">No content has been reported yet.</p></div>';
      return;
    }
    content.innerHTML='<div>'+list.map(function(r){return `
      <div style="background:var(--navy2);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <div>
            <span style="color:var(--white);font-size:14px;font-weight:500;">${r.reason||'Reported content'}</span>
            <span style="color:var(--text-muted);font-size:12px;margin-left:8px;">${r.content_type||'sermon'}</span>
          </div>
          <span style="padding:3px 10px;border-radius:10px;font-size:11px;background:${r.resolved?'rgba(64,201,106,0.15)':'rgba(224,85,85,0.15)'};color:${r.resolved?'#40c96a':'#e05555'};">${r.resolved?'Resolved':'Pending'}</span>
        </div>
        <p style="color:var(--text-muted);font-size:12px;margin:0 0 8px;">Reported by: ${r.reporter_name||'User'} · ${new Date(r.created_at).toLocaleDateString()}</p>
        ${r.description?`<p style="color:#b0c4d8;font-size:13px;margin:0 0 12px;">${r.description}</p>`:''}
        ${!r.resolved?`<div style="display:flex;gap:8px;">
          <button onclick="resolveReport('${r.id}')" class="btn btn-gold btn-sm">✓ Resolve</button>
          ${r.sermon_id?`<button onclick="removeReportedContent('${r.sermon_id}')" class="btn btn-sm" style="background:rgba(224,85,85,0.1);border:1px solid rgba(224,85,85,0.3);color:#e05555;">🗑 Remove Content</button>`:''}
        </div>`:''}
      </div>`;}).join('')+'</div>';
  }catch(e){
    content.innerHTML='<p style="color:var(--error);padding:20px;">Failed to load reports: '+e.message+'</p>';
  }
}

async function resolveReport(id){
  try{
    await api('/api/admin/reports/'+id+'/resolve','PUT',{});
    showToast(pdTr('report_resolved'));
    loadReports();
  }catch(e){alert('Failed to resolve: '+e.message);}
}

async function removeReportedContent(sermonId){
  if(!confirm(pdTr('remove_sermon_permanently')))return;
  try{
    await api('/api/sermons/'+sermonId,'DELETE');
    showToast(pdTr('content_removed'));
    loadReports();
  }catch(e){alert('Failed to remove: '+e.message);}
}


function showToast(msg, type){
  const t=document.createElement('div');
  t.textContent=msg;
  t.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:'+(type==='error'?'#e05555':'#1a3a5c')+';color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;z-index:99999;border:1px solid '+(type==='error'?'rgba(224,85,85,0.5)':'rgba(212,175,55,0.3)')+';white-space:nowrap;';
  document.body.appendChild(t);
  setTimeout(function(){t.style.opacity='0';t.style.transition='opacity 0.3s';setTimeout(function(){t.remove();},300);},2500);
}


let _recognition = null;
let _transcribing = false;
let _userStoppedDictation = false;

function toggleTranscription(){
  const btn=document.getElementById('transcribe-btn');
  const status=document.getElementById('transcribe-status');
  // Check browser support
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){
    if(status)status.textContent='Dictation not supported in this browser. Please use Chrome or Edge.';
    if(btn)btn.disabled=true;
    return;
  }
  if(_transcribing){
    // Stop
    _userStoppedDictation=true;
    if(_recognition)_recognition.stop();
    return;
  }
  // Start
  _userStoppedDictation=false;
  _recognition = new SR();
  _recognition.continuous = true;
  _recognition.interimResults = true;
  // Previously only handled en/fr/pt — every other one of the 14 languages
  // this platform supports silently fell back to English recognition, which
  // would badly mangle speech in a different language rather than just
  // being imprecise. Honest caveat: Chrome's underlying speech engine has
  // uneven real-world support across languages — major world languages
  // (fr/pt/es/de/it/zh/hi/ar) are generally solid, but some African
  // languages (ig/yo/ha/tw/zu) may still have limited accuracy regardless
  // of the correct tag being set, since that's a limitation of Chrome's
  // engine itself, not something fixable from our side.
  const sermonLang = document.getElementById('up-lang')?.value || 'en';
  const langMap = {
    en: 'en-US', fr: 'fr-FR', ig: 'ig-NG', yo: 'yo-NG', ha: 'ha-NG',
    pt: 'pt-PT', tw: 'ak-GH', zu: 'zu-ZA', ar: 'ar-SA', zh: 'zh-CN',
    hi: 'hi-IN', es: 'es-ES', de: 'de-DE', it: 'it-IT'
  };
  _recognition.lang = langMap[sermonLang] || 'en-US';
  const textarea=document.getElementById('up-transcript');
  let baseText = textarea.value ? textarea.value + ' ' : '';

  _recognition.onstart=function(){
    _transcribing=true;
    if(btn){btn.textContent='⏹ Stop Dictation';btn.style.background='rgba(224,85,85,0.2)';btn.style.color='#e05555';btn.style.border='1px solid rgba(224,85,85,0.5)';}
    if(status){
      status.innerHTML='<span style="display:inline-flex;align-items:center;gap:8px;"><span style="width:10px;height:10px;background:#e05555;border-radius:50%;display:inline-block;animation:pulse 1s infinite;"></span> Recording — speak clearly into your microphone</span>';
      status.style.color='#e05555';
      status.style.background='rgba(224,85,85,0.08)';
      status.style.border='1px solid rgba(224,85,85,0.2)';
      status.style.borderRadius='8px';
      status.style.padding='8px 12px';
    }
  };
  _recognition.onresult=function(e){
    let finalText='';
    let interim='';
    for(let i=e.resultIndex;i<e.results.length;i++){
      const t=e.results[i][0].transcript;
      if(e.results[i].isFinal){finalText+=t+' ';}
      else{interim+=t;}
    }
    if(finalText){baseText+=finalText;}
    const ta=document.getElementById('up-transcript');
    if(ta){ta.value=baseText+interim;ta.scrollTop=ta.scrollHeight;}
  };
  _recognition.onerror=function(e){
    // Fatal errors (permission denied, no microphone, etc.) must NOT
    // auto-restart — that would just fail again immediately in a loop.
    // Only transient issues (network hiccups, brief no-speech timeouts)
    // should be allowed to auto-restart via onend below.
    if(['not-allowed','service-not-allowed','audio-capture'].includes(e.error)){
      _userStoppedDictation=true;
    }
    if(status)status.textContent='Dictation error: '+e.error+(e.error==='not-allowed'?' (please allow microphone access)':'');
  };
  _recognition.onend=function(){
    // Chrome's SpeechRecognition can silently end on its own even with
    // continuous=true — after a brief silence, or a hiccup reaching its
    // cloud speech service — which is exactly what "stops after ~2 seconds"
    // was. Previously any end was treated as the user wanting to stop.
    // Now: only actually stop if the user explicitly clicked Stop; otherwise
    // restart automatically so dictation keeps going seamlessly.
    if(!_userStoppedDictation){
      try{_recognition.start();return;}catch(e){}
    }
    const wasTranscribing=_transcribing;
    _transcribing=false;
    _recognition=null; // Reset so a new instance is created on next start
    if(btn){btn.textContent='🎙 Start Dictation';btn.style.color='';btn.style.background='';btn.style.border='';}
    if(status&&wasTranscribing){status.innerHTML='✅ Dictation stopped. Review and edit the text below.';status.style.color='#40c96a';status.style.background='rgba(64,201,106,0.08)';status.style.border='1px solid rgba(64,201,106,0.2)';}
    else if(status&&!wasTranscribing){status.innerHTML='';status.style.background='';status.style.border='';}
    // Keep whatever was captured
    const textarea=document.getElementById('up-transcript');
    if(textarea)textarea.value=textarea.value.trim();
  };
  try{_recognition.start();}
  catch(e){if(status)status.textContent='Could not start dictation. Please try again.';}
}



// ═══════════════════════════════════════════════════════
// LIVE STREAMING — Agora.io Integration
// SET LIVE_ENABLED = true WHEN READY TO LAUNCH
// ═══════════════════════════════════════════════════════
const LIVE_ENABLED = true;
const AGORA_APP_ID = '87a5424b14e84e75b9569a80ea053929';
let agoraClient = null;
let localAudioTrack = null;
let localVideoTrack = null;
let currentFacingMode = 'user';
let currentStreamId = null;
let liveStartTime = null;
let liveTimerInterval = null;
let viewerCountInterval = null;
let audioMuted = false;
let videoMuted = false;

// Switches between front and rear camera during an active broadcast.
// createMicrophoneAndCameraTracks() (the original combined helper) has no
// facingMode control, so the video track is created separately and can be
// swapped out for a new one with the opposite facingMode.
async function switchCamera() {
  if (!agoraClient || !localVideoTrack) {
    showToast(pdTr('not_currently_live'), 'error');
    return;
  }
  try {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    const newVideoTrack = await AgoraRTC.createCameraVideoTrack({ facingMode: newFacingMode, encoderConfig: '720p_1' });

    await agoraClient.unpublish([localVideoTrack]);
    localVideoTrack.stop();
    localVideoTrack.close();

    localVideoTrack = newVideoTrack;
    currentFacingMode = newFacingMode;
    await agoraClient.publish([localVideoTrack]);
    localVideoTrack.play('local-video-container');

    showToast(newFacingMode === 'user' ? 'Switched to front camera' : 'Switched to rear camera', 'success');
  } catch(e) {
    console.error('Switch camera error:', e);
    showToast(pdTr('could_not_switch_camera'), 'error');
  }
}

// ── LIVE STREAM (Agora) ──────────────────────────────────────────────────────
// LIVE_ENABLED already declared above
// AGORA_APP_ID already declared above
// agoraClient, localVideoTrack, localAudioTrack already declared above
let isStreaming = false, isMicOn = true, isCamOn = true, isStartingStream = false;
let streamDurationTimer = null, streamSeconds = 0, currentChannelName = null;
let viewerPollInterval = null;

function initLivePage() {
  const enabled = typeof LIVE_ENABLED !== 'undefined' && LIVE_ENABLED;
  document.getElementById('live-coming-soon').style.display = enabled ? 'none' : 'block';
  document.getElementById('live-studio').style.display = enabled ? 'block' : 'none';
  if (enabled) { loadPastStreams(); loadUpcomingStreams(); checkAndShowProBanner(); }
}

async function checkAndShowProBanner() {
  const studio = document.getElementById('live-studio');
  if (!studio) return;
  const existing = document.getElementById('pro-required-banner');
  if (existing) existing.remove();
  try {
    const token = localStorage.getItem('pastor_token');
    const res = await fetch(API + '/api/pro/status', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await res.json();
    if (data?.is_pro) return;
    const benefits = [
      { icon: '📡', title: 'Live Streaming', desc: 'Go live and broadcast to your congregation in real time' },
      { icon: '🚫', title: 'Ad-Free Experience', desc: 'Enjoy sermons without interruptions' },
      { icon: '🎧', title: 'High Quality Audio', desc: 'Stream in crystal clear HD audio' },
      { icon: '🔔', title: 'Priority Notifications', desc: 'Never miss a live stream from your pastors' },
    ];
    const banner = document.createElement('div');
    banner.id = 'pro-required-banner';
    banner.style.cssText = 'background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:20px;margin-bottom:16px;';
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <span style="font-size:24px;">👑</span>
        <div>
          <div style="color:#D4AF37;font-weight:700;font-size:15px;margin-bottom:2px;">Live Streaming is a Pro Feature</div>
          <div style="color:#8fa3c0;font-size:13px;">Upgrade to Trinitarian Premium to unlock everything below.</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;">
        ${benefits.map(b => `
          <div style="display:flex;gap:8px;align-items:flex-start;background:rgba(0,0,0,0.15);border-radius:8px;padding:10px 12px;">
            <span style="font-size:16px;">${b.icon}</span>
            <div>
              <div style="color:#fff;font-size:12px;font-weight:600;">${b.title}</div>
              <div style="color:#8fa3c0;font-size:11px;line-height:1.4;">${b.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    studio.insertBefore(banner, studio.firstChild);
  } catch (e) {}
}

function showButtonHints() {
  ['hint-mic', 'hint-cam', 'hint-switch-cam'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.transition = 'none';
    el.style.opacity = '1';
    // Force a reflow so the browser registers opacity:1 before we re-enable
    // the transition and fade back to 0 - without this the fade-out would
    // sometimes skip straight to invisible with no visible transition.
    void el.offsetWidth;
    el.style.transition = 'opacity 0.6s';
    setTimeout(() => { el.style.opacity = '0'; }, 4000);
  });
}

function setStartCamera(direction) {
  // Reuses the same currentFacingMode variable already used by the
  // camera-switch feature and the go-live track creation itself - just
  // letting the UI set it before going live instead of always defaulting
  // to front.
  currentFacingMode = direction === 'rear' ? 'environment' : 'user';
  document.getElementById('btn-cam-front').style.background = direction === 'front' ? 'var(--gold)' : 'var(--navy3)';
  document.getElementById('btn-cam-front').style.color = direction === 'front' ? 'var(--navy)' : '#fff';
  document.getElementById('btn-cam-front').style.borderColor = direction === 'front' ? 'var(--gold)' : 'var(--border)';
  document.getElementById('btn-cam-rear').style.background = direction === 'rear' ? 'var(--gold)' : 'var(--navy3)';
  document.getElementById('btn-cam-rear').style.color = direction === 'rear' ? 'var(--navy)' : '#fff';
  document.getElementById('btn-cam-rear').style.borderColor = direction === 'rear' ? 'var(--gold)' : 'var(--border)';
}

let liveMode = 'now';
function setLiveMode(mode) {
  liveMode = mode;
  document.getElementById('btn-mode-now').style.background = mode === 'now' ? 'var(--gold)' : 'var(--navy3)';
  document.getElementById('btn-mode-now').style.color = mode === 'now' ? 'var(--navy)' : '#fff';
  document.getElementById('btn-mode-now').style.borderColor = mode === 'now' ? 'var(--gold)' : 'var(--border)';
  document.getElementById('btn-mode-schedule').style.background = mode === 'schedule' ? 'var(--gold)' : 'var(--navy3)';
  document.getElementById('btn-mode-schedule').style.color = mode === 'schedule' ? 'var(--navy)' : '#fff';
  document.getElementById('btn-mode-schedule').style.borderColor = mode === 'schedule' ? 'var(--gold)' : 'var(--border)';
  document.getElementById('live-camera-choice-row').style.display = mode === 'now' ? 'block' : 'none';
  document.getElementById('live-schedule-row').style.display = mode === 'schedule' ? 'block' : 'none';
  document.getElementById('btn-start-stream').style.display = mode === 'now' ? 'block' : 'none';
  document.getElementById('btn-schedule-stream').style.display = mode === 'schedule' ? 'block' : 'none';
  if (mode === 'schedule' && !document.getElementById('live-schedule-datetime').value) {
    const inOneHour = new Date(Date.now() + 60*60*1000);
    inOneHour.setMinutes(0, 0, 0);
    const pad = n => String(n).padStart(2,'0');
    document.getElementById('live-schedule-datetime').value =
      inOneHour.getFullYear() + '-' + pad(inOneHour.getMonth()+1) + '-' + pad(inOneHour.getDate()) + 'T' + pad(inOneHour.getHours()) + ':' + pad(inOneHour.getMinutes());
  }
}

async function scheduleStreamWeb() {
  const title = (document.getElementById('live-title').value||'').trim();
  if (!title) { showToast(pdTr('please_enter_stream_title')); return; }
  const dtValue = document.getElementById('live-schedule-datetime').value;
  if (!dtValue) { showToast(pdTr('please_choose_when_stream')); return; }
  const scheduledDate = new Date(dtValue);
  if (scheduledDate.getTime() < Date.now()) { showToast(pdTr('please_pick_time_future')); return; }
  const token = localStorage.getItem('pastor_token');
  try {
    const res = await fetch(API + '/api/streams', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body: JSON.stringify({
        title,
        category: document.getElementById('live-category')?.value || null,
        description: document.getElementById('live-language')?.value || null,
        scheduled_at: scheduledDate.toISOString(),
      })
    });
    const stream = await res.json();
    if (!res.ok) throw new Error(stream.error || 'Failed to schedule stream');
    showToast(pdTr('stream_scheduled') + scheduledDate.toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}));
    document.getElementById('live-title').value = '';
    document.getElementById('live-schedule-datetime').value = '';
    loadUpcomingStreams();
  } catch(e) {
    showToast(e.message || 'Could not schedule stream', 'error');
  }
}

function updateNetworkIndicator(quality) {
  const el = document.getElementById('live-network-indicator');
  if (!el) return;
  const map = {
    0: { label: 'Checking…', color: '#8fa3c0' },
    1: { label: 'Excellent connection', color: '#40c96a' },
    2: { label: 'Good connection', color: '#40c96a' },
    3: { label: 'Fair connection', color: '#D4AF37' },
    4: { label: 'Poor connection', color: '#e05555' },
    5: { label: 'Very poor connection', color: '#e05555' },
    6: { label: 'Connection lost', color: '#e05555' },
  };
  const info = map[quality] || map[0];
  el.textContent = '📶 ' + info.label;
  el.style.color = info.color;
  el.style.display = 'block';
}

async function startLiveStream(existingStreamId, existingTitle) {
  if (!LIVE_ENABLED) { showToast(pdTr('live_streaming_launching_soon'), 'info'); return; }
  // Previously isStreaming only got set to true after the entire async
  // publish chain succeeded — nothing blocked a second click while the
  // first attempt was still in flight. That let two full attempts run in
  // parallel, each creating and trying to publish its own video track to
  // the same client, causing CAN_NOT_PUBLISH_MULTIPLE_VIDEO_TRACKS.
  if (isStartingStream || isStreaming) { showToast(pdTr('already_going_live_please'), 'info'); return; }
  isStartingStream = true;
  // Defensive cleanup - if a previous attempt failed partway through and
  // left a client or tracks behind, agoraClient would just get overwritten
  // below without ever properly closing them, potentially leaving an
  // orphaned publish active on Agora's side even after our local
  // reference moves on.
  try {
    if (localVideoTrack) { localVideoTrack.close(); localVideoTrack = null; }
    if (localAudioTrack) { localAudioTrack.close(); localAudioTrack = null; }
    if (agoraClient) { await agoraClient.leave().catch(()=>{}); agoraClient = null; }
  } catch(e) {}
  const title = existingTitle || (document.getElementById('live-title').value||'').trim();
  if (!existingStreamId && !title) { showToast(pdTr('please_enter_stream_title')); isStartingStream = false; return; }
  const token = localStorage.getItem('pastor_token');
  try {
    let streamId = existingStreamId;
    if (!streamId) {
      // 1. Create stream record
      const createRes = await fetch(API + '/api/streams', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body: JSON.stringify({
          title,
          category: document.getElementById('live-category')?.value || null,
          description: document.getElementById('live-language')?.value || null
        })
      });
      const stream = await createRes.json();
      if (!createRes.ok) throw new Error(stream.error || 'Failed to create stream');
      streamId = stream.id;
      currentChannelName = stream.channel_name;
    }
    currentStreamId = streamId;

    // 2. Start stream - get Agora token
    const startRes = await fetch(API + '/api/streams/' + streamId + '/start', {
      method:'POST', headers:{'Authorization':'Bearer '+token}
    });
    const data = await startRes.json();
    if (!startRes.ok) throw new Error(data.error || 'Failed to start stream');

    // 3. Join Agora channel
    agoraClient = AgoraRTC.createClient({mode:'live',codec:'vp8'});
    agoraClient.on('network-quality', (stats) => {
      // uplinkNetworkQuality: 0=unknown, 1=excellent, 2=good, 3=poor, 4=bad, 5=very bad, 6=down
      updateNetworkIndicator(stats.uplinkNetworkQuality);
    });
    await agoraClient.setClientRole('host');
    await agoraClient.join(data.app_id, data.channel_name, data.token, data.uid);
    // Required for viewers to be able to switch to a lower-quality stream -
    // without this, no low-quality variant exists at all, so the viewer's
    // HD/SD toggle has nothing real to switch to.
    try { await agoraClient.enableDualStream(); } catch (e) { console.error('enableDualStream failed:', e); }
    // Previously createMicrophoneAndCameraTracks() (the combined helper) —
    // this has zero resolution control at all, which is the actual reason
    // every previous resolution fix never took effect: those were applied
    // to a different piece of code entirely (the camera-switch feature),
    // never to this real, active go-live path.
    localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localVideoTrack = await AgoraRTC.createCameraVideoTrack({ facingMode: currentFacingMode, encoderConfig: '720p_1' });
    localVideoTrack.play('local-video-container');
    await agoraClient.publish([localAudioTrack, localVideoTrack]);
    initZoomCapability();

    isStreaming = true;
    showButtonHints();
    isStartingStream = false;
    document.getElementById('camera-placeholder').style.display = 'none';
    document.getElementById('live-badge').style.display = 'block';
    document.getElementById('stream-indicator').style.background = '#e53e3e';
    document.getElementById('stream-status-text').textContent = 'LIVE';
    document.getElementById('stream-status-text').style.color = '#e53e3e';
    document.getElementById('btn-start-stream').style.display = 'none';
    document.getElementById('btn-end-stream').style.display = 'block';
    document.getElementById('stream-setup').style.opacity = '0.5';
    document.getElementById('stream-setup').style.pointerEvents = 'none';
    streamSeconds = 0;
    streamDurationTimer = setInterval(function() {
      streamSeconds++;
      const m = String(Math.floor(streamSeconds/60)).padStart(2,'0');
      const s = String(streamSeconds%60).padStart(2,'0');
      document.getElementById('live-duration').textContent = m+':'+s;
    }, 1000);
    if (viewerPollInterval) clearInterval(viewerPollInterval);
    viewerPollInterval = setInterval(async function() {
      try {
        const r = await fetch(API + '/api/streams/' + currentStreamId, {headers:{'Authorization':'Bearer '+token}});
        const d = await r.json(); document.getElementById('live-viewer-count').textContent = d.viewer_count || 0;
      } catch(e) {}
    }, 5000);
    showToast(pdTr('now_live'));
  } catch(e) { isStartingStream = false; console.error('Live stream error:',e); showToast(pdTr('failed_start_stream') + (e.message||'Please try again.')); }
}

async function endLiveStream() {
  if (!isStreaming) return;
  try {
    const token = localStorage.getItem('pastor_token');
    if (currentStreamId) {
      await fetch(API + '/api/streams/' + currentStreamId + '/end', {method:'POST',
        headers:{'Authorization':'Bearer '+token}});
    }
    if (localAudioTrack) { localAudioTrack.stop(); localAudioTrack.close(); }
    if (localVideoTrack) { localVideoTrack.stop(); localVideoTrack.close(); }
    if (agoraClient) await agoraClient.leave();
    if (viewerPollInterval) clearInterval(viewerPollInterval);
    if (streamDurationTimer) clearInterval(streamDurationTimer);
    isStreaming = false;
    document.getElementById('camera-placeholder').style.display = 'flex';
    document.getElementById('live-badge').style.display = 'none';
    document.getElementById('stream-indicator').style.background = '#555';
    document.getElementById('stream-status-text').textContent = 'Not streaming';
    document.getElementById('stream-status-text').style.color = 'var(--text-muted)';
    document.getElementById('btn-start-stream').style.display = 'block';
    document.getElementById('btn-end-stream').style.display = 'none';
    document.getElementById('stream-setup').style.opacity = '1';
    document.getElementById('stream-setup').style.pointerEvents = 'auto';
    document.getElementById('live-viewer-count').textContent = '0';
    document.getElementById('live-duration').textContent = '00:00';
    document.getElementById('live-network-indicator').style.display = 'none';
    showToast(pdTr('stream_ended_great_job'));
    loadPastStreams();
  } catch(e) { console.error('End stream error:',e); showToast(pdTr('error_ending_stream')); }
}

function toggleMic() {
  if (!localAudioTrack) return;
  isMicOn = !isMicOn; localAudioTrack.setEnabled(isMicOn);
  document.getElementById('btn-mic').textContent = isMicOn ? '🎤' : '🔇';
  document.getElementById('btn-mic').style.borderColor = isMicOn ? 'var(--border)' : '#e53e3e';
}

function toggleCamera() {
  if (!localVideoTrack) return;
  isCamOn = !isCamOn; localVideoTrack.setEnabled(isCamOn);
  document.getElementById('btn-cam').textContent = isCamOn ? '📷' : '🚫';
  document.getElementById('btn-cam').style.borderColor = isCamOn ? 'var(--border)' : '#e53e3e';
}

let currentZoom = 1;
let maxZoom = 1;

function initZoomCapability() {
  currentZoom = 1;
  maxZoom = 1;
  if (!localVideoTrack) return;
  try {
    const track = localVideoTrack.getMediaStreamTrack();
    const caps = track.getCapabilities ? track.getCapabilities() : null;
    if (caps && caps.zoom) {
      maxZoom = caps.zoom.max || 1;
      currentZoom = caps.zoom.min || 1;
    }
  } catch (e) {}
  updateZoomControlsVisibility();
}

function updateZoomControlsVisibility() {
  const el = document.getElementById('zoom-controls');
  if (el) el.style.display = maxZoom > 1 ? 'flex' : 'none';
}

async function applyZoomWeb(delta) {
  if (!localVideoTrack || maxZoom <= 1) return;
  const newZoom = Math.max(1, Math.min(maxZoom, currentZoom + delta));
  try {
    const track = localVideoTrack.getMediaStreamTrack();
    // The zoom constraint is a non-standard, experimental extension to the
    // MediaTrackConstraints spec (Image Capture API), only supported on
    // some browsers/devices (mainly Chrome on Android with hardware zoom
    // support) - this is why getCapabilities().zoom is checked first, and
    // why this is wrapped defensively: unlike a native SDK method, a
    // rejected promise here is the worst case, it cannot crash the page.
    await track.applyConstraints({ advanced: [{ zoom: newZoom }] });
    currentZoom = newZoom;
    const label = document.getElementById('zoom-label');
    if (label) label.textContent = currentZoom.toFixed(1) + 'x';
  } catch (e) {
    console.error('Zoom failed:', e);
  }
}

async function loadUpcomingStreams() {
  try {
    const token = localStorage.getItem('pastor_token');
    const r = await fetch(API+'/api/streams/history?status=scheduled', {headers:{'Authorization':'Bearer '+token}});
    const data = await r.json();
    const container = document.getElementById('upcoming-streams-list');
    if (!data.streams || !data.streams.length) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px;">No upcoming streams scheduled</p>';
      return;
    }
    container.innerHTML = data.streams.map(function(s) {
      const when = s.scheduled_at ? new Date(s.scheduled_at).toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : 'Time not set';
      const safeTitle = (s.title||'').replace(/'/g,"\\'");
      return '<div style="background:var(--navy3);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;"><div><div style="color:#e8e8e8;font-size:13px;font-weight:600;">'+s.title+'</div><div style="color:var(--gold);font-size:11px;margin-top:2px;">🕐 '+when+'</div></div><div style="display:flex;align-items:center;gap:8px;"><button onclick="startLiveStream(\''+s.id+'\',\''+safeTitle+'\')" style="background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.3);color:var(--gold);border-radius:8px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;">🔴 Go Live Now</button><button onclick="deletePastStream(\''+s.id+'\')" style="background:rgba(224,85,85,0.1);border:1px solid rgba(224,85,85,0.3);color:#e05555;border-radius:8px;padding:6px 10px;font-size:11px;cursor:pointer;">🗑</button></div></div>';
    }).join('');
  } catch(e) {
    document.getElementById('upcoming-streams-list').innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px;">Could not load upcoming streams</p>';
  }
}

async function loadPastStreams() {
  try {
    const token = localStorage.getItem('pastor_token');
    const r = await fetch(API+'/api/streams/history', {headers:{'Authorization':'Bearer '+token}});
    const data = await r.json();
    const container = document.getElementById('past-streams-list');
    if (!data.streams || !data.streams.length) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px;">No past streams yet</p>';
      return;
    }
    container.innerHTML = data.streams.map(function(s) {
      return '<div style="background:var(--navy3);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;"><div><div style="color:#e8e8e8;font-size:13px;font-weight:600;">'+s.title+'</div><div style="color:var(--text-muted);font-size:11px;margin-top:2px;">'+new Date(s.created_at).toLocaleDateString()+' · '+Math.round((s.duration||0)/60)+' min · 👥 '+(s.peak_viewers||0)+' peak</div></div><div style="display:flex;align-items:center;gap:10px;"><span style="color:var(--gold);font-size:11px;font-weight:600;">ENDED</span><button onclick="deletePastStream(\''+s.id+'\')" style="background:rgba(224,85,85,0.1);border:1px solid rgba(224,85,85,0.3);color:#e05555;border-radius:8px;padding:5px 10px;font-size:11px;cursor:pointer;">🗑 Delete</button></div></div>';
    }).join('');
  } catch(e) {
    document.getElementById('past-streams-list').innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px;">Could not load past streams</p>';
  }
}

async function deletePastStream(id) {
  if (!confirm(pdTr('delete_stream_from_history'))) return;
  try {
    const token = localStorage.getItem('pastor_token');
    const res = await fetch(API+'/api/streams/'+id, {method:'DELETE', headers:{'Authorization':'Bearer '+token}});
    if (!res.ok) { const d = await res.json().catch(()=>({})); showToast(d.error||'Could not delete stream', 'error'); return; }
    showToast(pdTr('stream_deleted'));
    loadPastStreams();
    loadUpcomingStreams();
  } catch(e) {
    showToast(pdTr('could_not_delete_stream'), 'error');
  }
}

async function deleteAllPastStreams() {
  if (!confirm(pdTr('delete_all_past_streams'))) return;
  try {
    const token = localStorage.getItem('pastor_token');
    const r = await fetch(API+'/api/streams/history', {headers:{'Authorization':'Bearer '+token}});
    const data = await r.json();
    const streams = data.streams || [];
    if (!streams.length) { showToast(pdTr('no_past_streams_delete'), 'info'); return; }
    await Promise.all(streams.map(s =>
      fetch(API+'/api/streams/'+s.id, {method:'DELETE', headers:{'Authorization':'Bearer '+token}})
    ));
    showToast(pdTr('all_past_streams_deleted'));
    loadPastStreams();
  } catch(e) {
    showToast(pdTr('could_not_delete_all'), 'error');
  }
}
// ── END LIVE STREAM ──────────────────────────────────────────────────────────



async function openSupportMessage(msgId) {
  try {
    // Mark as read
    await api('/api/admin/support/' + msgId + '/read', 'PUT');
    // Get from already loaded data (reload if needed)
    const data = await api('/api/admin/support');
    const msg = (data?.messages || []).find(m => m.id === msgId);
    if (!msg) { alert(pdTr('message_not_found')); return; }
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;';
    overlay.innerHTML = `
      <div style="background:#0d2142;border:1px solid rgba(212,175,55,0.3);border-radius:16px;padding:28px;width:100%;max-width:560px;max-height:80vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h3 style="color:#fff;font-size:16px;">${msg.subject||'Support Request'}</h3>
          <button onclick="this.closest('[style*=fixed]').remove()" style="background:transparent;border:none;color:#8fa3c0;font-size:20px;cursor:pointer;">✕</button>
        </div>
        <div style="color:#8fa3c0;font-size:12px;margin-bottom:16px;">
          From: <span style="color:#D4AF37;">${msg.display_name||msg.email||'User'}</span><br>
          ${new Date(msg.created_at).toLocaleString('en-GB')}
        </div>
        <div style="background:#071528;border-radius:10px;padding:16px;color:#e8e8e8;font-size:14px;line-height:1.7;white-space:pre-wrap;">${msg.body}</div>

        <div style="margin-top:16px;">
          <button onclick="sendMessageToUser('${msg.from_user_id}','${msg.display_name||'User'}')" style="background:#D4AF37;color:#071528;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;">Reply</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    loadInbox(); // Refresh to mark as read
  } catch(e) { alert(pdTr('could_not_open_message')); }
}

// Refresh user role when tab becomes visible again
document.addEventListener('visibilitychange', async function() {
  if (document.visibilityState === 'visible' && token) {
    try {
      const fresh = await api('/api/auth/me');
      if (fresh?.id) {
        user = fresh;
        localStorage.setItem('pastor_user', JSON.stringify(user));
        // Update role display without full re-init
        const roleEl = document.getElementById('sidebar-church');
        const dashRole = document.getElementById('dash-role');
        if (roleEl) roleEl.textContent = user.role?.toUpperCase() || 'PASTOR';
        if (dashRole) dashRole.textContent = (user.role || 'pastor').toUpperCase();
        // Show/hide admin nav
        const adminNav = document.getElementById('admin-nav');
        if (adminNav) adminNav.style.display = ['admin','moderator','owner'].includes(user.role) ? 'flex' : 'none';
        const auditNav = document.getElementById('audit-nav');
        if (auditNav) auditNav.style.display = user.role === 'owner' ? 'flex' : 'none';
        const transferBtn = document.getElementById('transfer-ownership-btn');
        if (transferBtn) transferBtn.style.display = user.role === 'owner' ? 'inline-block' : 'none';
      }
    } catch(e) {}
  }
});


// ── View sermon with media player ──
async function reportSermonFromView(id, title) {
  const reason = prompt('Report "' + title + '" — briefly describe the issue:');
  if (!reason) return;
  try {
    const res = await fetch(API + '/api/sermons/' + id + '/report', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, description: reason })
    });
    if (!res.ok) { const data = await res.json().catch(() => ({})); showToast(data.error || 'Could not submit report'); return; }
    showToast(pdTr('report_submitted'));
  } catch (e) {
    showToast(pdTr('connection_error_please_try'));
  }
}

async function viewSermon(id) {
  try {
    // First try from cache
    let s = allSermonsCache?.find(x => x.id == id);
    if (!s) {
      const data = await api('/api/sermons/' + id);
      s = data?.sermon || data?.sermons?.[0] || data;
    }
    if (!s?.id) { alert(pdTr('sermon_not_found')); return; }

    // A .txt upload is plain text - trivially readable, unlike a PDF -
    // so if the backend never extracted it into the transcript field,
    // fetch and use the raw file content directly rather than falling
    // through to the generic "open as document" link, which would just
    // dump the browser's native, unstyled text view in a new tab.
    if (!s.transcript && s.media_url && s.media_url.toLowerCase().includes('.txt')) {
      try {
        const txtRes = await fetch(s.media_url);
        if (txtRes.ok) s.transcript = await txtRes.text();
      } catch (e) {}
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'sermon-view-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:99999;overflow-y:auto;';
    
    let mediaHtml = '';
    if (s.media_url && s.type === 'video') {
      mediaHtml = `<video controls style="width:100%;max-height:560px;background:#000;border-radius:8px;" src="${s.media_url}">Your browser does not support video.</video>`;
    } else if (s.media_url && s.type === 'audio') {
      mediaHtml = `
        <div style="position:relative;border-radius:8px;overflow:hidden;background:#000;margin-bottom:16px;">
          ${s.thumbnail_url ? `<img src="${s.thumbnail_url}" style="width:100%;height:220px;object-fit:cover;opacity:0.5;display:block;">` : `<div style="width:100%;height:220px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0d2142,#071528);"><span style="font-size:56px;">🎧</span></div>`}
          <audio controls style="width:100%;position:absolute;bottom:0;left:0;accent-color:#D4AF37;background:rgba(7,21,40,0.9);" src="${s.media_url}">Your browser does not support audio.</audio>
        </div>`;
    } else if (!s.media_url) {
      mediaHtml = `<div style="background:#071528;border-radius:8px;padding:20px;text-align:center;color:#8fa3c0;font-size:13px;">No media file for this sermon.</div>`;
    }
    
    overlay.innerHTML = `
      <div style="background:#0d2142;min-height:100%;width:100%;padding:24px;box-sizing:border-box;max-width:min(650px,92vw);margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h2 style="color:#fff;font-size:18px;flex:1;padding-right:16px;">${s.title}</h2>
          <button onclick="document.getElementById('sermon-view-overlay').remove()" style="background:#D4AF37;color:#071528;border:none;border-radius:20px;padding:8px 18px;cursor:pointer;font-weight:700;flex-shrink:0;">✕ Close</button>
        </div>
        <div style="color:#D4AF37;font-size:13px;margin-bottom:16px;">
          ${s.pastor_name || s.display_name || 'Verified Pastor'} &nbsp;·&nbsp; 
          ${(s.type||'').toUpperCase()} &nbsp;·&nbsp; 
          👁 ${parseInt(s.views_count||0).toLocaleString()} views
        </div>
        ${mediaHtml}
        ${s.description ? `<div style="color:#b0c4d8;font-size:14px;line-height:1.7;margin-top:16px;padding:16px;background:#071528;border-radius:8px;">${s.description.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>` : ''}
        ${s.transcript ? `<div style="margin-top:20px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:center;margin-bottom:10px;padding:10px;background:#071528;border-radius:10px;">
            <span style="color:#D4AF37;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-right:8px;">READING</span>
            <button onclick="vsAdjFont(this,-1)" style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:6px;padding:4px 10px;cursor:pointer;font-weight:700;color:#D4AF37;">A-</button>
            <button onclick="vsAdjFont(this,1)" style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:6px;padding:4px 10px;cursor:pointer;font-weight:700;color:#D4AF37;">A+</button>
            <button id="vs-font-sans" onclick="vsSetFont('sans')" style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;color:#D4AF37;">Sans</button>
            <button id="vs-font-serif" onclick="vsSetFont('serif')" style="background:#D4AF37;border:1px solid #b8972a;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;color:#071528;">Serif</button>
            <button onclick="vsToggleExpand(this)" style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;color:#D4AF37;">⟺ Wider</button>
          </div>
          <div id="vs-reading-area" style="width:100%;max-width:min(650px,92vw);margin:0 auto;transition:max-width 0.3s ease;overflow:hidden;">
            <div id="vs-text-content" style="color:#e8e8e8;font-size:16px;line-height:1.9;font-family:Georgia,serif;padding:12px 4px;">${(s.transcript||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\r\n/g,'\n').replace(/\r/g,'\n').replace(/\n{3,}/g,'\n\n').split('\n\n').map(p=>p.trim()?'<p style="margin-bottom:1em;">'+p.replace(/\n/g,'<br>')+'</p>':'').join('')||s.transcript}</div>
          </div>
        </div>` : (s.media_url && (s.media_url.toLowerCase().includes('.pdf') || s.type==='text' || s.type==='article') ? `<div style="margin-top:16px;text-align:center;padding:32px 16px;background:#071528;border-radius:12px;"><div style="font-size:36px;margin-bottom:14px;">${s.type==='article'?'📰':'📄'}</div><p style="color:#8fa3c0;font-size:13px;margin-bottom:18px;">This sermon was uploaded as a document.</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;"><a href="${s.media_url}" target="_blank" rel="noopener" style="background:#D4AF37;color:#071528;padding:10px 22px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px;">⛶ Open</a><a href="${s.media_url}" download style="background:transparent;color:#D4AF37;padding:10px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:13px;border:1px solid rgba(212,175,55,0.3);">⬇ Download</a></div></div>` : '<p style="color:#8fa3c0;font-size:14px;margin-top:16px;">No transcript available for this sermon.</p>')}
        <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
          ${(s.pastor_id === user?.id || ['admin','moderator'].includes(user?.role)) ? `
          <button onclick="openEditSermon(this.dataset.id,this.dataset.title,this.dataset.desc)" data-id="${s.id}" data-title="${(s.title||'').replace(/"/g,'&quot;')}" data-desc="${(s.description||'').replace(/"/g,'&quot;')}" style="background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.3);color:#D4AF37;border-radius:10px;padding:9px 18px;cursor:pointer;font-size:13px;">✏ Edit</button>
          <button onclick="deleteSermon('${s.id}','${(s.title||'').replace(/'/g,"\\'")}');document.getElementById('sermon-view-overlay').remove();" style="background:rgba(224,85,85,0.1);border:1px solid rgba(224,85,85,0.3);color:#e05555;border-radius:10px;padding:9px 18px;cursor:pointer;font-size:13px;">🗑 Delete</button>
          ` : `
          <button onclick="reportSermonFromView('${s.id}','${(s.title||'').replace(/'/g,"\\'")}')" style="background:rgba(224,85,85,0.1);border:1px solid rgba(224,85,85,0.3);color:#e05555;border-radius:10px;padding:9px 18px;cursor:pointer;font-size:13px;">🚩 Report</button>
          `}
          <button onclick="navigator.clipboard.writeText('https://trinitarian.app/?sermon=${s.id}').then(function(){showToast(pdTr('link_copied'))})" style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);color:#D4AF37;border-radius:10px;padding:9px 18px;cursor:pointer;font-size:13px;">🔗 Copy Link</button>
          <button onclick="document.getElementById('sermon-view-overlay').remove()" style="background:transparent;border:1px solid var(--border);color:var(--text-sec);border-radius:10px;padding:9px 18px;cursor:pointer;font-size:13px;">✕ Close</button>
        </div>
      </div>
    </div>`;
  overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  } catch(e) { console.error('viewSermon error:', e); alert(pdTr('could_not_load_sermon')); }
}

