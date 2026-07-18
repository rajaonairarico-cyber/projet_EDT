// ============================================
// PROFESSEURS - CRUD complet
// ============================================

async function loadProfesseurs() {
    const tbody = document.getElementById('professeurs-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-400">Chargement...</td></tr>';
    try {
        const profs = await getProfesseurs();
        if (!profs || !profs.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-400">Aucun professeur</td></tr>';
            return;
        }
        tbody.innerHTML = profs.map(p => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 md:px-6 py-4 text-sm font-medium text-gray-900">${p.idprof}</td>
                <td class="px-4 md:px-6 py-4 text-sm text-gray-700">${p.Nom}</td>
                <td class="px-4 md:px-6 py-4 text-sm text-gray-700">${p['Prénoms']}</td>
                <td class="px-4 md:px-6 py-4 text-sm text-gray-700">${p.Grade}</td>
                <td class="px-4 md:px-6 py-4">
                    <button onclick="editProfesseur('${p.idprof}')" class="text-indigo-600 hover:text-indigo-900 mr-3"><i class="fas fa-edit"></i></button>
                    <button onclick="supprimerProfesseur('${p.idprof}')" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Erreur de chargement</td></tr>';
    }
}

async function editProfesseur(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/professeurs/${id}`);
        const p = await res.json();
        document.getElementById('professeur-id').value = p.idprof;
        document.getElementById('professeur-idprof').value = p.idprof;
        document.getElementById('professeur-idprof').disabled = true;
        document.getElementById('professeur-nom').value = p.Nom;
        document.getElementById('professeur-prenoms').value = p['Prénoms'];
        document.getElementById('professeur-grade').value = p.Grade;
        document.getElementById('professeurModalTitle').textContent = 'Modifier le Professeur';
        openModal('professeurModal');
    } catch (e) {
        showNotification('Erreur lors du chargement', 'error');
    }
}

async function saveProfesseur(event) {
    event.preventDefault();
    const id = document.getElementById('professeur-id').value;
    const idprof = document.getElementById('professeur-idprof').value.trim();

    if (!isNaN(idprof) && Number(idprof) < 0) {
        showNotification('❌ L\'ID ne peut pas être négatif', 'error'); return;
    }

    const data = {
        idprof,
        Nom: document.getElementById('professeur-nom').value.trim(),
        'Prénoms': document.getElementById('professeur-prenoms').value.trim(),
        Grade: document.getElementById('professeur-grade').value
    };
    try {
        let res, result;
        if (id) {
            res = await fetch(`${API_BASE_URL}/professeurs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        } else {
            res = await fetch(`${API_BASE_URL}/professeurs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        }
        result = await res.json();
        if (result.success) {
            showNotification(result.message || '✅ Opération réussie', 'success');
            closeModal('professeurModal');
            resetProfesseurForm();
            await loadProfesseurs();
            await loadDashboardStats();
            await loadSelectOptions();
        } else {
            showNotification(result.error || '❌ Erreur', 'error');
        }
    } catch (e) {
        showNotification('Erreur de connexion au serveur', 'error');
    }
}

async function supprimerProfesseur(id) {
    if (!confirm(`Supprimer le professeur "${id}" ?`)) return;
    try {
        const res = await fetch(`${API_BASE_URL}/professeurs/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            showNotification(result.message || '✅ Supprimé', 'success');
            await loadProfesseurs();
            await loadDashboardStats();
            await loadSelectOptions();
        } else {
            showNotification(result.error || '❌ Erreur', 'error');
        }
    } catch (e) {
        showNotification('Erreur de connexion', 'error');
    }
}

function openAddProfesseur() {
    resetProfesseurForm();
    openModal('professeurModal');
}

function resetProfesseurForm() {
    document.getElementById('professeur-id').value = '';
    document.getElementById('professeur-idprof').value = '';
    document.getElementById('professeur-idprof').disabled = false;
    document.getElementById('professeur-nom').value = '';
    document.getElementById('professeur-prenoms').value = '';
    document.getElementById('professeur-grade').value = '';
    document.getElementById('professeurModalTitle').textContent = 'Ajouter un Professeur';
}
