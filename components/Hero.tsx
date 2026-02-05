import React, { FC, useEffect, useState } from "react";
import InputArea from "./ResearchBlocks/elements/InputArea";
import { motion } from "framer-motion";

type THeroProps = {
  promptValue: string;
  setPromptValue: React.Dispatch<React.SetStateAction<string>>;
  handleDisplayResult: (query: string) => void;
};

const Hero: FC<THeroProps> = ({
  promptValue,
  setPromptValue,
  handleDisplayResult,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Animation variants for consistent animations
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative overflow-visible min-h-[100vh] flex pt-[60px] sm:pt-[80px] mt-[-60px] sm:mt-[-130px] bg-gradient-to-l from-[#E3F9F2] to-[#FAFAFA]">
      <motion.div
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={fadeInUp}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center justify-start w-full py-6 pt-[12rem]"
      >
        <motion.h1
          variants={fadeInUp}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-2xl sm:text-3xl md:text-4xl font-medium text-center text-[#238580] mb-6 px-4"
        >
          <img
            src="/deep_research_show/img/home_logo.png"
            alt="home logo"
            width={156}
            height={50}
            className="w-[256px] opacity-80"
          />
        </motion.h1>
        {/* Header text */}
        <motion.h1
          variants={fadeInUp}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-2xl font-medium text-center text-[#238580] mb-6 px-4"
        >
          您想研究什么内容？
        </motion.h1>

        {/* Input section with enhanced styling */}
        <motion.div
          variants={fadeInUp}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full max-w-[800px] pb-6 sm:pb-8 md:pb-10 px-4"
        >
          <div className="relative group">
            <div className="absolute rounded-xl blur-md opacity-60 group-hover:opacity-85 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
            <div className="relative bg-white bg-opacity-20 backdrop-blur-sm rounded-xl ring-1 ring-[#238580]">
              <InputArea
                promptValue={promptValue}
                setPromptValue={setPromptValue}
                handleSubmit={handleDisplayResult}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Magical premium gradient glow at the bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="fixed bottom-0 left-0 right-0 h-[12px] z-50 overflow-hidden pointer-events-none"
      >
        <div className="relative w-full h-full">
          {/* Main perfect center glow with smooth fade at edges */}
          <div
            className="absolute inset-0"
            style={{
              opacity: 0.85,
              background: 'radial-gradient(ellipse at center, rgba(35, 133, 128, 1) 0%, rgba(35, 133, 128, 0.7) 25%, rgba(35, 133, 128, 0.2) 50%, rgba(0, 0, 0, 0) 75%)',
              boxShadow: '0 0 30px 6px rgba(35, 133, 128, 0.5), 0 0 60px 10px rgba(35, 133, 128, 0.25)'
            }}
          />

          {/* Subtle shimmer overlay with perfect center focus */}
          <div
            className="absolute inset-0"
            style={{
              animation: 'shimmer 8s ease-in-out infinite alternate',
              opacity: 0.5,
              background: 'radial-gradient(ellipse at center, rgba(35, 133, 128, 0.8) 0%, rgba(35, 133, 128, 0.2) 30%, rgba(35, 133, 128, 0) 60%)'
            }}
          />

          {/* Gentle breathing effect */}
          <div
            className="absolute inset-0"
            style={{
              opacity: 0.4,
              animation: 'breathe 7s cubic-bezier(0.4, 0.0, 0.2, 1) infinite',
              background: 'radial-gradient(circle at center, rgba(35, 133, 128, 0.6) 0%, rgba(35, 133, 128, 0) 50%)'
            }}
          />
        </div>
      </motion.div>

      {/* Custom keyframes for magical animations */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            opacity: 0.4;
            transform: scale(0.98);
          }
          50% {
            opacity: 0.6;
          }
          100% {
            opacity: 0.4;
            transform: scale(1.02);
          }
        }
        
        @keyframes breathe {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.04);
          }
        }
      `}</style>
    </div>
  );
};

export default Hero;
