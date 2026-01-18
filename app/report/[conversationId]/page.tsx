"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ScentButton } from "@/components/ui/scent-button";
import { buildPlaceholderUrl } from "@/lib/placeholder";

interface ReportSection {
  perfumeId: string;
  perfumeName: string;
  brand: string;
  imageUrl?: string | null; // 添加 imageUrl 字段
  whatItSmellsLike: string;
  whatItDoesNotSmellLike: string;
  notesBreakdown: {
    top: string[];
    middle: string[];
    base: string[];
  };
  accords: string[];
  potentialIssues: string;
  suitableScenes: string;
  uncertaintyHints: string;
  rationale: {
    sources: string[];
  };
}

interface GeneratedReport {
  topRecommendations: ReportSection[];
  alternatives: ReportSection[];
  summary: string;
  textSummary?: string; // 简单文字说明
}

export default function ReportPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const { conversationId } = params;
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackState, setFeedbackState] = useState<
    Record<string, boolean | null>
  >({});

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/recommendations/${conversationId}`);
        if (!response.ok) {
          setLoading(false);
          return;
        }
        const data = await response.json();
        setReport(data.report);
      } catch (error) {
        console.error("Error fetching report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();

    // 如果报告已加载，等待5秒后刷新一次以获取详细报告（如果已生成）
    const refreshTimer = setTimeout(() => {
      fetchReport();
    }, 5000);

    return () => clearTimeout(refreshTimer);
  }, [conversationId]);

  const sendFeedback = async (perfumeId: string, like: boolean) => {
    setFeedbackState((prev) => ({ ...prev, [perfumeId]: like }));
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          perfumeId,
          like,
        }),
      });
    } catch (error) {
      console.error("Error sending feedback:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pt-20">
        <span className="text-[10px] uppercase tracking-widest animate-pulse">
          Generating Report
        </span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pt-20">
        <div className="text-center space-y-6">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">
            Report Not Found
          </p>
          <Link href="/consultation">
            <ScentButton size="sm">Restart Consultation</ScentButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white pt-32 pb-20">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-32 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-8">
            Olfactory Profile
          </h1>
          {report.textSummary && (
            <div className="mb-8 p-6 bg-gray-50 border-l-4 border-black">
              <p className="text-lg md:text-xl text-gray-700 font-light leading-relaxed">
                {report.textSummary}
              </p>
            </div>
          )}
          <p className="text-xl md:text-2xl text-gray-500 font-light leading-relaxed">
            {report.summary}
          </p>
        </div>

        <div className="mb-32">
          <div className="border-t border-black mb-12 pt-4 flex justify-between items-start">
            <h2 className="text-[10px] uppercase tracking-widest font-bold">
              Primary Selection
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-gray-400">
              01 — 0{report.topRecommendations.length}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-24">
            {report.topRecommendations.map((perfume) => (
              <div key={perfume.perfumeId} className="group">
                <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden mb-8">
                  <img
                    src={
                      perfume.imageUrl ||
                      buildPlaceholderUrl(
                        perfume.perfumeId,
                        `${perfume.brand} ${perfume.perfumeName}`
                      )
                    }
                    alt={`${perfume.brand} ${perfume.perfumeName}`}
                    className="absolute inset-0 h-full w-full object-cover object-center grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                  <div className="absolute bottom-6 left-6 text-[10px] uppercase tracking-widest text-gray-200">
                    {perfume.brand}
                  </div>
                </div>

                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    {perfume.brand}
                  </span>
                  <h3 className="text-3xl font-medium mb-6">
                    {perfume.perfumeName}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-md">
                    {perfume.whatItSmellsLike}
                  </p>

                  <div className="flex gap-4">
                    <Link href={`/perfume/${perfume.perfumeId}`}>
                      <ScentButton variant="outline" size="sm">
                        Explore
                      </ScentButton>
                    </Link>
                    <ScentButton
                      variant={
                        feedbackState[perfume.perfumeId] === true
                          ? "primary"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => sendFeedback(perfume.perfumeId, true)}
                    >
                      Like
                    </ScentButton>
                    <ScentButton
                      variant={
                        feedbackState[perfume.perfumeId] === false
                          ? "primary"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => sendFeedback(perfume.perfumeId, false)}
                    >
                      Pass
                    </ScentButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-20">
          <h2 className="text-[10px] uppercase tracking-widest font-bold mb-12">
            Alternatives
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {report.alternatives.map((perfume) => (
              <Link
                href={`/perfume/${perfume.perfumeId}`}
                key={perfume.perfumeId}
                className="group block bg-gray-50 p-8 hover:bg-black hover:text-white transition-colors duration-300"
              >
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">
                  {perfume.brand}
                </div>
                <div className="text-xl font-medium mb-4">
                  {perfume.perfumeName}
                </div>
                <p className="text-xs opacity-70 leading-relaxed line-clamp-2">
                  {perfume.whatItSmellsLike}
                </p>
                <div className="mt-6 flex gap-3">
                  <ScentButton
                    variant={
                      feedbackState[perfume.perfumeId] === true
                        ? "primary"
                        : "outline"
                    }
                    size="sm"
                    onClick={(event) => {
                      event.preventDefault();
                      sendFeedback(perfume.perfumeId, true);
                    }}
                  >
                    Like
                  </ScentButton>
                  <ScentButton
                    variant={
                      feedbackState[perfume.perfumeId] === false
                        ? "primary"
                        : "outline"
                    }
                    size="sm"
                    onClick={(event) => {
                      event.preventDefault();
                      sendFeedback(perfume.perfumeId, false);
                    }}
                  >
                    Pass
                  </ScentButton>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-32 flex justify-center">
          <Link href="/consultation">
            <ScentButton variant="ghost">Reset Analysis</ScentButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
