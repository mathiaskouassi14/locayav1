/**
 * LOCAYA - Module de détails de propriété
 * Gestion de l'affichage des détails, galerie, avis et fonctionnalités
 */

// === VARIABLES GLOBALES ===
let currentProperty = null;
let allProperties = [];
let currentGalleryIndex = 0;
let propertyId = null;

// === INITIALISATION ===
document.addEventListener('DOMContentLoaded', function() {
    initializePropertyPage();
});

/**
 * Initialise la page de détails de propriété
 */
async function initializePropertyPage() {
    console.log('🏠 Initialisation de la page propriété...');
    
    // Récupérer l'ID de la propriété depuis l'URL
    propertyId = getPropertyIdFromURL();
    
    if (!propertyId) {
        showPropertyNotFound();
        return;
    }
    
    // Charger les données
    await loadAllProperties();
    
    // Charger la propriété spécifique
    loadPropertyDetails(propertyId);
    
    // Initialiser les événements
    initializePropertyEvents();
    
    console.log('✅ Page propriété initialisée');
}

/**
 * Récupère l'ID de la propriété depuis l'URL
 * @returns {number|null} ID de la propriété ou null
 */
function getPropertyIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    return id ? parseInt(id) : null;
}

/**
 * Charge toutes les propriétés depuis le JSON
 */
async function loadAllProperties() {
    try {
        const response = await fetch('data/properties.json');
        allProperties = await response.json();
        console.log(`📊 ${allProperties.length} propriétés chargées`);
    } catch (error) {
        console.error('❌ Erreur lors du chargement des propriétés:', error);
        showPropertyError('Impossible de charger les données');
    }
}

/**
 * Charge et affiche les détails d'une propriété
 * @param {number} id - ID de la propriété
 */
function loadPropertyDetails(id) {
    currentProperty = allProperties.find(p => p.id === id);
    
    if (!currentProperty) {
        showPropertyNotFound();
        return;
    }
    
    console.log('🏠 Propriété trouvée:', currentProperty.title);
    
    // Cacher le loading et afficher les détails
    document.getElementById('loadingProperty').style.display = 'none';
    document.getElementById('propertyDetails').style.display = 'block';
    document.getElementById('propertyContent').style.display = 'block';
    document.getElementById('reviewsSection').style.display = 'block';
    document.getElementById('similarSection').style.display = 'block';
    
    // Remplir les détails
    populatePropertyDetails();
    populatePropertyGallery();
    populatePropertyReviews();
    loadSimilarProperties();
    
    // Mettre à jour le titre de la page
    document.title = `${currentProperty.title} - LOCAYA`;
    
    // Mettre à jour les meta tags
    updateMetaTags();
}

// === AFFICHAGE DES DÉTAILS ===

/**
 * Remplit tous les détails de la propriété
 */
function populatePropertyDetails() {
    // Breadcrumb
    document.getElementById('breadcrumbLocation').textContent = currentProperty.location;
    
    // Titre et localisation
    document.getElementById('propertyTitle').textContent = currentProperty.title;
    document.getElementById('propertyLocation').innerHTML = `📍 ${currentProperty.location}`;
    
    // Caractéristiques
    document.getElementById('propertyFeatures').innerHTML = `
        <span>🛏️ ${currentProperty.bedrooms} chambres</span>
        <span>🚿 ${currentProperty.bathrooms} salles de bain</span>
        <span>📐 ${currentProperty.area}m²</span>
        <span>⭐ ${currentProperty.rating}/5</span>
    `;
    
    // Prix
    document.getElementById('propertyPrice').textContent = `${formatPrice(currentProperty.price)} FCFA`;
    document.getElementById('propertyPeriod').textContent = `par ${currentProperty.period}`;
    
    // Description
    document.getElementById('propertyDescription').innerHTML = `<p>${currentProperty.description}</p>`;
    
    // Équipements
    const amenitiesList = document.getElementById('propertyAmenities');
    amenitiesList.innerHTML = currentProperty.amenities.map(amenity => 
        `<li>${amenity}</li>`
    ).join('');
    
    // Sidebar stats
    document.getElementById('propertyType').textContent = currentProperty.type;
    document.getElementById('propertyArea').textContent = `${currentProperty.area}m²`;
    document.getElementById('propertyRating').innerHTML = `${currentProperty.rating}/5 ⭐`;
    document.getElementById('propertyStatus').textContent = currentProperty.status;
    
    // Informations du propriétaire
    document.getElementById('ownerDetails').innerHTML = `
        <div style="display: flex; align-items: center; gap: var(--spacing-3); margin-bottom: var(--spacing-3);">
            <div style="width: 50px; height: 50px; background: var(--gradient-primary); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; color: white; font-weight: var(--font-weight-bold);">
                ${currentProperty.contact.owner.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
                <div style="font-weight: var(--font-weight-medium);">${currentProperty.contact.owner}</div>
                <div style="font-size: var(--font-size-sm); color: var(--gray-600);">Propriétaire</div>
            </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: var(--spacing-2);">
            <a href="tel:${currentProperty.contact.phone}" class="btn btn-outline btn-sm">
                📞 ${currentProperty.contact.phone}
            </a>
            <a href="mailto:${currentProperty.contact.email}" class="btn btn-outline btn-sm">
                ✉️ ${currentProperty.contact.email}
            </a>
        </div>
    `;
    
    // Pré-remplir le formulaire de contact
    const messageTextarea = document.querySelector('#propertyContactForm textarea[name="message"]');
    if (messageTextarea) {
        messageTextarea.textContent = `Bonjour ${currentProperty.contact.owner}, je suis intéressé(e) par votre logement "${currentProperty.title}". Pouvons-nous convenir d'une visite ?`;
    }
    
    // Bouton favoris
    updateFavoriteButton();
}

/**
 * Crée et affiche la galerie de photos
 */
function populatePropertyGallery() {
    const gallery = document.getElementById('propertyGallery');
    const images = currentProperty.images;
    
    if (images.length === 0) return;
    
    let galleryHTML = '';
    
    // Image principale
    galleryHTML += `
        <div class="gallery-main" onclick="openGalleryModal(0)">
            <img src="${images[0]}" alt="${currentProperty.title}" loading="eager">
        </div>
    `;
    
    // Images secondaires
    for (let i = 1; i < Math.min(5, images.length); i++) {
        if (i === 4 && images.length > 5) {
            // Dernière image avec overlay "+X photos"
            galleryHTML += `
                <div class="gallery-more" onclick="openGalleryModal(${i})">
                    <img src="${images[i]}" alt="${currentProperty.title}">
                    <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: white; font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold);">
                        +${images.length - 4} photos
                    </div>
                </div>
            `;
        } else {
            galleryHTML += `
                <div class="gallery-item" onclick="openGalleryModal(${i})">
                    <img src="${images[i]}" alt="${currentProperty.title}">
                </div>
            `;
        }
    }
    
    gallery.innerHTML = galleryHTML;
}

/**
 * Affiche les avis de la propriété
 */
function populatePropertyReviews() {
    const reviewsStats = document.getElementById('reviewsStats');
    const reviewsList = document.getElementById('reviewsList');
    
    const reviews = currentProperty.reviews || [];
    const averageRating = currentProperty.rating;
    
    // Stats des avis
    reviewsStats.innerHTML = `
        <div class="average-rating">${averageRating}</div>
        <div>
            <div class="stars">
                ${createStarRating(averageRating)}
            </div>
            <div style="color: var(--gray-600); margin-top: var(--spacing-1);">
                ${reviews.length} avis
            </div>
        </div>
    `;
    
    // Liste des avis
    if (reviews.length === 0) {
        reviewsList.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-8); color: var(--gray-600);">
                <div style="font-size: 3rem; margin-bottom: var(--spacing-4); opacity: 0.5;">💬</div>
                <h4 style="margin-bottom: var(--spacing-2);">Aucun avis pour le moment</h4>
                <p>Soyez le premier à laisser un avis sur ce logement !</p>
            </div>
        `;
    } else {
        reviewsList.innerHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">${review.avatar}</div>
                        <div class="reviewer-details">
                            <h4>${review.user}</h4>
                            <div class="review-date">${formatDate(review.date)}</div>
                        </div>
                    </div>
                    <div class="stars">
                        ${createStarRating(review.rating)}
                    </div>
                </div>
                <p>${review.comment}</p>
            </div>
        `).join('');
    }
}

/**
 * Charge et affiche les propriétés similaires
 */
function loadSimilarProperties() {
    const similarContainer = document.getElementById('similarProperties');
    
    // Trouver des propriétés similaires (même type ou même quartier)
    const similar = allProperties
        .filter(p => 
            p.id !== currentProperty.id && (
                p.type === currentProperty.type || 
                p.location.split(',')[0] === currentProperty.location.split(',')[0]
            )
        )
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);
    
    if (similar.length === 0) {
        document.getElementById('similarSection').style.display = 'none';
        return;
    }
    
    similarContainer.innerHTML = similar.map((property, index) => 
        createPropertyCard(property, index * 100)
    ).join('');
    
    // Réinitialiser les animations
    setTimeout(() => {
        initializeScrollAnimations();
    }, 100);
}

// === GALERIE PHOTO ===

/**
 * Ouvre la modal de galerie photo
 * @param {number} index - Index de l'image à afficher
 */
function openGalleryModal(index = 0) {
    currentGalleryIndex = index;
    updateGalleryModal();
    showModal('galleryModal');
    
    // Créer les thumbnails
    const thumbnailsContainer = document.getElementById('galleryThumbnails');
    thumbnailsContainer.innerHTML = currentProperty.images.map((img, i) => `
        <img src="${img}" alt="Miniature ${i + 1}" 
             style="width: 60px; height: 40px; object-fit: cover; border-radius: var(--radius-sm); cursor: pointer; opacity: ${i === index ? 1 : 0.6}; border: ${i === index ? '2px solid white' : 'none'};"
             onclick="currentGalleryIndex = ${i}; updateGalleryModal();">
    `).join('');
}

/**
 * Met à jour l'affichage de la modal galerie
 */
function updateGalleryModal() {
    const images = currentProperty.images;
    const galleryImage = document.getElementById('galleryImage');
    const galleryInfo = document.getElementById('galleryInfo');
    const prevBtn = document.getElementById('prevGalleryBtn');
    const nextBtn = document.getElementById('nextGalleryBtn');
    
    // Mettre à jour l'image
    galleryImage.src = images[currentGalleryIndex];
    galleryImage.alt = `${currentProperty.title} - Image ${currentGalleryIndex + 1}`;
    
    // Mettre à jour les infos
    galleryInfo.textContent = `Image ${currentGalleryIndex + 1} sur ${images.length}`;
    
    // Gérer les boutons navigation
    prevBtn.style.display = currentGalleryIndex > 0 ? 'block' : 'none';
    nextBtn.style.display = currentGalleryIndex < images.length - 1 ? 'block' : 'none';
    
    // Mettre à jour les thumbnails
    const thumbnails = document.querySelectorAll('#galleryThumbnails img');
    thumbnails.forEach((thumb, i) => {
        thumb.style.opacity = i === currentGalleryIndex ? '1' : '0.6';
        thumb.style.border = i === currentGalleryIndex ? '2px solid white' : 'none';
    });
}

/**
 * Image précédente dans la galerie
 */
function previousGalleryImage() {
    if (currentGalleryIndex > 0) {
        currentGalleryIndex--;
        updateGalleryModal();
    }
}

/**
 * Image suivante dans la galerie
 */
function nextGalleryImage() {
    if (currentGalleryIndex < currentProperty.images.length - 1) {
        currentGalleryIndex++;
        updateGalleryModal();
    }
}

// === GESTION DES ÉVÉNEMENTS ===

/**
 * Initialise tous les événements de la page
 */
function initializePropertyEvents() {
    // Formulaire de contact
    const contactForm = document.getElementById('propertyContactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
    
    // Navigation clavier dans la galerie
    document.addEventListener('keydown', handleGalleryKeyboard);
    
    // Formulaire d'avis
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmit);
    }
    
    // Étoiles de notation
    initializeRatingStars();
}

/**
 * Gère la soumission du formulaire de contact
 * @param {Event} e - L'événement de soumission
 */
function handleContactSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Animation de chargement
    submitBtn.innerHTML = '<span class="spin">⏳</span> Envoi en cours...';
    submitBtn.disabled = true;
    
    // Simuler l'envoi
    setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        showToast('Message envoyé', `Votre message a été envoyé à ${currentProperty.contact.owner}`, 'success');
        e.target.reset();
        
        // Pré-remplir à nouveau le message
        const messageTextarea = e.target.querySelector('textarea[name="message"]');
        if (messageTextarea) {
            messageTextarea.textContent = `Bonjour ${currentProperty.contact.owner}, je suis intéressé(e) par votre logement "${currentProperty.title}". Pouvons-nous convenir d'une visite ?`;
        }
    }, 2000);
}

/**
 * Gère la navigation clavier dans la galerie
 * @param {KeyboardEvent} e - L'événement clavier
 */
function handleGalleryKeyboard(e) {
    const galleryModal = document.getElementById('galleryModal');
    if (!galleryModal.classList.contains('active')) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            previousGalleryImage();
            break;
        case 'ArrowRight':
            e.preventDefault();
            nextGalleryImage();
            break;
        case 'Escape':
            e.preventDefault();
            closeModal('galleryModal');
            break;
    }
}

// === SYSTÈME D'AVIS ===

/**
 * Initialise les étoiles de notation interactives
 */
function initializeRatingStars() {
    const stars = document.querySelectorAll('.rating-star');
    const ratingInput = document.getElementById('reviewRating');
    
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            ratingInput.value = rating;
            
            // Mettre à jour l'affichage des étoiles
            stars.forEach((s, index) => {
                s.textContent = index < rating ? '⭐' : '☆';
                s.style.color = index < rating ? '#FFD700' : '#DDD';
            });
        });
        
        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            stars.forEach((s, index) => {
                s.style.color = index < rating ? '#FFD700' : '#DDD';
            });
        });
    });
    
    // Remettre les étoiles à leur état normal au survol
    const ratingContainer = document.getElementById('ratingStars');
    if (ratingContainer) {
        ratingContainer.addEventListener('mouseleave', () => {
            const currentRating = parseInt(ratingInput.value);
            stars.forEach((s, index) => {
                s.style.color = index < currentRating ? '#FFD700' : '#DDD';
            });
        });
    }
}

/**
 * Ouvre la modal d'ajout d'avis
 */
function openReviewModal() {
    if (!currentUser) {
        showToast('Connexion requise', 'Connectez-vous pour laisser un avis', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    showModal('reviewModal');
}

/**
 * Gère la soumission d'un nouvel avis
 * @param {Event} e - L'événement de soumission
 */
function handleReviewSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const rating = parseInt(formData.get('rating'));
    const comment = formData.get('comment');
    
    // Créer le nouvel avis
    const newReview = {
        id: Date.now(),
        user: currentUser.name,
        rating: rating,
        comment: comment,
        date: new Date().toISOString().split('T')[0],
        avatar: currentUser.name.split(' ').map(n => n[0]).join('')
    };
    
    // Ajouter l'avis aux données locales
    const reviewsKey = `reviews_${currentProperty.id}`;
    let reviews = JSON.parse(localStorage.getItem(reviewsKey) || '[]');
    reviews.push(newReview);
    localStorage.setItem(reviewsKey, JSON.stringify(reviews));
    
    // Mettre à jour l'affichage
    currentProperty.reviews.push(newReview);
    populatePropertyReviews();
    
    // Fermer la modal
    closeModal('reviewModal');
    
    // Reset du formulaire
    e.target.reset();
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach((star, index) => {
        star.textContent = index < 5 ? '⭐' : '☆';
        star.style.color = index < 5 ? '#FFD700' : '#DDD';
    });
    
    showToast('Avis publié', 'Merci pour votre avis !', 'success');
}

// === FAVORIS ===

/**
 * Toggle le statut favori de la propriété actuelle
 */
function togglePropertyFavorite() {
    if (!currentUser) {
        showToast('Connexion requise', 'Connectez-vous pour ajouter des favoris', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    const favKey = `favorites_${currentUser.id}`;
    let favorites = JSON.parse(localStorage.getItem(favKey) || '[]');
    const isFav = favorites.includes(currentProperty.id);
    
    if (isFav) {
        // Retirer des favoris
        favorites = favorites.filter(id => id !== currentProperty.id);
        showToast('Favori retiré', 'Propriété retirée de vos favoris', 'info');
    } else {
        // Ajouter aux favoris
        favorites.push(currentProperty.id);
        showToast('Favori ajouté', 'Propriété ajoutée à vos favoris', 'success');
    }
    
    localStorage.setItem(favKey, JSON.stringify(favorites));
    updateFavoriteButton();
}

/**
 * Met à jour l'apparence du bouton favoris
 */
function updateFavoriteButton() {
    const favoriteBtn = document.getElementById('favoriteBtn');
    if (!favoriteBtn || !currentUser) return;
    
    const favKey = `favorites_${currentUser.id}`;
    const favorites = JSON.parse(localStorage.getItem(favKey) || '[]');
    const isFavorite = favorites.includes(currentProperty.id);
    
    if (isFavorite) {
        favoriteBtn.innerHTML = '💖 Retirez des favoris';
        favoriteBtn.classList.add('active');
        favoriteBtn.style.color = 'var(--accent-red)';
    } else {
        favoriteBtn.innerHTML = '❤️ Ajouter aux favoris';
        favoriteBtn.classList.remove('active');
        favoriteBtn.style.color = '';
    }
}

// === PARTAGE ===

/**
 * Ouvre la modal de partage
 */
function shareProperty() {
    const shareUrl = window.location.href;
    document.getElementById('shareUrl').value = shareUrl;
    showModal('shareModal');
}

/**
 * Partage via différentes plateformes
 * @param {string} platform - Plateforme de partage
 */
function shareVia(platform) {
    const title = currentProperty.title;
    const text = `Découvrez ce logement sur LOCAYA : ${title}`;
    const url = window.location.href;
    
    switch (platform) {
        case 'whatsapp':
            window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
            break;
        case 'facebook':
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}`);
            break;
        case 'email':
            window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`;
            break;
    }
}

/**
 * Copie l'URL de partage dans le presse-papiers
 */
function copyShareUrl() {
    const shareUrlInput = document.getElementById('shareUrl');
    shareUrlInput.select();
    document.execCommand('copy');
    showToast('Lien copié', 'Le lien a été copié dans votre presse-papiers', 'success');
}

// === NAVIGATION ENTRE PROPRIÉTÉS ===

/**
 * Navigue vers la propriété précédente
 */
function previousProperty() {
    const currentIndex = allProperties.findIndex(p => p.id === currentProperty.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : allProperties.length - 1;
    const prevProperty = allProperties[prevIndex];
    
    window.location.href = `property.html?id=${prevProperty.id}`;
}

/**
 * Navigue vers la propriété suivante
 */
function nextProperty() {
    const currentIndex = allProperties.findIndex(p => p.id === currentProperty.id);
    const nextIndex = currentIndex < allProperties.length - 1 ? currentIndex + 1 : 0;
    const nextProperty = allProperties[nextIndex];
    
    window.location.href = `property.html?id=${nextProperty.id}`;
}

// === GESTION D'ERREUR ===

/**
 * Affiche l'état "propriété non trouvée"
 */
function showPropertyNotFound() {
    document.getElementById('loadingProperty').style.display = 'none';
    document.getElementById('propertyNotFound').style.display = 'block';
    document.title = 'Propriété non trouvée - LOCAYA';
}

/**
 * Affiche une erreur de chargement
 * @param {string} message - Message d'erreur
 */
function showPropertyError(message) {
    const loadingDiv = document.getElementById('loadingProperty');
    loadingDiv.innerHTML = `
        <div style="text-align: center; padding: var(--spacing-12);">
            <div style="font-size: 4rem; margin-bottom: var(--spacing-4); opacity: 0.5;">😕</div>
            <h3 style="margin-bottom: var(--spacing-4);">Erreur de chargement</h3>
            <p style="color: var(--gray-600); margin-bottom: var(--spacing-6);">${message}</p>
            <button onclick="window.location.reload()" class="btn btn-primary">
                Réessayer
            </button>
        </div>
    `;
    showToast('Erreur', message, 'error');
}

// === UTILITAIRES ===

/**
 * Met à jour les meta tags pour le SEO et partage social
 */
function updateMetaTags() {
    if (!currentProperty) return;
    
    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.content = `${currentProperty.title} - ${currentProperty.location}. ${currentProperty.description.substring(0, 150)}...`;
    }
    
    // Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
    }
    ogTitle.content = currentProperty.title;
    
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
    }
    ogDesc.content = currentProperty.description.substring(0, 200);
    
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
    }
    ogImage.content = currentProperty.images[0];
}

/**
 * Formate une date en français
 * @param {string} dateString - Date au format ISO
 * @returns {string} Date formatée
 */
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

console.log('🏠 LOCAYA Property.js chargé avec succès');