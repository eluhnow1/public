// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA_P6OA3XWf5qC_ODuWzVzco6XW41U49iA",
    authDomain: "sigmaturtle-971bc.firebaseapp.com",
    projectId: "sigmaturtle-971bc",
    storageBucket: "sigmaturtle-971bc.appspot.com",
    messagingSenderId: "808481283473",
    appId: "1:808481283473:web:0fa4f9d38a922bb841ce30"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Initialize Firestore
  const db = firebase.firestore();
  
  export { db };