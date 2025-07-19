import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, Users, ArrowLeftRight, Star, MessageSquare, Calendar, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase, SwapRequest, Announcement } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalSwaps: number;
  pendingRequests: number;
  completedSwaps: number;
  averageRating: number;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSwaps: 0,
    pendingRequests: 0,
    completedSwaps: 0,
    averageRating: 0,
  });
  const [recentSwaps, setRecentSwaps] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch swap statistics
      const { data: swaps, error: swapsError } = await supabase
        .from('swap_requests')
        .select(`
          *,
          from_profile:profiles!swap_requests_from_user_id_fkey(name, avatar_url),
          to_profile:profiles!swap_requests_to_user_id_fkey(name, avatar_url)
        `)
        .or(`from_user_id.eq.${user?.id},to_user_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (swapsError) throw swapsError;

      const totalSwaps = swaps?.length || 0;
      const pendingRequests = swaps?.filter(swap => swap.status === 'pending').length || 0;
      const completedSwaps = swaps?.filter(swap => swap.status === 'accepted').length || 0;

      // Fetch user ratings
      const { data: ratings, error: ratingsError } = await supabase
        .from('swap_ratings')
        .select('rating')
        .eq('rated_user_id', user?.id);

      if (ratingsError) throw ratingsError;

      const averageRating = ratings && ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      setStats({
        totalSwaps,
        pendingRequests,
        completedSwaps,
        averageRating: Math.round(averageRating * 10) / 10,
      });

      setRecentSwaps(swaps?.slice(0, 5) || []);

      // Fetch announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select(`
          *,
          creator:profiles!announcements_created_by_fkey(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (announcementsError) throw announcementsError;

      setAnnouncements(announcementsData || []);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="card-3d rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90"></div>
          <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between">
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {profile?.name}! 👋
              </h1>
              <p className="text-white/90 text-lg">
                Ready to share your skills and learn something new today?
              </p>
            </div>
            <div className="hidden md:block relative z-10">
              <div className="w-32 h-32 glass rounded-full flex items-center justify-center float">
                <ArrowLeftRight className="w-16 h-16 text-white/90" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="card-3d rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <MessageSquare className="w-5 h-5 text-white/80" />
              <h2 className="text-xl font-semibold text-white">Platform Updates</h2>
            </div>
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="p-4 glass rounded-xl">
                  <h3 className="font-medium text-white mb-1">{announcement.title}</h3>
                  <p className="text-white/80 text-sm mb-2">{announcement.content}</p>
                  <p className="text-white/60 text-xs">
                    {new Date(announcement.created_at).toLocaleDateString()}
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
        <div className="card-3d rounded-2xl p-6 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">Total Swaps</p>
              <p className="text-3xl font-bold text-white">{stats.totalSwaps}</p>
              <p className="text-xs text-green-400 mt-1">All time</p>
            </div>
            <div className="p-3 glass rounded-2xl group-hover:scale-110 transition-transform">
              <ArrowLeftRight className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card-3d rounded-2xl p-6 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">Pending</p>
              <p className="text-3xl font-bold text-white">{stats.pendingRequests}</p>
              <p className="text-xs text-yellow-400 mt-1">Awaiting response</p>
            </div>
            <div className="p-3 glass rounded-2xl group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="card-3d rounded-2xl p-6 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">Completed</p>
              <p className="text-3xl font-bold text-white">{stats.completedSwaps}</p>
              <p className="text-xs text-green-400 mt-1">Successfully done</p>
            </div>
            <div className="p-3 glass rounded-2xl group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="card-3d rounded-2xl p-6 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">Rating</p>
              <p className="text-3xl font-bold text-white">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '--'}
              </p>
              <p className="text-xs text-purple-400 mt-1">Average score</p>
            </div>
            <div className="p-3 glass rounded-2xl group-hover:scale-110 transition-transform">
              <Star className="w-6 h-6 text-purple-400" />
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
        <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/browse"
            className="group card-3d rounded-2xl p-6 transition-all duration-300"
          >
            <div className="flex items-center space-x-4">
              <div className="p-4 glass rounded-2xl group-hover:glass-strong transition-all">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Browse Skills</h3>
                <p className="text-white/70">Find people to swap with</p>
              </div>
            </div>
          </Link>

          <Link
            to="/profile"
            className="group card-3d rounded-2xl p-6 transition-all duration-300"
          >
            <div className="flex items-center space-x-4">
              <div className="p-4 glass rounded-2xl group-hover:glass-strong transition-all">
                <Plus className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Update Profile</h3>
                <p className="text-white/70">Add or edit your skills</p>
              </div>
            </div>
          </Link>

          <Link
            to="/swaps"
            className="group card-3d rounded-2xl p-6 transition-all duration-300"
          >
            <div className="flex items-center space-x-4">
              <div className="p-4 glass rounded-2xl group-hover:glass-strong transition-all">
                <ArrowLeftRight className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Manage Swaps</h3>
                <p className="text-white/70">View your requests</p>
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
          <Link
            to="/swaps"
            className="text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1 transition-colors"
          >
            <span>View all</span>
            <ArrowLeftRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="card-3d rounded-2xl overflow-hidden">
          {recentSwaps.length > 0 ? (
            <div className="divide-y divide-white/10">
              {recentSwaps.map((swap) => (
                <div key={swap.id} className="p-6 hover:glass transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={
                          swap.from_user_id === user?.id
                            ? swap.to_profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(swap.to_profile?.name || 'User')}&background=3b82f6&color=white`
                            : swap.from_profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(swap.from_profile?.name || 'User')}&background=3b82f6&color=white`
                        }
                        alt="Avatar"
                        className="w-12 h-12 rounded-full avatar-3d"
                      />
                      <div>
                        <p className="font-medium text-white">
                          {swap.from_user_id === user?.id
                            ? `Request sent to ${swap.to_profile?.name}`
                            : `Request from ${swap.from_profile?.name}`
                          }
                        </p>
                        <p className="text-white/70 flex items-center space-x-2">
                          <span className="font-medium">{swap.my_skill}</span>
                          <ArrowLeftRight className="w-4 h-4" />
                          <span className="font-medium">{swap.their_skill}</span>
                        </p>
                        <p className="text-sm text-white/50">
                          {new Date(swap.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(swap.status)}`}>
                      {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <ArrowLeftRight className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No activity yet</h3>
              <p className="text-white/70 mb-6">Start by browsing skills or updating your profile</p>
              <Link
                to="/browse"
                className="inline-flex items-center px-6 py-3 btn-3d text-white text-base font-medium rounded-xl transition-all duration-300"
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