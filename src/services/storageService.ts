import { User, Passenger, Booking, TrainNotification } from '../types';

const STORAGE_KEYS = {
  USER: 'traininapp_user',
  PASSENGER: 'traininapp_passenger',
  PASSENGERS: 'traininapp_passengers',
  ACTIVE_STEP: 'traininapp_active_step',
  BOOKINGS: 'traininapp_bookings',
  ACTIVE_BOOKING: 'traininapp_active_booking',
  NOTIFICATIONS: 'traininapp_notifications',
  COPILOT_HISTORY: 'traininapp_copilot_history',
  COPILOT_CONTEXT: 'traininapp_copilot_context',
};

export const storageService = {
  // --- USER AUTHENTICATION ---
  getUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser(user: User | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (e) {
      console.error('[storageService] Failed to set user:', e);
    }
  },

  // --- PASSENGER PROFILE ---
  getPassenger(): Passenger | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PASSENGER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setPassenger(passenger: Passenger | null): void {
    try {
      if (passenger) {
        localStorage.setItem(STORAGE_KEYS.PASSENGER, JSON.stringify(passenger));
      } else {
        localStorage.removeItem(STORAGE_KEYS.PASSENGER);
      }
    } catch (e) {
      console.error('[storageService] Failed to set passenger:', e);
    }
  },

  getPassengers(): Passenger[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PASSENGERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setPassengers(passengers: Passenger[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PASSENGERS, JSON.stringify(passengers));
    } catch (e) {
      console.error('[storageService] Failed to set passengers:', e);
    }
  },

  // --- APPLICATION STEP ---
  getActiveStep(): 'login' | 'passenger' | 'journey' | 'recommendations' | 'ticket' {
    try {
      const step = localStorage.getItem(STORAGE_KEYS.ACTIVE_STEP);
      if (step === 'login' || step === 'passenger' || step === 'journey' || step === 'recommendations' || step === 'ticket') {
        return step;
      }
      return 'login';
    } catch {
      return 'login';
    }
  },

  setActiveStep(step: 'login' | 'passenger' | 'journey' | 'recommendations' | 'ticket'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_STEP, step);
    } catch (e) {
      console.error('[storageService] Failed to set active step:', e);
    }
  },

  // --- BOOKINGS & TICKETS ---
  getBookings(): Booking[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveBooking(booking: Booking): void {
    try {
      const existing = this.getBookings();
      const updated = [booking, ...existing.filter((b) => b.pnr !== booking.pnr)];
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
      this.setActiveBooking(booking);
    } catch (e) {
      console.error('[storageService] Failed to save booking:', e);
    }
  },

  getActiveBooking(): Booking | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_BOOKING);
      if (data) return JSON.parse(data);
      const all = this.getBookings();
      return all.length > 0 ? all[0] : null;
    } catch {
      return null;
    }
  },

  setActiveBooking(booking: Booking | null): void {
    try {
      if (booking) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_BOOKING, JSON.stringify(booking));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_BOOKING);
      }
    } catch (e) {
      console.error('[storageService] Failed to set active booking:', e);
    }
  },

  updateBooking(updatedBooking: Booking): void {
    try {
      const existing = this.getBookings();
      const updated = existing.map((b) => (b.pnr === updatedBooking.pnr ? updatedBooking : b));
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
      if (this.getActiveBooking()?.pnr === updatedBooking.pnr) {
        this.setActiveBooking(updatedBooking);
      }
    } catch (e) {
      console.error('[storageService] Failed to update booking:', e);
    }
  },

  // --- NOTIFICATIONS ---
  getNotifications(): TrainNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveNotifications(notifs: TrainNotification[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    } catch (e) {
      console.error('[storageService] Failed to save notifications:', e);
    }
  },

  addNotification(notif: TrainNotification): void {
    try {
      const existing = this.getNotifications();
      const updated = [notif, ...existing.filter((n) => n.id !== notif.id)];
      this.saveNotifications(updated);
    } catch (e) {
      console.error('[storageService] Failed to add notification:', e);
    }
  },

  // --- COPILOT CONTEXT & HISTORY ---
  getCopilotHistory(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COPILOT_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCopilotHistory(history: any[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COPILOT_HISTORY, JSON.stringify(history.slice(-25)));
    } catch (e) {
      console.error('[storageService] Failed to save copilot history:', e);
    }
  },

  clearCopilotHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.COPILOT_HISTORY);
    } catch (e) {
      console.error('[storageService] Failed to clear copilot history:', e);
    }
  },

  // --- FULL SESSION RESET ---
  clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.PASSENGER);
      localStorage.removeItem(STORAGE_KEYS.PASSENGERS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_STEP);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_BOOKING);
      localStorage.removeItem(STORAGE_KEYS.COPILOT_HISTORY);
    } catch (e) {
      console.error('[storageService] Failed to clear session:', e);
    }
  },
};
