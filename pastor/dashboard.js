



// ── Users ──
let allUsersCache = [];

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
  const q = (document.getElementById('user-search')?.value || '').toLowerCase();
  renderUsers(q ? allUsersCache.filter(u => (u.display_name+u.email+u.username).toLowerCase().includes(q)) : allUsersCache);
}

function renderUsers(list) {
  const el = document.getElementById('users-list');
  if (!list.length) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><h3 data-i18n="no_users">No users found</h3></div>'; return; }
  const adminMode = user?.role === 'admin' || user?.role === 'moderator';
  el.innerHTML = `<div class="sermon-list">${list.map(u => `
    <div class="sermon-card">
      <div style="width:44px;height:44px;border-radius:22px;background:var(--navy3);border:2px solid var(--gold-border);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">
        ${u.avatar_url ? `<img src="${u.avatar_url}" style="width:44px;height:44px;border-radius:22px;object-fit:cover;"/>` : '👤'}
      </div>
      <div class="sermon-info">
        <div class="sermon-title">${u.display_name||u.username||'User'}</div>
        <div class="sermon-meta">
          <span>${u.email||''}</span>
          <span style="padding:2px 8px;border-radius:8px;font-size:11px;background:${u.role==='admin'?'rgba(212,175,55,0.15)':u.role==='moderator'?'rgba(100,150,255,0.15)':u.role==='pastor'?'rgba(64,201,106,0.15)':'rgba(255,255,255,0.05)'};color:${u.role==='admin'?'#D4AF37':u.role==='moderator'?'#6496ff':u.role==='pastor'?'#40c96a':'var(--text-muted)'};">${u.role||'listener'}</span>
          ${u.is_active===false?'<span style="padding:2px 8px;border-radius:8px;font-size:11px;background:rgba(224,85,85,0.15);color:#e05555;">Suspended</span>':''}
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end;">
        ${adminMode ? `<button class="btn btn-sm" style="background:rgba(100,150,255,0.1);border:1px solid rgba(100,150,255,0.3);color:#6496ff;" onclick="changeUserRole('${u.id}','${(u.display_name||u.username||'').replace(/'/g,'')}','${u.role||'listener'}')">👤 Role</button>` : ''}
        ${adminMode ? `<button class="btn btn-sm" style="background:${u.is_active===false?'rgba(64,201,106,0.1)':'rgba(224,85,85,0.1)'};border:1px solid ${u.is_active===false?'rgba(64,201,106,0.3)':'rgba(224,85,85,0.3)'};color:${u.is_active===false?'#40c96a':'#e05555'};" onclick="suspendUser('${u.id}','${(u.display_name||u.username||'').replace(/'/g,'')}',${u.is_active===false})">${u.is_active===false?'✓ Reinstate':'⊘ Suspend'}</button>` : ''}
        ${adminMode ? `<button class="btn btn-sm" style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.2);color:#D4AF37;" onclick="sendMessageToUser('${u.id}','${(u.display_name||u.username||'').replace(/'/g,'')}')">✉ Message</button>` : ''}
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
  } catch(e) { showToast('Failed to update user status', 'error'); }
}

async function changeUserRole(id, name, currentRole) {
  const roles = ['listener', 'pastor', 'moderator', 'admin'];
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
      showToast('Role updated to ' + newRole);
      loadUsers();
    } catch(e) {
      const err = inner.querySelector('#role-err-inner');
      err.textContent = e.message || 'Failed to update role';
      err.style.display = 'block';
    }
  };
}

// ── Pastors ──
let allPastorsCache = [];

async function loadPastorsList() {
  try {
    const data = await api('/api/pastors?limit=100');
    allPastorsCache = Array.isArray(data) ? data : (data?.pastors||[]);
    renderPastors(allPastorsCache);
  } catch(e) {
    const el = document.getElementById('pastors-list');
    if (el) el.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><h3>Failed to load pastors</h3></div>';
  }
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
        <div class="sermon-title">${p.display_name||p.username||'Pastor'}</div>
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
  if (exploreAllSermons.length) { exploreRender(); return; }
  el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);" data-i18n="loading">Loading...</div>';
  try {
    const data = await api('/api/sermons?limit=100');
    exploreAllSermons = data?.sermons || data || [];
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
    card.innerHTML = '<div style="font-size:32px;margin-bottom:10px;">' + (ICONS[s.type]||'🎧') + '</div>'
      + '<div style="color:var(--white);font-size:14px;font-weight:600;margin-bottom:6px;line-height:1.4;">' + s.title + '</div>'
      + '<div style="color:var(--text-muted);font-size:12px;margin-bottom:4px;">✝ ' + (s.pastor_name||'Pastor') + '</div>'
      + '<div style="color:var(--text-muted);font-size:11px;">👁 ' + parseInt(s.views_count||0).toLocaleString() + ' · ' + (s.type||'').toUpperCase() + '</div>';
    el.appendChild(card);
  });
}
const PD_TRANS={
  en:{coming_soon:'Coming Soon',coming_soon_sub:'This feature is coming soon',live_coming_soon_desc:'Live streaming is under development and will be available in a future update. Stay tuned!',notify_when_ready:'You will be notified when this feature launches.',extra_large:'XL',admin_label:'ADMIN',delete_account:'Delete My Account',sermon_title_label:'Sermon Title *',content_type_label:'Content Type *',transcript_label:'Transcript / Full Text (optional)',start_dictation:'🎙 Start dictation',file_select_hint:'Click to select a video, audio or document file. MP4, MP3, PDF, DOC supported · Max 500MB',search_sermons_ph:'🔍 Search sermons...',search_users_ph:'🔍 Search users...',search_pastors_ph:'🔍 Search pastors...',desc_ph:'Brief description of this sermon…',transcript_ph:'Paste the full sermon transcript here, or use dictation above…',support_ph:'Type your message to Trinitarian support…',send_to_admin:'📨 Send Message to Admin',status_approved:'✅ Approved',status_rejected:'❌ Rejected',status_pending:'⏳ Pending',support_messages:'Support Messages',reports_tab:'Reports',flagged_tab:'Flagged Content',escalations_tab:'Escalations',no_sermons_upload:'No sermons yet. Click "Upload Sermon" to share your first message.',cert_note:'Uploading a certificate speeds up verification but is not required.',article:'Article',text:'Text',video:'Video',audio:'Audio',no_sermons_data:'No sermon data yet',create_account:'Create Your Account',create_password:'Create a Password',failed_notifs:'Failed to load notifications',all_pastors:'All verified pastors on Trinitarian',overview:'Overview',my_sermons:'My Sermons',upload_sermon:'Upload Sermon',live_stream:'Live Stream',settings:'Settings',profile:'Profile',notifications:'Notifications',inbox:'Inbox',pastors:'Pastors',users:'Users',analytics:'Analytics',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',sign_out:'Sign Out',sign_in:'Sign In',total_sermons:'Total Sermons',total_views:'Total Views',total_users:'Total Users',new_followers:'New Followers',new_sermons:'New Sermons',followers:'Followers',views:'Views',recent_sermons:'Recent Sermons',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'Here\'s how your ministry is performing',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Manage your account preferences',manage_profile:'Manage your pastor profile',go_live:'Go Live',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',language:'Language',publish_sermon:'Publish Sermon',edit_sermon:'Edit Sermon',remove_sermon:'Remove Sermon',save:'Save',cancel:'Cancel',delete:'Delete',dismiss:'Dismiss',preview:'Preview',save_changes:'Save Changes',send_message:'Send Message',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Font & Display',font_size:'Font Size',font_style:'Font Style',line_spacing:'Line Spacing',security:'Security',legal:'Legal',account:'Account',change_password:'Change Password',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',my_profile:'My Profile',display_name:'Display Name',email:'Email',email_address:'Email Address',username:'Username',church_name:'Church Name',denomination:'Denomination',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',create_account:'Create Your Account',create_password:'Create a Password',confirm_password:'Confirm Password',password:'Password',role:'Role',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons:'No sermons found.',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_sermons_data:'No sermon data yet',no_notifs:'No notifications yet',no_messages:'No messages yet',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading:'Loading...',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',mark_all_read:'Mark all read',small:'Small',medium:'Medium',large:'Large',normal:'Normal',compact:'Compact',relaxed:'Relaxed',default_style:'Default',serif:'Serif',mono:'Mono',video:'Video',audio:'Audio',text:'Text',article:'Article',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',privacy_policy:'Privacy Policy',terms_of_service:'Terms of Service',dmca_policy:'DMCA Policy',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Explore',nav_messages:'Messages',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'When pastors you follow go live',notif_upload:'When pastors you follow upload',notif_msg:'When you receive a message'},
  fr:{coming_soon:'Bientôt disponible',coming_soon_sub:'Cette fonctionnalité arrive bientôt',live_coming_soon_desc:'La diffusion en direct est en cours de développement et sera disponible prochainement.',notify_when_ready:'Vous serez notifié lorsque cette fonctionnalité sera lancée.',extra_large:'TG',admin_label:'ADMIN',delete_account:'Supprimer mon compte',sermon_title_label:'Titre du Sermon *',content_type_label:'Type de Contenu *',transcript_label:'Transcription / Texte Complet (optionnel)',start_dictation:'🎙 Démarrer la dictée',file_select_hint:'Cliquez pour sélectionner un fichier vidéo, audio ou document. MP4, MP3, PDF, DOC supportés · Max 500MB',search_sermons_ph:'🔍 Rechercher des sermons...',search_users_ph:'🔍 Rechercher des utilisateurs...',search_pastors_ph:'🔍 Rechercher des pasteurs...',desc_ph:'Brève description de ce sermon…',transcript_ph:'Collez la transcription complète ici, ou utilisez la dictée ci-dessus…',support_ph:'Tapez votre message au support Trinitarian…',send_to_admin:'📨 Envoyer un Message à l\'Admin',status_approved:'✅ Approuvé',status_rejected:'❌ Rejeté',status_pending:'⏳ En attente',support_messages:'Messages de Support',reports_tab:'Signalements',flagged_tab:'Contenu Signalé',escalations_tab:'Escalades',no_sermons_upload:'Pas encore de sermons. Cliquez sur "Télécharger Sermon" pour partager votre premier message.',cert_note:'Télécharger un certificat accélère la vérification mais n\'est pas obligatoire.',article:'Article',text:'Texte',video:'Vidéo',audio:'Audio',no_sermons_data:'Pas encore de données',create_account:'Créer votre compte',create_password:'Créer un mot de passe',failed_notifs:'Impossible de charger les notifications',all_pastors:'Tous les pasteurs vérifiés sur Trinitarian',overview:'Aperçu',my_sermons:'Mes Sermons',upload_sermon:'Télécharger Sermon',live_stream:'Direct',settings:'Paramètres',profile:'Profil',notifications:'Notifications',inbox:'Messages',pastors:'Pasteurs',users:'Utilisateurs',analytics:'Analytique',pastor_portal:'Portail Pasteur',admin_panel:'Panneau Admin',sign_out:'Se déconnecter',sign_in:'Se connecter',total_sermons:'Total Sermons',total_views:'Total Vues',total_users:'Total Utilisateurs',new_followers:'Nouveaux Abonnés',new_sermons:'Nouveaux Sermons',followers:'Abonnés',views:'Vues',recent_sermons:'Sermons Récents',verified_pastors:'Pasteurs Vérifiés',pending_apps:'Candidatures en attente',unresolved_flags:'Signalements non résolus',here_how:'Voici les performances de votre ministère',track_ministry:'Suivez la portée de votre ministère',share_message:'Partagez votre message avec le monde',share_worldwide:'Partagez vos sermons avec les croyants du monde entier',manage_content:'Gérez tout votre contenu téléchargé',manage_users:'Gérer les utilisateurs',manage_platform:'Gérer la plateforme',manage_account:'Gérez vos préférences de compte',manage_profile:'Gérez votre profil de pasteur',go_live:'Passer en Direct',go_live_sub:'Diffusez en direct et connectez-vous avec votre congrégation',ministry_activity:'Restez informé de votre activité ministérielle',notifs_support:'Notifications et messages de support',browse_pastors:'Parcourir les sermons de tous les pasteurs vérifiés',title:'Titre',description:'Description',category:'Catégorie',type:'Type',media_file:'Fichier Média',scripture_ref:'Référence Biblique',language:'Langue',publish_sermon:'Publier le Sermon',edit_sermon:'Modifier le Sermon',remove_sermon:'Supprimer le Sermon',save:'Enregistrer',cancel:'Annuler',delete:'Supprimer',dismiss:'Ignorer',preview:'Aperçu',save_changes:'Enregistrer',send_message:'Envoyer',stream_title:'Titre du Direct',stream_key:'Clé de Diffusion',schedule_stream:'Planifier',scheduled_dt:'Date et Heure Planifiées',go_live_btn:'Passer en Direct',your_streams:'Vos Diffusions',font_display:'Police et Affichage',font_size:'Taille de Police',font_style:'Style de Police',line_spacing:'Interligne',security:'Sécurité',legal:'Mentions légales',account:'Compte',change_password:'Changer le mot de passe',new_password:'Nouveau mot de passe',current_password:'Mot de passe actuel',confirm_new_pwd:'Confirmer le nouveau mot de passe',update_password:'Mettre à jour le mot de passe',pwd_sub:'Mettre à jour votre mot de passe',reset_password:'Réinitialiser le mot de passe',email_reset:'Entrez votre email et nous vous enverrons un lien de réinitialisation',my_profile:'Mon Profil',display_name:'Nom affiché',email:'E-mail',email_address:'Adresse e-mail',username:'Nom d\'utilisateur',church_name:'Nom de l\'Église',denomination:'Dénomination',ordaining_body:'Corps Ordonnateur',years_ministry:'Années de Ministère',bio:'Biographie',your_full_name:'Votre Nom Complet',choose_username:'Choisissez un nom d\'utilisateur',no_spaces:'Pas d\'espaces. Lettres et chiffres uniquement.',click_photo:'Cliquez sur la photo pour mettre à jour',create_account:'Créer votre compte',create_password:'Créer un mot de passe',confirm_password:'Confirmer le mot de passe',password:'Mot de passe',role:'Rôle',pastor_role:'Pasteur',pastor_label:'PASTEUR',verified_label:'VÉRIFIÉ',suspended_label:'Suspendu',change_role:'Changer le rôle',all_users:'Tous les utilisateurs',no_users:'Aucun utilisateur trouvé',failed_users:'Échec du chargement des utilisateurs',failed_pastors:'Échec du chargement des pasteurs',failed_admin:'Échec du chargement des données admin',failed_streams:'Échec du chargement des diffusions',failed_load:'Échec du chargement',no_sermons:'Aucun sermon trouvé.',no_sermons_yet:'Pas encore de sermons',upload_first:'Téléchargez votre premier sermon pour commencer',no_sermons_data:'Pas encore de données',no_notifs:'Pas encore de notifications',no_messages:'Pas encore de messages',no_streams:'Pas encore de diffusions.',no_support:'Pas encore de messages de support',no_reports:'Aucun signalement',no_flagged:'Aucun contenu signalé',no_apps:'Aucune candidature trouvée',no_content_reported:'Aucun contenu signalé pour l\'instant.',no_escalations:'Pas encore d\'escalades.',no_prev_escalations:'Pas d\'escalades précédentes.',no_pastors_yet:'Pas encore de pasteurs vérifiés',loading:'Chargement...',loading_sermons:'Chargement des sermons...',loading_reports:'Chargement des signalements...',loading_escalations:'Chargement des escalades...',could_not_sermons:'Impossible de charger les sermons.',could_not_reports:'Impossible de charger les signalements',could_not_support:'Impossible de charger les messages',mark_all_read:'Tout marquer comme lu',small:'Petit',medium:'Moyen',large:'Grand',normal:'Normal',compact:'Compact',relaxed:'Détendu',default_style:'Par défaut',serif:'Serif',mono:'Mono',video:'Vidéo',audio:'Audio',text:'Texte',article:'Article',all:'Tous',faith:'Foi',healing:'Guérison',marriage:'Mariage',leadership:'Leadership',prayer:'Prière',prophecy:'Prophétie',prosperity:'Prospérité',salvation:'Salut',bible_study:'Étude biblique',live_streaming:'Diffusion en Direct',live_streams:'Diffusions en Direct',messages:'Messages',subject:'Sujet',end:'Terminer',archive:'Archiver',privacy_policy:'Politique de confidentialité',terms_of_service:'Conditions d\'utilisation',dmca_policy:'Politique DMCA',pastor_apps:'Candidatures Pasteur',pastor_verify:'Vérification Pasteur',ordained_pastor:'Un pasteur ordonné ou licencié',leading_church:'Dirigeant ou servant dans une église ou un ministère reconnu',new_escalation:'Nouvelle Escalade à l\'Admin',prev_escalations:'Vos Escalades Précédentes',accept:'Accepter',decline:'Refuser',explore:'Explorer',nav_messages:'Messages',trinitarian:'Trinitarian',an_overview:'Aperçu',notif_live:'Quand les pasteurs que vous suivez sont en direct',notif_upload:'Quand les pasteurs que vous suivez téléchargent',notif_msg:'Quand vous recevez un message'},
  yo:{coming_soon:'N bọ Laipẹ',coming_soon_sub:'Ẹya yii n bọ laipẹ',live_coming_soon_desc:'Igbohunsafẹfẹ taara wa ninu idagbasoke ati pe yoo wa ni imudojuiwọn iwaju.',notify_when_ready:'A o fi ifitonileti ranṣẹ si ọ nigbati ẹya yii ba ṣi silẹ.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'Awọn Iwaasu Titun',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'Bẹ ni iṣẹ-iranṣẹ rẹ ṣe n ṣe',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Ṣakoso awọn ayanfẹ akaunti rẹ',manage_profile:'Ṣakoso profaili woli rẹ',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'Wiwo Iṣaaju',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Fonti ati Ìfihàn',font_size:'Iwọn Fonti',font_style:'Ara Fonti',line_spacing:'Aye Laini',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'Oruko Ifihan',email:'Email',email_address:'Email Address',username:'Oruko Olumulo',church_name:'Church Name',denomination:'Ẹgbẹ Ẹsin',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'Ipa',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'Kekere',medium:'Aarin',large:'Nla',normal:'Deede',compact:'Kekere',relaxed:'Isinmi',default_style:'Atilẹba',serif:'Serif',mono:'Mono',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'Ilana DMCA',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Ṣawari',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'Nigbati awọn woli ti o n tele ba gbe taara',notif_upload:'Nigbati awọn woli ti o n tele ba gbekalẹ',notif_msg:'Nigbati o ba gba ifiranṣẹ',extra_large:'XL',admin_label:'ADMIN',delete_account:'Pa Akaunti Mi',sermon_title_label:'Akọle Iwaasu *',content_type_label:'Iru Akoonu *',transcript_label:'Akosile / Ọrọ Kikun (aṣayan)',start_dictation:'🎙 Bẹrẹ gbigbọ ohun',file_select_hint:'Tẹ lati yan faili fídíò, ohun tabi iwe. MP4, MP3, PDF, DOC · Max 500MB',search_sermons_ph:'🔍 Wa iwaasu...',search_users_ph:'🔍 Wa awọn olumulo...',search_pastors_ph:'🔍 Wa awọn woli...',desc_ph:'Apejuwe kukuru iwaasu yii…',transcript_ph:'Lẹ akosile iwaasu kikun nibi…',support_ph:'Tẹ ifiranṣẹ rẹ si atilẹyin…',send_to_admin:'📨 Fi Ifiranṣẹ Ranṣẹ si Admin',status_approved:'✅ Fọwọsi',status_rejected:'❌ Kọ',status_pending:'⏳ Nduro',support_messages:'Awọn Ifiranṣẹ Atilẹyin',reports_tab:'Ìjábọ̀',flagged_tab:'Akoonu Ti a Samisi',escalations_tab:'Igbesoke',no_sermons_upload:'Ko si iwaasu. Tẹ "Gbekalẹ Iwaasu" lati pin ifiranṣẹ akọkọ rẹ.',cert_note:'Fifiṣe iwe-ẹri soke yara ijẹrisi ṣugbọn ko nilo.',article:'Àpilẹ̀kọ',text:'Ọrọ',video:'Fídíò',audio:'Ohun',no_sermons_data:'Ko si data iwaasu',create_account:'Ṣẹda Akaunti Rẹ',create_password:'Ṣẹda Ọrọ Aṣina',failed_notifs:'Ko le gba ìwifunni',all_pastors:'Gbogbo awọn woli ti a fidi mule lori Trinitarian',overview:'Akopọ',my_sermons:'Awọn Iwaasu Mi',upload_sermon:'Gbekalẹ Iwaasu',live_stream:'Igbohunsafẹfẹ Taara',settings:'Ìtòlẹsẹẹsẹ',profile:'Profaili',notifications:'Ìwifunni',inbox:'Àpòpọ̀',pastors:'Awọn Woli',users:'Awọn Olumulo',analytics:'Ìtúpalẹ̀',sign_out:'Jade',sign_in:'Wole',total_sermons:'Àpapọ̀ Iwaasu',total_views:'Àpapọ̀ Wiwo',new_followers:'Awọn Alabapin Tuntun',followers:'Awọn Alabapin',views:'Wiwo',recent_sermons:'Awọn Iwaasu Aipẹ',save:'Fipamọ',cancel:'Fagilee',publish_sermon:'Gbejade Iwaasu',edit_sermon:'Ṣatunkọ Iwaasu',remove_sermon:'Yọ Iwaasu Kuro',save_changes:'Fipamọ Awọn Ayipada',send_message:'Fi Ifiranṣẹ Ranṣẹ',loading:'N gbe...',no_sermons:'Ko si iwaasu',no_notifs:'Ko si ìwifunni',no_messages:'Ko si ifiranṣẹ',mark_all_read:'Samisi gbogbo bi a ti ka',language:'Ede',privacy_policy:'Eto Asiri',terms_of_service:'Awọn Ofin Iṣẹ',go_live:'Gbe Taara',my_profile:'Profaili Mi',change_password:'Yi Ọrọ Aṣina Pada',security:'Aabo',legal:'Ofin',account:'Akaunti',nav_messages:'Awọn ifiranṣẹ'},
  ig:{coming_soon:'Na-abịa n\'oge',coming_soon_sub:'Atụmatụ a na-abịa n\'oge',live_coming_soon_desc:'Mgbasa ozi ndụ dị n\'ọrụ mmepe ma ọ ga-adị n\'mmelite ọzọ.',notify_when_ready:'Anyị ga-eziga gị ozi mgbe atụmatụ a malitere.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'Ozizi Ọhụrụ',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'Ọ bụ otú ozi gị si arụ ọrụ',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Chịkwaa nhọrọ akaụntụ gị',manage_profile:'Chịkwaa profaịlụ ukochukwu gị',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'Nlele',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Mkpụrụedemede na Ngosi',font_size:'Nha Mkpụrụedemede',font_style:'Ụdị Mkpụrụedemede',line_spacing:'Oge Akara',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'Aha Ngosi',email:'Email',email_address:'Email Address',username:'Aha Njirimara',church_name:'Church Name',denomination:'Ọchichi Chọọchị',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'Ọrụ',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'Obere',medium:'Etiti',large:'Nnukwu',normal:'Nkịtị',compact:'Nchikota',relaxed:'Ezumike',default_style:'Ọdịnala',serif:'Serif',mono:'Mono',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'Iwu DMCA',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Chọpụta',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'Mgbe ndi ukochukwu i na-eso na-agbasa ndụ',notif_upload:'Mgbe ndi ukochukwu i na-eso na-ebugo',notif_msg:'Mgbe i natara ozi',extra_large:'XL',admin_label:'ADMIN',delete_account:'Hichapụ Akaunti M',sermon_title_label:'Aha Ozizi *',content_type_label:'Udi Ọdịnaya *',transcript_label:'Ihe Edeturu / Ederede Zuru Ezu (ọ dị mma)',start_dictation:'🎙 Bido ịde site n\'olu',file_select_hint:'Pịa iji họọ faịlụ vidiyo, ụda ma ọ bụ akwụkwọ. MP4, MP3, PDF, DOC · Max 500MB',search_sermons_ph:'🔍 Chọọ ozizi...',search_users_ph:'🔍 Chọọ ndị ọrụ...',search_pastors_ph:'🔍 Chọọ ndi ukochukwu...',desc_ph:'Nkọwa dị mkpụmkpụ nke ozizi a…',transcript_ph:'Tinye ihe edeturu ozizi zuru ezu ebe a…',support_ph:'Dee ozi gị na nkwado…',send_to_admin:'📨 Ziga Ozi Admin',status_approved:'✅ Akwadoro',status_rejected:'❌ Akagbuo',status_pending:'⏳ Na-atọ ụzọ',support_messages:'Ozi Nkwado',reports_tab:'Nkọwa',flagged_tab:'Ọdịnaya Akọwapụtara',escalations_tab:'Ọkwa Dị Elu',no_sermons_upload:'Ọ dịghị ozizi. Pịa "Bulite Ozizi" iji kesaa ozi gị nke mbụ.',cert_note:'Ibugo asambodo na-eme ka nkwado mee ngwa ngwa mana ọ dị mkpa.',article:'Akụkọ',text:'Ederede',video:'Vidiyo',audio:'Ụda',no_sermons_data:'Ọ dịghị data ozizi',create_account:'Mepee Akaunti Gị',create_password:'Mepee Okwuntughe',failed_notifs:'Enweghị ike ibute ozi',all_pastors:'Ndi ukochukwu niile akwadoro na Trinitarian',overview:'Nchoputa',my_sermons:'Ozizi M',upload_sermon:'Bulite Ozizi',live_stream:'Mgbasa Ozi Ndụ',settings:'Ntọala',profile:'Profaịlụ',notifications:'Ozi',inbox:'Ozi',pastors:'Ndi Ukochukwu',users:'Ndi Ọrụ',analytics:'Nyocha',sign_out:'Pụọ',sign_in:'Banye',total_sermons:'Ozizi Niile',total_views:'Nlele Niile',new_followers:'Ndị Ọhụrụ Na-eso',followers:'Ndị Na-eso',views:'Nlele',recent_sermons:'Ozizi Ọhụrụ',save:'Chekwaa',cancel:'Kagbuo',publish_sermon:'Bipute Ozizi',edit_sermon:'Dezie Ozizi',remove_sermon:'Hichapụ Ozizi',save_changes:'Chekwaa Mgbanwe',send_message:'Ziga Ozi',loading:'Na ebu...',no_sermons:'Ọ dịghị ozizi',no_notifs:'Ọ dịghị ozi',no_messages:'Ọ dịghị ozi',mark_all_read:'Maa niile ka agụọla',language:'Asụsụ',privacy_policy:'Iwu Nzuzo',terms_of_service:'Usoro Ọrụ',go_live:'Bido Ndụ',my_profile:'Profaịlụ M',change_password:'Gbanwee Okwuntughe',security:'Nchekwa',legal:'Iwu',account:'akaụntụ',nav_messages:'Ozi'},
  ha:{coming_soon:'Zuwa Nan',coming_soon_sub:'Wannan fasalin yana zuwa nan',live_coming_soon_desc:'Ana haɓaka yaɗa kai tsaye kuma zai samu a cikin sabuntawa mai zuwa.',notify_when_ready:'Za a sanar da ku lokacin da aka ƙaddamar da wannan fasalin.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'Sabon Wa azi',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'Ga-ga ne aikin hidimarka',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Sarrafa zaɓuɓɓukan asusun ka',manage_profile:'Sarrafa bayananka na fasto',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'Duba',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Rubutu da Nuni',font_size:'Girman Rubutu',font_style:'Siffar Rubutu',line_spacing:'Tazarar Layi',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'Sunan Nuni',email:'Email',email_address:'Email Address',username:'Sunan Mai Amfani',church_name:'Church Name',denomination:'Ƙungiyar Coci',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'Matsayi',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'Karami',medium:'Matsakaici',large:'Babba',normal:'Al\'ada',compact:'Ƙarami',relaxed:'Shakatawa',default_style:'Na\'asali',serif:'Serif',mono:'Mono',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'Manufofin DMCA',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Bincika',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'Lokacin da fastocin da kake bin suna yaɗa kai tsaye',notif_upload:'Lokacin da fastocin da kake bin suke loda',notif_msg:'Lokacin da ka karɓi sako',extra_large:'XL',admin_label:'ADMIN',delete_account:'Share Asusuna',sermon_title_label:'Taken Wa azi *',content_type_label:'Nau\'in Abun Ciki *',transcript_label:'Rubutu / Cikakken Rubutu (zaɓi)',start_dictation:'🎙 Fara karanta ta murya',file_select_hint:'Danna don zaɓar fayil ɗin bidiyo, sauti ko takardar. MP4, MP3, PDF, DOC · Max 500MB',search_sermons_ph:'🔍 Nemi wa azi...',search_users_ph:'🔍 Nemi masu amfani...',search_pastors_ph:'🔍 Nemi fastoci...',desc_ph:'Taƙaitaccen bayanin wa azin nan…',transcript_ph:'Manna cikakken rubutun wa azin nan anan…',support_ph:'Rubuta saƙonka ga tallafin…',send_to_admin:'📨 Aika Sako ga Admin',status_approved:'✅ An yarda',status_rejected:'❌ An ƙi',status_pending:'⏳ Ana jira',support_messages:'Saƙonnin Tallafi',reports_tab:'Rahotanni',flagged_tab:'Abun Ciki Da Aka Nuna',escalations_tab:'Matsayin Sama',no_sermons_upload:'Babu wa azi tukuna. Danna "Loda Wa azi" don raba saƙonka na farko.',cert_note:'Loda takardar shaidar ta hanzarta tabbatarwa amma ba dole ba.',article:'Labari',text:'Rubutu',video:'Bidiyo',audio:'Sauti',no_sermons_data:'Babu bayanan wa azi',create_account:'Ƙirƙiri Asusunku',create_password:'Ƙirƙiri Kalmar Sirri',failed_notifs:'Ba a iya lodi sanarwa',all_pastors:'Duk fastocin da aka tabbatar a Trinitarian',overview:'Takaitawa',my_sermons:'Wa azina',upload_sermon:'Loda Wa azi',live_stream:'Yaɗa Kai Tsaye',settings:'Saiti',profile:'Bayanai',notifications:'Sanarwa',inbox:'Saƙo',pastors:'Fastoci',users:'Masu Amfani',analytics:'Bincike',sign_out:'Fita',sign_in:'Shiga',total_sermons:'Jimilar Wa azi',total_views:'Jimilar Kallon',new_followers:'Sabon Mabiya',followers:'Mabiya',views:'Kallo',recent_sermons:'Wa azin Kwanan nan',save:'Ajiye',cancel:'Soke',publish_sermon:'Buga Wa azi',edit_sermon:'Gyara Wa azi',remove_sermon:'Cire Wa azi',save_changes:'Adana Canje-canje',send_message:'Aika Sako',loading:'Ana lodi...',no_sermons:'Babu wa azi',no_notifs:'Babu sanarwa',no_messages:'Babu saƙo',mark_all_read:'Sanya duka an karanta',language:'Harshe',privacy_policy:'Manufofin Sirri',terms_of_service:'Sharuddan Amfani',go_live:'Fara Yaɗa',my_profile:'Bayanaina',change_password:'Canza Kalmar Sirri',security:'Tsaro',legal:'Doka',account:'Asusu',nav_messages:'Saƙonni'},
  pt:{coming_soon:'Em Breve',coming_soon_sub:'Este recurso está chegando em breve',live_coming_soon_desc:'A transmissão ao vivo está em desenvolvimento e estará disponível em uma atualização futura.',notify_when_ready:'Você será notificado quando este recurso for lançado.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'Novos Sermões',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'Como seu ministério está se saindo',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Gerencie suas preferências de conta',manage_profile:'Gerencie seu perfil de pastor',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'Visualização',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Fonte e Exibição',font_size:'Tamanho da Fonte',font_style:'Estilo da Fonte',line_spacing:'Espaçamento',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'Nome de Exibição',email:'Email',email_address:'Email Address',username:'Nome de Usuário',church_name:'Church Name',denomination:'Denominação',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'Função',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'Pequeno',medium:'Médio',large:'Grande',normal:'Normal',compact:'Compacto',relaxed:'Relaxado',default_style:'Padrão',serif:'Serif',mono:'Mono',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'Política DMCA',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Explorar',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'Quando pastores que você segue vão ao vivo',notif_upload:'Quando pastores que você segue fazem upload',notif_msg:'Quando receber uma mensagem',extra_large:'XL',admin_label:'ADMIN',delete_account:'Excluir Minha Conta',sermon_title_label:'Título do Sermão *',content_type_label:'Tipo de Conteúdo *',transcript_label:'Transcrição / Texto Completo (opcional)',start_dictation:'🎙 Iniciar ditado',file_select_hint:'Clique para selecionar um arquivo de vídeo, áudio ou documento. MP4, MP3, PDF, DOC · Max 500MB',search_sermons_ph:'🔍 Pesquisar sermões...',search_users_ph:'🔍 Pesquisar usuários...',search_pastors_ph:'🔍 Pesquisar pastores...',desc_ph:'Breve descrição deste sermão…',transcript_ph:'Cole a transcrição completa aqui, ou use o ditado acima…',support_ph:'Digite sua mensagem para o suporte Trinitarian…',send_to_admin:'📨 Enviar Mensagem ao Admin',status_approved:'✅ Aprovado',status_rejected:'❌ Rejeitado',status_pending:'⏳ Pendente',support_messages:'Mensagens de Suporte',reports_tab:'Denúncias',flagged_tab:'Conteúdo Sinalizado',escalations_tab:'Escalações',no_sermons_upload:'Sem sermões ainda. Clique em "Carregar Sermão" para compartilhar sua primeira mensagem.',cert_note:'Enviar um certificado acelera a verificação mas não é obrigatório.',article:'Artigo',text:'Texto',video:'Vídeo',audio:'Áudio',no_sermons_data:'Sem dados de sermões',create_account:'Criar Sua Conta',create_password:'Criar uma Senha',failed_notifs:'Falha ao carregar notificações',all_pastors:'Todos os pastores verificados no Trinitarian',overview:'Visão Geral',my_sermons:'Meus Sermões',upload_sermon:'Carregar Sermão',live_stream:'Transmissão ao Vivo',settings:'Configurações',profile:'Perfil',notifications:'Notificações',inbox:'Mensagens',pastors:'Pastores',users:'Usuários',analytics:'Análise',sign_out:'Sair',sign_in:'Entrar',total_sermons:'Total de Sermões',total_views:'Total de Visualizações',new_followers:'Novos Seguidores',followers:'Seguidores',views:'Visualizações',recent_sermons:'Sermões Recentes',save:'Salvar',cancel:'Cancelar',publish_sermon:'Publicar Sermão',edit_sermon:'Editar Sermão',remove_sermon:'Remover Sermão',save_changes:'Salvar Alterações',send_message:'Enviar Mensagem',loading:'Carregando...',no_sermons:'Nenhum sermão encontrado',no_notifs:'Nenhuma notificação',no_messages:'Nenhuma mensagem',mark_all_read:'Marcar tudo como lido',language:'Idioma',privacy_policy:'Política de Privacidade',terms_of_service:'Termos de Serviço',go_live:'Ir ao Vivo',my_profile:'Meu Perfil',change_password:'Alterar Senha',security:'Segurança',legal:'Jurídico',account:'Conta',nav_messages:'Mensagens'},
  tw:{coming_soon:'Bɛba',coming_soon_sub:'Adwuma yi bɛba',live_coming_soon_desc:'Tee nkrato wɔ ase sɛ wɔreboa na ɛbɛba mmɛhyɛ atoatoo kɛse mu.',notify_when_ready:'Wɔbɛka akyɛ wo sɛ adwuma yi aba.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'Asenka Foforo',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'Saa na wo asɔredan dwuma te',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Hwɛ wo akawnt nhyehyɛe',manage_profile:'Hwɛ wo osofo ho nsɛm',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'Nhwɛso',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Nkyerɛwde ne Nhwɛso',font_size:'Nkyerɛwde Tenten',font_style:'Nkyerɛwde Suban',line_spacing:'Nkyerɛwde Ahorow',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'Din a Wokyere',email:'Email',email_address:'Email Address',username:'Dinto',church_name:'Church Name',denomination:'Ɔsore Foforo',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'Asɛe',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'Ketewa',medium:'Mfimfini',large:'Kɛse',normal:'Ɔsrane',compact:'Ketewa',relaxed:'Ahomgyee',default_style:'Ɔsrane',serif:'Serif',mono:'Mono',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'DMCA Mmara',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Explore',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'Bere a asofo a wodi wɔn akyi reba tee so',notif_upload:'Bere a asofo a wodi wɔn akyi toa',notif_msg:'Bere a wunya krasɛm',extra_large:'XL',admin_label:'ADMIN',delete_account:'Popa Me Akawnt',sermon_title_label:'Asenka Din *',content_type_label:'Akodie Suban *',transcript_label:'Nkyerɛwee / Nkyerɛwde Nyinaa (sɛ wopɛ)',start_dictation:'🎙 Hyɛ dictation ase',file_select_hint:'Klik sɛ wobɛyi video, nnyigyei anaa krataa fayl. MP4, MP3, PDF, DOC · Max 500MB',search_sermons_ph:'🔍 Hwehwɛ asenka...',search_users_ph:'🔍 Hwehwɛ nnipa...',search_pastors_ph:'🔍 Hwehwɛ asofo...',desc_ph:'Nteasɛm kakra fa asenka yi ho…',transcript_ph:'Hyɛ nkyerɛwee nyinaa ha…',support_ph:'Kyerɛw wo krasɛm kɔ Trinitarian mmoa…',send_to_admin:'📨 Kra Admin',status_approved:'✅ Wɔagye to mu',status_rejected:'❌ Wɔanye',status_pending:'⏳ Retwɛn',support_messages:'Mmoa Nkrasɛm',reports_tab:'Amaneɛ',flagged_tab:'Akodie a Wɔakyerɛ',escalations_tab:'Kɔsoro Asɛm',no_sermons_upload:'Asenka biara nni ho. Klik "Toa Asenka" sɛ wobɛkyɛ ɔkrasɛm a ɛdi kan.',cert_note:'Toa krataa bi bɛma verification ntɛm nnɛ enye nsɔ.',article:'Asɛm',text:'Nkyerɛwee',video:'Video',audio:'Nnyigyei',no_sermons_data:'Asenka data nni ho',create_account:'Bue Wo Akawnt',create_password:'Bue Ahintasɛm',failed_notifs:'Nkrasɛm reload nni ho',all_pastors:'Asofo nyinaa a wɔagyina ho din wɔ Trinitarian',overview:'Nhwɛso',my_sermons:'Me Asenka',upload_sermon:'Toa Asenka',live_stream:'Tee so',settings:'Nhyehyɛe',profile:'Ho Nsɛm',notifications:'Nkrasɛm',inbox:'Nkrasɛm',pastors:'Asofo',users:'Nnipa',analytics:'Nsɛnkyerɛnne',sign_out:'Pue',sign_in:'Hyen mu',total_sermons:'Asenka nyinaa',total_views:'Nhwɛso nyinaa',new_followers:'Mpɔnwahyɛ Foforo',followers:'Mpɔnwahyɛ',views:'Nhwɛso',recent_sermons:'Asenka a Ɛdi Kan',save:'Kora so',cancel:'Gyae',publish_sermon:'Tene Asenka',edit_sermon:'Sesa Asenka',remove_sermon:'Yi Asenka',save_changes:'Kora Nsesa',send_message:'Kra',loading:'Reload...',no_sermons:'Asenka biara nni ho',no_notifs:'Nkrasɛm biara nni ho',no_messages:'Nkrasɛm biara nni ho',mark_all_read:'Hyɛ nkae sɛ wɔakenkan',language:'Kasa',privacy_policy:'Nnimdee Mmara',terms_of_service:'Dwumadie Mmara',go_live:'Kɔ Tee So',my_profile:'Me Ho Nsɛm',change_password:'Sesa Ahintasɛm',security:'Bammɔ',legal:'Mmara',account:'Akawnt'},
  zu:{coming_soon:'Kuyeza',coming_soon_sub:'Lesi sici siyeza',live_coming_soon_desc:'Ukusakaza bukhoma kusathuthukiswa futhi kuzothola uhlaziyo lwesikhathi esizayo.',notify_when_ready:'Uzaziswa uma lesi sici siqaliswa.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'Izintshumayelo Ezintsha',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'Nansi indlela inkonzo yakho esebenza ngayo',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Phatha izintandokazi ze-akhawunti yakho',manage_profile:'Phatha iphrofayili yakho yomfundisi',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'Isibonelo',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Ifonti Nokubonisa',font_size:'Usayizi Weffonti',font_style:'Isitayela Seffonti',line_spacing:'Isikhala Semigqa',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'Igama Lokubonisa',email:'Email',email_address:'Email Address',username:'Igama Lomsebenzisi',church_name:'Church Name',denomination:'Inhlangano Yenkonzo',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'Indima',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'Encane',medium:'Phakathi',large:'Enkulu',normal:'Okujwayelekile',compact:'Omfinyeleziwe',relaxed:'Khulukulwayo',default_style:'Okuzenzakalelayo',serif:'Serif',mono:'Mono',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'Inqubomgomo ye-DMCA',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Explore',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'Uma abefundisi obelandelayo besakaza bukhoma',notif_upload:'Uma abefundisi obelandelayo belayisha',notif_msg:'Uma uthole umlayezo',extra_large:'XL',admin_label:'ADMIN',delete_account:'Susa I-akhawunti Yami',sermon_title_label:'Isihloko Sentshumayelo *',content_type_label:'Uhlobo Lokuqukethwe *',transcript_label:'Umbhalo / Umbhalo Ophelele (okukhethwa)',start_dictation:'🎙 Qala ukuhuba',file_select_hint:'Chofoza ukuze ukhethe ifayela levidiyo, umsindo noma idokhumenti. MP4, MP3, PDF, DOC · Uphezulu 500MB',search_sermons_ph:'🔍 Sesha izintshumayelo...',search_users_ph:'🔍 Sesha abasebenzisi...',search_pastors_ph:'🔍 Sesha abefundisi...',desc_ph:'Incazelo emfushane yale ntshumayelo…',transcript_ph:'Namathisela umbhalo ophelele lapha…',support_ph:'Bhala umlayezo wakho kusupodi ye-Trinitarian…',send_to_admin:'📨 Thumela Umlayezo ku-Admin',status_approved:'✅ Yamukelwa',status_rejected:'❌ Yaliwa',status_pending:'⏳ Ilindile',support_messages:'Imilayezo Yosizo',reports_tab:'Imibiko',flagged_tab:'Okuqukethwe Okuphawuliwe',escalations_tab:'Ukuphakamisa',no_sermons_upload:'Azikho izintshumayelo. Chofoza "Layisha Intshumayelo" ukuze wabelane ngesiqephu sakho sokuqala.',cert_note:'Ukulayisha isitifiketi kuyakhawulezisa ukuqinisekiswa kodwa akudingi.',article:'Indatshana',text:'Umbhalo',video:'Ividiyo',audio:'Umsindo',no_sermons_data:'Asikho idatha',create_account:'Dala I-akhawunti Yakho',create_password:'Dala Iphasiwedi',failed_notifs:'Yehlulekile ukulayisha izaziso',all_pastors:'Bonke abefundisi abaqinisekisiwe ku-Trinitarian',overview:'Isifinyezo',my_sermons:'Izintshumayelo Zami',upload_sermon:'Layisha Intshumayelo',live_stream:'Ukusakaza Bukhoma',settings:'Izilungiselelo',profile:'Iphrofayili',notifications:'Izaziso',inbox:'Imilayezo',pastors:'Abefundisi',users:'Abasebenzisi',analytics:'Uhlalutyo',sign_out:'Phuma',sign_in:'Ngena',total_sermons:'Izintshumayelo Zonke',total_views:'Ukubukwa Konke',new_followers:'Abalandeli Abasha',followers:'Abalandeli',views:'Ukubukwa',recent_sermons:'Izintshumayelo Zakamuva',save:'Londoloza',cancel:'Khansela',publish_sermon:'Shicilela Intshumayelo',edit_sermon:'Hlela Intshumayelo',remove_sermon:'Susa Intshumayelo',save_changes:'Gcina Izinguquko',send_message:'Thumela Umlayezo',loading:'Iyalayisha...',no_sermons:'Azikho izintshumayelo',no_notifs:'Azikho izaziso',no_messages:'Awekho amilayezo',mark_all_read:'Maka konke njengokufundiwe',language:'Ulimi',privacy_policy:'Inqubomgomo Yobumfihlo',terms_of_service:'Imigomo Yesevisi',go_live:'Sakaza Bukhoma',my_profile:'Iphrofayili Yami',change_password:'Shintsha Iphasiwedi',security:'Ezokuphepha',legal:'Ezomthetho',account:'I-akhawunti'},
  ar:{coming_soon:'قريباً',coming_soon_sub:'هذه الميزة قادمة قريباً',live_coming_soon_desc:'البث المباشر قيد التطوير وسيكون متاحاً في تحديث مستقبلي.',notify_when_ready:'ستتلقى إشعاراً عند إطلاق هذه الميزة.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'عظات جديدة',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'هكذا يؤدي خدمتك',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'إدارة تفضيلات حسابك',manage_profile:'إدارة ملف القسيس',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'معاينة',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'الخط والعرض',font_size:'حجم الخط',font_style:'نمط الخط',line_spacing:'تباعد الأسطر',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'الاسم المعروض',email:'Email',email_address:'Email Address',username:'اسم المستخدم',church_name:'Church Name',denomination:'المذهب',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'الدور',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'صغير',medium:'متوسط',large:'كبير',normal:'عادي',compact:'مضغوط',relaxed:'مريح',default_style:'افتراضي',serif:'سيريف',mono:'أحادي',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'سياسة DMCA',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'استكشاف',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'عندما يبث القساوسة الذين تتابعهم مباشرة',notif_upload:'عندما يرفع القساوسة الذين تتابعهم',notif_msg:'عند استلام رسالة',extra_large:'XL',admin_label:'مدير',delete_account:'حذف حسابي',sermon_title_label:'عنوان العظة *',content_type_label:'نوع المحتوى *',transcript_label:'نص العظة / النص الكامل (اختياري)',start_dictation:'🎙 بدء الإملاء',file_select_hint:'انقر لتحديد ملف فيديو أو صوت أو مستند. MP4، MP3، PDF، DOC · الحد الأقصى 500 ميغابايت',search_sermons_ph:'🔍 البحث في العظات...',search_users_ph:'🔍 البحث في المستخدمين...',search_pastors_ph:'🔍 البحث في القساوسة...',desc_ph:'وصف مختصر لهذه العظة…',transcript_ph:'الصق النص الكامل للعظة هنا…',support_ph:'اكتب رسالتك لدعم Trinitarian…',send_to_admin:'📨 إرسال رسالة للمدير',status_approved:'✅ موافق عليه',status_rejected:'❌ مرفوض',status_pending:'⏳ قيد الانتظار',support_messages:'رسائل الدعم',reports_tab:'التقارير',flagged_tab:'المحتوى المُبلَّغ عنه',escalations_tab:'التصعيدات',no_sermons_upload:'لا توجد عظات بعد. انقر على "رفع عظة" لمشاركة رسالتك الأولى.',cert_note:'رفع شهادة يسرّع التحقق لكنه غير مطلوب.',article:'مقالة',text:'نص',video:'فيديو',audio:'صوت',no_sermons_data:'لا بيانات عظات بعد',create_account:'إنشاء حسابك',create_password:'إنشاء كلمة المرور',failed_notifs:'فشل تحميل الإشعارات',all_pastors:'جميع القساوسة الموثقين على Trinitarian',overview:'نظرة عامة',my_sermons:'عظاتي',upload_sermon:'رفع عظة',live_stream:'بث مباشر',settings:'الإعدادات',profile:'الملف الشخصي',notifications:'الإشعارات',inbox:'الرسائل',pastors:'القساوسة',users:'المستخدمون',analytics:'التحليلات',sign_out:'تسجيل الخروج',sign_in:'تسجيل الدخول',total_sermons:'إجمالي العظات',total_views:'إجمالي المشاهدات',new_followers:'متابعون جدد',followers:'المتابعون',views:'المشاهدات',recent_sermons:'العظات الأخيرة',save:'حفظ',cancel:'إلغاء',publish_sermon:'نشر العظة',edit_sermon:'تعديل العظة',remove_sermon:'حذف العظة',save_changes:'حفظ التغييرات',send_message:'إرسال رسالة',loading:'جار التحميل...',no_sermons:'لا توجد عظات',no_notifs:'لا توجد إشعارات',no_messages:'لا رسائل',mark_all_read:'وضع علامة مقروء على الكل',language:'اللغة',privacy_policy:'سياسة الخصوصية',terms_of_service:'شروط الخدمة',go_live:'بدء البث',my_profile:'ملفي الشخصي',change_password:'تغيير كلمة المرور',security:'الأمان',legal:'قانوني',account:'الحساب',nav_messages:'الرسائل'},
  zh:{coming_soon:'即将推出',coming_soon_sub:'此功能即将推出',live_coming_soon_desc:'直播功能正在开发中，将在未来的更新中推出。',notify_when_ready:'此功能推出时您将收到通知。',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'新讲道',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'您的事工表现如何',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'管理您的账户偏好',manage_profile:'管理您的牧师资料',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'预览',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'字体与显示',font_size:'字体大小',font_style:'字体样式',line_spacing:'行距',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'显示名称',email:'Email',email_address:'Email Address',username:'用户名',church_name:'Church Name',denomination:'宗派',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'角色',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'小',medium:'中',large:'大',normal:'正常',compact:'紧凑',relaxed:'宽松',default_style:'默认',serif:'衬线',mono:'等宽',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'DMCA政策',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'探索',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'当您关注的牧师开始直播时',notif_upload:'当您关注的牧师上传时',notif_msg:'当您收到消息时',extra_large:'XL',admin_label:'管理员',delete_account:'删除我的账户',sermon_title_label:'讲道标题 *',content_type_label:'内容类型 *',transcript_label:'文字稿 / 全文（可选）',start_dictation:'🎙 开始听写',file_select_hint:'点击选择视频、音频或文档文件。支持 MP4、MP3、PDF、DOC · 最大 500MB',search_sermons_ph:'🔍 搜索讲道...',search_users_ph:'🔍 搜索用户...',search_pastors_ph:'🔍 搜索牧师...',desc_ph:'本讲道的简短描述…',transcript_ph:'在此粘贴完整的讲道文字稿…',support_ph:'输入您的消息给 Trinitarian 支持…',send_to_admin:'📨 发送消息给管理员',status_approved:'✅ 已批准',status_rejected:'❌ 已拒绝',status_pending:'⏳ 待处理',support_messages:'支持消息',reports_tab:'举报',flagged_tab:'已标记内容',escalations_tab:'升级',no_sermons_upload:'暂无讲道。点击"上传讲道"分享您的第一条消息。',cert_note:'上传证书可加快验证速度，但不是必须的。',article:'文章',text:'文本',video:'视频',audio:'音频',no_sermons_data:'暂无讲道数据',create_account:'创建您的账户',create_password:'创建密码',failed_notifs:'无法加载通知',all_pastors:'Trinitarian上所有认证牧师',overview:'概览',my_sermons:'我的讲道',upload_sermon:'上传讲道',live_stream:'直播',settings:'设置',profile:'个人资料',notifications:'通知',inbox:'消息',pastors:'牧师',users:'用户',analytics:'分析',sign_out:'退出',sign_in:'登录',total_sermons:'讲道总数',total_views:'总观看次数',new_followers:'新粉丝',followers:'粉丝',views:'观看次数',recent_sermons:'最近讲道',save:'保存',cancel:'取消',publish_sermon:'发布讲道',edit_sermon:'编辑讲道',remove_sermon:'删除讲道',save_changes:'保存更改',send_message:'发送消息',loading:'加载中...',no_sermons:'未找到讲道',no_notifs:'暂无通知',no_messages:'暂无消息',mark_all_read:'全部标为已读',language:'语言',privacy_policy:'隐私政策',terms_of_service:'服务条款',go_live:'开始直播',my_profile:'我的主页',change_password:'更改密码',security:'安全',legal:'法律',account:'账户',nav_messages:'消息'},
  hi:{coming_soon:'जल्द आ रहा है',coming_soon_sub:'यह सुविधा जल्द आ रही है',live_coming_soon_desc:'लाइव स्ट्रीमिंग विकास में है और भविष्य के अपडेट में उपलब्ध होगी।',notify_when_ready:'जब यह सुविधा लॉन्च होगी तो आपको सूचित किया जाएगा।',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'नए उपदेश',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'आपकी सेवकाई कैसी चल रही है',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'अपनी खाता प्राथमिकताएं प्रबंधित करें',manage_profile:'अपनी पादरी प्रोफ़ाइल प्रबंधित करें',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'पूर्वावलोकन',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'फ़ॉन्ट और प्रदर्शन',font_size:'फ़ॉन्ट आकार',font_style:'फ़ॉन्ट शैली',line_spacing:'लाइन स्पेसिंग',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'प्रदर्शित नाम',email:'Email',email_address:'Email Address',username:'उपयोगकर्ता नाम',church_name:'Church Name',denomination:'संप्रदाय',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'भूमिका',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'छोटा',medium:'मध्यम',large:'बड़ा',normal:'सामान्य',compact:'संक्षिप्त',relaxed:'आरामदायक',default_style:'डिफ़ॉल्ट',serif:'सेरिफ़',mono:'मोनो',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'DMCA नीति',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Explore',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'जब आप जिन पादरियों को फॉलो करते हैं वे लाइव हों',notif_upload:'जब आप जिन पादरियों को फॉलो करते हैं वे अपलोड करें',notif_msg:'जब आपको संदेश मिले',extra_large:'XL',admin_label:'एडमिन',delete_account:'मेरा खाता हटाएं',sermon_title_label:'उपदेश शीर्षक *',content_type_label:'सामग्री प्रकार *',transcript_label:'प्रतिलेख / पूर्ण पाठ (वैकल्पिक)',start_dictation:'🎙 श्रुतलेख शुरू करें',file_select_hint:'वीडियो, ऑडियो या दस्तावेज़ फ़ाइल चुनने के लिए क्लिक करें। MP4, MP3, PDF, DOC · अधिकतम 500MB',search_sermons_ph:'🔍 उपदेश खोजें...',search_users_ph:'🔍 उपयोगकर्ता खोजें...',search_pastors_ph:'🔍 पादरी खोजें...',desc_ph:'इस उपदेश का संक्षिप्त विवरण…',transcript_ph:'यहाँ पूरा प्रतिलेख पेस्ट करें…',support_ph:'Trinitarian सहायता को अपना संदेश टाइप करें…',send_to_admin:'📨 एडमिन को संदेश भेजें',status_approved:'✅ स्वीकृत',status_rejected:'❌ अस्वीकृत',status_pending:'⏳ लंबित',support_messages:'सहायता संदेश',reports_tab:'रिपोर्ट',flagged_tab:'चिह्नित सामग्री',escalations_tab:'एस्केलेशन',no_sermons_upload:'अभी कोई उपदेश नहीं। पहला संदेश साझा करने के लिए "उपदेश अपलोड करें" पर क्लिक करें।',cert_note:'प्रमाणपत्र अपलोड करने से सत्यापन तेज होता है लेकिन यह आवश्यक नहीं है।',article:'लेख',text:'पाठ',video:'वीडियो',audio:'ऑडियो',no_sermons_data:'अभी कोई उपदेश डेटा नहीं',create_account:'अपना खाता बनाएं',create_password:'पासवर्ड बनाएं',failed_notifs:'सूचनाएं लोड नहीं हो सकीं',all_pastors:'Trinitarian पर सभी सत्यापित पादरी',overview:'अवलोकन',my_sermons:'मेरे उपदेश',upload_sermon:'उपदेश अपलोड करें',live_stream:'लाइव स्ट्रीम',settings:'सेटिंग्स',profile:'प्रोफ़ाइल',notifications:'सूचनाएं',inbox:'संदेश',pastors:'पादरी',users:'उपयोगकर्ता',analytics:'विश्लेषण',sign_out:'साइन आउट',sign_in:'साइन इन',total_sermons:'कुल उपदेश',total_views:'कुल व्यूज़',new_followers:'नए अनुयायी',followers:'अनुयायी',views:'व्यूज़',recent_sermons:'हाल के उपदेश',save:'सहेजें',cancel:'रद्द करें',publish_sermon:'उपदेश प्रकाशित करें',edit_sermon:'उपदेश संपादित करें',remove_sermon:'उपदेश हटाएं',save_changes:'परिवर्तन सहेजें',send_message:'संदेश भेजें',loading:'लोड हो रहा है...',no_sermons:'कोई उपदेश नहीं',no_notifs:'कोई सूचना नहीं',no_messages:'कोई संदेश नहीं',mark_all_read:'सभी को पढ़ा हुआ चिह्नित करें',language:'भाषा',privacy_policy:'गोपनीयता नीति',terms_of_service:'सेवा की शर्तें',go_live:'लाइव जाएं',my_profile:'मेरी प्रोफ़ाइल',change_password:'पासवर्ड बदलें',security:'सुरक्षा',legal:'कानूनी',account:'खाता'},
  es:{coming_soon:'Próximamente',coming_soon_sub:'Esta función llega pronto',live_coming_soon_desc:'La transmisión en vivo está en desarrollo y estará disponible en una futura actualización.',notify_when_ready:'Se le notificará cuando se lance esta función.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'Nuevos Sermones',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'Así está funcionando tu ministerio',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Gestiona tus preferencias de cuenta',manage_profile:'Gestiona tu perfil de pastor',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'Vista Previa',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Fuente y Pantalla',font_size:'Tamaño de Fuente',font_style:'Estilo de Fuente',line_spacing:'Espaciado',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'Nombre Visible',email:'Email',email_address:'Email Address',username:'Nombre de Usuario',church_name:'Church Name',denomination:'Denominación',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'Rol',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'Pequeño',medium:'Mediano',large:'Grande',normal:'Normal',compact:'Compacto',relaxed:'Relajado',default_style:'Por Defecto',serif:'Serif',mono:'Mono',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'Política DMCA',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Explorar',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'Cuando los pastores que sigues van en vivo',notif_upload:'Cuando los pastores que sigues suben',notif_msg:'Cuando recibes un mensaje',extra_large:'XL',admin_label:'ADMIN',delete_account:'Eliminar Mi Cuenta',sermon_title_label:'Título del Sermón *',content_type_label:'Tipo de Contenido *',transcript_label:'Transcripción / Texto Completo (opcional)',start_dictation:'🎙 Iniciar dictado',file_select_hint:'Haz clic para seleccionar un archivo de video, audio o documento. MP4, MP3, PDF, DOC · Máx 500MB',search_sermons_ph:'🔍 Buscar sermones...',search_users_ph:'🔍 Buscar usuarios...',search_pastors_ph:'🔍 Buscar pastores...',desc_ph:'Breve descripción de este sermón…',transcript_ph:'Pega la transcripción completa aquí, o usa el dictado de arriba…',support_ph:'Escribe tu mensaje al soporte de Trinitarian…',send_to_admin:'📨 Enviar Mensaje al Admin',status_approved:'✅ Aprobado',status_rejected:'❌ Rechazado',status_pending:'⏳ Pendiente',support_messages:'Mensajes de Soporte',reports_tab:'Reportes',flagged_tab:'Contenido Marcado',escalations_tab:'Escalaciones',no_sermons_upload:'Sin sermones aún. Haz clic en "Subir Sermón" para compartir tu primer mensaje.',cert_note:'Subir un certificado acelera la verificación pero no es obligatorio.',article:'Artículo',text:'Texto',video:'Vídeo',audio:'Audio',no_sermons_data:'Sin datos de sermones aún',create_account:'Crear Tu Cuenta',create_password:'Crear una Contraseña',failed_notifs:'Error al cargar notificaciones',all_pastors:'Todos los pastores verificados en Trinitarian',overview:'Resumen',my_sermons:'Mis Sermones',upload_sermon:'Subir Sermón',live_stream:'Transmisión en Vivo',settings:'Ajustes',profile:'Perfil',notifications:'Notificaciones',inbox:'Mensajes',pastors:'Pastores',users:'Usuarios',analytics:'Análisis',sign_out:'Cerrar Sesión',sign_in:'Iniciar Sesión',total_sermons:'Total Sermones',total_views:'Total Vistas',new_followers:'Nuevos Seguidores',followers:'Seguidores',views:'Vistas',recent_sermons:'Sermones Recientes',save:'Guardar',cancel:'Cancelar',publish_sermon:'Publicar Sermón',edit_sermon:'Editar Sermón',remove_sermon:'Eliminar Sermón',save_changes:'Guardar Cambios',send_message:'Enviar Mensaje',loading:'Cargando...',no_sermons:'No se encontraron sermones',no_notifs:'No hay notificaciones',no_messages:'No hay mensajes',mark_all_read:'Marcar todo como leído',language:'Idioma',privacy_policy:'Política de Privacidad',terms_of_service:'Términos de Servicio',go_live:'Ir en Vivo',my_profile:'Mi Perfil',change_password:'Cambiar Contraseña',security:'Seguridad',legal:'Legal',account:'Cuenta',nav_messages:'Mensajes'},
  de:{coming_soon:'Demnächst',coming_soon_sub:'Diese Funktion kommt bald',live_coming_soon_desc:'Live-Streaming befindet sich in der Entwicklung und wird in einem zukünftigen Update verfügbar sein.',notify_when_ready:'Sie werden benachrichtigt, wenn diese Funktion gestartet wird.',pastor_portal:'Pastor Portal',admin_panel:'Admin Panel',total_users:'Total Users',new_sermons:'Neue Predigten',verified_pastors:'Verified Pastors',pending_apps:'Pending Applications',unresolved_flags:'Unresolved Flags',here_how:'So entwickelt sich dein Dienst',track_ministry:'Track your ministry\'s reach and impact',share_message:'Share your message with the world',share_worldwide:'Share your sermons with believers worldwide',manage_content:'Manage all your uploaded content',manage_users:'Manage platform users',manage_platform:'Manage platform and content',manage_account:'Kontopräferenzen verwalten',manage_profile:'Pastor-Profil verwalten',go_live_sub:'Go live and connect with your congregation',ministry_activity:'Stay updated on your ministry activity',notifs_support:'Notifications and support messages',browse_pastors:'Browse sermons from all verified pastors',title:'Title',description:'Description',category:'Category',type:'Type',media_file:'Media File',scripture_ref:'Scripture Reference',delete:'Delete',dismiss:'Dismiss',preview:'Vorschau',stream_title:'Stream Title',stream_key:'Stream Key',schedule_stream:'Schedule Stream',scheduled_dt:'Scheduled Date & Time',go_live_btn:'Go Live',your_streams:'Your Streams',font_display:'Schrift & Anzeige',font_size:'Schriftgröße',font_style:'Schriftstil',line_spacing:'Zeilenabstand',new_password:'New Password',current_password:'Current Password',confirm_new_pwd:'Confirm New Password',update_password:'Update Password',pwd_sub:'Update your account password',reset_password:'Reset Password',email_reset:'Enter your email and we will send you a reset link',display_name:'Anzeigename',email:'Email',email_address:'Email Address',username:'Benutzername',church_name:'Church Name',denomination:'Konfession',ordaining_body:'Ordaining Body',years_ministry:'Years in Ministry',bio:'Bio',your_full_name:'Your Full Name',choose_username:'Choose a Username',no_spaces:'No spaces. Letters and numbers only.',click_photo:'Click photo to update',confirm_password:'Confirm Password',password:'Password',role:'Rolle',pastor_role:'Pastor',pastor_label:'PASTOR',verified_label:'VERIFIED',suspended_label:'Suspended',change_role:'Change Role',all_users:'All Users',no_users:'No users found',failed_users:'Failed to load users',failed_pastors:'Failed to load pastors',failed_admin:'Failed to load admin data',failed_streams:'Failed to load streams',failed_load:'Failed to load',no_sermons_yet:'No sermons yet',upload_first:'Upload your first sermon to get started',no_streams:'No streams yet. Schedule your first live stream above.',no_support:'No support messages yet',no_reports:'No reports',no_flagged:'No flagged content',no_apps:'No applications found',no_content_reported:'No content has been reported yet.',no_escalations:'No escalations yet.',no_prev_escalations:'No previous escalations.',no_pastors_yet:'No verified pastors yet',loading_sermons:'Loading sermons...',loading_reports:'Loading reports...',loading_escalations:'Loading escalations...',could_not_sermons:'Could not load sermons.',could_not_reports:'Could not load reports',could_not_support:'Could not load support messages',small:'Klein',medium:'Mittel',large:'Groß',normal:'Normal',compact:'Kompakt',relaxed:'Entspannt',default_style:'Standard',serif:'Serif',mono:'Mono',all:'All',faith:'Faith',healing:'Healing',marriage:'Marriage',leadership:'Leadership',prayer:'Prayer',prophecy:'Prophecy',prosperity:'Prosperity',salvation:'Salvation',bible_study:'Bible Study',live_streaming:'Live Streaming',live_streams:'Live Streams',messages:'Messages',subject:'Subject',end:'End',archive:'Archive',dmca_policy:'DMCA-Richtlinie',pastor_apps:'Pastor Applications',pastor_verify:'Pastor Verification',ordained_pastor:'An ordained or licensed pastor',leading_church:'Leading or serving in a recognised church or ministry',new_escalation:'New Escalation to Admin',prev_escalations:'Your Previous Escalations',accept:'Accept',decline:'Decline',explore:'Entdecken',trinitarian:'Trinitarian',an_overview:'Overview',notif_live:'Wenn Pastoren denen du folgst live gehen',notif_upload:'Wenn Pastoren denen du folgst hochladen',notif_msg:'Wenn du eine Nachricht erhältst',extra_large:'XL',admin_label:'ADMIN',delete_account:'Mein Konto löschen',sermon_title_label:'Predigttitel *',content_type_label:'Inhaltstyp *',transcript_label:'Transkript / Volltext (optional)',start_dictation:'🎙 Diktat starten',file_select_hint:'Klicken zum Auswählen einer Video-, Audio- oder Dokumentdatei. MP4, MP3, PDF, DOC · Max 500MB',search_sermons_ph:'🔍 Predigten suchen...',search_users_ph:'🔍 Benutzer suchen...',search_pastors_ph:'🔍 Pastoren suchen...',desc_ph:'Kurze Beschreibung dieser Predigt…',transcript_ph:'Fügen Sie hier das vollständige Transkript ein…',support_ph:'Ihre Nachricht an den Trinitarian-Support…',send_to_admin:'📨 Nachricht an Admin senden',status_approved:'✅ Genehmigt',status_rejected:'❌ Abgelehnt',status_pending:'⏳ Ausstehend',support_messages:'Support-Nachrichten',reports_tab:'Meldungen',flagged_tab:'Gemeldete Inhalte',escalations_tab:'Eskalationen',no_sermons_upload:'Noch keine Predigten. Klicke auf "Predigt hochladen" um deine erste Nachricht zu teilen.',cert_note:'Das Hochladen eines Zertifikats beschleunigt die Verifizierung, ist aber nicht erforderlich.',article:'Artikel',text:'Text',video:'Video',audio:'Audio',no_sermons_data:'Noch keine Predigtdaten',create_account:'Ihr Konto erstellen',create_password:'Passwort erstellen',failed_notifs:'Benachrichtigungen konnten nicht geladen werden',all_pastors:'Alle verifizierten Pastoren auf Trinitarian',overview:'Überblick',my_sermons:'Meine Predigten',upload_sermon:'Predigt hochladen',live_stream:'Live-Übertragung',settings:'Einstellungen',profile:'Profil',notifications:'Benachrichtigungen',inbox:'Nachrichten',pastors:'Pastoren',users:'Benutzer',analytics:'Analysen',sign_out:'Abmelden',sign_in:'Anmelden',total_sermons:'Predigten gesamt',total_views:'Aufrufe gesamt',new_followers:'Neue Follower',followers:'Follower',views:'Aufrufe',recent_sermons:'Neueste Predigten',save:'Speichern',cancel:'Abbrechen',publish_sermon:'Predigt veröffentlichen',edit_sermon:'Predigt bearbeiten',remove_sermon:'Predigt entfernen',save_changes:'Änderungen speichern',send_message:'Nachricht senden',loading:'Wird geladen...',no_sermons:'Keine Predigten gefunden',no_notifs:'Keine Benachrichtigungen',no_messages:'Keine Nachrichten',mark_all_read:'Alle als gelesen markieren',language:'Sprache',privacy_policy:'Datenschutzrichtlinie',terms_of_service:'Nutzungsbedingungen',go_live:'Live gehen',my_profile:'Mein Profil',change_password:'Passwort ändern',security:'Sicherheit',legal:'Rechtliches',account:'Konto',nav_messages:'Nachrichten'},
  it:{coming_soon:'Prossimamente',coming_soon_sub:'Questa funzione è in arrivo',live_coming_soon_desc:'Lo streaming live è in fase di sviluppo e sarà disponibile in un futuro aggiornamento.',notify_when_ready:'Verrai notificato quando questa funzione verrà lanciata.',extra_large:'XL',admin_label:'ADMIN',delete_account:'Elimina il Mio Account',sermon_title_label:'Titolo del Sermone *',content_type_label:'Tipo di Contenuto *',transcript_label:'Trascrizione / Testo Completo (opzionale)',start_dictation:'🎙 Avvia dettatura',file_select_hint:'Clicca per selezionare un file video, audio o documento. MP4, MP3, PDF, DOC · Max 500MB',search_sermons_ph:'🔍 Cerca sermoni...',search_users_ph:'🔍 Cerca utenti...',search_pastors_ph:'🔍 Cerca pastori...',desc_ph:'Breve descrizione di questo sermone…',transcript_ph:'Incolla qui la trascrizione completa…',support_ph:'Scrivi il tuo messaggio al supporto Trinitarian…',send_to_admin:'📨 Invia Messaggio all\'Admin',status_approved:'✅ Approvato',status_rejected:'❌ Rifiutato',status_pending:'⏳ In attesa',support_messages:'Messaggi di Supporto',reports_tab:'Segnalazioni',flagged_tab:'Contenuto Segnalato',escalations_tab:'Escalation',no_sermons_upload:'Nessun sermone ancora. Clicca "Carica Sermone" per condividere il tuo primo messaggio.',cert_note:'Caricare un certificato velocizza la verifica ma non è obbligatorio.',article:'Articolo',text:'Testo',video:'Video',audio:'Audio',no_sermons_data:'Nessun dato sermone ancora',create_account:'Crea il Tuo Account',create_password:'Crea una Password',failed_notifs:'Impossibile caricare le notifiche',all_pastors:'Tutti i pastori verificati su Trinitarian',overview:'Panoramica',my_sermons:'I Miei Sermoni',upload_sermon:'Carica Sermone',live_stream:'Diretta',settings:'Impostazioni',profile:'Profilo',notifications:'Notifiche',explore:'Esplora',nav_messages:'Messaggi',explore:'Esplora',inbox:'Messaggi',pastors:'Pastori',users:'Utenti',analytics:'Analisi',sign_out:'Esci',sign_in:'Accedi',total_sermons:'Totale Sermoni',total_views:'Totale Visualizzazioni',new_followers:'Nuovi Follower',followers:'Follower',views:'Visualizzazioni',recent_sermons:'Sermoni Recenti',save:'Salva',cancel:'Annulla',publish_sermon:'Pubblica Sermone',edit_sermon:'Modifica Sermone',remove_sermon:'Rimuovi Sermone',save_changes:'Salva Modifiche',send_message:'Invia Messaggio',loading:'Caricamento...',no_sermons:'Nessun sermone trovato',no_notifs:'Nessuna notifica',no_messages:'Nessun messaggio',mark_all_read:'Segna tutto come letto',language:'Lingua',privacy_policy:'Informativa sulla Privacy',terms_of_service:'Termini di Servizio',go_live:'Vai in Diretta',my_profile:'Il Mio Profilo',change_password:'Cambia Password',security:'Sicurezza',legal:'Note legali',account:'Account'},
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


const API = 'https://trinitarian-backend-production.up.railway.app';
let token = localStorage.getItem('pastor_token');
let user = JSON.parse(localStorage.getItem('pastor_user') || 'null');
let uploadType = 'video';
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
    if (res.status === 401) {
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
  if (name === 'live') initLivePage();
  if (name === 'live') pdInitLiveUI();
  if (name === 'sermons') loadSermons();
  if (name === 'analytics') loadAnalytics(7, document.querySelector('.period-tab.active'));
  if (name === 'live') loadStreams();
  if (name === 'notifications') loadNotifications();
  if (name === 'admin' && ['admin','moderator'].includes(user?.role)) loadAdmin();
  if (name === 'profile') loadProfile();
  if (name === 'inbox') loadInbox();
  if (name === 'explore') loadExplore();
  if (name === 'users') loadUsers();
  if (name === 'pastors') loadPastorsList();
  // Apply translations after all content loads
  setTimeout(() => pdApplyTranslations(pdCurrentLang), 400);
  if (name === 'settings') {
    if(document.getElementById('set-name')) document.getElementById('set-name').textContent = user?.display_name || '—';
    if(document.getElementById('set-username')) document.getElementById('set-username').textContent = user?.username || '—';
    if(document.getElementById('set-email')) document.getElementById('set-email').textContent = user?.email || '—';
    if(document.getElementById('set-denom')) document.getElementById('set-denom').textContent = user?.denomination || localStorage.getItem('pastor_denom') || '—';
    if(document.getElementById('set-role')){const _tt=PD_TRANS[pdCurrentLang]||PD_TRANS.en;document.getElementById('set-role').textContent=user?.role==='admin'?(_tt.admin_label||'ADMIN'):(_tt.pastor_label||'PASTOR');}
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
      token = data.token;
      user = data.user;
      localStorage.setItem('pastor_token', token);
      localStorage.setItem('pastor_user', JSON.stringify(user));
      // Fetch fresh role from server
      try {
        const fresh = await api('/api/auth/me');
        if (fresh?.id) { user = fresh; localStorage.setItem('pastor_user', JSON.stringify(user)); }
      } catch(e) {}
      const role = user?.role || 'listener';
      if (role === 'listener') {
        // Check if they have a pending application
        showAlert('login-error',
          'Your account is awaiting pastor verification. If you have not applied yet, <a onclick="showScreen(\'apply\')" style="color:#D4AF37;cursor:pointer;text-decoration:underline;">click here to apply</a>. Otherwise please wait for admin approval.',
          false, true);
        return;
      }
      if (role === 'pending') {
        showAlert('login-error', '⏳ Your pastor application is under review. You will be notified once approved.', false, true);
        return;
      }
      if (!['pastor','admin','moderator'].includes(role)) {
        showAlert('login-error', 'Your account does not have pastor access.');
        return;
      }
      initDashboard();
    } else {
      showAlert('login-error', data.error || 'Invalid credentials');
    }
  } catch(e) { showAlert('login-error', 'Connection failed. Please try again.'); }
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
  const activeToken = token || localStorage.getItem('trinitarian_token');
  if (!activeToken) {
    showAlert('apply-error', 'Please sign in or register first before applying.');
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
          '✅ Application submitted! We will review it within 3–5 business days and notify you by email at the address you registered with. Once approved, simply sign in here to access your Pastor Dashboard.',
          'success');
      }
    } else {
      showAlert('apply-error', data.error || 'Submission failed. Please ensure you are signed in.');
    }
  } catch(e) { showAlert('apply-error', 'Submission failed. Please check your connection.'); }
}

async function deletePastorAccount(){
  if(!confirm('Are you sure you want to permanently delete your account?\n\nThis will delete all your sermons and data. This cannot be undone.')) return;
  if(!confirm('Final confirmation: Delete account and all content?')) return;
  try{
    await api('/api/users/me','DELETE');
    alert('Account deleted. Sorry to see you go.');
    token=null; user=null;
    localStorage.removeItem('pastor_token');
    localStorage.removeItem('pastor_user');
    showScreen('login');
  }catch(e){ alert('Deletion failed. Please email support@trinitarian.app to request account deletion.'); }
}

function handleLogout() {
  if (!confirm('Are you sure you want to sign out?')) return;
  token = null; user = null;
  localStorage.removeItem('pastor_token');
  localStorage.removeItem('pastor_user');
  showScreen('login');
}

// ── Dashboard Init ──
function initDashboard() {
  showScreen('dashboard');
  // Apply saved language immediately
  const savedLang = localStorage.getItem('trinitarian_pd_lang') || 'en';
  if (savedLang !== 'en') pdApplyTranslations(savedLang);
  // Show notification badge on load
  updateBadges();
  // Poll every 60s
  setInterval(updateBadges, 60000);
  document.getElementById('sidebar-name').textContent = user?.display_name || 'Pastor';
  const savedAvatar=localStorage.getItem('pastor_avatar');
  if(savedAvatar){const av=document.getElementById('profile-avatar');if(av){av.style.backgroundImage='url('+savedAvatar+')';av.style.backgroundSize='cover';av.style.backgroundPosition='center';av.textContent='';const rb=document.getElementById('remove-photo-btn');if(rb)rb.style.display='block';}}
  document.getElementById('sidebar-church').textContent = user?.role?.toUpperCase() || 'PASTOR';
  document.getElementById('dash-role').textContent = (user?.role || 'pastor').toUpperCase();
  document.getElementById('overview-name').textContent = user?.display_name || 'Pastor';
  if (['admin', 'moderator'].includes(user?.role)) {
    document.getElementById('admin-nav').style.display = 'flex';
    if(document.getElementById('users-nav')) document.getElementById('users-nav').style.display = 'flex';
    if(document.getElementById('pastors-nav')) document.getElementById('pastors-nav').style.display = 'flex';
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
  if(document.getElementById('set-role')){const _tt=PD_TRANS[pdCurrentLang]||PD_TRANS.en;document.getElementById('set-role').textContent=user?.role==='admin'?(_tt.admin_label||'ADMIN'):(_tt.pastor_label||'PASTOR');}
  // Hide admin items unless admin/moderator
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  ['admin-nav','users-nav','pastors-nav'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display=isAdmin?'flex':'none';
  });
  const supportTab=document.getElementById('tab-support');
  if(supportTab) supportTab.style.display=(isAdmin||isModerator)?'block':'none';
  // Show escalations tab for admins, mod-escalate for moderators
  const escTab=document.getElementById('tab-escalations');
  if(escTab) escTab.style.display=isAdmin?'inline-flex':'none';
  const modEscTab=document.getElementById('tab-mod-escalate');
  if(modEscTab) modEscTab.style.display=(isModerator&&!isAdmin)?'block':'none';
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
    const unread = (data?.notifications || []).filter(n => !n.is_read).length;
    const badge = document.getElementById('notif-badge');
    if (badge) {
      if (unread > 0) { badge.textContent = unread > 99 ? '99+' : unread; badge.style.display = 'inline'; }
      else { badge.style.display = 'none'; }
    }
    // Check support messages if admin
    if (user?.role === 'admin' || user?.role === 'moderator') {
      const sData = await api('/api/admin/support');
      const unreadSupport = (sData?.messages || []).filter(m => !m.is_read).length;
      const iBadge = document.getElementById('inbox-badge');
      if (iBadge) {
        if (unreadSupport > 0) { iBadge.textContent = unreadSupport > 99 ? '99+' : unreadSupport; iBadge.style.display = 'inline'; }
        else { iBadge.style.display = 'none'; }
      }
    }
  } catch(e) {}
}


// ── Overview ──
async function loadOverview() {
  try {
    const [sermons, analytics] = await Promise.all([
      api('/api/sermons/my/sermons'),
      api('/api/admin/analytics?period=30')
    ]);
    const list = Array.isArray(sermons) ? sermons : [];
    document.getElementById('stat-sermons').textContent = list.length;
    document.getElementById('stat-views').textContent = list.reduce((a, s) => a + (parseInt(s.views_count) || 0), 0).toLocaleString();
    document.getElementById('stat-followers').textContent = analytics?.total_users || '—';
    document.getElementById('stat-streams').textContent = '—';
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
  el.innerHTML = sermons.map(s => `
    <div class="sermon-card" onclick="viewSermon('${s.id}')" style="cursor:pointer;">
      <div class="sermon-thumb">${s.type === 'video' ? '🎬' : s.type === 'audio' ? '🎧' : '📄'}</div>
      <div class="sermon-info">
        <div class="sermon-title">${s.title}</div>
        <div class="sermon-meta">
          <span>👁 ${parseInt(s.views_count || 0).toLocaleString()} views</span>
          <span>${new Date(s.created_at).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'})}</span>
        </div>
      </div>
      <div class="sermon-actions">
        <span class="status-badge ${s.status === 'live' ? 'status-live' : s.status === 'archived' ? 'status-archived' : 'status-pending'}">${s.status?.toUpperCase()}</span>
        ${s.status === 'live' ? `<button class="btn btn-ghost btn-sm" onclick="archiveSermon('${s.id}')">Archive</button>` : ''}
        <button class="btn btn-sm" style="background:rgba(224,85,85,0.1);border:1px solid rgba(224,85,85,0.3);color:var(--error);" onclick="deleteSermon('${s.id}','${s.title.replace(/'/g,'')}')">Delete</button>
      </div>
    </div>
    <div style="display:flex;gap:6px;margin-top:8px;">
      <button onclick="event.stopPropagation();openEditSermon(s)" class="btn btn-ghost btn-sm">✏ Edit</button>
      <button onclick="event.stopPropagation();deleteSermon(s.id,s.title)" class="btn btn-ghost btn-sm" style="color:var(--error);">🗑</button>
      <button onclick="event.stopPropagation();navigator.clipboard.writeText('https://trinitarian.app/?sermon='+s.id).then(function(){showToast('Link copied!');});" class="btn btn-ghost btn-sm" title="Copy link">🔗</button>
    </div>
  `).join('');
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
  }catch(e){alert('Delete failed. Please try again.');}
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
  } catch(e) { alert('Edit failed. Please try again.'); }
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
  if (!confirm('Archive this sermon?')) return;
  try {
    await api(`/api/sermons/${id}/archive`, 'PUT');
    loadSermons();
  } catch(e) { alert('Failed to archive sermon'); }
}

async function archiveAll() {
  if (!confirm('Archive all live sermons?')) return;
  try {
    const data = await api('/api/sermons/my/sermons');
    const live = (Array.isArray(data) ? data : []).filter(s => s.status === 'live');
    await Promise.all(live.map(s => api(`/api/sermons/${s.id}/archive`, 'PUT')));
    alert(`${live.length} sermon(s) archived.`);
    loadSermons();
  } catch(e) { alert('Failed to archive sermons'); }
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

function handleFileSelect(input) {
  const file = input.files[0];
  const nameEl = document.getElementById('file-name');
  if (file) {
    nameEl.innerHTML = `📎 ${file.name} <span onclick="removeMediaFile(event)" style="color:#e05555;cursor:pointer;margin-left:8px;font-size:12px;">✕ Remove</span>`;
  }
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
  hideAlert('upload-error');
  // Show progress
  const btn = document.getElementById('upload-btn');
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
        type: uploadType,
        language: uploadLang,
        category_id: document.getElementById('up-category').value || undefined,
        scripture_reference: document.getElementById('up-scripture').value.trim()
      });
    }
    if (data.id) {
      showAlert('upload-success', '✝ Sermon published successfully!', 'success');
      document.getElementById('up-title').value = '';
      document.getElementById('up-desc').value = '';
      document.getElementById('up-transcript').value = '';
      document.getElementById('up-scripture').value = '';
      document.getElementById('file-name').textContent = '';
    } else {
      showAlert('upload-error', data.error || 'Upload failed. Make sure you are a verified pastor.');
    }
  } catch(e) { showAlert('upload-error', 'Connection failed. Please try again.'); }
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
          <span class="status-badge ${s.status === 'live' ? 'status-live' : s.status === 'ended' ? 'status-archived' : 'status-pending'}">${s.status?.toUpperCase()}</span>
          ${s.status === 'scheduled' ? `<button class="btn btn-gold btn-sm" onclick="goLive('${s.id}')">Go Live</button>` : ''}
          ${s.status === 'live' ? `<button class="btn btn-danger btn-sm" onclick="endStream('${s.id}')">End</button>` : ''}
        </div>
      </div>
      ${s.stream_key && s.status !== 'ended' ? `<div style="margin-bottom:12px;"><span class="section-label" data-i18n="stream_key">Stream Key</span><div class="stream-key-box">${s.stream_key}</div><p style="color:var(--text-muted);font-size:11px;">Use this key in OBS or your streaming software (RTMP)</p></div>` : ''}
      <div style="display:flex;gap:6px;margin-top:8px;">
      <button onclick="event.stopPropagation();openEditSermon(s)" class="btn btn-ghost btn-sm">✏ Edit</button>
      <button onclick="event.stopPropagation();deleteSermon(s.id,s.title)" class="btn btn-ghost btn-sm" style="color:var(--error);">🗑</button>
      <button onclick="event.stopPropagation();navigator.clipboard.writeText('https://trinitarian.app/?sermon='+s.id).then(function(){showToast('Link copied!');});" class="btn btn-ghost btn-sm" title="Copy link">🔗</button>
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
  try { await api(`/api/streams/${id}/go-live`, 'PUT'); loadStreams(); } catch(e) { alert('Failed to go live'); }
}
async function endStream(id) {
  if (!confirm('End this live stream?')) return;
  try { await api(`/api/streams/${id}/end`, 'PUT'); loadStreams(); } catch(e) { alert('Failed to end stream'); }
}

// ── Analytics ──
async function loadAnalytics(period, btn) {
  if (btn) {
    document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
  }
  try {
    const data = await api(`/api/admin/analytics?period=${period}`);
    document.getElementById('an-views').textContent = (data?.total_views || 0).toLocaleString();
    document.getElementById('an-sermons').textContent = data?.live_sermons || 0;
    const top = document.getElementById('top-sermons');
    if (data?.top_sermons?.length) {
      top.innerHTML = data.top_sermons.map((s, i) => `
        <div class="top-sermon-item">
          <div class="rank">#${i+1}</div>
          <div style="flex:1;min-width:0;"><div style="color:var(--white);font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.title}</div></div>
          <div style="color:var(--text-muted);font-size:15px;font-weight:600;">👁 ${parseInt(s.views_count||0).toLocaleString()}</div>
        </div>
        <div style="display:flex;gap:6px;margin-top:8px;">
      <button onclick="event.stopPropagation();openEditSermon(s)" class="btn btn-ghost btn-sm">✏ Edit</button>
      <button onclick="event.stopPropagation();deleteSermon(s.id,s.title)" class="btn btn-ghost btn-sm" style="color:var(--error);">🗑</button>
      <button onclick="event.stopPropagation();navigator.clipboard.writeText('https://trinitarian.app/?sermon='+s.id).then(function(){showToast('Link copied!');});" class="btn btn-ghost btn-sm" title="Copy link">🔗</button>
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
    el.innerHTML = notifs.map(n => `
      <div class="notif-item ${!n.is_read ? 'notif-unread' : ''}">
        <div class="notif-icon">${ICONS[n.type] || '🔔'}</div>
        <div style="flex:1;">
          <div style="color:${n.is_read?'var(--text-sec)':'var(--white)'};font-size:14px;font-weight:${n.is_read?'400':'600'};margin-bottom:3px;">${n.title}</div>
          ${n.body ? `<div style="color:var(--text-muted);font-size:12px;line-height:1.6;">${n.body}</div>` : ''}
        </div>
        ${!n.is_read ? '<div class="notif-dot"></div>' : ''}
      </div>
      <div style="display:flex;gap:6px;margin-top:8px;">
      <button onclick="event.stopPropagation();openEditSermon(s)" class="btn btn-ghost btn-sm">✏ Edit</button>
      <button onclick="event.stopPropagation();deleteSermon(s.id,s.title)" class="btn btn-ghost btn-sm" style="color:var(--error);">🗑</button>
      <button onclick="event.stopPropagation();navigator.clipboard.writeText('https://trinitarian.app/?sermon='+s.id).then(function(){showToast('Link copied!');});" class="btn btn-ghost btn-sm" title="Copy link">🔗</button>
    </div>
  `).join('');
  } catch(e) { document.getElementById('notifications-list').innerHTML = '<p style="color:var(--text-muted);padding:20px;" data-i18n="failed_load">Failed to load notifications</p>'; }
}


async function markAllReadInbox() {
  // Determine active tab
  const notifTab = document.getElementById('tab-notifications');
  const isNotifActive = notifTab && notifTab.classList.contains('btn-gold');
  
  if (isNotifActive) {
    // Mark notifications as read
    await markAllRead();
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
      showToast('All messages marked as read');
    } catch(e) { showToast('Failed to mark as read', 'error'); }
  }
}


async function clearAllNotifications() {
  if (!confirm('Clear all notifications? This cannot be undone.')) return;
  try {
    await api('/api/notifications', 'DELETE');
    loadNotifications();
    updateBadges();
    showToast('All notifications cleared');
  } catch(e) { showToast('Failed to clear notifications', 'error'); }
}

async function clearAllInbox() {
  // Determine active tab
  const notifTab = document.getElementById('tab-notifications');
  const isNotifActive = notifTab && notifTab.classList.contains('btn-gold');

  if (isNotifActive) {
    if (!confirm('Clear all notifications? This cannot be undone.')) return;
    try {
      await api('/api/notifications', 'DELETE');
      loadInbox();
      updateBadges();
      showToast('All notifications cleared');
    } catch(e) { showToast('Failed to clear notifications', 'error'); }
  } else {
    if (!confirm('Clear all support messages? This cannot be undone.')) return;
    try {
      await api('/api/admin/support', 'DELETE');
      loadSupportMessages();
      updateBadges();
      showToast('All messages cleared');
    } catch(e) { showToast('Failed to clear messages', 'error'); }
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
  } catch(e) { showToast('Failed to mark as read', 'error'); }
}

// ── Admin ──
let currentAppFilter = 'pending';
async function filterApps(status, btn) {
  currentAppFilter = status;
  document.querySelectorAll('.app-filter-btn').forEach(b=>{
    b.style.background='transparent';b.style.color='var(--text-muted)';b.style.borderColor='var(--border)';
  });
  if(btn){
    const colors={pending:'rgba(240,165,0,0.1)',approved:'rgba(64,201,106,0.1)',rejected:'rgba(224,85,85,0.1)',all:'rgba(212,175,55,0.1)'};
    const textColors={pending:'var(--warning)',approved:'var(--success)',rejected:'var(--error)',all:'var(--gold)'};
    btn.style.background=colors[status]||colors.all;
    btn.style.color=textColors[status]||textColors.all;
  }
  const url = status==='all' ? '/api/pastors/applications' : '/api/pastors/applications?status='+status;
  try {
    const apps = await api(url);
    const applications = apps?.applications || [];
    renderApplications(applications);
  } catch(e) {}
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
          <div style="color:var(--text-muted);font-size:15px;font-weight:600;">${a.denomination||''} · ${a.church_name||''} · ${a.country||''}</div>
        </div>
        <span class="status-badge ${statusColors[a.status]||'status-pending'}">● ${(a.status||'pending').toUpperCase()}</span>
      </div>
      ${a.statement ? `<div style="color:var(--text-sec);font-size:13px;line-height:1.6;border-left:2px solid var(--gold-border);padding-left:12px;">${a.statement.substring(0,200)}…</div>` : ''}
      ${a.status==='pending'?`<div style="display:flex;gap:8px;">
        <button class="btn btn-sm" style="background:rgba(64,201,106,0.1);border:1px solid rgba(64,201,106,0.4);color:var(--success);" onclick="approveApp('${a.id}','${a.full_name}')">✓ Approve</button>
        <button class="btn btn-sm btn-danger" onclick="rejectApp('${a.id}','${a.full_name}')">✕ Reject</button>
      </div>`:''}
    </div>
    <div style="display:flex;gap:6px;margin-top:8px;">
      <button onclick="event.stopPropagation();openEditSermon(s)" class="btn btn-ghost btn-sm">✏ Edit</button>
      <button onclick="event.stopPropagation();deleteSermon(s.id,s.title)" class="btn btn-ghost btn-sm" style="color:var(--error);">🗑</button>
      <button onclick="event.stopPropagation();navigator.clipboard.writeText('https://trinitarian.app/?sermon='+s.id).then(function(){showToast('Link copied!');});" class="btn btn-ghost btn-sm" title="Copy link">🔗</button>
    </div>
  `).join('');
}

async function approveApp(id, name) {
  if (!confirm(`Approve ${name} as a verified pastor?`)) return;
  try {
    await api(`/api/pastors/applications/${id}/approve`, 'PUT');
    alert(`${name} is now a verified pastor!`);
    loadAdmin();
  } catch(e) { alert('Failed to approve application'); }
}

async function rejectApp(id, name) {
  if (!confirm(`Reject ${name}'s application?`)) return;
  try {
    await api(`/api/pastors/applications/${id}/reject`, 'PUT', { reason: 'Application did not meet requirements' });
    loadAdmin();
  } catch(e) { alert('Failed to reject application'); }
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
  if(!file.type.startsWith('image/')){showToast('Please select an image file');return;}
  if(file.size > 5*1024*1024){showToast('Image must be under 5MB');return;}
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
          .then(d=>{if(d.avatar_url)showToast('Profile photo updated');})
          .catch(()=>{showToast('Photo saved locally');});
      }catch(err){console.error('Avatar display error:',err);}
    };
    reader.onerror=function(){showToast('Could not read image file');};
    reader.readAsDataURL(file);
  }catch(err){
    console.error('uploadPhoto error:',err);
    showToast('Could not update photo');
  }
}

async function saveProfile() {
  try {
    const data = await api('/api/users/me', 'PUT', {
      display_name: document.getElementById('prof-name').value.trim(),
      church_name: document.getElementById('prof-church').value.trim(),
      bio: document.getElementById('prof-bio').value.trim()
    });
    if (data.id || data.message) alert('Profile updated successfully!');
    else alert(data.error || 'Update failed');
  } catch(e) { alert('Failed to save profile'); }
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

// ── Denomination Other ──
document.getElementById('apply-denom').addEventListener('change', function() {
  document.getElementById('denom-other-wrap').style.display = this.value === 'Other' ? 'block' : 'none';
});

// ── Word Count ──
document.getElementById('apply-statement').addEventListener('input', function() {
  const count = this.value.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('word-count').textContent = `${count} words`;
  document.getElementById('word-count').style.color = count >= 100 ? 'var(--success)' : 'var(--text-muted)';
});

// ── Enter Key Login ──
document.getElementById('login-password').addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });

// ── Init ──
async function init() {
  // Apply saved language immediately before anything else
  const savedLang = localStorage.getItem('trinitarian_pd_lang') || 'en';
  pdApplyTranslations(savedLang);
  await loadCategories();
  if (token && user) {
    try {
      const fresh = await api('/api/auth/me');
      if (fresh?.id) { user = fresh; localStorage.setItem('pastor_user', JSON.stringify(user)); initDashboard(); return; }
    } catch(e) {}
  }
  showScreen('login');
}

init();

// ── Download All Sermons ──
async function downloadAllSermons() {
  try {
    const data = await api('/api/sermons/my/sermons');
    const list = Array.isArray(data) ? data : [];
    if (!list.length) { alert('No sermons to download.'); return; }
    const text = list.map(s => `Title: ${s.title}\nType: ${s.type}\nViews: ${s.views_count||0}\nDate: ${new Date(s.created_at).toLocaleDateString()}\nTranscript: ${s.transcript||'N/A'}\n\n---\n`).join('\n');
    const blob = new Blob([text], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='my-sermons.txt'; a.click();
  } catch(e) { alert('Download failed'); }
}

// ── Search sermons ──
let allSermonsCache = [];
async function loadSermons() {
  try {
    const data = await api('/api/sermons/my/sermons');
    allSermonsCache = Array.isArray(data) ? data : [];
    renderFilteredSermons(allSermonsCache);
  } catch(e) { document.getElementById('all-sermons').innerHTML = '<p style="color:var(--text-muted);padding:20px;" data-i18n="failed_load">Failed to load</p>'; }
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
  const reportsEl = document.getElementById('reports-list');
  const flaggedEl = document.getElementById('flagged-list');
  if (reportsEl) reportsEl.style.display = tab === 'reports' ? 'block' : 'none';
  if (flaggedEl) flaggedEl.style.display = tab === 'flagged' ? 'block' : 'none';
  if (tab === 'support') loadSupportMessages();
  if (tab === 'reports') loadReports();
  if (tab === 'flagged') loadReports();
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
      user?.role === 'admin' || user?.role === 'moderator' ? api('/api/admin/messages') : Promise.resolve({messages:[]}),
      user?.role === 'admin' || user?.role === 'moderator' ? api('/api/admin/support') : Promise.resolve({messages:[]})
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
            <div style="color:#8fa3c0;font-size:12px;">From: ${m.display_name||m.email||'Listener'} · ${new Date(m.created_at).toLocaleDateString('en-GB')}</div>
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
            <div style="color:#8fa3c0;font-size:12px;">To: ${m.to_name||m.to_email||'User'} · ${new Date(m.created_at).toLocaleDateString('en-GB')}</div>
          </div>
        </div>`).join('');
      if (notifs.length) html += '<div style="height:1px;background:rgba(212,175,55,0.1);margin:16px 0;"></div>';
    }
    
    if (!notifs.length && !msgs.length) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><h3>No messages yet</h3></div>'; return; }
    el.innerHTML = html + notifs.map(n => {
      let nData = null; try { nData = typeof n.data === 'string' ? JSON.parse(n.data) : n.data; } catch(e) {}
      const nSermonId = nData?.sermon_id || nData?.id || null;
      const nHasSermon = nSermonId && n.type === 'new_sermon';
      return `
      <div class="notif-item ${!n.is_read?'notif-unread':''}" onclick="markRead('${n.id}')">
        <div class="notif-icon">${ICONS[n.type]||'🔔'}</div>
        <div style="flex:1;">
          <div style="color:${n.is_read?'var(--text-sec)':'var(--white)'};font-size:14px;font-weight:${n.is_read?'400':'600'};margin-bottom:3px;">${n.title}</div>
          ${n.body?`<div style="color:var(--text-muted);font-size:13px;margin-bottom:6px;">${n.body}</div>`:''}
          ${nHasSermon ? `<button onclick="event.stopPropagation();viewSermon('${nSermonId}')" style="background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.3);color:#D4AF37;border-radius:10px;padding:4px 12px;font-size:12px;cursor:pointer;">🎧 Open Sermon</button>` : ''}
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
    .then(()=>showToast('Profile photo removed'))
    .catch(()=>{});
}


async function loadAdminEscalations(){
  const content=document.getElementById('inbox-content');
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
  if(!response){alert('Please enter a response');return;}
  try{
    await api('/api/admin/escalations/'+id,'PUT',{response,status});
    showToast('Response sent to moderator');
    loadAdminEscalations();
  }catch(e){alert('Failed to respond: '+e.message);}
}


async function loadEscalations(){
  const wrap=document.getElementById('escalations-list-wrap');
  if(!wrap)return;
  try{
    const data=await api('/api/admin/escalations');
    const list=(data.escalations||[]).filter(e=>e.moderator_id===user?.id);
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
  const content=document.getElementById('inbox-content');
  if(!content)return;
  content.innerHTML=`<div style="max-width:600px;">
    <div id="escalations-list-wrap" style="margin-bottom:24px;"></div>
    <div class="card">
      <h3 style="color:var(--white);font-size:15px;margin-bottom:16px;" data-i18n="new_escalation">New Escalation to Admin</h3>
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
        <input type="text" id="esc-subject" class="form-control" placeholder="Brief summary"/>
      </div>
      <div class="form-group">
        <label class="form-label" data-i18n="description">Description</label>
        <textarea id="esc-description" class="form-control" rows="5" placeholder="Describe the issue in detail..."></textarea>
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
    showToast('✅ Escalation submitted. Admin has been notified.');
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
    showToast('Report resolved');
    loadReports();
  }catch(e){alert('Failed to resolve: '+e.message);}
}

async function removeReportedContent(sermonId){
  if(!confirm('Remove this sermon permanently?'))return;
  try{
    await api('/api/sermons/'+sermonId,'DELETE');
    showToast('Content removed');
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
    if(_recognition)_recognition.stop();
    return;
  }
  // Start
  _recognition = new SR();
  _recognition.continuous = true;
  _recognition.interimResults = true;
  _recognition.lang = document.getElementById('up-lang')?.value==='fr'?'fr-FR':document.getElementById('up-lang')?.value==='pt'?'pt-PT':'en-US';
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
    if(status)status.textContent='Dictation error: '+e.error+(e.error==='not-allowed'?' (please allow microphone access)':'');
  };
  _recognition.onend=function(){
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
let currentStreamId = null;
let liveStartTime = null;
let liveTimerInterval = null;
let viewerCountInterval = null;
let audioMuted = false;
let videoMuted = false;

function pdInitLiveUI() {
  if (LIVE_ENABLED) {
    document.getElementById('live-coming-soon').style.display = 'none';
    document.getElementById('live-full-ui').style.display = 'block';
    pdLoadStreams();
  }
}

async function pdLoadStreams() {
  const token = localStorage.getItem('trinitarian_token') || '';
  try {
    const res = await fetch(API + '/api/streams?status=scheduled', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const streams = await res.json();
    const el = document.getElementById('pd-streams-list');
    if (!streams.length) {
      el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted);"><div style="font-size:32px;margin-bottom:12px;">📅</div><p>No streams yet. Schedule your first live stream above.</p></div>';
      return;
    }
    el.innerHTML = streams.map(s => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px;background:var(--navy3);border-radius:12px;margin-bottom:8px;">
        <div>
          <div style="color:#fff;font-size:14px;font-weight:600;">${s.title}</div>
          <div style="color:var(--text-muted);font-size:12px;margin-top:2px;">${s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : 'Unscheduled'}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button onclick="pdGoLiveStream('${s.id}','${s.title.replace(/'/g,"\'")}')" style="background:rgba(224,85,85,0.15);color:#e05555;border:1px solid rgba(224,85,85,0.3);border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;">Go Live</button>
          <button onclick="pdDeleteStream('${s.id}')" style="background:transparent;color:var(--text-muted);border:1px solid var(--border);border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;">Delete</button>
        </div>
      </div>
    `).join('');
  } catch(e) {
    document.getElementById('pd-streams-list').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Could not load streams</p>';
  }
}

async function pdScheduleStream() {
  const title = document.getElementById('new-stream-title').value.trim();
  const dt = document.getElementById('new-stream-dt').value;
  const cat = document.getElementById('new-stream-cat').value;
  if (!title) { showToast('Please enter a stream title', 'error'); return; }
  const token = localStorage.getItem('trinitarian_token') || '';
  try {
    const res = await fetch(API + '/api/streams', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, scheduled_at: dt || null, category: cat })
    });
    const data = await res.json();
    if (data.coming_soon) { showToast('Live streaming coming soon!', 'info'); return; }
    if (!res.ok) throw new Error(data.error);
    showToast('Stream scheduled!', 'success');
    document.getElementById('new-stream-title').value = '';
    document.getElementById('new-stream-dt').value = '';
    pdLoadStreams();
  } catch(e) {
    showToast('Failed to schedule stream', 'error');
  }
}

async function pdGoLiveNow() {
  const title = document.getElementById('new-stream-title').value.trim() || 'Live Stream';
  const token = localStorage.getItem('trinitarian_token') || '';
  try {
    // Create stream then immediately start it
    const res = await fetch(API + '/api/streams', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    const data = await res.json();
    if (data.coming_soon) { showToast('Live streaming coming soon!', 'info'); return; }
    if (!res.ok) throw new Error(data.error);
    await pdGoLiveStream(data.id, data.title);
  } catch(e) {
    showToast('Failed to go live', 'error');
  }
}

async function pdGoLiveStream(streamId, streamTitle) {
  if (!LIVE_ENABLED) { showToast('Live streaming coming soon!', 'info'); return; }
  const token = localStorage.getItem('trinitarian_token') || '';
  try {
    const res = await fetch(API + '/api/streams/' + streamId + '/start', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Initialize Agora client
    agoraClient = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    await agoraClient.setClientRole('host');
    await agoraClient.join(data.app_id, data.channel_name, data.token, data.uid);

    // Create local tracks
    [localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
    await agoraClient.publish([localAudioTrack, localVideoTrack]);

    // Show local video
    localVideoTrack.play('local-video');

    currentStreamId = streamId;
    liveStartTime = Date.now();

    // Show broadcast panel
    document.getElementById('live-broadcast-panel').style.display = 'block';
    document.getElementById('go-live-btn').style.display = 'none';
    document.getElementById('live-stream-title').textContent = streamTitle;

    // Start timer
    liveTimerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - liveStartTime) / 1000);
      const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      document.getElementById('live-duration').textContent = m + ':' + s;
    }, 1000);

    // Poll viewer count every 30s
    viewerCountInterval = setInterval(async () => {
      try {
        const r = await fetch(API + '/api/streams/' + streamId, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const d = await r.json();
        document.getElementById('live-viewer-count').textContent = '👁 ' + (d.viewer_count || 0) + ' watching';
      } catch(e) {}
    }, 30000);

    showToast('You are now live!', 'success');
  } catch(e) {
    console.error('Go live error:', e);
    showToast('Failed to start stream: ' + e.message, 'error');
  }
}

async function pdEndLive() {
  if (!currentStreamId) return;
  if (!confirm('Are you sure you want to end the live stream?')) return;
  const token = localStorage.getItem('trinitarian_token') || '';
  try {
    // Stop Agora
    if (localAudioTrack) { localAudioTrack.stop(); localAudioTrack.close(); }
    if (localVideoTrack) { localVideoTrack.stop(); localVideoTrack.close(); }
    if (agoraClient) await agoraClient.leave();

    // Clear timers
    clearInterval(liveTimerInterval);
    clearInterval(viewerCountInterval);

    // End stream on backend
    await fetch(API + '/api/streams/' + currentStreamId + '/end', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    // Reset UI
    document.getElementById('live-broadcast-panel').style.display = 'none';
    document.getElementById('go-live-btn').style.display = 'flex';
    document.getElementById('local-video').innerHTML = '';
    currentStreamId = null;
    liveStartTime = null;

    showToast('Stream ended', 'success');
    pdLoadStreams();
  } catch(e) {
    showToast('Error ending stream', 'error');
  }
}

async function pdDeleteStream(streamId) {
  if (!confirm('Delete this scheduled stream?')) return;
  const token = localStorage.getItem('trinitarian_token') || '';
  try {
    await fetch(API + '/api/streams/' + streamId, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    showToast('Stream deleted', 'success');
    pdLoadStreams();
  } catch(e) {
    showToast('Failed to delete', 'error');
  }
}

async function pdToggleMute(type) {
  if (type === 'audio' && localAudioTrack) {
    audioMuted = !audioMuted;
    await localAudioTrack.setMuted(audioMuted);
    document.getElementById('btn-mute-audio').textContent = audioMuted ? '🔇' : '🎙';
  } else if (type === 'video' && localVideoTrack) {
    videoMuted = !videoMuted;
    await localVideoTrack.setMuted(videoMuted);
    document.getElementById('btn-mute-video').textContent = videoMuted ? '📵' : '📷';
  }
}

// Initialize live UI when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Called when navigating to live page
});



// ── LIVE STREAM (Agora) ──────────────────────────────────────────────────────
// LIVE_ENABLED already declared above
// AGORA_APP_ID already declared above
// agoraClient, localVideoTrack, localAudioTrack already declared above
let isStreaming = false, isMicOn = true, isCamOn = true;
let streamDurationTimer = null, streamSeconds = 0, currentChannelName = null;
let viewerPollInterval = null;

function initLivePage() {
  const enabled = typeof LIVE_ENABLED !== 'undefined' && LIVE_ENABLED;
  document.getElementById('live-coming-soon').style.display = enabled ? 'none' : 'block';
  document.getElementById('live-studio').style.display = enabled ? 'block' : 'none';
  if (enabled) loadPastStreams();
}

async function startLiveStream() {
  const title = (document.getElementById('live-title').value||'').trim();
  if (!title) { showToast('Please enter a stream title'); return; }
  const token = localStorage.getItem('pastor_token');
  try {
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
    currentStreamId = stream.id;
    currentChannelName = stream.channel_name;

    // 2. Start stream - get Agora token
    const startRes = await fetch(API + '/api/streams/' + stream.id + '/start', {
      method:'POST', headers:{'Authorization':'Bearer '+token}
    });
    const data = await startRes.json();
    if (!startRes.ok) throw new Error(data.error || 'Failed to start stream');

    // 3. Join Agora channel
    agoraClient = AgoraRTC.createClient({mode:'live',codec:'vp8'});
    await agoraClient.setClientRole('host');
    await agoraClient.join(data.app_id, data.channel_name, data.token, data.uid);
    const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
    localAudioTrack = tracks[0]; localVideoTrack = tracks[1];
    localVideoTrack.play('local-video-container');
    await agoraClient.publish([localAudioTrack, localVideoTrack]);

    isStreaming = true;
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
    showToast('You are now live!');
  } catch(e) { console.error('Live stream error:',e); showToast('Failed to start stream: ' + (e.message||'Please try again.')); }
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
    showToast('Stream ended. Great job!');
    loadPastStreams();
  } catch(e) { console.error('End stream error:',e); showToast('Error ending stream'); }
}

function toggleMic() {
  if (!localAudioTrack) return;
  isMicOn = !isMicOn; localAudioTrack.setEnabled(isMicOn);
  document.getElementById('btn-mic').textContent = isMicOn ? '🎙' : '🔇';
  document.getElementById('btn-mic').style.borderColor = isMicOn ? 'var(--border)' : '#e53e3e';
}

function toggleCamera() {
  if (!localVideoTrack) return;
  isCamOn = !isCamOn; localVideoTrack.setEnabled(isCamOn);
  document.getElementById('btn-cam').textContent = isCamOn ? '📷' : '🚫';
  document.getElementById('btn-cam').style.borderColor = isCamOn ? 'var(--border)' : '#e53e3e';
}

async function loadPastStreams() {
  try {
    const token = localStorage.getItem('pastor_token');
    const r = await fetch(API_BASE+'/live/history', {headers:{'Authorization':'Bearer '+token}});
    const data = await r.json();
    const container = document.getElementById('past-streams-list');
    if (!data.streams || !data.streams.length) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px;">No past streams yet</p>';
      return;
    }
    container.innerHTML = data.streams.map(function(s) {
      return '<div style="background:var(--navy3);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;"><div><div style="color:#e8e8e8;font-size:13px;font-weight:600;">'+s.title+'</div><div style="color:var(--text-muted);font-size:11px;margin-top:2px;">'+new Date(s.created_at).toLocaleDateString()+' · '+Math.round((s.duration||0)/60)+' min · 👥 '+(s.peak_viewers||0)+' peak</div></div><div style="color:var(--gold);font-size:11px;font-weight:600;">ENDED</div></div>';
    }).join('');
  } catch(e) {
    document.getElementById('past-streams-list').innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px;">Could not load past streams</p>';
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
    if (!msg) { alert('Message not found'); return; }
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
  } catch(e) { alert('Could not open message'); }
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
        if (adminNav) adminNav.style.display = ['admin','moderator'].includes(user.role) ? 'flex' : 'none';
      }
    } catch(e) {}
  }
});


// ── View sermon with media player ──
async function viewSermon(id) {
  try {
    // First try from cache
    let s = allSermonsCache?.find(x => x.id == id);
    if (!s) {
      const data = await api('/api/sermons/' + id);
      s = data?.sermon || data?.sermons?.[0] || data;
    }
    if (!s?.id) { alert('Sermon not found'); return; }
    
    const overlay = document.createElement('div');
    overlay.id = 'sermon-view-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;flex-direction:column;overflow-y:auto;';
    
    let mediaHtml = '';
    if (s.media_url && s.type === 'video') {
      mediaHtml = `<video controls style="width:100%;max-height:400px;background:#000;border-radius:8px;" src="${s.media_url}">Your browser does not support video.</video>`;
    } else if (s.media_url && s.type === 'audio') {
      mediaHtml = `<audio controls style="width:100%;margin:16px 0;accent-color:#D4AF37;" src="${s.media_url}">Your browser does not support audio.</audio>`;
    } else if (!s.media_url) {
      mediaHtml = `<div style="background:#071528;border-radius:8px;padding:20px;text-align:center;color:#8fa3c0;font-size:13px;">No media file for this sermon.</div>`;
    }
    
    overlay.innerHTML = `
      <div style="background:#0d2142;min-height:100%;max-width:700px;margin:0 auto;width:100%;padding:24px;">
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
        ${s.description ? `<div style="color:#b0c4d8;font-size:14px;line-height:1.7;margin-top:16px;padding:16px;background:#071528;border-radius:8px;">${s.description}</div>` : ''}
        ${s.transcript ? `<div style="margin-top:16px;"><div style="color:#D4AF37;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Transcript</div><div style="color:#b0c4d8;font-size:14px;line-height:1.8;white-space:pre-wrap;background:#071528;padding:16px;border-radius:8px;">${s.transcript}</div></div>` : ''}
        <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
          <button onclick="editSermon && openEditSermon(${JSON.stringify(s).replace(/'/g,'\'').replace(/"/g,'&quot;')})" style="background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.3);color:#D4AF37;border-radius:10px;padding:9px 18px;cursor:pointer;font-size:13px;">✏ Edit</button>
          <button onclick="deleteSermon('${s.id}','${s.title?.replace(/'/g,"\'")}');document.getElementById('sermon-view-overlay').remove();" style="background:rgba(224,85,85,0.1);border:1px solid rgba(224,85,85,0.3);color:#e05555;border-radius:10px;padding:9px 18px;cursor:pointer;font-size:13px;">🗑 Delete</button>
          <button onclick="copySermonLink('${s.id}')" style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.2);color:#b0c4d8;border-radius:10px;padding:9px 18px;cursor:pointer;font-size:13px;">🔗 Copy Link</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  } catch(e) {
    console.error('viewSermon error:', e);
    alert('Could not load sermon. Please try again.');
  }
}
