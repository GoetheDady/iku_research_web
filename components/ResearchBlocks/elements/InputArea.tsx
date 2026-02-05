import Image from "next/image";
import React, { FC, useRef, useState, useEffect } from "react";
import TypeAnimation from "../../TypeAnimation";
import { Paperclip } from 'lucide-react'

type TInputAreaProps = {
  promptValue: string;
  setPromptValue: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (query: string) => void;
  handleSecondary?: (query: string) => void;
  disabled?: boolean;
  reset?: () => void;
  isStopped?: boolean;
  className?: string;
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

const InputArea: FC<TInputAreaProps> = ({
  promptValue,
  setPromptValue,
  handleSubmit,
  handleSecondary,
  disabled,
  reset,
  isStopped,
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [openResearch, setOpenResearch] = useState(true);
  const placeholder = "输入您想研究的主题、问题或感兴趣的领域...";

  // Auto-focus the textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

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
        if (!disabled) {
          if (reset) reset();
          handleSubmit(promptValue);
          setPromptValue('');
          resetHeight();
        }
      }
    }
  };

  if (isStopped) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <form
        className="mx-auto flex flex-col pt-2 pb-2 w-full items-center justify-between rounded-xl border border-solid border-[#238580]  px-3 relative overflow-hidden z-10"
        onSubmit={(e) => {
          e.preventDefault();
          if (reset) reset();
          handleSubmit(promptValue);
          setPromptValue('');
          resetHeight();
        }}
      >
        <textarea
          placeholder={placeholder}
          ref={textareaRef}
          className="focus-visible::outline-0 my-1 w-full pl-2 pr-3 font-light not-italic leading-[normal] 
           text-[#4D4D4D] placeholder-[#4D4D4D] outline-none focus-visible:ring-0 focus-visible:ring-offset-0 
          text-lg sm:text-xl min-h-[4em] resize-none relative z-10 bg-transparent"
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
              disabled={disabled}
              type="submit"
              className="relative flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-md bg-[#238580] hover:bg-gradient-to-br hover:from-[#238580] hover:to-[#238580] transition-all duration-300 disabled:opacity-50 disabled:hover:bg-[#238580]/75 z-10 before:absolute before:inset-0 before:rounded-md before:bg-gradient-to-r before:from-[#238580]/20 before:to-[#238580]/20 before:opacity-0 before:transition-opacity before:hover:opacity-100 before:-z-10 disabled:before:opacity-0 group"
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
    </div>
  );
};

export default InputArea;
