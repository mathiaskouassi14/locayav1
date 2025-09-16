/**
 * LOCAYA - Module de recherche
 * Gestion de la recherche de logements, filtrage et affichage des résultats
 */

// === VARIABLES GLOBALES ===
let allProperties = [];
let filteredProperties = [];
let displayedProperties = [];
let currentPage = 1;
const propertiesPerPage = 9;
let currentFilters = {};
let currentSort = 'price-asc';
let currentView = 'grid';

// === INITIALISATION ===
document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
});

/**
 * Initialise le module de recherche
 */
async function initializeSearch() {
    console.log('🔍 Initialisation du module de recherche...');
    
    // Charger les propriétés
    await loadPropertiesForSearch();
    
    // Récupérer les paramètres URL
    parseURLParameters();
    
    // Initialiser les événements
    initializeSearchEvents();
    
    // Effectuer la recherche initiale
    performSearch();
    
    console.log('✅ Module de recherche initialisé');
}

/**
 * Charge les propriétés pour la recherche
 */
async function loadPropertiesForSearch() {
    try {
        const response = await fetch('data/properties.json');
        allProperties = await response.json();
        console.log(`📊 ${allProperties.length} propriétés chargées pour la recherche`);
    } catch (error) {
        console.error('❌ Erreur lors du chargement des propriétés:', error);
        showSearchError('Impossible de charger les logements');
    }
}

/**
 * Analyse les paramètres URL pour pré-remplir la recherche
 */
function parseURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Remplir les champs de recherche
    const locationInput = document.getElementById('searchLocation');
    const typeSelect = document.getElementById('searchType');
    const bedroomsSelect = document.getElementById('searchBedrooms');
    const priceRange = urlParams.get('priceRange');
    
    if (locationInput && urlParams.get('location')) {
        locationInput.value = urlParams.get('location');
    }
    
    if (typeSelect && urlParams.get('type')) {
        typeSelect.value = urlParams.get('type');
    }
    
    if (bedroomsSelect && urlParams.get('bedrooms')) {
        bedroomsSelect.value = urlParams.get('bedrooms');
    }
    
    // Gérer la plage de prix
    if (priceRange) {
        const minPriceInput = document.getElementById('minPrice');
        const maxPriceInput = document.getElementById('maxPrice');
        
        if (priceRange.includes('-')) {
            const [min, max] = priceRange.split('-');
            if (minPriceInput) minPriceInput.value = min;
            if (maxPriceInput && max !== '+') maxPriceInput.value = max;
        } else if (priceRange.endsWith('+')) {
            const min = priceRange.replace('+', '');
            if (minPriceInput) minPriceInput.value = min;
        }
    }
    
    // Construire les filtres initiaux
    buildCurrentFilters();
}

/**
 * Construit l'objet des filtres actuels à partir des champs
 */
function buildCurrentFilters() {
    const locationInput = document.getElementById('searchLocation');
    const typeSelect = document.getElementById('searchType');
    const bedroomsSelect = document.getElementById('searchBedrooms');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const minAreaInput = document.getElementById('minArea');
    const bathroomsSelect = document.getElementById('bathrooms');
    
    currentFilters = {
        location: locationInput?.value.toLowerCase() || '',
        type: typeSelect?.value || '',
        bedrooms: bedroomsSelect?.value || '',
        minPrice: minPriceInput?.value ? parseInt(minPriceInput.value) : 0,
        maxPrice: maxPriceInput?.value ? parseInt(maxPriceInput.value) : Infinity,
        minArea: minAreaInput?.value ? parseInt(minAreaInput.value) : 0,
        bathrooms: bathroomsSelect?.value || ''
    };
}

// === ÉVÉNEMENTS ===

/**
 * Initialise tous les événements de recherche
 */
function initializeSearchEvents() {
    // Formulaire de recherche principal
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearchSubmit);
    }
    
    // Champs de recherche avec debounce
    const searchInputs = [
        'searchLocation', 'searchType', 'searchBedrooms',
        'minPrice', 'maxPrice', 'minArea', 'bathrooms'
    ];
    
    searchInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', debounce(handleFilterChange, 500));
            input.addEventListener('change', handleFilterChange);
        }
    });
    
    // Tri
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortChange);
    }
    
    // Vue (grille/liste)
    const gridViewBtn = document.getElementById('gridView');
    const listViewBtn = document.getElementById('listView');
    
    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', () => setView('grid'));
    }
    
    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => setView('list'));
    }
    
    // Filtres avancés
    const toggleAdvanced = document.getElementById('toggleAdvanced');
    if (toggleAdvanced) {
        toggleAdvanced.addEventListener('click', toggleAdvancedFilters);
    }
    
    // Réinitialisation
    const resetFilters = document.getElementById('resetFilters');
    if (resetFilters) {
        resetFilters.addEventListener('click', resetAllFilters);
    }
    
    // Charger plus
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreProperties);
    }
}

/**
 * Gère la soumission du formulaire de recherche
 * @param {Event} e - L'événement de soumission
 */
function handleSearchSubmit(e) {
    e.preventDefault();
    buildCurrentFilters();
    performSearch();
}

/**
 * Gère les changements de filtres
 */
function handleFilterChange() {
    buildCurrentFilters();
    performSearch();
}

/**
 * Gère les changements de tri
 * @param {Event} e - L'événement de changement
 */
function handleSortChange(e) {
    currentSort = e.target.value;
    performSearch();
}

// === LOGIQUE DE RECHERCHE ===

/**
 * Effectue la recherche avec les filtres actuels
 */
function performSearch() {
    console.log('🔍 Recherche avec filtres:', currentFilters);
    
    // Afficher le loading
    showLoadingState();
    
    // Simuler un délai de recherche pour l'expérience utilisateur
    setTimeout(() => {
        // Filtrer les propriétés
        filteredProperties = filterProperties(allProperties, currentFilters);
        
        // Trier les résultats
        filteredProperties = sortProperties(filteredProperties, currentSort);
        
        // Réinitialiser la pagination
        currentPage = 1;
        displayedProperties = [];
        
        // Afficher les résultats
        displayResults();
        
        // Mettre à jour l'URL
        updateURL();
        
        console.log(`✅ Recherche terminée: ${filteredProperties.length} résultats`);
    }, 800);
}

/**
 * Filtre les propriétés selon les critères
 * @param {Array} properties - Les propriétés à filtrer
 * @param {Object} filters - Les filtres à appliquer
 * @returns {Array} Propriétés filtrées
 */
function filterProperties(properties, filters) {
    return properties.filter(property => {
        // Filtre par localisation
        if (filters.location && 
            !property.location.toLowerCase().includes(filters.location)) {
            return false;
        }
        
        // Filtre par type
        if (filters.type && property.type !== filters.type) {
            return false;
        }
        
        // Filtre par nombre de chambres
        if (filters.bedrooms) {
            if (filters.bedrooms === '4+' && property.bedrooms < 4) {
                return false;
            } else if (filters.bedrooms !== '4+' && 
                       property.bedrooms !== parseInt(filters.bedrooms)) {
                return false;
            }
        }
        
        // Filtre par prix
        if (property.price < filters.minPrice || property.price > filters.maxPrice) {
            return false;
        }
        
        // Filtre par surface
        if (property.area < filters.minArea) {
            return false;
        }
        
        // Filtre par salles de bain
        if (filters.bathrooms) {
            if (filters.bathrooms === '3+' && property.bathrooms < 3) {
                return false;
            } else if (filters.bathrooms !== '3+' && 
                       property.bathrooms !== parseInt(filters.bathrooms)) {
                return false;
            }
        }
        
        return true;
    });
}

/**
 * Trie les propriétés selon le critère choisi
 * @param {Array} properties - Les propriétés à trier
 * @param {string} sortBy - Le critère de tri
 * @returns {Array} Propriétés triées
 */
function sortProperties(properties, sortBy) {
    const sorted = [...properties];
    
    switch (sortBy) {
        case 'price-asc':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-desc':
            return sorted.sort((a, b) => b.price - a.price);
        case 'rating-desc':
            return sorted.sort((a, b) => b.rating - a.rating);
        case 'area-desc':
            return sorted.sort((a, b) => b.area - a.area);
        case 'recent':
            return sorted.sort((a, b) => b.id - a.id);
        default:
            return sorted;
    }
}

// === AFFICHAGE DES RÉSULTATS ===

/**
 * Affiche les résultats de recherche
 */
function displayResults() {
    const loadingState = document.getElementById('loadingState');
    const searchResults = document.getElementById('searchResults');
    const noResults = document.getElementById('noResults');
    const resultsCount = document.getElementById('resultsCount');
    
    // Cacher le loading
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    
    // Mettre à jour le compteur
    updateResultsCount();
    
    if (filteredProperties.length === 0) {
        // Aucun résultat
        if (searchResults) searchResults.style.display = 'none';
        if (noResults) noResults.style.display = 'block';
        hideLoadMoreSection();
    } else {
        // Afficher les résultats
        if (noResults) noResults.style.display = 'none';
        if (searchResults) {
            searchResults.style.display = currentView === 'grid' ? 'grid' : 'block';
            searchResults.className = currentView === 'grid' ? 'grid grid-3' : 'list-view';
        }
        
        // Charger la première page
        loadMoreProperties();
    }
}

/**
 * Charge plus de propriétés (pagination)
 */
function loadMoreProperties() {
    const startIndex = (currentPage - 1) * propertiesPerPage;
    const endIndex = startIndex + propertiesPerPage;
    const newProperties = filteredProperties.slice(startIndex, endIndex);
    
    if (newProperties.length === 0) {
        hideLoadMoreSection();
        return;
    }
    
    // Ajouter les nouvelles propriétés
    displayedProperties.push(...newProperties);
    
    // Générer le HTML
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        if (currentPage === 1) {
            searchResults.innerHTML = '';
        }
        
        newProperties.forEach((property, index) => {
            const delay = index * 100;
            const propertyHTML = createSearchPropertyCard(property, delay);
            searchResults.innerHTML += propertyHTML;
        });
        
        // Réinitialiser les animations
        setTimeout(() => {
            initializeScrollAnimations();
        }, 100);
    }
    
    currentPage++;
    
    // Gérer le bouton "Charger plus"
    if (displayedProperties.length >= filteredProperties.length) {
        hideLoadMoreSection();
    } else {
        showLoadMoreSection();
    }
    
    // Mettre à jour le compteur
    updateResultsCount();
}

/**
 * Crée le HTML d'une carte de propriété pour la recherche
 * @param {Object} property - Les données de la propriété
 * @param {number} delay - Délai d'animation
 * @returns {string} HTML de la carte
 */
function createSearchPropertyCard(property, delay = 0) {
    const isListView = currentView === 'list';
    
    if (isListView) {
        return createListPropertyCard(property, delay);
    }
    
    return `
        <div class="property-card hover-lift fade-in-up" style="animation-delay: ${delay}ms;" data-property-id="${property.id}">
            <div class="property-image">
                <img src="${property.images[0]}" alt="${property.title}" loading="lazy">
                <div class="property-badge">${property.status}</div>
                <button class="property-favorite ${isFavorite(property.id) ? 'active' : ''}" 
                        onclick="toggleFavorite(${property.id})" title="Ajouter aux favoris">
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
                
                <div style="display: flex; align-items: center; gap: var(--spacing-2); margin-bottom: var(--spacing-3);">
                    <div class="stars">
                        ${createStarRating(property.rating)}
                    </div>
                    <span style="color: var(--gray-600); font-size: var(--font-size-sm);">
                        ${property.rating}/5 (${property.reviews.length})
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
            </div>
        </div>
    `;
}

/**
 * Crée le HTML d'une carte en vue liste
 * @param {Object} property - Les données de la propriété
 * @param {number} delay - Délai d'animation
 * @returns {string} HTML de la carte liste
 */
function createListPropertyCard(property, delay = 0) {
    return `
        <div class="property-card-list hover-lift fade-in-up" 
             style="animation-delay: ${delay}ms; display: flex; gap: var(--spacing-4); padding: var(--spacing-4);" 
             data-property-id="${property.id}">
            
            <div class="property-image" style="width: 200px; height: 150px; flex-shrink: 0;">
                <img src="${property.images[0]}" alt="${property.title}" loading="lazy">
                <div class="property-badge">${property.status}</div>
                <button class="property-favorite ${isFavorite(property.id) ? 'active' : ''}" 
                        onclick="toggleFavorite(${property.id})" title="Ajouter aux favoris">
                    ❤️
                </button>
            </div>
            
            <div class="property-content" style="flex: 1; display: flex; flex-direction: column;">
                <h3 class="property-title" style="margin-bottom: var(--spacing-2);">
                    ${property.title}
                </h3>
                
                <div class="property-location" style="margin-bottom: var(--spacing-3);">
                    📍 ${property.location}
                </div>
                
                <div class="property-features" style="margin-bottom: var(--spacing-3);">
                    <span>🛏️ ${property.bedrooms} ch.</span>
                    <span>🚿 ${property.bathrooms} sdb</span>
                    <span>📐 ${property.area}m²</span>
                </div>
                
                <div style="display: flex; align-items: center; gap: var(--spacing-2); margin-bottom: var(--spacing-3);">
                    <div class="stars">
                        ${createStarRating(property.rating)}
                    </div>
                    <span style="color: var(--gray-600); font-size: var(--font-size-sm);">
                        ${property.rating}/5 (${property.reviews.length})
                    </span>
                </div>
                
                <p style="color: var(--gray-600); font-size: var(--font-size-sm); margin-bottom: auto; line-height: 1.4;">
                    ${property.description.substring(0, 120)}...
                </p>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--spacing-4);">
                    <div class="property-price" style="margin: 0;">
                        ${formatPrice(property.price)} FCFA/${property.period}
                    </div>
                    
                    <div style="display: flex; gap: var(--spacing-2);">
                        <a href="property.html?id=${property.id}" class="btn btn-primary btn-sm">
                            Voir détails
                        </a>
                        <button class="btn btn-outline btn-sm" onclick="contactOwner(${property.id})">
                            📞
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// === UTILITAIRES D'AFFICHAGE ===

/**
 * Affiche l'état de chargement
 */
function showLoadingState() {
    const loadingState = document.getElementById('loadingState');
    const searchResults = document.getElementById('searchResults');
    const noResults = document.getElementById('noResults');
    
    if (loadingState) loadingState.style.display = 'block';
    if (searchResults) searchResults.style.display = 'none';
    if (noResults) noResults.style.display = 'none';
    
    hideLoadMoreSection();
}

/**
 * Affiche une erreur de recherche
 * @param {string} message - Le message d'erreur
 */
function showSearchError(message) {
    showToast('Erreur de recherche', message, 'error');
    
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-12);">
                <div style="font-size: 4rem; margin-bottom: var(--spacing-4); opacity: 0.5;">😕</div>
                <h3 style="margin-bottom: var(--spacing-4);">Erreur de chargement</h3>
                <p style="color: var(--gray-600); margin-bottom: var(--spacing-6);">${message}</p>
                <button onclick="window.location.reload()" class="btn btn-primary">
                    Réessayer
                </button>
            </div>
        `;
    }
}

/**
 * Met à jour le compteur de résultats
 */
function updateResultsCount() {
    const resultsCount = document.getElementById('resultsCount');
    if (!resultsCount) return;
    
    const total = filteredProperties.length;
    const displayed = displayedProperties.length;
    
    if (total === 0) {
        resultsCount.textContent = 'Aucun résultat trouvé';
    } else if (displayed >= total) {
        resultsCount.textContent = `${total} logement${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''}`;
    } else {
        resultsCount.textContent = `${displayed} sur ${total} logements affichés`;
    }
}

/**
 * Affiche la section "Charger plus"
 */
function showLoadMoreSection() {
    const loadMoreSection = document.getElementById('loadMoreSection');
    if (loadMoreSection) {
        loadMoreSection.style.display = 'block';
    }
}

/**
 * Cache la section "Charger plus"
 */
function hideLoadMoreSection() {
    const loadMoreSection = document.getElementById('loadMoreSection');
    if (loadMoreSection) {
        loadMoreSection.style.display = 'none';
    }
}

// === GESTION DES VUES ===

/**
 * Change la vue (grille/liste)
 * @param {string} view - Type de vue : 'grid' ou 'list'
 */
function setView(view) {
    currentView = view;
    
    const gridBtn = document.getElementById('gridView');
    const listBtn = document.getElementById('listView');
    
    // Mettre à jour les boutons actifs
    if (gridBtn && listBtn) {
        gridBtn.classList.toggle('active', view === 'grid');
        listBtn.classList.toggle('active', view === 'list');
    }
    
    // Réafficher les résultats avec la nouvelle vue
    if (filteredProperties.length > 0) {
        currentPage = 1;
        displayedProperties = [];
        loadMoreProperties();
    }
}

// === FILTRES AVANCÉS ===

/**
 * Toggle l'affichage des filtres avancés
 */
function toggleAdvancedFilters() {
    const advancedFilters = document.getElementById('advancedFilters');
    const toggleBtn = document.getElementById('toggleAdvanced');
    
    if (advancedFilters && toggleBtn) {
        const isVisible = advancedFilters.style.display !== 'none';
        advancedFilters.style.display = isVisible ? 'none' : 'block';
        toggleBtn.textContent = isVisible ? '⚙️ Filtres avancés' : '❌ Masquer les filtres';
    }
}

/**
 * Remet à zéro tous les filtres
 */
function resetAllFilters() {
    // Réinitialiser tous les champs
    const inputs = [
        'searchLocation', 'minPrice', 'maxPrice', 'minArea'
    ];
    
    const selects = [
        'searchType', 'searchBedrooms', 'bathrooms'
    ];
    
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) input.value = '';
    });
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) select.value = '';
    });
    
    // Réinitialiser le tri
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) sortSelect.value = 'price-asc';
    
    currentSort = 'price-asc';
    buildCurrentFilters();
    
    // Nouvelle recherche
    performSearch();
    
    // Mettre à jour l'URL
    updateURL();
    
    showToast('Filtres réinitialisés', 'Tous les filtres ont été remis à zéro', 'success');
}

// === RECHERCHES RAPIDES ===

/**
 * Effectue une recherche rapide avec des paramètres prédéfinis
 * @param {string} location - Localisation
 * @param {string} type - Type de logement
 * @param {string} priceRange - Plage de prix
 */
function quickSearch(location = '', type = '', priceRange = '') {
    // Remplir les champs
    const locationInput = document.getElementById('searchLocation');
    const typeSelect = document.getElementById('searchType');
    
    if (locationInput) locationInput.value = location;
    if (typeSelect) typeSelect.value = type;
    
    // Gérer la plage de prix
    if (priceRange) {
        const minPriceInput = document.getElementById('minPrice');
        const maxPriceInput = document.getElementById('maxPrice');
        
        if (priceRange.includes('-')) {
            const [min, max] = priceRange.split('-');
            if (minPriceInput) minPriceInput.value = min;
            if (maxPriceInput && max !== '+') maxPriceInput.value = max;
        }
    }
    
    // Effectuer la recherche
    buildCurrentFilters();
    performSearch();
}

// === GESTION URL ===

/**
 * Met à jour l'URL avec les paramètres de recherche actuels
 */
function updateURL() {
    const params = new URLSearchParams();
    
    if (currentFilters.location) params.append('location', currentFilters.location);
    if (currentFilters.type) params.append('type', currentFilters.type);
    if (currentFilters.bedrooms) params.append('bedrooms', currentFilters.bedrooms);
    if (currentFilters.minPrice > 0) params.append('minPrice', currentFilters.minPrice);
    if (currentFilters.maxPrice < Infinity) params.append('maxPrice', currentFilters.maxPrice);
    if (currentFilters.minArea > 0) params.append('minArea', currentFilters.minArea);
    if (currentFilters.bathrooms) params.append('bathrooms', currentFilters.bathrooms);
    if (currentSort !== 'price-asc') params.append('sort', currentSort);
    
    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newURL);
}

// === UTILITAIRES ===

/**
 * Vérifie si une propriété est en favoris
 * @param {number} propertyId - ID de la propriété
 * @returns {boolean} True si en favoris
 */
function isFavorite(propertyId) {
    if (!currentUser) return false;
    
    const favKey = `favorites_${currentUser.id}`;
    const favorites = JSON.parse(localStorage.getItem(favKey) || '[]');
    return favorites.includes(propertyId);
}

/**
 * Fonction debounce pour limiter les appels
 * @param {Function} func - Fonction à débouncer
 * @param {number} wait - Délai en ms
 * @returns {Function} Fonction débouncée
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// === EXPORT POUR LES AUTRES MODULES ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        quickSearch,
        resetAllFilters
    };
}

console.log('🔍 LOCAYA Search.js chargé avec succès');