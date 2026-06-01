import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import BookDetailPage from './pages/BookDetailPage'
import ProfilePage from './pages/ProfilePage'
import CartPage from './pages/CartPage'

function App() {
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.length > 0) {
          setCurrentUser(data.data[0])
        }
      })
  }, [])

  return (
    <div className="app">
      <Header currentUser={currentUser} />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/book/:id" element={<BookDetailPage currentUser={currentUser} />} />
          <Route path="/profile" element={<ProfilePage currentUser={currentUser} />} />
          <Route path="/cart" element={<CartPage currentUser={currentUser} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
