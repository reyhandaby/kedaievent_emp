'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { useAuth } from '../providers';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { api } from '../lib/api';

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

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const { isAuthenticated } = useAuth();

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

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === '' || event.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(events.map(event => event.category))];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold mb-4 md:mb-0" style={{ color: 'var(--brand-text)' }}>Semua Event</h1>
          {isAuthenticated && (
            <Link 
              href="/events/create" 
              className="btn btn-primary"
            >
              Buat Event Baru
            </Link>
          )}
  
        </div>

        <div className="card mb-8">
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <label htmlFor="search" className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>
                Cari Event
              </label>
              <input
                type="text"
                id="search"
                placeholder="Cari berdasarkan judul, deskripsi, atau lokasi"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded-md focus-ring"
                style={{ borderColor: 'var(--brand-border)' }}
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1" style={{ color: '#334155' }}>
                Filter berdasarkan Kategori
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 border rounded-md focus-ring"
                style={{ borderColor: 'var(--brand-border)' }}
              >
                 <option value="">Semua Kategori</option>
                 {categories.map((category) => (
                   <option key={category} value={category}>
                     {category}
                   </option>
                 ))}
               </select>
             </div>
           </div>
         </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="card-title">{event.title}</h3>
                  <Badge>{event.category}</Badge>
                </div>
                
                <p className="card-subtitle mb-4 line-clamp-2">{event.description}</p>
                
                <div className="flex justify-between items-center text-sm mb-4" style={{ color: '#64748B' }}>
                  <div className="flex items-center">
                    <span>{new Date(event.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <span>{event.location}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-xl font-bold" style={{ color: 'var(--brand-text)' }}>
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(event.price)}
                  </p>
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
       </main>
     </div>
   );
 }