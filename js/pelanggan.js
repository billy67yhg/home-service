import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const pelangganRef = collection(db, "pelanggan");
const tableBody = document.getElementById('pelangganTableBody');
const modal = document.getElementById('pelangganModal');
const form = document.getElementById('pelangganForm');
const filterTabs = document.getElementById('filterTabs');
const searchInput = document.getElementById('searchInput');

let allData = [];
let currentFilter = 'all';
let searchQuery = '';

// 1. FORMAT TANGGAL
function formatDate(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// 2. LOAD DATA
async function loadPelanggan() {
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-muted);">Memuat data...</td></tr>';
    try {
        const q = query(pelangganRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        applyFilters();
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--danger);">Gagal memuat data. Cek koneksi/firebase.</td></tr>';
    }
}

// 3. RENDER TABLE
function renderTable(data) {
    tableBody.innerHTML = '';
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">Data pelanggan kosong</td></tr>';
        return;
    }

    data.forEach(p => {
        const statusClass = p.status === 'Aktif' ? 'status-aktif' : 'status-nonaktif';
        const toggleClass = p.status === 'Aktif' ? 'toggle off' : 'toggle';
        const toggleIcon = p.status === 'Aktif' ? 'fa-ban' : 'fa-check';
        const toggleTitle = p.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan';

        const row = `
        <tr>
            <td><span style="font-weight:600; color:var(--text-muted);">#${p.id.substring(0, 8).toUpperCase()}</span></td>
            <td style="font-weight:500;">${p.nama}</td>
            <td>${p.email}</td>
            <td>${p.phone}</td>
            <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.alamat}</td>
            <td><span class="status-badge ${statusClass}">${p.status}</span></td>
            <td>
                <div class="action-btns">
                    <div class="action-btn edit" onclick="editPelanggan('${p.id}')" title="Edit"><i class="fas fa-pen"></i></div>
                    <div class="action-btn ${toggleClass}" onclick="toggleStatus('${p.id}', '${p.status}')" title="${toggleTitle}"><i class="fas ${toggleIcon}"></i></div>
                </div>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

// 4. FILTER & SEARCH
function applyFilters() {
    let filtered = allData;
    if (currentFilter !== 'all') filtered = filtered.filter(p => p.status === currentFilter);
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
            p.nama.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q) ||
            p.phone.includes(q) ||
            p.alamat.toLowerCase().includes(q)
        );
    }
    renderTable(filtered);
}

// 5. MODAL & FORM
function openModal(title = 'Tambah Pelanggan', data = null) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('pelangganId').value = data ? data.id : '';
    document.getElementById('inputNama').value = data ? data.nama : '';
    document.getElementById('inputEmail').value = data ? data.email : '';
    document.getElementById('inputPhone').value = data ? data.phone : '';
    document.getElementById('inputAlamat').value = data ? data.alamat : '';
    document.getElementById('inputStatus').value = data ? data.status : 'Aktif';
    modal.style.display = 'flex';
}

function closeModal() { modal.style.display = 'none'; form.reset(); }

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('pelangganId').value;
    const payload = {
        nama: document.getElementById('inputNama').value,
        email: document.getElementById('inputEmail').value,
        phone: document.getElementById('inputPhone').value,
        alamat: document.getElementById('inputAlamat').value,
        status: document.getElementById('inputStatus').value,
        updatedAt: new Date().toISOString()
    };

    try {
        if (id) {
            await updateDoc(doc(db, "pelanggan", id), payload);
            alert('✅ Data pelanggan berhasil diperbarui!');
        } else {
            payload.createdAt = new Date().toISOString();
            await addDoc(pelangganRef, payload);
            alert('✅ Pelanggan baru berhasil ditambahkan!');
        }
        closeModal();
        loadPelanggan();
    } catch (err) {
        console.error(err);
        alert('❌ Gagal menyimpan data.');
    }
});

// GLOBAL ACTIONS
window.editPelanggan = (id) => {
    const data = allData.find(p => p.id === id);
    if (data) openModal('Edit Pelanggan', data);
};

window.toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
    if (!confirm(`Ubah status menjadi ${newStatus}?`)) return;
    try {
        await updateDoc(doc(db, "pelanggan", id), { status: newStatus });
        loadPelanggan();
    } catch (err) { console.error(err); }
};

// EVENT LISTENERS
document.getElementById('addPelangganBtn').addEventListener('click', () => openModal());
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

searchInput.addEventListener('input', (e) => { searchQuery = e.target.value; applyFilters(); });

// INIT
loadPelanggan();