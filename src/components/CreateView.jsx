import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { usePodcastGenerator } from '../hooks/usePodcastGenerator';

export const CreateView = ({ user, onCreated, onCancel }) => {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Informative');
  const [length, setLength] = useState('Short');
  const { generatePodcast, isGenerating, error } = usePodcastGenerator();

  const handleGenerate = async () => {
    const success = await generatePodcast(topic, tone, length, user);
    if (success) onCreated();
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
        <button onClick={onCancel} className="text-gray-500">Cancel</button>
        <h2 className="font-bold">New Podcast</h2>
        <div className="w-10"></div>
      </div>

      <div className="p-6 flex-1 space-y-6">
        <div>
          <label className="font-bold block mb-2">Topic</label>
          <textarea 
            value={topic} onChange={(e) => setTopic(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-2xl h-32 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="What should we talk about?"
          />
        </div>

        <div>
           <label className="font-bold block mb-2">Tone</label>
           <div className="flex gap-2">
             {['Informative', 'Funny', 'Dramatic'].map(t => (
               <button key={t} onClick={() => setTone(t)} className={`px-4 py-2 rounded-xl text-sm font-bold border ${tone === t ? 'bg-blue-50 border-blue-600 text-blue-700' : 'border-gray-200'}`}>{t}</button>
             ))}
           </div>
        </div>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      <div className="p-6 border-t">
        <button onClick={handleGenerate} disabled={isGenerating || !topic} className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold flex justify-center items-center gap-2 disabled:bg-gray-200">
          {isGenerating ? 'Generating...' : <><Sparkles size={20}/> Generate Podcast</>}
        </button>
      </div>
    </div>
  );
};