import Image from "next/image";
import LogMessage from './elements/LogMessage';
import { useEffect, useRef } from 'react';

interface Log {
  header: string;
  text: string;
  metadata: any;
  key: string;
}

interface OrderedLogsProps {
  logs: Log[];
  loadingRenderer?: React.ReactNode;
}

const LogsSection = ({ logs, loadingRenderer }: OrderedLogsProps) => {
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom whenever logs change
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]); // Dependency on logs array ensures this runs when new logs are added

  return (
    <div className="w-full shrink-0 rounded-lg bg-white backdrop-blur-md shadow-lg flex-1 flex flex-col relative">
      <div className="absolute top-0 bottom-0 flex flex-col gap-2 p-5 left-0 right-0">
        <div className="flex items-start gap-4 pb-3 lg:pb-3.5 shadow-sm">
          <img src={`${process.env.NEXT_PUBLIC_USE_PATH_PREFIX === 'true' ? '/deep_research_show' : ''}/img/chat-check.png`} alt="logs" width={24} height={24} />
          <h3 className="text-base font-bold uppercase leading-[152.5%] text-[#4D4D4D]">
            深度研究
          </h3>
        </div>
        {loadingRenderer}
        <div
          ref={logsContainerRef}
          className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 custom-scrollbar scrollbar-track-gray-300/10 flex-1 w-full"
        >
          <LogMessage logs={logs} />
        </div>
      </div>
    </div>
  );
};

export default LogsSection; 