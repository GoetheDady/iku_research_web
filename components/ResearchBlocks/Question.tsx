import React from 'react';
import Image from "next/image";

interface QuestionProps {
  question: string;
}

const Question: React.FC<QuestionProps> = ({ question }) => {
  return (
    <div className="w-full flex flex-col sm:flex-row items-start gap-3 pt-5 px-4 sm:px-6 py-4 rounded-lg bg-white shadow-lg">
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <img
          src={`${process.env.NEXT_PUBLIC_USE_PATH_PREFIX === 'true' ? '/deep_research_show' : ''}/img/message-question-circle.png`}
          alt="message"
          width={24}
          height={24}
          className="w-6 h-6"
        />
        {/*<p className="font-bold uppercase leading-[152%] text-teal-200">
          Research Task:
        </p>*/}
      </div>
      <div className="grow text-[#4D4D4D] break-words max-w-full log-message mt-1 sm:mt-0 font-medium">{question}</div>
    </div>
  );
};

export default Question;
