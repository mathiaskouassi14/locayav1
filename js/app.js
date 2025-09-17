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
async function loadPopularProperties() {
    console.log('🏠 Chargement des propriétés populaires...');
    
    const container = document.getElementById('popularProperties');
    if (!container) {
        console.log('❌ Container popularProperties non trouvé');
        return;
    }
    
    // Afficher le loading spinner
    container.innerHTML = `
        <div style="text-align: center; padding: var(--spacing-12); grid-column: 1 / -1;">
            <div class="loading-spinner"></div>
            <p style="margin-top: var(--spacing-4); color: var(--medium-gray);">
                Chargement des logements populaires...
            </p>
        </div>
    `;
    
    if (properties.length === 0) {
        console.log('⏳ Propriétés pas encore chargées, retry dans 500ms');
        setTimeout(loadPopularProperties, 1500);
        return;
    }
    
    // Prendre les 6 propriétés les mieux notées
    const popularProps = properties
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6);
    
    console.log(`📊 ${popularProps.length} propriétés populaires trouvées`);
    
    // Simuler un délai de chargement pour l'effet premium
    setTimeout(() => {
        container.innerHTML = popularProps.map((property, index) => 
            createPropertyCard(property, index * 100)
        ).join('');
        
        // Réinitialiser les animations pour les nouvelles cartes
        setTimeout(() => {
            initializeScrollAnimations();
            // Réinitialiser les icônes Lucide
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 100);
        
        console.log('✅ Propriétés populaires chargées avec succès');
    }, 800);
}

// ================================
// ANIMATIONS FADE-IN AU SCROLL
// ================================

/**
 * Initialise les animations fade-in au scroll
 */
function initializeFadeInAnimations() {
    const sections = document.querySelectorAll('.section');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        observer.observe(section);
    });
}

// ================================
// MODAL AJOUT DE BIEN IMMOBILIER
// ================================

/**
 * Ouvre la modal d'ajout de bien
 */
function openAddPropertyModal() {
    if (!currentUser || currentUser.accountType !== 'owner') {
        showToast('Accès refusé', 'Seuls les propriétaires peuvent ajouter des biens', 'error');
        return;
    }
    
    const modal = createAddPropertyModal();
    document.body.appendChild(modal);
    
    // Afficher la modal
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

/**
 * Crée la modal d'ajout de bien
 */
function createAddPropertyModal() {
    const modal = document.createElement('div');
    modal.className = 'add-property-modal';
    modal.innerHTML = `
        <div class="add-property-form">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 style="margin: 0; color: var(--primary-black);">Ajouter un bien immobilier</h2>
                <button onclick="closeAddPropertyModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--medium-gray);">&times;</button>
            </div>
            
            <form id="addPropertyForm">
                <div style="display: grid; gap: 1.5rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--primary-black);">Nom du bien *</label>
                        <input type="text" name="title" required style="width: 100%; padding: 12px 16px; border: 2px solid var(--silver); border-radius: 8px; font-family: 'Poppins', sans-serif;" placeholder="Ex: Villa moderne avec piscine">
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--primary-black);">Quartier *</label>
                            <input type="text" name="location" required style="width: 100%; padding: 12px 16px; border: 2px solid var(--silver); border-radius: 8px; font-family: 'Poppins', sans-serif;" placeholder="Ex: Cocody, Abidjan">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--primary-black);">Type de bien *</label>
                            <select name="type" required style="width: 100%; padding: 12px 16px; border: 2px solid var(--silver); border-radius: 8px; font-family: 'Poppins', sans-serif;">
                                <option value="">Choisir un type</option>
                                <option value="Villa">Villa</option>
                                <option value="Appartement">Appartement</option>
                                <option value="Studio">Studio</option>
                                <option value="Maison">Maison</option>
                                <option value="Duplex">Duplex</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--primary-black);">Prix (FCFA) *</label>
                            <input type="number" name="price" required style="width: 100%; padding: 12px 16px; border: 2px solid var(--silver); border-radius: 8px; font-family: 'Poppins', sans-serif;" placeholder="250000">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--primary-black);">Chambres</label>
                            <input type="number" name="bedrooms" style="width: 100%; padding: 12px 16px; border: 2px solid var(--silver); border-radius: 8px; font-family: 'Poppins', sans-serif;" placeholder="3">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--primary-black);">Surface (m²)</label>
                            <input type="number" name="area" style="width: 100%; padding: 12px 16px; border: 2px solid var(--silver); border-radius: 8px; font-family: 'Poppins', sans-serif;" placeholder="120">
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--primary-black);">Description *</label>
                        <textarea name="description" required rows="4" style="width: 100%; padding: 12px 16px; border: 2px solid var(--silver); border-radius: 8px; font-family: 'Poppins', sans-serif; resize: vertical;" placeholder="Décrivez votre bien en détail (minimum 100 caractères)"></textarea>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--primary-black);">Photos du bien</label>
                        <div class="photo-upload-area" onclick="document.getElementById('photoInput').click()">
                            <i data-lucide="camera" style="width: 48px; height: 48px; color: var(--medium-gray); margin-bottom: 1rem;"></i>
                            <p style="color: var(--medium-gray); margin: 0;">Cliquez pour ajouter des photos</p>
                            <p style="color: var(--medium-gray); font-size: 0.875rem; margin: 0.5rem 0 0 0;">JPG, PNG - Max 5 photos</p>
                        </div>
                        <input type="file" id="photoInput" multiple accept="image/*" style="display: none;" onchange="handlePhotoUpload(this.files)">
                        <div id="photoPreview" class="photo-preview"></div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                        <button type="button" onclick="closeAddPropertyModal()" style="padding: 12px 24px; border: 2px solid var(--medium-gray); background: white; color: var(--medium-gray); border-radius: 8px; font-family: 'Poppins', sans-serif; font-weight: 600; cursor: pointer;">
                            Annuler
                        </button>
                        <button type="submit" class="btn-premium">
                            <i data-lucide="plus"></i> Ajouter le bien
                        </button>
                    </div>
                </div>
            </form>
        </div>
    `;
    
    // Ajouter l'événement de soumission
    modal.querySelector('#addPropertyForm').addEventListener('submit', handleAddProperty);
    
    return modal;
}

/**
 * Ferme la modal d'ajout de bien
 */
function closeAddPropertyModal() {
    const modal = document.querySelector('.add-property-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

/**
 * Gère l'upload des photos
 */
function handlePhotoUpload(files) {
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = '';
    
    if (files.length > 5) {
        showToast('Limite dépassée', 'Maximum 5 photos autorisées', 'warning');
        return;
    }
    
    Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.cssText = `
                    width: 100px;
                    height: 100px;
                    object-fit: cover;
                    border-radius: 8px;
                    border: 2px solid var(--silver);
                `;
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
}

/**
 * Gère l'ajout d'un nouveau bien
 */
function handleAddProperty(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validation
    const description = formData.get('description');
    if (description.length < 100) {
        showToast('Description trop courte', 'La description doit contenir au moins 100 caractères', 'warning');
        return;
    }
    
    // Animation de chargement
    submitBtn.innerHTML = '<div class="loading-spinner" style="width: 20px; height: 20px; border-width: 2px;"></div> Ajout en cours...';
    submitBtn.disabled = true;
    
    // Simuler l'ajout
    setTimeout(() => {
        const newProperty = {
            id: Date.now(),
            title: formData.get('title'),
            location: formData.get('location'),
            type: formData.get('type'),
            price: parseInt(formData.get('price')),
            bedrooms: parseInt(formData.get('bedrooms')) || 1,
            area: parseInt(formData.get('area')) || 50,
            description: formData.get('description'),
            owner: currentUser.name,
            status: 'Disponible',
            images: ['https://i.ibb.co/NgYmgDcG/5931379510161296304-120.jpg'], // Image par défaut
            rating: 4.0,
            reviews: []
        };
        
        // Sauvegarder en localStorage (simulation)
        const ownerProperties = JSON.parse(localStorage.getItem(`properties_${currentUser.id}`) || '[]');
        ownerProperties.push(newProperty);
        localStorage.setItem(`properties_${currentUser.id}`, JSON.stringify(ownerProperties));
        
        closeAddPropertyModal();
        showToast('Bien ajouté', 'Votre bien a été ajouté avec succès !', 'success');
        
        // Recharger la liste des biens si on est sur le dashboard
        if (typeof loadPropertiesContent === 'function') {
            loadPropertiesContent();
        }
    }, 2000);
}

// ================================
// INITIALISATION AMÉLIORÉE
// ================================

// Modifier la fonction d'initialisation existante
const originalInitializeApp = initializeApp;
initializeApp = function() {
    originalInitializeApp();
    
    // Ajouter les nouvelles fonctionnalités
    initializeFadeInAnimations();
    
    console.log('✅ Fonctionnalités premium 2025 initialisées');
};
    
    console.log('✅ Propriétés populaires chargées avec succès');
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
 * Vérifie si une propriété est dans les favoris
 * @param {number} propertyId - ID de la propriété
 * @returns {boolean} True si la propriété est favorite
 */
function isFavorite(propertyId) {
    if (!currentUser) return false;
    const favKey = `favorites_${currentUser.id}`;
    const favorites = JSON.parse(localStorage.getItem(favKey) || '[]');
    return favorites.includes(propertyId);
}

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
                    <i data-lucide="heart" style="fill: ${isFavorite(property.id) ? 'currentColor' : 'none'};"></i>
                </button>
            </div>
            
            <div class="property-content">
                <h3 class="property-title">${property.title}</h3>
                <div class="property-location">
                    <i data-lucide="map-pin" style="width: 16px; height: 16px;"></i> ${property.location}
                </div>
                
                <div class="property-features">
                    <span><i data-lucide="bed" style="width: 14px; height: 14px;"></i> ${property.bedrooms} ch.</span>
                    <span><i data-lucide="bath" style="width: 14px; height: 14px;"></i> ${property.bathrooms} sdb</span>
                    <span><i data-lucide="square" style="width: 14px; height: 14px;"></i> ${property.area}m²</span>
                </div>
                
                <div class="property-price">
                    ${formatPrice(property.price)} FCFA/${property.period}
                </div>
                
                <div class="property-actions">
                    <a href="property.html?id=${property.id}" class="btn btn-primary">
                        Voir détails
                    </a>
                    <button class="btn btn-outline" onclick="contactOwner(${property.id})">
                        <i data-lucide="phone" style="width: 16px; height: 16px;"></i> Contacter
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
        stars += '<span class="star"><i data-lucide="star" style="fill: currentColor; width: 16px; height: 16px;"></i></span>';
    }
    
    if (hasHalfStar) {
        stars += '<span class="star"><i data-lucide="star" style="fill: currentColor; width: 16px; height: 16px;"></i></span>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<span class="star empty"><i data-lucide="star" style="width: 16px; height: 16px;"></i></span>';
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
        button.classList.remove('active');
        const icon = button.querySelector('i');
        if (icon) icon.style.fill = 'none';
        showToast('Favori retiré', 'Propriété retirée de vos favoris', 'info');
    } else {
        // Ajouter aux favoris
        favorites.push(propertyId);
        button.classList.add('active', 'heart-beat');
        const icon = button.querySelector('i');
        if (icon) icon.style.fill = 'currentColor';
        showToast('Favori ajouté', 'Propriété ajoutée à vos favoris', 'success');
        
        setTimeout(() => {
            button.classList.remove('heart-beat');
        }, 1300);
    }
    
    localStorage.setItem(favKey, JSON.stringify(favorites));
    
    // Réinitialiser les icônes Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
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
                        <i data-lucide="phone" style="width: 16px; height: 16px;"></i>
                        <a href="tel:${property.contact.phone}" style="color: var(--primary-violet);">
                            ${property.contact.phone}
                        </a>
                    </div>
                    <div style="display: flex; align-items: center; gap: var(--spacing-2);">
                        <i data-lucide="mail" style="width: 16px; height: 16px;"></i>
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
            
            // Réinitialiser les icônes Lucide
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
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

// ================================
// SYSTÈME DE NOTIFICATIONS PREMIUM
// ================================

/**
 * Affiche une notification toast
 * @param {string} title - Titre de la notification
 * @param {string} message - Message de la notification
 * @param {string} type - Type : success, error, warning, info
 */
function showToast(title, message, type = 'info') {
    // Créer le container s'il n'existe pas
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        padding: 16px 24px;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        font-family: 'Poppins', sans-serif;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease;
        min-width: 300px;
        max-width: 400px;
        cursor: pointer;
    `;
    
    // Couleurs selon le type
    const colors = {
        error: '#dc2626',
        success: '#10b981',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    notification.style.background = colors[type] || colors.info;
    toast.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-weight: 700; margin-bottom: 4px;">${title}</div>
                <div style="font-weight: 400; opacity: 0.9;">${message}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; margin-left: 16px;">&times;</button>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Fermeture au clic
    notification.addEventListener('click', () => {
        notification.remove();
    });
    
    // Suppression automatique après 5 secondes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 5000);
}

// ================================
// SECTION LOGEMENTS POPULAIRES - CORRECTION CRITIQUE
// ================================

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

// Initialiser les icônes Lucide après chaque mise à jour du DOM
function initializeLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Observer les changements DOM pour réinitialiser les icônes
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Délai pour permettre au DOM de se stabiliser
            setTimeout(initializeLucideIcons, 100);
        }
    });
});

// Démarrer l'observation
document.addEventListener('DOMContentLoaded', function() {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Initialisation initiale
    initializeLucideIcons();
});

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