'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [contacts, setContacts] = useState([])
  const [newContactName, setNewContactName] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [history, setHistory] = useState([])
  const [userEmail, setUserEmail] = useState('snehikapamarthi@gmail.com')
  const router = useRouter()

  // Load data on mount
  useEffect(() => {
    const savedContacts = localStorage.getItem('safeher_contacts')
    const savedHistory = localStorage.getItem('safeher_history')
    const savedTheme = localStorage.getItem('safeher_theme')

    if (savedContacts) setContacts(JSON.parse(savedContacts))
    if (savedHistory) setHistory(JSON.parse(savedHistory))
    if (savedTheme === 'dark') setDarkMode(true)
  }, [])

  // Save contacts
  useEffect(() => {
    localStorage.setItem('safeher_contacts', JSON.stringify(contacts))
  }, [contacts])

  // Save history
  useEffect(() => {
    localStorage.setItem('safeher_history', JSON.stringify(history))
  }, [history])

  // Save theme
  useEffect(() => {
    localStorage.setItem('safeher_theme', darkMode? 'dark' : 'light')
  }, [darkMode])

  // Add contact
  const addContact = () => {
    if (newContactName && newContactPhone) {
      setContacts([...contacts, { name: newContactName, phone: newContactPhone }])
      setNewContactName('')
      setNewContactPhone('')
    } else {
      alert('Please enter both name and phone number')
    }
  }

  // Delete contact
  const deleteContact = (index) => {
    const updatedContacts = contacts.filter((_, i) => i!== index)
    setContacts(updatedContacts)
  }

  // 🚨 SEND SOS - CLEAN MESSAGE NO EMAIL NO LOCALHOST
  const sendSOS = () => {
    if (contacts.length === 0) {
      alert('⚠️ Please add emergency contacts first!')
      return
    }

    if (!navigator.geolocation) {
      alert('❌ Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        const locationUrl = `https://maps.google.com/?q=${lat},${lon}`
        const time = new Date().toLocaleString()

        // ✅ CLEAN MESSAGE
        const message = `🚨 EMERGENCY! I need help!\n\n📍 My Location: ${locationUrl}\n\n⏰ Time: ${time}\n\nSent via SafeHer App`

        // Save to history
        const newHistory = {
          time: time,
          location: locationUrl,
          contacts: contacts.length
        }
        setHistory([newHistory,...history])

        // Send WhatsApp to each contact
        contacts.forEach((contact, index) => {
          let phone = contact.phone.replace(/[\s-+]/g, '')
          if (!phone.startsWith('91')) phone = `91${phone}`

          const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

          setTimeout(() => {
            const link = document.createElement('a')
            link.href = waUrl
            link.target = '_blank'
            link.rel = 'noopener noreferrer'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
          }, index * 1500)
        })

      },
      (error) => {
        console.error('Location error:', error)
        alert('❌ Location access denied. Please enable location in browser settings.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // FAKE CALL Feature
  const fakeCall = () => {
    alert('📞 Incoming Call: Mom\n\nAnswer to exit safe mode')
  }

  // Logout
  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.clear()
      router.push('/login')
    }
  }

  const bgClass = darkMode? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 to-purple-50'
  const cardClass = darkMode? 'bg-gray-800' : 'bg-white'
  const textClass = darkMode? 'text-white' : 'text-gray-800'
  const subTextClass = darkMode? 'text-gray-300' : 'text-gray-600'

  return (
    <div className={`min-h-screen ${bgClass} p-4 transition-colors duration-300`}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 pt-4">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode? 'text-pink-400' : 'text-pink-600'}`}>
              SafeHer Dashboard
            </h1>
            <p className={`text-sm ${subTextClass} mt-1`}>
              Welcome: {userEmail} ✅
            </p>
            <p className={`text-xs ${subTextClass} mt-1`}>
              💡 Shake phone or say "Help Help" to trigger SOS
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              {darkMode? '☀️' : '🌙'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* SOS & Fake Call Buttons */}
        <div className={`${cardClass} rounded-2xl shadow-xl p-6 mb-6`}>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={sendSOS}
              className="bg-red-600 hover:bg-red-700 text-white text-xl font-bold py-6 px-4 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95"
            >
              🚨 SEND SOS
            </button>
            <button
              onClick={fakeCall}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold py-6 px-4 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95"
            >
              📞 FAKE CALL
            </button>
          </div>
          <p className={`text-xs ${subTextClass} mt-3 text-center`}>
            Opens WhatsApp with your live location for all contacts
          </p>
        </div>

        {/* Add Contact - PLACEHOLDER FIXED */}
        <div className={`${cardClass} rounded-2xl shadow-xl p-6 mb-6`}>
          <h2 className={`text-xl font-bold ${textClass} mb-4`}>Add Trusted Contact</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Contact Name"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 ${
                darkMode
                 ? 'bg-gray-700 text-white placeholder-gray-400'
                  : 'bg-white text-gray-800 placeholder-gray-500'
              }`}
            />
            <input
              type="tel"
              placeholder="Phone Number (10 digits)"
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 ${
                darkMode
                 ? 'bg-gray-700 text-white placeholder-gray-400'
                  : 'bg-white text-gray-800 placeholder-gray-500'
              }`}
            />
            <button
              onClick={addContact}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Add Contact
            </button>
          </div>
        </div>

        {/* Contacts List */}
        <div className={`${cardClass} rounded-2xl shadow-xl p-6 mb-6`}>
          <h2 className={`text-xl font-bold ${textClass} mb-4`}>Your Contacts ({contacts.length})</h2>
          <div className="space-y-3">
            {contacts.length === 0? (
              <p className={`text-center ${subTextClass} py-8`}>No contacts added yet</p>
            ) : (
              contacts.map((contact, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between ${darkMode? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}
                >
                  <div>
                    <p className={`font-semibold ${textClass}`}>{contact.name}</p>
                    <p className={`text-sm ${subTextClass}`}>{contact.phone}</p>
                  </div>
                  <button
                    onClick={() => deleteContact(index)}
                    className="text-red-600 hover:text-red-800 font-semibold px-4 py-2 rounded-lg hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Emergency History */}
        <div className={`${cardClass} rounded-2xl shadow-xl p-6`}>
          <h2 className={`text-xl font-bold ${textClass} mb-4`}>Emergency History ({history.length})</h2>
          <div className="space-y-3">
            {history.length === 0? (
              <p className={`text-center ${subTextClass} py-8`}>No SOS triggered yet</p>
            ) : (
              history.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="bg-red-50 border-l-4 border-red-500 p-4 rounded"
                >
                  <p className="font-semibold text-red-800">🚨 SOS Triggered</p>
                  <p className="text-sm text-gray-700">{item.time}</p>
                  <a
                    href={item.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Location
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}