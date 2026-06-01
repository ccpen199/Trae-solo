import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTicketStore = defineStore('ticket', () => {
  const purchasedTickets = ref(JSON.parse(localStorage.getItem('purchasedTickets') || '[]'))

  function hasPurchased(scheduleId) {
    return purchasedTickets.value.some(t => t.scheduleId === scheduleId)
  }

  function purchaseTicket(schedule) {
    if (hasPurchased(schedule.id)) {
      return { success: false, message: '您已经购买过该场次的票了' }
    }

    purchasedTickets.value.push({
      scheduleId: schedule.id,
      movieId: schedule.movie_id,
      cinemaId: schedule.cinema_id,
      purchaseTime: new Date().toISOString(),
      price: schedule.price,
      quantity: 1
    })
    
    localStorage.setItem('purchasedTickets', JSON.stringify(purchasedTickets.value))
    return { success: true, message: '购票成功' }
  }

  function getMyTickets() {
    return purchasedTickets.value
  }

  return {
    purchasedTickets,
    hasPurchased,
    purchaseTicket,
    getMyTickets
  }
})
