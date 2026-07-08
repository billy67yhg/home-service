import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ELEMENTS
const statPendapatan = document.getElementById('stat-pendapatan');
const statPesanan = document.getElementById('stat-pesanan');
const statTeknisi = document.getElementById('stat-teknisi');
const statPending = document.getElementById('stat-pending');
const recentOrdersBody = document.getElementById('recentOrdersBody');

// FORMAT RUPIAH
function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

// 1. LOAD STATISTIK
async function loadStats() {
    try {
        // Hitung Pendapatan (Transaksi Berhasil)
        let totalPendapatan = 0;
        const trxSnapshot = await getDocs(collection(db, "transaksi"));
        trxSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'Berhasil') totalPendapatan += (data.jumlah || 0);
        });
        statPendapatan.textContent = formatRupiah(totalPendapatan);

        // Hitung Total Teknisi
        const teknisiSnapshot = await getDocs(collection(db, "teknisi"));
        statTeknisi.textContent = teknisiSnapshot.size;

        // Hitung Total Pesanan
        const pesananSnapshot = await getDocs(collection(db, "pesanan"));
        statPesanan.textContent = pesananSnapshot.size;

        // Hitung Pesanan Pending
        let pendingCount = 0;
        pesananSnapshot.forEach(doc => {
            if (doc.data().status === 'Pending') pendingCount++;
        });
        statPending.textContent = pendingCount;

    } catch (err) {
        console.error("Error loading stats:", err);
    }
}

// 2. LOAD RECENT ORDERS (5 TERAKHIR)
async function loadRecentOrders() {
    try {
        const q = query(collection(db, "pesanan"), orderBy('createdAt', 'desc'), limit(5));
        const snapshot = await getDocs(q);

        recentOrdersBody.innerHTML = '';
        if (snapshot.empty) {
            recentOrdersBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada pesanan</td></tr>';
            return;
        }

        snapshot.forEach(doc => {
            const p = doc.data();
            const statusClass = p.status === 'Selesai' ? 'status-selesai' : p.status === 'Batal' ? 'status-batal' : p.status === 'Aktif' ? 'status-aktif' : 'status-pending';

            // Reuse class from style.css or define inline if missing
            const colorMap = {
                'Pending': '#FEF3C7',
                'Aktif': '#DBEAFE',
                'Selesai': '#D1FAE5',
                'Batal': '#FEE2E2'
            };

            recentOrdersBody.innerHTML += `
            <tr>
                <td style="font-weight:600;">#${doc.id.substring(0, 8).toUpperCase()}</td>
                <td>${p.pelanggan}</td>
                <td>${p.layanan}</td>
                <td><span style="padding:4px 8px; border-radius:12px; font-size:0.75rem; font-weight:500; background:${colorMap[p.status] || '#eee'};">${p.status}</span></td>
            </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

// INIT
loadStats();
loadRecentOrders();