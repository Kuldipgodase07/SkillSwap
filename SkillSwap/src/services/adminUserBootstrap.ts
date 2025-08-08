import { setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_UID = 'admin'; // You can set this to a fixed value or use Firebase Auth UID if available

export async function ensureAdminUser() {
    const adminRef = doc(db, 'users', ADMIN_UID);
    const adminDoc = await getDoc(adminRef);
    if (!adminDoc.exists()) {
        await setDoc(adminRef, {
            uid: ADMIN_UID,
            email: ADMIN_EMAIL,
            displayName: 'Platform Admin',
            photoURL: null,
            bio: 'Platform administrator',
            location: '',
            skillsToTeach: [],
            skillsToLearn: [],
            rating: 0,
            totalRatings: 0,
            role: 'super_admin',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('Admin user created in Firestore.');
    } else {
        console.log('Admin user already exists in Firestore.');
    }
}