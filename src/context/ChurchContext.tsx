import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  getGoogleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase/config';
import { seedAbujaDioceseIfNeeded } from '../firebase/seedData';
import {
  AdminInvite,
  AdminRecord,
  AdminRole,
  Announcement,
  Church,
  ChurchEvent,
  Diocese,
  District,
  Division,
  FIELD_LIMITS,
  MemberProfile,
  VisibilityScope,
} from '../types/lccn';

interface ChurchContextValue {
  user: User | null;
  authLoading: boolean;
  dataLoading: boolean;
  error: string | null;
  clearError: () => void;
  signInWithGoogle: (options?: { selectAccount?: boolean }) => Promise<void>;
  logout: () => Promise<void>;

  dioceses: Diocese[];
  divisions: Division[];
  districts: District[];
  churches: Church[];

  member: MemberProfile | null;
  memberLoaded: boolean;
  currentDiocese: Diocese | null;
  currentDivision: Division | null;
  currentDistrict: District | null;
  currentChurch: Church | null;

  memberAnnouncements: Announcement[];
  memberEvents: ChurchEvent[];
  allAnnouncements: Announcement[];
  allEvents: ChurchEvent[];

  adminRecord: AdminRecord | null;
  isAdmin: boolean;
  isBootstrappedSuperAdmin: boolean;
  effectiveAdminRole: AdminRole | null;

  saveMemberProfile: (input: {
    fullName: string;
    phoneNumber: string;
    dioceseId: string;
    divisionId: string;
    districtId: string;
    churchId: string;
    subgroup?: string;
  }) => Promise<void>;

  createAnnouncement: (input: {
    title: string;
    summary: string;
    body: string;
    visibilityScope: VisibilityScope;
    dioceseId: string;
    divisionId: string;
    churchId: string;
    authorityLabel: string;
  }) => Promise<void>;
  updateAnnouncement: (
    id: string,
    input: {
      title: string;
      summary: string;
      body: string;
      visibilityScope: VisibilityScope;
      divisionId: string;
      churchId: string;
      authorityLabel: string;
    }
  ) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;

  createEvent: (input: {
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
  }) => Promise<void>;
  updateEvent: (
    id: string,
    input: {
      title: string;
      description: string;
      date: string;
      time: string;
      location: string;
      visibilityScope: VisibilityScope;
      divisionId: string;
      churchId: string;
      organizerLabel: string;
    }
  ) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  updateChurchInfo: (
    churchId: string,
    input: {
      name: string;
      pastorName: string;
      address: string;
      phone: string;
      serviceSchedule: string[];
      divisionId?: string;
      districtId?: string;
    }
  ) => Promise<void>;
  createChurch: (input: {
    dioceseId: string;
    divisionId: string;
    districtId: string;
    name: string;
    pastorName: string;
    address: string;
    phone: string;
    serviceSchedule: string[];
  }) => Promise<void>;
  createDivision: (input: {
    dioceseId: string;
    name: string;
    headquarters: string;
    chairpersonName: string;
  }) => Promise<void>;

  fetchScopedMembers: () => Promise<MemberProfile[]>;
  fetchAdminDirectory: () => Promise<{ admins: AdminRecord[]; invites: AdminInvite[] }>;
  assignAdminInvite: (input: {
    email: string;
    fullName: string;
    role: AdminRole;
    dioceseId: string;
    divisionId: string;
    churchId: string;
  }) => Promise<void>;
  revokeAdmin: (adminId: string) => Promise<void>;
  revokeAdminInvite: (inviteId: string) => Promise<void>;
}

const ChurchContext = createContext<ChurchContextValue | null>(null);

export function useChurch() {
  const ctx = useContext(ChurchContext);
  if (!ctx) {
    throw new Error('useChurch must be used inside ChurchProvider');
  }
  return ctx;
}

function toTimestampMs(ts?: Timestamp): number {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  return 0;
}

export const ChurchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dioceses, setDioceses] = useState<Diocese[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [memberLoaded, setMemberLoaded] = useState(false);
  const [adminRecord, setAdminRecord] = useState<AdminRecord | null>(null);
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
  const [allEvents, setAllEvents] = useState<ChurchEvent[]>([]);

  const userRef = useRef<User | null>(user);
  userRef.current = user;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) {
        setMember(null);
        setMemberLoaded(false);
        setDataLoading(false);
        setAdminRecord(null);
        setDioceses([]);
        setDivisions([]);
        setDistricts([]);
        setChurches([]);
        setAllAnnouncements([]);
        setAllEvents([]);
      }
    });
    return () => unsub();
  }, []);

  const userUid = user?.uid ?? null;

  useEffect(() => {
    const currentUser = userRef.current;
    if (!userUid || !currentUser) return;

    let active = true;
    const unsubs: Array<() => void> = [];
    setDataLoading(true);
    const activeDioceseId = 'abuja';

    // Attach member profile & hierarchy listeners immediately in parallel (zero serial await blocking)
    unsubs.push(
      onSnapshot(
        doc(db, 'members', currentUser.uid),
        (snap) => {
          if (snap.exists()) {
            setMember(snap.data() as MemberProfile);
            setMemberLoaded(true);
            setDataLoading(false);
          } else if (!snap.metadata.fromCache || !navigator.onLine) {
            setMember(null);
            setMemberLoaded(true);
            setDataLoading(false);
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `members/${currentUser.uid}`)
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'admins', currentUser.uid),
        (snap) => {
          if (snap.exists()) {
            setAdminRecord({ id: snap.id, ...(snap.data() as Omit<AdminRecord, 'id'>) });
          } else {
            setAdminRecord(null);
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `admins/${currentUser.uid}`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'dioceses'), where('isActive', '==', true)),
        (snap) => {
          setDioceses(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Diocese, 'id'>) }))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'dioceses')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'divisions'), where('dioceseId', '==', activeDioceseId)),
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Division, 'id'>),
          }));
          list.sort((a, b) => a.name.localeCompare(b.name));
          setDivisions(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'divisions')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'districts'), where('dioceseId', '==', activeDioceseId)),
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<District, 'id'>),
          }));
          list.sort((a, b) => a.name.localeCompare(b.name));
          setDistricts(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'districts')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'churches'), where('dioceseId', '==', activeDioceseId)),
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Church, 'id'>),
          }));
          list.sort((a, b) => a.name.localeCompare(b.name));
          setChurches(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'churches')
      )
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'announcements'),
          where('dioceseId', '==', activeDioceseId),
          where('visibilityScope', 'in', ['diocese', 'division', 'church'])
        ),
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Announcement, 'id'>),
          }));
          list.sort((a, b) => toTimestampMs(b.publishedAt) - toTimestampMs(a.publishedAt));
          setAllAnnouncements(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'announcements')
      )
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'events'),
          where('dioceseId', '==', activeDioceseId),
          where('visibilityScope', 'in', ['diocese', 'division', 'church'])
        ),
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ChurchEvent, 'id'>),
          }));
          list.sort((a, b) => a.date.localeCompare(b.date));
          setAllEvents(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'events')
      )
    );

    // Run initial seed and admin invite claim concurrently in the background
    void (async () => {
      try {
        await seedAbujaDioceseIfNeeded(currentUser);
      } catch (err) {
        if (active) {
          console.error('Seed check error:', err);
        }
      }
    })();

    void (async () => {
      if (!currentUser.email || !currentUser.emailVerified) return;
      try {
        const emailLower = currentUser.email.toLowerCase();
        const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
        if (!active || adminSnap.exists()) return;

        if (emailLower === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
          await setDoc(doc(db, 'admins', currentUser.uid), {
            uid: currentUser.uid,
            email: emailLower,
            fullName: currentUser.displayName || 'Diocese Secretary',
            role: 'diocese_secretary',
            dioceseId: 'abuja',
            divisionId: '',
            churchId: '',
            assignedBy: 'system_bootstrap',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          return;
        }

        const invitesQ = query(
          collection(db, 'adminInvites'),
          where('email', '==', emailLower)
        );
        const inviteSnaps = await getDocs(invitesQ);
        if (!active || inviteSnaps.empty) return;

        const inviteDoc = inviteSnaps.docs[0];
        const inv = inviteDoc.data();
        const batch = writeBatch(db);
        batch.set(doc(db, 'admins', currentUser.uid), {
          uid: currentUser.uid,
          email: emailLower,
          fullName: inv.fullName,
          role: inv.role,
          dioceseId: inv.dioceseId,
          divisionId: inv.divisionId || '',
          churchId: inv.churchId || '',
          inviteId: inviteDoc.id,
          assignedBy: inv.assignedBy,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        batch.delete(doc(db, 'adminInvites', inviteDoc.id));
        await batch.commit();
      } catch (err) {
        if (active) {
          console.error('Admin bootstrap error:', err);
        }
      }
    })();

    return () => {
      active = false;
      unsubs.forEach((u) => u());
    };
  }, [userUid]);

  const currentDiocese = useMemo(
    () => dioceses.find((d) => d.id === (member?.dioceseId || 'abuja')) || null,
    [dioceses, member]
  );

  const currentDivision = useMemo(
    () => divisions.find((d) => d.id === member?.divisionId) || null,
    [divisions, member]
  );

  const currentDistrict = useMemo(
    () => districts.find((d) => d.id === member?.districtId) || null,
    [districts, member]
  );

  const currentChurch = useMemo(
    () => churches.find((c) => c.id === member?.churchId) || null,
    [churches, member]
  );

  const memberAnnouncements = useMemo(() => {
    if (!member) return [];
    return allAnnouncements.filter((a) => {
      if (a.visibilityScope === 'diocese') return a.dioceseId === member.dioceseId;
      if (a.visibilityScope === 'division') return a.divisionId === member.divisionId;
      if (a.visibilityScope === 'church') return a.churchId === member.churchId;
      return false;
    });
  }, [allAnnouncements, member]);

  const memberEvents = useMemo(() => {
    if (!member) return [];
    return allEvents.filter((e) => {
      if (e.visibilityScope === 'diocese') return e.dioceseId === member.dioceseId;
      if (e.visibilityScope === 'division') return e.divisionId === member.divisionId;
      if (e.visibilityScope === 'church') return e.churchId === member.churchId;
      return false;
    });
  }, [allEvents, member]);

  const isBootstrappedSuperAdmin = useMemo(() => {
    return (
      !!user?.emailVerified &&
      user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
    );
  }, [user]);

  const effectiveAdminRole: AdminRole | null = useMemo(() => {
    if (adminRecord) return adminRecord.role;
    if (isBootstrappedSuperAdmin) return 'diocese_secretary';
    return null;
  }, [adminRecord, isBootstrappedSuperAdmin]);

  const isAdmin = !!effectiveAdminRole;

  const signInWithGoogle = async (options?: { selectAccount?: boolean }) => {
    setError(null);
    try {
      await signInWithPopup(auth, getGoogleProvider(options?.selectAccount));
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Unable to sign in with Google.';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    await signOut(auth);
  };

  const saveMemberProfile = async (input: {
    fullName: string;
    phoneNumber: string;
    dioceseId: string;
    divisionId: string;
    districtId: string;
    churchId: string;
    subgroup?: string;
  }) => {
    if (!user) throw new Error('You must be signed in to save your profile.');
    const path = `members/${user.uid}`;
    const fullName = input.fullName.trim().slice(0, FIELD_LIMITS.fullNameMax);
    const phoneNumber = input.phoneNumber.trim().slice(0, FIELD_LIMITS.phoneMax);
    const subgroup = (input.subgroup || '').trim().slice(0, FIELD_LIMITS.subgroupMax);
    const email = (user.email || '').toLowerCase().slice(0, 180);

    try {
      const existingRef = doc(db, 'members', user.uid);
      if (member) {
        await updateDoc(existingRef, {
          fullName,
          phoneNumber,
          dioceseId: input.dioceseId,
          divisionId: input.divisionId,
          districtId: input.districtId || '',
          churchId: input.churchId,
          subgroup,
          preferredLanguage: member.preferredLanguage || 'en',
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(existingRef, {
          uid: user.uid,
          fullName,
          phoneNumber,
          email,
          dioceseId: input.dioceseId,
          divisionId: input.divisionId,
          districtId: input.districtId || '',
          churchId: input.churchId,
          subgroup,
          preferredLanguage: 'en',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, member ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const createAnnouncement = async (input: {
    title: string;
    summary: string;
    body: string;
    visibilityScope: VisibilityScope;
    dioceseId: string;
    divisionId: string;
    churchId: string;
    authorityLabel: string;
  }) => {
    if (!user) throw new Error('Authentication required.');
    try {
      await addDoc(collection(db, 'announcements'), {
        title: input.title.trim().slice(0, FIELD_LIMITS.titleMax),
        summary: input.summary.trim().slice(0, FIELD_LIMITS.summaryMax),
        body: input.body.trim().slice(0, FIELD_LIMITS.bodyMax),
        visibilityScope: input.visibilityScope,
        dioceseId: input.dioceseId,
        divisionId: input.visibilityScope === 'diocese' ? '' : input.divisionId,
        churchId: input.visibilityScope === 'church' ? input.churchId : '',
        authorityLabel: input.authorityLabel.trim().slice(0, FIELD_LIMITS.authorityLabelMax),
        authorUid: user.uid,
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'announcements');
    }
  };

  const updateAnnouncement = async (
    id: string,
    input: {
      title: string;
      summary: string;
      body: string;
      visibilityScope: VisibilityScope;
      divisionId: string;
      churchId: string;
      authorityLabel: string;
    }
  ) => {
    try {
      await updateDoc(doc(db, 'announcements', id), {
        title: input.title.trim().slice(0, FIELD_LIMITS.titleMax),
        summary: input.summary.trim().slice(0, FIELD_LIMITS.summaryMax),
        body: input.body.trim().slice(0, FIELD_LIMITS.bodyMax),
        visibilityScope: input.visibilityScope,
        divisionId: input.visibilityScope === 'diocese' ? '' : input.divisionId,
        churchId: input.visibilityScope === 'church' ? input.churchId : '',
        authorityLabel: input.authorityLabel.trim().slice(0, FIELD_LIMITS.authorityLabelMax),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `announcements/${id}`);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `announcements/${id}`);
    }
  };

  const createEvent = async (input: {
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
  }) => {
    if (!user) throw new Error('Authentication required.');
    try {
      await addDoc(collection(db, 'events'), {
        title: input.title.trim().slice(0, FIELD_LIMITS.titleMax),
        description: input.description.trim().slice(0, FIELD_LIMITS.descriptionMax),
        date: input.date.trim(),
        time: input.time.trim().slice(0, FIELD_LIMITS.timeMax),
        location: input.location.trim().slice(0, FIELD_LIMITS.locationMax),
        visibilityScope: input.visibilityScope,
        dioceseId: input.dioceseId,
        divisionId: input.visibilityScope === 'diocese' ? '' : input.divisionId,
        churchId: input.visibilityScope === 'church' ? input.churchId : '',
        organizerLabel: input.organizerLabel.trim().slice(0, FIELD_LIMITS.authorityLabelMax),
        authorUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'events');
    }
  };

  const updateEvent = async (
    id: string,
    input: {
      title: string;
      description: string;
      date: string;
      time: string;
      location: string;
      visibilityScope: VisibilityScope;
      divisionId: string;
      churchId: string;
      organizerLabel: string;
    }
  ) => {
    try {
      await updateDoc(doc(db, 'events', id), {
        title: input.title.trim().slice(0, FIELD_LIMITS.titleMax),
        description: input.description.trim().slice(0, FIELD_LIMITS.descriptionMax),
        date: input.date.trim(),
        time: input.time.trim().slice(0, FIELD_LIMITS.timeMax),
        location: input.location.trim().slice(0, FIELD_LIMITS.locationMax),
        visibilityScope: input.visibilityScope,
        divisionId: input.visibilityScope === 'diocese' ? '' : input.divisionId,
        churchId: input.visibilityScope === 'church' ? input.churchId : '',
        organizerLabel: input.organizerLabel.trim().slice(0, FIELD_LIMITS.authorityLabelMax),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `events/${id}`);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `events/${id}`);
    }
  };

  const updateChurchInfo = async (
    churchId: string,
    input: {
      name: string;
      pastorName: string;
      address: string;
      phone: string;
      serviceSchedule: string[];
      divisionId?: string;
      districtId?: string;
    }
  ) => {
    const cleanSchedule = input.serviceSchedule
      .map((s) => s.trim().slice(0, FIELD_LIMITS.serviceItemMax))
      .filter(Boolean)
      .slice(0, FIELD_LIMITS.serviceListMax);

    if (cleanSchedule.length === 0) {
      throw new Error('At least one service day and time is required.');
    }

    const payload: Record<string, unknown> = {
      name: input.name.trim().slice(0, 140),
      pastorName: input.pastorName.trim().slice(0, FIELD_LIMITS.fullNameMax),
      address: input.address.trim().slice(0, FIELD_LIMITS.addressMax),
      phone: input.phone.trim().slice(0, 40),
      serviceSchedule: cleanSchedule,
      updatedAt: serverTimestamp(),
    };

    if (input.divisionId !== undefined && effectiveAdminRole !== 'church_admin') {
      payload.divisionId = input.divisionId;
    }
    if (input.districtId !== undefined && effectiveAdminRole !== 'church_admin') {
      payload.districtId = input.districtId;
    }

    try {
      await updateDoc(doc(db, 'churches', churchId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `churches/${churchId}`);
    }
  };

  const createChurch = async (input: {
    dioceseId: string;
    divisionId: string;
    districtId: string;
    name: string;
    pastorName: string;
    address: string;
    phone: string;
    serviceSchedule: string[];
  }) => {
    const cleanSchedule = input.serviceSchedule
      .map((s) => s.trim().slice(0, FIELD_LIMITS.serviceItemMax))
      .filter(Boolean)
      .slice(0, FIELD_LIMITS.serviceListMax);

    if (cleanSchedule.length === 0) {
      throw new Error('At least one service schedule entry is required.');
    }

    try {
      await addDoc(collection(db, 'churches'), {
        dioceseId: input.dioceseId,
        divisionId: input.divisionId,
        districtId: input.districtId || '',
        name: input.name.trim().slice(0, 140),
        pastorName: input.pastorName.trim().slice(0, FIELD_LIMITS.fullNameMax),
        address: input.address.trim().slice(0, FIELD_LIMITS.addressMax),
        phone: input.phone.trim().slice(0, 40),
        serviceSchedule: cleanSchedule,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'churches');
    }
  };

  const createDivision = async (input: {
    dioceseId: string;
    name: string;
    headquarters: string;
    chairpersonName: string;
  }) => {
    try {
      await addDoc(collection(db, 'divisions'), {
        dioceseId: input.dioceseId,
        name: input.name.trim().slice(0, 120),
        headquarters: input.headquarters.trim().slice(0, 200),
        chairpersonName: input.chairpersonName.trim().slice(0, 120),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'divisions');
    }
  };

  const fetchScopedMembers = async (): Promise<MemberProfile[]> => {
    if (!effectiveAdminRole) return [];
    const dioceseId = adminRecord?.dioceseId || 'abuja';

    try {
      let q;
      if (effectiveAdminRole === 'diocese_secretary') {
        q = query(collection(db, 'members'), where('dioceseId', '==', dioceseId));
      } else if (effectiveAdminRole === 'division_admin' && adminRecord?.divisionId) {
        q = query(
          collection(db, 'members'),
          where('dioceseId', '==', dioceseId),
          where('divisionId', '==', adminRecord.divisionId)
        );
      } else if (effectiveAdminRole === 'church_admin' && adminRecord?.churchId) {
        q = query(
          collection(db, 'members'),
          where('dioceseId', '==', dioceseId),
          where('divisionId', '==', adminRecord.divisionId),
          where('churchId', '==', adminRecord.churchId)
        );
      } else {
        return [];
      }

      const snap = await getDocs(q);
      const list = snap.docs.map((d) => d.data() as MemberProfile);
      list.sort((a, b) => a.fullName.localeCompare(b.fullName));
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'members');
    }
  };

  const fetchAdminDirectory = async (): Promise<{
    admins: AdminRecord[];
    invites: AdminInvite[];
  }> => {
    const dioceseId = adminRecord?.dioceseId || 'abuja';
    try {
      const [adminsSnap, invitesSnap] = await Promise.all([
        getDocs(query(collection(db, 'admins'), where('dioceseId', '==', dioceseId))),
        getDocs(query(collection(db, 'adminInvites'), where('dioceseId', '==', dioceseId))),
      ]);
      const admins = adminsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AdminRecord, 'id'>),
      }));
      const invites = invitesSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AdminInvite, 'id'>),
      }));
      return { admins, invites };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'admins');
    }
  };

  const assignAdminInvite = async (input: {
    email: string;
    fullName: string;
    role: AdminRole;
    dioceseId: string;
    divisionId: string;
    churchId: string;
  }) => {
    if (!user) throw new Error('Authentication required.');
    const normalizedEmail = input.email.trim().toLowerCase();
    try {
      await addDoc(collection(db, 'adminInvites'), {
        email: normalizedEmail,
        fullName: input.fullName.trim().slice(0, FIELD_LIMITS.fullNameMax),
        role: input.role,
        dioceseId: input.dioceseId,
        divisionId: input.role === 'diocese_secretary' ? '' : input.divisionId,
        churchId: input.role === 'church_admin' ? input.churchId : '',
        assignedBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'adminInvites');
    }
  };

  const revokeAdmin = async (adminId: string) => {
    try {
      await deleteDoc(doc(db, 'admins', adminId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `admins/${adminId}`);
    }
  };

  const revokeAdminInvite = async (inviteId: string) => {
    try {
      await deleteDoc(doc(db, 'adminInvites', inviteId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `adminInvites/${inviteId}`);
    }
  };

  return (
    <ChurchContext.Provider
      value={{
        user,
        authLoading,
        dataLoading,
        error,
        clearError: () => setError(null),
        signInWithGoogle,
        logout,
        dioceses,
        divisions,
        districts,
        churches,
        member,
        memberLoaded,
        currentDiocese,
        currentDivision,
        currentDistrict,
        currentChurch,
        memberAnnouncements,
        memberEvents,
        allAnnouncements,
        allEvents,
        adminRecord,
        isAdmin,
        isBootstrappedSuperAdmin,
        effectiveAdminRole,
        saveMemberProfile,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        createEvent,
        updateEvent,
        deleteEvent,
        updateChurchInfo,
        createChurch,
        createDivision,
        fetchScopedMembers,
        fetchAdminDirectory,
        assignAdminInvite,
        revokeAdmin,
        revokeAdminInvite,
      }}
    >
      {children}
    </ChurchContext.Provider>
  );
};
