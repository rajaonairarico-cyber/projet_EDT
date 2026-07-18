// Gestion des sections
function showSection(sectionId) {
    // Cacher toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Afficher la section demandée
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('hidden');
    }
    
    // Mettre à jour l'URL sans recharger
    if (history.pushState) {
        history.pushState(null, '', `#${sectionId}`);
    }
}

// Gestion des modales
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

// Fermer les modales en cliquant à l'extérieur
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.add('hidden');
        event.target.style.display = 'none';
    }
});

// Gestion de la navigation avec le hash
function handleHash() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        showSection(hash);
    } else {
        showSection('dashboard');
    }
}

// Charger les données au démarrage
async function loadDashboardStats() {
    try {
        const [professeurs, salles, classes, emplois] = await Promise.all([
            getProfesseurs(),
            getSalles(),
            getClasses(),
            getEmplois()
        ]);
        
        document.getElementById('total-professeurs').textContent = professeurs.length || 0;
        document.getElementById('total-salles').textContent = salles.length || 0;
        document.getElementById('total-classes').textContent = classes.length || 0;
        document.getElementById('total-cours').textContent = emplois.length || 0;
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Gérer le hash de l'URL
    window.addEventListener('hashchange', handleHash);
    handleHash();
    
    // Charger les statistiques du dashboard
    loadDashboardStats();
    
    // Charger les données initiales
    loadProfesseurs();
    loadSalles();
    loadClasses();
    loadEmplois();
    loadSelectOptions();
});