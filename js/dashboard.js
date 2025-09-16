/**
 * LOCAYA - Module Dashboard
 * Gestion du tableau de bord utilisateur, favoris, profil et paramètres
 */

// === VARIABLES GLOBALES ===
let currentTab = 'overview';
let userFavorites = [];
let userSearchHistory = [];
let userMessages = [];
let userSettings = {
    emailNotifications: true,
    darkMode: false,
    saveSearches: true
};

// === INITIALISATION ===
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

/**
 * Initialise le tableau de bord
 */
function initializeDashboard() {
    console.log('📊 Initialisation du tableau de bord...');
    
    // Vérifier l'authentification
    if (!currentUser) {
        window.location.href = 'login.html?return=' + encodeURIComponent(window.location.href);
        return;
    }
    
    // Charger les données utilisateur
    loadUserData();
    
    // Initialiser l'interface
    initializeDashboardUI();
    
    // Charger l'onglet depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab') || 'overview';
    const welcome = urlParams.get('welcome');
    
    // Afficher la bannière de bienvenue si nouveau compte
    if (welcome === 'true') {
        showWelcomeBanner();
    }
    
    // Initialiser les événements
    initializeDashboardEvents();
    
    // Charger l'onglet
    switchTab(tab);
    
    console.log('✅ Dashboard initialisé avec succès');
}

/**
 * Charge les données utilisateur depuis localStorage
 */
function loadUserData() {
    // Charger les favoris
    const favKey = `favorites_${currentUser.id}`;
    userFavorites = JSON.parse(localStorage.getItem(favKey) || '[]');
    
    // Charger l'historique de recherche
    const searchKey = `searchHistory_${currentUser.id}`;
    userSearchHistory = JSON.parse(localStorage.getItem(searchKey) || '[]');
    
    // Charger les messages
    const messagesKey = `messages_${currentUser.id}`;
    userMessages = JSON.parse(localStorage.getItem(messagesKey) || '[]');
    
    // Charger les paramètres
    const settingsKey = `settings_${currentUser.id}`;
    const savedSettings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
    userSettings = { ...userSettings, ...savedSettings };
    
    console.log(`📊 Données chargées: ${userFavorites.length} favoris, ${userSearchHistory.length} recherches, ${userMessages.length} messages`);
}

/**
 * Initialise l'interface utilisateur
 */
function initializeDashboardUI() {
    // Mettre à jour l'header avec l'utilisateur
    const userWelcome = document.getElementById('userWelcome');
    if (userWelcome) {
        userWelcome.textContent = `Bonjour, ${currentUser.name.split(' ')[0]} !`;
    }
    
    // Mettre à jour le titre selon le type de compte
    const dashboardTitle = document.getElementById('dashboardTitle');
    const dashboardSubtitle = document.getElementById('dashboardSubtitle');
    
    if (currentUser.accountType === 'owner') {
        if (dashboardTitle) dashboardTitle.textContent = 'Espace Propriétaire';
        if (dashboardSubtitle) dashboardSubtitle.textContent = 'Gérez vos biens et contacts';
    }
    
    // Charger les statistiques
    updateDashboardStats();
    
    // Initialiser le profil
    initializeProfileForm();
    
    // Appliquer les paramètres
    applyUserSettings();
}

/**
 * Met à jour les statistiques du dashboard
 */
function updateDashboardStats() {
    // Compter les favoris
    document.getElementById('favoritesCount').textContent = userFavorites.length;
    
    // Compter les recherches
    document.getElementById('searchesCount').textContent = userSearchHistory.length;
    
    // Compter les messages
    document.getElementById('messagesCount').textContent = userMessages.length;
    
    // Calculer les jours d'activité
    const joinDate = new Date(currentUser.joinDate);
    const today = new Date();
    const daysDiff = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));
    document.getElementById('daysActive').textContent = daysDiff;
    
    // Animer les compteurs
    setTimeout(() => {
        initializeCounters();
    }, 500);
}

// === GESTION DES ONGLETS ===

/**
 * Change d'onglet dans le dashboard
 * @param {string} tabName - Nom de l'onglet à afficher
 */
function switchTab(tabName) {
    currentTab = tabName;
    
    // Mettre à jour la navigation
    const navButtons = document.querySelectorAll('.dashboard-nav button');
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Masquer tous les onglets
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    
    // Afficher l'onglet sélectionné
    const activeTab = document.getElementById(`${tabName}-tab`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.style.display = 'block';
        
        // Charger le contenu spécifique à l'onglet
        switch (tabName) {
            case 'overview':
                loadOverviewContent();
                break;
            case 'favorites':
                loadFavoritesContent();
                break;
            case 'searches':
                loadSearchesContent();
                break;
            case 'messages':
                loadMessagesContent();
                break;
            case 'profile':
                loadProfileContent();
                break;
        }
        
        // Réinitialiser les animations
        setTimeout(() => {
            initializeScrollAnimations();
        }, 100);
    }
    
    // Mettre à jour l'URL
    const url = new URL(window.location);
    url.searchParams.set('tab', tabName);
    window.history.replaceState(null, '', url);
}

// === CONTENU DES ONGLETS ===

/**
 * Charge le contenu de l'onglet vue d'ensemble
 */
function loadOverviewContent() {
    // Charger l'activité récente
    loadRecentActivity();
}

/**
 * Charge le contenu de l'onglet favoris
 */
async function loadFavoritesContent() {
    const favoritesList = document.getElementById('favoritesList');
    const noFavorites = document.getElementById('noFavorites');
    
    if (userFavorites.length === 0) {
        favoritesList.style.display = 'none';
        noFavorites.style.display = 'block';
        return;
    }
    
    noFavorites.style.display = 'none';
    favoritesList.style.display = 'grid';
    
    // Charger les détails des propriétés favorites
    try {
        const response = await fetch('data/properties.json');
        const allProperties = await response.json();
        
        const favoriteProperties = allProperties.filter(p => 
            userFavorites.includes(p.id)
        );
        
        // Trier selon la sélection
        const sortBy = document.getElementById('favoritesSort').value;
        sortFavoriteProperties(favoriteProperties, sortBy);
        
        favoritesList.innerHTML = favoriteProperties.map((property, index) => 
            createFavoriteCard(property, index * 100)
        ).join('');
        
        // Réinitialiser les animations
        setTimeout(() => {
            initializeScrollAnimations();
        }, 100);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des favoris:', error);
        favoritesList.innerHTML = `
            <div class="error-message">
                Erreur lors du chargement des favoris
            </div>
        `;
    }
}

/**
 * Charge le contenu de l'onglet recherches
 */
function loadSearchesContent() {
    const searchHistory = document.getElementById('searchHistory');
    const noSearches = document.getElementById('noSearches');
    
    if (userSearchHistory.length === 0) {
        searchHistory.style.display = 'none';
        noSearches.style.display = 'block';
        return;
    }
    
    noSearches.style.display = 'none';
    searchHistory.style.display = 'block';
    
    // Trier par date (plus récents en premier)
    const sortedSearches = [...userSearchHistory].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    searchHistory.innerHTML = sortedSearches.map((search, index) => 
        createSearchHistoryCard(search, index * 50)
    ).join('');
}

/**
 * Charge le contenu de l'onglet messages
 */
function loadMessagesContent() {
    const messagesList = document.getElementById('messagesList');
    const noMessages = document.getElementById('noMessages');
    
    if (userMessages.length === 0) {
        messagesList.style.display = 'none';
        noMessages.style.display = 'block';
        return;
    }
    
    noMessages.style.display = 'none';
    messagesList.style.display = 'block';
    
    // Trier par date (plus récents en premier)
    const sortedMessages = [...userMessages].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    messagesList.innerHTML = sortedMessages.map((message, index) => 
        createMessageCard(message, index * 50)
    ).join('');
}

/**
 * Charge le contenu de l'onglet profil
 */
function loadProfileContent() {
    // Le contenu est déjà initialisé dans initializeProfileForm
}

// === CRÉATION DES CARTES ===

/**
 * Crée une carte de favori
 * @param {Object} property - Propriété favorite
 * @param {number} delay - Délai d'animation
 * @returns {string} HTML de la carte
 */
function createFavoriteCard(property, delay = 0) {
    return `
        <div class="property-card hover-lift fade-in-up" style="animation-delay: ${delay}ms;" data-property-id="${property.id}">
            <div class="property-image">
                <img src="${property.images[0]}" alt="${property.title}" loading="lazy">
                <div class="property-badge">${property.status}</div>
                <button class="property-favorite active" onclick="removeFavorite(${property.id})" title="Retirer des favoris">
                    💖
                </button>
            </div>
            
            <div class="property-content">
                <h3 class="property-title">${property.title}</h3>
                <div class="property-location">
                    📍 ${property.location}
                </div>
                
                <div class="property-features">
                    <span>🛏️ ${property.bedrooms} ch.</span>
                    <span>🚿 ${property.bathrooms} sdb</span>
                    <span>📐 ${property.area}m²</span>
                </div>
                
                <div class="property-price">
                    ${formatPrice(property.price)} FCFA/${property.period}
                </div>
                
                <div style="display: flex; align-items: center; gap: var(--spacing-2); margin-bottom: var(--spacing-3);">
                    <div class="stars">
                        ${createStarRating(property.rating)}
                    </div>
                    <span style="color: var(--gray-600); font-size: var(--font-size-sm);">
                        ${property.rating}/5
                    </span>
                </div>
                
                <div class="property-actions">
                    <a href="property.html?id=${property.id}" class="btn btn-primary">
                        Voir détails
                    </a>
                    <button class="btn btn-outline btn-sm" onclick="contactOwner(${property.id})">
                        📞
                    </button>
                </div>
                
                <div style="text-align: center; margin-top: var(--spacing-3);">
                    <button onclick="removeFavorite(${property.id})" class="btn btn-outline btn-sm">
                        🗑️ Retirer des favoris
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Crée une carte d'historique de recherche
 * @param {Object} search - Recherche sauvegardée
 * @param {number} delay - Délai d'animation
 * @returns {string} HTML de la carte
 */
function createSearchHistoryCard(search, delay = 0) {
    const date = new Date(search.timestamp).toLocaleDateString('fr-FR');
    const time = new Date(search.timestamp).toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    return `
        <div class="card hover-lift fade-in-up" style="animation-delay: ${delay}ms; margin-bottom: var(--spacing-4);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--spacing-4);">
                <div style="flex: 1;">
                    <h4 style="margin-bottom: var(--spacing-2);">
                        ${search.query || 'Recherche générale'}
                    </h4>
                    <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-2); margin-bottom: var(--spacing-3);">
                        ${search.filters.location ? `<span class="filter-tag">📍 ${search.filters.location}</span>` : ''}
                        ${search.filters.type ? `<span class="filter-tag">🏠 ${search.filters.type}</span>` : ''}
                        ${search.filters.minPrice ? `<span class="filter-tag">💰 ${formatPrice(search.filters.minPrice)}+ FCFA</span>` : ''}
                        ${search.filters.bedrooms ? `<span class="filter-tag">🛏️ ${search.filters.bedrooms} ch.</span>` : ''}
                    </div>
                    <div style="color: var(--gray-600); font-size: var(--font-size-sm);">
                        ${date} à ${time} • ${search.resultsCount || 0} résultats
                    </div>
                </div>
                <div style="display: flex; gap: var(--spacing-2);">
                    <button onclick="repeatSearch(${JSON.stringify(search.filters).replace(/"/g, '&quot;')})" class="btn btn-primary btn-sm">
                        🔍 Refaire
                    </button>
                    <button onclick="deleteSearch(${search.timestamp})" class="btn btn-outline btn-sm">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Crée une carte de message
 * @param {Object} message - Message
 * @param {number} delay - Délai d'animation
 * @returns {string} HTML de la carte
 */
function createMessageCard(message, delay = 0) {
    const date = new Date(message.date).toLocaleDateString('fr-FR');
    const isUnread = !message.read;
    
    return `
        <div class="card hover-lift fade-in-up ${isUnread ? 'unread-message' : ''}" style="animation-delay: ${delay}ms; margin-bottom: var(--spacing-4);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--spacing-4);">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: var(--spacing-3); margin-bottom: var(--spacing-2);">
                        <div style="width: 40px; height: 40px; background: var(--gradient-primary); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; color: white; font-weight: var(--font-weight-bold);">
                            ${message.from.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <h4>${message.from}</h4>
                            <div style="color: var(--gray-600); font-size: var(--font-size-sm);">
                                ${date} ${isUnread ? '• <strong style="color: var(--primary-violet);">Non lu</strong>' : ''}
                            </div>
                        </div>
                    </div>
                    <h5 style="margin-bottom: var(--spacing-2);">${message.subject}</h5>
                    <p style="color: var(--gray-600); line-height: 1.4;">
                        ${message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content}
                    </p>
                    ${message.propertyId ? `
                        <a href="property.html?id=${message.propertyId}" style="color: var(--primary-violet); font-size: var(--font-size-sm); margin-top: var(--spacing-2); display: inline-block;">
                            🏠 Voir le logement concerné →
                        </a>
                    ` : ''}
                </div>
                <div style="display: flex; gap: var(--spacing-2);">
                    <button onclick="markMessageRead(${message.id})" class="btn btn-primary btn-sm">
                        ${isUnread ? '👁️ Marquer lu' : '💬 Répondre'}
                    </button>
                    <button onclick="deleteMessage(${message.id})" class="btn btn-outline btn-sm">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `;
}

// === ACTIONS FAVORIS ===

/**
 * Retire une propriété des favoris
 * @param {number} propertyId - ID de la propriété
 */
function removeFavorite(propertyId) {
    const favKey = `favorites_${currentUser.id}`;
    userFavorites = userFavorites.filter(id => id !== propertyId);
    localStorage.setItem(favKey, JSON.stringify(userFavorites));
    
    showToast('Favori supprimé', 'Propriété retirée de vos favoris', 'success');
    
    // Recharger la liste des favoris
    loadFavoritesContent();
    
    // Mettre à jour les stats
    updateDashboardStats();
}

/**
 * Trie les propriétés favorites
 */
function sortFavorites() {
    loadFavoritesContent();
}

/**
 * Trie un tableau de propriétés favorites
 * @param {Array} properties - Propriétés à trier
 * @param {string} sortBy - Critère de tri
 */
function sortFavoriteProperties(properties, sortBy) {
    switch (sortBy) {
        case 'recent':
            // Trier par ordre d'ajout (les derniers favoris en premier)
            return properties.reverse();
        case 'price-asc':
            return properties.sort((a, b) => a.price - b.price);
        case 'price-desc':
            return properties.sort((a, b) => b.price - a.price);
        case 'rating':
            return properties.sort((a, b) => b.rating - a.rating);
        default:
            return properties;
    }
}

/**
 * Supprime tous les favoris
 */
function clearAllFavorites() {
    if (userFavorites.length === 0) {
        showToast('Aucun favori', 'Vous n\'avez pas de favoris à supprimer', 'info');
        return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer tous vos ${userFavorites.length} favoris ?`)) {
        const favKey = `favorites_${currentUser.id}`;
        userFavorites = [];
        localStorage.setItem(favKey, JSON.stringify(userFavorites));
        
        showToast('Favoris supprimés', 'Tous vos favoris ont été supprimés', 'success');
        
        loadFavoritesContent();
        updateDashboardStats();
    }
}

// === ACTIONS RECHERCHES ===

/**
 * Refait une recherche sauvegardée
 * @param {Object} filters - Filtres de la recherche
 */
function repeatSearch(filters) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
    });
    
    window.location.href = `search.html?${params.toString()}`;
}

/**
 * Supprime une recherche de l'historique
 * @param {number} timestamp - Timestamp de la recherche
 */
function deleteSearch(timestamp) {
    const searchKey = `searchHistory_${currentUser.id}`;
    userSearchHistory = userSearchHistory.filter(search => search.timestamp !== timestamp);
    localStorage.setItem(searchKey, JSON.stringify(userSearchHistory));
    
    showToast('Recherche supprimée', 'Recherche retirée de l\'historique', 'success');
    
    loadSearchesContent();
    updateDashboardStats();
}

/**
 * Efface tout l'historique de recherche
 */
function clearSearchHistory() {
    if (userSearchHistory.length === 0) {
        showToast('Historique vide', 'Vous n\'avez pas d\'historique à supprimer', 'info');
        return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir effacer tout votre historique (${userSearchHistory.length} recherches) ?`)) {
        const searchKey = `searchHistory_${currentUser.id}`;
        userSearchHistory = [];
        localStorage.setItem(searchKey, JSON.stringify(userSearchHistory));
        
        showToast('Historique effacé', 'Tout votre historique a été supprimé', 'success');
        
        loadSearchesContent();
        updateDashboardStats();
    }
}

// === ACTIONS MESSAGES ===

/**
 * Marque un message comme lu
 * @param {number} messageId - ID du message
 */
function markMessageRead(messageId) {
    const messagesKey = `messages_${currentUser.id}`;
    userMessages = userMessages.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
    );
    localStorage.setItem(messagesKey, JSON.stringify(userMessages));
    
    loadMessagesContent();
    showToast('Message marqué', 'Message marqué comme lu', 'success');
}

/**
 * Supprime un message
 * @param {number} messageId - ID du message
 */
function deleteMessage(messageId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
        const messagesKey = `messages_${currentUser.id}`;
        userMessages = userMessages.filter(msg => msg.id !== messageId);
        localStorage.setItem(messagesKey, JSON.stringify(userMessages));
        
        showToast('Message supprimé', 'Message supprimé avec succès', 'success');
        
        loadMessagesContent();
        updateDashboardStats();
    }
}

/**
 * Marque tous les messages comme lus
 */
function markAllRead() {
    const unreadCount = userMessages.filter(msg => !msg.read).length;
    
    if (unreadCount === 0) {
        showToast('Aucun message non lu', 'Tous vos messages sont déjà lus', 'info');
        return;
    }
    
    const messagesKey = `messages_${currentUser.id}`;
    userMessages = userMessages.map(msg => ({ ...msg, read: true }));
    localStorage.setItem(messagesKey, JSON.stringify(userMessages));
    
    showToast('Messages marqués', `${unreadCount} messages marqués comme lus`, 'success');
    loadMessagesContent();
}

// === GESTION PROFIL ===

/**
 * Initialise le formulaire de profil
 */
function initializeProfileForm() {
    // Remplir les champs avec les données utilisateur
    document.getElementById('profileName').value = currentUser.name || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profilePhone').value = currentUser.phone || '';
    document.getElementById('profileAccountType').value = currentUser.accountType || 'user';
    
    // Générer l'avatar
    updateProfileAvatar();
    
    // Événement de soumission du formulaire
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
}

/**
 * Met à jour l'avatar de profil
 */
function updateProfileAvatar() {
    const avatarContainer = document.getElementById('profileAvatar');
    if (avatarContainer) {
        avatarContainer.innerHTML = `
            <div style="width: 100px; height: 100px; background: var(--gradient-primary); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; color: white; font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); margin: 0 auto;">
                ${currentUser.avatar || currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
        `;
    }
}

/**
 * Gère la mise à jour du profil
 * @param {Event} e - Événement de soumission
 */
function handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Animation de chargement
    submitBtn.innerHTML = '<span class="spin">⏳</span> Sauvegarde...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        // Mettre à jour les données utilisateur
        currentUser.name = formData.get('name');
        currentUser.phone = formData.get('phone');
        currentUser.avatar = currentUser.name.split(' ').map(n => n[0]).join('');
        
        // Sauvegarder dans localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Mettre à jour l'interface
        updateProfileAvatar();
        initializeDashboardUI();
        
        submitBtn.innerHTML = '💾 Sauvegarder les modifications';
        submitBtn.disabled = false;
        
        showToast('Profil mis à jour', 'Vos informations ont été sauvegardées', 'success');
    }, 1500);
}

/**
 * Change l'avatar (simulation)
 */
function changeAvatar() {
    showToast('Fonctionnalité prochainement', 'Le changement d\'avatar sera bientôt disponible', 'info');
}

// === PARAMÈTRES UTILISATEUR ===

/**
 * Applique les paramètres utilisateur
 */
function applyUserSettings() {
    // Notifications email
    document.getElementById('emailNotifications').checked = userSettings.emailNotifications;
    
    // Mode sombre
    document.getElementById('darkMode').checked = userSettings.darkMode;
    if (userSettings.darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // Sauvegarder les recherches
    document.getElementById('saveSearches').checked = userSettings.saveSearches;
}

/**
 * Toggle des notifications email
 */
function toggleEmailNotifications() {
    userSettings.emailNotifications = document.getElementById('emailNotifications').checked;
    saveUserSettings();
    
    const status = userSettings.emailNotifications ? 'activées' : 'désactivées';
    showToast('Notifications', `Notifications email ${status}`, 'success');
}

/**
 * Toggle du mode sombre
 */
function toggleDarkMode() {
    userSettings.darkMode = document.getElementById('darkMode').checked;
    saveUserSettings();
    
    if (userSettings.darkMode) {
        document.body.classList.add('dark-mode');
        showToast('Mode sombre', 'Interface en mode sombre', 'success');
    } else {
        document.body.classList.remove('dark-mode');
        showToast('Mode clair', 'Interface en mode clair', 'success');
    }
}

/**
 * Toggle de la sauvegarde des recherches
 */
function toggleSaveSearches() {
    userSettings.saveSearches = document.getElementById('saveSearches').checked;
    saveUserSettings();
    
    const status = userSettings.saveSearches ? 'activée' : 'désactivée';
    showToast('Historique recherches', `Sauvegarde ${status}`, 'success');
}

/**
 * Sauvegarde les paramètres utilisateur
 */
function saveUserSettings() {
    const settingsKey = `settings_${currentUser.id}`;
    localStorage.setItem(settingsKey, JSON.stringify(userSettings));
}

// === ACTIONS COMPTE ===

/**
 * Change le mot de passe (simulation)
 */
function changePassword() {
    showToast('Fonctionnalité prochainement', 'Le changement de mot de passe sera bientôt disponible', 'info');
}

/**
 * Supprime le compte utilisateur
 */
function deleteAccount() {
    const confirmation = prompt('Pour supprimer votre compte, tapez "SUPPRIMER" :');
    
    if (confirmation === 'SUPPRIMER') {
        // Supprimer toutes les données utilisateur
        localStorage.removeItem('currentUser');
        localStorage.removeItem(`favorites_${currentUser.id}`);
        localStorage.removeItem(`messages_${currentUser.id}`);
        localStorage.removeItem(`searchHistory_${currentUser.id}`);
        localStorage.removeItem(`settings_${currentUser.id}`);
        
        showToast('Compte supprimé', 'Votre compte a été supprimé définitivement', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    } else if (confirmation !== null) {
        showToast('Suppression annulée', 'Vous devez taper exactement "SUPPRIMER"', 'error');
    }
}

// === NOTIFICATIONS SYSTÈME ===

/**
 * Toggle du panneau de notifications
 */
function toggleNotifications() {
    showToast('Notifications', 'Système de notifications en développement', 'info');
}

/**
 * Ferme le panneau de notifications
 */
function closeNotifications() {
    const panel = document.getElementById('notificationsPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

// === ACTIVITÉ RÉCENTE ===

/**
 * Charge l'activité récente
 */
function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    const activities = [];
    
    // Générer des activités basées sur les données utilisateur
    if (userFavorites.length > 0) {
        activities.push({
            type: 'favorite',
            message: `Vous avez ${userFavorites.length} logement${userFavorites.length > 1 ? 's' : ''} en favoris`,
            icon: '❤️',
            time: 'Récemment'
        });
    }
    
    if (userSearchHistory.length > 0) {
        const lastSearch = userSearchHistory[userSearchHistory.length - 1];
        const searchDate = new Date(lastSearch.timestamp);
        activities.push({
            type: 'search',
            message: `Dernière recherche: ${lastSearch.query || 'Recherche générale'}`,
            icon: '🔍',
            time: searchDate.toLocaleDateString('fr-FR')
        });
    }
    
    if (userMessages.length > 0) {
        const unreadCount = userMessages.filter(msg => !msg.read).length;
        if (unreadCount > 0) {
            activities.push({
                type: 'message',
                message: `${unreadCount} nouveau${unreadCount > 1 ? 'x' : ''} message${unreadCount > 1 ? 's' : ''}`,
                icon: '💬',
                time: 'Nouveau'
            });
        }
    }
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--gray-600); padding: var(--spacing-8);">
                <div style="font-size: 3rem; margin-bottom: var(--spacing-4); opacity: 0.5;">📊</div>
                <p>Votre activité apparaîtra ici</p>
            </div>
        `;
    } else {
        container.innerHTML = activities.map(activity => `
            <div style="display: flex; align-items: center; gap: var(--spacing-4); padding: var(--spacing-4); border-bottom: 1px solid var(--gray-200);">
                <div style="font-size: var(--font-size-xl);">${activity.icon}</div>
                <div style="flex: 1;">
                    <div>${activity.message}</div>
                    <div style="font-size: var(--font-size-sm); color: var(--gray-600);">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }
}

// === BIENVENUE ===

/**
 * Affiche la bannière de bienvenue
 */
function showWelcomeBanner() {
    const banner = document.getElementById('welcomeBanner');
    if (banner) {
        banner.style.display = 'block';
        setTimeout(() => {
            banner.classList.add('fade-in-up');
        }, 100);
    }
}

/**
 * Cache la bannière de bienvenue
 */
function hideWelcomeBanner() {
    const banner = document.getElementById('welcomeBanner');
    if (banner) {
        banner.style.display = 'none';
        
        // Supprimer le paramètre welcome de l'URL
        const url = new URL(window.location);
        url.searchParams.delete('welcome');
        window.history.replaceState(null, '', url);
    }
}

// === ÉVÉNEMENTS GLOBAUX ===

/**
 * Initialise les événements du dashboard
 */
function initializeDashboardEvents() {
    // Gérer le redimensionnement de fenêtre
    window.addEventListener('resize', handleWindowResize);
    
    // Gérer les raccourcis clavier
    document.addEventListener('keydown', handleDashboardKeyboard);
}

/**
 * Gère le redimensionnement de fenêtre
 */
function handleWindowResize() {
    // Réajuster les layouts si nécessaire
    console.log('📱 Redimensionnement détecté');
}

/**
 * Gère les raccourcis clavier du dashboard
 * @param {KeyboardEvent} e - Événement clavier
 */
function handleDashboardKeyboard(e) {
    // Raccourcis Alt+Number pour changer d'onglet
    if (e.altKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                switchTab('overview');
                break;
            case '2':
                e.preventDefault();
                switchTab('favorites');
                break;
            case '3':
                e.preventDefault();
                switchTab('searches');
                break;
            case '4':
                e.preventDefault();
                switchTab('messages');
                break;
            case '5':
                e.preventDefault();
                switchTab('profile');
                break;
        }
    }
}

// === UTILITAIRES ===

/**
 * Crée les tags de filtres pour l'historique
 */
const filterTagsStyles = `
    <style>
        .filter-tag {
            display: inline-block;
            background: rgba(106, 13, 173, 0.1);
            color: var(--primary-violet);
            padding: var(--spacing-1) var(--spacing-2);
            border-radius: var(--radius-sm);
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-medium);
        }
        
        .quick-action-card {
            display: block;
            background: var(--white);
            border: 1px solid var(--gray-200);
            border-radius: var(--radius-lg);
            padding: var(--spacing-5);
            text-align: center;
            text-decoration: none;
            color: inherit;
            cursor: pointer;
            transition: all var(--transition-normal);
        }
        
        .quick-action-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
            border-color: var(--primary-violet);
        }
        
        .quick-action-icon {
            font-size: 2.5rem;
            margin-bottom: var(--spacing-3);
        }
        
        .quick-action-card h3 {
            margin-bottom: var(--spacing-2);
            color: var(--gray-900);
        }
        
        .quick-action-card p {
            color: var(--gray-600);
            margin: 0;
        }
        
        .unread-message {
            border-left: 4px solid var(--primary-violet);
        }
        
        .notification-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background: var(--accent-red);
            color: white;
            font-size: var(--font-size-xs);
            padding: 2px 6px;
            border-radius: var(--radius-full);
            min-width: 20px;
            text-align: center;
        }
        
        .switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 34px;
        }
        
        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--gray-300);
            transition: .4s;
            border-radius: 34px;
        }
        
        .slider:before {
            position: absolute;
            content: "";
            height: 26px;
            width: 26px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        
        input:checked + .slider {
            background-color: var(--primary-violet);
        }
        
        input:checked + .slider:before {
            transform: translateX(26px);
        }
    </style>
`;

// Ajouter les styles
if (!document.head.querySelector('#dashboard-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'dashboard-styles';
    styleElement.innerHTML = filterTagsStyles;
    document.head.appendChild(styleElement);
}

console.log('📊 LOCAYA Dashboard.js chargé avec succès');