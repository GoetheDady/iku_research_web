import Image from "next/image";
import React, { FC, useRef, useState, useEffect } from "react";
import TypeAnimation from "../../TypeAnimation";
import { Paperclip } from 'lucide-react'

type TChatInputProps = {
  promptValue: string;
  setPromptValue: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (query: string) => void;
  disabled?: boolean;
};

// Debounce function to limit the rate at which a function can fire
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout | undefined;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const ChatInput: FC<TChatInputProps> = ({
  promptValue,
  setPromptValue,
  handleSubmit,
  disabled,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const placeholder = "关于这份报告有什么问题？";
  const [openResearch, setOpenResearch] = useState(true);

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '3em';
    }
  };

  const adjustHeight = debounce((target: HTMLTextAreaElement) => {
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  }, 100);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    adjustHeight(target);
    setPromptValue(target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        return;
      } else {
        e.preventDefault();
        if (!disabled && promptValue.trim()) {
          handleSubmit(promptValue);
          setPromptValue('');
          resetHeight();
        }
      }
    }
  };

  return (
    <div className="relative">
      {/* Gradient ring with balanced glow */}
      {/* <div 
        className={`absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#238580]/50 via-[#238580]/40 to-[#238580]/50 blur-sm opacity-40 transition-opacity duration-300 ${isFocused || promptValue ? 'opacity-60' : 'opacity-30'}`}
      /> */}

      {/* Ambient glow effect - balanced size and opacity */}
      {/* <div 
        className="absolute -inset-3 rounded-xl opacity-25"
        style={{
          background: 'radial-gradient(circle at center, rgba(#238580, 0.15) 0%, rgba(#238580, 0.08) 40%, rgba(0, 0, 0, 0) 70%)',
        }}
      /> */}

      <form
        className="mx-auto flex flex-col pt-2 pb-2 w-full items-center justify-between rounded-lg border border-solid border-[#238580] bg-white px-3 relative overflow-hidden z-10"
        onSubmit={(e) => {
          e.preventDefault();
          if (!disabled && promptValue.trim()) {
            handleSubmit(promptValue);
            setPromptValue('');
            resetHeight();
          }
        }}
      >
        {/* Inner gradient blur effect - balanced opacity */}
        {/* <div className="absolute -inset-1 bg-gradient-to-r from-[#238580]/4 via-[#238580]/4 to-[#238580]/4 blur-xl opacity-25 animate-pulse pointer-events-none"></div> */}

        <textarea
          placeholder={placeholder}
          ref={textareaRef}
          className="focus-visible::outline-0 my-1 w-full pl-5 font-light not-italic leading-[normal] 
          text-[#4D4D4D] placeholder-[#4D4D4D] outline-none focus-visible:ring-0 focus-visible:ring-offset-0 
          sm:text-base min-h-[4em] resize-none relative z-10 bg-white"
          disabled={disabled}
          value={promptValue}
          required
          rows={3}
          onKeyDown={handleKeyDown}
          onChange={handleTextareaChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />


        <div className="flex items-center justify-between w-full">
          {/* 深度研究按钮 */}
          <div className={`cursor-pointer text-sm px-3 py-1.5 rounded-full select-none flex items-center gap-1 transition-all duration-300 border border-[rgb(35,133,128,0.2)] ${openResearch ? 'bg-[rgba(35,133,128,0.2)] text-[#238580]' : 'bg-white text-[#333]'}`} onClick={() => { setOpenResearch(!openResearch) }}>
            {/* <ArrowLeftRight size={16}/> */}
            深度研究
          </div>
          <div className="flex gap-4 items-center">
            <div className="cursor-pointer text-[#4D4D4D]">
              <Paperclip />
              
            </div>
            {/* 发送按钮 */}
          <button
            disabled={disabled || !promptValue.trim()}
            type="submit"
            className="relative flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-md bg-[#238580] hover:bg-gradient-to-br hover:from-[#238580] hover:via-[#238580] hover:to-[#238580] transition-all duration-300 disabled:opacity-50 disabled:hover:bg-[#238580]/75 z-10 before:absolute before:inset-0 before:rounded-md before:bg-gradient-to-r before:from-[#238580]/15 before:to-[#238580]/15 before:opacity-0 before:transition-opacity before:hover:opacity-100 before:-z-10 disabled:before:opacity-0 group"
          >
            {disabled && (
              <div className="absolute inset-0 flex items-center justify-center">
                <TypeAnimation />
              </div>
            )}

            <div className="relative p-2 cursor-pointer overflow-hidden">
              {/* Glow effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#4D4D4D]/20 rounded-full blur-md"></div>

              <img
                src={"/deep_research_show/img/arrow-narrow-right.svg"}
                alt="search"
                width={20}
                height={20}
                className={`${disabled ? "invisible" : ""} -rotate-90 transition-all duration-300 group-hover:scale-110 group-hover:brightness-110 group-hover:filter group-hover:drop-shadow-[0_0_3px_rgba(255,255,255,0.7)]`}
              />
            </div>
          </button>
          </div>
          
        </div>

      </form>

      {/* Animated glow effect at the bottom - balanced brightness */}
      {/* <div 
        className="absolute bottom-0 left-0 right-0 h-[2.5px] opacity-35 overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(12, 219, 182, 0.5) 0%, rgba(6, 219, 238, 0.3) 25%, rgba(6, 219, 238, 0.08) 50%, rgba(0, 0, 0, 0) 75%)',
          boxShadow: '0 0 8px 1px rgba(12, 219, 182, 0.25), 0 0 15px 2px rgba(6, 219, 238, 0.08)'
        }}
      /> */}
    </div>
  );
};

export default ChatInput; 