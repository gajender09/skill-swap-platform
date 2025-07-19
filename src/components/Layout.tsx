import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Search, 
  ArrowLeftRight, 
  User, 
  LogOut, 
  Shield,
  Bell,
  Menu,
  X,
  Settings,
  MessageSquare,
  Sparkles,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Browse Skills', href: '/browse', icon: Search },
    { name: 'My Swaps', href: '/swaps', icon: ArrowLeftRight },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  if (isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: Shield });
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="parallax-bg">
        <div className="parallax-layer"></div>
      </div>
      
      {/* Navigation */}
      <nav className="nav-glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-3">
                <div className="w-12 h-12 btn-3d rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-90"></div>
                  <Sparkles className="w-7 h-7 text-white relative z-10" />
                </div>
                <span className="text-2xl font-bold gradient-text">
                  SkillSwap
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                      isActive
                        ? 'glass-strong text-white shadow-lg'
                        : 'text-white/80 hover:text-white hover:glass'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl"></div>
                    )}
                    <item.icon className="w-4 h-4" />
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button className="relative p-3 glass rounded-xl hover:glass-strong transition-all duration-300 group">
                <Bell className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
                <span className="notification-badge absolute -top-1 -right-1 w-3 h-3 rounded-full"></span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 glass rounded-xl hover:glass-strong transition-all duration-300"
                >
                  <img
                    src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=3b82f6&color=white`}
                    alt={profile?.name}
                    className="w-8 h-8 rounded-full avatar-3d"
                  />
                  <span className="text-sm font-medium text-white">{profile?.name}</span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-48 modal-3d rounded-xl py-2"
                    >
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-white/80 hover:text-white hover:glass transition-all"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-white/80 hover:text-white hover:glass transition-all"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                      <hr className="my-2 border-white/20" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:glass w-full text-left transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl glass hover:glass-strong transition-all duration-300"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden py-4 border-t border-white/20"
              >
                <div className="space-y-2">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                          isActive
                            ? 'glass-strong text-white'
                            : 'text-white/80 hover:text-white hover:glass'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                  
                  <div className="pt-4 mt-4 border-t border-white/20">
                    <div className="flex items-center space-x-3 px-4 py-2">
                      <img
                        src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=3b82f6&color=white`}
                        alt={profile?.name}
                        className="w-8 h-8 rounded-full avatar-3d"
                      />
                      <span className="text-sm font-medium text-white">{profile?.name}</span>
                    </div>
                    
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-3 px-4 py-3 w-full text-left text-sm font-medium text-red-400 hover:text-red-300 hover:glass rounded-xl transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        {children}
      </main>
    </div>
  );
}