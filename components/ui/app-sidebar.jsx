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
  Trash2,
} from "lucide-react";

// Menu items do sistema EcoSort

const items = [
  {
    title: "Dashboard",

    url: "/admin",

    icon: LayoutDashboard,
  },

  {
    title: "Histórico de classificações",

    url: "#",

    icon: History,
  },

  {
    title: "Revisões pendentes",

    url: "#",

    icon: ClipboardCheck,
  },

  {
    title: "Analytics",

    url: "#",

    icon: LineChart,
  },

  {
    title: "Usuários",

    url: "#",

    icon: Users,
  },

  {
    title: "Configurações",

    url: "#",

    icon: Settings,
  },
];

export function AppSidebar() {
  return (
    <Sidebar
      className="!bg-[#242424] !border-r-[#374151] !text-white"
      style={{ fontFamily: "sans-serif" }}
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#16a34a]/20">
            <Trash2 className="h-5 w-5 text-[#16a34a]" />
          </div>

          <span className="text-lg font-bold tracking-tight text-white">
            EcoSort AI
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
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
                    className="hover:!bg-[#374151] hover:!text-white !text-gray-300 transition-colors"
                  >
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-[#16a34a]" />

                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
