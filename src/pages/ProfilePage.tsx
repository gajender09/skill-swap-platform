import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  MapPin, 
  Clock, 
  Plus, 
  X, 
  Star,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Skill, 
  UserSkillOffered, 
  UserSkillWanted, 
  getFromStorage, 
  setToStorage, 
  generateId 
} from '../lib/mockData';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().optional(),
  bio: z.string().optional(),
  availability: z.array(z.string()),
  is_public: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const availabilityOptions = [
  'Weekday Mornings',
  'Weekday Afternoons',
  'Weekday Evenings',
  'Weekend Mornings',
  'Weekend Afternoons',
  'Weekend Evenings',
  'Flexible',
];

export default function ProfilePage() {
  const { profile, updateProfile } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [offeredSkills, setOfferedSkills] = useState<UserSkillOffered[]>([]);
  const [wantedSkills, setWantedSkills] = useState<UserSkillWanted[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkillModal, setShowSkillModal] = useState<'offered' | 'wanted' | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [skillDescription, setSkillDescription] = useState('');
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high'>('medium');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      location: profile?.location || '',
      bio: profile?.bio || '',
      availability: profile?.availability || [],
      is_public: profile?.is_public ?? true,
    },
  });

  const watchedAvailability = watch('availability');

  useEffect(() => {
    if (profile) {
      setValue('name', profile.name);
      setValue('location', profile.location || '');
      setValue('bio', profile.bio || '');
      setValue('availability', profile.availability);
      setValue('is_public', profile.is_public);
      
      fetchData();
    }
  }, [profile, setValue]);

  const fetchData = () => {
    try {
      // Fetch all skills
      const skillsData = getFromStorage<Skill[]>('skills', []);
      setSkills(skillsData.filter(skill => skill.is_approved));

      // Fetch user's offered skills
      const offeredData = getFromStorage<UserSkillOffered[]>('userSkillsOffered', []);
      const userOfferedSkills = offeredData
        .filter(skill => skill.user_id === profile?.id)
        .map(skill => ({
          ...skill,
          skill: skillsData.find(s => s.id === skill.skill_id),
        }));
      setOfferedSkills(userOfferedSkills);

      // Fetch user's wanted skills
      const wantedData = getFromStorage<UserSkillWanted[]>('userSkillsWanted', []);
      const userWantedSkills = wantedData
        .filter(skill => skill.user_id === profile?.id)
        .map(skill => ({
          ...skill,
          skill: skillsData.find(s => s.id === skill.skill_id),
        }));
      setWantedSkills(userWantedSkills);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error loading profile data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
    } catch (error) {
      // Error is handled in AuthContext
    }
  };

  const handleAvailabilityChange = (option: string) => {
    const current = watchedAvailability || [];
    const updated = current.includes(option)
      ? current.filter(item => item !== option)
      : [...current, option];
    setValue('availability', updated);
  };

  const addSkill = () => {
    if (!selectedSkill || !profile) return;

    try {
      const newSkill = {
        id: generateId(),
        user_id: profile.id,
        skill_id: selectedSkill,
        description: skillDescription,
        created_at: new Date().toISOString(),
      };

      if (showSkillModal === 'offered') {
        const offeredSkillsData = getFromStorage<UserSkillOffered[]>('userSkillsOffered', []);
        const newOfferedSkill = {
          ...newSkill,
          proficiency_level: skillLevel,
        } as UserSkillOffered;
        
        setToStorage('userSkillsOffered', [...offeredSkillsData, newOfferedSkill]);
      } else {
        const wantedSkillsData = getFromStorage<UserSkillWanted[]>('userSkillsWanted', []);
        const newWantedSkill = {
          ...newSkill,
          urgency_level: urgencyLevel,
        } as UserSkillWanted;
        
        setToStorage('userSkillsWanted', [...wantedSkillsData, newWantedSkill]);
      }

      toast.success('Skill added successfully!');
      setShowSkillModal(null);
      setSelectedSkill('');
      setSkillDescription('');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const removeSkill = (skillId: string, type: 'offered' | 'wanted') => {
    try {
      if (type === 'offered') {
        const offeredSkillsData = getFromStorage<UserSkillOffered[]>('userSkillsOffered', []);
        const updated = offeredSkillsData.filter(skill => skill.id !== skillId);
        setToStorage('userSkillsOffered', updated);
      } else {
        const wantedSkillsData = getFromStorage<UserSkillWanted[]>('userSkillsWanted', []);
        const updated = wantedSkillsData.filter(skill => skill.id !== skillId);
        setToStorage('userSkillsWanted', updated);
      }

      toast.success('Skill removed successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <img
            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=6366f1&color=white`}
            alt={profile?.name}
            className="w-24 h-24 rounded-full mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900">{profile?.name}</h1>
          <div className="flex items-center justify-center space-x-2 mt-2">
            {profile?.is_public ? (
              <><Eye className="w-4 h-4 text-green-600" /> <span className="text-green-600 text-sm">Public Profile</span></>
            ) : (
              <><EyeOff className="w-4 h-4 text-gray-600" /> <span className="text-gray-600 text-sm">Private Profile</span></>
            )}
            {profile?.is_admin && (
              <>
                <span className="text-gray-300">•</span>
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="text-purple-600 text-sm">Admin</span>
              </>
            )}
          </div>
        </div>

        {/* Basic Information Form */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register('name')}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (Optional)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register('location')}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="City, State/Country"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio (Optional)
              </label>
              <textarea
                {...register('bio')}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Tell others about yourself and your interests..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Availability
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availabilityOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={watchedAvailability?.includes(option) || false}
                      onChange={() => handleAvailabilityChange(option)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                {...register('is_public')}
                type="checkbox"
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="text-sm text-gray-700">
                Make my profile public (others can find and contact me)
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Skills Offered */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Skills I Can Teach</h2>
            <button
              onClick={() => setShowSkillModal('offered')}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Skill</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offeredSkills.map((userSkill) => (
              <div
                key={userSkill.id}
                className="p-4 border border-gray-200 rounded-lg group hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{userSkill.skill?.name}</h3>
                    <p className="text-sm text-indigo-600 capitalize">{userSkill.proficiency_level}</p>
                    {userSkill.description && (
                      <p className="text-sm text-gray-600 mt-1">{userSkill.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeSkill(userSkill.id, 'offered')}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {offeredSkills.length === 0 && (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No skills added yet. Add skills you can teach others!</p>
            </div>
          )}
        </div>

        {/* Skills Wanted */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Skills I Want to Learn</h2>
            <button
              onClick={() => setShowSkillModal('wanted')}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Skill</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wantedSkills.map((userSkill) => (
              <div
                key={userSkill.id}
                className="p-4 border border-gray-200 rounded-lg group hover:border-purple-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{userSkill.skill?.name}</h3>
                    <p className="text-sm text-purple-600 capitalize">{userSkill.urgency_level} priority</p>
                    {userSkill.description && (
                      <p className="text-sm text-gray-600 mt-1">{userSkill.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeSkill(userSkill.id, 'wanted')}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {wantedSkills.length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No skills added yet. Add skills you want to learn!</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add Skill Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Add {showSkillModal === 'offered' ? 'Skill I Can Teach' : 'Skill I Want to Learn'}
              </h3>
              <button
                onClick={() => setShowSkillModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill
                </label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select a skill</option>
                  {skills
                    .filter(skill => {
                      const existingSkills = showSkillModal === 'offered' 
                        ? offeredSkills.map(s => s.skill_id)
                        : wantedSkills.map(s => s.skill_id);
                      return !existingSkills.includes(skill.id);
                    })
                    .map((skill) => (
                      <option key={skill.id} value={skill.id}>
                        {skill.name}
                      </option>
                    ))}
                </select>
              </div>

              {showSkillModal === 'offered' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proficiency Level
                  </label>
                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <select
                    value={urgencyLevel}
                    onChange={(e) => setUrgencyLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={skillDescription}
                  onChange={(e) => setSkillDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={showSkillModal === 'offered' 
                    ? "What can you teach? Any specific areas of expertise?"
                    : "What would you like to learn? Any specific goals?"
                  }
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowSkillModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addSkill}
                  disabled={!selectedSkill}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Skill
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}