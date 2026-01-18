"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Perfume {
  id: string;
  brand: string;
  name: string;
  year: number | null;
  concentration: string | null;
  gender: string | null;
  priceRange: string;
  description: string | null;
  imageUrl: string | null;
  imageSource: string;
  imageAttribution: string | null;
  popularityScore: number;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminPerfumesPage() {
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [editingPerfume, setEditingPerfume] = useState<Perfume | null>(null);
  const [editForm, setEditForm] = useState<Partial<Perfume>>({});
  const [saving, setSaving] = useState(false);
  const [togglingHide, setTogglingHide] = useState<string | null>(null);

  useEffect(() => {
    // 检查是否已认证（通过cookie session）
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      // 尝试获取数据来验证是否已登录
      const response = await fetch("/api/admin/perfumes?page=1&limit=1");
      if (response.ok) {
        setAuthenticated(true);
        fetchPerfumes();
      } else {
        setAuthenticated(false);
      }
    } catch {
      setAuthenticated(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      // 搜索防抖
      const timer = setTimeout(() => {
        fetchPerfumes();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, pagination.page, authenticated]);

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
        fetchPerfumes();
      } else {
        alert(data.error || "登录失败");
      }
    } catch {
      alert("登录失败，请重试");
    }
  };

  const fetchPerfumes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`/api/admin/perfumes?${params}`);

      if (!response.ok) {
        if (response.status === 401) {
          setAuthenticated(false);
          sessionStorage.removeItem("admin_authenticated");
          sessionStorage.removeItem("admin_password");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch perfumes`);
      }

      const data = await response.json();
      setPerfumes(data.perfumes || []);
      setPagination(data.pagination || pagination);
    } catch (error: unknown) {
      console.error("Error fetching perfumes:", error);
      alert(`加载香水列表失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (perfume: Perfume) => {
    // 获取完整信息
    try {
      const response = await fetch(`/api/admin/perfumes/${perfume.id}`);

      if (response.ok) {
        const data = await response.json();
        setEditingPerfume(data.perfume);
        setEditForm(data.perfume);
      } else {
        // 如果获取失败，使用当前数据
        setEditingPerfume(perfume);
        setEditForm(perfume);
      }
    } catch (error) {
      console.error("Error fetching perfume details:", error);
      // 如果出错，使用当前数据
      setEditingPerfume(perfume);
      setEditForm(perfume);
    }
  };

  const handleToggleHide = async (perfume: Perfume) => {
    if (!confirm(`确定要${perfume.isHidden ? "显示" : "隐藏"}这个香水吗？`)) {
      return;
    }

    setTogglingHide(perfume.id);
    try {
      const response = await fetch(`/api/admin/perfumes/${perfume.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isHidden: !perfume.isHidden,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "操作失败");
      }

      alert(`已${perfume.isHidden ? "显示" : "隐藏"}该香水`);
      fetchPerfumes();
    } catch (error: unknown) {
      console.error("Error toggling hide status:", error);
      alert(error instanceof Error ? error.message : "操作失败，请重试");
    } finally {
      setTogglingHide(null);
    }
  };

  const handleSave = async () => {
    if (!editingPerfume) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/perfumes/${editingPerfume.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "保存失败");
      }

      alert("保存成功！");
      setEditingPerfume(null);
      setEditForm({});
      fetchPerfumes();
    } catch (error: unknown) {
      console.error("Error saving perfume:", error);
      alert(error instanceof Error ? error.message : "保存失败，请重试");
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">香水管理</h1>
          <Link href="/admin">
            <Button variant="ghost">← 返回</Button>
          </Link>
        </div>

        {/* 搜索栏 */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            placeholder="搜索品牌或名称..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* 列表 */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-lg">加载中...</p>
          </div>
        ) : perfumes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-muted-foreground">暂无数据</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 mb-6">
              {perfumes.map((perfume) => (
                <div
                  key={perfume.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* 图片 */}
                    <div className="flex-shrink-0">
                      {perfume.imageUrl ? (
                        <img
                          src={perfume.imageUrl}
                          alt={`${perfume.brand} ${perfume.name}`}
                          className="w-24 h-24 object-cover rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.png";
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-200 rounded border flex items-center justify-center text-xs text-gray-400">
                          无图片
                        </div>
                      )}
                    </div>

                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {perfume.brand} {perfume.name}
                          </h3>
                          <div className="mt-1 text-sm text-muted-foreground space-y-1">
                            {perfume.year && <div>年份: {perfume.year}</div>}
                            {perfume.concentration && (
                              <div>浓度: {perfume.concentration}</div>
                            )}
                            {perfume.gender && <div>性别: {perfume.gender}</div>}
                            <div>价格区间: {perfume.priceRange}</div>
                            {perfume.description && (
                              <div className="truncate max-w-md">
                                描述: {perfume.description}
                              </div>
                            )}
                          </div>
                          {perfume.imageUrl && (
                            <div className="mt-2 text-xs text-muted-foreground truncate max-w-md">
                              图片: {perfume.imageUrl}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEdit(perfume)}
                            variant="outline"
                            size="sm"
                          >
                            编辑
                          </Button>
                          <Button
                            onClick={() => handleToggleHide(perfume)}
                            variant={perfume.isHidden ? "default" : "outline"}
                            size="sm"
                            disabled={togglingHide === perfume.id}
                            className={perfume.isHidden ? "bg-orange-500 hover:bg-orange-600" : ""}
                          >
                            {togglingHide === perfume.id ? "处理中..." : perfume.isHidden ? "显示" : "隐藏"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1}
                >
                  上一页
                </Button>
                <span className="text-sm">
                  第 {pagination.page} / {pagination.totalPages} 页（共 {pagination.total} 条）
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  disabled={pagination.page >= pagination.totalPages}
                >
                  下一页
                </Button>
              </div>
            )}
          </>
        )}

        {/* 编辑模态框 */}
        {editingPerfume && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">
                    编辑: {editingPerfume.brand} {editingPerfume.name}
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingPerfume(null);
                      setEditForm({});
                    }}
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* 品牌 */}
                  <div>
                    <label className="block text-sm font-medium mb-1">品牌 *</label>
                    <input
                      type="text"
                      value={editForm.brand || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, brand: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* 名称 */}
                  <div>
                    <label className="block text-sm font-medium mb-1">名称 *</label>
                    <input
                      type="text"
                      value={editForm.name || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* 年份 */}
                  <div>
                    <label className="block text-sm font-medium mb-1">年份</label>
                    <input
                      type="number"
                      value={editForm.year || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          year: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* 浓度 */}
                  <div>
                    <label className="block text-sm font-medium mb-1">浓度</label>
                    <select
                      value={editForm.concentration || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          concentration: e.target.value || null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">请选择</option>
                      <option value="EDT">EDT</option>
                      <option value="EDP">EDP</option>
                      <option value="Parfum">Parfum</option>
                      <option value="Extrait">Extrait</option>
                    </select>
                  </div>

                  {/* 性别 */}
                  <div>
                    <label className="block text-sm font-medium mb-1">性别</label>
                    <select
                      value={editForm.gender || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          gender: e.target.value || null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">请选择</option>
                      <option value="unisex">中性</option>
                      <option value="male">男性</option>
                      <option value="female">女性</option>
                    </select>
                  </div>

                  {/* 价格区间 */}
                  <div>
                    <label className="block text-sm font-medium mb-1">价格区间</label>
                    <select
                      value={editForm.priceRange || "mid"}
                      onChange={(e) =>
                        setEditForm({ ...editForm, priceRange: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="budget">经济</option>
                      <option value="mid">中等</option>
                      <option value="luxury">奢侈</option>
                    </select>
                  </div>

                  {/* 描述 */}
                  <div>
                    <label className="block text-sm font-medium mb-1">描述</label>
                    <textarea
                      value={editForm.description || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, description: e.target.value })
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* 图片URL */}
                  <div>
                    <label className="block text-sm font-medium mb-1">图片URL</label>
                    <input
                      type="url"
                      value={editForm.imageUrl || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, imageUrl: e.target.value || null })
                      }
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {editForm.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={editForm.imageUrl}
                          alt="预览"
                          className="max-w-xs max-h-48 object-contain border rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 图片来源 */}
                  <div>
                    <label className="block text-sm font-medium mb-1">图片来源</label>
                    <select
                      value={editForm.imageSource || "NONE"}
                      onChange={(e) =>
                        setEditForm({ ...editForm, imageSource: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="NONE">无</option>
                      <option value="WIKIMEDIA">Wikimedia</option>
                      <option value="OPENVERSE">Openverse</option>
                      <option value="USER">用户上传</option>
                    </select>
                  </div>

                  {/* 图片署名 */}
                  <div>
                    <label className="block text-sm font-medium mb-1">图片署名</label>
                    <input
                      type="text"
                      value={editForm.imageAttribution || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          imageAttribution: e.target.value || null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* 隐藏状态 */}
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.isHidden || false}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            isHidden: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">
                        隐藏此香水（前端不显示）
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingPerfume(null);
                      setEditForm({});
                    }}
                  >
                    取消
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "保存中..." : "保存"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
