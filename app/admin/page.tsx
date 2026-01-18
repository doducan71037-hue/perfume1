import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatsCards } from "./stats-cards";

export default async function AdminPage() {
  const { error } = await requireAdmin();
  if (error) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">管理后台</h1>

        {/* 统计概览 */}
        <StatsCards />

        <div className="mt-12 space-y-4">
          <Link href="/admin/users">
            <Button variant="outline" className="w-full justify-start text-left h-auto p-4">
              <div>
                <h3 className="font-semibold text-lg">用户管理</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  查看、管理用户，设置角色和状态
                </p>
              </div>
            </Button>
          </Link>

          <Link href="/admin/perfumes">
            <Button variant="outline" className="w-full justify-start text-left h-auto p-4">
              <div>
                <h3 className="font-semibold text-lg">香水管理</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  创建、编辑、删除香水数据，管理Notes和Accords关联
                </p>
              </div>
            </Button>
          </Link>

          <Link href="/admin/dashboard">
            <Button variant="outline" className="w-full justify-start text-left h-auto p-4">
              <div>
                <h3 className="font-semibold text-lg">数据看板</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  查看转化漏斗、用户行为数据、关键指标
                </p>
              </div>
            </Button>
          </Link>

          <Link href="/admin/images">
            <Button variant="outline" className="w-full justify-start text-left h-auto p-4">
              <div>
                <h3 className="font-semibold text-lg">图片审核</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  审核自动查找的图片候选，确保图片与产品匹配
                </p>
              </div>
            </Button>
          </Link>

          <Link href="/admin/events">
            <Button variant="outline" className="w-full justify-start text-left h-auto p-4">
              <div>
                <h3 className="font-semibold text-lg">事件列表</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  查看最近的事件和埋点数据
                </p>
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
