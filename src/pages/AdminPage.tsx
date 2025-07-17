import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  ArrowLeftRight, 
  MessageSquare, 
  Ban, 
  CheckCircle,
  XCircle,
  Download,
  Send,
  Eye,
  Trash2,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react';
import { supabase, Profile, SwapRequest, Announcement } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'swaps' | 'announcements'>('overview');
  const [users, setUsers] = useState<Profile[]>([]);
  const [swaps, setSwaps] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSwaps: 0,
    completedSwaps: 0,
    pendingSwaps: 0,
    averageRating: 0
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch swaps with user details
      const { data: swapsData, error: swapsError } = await supabase
        .from('swap_requests')
        .select(`
          *,
          from_profile:profiles!swap_requests_from_user_id_fkey(name, avatar_url),
          to_profile:profiles!swap_requests_to_user_id_fkey(name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (swapsError) throw swapsError;

      // Fetch announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select(`
          *,
          creator:profiles!announcements_created_by_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (announcementsError) throw announcementsError;

      // Fetch banned users
      const { data: bannedData, error: bannedError } = await supabase
        .from('banned_users')
        .select(`
          *,
          user:profiles!banned_users_user_id_fkey(name, avatar_url),
          banned_by_user:profiles!banned_users_banned_by_fkey(name)
        `);

      if (bannedError) throw bannedError;

      setUsers(usersData || []);
      setSwaps(swapsData || []);
      setAnnouncements(announcementsData || []);
      setBannedUsers(bannedData || []);

      // Calculate stats
      const totalUsers = usersData?.length || 0;
      const activeUsers = usersData?.filter(u => u.is_public)?.length || 0;
      const totalSwaps = swapsData?.length || 0;
      const completedSwaps = swapsData?.filter(s => s.status === 'accepted')?.length || 0;
      const pendingSwaps = swapsData?.filter(s => s.status === 'pending')?.length || 0;

      // Calculate average rating
      const { data: ratingsData } = await supabase
        .from('swap_ratings')
        .select('rating');

      const averageRating = ratingsData && ratingsData.length > 0
        ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
        : 0;

      setStats({
        totalUsers,
        activeUsers,
        totalSwaps,
        completedSwaps,
        pendingSwaps,
        averageRating: Math.round(averageRating * 10) / 10
      });

    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast.error('Error loading admin data');
    } finally {
      setLoading(false);
    }
  };

  const banUser = async (userId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('banned_users')
        .insert({
          user_id: userId,
          banned_by: user?.id,
          reason: reason || 'Violation of platform policies'
        });

      if (error) throw error;

      toast.success('User banned successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('banned_users')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('User unbanned successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const createAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content || !user) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Announcement created successfully');
      setShowAnnouncementModal(false);
      setNewAnnouncement({ title: '', content: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleAnnouncement = async (announcementId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !isActive })
        .eq('id', announcementId);

      if (error) throw error;

      toast.success(`Announcement ${!isActive ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const downloadReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      stats,
      users: users.length,
      swaps: swaps.length,
      announcements: announcements.length,
      banned_users: bannedUsers.length
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skillswap-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Report downloaded successfully');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center space-x-3">
              <Shield className="w-10 h-10 text-purple-600" />
              <span>Admin Dashboard</span>
            </h1>
            <p className="text-gray-600 text-lg mt-2">Manage users, swaps, and platform content</p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={downloadReport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Download Report</span>
            </button>
            
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Send className="w-4 h-4" />
              <span>New Announcement</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                  <p className="text-sm text-green-600">{stats.activeUsers} active</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Swaps</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalSwaps}</p>
                  <p className="text-sm text-green-600">{stats.completedSwaps} completed</p>
                </div>
                <ArrowLeftRight className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Swaps</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingSwaps}</p>
                  <p className="text-sm text-yellow-600">Awaiting response</p>
                </div>
                <Activity className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '--'}
                  </p>
                  <p className="text-sm text-purple-600">Platform quality</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Announcements</p>
                  <p className="text-3xl font-bold text-gray-900">{announcements.filter(a => a.is_active).length}</p>
                  <p className="text-sm text-blue-600">Currently active</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Banned Users</p>
                  <p className="text-3xl font-bold text-gray-900">{bannedUsers.length}</p>
                  <p className="text-sm text-red-600">Policy violations</p>
                </div>
                <Ban className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 p-2 shadow-lg">
          <div className="grid grid-cols-4 gap-2">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'users', label: 'Users', icon: Users },
              { key: 'swaps', label: 'Swaps', icon: ArrowLeftRight },
              { key: 'announcements', label: 'Announcements', icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center justify-center space-x-2 px-4 py-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden shadow-lg">
          {activeTab === 'users' && (
            <div className="divide-y divide-gray-100">
              <div className="px-6 py-4 bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900">User Management</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {users.map((user) => {
                  const isBanned = bannedUsers.some(b => b.user_id === user.user_id);
                  return (
                    <div key={user.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img
                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=3b82f6&color=white`}
                            alt={user.name}
                            className="w-12 h-12 rounded-full ring-2 ring-blue-100"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900">{user.name}</h4>
                            <p className="text-sm text-gray-600">{user.location || 'No location'}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isBanned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {isBanned ? 'Banned' : 'Active'}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                {user.is_public ? 'Public' : 'Private'}
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {user.total_swaps} swaps
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => isBanned ? unbanUser(user.user_id) : banUser(user.user_id)}
                            className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                              isBanned
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            <Ban className="w-4 h-4" />
                            <span>{isBanned ? 'Unban' : 'Ban'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'swaps' && (
            <div className="divide-y divide-gray-100">
              <div className="px-6 py-4 bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900">Swap Management</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {swaps.map((swap) => (
                  <div key={swap.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {swap.from_profile?.name} → {swap.to_profile?.name}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(swap.status)}`}>
                            {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2 flex items-center space-x-2">
                          <span className="font-medium text-blue-600">{swap.my_skill}</span>
                          <ArrowLeftRight className="w-4 h-4" />
                          <span className="font-medium text-purple-600">{swap.their_skill}</span>
                        </p>
                        {swap.message && (
                          <p className="text-sm text-gray-500 italic mb-2">"{swap.message}"</p>
                        )}
                        <p className="text-xs text-gray-400">
                          Created {new Date(swap.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="divide-y divide-gray-100">
              <div className="px-6 py-4 bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900">Platform Announcements</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            announcement.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {announcement.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{announcement.content}</p>
                        <p className="text-xs text-gray-400">
                          By {announcement.creator?.name} on {new Date(announcement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => toggleAnnouncement(announcement.id, announcement.is_active)}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          announcement.is_active
                            ? 'bg-gray-600 text-white hover:bg-gray-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        <span>{announcement.is_active ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Create Announcement</h3>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Your announcement message to all users"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createAnnouncement}
                  disabled={!newAnnouncement.title || !newAnnouncement.content}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  Create Announcement
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}