import Link from "next/link";
import { useRouter } from "next/router";
import useSWR from "swr";
import React, { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

import {
  LayoutDashboard,
  History,
  ClipboardCheck,
  LineChart,
  Users,
  Settings,
  Home,
  UserCircle,
} from "lucide-react";

const fetcher = (url) => fetch(url).then((res) => res.json());

const items = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  {
    title: "Histórico de classificações",
    url: "/admin/history",
    icon: History,
  },
  { title: "Revisões pendentes", url: "/admin/review", icon: ClipboardCheck },
  { title: "Estatísticas", url: "/admin/analytics", icon: LineChart },
  { title: "Usuários", url: "/admin/users", icon: Users },
  { title: "Configurações", url: "/admin/settings", icon: Settings },
];

export function AppSidebar() {
  const router = useRouter();

  const { data } = useSWR(
    "/api/v1/trash-events?status=pending&hasImage=true",
    fetcher,
    {
      refreshInterval: 5000,
    },
  );

  const pendingCount = data?.total || 0;

  const previousCountRef = useRef(undefined);

  useEffect(() => {
    if (data) {
      const currentCount = data.total || 0;

      if (
        previousCountRef.current !== undefined &&
        currentCount > previousCountRef.current
      ) {
        const diff = currentCount - previousCountRef.current;
        const msg =
          diff === 1
            ? "Nova classificação pendente!"
            : `${diff} novas classificações pendentes!`;

        toast.warning(msg, {
          description: "Acesse a página de revisões para validar.",
        });
      }

      previousCountRef.current = currentCount;
    }
  }, [data]);

  return (
    <Sidebar
      className="!bg-[#242424] !border-r-[#374151] !text-white flex flex-col h-full"
      style={{ fontFamily: "sans-serif" }}
    >
      <SidebarHeader className="p-4">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#16a34a]/20">
              <Home className="h-5 w-5 text-[#16a34a]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Página Inicial
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex-1">
        <SidebarGroup>
          <SidebarGroupLabel className="!text-gray-400">
            Navegação Principal
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`hover:!bg-[#374151] hover:!text-white transition-colors ${
                      router.pathname === item.url
                        ? "!bg-[#374151] !text-white"
                        : "!text-gray-300"
                    }`}
                  >
                    <Link
                      href={item.url}
                      className="flex items-center justify-between w-full"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`h-4 w-4 ${router.pathname === item.url ? "text-white" : "text-[#16a34a]"}`}
                        />
                        <span>{item.title}</span>
                      </div>

                      {item.url === "/admin/review" && pendingCount > 0 && (
                        <span className="bg-[#ef4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center">
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-4 border-t border-[#374151]">
        <Link href="/admin/profile">
          <div
            className={`flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer ${
              router.pathname === "/admin/profile"
                ? "bg-[#374151] text-white"
                : "text-gray-400 hover:bg-[#374151] hover:text-white"
            }`}
          >
            <UserCircle className="h-6 w-6" />
            <span className="font-medium">Meu Perfil</span>
          </div>
        </Link>
      </div>
    </Sidebar>
  );
}
