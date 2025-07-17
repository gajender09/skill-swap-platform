// Mock data and local storage utilities for frontend-only version

export interface Profile {
  id: string;
  name: string;
  location?: string;
  avatar_url?: string;
  bio?: string;
  availability: string[];
  is_public: boolean;
  is_banned: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  is_approved: boolean;
  created_at: string;
}

export interface UserSkillOffered {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  description?: string;
  created_at: string;
  skill?: Skill;
}

export interface UserSkillWanted {
  id: string;
  user_id: string;
  skill_id: string;
  urgency_level: 'low' | 'medium' | 'high';
  description?: string;
  created_at: string;
  skill?: Skill;
}

export interface SwapRequest {
  id: string;
  requester_id: string;
  provider_id: string;
  offered_skill_id: string;
  requested_skill_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  requester?: Profile;
  provider?: Profile;
  offered_skill?: Skill;
  requested_skill?: Skill;
}

export interface Rating {
  id: string;
  swap_request_id: string;
  rater_id: string;
  rated_id: string;
  rating: number;
  feedback?: string;
  created_at: string;
  rater?: Profile;
  rated?: Profile;
}

export interface AdminMessage {
  id: string;
  admin_id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
  admin?: Profile;
}

// Mock skills data
export const mockSkills: Skill[] = [
  { id: '1', name: 'React', category: 'Programming', is_approved: true, created_at: '2024-01-01' },
  { id: '2', name: 'Vue.js', category: 'Programming', is_approved: true, created_at: '2024-01-01' },
  { id: '3', name: 'Angular', category: 'Programming', is_approved: true, created_at: '2024-01-01' },
  { id: '4', name: 'Node.js', category: 'Programming', is_approved: true, created_at: '2024-01-01' },
  { id: '5', name: 'Python', category: 'Programming', is_approved: true, created_at: '2024-01-01' },
  { id: '6', name: 'JavaScript', category: 'Programming', is_approved: true, created_at: '2024-01-01' },
  { id: '7', name: 'TypeScript', category: 'Programming', is_approved: true, created_at: '2024-01-01' },
  { id: '8', name: 'HTML/CSS', category: 'Programming', is_approved: true, created_at: '2024-01-01' },
  { id: '9', name: 'Photoshop', category: 'Design', is_approved: true, created_at: '2024-01-01' },
  { id: '10', name: 'Figma', category: 'Design', is_approved: true, created_at: '2024-01-01' },
  { id: '11', name: 'Illustrator', category: 'Design', is_approved: true, created_at: '2024-01-01' },
  { id: '12', name: 'UI/UX Design', category: 'Design', is_approved: true, created_at: '2024-01-01' },
  { id: '13', name: 'Graphic Design', category: 'Design', is_approved: true, created_at: '2024-01-01' },
  { id: '14', name: 'Photography', category: 'Creative', is_approved: true, created_at: '2024-01-01' },
  { id: '15', name: 'Video Editing', category: 'Creative', is_approved: true, created_at: '2024-01-01' },
  { id: '16', name: 'Content Writing', category: 'Creative', is_approved: true, created_at: '2024-01-01' },
  { id: '17', name: 'Digital Marketing', category: 'Marketing', is_approved: true, created_at: '2024-01-01' },
  { id: '18', name: 'SEO', category: 'Marketing', is_approved: true, created_at: '2024-01-01' },
  { id: '19', name: 'Social Media', category: 'Marketing', is_approved: true, created_at: '2024-01-01' },
  { id: '20', name: 'Excel', category: 'Business', is_approved: true, created_at: '2024-01-01' },
  { id: '21', name: 'PowerPoint', category: 'Business', is_approved: true, created_at: '2024-01-01' },
  { id: '22', name: 'Project Management', category: 'Business', is_approved: true, created_at: '2024-01-01' },
  { id: '23', name: 'Data Analysis', category: 'Business', is_approved: true, created_at: '2024-01-01' },
  { id: '24', name: 'Spanish', category: 'Languages', is_approved: true, created_at: '2024-01-01' },
  { id: '25', name: 'French', category: 'Languages', is_approved: true, created_at: '2024-01-01' },
  { id: '26', name: 'German', category: 'Languages', is_approved: true, created_at: '2024-01-01' },
  { id: '27', name: 'Mandarin', category: 'Languages', is_approved: true, created_at: '2024-01-01' },
  { id: '28', name: 'Guitar', category: 'Music', is_approved: true, created_at: '2024-01-01' },
  { id: '29', name: 'Piano', category: 'Music', is_approved: true, created_at: '2024-01-01' },
  { id: '30', name: 'Singing', category: 'Music', is_approved: true, created_at: '2024-01-01' },
  { id: '31', name: 'Cooking', category: 'Lifestyle', is_approved: true, created_at: '2024-01-01' },
  { id: '32', name: 'Fitness Training', category: 'Lifestyle', is_approved: true, created_at: '2024-01-01' },
  { id: '33', name: 'Yoga', category: 'Lifestyle', is_approved: true, created_at: '2024-01-01' },
  { id: '34', name: 'Public Speaking', category: 'Soft Skills', is_approved: true, created_at: '2024-01-01' },
  { id: '35', name: 'Leadership', category: 'Soft Skills', is_approved: true, created_at: '2024-01-01' },
  { id: '36', name: 'Communication', category: 'Soft Skills', is_approved: true, created_at: '2024-01-01' },
];

// Mock users data
export const mockUsers: Profile[] = [
  {
    id: 'user-1',
    name: 'Alice Johnson',
    location: 'San Francisco, CA',
    bio: 'Full-stack developer passionate about React and Node.js. Love teaching and learning new technologies.',
    availability: ['Weekday Evenings', 'Weekend Mornings'],
    is_public: true,
    is_banned: false,
    is_admin: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'user-2',
    name: 'Bob Smith',
    location: 'New York, NY',
    bio: 'UX/UI Designer with 5 years of experience. Skilled in Figma, Photoshop, and user research.',
    availability: ['Weekday Afternoons', 'Weekend Afternoons'],
    is_public: true,
    is_banned: false,
    is_admin: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'user-3',
    name: 'Carol Davis',
    location: 'Austin, TX',
    bio: 'Digital marketing specialist and content creator. Expert in SEO and social media strategies.',
    availability: ['Flexible'],
    is_public: true,
    is_banned: false,
    is_admin: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'user-4',
    name: 'David Wilson',
    location: 'Seattle, WA',
    bio: 'Data analyst and Python enthusiast. Love working with data visualization and machine learning.',
    availability: ['Weekend Evenings'],
    is_public: true,
    is_banned: false,
    is_admin: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'admin-1',
    name: 'Admin User',
    location: 'Remote',
    bio: 'Platform administrator',
    availability: ['Flexible'],
    is_public: true,
    is_banned: false,
    is_admin: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

// Local storage utilities
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Generate unique IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Initialize mock data in localStorage
export const initializeMockData = (): void => {
  if (!localStorage.getItem('skills')) {
    setToStorage('skills', mockSkills);
  }
  if (!localStorage.getItem('users')) {
    setToStorage('users', mockUsers);
  }
  if (!localStorage.getItem('userSkillsOffered')) {
    setToStorage('userSkillsOffered', []);
  }
  if (!localStorage.getItem('userSkillsWanted')) {
    setToStorage('userSkillsWanted', []);
  }
  if (!localStorage.getItem('swapRequests')) {
    setToStorage('swapRequests', []);
  }
  if (!localStorage.getItem('ratings')) {
    setToStorage('ratings', []);
  }
  if (!localStorage.getItem('adminMessages')) {
    setToStorage('adminMessages', []);
  }
};