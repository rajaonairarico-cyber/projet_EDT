// ============================================
// CONNEXION - page de login (rajaonaira / bakay@@2005)
// ============================================

const LOGIN_USER = 'rajaonaira';
const LOGIN_PASS = 'bakay@@2005';
const AUTH_KEY = 'edt_auth';

function verifierLogin(event) {
    event.preventDefault();
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value;
    const err = document.getElementById('login-error');

    if (user === LOGIN_USER && pass === LOGIN_PASS) {
        sessionStorage.setItem(AUTH_KEY, '1');
        document.getElementById('loginOverlay').style.display = 'none';
        err.style.display = 'none';
        showNotification('✅ Connexion réussie ! Bienvenue ' + user, 'success');
    } else {
        err.textContent = '❌ Identifiants incorrects';
        err.style.display = 'block';
    }
}

function deconnexion() {
    sessionStorage.removeItem(AUTH_KEY);
    document.getElementById('loginOverlay').style.display = 'flex';
}

(function () {
    if (sessionStorage.getItem(AUTH_KEY) === '1') {
        document.getElementById('loginOverlay').style.display = 'none';
    }
})();