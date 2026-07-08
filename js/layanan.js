import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const layananRef = collection(db, "layanan");
const tableBody = document.getElementById('layananTableBody');
const modal = document.getElementById('layananModal');
const form = document.getElementById('layananForm');
const filterTabs = document.getElementById('filterTabs');
const searchInput = document.getElementById('searchInput');

let allData = [];
let currentFilter = 'all';
let searchQuery = '';

// 1. FORMAT RUPIAH
function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

// 2. LOAD DATA
async function loadLayanan() {
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Memuat...</td></tr>';
    try {
        const q = query(layananRef, orderBy('nama'));
        const snapshot = await getDocs(q);
        allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        applyFilters();
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--danger);">Gagal memuat data.</td></tr>';
    }
}

// 3. RENDER
function renderTable(data) {
    tableBody.innerHTML = '';
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px;">Data kosong</td></tr>';
        return;
    }

    data.forEach(l => {
        const statusClass = l.status === 'Aktif' ? 'status-aktif' : 'status-draft';
        const row = `
        <tr>
            <td>
                <div style="font-weight:600;">${l.nama}</div>
            </td>
            <td style="color:var(--text-muted);">${l.deskripsi}</td>
            <td style="font-weight:500;">${formatRupiah(l.hargaMin)} - ${formatRupiah(l.hargaMax)}</td>
            <td><span class="status-badge ${statusClass}">${l.status}</span></td>
            <td>
                <div class="action-btns">
                    <div class="action-btn edit" onclick="editLayanan('${l.id}')" title="Edit"><i class="fas fa-pen"></i></div>
                    <div class="action-btn delete" onclick="deleteLayanan('${l.id}')" title="Hapus"><i class="fas fa-trash"></i></div>
                </div>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

// 4. FILTER & SEARCH
function applyFilters() {
    let filtered = allData;
    if (currentFilter !== 'all') filtered = filtered.filter(l => l.status === currentFilter);
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(l => l.nama.toLowerCase().includes(q) || l.deskripsi.toLowerCase().includes(q));
    }
    renderTable(filtered);
}

// 5. MODAL & FORM
function openModal(title = 'Tambah Layanan', data = null) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('layananId').value = data ? data.id : '';
    document.getElementById('inputNama').value = data ? data.nama : '';
    document.getElementById('inputDesc').value = data ? data.deskripsi : '';
    document.getElementById('inputMin').value = data ? data.hargaMin : '';
    document.getElementById('inputMax').value = data ? data.hargaMax : '';
    document.getElementById('inputStatus').value = data ? data.status : 'Aktif';
    modal.style.display = 'flex';
}

function closeModal() { modal.style.display = 'none'; form.reset(); }

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('layananId').value;
    const payload = {
        nama: document.getElementById('inputNama').value,
        deskripsi: document.getElementById('inputDesc').value,
        hargaMin: Number(document.getElementById('inputMin').value),
        hargaMax: Number(document.getElementById('inputMax').value),
        status: document.getElementById('inputStatus').value
    };

    try {
        if (id) {
            await updateDoc(doc(db, "layanan", id), payload);
            alert('✅ Layanan berhasil diperbarui!');
        } else {
            await addDoc(layananRef, payload);
            alert('✅ Layanan baru ditambahkan!');
        }
        closeModal();
        loadLayanan();
    } catch (err) {
        console.error(err);
        alert('❌ Gagal menyimpan.');
    }
});

// GLOBAL ACTIONS
window.editLayanan = (id) => {
    const data = allData.find(l => l.id === id);
    if (data) openModal('Edit Layanan', data);
};

window.deleteLayanan = async (id) => {
    if (!confirm('Yakin hapus layanan ini?')) return;
    try {
        await deleteDoc(doc(db, "layanan", id));
        loadLayanan();
    } catch (err) { console.error(err); }
};

// EVENT LISTENERS
document.getElementById('addLayananBtn').addEventListener('click', () => openModal());
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
loadLayanan();