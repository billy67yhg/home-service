import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const transaksiRef = collection(db, "transaksi");
const tableBody = document.getElementById('transaksiTableBody');
const modal = document.getElementById('transaksiModal');
const form = document.getElementById('transaksiForm');
const filterTabs = document.getElementById('filterTabs');
const searchInput = document.getElementById('searchInput');

let allData = [];
let currentFilter = 'all';
let searchQuery = '';

// FORMAT RUPIAH
function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

// FORMAT TANGGAL
function formatDate(isoString) {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// LOAD DATA
async function loadTransaksi() {
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-muted);">Memuat data...</td></tr>';
    try {
        const q = query(transaksiRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        applyFilters();
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--danger);">Gagal memuat data.</td></tr>';
    }
}

// RENDER TABLE
function renderTable(data) {
    tableBody.innerHTML = '';
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">Data transaksi kosong</td></tr>';
        return;
    }

    data.forEach(t => {
        const statusClass = `status-${t.status.toLowerCase()}`;
        const row = `
        <tr>
            <td><span style="font-weight:600; color:var(--primary-dark);">#${t.id.substring(0, 8).toUpperCase()}</span></td>
            <td>${t.pelanggan}</td>
            <td>${t.layanan}</td>
            <td>${formatDate(t.tanggal)}</td>
            <td><span class="method-badge">${t.metode}</span></td>
            <td style="font-weight:600;">${formatRupiah(t.jumlah)}</td>
            <td><span class="status-badge ${statusClass}">${t.status}</span></td>
            <td>
                <div class="action-btns">
                    <div class="action-btn edit" onclick="editTransaksi('${t.id}')" title="Edit"><i class="fas fa-pen"></i></div>
                    <div class="action-btn delete" onclick="deleteTransaksi('${t.id}')" title="Hapus"><i class="fas fa-trash"></i></div>
                </div>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

// FILTER & SEARCH
function applyFilters() {
    let filtered = allData;
    if (currentFilter !== 'all') filtered = filtered.filter(t => t.status === currentFilter);
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(t =>
            t.id.toLowerCase().includes(q) ||
            t.pelanggan.toLowerCase().includes(q) ||
            t.layanan.toLowerCase().includes(q) ||
            t.metode.toLowerCase().includes(q)
        );
    }
    renderTable(filtered);
}

// MODAL & FORM
function openModal(title = 'Tambah Transaksi', data = null) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('transaksiId').value = data ? data.id : '';
    document.getElementById('inputPelanggan').value = data ? data.pelanggan : '';
    document.getElementById('inputLayanan').value = data ? data.layanan : '';
    document.getElementById('inputTanggal').value = data ? data.tanggal : '';
    document.getElementById('inputMetode').value = data ? data.metode : 'Transfer';
    document.getElementById('inputJumlah').value = data ? data.jumlah : '';
    document.getElementById('inputStatus').value = data ? data.status : 'Berhasil';
    modal.style.display = 'flex';
}

function closeModal() { modal.style.display = 'none'; form.reset(); }

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('transaksiId').value;
    const payload = {
        pelanggan: document.getElementById('inputPelanggan').value,
        layanan: document.getElementById('inputLayanan').value,
        tanggal: document.getElementById('inputTanggal').value,
        metode: document.getElementById('inputMetode').value,
        jumlah: Number(document.getElementById('inputJumlah').value),
        status: document.getElementById('inputStatus').value,
        updatedAt: new Date().toISOString()
    };

    try {
        if (id) {
            await updateDoc(doc(db, "transaksi", id), payload);
            alert('✅ Transaksi berhasil diperbarui!');
        } else {
            payload.createdAt = new Date().toISOString();
            await addDoc(transaksiRef, payload);
            alert('✅ Transaksi baru berhasil ditambahkan!');
        }
        closeModal();
        loadTransaksi();
    } catch (err) {
        console.error(err);
        alert('❌ Gagal menyimpan transaksi.');
    }
});

// GLOBAL ACTIONS
window.editTransaksi = (id) => {
    const data = allData.find(t => t.id === id);
    if (data) openModal('Edit Transaksi', data);
};

window.deleteTransaksi = async (id) => {
    if (!confirm('Yakin hapus transaksi ini? Data tidak bisa dikembalikan.')) return;
    try {
        await deleteDoc(doc(db, "transaksi", id));
        loadTransaksi();
    } catch (err) { console.error(err); }
};

// EVENT LISTENERS
document.getElementById('addTransaksiBtn').addEventListener('click', () => openModal());
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
loadTransaksi();