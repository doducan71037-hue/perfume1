"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 实现数据获取
    // 从Event表计算转化漏斗：
    // - 对话开始 → 完成问诊 → 查看推荐 → 点击购买 → 提交反馈
    // 显示关键指标（CTR、转化率、平均对话轮数等）
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">数据看板</h1>
          <Link href="/admin">
            <Button variant="ghost">← 返回</Button>
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">加载中...</p>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">转化漏斗</h2>
              <p className="text-muted-foreground">
                对话开始 → 完成问诊 → 查看推荐 → 点击购买 → 提交反馈
              </p>
              {/* TODO: 实现漏斗图表（可使用Recharts或Chart.js） */}
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">关键指标</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">对话总数</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">完成问诊率</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">平均对话轮数</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">购买链接CTR</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">反馈提交率</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
              <p>
                <strong>待实现：</strong>从Event表计算转化漏斗数据，实现图表展示（可使用Recharts或Chart.js）。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}