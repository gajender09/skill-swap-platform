import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, Users, ArrowLeftRight, Star } from 'lucide-react';
import { supabase, SwapRequest, getStatusColor } from '../lib/supabase';
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
      const completedSwaps = swaps?.filter(swap => swap.status === 'completed').length || 0;

      setStats({
        totalSwaps,
        pendingRequests,
        completedSwaps,
        averageRating: profile?.rating_avg || 0,
      });

      setRecentSwaps(swaps?.slice(0, 5) || []);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {profile?.name}! 👋
        </h1>
        <p className="text-gray-600 text-lg">
          Ready to share your skills and learn something new today?
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Swaps</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSwaps}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ArrowLeftRight className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingRequests}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
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

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rating</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '--'}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/browse" className="card p-6 hover:shadow-lg transition-all">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-blue-100 rounded-lg">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Browse Skills</h3>
                <p className="text-gray-600">Find people to swap with</p>
              </div>
            </div>
          </Link>

          <Link to="/profile" className="card p-6 hover:shadow-lg transition-all">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-purple-100 rounded-lg">
                <Plus className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Update Profile</h3>
                <p className="text-gray-600">Add or edit your skills</p>
              </div>
            </div>
          </Link>

          <Link to="/swaps" className="card p-6 hover:shadow-lg transition-all">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-green-100 rounded-lg">
                <ArrowLeftRight className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Manage Swaps</h3>
                <p className="text-gray-600">View your requests</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
          <Link to="/swaps" className="text-blue-600 hover:text-blue-700 font-medium">
            View all
          </Link>
        </div>
        
        <div className="card overflow-hidden">
          {recentSwaps.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {recentSwaps.map((swap) => (
                <div key={swap.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {swap.from_user_id === user?.id
                            ? `Request sent to ${swap.to_profile?.name}`
                            : `Request from ${swap.from_profile?.name}`
                          }
                        </p>
                        <p className="text-gray-600 flex items-center space-x-2">
                          <span className="font-medium">{swap.my_skill}</span>
                          <ArrowLeftRight className="w-4 h-4" />
                          <span className="font-medium">{swap.their_skill}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(swap.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${getStatusColor(swap.status)}`}>
                      {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <ArrowLeftRight className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No activity yet</h3>
              <p className="text-gray-600 mb-6">Start by browsing skills or updating your profile</p>
              <Link to="/browse" className="btn btn-primary">
                Browse Skills
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}