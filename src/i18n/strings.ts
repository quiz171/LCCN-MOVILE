export const UI_STRINGS = {
  en: {
    appTitle: 'LCCN Abuja Diocese',
    appSubtitle: 'Lutheran Church of Christ in Nigeria',
    nav: {
      home: 'Home',
      announcements: 'Announcements',
      events: 'Events',
      assistant: 'Assistant',
      profile: 'Profile',
    },
    scopes: {
      all: 'All',
      diocese: 'Diocese',
      division: 'Division',
      church: 'Church',
    },
    roles: {
      diocese_secretary: 'Abuja Diocese General Secretary',
      division_admin: 'Division Administrator',
      church_admin: 'Church Administrator',
    },
    assistantPrompts: [
      'What are the latest announcements in my church?',
      'When is the next church service?',
      'Who is our pastor?',
      'Where is my church located?',
      'What events are coming up?',
      'What has the Diocese announced?',
    ],
  },
} as const;
