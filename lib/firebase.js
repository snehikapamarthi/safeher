import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyAyy2slADD6GaFZKMrllNBPvQ-CUzxyOxo",
  authDomain: "safeher-kavach.firebaseapp.com",
  databaseURL: "https://safeher-kavach-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "safeher-kavach",
  storageBucket: "safeher-kavach.appspot.com",
  messagingSenderId: "923341048668",
  appId: "1:923341048668:web:d6de045b04fb4499124f99"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app)