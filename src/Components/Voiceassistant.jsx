import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Markdown from 'react-markdown';
import { NavLink } from 'react-router';

// Utility: Convert Markdown to plain text for speech
function markdownToSpeechText(markdown) {
  let text = markdown.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/^#+\s*(.*)$/gm, '$1');
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1, link: $2');
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  text = text.replace(/^\s*>\s?/gm, '');
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');
  text = text.replace(/^---$/gm, '');
  text = text.replace(/\n{2,}/g, '. ');
  text = text.replace(/[#>*_`]/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

const VoiceAssistant = () => {
  const [message, setMessage] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const btnRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([]);
  const chatEndRef = useRef(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [googleSearchQuery, setGoogleSearchQuery] = useState('');
  const [showGoogleButton, setShowGoogleButton] = useState(false);
  const hasWishedRef = useRef(false);

  // Category state - changed to checkbox system
  const [showCategory, setShowCategory] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(['all']); // Array of checked categories
  const [showCategoryButton, setShowCategoryButton] = useState(false);

  // Loading state management
  const [dataLoaded, setDataLoaded] = useState(false);
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const apiTimeoutRef = useRef(null);
  const apiFallbackSpokenRef = useRef(false);

  const dataLoadedRef = useRef(false);
  const lastCommandFromInputRef = useRef(false);

  // Helper: get a voice, fallback to default if not found
  const getVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    let voice =
      voices.find(v => v.lang === 'en-IN' && v.name && v.name.toLowerCase().includes('google')) ||
      voices.find(v => v.lang === 'en-IN') ||
      voices.find(v => v.lang && v.lang.startsWith('en')) ||
      voices[0] ||
      null;
    return voice;
  };
  // Speak function with fallback for voices not loaded
  const speak = (text, isMarkdown = false) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    let speakText = text;
    if (isMarkdown) {
      speakText = markdownToSpeechText(text);
    }

    const utterance = new window.SpeechSynthesisUtterance(speakText);
    utterance.rate = 1.1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = 'en-IN';

    const setAndSpeak = () => {
      utterance.voice = getVoice();
      utterance.onend = () => {};
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.onvoiceschanged = setAndSpeak;
    } else {
      setAndSpeak();
    }
  };
  // Greet on load, but only once
  const wishMe = () => {
    if (hasWishedRef.current) return;
    hasWishedRef.current = true;
    const hour = new Date().getHours();
    if (hour < 12) {
      speak('Good morning. How can I help you?');
    } else if (hour < 16) {
      speak('Good afternoon. How can I help you?');
    } else {
      speak('Good evening. How can I help you?');
    }
  };
  // Main command handler
  const takeCommand = async (msg, { fromInput = false } = {}) => {
    setListening(false);
    const lowerMsg = msg.trim().toLowerCase();
    setChatHistory(prev => [...prev, { type: 'user', text: msg }]);

    // Handle clear commands first
    if (lowerMsg === '/cls' || lowerMsg === '/clear' || lowerMsg === 'cls' || lowerMsg === 'clear') {
      setChatHistory([]);
      if (!fromInput) speak('Chat history cleared.');
      setGoogleSearchQuery('');
      setShowGoogleButton(false);
      setSelectedCategories(['all']); // Reset to all categories
      setShowCategoryButton(false);
      return;
    }

    // Always fetch data from API before processing the command
    let latestData = [];
    try {
      const res = await axios.get('https://server-01-v2cx.onrender.com/getassistant');
      latestData = Array.isArray(res.data) ? res.data : [];
      setData(latestData); // update state for UI/category list
    } catch (err) {
      setError('Failed to load assistant data for voice command.');
      if (!fromInput) speak('Sorry, I failed to load my brain.');
      // Fallback: Google search
      const cleaned = lowerMsg.replace(/shipra|shifra/gi, '').trim();
      const fallbackText = cleaned
        ? 'This is what I found on Google: ' + cleaned
        : "Sorry, I didn't understand. Please try again.";
      if (!fromInput) speak(fallbackText);
      setChatHistory(prev => [...prev, { type: 'bot', text: fallbackText }]);
      if (cleaned) {
        setGoogleSearchQuery(cleaned);
        setShowGoogleButton(true);
      } else {
        setGoogleSearchQuery('');
        setShowGoogleButton(false);
      }
      return;
    }

    // Filter data based on selected categories
    let filteredData = latestData;
    if (!selectedCategories.includes('all')) {
      filteredData = latestData.filter(item => {
        // Check if item matches any of the selected categories
        return selectedCategories.some(category => {
          if (category === 'markdown') {
            return item.answer && (item.answer.includes('```') || item.answer.includes('#'));
          } else if (category === 'general') {
            return item.category === 'general' || !item.category;
          } else {
            return item.category === category;
          }
        });
      });
    }

    // Only return the data item whose question exactly matches the input (case-insensitive, trimmed)
    let matchedItem = null;
    for (const item of filteredData) {
      if (item.question) {
        const q = item.question.trim().toLowerCase();
        if (lowerMsg === q) {
          matchedItem = item;
          break;
        }
      }
    }

    if (matchedItem) {
      const { answer, link, image, file, open } = matchedItem;
      
      // If markdown category is selected, convert to plain text for display
      let displayAnswer = answer;
      if (selectedCategories.includes('markdown')) {
        displayAnswer = markdownToSpeechText(answer);
      }
      
      setChatHistory(prev => [
        ...prev,
        {
          type: 'bot',
          text: displayAnswer,
          link,
          image,
          file,
          open
        }
      ]);
      
      // Speak the answer as markdown, only if not from input
      if (!fromInput) speak(answer, true);
      if (open && link) {
        window.open(link, '_blank');
      }
      setGoogleSearchQuery('');
      setShowGoogleButton(false);
      return;
    }

    // Built-in commands
    if (lowerMsg.includes('play music')) {
      if (!fromInput) speak('Playing music...');
      window.open('https://www.youtube.com/watch?v=2Vv-BfVoq4g', '_blank');
      setChatHistory(prev => [
        ...prev,
        { type: 'bot', text: 'Playing music...' }
      ]);
      setGoogleSearchQuery('');
      setShowGoogleButton(false);
      return;
    }
    if (lowerMsg.includes('time')) {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (!fromInput) speak(`The time is ${time}`);
      setChatHistory(prev => [...prev, { type: 'bot', text: `The time is ${time}` }]);
      setGoogleSearchQuery('');
      setShowGoogleButton(false);
      return;
    }
    if (lowerMsg.includes('date')) {
      const date = new Date().toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
      if (!fromInput) speak(`Today's date is ${date}`);
      setChatHistory(prev => [...prev, { type: 'bot', text: `Today's date is ${date}` }]);
      setGoogleSearchQuery('');
      setShowGoogleButton(false);
      return;
    }

    // No local match → Fallback: Google search only
    const cleaned = lowerMsg.replace(/shipra|shifra/gi, '').trim();
    const fallbackText = cleaned
      ? 'This is what I found on Google: ' + cleaned
      : "Sorry, I didn't understand. Please try again.";
    if (!fromInput) speak(fallbackText);
    setChatHistory(prev => [...prev, { type: 'bot', text: fallbackText }]);
    if (cleaned) {
      setGoogleSearchQuery(cleaned);
      setShowGoogleButton(true);
    } else {
      setGoogleSearchQuery('');
      setShowGoogleButton(false);
    }
    return;
  };
  // Start listening
  const handleStartListening = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.get('https://server-01-v2cx.onrender.com/getassistant');
      setData(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
      dataLoadedRef.current = true;
    } catch (err) {
      setError('Failed to load assistant data for voice recognition.');
      setLoading(false);
      speak('Sorry, I failed to load my brain.');
      return;
    }
    if (!recognitionRef.current) {
      setError('Speech recognition is not available.');
      return;
    }
    setListening(true);
    try {
      recognitionRef.current.start();
    } catch (err) {
      setListening(false);
      setError('Could not start voice recognition.');
    }
  };
  // Handle text input submit
  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      if (message.trim() === '/') {
        setShowCategory(true);
        return;
      }
      lastCommandFromInputRef.current = true;
      takeCommand(message, { fromInput: true });
      setMessage('');
      setShowCategory(false);
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };
  // Open Google search in a new tab
  const handleOpenGoogle = () => {
    if (googleSearchQuery) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(googleSearchQuery)}`, '_blank');
    }
  };
  // Autocomplete: handle input change
  const handleInputChange = (e) => {
    const val = e.target.value;
    setMessage(val);

    // Only show suggestions if input is not empty and data is loaded
    if (val.trim().length > 0 && data && data.length > 0) {
      // Find questions that start with the input (case-insensitive)
      const inputLower = val.trim().toLowerCase();
      const filtered = data
        .filter(item => item.question && item.question.toLowerCase().startsWith(inputLower))
        .map(item => item.question);

      setSuggestions(filtered.slice(0, 8)); // limit to 8 suggestions
      setShowSuggestions(filtered.length > 0);
      setActiveSuggestion(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };
  // Autocomplete: handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  };
  // Autocomplete: handle keyboard navigation
  const handleInputKeyDown = (e) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestion(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestion(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === 'Enter') {
        if (activeSuggestion >= 0 && activeSuggestion < suggestions.length) {
          e.preventDefault();
          setMessage(suggestions[activeSuggestion]);
          setSuggestions([]);
          setShowSuggestions(false);
          setActiveSuggestion(-1);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setActiveSuggestion(-1);
      }
    }
  };
  // Handle category checkbox toggle
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      if (category === 'all') {
        // If "all" is checked, uncheck everything else
        return ['all'];
      } else {
        // Remove "all" if it was selected
        let newSelection = prev.filter(cat => cat !== 'all');
        
        if (prev.includes(category)) {
          // Uncheck the category
          newSelection = newSelection.filter(cat => cat !== category);
          // If no categories selected, default to "all"
          if (newSelection.length === 0) {
            newSelection = ['all'];
          }
        } else {
          // Check the category
          newSelection.push(category);
        }
        return newSelection;
      }
    });
  };
  // Get items for a specific category
  const getCategoryItems = (category) => {
    if (category === 'all') {
      return data;
    } else if (category === 'markdown') {
      return data.filter(item => 
        item.answer && (item.answer.includes('```') || item.answer.includes('#'))
      );
    } else if (category === 'general') {
      return data.filter(item => 
        item.category === 'general' || !item.category
      );
    } else {
      return data.filter(item => item.category === category);
    }
  };
  // Setup speech recognition
  useEffect(() => {
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = wishMe;
    } else {
      wishMe();
    }

    let SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    let recognition;
    try {
      recognition = new SpeechRecognition();
    } catch (e) {
      setError('Speech recognition could not be initialized.');
      return;
    }
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      setListening(false);
      if (event.results && event.results[0] && event.results[0][0]) {
        const transcript = event.results[0][0].transcript;
        lastCommandFromInputRef.current = false;
        takeCommand(transcript, { fromInput: false });
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === 'not-allowed' || event.error === 'denied') {
        setError('Microphone access denied. Please allow microphone permission.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else {
        setError('Voice recognition error: ' + (event.error || 'Unknown error'));
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, []);
  // Fetch assistant data with 5s fallback and minimum loading time
  useEffect(() => {
    apiFallbackSpokenRef.current = false;
    setLoading(true);
    setDataLoaded(false);
    setMinLoadingComplete(false);

    // Set minimum loading time of 5 seconds
    const minLoadingTimer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 2500);

    apiTimeoutRef.current = setTimeout(() => {
      if (loading && !apiFallbackSpokenRef.current) {
        speak("I'm still trying to fix it");
        apiFallbackSpokenRef.current = true;
      }
    }, 5000);

    const fetchData = async () => {
      try {
        const res = await axios.get('https://server-01-v2cx.onrender.com/getassistant');
        setData(Array.isArray(res.data) ? res.data : []);
        setDataLoaded(true);
        dataLoadedRef.current = true;
        
        // Only stop loading if both data is loaded AND minimum time has passed
        if (minLoadingComplete) {
          setLoading(false);
        }
        
        if (apiTimeoutRef.current) {
          clearTimeout(apiTimeoutRef.current);
        }
      } catch (error) {
        setError('Failed to load assistant data.');
        setDataLoaded(true);
        
        // Only stop loading if both error occurred AND minimum time has passed
        if (minLoadingComplete) {
          setLoading(false);
        }
        
        if (apiTimeoutRef.current) {
          clearTimeout(apiTimeoutRef.current);
        }
        if (!apiFallbackSpokenRef.current) {
          speak('Sorry, I failed to load my brain.');
          apiFallbackSpokenRef.current = true;
        }
      }
    };
    fetchData();

    return () => {
      if (apiTimeoutRef.current) {
        clearTimeout(apiTimeoutRef.current);
      }
      if (minLoadingTimer) {
        clearTimeout(minLoadingTimer);
      }
    };
  }, []);
  // Handle minimum loading time completion
  useEffect(() => {
    if (minLoadingComplete && dataLoaded) {
      setLoading(false);
    }
  }, [minLoadingComplete, dataLoaded]);
  // Extract unique categories from data
  useEffect(() => {
    if (data && data.length > 0) {
      const cats = Array.from(
        new Set(
          data
            .map(item => item.category)
            .filter(Boolean)
        )
      );
      setCategories(cats);
    }
  }, [data]);
  // Show/hide category list when user types "/"
  useEffect(() => {
    if (message.trim() === '/') {
      setShowCategory(true);
    } else {
      setShowCategory(false);
    }
  }, [message]);
  // Hide suggestions if message is cleared
  useEffect(() => {
    if (message.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  }, [message]);
  // Scroll to bottom on new chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, googleSearchQuery, showCategory]);
  if (loading) return <div className="text-white p-4 w-full h-full bg-zinc-950 flex items-center justify-center"><div className='size-10 flex items-center justify-center animate-spin bg-transparent'><i className='text-lg font-medium ri-loader-4-line'></i></div></div>;
  return (
    <div className="h-full w-full bg-zinc-800 flex flex-col justify-end p-4">
      {/* Nav */}
      <div className='w-full min-h-10 mb-3 bg-transparent text-zinc-300 px-3 rounded-md border border-zinc-700/30 flex items-center justify-between'>
        <div className='w-fit'><h1 className='text-2xl font-medium'>Gaama</h1></div>
        <div className='w-fit'>
          {/* Categories Button */}
        <button
          type="button"
          onClick={() => setShowCategoryButton(!showCategoryButton)}
          className={` ${selectedCategories.length === 1 ? 'text-zinc-500' : 'text-zinc-300'} transition-all duration-300  px-2 py-0.5 text-sm cursor-pointer flex items-center gap-0.5`}
        >
          <i className="ri-list-check text-lg"></i>
          Categories ({selectedCategories.length})
        </button>
      </div>
      </div>
      {/* Chat History */}
      <div className="flex flex-col gap-2 overflow-y-auto h-full mb-4 scroll-smooth relative">
        {chatHistory.length === 0 && (
          <div className="absolute inset-0 text-white flex items-center justify-center bg-zinc-800 border border-zinc-700/30 z-20 rounded-md">
            <div className='w-full h-full bg-zinc-700/10 rounded-md p-2 flex flex-col items-start justify-start gap-2'>
              {error && (
                <div className="px-5 py-1 rounded-md border border-zinc-700/50 text-red-400">{error}</div>
              )}
              <p className='px-5 py-1 rounded-md border border-zinc-700/50 text-zinc-400 '>sir I {data.length == 0 && <span>don't</span>} have {!data.length == 0 &&<span>{data.length}</span>}  data {data.length == 0 && <span>😒</span>} {selectedCategories.length}</p>
              {!data.length == 0 && <p className='px-5 py-1 rounded-md border border-zinc-700/50 text-zinc-400 '>But you still not chating! 🥺</p>}
              {!data.length == 0 && <p className='px-5 py-1 rounded-md border border-zinc-700/50 text-zinc-400 '>I need more data! Please <NavLink to={'/train'} className={` text-blue-400 hover:underline`}>Train</NavLink> me</p>}
            </div>
          </div>
        )}
        {chatHistory.length > 0 && chatHistory.map((chat, index) => (
          <div
            key={index}
            className={`w-full flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[95%] px-3 py-0.5 rounded-lg break-words text-sm ${
                chat.type === 'user' ? 'bg-transparent border border-zinc-700/20 text-zinc-400 min-h-10 flex items-center justify-center' : 'bg-transparent border border-zinc-700/30 py-2.5 text-zinc-200'
              }`}
            >
              <div className="relative mb-1">
                {chat.text && (
                  <div className='flex items-start justify-start gap-2'>
                    <div className="markdown"><Markdown target='_blank'>{chat.text}</Markdown></div>
                    {chat.type === 'user' ? '' : (
                      <button
                        type="button"
                        className=" w-4 bg-transparent cursor-pointer transition-all duration-300 text-zinc-600 hover:text-zinc-200"
                        title="Copy to clipboard"
                        onClick={() => {
                          if (typeof chat.text === 'string') {
                            navigator.clipboard.writeText(chat.text);
                          }
                        }}
                      >
                        <i className='ri-file-copy-2-line text-xl'></i>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {chat.link && (
                <a
                  href={chat.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 underline text-sm block text-wrap"
                >
                  🔗 Open Link
                </a>
              )}

              {chat.image && (
                <img
                  src={chat.image}
                  alt="chat-img"
                  className="mt-2 rounded-md max-w-[200px]"
                />
              )}

              {chat.file && (
                <a
                  href={chat.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="text-yellow-300 underline text-sm block mt-1"
                >
                  📎 Download File
                </a>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      {/* Category List */}
      {showCategory && categories.length > 0 && (
        <div className="mb-2 w-fit max-h-96 rounded-xl border border-zinc-700 bg-zinc-900 shadow-lg z-50">
          <div className="p-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <div className=" text-zinc-300/70 font-medium text-base">
              I have {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
            </div>
            <div className="flex flex-col gap-0.5">
              {categories.map((cat, idx) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <label
                    key={cat + idx}
                    className={`flex items-center gap-2 hover:bg-zinc-700/30 text-start cursor-pointer rounded text-xs transition line-clamp-1 ${
                      isSelected ? 'text-zinc-200' : 'text-zinc-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCategoryToggle(cat)}
                      className="accent-cyan-400"
                    />
                    <span className="truncate">{cat}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Google Search Results */}
      {googleSearchQuery && (
        <div className="mb-5 w-full max-w-full rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900 h-[95vh]" >
          <iframe
            title="Google Search"
            src={`https://www.bing.com/search?q=${encodeURIComponent(googleSearchQuery)}`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      )}
      {/* Input & Buttons */}
      <form onSubmit={handleInputSubmit} className="flex gap-2 w-full relative">
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder="Ask a question..."
            className="w-full p-3 border border-gray-300/30 text-white bg-zinc-800 rounded-md focus:outline-none focus:ring focus:ring-zinc-500"
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="autocomplete-list"
            aria-activedescendant={activeSuggestion >= 0 ? `suggestion-${activeSuggestion}` : undefined}
          />
          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <ul
              id="autocomplete-list"
              className="absolute left-0 right-0 bottom-full z-30 bg-zinc-900 border border-zinc-700 rounded-lg max-h-56 overflow-y-auto shadow-lg"
              style={{ listStyle: 'none', margin: 0, padding: 0 }}
            >
              {(() => {
                // Get the current input value split into words
                const words = message.trim().split(/\s+/);
                // If there are words, get the middle word (or nearest to middle)
                let middleWord = '';
                if (words.length > 0) {
                  const midIdx = Math.floor((words.length - 1) / 2);
                  middleWord = words[midIdx];
                }
                // Filter suggestions that include the middle word (case-insensitive)
                let middleWordSuggestions = [];
                if (middleWord && middleWord.length > 0) {
                  middleWordSuggestions = suggestions.filter(s =>
                    s.toLowerCase().includes(middleWord.toLowerCase())
                  );
                }
                // Remove duplicates if any
                const uniqueSuggestions = Array.from(
                  new Set([...middleWordSuggestions, ...suggestions])
                );
                return uniqueSuggestions.map((suggestion, idx) => (
                  <li
                    key={suggestion + idx}
                    id={`suggestion-${idx}`}
                    className={`px-4 py-2 cursor-pointer text-sm text-zinc-200 hover:bg-blue-700 transition ${
                      idx === activeSuggestion ? 'bg-blue-700 text-white' : ''
                    }`}
                    onMouseDown={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </li>
                ));
              })()}
            </ul>
          )}
        </div>
        <button
          type="submit"
          className="bg-zinc-800 border border-zinc-100/30 text-white size-12 flex items-center justify-center rounded-md hover:bg-blue-700 cursor-pointer transition"
        >
          <i className="ri-send-plane-fill text-2xl"></i>
        </button>
        <button
          ref={btnRef}
          onClick={handleStartListening}
          type="button"
          className={`flex items-center cursor-pointer justify-center size-12 rounded-md border border-zinc-100/30 overflow-hidden text-white font-semibold transition text-xl ${
            listening ? 'bg-zinc-700 hover:bg-zinc-800' : 'bg-zinc-800 hover:bg-zinc-700'
          }`}
          disabled={listening}
          aria-label="Start voice recognition"
        >
          {listening ? (
            <i className="ri-voice-ai-line"></i>
          ) : (
            <i className="ri-mic-off-line font-light"></i>
          )}
        </button>
      </form>
      {/* Categories with Related Content */}
      {showCategoryButton && (
        <div className=" absolute bottom-20 z-30 left-1/2 -translate-x-1/2 w-[90vw] max-w-[650px] mx-auto bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-3">
            <div className="mb-3 text-zinc-200/70 font-medium text-base flex items-center justify-between"><span>Categories with Related Content</span> <NavLink to={`/train`} className={`text-blue-400/70 hover:text-blue-400 text-sm font-medium hover:underline`}>Teach me</NavLink></div>
            
            {/* All Categories Section */}
            <div className="mb-4">
              <label className="flex items-center space-x-3 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes('all')}
                  onChange={() => handleCategoryToggle('all')}
                  className="w-4 h-4 text-blue-600 bg-zinc-700 border-zinc-600 rounded"
                />
                <span className={`${selectedCategories.includes('all') ? 'text-zinc-200' : 'text-zinc-500'} text-sm font-semibold`}>
                  📋 All Categories ({data.length} items)
                </span>
              </label>
            </div>
            {/* Dynamic Categories */}
            {categories.map((cat, idx) => (
              <div key={cat + idx} className="mb-4">
                <label className="flex items-center space-x-3 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => handleCategoryToggle(cat)}
                    className="w-4 h-4 bg-zinc-700 border-zinc-600 rounded"
                  />
                  <span className={`${selectedCategories.includes(cat) ? 'text-zinc-200' : 'text-zinc-500'} text-sm font-semibold`}>
                    📂 {cat}
                  </span>
                </label>
              </div>
            ))}
            
            <div className="mt-3 pt-2 border-t border-zinc-700">
              <div className="text-xs text-zinc-400">
                Selected Categories: {selectedCategories.join(', ')}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                <span>
                  Total Items Available:
                  {data.filter(item => selectedCategories.includes(item.category)).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VoiceAssistant;