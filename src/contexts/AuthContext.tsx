import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  facebookUrl: string;
  bio: string;
  role: 'user' | 'admin';
  ratingSum: number;
  ratingCount: number;
  averageRating: number;
  isBanned: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Create new user profile
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'Anonymous Gamer',
            photoURL: currentUser.photoURL || '',
            facebookUrl: '',
            bio: '',
            role: 'user',
            ratingSum: 0,
            ratingCount: 0,
            averageRating: 0,
            isBanned: false,
            createdAt: new Date().toISOString(),
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User simply closed the popup, no need to show a scary error
        console.log('Login cancelled by user');
        return;
      }
      
      console.error('Login failed', error);
      if (error.code === 'auth/configuration-not-found') {
        alert('Login failed: Google Sign-In is not enabled in your Firebase project. Please enable it in the Firebase Console under Authentication > Sign-in method.');
      } else if (error.code === 'auth/unauthorized-domain') {
        alert(`Login failed: This domain (${window.location.hostname}) is not authorized for Firebase Auth. Please add it to your Firebase Console under Authentication > Settings > Authorized domains.`);
      } else {
        alert(`Login failed: ${error.message}`);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;
    const docRef = doc(db, 'users', user.uid);
    const updatedProfile = { ...profile, ...data };
    await setDoc(docRef, updatedProfile, { merge: true });
    setProfile(updatedProfile);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, updateProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
