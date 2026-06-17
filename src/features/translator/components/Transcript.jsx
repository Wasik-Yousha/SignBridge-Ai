import { TextShimmer } from '../../../components/ui/TextShimmer';

/**
 * Transcript - Shows one sentence at a time with the active word highlighted.
 * Splits text by sentence-ending punctuation (.!?) and displays only the
 * sentence that contains the current word.
 */
const SENTENCE_ENDERS = /[.!?]$/;

/** Build an array of { start, end } index ranges — one per sentence. */
function buildSentences(words) {
  const sentences = [];
  let start = 0;

  words.forEach((word, i) => {
    if (SENTENCE_ENDERS.test(word) || i === words.length - 1) {
      sentences.push({ start, end: i });
      start = i + 1;
    }
  });

  return sentences;
}

const Transcript = ({ words, currentWordIndex }) => {
  if (words.length === 0) {
    return (
      <div className="bg-[#F8F9FA] border border-gray-100 rounded-lg p-4 mt-2 text-center font-mono text-sm min-h-[60px] flex items-center justify-center">
        <TextShimmer as="span" className="italic text-base" duration={2} spread={2}>
          Awaiting text input...
        </TextShimmer>
      </div>
    );
  }

  const sentences = buildSentences(words);
  const activeSentence = sentences.find(
    (s) => currentWordIndex >= s.start && currentWordIndex <= s.end
  ) || sentences[0];

  const visibleWords = words.slice(activeSentence.start, activeSentence.end + 1);

  return (
    <div className="bg-[#F8F9FA] border border-gray-100 rounded-lg p-4 mt-2 text-center font-mono text-sm min-h-[60px] flex flex-wrap items-center justify-center gap-1 break-words">
      {visibleWords.map((word, i) => {
        const globalIndex = activeSentence.start + i;
        const isActive = globalIndex === currentWordIndex;
        const isPast = globalIndex < currentWordIndex;

        return (
          <span
            key={`${globalIndex}-${word}`}
            className={`px-1.5 py-0.5 rounded transition-colors duration-200 ${
              isActive
                ? 'bg-[#F4C5BE] text-[#A63A2B] font-bold text-base scale-110 inline-block'
                : isPast
                  ? 'text-slate-400'
                  : 'text-slate-800 font-medium'
            }`}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

export default Transcript;
