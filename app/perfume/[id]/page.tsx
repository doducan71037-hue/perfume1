"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ScentButton } from "@/components/ui/scent-button";
import { buildPlaceholderUrl } from "@/lib/placeholder";

interface PerfumeDetail {
  id: string;
  brand: string;
  name: string;
  year?: number;
  concentration?: string;
  gender?: string;
  priceRange: string;
  description?: string;
  profileText: string;
  imageUrl?: string | null;
  notes: Array<{
    id: string;
    name: string;
    nameCn?: string;
    position: string;
  }>;
  accords: Array<{ id: string; name: string; nameCn?: string }>;
  affiliateLinks: Array<{
    id: string;
    platform: string;
    url: string;
    price?: number | null;
    isAffiliate: boolean;
  }>;
}

interface SimilarPerfume {
  id: string;
  brand: string;
  name: string;
  similarityScore: number;
}

interface FeedbackSummary {
  likeCount: number;
  dislikeCount: number;
  totalCount: number;
  reasonCounts: Record<string, number>;
}

export default function PerfumeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [perfume, setPerfume] = useState<PerfumeDetail | null>(null);
  const [similarPerfumes, setSimilarPerfumes] = useState<SimilarPerfume[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerfume = async () => {
      try {
        // 设置超时，确保2秒内响应
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const startTime = Date.now();
        const response = await fetch(`/api/perfumes/${id}`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const fetchTime = Date.now() - startTime;
        console.log(`Perfume API fetch time: ${fetchTime}ms`);

        if (!response.ok) {
          setLoading(false);
          return;
        }
        const data = await response.json();
        
        // 立即设置主要数据，让页面先显示
        if (data.perfume) {
          setPerfume(data.perfume);
          window.scrollTo(0, 0);
          setLoading(false); // 主要数据加载完成就显示页面
        }
        
        // 异步设置次要数据（相似香水和反馈），不阻塞页面显示
        if (data.similarPerfumes) {
          setSimilarPerfumes(data.similarPerfumes);
        }
        if (data.feedbackSummary) {
          setFeedbackSummary(data.feedbackSummary);
        }
      } catch (error: unknown) {
        console.error("Error fetching perfume:", error);
        if (error.name === 'AbortError') {
          console.error("Request timeout after 2.5 seconds");
        }
        setLoading(false);
      }
    };

    fetchPerfume();
  }, [id]);

  // 只在没有数据且正在加载时显示loading
  if (loading && !perfume) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pt-20">
        <div className="text-center space-y-4">
          <span className="text-[10px] uppercase tracking-widest animate-pulse block">
            Loading Data
          </span>
          <p className="text-xs text-gray-400">This should take less than 3 seconds...</p>
        </div>
      </div>
    );
  }

  if (!perfume) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pt-20">
        <div className="text-center space-y-6">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">
            Perfume Not Found
          </p>
          <Link href="/search">
            <ScentButton size="sm">Back to Search</ScentButton>
          </Link>
        </div>
      </div>
    );
  }

  const topNotes = perfume.notes.filter((n) => n.position === "top");
  const middleNotes = perfume.notes.filter((n) => n.position === "middle");
  const baseNotes = perfume.notes.filter((n) => n.position === "base");

  const imageSrc =
    perfume.imageUrl ||
    buildPlaceholderUrl(perfume.id, `${perfume.brand} ${perfume.name}`);

  return (
    <div className="bg-white min-h-screen pt-20">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-80px)]">
          <div className="bg-gray-50 relative lg:h-[calc(100vh-80px)] lg:sticky lg:top-20">
            <img
              src={imageSrc}
              alt={`${perfume.brand} ${perfume.name}`}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute bottom-6 left-6 text-[10px] uppercase tracking-widest text-gray-200">
              {perfume.brand}
            </div>
          </div>

          <div className="px-6 py-20 lg:px-24 flex flex-col justify-center">
            <div className="mb-12">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {perfume.brand}
              </span>
              <h1 className="text-5xl lg:text-6xl font-medium text-black mt-4 mb-8 tracking-tight">
                {perfume.name}
              </h1>
              <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-widest text-gray-500 border-t border-b border-gray-100 py-4">
                {perfume.year && <span>{perfume.year}</span>}
                {perfume.year && <span>—</span>}
                {perfume.concentration && <span>{perfume.concentration}</span>}
                {perfume.concentration && <span>—</span>}
                {perfume.gender && <span>{perfume.gender}</span>}
              </div>
            </div>

            <p className="text-lg text-gray-600 font-light leading-relaxed mb-16">
              {perfume.description || perfume.profileText}
            </p>

            <div className="grid grid-cols-2 gap-12 mb-16">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-black mb-4">
                  Structure
                </h3>
                <ul className="space-y-2">
                  <li className="text-sm text-gray-600">
                    <span className="text-gray-400">Top:</span>{" "}
                    {topNotes.map((n) => n.nameCn || n.name).join(", ") ||
                      "—"}
                  </li>
                  <li className="text-sm text-gray-600">
                    <span className="text-gray-400">Heart:</span>{" "}
                    {middleNotes.map((n) => n.nameCn || n.name).join(", ") ||
                      "—"}
                  </li>
                  <li className="text-sm text-gray-600">
                    <span className="text-gray-400">Base:</span>{" "}
                    {baseNotes.map((n) => n.nameCn || n.name).join(", ") || "—"}
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-black mb-4">
                  Accords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {perfume.accords.map((accord) => (
                    <span
                      key={accord.id}
                      className="text-sm text-gray-600 border border-gray-200 px-2 py-1"
                    >
                      {accord.nameCn || accord.name}
                    </span>
                  ))}
                  {perfume.accords.length === 0 && (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </div>
              </div>
            </div>

            {feedbackSummary && feedbackSummary.totalCount > 0 && (
              <div className="mb-16">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-black mb-6">
                  Feedback
                </h3>
                <div className="text-sm text-gray-600 mb-4">
                  Likes: {feedbackSummary.likeCount} | Dislikes: {feedbackSummary.dislikeCount}
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(feedbackSummary.reasonCounts).map(
                    ([reason, count]) => (
                      <span
                        key={reason}
                        className="text-xs text-gray-500 border border-gray-200 px-2 py-1"
                      >
                        {reason} ({count})
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {perfume.affiliateLinks.length > 0 && (
              <div className="mt-auto">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-black mb-6">
                  Marketplace
                </h3>
                <div className="space-y-4">
                  {perfume.affiliateLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        fetch("/api/event", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            type: "affiliate_click",
                            payload: { perfumeId: perfume.id, linkId: link.id },
                          }),
                        });
                      }}
                      className="flex items-center justify-between group border border-gray-200 p-4 hover:bg-black hover:text-white hover:border-black transition-colors"
                    >
                      <span className="text-xs font-bold uppercase tracking-widest">
                        {link.platform}
                      </span>
                      <span className="text-sm">
                        {link.price != null ? `$${link.price}` : "View"}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {similarPerfumes.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-6 pb-24">
          <div className="border-t border-gray-200 pt-16">
            <h2 className="text-[10px] uppercase tracking-widest font-bold mb-12">
              Similar Profiles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {similarPerfumes.map((similar) => (
                <Link
                  key={similar.id}
                  href={`/perfume/${similar.id}`}
                  className="group block bg-gray-50 p-8 hover:bg-black hover:text-white transition-colors duration-300"
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">
                    {similar.brand}
                  </div>
                  <div className="text-xl font-medium mb-4">
                    {similar.name}
                  </div>
                  <p className="text-xs opacity-70 leading-relaxed">
                    Similarity: {(similar.similarityScore * 100).toFixed(0)}%
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
