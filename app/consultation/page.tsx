"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ScentButton } from "@/components/ui/scent-button";
import { useAuth } from "@/context/AuthContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "report_link";
  reportId?: string;
}

export default function ConsultationPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(false);

  useEffect(() => {
    // 只在用户主动发送消息后才自动滚动
    if (shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      shouldAutoScroll.current = false;
    }
  }, [messages, isLoading]);

  // 如果正在加载认证信息，显示加载状态
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[90vh] px-6 bg-white pt-20">
        <p className="text-gray-500 font-light">加载中...</p>
      </div>
    );
  }

  // 如果用户未登录，显示提示并要求登录
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[90vh] px-6 bg-white pt-20">
        <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-8">
          Consultation
        </h1>
        <p className="text-gray-500 font-light text-center max-w-md mb-12 leading-relaxed">
          请先登录账号才能进行咨询
        </p>
        <ScentButton size="lg" onClick={() => router.push("/login")}>
          前往登录
        </ScentButton>
      </div>
    );
  }

  const startConsultation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "启动对话失败");
        return;
      }

      const data = await response.json();
      setConversationId(data.conversationId);
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: data.firstQuestion,
        },
      ]);
      setHasStarted(true);
      // 初始化时不自动滚动，让用户能看到第一条消息
      shouldAutoScroll.current = false;
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert("启动对话失败，请检查服务状态");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !conversationId || isLoading) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue("");
    setIsLoading(true);
    // 用户发送消息后，标记需要自动滚动
    shouldAutoScroll.current = true;

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          answer: newUserMsg.content,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "发送消息失败");
        return;
      }

      const data = await response.json();

      if (data.type === "report") {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Profile analysis complete. I have generated a curated list of matches.",
            type: "report_link",
            reportId: conversationId,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.content,
          },
        ]);
      }
      // AI 回复后也需要自动滚动以显示新消息
      shouldAutoScroll.current = true;
    } catch (error) {
      console.error("Error sending message:", error);
      alert("发送消息失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[90vh] px-6 bg-white pt-20">
        <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-8">
          Consultation
        </h1>
        <p className="text-gray-500 font-light text-center max-w-md mb-12 leading-relaxed">
          A guided algorithmic process to identify your olfactory signature.
        </p>
        <ScentButton size="lg" onClick={startConsultation} isLoading={isLoading}>
          Initialize
        </ScentButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-white pt-20 max-w-3xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto px-6 py-12">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-12 flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <span className="text-[10px] uppercase tracking-widest text-gray-300 mb-2 font-mono">
              {msg.role === "user" ? "USER_INPUT" : "SYSTEM_OUTPUT"}
            </span>
            <div
              className={`max-w-[90%] md:max-w-lg text-lg md:text-xl font-light leading-relaxed
              ${
                msg.role === "user"
                  ? "text-right text-black"
                  : "text-left text-gray-600"
              }`}
            >
              {msg.content}
              {msg.type === "report_link" && msg.reportId && (
                <div className="mt-8">
                  <ScentButton
                    size="md"
                    onClick={() => router.push(`/report/${msg.reportId}`)}
                  >
                    View Report
                  </ScentButton>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-col items-start fade-in-up">
            <span className="text-[10px] uppercase tracking-widest text-gray-300 mb-2 font-mono">
              PROCESSING
            </span>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-black rounded-none animate-pulse"></div>
              <div className="w-1 h-1 bg-black rounded-none animate-pulse delay-100"></div>
              <div className="w-1 h-1 bg-black rounded-none animate-pulse delay-200"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-6 pb-12 bg-white">
        <form
          onSubmit={handleSendMessage}
          className="relative border-b border-gray-200"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your response..."
            className="w-full py-4 bg-transparent text-xl font-light focus:outline-none placeholder:text-gray-200"
            disabled={
              isLoading || messages.some((m) => m.type === "report_link")
            }
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest font-bold hover:text-gray-500 disabled:opacity-0 transition-all"
            disabled={!inputValue.trim() || isLoading}
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
