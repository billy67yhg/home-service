import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const teknisiRef = collection(db, "teknisi");
const tableBody = document.getElementById('teknisiTableBody');
const modal = document.getElementById('teknisiModal');
const form = document.getElementById('teknisiForm');
const filterTabs = document.getElementById('filterTabs');
const searchInput = document.getElementById('searchInput');

let allData = [];
let currentFilter = 'all';
let searchQuery = '';

// 1. LOAD DATA
async function loadTeknisi() {
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-muted);">Memuat data...</td></tr>';
    try {
        const q = query(teknisiRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        applyFilters();
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--danger);">Gagal memuat data. Cek koneksi/firebase.</td></tr>';
    }
}

// 2. RENDER TABLE
function renderTable(data) {
    tableBody.innerHTML = '';
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">Tidak ada data teknisi</td></tr>';
        document.getElementById('paginationInfo').textContent = `Menampilkan 0 dari 0 teknisi`;
        return;
    }

    data.forEach(t => {
        const initials = t.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const statusClass = t.status === 'Aktif' ? 'status-aktif' : t.status === 'Nonaktif' ? 'status-nonaktif' : 'status-pending';
        const toggleIcon = t.status === 'Aktif' ? 'fa-ban' : 'fa-check';
        const toggleTitle = t.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan';
        const toggleClass = t.status === 'Aktif' ? 'delete' : 'activate';

        const row = `
        <tr>
            <td>
                <div class="tech-cell">
                    <div class="tech-avatar" style="background:${getAvatarColor(t.nama)}; color:${getTextColor(t.nama)};">${initials}</div>
                    <div>
                        <div class="tech-name">${t.nama}</div>
                        <div class="tech-id">ID: ${t.id.substring(0, 8)}...</div>
                    </div>
                </div>
            </td>
            <td>
                <div class="contact-text">${t.phone}</div>
                <div class="contact-email">${t.email}</div>
            </td>
            <td>${t.layanan}</td>
            <td style="font-weight:600;">${t.orderCount || 0}</td>
            <td><span class="rating">${t.rating || 0} <i class="fas fa-star" style="font-size:0.7em;"></i></span></td>
            <td><span class="status-badge ${statusClass}">${t.status}</span></td>
            <td>
                <div class="action-btns">
                    <div class="action-btn view" onclick="viewDetail('${t.id}')" title="Detail"><i class="fas fa-eye"></i></div>
                    <div class="action-btn edit" onclick="editTeknisi('${t.id}')" title="Edit"><i class="fas fa-pen"></i></div>
                    <div class="action-btn ${toggleClass}" onclick="toggleStatus('${t.id}', '${t.status}')" title="${toggleTitle}"><i class="fas ${toggleIcon}"></i></div>
                </div>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    document.getElementById('paginationInfo').textContent = `Menampilkan 1-${data.length} dari ${allData.length} teknisi`;
}

// 3. FILTER & SEARCH
function applyFilters() {
    let filtered = allData;
    if (currentFilter !== 'all') {
        filtered = filtered.filter(t => t.status === currentFilter);
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(t =>
            t.nama.toLowerCase().includes(q) ||
            t.phone.includes(q) ||
            t.layanan.toLowerCase().includes(q)
        );
    }
    renderTable(filtered);
}

// 4. MODAL & FORM HANDLING
function openModal(title = 'Tambah Teknisi', data = null) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('teknisiId').value = data ? data.id : '';
    document.getElementById('inputNama').value = data ? data.nama : '';
    document.getElementById('inputPhone').value = data ? data.phone : '';
    document.getElementById('inputEmail').value = data ? data.email : '';
    document.getElementById('inputLayanan').value = data ? data.layanan : '';
    document.getElementById('inputStatus').value = data ? data.status : 'Aktif';
    modal.style.display = 'flex';
}

function closeModal() { modal.style.display = 'none'; form.reset(); }

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('teknisiId').value;
    const payload = {
        nama: document.getElementById('inputNama').value,
        phone: document.getElementById('inputPhone').value,
        email: document.getElementById('inputEmail').value,
        layanan: document.getElementById('inputLayanan').value,
        status: document.getElementById('inputStatus').value,
        updatedAt: new Date().toISOString()
    };

    try {
        if (id) {
            await updateDoc(doc(db, "teknisi", id), payload);
            alert('✅ Data teknisi berhasil diperbarui!');
        } else {
            payload.createdAt = new Date().toISOString();
            payload.orderCount = 0;
            payload.rating = 0;
            await addDoc(teknisiRef, payload);
            alert('✅ Teknisi baru berhasil ditambahkan!');
        }
        closeModal();
        loadTeknisi();
    } catch (err) {
        console.error(err);
        alert('❌ Gagal menyimpan data. Cek console.');
    }
});

// 5. ACTIONS (Global Scope)
window.editTeknisi = async (id) => {
    const data = allData.find(t => t.id === id);
    if (data) openModal('Edit Teknisi', data);
};

window.toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
    if (!confirm(`Ubah status menjadi ${newStatus}?`)) return;
    try {
        await updateDoc(doc(db, "teknisi", id), { status: newStatus });
        loadTeknisi();
    } catch (err) { console.error(err); }
};

window.viewDetail = (id) => {
    // Nanti link ke detail-teknisi.html?id=xxx
    alert(`🔍 Buka detail teknisi ID: ${id}`);
};

// 6. EVENT LISTENERS
document.getElementById('addTeknisiBtn').addEventListener('click', () => openModal());
document.querySelector('.close-modal').addEventListener('click', closeModal);
window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

filterTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-tab')) {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        applyFilters();
    }
});

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    applyFilters();
});

// HELPERS
function getAvatarColor(name) {
    const colors = ['#DBEAFE', '#FEF3C7', '#D1FAE5', '#FCE7F3', '#E0E7FF'];
    return colors[name.length % colors.length];
}
function getTextColor(name) {
    const colors = ['#1E40AF', '#92400E', '#065F46', '#9D174D', '#3730A3'];
    return colors[name.length % colors.length];
}

// INIT
loadTeknisi();