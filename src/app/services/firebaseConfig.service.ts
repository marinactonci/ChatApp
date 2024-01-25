// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { environment } from '../../environments/environment';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = environment.firebaseConfig;

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// retrieve the collection named messages from the firestore database
