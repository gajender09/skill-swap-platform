import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, Users, ArrowLeftRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SwapRequest, AdminMessage, getFromStorage } from '../lib/mockData';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalSwaps: 0,
    pendingRequests: 0,
    completedSwaps: 0,
    averageRating: 0,
  });
  const [recentSwaps, setRecentSwaps] = useState<SwapRequest[]>([]);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = () => {
    try {
      // Fetch swap statistics
      const swaps = getFromStorage<SwapRequest[]>('swapRequests', []);
      const userSwaps = swaps.filter(swap => 
        swap.requester_id === profile?.id || swap.provider_id === profile?.id
      );

      const totalSwaps = userSwaps.length;
      const pendingRequests = userSwaps.filter(swap => swap.status === 'pending').length;
      const completedSwaps = userSwaps.filter(swap => swap.status === 'completed').length;

      // Fetch ratings
      const ratings = getFromStorage<any[]>('ratings', []);
      const userRatings = ratings.filter(rating => rating.rated_id === profile?.id);
      
      const averageRating = userRatings.length > 0 
        ? userRatings.reduce((sum, rating) => sum + rating.rating, 0) / userRatings.length 
        : 0;

      setStats({
        totalSwaps,
        pendingRequests,
        completedSwaps,
        averageRating: Math.round(averageRating * 10) / 10,
      });

      // Get recent swaps with user details
      const users = getFromStorage<any[]>('users', []);
      const skills = getFromStorage<any[]>('skills', []);
      
      const recentSwapsWithDetails = userSwaps
        .slice(0, 5)
        .map(swap => ({
          ...swap,
          requester: users.find(u => u.id === swap.requester_id),
          provider: users.find(u => u.id === swap.provider_id),
          offered_skill: skills.find(s => s.id === swap.offered_skill_id),
          requested_skill: skills.find(s => s.id === swap.requested_skill_id),
        }));

      setRecentSwaps(recentSwapsWithDetails);

      // Fetch admin messages
      const messages = getFromStorage<AdminMessage[]>('adminMessages', []);
      const activeMessages = messages
        .filter(msg => msg.is_active)
        .slice(0, 3)
        .map(msg => ({
          ...msg,
          admin: users.find(u => u.id === msg.admin_id),
        }));

      setAdminMessages(activeMessages);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {profile?.name}! 👋
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your skill swaps today.
        </p>
      </motion.div>

      {/* Admin Messages */}
      {adminMessages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <h2 className="text-xl font-semibold mb-4">📢 Platform Updates</h2>
            <div className="space-y-3">
              {adminMessages.map((message) => (
                <div key={message.id} className="bg-white/10 rounded-lg p-4">
                  <h3 className="font-medium mb-1">{message.title}</h3>
                  <p className="text-white/90 text-sm">{message.message}</p>
                  <p className="text-white/70 text-xs mt-2">
                    {new Date(message.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Swaps</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSwaps}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <ArrowLeftRight className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingRequests}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completedSwaps}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.averageRating > 0 ? stats.averageRating : '--'}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/browse"
            className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/90 transition-all duration-200 group"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Browse Skills</h3>
                <p className="text-sm text-gray-600">Find people to swap with</p>
              </div>
            </div>
          </Link>

          <Link
            to="/profile"
            className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/90 transition-all duration-200 group"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Add Skills</h3>
                <p className="text-sm text-gray-600">Update your profile</p>
              </div>
            </div>
          </Link>

          <Link
            to="/swaps"
            className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/90 transition-all duration-200 group"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <ArrowLeftRight className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">View Swaps</h3>
                <p className="text-sm text-gray-600">Manage your requests</p>
              </div>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <Link
            to="/swaps"
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
          >
            View all →
          </Link>
        </div>
        
        <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
          {recentSwaps.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentSwaps.map((swap) => (
                <div key={swap.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={
                          swap.requester_id === profile?.id
                            ? swap.provider?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(swap.provider?.name || 'User')}&background=6366f1&color=white`
                            : swap.requester?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(swap.requester?.name || 'User')}&background=6366f1&color=white`
                        }
                        alt="Avatar"
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {swap.requester_id === profile?.id
                            ? `Swap request sent to ${swap.provider?.name}`
                            : `Swap request from ${swap.requester?.name}`
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          {swap.offered_skill?.name} ↔ {swap.requested_skill?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(swap.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(swap.status)}`}>
                      {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <ArrowLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No swaps yet</h3>
              <p className="text-gray-600 mb-4">Start by browsing skills or updating your profile</p>
              <Link
                to="/browse"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Browse Skills
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}