// ============================================================
// SALLES LIBRES - Recherche
// ============================================================
async function rechercherSallesLibres() {
    const date = document.getElementById('recherche-date').value;
    const heure = document.getElementById('recherche-heure').value;
    const resultDiv = document.getElementById('salles-libres-result');

    if (!date || !heure) {
        showNotification('Veuillez sélectionner une date et une heure', 'warning');
        return;
    }

    if (!resultDiv) return;
    resultDiv.innerHTML = '<p class="text-gray-400 text-center py-4">Recherche en cours...</p>';

    try {
        const response = await getSallesLibres(date, heure);
        const data = Array.isArray(response) ? response : (response.data || []);
        if (!Array.isArray(data) || data.length === 0) {
            resultDiv.innerHTML = '<p class="text-orange-500 text-center py-4"><i class="fas fa-exclamation-circle mr-2"></i>Aucune salle libre à ce créneau</p>';
            return;
        }
        resultDiv.innerHTML = `
            <p class="text-green-600 font-medium mb-3"><i class="fas fa-check-circle mr-2"></i>${data.length} salle(s) libre(s) trouvée(s)</p>
            <div class="grid grid-cols-2 gap-3">
                ${data.map(s => `
                    <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p class="font-medium text-green-800">${s.design}</p>
                        <p class="text-xs text-green-600">ID: ${s.idsalle}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (e) {
        resultDiv.innerHTML = '<p class="text-red-500 text-center py-4">Erreur lors de la recherche</p>';
        showNotification('Erreur: ' + e.message, 'error');
    }
}
