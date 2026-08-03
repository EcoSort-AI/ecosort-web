/* eslint-disable no-unused-vars */
import session from "models/session.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import { useRouter } from "next/router";
import React from "react";
import { LogOut, Settings } from "lucide-react";

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
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/sessions", {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Erro ao encerrar sessão:", error);
    } finally {
      router.push("/");
    }
  };

  const config = {
    threshold: 100,
    modelVersion: "v0.9.0-beta - Modelo de Classificação de Objetos",
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#242424]">
        <header
          className="flex h-16 shrink-0 items-center gap-2 border-b border-[#374151] px-4 bg-[#1f1f1f] text-white"
          style={{ fontFamily: "sans-serif" }}
        >
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 hover:bg-[#374151] hover:text-white text-gray-400" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gray-300 font-medium flex items-center gap-2">
                    Configurações
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Logout Button */}
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
            <h2 className="text-3xl font-bold tracking-tight text-[#16a34a]">
              Configurações do Sistema
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card className="bg-[#1f1f1f] border-[#374151] text-white">
              <CardHeader className="border-b border-[#374151] pb-4 mb-4">
                <CardTitle className="text-lg font-medium text-gray-200">
                  Parâmetros de IA e Hardware
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  Valores atuais operando na Raspberry Pi.
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Threshold */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 leading-none">
                    Limiar de Confiança (Threshold %)
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Classificações com certeza abaixo deste valor são enviadas
                    para revisão.
                  </p>
                  <Input
                    type="number"
                    value={config.threshold}
                    disabled
                    className="max-w-md bg-[#242424] border-[#374151] text-gray-400 cursor-not-allowed"
                  />
                </div>

                {/* Model Version */}
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium text-gray-300 leading-none">
                    Versão do Modelo em Produção
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    A versão do modelo de visão computacional atualmente
                    embarcado no contêiner.
                  </p>
                  <Input
                    type="text"
                    value={config.modelVersion}
                    disabled
                    className="max-w-md bg-[#242424] border-[#374151] text-gray-400 cursor-not-allowed"
                  />
                </div>
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

  if (!sessionToken) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  try {
    const sessionObject = await session.findOneValidByToken(sessionToken);
    const userObject = await user.findOneById(sessionObject.user_id);

    if (!authorization.can(userObject, "read:dashboard")) {
      return {
        redirect: { destination: "/", permanent: false },
      };
    }

    return {
      props: {},
    };
  } catch (error) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }
}
