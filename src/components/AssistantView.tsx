import React, { useEffect, useRef, useState } from 'react';
import { Send, RotateCcw } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { UI_STRINGS } from '../i18n/strings';
import { ChatMessage } from '../types/lccn';

export const AssistantView: React.FC = () => {
  const {
    user,
    member,
    currentDiocese,
    currentDivision,
    currentDistrict,
    currentChurch,
    memberAnnouncements,
    memberEvents,
  } = useChurch();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Peace be with you${member?.fullName ? `, ${member.fullName.split(' ')[0]}` : ''}. I can answer questions using your church's official records for ${currentChurch?.name || 'your parish'}, announcements, and upcoming events. How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || sending || !user || !member || !currentChurch) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const idToken = await user.getIdToken();
      const churchContext = {
        member: {
          fullName: member.fullName,
          dioceseName: currentDiocese?.name || 'Abuja Diocese',
          divisionName: currentDivision?.name || '',
          districtName: currentDistrict?.name || '',
          churchName: currentChurch.name,
          subgroup: member.subgroup || '',
        },
        church: {
          name: currentChurch.name,
          pastorName: currentChurch.pastorName,
          address: currentChurch.address,
          phone: currentChurch.phone || '',
          serviceSchedule: currentChurch.serviceSchedule,
        },
        announcements: memberAnnouncements.slice(0, 15).map((a) => ({
          title: a.title,
          summary: a.summary,
          body: a.body,
          scope: a.visibilityScope,
          authorityLabel: a.authorityLabel,
          publishedDate:
            a.publishedAt && typeof a.publishedAt.toDate === 'function'
              ? a.publishedAt.toDate().toISOString().split('T')[0]
              : 'Recent',
        })),
        events: memberEvents.slice(0, 15).map((e) => ({
          title: e.title,
          description: e.description,
          date: e.date,
          time: e.time,
          location: e.location,
          scope: e.visibilityScope,
          organizerLabel: e.organizerLabel,
        })),
      };

      const historyPayload = nextMessages
        .filter((m) => m.id !== 'welcome' && !m.isError)
        .slice(-8)
        .map((m) => ({ role: m.role, text: m.text }));

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload.slice(0, -1),
          churchContext,
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !data.reply) {
        throw new Error(
          data.error || 'Could not reach the LCCN Smart Assistant right now.'
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: data.reply!,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      const errorText =
        err instanceof Error
          ? err.message
          : 'Unable to answer right now. Please check your connection and try again.';
      setMessages((prev) => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          role: 'assistant',
          text: errorText,
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuestion(input);
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: `Peace be with you${member?.fullName ? `, ${member.fullName.split(' ')[0]}` : ''}. Ask me anything about ${currentChurch?.name || 'your church'}, service times, announcements, or upcoming events.`,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)] sm:h-[calc(100vh-9.5rem)] max-h-[760px] bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-white">
        <div>
          <h1 className="font-display text-lg font-bold text-navy-900">
            Smart Assistant
          </h1>
          <p className="text-xs text-slate-500">
            Grounded in {currentChurch?.name || 'Abuja Diocese'} records
          </p>
        </div>

        <button
          type="button"
          onClick={resetChat}
          className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-surface-50 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-surface-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm sm:text-base leading-relaxed whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-navy-900 text-white rounded-br-sm'
                  : msg.isError
                  ? 'bg-red-50 border border-red-200 text-red-900 rounded-bl-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-slate-500">
              Checking church records...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested Starter Prompts */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-white overflow-x-auto">
        <div className="flex items-center gap-2">
          {UI_STRINGS.en.assistantPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={sending}
              onClick={() => sendQuestion(prompt)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-200 bg-surface-50 text-xs sm:text-sm font-medium text-navy-900 hover:bg-navy-50 hover:border-navy-700/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Composer */}
      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-4 border-t border-slate-200 bg-white flex items-center gap-2.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about services, pastor, events, or announcements..."
          aria-label="Ask the LCCN Smart Assistant"
          disabled={sending}
          className="flex-1 min-h-[48px] px-4 py-3 rounded-xl border border-slate-200 bg-surface-50 text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:bg-white"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send question"
          className="min-h-[48px] min-w-[48px] px-4 rounded-xl bg-navy-900 text-white flex items-center justify-center hover:bg-navy-800 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
        >
          <Send className="w-5 h-5 text-gold-400" />
        </button>
      </form>
    </div>
  );
};
