import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfigPath = path.join(__dirname, 'firebase-applet-config.json');
let firebaseApiKey = '';
if (fs.existsSync(firebaseConfigPath)) {
  try {
    const rawConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    firebaseApiKey = rawConfig.apiKey || '';
  } catch {
    firebaseApiKey = '';
  }
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string; email?: string } | null> {
  if (!idToken || !firebaseApiKey) return null;
  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!resp.ok) return null;
    const data = (await resp.json()) as { users?: Array<{ localId?: string; email?: string }> };
    const user = data.users?.[0];
    if (!user?.localId) return null;
    return { uid: user.localId, email: user.email };
  } catch {
    return null;
  }
}

interface AssistantContextPayload {
  member: {
    fullName: string;
    dioceseName: string;
    divisionName: string;
    districtName?: string;
    churchName: string;
    subgroup?: string;
  };
  church: {
    name: string;
    pastorName: string;
    address: string;
    phone?: string;
    serviceSchedule: string[];
  };
  announcements: Array<{
    title: string;
    summary: string;
    body: string;
    scope: string;
    authorityLabel: string;
    publishedDate: string;
  }>;
  events: Array<{
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    scope: string;
    organizerLabel: string;
  }>;
}

interface ChatHistoryTurn {
  role: 'user' | 'assistant';
  text: string;
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      const verifiedUser = await verifyFirebaseIdToken(token);

      if (!verifiedUser) {
        return res.status(401).json({ error: 'Authentication required to use the LCCN Smart Assistant.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          error: 'The Smart Assistant service is currently unavailable because no Gemini API key is configured.',
        });
      }

      const { message, history = [], churchContext } = req.body as {
        message?: string;
        history?: ChatHistoryTurn[];
        churchContext?: AssistantContextPayload;
      };

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Please enter a question for the Smart Assistant.' });
      }

      if (!churchContext || !churchContext.church || !churchContext.member) {
        return res.status(400).json({ error: 'Church context is required to answer your question.' });
      }

      const announcementsBlock =
        churchContext.announcements.length > 0
          ? churchContext.announcements
              .map(
                (a, idx) =>
                  `${idx + 1}. [${a.scope.toUpperCase()}] "${a.title}" (Published: ${a.publishedDate}, By: ${a.authorityLabel})\nSummary: ${a.summary}\nFull Message: ${a.body}`
              )
              .join('\n\n')
          : 'No announcements are currently published for this member.';

      const eventsBlock =
        churchContext.events.length > 0
          ? churchContext.events
              .map(
                (e, idx) =>
                  `${idx + 1}. [${e.scope.toUpperCase()}] "${e.title}" — Date: ${e.date}, Time: ${e.time}, Location: ${e.location}, Organizer: ${e.organizerLabel}\nDetails: ${e.description}`
              )
              .join('\n\n')
          : 'No upcoming events are currently scheduled for this member.';

      const systemInstruction = `You are the official Smart Assistant for the Lutheran Church of Christ in Nigeria (LCCN) Digital Church App.
You are speaking with ${churchContext.member.fullName}, a registered member of:
- Diocese: ${churchContext.member.dioceseName}
- Division: ${churchContext.member.divisionName}${churchContext.member.districtName ? `\n- District: ${churchContext.member.districtName}` : ''}
- Local Church: ${churchContext.church.name}${churchContext.member.subgroup ? `\n- Fellowship / Subgroup: ${churchContext.member.subgroup}` : ''}

CHURCH PROFILE (GROUND TRUTH):
- Church Name: ${churchContext.church.name}
- Pastor: ${churchContext.church.pastorName}
- Physical Address: ${churchContext.church.address}
- Phone: ${churchContext.church.phone || 'Not listed in church directory'}
- Service Days & Times: ${churchContext.church.serviceSchedule.join('; ')}

LATEST ANNOUNCEMENTS IN THIS MEMBER'S HIERARCHY:
${announcementsBlock}

UPCOMING EVENTS IN THIS MEMBER'S HIERARCHY:
${eventsBlock}

STRICT RULES:
1. Answer ONLY using the church profile, announcements, and events provided above.
2. NEVER invent, guess, or fabricate pastor names, service times, addresses, phone numbers, announcements, or events.
3. If the requested information is not present in the provided records, state clearly and politely: "I do not have that information in the current LCCN church records. Please contact your church secretary or pastor directly."
4. Keep answers clear, warm, concise, and easy to read for both young and elderly church members. Use short paragraphs or simple bullet points.`;

      const recentHistory = Array.isArray(history) ? history.slice(-8) : [];
      const conversationTurns = [
        ...recentHistory.map((turn) => ({
          role: turn.role === 'assistant' ? ('model' as const) : ('user' as const),
          parts: [{ text: String(turn.text || '').slice(0, 2000) }],
        })),
        {
          role: 'user' as const,
          parts: [{ text: message.trim().slice(0, 2000) }],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: conversationTurns,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const reply = response.text?.trim();
      if (!reply) {
        return res.status(502).json({
          error: 'The Smart Assistant returned an empty response. Please try asking again.',
        });
      }

      return res.json({ reply });
    } catch (err) {
      console.error('Assistant endpoint error:', err);
      const message = err instanceof Error ? err.message : 'Unable to reach Smart Assistant right now.';
      return res.status(500).json({ error: message });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`LCCN Abuja Diocese server running on http://0.0.0.0:${port}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
