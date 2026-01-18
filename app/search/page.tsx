"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { buildPlaceholderUrl } from "@/lib/placeholder";

interface Perfume {
  id: string;
  brand: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        // 如果没有搜索词，获取热门香水；否则进行搜索
        const url = query.trim() 
          ? `/api/perfumes/search?q=${encodeURIComponent(query)}`
          : `/api/perfumes/popular`;
        
        const response = await fetch(url);
        if (!response.ok) {
          console.error("API error:", response.status, response.statusText);
          setResults([]);
          return;
        }
        const data = await response.json();
        setResults(data.perfumes || []);
      } catch (error) {
        console.error("Error fetching perfumes:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, query.trim() ? 300 : 0); // 如果没有搜索词，立即加载；否则延迟300ms

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-32 min-h-screen">
      <div className="border-b border-black mb-16 pb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search collection..."
          className="w-full text-4xl md:text-6xl font-light bg-transparent focus:outline-none placeholder:text-gray-200"
        />
      </div>

      {loading && (
        <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-8">
          Searching...
        </div>
      )}

      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {results.map((perfume) => {
            const imageSrc =
              perfume.imageUrl ||
              buildPlaceholderUrl(
                perfume.id,
                `${perfume.brand} ${perfume.name}`
              );

            return (
              <Link
                href={`/perfume/${perfume.id}`}
                key={perfume.id}
                className="group block cursor-pointer"
              >
                <div className="aspect-[3/4] bg-gray-50 mb-6 overflow-hidden relative">
                  <img
                    src={imageSrc}
                    alt={`${perfume.brand} ${perfume.name}`}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                    {perfume.brand}
                  </span>
                  <h3 className="text-lg font-medium text-black">
                    {perfume.name}
                  </h3>
                  {perfume.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {perfume.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <>
          {!loading && query && (
            <div className="col-span-full py-20 text-gray-300 text-xl font-light">
              No matching perfumes found. Try searching by brand or name.
            </div>
          )}
          
        </>
      )}
    </div>
  );
}
