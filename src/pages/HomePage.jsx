import { InputPanel, AvatarPanel, useTranslator } from '../features/translator';

const HeroSection = () => (
  <div className="max-w-5xl mx-auto pt-16 pb-12 px-6 text-center">
    <h1 className="text-5xl md:text-6xl font-serif italic text-slate-900 mb-6">
      Transform Words into Signs
    </h1>
    <p className="text-slate-500 text-lg max-w-2xl mx-auto">
      Enter text or paste a video link to see it translated into sign language
      by our AI avatar.
    </p>
  </div>
);

const HomePage = () => {
  const {
    inputText,
    activeTab,
    setActiveTab,
    isPlaying,
    currentWordIndex,
    words,
    progress,
    speed,
    setSpeed,
    cycleSpeed,
    loop,
    setLoop,
    videoUrl,
    isTranscribing,
    reset,
    togglePlay,
    startConversion,
    updateText,
    updateVideoUrl,
    transcribeVideo,
  } = useTranslator('');

  return (
    <>
      <HeroSection />

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-24">
        <InputPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          inputText={inputText}
          onTextChange={updateText}
          onConvert={startConversion}
          videoUrl={videoUrl}
          onVideoUrlChange={updateVideoUrl}
          onTranscribe={transcribeVideo}
          isTranscribing={isTranscribing}
        />
        <AvatarPanel
          isPlaying={isPlaying}
          progress={progress}
          speed={speed}
          loop={loop}
          words={words}
          currentWordIndex={currentWordIndex}
          onTogglePlay={togglePlay}
          onReset={reset}
          onCycleSpeed={cycleSpeed}
          onSetSpeed={setSpeed}
          onSetLoop={setLoop}
        />
      </div>
    </>
  );
};

export default HomePage;
