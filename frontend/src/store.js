import { create } from 'zustand';

const useStore = create((set, get) => ({
  currentUser: null,
  selectedSeats: [],
  currentSession: null,
  cart: [],
  setCurrentUser: (user) => set({ currentUser: user }),
  selectSeat: (seat) => {
    const { selectedSeats } = get();
    const exists = selectedSeats.find(s => s.session_seat_id === seat.session_seat_id);
    if (exists) {
      set({ selectedSeats: selectedSeats.filter(s => s.session_seat_id !== seat.session_seat_id) });
    } else {
      set({ selectedSeats: [...selectedSeats, seat] });
    }
  },
  clearSelectedSeats: () => set({ selectedSeats: [] }),
  setCurrentSession: (session) => set({ currentSession: session }),
  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  clearCart: () => set({ cart: [] }),
}));

export default useStore;
