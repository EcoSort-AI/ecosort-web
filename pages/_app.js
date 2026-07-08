// Importa o arquivo CSS global que acabamos de criar
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
