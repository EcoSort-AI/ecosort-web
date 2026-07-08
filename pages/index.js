/* eslint-disable no-unused-vars */
import useSWR from "swr";
import { motion } from "framer-motion";
import Head from "next/head";
import Image from "next/image";

const fetcher = (url) => fetch(url).then((response) => response.json());

function Home() {
  const { data, error } = useSWR("/api/v1/trash-events", fetcher, {
    refreshInterval: 2000,
  });

  const totalItems = data ? data.total : 0;

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        backgroundColor: "#242424",
        minHeight: "100vh",
        paddingBottom: "50px",
      }}
    >
      <Head>
        <title>EcoSort - A Lixeira Inteligente</title>
        <style>{`
          body {
            margin: 0;
            padding: 0;
            background-color: #242424;
          }
        `}</style>
      </Head>

      {/* Cabeçalho */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
        }}
      >
        <h1
          style={{
            color: "#16a34a",
            fontSize: "1.5em",
            margin: 0,
            fontWeight: "bold",
          }}
        >
          EcoSort AI
        </h1>
        <a
          href="#"
          style={{
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Sobre o Projeto
        </a>
      </header>

      <main
        style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 20px" }}
      >
        {/* Secção Superior */}
        <section
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "40px",
            marginBottom: "60px",
          }}
        >
          <div style={{ flex: "1 1 500px" }}>
            <h2
              style={{
                fontSize: "3em",
                color: "#ffffff",
                margin: "0 0 20px 0",
                lineHeight: "1.2",
                fontWeight: "bold",
              }}
            >
              Lixeira inteligente com <br />
              <span style={{ color: "#16a34a" }}>separação automática.</span>
            </h2>
            <p
              style={{
                fontSize: "1.1em",
                color: "#d1d5db",
                lineHeight: "1.6",
                marginBottom: "30px",
                maxWidth: "440px",
              }}
            >
              Utilizando Inteligência Artificial e Visão Computacional para
              classificar os resíduos em tempo real.
            </p>
            <button
              style={{
                backgroundColor: "#16a34a",
                color: "#fff",
                border: "none",
                padding: "15px 30px",
                fontSize: "1em",
                borderRadius: "30px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Conhecer o EcoSort
            </button>
          </div>

          <div
            style={{
              flex: "1 1 400px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Image
              src="/Imagem1.png"
              alt="Lixeira Inteligente EcoSort"
              width={380}
              height={450}
              priority
              style={{
                width: "100%",
                maxWidth: "380px",
                height: "auto",
                display: "block",
              }}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
