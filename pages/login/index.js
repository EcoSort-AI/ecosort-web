/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const body = await response.json();

      if (response.status === 201 || response.ok) {
        router.push("/admin");
      } else {
        setError(body.message || "Credenciais inválidas. Tente novamente.");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
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
                Acessar conta
              </CardTitle>
              <CardDescription className="text-gray-400">
                Insira seu e-mail abaixo para entrar no EcoSort
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

                  <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                      <label
                        htmlFor="email"
                        className="text-sm font-medium leading-none text-gray-300"
                      >
                        E-mail
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="border-[#374151] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus-visible:ring-[#16a34a]"
                      />
                    </div>

                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <label
                          htmlFor="password"
                          className="text-sm font-medium leading-none text-gray-300"
                        >
                          Senha
                        </label>
                        {/* Mantive a recuperação de senha, mas você pode remover também se preferir lidar com senhas de admin só pelo banco */}
                        <Link
                          href="#"
                          className="ml-auto inline-block text-sm underline-offset-4 text-gray-400 hover:text-[#16a34a]"
                        >
                          Esqueceu a senha?
                        </Link>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="border-[#374151] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus-visible:ring-[#16a34a]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      type="submit"
                      className="w-full bg-[#16a34a] text-white hover:bg-[#15803d]"
                      disabled={isLoading}
                    >
                      {isLoading ? "Entrando..." : "Entrar"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
