"use client";

import { useEffect, useState } from "react";

interface Event {
  id: string;
  type: string;
  payload: any;
  sessionId: string | null;
  userId: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
}

export function EventsTable() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (typeFilter) {
      params.set("type", typeFilter);
    }
    fetch(`/api/admin/events?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch events:", err);
        setLoading(false);
      });
  }, [typeFilter]);

  if (loading) {
    return <div className="text-gray-400">加载中...</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md"
        >
          <option value="">所有类型</option>
          <option value="conversation_start">对话开始</option>
          <option value="questionnaire_complete">问卷完成</option>
          <option value="recommendation_view">推荐查看</option>
          <option value="affiliate_click">购买点击</option>
          <option value="feedback_submit">反馈提交</option>
          <option value="favorite_add">收藏添加</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">时间</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">类型</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">用户</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Session ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">载荷</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(event.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {event.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {event.user ? (
                    <span>{event.user.email}</span>
                  ) : (
                    <span className="text-gray-400">匿名</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">
                  {event.sessionId ? event.sessionId.substring(0, 8) + "..." : "-"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <details>
                    <summary className="cursor-pointer text-blue-600 text-xs">
                      查看
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-w-md">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {events.length === 0 && (
        <div className="text-center py-8 text-gray-400">暂无事件</div>
      )}
    </div>
  );
}
