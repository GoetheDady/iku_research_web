import Image from "next/image";

interface SubQuestionsProps {
  metadata: string[];
  handleClickSuggestion: (value: string) => void;
}

const SubQuestions: React.FC<SubQuestionsProps> = ({ metadata, handleClickSuggestion }) => {
  return (
    <div className="container flex w-full items-start gap-3 pt-5 pb-2">
      <div className="flex w-fit items-center gap-4">
        <img
          src={"/deep_research_show/img/thinking.svg"}
          alt="thinking"
          width={30}
          height={30}
          className="size-[24px]"
        />
      </div>
      <div className="grow text-white">
        <p className="pr-5 font-bold leading-[152%] text-[#4D4D4D] pb-[20px]">
          从多个角度思考您的问题
        </p>
        <div className="flex flex-row flex-wrap items-center gap-2.5 pb-[20px]">
          {metadata.map((item, subIndex) => (
            <div
              className="flex cursor-pointer items-center justify-center gap-[5px] rounded-full border border-solid border-[#238580] bg-[#238580]/20 px-2.5 py-2"
              onClick={() => handleClickSuggestion(item)}
              key={`${item}-${subIndex}`}
            >
              <span className="text-sm font-light leading-[normal] text-[#238580]">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubQuestions;