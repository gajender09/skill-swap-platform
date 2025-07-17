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
  MessageSquare,
  Award,
  Users,
  Send
} from 'lucide-react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ExtendedProfile extends Profile {
  skills_offered_count?: number;
  skills_wanted_count?: number;
}

export default function BrowseSkills() {
  const { user, profile: currentProfile } = useAuth();
  const [profiles, setProfiles] = useState<ExtendedProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<ExtendedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [showRequestModal, setShowRequestModal] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [mySkill, setMySkill] = useState('');
  const [theirSkill, setTheirSkill] = useState('');
  const [allSkills, setAllSkills] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  useEffect(() => {
    filterProfiles();
  }, [profiles, searchTerm, selectedSkill]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_public', true)
        .neq('user_id', user?.id);

      if (error) throw error;

      // Get all unique skills
      const skills = new Set<string>();
      data?.forEach(profile => {
        profile.skills_offered?.forEach((skill: string) => skills.add(skill));
        profile.skills_wanted?.forEach((skill: string) => skills.add(skill));
      });
      setAllSkills(Array.from(skills).sort());

      // Add skill counts
      const profilesWithCounts = data?.map(profile => ({
        ...profile,
        skills_offered_count: profile.skills_offered?.length || 0,
        skills_wanted_count: profile.skills_wanted?.length || 0,
      })) || [];

      setProfiles(profilesWithCounts);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast.error('Error loading profiles');
    } finally {
      setLoading(false);
    }
  };

  const filterProfiles = () => {
    let filtered = profiles;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(profile =>
        profile.name?.toLowerCase().includes(search) ||
        profile.location?.toLowerCase().includes(search) ||
        profile.bio?.toLowerCase().includes(search) ||
        profile.skills_offered?.some(skill => 
          skill.toLowerCase().includes(search)
        ) ||
        profile.skills_wanted?.some(skill => 
          skill.toLowerCase().includes(search)
        )
      );
    }

    if (selectedSkill) {
      filtered = filtered.filter(profile =>
        profile.skills_offered?.includes(selectedSkill) ||
        profile.skills_wanted?.includes(selectedSkill)
      );
    }

    setFilteredProfiles(filtered);
  };

  const sendSwapRequest = async () => {
    if (!user || !showRequestModal || !mySkill || !theirSkill) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('swap_requests')
        .insert({
          from_user_id: user.id,
          to_user_id: showRequestModal,
          my_skill: mySkill,
          their_skill: theirSkill,
          message: requestMessage,
        });

      if (error) throw error;

      toast.success('Swap request sent successfully!');
      setShowRequestModal(null);
      setRequestMessage('');
      setMySkill('');
      setTheirSkill('');
    } catch (error: any) {
      toast.error(error.message);
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
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Skills</h1>
          <p className="text-xl text-gray-600">Connect with talented people in our community</p>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, skill, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">All Skills</option>
              {allSkills.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>

            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-2 text-gray-600">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">{filteredProfiles.length} people found</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {/* Profile Header */}
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=3b82f6&color=white`}
                  alt={profile.name}
                  className="w-16 h-16 rounded-full ring-2 ring-blue-100"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{profile.name}</h3>
                  {profile.location && (
                    <div className="flex items-center text-gray-600 mb-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    {profile.average_rating > 0 && (
                      <div className="flex items-center text-sm">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="font-medium">{profile.average_rating.toFixed(1)}</span>
                      </div>
                    )}
                    {profile.total_swaps > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <ArrowLeftRight className="w-4 h-4 mr-1" />
                        <span>{profile.total_swaps} swaps</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{profile.bio}</p>
              )}

              {/* Skills Offered */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-900">Can Teach ({profile.skills_offered_count})</h4>
                </div>
                <div className="flex flex-wrap gap-1">
                  {profile.skills_offered?.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {(profile.skills_offered?.length || 0) > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{(profile.skills_offered?.length || 0) - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Skills Wanted */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <h4 className="text-sm font-semibold text-gray-900">Wants to Learn ({profile.skills_wanted_count})</h4>
                </div>
                <div className="flex flex-wrap gap-1">
                  {profile.skills_wanted?.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {(profile.skills_wanted?.length || 0) > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{(profile.skills_wanted?.length || 0) - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Availability */}
              <div className="mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{profile.availability}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setShowRequestModal(profile.user_id)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2 group-hover:shadow-xl"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Request Swap</span>
              </button>
            </motion.div>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-16">
            <User className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-medium text-gray-900 mb-2">No profiles found</h3>
            <p className="text-gray-600 text-lg">Try adjusting your search filters</p>
          </div>
        )}
      </motion.div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Request Skill Swap</h3>
              <button
                onClick={() => setShowRequestModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <User className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I can teach
                </label>
                <select
                  value={mySkill}
                  onChange={(e) => setMySkill(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select a skill you can teach</option>
                  {currentProfile?.skills_offered?.map((skill) => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I want to learn
                </label>
                <select
                  value={theirSkill}
                  onChange={(e) => setTheirSkill(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select what you want to learn</option>
                  {profiles
                    .find(p => p.user_id === showRequestModal)
                    ?.skills_offered?.map((skill) => (
                      <option key={skill} value={skill}>{skill}</option>
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
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Introduce yourself and explain why you'd like to swap skills..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowRequestModal(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={sendSwapRequest}
                  disabled={!mySkill || !theirSkill}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Request</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}