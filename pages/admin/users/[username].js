/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import session from "models/session.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import { toast } from "sonner";
import { translateMaterial } from "@/lib/dictionary";

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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  LogOut,
  UserCircle,
  Loader2,
  Save,
  History,
  CheckCircle2,
} from "lucide-react";

const fetcher = (url) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Falha ao carregar dados");
    return res.json();
  });

export default function DynamicProfilePage({
  targetUsername,
  targetEmail,
  isOwner,
}) {
  const router = useRouter();

  const [currentUsername] = useState(targetUsername);
  const [formUsername, setFormUsername] = useState(targetUsername);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: historyData, isLoading: isLoadingHistory } = useSWR(
    `/api/v1/trash-events?reviewer=${currentUsername}&limit=15&status=validated`,
    fetcher,
  );

  const eventsList = historyData?.events || [];

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/sessions", { method: "DELETE" });
    } finally {
      router.push("/");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isOwner) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/v1/users/${currentUsername}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formUsername }),
      });

      if (res.ok) {
        toast.success("Nome atualizado com sucesso!");
        router.push(`/admin/users/${formUsername}`);
      } else {
        const errorData = await res.json();
        toast.error(`Erro: ${errorData.message}`);
      }
    } catch (error) {
      toast.error("Erro de conexão ao salvar o perfil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#242424]">
        <header
          className="flex h-16 items-center gap-2 border-b border-[#374151] px-4 bg-[#1f1f1f] text-white"
          style={{ fontFamily: "sans-serif" }}
        >
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 hover:bg-[#374151] hover:text-white text-gray-400" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gray-300 font-medium">
                    Perfil: {currentUsername}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <button
            onClick={handleLogout}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 bg-[#242424] border border-[#374151] rounded-md hover:bg-[#374151] hover:text-white transition-colors"
          >
            <LogOut size={16} /> Sair
          </button>
        </header>

        <div
          className="min-h-screen bg-[#242424] p-8 text-white"
          style={{ fontFamily: "sans-serif" }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <UserCircle className="h-10 w-10 text-[#16a34a]" />
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  {currentUsername}
                </h2>
                <p className="text-gray-400 text-sm">
                  {isOwner ? "Seu perfil" : "Perfil de terceiro"}
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
              <Card className="bg-[#1f1f1f] border-[#374151] text-white lg:col-span-1 h-fit">
                <CardHeader>
                  <CardTitle>Informações</CardTitle>
                  <CardDescription className="text-gray-400">
                    {isOwner
                      ? "Edite seu nome de exibição."
                      : "Modo somente-leitura."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={targetEmail}
                        readOnly
                        disabled
                        className="w-full bg-[#2a2a2a] border border-[#374151] rounded-md px-3 py-2 text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">
                        Nome de Exibição
                      </label>
                      <input
                        type="text"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        readOnly={!isOwner}
                        disabled={!isOwner}
                        className={`w-full border rounded-md px-3 py-2 text-white focus:outline-none transition-colors ${
                          isOwner
                            ? "bg-[#242424] border-[#374151] focus:border-[#16a34a]"
                            : "bg-[#2a2a2a] border-[#374151] text-gray-400 cursor-not-allowed"
                        }`}
                        required
                        minLength={3}
                      />
                    </div>

                    {isOwner && (
                      <button
                        type="submit"
                        disabled={
                          isSubmitting || formUsername === currentUsername
                        }
                        className="w-full py-2 px-6 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Salvar Alterações
                      </button>
                    )}
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-[#1f1f1f] border-[#374151] text-white lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-[#16a34a]" /> Últimas
                    Validações
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Histórico recente de itens revisados por este usuário.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase bg-[#242424] border-y border-[#374151]">
                        <tr>
                          <th className="px-6 py-4">Data e Hora</th>
                          <th className="px-6 py-4">Lixeira</th>
                          <th className="px-6 py-4">Classe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingHistory && (
                          <tr>
                            <td
                              colSpan="3"
                              className="px-6 py-8 text-center text-gray-400"
                            >
                              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                              Carregando histórico...
                            </td>
                          </tr>
                        )}
                        {!isLoadingHistory && eventsList.length === 0 && (
                          <tr>
                            <td
                              colSpan="3"
                              className="px-6 py-8 text-center text-gray-400"
                            >
                              Nenhuma validação encontrada para este usuário.
                            </td>
                          </tr>
                        )}
                        {!isLoadingHistory &&
                          eventsList.map((event) => (
                            <tr
                              key={event.id}
                              className="border-b border-[#374151] hover:bg-[#2a2a2a] transition-colors"
                            >
                              <td className="px-6 py-3 text-gray-300">
                                {formatDate(event.detected_at)}
                              </td>
                              <td className="px-6 py-3 text-gray-300 font-mono text-xs">
                                {event.bin_id}
                              </td>
                              <td className="px-6 py-3">
                                <span className="bg-[#16a34a]/20 text-[#16a34a] font-bold px-2.5 py-1 rounded-full text-xs uppercase flex items-center gap-1 w-fit">
                                  <CheckCircle2 size={12} />
                                  {translateMaterial(event.item_class)}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export async function getServerSideProps(context) {
  const sessionToken = context.req.cookies.session_id;
  if (!sessionToken)
    return { redirect: { destination: "/login", permanent: false } };

  try {
    const sessionObject = await session.findOneValidByToken(sessionToken);
    const loggedInUser = await user.findOneById(sessionObject.user_id);

    if (!authorization.can(loggedInUser, "read:dashboard")) {
      return { redirect: { destination: "/", permanent: false } };
    }

    const targetUsername = context.params.username;

    let targetUser;
    try {
      targetUser = await user.findOneByUsername(targetUsername);
    } catch (e) {
      return { notFound: true };
    }

    const isOwner = loggedInUser.username === targetUser.username;

    return {
      props: {
        targetUsername: targetUser.username,
        targetEmail: isOwner ? targetUser.email : "Oculto por privacidade",
        isOwner: isOwner,
      },
    };
  } catch (error) {
    console.error(error);
    return { redirect: { destination: "/login", permanent: false } };
  }
}
