'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [contacts, setContacts] = useState([])
  const [newContactName, setNewContactName] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [history, setHistory] = useState([])
  const [userEmail, setUserEmail] = useState('snehikapamarthi@gmail.com')
  const [showFakeCall, setShowFakeCall] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const audioRef = useRef(null)
  const router = useRouter()

  // Load data
  useEffect(() => {
    const savedContacts = localStorage.getItem('safeher_contacts')
    const savedHistory = localStorage.getItem('safeher_history')
    const savedTheme = localStorage.getItem('safeher_theme')
    if (savedContacts) setContacts(JSON.parse(savedContacts))
    if (savedHistory) setHistory(JSON.parse(savedHistory))
    if (savedTheme === 'dark') setDarkMode(true)
  }, [])

  // Save data
  useEffect(() => {
    localStorage.setItem('safeher_contacts', JSON.stringify(contacts))
  }, [contacts])

  useEffect(() => {
    localStorage.setItem('safeher_history', JSON.stringify(history))
  }, [history])

  useEffect(() => {
    localStorage.setItem('safeher_theme', darkMode? 'dark' : 'light')
  }, [darkMode])

  // OPTION 3: SHAKE TO SOS
  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0
    let lastTime = 0
    let shakeCount = 0

    const handleMotion = (event) => {
      const current = event.accelerationIncludingGravity
      if (!current) return

      const currentTime = new Date().getTime()
      if ((currentTime - lastTime) > 100) {
        const diffTime = currentTime - lastTime
        lastTime = currentTime

        const speed = Math.abs(current.x + current.y + current.z - lastX - lastY - lastZ) / diffTime * 10000

        if (speed > 800) { // Shake threshold
          shakeCount++
          if (shakeCount >= 3) { // 3 shakes = SOS
            shakeCount = 0
            sendSOS()
            if (navigator.vibrate) navigator.vibrate([200, 100, 200])
          }
        }

        lastX = current.x
        lastY = current.y
        lastZ = current.z
      }
    }

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion)
    }
    return () => window.removeEventListener('devicemotion', handleMotion)
  }, [contacts])

  // OPTION 4: VOICE COMMAND "Help Help"
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return

    const recognition = new window.webkitSpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    let helpCount = 0
    let lastHelpTime = 0

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase()
      const currentTime = new Date().getTime()

      if (transcript.includes('help')) {
        if (currentTime - lastHelpTime < 3000) {
          helpCount++
          if (helpCount >= 2) {
            helpCount = 0
            sendSOS()
            if (navigator.vibrate) navigator.vibrate([200, 100, 200])
          }
        } else {
          helpCount = 1
        }
        lastHelpTime = currentTime
      }
    }

    recognition.start()
    setIsListening(true)

    return () => {
      recognition.stop()
      setIsListening(false)
    }
  }, [contacts])

  const addContact = () => {
    if (newContactName && newContactPhone) {
      setContacts([...contacts, { name: newContactName, phone: newContactPhone }])
      setNewContactName('')
      setNewContactPhone('')
    } else {
      alert('Please enter both name and phone number')
    }
  }

  const deleteContact = (index) => {
    setContacts(contacts.filter((_, i) => i!== index))
  }

  // 🚨 SEND SOS - WITH VIBRATION
  const sendSOS = () => {
    if (contacts.length === 0) {
      alert('⚠️ Please add emergency contacts first!')
      return
    }

    // OPTION 2: VIBRATION
    if (navigator.vibrate) {
      navigator.vibrate([300, 100, 300, 100, 300]) // SOS pattern
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

        const message = `🚨 EMERGENCY! I need help!\n\n📍 My Location: ${locationUrl}\n\n⏰ Time: ${time}\n\nSent via SafeHer App`

        setHistory([{ time, location: locationUrl, contacts: contacts.length },...history])

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
        alert('❌ Location access denied. Please enable location.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // 📞 FAKE CALL - WITH RINGTONE + VIBRATION
  const fakeCall = () => {
    setShowFakeCall(true)

    // OPTION 1: RINGTONE
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
    audioRef.current.loop = true
    audioRef.current.play().catch(e => console.log('Audio failed:', e))

    // OPTION 2: VIBRATION
    if (navigator.vibrate) {
      navigator.vibrate([1000, 500, 1000, 500, 1000]) // Call pattern
    }
  }

  const endFakeCall = () => {
    setShowFakeCall(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (navigator.vibrate) navigator.vibrate(0) // Stop vibration
  }

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
    <>
      {/* FAKE CALL FULL SCREEN */}
      {showFakeCall && (
        <div
          className="fixed bg-black flex flex-col items-center justify-between py-20"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999
          }}
        >
          <div className="text-center">
            <p className="text-gray-400 text-lg animate-pulse">Incoming call...</p>
            <h1 className="text-white text-5xl font-bold mt-4">Mom ❤️</h1>
            <p className="text-gray-400 text-lg mt-2">Mobile +91 98765 43210</p>
          </div>

          <div className="flex gap-24">
            <button
              onClick={endFakeCall}
              className="bg-red-600 w-20 h-20 rounded-full flex items-center justify-center text-4xl transform hover:scale-110 transition active:scale-95"
            >
              📞
            </button>
            <button
              onClick={endFakeCall}
              className="bg-green-600 w-20 h-20 rounded-full flex items-center justify-center text-4xl transform hover:scale-110 transition active:scale-95"
            >
              📞
            </button>
          </div>
          <p className="text-gray-500 text-sm">Tap to answer or decline</p>
        </div>
      )}

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
                💡 Shake phone or say "Help Help" to trigger SOS {isListening && '🎤'}
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

          {/* SOS & Fake Call */}
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
              Shake 3 times or say "Help Help" twice for emergency
            </p>
          </div>

          {/* Add Contact */}
          <div className={`${cardClass} rounded-2xl shadow-xl p-6 mb-6`}>
            <h2 className={`text-xl font-bold ${textClass} mb-4`}>Add Trusted Contact</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Contact Name"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 ${
                  darkMode? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-800'
                }`}
              />
              <input
                type="tel"
                placeholder="Phone Number (10 digits)"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 ${
                  darkMode? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-800'
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
                  <div key={index} className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="font-semibold text-red-800">🚨 SOS Triggered</p>
                    <p className="text-sm text-gray-700">{item.time}</p>
                    <a href={item.location} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      View Location
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}