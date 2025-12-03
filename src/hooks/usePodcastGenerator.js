import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const usePodcastGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // --- ACTION REQUIRED ---
  // Get key from https://aistudio.google.com/app/apikey
  // Ideally, use import.meta.env.VITE_GEMINI_API_KEY
  const API_KEY = "YOUR_GEMINI_API_KEY_HERE"; 

  const generatePodcast = async (topic, tone, length, user) => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setError('');

    try {
      const systemPrompt = `
        You are a podcast scriptwriter. Create a 2-person script (Host vs Guest).
        Return ONLY valid JSON. No markdown.
      `;
      
      const userPrompt = `
        Topic: "${topic}"
        Tone: ${tone}
        Length: ${length}
        Structure:
        {
          "title": "Title",
          "description": "Short summary",
          "tone": "${tone}",
          "length": "${length}",
          "script": [
            {"speaker": "Host", "text": "Hook..."},
            {"speaker": "Guest", "text": "Response..."}
          ]
        }
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) throw new Error('AI API Error');
      
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const podcastData = JSON.parse(rawText);

      // Save to your Firestore
      await addDoc(collection(db, 'podcasts'), {
        ...podcastData,
        creatorId: user?.uid,
        createdAt: serverTimestamp(),
      });

      return true;
    } catch (err) {
      console.error(err);
      setError('Generation failed. Check API Key.');
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generatePodcast, isGenerating, error };
};