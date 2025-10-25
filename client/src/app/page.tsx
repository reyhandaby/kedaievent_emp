'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from './components/Navbar';
import { useAuth } from './providers';
import Card from './components/ui/Card';
import Badge from './components/ui/Badge';
import { api } from './lib/api';

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

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await api.get('events');
        const events = response.data.events || [];
        setEvents(events);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat event');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      event.title.toLowerCase().includes(term) ||
      event.description.toLowerCase().includes(term) ||
      event.location.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="hero-gradient rounded-2xl p-10 text-center mb-10 border" style={{ borderColor: 'var(--brand-border)' }}>
          <h1 className="text-4xl font-extrabold mb-3" style={{ color: 'var(--brand-text)' }}>Selamat datang di KedaiEvent</h1>
          <p className="text-lg mx-auto max-w-2xl" style={{ color: '#64748B' }}>
            Temukan dan ikuti beragam event, atau buat event kamu sendiri!
          </p>
          {isAuthenticated && (
            <Link 
              href="/events/create" 
              className="mt-6 inline-block btn btn-primary"
            >
              Buat Event
            </Link>
          )}
        </div>

        <div className="card mb-8">
          <div className="card-body">
            <label htmlFor="home-search" className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>
              Cari Event
            </label>
            <input
              id="home-search"
              type="text"
              placeholder="Cari berdasarkan judul, deskripsi, atau lokasi"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded-md focus-ring"
              style={{ borderColor: 'var(--brand-border)' }}
            />
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--brand-text)' }}>Event Pilihan</h2>
          {loading ? (
            <div className="text-center py-12">Memuat event...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">Tidak ada event yang cocok dengan pencarian.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <Card key={event.id}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="card-title">{event.title}</h3>
                    <Badge>{event.category}</Badge>
                  </div>
                  <p className="card-subtitle mb-4 line-clamp-2">{event.description}</p>
                  <div className="flex justify-between items-center text-sm mb-4" style={{ color: '#64748B' }}>
                    <span>{new Date(event.startDate).toLocaleDateString()}</span>
                    <span>{event.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(event.price)}
                    </span>
                    <Link 
                      href={`/events/${event.id}`}
                      className="btn btn-primary"
                    >
                      Lihat Detail
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}