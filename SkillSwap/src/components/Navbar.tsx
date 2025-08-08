import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, LogOut, BookOpen, Shield } from 'lucide-react';

const Navbar: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser && userProfile) {
        // Check if user is admin based on email and role
        const adminStatus = userProfile.email === 'admin@gmail.com' && userProfile.role === 'super_admin';
        setIsAdmin(adminStatus);
      }
    };
    
    checkAdminStatus();
  }, [currentUser, userProfile]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">SkillSwap</span>
            </Link>
          </div>

          {currentUser ? (
            <div className="flex items-center space-x-4">
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                {isAdmin ? (
                  <>
                    <Link
                      to="/admin"
                      className="text-purple-700 hover:text-purple-800 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/dashboard"
                      className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/skill-listings"
                      className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Skills
                    </Link>
                    <Link
                      to="/connections"
                      className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Connections
                    </Link>
                    <Link
                      to="/messages"
                      className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Messages
                    </Link>
                    <Link
                      to="/profile"
                      className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-700 hover:text-primary-600 p-2 rounded-md"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && currentUser && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              {isAdmin ? (
                <>
                  <Link
                    to="/admin"
                    className="text-purple-700 hover:text-purple-800 block px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center space-x-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-700 hover:text-red-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/skill-listings"
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Skills
                  </Link>
                  <Link
                    to="/connections"
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Connections
                  </Link>
                  <Link
                    to="/messages"
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Messages
                  </Link>
                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-700 hover:text-red-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 