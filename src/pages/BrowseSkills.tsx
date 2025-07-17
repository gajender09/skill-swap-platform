import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Clock, 
  ArrowLeftRight,
  User,
  MessageSquare
} from 'lucide-react';
import { 
  Profile, 
  UserSkillOffered, 
  UserSkillWanted, 
  Skill,
  getFromStorage,
  setToStorage,
  generateId
} from '../lib/mockData';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface UserWithSkills extends Profile {
  offered_skills: (UserSkillOffered & { skill: Skill })[];
  wanted_skills: (UserSkillWanted & { skill: Skill })[];
  average_rating?: number;
  total_swaps?: number;
}

export default function BrowseSkills() {
  const { profile: currentProfile } = useAuth();
  const [users, setUsers] = useState<UserWithSkills[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithSkills[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [showRequestModal, setShowRequestModal] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [selectedOfferedSkill, setSelectedOfferedSkill] = useState('');
  const [selectedRequestedSkill, setSelectedRequestedSkill] = useState('');
  const [currentUserOfferedSkills, setCurrentUserOfferedSkills] = useState<UserSkillOffered[]>([]);

  useEffect(() => {
    if (currentProfile) {
      fetchData();
    }
  }, [currentProfile]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedCategory, selectedSkill]);

  const fetchData = () => {
    try {
      // Fetch skills
      const skillsData = getFromStorage<Skill[]>('skills', []);
      setSkills(skillsData.filter(skill => skill.is_approved));

      // Fetch users
      const usersData = getFromStorage<Profile[]>('users', []);
      const offeredSkillsData = getFromStorage<UserSkillOffered[]>('userSkillsOffered', []);
      const wantedSkillsData = getFromStorage<UserSkillWanted[]>('userSkillsWanted', []);
      const ratingsData = getFromStorage<any[]>('ratings', []);
      const swapsData = getFromStorage<any[]>('swapRequests', []);

      // Get current user's offered skills for the modal
      const currentUserOffered = offeredSkillsData
        .filter(skill => skill.user_id === currentProfile?.id)
        .map(skill => ({
          ...skill,
          skill: skillsData.find(s => s.id === skill.skill_id),
        }));
      setCurrentUserOfferedSkills(currentUserOffered);

      // Filter out current user and banned users
      const publicUsers = usersData.filter(user => 
        user.is_public && 
        !user.is_banned && 
        user.id !== currentProfile?.id
      );

      // Combine user data with skills and ratings
      const usersWithSkills = publicUsers.map(user => {
        const userOfferedSkills = offeredSkillsData
          .filter(skill => skill.user_id === user.id)
          .map(skill => ({
            ...skill,
            skill: skillsData.find(s => s.id === skill.skill_id),
          }));

        const userWantedSkills = wantedSkillsData
          .filter(skill => skill.user_id === user.id)
          .map(skill => ({
            ...skill,
            skill: skillsData.find(s => s.id === skill.skill_id),
          }));

        const userRatings = ratingsData.filter(rating => rating.rated_id === user.id);
        const averageRating = userRatings.length > 0 
          ? userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length 
          : 0;

        const userSwaps = swapsData.filter(swap => 
          swap.status === 'completed' && 
          (swap.requester_id === user.id || swap.provider_id === user.id)
        );

        return {
          ...user,
          offered_skills: userOfferedSkills,
          wanted_skills: userWantedSkills,
          average_rating: Math.round(averageRating * 10) / 10,
          total_swaps: userSwaps.length,
        };
      });

      setUsers(usersWithSkills);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(search) ||
        user.location?.toLowerCase().includes(search) ||
        user.offered_skills.some(skill => 
          skill.skill?.name.toLowerCase().includes(search)
        ) ||
        user.wanted_skills.some(skill => 
          skill.skill?.name.toLowerCase().includes(search)
        )
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(user =>
        user.offered_skills.some(skill => 
          skill.skill?.category === selectedCategory
        ) ||
        user.wanted_skills.some(skill => 
          skill.skill?.category === selectedCategory
        )
      );
    }

    if (selectedSkill) {
      filtered = filtered.filter(user =>
        user.offered_skills.some(skill => 
          skill.skill?.id === selectedSkill
        ) ||
        user.wanted_skills.some(skill => 
          skill.skill?.id === selectedSkill
        )
      );
    }

    setFilteredUsers(filtered);
  };

  const sendSwapRequest = () => {
    if (!currentProfile || !showRequestModal || !selectedOfferedSkill || !selectedRequestedSkill) {
      toast.error('Please select skills for the swap');
      return;
    }

    try {
      const swapRequests = getFromStorage<any[]>('swapRequests', []);
      const newRequest = {
        id: generateId(),
        requester_id: currentProfile.id,
        provider_id: showRequestModal,
        offered_skill_id: selectedOfferedSkill,
        requested_skill_id: selectedRequestedSkill,
        message: requestMessage,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setToStorage('swapRequests', [...swapRequests, newRequest]);

      toast.success('Swap request sent successfully!');
      setShowRequestModal(null);
      setRequestMessage('');
      setSelectedOfferedSkill('');
      setSelectedRequestedSkill('');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const categories = [...new Set(skills.map(skill => skill.category))];

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
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Skills</h1>
          <p className="text-gray-600">Find people to swap skills with in our community</p>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, skill, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Skills</option>
              {skills.map(skill => (
                <option key={skill.id} value={skill.id}>{skill.name}</option>
              ))}
            </select>

            <div className="flex items-center text-sm text-gray-600">
              <Filter className="w-4 h-4 mr-2" />
              {filteredUsers.length} users found
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/90 transition-all duration-200"
            >
              {/* User Header */}
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=white`}
                  alt={user.name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  {user.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-3 h-3 mr-1" />
                      {user.location}
                    </div>
                  )}
                  <div className="flex items-center space-x-2 mt-1">
                    {user.average_rating > 0 && (
                      <div className="flex items-center text-sm">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        <span>{user.average_rating}</span>
                      </div>
                    )}
                    {user.total_swaps > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <ArrowLeftRight className="w-3 h-3 mr-1" />
                        <span>{user.total_swaps} swaps</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {user.bio && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{user.bio}</p>
              )}

              {/* Skills Offered */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Can Teach</h4>
                <div className="flex flex-wrap gap-1">
                  {user.offered_skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill.id}
                      className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                    >
                      {skill.skill?.name}
                    </span>
                  ))}
                  {user.offered_skills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{user.offered_skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Skills Wanted */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Wants to Learn</h4>
                <div className="flex flex-wrap gap-1">
                  {user.wanted_skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill.id}
                      className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                    >
                      {skill.skill?.name}
                    </span>
                  ))}
                  {user.wanted_skills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{user.wanted_skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Availability */}
              {user.availability.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Available</h4>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-3 h-3 mr-1" />
                    {user.availability.slice(0, 2).join(', ')}
                    {user.availability.length > 2 && ` +${user.availability.length - 2} more`}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => setShowRequestModal(user.id)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Request Swap</span>
              </button>
            </motion.div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">Try adjusting your search filters</p>
          </div>
        )}
      </motion.div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Request Skill Swap</h3>
              <button
                onClick={() => setShowRequestModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <User className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I can teach (your skill)
                </label>
                <select
                  value={selectedOfferedSkill}
                  onChange={(e) => setSelectedOfferedSkill(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select a skill you can teach</option>
                  {currentUserOfferedSkills.map((skill) => (
                    <option key={skill.id} value={skill.skill_id}>
                      {skill.skill?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I want to learn (their skill)
                </label>
                <select
                  value={selectedRequestedSkill}
                  onChange={(e) => setSelectedRequestedSkill(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select what you want to learn</option>
                  {users
                    .find(u => u.id === showRequestModal)
                    ?.offered_skills.map((skill) => (
                      <option key={skill.id} value={skill.skill_id}>
                        {skill.skill?.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Introduce yourself and explain why you'd like to swap skills..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowRequestModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendSwapRequest}
                  disabled={!selectedOfferedSkill || !selectedRequestedSkill}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send Request
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}