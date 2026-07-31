/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import session from "models/session.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import { toast } from "sonner";

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
import { LogOut, UserCircle, Loader2, Save } from "lucide-react";

const fetcher = (url) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Falha ao carregar dados");
    return res.json();
  });

export default function ProfilePage({ initialUsername, initialEmail }) {
  const router = useRouter();

  const [currentUsername, setCurrentUsername] = useState(initialUsername);
  const [formUsername, setFormUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: profileData, mutate } = useSWR(
    currentUsername ? `/api/v1/users/${currentUsername}` : null,
    fetcher,
  );

  useEffect(() => {
    if (profileData?.username) {
      setFormUsername(profileData.username);
    }
  }, [profileData]);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/sessions", { method: "DELETE" });
    } finally {
      router.push("/");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/v1/users/${currentUsername}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formUsername }),
      });

      if (res.ok) {
        toast.success("Nome atualizado com sucesso!");
        setCurrentUsername(formUsername);
        mutate();
      } else {
        const errorData = await res.json();
        toast.error(`Erro: ${errorData.message}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro de conexão ao salvar o perfil.");
    } finally {
      setIsSubmitting(false);
    }
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
                    Meu Perfil
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
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <UserCircle className="h-10 w-10 text-[#16a34a]" />
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Configurações da Conta
              </h2>
            </div>

            <Card className="bg-[#1f1f1f] border-[#374151] text-white">
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription className="text-gray-400">
                  Atualize seu nome de exibição. Ele aparecerá no histórico de
                  imagens que você validar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!profileData ? (
                  <div className="flex items-center text-gray-400 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                  </div>
                ) : (
                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={initialEmail || ""}
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
                        className="w-full bg-[#242424] border border-[#374151] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#16a34a] transition-colors"
                        required
                        minLength={3}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={
                        isSubmitting || formUsername === profileData.username
                      }
                      className="w-full md:w-auto py-2 px-6 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Salvar Alterações
                    </button>
                  </form>
                )}
              </CardContent>
            </Card>
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
    const userObject = await user.findOneById(sessionObject.user_id);

    if (!authorization.can(userObject, "read:dashboard")) {
      return { redirect: { destination: "/", permanent: false } };
    }

    return {
      props: {
        initialUsername: userObject.username,
        initialEmail: userObject.email,
      },
    };
  } catch (error) {
    console.error(error);
    return { redirect: { destination: "/login", permanent: false } };
  }
}
