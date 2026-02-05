import React from 'react';
import ResearchPageLayout from '@/components/layouts/ResearchPageLayout';
import CopilotLayout from '@/components/layouts/CopilotLayout';
import { ChatBoxSettings } from '@/types/data';

interface LayoutProps {
  children: React.ReactNode;
  loading: boolean;
  isStopped: boolean;
  showResult: boolean;
  onStop?: () => void;
  onNewResearch?: () => void;
  chatBoxSettings: ChatBoxSettings;
  setChatBoxSettings: React.Dispatch<React.SetStateAction<ChatBoxSettings>>;
  mainContentRef?: React.RefObject<HTMLDivElement>;
  showScrollButton?: boolean;
  onScrollToBottom?: () => void;
  toastOptions?: Record<string, any>;
  toggleSidebar?: () => void;
  isProcessingChat?: boolean;
}

export const getAppropriateLayout = ({
  children,
  loading,
  isStopped,
  showResult,
  onStop,
  onNewResearch,
  chatBoxSettings,
  setChatBoxSettings,
  mainContentRef,
  showScrollButton = false,
  onScrollToBottom,
  toastOptions = {},
  toggleSidebar,
  isProcessingChat = false
}: LayoutProps) => {
  if (chatBoxSettings.layoutType === 'copilot') {
    return (
      <CopilotLayout
        loading={loading}
        isStopped={isStopped}
        showResult={showResult}
        onStop={onStop}
        onNewResearch={onNewResearch}
        chatBoxSettings={chatBoxSettings}
        setChatBoxSettings={setChatBoxSettings}
        mainContentRef={mainContentRef}
        toastOptions={toastOptions}
        toggleSidebar={toggleSidebar}
      >
        {children}
      </CopilotLayout>
    );
  }
  
  // Default to ResearchPageLayout for desktop with standard layout
  return (
    <ResearchPageLayout
      loading={loading}
      isStopped={isStopped}
      showResult={showResult}
      onStop={onStop}
      onNewResearch={onNewResearch || (() => {})}
      chatBoxSettings={chatBoxSettings}
      setChatBoxSettings={setChatBoxSettings}
      mainContentRef={mainContentRef}
      showScrollButton={showScrollButton}
      onScrollToBottom={onScrollToBottom}
      toastOptions={toastOptions}
    >
      {children}
    </ResearchPageLayout>
  );
}; 