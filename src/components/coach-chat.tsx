"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BrainCircuit,
  Sparkles,
  Send,
  Copy,
  Check,
  RotateCcw,
  User,
  Zap,
  Dumbbell,
  Apple,
  Activity,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  source?: "gemini" | "sports-science-engine";
  model?: string;
}

export interface CoachAthleteContext {
  fullName?: string;
  age?: number;
  gender?: string;
  weightLbs?: number;
  weightKg?: number;
  heightCm?: number;
  goal?: string;
  activityLevel?: string;
  splitType?: string;
  splitDays?: number;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  equipment?: string;
}

interface CoachChatProps {
  athleteContext?: CoachAthleteContext;
  hasProfile?: boolean;
}

const QUICK_PROMPTS = [
  {
    icon: Dumbbell,
    category: "Biomechanics",
    tag: "Joint Adaptation",
    question: "Shoulder discomfort during barbell bench press?",
  },
  {
    icon: Activity,
    category: "Progressive Overload",
    tag: "Squat RFD",
    question: "Plateaued on squat for 3 consecutive weeks?",
  },
  {
    icon: Apple,
    category: "Metabolic Nutrition",
    tag: "Glycogen Supercompensation",
    question: "Missed caloric intake on a heavy training day?",
  },
  {
    icon: Zap,
    category: "Autoregulation",
    tag: "CNS Fatigue",
    question: "How do I know when to take an autoregulated deload?",
  },
  {
    icon: Dumbbell,
    category: "Pull Mechanics",
    tag: "Lumbar Shear",
    question: "Lower back fatigue during heavy deadlifts?",
  },
  {
    icon: Apple,
    category: "Nutrient Timing",
    tag: "Peri-Workout",
    question: "Optimal pre-workout meal & sodium timing for pump?",
  },
];

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome-msg",
  role: "assistant",
  content: `👋 **Welcome to your StrengthWise AI Coaching Lab!**

I am your dedicated **Clinical Exercise Physiologist & Sports Science Specialist** (CSCS, Biomechanics & Sports Nutrition certified).

I have full contextual integration with your biometric profile, training split, and nutritional targets. Ask me anything, including:
- **Acute Exercise Substitutions** for joint discomfort (bench, squat, deadlift variations)
- **Progressive Overload & Plateau Breaking** (rate of force development, pauses, tempo)
- **Peri-Workout Fueling & Glycogen Timing** (leucine thresholds, intra-workout carbs)
- **Autoregulated Deloads** & Central Nervous System recovery protocols

*Select a quick consultation below or type your specific question!*`,
  timestamp: "Just now",
  source: "sports-science-engine",
  model: "strengthwise-specialist",
};

export function CoachChat({ athleteContext, hasProfile = true }: CoachChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history from localStorage on initial render
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sw_coach_chat_history");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // Fallback
    }
    setMessages([INITIAL_WELCOME_MESSAGE]);
  }, []);

  // Save chat history to localStorage on updates
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem("sw_coach_chat_history", JSON.stringify(messages));
      } catch {
        // LocalStorage quota or privacy guard
      }
    }
  }, [messages]);

  // Auto-scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Adjust textarea height automatically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  // Modern Web Guidance: IME-safe Enter-to-Submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Check native isComposing or Safari keyCode 229 fallback
      if (e.nativeEvent.isComposing || (e as unknown as { keyCode?: number }).keyCode === 229) {
        return;
      }
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setIsLoading(true);

    try {
      const response = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          athleteContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message || "I have analyzed your biomechanics and training variables.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: data.source,
        model: data.model,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      // Graceful offline fallback
      const fallbackMessage: ChatMessage = {
        id: `assistant-fallback-${Date.now()}`,
        role: "assistant",
        content: `### 🔬 Sports Science Analysis & Coaching Guidance
Regarding **"${query}"**:

Every athletic adaptation is governed by the **Specific Adaptations to Imposed Demands (SAID)** law. When dialing in your training:

1. **Mechanical Tension & Intensity**: Conduct your primary compound lifts within **RPE 7-8.5 (1-3 reps in reserve)** to ensure motor unit recruitment without excessive non-functional fatigue.
2. **Joint Angle & Lever Optimization**: When joint discomfort arises, adjust the moment arm by rotating grips 45° or elevating joint angles to widen the subacromial or patellofemoral space.
3. **Nutritional Architecture**: Maintain daily protein at **1.0g per lb of body weight** (${athleteContext?.weightLbs || 185}g) and time 35-50g of carbohydrates 90 minutes prior to training.

### 💡 Prescription & Action Item:
- Apply progressive overload incrementally (+2.5 lbs or +1 repetition per set).
- Log your session metrics in your Workout Log to track systemic fatigue.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: "sports-science-engine",
        model: "strengthwise-specialist",
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  const handleResetChat = () => {
    if (confirm("Reset conversation and start fresh with AI Coach?")) {
      const resetMessages = [INITIAL_WELCOME_MESSAGE];
      setMessages(resetMessages);
      try {
        localStorage.removeItem("sw_coach_chat_history");
      } catch {}
    }
  };

  // Render markdown text cleanly with bolding, headings, and bullet points
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return (
      <div className="space-y-2.5 text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          // Heading 3: ###
          if (trimmed.startsWith("### ")) {
            return (
              <h4
                key={idx}
                className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-1.5 pt-2 pb-0.5 border-b border-neutral-800/80"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{trimmed.replace(/^###\s+/, "")}</span>
              </h4>
            );
          }

          // Bullet points: - or *
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            const bulletText = trimmed.replace(/^[-*]\s+/, "");
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5">
                <span className="text-emerald-400 font-bold mt-1 text-[10px]">•</span>
                <span className="flex-1">{formatInlineMarkdown(bulletText)}</span>
              </div>
            );
          }

          // Numbered list: 1. 2. etc
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5">
                <span className="text-emerald-400 font-bold font-mono text-[11px] shrink-0 mt-0.5">
                  {numMatch[1]}.
                </span>
                <span className="flex-1">{formatInlineMarkdown(numMatch[2])}</span>
              </div>
            );
          }

          // Highlighted callout blocks for prescriptions
          if (trimmed.startsWith("💡") || trimmed.startsWith("⚡") || trimmed.startsWith("🔬")) {
            return (
              <div
                key={idx}
                className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-2.5 my-1 text-emerald-200 text-xs font-medium"
              >
                {formatInlineMarkdown(trimmed)}
              </div>
            );
          }

          // Regular paragraph
          return <p key={idx}>{formatInlineMarkdown(line)}</p>;
        })}
      </div>
    );
  };

  // Helper to render bolding **text** and code `text`
  const formatInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="rounded bg-neutral-800/80 px-1.5 py-0.5 font-mono text-[11px] text-emerald-300 border border-neutral-700/60"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="rounded-3xl border border-neutral-800/80 bg-neutral-900/90 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col transition-all">
      {/* 1. Sleek Chatbot Header */}
      <div className="border-b border-neutral-800 bg-neutral-950/80 px-5 py-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 text-neutral-950 font-black shadow-lg shadow-emerald-500/25">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-neutral-950"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                StrengthWise AI Coach
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 font-mono">
                <ShieldCheck className="h-3 w-3" />
                CSCS Sports Scientist
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              Online &amp; Context-Calibrated
              {athleteContext?.weightLbs && (
                <span className="hidden sm:inline text-neutral-500">
                  • {athleteContext.weightLbs} lbs • {athleteContext.splitType || "Split Active"}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQuickPrompts(!showQuickPrompts)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition flex items-center gap-1.5 ${
              showQuickPrompts
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:text-white"
            }`}
            title="Toggle consultation quick-picks"
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Suggested Topics</span>
          </button>

          <button
            type="button"
            onClick={handleResetChat}
            className="rounded-xl border border-neutral-800 bg-neutral-800/40 p-2 text-neutral-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition"
            title="Reset conversation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Biometric Active Context Bar */}
      {athleteContext && (athleteContext.weightLbs || athleteContext.targetCalories) && (
        <div className="bg-neutral-950/40 border-b border-neutral-800/60 px-5 py-2 text-[11px] text-neutral-400 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">
              Active Athlete Profile:
            </span>
            {athleteContext.fullName && (
              <span className="text-neutral-300 font-medium">{athleteContext.fullName}</span>
            )}
            {athleteContext.weightLbs && (
              <span className="rounded bg-neutral-800/70 px-2 py-0.5 font-mono text-emerald-300 border border-neutral-700/60">
                {athleteContext.weightLbs} lbs
              </span>
            )}
            {athleteContext.splitType && (
              <span className="rounded bg-neutral-800/70 px-2 py-0.5 text-neutral-300 border border-neutral-700/60">
                {athleteContext.splitType}
              </span>
            )}
            {athleteContext.targetCalories && (
              <span className="rounded bg-neutral-800/70 px-2 py-0.5 font-mono text-cyan-300 border border-neutral-700/60">
                {athleteContext.targetCalories} kcal
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">
            {hasProfile ? "Real-time Biomechanical Reasoning" : "Demo Mode • Complete Profile to Customize"}
          </span>
        </div>
      )}

      {/* 3. Quick-Pick Prompt Carousel / Drawer */}
      {showQuickPrompts && (
        <div className="border-b border-neutral-800/80 bg-neutral-950/60 p-3 sm:p-4">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Tap to Consult Coach on Core Scenarios:</span>
            <span className="text-[10px] text-neutral-500">1-click sports science query</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {QUICK_PROMPTS.map((prompt, idx) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt.question)}
                  disabled={isLoading}
                  className="group rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-emerald-500/10 hover:border-emerald-500/40 p-2.5 text-left transition flex items-center gap-2.5 disabled:opacity-50"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 group-hover:bg-emerald-500 group-hover:text-neutral-950 transition">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-neutral-500 group-hover:text-emerald-400">
                      <span>{prompt.category}</span>
                      <span className="truncate">{prompt.tag}</span>
                    </div>
                    <div className="truncate text-xs font-semibold text-neutral-300 group-hover:text-white transition">
                      {prompt.question}
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-emerald-400 shrink-0 transition" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Chat Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-h-[520px] min-h-[340px]">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Message Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-md ${
                  isUser
                    ? "bg-gradient-to-tr from-emerald-500 to-teal-400 text-neutral-950 font-bold"
                    : "bg-gradient-to-br from-emerald-400 to-emerald-600 text-neutral-950 font-black"
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
              </div>

              {/* Message Bubble Container */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div
                  className={`flex items-center gap-2 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <span className="text-[11px] font-bold text-neutral-400">
                    {isUser ? (athleteContext?.fullName || "You") : "StrengthWise AI Coach"}
                  </span>
                  {!isUser && msg.model && (
                    <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 text-[9px] font-mono">
                      {msg.model}
                    </span>
                  )}
                  <span className="text-[10px] text-neutral-500">{msg.timestamp}</span>
                </div>

                <div
                  className={`relative group rounded-2xl p-4 sm:p-5 shadow-lg border transition ${
                    isUser
                      ? "bg-gradient-to-br from-emerald-600/20 via-emerald-700/15 to-neutral-900 border-emerald-500/30 text-white"
                      : "bg-neutral-950/90 border-neutral-800 text-neutral-200"
                  }`}
                >
                  {isUser ? (
                    <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    renderFormattedContent(msg.content)
                  )}

                  {/* Copy Button for Assistant Message */}
                  {!isUser && (
                    <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Biomechanical &amp; Nutrition Specialist
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-2 py-1 text-[11px] text-neutral-300 hover:text-white transition"
                        title="Copy prescription"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Thinking / Typing Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto items-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-neutral-950 font-black shadow-md">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <div className="rounded-2xl bg-neutral-950/90 border border-emerald-500/30 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold font-mono text-[11px]">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>AI Coach analyzing biomechanical levers &amp; sports nutrition...</span>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 5. Modern IME-Safe Chat Input Area */}
      <form
        id="coach-chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="border-t border-neutral-800 bg-neutral-950/90 p-3 sm:p-4"
      >
        <div className="relative flex items-end gap-2.5 rounded-2xl border border-neutral-800 bg-neutral-900/90 px-3.5 py-2.5 focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/40 transition">
          <label htmlFor="coach-chat-input" className="sr-only">
            Ask StrengthWise AI Coach
          </label>
          <textarea
            id="coach-chat-input"
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask AI Coach... (e.g. 'Can I swap barbell bench for dumbbells?' or 'How much protein post-workout?')"
            className="flex-1 max-h-36 resize-none bg-transparent text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none leading-relaxed py-1"
          />

          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed transition"
            title="Send message (Enter)"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 px-1">
          <span className="flex items-center gap-1">
            <span className="font-mono text-neutral-400">Enter</span> to send •{" "}
            <span className="font-mono text-neutral-400">Shift + Enter</span> for new line
          </span>
          <span className="hidden sm:inline font-mono text-[10px] text-emerald-400/70">
            Powered by Sports Science + Gemini AI
          </span>
        </div>
      </form>
    </div>
  );
}
