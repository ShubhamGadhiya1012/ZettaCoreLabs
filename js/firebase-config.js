// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBkpgVJl8wwhyzoIMY691XkbDXVhhFCPf8",
  authDomain: "zettacorelabs-bd18b.firebaseapp.com",
  projectId: "zettacorelabs-bd18b",
  storageBucket: "zettacorelabs-bd18b.firebasestorage.app",
  messagingSenderId: "39006447493",
  appId: "1:39006447493:web:1456504881722efbc846ec",
  measurementId: "G-MLM4QS5GLW"
};// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Storage
const storage = firebase.storage();

console.log('Firebase initialized successfully');