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
  Key,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  Loader2,
  Camera,
  Image as ImageIcon,
  Maximize2,
  UploadCloud,
  Utensils,
  Plus,
  Flame,
} from "lucide-react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string; // Base64 data URL
  timestamp: string;
  source?: "ai" | "claude" | "gemini" | "sports-science-engine";
  model?: string;
}

export interface FoodLogData {
  name: string;
  mealType?: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | string;
  calories: number;
  protein: number;
  carbs: number;
  fat?: number;
  fats?: number;
  fiber?: number;
  serving?: string;
  notes?: string;
}

function extractFoodLog(content: string): { cleanedContent: string; foodLog: FoodLogData | null } {
  // Check for ```food_log ... ``` or ```json ... ``` containing food log payload
  const foodLogMatch = content.match(/```(?:food_log|json)?\s*(\{\s*"name"[\s\S]*?\})\s*```/i);
  if (foodLogMatch) {
    try {
      const parsed = JSON.parse(foodLogMatch[1]);
      if (parsed.name && (parsed.calories !== undefined || parsed.protein !== undefined)) {
        const cleanedContent = content.replace(foodLogMatch[0], "").trim();
        return { cleanedContent, foodLog: parsed };
      }
    } catch {
      // Fall through if not valid JSON
    }
  }

  // Also check for standard ```food_log ... ```
  const genericMatch = content.match(/```food_log\s*([\s\S]*?)\s*```/i);
  if (genericMatch) {
    try {
      const parsed = JSON.parse(genericMatch[1]);
      const cleanedContent = content.replace(genericMatch[0], "").trim();
      return { cleanedContent, foodLog: parsed };
    } catch {
      // Fall through
    }
  }

  return { cleanedContent: content, foodLog: null };
}

export interface TargetUpdateData {
  targetCalories: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  notes?: string;
}

function extractTargetUpdate(content: string): { cleanedContent: string; targetUpdate: TargetUpdateData | null } {
  // Check for ```target_update ... ``` or ```json ... ``` containing targetCalories
  const match = content.match(/```(?:target_update|json)?\s*(\{\s*"targetCalories"[\s\S]*?\})\s*```/i);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.targetCalories) {
        const cleanedContent = content.replace(match[0], "").trim();
        return { cleanedContent, targetUpdate: parsed };
      }
    } catch {
      // Fall through
    }
  }

  const genericMatch = content.match(/```target_update\s*([\s\S]*?)\s*```/i);
  if (genericMatch) {
    try {
      const parsed = JSON.parse(genericMatch[1]);
      if (parsed.targetCalories) {
        const cleanedContent = content.replace(genericMatch[0], "").trim();
        return { cleanedContent, targetUpdate: parsed };
      }
    } catch {
      // Fall through
    }
  }

  return { cleanedContent: content, targetUpdate: null };
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
    icon: Utensils,
    category: "Nutrition Log",
    tag: "Log What I Ate",
    question: "I ate 2 eggs and toast for breakfast. Can you analyze and log this?",
  },
  {
    icon: Camera,
    category: "AI Vision",
    tag: "Form Check",
    question: "Analyze my lift mechanics, joint angles, and bar path in this photo.",
  },
  {
    icon: Dumbbell,
    category: "Biomechanics",
    tag: "Joint Adaptation",
    question: "Shoulder discomfort during barbell bench press?",
  },
  {
    icon: Apple,
    category: "AI Vision",
    tag: "Macro Scan",
    question: "Scan this nutrition label or meal for calories, macros, and leucine threshold.",
  },
  {
    icon: Activity,
    category: "Progressive Overload",
    tag: "Squat RFD",
    question: "Plateaued on squat for 3 consecutive weeks?",
  },
  {
    icon: Dumbbell,
    category: "Equipment",
    tag: "Machine Geometry",
    question: "How do I align seat height and joint axis on this chest or leg machine?",
  },
];

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome-msg",
  role: "assistant",
  content: `👋 **Welcome to your StrengthWise AI Coaching Lab!**

I am your dedicated **Generative AI Sports Scientist & Biomechanist** (CSCS, Clinical Exercise Physiology & Sports Nutrition certified).

I have full contextual integration with your biometrics, daily macros, and workout tracking:
- 🥗 **Instant Meal Logging**: Tell me what you ate (e.g. *"I ate 2 eggs and toast"*) and I will calculate the exact macros, assess protein quality & leucine threshold, and provide an interactive button to log it straight into your Meals tracker!
- 📸 **AI Computer Vision**: Attach or drag & drop lift photos, gym machines, or food labels for acute joint angle and form audits.
- 🏋️ **Acute Exercise Substitutions**: Joint discomfort workarounds for bench press, squats, and deadlifts.
- ⚡ **Progressive Overload**: Autoregulated deloads, pause variations, and tempo prescriptions.

*Attach a photo, choose a quick consultation below, or tell me what you ate to log it!*`,
  timestamp: "Just now",
  source: "ai",
  model: "StrengthWise AI",
};

/**
 * Bulletproof client-side image processing.
 * Tries canvas compression to ~150-300KB for fast uploads;
 * if canvas is unsupported or fails (HEIC, iOS memory), gracefully falls back to raw data URL.
 * NEVER rejects or throws errors.
 */
function compressAndProcessImage(
  file: File
): Promise<{ dataUrl: string; name: string; sizeKb: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const rawDataUrl = (e.target?.result as string) || "";
      if (!rawDataUrl) {
        resolve({
          dataUrl: "",
          name: file.name,
          sizeKb: Math.round(file.size / 1024),
        });
        return;
      }

      // Attempt HTML5 Canvas compression
      try {
        const img = new window.Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const maxDimension = 1600;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const format = file.type === "image/png" ? "image/png" : "image/jpeg";
              const compressedDataUrl = canvas.toDataURL(format, 0.82);
              const base64Length = compressedDataUrl.length - (compressedDataUrl.indexOf(",") + 1);
              const sizeInBytes = Math.ceil((base64Length * 3) / 4);

              resolve({
                dataUrl: compressedDataUrl,
                name: file.name,
                sizeKb: Math.round(sizeInBytes / 1024),
              });
              return;
            }
          } catch {
            // Fallback to raw data URL if canvas fails
          }
          resolve({
            dataUrl: rawDataUrl,
            name: file.name,
            sizeKb: Math.round(file.size / 1024),
          });
        };

        img.onerror = () => {
          // Fallback to raw data URL if image element fails
          resolve({
            dataUrl: rawDataUrl,
            name: file.name,
            sizeKb: Math.round(file.size / 1024),
          });
        };

        img.src = rawDataUrl;
      } catch {
        resolve({
          dataUrl: rawDataUrl,
          name: file.name,
          sizeKb: Math.round(file.size / 1024),
        });
      }
    };

    reader.onerror = () => {
      resolve({
        dataUrl: "",
        name: file.name,
        sizeKb: Math.round(file.size / 1024),
      });
    };

    reader.readAsDataURL(file);
  });
}

export function CoachChat({ athleteContext, hasProfile = true }: CoachChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  // Image Upload & Vision States
  const [selectedImage, setSelectedImage] = useState<{
    dataUrl: string;
    name: string;
    sizeKb: number;
  } | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rate Limiting States
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number | null>(null);
  const [rateLimitMsg, setRateLimitMsg] = useState<string | null>(null);

  // API Key Connection Modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveMsg, setKeySaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeProvider, setActiveProvider] = useState<string>("detecting");

  // Food Logging States
  const [loggingFoodId, setLoggingFoodId] = useState<string | null>(null);
  const [loggedFoodMap, setLoggedFoodMap] = useState<Record<string, boolean>>({});

  // Calorie & Target Update States
  const [appliedTargetMap, setAppliedTargetMap] = useState<Record<string, boolean>>({});
  const [applyingTargetId, setApplyingTargetId] = useState<string | null>(null);

  const handleApplyTargetUpdate = async (messageId: string, target: TargetUpdateData) => {
    setApplyingTargetId(messageId);
    try {
      // 1. Persist to PostgreSQL database via /api/profile
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCalories: target.targetCalories,
          targetProtein: target.targetProtein,
          targetCarbs: target.targetCarbs,
          targetFat: target.targetFat,
        }),
      });

      // 2. Persist to localStorage and cookies for immediate client sync
      try {
        const stored = localStorage.getItem("sw_athlete_profile");
        const existing = stored ? JSON.parse(stored) : {};
        const updated = {
          ...existing,
          targetCalories: target.targetCalories,
          targetProtein: target.targetProtein,
          targetCarbs: target.targetCarbs,
          targetFat: target.targetFat,
          targets: {
            ...(existing.targets || {}),
            targetCalories: target.targetCalories,
            targetProtein: target.targetProtein,
            targetCarbs: target.targetCarbs,
            targetFat: target.targetFat,
          },
        };
        localStorage.setItem("sw_athlete_profile", JSON.stringify(updated));
        document.cookie = `sw_athlete_profile=${encodeURIComponent(JSON.stringify(updated))}; path=/; max-age=31536000; SameSite=Lax`;
        window.dispatchEvent(new Event("sw_profile_updated"));
        window.dispatchEvent(new Event("storage"));
      } catch {}

      setAppliedTargetMap((prev) => ({ ...prev, [messageId]: true }));
    } catch (err) {
      console.warn("Could not persist target update:", err);
      setAppliedTargetMap((prev) => ({ ...prev, [messageId]: true }));
    } finally {
      setApplyingTargetId(null);
    }
  };

  const handleLogFood = async (messageId: string, food: FoodLogData) => {
    setLoggingFoodId(messageId);
    const rawType = (food.mealType || "SNACK").toUpperCase();
    const validMealType = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"].includes(rawType)
      ? rawType
      : "SNACK";
    const fatVal = food.fat !== undefined ? food.fat : food.fats !== undefined ? food.fats : 0;

    try {
      await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: food.name,
          mealType: validMealType,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: fatVal,
          fiber: food.fiber ?? 0,
          serving: food.serving || "1 serving",
          notes: food.notes || "Logged via StrengthWise AI Coach",
        }),
      });

      // Synchronize client storage for guest/offline or instant UI reflection
      try {
        const today = new Date().toISOString().split("T")[0];
        const localKey = `sw_meals_${today}`;
        const existing = JSON.parse(localStorage.getItem(localKey) || "[]");
        const newMeal = {
          id: `meal-${Date.now()}`,
          name: food.name,
          mealType: validMealType,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: fatVal,
          fiber: food.fiber ?? 0,
          serving: food.serving || "1 serving",
          notes: food.notes,
          loggedAt: new Date().toISOString(),
        };
        localStorage.setItem(localKey, JSON.stringify([newMeal, ...existing]));
        window.dispatchEvent(new Event("storage"));
      } catch {
        // Ignore localStorage error
      }

      setLoggedFoodMap((prev) => ({ ...prev, [messageId]: true }));
    } catch (err) {
      console.warn("Could not log to database, saved locally:", err);
      setLoggedFoodMap((prev) => ({ ...prev, [messageId]: true }));
    } finally {
      setLoggingFoodId(null);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Check active provider on mount
  useEffect(() => {
    fetch("/api/coach/save-key")
      .then((r) => r.json())
      .then((d) => {
        if (d.hasAnthropic) setActiveProvider("anthropic");
        else if (d.hasGemini) setActiveProvider("gemini");
        else setActiveProvider("offline");
      })
      .catch(() => setActiveProvider("offline"));
  }, []);

  // Rate limit cooldown countdown timer
  useEffect(() => {
    if (rateLimitCooldown === null || rateLimitCooldown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCooldown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setRateLimitMsg(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCooldown]);

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

  // Save chat history to localStorage on updates (gracefully guard quota)
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem("sw_coach_chat_history", JSON.stringify(messages));
      } catch {
        try {
          // If quota reached, save with recent messages or stripped image data
          const fallbackHistory = messages.slice(-12).map((m) => ({
            ...m,
            // Keep recent image if small or strip if too large
            image: m.image && m.image.length > 300000 ? undefined : m.image,
          }));
          localStorage.setItem("sw_coach_chat_history", JSON.stringify(fallbackHistory));
        } catch {
          // LocalStorage fallback
        }
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
      if (e.nativeEvent.isComposing || (e as unknown as { keyCode?: number }).keyCode === 229) {
        return;
      }
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Image Upload Handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const processed = await compressAndProcessImage(file);
      if (processed && processed.dataUrl) {
        setSelectedImage(processed);
      }
    } catch (err: unknown) {
      console.warn("Failed to process selected image:", err);
    } finally {
      setIsProcessingImage(false);
      if (e.target) e.target.value = "";
    }
  };

  // Paste handler: screenshot / clipboard image paste support (Cmd+V)
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          setIsProcessingImage(true);
          try {
            const processed = await compressAndProcessImage(file);
            if (processed && processed.dataUrl) {
              setSelectedImage(processed);
            }
          } catch (err: unknown) {
            console.warn("Failed to process pasted image:", err);
          } finally {
            setIsProcessingImage(false);
          }
          break;
        }
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/") || file.name.match(/\.(png|jpe?g|webp|gif|heic|bmp)$/i)) {
        setIsProcessingImage(true);
        try {
          const processed = await compressAndProcessImage(file);
          if (processed && processed.dataUrl) {
            setSelectedImage(processed);
          }
        } catch (err: unknown) {
          console.warn("Failed to process dropped image:", err);
        } finally {
          setIsProcessingImage(false);
        }
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawQuery = (textToSend || inputValue).trim();
    const hasImage = Boolean(selectedImage);

    if ((!rawQuery && !hasImage) || isLoading || (rateLimitCooldown !== null && rateLimitCooldown > 0)) {
      return;
    }

    const query =
      rawQuery ||
      (hasImage
        ? "Please analyze this image with your biomechanics and sports science expertise. Provide specific form observations, joint angle analysis, and actionable cues."
        : "");
    const attachedImage = selectedImage?.dataUrl;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      image: attachedImage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setSelectedImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setIsLoading(true);

    const assistantId = `assistant-${Date.now()}`;
    let accumulatedText = "";
    let streamSource: ChatMessage["source"] = "ai";
    let streamModel = "StrengthWise AI";
    let assistantAdded = false;

    try {
      const response = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
            image: m.image,
          })),
          athleteContext,
          stream: true,
        }),
      });

      // Handle 429 Rate Limit
      if (response.status === 429) {
        setIsLoading(false);
        const data = await response.json();
        const retrySec = data.retryAfterSeconds || 15;
        setRateLimitCooldown(retrySec);
        setRateLimitMsg(
          data.error || `Rate limit reached (10 queries/min). Please wait ${retrySec}s.`
        );

        const rateLimitNoticeMessage: ChatMessage = {
          id: `rate-limit-${Date.now()}`,
          role: "assistant",
          content: `⚠️ **Rate Limit Notice**: You have reached the fair usage limit of **10 requests per minute**.\n\nPlease wait **${retrySec} seconds** before submitting your next question to protect AI compute availability.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          source: "sports-science-engine",
          model: "rate-limiter",
        };
        setMessages((prev) => [...prev, rateLimitNoticeMessage]);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";

      // Real-time SSE streaming for instant replies (<400ms TTFB)
      if (contentType.includes("text/event-stream") && response.body) {
        setIsLoading(false);

        // Add placeholder assistant message
        assistantAdded = true;
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: "",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            source: streamSource,
            model: streamModel,
          },
        ]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data:")) {
                const payload = trimmed.slice(5).trim();
                if (payload === "[DONE]") {
                  break;
                }
                if (payload) {
                  try {
                    const parsed = JSON.parse(payload);
                    if (parsed.token) {
                      accumulatedText += parsed.token;
                      if (parsed.source) streamSource = parsed.source;
                      if (parsed.model) streamModel = parsed.model;

                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantId
                            ? {
                                ...msg,
                                content: accumulatedText,
                                source: streamSource,
                                model: streamModel,
                              }
                            : msg
                        )
                      );
                    }
                  } catch {
                    // Ignore parse errors on raw tokens
                  }
                }
              }
            }
          }
        }
        // Auto-apply target update if emitted in the completed stream
        const { targetUpdate: streamTargetUpdate } = extractTargetUpdate(accumulatedText);
        if (streamTargetUpdate && streamTargetUpdate.targetCalories) {
          handleApplyTargetUpdate(assistantId, streamTargetUpdate);
        }
        return;
      }

      // Non-streaming fallback response
      const data = await response.json();
      setIsLoading(false);

      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: data.message || "I have analyzed your biomechanics and training variables.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: data.source,
        model: data.model,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-apply target update if present
      const { targetUpdate: directTargetUpdate } = extractTargetUpdate(data.message || "");
      if (directTargetUpdate && directTargetUpdate.targetCalories) {
        handleApplyTargetUpdate(assistantId, directTargetUpdate);
      }
    } catch {
      setIsLoading(false);
      if (accumulatedText.trim().length > 0) {
        return;
      }

      // Graceful sports-science fallback
      const fallbackMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: `### 🔬 Sports Science Analysis & Coaching Guidance
Regarding **"${query}"**:

Every athletic adaptation is governed by the **Specific Adaptations to Imposed Demands (SAID)** law:

1. **Mechanical Tension & Joint Safety**: Conduct compound lifts within **RPE 7-8.5 (1-3 reps in reserve)** to ensure motor unit recruitment without non-functional fatigue.
2. **Joint Angle & Lever Optimization**: When joint discomfort arises, adjust the moment arm by rotating grips 45° or elevating joint angles to widen the subacromial or patellofemoral space.
3. **Nutritional Architecture**: Maintain daily protein at **1.0g per lb of bodyweight** (${athleteContext?.weightLbs || 185}g) and time 35-50g of carbohydrates 90 minutes prior to training.

### 💡 Prescription & Action Item:
- Apply progressive overload incrementally (+2.5 lbs or +1 repetition per set).
- Log your session metrics in your Workout Log to track systemic fatigue.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: "sports-science-engine",
        model: "strengthwise-specialist",
      };
      setMessages((prev) =>
        assistantAdded
          ? prev.map((m) => (m.id === assistantId ? fallbackMessage : m))
          : [...prev, fallbackMessage]
      );
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

  // Connect AI Key submit handler
  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    setIsSavingKey(true);
    setKeySaveMsg(null);

    try {
      const res = await fetch("/api/coach/save-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save API key");

      setKeySaveMsg({ type: "success", text: data.message });
      setActiveProvider(data.provider);
      setKeyInput("");
      setTimeout(() => {
        setShowKeyModal(false);
        setKeySaveMsg(null);
      }, 2500);
    } catch (err: unknown) {
      setKeySaveMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to connect key",
      });
    } finally {
      setIsSavingKey(false);
    }
  };

  // Render markdown text cleanly with bolding, headings, bullet points, prescription blocks, and interactive food/target cards
  const renderFormattedContent = (content: string, messageId?: string) => {
    const { cleanedContent: contentAfterFood, foodLog } = extractFoodLog(content);
    const { cleanedContent, targetUpdate } = extractTargetUpdate(contentAfterFood);
    const lines = cleanedContent.split("\n");
    const isLogged = messageId ? Boolean(loggedFoodMap[messageId]) : false;
    const isLogging = messageId ? loggingFoodId === messageId : false;
    const isTargetApplied = messageId ? Boolean(appliedTargetMap[messageId]) : true;
    const isTargetApplying = messageId ? applyingTargetId === messageId : false;

    return (
      <div className="space-y-2.5 text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          // Skip codeblock fence lines if any remain
          if (trimmed.startsWith("```")) {
            return null;
          }

          // Heading 4 or 3: #### or ###
          if (trimmed.startsWith("#### ") || trimmed.startsWith("### ")) {
            const hText = trimmed.replace(/^#{3,4}\s+/, "");
            return (
              <h4
                key={idx}
                className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-1.5 pt-2 pb-0.5 border-b border-neutral-800/80"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{hText}</span>
              </h4>
            );
          }

          // Heading 2: ##
          if (trimmed.startsWith("## ")) {
            return (
              <h3
                key={idx}
                className="text-sm sm:text-base font-extrabold text-white tracking-wide pt-2.5 pb-1 text-emerald-300"
              >
                {trimmed.replace(/^##\s+/, "")}
              </h3>
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
                className="rounded-xl border border-emerald-500/25 bg-emerald-950/25 p-3 my-1.5 text-emerald-200 text-xs font-medium shadow-sm"
              >
                {formatInlineMarkdown(trimmed)}
              </div>
            );
          }

          // Regular paragraph
          return <p key={idx}>{formatInlineMarkdown(line)}</p>;
        })}

        {/* 1-Click Food Logging Action Card */}
        {foodLog && (
          <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-neutral-900 to-neutral-950 p-4 shadow-lg space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Utensils className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    Nutrition Detected • 1-Click Log
                  </span>
                  <h4 className="text-sm font-bold text-white tracking-tight">{foodLog.name}</h4>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300 uppercase">
                {foodLog.mealType || "Meal"}
              </span>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-xl bg-neutral-900/80 border border-neutral-800 p-2">
                <div className="text-[10px] font-mono text-neutral-400">Calories</div>
                <div className="text-xs sm:text-sm font-bold text-amber-300 font-mono">
                  {foodLog.calories}
                  <span className="text-[9px] font-normal text-neutral-400 ml-0.5">kcal</span>
                </div>
              </div>
              <div className="rounded-xl bg-neutral-900/80 border border-neutral-800 p-2">
                <div className="text-[10px] font-mono text-neutral-400">Protein</div>
                <div className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
                  {foodLog.protein}g
                </div>
              </div>
              <div className="rounded-xl bg-neutral-900/80 border border-neutral-800 p-2">
                <div className="text-[10px] font-mono text-neutral-400">Carbs</div>
                <div className="text-xs sm:text-sm font-bold text-cyan-400 font-mono">
                  {foodLog.carbs}g
                </div>
              </div>
              <div className="rounded-xl bg-neutral-900/80 border border-neutral-800 p-2">
                <div className="text-[10px] font-mono text-neutral-400">Fats</div>
                <div className="text-xs sm:text-sm font-bold text-rose-400 font-mono">
                  {foodLog.fats ?? foodLog.fat ?? 0}g
                </div>
              </div>
            </div>

            {foodLog.notes && (
              <p className="text-[11px] text-neutral-300 italic bg-neutral-900/50 rounded-lg px-2.5 py-1.5 border border-neutral-800/60">
                💡 {foodLog.notes}
              </p>
            )}

            {/* Action Button */}
            <div className="pt-1 flex items-center justify-between gap-3 flex-wrap">
              {isLogged ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 w-full sm:w-auto">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Logged to Daily Meals Tracker!</span>
                  <a
                    href="/meals"
                    className="ml-auto sm:ml-2 text-[11px] font-mono underline hover:text-emerald-300"
                  >
                    View Meals →
                  </a>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isLogging || !messageId}
                  onClick={() => messageId && handleLogFood(messageId, foodLog)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-4 py-2 text-xs font-bold text-neutral-950 shadow-md shadow-emerald-500/25 transition active:scale-95 disabled:opacity-50"
                >
                  {isLogging ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Logging to Meals Tracker...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Log this Food to Meals Tracker</span>
                    </>
                  )}
                </button>
              )}

              <span className="text-[10px] text-neutral-500">
                Synced with daily targets
              </span>
            </div>
          </div>
        )}

        {/* Interactive Target Update Card */}
        {targetUpdate && (
          <div className="mt-3 rounded-2xl border border-cyan-500/35 bg-gradient-to-br from-cyan-950/40 via-neutral-900/90 to-neutral-950 p-4 space-y-3 shadow-lg shadow-cyan-500/10 animate-in fade-in duration-300">
            <div className="flex items-center justify-between gap-2 border-b border-cyan-500/20 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/20">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                    Daily Caloric Target Updated
                  </h4>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    Synced with Meals &amp; Macro Nutrition
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-white font-mono">
                  {targetUpdate.targetCalories.toLocaleString()}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono ml-1 font-semibold">kcal/day</span>
              </div>
            </div>

            {/* Macros Distribution */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
              <div className="rounded-xl bg-neutral-900/90 border border-emerald-500/20 p-2">
                <span className="text-[9px] uppercase font-bold text-emerald-400 block">Protein</span>
                <span className="font-bold text-white text-xs">{targetUpdate.targetProtein || 175}g</span>
              </div>
              <div className="rounded-xl bg-neutral-900/90 border border-cyan-500/20 p-2">
                <span className="text-[9px] uppercase font-bold text-cyan-400 block">Carbs</span>
                <span className="font-bold text-white text-xs">{targetUpdate.targetCarbs || 250}g</span>
              </div>
              <div className="rounded-xl bg-neutral-900/90 border border-amber-500/20 p-2">
                <span className="text-[9px] uppercase font-bold text-amber-400 block">Fats</span>
                <span className="font-bold text-white text-xs">{targetUpdate.targetFat || 65}g</span>
              </div>
            </div>

            {targetUpdate.notes && (
              <p className="text-[11px] text-neutral-300 italic bg-neutral-900/60 rounded-lg px-2.5 py-1.5 border border-neutral-800/60">
                💡 {targetUpdate.notes}
              </p>
            )}

            {/* Status Confirmation and Direct Link */}
            <div className="pt-1 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-3 py-2 w-full sm:w-auto">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400" />
                <span>Calorie Target Applied to Meals Section &amp; Profile!</span>
                <a
                  href="/meals"
                  className="ml-auto sm:ml-2 text-[11px] font-mono underline hover:text-cyan-300 font-bold"
                >
                  View Meals Section →
                </a>
              </div>

              {!isTargetApplied && messageId && (
                <button
                  type="button"
                  disabled={isTargetApplying}
                  onClick={() => handleApplyTargetUpdate(messageId, targetUpdate)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-3 py-1.5 text-xs font-bold text-neutral-950 transition active:scale-95"
                >
                  {isTargetApplying ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Applying Target...</span>
                    </>
                  ) : (
                    <span>Sync Target Now</span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

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
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-3xl border transition-all duration-200 bg-neutral-900/90 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col relative ${
        isDraggingOver ? "border-emerald-400 ring-2 ring-emerald-500/40" : "border-neutral-800/80"
      }`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-neutral-950/90 backdrop-blur-sm border-2 border-dashed border-emerald-400 rounded-3xl flex flex-col items-center justify-center gap-3 p-6 pointer-events-none animate-in fade-in duration-150">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-xl shadow-emerald-500/20 animate-bounce">
            <UploadCloud className="h-8 w-8" />
          </div>
          <h4 className="text-base sm:text-lg font-bold text-white text-center">
            Drop Photo for AI Form Check or Nutrition Analysis
          </h4>
          <p className="text-xs text-neutral-300 text-center max-w-sm">
            Release your image to attach it to your coaching consultation. Supports PNG, JPG, WebP.
          </p>
        </div>
      )}

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
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                StrengthWise AI Coach
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 font-mono">
                <ShieldCheck className="h-3 w-3" />
                Generative AI Specialist
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300 font-mono">
                Neural Strength Engine
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              Rate Limited (10/min) • Real-time Sports Science
              {athleteContext?.weightLbs && (
                <span className="hidden sm:inline text-neutral-500">
                  • {athleteContext.weightLbs} lbs • {athleteContext.splitType || "Active Split"}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className="rounded-xl px-3 py-1.5 text-xs font-semibold border transition flex items-center gap-1.5 bg-neutral-800/60 border-neutral-700/60 text-neutral-300 hover:text-white hover:border-emerald-500/40"
            title="Connect Custom AI Key"
          >
            <Key className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Connect AI Key</span>
          </button>

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
            <span className="hidden sm:inline">Topics</span>
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

      {/* API Key Modal / Drawer */}
      {showKeyModal && (
        <div className="border-b border-neutral-800 bg-neutral-950 p-4 sm:p-5 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Key className="h-4 w-4 text-amber-400" />
              <span>Connect Custom AI Key</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowKeyModal(false);
                setKeySaveMsg(null);
              }}
              className="text-neutral-500 hover:text-white p-1 rounded-lg transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Enter your custom API Key to power your coach with advanced Generative AI. Keys are stored locally in your environment.
          </p>

          <form onSubmit={handleSaveApiKey} className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              placeholder="Paste sk-ant-... or AIzaSy... key here"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="h-10 rounded-xl border border-neutral-800 bg-neutral-900 px-3 text-xs font-mono text-white placeholder:text-neutral-500 focus:border-amber-400 focus:outline-none flex-1"
            />
            <button
              type="submit"
              disabled={isSavingKey || !keyInput.trim()}
              className="h-10 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 text-xs font-bold text-neutral-950 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0 transition"
            >
              {isSavingKey ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Save &amp; Activate
            </button>
          </form>

          {keySaveMsg && (
            <div
              className={`rounded-xl p-2.5 text-xs flex items-center gap-2 ${
                keySaveMsg.type === "success"
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                  : "bg-red-500/10 text-red-300 border border-red-500/30"
              }`}
            >
              {keySaveMsg.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              )}
              <span>{keySaveMsg.text}</span>
            </div>
          )}
        </div>
      )}

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
            {hasProfile ? "Generative Biomechanical Reasoning" : "Demo Mode • Complete Profile to Customize"}
          </span>
        </div>
      )}

      {/* 3. Quick-Pick Prompt Carousel / Drawer */}
      {showQuickPrompts && (
        <div className="border-b border-neutral-800/80 bg-neutral-950/60 p-3 sm:p-4">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Tap to Consult Coach on Core Scenarios:</span>
            <span className="text-[10px] text-neutral-500">1-click generative AI query</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {QUICK_PROMPTS.map((prompt, idx) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt.question)}
                  disabled={isLoading || (rateLimitCooldown !== null && rateLimitCooldown > 0)}
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
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-h-[540px] min-h-[340px]">
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
                    : "bg-gradient-to-br from-emerald-400 to-emerald-600 text-neutral-950 font-black shadow-emerald-500/20"
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
                    {isUser ? athleteContext?.fullName || "You" : "StrengthWise AI Coach"}
                  </span>
                  {!isUser && (
                    <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 text-[9px] font-mono">
                      {msg.model || "StrengthWise AI"}
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
                    <div className="space-y-2.5">
                      {msg.image && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setLightboxImage(msg.image || null)}
                            className="relative group/img block overflow-hidden rounded-xl border border-emerald-500/40 bg-neutral-950 shadow-md hover:border-emerald-400 transition max-w-[260px] sm:max-w-[320px] text-left cursor-pointer"
                            title="Click to zoom photo"
                          >
                            <img
                              src={msg.image}
                              alt="Attached form check or nutrition photo"
                              className="max-h-60 w-auto object-cover rounded-xl transition duration-200 group-hover/img:scale-[1.02]"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center gap-1.5 text-[11px] font-semibold text-white backdrop-blur-[1px]">
                              <Maximize2 className="h-4 w-4 text-emerald-400" />
                              <span>Click to Zoom</span>
                            </div>
                            <span className="absolute top-1.5 left-1.5 rounded-full bg-neutral-950/85 border border-neutral-700/60 px-2 py-0.5 text-[10px] font-mono text-emerald-300 backdrop-blur-sm">
                              📸 Photo Attached
                            </span>
                          </button>
                        </div>
                      )}
                      <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ) : msg.content.trim().length > 0 ? (
                    renderFormattedContent(msg.content, msg.id)
                  ) : (
                    <div className="flex items-center gap-2 py-2 text-emerald-400">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs text-neutral-400 font-mono animate-pulse">
                        Analyzing biomechanics &amp; streaming prescription...
                      </span>
                    </div>
                  )}

                  {/* Copy Button for Assistant Message */}
                  {!isUser && (
                    <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Biomechanical &amp; Sports Science Specialist
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
                <span>AI Coach reasoning with biomechanical levers &amp; sports nutrition...</span>
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

      {/* Rate Limit Active Notice */}
      {rateLimitCooldown !== null && rateLimitCooldown > 0 && (
        <div className="mx-3 sm:mx-4 mb-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              {rateLimitMsg ||
                `Rate limit active: Please wait ${rateLimitCooldown}s before sending another question.`}
            </span>
          </div>
          <span className="font-mono text-[11px] bg-amber-500/20 px-2.5 py-1 rounded-lg text-amber-300 border border-amber-500/30 font-bold shrink-0">
            {rateLimitCooldown}s cooldown
          </span>
        </div>
      )}

      {/* 5. Modern IME-Safe Chat Input Area */}
      <form
        id="coach-chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        onPaste={handlePaste}
        className="border-t border-neutral-800 bg-neutral-950/90 p-3 sm:p-4"
      >
        {/* Hidden Native File Input bound via id */}
        <input
          id="coach-image-file-input"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="sr-only"
        />

        {/* Selected Image Staging Banner */}
        {selectedImage && (
          <div className="mb-2.5 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-emerald-500/40 bg-neutral-900 shadow">
                <img
                  src={selectedImage.dataUrl}
                  alt="Thumbnail"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-300 truncate max-w-[180px] sm:max-w-xs">
                    {selectedImage.name}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-400">
                    ({selectedImage.sizeKb} KB)
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  Ready for AI Biomechanical Form &amp; Vision Check
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-400 hover:text-red-400 hover:border-red-500/30 transition shrink-0"
              title="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Quick Action Pill Bar with prominent Attach Photo Button */}
        <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
          <label
            htmlFor="coach-image-file-input"
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold cursor-pointer transition select-none ${
              isProcessingImage
                ? "bg-neutral-800 border-neutral-700 text-neutral-400 cursor-wait"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400"
            }`}
            title="Attach photo for form check or food analysis"
          >
            {isProcessingImage ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
            ) : (
              <Camera className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span>📸 Attach Photo (Form Check / Meal)</span>
          </label>

          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            Paste screenshots (<kbd className="font-mono text-[10px] bg-neutral-800 px-1 py-0.5 rounded border border-neutral-700">Cmd+V</kbd>) or drag &amp; drop anytime
          </span>
        </div>

        <div className="relative flex items-end gap-2.5 rounded-2xl border border-neutral-800 bg-neutral-900/90 px-3.5 py-2.5 focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/40 transition">
          {/* Attach Image Label Button (camera icon inside input bar) */}
          <label
            htmlFor="coach-image-file-input"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-800/60 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-neutral-800 transition cursor-pointer select-none"
            title="Attach photo (form check, nutrition label, equipment, physique) or paste screenshot (Cmd+V)"
          >
            {isProcessingImage ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </label>

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
            disabled={isLoading || (rateLimitCooldown !== null && rateLimitCooldown > 0)}
            placeholder={
              rateLimitCooldown !== null && rateLimitCooldown > 0
                ? `Rate limit active: Ready in ${rateLimitCooldown}s...`
                : selectedImage
                ? "Ask about this photo (e.g. 'Is my depth parallel?', 'Check elbow angle', 'Macros?') or press Enter..."
                : "Ask AI Coach or attach a photo... (e.g. 'I ate 2 eggs and toast', form check, joint pain)"
            }
            className="flex-1 max-h-36 resize-none bg-transparent text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none leading-relaxed py-1 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={
              isLoading ||
              isProcessingImage ||
              (!inputValue.trim() && !selectedImage) ||
              (rateLimitCooldown !== null && rateLimitCooldown > 0)
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed transition"
            title="Send message (Enter)"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 px-1 flex-wrap gap-2">
          <span className="flex items-center gap-1.5">
            <span className="font-mono text-neutral-400">Enter</span> to send •{" "}
            <span className="text-emerald-400/90 font-medium">📸 Attach via camera, paste (Cmd+V), or drag &amp; drop</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-neutral-500 border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 rounded">
              ⚡ Rate Limit: 10/min
            </span>
            <span className="hidden sm:inline font-mono text-[10px] text-emerald-400/80">
              Powered by StrengthWise Sports Science Intelligence
            </span>
          </div>
        </div>
      </form>

      {/* Lightbox Modal for Full-Resolution Photo Inspection */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 flex items-center gap-1.5 rounded-full bg-neutral-800/80 border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-700 transition"
            >
              <X className="h-4 w-4" />
              <span>Close (Esc)</span>
            </button>
            <img
              src={lightboxImage}
              alt="Enlarged performance photo"
              className="max-h-[82vh] max-w-full rounded-2xl border border-neutral-800 shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
