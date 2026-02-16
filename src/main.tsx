import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 1400);
    const completeTimer = setTimeout(() => onComplete(), 1900);
    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <img
        src="/splash-logo.svg"
        alt="Denied"
        className="w-72 md:w-96 lg:w-[460px] h-auto animate-splash-glow"
      />
    </div>
  );
};

const Root = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <App />
    </>
  );
};

createRoot(document.getElementById("root")!).render(<Root />);
