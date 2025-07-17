import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeftRight, 
  Clock, 
  Check, 
  X, 
  Trash2, 
  Star,
  MessageSquare,
  User,
  Calendar,
  Award
} from 'lucide-react';
import { supabase, SwapRequest } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ExtendedSwapRequest extends SwapRequest {
  from_profile?: { name: string; avatar_url?: string };
  to_profile?: { name: string; avatar_url?: string };
}

export default function SwapsPage() {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState<ExtendedSwapRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'completed'>('received');
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (user) {
      fetchSwaps();
    }
  }, [user]);

  const fetchSwaps = async () => {
    try {
      const { data, error } = await supabase
        .from('swap_requests')
        .select(`
          *,
          from_profile:profiles!swap_requests_from_user_id_fkey(name, avatar_url),
          to_profile:profiles!swap_requests_to_user_id_fkey(name, avatar_url)
        `)
        .or(`from_user_id.eq.${user?.id},to_user_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSwaps(data || []);
    } catch (error: any) {
      console.error('Error fetching swaps:', error);
      toast.error('Error loading swaps');
    } finally {
      setLoading(false);
    }
  };

  const updateSwapStatus = async (swapId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('swap_requests')
        .update({ status })
        .eq('id', swapId);

      if (error) throw error;

      toast.success(`Swap ${status} successfully!`);
      fetchSwaps();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteSwap = async (swapId: string) => {
    try {
      const { error } = await supabase
        .from('swap_requests')
        .delete()
        .eq('id', swapId);

      if (error) throw error;

      toast.success('Swap request deleted successfully!');
      fetchSwaps();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const submitRating = async (swapId: string, ratedUserId: string) => {
    try {
      const { error } = await supabase
        .from('swap_ratings')
        .insert({
          swap_request_id: swapId,
          rater_user_id: user?.id,
          rated_user_id: ratedUserId,
          rating,
          feedback,
        });

      if (error) throw error;

      toast.success('Rating submitted successfully!');
      setShowRatingModal(null);
      setRating(5);
      setFeedback('');
      fetchSwaps();
    } catch (error: any) {
      toast.error(error.message);
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

  const filteredSwaps = swaps.filter(swap => {
    switch (activeTab) {
      case 'received':
        return swap.to_user_id === user?.id && swap.status === 'pending';
      case 'sent':
        return swap.from_user_id === user?.id && swap.status === 'pending';
      case 'completed':
        return swap.status === 'accepted';
      default:
        return false;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">My Swaps</h1>
          <p className="text-xl text-gray-600">Manage your skill exchange requests</p>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 p-2 shadow-lg">
          <div className="grid grid-cols-3 gap-2">
            {[
              { 
                key: 'received', 
                label: 'Received', 
                count: swaps.filter(s => s.to_user_id === user?.id && s.status === 'pending').length,
                icon: MessageSquare
              },
              { 
                key: 'sent', 
                label: 'Sent', 
                count: swaps.filter(s => s.from_user_id === user?.id && s.status === 'pending').length,
                icon: ArrowLeftRight
              },
              { 
                key: 'completed', 
                label: 'Completed', 
                count: swaps.filter(s => s.status === 'accepted').length,
                icon: Award
              },
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
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  activeTab === tab.key ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Swaps List */}
        <div className="space-y-4">
          {filteredSwaps.map((swap) => {
            const isRequester = swap.from_user_id === user?.id;
            const otherUser = isRequester ? swap.to_profile : swap.from_profile;
            
            return (
              <motion.div
                key={swap.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <img
                      src={otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.name || 'User')}&background=3b82f6&color=white`}
                      alt={otherUser?.name}
                      className="w-16 h-16 rounded-full ring-2 ring-blue-100"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="font-bold text-gray-900 text-lg">
                          {isRequester ? `Request sent to ${otherUser?.name}` : `Request from ${otherUser?.name}`}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(swap.status)}`}>
                          {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-gray-700 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-blue-600">{swap.my_skill}</span>
                          <ArrowLeftRight className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-purple-600">{swap.their_skill}</span>
                        </div>
                      </div>
                      
                      {swap.message && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-3">
                          <p className="text-gray-700 italic">"{swap.message}"</p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created {new Date(swap.created_at).toLocaleDateString()}</span>
                        </div>
                        {swap.updated_at !== swap.created_at && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Updated {new Date(swap.updated_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {activeTab === 'received' && swap.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateSwapStatus(swap.id, 'accepted')}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-lg"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => updateSwapStatus(swap.id, 'rejected')}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-lg"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {activeTab === 'sent' && swap.status === 'pending' && (
                      <button
                        onClick={() => deleteSwap(swap.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    )}

                    {activeTab === 'completed' && (
                      <button
                        onClick={() => setShowRatingModal(swap.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all font-medium shadow-lg"
                      >
                        <Star className="w-4 h-4" />
                        <span>Rate</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredSwaps.length === 0 && (
            <div className="text-center py-16">
              <ArrowLeftRight className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-medium text-gray-900 mb-2">
                No {activeTab} swaps
              </h3>
              <p className="text-gray-600 text-lg">
                {activeTab === 'received' && "You haven't received any swap requests yet."}
                {activeTab === 'sent' && "You haven't sent any swap requests yet."}
                {activeTab === 'completed' && "You haven't completed any swaps yet."}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Rate this swap</h3>
              <button
                onClick={() => setShowRatingModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rating (1-5 stars)
                </label>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-2 transition-colors ${star <= rating ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500`}
                    >
                      <Star className="w-8 h-8 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="How was your experience? Any comments for improvement?"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowRatingModal(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const swap = swaps.find(s => s.id === showRatingModal);
                    if (swap) {
                      const otherUserId = swap.from_user_id === user?.id ? swap.to_user_id : swap.from_user_id;
                      submitRating(swap.id, otherUserId);
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
                >
                  Submit Rating
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}