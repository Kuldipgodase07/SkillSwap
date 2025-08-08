import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { BookOpen, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔍 Attempting to sign in with email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Sign in successful:', userCredential.user.uid);
      // Fetch user profile
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin' || userData.role === 'super_admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      let errorMessage = 'An error occurred during sign in';
      
      // Provide more user-friendly error messages
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
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
      <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-gradient-to-br from-blue-200/30 to-white/0 rounded-full blur-3xl animate-pulse z-0" />
      <div className="max-w-md w-full z-10">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-blue-100 p-10 sm:p-12 flex flex-col items-center relative">
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-300 shadow-lg">
              <BookOpen className="h-10 w-10 text-white" />
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight text-center drop-shadow">Sign in to your account</h2>
          <p className="mb-6 text-sm text-gray-500 text-center">Or{' '}<Link to="/register" className="font-semibold text-blue-600 hover:text-blue-800 transition">create a new account</Link></p>
          <form className="space-y-6 w-full" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow animate-pulse">{error}</div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold shadow-lg hover:from-blue-600 hover:to-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 text-lg tracking-wide disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
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

export default Login; 