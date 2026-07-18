// ============================================
// SALLES - CRUD complet
// ============================================

async function loadSalles() {
    const tbody = document.getElementById('salles-table-body');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-400">Chargement...</td></tr>';
    try {
        const salles = await getSalles();
        if (!salles || !salles.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-gray-400">Aucune salle</td></tr>';
            return;
        }
        tbody.innerHTML = salles.map(s => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 md:px-6 py-4 text-sm font-medium text-gray-900">${s.idsalle}</td>
                <td class="px-4 md:px-6 py-4 text-sm text-gray-700">${s.design}</td>
                <td class="px-4 md:px-6 py-4">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${s.occupation === 'libre' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${s.occupation === 'libre' ? '🟢 Libre' : '🔴 Occupée'}
                    </span>
                </td>
                <td class="px-4 md:px-6 py-4">
                    <button onclick="editSalle('${s.idsalle}')" class="text-green-600 hover:text-green-900 mr-3"><i class="fas fa-edit"></i></button>
                    <button onclick="supprimerSalle('${s.idsalle}')" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500">Erreur de chargement</td></tr>';
    }
}

async function editSalle(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/salles/${id}`);
        const s = await res.json();
        document.getElementById('salle-id').value = s.idsalle;
        document.getElementById('salle-idsalle').value = s.idsalle;
        document.getElementById('salle-idsalle').disabled = true;
        document.getElementById('salle-design').value = s.design;
        document.getElementById('salle-occupation').value = s.occupation;
        document.getElementById('salleModalTitle').textContent = 'Modifier la Salle';
        openModal('salleModal');
    } catch (e) {
        showNotification('Erreur lors du chargement', 'error');
    }
}

async function saveSalle(event) {
    event.preventDefault();
    const id = document.getElementById('salle-id').value;
    const idsalle = document.getElementById('salle-idsalle').value;

    if (!isNaN(idsalle) && Number(idsalle) < 0) {
        showNotification('❌ L\'ID ne peut pas être négatif', 'error'); return;
    }

    const data = {
        idsalle,
        design: document.getElementById('salle-design').value.trim(),
        occupation: document.getElementById('salle-occupation').value
    };
    try {
        let res, result;
        if (id) {
            res = await fetch(`${API_BASE_URL}/salles/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        } else {
            res = await fetch(`${API_BASE_URL}/salles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        }
        result = await res.json();
        if (result.success) {
            showNotification(result.message || '✅ Opération réussie', 'success');
            closeModal('salleModal');
            resetSalleForm();
            await loadSalles();
            await loadDashboardStats();
            await loadSelectOptions();
        } else {
            showNotification(result.error || '❌ Erreur', 'error');
        }
    } catch (e) {
        showNotification('Erreur de connexion au serveur', 'error');
    }
}

async function supprimerSalle(id) {
    if (!confirm(`Supprimer la salle "${id}" ?`)) return;
    try {
        const res = await fetch(`${API_BASE_URL}/salles/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            showNotification(result.message || '✅ Supprimée', 'success');
            await loadSalles();
            await loadDashboardStats();
            await loadSelectOptions();
        } else {
            showNotification(result.error || '❌ Erreur', 'error');
        }
    } catch (e) {
        showNotification('Erreur de connexion', 'error');
    }
}

function openAddSalle() {
    resetSalleForm();
    openModal('salleModal');
}

function resetSalleForm() {
    document.getElementById('salle-id').value = '';
    document.getElementById('salle-idsalle').value = '';
    document.getElementById('salle-idsalle').disabled = false;
    document.getElementById('salle-design').value = '';
    document.getElementById('salle-occupation').value = 'libre';
    document.getElementById('salleModalTitle').textContent = 'Ajouter une Salle';
}
