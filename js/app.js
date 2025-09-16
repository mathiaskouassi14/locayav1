/**
 * LOCAYA - Application principale
 * Gestion globale de l'application, animations, notifications et utilitaires
 */

// === VARIABLES GLOBALES ===
let currentUser = null;
let properties = [];

// === INITIALISATION ===
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialise l'application au chargement
 */
function initializeApp() {
    // Charger l'utilisateur connecté
    loadCurrentUser();
    
    // Charger les données des propriétés
    loadProperties();
    
    // Initialiser les animations au scroll
    initializeScrollAnimations();
    
    // Initialiser le header scrollable
    initializeScrollHeader();
    
    // Initialiser les événements
    initializeEventListeners();
    
    // Charger les propriétés populaires (page d'accueil)
    if (document.getElementById('popularProperties')) {
        loadPopularProperties();
    }
    
    // Initialiser les compteurs animés
    initializeCounters();
    
    console.log('✅ LOCAYA initialisé avec succès');
}

// === GESTION UTILISATEUR ===

/**
 * Charge l'utilisateur connecté depuis le localStorage
 */
function loadCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        updateUIForLoggedUser();
    }
}

/**
 * Met à jour l'interface pour un utilisateur connecté
 */
function updateUIForLoggedUser() {
    if (!currentUser) return;
    
    // Mettre à jour les liens du header
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
        headerActions.innerHTML = `
            <div class="flex-center" style="gap: var(--spacing-3);">
                <span style="color: var(--gray-600);">Bonjour, ${currentUser.name}</span>
                <a href="dashboard.html" class="btn btn-outline">Dashboard</a>
                <button onclick="logout()" class="btn btn-secondary">Déconnexion</button>
            </div>
        `;
    }
    
    // Mettre à jour la navigation mobile
    updateBottomNav();
}

/**
 * Déconnecte l'utilisateur
 */
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    showToast('Déconnexion réussie', 'Au revoir !', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// === GESTION DES DONNÉES ===

/**
 * Charge les propriétés depuis le fichier JSON
 */
async function loadProperties() {
    try {
        const response = await fetch('data/properties.json');
        properties = await response.json();
        console.log(`📊 ${properties.length} propriétés chargées`);
    } catch (error) {
        console.error('❌ Erreur lors du chargement des propriétés:', error);
        showToast('Erreur', 'Impossible de charger les propriétés', 'error');
    }
}

/**
 * Charge et affiche les propriétés populaires sur la page d'accueil
 */
function loadPopularProperties() {
    if (properties.length === 0) {
        setTimeout(loadPopularProperties, 500);
        return;
    }
    
    const container = document.getElementById('popularProperties');
    if (!container) return;
    
    // Prendre les 6 propriétés les mieux notées
    const popularProps = properties
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6);
    
    container.innerHTML = popularProps.map((property, index) => 
        createPropertyCard(property, index * 100)
    ).join('');
    
    // Réinitialiser les animations pour les nouvelles cartes
    setTimeout(() => {
        initializeScrollAnimations();
    }, 100);
}

// === ANIMATIONS ET EFFETS VISUELS ===

/**
 * Initialise les animations au scroll avec Intersection Observer
 */
function initializeScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

/**
 * Initialise l'effet de header au scroll
 */
function initializeScrollHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        if (scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollY = scrollY;
    }, { passive: true });
}

/**
 * Initialise les compteurs animés
 */
function initializeCounters() {
    const counters = document.querySelectorAll('[data-count]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    });
    
    counters.forEach(counter => {
        observer.observe(counter);
    });
}

/**
 * Anime un compteur vers sa valeur cible
 * @param {HTMLElement} element - L'élément compteur à animer
 */
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// === ÉVÉNEMENTS GLOBAUX ===

/**
 * Initialise tous les événements de l'application
 */
function initializeEventListeners() {
    // Formulaire de recherche rapide (hero)
    const quickSearchForm = document.getElementById('quickSearchForm');
    if (quickSearchForm) {
        quickSearchForm.addEventListener('submit', handleQuickSearch);
    }
    
    // Formulaire de contact
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // Menu mobile
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Fermeture des modales au clic sur l'overlay
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
    
    // Effets de ripple sur les boutons
    document.addEventListener('click', addRippleEffect);
    
    // Navigation smooth vers les ancres
    document.addEventListener('click', handleSmoothScroll);
}

/**
 * Gère la soumission du formulaire de recherche rapide
 * @param {Event} e - L'événement de soumission
 */
function handleQuickSearch(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const params = new URLSearchParams();
    
    for (let [key, value] of formData.entries()) {
        if (value) params.append(key, value);
    }
    
    // Rediriger vers la page de recherche avec les paramètres
    window.location.href = `search.html?${params.toString()}`;
}

/**
 * Gère la soumission du formulaire de contact
 * @param {Event} e - L'événement de soumission
 */
function handleContactForm(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Animation de chargement
    submitBtn.innerHTML = '<span class="spin">⏳</span> Envoi en cours...';
    submitBtn.disabled = true;
    
    // Simuler l'envoi
    setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        showToast('Message envoyé', 'Nous vous répondrons rapidement !', 'success');
        e.target.reset();
    }, 2000);
}

/**
 * Toggle du menu mobile
 */
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

/**
 * Ajoute l'effet ripple aux boutons cliqués
 * @param {Event} e - L'événement de clic
 */
function addRippleEffect(e) {
    if (!e.target.classList.contains('btn')) return;
    
    const button = e.target;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.className = 'ripple';
    ripple.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
    `;
    
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

/**
 * Gère la navigation smooth vers les ancres
 * @param {Event} e - L'événement de clic
 */
function handleSmoothScroll(e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (href === '#') return;
    
    const target = document.querySelector(href);
    if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// === UTILITAIRES ===

/**
 * Crée le HTML d'une carte de propriété
 * @param {Object} property - Les données de la propriété
 * @param {number} delay - Délai d'animation en ms
 * @returns {string} HTML de la carte
 */
function createPropertyCard(property, delay = 0) {
    return `
        <div class="property-card hover-lift animate-on-scroll" style="animation-delay: ${delay}ms;" data-property-id="${property.id}">
            <div class="property-image">
                <img src="${property.images[0]}" alt="${property.title}" loading="lazy">
                <div class="property-badge">${property.status}</div>
                <button class="property-favorite" onclick="toggleFavorite(${property.id})" title="Ajouter aux favoris">
                    ❤️
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
                
                <div class="property-actions">
                    <a href="property.html?id=${property.id}" class="btn btn-primary">
                        Voir détails
                    </a>
                    <button class="btn btn-outline" onclick="contactOwner(${property.id})">
                        📞 Contacter
                    </button>
                </div>
                
                <div style="display: flex; align-items: center; gap: var(--spacing-2); margin-top: var(--spacing-3);">
                    <div class="stars">
                        ${createStarRating(property.rating)}
                    </div>
                    <span style="color: var(--gray-600); font-size: var(--font-size-sm);">
                        ${property.rating}/5 (${property.reviews.length} avis)
                    </span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Crée les étoiles de notation
 * @param {number} rating - Note sur 5
 * @returns {string} HTML des étoiles
 */
function createStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<span class="star">⭐</span>';
    }
    
    if (hasHalfStar) {
        stars += '<span class="star">⭐</span>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<span class="star empty">☆</span>';
    }
    
    return stars;
}

/**
 * Formate un prix avec séparateurs de milliers
 * @param {number} price - Le prix à formater
 * @returns {string} Prix formaté
 */
function formatPrice(price) {
    return price.toLocaleString('fr-FR');
}

/**
 * Toggle le statut favori d'une propriété
 * @param {number} propertyId - ID de la propriété
 */
function toggleFavorite(propertyId) {
    if (!currentUser) {
        showToast('Connexion requise', 'Connectez-vous pour ajouter des favoris', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    const favKey = `favorites_${currentUser.id}`;
    let favorites = JSON.parse(localStorage.getItem(favKey) || '[]');
    
    const button = document.querySelector(`[data-property-id="${propertyId}"] .property-favorite`);
    
    if (favorites.includes(propertyId)) {
        // Retirer des favoris
        favorites = favorites.filter(id => id !== propertyId);
        button.style.color = 'var(--gray-400)';
        button.classList.remove('active');
        showToast('Favori retiré', 'Propriété retirée de vos favoris', 'info');
    } else {
        // Ajouter aux favoris
        favorites.push(propertyId);
        button.style.color = 'var(--accent-red)';
        button.classList.add('active', 'heart-beat');
        showToast('Favori ajouté', 'Propriété ajoutée à vos favoris', 'success');
        
        setTimeout(() => {
            button.classList.remove('heart-beat');
        }, 1300);
    }
    
    localStorage.setItem(favKey, JSON.stringify(favorites));
}

/**
 * Ouvre la modal de contact pour un propriétaire
 * @param {number} propertyId - ID de la propriété
 */
function contactOwner(propertyId) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const modal = createContactModal(property);
    document.body.appendChild(modal);
    showModal('contactModal');
}

/**
 * Crée une modal de contact
 * @param {Object} property - Les données de la propriété
 * @returns {HTMLElement} L'élément modal
 */
function createContactModal(property) {
    const modal = document.createElement('div');
    modal.id = 'contactModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Contacter le propriétaire</h3>
                <button class="modal-close" onclick="closeModal('contactModal')">&times;</button>
            </div>
            <div style="margin-bottom: var(--spacing-4);">
                <h4 style="color: var(--primary-violet); margin-bottom: var(--spacing-2);">
                    ${property.title}
                </h4>
                <p style="color: var(--gray-600);">${property.location}</p>
            </div>
            <div style="background: var(--gray-50); padding: var(--spacing-4); border-radius: var(--radius-lg); margin-bottom: var(--spacing-6);">
                <h5 style="margin-bottom: var(--spacing-3);">Contact : ${property.contact.owner}</h5>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-2);">
                    <div style="display: flex; align-items: center; gap: var(--spacing-2);">
                        <span>📞</span>
                        <a href="tel:${property.contact.phone}" style="color: var(--primary-violet);">
                            ${property.contact.phone}
                        </a>
                    </div>
                    <div style="display: flex; align-items: center; gap: var(--spacing-2);">
                        <span>✉️</span>
                        <a href="mailto:${property.contact.email}" style="color: var(--primary-violet);">
                            ${property.contact.email}
                        </a>
                    </div>
                </div>
            </div>
            <form id="contactOwnerForm">
                <div style="display: flex; flex-direction: column; gap: var(--spacing-4);">
                    <div class="form-group">
                        <input type="text" name="name" required placeholder=" " value="${currentUser?.name || ''}">
                        <label>Votre nom</label>
                    </div>
                    <div class="form-group">
                        <input type="tel" name="phone" required placeholder=" ">
                        <label>Votre téléphone</label>
                    </div>
                    <div class="form-group">
                        <textarea name="message" rows="4" placeholder=" " required>Bonjour, je suis intéressé(e) par votre logement "${property.title}". Pouvons-nous convenir d'une visite ?</textarea>
                        <label style="top: var(--spacing-4);">Message</label>
                    </div>
                    <div style="display: flex; gap: var(--spacing-3);">
                        <button type="button" onclick="closeModal('contactModal')" class="btn btn-outline">
                            Annuler
                        </button>
                        <button type="submit" class="btn btn-primary">
                            Envoyer le message
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `;
    
    // Ajouter l'événement de soumission
    modal.querySelector('#contactOwnerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = modal.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<span class="spin">⏳</span> Envoi...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            closeModal('contactModal');
            showToast('Message envoyé', 'Le propriétaire vous répondra rapidement', 'success');
            modal.remove();
        }, 2000);
    });
    
    return modal;
}

// === GESTION DES MODALES ===

/**
 * Affiche une modal
 * @param {string} modalId - ID de la modal à afficher
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Ferme une modal
 * @param {string} modalId - ID de la modal à fermer
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// === NOTIFICATIONS (TOASTS) ===

/**
 * Affiche une notification toast
 * @param {string} title - Titre de la notification
 * @param {string} message - Message de la notification
 * @param {string} type - Type : success, error, warning, info
 */
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-header">
            <div class="toast-title">${title}</div>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
        <div class="toast-message">${message}</div>
    `;
    
    container.appendChild(toast);
    
    // Animation d'entrée
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Suppression automatique après 5 secondes
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }, 5000);
}

// === NAVIGATION MOBILE ===

/**
 * Met à jour la navigation mobile selon l'état de connexion
 */
function updateBottomNav() {
    const bottomNav = document.getElementById('bottomNav');
    if (!bottomNav || !currentUser) return;
    
    // Mettre à jour le lien favoris/profil
    const favorisLink = bottomNav.querySelector('.bottom-nav-items li:nth-child(3) a');
    const profilLink = bottomNav.querySelector('.bottom-nav-items li:nth-child(4) a');
    
    if (favorisLink && profilLink) {
        favorisLink.href = 'dashboard.html?tab=favorites';
        profilLink.href = 'dashboard.html?tab=profile';
    }
}

// === UTILITAIRES DE DÉVELOPPEMENT ===

/**
 * Fonction utilitaire pour déboguer
 * @param {string} message - Message à afficher
 * @param {any} data - Données à afficher
 */
function debug(message, data = null) {
    console.log(`🔍 DEBUG: ${message}`, data);
}

/**
 * Gère les erreurs globales
 * @param {Error} error - L'erreur à gérer
 * @param {string} context - Contexte de l'erreur
 */
function handleError(error, context = 'Application') {
    console.error(`❌ Erreur dans ${context}:`, error);
    showToast('Erreur', 'Une erreur est survenue. Veuillez réessayer.', 'error');
}

// === PERFORMANCE ===

/**
 * Lazy loading des images
 */
function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// === ACCESSIBILITÉ ===

/**
 * Initialise les améliorations d'accessibilité
 */
function initializeAccessibility() {
    // Navigation au clavier
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Fermer les modales ouvertes
            const openModal = document.querySelector('.modal.active');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
    
    // Focus visible pour la navigation au clavier
    document.addEventListener('mousedown', () => {
        document.body.classList.add('using-mouse');
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.remove('using-mouse');
        }
    });
}

// Initialiser l'accessibilité
document.addEventListener('DOMContentLoaded', initializeAccessibility);

// === EXPORT POUR LES AUTRES MODULES ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showToast,
        formatPrice,
        createPropertyCard,
        currentUser,
        properties
    };
}

console.log('📱 LOCAYA App.js chargé avec succès');