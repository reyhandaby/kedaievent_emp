'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../providers';
import { api } from '../../lib/api';

const eventSchema = z.object({
  title: z.string().min(3, { message: 'Judul minimal 3 karakter' }),
  description: z.string().min(10, { message: 'Deskripsi minimal 10 karakter' }),
  price: z.coerce.number().min(0, { message: 'Harga harus bernilai positif' }),
  startDate: z.string().refine(date => new Date(date) > new Date(), {
    message: 'Tanggal mulai harus di masa depan',
  }),
  endDate: z.string().refine(date => new Date(date) > new Date(), {
    message: 'Tanggal selesai harus di masa depan',
  }),
  availableSeats: z.coerce.number().int().positive({ message: 'Kursi tersedia harus bernilai positif' }),
  category: z.string().min(1, { message: 'Kategori wajib diisi' }),
  location: z.string().min(3, { message: 'Lokasi minimal 3 karakter' }),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function CreateEvent() {
  const router = useRouter();
  const { isAuthenticated, token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      startDate: '',
      endDate: '',
      availableSeats: 1,
      category: '',
      location: '',
    },
  });

  const onSubmit = async (data: any) => {
    if (!isAuthenticated) {
      toast.error('Anda harus login untuk membuat event');
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const payload = { ...data, organizerId: user?.id };
      console.log('Create Event payload:', payload);
      await api.post('events', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Event berhasil dibuat!');
      router.push('/events');
    } catch (error: any) {
      console.error('Create Event error:', error.response?.data || error.message);
      toast.error('Gagal membuat event: ' + (error.response?.data?.message || error.message || 'Kesalahan tidak diketahui'));
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Anda perlu login untuk membuat event</h1>
            <button
              onClick={() => router.push('/auth/login')}
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-500 transition-colors"
            >
              Ke Halaman Login
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Buat Event Baru</h3>
              <p className="mt-1 text-sm text-gray-600">
                Lengkapi detail untuk membuat event baru. Semua field wajib diisi.
              </p>
            </div>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 bg-white sm:p-6">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Event Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        {...register('title')}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                      )}
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        rows={4}
                        {...register('description')}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                      )}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">Harga (Rp)</label>
                      <input
                        type="number"
                        id="price"
                        {...register('price', { valueAsNumber: true })}
                        placeholder="Masukkan harga dalam Rupiah"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.price && (
                        <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                      )}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="availableSeats" className="block text-sm font-medium text-gray-700">
                        Available Seats
                      </label>
                      <input
                        type="number"
                        id="availableSeats"
                        min="1"
                        {...register('availableSeats')}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                      />
                      {errors.availableSeats && (
                        <p className="mt-1 text-sm text-red-600">{errors.availableSeats.message}</p>
                      )}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                        Start Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        id="startDate"
                        {...register('startDate')}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                      />
                      {errors.startDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                      )}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                        End Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        id="endDate"
                        {...register('endDate')}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                      />
                      {errors.endDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                      )}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        id="category"
                        {...register('category')}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select a category</option>
                        <option value="Conference">Konferensi</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Seminar">Seminar</option>
                        <option value="Concert">Konser</option>
                        <option value="Exhibition">Pameran</option>
                        <option value="Other">Lainnya</option>
                      </select>
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                      )}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        {...register('location')}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                      />
                      {errors.location && (
                        <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Membuat...' : 'Buat Event'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}