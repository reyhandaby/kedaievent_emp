'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../providers';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

type Event = {
  id: number;
  title: string;
  description: string;
  price: number;
  startDate: string;
  endDate: string;
  availableSeats: number;
  category: string;
  location: string;
  organizerId: number;
  createdAt: string;
  organizer?: {
    name: string;
  };
};

export default function EventDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user, token } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pointsToUse, setPointsToUse] = useState<number>(0);
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [transaction, setTransaction] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [paymentProof, setPaymentProof] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  // Tambahan: state untuk review & rating
  const [reviews, setReviews] = useState<Array<{ id: number; rating: number; comment: string; user?: { name: string }; userId: number; eventId: number }>>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`events/${id}`);
        setEvent(response.data.event || response.data);
      } catch (err: any) {
        setError('Failed to fetch event: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);
  // Tambahan: ambil list review untuk event
  useEffect(() => {
    if (!id) return;
    const fetchReviews = async () => {
      try {
        const res = await api.get(`reviews/event/${id}`);
        const list = res.data.reviews || [];
        setReviews(list);
        const avg = list.length ? (list.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / list.length) : 0;
        setAvgRating(avg);
      } catch (err: any) {
        console.error('Failed to fetch reviews:', err.response?.data || err.message);
      }
    };
    fetchReviews();
  }, [id]);

  // Countdown timer for transaction expiration
  useEffect(() => {
    if (!transaction?.expiresAt) return;
    const interval = setInterval(() => {
      const expires = new Date(transaction.expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, expires - now);
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [transaction?.expiresAt]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.error('Silakan login untuk mendaftar event ini');
      router.push('/auth/login');
      return;
    }

    if (!user?.id) {
      toast.error('User ID tidak ditemukan. Silakan login ulang.');
      return;
    }

    try {
      const safePoints = Math.max(0, Math.min(pointsToUse || 0, user.points));
      const payload = { userId: user.id, pointsToUse: safePoints, voucherCode: voucherCode || undefined };
      console.log('Register Event payload:', payload);
      const res = await api.post(`events/${id}/register`, payload, { headers: { Authorization: `Bearer ${token}` } });
      const txn = res.data.transaction;
      setTransaction(txn);
      toast.success('Berhasil mendaftar! Harap unggah bukti bayar sebelum waktu habis.');
    } catch (err: any) {
      console.error('Register Event error:', err.response?.data || err.message);
      toast.error('Gagal mendaftar: ' + (err.response?.data?.message || err.message || 'Kesalahan tidak diketahui'));
    }
  };

  const handleUploadProof = async () => {
    if (!transaction?.id) {
      toast.error('Transaksi tidak ditemukan. Silakan daftar terlebih dahulu.');
      return;
    }
    try {
      const form = new FormData();
      if (!selectedFile) {
        toast.error('Silakan pilih foto bukti bayar terlebih dahulu.');
        return;
      }
      // Validate size <= 2MB
      const maxSize = 2 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        toast.error('Ukuran file terlalu besar. Maksimal 2MB.');
        return;
      }
      form.append('file', selectedFile);

      const res = await api.post(`transactions/${transaction.id}/payment-proof`, form, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      setTransaction(res.data.transaction);
      toast.success('Payment proof uploaded. Awaiting admin confirmation.');
    } catch (err: any) {
      console.error('Upload Proof error:', err.response?.data || err.message);
      toast.error('Failed to upload: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast.error('Silakan login untuk menulis review');
      router.push('/auth/login');
      return;
    }
    if (!user?.id) {
      toast.error('User ID tidak ditemukan');
      return;
    }
    if (!event?.id) {
      toast.error('Event ID tidak ditemukan');
      return;
    }
    const ratingVal = Math.max(1, Math.min(5, newRating || 0));
    if (!newComment.trim()) {
      toast.error('Komentar tidak boleh kosong');
      return;
    }
    try {
      setSubmittingReview(true);
      const payload = { rating: ratingVal, comment: newComment.trim(), userId: user.id, eventId: event.id };
      await api.post('reviews', payload, { headers: { Authorization: `Bearer ${token || ''}` } });
      toast.success('Review berhasil dikirim');
      const refreshed = await api.get(`reviews/event/${id}`);
        const list = refreshed.data.reviews || [];
      setReviews(list);
      const avg = list.length ? (list.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / list.length) : 0;
      setAvgRating(avg);
      setNewRating(5);
      setNewComment('');
    } catch (err: any) {
      console.error('Submit review error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Gagal mengirim review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">Memuat detail event...</div>
        </main>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12 text-red-600">
            {error || 'Event tidak ditemukan'}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card title={event.title} subtitle={`Diselenggarakan oleh ${event.organizer?.name || 'Tidak diketahui'}`}>
              <div className="flex items-center justify-between mb-4">
                <Badge>{event.category}</Badge>
              </div>
              <h3 className="card-title">Deskripsi</h3>
              <p className="card-subtitle whitespace-pre-line">{event.description}</p>
              <div className="mt-6">
                <h3 className="card-title">Detail Event</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h4 className="text-sm" style={{ color: '#64748B' }}>Kategori</h4>
                    <p className="mt-1" style={{ color: 'var(--brand-text)' }}>{event.category}</p>
                  </div>
                  <div>
                    <h4 className="text-sm" style={{ color: '#64748B' }}>Lokasi</h4>
                    <p className="mt-1" style={{ color: 'var(--brand-text)' }}>{event.location}</p>
                  </div>
                  <div>
                    <h4 className="text-sm" style={{ color: '#64748B' }}>Tanggal Mulai</h4>
                    <p className="mt-1" style={{ color: 'var(--brand-text)' }}>{new Date(event.startDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm" style={{ color: '#64748B' }}>Tanggal Selesai</h4>
                    <p className="mt-1" style={{ color: 'var(--brand-text)' }}>{new Date(event.endDate).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Ulasan & Rating">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className={i <= Math.round(avgRating) ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                  ))}
                </div>
                <span style={{ color: 'var(--brand-text)' }}>{avgRating ? avgRating.toFixed(1) : 'Belum ada rating'}</span>
                <span style={{ color: '#64748B' }}>{reviews.length} ulasan</span>
              </div>

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p style={{ color: '#64748B' }}>Belum ada ulasan untuk event ini.</p>
                ) : (
                  reviews.map(r => (
                    <div key={r.id} className="border rounded-md p-3" style={{ borderColor: 'var(--brand-border)' }}>
                      <div className="flex items-center justify-between">
                        <div className="font-medium" style={{ color: 'var(--brand-text)' }}>{r.user?.name || 'User'}</div>
                        <div className="text-sm">
                          {[1,2,3,4,5].map(i => (
                            <span key={i} className={i <= r.rating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="mt-2 whitespace-pre-line" style={{ color: 'var(--brand-text)' }}>{r.comment}</p>
                    </div>
                  ))
                )}
              </div>

              {isAuthenticated && (
                <div className="mt-6 border-t pt-4" style={{ borderColor: 'var(--brand-border)' }}>
                  <h4 className="text-md font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Tulis Review</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-sm" style={{ color: '#64748B' }}>Rating:</label>
                    <select value={newRating} onChange={(e) => setNewRating(Number(e.target.value))} className="p-2 border rounded-md focus-ring" style={{ borderColor: 'var(--brand-border)' }}>
                      {[1,2,3,4,5].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <div className="ml-2">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} className={i <= newRating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    placeholder="Tulis pengalamanmu..."
                    className="w-full p-2 border rounded-md focus-ring"
                    style={{ borderColor: 'var(--brand-border)' }}
                  />
                  <Button onClick={handleSubmitReview} loading={submittingReview} className="mt-3">{submittingReview ? 'Mengirim...' : 'Kirim Review'}</Button>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Informasi & Pendaftaran">
              <div className="mb-4">
                <h3 className="card-subtitle">Harga</h3>
                <p className="text-2xl font-bold" style={{ color: 'var(--brand-text)' }}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(event.price)}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="card-subtitle">Kursi Tersedia</h3>
                <p style={{ color: '#64748B' }}>{event.availableSeats}</p>
              </div>
              
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Gunakan Poin</label>
                  <input
                    type="number"
                    min={0}
                    max={user?.points || 0}
                    value={pointsToUse}
                    onChange={(e) => setPointsToUse(Number(e.target.value))}
                    className="w-full p-2 border rounded-md focus-ring"
                    style={{ borderColor: 'var(--brand-border)' }}
                    placeholder={`Tersedia: ${user?.points || 0} poin`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Kode Voucher</label>
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="w-full p-2 border rounded-md focus-ring"
                    style={{ borderColor: 'var(--brand-border)' }}
                    placeholder="Masukkan kode voucher (opsional)"
                  />
                </div>
                <div className="text-sm" style={{ color: '#64748B' }}>
                  Perkiraan Total (hanya poin): {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Math.max(0, (event.price || 0) - (pointsToUse || 0)))}
                  <br />
                  Diskon voucher akan divalidasi saat pendaftaran.
                </div>
              </div>

              <Button onClick={handleRegister} className="w-full">Daftar Event</Button>

              {transaction ? (
                <Card title="Transaksi Anda" className="mt-6" hover={false}>
                  <p className="text-sm" style={{ color: 'var(--brand-text)' }}>Total: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(transaction.totalPrice)}</p>
                  <p className="text-sm" style={{ color: 'var(--brand-text)' }}>Status: {transaction.status}</p>
                  <p className="text-sm" style={{ color: '#ef4444' }}>Pembayaran kedaluwarsa dalam: {countdown}</p>

                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>Unggah Bukti Pembayaran</label>
                    <input
                      id="payment-proof-file"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (!file) {
                          setSelectedFile(null);
                          setPreviewUrl('');
                          return;
                        }
                        if (!file.type.startsWith('image/')) {
                          toast.error('Hanya file gambar yang diperbolehkan.');
                          e.currentTarget.value = '';
                          return;
                        }
                        const maxSize = 2 * 1024 * 1024;
                        if (file.size > maxSize) {
                          toast.error('Ukuran file terlalu besar. Maksimal 2MB.');
                          e.currentTarget.value = '';
                          return;
                        }
                        setSelectedFile(file);
                        setPreviewUrl(URL.createObjectURL(file));
                      }}
                      className="w-full p-2 border rounded-md focus-ring"
                      style={{ borderColor: 'var(--brand-border)' }}
                    />
                    {previewUrl && (
                      <div className="mt-3">
                        <p className="text-xs" style={{ color: '#64748B' }}>Pratinjau:</p>
                        <img src={previewUrl} alt="Payment Proof Preview" className="mt-1 max-h-48 rounded border" style={{ borderColor: 'var(--brand-border)' }} />
                      </div>
                    )}
                    <p className="mt-2 text-xs" style={{ color: '#64748B' }}>Format: gambar JPG/PNG. Maksimal ukuran 2MB.</p>
                    <Button onClick={handleUploadProof} className="mt-2 w-full">Kirim Bukti Pembayaran</Button>
                  </div>
                </Card>
              ) : null}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}