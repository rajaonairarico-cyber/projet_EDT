// ============================================
// CLASSES - CRUD complet
// ============================================

async function loadClasses() {
    const tbody = document.getElementById('classes-table-body');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-400">Chargement...</td></tr>';
    try {
        const classes = await getClasses();
        if (!classes || !classes.length) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-gray-400">Aucune classe enregistrée</td></tr>';
            return;
        }
        tbody.innerHTML = classes.map(c => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 md:px-6 py-4 text-sm font-medium text-gray-900">${c.idclasse}</td>
                <td class="px-4 md:px-6 py-4 text-sm text-gray-700">${c.niveau}</td>
                <td class="px-4 md:px-6 py-4">
                    <button onclick="editClasse('${c.idclasse}')" class="text-blue-600 hover:text-blue-900 mr-3"><i class="fas fa-edit"></i></button>
                    <button onclick="supprimerClasse('${c.idclasse}')" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-red-500">Erreur de chargement</td></tr>';
    }
}

async function editClasse(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/classes/${id}`);
        const c = await res.json();
        document.getElementById('classe-id').value = c.idclasse;
        document.getElementById('classe-idclasse').value = c.idclasse;
        document.getElementById('classe-idclasse').disabled = true;
        document.getElementById('classe-niveau').value = c.niveau;
        document.getElementById('classeModalTitle').textContent = 'Modifier la Classe';
        openModal('classeModal');
    } catch (e) {
        showNotification('Erreur lors du chargement', 'error');
    }
}

async function saveClasse(event) {
    event.preventDefault();
    const id = document.getElementById('classe-id').value;
    const idclasse = document.getElementById('classe-idclasse').value.trim();
    const niveau = document.getElementById('classe-niveau').value.trim();

    // Validation : ID ne doit pas être un nombre négatif
    if (!isNaN(idclasse) && Number(idclasse) < 0) {
        showNotification('❌ L\'ID ne peut pas être négatif', 'error');
        return;
    }
    if (!idclasse || !niveau) {
        showNotification('❌ Tous les champs sont requis', 'error');
        return;
    }

    const data = { idclasse, niveau };
    try {
        let res, result;
        if (id) {
            res = await fetch(`${API_BASE_URL}/classes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            res = await fetch(`${API_BASE_URL}/classes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        result = await res.json();
        if (result.success) {
            showNotification(result.message || '✅ Opération réussie', 'success');
            closeModal('classeModal');
            resetClasseForm();
            await loadClasses();
            await loadDashboardStats();
            await loadSelectOptions();
        } else {
            showNotification(result.error || '❌ Erreur', 'error');
        }
    } catch (e) {
        showNotification('Erreur de connexion au serveur', 'error');
    }
}

async function supprimerClasse(id) {
    if (!confirm(`Supprimer la classe "${id}" ?`)) return;
    try {
        const res = await fetch(`${API_BASE_URL}/classes/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            showNotification(result.message || '✅ Supprimée', 'success');
            await loadClasses();
            await loadDashboardStats();
            await loadSelectOptions();
        } else {
            showNotification(result.error || '❌ Erreur', 'error');
        }
    } catch (e) {
        showNotification('Erreur de connexion', 'error');
    }
}

function openAddClasse() {
    resetClasseForm();
    openModal('classeModal');
}

function resetClasseForm() {
    document.getElementById('classe-id').value = '';
    document.getElementById('classe-idclasse').value = '';
    document.getElementById('classe-idclasse').disabled = false;
    document.getElementById('classe-niveau').value = '';
    document.getElementById('classeModalTitle').textContent = 'Ajouter une Classe';
}
