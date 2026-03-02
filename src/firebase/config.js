import {initializeApp} from "firebase/app";
import {getFirestore} from "firebase/firestore";

const firebaseConfig ={
  apiKey: "AIzaSyDIuK2nJMXacF368FbTpbOOhCsEpydcAU4",
  authDomain: "invoice-generator-d9511.firebaseapp.com",
  projectId: "invoice-generator-d9511",
  storageBucket: "invoice-generator-d9511.firebasestorage.app",
  messagingSenderId: "361157797508",
  appId: "1:361157797508:web:8806804b2a6e00039f04d1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


