import Image from "next/image";
import React, { useState, useEffect } from 'react';
import { toast } from "react-hot-toast";
import { markdownToHtml } from '../../helpers/markdownHelper';
import '../../styles/markdown.css';
import { useResearchHistoryContext } from '../../hooks/ResearchHistoryContext';
import { ChatMessage } from '../../types/data';

export default function Report({ answer, researchId, accessData }: { answer: string, researchId?: string, accessData?: any }) {
  const [htmlContent, setHtmlContent] = useState('');
  const { getChatMessages } = useResearchHistoryContext();
  // Memoize this value to prevent re-renders
  const chatMessages = researchId ? getChatMessages(researchId) : [];

  useEffect(() => {
    if (answer) {
      markdownToHtml(answer).then((html) => setHtmlContent(html));
    }
  }, [answer]);

  return (
    <div className=" flex h-auto w-full shrink-0 gap-4 bg-white backdrop-blur-md shadow-lg rounded-lg p-5">
      <div className="w-full">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            {/* <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                width={20}
                height={20}
                fill="none" 
                stroke="currentColor" 
                strokeWidth={1.5} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-[#4D4D4D]"
              >
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg> */}
            <img
              src={`${process.env.NODE_ENV === 'production' ? '/deep_research_show' : ''}/img/report-logo.png`}
              alt="message"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <h3 className="text-base font-bold text-[#4D4D4D]">研究报告</h3>
          </div>
          {answer && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(answer.trim());
                  toast("报告已复制到剪贴板", {
                    icon: "✂️",
                  });
                }}
                className="hover:opacity-80 transition-opacity duration-200"
              >
                <img
                  src={`${process.env.NODE_ENV === 'production' ? '/deep_research_show' : ''}/img/copy-white.svg`}
                  alt="copy"
                  width={20}
                  height={20}
                  className="cursor-pointer text-[#4D4D4D]"
                />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap content-center items-center gap-[15px] pl-5 pr-5">
          <div className="w-full whitespace-pre-wrap text-base font-light leading-[152.5%] text-[#4D4D4D] log-message">
            {answer ? (
              <div className="markdown-content prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            ) : (
              <div className="flex w-full flex-col gap-2">
                <div className="h-6 w-full animate-pulse rounded-md bg-gray-300/20" />
                <div className="h-6 w-[85%] animate-pulse rounded-md bg-gray-300/20" />
                <div className="h-6 w-[90%] animate-pulse rounded-md bg-gray-300/20" />
                <div className="h-6 w-[70%] animate-pulse rounded-md bg-gray-300/20" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 