const API_BASE = '';

export const api = {
  async login(nickname, userId) {
    const response = await fetch(`${API_BASE}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nickname, userId })
    });
    return response.json();
  },

  async getRooms() {
    return fetch(`${API_BASE}/api/rooms/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(r => r.json());
  },

  async createRoom(hostId, roomName) {
    return fetch(`${API_BASE}/api/rooms/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ hostId, roomName })
    }).then(r => r.json());
  },

  async joinRoom(roomId, playerId) {
    return fetch(`${API_BASE}/api/rooms/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roomId, playerId })
    }).then(r => r.json());
  },

  async setReady(roomId, playerId, ready) {
    return fetch(`${API_BASE}/api/rooms/ready`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roomId, playerId, ready })
    }).then(r => r.json());
  },

  async getRoom(roomId) {
    return fetch(`${API_BASE}/api/rooms/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roomId })
    }).then(r => r.json());
  }
};