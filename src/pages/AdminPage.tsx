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
  Trash2
} from 'lucide-react';
import { 
  Profile, 
  SwapRequest, 
  Skill, 
  AdminMessage,
  getFromStorage,
  setToStorage,
  generateId
} from '../lib/mockData';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'swaps' | 'skills' | 'messages'>('users');
  const [users, setUsers] = useState<Profile[]>([]);
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState({ title: '', message: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    try {
      setLoading(true);

      // Fetch users
      const usersData = getFromStorage<Profile[]>('users', []);
      setUsers(usersData);

      // Fetch swaps with user details
      const swapsData = getFromStorage<SwapRequest[]>('swapRequests', []);
      const skillsData = getFromStorage<Skill[]>('skills', []);
      
      const swapsWithDetails = swapsData.map(swap => ({
        ...swap,
        requester: usersData.find(u => u.id === swap.requester_id),
        provider: usersData.find(u => u.id === swap.provider_id),
        offered_skill: skillsData.find(s => s.id === swap.offered_skill_id),
        requested_skill: skillsData.find(s => s.id === swap.requested_skill_id),
      }));
      setSwaps(swapsWithDetails);

      // Fetch skills
      setSkills(skillsData);

      // Fetch admin messages
      const messagesData = getFromStorage<AdminMessage[]>('adminMessages', []);
      const messagesWithAdmin = messagesData.map(msg => ({
        ...msg,
        admin: usersData.find(u => u.id === msg.admin_id),
      }));
      setAdminMessages(messagesWithAdmin);

    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast.error('Error loading admin data');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserBan = (userId: string, currentBanStatus: boolean) => {
    try {
      const usersData = getFromStorage<Profile[]>('users', []);
      const updatedUsers = usersData.map(user => 
        user.id === userId 
          ? { ...user, is_banned: !currentBanStatus }
          : user
      );
      
      setToStorage('users', updatedUsers);
      toast.success(`User ${!currentBanStatus ? 'banned' : 'unbanned'} successfully`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const approveSkill = (skillId: string, approved: boolean) => {
    try {
      const skillsData = getFromStorage<Skill[]>('skills', []);
      const updatedSkills = skillsData.map(skill => 
        skill.id === skillId 
          ? { ...skill, is_approved: approved }
          : skill
      );
      
      setToStorage('skills', updatedSkills);
      toast.success(`Skill ${approved ? 'approved' : 'rejected'} successfully`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const sendAdminMessage = () => {
    if (!newMessage.title || !newMessage.message || !profile) return;

    try {
      const messagesData = getFromStorage<AdminMessage[]>('adminMessages', []);
      const newMsg = {
        id: generateId(),
        admin_id: profile.id,
        title: newMessage.title,
        message: newMessage.message,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      
      setToStorage('adminMessages', [...messagesData, newMsg]);
      toast.success('Message sent successfully');
      setShowMessageModal(false);
      setNewMessage({ title: '', message: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleMessage = (messageId: string, currentStatus: boolean) => {
    try {
      const messagesData = getFromStorage<AdminMessage[]>('adminMessages', []);
      const updatedMessages = messagesData.map(msg => 
        msg.id === messageId 
          ? { ...msg, is_active: !currentStatus }
          : msg
      );
      
      setToStorage('adminMessages', updatedMessages);
      toast.success(`Message ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const downloadReport = () => {
    const data = {
      users: users.length,
      activeUsers: users.filter(u => !u.is_banned).length,
      bannedUsers: users.filter(u => u.is_banned).length,
      totalSwaps: swaps.length,
      pendingSwaps: swaps.filter(s => s.status === 'pending').length,
      completedSwaps: swaps.filter(s => s.status === 'completed').length,
      skills: skills.length,
      approvedSkills: skills.filter(s => s.is_approved).length,
      pendingSkills: skills.filter(s => !s.is_approved).length,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
              <Shield className="w-8 h-8 text-purple-600" />
              <span>Admin Dashboard</span>
            </h1>
            <p className="text-gray-600 mt-2">Manage users, swaps, and platform content</p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={downloadReport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Report</span>
            </button>
            
            <button
              onClick={() => setShowMessageModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Swaps</p>
                <p className="text-2xl font-bold text-gray-900">{swaps.length}</p>
              </div>
              <ArrowLeftRight className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Skills</p>
                <p className="text-2xl font-bold text-gray-900">{skills.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Messages</p>
                <p className="text-2xl font-bold text-gray-900">{adminMessages.filter(m => m.is_active).length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-white/20 p-1">
          <div className="grid grid-cols-4 gap-1">
            {[
              { key: 'users', label: 'Users', icon: Users },
              { key: 'swaps', label: 'Swaps', icon: ArrowLeftRight },
              { key: 'skills', label: 'Skills', icon: CheckCircle },
              { key: 'messages', label: 'Messages', icon: MessageSquare },
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
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
          {activeTab === 'users' && (
            <div className="divide-y divide-gray-200">
              <div className="px-6 py-4 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">User Management</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {users.map((user) => (
                  <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img
                          src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=white`}
                          alt={user.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-600">{user.location || 'No location'}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.is_banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {user.is_banned ? 'Banned' : 'Active'}
                            </span>
                            {user.is_admin && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                Admin
                              </span>
                            )}
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                              {user.is_public ? 'Public' : 'Private'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => toggleUserBan(user.id, user.is_banned)}
                          className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            user.is_banned
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          <Ban className="w-3 h-3" />
                          <span>{user.is_banned ? 'Unban' : 'Ban'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'swaps' && (
            <div className="divide-y divide-gray-200">
              <div className="px-6 py-4 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Swap Management</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {swaps.map((swap) => (
                  <div key={swap.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {swap.requester?.name} → {swap.provider?.name}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(swap.status)}`}>
                            {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {swap.offered_skill?.name} ↔ {swap.requested_skill?.name}
                        </p>
                        {swap.message && (
                          <p className="text-sm text-gray-500 italic">"{swap.message}"</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Created {new Date(swap.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="divide-y divide-gray-200">
              <div className="px-6 py-4 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Skill Management</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {skills.map((skill) => (
                  <div key={skill.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{skill.name}</h4>
                        <p className="text-sm text-gray-600">{skill.category}</p>
                        <p className="text-xs text-gray-400">
                          Added {new Date(skill.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          skill.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {skill.is_approved ? 'Approved' : 'Pending'}
                        </span>
                        
                        {!skill.is_approved && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => approveSkill(skill.id, true)}
                              className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => approveSkill(skill.id, false)}
                              className="flex items-center space-x-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="divide-y divide-gray-200">
              <div className="px-6 py-4 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Platform Messages</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {adminMessages.map((message) => (
                  <div key={message.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{message.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            message.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {message.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{message.message}</p>
                        <p className="text-xs text-gray-400">
                          By {message.admin?.name} on {new Date(message.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => toggleMessage(message.id, message.is_active)}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          message.is_active
                            ? 'bg-gray-600 text-white hover:bg-gray-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>{message.is_active ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Send Platform Message</h3>
              <button
                onClick={() => setShowMessageModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
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
                  value={newMessage.title}
                  onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Message title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Your message to all users"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendAdminMessage}
                  disabled={!newMessage.title || !newMessage.message}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send Message
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}