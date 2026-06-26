import { NextResponse } from "next/server";

const MISTRAL_CONVERSATIONS_URL = "https://api.mistral.ai/v1/conversations";
const MISTRAL_AGENT_COMPLETIONS_URL = "https://api.mistral.ai/v1/agents/completions";

type MistralOutput = {
  type?: string;
  content?: string | Array<{ type?: string; text?: string; content?: string }>;
  text?: string;
};

type MistralResponse = {
  answer?: string;
  output_text?: string;
  output?: MistralOutput[];
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string; content?: string }>;
    };
  }>;
};

export async function POST(request: Request) {
  const apiKey = process.env.MISTRAL_API_KEY;
  const agentId = process.env.MISTRAL_AGENT_ID ?? "ag_019f02ee1e88722fb6a1043abada152b";

  if (!apiKey) {
    return NextResponse.json(
      { error: "MISTRAL_API_KEY fehlt. Bitte in Coolify oder .env setzen." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json({ error: "Bitte eine Nachricht eingeben." }, { status: 400 });
  }

  const { response: mistralResponse, payload } = await callMistralAgent(apiKey, agentId, message);

  if (!mistralResponse.ok) {
    return NextResponse.json(
      {
        error:
          extractError(payload) ??
          `Mistral hat mit Status ${mistralResponse.status} geantwortet.`,
      },
      { status: mistralResponse.status },
    );
  }

  const answer = extractAnswer(payload);

  return NextResponse.json({
    answer: answer || "Der Agent hat keine lesbare Antwort gesendet.",
  });
}

async function callMistralAgent(apiKey: string, agentId: string, message: string) {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const conversationsResponse = await fetch(MISTRAL_CONVERSATIONS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      agent_id: agentId,
      inputs: message,
    }),
  });
  const conversationsPayload = (await conversationsResponse.json().catch(() => null)) as
    | MistralResponse
    | null;

  if (conversationsResponse.ok || ![400, 404, 422].includes(conversationsResponse.status)) {
    return { response: conversationsResponse, payload: conversationsPayload };
  }

  const completionsResponse = await fetch(MISTRAL_AGENT_COMPLETIONS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      agent_id: agentId,
      messages: [{ role: "user", content: message }],
    }),
  });
  const completionsPayload = (await completionsResponse.json().catch(() => null)) as
    | MistralResponse
    | null;

  return { response: completionsResponse, payload: completionsPayload };
}

function extractAnswer(payload: MistralResponse | null): string {
  if (!payload) return "";
  if (typeof payload.answer === "string") return payload.answer;
  if (typeof payload.output_text === "string") return payload.output_text;

  const outputText = payload.output
    ?.map((item) => {
      if (typeof item.text === "string") return item.text;
      if (typeof item.content === "string") return item.content;
      if (Array.isArray(item.content)) {
        return item.content
          .map((part) => part.text ?? part.content ?? "")
          .filter(Boolean)
          .join("\n");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");

  if (outputText) return outputText;

  const choiceContent = payload.choices?.[0]?.message?.content;
  if (typeof choiceContent === "string") return choiceContent;
  if (Array.isArray(choiceContent)) {
    return choiceContent.map((part) => part.text ?? part.content ?? "").filter(Boolean).join("\n");
  }

  return "";
}

function extractError(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const message = record.message ?? record.error;
  if (typeof message === "string") return message;
  if (message && typeof message === "object" && "message" in message) {
    const nested = (message as Record<string, unknown>).message;
    return typeof nested === "string" ? nested : null;
  }
  return null;
}
