import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 여기에 본인의 Firebase 설정값을 복사해서 넣기
// (Firebase 콘솔 -> 프로젝트 설정 -> 내 앱 -> SDK 설정 및 구성 에서 확인 가능)
const firebaseConfig = {
  apiKey: "AIzaSyDg78ZpsnS7i4iB3Y6Z6q2J2jVfMVUhjV8",
  authDomain: "jupa-app.firebaseapp.com",
  projectId: "jupa-app",
  storageBucket: "jupa-app.firebasestorage.app",
  messagingSenderId: "1040652127572",
  appId: "1:1040652127572:web:de974114e64e81f7ae4cc1",
  measurementId: "G-SHYLPRFHG9"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
