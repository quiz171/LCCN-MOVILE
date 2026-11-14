import { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';

let seedPromise: Promise<void> | null = null;

export async function seedAbujaDioceseIfNeeded(user: User): Promise<void> {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const metaRef = doc(db, 'meta', 'seeded_v1');
    try {
      const metaSnap = await getDoc(metaRef);
      if (metaSnap.exists()) {
        return;
      }
    } catch {
      // Proceed to check diocese doc if meta doc is missing
    }

    const dioceseSnap = await getDoc(doc(db, 'dioceses', 'abuja'));
    if (dioceseSnap.exists()) {
      return;
    }

    const now = serverTimestamp();
    const batch = writeBatch(db);

    batch.set(metaRef, {
      seededBy: user.uid,
      seededAt: now,
    });

    batch.set(doc(db, 'dioceses', 'abuja'), {
      name: 'Abuja Diocese',
      bishopName: 'Rt. Rev. Musa Audu',
      headquarters: 'LCCN Diocesan Secretariat, Abuja, FCT',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const divisions = [
      {
        id: 'abuja_div',
        name: 'Abuja Division',
        headquarters: 'Garki Area 1, Abuja',
        chairpersonName: 'Rev. Jonah Bitrus',
      },
      {
        id: 'nyanya_div',
        name: 'Nyanya / Karu Division',
        headquarters: 'Nyanya, FCT Abuja',
        chairpersonName: 'Very Rev. Markus Tukur',
      },
      {
        id: 'kubwa_div',
        name: 'Kubwa / Bwari Division',
        headquarters: 'Kubwa Phase 2, Abuja',
        chairpersonName: 'Rev. Daniel Bello',
      },
      {
        id: 'gwagwalada_div',
        name: 'Gwagwalada Division',
        headquarters: 'Gwagwalada, FCT Abuja',
        chairpersonName: 'Rev. Ruth Wakili',
      },
    ];

    for (const div of divisions) {
      batch.set(doc(db, 'divisions', div.id), {
        dioceseId: 'abuja',
        name: div.name,
        headquarters: div.headquarters,
        chairpersonName: div.chairpersonName,
        createdAt: now,
        updatedAt: now,
      });
    }

    const districts = [
      { id: 'garki_dist', divisionId: 'abuja_div', name: 'Garki District' },
      { id: 'wuse_dist', divisionId: 'abuja_div', name: 'Wuse / Utako District' },
      { id: 'nyanya_central_dist', divisionId: 'nyanya_div', name: 'Nyanya Central District' },
    ];

    for (const dist of districts) {
      batch.set(doc(db, 'districts', dist.id), {
        dioceseId: 'abuja',
        divisionId: dist.divisionId,
        name: dist.name,
        createdAt: now,
        updatedAt: now,
      });
    }

    const churches = [
      {
        id: 'area_1_church',
        divisionId: 'abuja_div',
        districtId: 'garki_dist',
        name: 'Area 1 Church',
        pastorName: 'Rev. Jonah Bitrus',
        address: 'Plot 412, Area 1 Section 1, Garki, Abuja, FCT',
        phone: '+234 803 412 1900',
        serviceSchedule: [
          'Sunday Worship (English): 7:30 AM – 9:15 AM',
          'Sunday Worship (Hausa & English): 9:30 AM – 11:30 AM',
          'Wednesday Bible Study: 5:30 PM – 6:45 PM',
          'Friday Evening Prayer: 5:30 PM – 6:30 PM',
        ],
      },
      {
        id: 'utako_church',
        divisionId: 'abuja_div',
        districtId: 'wuse_dist',
        name: 'LCCN Utako Fellowship',
        pastorName: 'Rev. Sarah Ishaya',
        address: 'Plot 18, Obafemi Awolowo Way, Utako District, Abuja',
        phone: '+234 805 220 4411',
        serviceSchedule: [
          'Sunday Worship Service: 8:30 AM – 10:30 AM',
          'Wednesday Midweek Fellowship: 6:00 PM – 7:00 PM',
        ],
      },
      {
        id: 'nyanya_cathedral',
        divisionId: 'nyanya_div',
        districtId: 'nyanya_central_dist',
        name: "St. Paul's Cathedral, Nyanya",
        pastorName: 'Very Rev. Markus Tukur',
        address: 'Cathedral Way, Off Nyanya-Karu Road, Nyanya, Abuja',
        phone: '+234 802 901 3340',
        serviceSchedule: [
          'Sunday First Service: 7:00 AM – 9:00 AM',
          'Sunday Second Service: 9:30 AM – 11:30 AM',
          'Thursday Prayer & Teaching: 5:00 PM – 6:30 PM',
        ],
      },
      {
        id: 'kubwa_church',
        divisionId: 'kubwa_div',
        districtId: '',
        name: 'LCCN Kubwa Parish',
        pastorName: 'Rev. Daniel Bello',
        address: 'Phase 2 Site 2, Beside Federal Housing Junction, Kubwa, Abuja',
        phone: '+234 809 311 7820',
        serviceSchedule: [
          'Sunday Worship Service: 8:00 AM – 10:30 AM',
          'Wednesday Bible Study: 5:30 PM – 6:45 PM',
        ],
      },
      {
        id: 'gwagwalada_church',
        divisionId: 'gwagwalada_div',
        districtId: '',
        name: 'LCCN Gwagwalada Central',
        pastorName: 'Rev. Ruth Wakili',
        address: 'Specialist Hospital Road, Gwagwalada, Abuja, FCT',
        phone: '+234 806 544 1029',
        serviceSchedule: [
          'Sunday Worship Service: 8:00 AM – 10:15 AM',
          'Wednesday Teaching Service: 5:00 PM – 6:15 PM',
        ],
      },
    ];

    for (const church of churches) {
      batch.set(doc(db, 'churches', church.id), {
        dioceseId: 'abuja',
        divisionId: church.divisionId,
        districtId: church.districtId,
        name: church.name,
        pastorName: church.pastorName,
        address: church.address,
        phone: church.phone,
        serviceSchedule: church.serviceSchedule,
        createdAt: now,
        updatedAt: now,
      });
    }

    const announcements = [
      {
        id: 'ann_diocese_synod_2026',
        title: 'Abuja Diocese Annual Thanksgiving & Prayer Convocation',
        summary: 'All congregations across Abuja Diocese are invited to join our unified November Thanksgiving Sunday and Diocesan prayer week.',
        body: 'Dear brothers and sisters in Christ,\n\nGrace and peace to you from God our Father and the Lord Jesus Christ.\n\nThe Abuja Diocesan Council warmly announces the 2026 Diocesan Thanksgiving and Prayer Convocation taking place across all divisions this month. Every local church is encouraged to observe a three-day evening prayer focus from Wednesday to Friday ahead of our combined Diocesan Thanksgiving Sunday.\n\nDelegations from Area 1, Nyanya, Kubwa, and Gwagwalada divisions will gather at St. Paul\'s Cathedral, Nyanya for the closing fellowship service. Please coordinate transportation with your local Church Secretary.',
        visibilityScope: 'diocese',
        divisionId: '',
        churchId: '',
        authorityLabel: 'Abuja Diocese General Secretary',
      },
      {
        id: 'ann_abuja_div_choir',
        title: 'Abuja Division Combined Choir Rehearsal',
        summary: 'All choristers from Area 1 Church and Utako Fellowship will meet this Saturday morning at Area 1 Church.',
        body: 'Beloved choristers and music directors in Abuja Division,\n\nPlease take note that the combined Abuja Division Choir rehearsal is scheduled for this Saturday at 9:00 AM inside the Area 1 Church sanctuary.\n\nWe will be practicing hymns for the upcoming Diocesan Thanksgiving Convocation. Kindly arrive 15 minutes early with your hymnals and choir robes for fitting.',
        visibilityScope: 'division',
        divisionId: 'abuja_div',
        churchId: '',
        authorityLabel: 'Abuja Division Administrator',
      },
      {
        id: 'ann_area1_welfare',
        title: 'Area 1 Church Sunday School & Youth Fellowship Resumption',
        summary: 'Children Sunday School and Youth Bible Class resume their full morning schedule at Area 1 Church this Sunday.',
        body: 'Dear members of Area 1 Church,\n\nWe are pleased to announce that both Children Sunday School and the Youth Fellowship Bible Class are back to their full Sunday schedule starting this week at 8:45 AM in the Education Wing.\n\nParents are encouraged to bring their children early so they can settle in before the 9:30 AM worship service begins. New Sunday School teachers are also invited to meet with Rev. Jonah Bitrus briefly after the second service.',
        visibilityScope: 'church',
        divisionId: 'abuja_div',
        churchId: 'area_1_church',
        authorityLabel: 'Area 1 Church Secretary',
      },
      {
        id: 'ann_nyanya_building',
        title: 'St. Paul’s Cathedral Sanitation & Sanctuary Preparation',
        summary: 'All church groups in Nyanya are requested to participate in Saturday morning sanctuary care.',
        body: 'Members of St. Paul\'s Cathedral, Nyanya are warmly invited to join our monthly sanctuary care and grounds preparation this Saturday from 7:30 AM to 9:30 AM ahead of the Diocesan Convocation.',
        visibilityScope: 'church',
        divisionId: 'nyanya_div',
        churchId: 'nyanya_cathedral',
        authorityLabel: "St. Paul's Cathedral Secretary",
      },
      {
        id: 'ann_kubwa_fellowship',
        title: 'Kubwa Division Women Fellowship Outreach',
        summary: 'LCCN Women Fellowship in Kubwa Division will host a community hospital visit next Tuesday.',
        body: 'The Kubwa Division Women Fellowship invites all women leaders and members to join our mercy and hospital visitation outreach next Tuesday at 10:00 AM, departing from LCCN Kubwa Parish.',
        visibilityScope: 'division',
        divisionId: 'kubwa_div',
        churchId: '',
        authorityLabel: 'Kubwa / Bwari Division Administrator',
      },
    ];

    for (const ann of announcements) {
      batch.set(doc(db, 'announcements', ann.id), {
        title: ann.title,
        summary: ann.summary,
        body: ann.body,
        visibilityScope: ann.visibilityScope,
        dioceseId: 'abuja',
        divisionId: ann.divisionId,
        churchId: ann.churchId,
        authorityLabel: ann.authorityLabel,
        authorUid: user.uid,
        publishedAt: now,
        updatedAt: now,
      });
    }

    const events = [
      {
        id: 'evt_diocese_thanksgiving',
        title: 'Abuja Diocese Annual Thanksgiving Service',
        description: 'Combined worship, choir ministration, and prayers for families and the nation across Abuja Diocese.',
        date: '2026-11-29',
        time: '9:00 AM',
        location: "St. Paul's Cathedral, Nyanya, Abuja",
        visibilityScope: 'diocese',
        divisionId: '',
        churchId: '',
        organizerLabel: 'LCCN Abuja Diocese',
      },
      {
        id: 'evt_abuja_div_leaders',
        title: 'Abuja Division Elders & Church Council Retreat',
        description: 'Quarterly leadership fellowship, planning, and pastoral briefing for elders and church secretaries in Abuja Division.',
        date: '2026-11-21',
        time: '10:00 AM',
        location: 'Area 1 Church Fellowship Hall, Garki, Abuja',
        visibilityScope: 'division',
        divisionId: 'abuja_div',
        churchId: '',
        organizerLabel: 'Abuja Division',
      },
      {
        id: 'evt_area1_sunday_service',
        title: 'Sunday Morning Worship & Holy Communion',
        description: 'Join the congregation for worship, Scripture reading, sermon by Rev. Jonah Bitrus, and Holy Communion.',
        date: '2026-11-15',
        time: '7:30 AM & 9:30 AM',
        location: 'Area 1 Church Sanctuary, Garki, Abuja',
        visibilityScope: 'church',
        divisionId: 'abuja_div',
        churchId: 'area_1_church',
        organizerLabel: 'Area 1 Church',
      },
      {
        id: 'evt_area1_bible_study',
        title: 'Midweek Bible Study & Intercessory Prayer',
        description: 'Interactive study in the Epistle to the Philippians followed by congregational prayer.',
        date: '2026-11-18',
        time: '5:30 PM',
        location: 'Area 1 Church Main Hall, Garki, Abuja',
        visibilityScope: 'church',
        divisionId: 'abuja_div',
        churchId: 'area_1_church',
        organizerLabel: 'Area 1 Church',
      },
      {
        id: 'evt_kubwa_youth_rally',
        title: 'Kubwa Division Youth & Young Adults Summit',
        description: 'A day of worship, discipleship workshops, and fellowship for youths across Kubwa/Bwari Division.',
        date: '2026-11-22',
        time: '2:00 PM',
        location: 'LCCN Kubwa Parish, Phase 2, Kubwa',
        visibilityScope: 'division',
        divisionId: 'kubwa_div',
        churchId: '',
        organizerLabel: 'Kubwa / Bwari Division',
      },
    ];

    for (const evt of events) {
      batch.set(doc(db, 'events', evt.id), {
        title: evt.title,
        description: evt.description,
        date: evt.date,
        time: evt.time,
        location: evt.location,
        visibilityScope: evt.visibilityScope,
        dioceseId: 'abuja',
        divisionId: evt.divisionId,
        churchId: evt.churchId,
        organizerLabel: evt.organizerLabel,
        authorUid: user.uid,
        createdAt: now,
        updatedAt: now,
      });
    }

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'meta/seeded_v1');
    }
  })().finally(() => {
    seedPromise = null;
  });

  return seedPromise;
}
