import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Check, X, Trash2, Star } from 'lucide-react';
import { supabase, SwapRequest, getStatusColor, getAvatarUrl } from '../lib/supabase';
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
        .from('ratings')
        .insert({
          swap_request_id: swapId,
          rater_id: user?.id,
          rated_id: ratedUserId,
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

  const filteredSwaps = swaps.filter(swap => {
    switch (activeTab) {
      case 'received':
        return swap.to_user_id === user?.id && swap.status === 'pending';
      case 'sent':
        return swap.from_user_id === user?.id && swap.status === 'pending';
      case 'completed':
        return swap.status === 'completed';
      default:
        return false;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Swaps</h1>
        <p className="text-xl text-gray-600">Manage your skill exchange requests</p>
      </div>

      {/* Tabs */}
      <div className="card p-2 mb-8">
        <div className="grid grid-cols-3 gap-2">
          {[
            { 
              key: 'received', 
              label: 'Received', 
              count: swaps.filter(s => s.to_user_id === user?.id && s.status === 'pending').length
            },
            { 
              key: 'sent', 
              label: 'Sent', 
              count: swaps.filter(s => s.from_user_id === user?.id && s.status === 'pending').length
            },
            { 
              key: 'completed', 
              label: 'Completed', 
              count: swaps.filter(s => s.status === 'completed').length
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                activeTab === tab.key ? 'bg-white bg-opacity-20' : 'bg-gray-200'
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
            <div key={swap.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <img
                    src={getAvatarUrl({ 
                      name: otherUser?.name || 'User', 
                      avatar_url: otherUser?.avatar_url 
                    } as any)}
                    alt={otherUser?.name}
                    className="avatar avatar-lg"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {isRequester ? `Request sent to ${otherUser?.name}` : `Request from ${otherUser?.name}`}
                      </h3>
                      <span className={`badge ${getStatusColor(swap.status)}`}>
                        {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-gray-700 mb-3">
                      <span className="font-semibold text-blue-600">{swap.my_skill}</span>
                      <ArrowLeftRight className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-purple-600">{swap.their_skill}</span>
                    </div>
                    
                    {swap.message && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-3">
                        <p className="text-gray-700 italic">"{swap.message}"</p>
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-500">
                      Created {new Date(swap.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 ml-4">
                  {activeTab === 'received' && swap.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateSwapStatus(swap.id, 'accepted')}
                        className="btn btn-primary"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => updateSwapStatus(swap.id, 'rejected')}
                        className="btn btn-secondary text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {activeTab === 'sent' && swap.status === 'pending' && (
                    <button
                      onClick={() => deleteSwap(swap.id)}
                      className="btn btn-secondary text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  )}

                  {activeTab === 'completed' && (
                    <button
                      onClick={() => setShowRatingModal(swap.id)}
                      className="btn btn-primary"
                    >
                      <Star className="w-4 h-4" />
                      <span>Rate</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
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

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Rate this swap</h3>
              <button
                onClick={() => setShowRatingModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
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
                  className="input"
                  placeholder="How was your experience? Any comments for improvement?"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowRatingModal(null)}
                  className="btn btn-secondary flex-1"
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
                  className="btn btn-primary flex-1"
                >
                  Submit Rating
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}