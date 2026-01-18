"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ImageCandidate {
  id: string;
  perfumeId: string;
  perfumeBrand: string;
  perfumeName: string;
  imageUrl: string;
  source: string;
  license?: string;
  creator?: string;
  sourcePageUrl?: string;
  confidence: number;
  createdAt: string;
}

export default function ImageReviewPage() {
  const [candidates, setCandidates] = useState<ImageCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // 检查是否已认证（通过cookie session）
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/images");
      if (response.ok) {
        setAuthenticated(true);
        fetchCandidates();
      } else {
        setAuthenticated(false);
        setLoading(false);
      }
    } catch {
      setAuthenticated(false);
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert("请输入邮箱和密码");
      return;
    }

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setAuthenticated(true);
        fetchCandidates();
      } else {
        alert(data.error || "登录失败");
      }
    } catch {
      alert("登录失败，请重试");
    }
  };

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/images");

      if (!response.ok) {
        throw new Error("Failed to fetch candidates");
      }

      const data = await response.json();
      setCandidates(data.candidates || []);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      alert("加载候选列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map((c) => c.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchAction = async (action: "approve" | "reject") => {
    if (selectedIds.size === 0) {
      alert("请先选择要操作的候选");
      return;
    }

    if (
      !confirm(
        `确定要${action === "approve" ? "通过" : "拒绝"} ${selectedIds.size} 个候选吗？`
      )
    ) {
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/admin/images/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          candidateIds: Array.from(selectedIds),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update candidates");
      }

      // 刷新列表
      await fetchCandidates();
      setSelectedIds(new Set());
      alert(`成功${action === "approve" ? "通过" : "拒绝"} ${selectedIds.size} 个候选`);
    } catch (error) {
      console.error("Error updating candidates:", error);
      alert("操作失败");
    } finally {
      setProcessing(false);
    }
  };

  const handleSingleAction = async (
    id: string,
    action: "approve" | "reject"
  ) => {
    setProcessing(true);
    try {
      const response = await fetch("/api/admin/images/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          candidateIds: [id],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update candidate");
      }

      // 刷新列表
      await fetchCandidates();
    } catch (error) {
      console.error("Error updating candidate:", error);
      alert("操作失败");
    } finally {
      setProcessing(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white border border-gray-200 rounded-lg">
          <h1 className="text-2xl font-bold mb-4">管理员登录</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@scentai.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              登录
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">图片审核</h1>
            <p className="text-muted-foreground">
              待审核: {candidates.length} 个候选
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin">
              <Button variant="outline">返回管理后台</Button>
            </Link>
            {candidates.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                  disabled={processing}
                >
                  {selectedIds.size === candidates.length ? "取消全选" : "全选"}
                </Button>
                <Button
                  onClick={() => handleBatchAction("approve")}
                  disabled={processing || selectedIds.size === 0}
                >
                  批量通过 ({selectedIds.size})
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleBatchAction("reject")}
                  disabled={processing || selectedIds.size === 0}
                >
                  批量拒绝 ({selectedIds.size})
                </Button>
              </>
            )}
          </div>
        </div>

        {candidates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <p className="text-lg text-muted-foreground mb-4">
              暂无待审核的候选图片
            </p>
            <p className="text-sm text-muted-foreground">
              运行 <code className="bg-gray-100 px-2 py-1 rounded">
                npm run find:images
              </code>{" "}
              生成候选
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
                  <img
                    src={candidate.imageUrl}
                    alt={`${candidate.perfumeBrand} ${candidate.perfumeName}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/api/placeholder?id=" + candidate.perfumeId;
                    }}
                  />
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(candidate.id)}
                      onChange={() => handleToggleSelect(candidate.id)}
                      className="w-5 h-5 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                      {candidate.perfumeBrand}
                    </div>
                    <div className="text-lg font-medium">
                      {candidate.perfumeName}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <div>
                      <span className="font-semibold">来源:</span>{" "}
                      {candidate.source}
                    </div>
                    {candidate.license && (
                      <div>
                        <span className="font-semibold">许可:</span>{" "}
                        {candidate.license}
                      </div>
                    )}
                    {candidate.creator && (
                      <div>
                        <span className="font-semibold">创作者:</span>{" "}
                        {candidate.creator}
                      </div>
                    )}
                    <div>
                      <span className="font-semibold">置信度:</span>{" "}
                      {(candidate.confidence * 100).toFixed(0)}%
                    </div>
                  </div>

                  {candidate.sourcePageUrl && (
                    <a
                      href={candidate.sourcePageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline block truncate"
                    >
                      查看来源 →
                    </a>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleSingleAction(candidate.id, "approve")}
                      disabled={processing}
                      className="flex-1"
                    >
                      通过
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleSingleAction(candidate.id, "reject")}
                      disabled={processing}
                      className="flex-1"
                    >
                      拒绝
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {candidates.length > 0 && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-semibold mb-2">提示：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>审核通过后，运行 <code className="bg-blue-100 px-1 rounded">npm run apply:images</code> 应用图片</li>
              <li>Wikidata 来源的图片置信度通常较高（90%）</li>
              <li>Openverse 来源的图片置信度中等（70%）</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
