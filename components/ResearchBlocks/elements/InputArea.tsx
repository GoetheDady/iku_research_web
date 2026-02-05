import Image from "next/image";
import React, { FC, useRef, useState } from "react";
import TypeAnimation from "../../TypeAnimation";
import { Paperclip, X } from 'lucide-react';
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from 'uuid';
import { getHost } from '@/helpers/getHost';

type TInputAreaProps = {
  promptValue: string;
  setPromptValue: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (query: string, fileIds?: string[], taskId?: string) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openResearch, setOpenResearch] = useState(true);
  const placeholder = "输入您想研究的主题、问题或感兴趣的领域...";
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; id: string; uploading?: boolean }[]>([]);
  const [taskId] = useState(() => uuidv4());
  const [isUploading, setIsUploading] = useState(false);

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
          // 检查是否有文件正在上传
          const hasUploadingFiles = uploadedFiles.some(f => f.uploading);
          if (hasUploadingFiles) {
            toast.error('请等待文件上传完成');
            return;
          }
          
          if (reset) reset();
          // 只提交已上传完成的文件
          const fileIds = uploadedFiles.filter(f => !f.uploading).map(f => f.id);
          handleSubmit(promptValue, fileIds, taskId);
          setPromptValue('');
          setUploadedFiles([]);
          resetHeight();
        }
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    // 立即显示文件（带 loading 状态）
    const tempFiles = Array.from(files).map((file) => ({
      name: file.name,
      id: `temp-${Date.now()}-${Math.random()}`, // 临时 ID
      uploading: true
    }));
    setUploadedFiles(prev => [...prev, ...tempFiles]);

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      // 使用 getHost() 函数获取 API 地址，优先级：localStorage > 环境变量 > 默认值
      const host = getHost();
      
      const response = await fetch(`${host}/api/files/upload/task/${taskId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('文件上传失败');
      }

      const result = await response.json();
      
      // 更新文件状态：移除 loading，添加真实的 file_id
      setUploadedFiles(prev => {
        const updatedFiles = [...prev];
        tempFiles.forEach((tempFile, index) => {
          const fileIndex = updatedFiles.findIndex(f => f.id === tempFile.id);
          if (fileIndex !== -1) {
            updatedFiles[fileIndex] = {
              name: tempFile.name,
              id: result.file_ids[index],
              uploading: false
            };
          }
        });
        return updatedFiles;
      });
      
      toast.success(`成功上传 ${files.length} 个文件`);
    } catch (error) {
      console.error('文件上传错误:', error);
      toast.error('文件上传失败');
      
      // 上传失败，移除这些临时文件
      setUploadedFiles(prev => prev.filter(f => !tempFiles.find(tf => tf.id === f.id)));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    
    // 如果文件正在上传中，不允许删除
    if (file?.uploading) {
      toast.error('文件正在上传中，请稍候');
      return;
    }

    try {
      // 使用 getHost() 函数获取 API 地址
      const host = getHost();
      
      const response = await fetch(`${host}/api/files/upload/task/${taskId}/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('文件删除失败');
      }

      // 从列表中移除文件
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('文件已删除');
    } catch (error) {
      console.error('文件删除错误:', error);
      toast.error('文件删除失败');
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
          
          // 检查是否有文件正在上传
          const hasUploadingFiles = uploadedFiles.some(f => f.uploading);
          if (hasUploadingFiles) {
            toast.error('请等待文件上传完成');
            return;
          }
          
          if (reset) reset();
          // 只提交已上传完成的文件
          const fileIds = uploadedFiles.filter(f => !f.uploading).map(f => f.id);
          handleSubmit(promptValue, fileIds, taskId);
          setPromptValue('');
          setUploadedFiles([]);
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
        />
        
        {/* 已上传文件列表 */}
        {uploadedFiles.length > 0 && (
          <div className="w-full flex flex-wrap gap-2 mb-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                  file.uploading 
                    ? 'bg-[#238580]/5 text-[#238580]/60 animate-pulse' 
                    : 'bg-[#238580]/10 text-[#238580]'
                }`}
              >
                {file.uploading && (
                  <div className="animate-spin">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                <span className="max-w-[150px] truncate">{file.name}</span>
                {!file.uploading && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file.id)}
                    className="hover:bg-[#238580]/20 rounded-full p-0.5 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between w-full">
          {/* 深度研究按钮 */}
          <div className={`cursor-pointer text-sm px-3 py-1.5 rounded-full select-none flex items-center gap-1 transition-all duration-300 border border-[rgb(35,133,128,0.2)] ${openResearch ? 'bg-[rgba(35,133,128,0.2)] text-[#238580]' : 'bg-white text-[#333]'}`} onClick={() => { setOpenResearch(!openResearch) }}>
            {/* <ArrowLeftRight size={16}/> */}
            深度研究
          </div>
          <div className="flex gap-4 items-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || isUploading}
            />
            <div 
              className={`cursor-pointer transition-colors ${
                isUploading 
                  ? 'text-[#238580] opacity-60' 
                  : 'text-[#4D4D4D] hover:text-[#238580]'
              }`}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              title={isUploading ? "上传中..." : "上传文件"}
            >
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
