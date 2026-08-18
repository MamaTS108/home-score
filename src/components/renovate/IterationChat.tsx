"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import type { AiMessage } from "@/lib/types";

export function IterationChat({ projectId, initialMessages }: { projectId: string; initialMessages: AiMessage[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: AiMessage = {
      id: `temp-${Date.now()}`,
      projectId,
      role: "user",
      content: input,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur de l'assistant.");

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">Ajuster mon projet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Ex. &laquo;&nbsp;je veux plus de bois&nbsp;&raquo;, &laquo;&nbsp;finalement du carrelage beige&nbsp;&raquo;,
          &laquo;&nbsp;respecte un budget de 4000€&nbsp;&raquo;.
        </p>
      </CardHeader>
      <CardContent>
        {messages.length > 0 && (
          <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "bg-accent text-accent-foreground rounded-lg px-3 py-2 text-sm max-w-[80%]"
                      : "bg-accent-soft text-foreground rounded-lg px-3 py-2 text-sm max-w-[80%]"
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            rows={2}
            placeholder="Décrivez le changement souhaité..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} disabled={loading}>
            {loading ? "..." : "Envoyer"}
          </Button>
        </div>
        {error && <p className="text-sm text-danger mt-2">{error}</p>}
      </CardContent>
    </Card>
  );
}
