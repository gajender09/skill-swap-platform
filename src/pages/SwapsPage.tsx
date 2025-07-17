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
  User
} from 'lucide-react';
import { SwapRequest, getFromStorage, setToStorage, generateId } from '../lib/mockData';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function SwapsPage() {
  const { profile } = useAuth();
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'completed'>('received');
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (profile) {
      fetchSwaps();
    }
  }, [profile]);

  const fetchSwaps = () => {
    try {
      const swapRequests = getFromStorage<SwapRequest[]>('swapRequests', []);
      const users = getFromStorage<any[]>('users', []);
      const skills = getFromStorage<any[]>('skills', []);

      const userSwaps = swapRequests
        .filter(swap => 
          swap.requester_id === profile?.id || swap.provider_id === profile?.id
        )
        .map(swap => ({
          ...swap,
          requester: users.find(u => u.id === swap.requester_id),
          provider: users.find(u => u.id === swap.provider_id),
          offered_skill: skills.find(s => s.id === swap.offered_skill_id),
          requested_skill: skills.find(s => s.id === swap.requested_skill_id),
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setSwaps(userSwaps);
    } catch (error: any) {
      console.error('Error fetching swaps:', error);
      toast.error('Error loading swaps');
    } finally {
      setLoading(false);
    }
  };

  const updateSwapStatus = (swapId: string, status: string) => {
    try {
      const swapRequests = getFromStorage<SwapRequest[]>('swapRequests', []);
      const updatedSwaps = swapRequests.map(swap => 
        swap.id === swapId 
          ? { ...swap, status, updated_at: new Date().toISOString() }
          : swap
      );
      
      setToStorage('swapRequests', updatedSwaps);
      toast.success(`Swap ${status} successfully!`);
      fetchSwaps();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteSwap = (swapId: string) => {
    try {
      const swapRequests = getFromStorage<SwapRequest[]>('swapRequests', []);
      const updatedSwaps = swapRequests.filter(swap => swap.id !== swapId);
      
      setToStorage('swapRequests', updatedSwaps);
      toast.success('Swap request deleted successfully!');
      fetchSwaps();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const submitRating = (swapId: string, ratedUserId: string) => {
    try {
      const ratings = getFromStorage<any[]>('ratings', []);
      const newRating = {
        id: generateId(),
        swap_request_id: swapId,
        rater_id: profile?.id,
        rated_id: ratedUserId,
        rating,
        feedback,
        created_at: new Date().toISOString(),
      };

      setToStorage('ratings', [...ratings, newRating]);
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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSwaps = swaps.filter(swap => {
    switch (activeTab) {
      case 'received':
        return swap.provider_id === profile?.id && ['pending', 'accepted'].includes(swap.status);
      case 'sent':
        return swap.requester_id === profile?.id && ['pending', 'accepted'].includes(swap.status);
      case 'completed':
        return swap.status === 'completed';
      default:
        return false;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Swaps</h1>
          <p className="text-gray-600">Manage your skill swap requests and exchanges</p>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-white/20 p-1">
          <div className="grid grid-cols-3 gap-1">
            {[
              { key: 'received', label: 'Received', count: swaps.filter(s => s.provider_id === profile?.id && ['pending', 'accepted'].includes(s.status)).length },
              { key: 'sent', label: 'Sent', count: swaps.filter(s => s.requester_id === profile?.id && ['pending', 'accepted'].includes(s.status)).length },
              { key: 'completed', label: 'Completed', count: swaps.filter(s => s.status === 'completed').length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
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
            const isRequester = swap.requester_id === profile?.id;
            const otherUser = isRequester ? swap.provider : swap.requester;
            
            return (
              <motion.div
                key={swap.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <img
                      src={otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.name || 'User')}&background=6366f1&color=white`}
                      alt={otherUser?.name}
                      className="w-12 h-12 rounded-full"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {isRequester ? `Request sent to ${otherUser?.name}` : `Request from ${otherUser?.name}`}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(swap.status)}`}>
                          {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <span className="font-medium">{swap.offered_skill?.name}</span>
                        <ArrowLeftRight className="w-4 h-4" />
                        <span className="font-medium">{swap.requested_skill?.name}</span>
                      </div>
                      
                      {swap.message && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-700">{swap.message}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Created {new Date(swap.created_at).toLocaleDateString()}</span>
                        </div>
                        {swap.updated_at !== swap.created_at && (
                          <div className="flex items-center space-x-1">
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
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <Check className="w-3 h-3" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => updateSwapStatus(swap.id, 'rejected')}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          <X className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {swap.status === 'accepted' && (
                      <button
                        onClick={() => updateSwapStatus(swap.id, 'completed')}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark Complete</span>
                      </button>
                    )}

                    {activeTab === 'sent' && swap.status === 'pending' && (
                      <button
                        onClick={() => deleteSwap(swap.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    )}

                    {activeTab === 'completed' && (
                      <button
                        onClick={() => setShowRatingModal(swap.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        <Star className="w-3 h-3" />
                        <span>Rate</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredSwaps.length === 0 && (
            <div className="text-center py-12">
              <ArrowLeftRight className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeTab} swaps
              </h3>
              <p className="text-gray-600">
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
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Rate this swap</h3>
              <button
                onClick={() => setShowRatingModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating (1-5 stars)
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-1 ${star <= rating ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors`}
                    >
                      <Star className="w-6 h-6 fill-current" />
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
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="How was your experience? Any comments for improvement?"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowRatingModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const swap = swaps.find(s => s.id === showRatingModal);
                    if (swap) {
                      const otherUserId = swap.requester_id === profile?.id ? swap.provider_id : swap.requester_id;
                      submitRating(swap.id, otherUserId);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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