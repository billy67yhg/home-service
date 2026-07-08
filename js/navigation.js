import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Highlight menu aktif
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) link.classList.add('active');
        else link.classList.remove('active');
    });

    // 2. Auth Guard (Cek login)
    onAuthStateChanged(auth, (user) => {
        const publicPages = ['login.html', 'register.html'];
        const isPublic = publicPages.includes(currentPage);

        if (!user && !isPublic) {
            window.location.href = 'login.html';
        }
        if (user && isPublic) {
            window.location.href = 'dashboard.html';
        }
    });

    // 3. Tombol Logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await auth.signOut();
            window.location.href = 'login.html';
        });
    }
});