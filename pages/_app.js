/* eslint-disable no-unused-vars */
import Head from "next/head";
import "../styles/globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>EcoSort AI</title>
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>
      <TooltipProvider>
        <Component {...pageProps} />
        <Toaster theme="dark" position="top-right" richColors />
      </TooltipProvider>
    </>
  );
}
