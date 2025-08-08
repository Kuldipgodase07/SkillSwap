import { setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ADMIN_EMAIL = 'admin@gmail.com';

export async function setupAdminUser(uid: string) {
    try {
        const adminRef = doc(db, 'users', uid);
        const adminDoc = await getDoc(adminRef);
        
        if (!adminDoc.exists()) {
            await setDoc(adminRef, {
                uid: uid,
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
            console.log('✅ Admin user created successfully in Firestore');
            return true;
        } else {
            console.log('ℹ️ Admin user already exists in Firestore');
            // Update the existing user to ensure they have admin role
            const existingData = adminDoc.data();
            await setDoc(adminRef, {
                ...existingData,
                role: 'super_admin',
                email: ADMIN_EMAIL,
                isActive: true,
                updatedAt: new Date()
            });
            console.log('✅ Admin user updated successfully');
            return true;
        }
    } catch (error) {
        console.error('❌ Error setting up admin user:', error);
        return false;
    }
}

export async function checkAdminUser(uid: string) {
    try {
        const adminRef = doc(db, 'users', uid);
        const adminDoc = await getDoc(adminRef);
        
        if (adminDoc.exists()) {
            const userData = adminDoc.data();
            console.log('🔍 Admin user check:', {
                uid: userData.uid,
                email: userData.email,
                role: userData.role,
                isActive: userData.isActive
            });
            return userData.role === 'super_admin' && userData.email === ADMIN_EMAIL;
        } else {
            console.log('❌ Admin user not found in Firestore');
            return false;
        }
    } catch (error) {
        console.error('❌ Error checking admin user:', error);
        return false;
    }
}
