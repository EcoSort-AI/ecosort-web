/* eslint-disable no-unused-vars */
import "../styles/globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function MyApp({ Component, pageProps }) {
  return (
    <TooltipProvider>
      <Component {...pageProps} />
    </TooltipProvider>
  );
}
