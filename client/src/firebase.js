// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB0-uVNPtm8NJkyx80RpVvk8SNLWNibX8M",
  authDomain: "welfare-scheme.firebaseapp.com",
  projectId: "welfare-scheme",
  storageBucket: "welfare-scheme.firebasestorage.app",
  messagingSenderId: "201858129135",
  appId: "1:201858129135:web:d7b3853fdd14d849d1cf1a",
  measurementId: "G-RQNVFLM667"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Export the needed Firebase methods
export { app, auth, RecaptchaVerifier, signInWithPhoneNumber };