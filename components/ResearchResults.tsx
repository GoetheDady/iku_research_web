import React, { useState } from 'react';
import Question from './ResearchBlocks/Question';
import Report from './ResearchBlocks/Report';
import Sources from './ResearchBlocks/Sources';
import ImageSection from './ResearchBlocks/ImageSection';
import SubQuestions from './ResearchBlocks/elements/SubQuestions';
import LogsSection from './ResearchBlocks/LogsSection';
import AccessReport from './ResearchBlocks/AccessReport';
import { preprocessOrderedData } from '../utils/dataProcessing';
import { Data } from '../types/data';
import InputArea from "./ResearchBlocks/elements/InputArea";

interface ResearchResultsProps {
  orderedData: Data[];
  answer: string;
  allLogs: any[];
  chatBoxSettings: any;
  handleClickSuggestion: (value: string) => void;
  currentResearchId?: string;
  isProcessingChat?: boolean;
  loadingRenderer?: React.ReactNode;
  onShareClick?: () => void;
}

export const ResearchResults: React.FC<ResearchResultsProps> = ({
  orderedData,
  answer,
  allLogs,
  chatBoxSettings,
  handleClickSuggestion,
  currentResearchId,
  isProcessingChat = false,
  onShareClick,
  loadingRenderer,
}) => {
  const groupedData = preprocessOrderedData(orderedData);
  const pathData = groupedData.find(data => data.type === 'path');
  const initialQuestion = groupedData.find(data => data.type === 'question');
  const [promptValue, setPromptValue] = useState("");

  const chatComponents = groupedData
    .filter(data => {
      if (data.type === 'question' && data === initialQuestion) {
        return false;
      }
      return (data.type === 'question' || data.type === 'chat');
    })
    .map((data, index) => {
      if (data.type === 'question') {
        return <Question key={`question-${index}`} question={data.content} />;
      } else {
        return <Report key={`chat-${index}`} answer={data.content} />;
      }
    });

  const sourceComponents = groupedData
    .filter(data => data.type === 'sourceBlock')
    .map((data, index) => (
      <Sources key={`sourceBlock-${index}`} sources={data.items} />
    ));

  const imageComponents = groupedData
    .filter(data => data.type === 'imagesBlock')
    .map((data, index) => (
      <ImageSection key={`images-${index}-${data.metadata?.length || 0}`} metadata={data.metadata} />
    ));

  const initialReport = groupedData.find(data => data.type === 'reportBlock');
  const finalReport = groupedData
    .filter(data => data.type === 'reportBlock')
    .pop();
  const subqueriesComponent = groupedData.find(data => data.content === 'subqueries');

  const hasRightColumnContent = !!pathData;

  return (
    <div className="flex gap-2 w-full h-full">
      {/* Left Column: Question and Logs */}
      <div className={`${hasRightColumnContent ? 'w-2/5' : 'w-2/5 mx-auto'} flex flex-col gap-2 overflow-hidden pb-4`}>
        {initialQuestion && <Question question={initialQuestion.content} />}
        {orderedData.length > 0 && <LogsSection logs={allLogs} loadingRenderer={loadingRenderer} />}
        {/* <InputArea
          promptValue={promptValue}
          setPromptValue={setPromptValue}
          // handleSubmit={handleDisplayResult}
          handleSubmit={() => { setPromptValue('') }}
          className="bg-white rounded-lg shadow-xl"
        /> */}
      </div>

      {/* Right Column: The rest */}
      {hasRightColumnContent && (
        <div className="w-3/5 flex flex-col gap-2 overflow-hidden relative pb-4">
          {/* {subqueriesComponent && (
            <SubQuestions
              metadata={subqueriesComponent.metadata}
              handleClickSuggestion={handleClickSuggestion}
            />
          )} */}
          {/* {sourceComponents}
          {imageComponents} */}
          <div className='absolute top-0 bottom-4 gap-2 overflow-auto rounded-lg flex flex-col'>
            {pathData && <AccessReport accessData={pathData.output} report={answer} chatBoxSettings={chatBoxSettings} onShareClick={onShareClick} />}
            {finalReport && <Report answer={finalReport.content} researchId={currentResearchId} accessData={pathData?.output} />}
          </div>
          {/* {chatComponents} */}
        </div>
      )}
    </div>
  );
}; 