import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Users, MessageSquare, Star, ArrowRight, Code, Camera, Palette, Music } from 'lucide-react';

const Home: React.FC = () => {
  const { currentUser } = useAuth();

  const features = [
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Find Skill Partners',
      description: 'Connect with people who have the skills you want to learn and vice versa.'
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: 'Direct Messaging',
      description: 'Communicate directly with potential skill exchange partners.'
    },
    {
      icon: <Star className="h-8 w-8" />,
      title: 'Verified Profiles',
      description: 'Build trust with verified user profiles and skill ratings.'
    }
  ];

  const skillCategories = [
    { icon: <Code className="h-6 w-6" />, name: 'Programming', color: 'bg-blue-100 text-blue-600' },
    { icon: <Camera className="h-6 w-6" />, name: 'Photography', color: 'bg-purple-100 text-purple-600' },
    { icon: <Palette className="h-6 w-6" />, name: 'Design', color: 'bg-pink-100 text-pink-600' },
    { icon: <Music className="h-6 w-6" />, name: 'Music', color: 'bg-green-100 text-green-600' },
  ];

  return (
    <div className="min-h-screen w-full bg-white relative overflow-x-hidden font-sans">
      {/* Responsive blue/green accent shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[40vw] h-[40vw] max-w-xs max-h-xs bg-gradient-to-br from-blue-200 to-green-100 opacity-30 rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-0 w-[45vw] h-[45vw] max-w-sm max-h-sm bg-gradient-to-tr from-green-200 to-blue-100 opacity-30 rounded-full blur-2xl" />
      </div>
      <div className="relative z-10 space-y-16 sm:space-y-24 pb-16 sm:pb-24 w-full max-w-full">
        {/* Hero Section */}
        <section className="pt-12 sm:pt-20 pb-10 sm:pb-16 flex flex-col-reverse lg:flex-row items-center justify-between max-w-7xl mx-auto px-4 gap-8 w-full">
          {/* Left: Text/CTA */}
          <div className="flex-1 flex flex-col items-start justify-center text-left space-y-6 sm:space-y-8 order-2 lg:order-1 w-full max-w-full">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
              Exchange Skills, <span className="text-blue-600">Grow Together</span>
            </h1>
            <p className="text-base sm:text-lg md:text-2xl text-gray-600 max-w-xl">
              Connect with people who have skills you want to learn. Share your expertise and learn from others in a collaborative community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full sm:w-auto">
              {currentUser ? (
                <Link to="/dashboard" className="w-full sm:w-auto text-center px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-blue-600 text-white font-bold text-base sm:text-lg shadow hover:bg-blue-700 transition-all">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="w-full sm:w-auto text-center px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-blue-600 text-white font-bold text-base sm:text-lg shadow hover:bg-blue-700 transition-all">
                    Get Started
                  </Link>
                  <Link to="/login" className="w-full sm:w-auto text-center px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-white text-blue-600 font-bold text-base sm:text-lg shadow border border-blue-200 hover:bg-blue-50 transition-all">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
          {/* Right: Illustration/Blob */}
          <div className="flex-1 flex items-center justify-center w-full lg:w-auto mb-8 lg:mb-0 order-1 lg:order-2">
            <div className="relative w-48 h-48 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center max-w-full max-h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-green-100 to-white rounded-full blur-2xl opacity-80" />
              <BookOpen className="h-20 w-20 sm:h-32 sm:w-32 md:h-40 md:w-40 text-blue-500 z-10 relative drop-shadow-xl" />
            </div>
          </div>
        </section>
        {/* Features Section */}
        <section className="py-8 sm:py-10">
          <div className="max-w-6xl mx-auto px-4 w-full">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-8 sm:mb-12 tracking-tight">Why Choose SkillSwap?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 w-full">
              {features.map((feature, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 text-center p-6 sm:p-8 group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 w-full">
                  <div className="flex justify-center mb-6">
                    <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-green-100 text-blue-600 shadow p-4 group-hover:scale-110 group-hover:shadow-xl transition-all">
                      {feature.icon}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 tracking-wide">{feature.title}</h3>
                  <p className="text-gray-600 text-sm sm:text-base font-medium">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Skill Categories */}
        <section className="py-8 sm:py-10">
          <div className="max-w-6xl mx-auto px-4 w-full">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-8 sm:mb-12 tracking-tight">Popular Skill Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full">
              {skillCategories.map((category, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl shadow border border-blue-100 text-center p-6 sm:p-8 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 w-full">
                  <div className={`flex justify-center mb-4 p-4 rounded-full shadow bg-gradient-to-br from-blue-100 to-green-100 text-blue-600 text-2xl sm:text-3xl`}>{category.icon}</div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-wide">{category.name}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section className="py-10 sm:py-16 bg-gradient-to-r from-blue-600 to-green-400 relative w-full">
          <div className="absolute inset-0 bg-white/10 backdrop-blur rounded-2xl" />
          <div className="max-w-4xl mx-auto text-center px-4 relative z-10 w-full">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 text-white drop-shadow-lg">Ready to Start Your Skill Exchange Journey?</h2>
            <p className="text-base sm:text-xl mb-6 sm:mb-8 text-white/90 font-medium">Join thousands of learners and teachers in our growing community.</p>
            {!currentUser && (
              <Link to="/register" className="inline-flex items-center space-x-2 px-6 sm:px-10 py-3 sm:py-4 rounded-full bg-white text-blue-600 font-bold text-base sm:text-lg shadow-lg hover:bg-blue-50 hover:scale-105 hover:shadow-2xl transition-all">
                <span>Join Now</span>
                <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home; 