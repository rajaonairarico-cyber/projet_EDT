// Configuration API
const USE_MOCK = false;
const API_BASE_URL = 'http://localhost:8001';

async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}/${endpoint}`;
    const options = {
        method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);
    const response = await fetch(url, options);
    return response.json();
}

// ---- PROFESSEURS ----
async function getProfesseurs() {
    return apiRequest('professeurs');
}
async function addProfesseur(data) {
    return apiRequest('professeurs', 'POST', data);
}
async function updateProfesseur(id, data) {
    return apiRequest(`professeurs/${id}`, 'PUT', data);
}
async function deleteProfesseur(id) {
    return apiRequest(`professeurs/${id}`, 'DELETE');
}

// ---- SALLES ----
async function getSalles() {
    return apiRequest('salles');
}
async function addSalle(data) {
    return apiRequest('salles', 'POST', data);
}
async function updateSalle(id, data) {
    return apiRequest(`salles/${id}`, 'PUT', data);
}
async function deleteSalle(id) {
    return apiRequest(`salles/${id}`, 'DELETE');
}

// ---- CLASSES ----
async function getClasses() {
    return apiRequest('classes');
}
async function addClass(data) {
    return apiRequest('classes', 'POST', data);
}
async function updateClasse(id, data) {
    return apiRequest(`classes/${id}`, 'PUT', data);
}
async function deleteClasse(id) {
    return apiRequest(`classes/${id}`, 'DELETE');
}

// ---- EMPLOIS ----
async function getEmplois() {
    return apiRequest('emplois');
}
async function addEmploi(data) {
    return apiRequest('emplois', 'POST', data);
}
async function updateEmploi(id, data) {
    return apiRequest(`emplois/${id}`, 'PUT', data);
}
async function deleteEmploi(id) {
    return apiRequest(`emplois/${id}`, 'DELETE');
}

// ---- SALLES LIBRES ----
async function getSallesLibres(date, heure) {
    return apiRequest(`salles-libres?date=${date}&heure=${heure}`);
}

// ---- EMPLOI CLASSE ----
async function getEmploiClasse(idclasse) {
    return apiRequest(`emploi-classe?id=${idclasse}`);
}
