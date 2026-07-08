import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ========== REGISTER ==========
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nama = document.getElementById('nama').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validasi password
        if (password !== confirmPassword) {
            alert('Password tidak cocok!');
            return;
        }

        try {
            // Buat user di Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Simpan data user ke Firestore
            await setDoc(doc(db, "users", user.uid), {
                nama: nama,
                email: email,
                phone: phone,
                role: 'admin',
                createdAt: new Date().toISOString(),
                status: 'active'
            });

            alert('Registrasi berhasil! Silakan login.');
            window.location.href = 'login.html';

        } catch (error) {
            console.error('Error:', error);
            if (error.code === 'auth/email-already-in-use') {
                alert('Email sudah terdaftar!');
            } else if (error.code === 'auth/weak-password') {
                alert('Password terlalu lemah (minimal 6 karakter)');
            } else {
                alert('Registrasi gagal: ' + error.message);
            }
        }
    });
}

// ========== LOGIN ==========
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Redirect otomatis ditangani oleh navigation.js
        } catch (error) {
            console.error('Error:', error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                alert('Email atau password salah!');
            } else if (error.code === 'auth/invalid-email') {
                alert('Email tidak valid!');
            } else {
                alert('Login gagal: ' + error.message);
            }
        }
    });
}

// ========== CHECK AUTH STATE ==========
onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname.split('/').pop();
    const publicPages = ['login.html', 'register.html', ''];

    if (user && publicPages.includes(currentPage)) {
        window.location.href = 'dashboard.html';
    }
});