'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '../../lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { ref, push, onValue, remove } from 'firebase/database'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [contacts, setContacts] = useState([])
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [showFakeCall, setShowFakeCall] = useState(false)
  const [isRinging, setIsRinging] = useState(true)
  const [callAccepted, setCallAccepted] = useState(false)
  const [timer, setTimer] = useState(0)
  const [history, setHistory] = useState([])
  const [location, setLocation] = useState(null)
  const [shakeCount, setShakeCount] = useState(0)
  const router = useRouter()
  const ringtoneRef = useRef(null)
  const callSoundRef = useRef(null)
  const conversationRef = useRef(null)
  const lastShakeTime = useRef(0)

  // Hide Scrollbar CSS
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
     .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
     .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `
    document.head.appendChild(style)
  }, [])

  // 1. Auth + Load Firebase Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)

        const contactsRef = ref(db, `users/${currentUser.uid}/contacts`)
        onValue(contactsRef, (snapshot) => {
          const data = snapshot.val()
          if (data) {
            const contactsArray = Object.entries(data).map(([id, val]) => ({ id,...val }))
            setContacts(contactsArray)
          } else {
            setContacts([])
          }
        })

        const historyRef = ref(db, `users/${currentUser.uid}/sos_history`)
        onValue(historyRef, (snapshot) => {
          const data = snapshot.val()
          if (data) {
            const historyArray = Object.entries(data).map(([id, val]) => ({ id,...val })).reverse()
            setHistory(historyArray)
          } else {
            setHistory([])
          }
        })
      } else {
        router.push('/login')
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  // 2. Get Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Location error:', err)
      )
    }
  }, [])

  // 3. Shake Detection - 3 Shakes = SOS
  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0, threshold = 15
    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity
      if (!acc) return
      const diff = Math.abs(acc.x - lastX) + Math.abs(acc.y - lastY) + Math.abs(acc.z - lastZ)
      if (diff > threshold) {
        const now = Date.now()
        if (now - lastShakeTime.current > 1000) {
          setShakeCount(prev => {
            const newCount = prev + 1
            if (newCount >= 3) {
              handleSOS()
              return 0
            }
            setTimeout(() => setShakeCount(0), 2000)
            return newCount
          })
          lastShakeTime.current = now
        }
      }
      lastX = acc.x
      lastY = acc.y
      lastZ = acc.z
    }
    if (window.DeviceMotionEvent) window.addEventListener('devicemotion', handleMotion)
    return () => window.removeEventListener('devicemotion', handleMotion)
  }, [contacts, location])

  // 4. Voice Detection - Help Help
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase()
        if (transcript.includes('help help') || transcript.includes('helphelp')) {
          handleSOS()
        }
      }
      recognition.onerror = () => setTimeout(() => recognition.start(), 1000)
      try {
        recognition.start()
      } catch (e) {
        console.log('Speech recognition failed')
      }
      return () => recognition.stop()
    }
  }, [contacts, location])

  // 5. Logout
  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  // 6. Add Contact
  const handleAddContact = () => {
    if (contactName && contactPhone.length === 10 && user) {
      const contactsRef = ref(db, `users/${user.uid}/contacts`)
      push(contactsRef, { name: contactName, phone: contactPhone })
      setContactName('')
      setContactPhone('')
    } else {
      alert('Enter valid name and 10 digit phone number')
    }
  }

  // 7. Delete Contact
  const deleteContact = (id) => {
    if (user) {
      const contactRef = ref(db, `users/${user.uid}/contacts/${id}`)
      remove(contactRef)
    }
  }

  // 8. Send SOS - WhatsApp + Location + History
  const handleSOS = () => {
    if (contacts.length === 0) {
      alert('Add at least one contact first!')
      return
    }
    const locLink = location
? `https://maps.google.com/?q=${location.lat},${location.lng}`
      : 'Location not available'
    const message = `🚨 EMERGENCY ALERT from ${user?.email}!\nI need immediate help!\nMy location: ${locLink}\nTime: ${new Date().toLocaleString()}`
    contacts.forEach(c => {
      window.open(`https://wa.me/91${c.phone}?text=${encodeURIComponent(message)}`, '_blank')
    })
    if (user) {
      const historyRef = ref(db, `users/${user.uid}/sos_history`)
      push(historyRef, {
        timestamp: Date.now(),
        location: locLink,
        contactsNotified: contacts.length,
        method: 'SOS/Shake/Voice'
      })
    }
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200])
    alert(`SOS sent to ${contacts.length} contacts!`)
  }

  // 9. START FAKE CALL - SHOWS INCOMING CALL SCREEN 🔊
  const startFakeCall = () => {
    setShowFakeCall(true)
    setIsRinging(true)
    setCallAccepted(false)
    setTimer(0)

    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500])

    // INCOMING CALL RINGTONE START
    setTimeout(() => {
      if (ringtoneRef.current) {
        ringtoneRef.current.loop = true
        ringtoneRef.current.volume = 1.0
        ringtoneRef.current.muted = false

        const playPromise = ringtoneRef.current.play()
        if (playPromise!== undefined) {
          playPromise
         .then(() => console.log('Ringtone playing ✅'))
         .catch(err => {
              console.log('Ringtone blocked:', err)
            })
        }
      }
    }, 100)
  }

  // 10. ACCEPT CALL - GREEN BUTTON
  const acceptCall = () => {
    setIsRinging(false)
    setCallAccepted(true)

    // Stop ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }

    // Play call connected beep
    if (callSoundRef.current) {
      callSoundRef.current.play().catch(e => console.log('Call sound failed'))
    }

    // Start conversation sound
    setTimeout(() => {
      if (conversationRef.current) {
        conversationRef.current.loop = true
        conversationRef.current.volume = 0.6
        conversationRef.current.play().catch(e => console.log('Conversation failed'))
      }
    }, 500)
  }

  // 11. Timer
  useEffect(() => {
    let interval
    if (showFakeCall && callAccepted) {
      interval = setInterval(() => setTimer(prev => prev + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [showFakeCall, callAccepted])

  // 12. End Call
  const endFakeCall = () => {
    setShowFakeCall(false)
    setIsRinging(true)
    setCallAccepted(false)
    setTimer(0)
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }
    if (callSoundRef.current) {
      callSoundRef.current.pause()
      callSoundRef.current.currentTime = 0
    }
    if (conversationRef.current) {
      conversationRef.current.pause()
      conversationRef.current.currentTime = 0
    }
  }

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-2xl font-bold text-pink-600">Loading...</div>
      </div>
    )
  }

  // INCOMING CALL SCREEN - WITH ACCEPT/DECLINE BUTTONS
  if (showFakeCall) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-400 to-green-600 flex flex-col items-center justify-between py-20 text-white">
        <div className="text-center">
          <p className="text-lg opacity-80">{isRinging? 'Incoming call' : 'Call in progress'}</p>
          <h1 className="text-4xl font-bold mt-2">Mom</h1>
          <p className="text-2xl mt-4">{isRinging? 'Ringing...' : formatTime(timer)}</p>
        </div>

        <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center text-6xl animate-pulse">
          👩
        </div>

        {isRinging? (
          // INCOMING CALL - Accept/Decline buttons
          <div className="flex gap-20">
            <button
              onClick={endFakeCall}
              className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-4xl shadow-2xl"
            >
              📞
            </button>
            <button
              onClick={acceptCall}
              className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-4xl animate-pulse shadow-2xl"
            >
              📞
            </button>
          </div>
        ) : (
          // CALL ACCEPTED - Only End button
          <button
            onClick={endFakeCall}
            className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-4xl animate-pulse shadow-2xl"
          >
            📞
          </button>
        )}

        <audio
          ref={ringtoneRef}
          src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
          playsInline
          preload="auto"
        />

        <audio
          ref={callSoundRef}
          src="https://assets.mixkit.co/active_storage/sfx/235/235-preview.mp3"
          playsInline
          preload="auto"
        />

        <audio
          ref={conversationRef}
          src="https://assets.mixkit.co/active_storage/sfx/256/256-preview.mp3"
          playsInline
          preload="auto"
        />
      </div>
    )
  }

  // MAIN DASHBOARD
  return (
    <div className={`min-h-screen p-4 ${darkMode? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-pink-50 to-purple-50'}`}>
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-pink-600">SafeHer Dashboard</h1>
            <p className="text-sm mt-1">Welcome: {user?.email} ✅</p>
            <p className="text-xs mt-1">
              💡 Shake 3x or say "Help Help" for SOS 🎤 {shakeCount > 0 && `(${shakeCount}/3)`}
            </p>
            {location && <p className="text-xs text-green-600 mt-1">📍 Location Active</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="px-4 py-2 bg-gray-700 text-white rounded-lg">
              {darkMode? '☀️' : '🌙'}
            </button>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg">
              Logout
            </button>
          </div>
        </div>

        <div className={`${darkMode? 'bg-gray-800' : 'bg-white/80'} rounded-2xl p-6 shadow-xl mb-4`}>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={handleSOS} className="bg-red-500 text-white py-6 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition">
              🚨 SEND SOS
            </button>
            <button onClick={startFakeCall} className="bg-purple-500 text-white py-6 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition">
              📞 FAKE CALL
            </button>
          </div>
          <p className={`text-xs text-center mt-3 ${darkMode? 'text-gray-400' : 'text-gray-600'}`}>
            Shake phone 3 times or say "Help Help" for emergency
          </p>
        </div>

        <div className={`rounded-2xl p-6 shadow-xl mb-4 ${darkMode? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-xl font-bold mb-4">Add Trusted Contact</h2>
          <input type="text" placeholder="Contact Name" value={contactName} onChange={(e) => setContactName(e.target.value)} className={`w-full p-3 rounded-lg mb-3 border ${darkMode? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
          <input type="tel" placeholder="Phone Number (10 digits)" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} maxLength={10} className={`w-full p-3 rounded-lg mb-3 border ${darkMode? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
          <button onClick={handleAddContact} className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold active:scale-95 transition">
            Add Contact
          </button>
        </div>

        <div className={`rounded-2xl p-6 shadow-xl mb-4 ${darkMode? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-xl font-bold mb-4">Your Contacts ({contacts.length})</h2>
          {contacts.length === 0? (
            <p className={`${darkMode? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>
              No contacts yet. Add someone to send SOS.
            </p>
          ) : (
            contacts.map((c) => (
              <div key={c.id} className={`flex justify-between items-center p-3 rounded-lg mb-2 ${darkMode? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div>
                  <span className="font-semibold">{c.name}</span>
                  <span className="ml-2 text-sm">{c.phone}</span>
                </div>
                <button onClick={() => deleteContact(c.id)} className="text-red-500 font-bold px-3 py-1">✕</button>
              </div>
            ))
          )}
        </div>

        <div className={`rounded-2xl p-6 shadow-xl ${darkMode? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-xl font-bold mb-4">SOS History</h2>
          {history.length === 0? (
            <p className={`${darkMode? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>
              No SOS alerts sent yet.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto no-scrollbar">
              {history.map((h) => (
                <div key={h.id} className={`p-3 rounded-lg mb-2 ${darkMode? 'bg-gray-700' : 'bg-red-50'}`}>
                  <p className="text-sm font-semibold text-red-600">
                    🚨 {new Date(h.timestamp).toLocaleString()}
                  </p>
                  <p className="text-xs mt-1">Notified: {h.contactsNotified} contacts</p>
                  <a href={h.location} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline">
                    View Location
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}