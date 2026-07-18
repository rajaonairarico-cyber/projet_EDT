// ============================================
// EDT PAR CLASSE - tableau visuel + PDF
// ============================================

const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const JOURS_IDX = [1,2,3,4,5,6]; // getDay() : 1=lun ... 6=sam
const COULEURS = [
    'bg-indigo-100 border-indigo-400 text-indigo-900',
    'bg-green-100 border-green-400 text-green-900',
    'bg-purple-100 border-purple-400 text-purple-900',
    'bg-yellow-100 border-yellow-400 text-yellow-900',
    'bg-pink-100 border-pink-400 text-pink-900',
    'bg-teal-100 border-teal-400 text-teal-900',
    'bg-orange-100 border-orange-400 text-orange-900',
    'bg-blue-100 border-blue-400 text-blue-900',
];
let coursColorMap = {};
let coursColorIdx = 0;

function getCouleurCours(cours) {
    if (!coursColorMap[cours]) {
        coursColorMap[cours] = COULEURS[coursColorIdx % COULEURS.length];
        coursColorIdx++;
    }
    return coursColorMap[cours];
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart)/86400000)+1)/7);
}

async function afficherEDTClasse() {
    const idclasse = document.getElementById('edt-classe-select').value;
    const semaine  = document.getElementById('edt-semaine').value;
    const result   = document.getElementById('edt-classe-result');

    if (!idclasse) {
        showNotification('Veuillez sélectionner une classe', 'warning');
        return;
    }

    result.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i><p class="mt-2">Chargement...</p></div>';

    try {
        const res = await fetch(`${API_BASE_URL}/emploi-classe?id=${idclasse}`);
        let emplois = await res.json();

        if (!emplois || emplois.error) {
            result.innerHTML = '<p class="text-center text-red-500 py-4">Erreur de chargement</p>';
            return;
        }

        // Filtrer par semaine si choisie
        if (semaine) {
            const [annee, sem] = semaine.split('-W');
            emplois = emplois.filter(e => {
                const d = new Date(e.date);
                return d.getFullYear() == annee && getWeekNumber(d) == sem;
            });
        }

        if (!emplois.length) {
            result.innerHTML = '<p class="text-center text-gray-400 py-8">Aucun cours pour cette sélection</p>';
            return;
        }

        // Trouver le nom de la classe
        const selEl = document.getElementById('edt-classe-select');
        const nomClasse = selEl.options[selEl.selectedIndex]?.text || idclasse;

        // Trouver les heures présentes
        const heuresSet = new Set();
        emplois.forEach(e => {
            const h = new Date(e.date).getHours();
            heuresSet.add(h);
        });
        const heures = Array.from(heuresSet).sort((a,b)=>a-b);

        // Indexer emplois par jourIdx + heure
        const grid = {};
        emplois.forEach(e => {
            const d = new Date(e.date);
            const jourIdx = d.getDay(); // 1=lun...6=sam
            const h = d.getHours();
            if (!grid[h]) grid[h] = {};
            grid[h][jourIdx] = e;
        });

        // Reset couleurs
        coursColorMap = {};
        coursColorIdx = 0;

        // ---- CONSTRUIRE LE TABLEAU ----
        const tableRows = heures.map(h => {
            const cells = JOURS_IDX.map(jIdx => {
                const e = grid[h] && grid[h][jIdx];
                if (!e) return `<td class="border border-gray-200 p-1 min-w-[110px] h-16"></td>`;
                const debut = new Date(e.date);
                const heureDebut = debut.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
                let heureFin = '';
                if (e.duree) {
                    const fin = new Date(debut.getTime() + parseFloat(e.duree)*3600000);
                    heureFin = fin.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
                }
                const couleur = getCouleurCours(e.cours);
                return `<td class="border border-gray-200 p-1 min-w-[110px]">
                    <div class="rounded-lg border-l-4 p-2 ${couleur} h-full">
                        <div class="font-bold text-sm leading-tight">${e.cours}</div>
                        <div class="text-xs mt-1 opacity-80"><i class="fas fa-user mr-1"></i>${e.prof_nom || ''} ${e.prof_prenoms || ''}</div>
                        <div class="text-xs opacity-70"><i class="fas fa-clock mr-1"></i>${heureDebut}${heureFin ? ' → '+heureFin : ''}</div>
                    </div>
                </td>`;
            }).join('');
            const pad = n => String(n).padStart(2,'0');
            return `<tr>
                <td class="border border-gray-200 px-3 py-2 text-sm font-semibold bg-gray-50 text-gray-700 whitespace-nowrap">${pad(h)}h00</td>
                ${cells}
            </tr>`;
        }).join('');

        result.innerHTML = `
        <div id="edt-print-zone">
            <div class="flex items-center justify-between mb-4 print:mb-2">
                <div>
                    <h2 class="text-xl font-bold text-gray-800">Emploi du temps — <span class="text-indigo-600">${nomClasse}</span></h2>
                    ${semaine ? `<p class="text-sm text-gray-500">Semaine ${semaine}</p>` : '<p class="text-sm text-gray-500">Tous les cours</p>'}
                </div>
                <span class="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">${emplois.length} cours</span>
            </div>

            <!-- Tableau grille -->
            <div class="overflow-x-auto mb-6">
                <table class="w-full border-collapse text-sm">
                    <thead>
                        <tr class="bg-indigo-600 text-white">
                            <th class="border border-indigo-500 px-3 py-2 text-left">Heure</th>
                            ${JOURS.map(j => `<th class="border border-indigo-500 px-3 py-2 min-w-[110px]">${j}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>

            <!-- Légende couleurs -->
            <div class="mb-6 flex flex-wrap gap-2">
                ${[...new Set(emplois.map(e=>e.cours))].map(cours => {
                    const c = getCouleurCours(cours);
                    return `<span class="px-3 py-1 rounded-full text-xs font-semibold border-l-4 ${c}">${cours}</span>`;
                }).join('')}
            </div>

            <!-- Liste détaillée -->
            <div class="overflow-x-auto">
                <h3 class="font-semibold text-gray-700 mb-3 text-base">Liste complète des cours</h3>
                <table class="w-full text-sm border-collapse">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="px-3 py-2 text-left border border-gray-200">Jour</th>
                            <th class="px-3 py-2 text-left border border-gray-200">Date</th>
                            <th class="px-3 py-2 text-left border border-gray-200">Début</th>
                            <th class="px-3 py-2 text-left border border-gray-200">Fin</th>
                            <th class="px-3 py-2 text-left border border-gray-200">Matière</th>
                            <th class="px-3 py-2 text-left border border-gray-200">Professeur</th>
                            <th class="px-3 py-2 text-left border border-gray-200">Salle</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${emplois.map(e => {
                            const jours = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
                            const d = new Date(e.date);
                            const heureDebut = d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
                            let heureFin = '-';
                            if (e.duree) {
                                const fin = new Date(d.getTime() + parseFloat(e.duree)*3600000);
                                heureFin = fin.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
                            }
                            const c = getCouleurCours(e.cours);
                            return `<tr class="hover:bg-gray-50">
                                <td class="px-3 py-2 border border-gray-200 font-medium">${jours[d.getDay()]}</td>
                                <td class="px-3 py-2 border border-gray-200">${d.toLocaleDateString('fr-FR')}</td>
                                <td class="px-3 py-2 border border-gray-200 text-green-700 font-semibold">${heureDebut}</td>
                                <td class="px-3 py-2 border border-gray-200 text-red-600 font-semibold">${heureFin}</td>
                                <td class="px-3 py-2 border border-gray-200"><span class="px-2 py-0.5 rounded text-xs font-bold border-l-2 ${c}">${e.cours}</span></td>
                                <td class="px-3 py-2 border border-gray-200">${e.prof_nom || ''} ${e.prof_prenoms || ''}</td>
                                <td class="px-3 py-2 border border-gray-200">${e.salle_design || e.idsalle}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    } catch (e) {
        result.innerHTML = '<p class="text-center text-red-500 py-4">Erreur de connexion au serveur</p>';
    }
}

async function genererPDF() {
    const idclasse = document.getElementById('edt-classe-select').value;
    if (!idclasse) { showNotification('Veuillez sélectionner une classe', 'warning'); return; }
    const zone = document.getElementById('edt-print-zone');
    if (!zone) { showNotification("Affichez d'abord l'emploi du temps", 'warning'); return; }

    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
        showNotification('Erreur : librairie PDF non chargée. Vérifiez votre connexion internet.', 'error');
        return;
    }

    showNotification('Génération du PDF en cours...', 'info');

    try {
        const selEl = document.getElementById('edt-classe-select');
        const nomClasse = (selEl.options[selEl.selectedIndex]?.text || idclasse).replace(/[^\w\s-]/g, '');

        const canvas = await html2canvas(zone, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;

        // Orientation paysage pour bien caser le tableau hebdomadaire
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = pageWidth - 20; // marges de 10mm de chaque côté
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let finalWidth = imgWidth;
        let finalHeight = imgHeight;
        if (finalHeight > pageHeight - 20) {
            finalHeight = pageHeight - 20;
            finalWidth = (canvas.width * finalHeight) / canvas.height;
        }

        const x = (pageWidth - finalWidth) / 2;
        const y = 10;

        pdf.setFontSize(14);
        pdf.text(`Emploi du temps - ${nomClasse}`, pageWidth / 2, 8, { align: 'center' });
        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

        pdf.save(`emploi_du_temps_${nomClasse.replace(/\s+/g, '_')}.pdf`);
        showNotification('✅ PDF téléchargé avec succès', 'success');
    } catch (e) {
        console.error(e);
        showNotification('Erreur lors de la génération du PDF', 'error');
    }
}
