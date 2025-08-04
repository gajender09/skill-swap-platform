import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, MapPin, Clock, Plus, X, Save, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAvatarUrl } from '../lib/supabase';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().optional(),
  bio: z.string().optional(),
  skills_offered: z.array(z.string()),
  skills_wanted: z.array(z.string()),
  availability: z.string(),
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
  'Flexible'
];

const skillSuggestions = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'HTML/CSS',
  'Photoshop', 'Figma', 'Illustrator', 'UI/UX Design', 'Graphic Design',
  'Photography', 'Video Editing', 'Content Writing',
  'Digital Marketing', 'SEO', 'Social Media Marketing',
  'Excel', 'PowerPoint', 'Project Management', 'Data Analysis',
  'Spanish', 'French', 'German', 'Mandarin',
  'Guitar', 'Piano', 'Singing',
  'Cooking', 'Fitness Training', 'Yoga',
  'Public Speaking', 'Leadership', 'Communication'
];

export default function ProfilePage() {
  const { profile, updateProfile } = useAuth();
  const [showSkillModal, setShowSkillModal] = useState<'offered' | 'wanted' | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

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
      skills_offered: profile?.skills_offered || [],
      skills_wanted: profile?.skills_wanted || [],
      availability: profile?.availability || 'flexible',
      is_public: profile?.is_public ?? true,
    },
  });

  const watchedSkillsOffered = watch('skills_offered');
  const watchedSkillsWanted = watch('skills_wanted');

  useEffect(() => {
    if (profile) {
      setValue('name', profile.name || '');
      setValue('location', profile.location || '');
      setValue('bio', profile.bio || '');
      setValue('skills_offered', profile.skills_offered || []);
      setValue('skills_wanted', profile.skills_wanted || []);
      setValue('availability', profile.availability || 'flexible');
      setValue('is_public', profile.is_public);
    }
  }, [profile, setValue]);

  useEffect(() => {
    if (newSkill) {
      const filtered = skillSuggestions.filter(skill =>
        skill.toLowerCase().includes(newSkill.toLowerCase()) &&
        !watchedSkillsOffered?.includes(skill) &&
        !watchedSkillsWanted?.includes(skill)
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [newSkill, watchedSkillsOffered, watchedSkillsWanted]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
    } catch (error) {
      // Error is handled in AuthContext
    }
  };

  const addSkill = (skill: string) => {
    if (!skill.trim() || !showSkillModal) return;

    const currentSkills = showSkillModal === 'offered' ? watchedSkillsOffered : watchedSkillsWanted;
    
    if (!currentSkills?.includes(skill)) {
      const updatedSkills = [...(currentSkills || []), skill];
      setValue(showSkillModal === 'offered' ? 'skills_offered' : 'skills_wanted', updatedSkills);
    }

    setNewSkill('');
    setShowSkillModal(null);
  };

  const removeSkill = (skill: string, type: 'offered' | 'wanted') => {
    const currentSkills = type === 'offered' ? watchedSkillsOffered : watchedSkillsWanted;
    const updatedSkills = currentSkills?.filter(s => s !== skill) || [];
    setValue(type === 'offered' ? 'skills_offered' : 'skills_wanted', updatedSkills);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <img
            src={profile ? getAvatarUrl(profile) : ''}
            alt={profile?.name}
            className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-gray-200"
          />
          <button className="absolute bottom-4 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{profile?.name}</h1>
        
        {/* Stats */}
        <div className="flex justify-center space-x-8 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{profile?.swap_count || 0}</div>
            <div className="text-sm text-gray-600">Swaps</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {profile?.rating_avg ? profile.rating_avg.toFixed(1) : '--'}
            </div>
            <div className="text-sm text-gray-600">Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{profile?.rating_count || 0}</div>
            <div className="text-sm text-gray-600">Reviews</div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register('name')}
                  className={`input pl-12 ${errors.name ? 'input-error' : ''}`}
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
                  className="input pl-12"
                  placeholder="City, State/Country"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio (Optional)
            </label>
            <textarea
              {...register('bio')}
              rows={4}
              className="input"
              placeholder="Tell others about yourself, your interests, and what you're passionate about..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                {...register('availability')}
                className="input pl-12"
              >
                {availabilityOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              {...register('is_public')}
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label className="text-sm text-gray-700">
              Make my profile public (others can find and contact me)
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full py-3"
          >
            <Save className="w-5 h-5" />
            <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </form>
      </div>

      {/* Skills Offered */}
      <div className="card p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Skills I Can Teach</h2>
          <button
            onClick={() => setShowSkillModal('offered')}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchedSkillsOffered?.map((skill) => (
            <div
              key={skill}
              className="group p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-900">{skill}</span>
                <button
                  onClick={() => removeSkill(skill, 'offered')}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {(!watchedSkillsOffered || watchedSkillsOffered.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No skills added yet</p>
            <p className="text-gray-500">Add skills you can teach others!</p>
          </div>
        )}
      </div>

      {/* Skills Wanted */}
      <div className="card p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Skills I Want to Learn</h2>
          <button
            onClick={() => setShowSkillModal('wanted')}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchedSkillsWanted?.map((skill) => (
            <div
              key={skill}
              className="group p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-purple-900">{skill}</span>
                <button
                  onClick={() => removeSkill(skill, 'wanted')}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {(!watchedSkillsWanted || watchedSkillsWanted.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No skills added yet</p>
            <p className="text-gray-500">Add skills you want to learn!</p>
          </div>
        )}
      </div>

      {/* Add Skill Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                Add {showSkillModal === 'offered' ? 'Skill I Can Teach' : 'Skill I Want to Learn'}
              </h3>
              <button
                onClick={() => setShowSkillModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Name
                </label>
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="input"
                  placeholder="Type a skill name..."
                  onKeyPress={(e) => e.key === 'Enter' && addSkill(newSkill)}
                />
              </div>

              {filteredSuggestions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suggestions
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredSuggestions.slice(0, 10).map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => addSkill(suggestion)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowSkillModal(null)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addSkill(newSkill)}
                  disabled={!newSkill.trim()}
                  className="btn btn-primary flex-1"
                >
                  Add Skill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}