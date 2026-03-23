import useSWR from "swr";

const fetcher = (url) => fetch(url).then((response) => response.json());

function Home() {
  const { data, error } = useSWR("/api/v1/trash-events", fetcher, {
    refreshInterval: 2000,
  });

  if (error)
    return <div style={{ padding: "20px" }}>Falha ao carregar os dados.</div>;

  if (!data)
    return (
      <div style={{ padding: "20px" }}>Carregando status em tempo real...</div>
    );

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        padding: "30px",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ color: "#2c3e50", fontSize: "2.5em" }}>EcoSort AI</h1>
        <h2
          style={{
            color: "#555",
            fontWeight: "normal",
            lineHeight: "1.5",
            fontSize: "1.2em",
          }}
        >
          Trabalho de conclusão de curso dos alunos do Instituto Mauá de
          Tecnologia: Lixeira inteligente com separação automática de resíduos
          com o uso de inteligência artificial.
        </h2>
      </div>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #e0e0e0",
          marginBottom: "30px",
        }}
      />
      <div>
        <h3
          style={{
            color: "#2c3e50",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "1.2em" }}></span> Monitoramento em Tempo
          Real
        </h3>
        {error && (
          <div
            style={{
              padding: "15px",
              color: "#c0392b",
              backgroundColor: "#fadbd8",
              borderRadius: "5px",
            }}
          >
            Falha ao carregar os dados das lixeiras. Verifique a conexão com o
            banco de dados.
          </div>
        )}
        {!data && !error && (
          <div style={{ padding: "15px", color: "#7f8c8d" }}>
            Aguardando conexão com a lixeira...
          </div>
        )}
        {data && data.length === 0 && (
          <div
            style={{ padding: "15px", color: "#7f8c8d", fontStyle: "italic" }}
          >
            Nenhum resíduo foi descartado ainda.
          </div>
        )}
        {data && data.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {data.map((item) => (
              <li
                key={item.id}
                style={{
                  padding: "15px",
                  border: "1px solid #e0e0e0",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    fontSize: "1.2em",
                    fontWeight: "bold",
                    color: "#2c3e50",
                    textTransform: "capitalize",
                  }}
                >
                  Resíduo Detectado: {item.item_class}
                </div>
                <div
                  style={{
                    color: "#7f8c8d",
                    marginTop: "8px",
                    lineHeight: "1.5",
                  }}
                >
                  <strong>ID da Lixeira:</strong> {item.bin_id} <br />
                  <strong>Confiança da IA:</strong>{" "}
                  {(item.confidence * 100).toFixed(1)}% <br />
                  <strong>Detectado em:</strong>{" "}
                  {new Date(item.detected_at).toLocaleString("pt-BR")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Home;
