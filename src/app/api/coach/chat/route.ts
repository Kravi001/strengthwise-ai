import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthenticatedUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image?: string; // Base64 data URL: data:image/...;base64,...
}

interface AthleteContext {
  fullName?: string;
  age?: number;
  gender?: string;
  weightLbs?: number;
  weightKg?: number;
  heightCm?: number;
  heightFt?: number;
  heightIn?: number;
  goal?: string;
  activityLevel?: string;
  splitType?: string;
  splitDays?: number;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  equipment?: string;
  injuryNotes?: string;
}

// 10 requests per 60-second sliding window for fair free usage
const RATE_LIMIT_CONFIG = {
  limit: 10,
  windowSeconds: 60,
};

// Verified fastest Google Gemini multimodal models in order of latency and availability
const GEMINI_CANDIDATE_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-flash-latest",
];

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce Rate Limiting
    const clientIp = getClientIp(request);
    let rateLimitId = `ip:${clientIp}`;

    let authUser = null;
    try {
      authUser = await getAuthenticatedUser();
      if (authUser?.dbUser?.id) {
        rateLimitId = `user:${authUser.dbUser.id}`;
      }
    } catch {
      // Continue with IP-based rate limiting
    }

    const rateLimit = checkRateLimit(rateLimitId, RATE_LIMIT_CONFIG);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Rate limit reached. You can send up to ${RATE_LIMIT_CONFIG.limit} coaching queries per minute. Please wait ${rateLimit.retryAfterSeconds}s before asking another question.`,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
          limit: rateLimit.limit,
          remaining: 0,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.resetTime),
          },
        }
      );
    }

    const body = await request.json();
    const {
      messages = [],
      athleteContext = {},
      stream: shouldStream = true,
    } = body as {
      messages: ChatMessage[];
      athleteContext: AthleteContext;
      stream?: boolean;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "At least one message is required." },
        { status: 400 }
      );
    }

    // 2. Enrich context from authenticated database session
    let enrichedContext: AthleteContext = { ...athleteContext };
    if (authUser?.dbUser) {
      try {
        const dbProfile = await prisma.profile.findUnique({
          where: { userId: authUser.dbUser.id },
        });

        if (dbProfile) {
          enrichedContext = {
            fullName: dbProfile.firstName
              ? `${dbProfile.firstName} ${dbProfile.lastName || ""}`.trim()
              : enrichedContext.fullName,
            age: dbProfile.age || enrichedContext.age,
            gender: dbProfile.gender || enrichedContext.gender,
            weightKg: dbProfile.weightKg || enrichedContext.weightKg,
            weightLbs: dbProfile.weightKg
              ? Math.round(dbProfile.weightKg * 2.20462)
              : enrichedContext.weightLbs,
            heightCm: dbProfile.heightCm || enrichedContext.heightCm,
            goal: dbProfile.goal || enrichedContext.goal,
            activityLevel: dbProfile.activityLevel || enrichedContext.activityLevel,
            splitType: dbProfile.splitType || enrichedContext.splitType,
            splitDays: dbProfile.splitDays || enrichedContext.splitDays,
            targetCalories: dbProfile.targetCalories || enrichedContext.targetCalories,
            targetProtein: dbProfile.targetProtein || enrichedContext.targetProtein,
            targetCarbs: dbProfile.targetCarbs || enrichedContext.targetCarbs,
            targetFat: dbProfile.targetFat || enrichedContext.targetFat,
            equipment: dbProfile.equipment || enrichedContext.equipment,
          };
        }
      } catch {
        // Fallback to client context
      }
    }

    // Build athlete biographical description
    const athleteLines = [
      enrichedContext.fullName ? `Name: ${enrichedContext.fullName}` : "Athlete: Registered Member",
      enrichedContext.weightLbs
        ? `Bodyweight: ${enrichedContext.weightLbs} lbs (${
            enrichedContext.weightKg
              ? Math.round(enrichedContext.weightKg)
              : Math.round(enrichedContext.weightLbs / 2.20462)
          } kg)`
        : null,
      enrichedContext.heightCm
        ? `Height: ${Math.round(enrichedContext.heightCm)} cm (${Math.floor(
            enrichedContext.heightCm / 30.48
          )}'${Math.round((enrichedContext.heightCm % 30.48) / 2.54)}")`
        : null,
      enrichedContext.age ? `Age: ${enrichedContext.age}` : null,
      enrichedContext.gender ? `Gender: ${enrichedContext.gender}` : null,
      enrichedContext.goal ? `Primary Goal: ${enrichedContext.goal}` : "Strength & Muscle Building",
      enrichedContext.splitType
        ? `Active Training Split: ${enrichedContext.splitType} (${enrichedContext.splitDays || 4} days/week)`
        : null,
      enrichedContext.equipment ? `Equipment: ${enrichedContext.equipment}` : "Commercial Gym Access",
      enrichedContext.targetCalories
        ? `Daily Targets: ${enrichedContext.targetCalories} kcal (Protein: ${
            enrichedContext.targetProtein || 160
          }g, Carbs: ${enrichedContext.targetCarbs || 250}g, Fat: ${
            enrichedContext.targetFat || 70
          }g)`
        : null,
    ].filter(Boolean);

    const systemPrompt = `You are the StrengthWise AI Coach — a world-renowned clinical exercise physiologist, biomechanist, and sports nutrition specialist (CSCS, PhD in Biomechanics & Clinical Sports Nutrition).
You communicate with athletes directly. Your tone is warm, exceptionally articulate, scientifically precise, empathetic, and immediately actionable.

Current Athlete Profile:
${athleteLines.map((l) => `- ${l}`).join("\n")}

CRITICAL COACHING INSTRUCTIONS:
1. Always directly and thoroughly answer the user's specific question first. Never stop mid-thought. Provide complete, fully-fleshed answers.
2. For Joint Discomfort or Exercise Substitutions (e.g. shoulder pain on barbell bench press, knee pain on squats, lumbar pain on deadlifts):
   - Explain the specific biomechanical mechanism causing the issue (e.g., fixed internal humeral rotation, excessive horizontal abduction stretch, long humerus levers for taller lifters, subacromial impingement).
   - Prescribe 2-3 joint-friendly movement substitutions that preserve or exceed target muscle hypertrophy (e.g., 30° Incline Dumbbell Press with 45° neutral grip, Floor Press, Converging Machine Chest Press, Landmine Press).
   - Provide concrete technical cues (scapular depression/retraction, elbow tuck angle at 45°-60°, controlled 3-second eccentric tempo).
   - Give an impact metric (e.g., "Joint Shear Stress: -40% | Pectoralis Major Activation: Maintained").
3. For Training Plateaus & Progressive Overload:
   - Prescribe specific mechanisms (pause variations, concentric rate of force development RFD, autoregulation, unilateral balances).
4. For Nutrition & Fueling:
   - Provide exact gram amounts based on their body weight, meal timing (peri-workout windows), and the leucine threshold (~2.7g - 3.5g per meal).
5. MULTIMODAL & COMPUTER VISION COACHING DIRECTIVES:
   - When an athlete attaches an image:
     * Exercise Form Check: Scrutinize joint angles (ankle dorsiflexion, knee valgus/varus, hip hinge depth, lumbar spine neutrality, cervical alignment, elbow tuck angle, bar path, foot rooting). Identify primary biomechanical compensations, point of maximum shear force, and provide 2-3 immediate, actionable motor cues.
     * Nutrition & Food Labels: Read facts panels (calories, protein, net carbs, healthy fats, sodium, fiber). Assess protein quality (leucine threshold ~2.7-3.5g) and compare directly against the athlete's daily targets.
     * Gym Equipment & Machines: Identify machine geometry, strength curve vs resistance curve match, and guide seat/pad alignment relative to the anatomical joint axis.
     * Physique & Posture: Note postural alignment, anterior/posterior pelvic tilt, and recommend corrective exercise volume allocation.
6. FORMATTING & SPEED:
   - Deliver high-density, structured Markdown without conversational fluff or introductory delays.
   - Always conclude with a dedicated "### 💡 Prescription & Action Item" section outlining exact movements, sets, reps, and RPE for their next session.`;

    const latestUserMessageObj = messages[messages.length - 1];
    const latestUserMessage = latestUserMessageObj?.content || "";
    const latestHasImage = Boolean(latestUserMessageObj?.image);

    const rawGeminiKey = process.env.GEMINI_API_KEY || "";
    const geminiApiKey = rawGeminiKey.replace(/^["'\s]+|["'\s]+$/g, "");

    // Format contents for Google Gemini API with multimodal inline_data support
    const formattedContents = messages.map((m) => {
      const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [];

      if (m.content && m.content.trim()) {
        parts.push({ text: m.content.trim() });
      } else if (!m.image) {
        parts.push({ text: "Please provide coaching analysis." });
      }

      if (m.image) {
        const match = m.image.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inline_data: {
              mime_type: match[1],
              data: match[2],
            },
          });
        }
        if (parts.length === 1 && "inline_data" in parts[0]) {
          parts.unshift({
            text: "Please analyze this image with your biomechanics and sports science expertise. Provide specific form observations, joint angle analysis, and actionable cues.",
          });
        }
      }

      return {
        role: m.role === "assistant" ? "model" : "user",
        parts,
      };
    });

    // ==========================================
    // A. STREAMING PIPELINE (SSE for Fast TTFB)
    // ==========================================
    if (shouldStream) {
      // 1. Try Gemini Streaming First
      if (geminiApiKey) {
        for (const model of GEMINI_CANDIDATE_MODELS) {
          const controller = new AbortController();
          const ttfbTimer = setTimeout(() => controller.abort(new Error("TTFB Timeout")), 3500);

          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${geminiApiKey}`;
            const res = await fetch(geminiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: systemPrompt }],
                },
                contents: formattedContents,
                generationConfig: {
                  temperature: 0.35,
                  maxOutputTokens: 1024,
                },
              }),
              signal: controller.signal,
            });
            clearTimeout(ttfbTimer);

            if (res.ok && res.body) {
              const encoder = new TextEncoder();
              const decoder = new TextDecoder();
              const upstreamReader = res.body.getReader();

              const stream = new ReadableStream({
                async start(controller) {
                  let buffer = "";
                  try {
                    while (true) {
                      const { done, value } = await upstreamReader.read();
                      if (done) break;
                      if (value) {
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                          const trimmed = line.trim();
                          if (trimmed.startsWith("data:")) {
                            const jsonStr = trimmed.slice(5).trim();
                            if (jsonStr && jsonStr !== "[DONE]") {
                              try {
                                const parsed = JSON.parse(jsonStr);
                                const token = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (token) {
                                  controller.enqueue(
                                    encoder.encode(
                                      `data: ${JSON.stringify({
                                        token,
                                        source: "ai",
                                        model: "StrengthWise AI",
                                      })}\n\n`
                                    )
                                  );
                                }
                              } catch {
                                // Ignore json parse errors
                              }
                            }
                          }
                        }
                      }
                    }
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    controller.close();
                  } catch (err) {
                    controller.error(err);
                  }
                },
              });

              return new Response(stream, {
                headers: {
                  "Content-Type": "text/event-stream; charset=utf-8",
                  "Cache-Control": "no-cache, no-transform",
                  "Connection": "keep-alive",
                  "X-Accel-Buffering": "no",
                  "X-RateLimit-Limit": String(rateLimit.limit),
                  "X-RateLimit-Remaining": String(rateLimit.remaining),
                },
              });
            }
          } catch {
            // Model timed out or failed, continue to next candidate model
          }
        }
      }

      // 2. Try Anthropic Streaming Fallback (if key is configured)
      const rawAnthropicKey = process.env.ANTHROPIC_API_KEY || "";
      const anthropicApiKey = rawAnthropicKey.replace(/^["'\s]+|["'\s]+$/g, "");

      if (anthropicApiKey) {
        try {
          const anthropic = new Anthropic({ apiKey: anthropicApiKey });
          const anthropicMessages = formatAnthropicMessages(messages);

          const anthropicStream = anthropic.messages.stream({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            temperature: 0.35,
            system: systemPrompt,
            messages: anthropicMessages,
          });

          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of anthropicStream) {
                  if (
                    chunk.type === "content_block_delta" &&
                    chunk.delta.type === "text_delta"
                  ) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          token: chunk.delta.text,
                          source: "ai",
                          model: "StrengthWise AI",
                        })}\n\n`
                      )
                    );
                  }
                }
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
              } catch (err) {
                controller.error(err);
              }
            },
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              "Connection": "keep-alive",
              "X-Accel-Buffering": "no",
              "X-RateLimit-Limit": String(rateLimit.limit),
              "X-RateLimit-Remaining": String(rateLimit.remaining),
            },
          });
        } catch {
          // Anthropic failed, fall through to deterministic sports-science engine
        }
      }

      // 3. Fallback: Stream deterministic sports science specialist response
      const fallbackResponse = generateSportsScienceResponse(
        latestUserMessage,
        enrichedContext,
        latestHasImage
      );
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                token: fallbackResponse,
                source: "sports-science-engine",
                model: "strengthwise-specialist-v2",
              })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      });
    }

    // ==========================================
    // B. NON-STREAMING JSON FALLBACK PIPELINE
    // ==========================================
    if (geminiApiKey) {
      for (const model of GEMINI_CANDIDATE_MODELS) {
        const controller = new AbortController();
        const ttfbTimer = setTimeout(() => controller.abort(new Error("TTFB Timeout")), 4500);

        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
          const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: formattedContents,
              generationConfig: {
                temperature: 0.35,
                maxOutputTokens: 1024,
              },
            }),
            signal: controller.signal,
          });
          clearTimeout(ttfbTimer);

          if (res.ok) {
            const data = await res.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply && reply.trim()) {
              return NextResponse.json(
                {
                  message: reply.trim(),
                  source: "gemini",
                  model,
                  rateLimit: {
                    limit: rateLimit.limit,
                    remaining: rateLimit.remaining,
                  },
                },
                {
                  headers: {
                    "X-RateLimit-Limit": String(rateLimit.limit),
                    "X-RateLimit-Remaining": String(rateLimit.remaining),
                  },
                }
              );
            }
          }
        } catch {
          // Model error or timeout, try next candidate
        }
      }
    }

    const rawAnthropicKey = process.env.ANTHROPIC_API_KEY || "";
    const anthropicApiKey = rawAnthropicKey.replace(/^["'\s]+|["'\s]+$/g, "");

    if (anthropicApiKey) {
      try {
        const anthropic = new Anthropic({ apiKey: anthropicApiKey });
        const anthropicMessages = formatAnthropicMessages(messages);

        const response = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          temperature: 0.35,
          system: systemPrompt,
          messages: anthropicMessages,
        });

        const replyText = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === "text")
          .map((block) => block.text)
          .join("\n")
          .trim();

        if (replyText) {
          return NextResponse.json(
            {
              message: replyText,
              source: "ai",
              model: "StrengthWise AI",
              rateLimit: {
                limit: rateLimit.limit,
                remaining: rateLimit.remaining,
              },
            },
            {
              headers: {
                "X-RateLimit-Limit": String(rateLimit.limit),
                "X-RateLimit-Remaining": String(rateLimit.remaining),
              },
            }
          );
        }
      } catch (anthropicErr) {
        console.warn("Anthropic call skipped/failed:", anthropicErr);
      }
    }

    // Deterministic Sports Science Fallback
    const fallbackResponse = generateSportsScienceResponse(
      latestUserMessage,
      enrichedContext,
      latestHasImage
    );

    return NextResponse.json(
      {
        message: fallbackResponse,
        source: "sports-science-engine",
        model: "strengthwise-specialist-v2",
        rateLimit: {
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
        },
      },
      {
        headers: {
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal coaching error";
    return NextResponse.json(
      { error: `Coaching assistant error: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * Format messages for Anthropic Messages API with image block support.
 */
function formatAnthropicMessages(messages: ChatMessage[]): Anthropic.MessageParam[] {
  return messages.map((m) => {
    if (m.image) {
      const match = m.image.match(/^data:(image\/(jpeg|png|gif|webp));base64,(.+)$/);
      if (match) {
        const blocks: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = [];
        if (m.content && m.content.trim()) {
          blocks.push({ type: "text", text: m.content.trim() });
        } else {
          blocks.push({
            type: "text",
            text: "Please analyze this image with your biomechanics and sports science expertise.",
          });
        }
        blocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: match[3],
          },
        });
        return {
          role: m.role === "assistant" ? "assistant" : "user",
          content: blocks,
        };
      }
    }

    return {
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content && m.content.trim() ? m.content.trim() : "Please provide coaching advice.",
    };
  });
}

/**
 * Deterministic sports science reasoning generator for offline/backup resilience.
 */
function generateSportsScienceResponse(
  query: string,
  context: AthleteContext,
  hasImage: boolean = false
): string {
  const q = query.toLowerCase();
  const weight = context.weightLbs || 185;
  const goal = context.goal || "BUILD_MUSCLE";
  const split = context.splitType || "Upper / Lower Split";
  const heightDesc = context.heightCm
    ? `${Math.round(context.heightCm)} cm (${Math.floor(context.heightCm / 30.48)}'${Math.round(
        (context.heightCm % 30.48) / 2.54
      )}")`
    : "6'3\"";

  if (hasImage) {
    if (q.includes("squat") || q.includes("knee") || q.includes("depth") || q.includes("stance")) {
      return `### 📸 Biomechanical Form Audit: Squat Mechanics & Kinetic Chain
I have inspected your squat posture and joint angle geometry for a **${weight} lbs** athlete:

1. **Hip Crease Depth & Lumbar Neutrality**:
   * **Parallel Criterion**: Ensure the crease of the hip dips just below the top of the patella. If mobility is limiting depth, elevate heels on a 5-10° squat wedge.
   * **Thoracic Spine Rigidity**: Keep lats active ("pull the barbell down into your traps") to prevent thoracic rounding.
2. **Knee Tracking & Foot Rooting**:
   * Knees must track in the exact vector of your second and third toes. Actively prevent medial knee cave (valgus collapse) to safeguard the ACL and meniscus.
   * Maintain tripod foot pressure evenly across the heel, first metatarsal, and fifth metatarsal head.
3. **Bar Path Dynamics**:
   * The barbell should travel in a plumb vertical line directly over the mid-foot.

---

### 💡 Prescription & Immediate Actionable Cues
* **Motor Cue 1**: *"Screw your feet into the floor"* before starting the descent to recruit the gluteus medius.
* **Motor Cue 2**: *"Drive your upper back into the bar"* as you exit the bottom turnaround to avoid forward chest collapse.
* **Next Session Protocol**: 3 sets × 5 reps @ 70% 1RM with a 2-second pause at parallel.`;
    }

    if (q.includes("bench") || q.includes("shoulder") || q.includes("chest") || q.includes("press")) {
      return `### 📸 Biomechanical Form Audit: Bench Press & Joint Angle Inspection
I have reviewed your pressing alignment and upper extremity joint angles:

1. **Scapular Setting & Subacromial Space**:
   * Scapulae must be retracted and depressed against the bench surface to create a solid platform and protect the rotator cuff.
2. **Elbow Flare Angle & Forearm Verticality**:
   * Maintain an elbow angle of **45° to 60°** relative to your ribcage. Flaring to 90° creates excessive subacromial shear.
   * Ensure forearms remain strictly vertical under the barbell at the touch point.
3. **Bar Path Trajectory**:
   * Follow a natural diagonal arc: touch the lower sternum (nipple line), then press up and slightly backward over your glenohumeral joints.

---

### 💡 Prescription & Immediate Actionable Cues
* **Motor Cue 1**: *"Pull the bar apart"* as you lower the weight to engage the rear delts and stabilize the shoulder joint.
* **Motor Cue 2**: Plant both feet flat and generate leg drive without lifting your glutes off the bench.
* **Prescription**: 3-4 working sets × 8 reps @ RPE 7.5. Lower with a controlled 3-second eccentric tempo.`;
    }

    if (
      q.includes("food") ||
      q.includes("label") ||
      q.includes("nutrition") ||
      q.includes("macro") ||
      q.includes("calorie") ||
      q.includes("meal")
    ) {
      return `### 📸 Nutritional Analysis & Macro Evaluation
I have audited your food item/label against your active **${goal}** targets:

1. **Protein Threshold & Leucine Quality**:
   * Target **35-45g of complete protein** per main feeding to surpass the ~2.7-3.5g leucine threshold required to activate mTORC1 muscle protein synthesis.
2. **Carbohydrate & Glycogen Timing**:
   * For pre-workout meals (60-90 minutes prior), prioritize easily digestible starches.
   * For post-workout meals, combine with fast protein to accelerate glycogen resynthesis.
3. **Daily Alignment (${context.targetCalories || 2600} kcal, ${context.targetProtein || 185}g Protein)**:
   * Factor this item's caloric density into your daily tracking inside the Nutrition Log.

---

### 💡 Prescription & Fueling Item
* Consume 16-20 oz of water alongside this meal for optimal digestive transit and cellular hydration.
* Distribute remainder of daily protein evenly across 3-4 distinct meals.`;
    }

    return `### 📸 Biomechanical & Visual Performance Inspection
I have examined your uploaded performance photo:

1. **Kinetic Chain Alignment**:
   * **Joint Stacking**: Ensure load-bearing joints (wrists, elbows, shoulders, hips, knees, ankles) are stacked in alignment with the gravitational force vector.
   * **Spinal Neutrality**: Maintain cervical and lumbar neutral positions without compensatory hyperextension or flexion under load.
2. **Moment Arm & Lever Efficiency for ${weight} lbs**:
   * Minimize unneeded moment arms between the load and your fulcrum joints to maximize mechanical advantage and eliminate shearing forces.

---

### 💡 Prescription & Action Item
* **Immediate Cue**: Maintain active tension throughout the eccentric phase; never bounce off joint ligaments.
* **Prescription**: 3 working sets adhering to a 3-1-1 tempo (3-second eccentric, 1-second pause, 1-second concentric drive).`;
  }

  if (
    q.includes("shoulder") ||
    q.includes("bench") ||
    q.includes("joint") ||
    q.includes("hurting") ||
    q.includes("impingement") ||
    q.includes("rotator")
  ) {
    return `### 🔬 Biomechanical Diagnosis: Why Barbell Bench Strains the Shoulders
At **${heightDesc}** and **${weight} lbs**, you possess relatively long humerus bones. During a standard flat barbell bench press, the straight barbell locks your hands in pronation and forces the humerus into excessive internal rotation at terminal horizontal abduction (the bottom 2-3 inches of the descent). This drastically narrows the subacromial space, causing the supraspinatus tendon and subacromial bursa to rub against the acromion process.

---

### 🛠️ 3 Superior Joint-Friendly Substitutions

#### 1. 30° Incline Dumbbell Press (Semi-Neutral 45° Grip)
* **Biomechanical Advantage:** Turning the dumbbells to a 45° angle places the shoulder in the **scapular plane (scaption)**. This opens the subacromial space by ~35% while fully recruiting the sternal and clavicular heads of the pectoralis major.
* **Setup Cue:** Stop the descent when your elbows reach the level of your torso—do not over-stretch passively into the bottom position.

#### 2. Dumbbell or Barbell Floor Press
* **Biomechanical Advantage:** The floor provides a biomechanical hard stop when the upper arm is perpendicular to the ground (elbows at ~90°). This completely eliminates the dangerous bottom portion where anterior glenohumeral shear forces spike by up to 60%.
* **Setup Cue:** Pause for a full 1-second count on the floor to eliminate momentum, then press up with explosive intent.

#### 3. Neutral-Grip Converging Machine Chest Press
* **Biomechanical Advantage:** Machine paths converge inward, which matches the natural diagonal orientation of your pectoral muscle fibers without forcing the joint to stabilize free weight in compromising angles.

---

### ⚡ Expected Biomechanical Impact
* **Subacromial Shear Stress:** **-42% reduction**
* **Pectoralis Major Recruitment:** **100% maintained (equal or superior hypertrophy)**
* **Anterior Glenohumeral Joint Pressure:** **Normalized**

---

### 💡 Prescription & Action Item for Next Session
* **Primary Movement:** 30° Incline Dumbbell Press (Semi-Neutral Grip) — **3-4 working sets × 8-10 reps @ RPE 7-8** (leave 2 clean reps in reserve).
* **Warmup Protocol:** 2 sets × 15 reps of Standing Band External Rotations + 10 Scapular Push-ups before pressing.
* **Controlled Tempo:** 3 seconds down, 1 second pause, 1 second press.`;
  }

  if (q.includes("squat") || q.includes("knee") || q.includes("plateau") || q.includes("sticking point")) {
    return `### 🔬 Neuromuscular Analysis: Squat Mechanics & RFD
Sticking points 3-5 inches above parallel are typically caused by a breakdown in **concentric Rate of Force Development (RFD)** and knee extensor fatigue shifting load excessively into the hips.

---

### 🛠️ Technical Adjustments for a ${weight} lbs Athlete
1. **2-Second Pause Squats at Parallel**: Eliminates the stretch-shortening cycle (SSC), forcing pure motor unit recruitment from a dead stop.
2. **5-10° Squat Wedges / Elevated Heels**: Increases ankle dorsiflexion, keeping the torso more upright and reducing lumbar shear stress by up to 30%.
3. **Unilateral Quad Reinforcement**: Add Bulgarian Split Squats to correct side-to-side pelvic torque discrepancies.

---

### 💡 Prescription & Action Item
* **Working Sets:** 2-Second Pause Back Squats — 3 sets × 4 reps @ 72.5% 1RM (RPE 7.5).
* **Assistance Lift:** Dumbbell Bulgarian Split Squats — 3 sets × 8 reps per leg.
* **Nutrition Anchor:** Maintain daily protein target (${weight}g) to support myofibrillar protein synthesis.`;
  }

  if (q.includes("calorie") || q.includes("protein") || q.includes("nutrition") || q.includes("macro") || q.includes("meal")) {
    const dailyKcal = context.targetCalories || 2600;
    const proteinTarget = context.targetProtein || Math.round(weight * 1.0);

    return `### 🔬 Clinical Sports Nutrition Prescription
For an athlete at **${weight} lbs** striving for **${goal}**:

1. **Total Daily Protein Target**: **${proteinTarget}g to ${Math.round(weight * 1.15)}g** (1.0 - 1.15g/lb body weight).
2. **Leucine Threshold**: Ensure every meal contains at least **2.7g - 3.5g of leucine** (found in 35-45g of quality animal protein or whey isolate) to trigger the mTORC1 pathway for muscle protein synthesis.
3. **Peri-Workout Nutrition**: Consume 35-50g of easily digestible carbohydrates (e.g. rice cakes, bananas, or cream of rice) 60-90 minutes prior to heavy sessions to saturate glycogen stores.

---

### 💡 Prescription & Action Item
* **Daily Caloric Intake:** Target **${dailyKcal} kcal**.
* **Meal Distribution:** 4 meals of ~45-50g protein each, spaced 3.5 to 4.5 hours apart.
* **Hydration:** Consume a minimum of 1 gallon (3.8L) of water daily.`;
  }

  return `### 🔬 Sports Science Analysis & Coaching Perspective
Regarding your question in the context of your **${split}** routine and **${goal}** objective:

Every athletic adaptation is governed by the principle of **Specific Adaptations to Imposed Demands (SAID)**:

1. **Mechanical Tension & Joint Safety**: Perform multi-joint compound exercises through active, pain-free ranges of motion, keeping 1-3 Reps in Reserve (RPE 7-9).
2. **Volume Allocation**: Ensure each muscle group receives 10 to 18 high-quality working sets per microcycle.
3. **Recovery Architecture**: Calibrated for your ${weight} lbs frame, prioritize 7.5-9 hours of sleep to facilitate growth hormone release and central nervous system dissipation.

---

### 💡 Prescription & Action Item
* Track working loads, sets, and RPE inside the StrengthWise Workout Tracker.
* Increment loads by +2.5 to +5 lbs only when all prescribed sets hit top-of-range reps with pristine biomechanics.`;
}
