'use client';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [sosTimer, setSosTimer] = useState(0);
  const [liveLocation, setLiveLocation] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const sosIntervalRef = useRef(null);
  const locationIntervalRef = useRef(null);
  const router = useRouter();

  // FEATURE: Voice Command "Help Help"
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase();
      if (transcript.includes('help help') || transcript.includes('help me')) {
        sendSOSWithCancel();
      }
    };
    recognition.start();
    return () => recognition.stop();
  }, [contacts, user]);

  // FEATURE: Shake to SOS
  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const delta = Math.abs(acc.x - lastX) + Math.abs(acc.y - lastY) + Math.abs(acc.z - lastZ);
      if (delta > 30) sendSOSWithCancel();
      lastX = acc.x; lastY = acc.y; lastZ = acc.z;
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [contacts, user]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const contactsRef = ref(db, 'contacts/' + currentUser.uid);
        onValue(contactsRef, (snapshot) => {
          const data = snapshot.val();
          setContacts(data? Object.keys(data).map(key => ({ id: key,...data[key] })) : []);
        });
        const incidentsRef = ref(db, 'incidents/' + currentUser.uid);
        onValue(incidentsRef, (snapshot) => {
          const data = snapshot.val();
          setIncidents(data? Object.keys(data).map(key => ({ id: key,...data[key] })).reverse() : []);
          setLoading(false);
        });
      } else {
        router.push('/');
      }
    });
    return () => unsub();
  }, [router]);

  const addContact = async () => {
    if (!name ||!phone) return alert('Please enter both Name and Phone number');
    if (phone.length < 10) return alert('Please enter a valid 10-digit phone number');
    await push(ref(db, 'contacts/' + user.uid), { name, phone });
    setName(''); setPhone('');
  };

  const deleteContact = async (id) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      await remove(ref(db, 'contacts/' + user.uid + '/' + id));
    }
  };

  // FEATURE: Live Location Sharing
  const startLiveTracking = (incidentId) => {
    if (navigator.geolocation) {
      locationIntervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude } = pos.coords;
          const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
          setLiveLocation(locationUrl);
          update(ref(db, 'incidents/' + user.uid + '/' + incidentId), {
            liveLocation: locationUrl,
            lastUpdated: new Date().toISOString()
          });
        });
      }, 10000); // Every 10 sec
    }
  };

  const stopLiveTracking = () => {
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    setLiveLocation(null);
  };

  // FEATURE: Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.log('Microphone denied');
    }
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) return resolve(null);
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsRecording(false);
        resolve(audioBlob);
      };
      mediaRecorderRef.current.stop();
    });
  };

  // FEATURE: SOS with 5-Sec Cancel Timer
  const sendSOSWithCancel = () => {
    if (contacts.length === 0) {
      alert('Please add at least one trusted contact');
      return;
    }
    setSosTimer(5);
    sosIntervalRef.current = setInterval(() => {
      setSosTimer(prev => {
        if (prev <= 1) {
          clearInterval(sosIntervalRef.current);
          triggerSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    clearInterval(sosIntervalRef.current);
    setSosTimer(0);
    alert('SOS Cancelled');
  };

  const triggerSOS = async () => {
    await startRecording();

    setTimeout(async () => {
      await stopRecording();
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

        // Save incident first to get ID
        const incidentRef = await push(ref(db, 'incidents/' + user.uid), {
          time: new Date().toISOString(),
          location: locationUrl,
          status: 'SOS Active',
          contactsNotified: contacts.length,
          audioRecorded: true,
          liveTracking: true
        });

        // Start live tracking
        startLiveTracking(incidentRef.key);

        // WhatsApp to all contacts
        contacts.forEach(contact => {
          const msg = `🚨 LIVE SOS from ${user.email}!\n\nI'm in danger!\n\nLive Location: ${locationUrl}\n\nTrack me: ${window.location.origin}/track/${user.uid}/${incidentRef.key}\n\nCall Police 100 NOW!`;
          const waUrl = `https://wa.me/91${contact.phone}?text=${encodeURIComponent(msg)}`;
          window.open(waUrl, '_blank');
        });

        // Police Station
        const policeUrl = `https://www.google.com/maps/search/police+station/@${latitude},${longitude},14z`;
        window.open(policeUrl, '_blank');

        alert(`🚨 SOS SENT!\n\n✅ ${contacts.length} contacts notified\n✅ Live tracking started\n✅ Audio recorded\n\nStay safe!`);
      });
    }, 10000);
  };

  const triggerFakeCall = () => {
    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
    const callScreen = window.open('', '_blank', 'width=400,height=600');
    if (callScreen) {
      callScreen.document.write(`
        <html><head><title>Incoming Call</title></head>
          <body style="margin:0;background:#1a1a1a;color:white;font-family:Arial;text-align:center;padding-top:80px;">
            <div style="font-size:80px;animation:pulse 1s infinite;">📞</div>
            <h1 style="font-size:32px;margin:20px;">Mom</h1>
            <p style="font-size:18px;color:#aaa;">Incoming call...</p>
            <div style="margin-top:60px;">
              <button onclick="window.close()" style="margin:10px;padding:20px 50px;background:#e74c3c;border:none;border-radius:50px;color:white;font-size:18px;cursor:pointer;">Decline</button>
              <button onclick="alert('Call connected!');window.close()" style="margin:10px;padding:20px 50px;background:#2ecc71;border:none;border-radius:50px;color:white;font-size:18px;cursor:pointer;">Answer</button>
            </div>
            <style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}</style>
          </body></html>
      `);
      setTimeout(() => callScreen?.close(), 15000);
    }
  };

  const handleLogout = async () => {
    stopLiveTracking();
    if (confirm('Are you sure you want to logout?')) {
      await signOut(auth);
      router.push('/');
    }
  };

  if (loading) return <div className={`p-8 text-center text-xl ${darkMode?'bg-gray-900 text-white':'bg-gray-50'}`}>Loading...</div>;

  return (
    <div className={`p-4 md:p-8 max-w-2xl mx-auto min-h-screen transition ${darkMode?'bg-gray-900 text-white':'bg-gray-50'}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">SafeHer Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className="px-3 py-2 rounded bg-gray-700 text-white">{darkMode?'☀️':'🌙'}</button>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
        </div>
      </div>

      <p className="mb-1 text-green-600 font-semibold">Welcome: {user?.email} ✅</p>
      <p className="mb-1 text-xs text-blue-600">💡 Shake phone or say "Help Help" to trigger SOS</p>
      {liveLocation && <p className="mb-3 text-xs text-red-600 animate-pulse">🔴 Live tracking active</p>}

      {sosTimer > 0 && (
        <div className="bg-yellow-100 border-2 border-yellow-500 p-4 rounded-lg mb-4 text-center">
          <p className="text-yellow-800 font-bold text-xl">⚠️ SOS TRIGGERING IN {sosTimer}s</p>
          <button onClick={cancelSOS} className="mt-2 bg-red-600 text-white px-6 py-2 rounded font-bold">CANCEL SOS</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={sendSOSWithCancel} className="bg-red-600 text-white text-xl font-bold py-6 rounded-lg hover:bg-red-700 shadow-lg active:scale-95 transition">
          🚨 SEND SOS
        </button>
        <button onClick={triggerFakeCall} className="bg-purple-600 text-white text-xl font-bold py-6 rounded-lg hover:bg-purple-700 shadow-lg active:scale-95 transition">
          📞 FAKE CALL
        </button>
      </div>

      {isRecording && (
        <div className="bg-red-100 border-2 border-red-500 p-3 rounded-lg mb-4 text-center animate-pulse">
          <p className="text-red-700 font-bold">🔴 Recording Audio... Stay Safe</p>
        </div>
      )}

      <div className={`${darkMode?'bg-gray-800':'bg-white'} p-4 rounded-lg mb-6 shadow`}>
        <h2 className="text-xl font-bold mb-3">Add Trusted Contact</h2>
        <input type="text" placeholder="Contact Name" value={name} onChange={(e) => setName(e.target.value)} className={`w-full p-2 mb-2 border rounded ${darkMode?'bg-gray-700 text-white':''}`} />
        <input type="tel" placeholder="Phone Number (10 digits)" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={10} className={`w-full p-2 mb-2 border rounded ${darkMode?'bg-gray-700 text-white':''}`} />
        <button onClick={addContact} className="w-full bg-blue-500 text-white p-2 rounded font-bold hover:bg-blue-600">Add Contact</button>
      </div>

      <div className={`${darkMode?'bg-gray-800':'bg-white'} p-4 rounded-lg mb-6 shadow`}>
        <h2 className="text-xl font-bold mb-3">Your Contacts ({contacts.length})</h2>
        {contacts.length === 0 && <p className="text-gray-500">No contacts added yet.</p>}
        {contacts.map(c => (
          <div key={c.id} className={`p-3 mb-2 border rounded flex justify-between items-center ${darkMode?'border-gray-600':''}`}>
            <div><p className="font-bold">{c.name}</p><p className={darkMode?'text-gray-400':'text-gray-600'}>{c.phone}</p></div>
            <button onClick={() => deleteContact(c.id)} className="text-red-500 font-bold px-3 py-1 rounded hover:bg-red-50">Delete</button>
          </div>
        ))}
      </div>

      <div className={`${darkMode?'bg-gray-800':'bg-white'} p-4 rounded-lg shadow`}>
        <h2 className="text-xl font-bold mb-3">Emergency History ({incidents.length})</h2>
        {incidents.length === 0 && <p className="text-gray-500">No SOS alerts triggered yet. Stay safe!</p>}
        {incidents.slice(0, 5).map(i => (
          <div key={i.id} className="p-3 mb-2 border-l-4 border-red-500 bg-red-50 rounded">
            <p className="font-bold text-red-700">🚨 {i.status}</p>
            <p className="text-sm text-gray-600">{new Date(i.time).toLocaleString()}</p>
            <a href={i.location} target="_blank" className="text-blue-600 text-sm underline">View Location</a>
            {i.liveLocation && <a href={i.liveLocation} target="_blank" className="text-green-600 text-sm underline ml-2">🔴 Live Track</a>}
            {i.audioRecorded && <p className="text-xs text-green-600">🎙️ Audio recorded</p>}
          </div>
        ))}
      </div>
    </div>
  );
}