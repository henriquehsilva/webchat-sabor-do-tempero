import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyD9_vta323kgL_1zBVwrvVaLdNzPIZjyA4",
	authDomain: "sabor-do-tempero.firebaseapp.com",
	projectId: "sabor-do-tempero",
	storageBucket: "sabor-do-tempero.firebasestorage.app",
	messagingSenderId: "372714924053",
	appId: "1:372714924053:web:3c82f804d809a06f2e061c",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
