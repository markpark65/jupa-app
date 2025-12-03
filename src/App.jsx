import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Play, Pause, Home, Search, User, Mic, Settings, ChevronLeft, MoreHorizontal, Heart, Share2, SkipBack, SkipForward, Volume2, Sparkles } from 'lucide-react';

// --- CONFIGURATION ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// FIX: Sanitize appId to ensure it is a valid single document segment (no slashes)
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const appId = rawAppId.replace(/\//g, '_');

const apiKey = ""; 
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

// --- HOOKS ---

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Authentication Failed:", err);
      }
    };

    initAuth();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return { user, loading };
};

const usePodcasts = (user) => {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Use simple collection query
    // Path: artifacts/{appId}/public/data/podcasts
    // appId is now sanitized to be a single segment, so this results in 5 segments (Collection)
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'podcasts');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPodcasts(items);
      setLoading(false);
    }, (err) => {
      console.error("Data Fetch Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { podcasts, loading };
};

const usePodcastGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const generatePodcast = async (topic, tone, length, user) => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setError('');

    try {
      const systemPrompt = `
        You are an expert podcast scriptwriter API. 
        Create a 2-person podcast script (Host vs Guest) based on the user's topic.
        Output MUST be valid JSON only. No markdown formatting.
      `;
      
      const userPrompt = `
        Topic: "${topic}"
        Tone: ${tone}
        Length: ${length}
        
        Required JSON Structure:
        {
          "title": "Creative Podcast Title",
          "description": "A catchy one-sentence summary.",
          "category": "Technology/Science/Comedy/History",
          "script": [
            {"speaker": "Host", "text": "Opening hook..."},
            {"speaker": "Guest", "text": "Response..."}
          ]
        }
      `;

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const podcastData = JSON.parse(rawText);

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'podcasts'), {
        ...podcastData,
        topic,
        tone,
        length,
        creatorId: user?.uid || 'anonymous',
        createdAt: serverTimestamp(),
      });

      return true;
    } catch (err) {
      console.error("Generation Error:", err);
      setError('Failed to generate podcast. Try again.');
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generatePodcast, isGenerating, error };
};

// --- COMPONENTS ---

const Spinner = () => (
  <div className="flex justify-center p-4">
    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const HomeView = ({ podcasts, onPlay, loading }) => {
  const getCategoryGradient = (tone) => {
    const map = {
      'Informative': 'bg-gradient-to-br from-blue-400 to-blue-600',
      'Funny': 'bg-gradient-to-br from-orange-400 to-red-500',
      'Dramatic': 'bg-gradient-to-br from-purple-500 to-indigo-600',
      'Casual': 'bg-gradient-to-br from-teal-400 to-emerald-600'
    };
    return map[tone] || map['Informative'];
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex justify-between items-center pt-2">
        <h1 className="text-2xl font-black text-blue-900 tracking-tight">Jupa.</h1>
        <button className="bg-blue-50 text-blue-600 p-2 rounded-full hover:bg-blue-100 transition">
          <Settings size={20} />
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Sparkles size={18} className="text-yellow-500 fill-yellow-500" /> 
          Trending Now
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
          {[1, 2].map((i) => (
            <div key={i} className="min-w-[280px] h-44 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-5 text-white flex flex-col justify-between shadow-lg relative overflow-hidden shrink-0">
               <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
                  <Mic size={120} />
               </div>
               <span className="text-[10px] font-bold tracking-wider bg-white/20 px-2 py-1 rounded-md w-fit backdrop-blur-sm uppercase">Featured</span>
               <div>
                 <h3 className="font-bold text-xl leading-tight mb-1">AI Revolution</h3>
                 <p className="text-blue-100 text-sm opacity-80">Daily Tech • 12min</p>
               </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-lg font-bold text-gray-800">Your Feed</h2>
          <button className="text-blue-600 text-sm font-semibold hover:text-blue-700">View All</button>
        </div>

        {loading ? <Spinner /> : podcasts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No podcasts yet.</p>
            <p className="text-sm text-gray-400 mt-1">Tap the blue microphone to start!</p>
          </div>
        ) : (
          podcasts.map((podcast) => (
            <div 
              key={podcast.id} 
              onClick={() => onPlay(podcast)}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center hover:shadow-md transition-all cursor-pointer active:scale-98"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${getCategoryGradient(podcast.tone)} text-white font-black text-2xl`}>
                {podcast.title && typeof podcast.title === 'string' ? podcast.title.charAt(0) : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 truncate text-base">{podcast.title}</h3>
                <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">{podcast.description}</p>
                <div className="flex items-center gap-3 mt-3">
                   <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase tracking-wide">{podcast.tone || 'General'}</span>
                   <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                      <Volume2 size={10} /> {typeof podcast.length === 'string' ? podcast.length : '3 min'}
                   </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Play size={16} fill="currentColor" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const CreateView = ({ onCreated, user, onCancel }) => {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Informative');
  const [length, setLength] = useState('Short (1 min)');
  
  const { generatePodcast, isGenerating, error } = usePodcastGenerator();

  const handleGenerate = async () => {
    const success = await generatePodcast(topic, tone, length, user);
    if (success) onCreated();
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 font-medium text-sm">Cancel</button>
        <h2 className="font-bold text-gray-900">New Podcast</h2>
        <div className="w-10"></div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-900 uppercase tracking-wide">Topic</label>
            <textarea 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What should we talk about today?"
              className="w-full p-4 bg-gray-50 border-0 rounded-2xl text-lg font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none h-40 shadow-inner"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-900 uppercase tracking-wide">Vibe & Tone</label>
            <div className="grid grid-cols-2 gap-3">
              {['Informative', 'Funny', 'Dramatic', 'Casual'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all ${
                    tone === t
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-900 uppercase tracking-wide">Duration</label>
             <div className="bg-gray-50 p-1 rounded-xl flex">
               {['Short (1 min)', 'Long (3 min)'].map((l) => (
                 <button
                    key={l}
                    onClick={() => setLength(l)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      length === l ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
                    }`}
                 >
                   {l.split(' ')[0]}
                 </button>
               ))}
             </div>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
              <span className="block w-2 h-2 bg-red-600 rounded-full"></span>
              {typeof error === 'string' ? error : 'An error occurred'}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-gray-100 bg-white">
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !topic}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
            isGenerating ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Cooking up magic...
            </>
          ) : (
            <>
              <Sparkles size={20} className="fill-blue-400 text-blue-200" />
              Generate Podcast
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const PlayerView = ({ podcast, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const synthRef = useRef(window.speechSynthesis);
  
  const getCategoryGradient = (tone) => {
    const map = {
      'Informative': 'bg-gradient-to-br from-blue-400 to-blue-600',
      'Funny': 'bg-gradient-to-br from-orange-400 to-red-500',
      'Dramatic': 'bg-gradient-to-br from-purple-500 to-indigo-600',
      'Casual': 'bg-gradient-to-br from-teal-400 to-emerald-600'
    };
    return map[tone] || map['Informative'];
  };

  const speakLine = (index) => {
    if (!podcast.script || index >= podcast.script.length) {
      setIsPlaying(false);
      return;
    }

    const line = podcast.script[index];
    const utterance = new SpeechSynthesisUtterance(line.text);
    
    const voices = synthRef.current.getVoices();
    const maleVoice = voices.find(v => v.name.includes('Male') || v.name.includes('Google US English')) || voices[0];
    const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google UK English Female')) || voices[1] || voices[0];
    
    utterance.voice = line.speaker === 'Host' ? maleVoice : femaleVoice;
    utterance.rate = 1.05; 
    utterance.pitch = line.speaker === 'Host' ? 1 : 1.1;

    utterance.onend = () => {
      if (isPlaying) {
        const nextIndex = index + 1;
        setCurrentLineIndex(nextIndex);
        speakLine(nextIndex);
      }
    };

    synthRef.current.speak(utterance);
  };

  useEffect(() => {
    setIsPlaying(true);
    speakLine(0);
    return () => synthRef.current.cancel();
  }, []); 

  const togglePlay = () => {
    if (isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakLine(currentLineIndex);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-6 flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-900 hover:bg-gray-100 transition">
          <ChevronLeft size={24} />
        </button>
        <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Now Playing</span>
        <button className="w-10 h-10 flex items-center justify-center text-gray-900 hover:bg-gray-50 rounded-full transition">
          <MoreHorizontal size={24} />
        </button>
      </div>

      <div className="flex-1 px-8 flex flex-col items-center pt-8">
        <div className={`w-64 h-64 rounded-[2rem] shadow-2xl shadow-blue-200 mb-10 flex items-center justify-center text-white text-7xl font-black ${getCategoryGradient(podcast.tone)} transform transition-transform duration-700 hover:scale-105`}>
           {podcast.title ? podcast.title.charAt(0) : '?'}
        </div>
        
        <div className="text-center w-full max-w-xs space-y-2 mb-12">
          <h2 className="text-2xl font-black text-gray-900 leading-tight">{podcast.title}</h2>
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide">{podcast.tone} Series</p>
        </div>

        <div className="w-full bg-gray-50 rounded-2xl p-6 relative overflow-hidden h-32 flex items-center justify-center text-center">
           {isPlaying && <div className="absolute top-2 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
           {podcast.script && podcast.script[currentLineIndex] ? (
             <div>
               <p className="text-xs font-bold text-blue-500 uppercase mb-2">{podcast.script[currentLineIndex].speaker}</p>
               <p className="text-gray-700 font-medium leading-relaxed animate-fade-in">
                 "{podcast.script[currentLineIndex].text}"
               </p>
             </div>
           ) : (
             <p className="text-gray-400 text-sm">Thanks for listening!</p>
           )}
        </div>
      </div>

      <div className="px-8 pb-12 pt-6">
        <div className="flex items-center justify-between mb-8">
           <button className="text-gray-300 hover:text-blue-600 transition"><Share2 size={24} /></button>
           <button className="text-gray-300 hover:text-blue-600 transition"><Heart size={24} /></button>
        </div>

        <div className="w-full bg-gray-100 h-1.5 rounded-full mb-8 overflow-hidden">
           <div 
              className="bg-blue-600 h-full transition-all duration-300 ease-linear"
              style={{ width: `${podcast.script ? (currentLineIndex / podcast.script.length) * 100 : 0}%` }}
           ></div>
        </div>

        <div className="flex items-center justify-between px-4">
           <button className="text-gray-400 hover:text-gray-900 transition hover:scale-110"><SkipBack size={32} /></button>
           <button 
             onClick={togglePlay}
             className="w-20 h-20 bg-blue-600 rounded-full text-white flex items-center justify-center shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all active:scale-95"
           >
             {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
           </button>
           <button className="text-gray-400 hover:text-gray-900 transition hover:scale-110"><SkipForward size={32} /></button>
        </div>
      </div>
    </div>
  );
};

const NavButton = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center space-y-1 w-12 ${active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    {active && <span className="w-1 h-1 bg-blue-600 rounded-full mt-1"></span>}
  </button>
);

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { podcasts, loading: dataLoading } = usePodcasts(user);
  
  const [view, setView] = useState('home');
  const [activeTab, setActiveTab] = useState('home');
  const [currentPodcast, setCurrentPodcast] = useState(null);

  const handlePlay = (podcast) => {
    setCurrentPodcast(podcast);
    setView('player');
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Spinner /></div>;

  return (
    <div className="max-w-md mx-auto h-screen bg-gray-50 flex flex-col font-sans overflow-hidden shadow-2xl relative text-gray-900">
      
      <div className="flex-1 overflow-y-auto no-scrollbar">
         {view === 'home' && <HomeView podcasts={podcasts} onPlay={handlePlay} loading={dataLoading} />}
         {view === 'create' && <CreateView user={user} onCreated={() => { setView('home'); setActiveTab('home'); }} onCancel={() => setView('home')} />}
         {/* Force remount of PlayerView when podcast changes to ensure audio state resets */}
         {view === 'player' && <PlayerView key={currentPodcast?.id || 'player'} podcast={currentPodcast} onBack={() => setView('home')} />}
         {view === 'profile' && (
             <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Profile</h2>
                <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
                   <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center text-blue-600"><User size={40}/></div>
                   <p className="font-bold">{user ? `User ${user.uid.slice(0,5)}` : 'Guest'}</p>
                   <button onClick={() => signOut(auth)} className="mt-4 text-red-500 text-sm font-medium">Sign Out</button>
                </div>
             </div>
         )}
      </div>

      {view !== 'player' && view !== 'create' && (
        <div className="absolute bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-100 px-6 py-2 pb-6 flex justify-between items-center z-50">
          <NavButton icon={Home} label="Home" active={activeTab === 'home'} onClick={() => { setView('home'); setActiveTab('home'); }} />
          <NavButton icon={Search} label="Search" active={activeTab === 'search'} onClick={() => setActiveTab('search')} />
          
          <div className="relative -top-8">
            <button 
              onClick={() => { setView('create'); setActiveTab('create'); }}
              className="bg-blue-600 text-white p-5 rounded-full shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all active:scale-95"
            >
              <Mic size={28} />
            </button>
          </div>

          <NavButton icon={Heart} label="Saved" active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
          <NavButton icon={User} label="Profile" active={activeTab === 'profile'} onClick={() => { setView('profile'); setActiveTab('profile'); }} />
        </div>
      )}
    </div>
  );
}