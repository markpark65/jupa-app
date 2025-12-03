import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

export const PlayerView = ({ podcast, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const synth = useRef(window.speechSynthesis);

  // Playback Logic
  const speak = (index) => {
    if (index >= podcast.script.length) { setIsPlaying(false); return; }
    
    // Stop any current speech
    synth.current.cancel();

    const line = podcast.script[index];
    const utterance = new SpeechSynthesisUtterance(line.text);
    
    // Try to vary voices
    const voices = synth.current.getVoices();
    utterance.voice = line.speaker === 'Host' ? voices[0] : (voices[1] || voices[0]);
    utterance.rate = 1.1;

    utterance.onend = () => {
      if (isPlaying) {
        setLineIndex(prev => prev + 1);
        speak(index + 1);
      }
    };
    
    synth.current.speak(utterance);
  };

  useEffect(() => {
    setIsPlaying(true);
    speak(0);
    return () => synth.current.cancel();
  }, []);

  const toggle = () => {
    if (isPlaying) {
      synth.current.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speak(lineIndex);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white p-6">
      <button onClick={onBack} className="mb-6"><ChevronLeft /></button>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-64 h-64 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-6xl font-black mb-8 shadow-xl">
          {podcast.title.charAt(0)}
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">{podcast.title}</h2>
        
        <div className="h-32 w-full flex items-center justify-center text-center p-4 bg-gray-50 rounded-2xl mt-4">
          <p className="font-medium text-gray-700">
             {podcast.script[lineIndex] ? `"${podcast.script[lineIndex].text}"` : "End of episode."}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center px-8 pb-10">
        <SkipBack />
        <button onClick={toggle} className="w-16 h-16 bg-blue-600 rounded-full text-white flex items-center justify-center shadow-lg">
          {isPlaying ? <Pause fill="currentColor"/> : <Play fill="currentColor" className="ml-1"/>}
        </button>
        <SkipForward />
      </div>
    </div>
  );
};