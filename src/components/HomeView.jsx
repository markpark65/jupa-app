import React from 'react';
import { Settings, Sparkles, Mic, Volume2, Play } from 'lucide-react';

export const HomeView = ({ podcasts, onPlay, loading }) => {
  const getGradient = (tone) => {
    if (tone === 'Funny') return 'bg-gradient-to-br from-orange-400 to-red-500';
    if (tone === 'Dramatic') return 'bg-gradient-to-br from-purple-500 to-indigo-600';
    return 'bg-gradient-to-br from-blue-400 to-blue-600';
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex justify-between items-center pt-2">
        <h1 className="text-2xl font-black text-blue-900 tracking-tight">Jupa.</h1>
        <button className="bg-blue-50 text-blue-600 p-2 rounded-full"><Settings size={20} /></button>
      </div>

      {/* Featured Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
         <Mic size={100} className="absolute -right-4 -top-4 opacity-20 rotate-12" />
         <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded mb-2 inline-block">DAILY FEATURE</span>
         <h3 className="font-bold text-2xl mb-1">AI Revolution</h3>
         <p className="text-blue-100 opacity-90">Discover the future of audio.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Your Feed</h2>
        {loading ? <p className="text-center text-gray-400">Loading...</p> : podcasts.map((podcast) => (
          <div key={podcast.id} onClick={() => onPlay(podcast)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center cursor-pointer hover:bg-gray-50">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xl ${getGradient(podcast.tone)}`}>
              {podcast.title.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 truncate">{podcast.title}</h3>
              <p className="text-gray-500 text-xs truncate">{podcast.description}</p>
            </div>
            <button className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Play size={14} fill="currentColor" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};