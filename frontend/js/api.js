// ============================================
// Configuration de l'API
// Détection automatique : local vs production (Render)
// ============================================

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8001'
    : 'https://projet-edt-api.onrender.com';

console.log('🚀 API configurée :', API_BASE_URL);

// ============================================
// Fonction générique pour les appels API
// ============================================

async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.message || 'Une erreur est survenue');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============================================
// PROFESSEURS
// ============================================

async function getProfesseurs() {
    const result = await apiRequest('/professeurs');
    return Array.isArray(result) ? result : (result.data || result);
}

async function createProfesseur(data) {
    const result = await apiRequest('/professeurs', 'POST', data);
    return result.data || result;
}

async function updateProfesseur(id, data) {
    const result = await apiRequest(`/professeurs/${id}`, 'PUT', data);
    return result.data || result;
}

async function deleteProfesseur(id) {
    const result = await apiRequest(`/professeurs/${id}`, 'DELETE');
    return result.data || result;
}

// ============================================
// SALLES
// ============================================

async function getSalles() {
    const result = await apiRequest('/salles');
    return Array.isArray(result) ? result : (result.data || result);
}

async function createSalle(data) {
    const result = await apiRequest('/salles', 'POST', data);
    return result.data || result;
}

async function updateSalle(id, data) {
    const result = await apiRequest(`/salles/${id}`, 'PUT', data);
    return result.data || result;
}

async function deleteSalle(id) {
    const result = await apiRequest(`/salles/${id}`, 'DELETE');
    return result.data || result;
}

// ============================================
// CLASSES
// ============================================

async function getClasses() {
    const result = await apiRequest('/classes');
    return Array.isArray(result) ? result : (result.data || result);
}

async function createClasse(data) {
    const result = await apiRequest('/classes', 'POST', data);
    return result.data || result;
}

async function updateClasse(id, data) {
    const result = await apiRequest(`/classes/${id}`, 'PUT', data);
    return result.data || result;
}

async function deleteClasse(id) {
    const result = await apiRequest(`/classes/${id}`, 'DELETE');
    return result.data || result;
}

// ============================================
// EMPLOIS DU TEMPS
// ============================================

async function getEmplois() {
    const result = await apiRequest('/emplois');
    return Array.isArray(result) ? result : (result.data || result);
}

async function createEmploi(data) {
    const result = await apiRequest('/emplois', 'POST', data);
    return result.data || result;
}

async function updateEmploi(id, data) {
    const result = await apiRequest(`/emplois/${id}`, 'PUT', data);
    return result.data || result;
}

async function deleteEmploi(id) {
    const result = await apiRequest(`/emplois/${id}`, 'DELETE');
    return result.data || result;
}

// ============================================
// SALLES LIBRES
// ============================================

async function getSallesLibres(date, heure) {
    const result = await apiRequest(`/salles-libres?date=${date}&heure=${heure}`);
    return Array.isArray(result) ? result : (result.data || result);
}

// ============================================
// EMPLOI CLASSE
// ============================================

async function getEmploiClasse(idclasse, semaine) {
    const url = `/emploi-classe?id=${idclasse}` + (semaine ? `&semaine=${semaine}` : '');
    const result = await apiRequest(url);
    return Array.isArray(result) ? result : (result.data || result);
}

// ============================================
// PDF (simulation)
// ============================================

async function generatePDF(data) {
    if (typeof showNotification === 'function') {
        showNotification('📄 PDF généré (simulation)', 'success');
    }
    console.log('PDF demandé pour:', data);
    return { success: true };
}
