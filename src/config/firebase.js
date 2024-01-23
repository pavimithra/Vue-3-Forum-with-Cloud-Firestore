import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAIhliMuMhZP9CsDzP695BaZIR47rifHkg",
  authDomain: "vue-3-forum-51f29.firebaseapp.com",
  projectId: "vue-3-forum-51f29",
  storageBucket: "vue-3-forum-51f29.appspot.com",
  messagingSenderId: "822761477822",
  appId: "1:822761477822:web:c54ab4604eb41614f4f0ef"
}

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig)

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(firebaseApp)

export default db