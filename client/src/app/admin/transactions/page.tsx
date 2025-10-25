"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { toast } from "react-hot-toast";
import { api, API_BASE } from "../../lib/api";

interface TransactionItem {
  id: number;
  totalPrice: number;
  status: string;
  paymentProof?: string | null;
  user: { id: number; name?: string | null; email: string };
  event: { id: number; title: string };
}

export default function AdminTransactionsPage() {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("transactions/pending");
      const data = res.data;
      setItems(data.transactions || []);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Gagal memuat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const updateStatus = async (id: number, status: "DONE" | "REJECTED") => {
    const actionText = status === "DONE" ? "Setujui" : "Tolak";
    if (!confirm(`${actionText} transaksi #${id}?`)) return;
    try {
      setActionLoadingId(id);
      await api.post(`transactions/${id}/admin-update`, { status });
      await fetchPending();
      toast.success(`Transaksi #${id} diperbarui menjadi ${status}`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Gagal memperbarui");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Transaksi Menunggu Konfirmasi</h1>
            <button
              onClick={fetchPending}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Muat Ulang
            </button>
          </div>

          <div className="p-6">
            {loading && (
              <div className="text-center py-8 text-gray-600">Memuat...</div>
            )}
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">{error}</div>
            )}
            {!loading && items.length === 0 && (
              <div className="text-center py-8 text-gray-600">Tidak ada transaksi menunggu konfirmasi.</div>
            )}
            {!loading && items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengguna</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bukti</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{t.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{t.user.name || t.user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{t.event.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(t.totalPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {t.paymentProof ? (
                            <a
                              href={`${API_BASE}${t.paymentProof}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-500"
                            >
                              <img
                                src={`${API_BASE}${t.paymentProof}`}
                                alt={`Proof ${t.id}`}
                                className="h-12 w-12 object-cover rounded border"
                              />
                              <span>Lihat</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">Tidak ada bukti</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              disabled={actionLoadingId === t.id}
                              onClick={() => updateStatus(t.id, "DONE")}
                              className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-500 disabled:opacity-50"
                            >
                              Setujui
                            </button>
                            <button
                              disabled={actionLoadingId === t.id}
                              onClick={() => updateStatus(t.id, "REJECTED")}
                              className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-500 disabled:opacity-50"
                            >
                              Tolak
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}