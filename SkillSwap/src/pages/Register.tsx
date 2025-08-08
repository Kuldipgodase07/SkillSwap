import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { BookOpen, Eye, EyeOff } from 'lucide-react';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Prevent registration of reserved admin email
    if (formData.email.trim().toLowerCase() === 'admin@gmail.com') {
      setError('This email is reserved for the platform administrator.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Attempting to create user with email:', formData.email);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      console.log('✅ User created successfully:', userCredential.user.uid);

      // Update user profile
      await updateProfile(userCredential.user, {
        displayName: formData.displayName
      });

      console.log('✅ User profile updated');

      // Create user document in Firestore
      const userData = {
        uid: userCredential.user.uid,
        email: formData.email,
        displayName: formData.displayName,
        photoURL: null,
        bio: '',
        location: '',
        skillsToTeach: [],
        skillsToLearn: [],
        rating: 0,
        totalRatings: 0,
        role: 'user' as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('🔍 Creating user document in Firestore:', userData);
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      console.log('✅ User document created in Firestore');

      navigate('/dashboard');
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      let errorMessage = 'An error occurred during registration';

      // Provide more user-friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection';
      } else {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 relative overflow-hidden">
      {/* Futuristic animated background shapes */}
      <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-gradient-to-br from-blue-300/30 to-blue-100/0 rounded-full blur-3xl animate-pulse z-0" />
      <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-gradient-to-br from-green-200/30 to-white/0 rounded-full blur-3xl animate-pulse z-0" />
      <div className="max-w-md w-full z-10">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-blue-100 p-10 sm:p-12 flex flex-col items-center relative">
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-300 shadow-lg">
              <BookOpen className="h-10 w-10 text-white" />
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight text-center drop-shadow">Create your account</h2>
          <p className="mb-6 text-sm text-gray-500 text-center">Or{' '}<Link to="/login" className="font-semibold text-blue-600 hover:text-blue-800 transition">sign in to your existing account</Link></p>
          <form className="space-y-6 w-full" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow animate-pulse">{error}</div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.displayName}
                  onChange={handleChange}
                  className="input-field mt-1 bg-white/70 border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3 text-gray-900 shadow-sm transition placeholder-gray-400 outline-none w-full"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field mt-1 bg-white/70 border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3 text-gray-900 shadow-sm transition placeholder-gray-400 outline-none w-full"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field pr-12 bg-white/70 border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3 text-gray-900 shadow-sm transition placeholder-gray-400 outline-none w-full"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-400 hover:text-blue-600 transition"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-field pr-12 bg-white/70 border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3 text-gray-900 shadow-sm transition placeholder-gray-400 outline-none w-full"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-400 hover:text-blue-600 transition"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold shadow-lg hover:from-blue-600 hover:to-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 text-lg tracking-wide disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
            <div className="text-center mt-2">
              <Link to="/" className="text-sm text-blue-600 hover:text-blue-800 transition font-medium">Back to home</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register; 