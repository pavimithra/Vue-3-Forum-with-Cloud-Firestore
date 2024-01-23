import  { initializeApp } from "firebase/app"

const firebaseConfig = {
  apiKey: "AIzaSyAIhliMuMhZP9CsDzP695BaZIR47rifHkg",
  authDomain: "vue-3-forum-51f29.firebaseapp.com",
  projectId: "vue-3-forum-51f29",
  storageBucket: "vue-3-forum-51f29.appspot.com",
  messagingSenderId: "822761477822",
  appId: "1:822761477822:web:c54ab4604eb41614f4f0ef"
}

const firebaseApp = initializeApp(firebaseConfig)
export default firebaseApp