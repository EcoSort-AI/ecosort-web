import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AceitarConvite() {
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/v1/activations/${token}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const responseBody = await response.json();

      if (response.ok) {
        setMessage("Conta configurada com sucesso! Redirecionando...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(responseBody.message || "Erro ao configurar a conta.");
      }
    } catch (err) {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  if (!router.isReady) return null;

  return (
    <>
      <Head>
        <title>Aceitar Convite - EcoSort</title>
      </Head>
      <div
        className="flex w-full items-center justify-center p-6 md:p-10 text-white"
        style={{
          fontFamily: "sans-serif",
          backgroundColor: "#242424",
          minHeight: "100vh",
          paddingBottom: "50px",
        }}
      >
        <div className="w-full max-w-sm">
          <div className={cn("flex flex-col gap-6")}>
            <Card className="bg-[#1f1f1f] border-[#374151] text-white">
              <CardHeader>
                <CardTitle className="text-2xl text-[#16a34a]">
                  Bem-vindo ao EcoSort
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Crie sua senha definitiva abaixo para ativar seu acesso ao
                  painel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-6">
                    {error && (
                      <div className="text-sm font-medium text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/20">
                        {error}
                      </div>
                    )}

                    {message && (
                      <div className="text-sm font-medium text-[#16a34a] bg-[#16a34a]/10 p-3 rounded-md border border-[#16a34a]/20">
                        {message}
                      </div>
                    )}

                    <div className="flex flex-col gap-4">
                      <div className="grid gap-2">
                        <label
                          htmlFor="password"
                          className="text-sm font-medium leading-none text-gray-300"
                        >
                          Nova Senha
                        </label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading || message !== null}
                          className="border-[#374151] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus-visible:ring-[#16a34a]"
                        />
                      </div>

                      <div className="grid gap-2">
                        <label
                          htmlFor="confirmPassword"
                          className="text-sm font-medium leading-none text-gray-300"
                        >
                          Confirmar Senha
                        </label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={loading || message !== null}
                          className="border-[#374151] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus-visible:ring-[#16a34a]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button
                        type="submit"
                        disabled={loading || message !== null}
                        className="w-full bg-[#16a34a] text-white hover:bg-[#15803d]"
                      >
                        {loading ? "Salvando..." : "Salvar e Entrar"}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
