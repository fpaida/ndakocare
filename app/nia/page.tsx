"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export default function NiaPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isFr = language === "fr";

  const [checkingSession, setCheckingSession] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const nextMessageId = useRef(1);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const welcomeMessage = isFr
    ? "Bonjour ! Je suis Nia, votre assistante NdakoCare. Comment puis-je vous aider aujourd'hui ?"
    : "Hello! I'm Nia, your NdakoCare Assistant. How can I help you today?";

  const suggestions = isFr
    ? [
        "Comment payer les frais scolaires ?",
        "Comment commander des médicaments ?",
        "Comment faire une recharge mobile ?",
        "Comment ajouter un bénéficiaire ?",
      ]
    : [
        "How do I pay school fees?",
        "How do I order medicine?",
        "How do I make a mobile recharge?",
        "How do I add a beneficiary?",
      ];

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Unable to check Nia session:", sessionError);
        }

        if (!session) {
          router.replace("/login");
          return;
        }

        setCheckingSession(false);
      } catch (sessionCheckError) {
        console.error(
          "Unexpected error while checking Nia session:",
          sessionCheckError
        );

        router.replace("/login");
      }
    };

    void checkSession();
  }, [router]);

  useEffect(() => {
    setMessages((currentMessages) => {
      if (
        currentMessages.length === 0 ||
        (currentMessages.length === 1 &&
          currentMessages[0].role === "assistant")
      ) {
        return [
          {
            id: 0,
            role: "assistant",
            content: welcomeMessage,
          },
        ];
      }

      return currentMessages;
    });
  }, [welcomeMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending]);

  const sendMessage = async (messageText: string) => {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || sending) {
      return;
    }

    if (trimmedMessage.length > 2000) {
      setError(
        isFr
          ? "Votre message est trop long. Veuillez le raccourcir."
          : "Your message is too long. Please shorten it."
      );

      return;
    }

    setError("");
    setInput("");

    const userMessage: ChatMessage = {
      id: nextMessageId.current++,
      role: "user",
      content: trimmedMessage,
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
    ]);

    setSending(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error(
          "Unable to get Nia authentication session:",
          sessionError
        );

        throw new Error("Unable to verify your session.");
      }

      if (!session?.access_token) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/nia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: trimmedMessage,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Unable to contact Nia."
        );
      }

      if (
        typeof data?.reply !== "string" ||
        !data.reply.trim()
      ) {
        throw new Error("Nia returned an empty response.");
      }

      const assistantMessage: ChatMessage = {
        id: nextMessageId.current++,
        role: "assistant",
        content: data.reply.trim(),
      };

      setMessages((currentMessages) => [
        ...currentMessages,
        assistantMessage,
      ]);
    } catch (requestError) {
      console.error("Nia chat request failed:", requestError);

      setError(
        isFr
          ? "Nia est temporairement indisponible. Veuillez réessayer."
          : "Nia is temporarily unavailable. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    await sendMessage(input);
  };

  if (checkingSession) {
    return (
      <>
        <Navbar />

        <main
          style={{
            minHeight: "calc(100vh - 70px)",
            background: "#f6f8f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <p style={{ color: "#555" }}>
            {isFr ? "Chargement de Nia..." : "Loading Nia..."}
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main
        style={{
          minHeight: "calc(100vh - 70px)",
          background: "#f6f8f7",
          padding: "32px 16px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <section
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              border: "1px solid #e3e8e5",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.06)",
              overflow: "hidden",
            }}
          >
            <header
              style={{
                padding: "24px",
                borderBottom: "1px solid #e8ece9",
                background:
                  "linear-gradient(135deg, #f2faf5 0%, #ffffff 100%)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "#008037",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  N
                </div>

                <div>
                  <h1
                    style={{
                      margin: 0,
                      color: "#173b2a",
                      fontSize: "26px",
                    }}
                  >
                    Nia
                  </h1>

                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#5f6f66",
                      fontSize: "14px",
                    }}
                  >
                    {isFr
                      ? "Votre assistante NdakoCare"
                      : "Your NdakoCare Assistant"}
                  </p>
                </div>
              </div>
            </header>

            <div
              style={{
                minHeight: "430px",
                maxHeight: "58vh",
                overflowY: "auto",
                padding: "24px",
              }}
            >
              {messages.map((message) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={message.id}
                    style={{
                      display: "flex",
                      justifyContent: isUser
                        ? "flex-end"
                        : "flex-start",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "78%",
                        padding: "12px 16px",
                        borderRadius: isUser
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                        background: isUser
                          ? "#008037"
                          : "#eef3f0",
                        color: isUser
                          ? "#ffffff"
                          : "#26352d",
                        lineHeight: 1.55,
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {message.content}
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "16px 16px 16px 4px",
                      background: "#eef3f0",
                      color: "#5f6f66",
                    }}
                  >
                    {isFr
                      ? "Nia réfléchit..."
                      : "Nia is thinking..."}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {messages.length <= 1 && (
              <div
                style={{
                  padding: "0 24px 20px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 10px",
                    color: "#68776f",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {isFr
                    ? "Questions suggérées"
                    : "Suggested questions"}
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={sending}
                      onClick={() =>
                        void sendMessage(suggestion)
                      }
                      style={{
                        border: "1px solid #cbd8d0",
                        background: "#ffffff",
                        color: "#27543b",
                        borderRadius: "999px",
                        padding: "9px 13px",
                        cursor: sending
                          ? "not-allowed"
                          : "pointer",
                        fontSize: "13px",
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <footer
              style={{
                borderTop: "1px solid #e8ece9",
                padding: "18px 24px 20px",
              }}
            >
              {error && (
                <div
                  role="alert"
                  style={{
                    background: "#fff3f3",
                    border: "1px solid #efcaca",
                    color: "#9d2929",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    marginBottom: "12px",
                    fontSize: "14px",
                  }}
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-end",
                }}
              >
                <textarea
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  disabled={sending}
                  maxLength={2000}
                  rows={2}
                  placeholder={
                    isFr
                      ? "Posez une question à Nia..."
                      : "Ask Nia a question..."
                  }
                  style={{
                    flex: 1,
                    resize: "none",
                    border: "1px solid #cbd5cf",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    font: "inherit",
                    lineHeight: 1.4,
                    outline: "none",
                    minHeight: "48px",
                  }}
                />

                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  style={{
                    border: "none",
                    borderRadius: "12px",
                    padding: "13px 20px",
                    minHeight: "48px",
                    background:
                      sending || !input.trim()
                        ? "#9ab8a6"
                        : "#008037",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor:
                      sending || !input.trim()
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isFr ? "Envoyer" : "Send"}
                </button>
              </form>

              <p
                style={{
                  margin: "10px 0 0",
                  textAlign: "center",
                  color: "#7b8780",
                  fontSize: "12px",
                }}
              >
                {isFr
                  ? "Nia peut vous guider dans NdakoCare, mais ne peut pas effectuer de transactions à votre place."
                  : "Nia can guide you through NdakoCare but cannot perform transactions for you."}
              </p>
            </footer>
          </section>
        </div>
      </main>
    </>
  );
}