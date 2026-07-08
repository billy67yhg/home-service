import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const pesananRef = collection(db, "pesanan");
const tableBody = document.getElementById('pesananTableBody');
const modal = document.getElementById('pesananModal');
const form = document.getElementById('pesananForm');
const filterTabs = document.getElementById('filterTabs');
const searchInput = document.getElementById('searchInput');

let allData = [];
let currentFilter = 'all';
let searchQuery = '';

// FORMAT RUPIAH
function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

// LOAD DATA
async function loadPesanan() {
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-muted);">Memuat pesanan...</td></tr>';
    try {
        const q = query(pesananRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateFilterCounts();
        applyFilters();
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--danger);">Gagal memuat data.</td></tr>';
    }
}

// UPDATE FILTER COUNTS (Optional: hitung jumlah per status)
function updateFilterCounts() {
    const counts = { all: allData.length, Pending: 0, Aktif: 0, Selesai: 0, Batal: 0 };
    allData.forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++; });

    document.querySelectorAll('.filter-tab').forEach(tab => {
        const filter = tab.dataset.filter;
        const count = counts[filter] || 0;
        tab.textContent = filter === 'all' ? `Semua (${count})` : `${filter} (${count})`;
    });
}

// RENDER TABLE
function renderTable(data) {
    tableBody.innerHTML = '';
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px; color:var(--text-muted);">Tidak ada pesanan ditemukan</td></tr>';
        document.getElementById('paginationInfo').textContent = `Menampilkan 0 dari 0 pesanan`;
        return;
    }

    data.forEach(p => {
        const statusClass = `status-${p.status.toLowerCase()}`;
        const teknisiDisplay = p.teknisi || '<span style="color:var(--text-muted); font-style:italic;">Belum ditugaskan</span>';

        const row = `
        <tr>
            <td><span style="font-weight:600; color:var(--primary-dark);">#${p.id.substring(0, 8).toUpperCase()}</span></td>
            <td>${p.pelanggan}</td>
            <td>${teknisiDisplay}</td>
            <td>${p.layanan}</td>
            <td>${p.tanggal}</td>
            <td><span class="status-badge ${statusClass}">${p.status}</span></td>
            <td style="font-weight:600;">${formatRupiah(p.total)}</td>
            <td>
                <div style="display:flex; gap:6px;">
                    <div class="action-btn" onclick="viewDetail('${p.id}')" title="Detail"><i class="fas fa-eye"></i></div>
                    <div class="action-btn" onclick="editPesanan('${p.id}')" title="Edit"><i class="fas fa-pen"></i></div>
                </div>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    document.getElementById('paginationInfo').textContent = `Menampilkan 1-${data.length} dari ${allData.length} pesanan`;
}

// FILTER & SEARCH
function applyFilters() {
    let filtered = allData;
    if (currentFilter !== 'all') {
        filtered = filtered.filter(p => p.status === currentFilter);
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
            p.id.toLowerCase().includes(q) ||
            p.pelanggan.toLowerCase().includes(q) ||
            (p.teknisi && p.teknisi.toLowerCase().includes(q)) ||
            p.layanan.toLowerCase().includes(q)
        );
    }
    renderTable(filtered);
}

// MODAL & FORM
function openModal(title = 'Tambah Pesanan', data = null) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('pesananId').value = data ? data.id : '';
    document.getElementById('inputPelanggan').value = data ? data.pelanggan : '';
    document.getElementById('inputTeknisi').value = data ? data.teknisi || '' : '';
    document.getElementById('inputLayanan').value = data ? data.layanan : '';
    document.getElementById('inputTanggal').value = data ? data.tanggal : '';
    document.getElementById('inputTotal').value = data ? data.total : '';
    document.getElementById('inputStatus').value = data ? data.status : 'Pending';
    modal.style.display = 'flex';
}

function closeModal() { modal.style.display = 'none'; form.reset(); }

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('pesananId').value;
    const payload = {
        pelanggan: document.getElementById('inputPelanggan').value,
        teknisi: document.getElementById('inputTeknisi').value || null,
        layanan: document.getElementById('inputLayanan').value,
        tanggal: document.getElementById('inputTanggal').value,
        total: Number(document.getElementById('inputTotal').value),
        status: document.getElementById('inputStatus').value,
        updatedAt: new Date().toISOString()
    };

    try {
        if (id) {
            await updateDoc(doc(db, "pesanan", id), payload);
            alert('✅ Pesanan berhasil diperbarui!');
        } else {
            payload.createdAt = new Date().toISOString();
            await addDoc(pesananRef, payload);
            alert('✅ Pesanan baru berhasil ditambahkan!');
        }
        closeModal();
        loadPesanan();
    } catch (err) {
        console.error(err);
        alert('❌ Gagal menyimpan pesanan.');
    }
});

// GLOBAL ACTIONS
window.editPesanan = (id) => {
    const data = allData.find(p => p.id === id);
    if (data) openModal('Edit Pesanan', data);
};

window.viewDetail = (id) => {
    alert(`🔍 Detail Pesanan #${id.substring(0, 8).toUpperCase()}\n(Fitur detail lengkap bisa dikembangkan nanti)`);
};

// EVENT LISTENERS
document.getElementById('addPesananBtn').addEventListener('click', () => openModal());
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

document.getElementById('exportBtn').addEventListener('click', () => {
    alert('📥 Export ke CSV/Excel akan tersedia di versi berikutnya.');
});

// INIT
loadPesanan();