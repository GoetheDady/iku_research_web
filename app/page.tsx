"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWebSocket } from '@/hooks/useWebSocket';
import { useResearchHistoryContext } from '@/hooks/ResearchHistoryContext';
import { useScrollHandler } from '@/hooks/useScrollHandler';
import { startLanggraphResearch } from '../components/Langgraph/Langgraph';
import findDifferences from '../helpers/findDifferences';
import { Data, ChatBoxSettings, QuestionData, ChatMessage, ChatData } from '../types/data';
import { preprocessOrderedData } from '../utils/dataProcessing';
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from 'uuid';

import Hero from "@/components/Hero";
import ResearchPageLayout from "@/components/layouts/ResearchPageLayout";
import CopilotLayout from "@/components/layouts/CopilotLayout";
import ResearchContent from "@/components/research/ResearchContent";
import CopilotResearchContent from "@/components/research/CopilotResearchContent";
import HumanFeedback from "@/components/HumanFeedback";
import ResearchSidebar from "@/components/ResearchSidebar";
import { getAppropriateLayout } from "@/utils/getLayout";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [promptValue, setPromptValue] = useState("");
  const hasAutoTriggered = useRef(false); // 防止重复触发
  const [pendingQuery, setPendingQuery] = useState<string | null>(null); // 待处理的 URL 查询参数
  const [isComponentReady, setIsComponentReady] = useState(false); // 组件是否准备好
  const [chatPromptValue, setChatPromptValue] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInChatMode, setIsInChatMode] = useState(false);
  const [chatBoxSettings, setChatBoxSettings] = useState<ChatBoxSettings>(() => {
    // Default settings
    const defaultSettings = {
      // report_type set to 'multi_agents' as per requirements
      report_type: "multi_agents",
      // report_source set to 'local' as per requirements
      report_source: "local",
      tone: "Objective",
      domains: [],
      defaultReportType: "research_report",
      layoutType: 'copilot',
      mcp_enabled: false,
      mcp_configs: [],
      mcp_strategy: "fast",
    };

    // Try to load all settings from localStorage - DISABLED as per requirements
    /*
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('chatBoxSettings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          return {
            ...defaultSettings,
            ...parsedSettings, // Override defaults with saved settings
          };
        } catch (e) {
          console.error('Error parsing saved settings:', e);
        }
      }
    }
    */
    return defaultSettings;
  });
  const [question, setQuestion] = useState("");
  const [orderedData, setOrderedData] = useState<Data[]>([]);
  const [showHumanFeedback, setShowHumanFeedback] = useState(false);
  const [questionForHuman, setQuestionForHuman] = useState<true | false>(false);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [isStopped, setIsStopped] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentResearchId, setCurrentResearchId] = useState<string | null>(null);
  const [isProcessingChat, setIsProcessingChat] = useState(false);

  // Use our custom scroll handler
  const { showScrollButton, scrollToBottom } = useScrollHandler(mainContentRef);

  const { 
    history, 
    saveResearch, 
    updateResearch,
    getResearchById, 
    deleteResearch,
    addChatMessage,
    getChatMessages
  } = useResearchHistoryContext();

  // Only initialize the WebSocket hook reference, don't connect automatically
  const websocketRef = useRef(useWebSocket(
    setOrderedData,
    setAnswer,
    setLoading,
    setShowHumanFeedback,
    setQuestionForHuman
  ));
  
  // Use the reference to access websocket functions
  const { socket, initializeWebSocket } = websocketRef.current;

  const handleFeedbackSubmit = (feedback: string | null) => {
    if (socket) {
      socket.send(JSON.stringify({ type: 'human_feedback', content: feedback }));
    }
    setShowHumanFeedback(false);
  };

  const handleChat = async (message: string) => {
    setShowResult(true);
    setIsProcessingChat(true);
    setChatPromptValue("");
    
    // Create a user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    
    // Add question to display in research results immediately
    const questionData: QuestionData = { type: 'question', content: message };
    setOrderedData(prevOrder => [...prevOrder, questionData]);
    
    // Add user message to history asynchronously
    if (currentResearchId) {
      addChatMessage(currentResearchId, userMessage).catch(error => {
        console.error('Error adding chat message to history:', error);
      });
    }
    
    try {
      // Fetch all chat messages for this research
      let chatMessages: { role: string; content: string }[] = [];
      
      if (currentResearchId) {
        // If we have a research ID, get all messages from history
        chatMessages = getChatMessages(currentResearchId);
      }
      
      // Format messages to ensure they only contain role and content properties
      const formattedMessages = [...chatMessages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Call the chat API
      const response = await fetch(`/deep_research_show/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: answer || "",
          messages: formattedMessages
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get chat response: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.response) {
        // Check if response contains valid content
        if (!data.response.content) {
          console.error('Response content is null or empty');
          // Show error message in results
          setOrderedData(prevOrder => [...prevOrder, {
            type: 'chat',
            content: '抱歉，我无法生成正确的回复。请重新尝试您的问题。'
          }]);
        } else {
          // Add AI response to chat history asynchronously
          if (currentResearchId) {
            addChatMessage(currentResearchId, data.response).catch(error => {
              console.error('Error adding AI response to history:', error);
            });
          }

          // Add response to display in research results
          setOrderedData(prevOrder => {
            return [...prevOrder, {
              type: 'chat',
              content: data.response.content,
              metadata: data.response.metadata
            }];
          });
        }

        // Explicitly enable chat mode after getting a response
        if (!isInChatMode) {
          setIsInChatMode(true);
        }
      } else {
        // Show error message
        setOrderedData(prevOrder => [...prevOrder, {
          type: 'chat',
          content: '抱歉，出现了问题。请重试。'
        }]);
      }
    } catch (error) {
      console.error('Error during chat:', error);

      // Add error message to display
      setOrderedData(prevOrder => [...prevOrder, {
        type: 'chat',
        content: '抱歉，处理您的请求时出错。请重试。'
      }]);
    } finally {
      setLoading(false);
      setIsProcessingChat(false);
    }
  };

  const handleDisplayResult = async (newQuestion: string, fileIds?: string[], taskId?: string) => {
    // Exit chat mode when starting a new research
    setIsInChatMode(false);
    setShowResult(true);
    setLoading(true);
    setQuestion(newQuestion);
    setPromptValue("");
    setAnswer("");
    setCurrentResearchId(null); // Reset current research ID for new research
    setOrderedData((prevOrder) => [...prevOrder, { type: 'question', content: newQuestion }]);

    const storedConfig = localStorage.getItem('apiVariables');
    const apiVariables = storedConfig ? JSON.parse(storedConfig) : {};
    const langgraphHostUrl = apiVariables.LANGGRAPH_HOST_URL;

    // Starting new research - tracking for redirection once complete
    const newResearchStarted = Date.now().toString();
    // We'll use this as a temporary ID to keep track of this research
    const tempResearchId = `temp-${newResearchStarted}`;

    if (chatBoxSettings.report_type === 'multi_agents' && langgraphHostUrl) {
      let { streamResponse, host, thread_id } = await startLanggraphResearch(newQuestion, chatBoxSettings.report_source, langgraphHostUrl);
      const langsmithGuiLink = `https://smith.langchain.com/studio/thread/${thread_id}?baseUrl=${host}`;
      setOrderedData((prevOrder) => [...prevOrder, { type: 'langgraphButton', link: langsmithGuiLink }]);

      let previousChunk = null;
      for await (const chunk of streamResponse) {
        if (chunk.data.report != null && chunk.data.report != "Full report content here") {
          setOrderedData((prevOrder) => [...prevOrder, { ...chunk.data, output: chunk.data.report, type: 'report' }]);
          setLoading(false);
        
          // Save research and navigate to its unique URL once it's complete
          setAnswer(chunk.data.report);
        } else if (previousChunk) {
          const differences = findDifferences(previousChunk, chunk);
          setOrderedData((prevOrder) => [...prevOrder, { type: 'differences', content: 'differences', output: JSON.stringify(differences) }]);
        }
        previousChunk = chunk;
      }
    } else {
      initializeWebSocket(newQuestion, chatBoxSettings, fileIds, taskId);
    }
  };

  const reset = () => {
    // Reset UI states
    setShowResult(false);
    setPromptValue("");
    setIsStopped(false);
    setIsInChatMode(false);
    setCurrentResearchId(null); // Reset research ID
    setIsProcessingChat(false);
    
    // Clear previous research data
    setQuestion("");
    setAnswer("");
    setOrderedData([]);
    setAllLogs([]);

    // Reset feedback states
    setShowHumanFeedback(false);
    setQuestionForHuman(false);
    
    // Clean up connections
    if (socket) {
      socket.close();
    }
    setLoading(false);
  };

  const handleClickSuggestion = (value: string) => {
    setPromptValue(value);
    const element = document.getElementById('input-area');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * Handles stopping the current research
   * - Closes WebSocket connection
   * - Stops loading state
   * - Marks research as stopped
   * - Preserves current results
   * - Reloads the page to fully reset the connection
   */
  const handleStopResearch = () => {
    if (socket) {
      socket.close();
    }
    setLoading(false);
    setIsStopped(true);
    
    // Reload the page to completely reset the socket connection
    window.location.reload();
  };

  /**
   * Handles starting a new research
   * - Clears all previous research data and states
   * - Resets UI to initial state
   * - Closes any existing WebSocket connections
   */
  const handleStartNewResearch = () => {
    reset();
    setSidebarOpen(false);
  };

  const handleCopyUrl = () => {
    if (!currentResearchId) return;

    const url = `${window.location.origin}/research/${currentResearchId}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        toast.success("URL 已复制到剪贴板！");
      })
      .catch(() => {
        toast.error("复制 URL 失败");
      });
  };

  // Add a ref to track if an update is in progress to prevent infinite loops
  const isUpdatingRef = useRef(false);

  // Save or update research in history based on mode
  useEffect(() => {
    // Define an async function inside the effect
    const saveOrUpdateResearch = async () => {
      // Prevent infinite loops by checking if we're already updating
      if (isUpdatingRef.current) return;
      
      if (showResult && !loading && answer && question && orderedData.length > 0) {
        if (isInChatMode && currentResearchId) {
          // Prevent redundant updates by checking if data has changed
          try {
            const currentResearch = await getResearchById(currentResearchId);
            if (currentResearch && (currentResearch.answer !== answer || JSON.stringify(currentResearch.orderedData) !== JSON.stringify(orderedData))) {
              isUpdatingRef.current = true;
              await updateResearch(currentResearchId, answer, orderedData);
              // Reset the flag after a short delay to allow state updates to complete
              setTimeout(() => {
                isUpdatingRef.current = false;
              }, 100);
            }
          } catch (error) {
            console.error('Error updating research:', error);
            isUpdatingRef.current = false;
          }
        } else if (!isInChatMode) {
          // Check if this is a new research (not loaded from history)
          const isNewResearch = !history.some(item => 
            item.question === question && item.answer === answer
          );
          
          if (isNewResearch) {
            isUpdatingRef.current = true;
            try {
              const newId = await saveResearch(question, answer, orderedData);
              setCurrentResearchId(newId);
              
              // Don't navigate to the research page URL anymore
              // Just save the ID for sharing purposes
              
            } catch (error) {
              console.error('Error saving research:', error);
            } finally {
              // Reset the flag after a short delay to allow state updates to complete
              setTimeout(() => {
                isUpdatingRef.current = false;
              }, 100);
            }
          }
        }
      }
    };
    
    // Call the async function
    saveOrUpdateResearch();
  }, [showResult, loading, answer, question, orderedData, history, saveResearch, updateResearch, isInChatMode, currentResearchId, getResearchById]);

  // Handle selecting a research from history
  const handleSelectResearch = async (id: string) => {
    try {
      const research = await getResearchById(id);
      if (research) {
        // Navigate to the research page instead of loading it here
        router.push(`/research/${id}`);
      }
    } catch (error) {
      console.error('Error selecting research:', error);
      toast.error('无法加载所选研究');
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  /**
   * Processes ordered data into logs for display
   * Updates whenever orderedData changes
   */
  useEffect(() => {
    const groupedData = preprocessOrderedData(orderedData);
    const statusReports = ["agent_generated", "starting_research", "planning_research", "error"];
    
    const newLogs = groupedData.reduce((acc: any[], data) => {
      // Process accordion blocks (grouped data)
      if (data.type === 'accordionBlock') {
        const logs = data.items.map((item: any, subIndex: any) => ({
          header: item.content,
          text: item.output,
          metadata: item.metadata,
          key: `${item.type}-${item.content}-${subIndex}`,
        }));
        return [...acc, ...logs];
      } 
      // Process status reports
      else if (statusReports.includes(data.content)) {
        return [...acc, {
          header: data.content,
          text: data.output,
          metadata: data.metadata,
          key: `${data.type}-${data.content}`,
        }];
      }
      return acc;
    }, []);
    
    setAllLogs(newLogs);
  }, [orderedData]);

  // Save chatBoxSettings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('chatBoxSettings', JSON.stringify(chatBoxSettings));
  }, [chatBoxSettings]);

  // Set chat mode when a report is complete
  useEffect(() => {
    if (showResult && !loading && answer && !isInChatMode) {
      setIsInChatMode(true);
    }
  }, [showResult, loading, answer, isInChatMode]);

  // 步骤1: 检测 URL 参数并存储待处理的查询
  // 使用方式: /?query=你的研究问题
  // 如果没有 query 参数或参数为空，则不触发，等待用户手动输入
  useEffect(() => {
    if (hasAutoTriggered.current) return;
    
    const queryParam = searchParams.get('query');
    // 解码并去除首尾空格
    const decodedQuery = queryParam ? decodeURIComponent(queryParam).trim() : '';
    
    if (decodedQuery) {
      // 存储待处理的查询
      setPendingQuery(decodedQuery);
      // 设置问题到输入框（让用户看到问题）
      setPromptValue(decodedQuery);
    }
  }, [searchParams]);

  // 步骤2: 当组件准备好且有待处理的查询时，自动触发研究
  useEffect(() => {
    if (!isComponentReady || !pendingQuery || hasAutoTriggered.current || loading || showResult) {
      return;
    }
    
    // 标记已触发，防止重复
    hasAutoTriggered.current = true;
    
    // 清除待处理的查询
    const queryToProcess = pendingQuery;
    setPendingQuery(null);
    
    // 触发研究
    console.log('Auto-triggering research for:', queryToProcess);
    handleDisplayResult(queryToProcess);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComponentReady, pendingQuery, loading, showResult]);

  return (
    <>
      {!showResult ? (
        // Desktop view - home page
        getAppropriateLayout({
          loading,
          isStopped,
          showResult,
          onStop: handleStopResearch,
          onNewResearch: handleStartNewResearch,
          chatBoxSettings,
          setChatBoxSettings,
          mainContentRef,
          showScrollButton,
          onScrollToBottom: scrollToBottom,
          children: (
            <>
              <ResearchSidebar
                history={history}
                onSelectResearch={handleSelectResearch}
                onNewResearch={handleStartNewResearch}
                onDeleteResearch={deleteResearch}
                isOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
              />
              
              <Hero
                promptValue={promptValue}
                setPromptValue={setPromptValue}
                handleDisplayResult={handleDisplayResult}
              />
            </>
          )
        })
      ) : (
        // Desktop view - research results
        getAppropriateLayout({
          loading,
          isStopped,
          showResult,
          onStop: handleStopResearch,
          onNewResearch: handleStartNewResearch,
          chatBoxSettings,
          setChatBoxSettings,
          mainContentRef,
          children: (
            <div className="relative">
              <ResearchSidebar
                history={history}
                onSelectResearch={handleSelectResearch}
                onNewResearch={handleStartNewResearch}
                onDeleteResearch={deleteResearch}
                isOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
              />
              
              {chatBoxSettings.layoutType === 'copilot' ? (
                <CopilotResearchContent
                  orderedData={orderedData}
                  answer={answer}
                  allLogs={allLogs}
                  chatBoxSettings={chatBoxSettings}
                  loading={loading}
                  isStopped={isStopped}
                  promptValue={promptValue}
                  chatPromptValue={chatPromptValue}
                  setPromptValue={setPromptValue}
                  setChatPromptValue={setChatPromptValue}
                  handleDisplayResult={handleDisplayResult}
                  handleChat={handleChat}
                  handleClickSuggestion={handleClickSuggestion}
                  currentResearchId={currentResearchId || undefined}
                  onShareClick={currentResearchId ? handleCopyUrl : undefined}
                  reset={reset}
                  isProcessingChat={isProcessingChat}
                  onNewResearch={handleStartNewResearch}
                  toggleSidebar={toggleSidebar}
                />
              ) : (
                <ResearchContent
                  showResult={showResult}
                  orderedData={orderedData}
                  answer={answer}
                  allLogs={allLogs}
                  chatBoxSettings={chatBoxSettings}
                  loading={loading}
                  isInChatMode={isInChatMode}
                  isStopped={isStopped}
                  promptValue={promptValue}
                  chatPromptValue={chatPromptValue}
                  setPromptValue={setPromptValue}
                  setChatPromptValue={setChatPromptValue}
                  handleDisplayResult={handleDisplayResult}
                  handleChat={handleChat}
                  handleClickSuggestion={handleClickSuggestion}
                  currentResearchId={currentResearchId || undefined}
                  onShareClick={currentResearchId ? handleCopyUrl : undefined}
                  reset={reset}
                  isProcessingChat={isProcessingChat}
                />
              )}
              
              {showHumanFeedback && false && (
                <HumanFeedback
                  questionForHuman={questionForHuman}
                  websocket={socket}
                  onFeedbackSubmit={handleFeedbackSubmit}
                />
              )}
            </div>
          )
        })
      )}
    </>
  );
}

// Wrap with Suspense to handle useSearchParams
export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}