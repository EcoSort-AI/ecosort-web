/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SetNewPasswordPage() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      return setMessage({ type: "error", text: "As senhas não coincidem." });
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/recovery/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const body = await response.json();
      if (response.ok) {
        setMessage({
          type: "success",
          text: "Senha alterada! Redirecionando...",
        });
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setMessage({
          type: "error",
          text: body.message || "Erro ao recuperar senha.",
        });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  }

  if (!router.isReady) return null;

  return (
    <>
      <Head>
        <title>Nova Senha - EcoSort</title>
      </Head>
      <div
        className="relative flex w-full items-center justify-center p-6 md:p-10 text-white"
        style={{
          fontFamily: "sans-serif",
          backgroundColor: "#242424",
          minHeight: "100vh",
          paddingBottom: "50px",
        }}
      >
        <Card className="w-full max-w-sm bg-[#1f1f1f] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-2xl text-[#16a34a]">
              Criar nova senha
            </CardTitle>
            <CardDescription className="text-gray-400">
              Digite sua nova senha abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {message && (
                <div
                  className={`text-sm p-3 rounded-md border ${message.type === "error" ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-[#16a34a] bg-[#16a34a]/10 border-[#16a34a]/20"}`}
                >
                  {message.text}
                </div>
              )}
              <div className="grid gap-2">
                <label className="text-sm text-gray-300">Nova Senha</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border-[#374151] bg-[#2a2a2a] text-white focus-visible:ring-[#16a34a]"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm text-gray-300">Confirmar Senha</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border-[#374151] bg-[#2a2a2a] text-white focus-visible:ring-[#16a34a]"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#16a34a] hover:bg-[#15803d]"
              >
                {loading ? "Salvando..." : "Redefinir Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
