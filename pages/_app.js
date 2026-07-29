/* eslint-disable no-unused-vars */
import "../styles/globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export default function MyApp({ Component, pageProps }) {
  return (
    <TooltipProvider>
      <Component {...pageProps} />
      <Toaster theme="dark" position="top-right" richColors />
    </TooltipProvider>
  );
}
