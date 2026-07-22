/* eslint-disable no-unused-vars */
import session from "models/session.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import { useRouter } from "next/router";
import useSWR from "swr";
import React from "react";
import Link from "next/link";

import { InviteModal } from "@/components/ui/InviteModal";
import { AppSidebar } from "@/components/ui/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, UserPlus, Shield, User, Mail } from "lucide-react";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function UsersPage({ canInvite }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/sessions", { method: "DELETE" });
    } catch (error) {
      console.error("Erro ao encerrar sessão:", error);
    } finally {
      router.push("/");
    }
  };

  const { data: apiData, error } = useSWR("/api/v1/users", fetcher);

  const usersList = Array.isArray(apiData)
    ? apiData
    : apiData?.users || apiData?.data || [];

  const isLoading = !apiData && !error;

  const getRoleInfo = (features = []) => {
    if (features.includes("create:user") || features.includes("admin")) {
      return { label: "Administrador", icon: Shield, color: "text-[#16a34a]" };
    }
    return { label: "Colaborador", icon: User, color: "text-gray-400" };
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#242424]">
        <header
          className="flex h-16 shrink-0 items-center justify-between border-b border-[#374151] px-4 bg-[#1f1f1f] text-white w-full"
          style={{ fontFamily: "sans-serif" }}
        >
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 hover:bg-[#374151] hover:text-white text-gray-400" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gray-300 font-medium">
                    Gestão de Usuários
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <button
            onClick={handleLogout}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 bg-[#242424] border border-[#374151] rounded-md hover:bg-[#374151] hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </header>

        <div
          style={{ fontFamily: "sans-serif" }}
          className="min-h-screen bg-[#242424] p-8 text-white"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#16a34a]">
                Usuários do Sistema
              </h2>
              <p className="text-gray-400 mt-1 text-sm">
                Gerencie as permissões e acessos da plataforma EcoSort.
              </p>
            </div>

            {canInvite && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-[#16a34a] hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer"
              >
                <UserPlus size={18} />
                Convidar Colaborador
              </button>
            )}
          </div>

          <Card className="bg-[#1f1f1f] border-[#374151] text-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase bg-[#242424] border-b border-[#374151]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Usuário</th>
                    <th className="px-6 py-4 font-medium">Função</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        Carregando usuários...
                      </td>
                    </tr>
                  )}

                  {error && (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-8 text-center text-[#ef4444]"
                      >
                        Erro ao carregar lista de usuários.
                      </td>
                    </tr>
                  )}

                  {!isLoading && !error && usersList.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    !error &&
                    usersList.map((u) => {
                      const role = getRoleInfo(u.features);
                      const RoleIcon = role.icon;

                      return (
                        <tr
                          key={u.id}
                          className="border-b border-[#374151] hover:bg-[#2a2a2a] transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#374151] flex items-center justify-center font-bold text-gray-300">
                                {u.username
                                  ? u.username.charAt(0).toUpperCase()
                                  : "U"}
                              </div>
                              <div>
                                <p className="font-semibold text-white">
                                  {u.username}
                                </p>
                                <div className="flex items-center text-xs text-gray-400 mt-0.5">
                                  <Mail size={12} className="mr-1" />
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className={`flex items-center font-medium ${role.color}`}
                            >
                              <RoleIcon size={16} className="mr-2" />
                              {role.label}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {u.status === "active" ? (
                              <span className="bg-[#16a34a]/20 text-[#16a34a] text-xs font-bold px-2.5 py-1 rounded-full">
                                Ativo
                              </span>
                            ) : (
                              <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-full border border-yellow-500/30">
                                Pendente
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Conditional invite Modal render */}
        <InviteModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

export async function getServerSideProps(context) {
  const sessionToken = context.req.cookies.session_id;

  if (!sessionToken) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  try {
    const sessionObject = await session.findOneValidByToken(sessionToken);
    const userObject = await user.findOneById(sessionObject.user_id);

    if (!authorization.can(userObject, "read:dashboard")) {
      return { redirect: { destination: "/", permanent: false } };
    }

    const userFeatures = userObject.features || [];
    const canInvite =
      userFeatures.includes("create:user") || userFeatures.includes("admin");

    return {
      props: {
        canInvite,
      },
    };
  } catch (error) {
    console.error("Erro no getServerSideProps de Usuários:", error);
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }
}
