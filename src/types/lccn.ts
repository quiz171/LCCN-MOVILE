import { Timestamp } from 'firebase/firestore';

export type VisibilityScope = 'diocese' | 'division' | 'church';
export type AdminRole = 'diocese_secretary' | 'division_admin' | 'church_admin';
export type LanguageCode = 'en' | 'ha';
export type MainTab = 'home' | 'announcements' | 'events' | 'assistant' | 'profile';

export const ID_PATTERN = /^[a-zA-Z0-9_\-]+$/;

export const FIELD_LIMITS = {
  fullNameMax: 120,
  phoneMax: 30,
  subgroupMax: 100,
  titleMax: 160,
  summaryMax: 320,
  bodyMax: 5000,
  descriptionMax: 2500,
  locationMax: 240,
  timeMax: 40,
  addressMax: 280,
  authorityLabelMax: 140,
  serviceItemMax: 120,
  serviceListMax: 10,
} as const;

export const CHURCH_SUBGROUPS = [
  'Youth Fellowship',
  "Women's Fellowship",
  "Men's Fellowship",
  'Choir',
  "Boys' & Girls' Brigade",
  'Sunday School Ministry',
  'Evangelism & Outreach',
] as const;

export interface Diocese {
  id: string;
  name: string;
  bishopName: string;
  headquarters: string;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Division {
  id: string;
  dioceseId: string;
  name: string;
  headquarters?: string;
  chairpersonName?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface District {
  id: string;
  dioceseId: string;
  divisionId: string;
  name: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Church {
  id: string;
  dioceseId: string;
  divisionId: string;
  districtId: string;
  name: string;
  pastorName: string;
  address: string;
  serviceSchedule: string[];
  phone?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface MemberProfile {
  uid: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  dioceseId: string;
  divisionId: string;
  districtId: string;
  churchId: string;
  subgroup?: string;
  preferredLanguage: LanguageCode;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AdminRecord {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  role: AdminRole;
  dioceseId: string;
  divisionId: string;
  churchId: string;
  inviteId?: string;
  assignedBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AdminInvite {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  dioceseId: string;
  divisionId: string;
  churchId: string;
  assignedBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Announcement {
  id: string;
  title: string;
  summary: string;
  body: string;
  visibilityScope: VisibilityScope;
  dioceseId: string;
  divisionId: string;
  churchId: string;
  authorityLabel: string;
  authorUid: string;
  publishedAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ChurchEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  visibilityScope: VisibilityScope;
  dioceseId: string;
  divisionId: string;
  churchId: string;
  organizerLabel: string;
  authorUid: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isError?: boolean;
}
