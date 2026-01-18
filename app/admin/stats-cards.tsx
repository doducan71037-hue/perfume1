"use client";

import { useEffect, useState } from "react";

interface Stats {
  users: { total: number; active: number };
  conversations: { total: number; today: number };
  searches: { total: number; today: number };
  clicks: { total: number; today: number };
  feedbacks: { total: number; today: number };
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-gray-400">加载中...</div>;
  }

  if (!stats) {
    return <div className="text-red-400">加载失败</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-500 mb-1">用户总数</div>
        <div className="text-2xl font-bold">{stats.users.total}</div>
        <div className="text-xs text-gray-400 mt-1">活跃: {stats.users.active}</div>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-500 mb-1">对话总数</div>
        <div className="text-2xl font-bold">{stats.conversations.total}</div>
        <div className="text-xs text-gray-400 mt-1">今日: {stats.conversations.today}</div>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-500 mb-1">搜索次数</div>
        <div className="text-2xl font-bold">{stats.searches.total}</div>
        <div className="text-xs text-gray-400 mt-1">今日: {stats.searches.today}</div>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-500 mb-1">购买点击</div>
        <div className="text-2xl font-bold">{stats.clicks.total}</div>
        <div className="text-xs text-gray-400 mt-1">今日: {stats.clicks.today}</div>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-500 mb-1">反馈数</div>
        <div className="text-2xl font-bold">{stats.feedbacks.total}</div>
        <div className="text-xs text-gray-400 mt-1">今日: {stats.feedbacks.today}</div>
      </div>
    </div>
  );
}
