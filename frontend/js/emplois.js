// ============================================
// EMPLOIS DU TEMPS - CRUD + gestion durée salle
// ============================================

async function loadEmplois() {
    const tbody = document.getElementById('emplois-table-body');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-400">Chargement...</td></tr>';
    try {
        const emplois = await getEmplois();
        if (!emplois || !emplois.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">Aucun cours programmé</td></tr>';
            return;
        }
        tbody.innerHTML = emplois.map(e => {
            const debut = new Date(e.date);
            const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
            const jourStr = jours[debut.getDay()];
            const dateStr = debut.toLocaleDateString('fr-FR');
            const heureDebut = debut.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
            let heureFin = '';
            if (e.duree) {
                const fin = new Date(debut.getTime() + parseFloat(e.duree) * 3600000);
                heureFin = fin.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
            }
            return `
            <tr class="hover:bg-gray-50">
                <td class="px-3 py-3 text-sm font-semibold text-indigo-700">${jourStr}<br><span class="text-xs font-normal text-gray-500">${dateStr}</span></td>
                <td class="px-3 py-3 text-sm text-gray-700">
                    <span class="font-medium text-green-700">${heureDebut}</span>
                    ${heureFin ? `<span class="text-gray-400 mx-1">→</span><span class="font-medium text-red-600">${heureFin}</span>` : ''}
                </td>
                <td class="px-3 py-3 text-sm font-semibold text-gray-800">${e.cours}</td>
                <td class="px-3 py-3 text-sm text-gray-700">${e.prof_nom || ''} ${e.prof_prenoms || ''}</td>
                <td class="px-3 py-3 text-sm text-gray-700">${e.classe_niveau || e.idclasse}</td>
                <td class="px-3 py-3 text-sm text-gray-700">${e.salle_design || e.idsalle}</td>
                <td class="px-3 py-3">
                    <button onclick="editEmploi(${e.id})" class="text-purple-600 hover:text-purple-900 mr-2"><i class="fas fa-edit"></i></button>
                    <button onclick="supprimerEmploi(${e.id})" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-red-500">Erreur de chargement</td></tr>';
    }
}

async function loadSelectOptions() {
    try {
        const [profs, salles, classes] = await Promise.all([getProfesseurs(), getSalles(), getClasses()]);

        const selSalle = document.getElementById('emploi-salle');
        const selProf  = document.getElementById('emploi-professeur');
        const selCls   = document.getElementById('emploi-classe-select');

        if (selSalle) selSalle.innerHTML = '<option value="">Sélectionner une salle</option>' +
            salles.map(s => `<option value="${s.idsalle}">${s.idsalle} – ${s.design}</option>`).join('');
        if (selProf)  selProf.innerHTML  = '<option value="">Sélectionner un professeur</option>' +
            profs.map(p => `<option value="${p.idprof}">${p.Nom} ${p['Prénoms']}</option>`).join('');
        if (selCls)   selCls.innerHTML   = '<option value="">Sélectionner une classe</option>' +
            classes.map(c => `<option value="${c.idclasse}">${c.idclasse} – ${c.niveau}</option>`).join('');

        const selEdt = document.getElementById('edt-classe-select');
        if (selEdt) selEdt.innerHTML = '<option value="">Sélectionner</option>' +
            classes.map(c => `<option value="${c.idclasse}">${c.idclasse} – ${c.niveau}</option>`).join('');
    } catch (e) {
        console.error('Erreur options:', e);
    }
}

async function editEmploi(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/emplois/${id}`);
        const e = await res.json();
        document.getElementById('emploi-id').value = e.id;
        document.getElementById('emploi-salle').value = e.idsalle;
        document.getElementById('emploi-professeur').value = e.idprof;
        document.getElementById('emploi-classe-select').value = e.idclasse;
        document.getElementById('emploi-cours').value = e.cours;
        document.getElementById('emploi-duree').value = e.duree || '1';
        const d = new Date(e.date);
        const pad = n => String(n).padStart(2,'0');
        document.getElementById('emploi-date').value =
            `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        document.getElementById('emploiModalTitle').textContent = 'Modifier le Cours';
        openModal('emploiModal');
    } catch (e) {
        showNotification('Erreur lors du chargement', 'error');
    }
}

async function saveEmploi(event) {
    event.preventDefault();
    const id    = document.getElementById('emploi-id').value;
    const duree = parseFloat(document.getElementById('emploi-duree').value) || 1;
    const dateRaw = document.getElementById('emploi-date').value;
    const data  = {
        idsalle  : document.getElementById('emploi-salle').value,
        idprof   : document.getElementById('emploi-professeur').value,
        idclasse : document.getElementById('emploi-classe-select').value,
        cours    : document.getElementById('emploi-cours').value.trim(),
        date     : dateRaw.replace('T',' ') + ':00',
        duree    : duree
    };

    // Règle : interdire la programmation d'un cours dans le passé (jour calendaire)
    const debutCal = new Date(data.date);
    debutCal.setHours(0, 0, 0, 0);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    if (isNaN(debutCal.getTime()) || debutCal < aujourdhui) {
        showNotification("❌ Impossible de programmer un cours dans le passé", 'error');
        return;
    }

    try {
        let res, result;
        if (id) {
            res = await fetch(`${API_BASE_URL}/emplois/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
        } else {
            res = await fetch(`${API_BASE_URL}/emplois`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
        }
        result = await res.json();
        if (result.success) {
            // Calcul heure de fin pour la notification
            const debut = new Date(data.date);
            const fin   = new Date(debut.getTime() + duree * 3600000);
            const finStr = fin.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
            showNotification(`${result.message} — Salle libre à partir de ${finStr}`, 'success');
            closeModal('emploiModal');
            resetEmploiForm();
            await loadEmplois();
            await loadDashboardStats();
            // Afficher automatiquement l'EDT de la classe concernée
            afficherEdtApresAjout(data.idclasse);
        } else {
            showNotification(result.error || '❌ Erreur', 'error');
        }
    } catch (e) {
        showNotification('Erreur de connexion au serveur', 'error');
    }
}

// Après ajout d'un cours : afficher l'EDT de la classe automatiquement
function afficherEdtApresAjout(idclasse) {
    const selEdt = document.getElementById('edt-classe-select');
    if (selEdt) selEdt.value = idclasse;
    showSection('emploi-classe');
    afficherEDTClasse();
}

async function supprimerEmploi(id) {
    if (!confirm('Supprimer ce cours ?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/emplois/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            showNotification(result.message || '✅ Supprimé', 'success');
            await loadEmplois();
            await loadDashboardStats();
        } else {
            showNotification(result.error || '❌ Erreur', 'error');
        }
    } catch (e) {
        showNotification('Erreur de connexion', 'error');
    }
}

function openAddEmploi() {
    resetEmploiForm();
    openModal('emploiModal');
}

function resetEmploiForm() {
    document.getElementById('emploi-id').value = '';
    document.getElementById('emploi-salle').value = '';
    document.getElementById('emploi-professeur').value = '';
    document.getElementById('emploi-classe-select').value = '';
    document.getElementById('emploi-cours').value = '';
    document.getElementById('emploi-date').value = '';
    document.getElementById('emploi-duree').value = '';
    document.getElementById('emploiModalTitle').textContent = 'Programmer un Cours';
}
