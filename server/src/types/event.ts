export interface CreateEventRequest {
  title: string;
  description: string;
  price: number;
  startDate: string | Date;
  endDate: string | Date;
  availableSeats: number;
  category: string;
  location: string;
  organizerId: number;
}

export interface EventResponse {
  id: number;
  title: string;
  description: string;
  price: number;
  startDate: Date;
  endDate: Date;
  availableSeats: number;
  category: string;
  location: string;
  organizerId: number;
  createdAt: Date;
  organizer?: any;
  // Add isActive to align with Prisma schema and controller logic
  isActive: boolean;
}

export interface EventsResponse extends Array<EventResponse> {}

export interface TransactionResponse {
  id: number;
  userId: number;
  eventId: number;
  totalPrice: number;
  pointsUsed: number;
  voucherId: number | null;
  status: string;
  expiresAt: Date;
  adminDeadlineAt: Date;
  paymentProof?: string | null;
  createdAt?: Date;
}

export interface EventApiResponse {
  message?: string;
  event?: EventResponse;
  events?: EventsResponse;
  transaction?: TransactionResponse;
  error?: string;
}