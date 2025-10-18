import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { config } from './config/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

import Index from "./pages/Index";
import Leaderboard from "./pages/Leaderboard";
import PuzzleDetail from "./pages/PuzzleDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: 'hsl(180, 100%, 50%)',
            accentColorForeground: 'hsl(240, 10%, 3.9%)',
            borderRadius: 'small',
          })}
        >
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/puzzle/:id" element={<PuzzleDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </BrowserRouter>
);

export default App;
