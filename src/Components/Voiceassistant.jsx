import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Markdown from 'react-markdown';
import { NavLink } from 'react-router-dom';

// Typewriter Markdown Component - Auto-detect animation type based on word count
const TypewriterMarkdown = ({ text, speed = 80, delay = 0 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const API = 'https://server-01-v2cx.onrender.com/getassistant';

  useEffect(() => {
    axios.get(API)
      .then(res => {
      })
      .catch(err => {
      });
  }, []);
  

  useEffect(() => {
    if (!text) return;

    setDisplayText('');
    setCurrentIndex(0);

    const timer = setTimeout(() => {
      const wordCount = text.trim().split(/\s+/).length;
      const animateBy = wordCount <= 40 ? 'words' : 'lines';
      let textUnits = animateBy === 'words' ? text.split(' ') : text.split('\n');

      const interval = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= textUnits.length) {
            clearInterval(interval);
            return prev;
          }
          let newText = animateBy === 'words'
            ? textUnits.slice(0, prev + 1).join(' ')
            : textUnits.slice(0, prev + 1).join('\n');
          setDisplayText(newText);
          return prev + 1;
        });
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [text, speed, delay]);

  return (
    <div className="typewriter-markdown">
      <Markdown>{displayText}</Markdown>
    </div>
  );
};

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

// Math calculation utility - Clean and working version
const calculateMath = (expression) => {
  try {
    
    let cleanExpr = expression
      .toLowerCase()
      .replace(/what is|calculate|compute|solve|evaluate|simplify/gi, '')
      .replace(/plus/g, '+')
      .replace(/minus/g, '-')
      .replace(/times|multiplied by/g, '*')
      .replace(/divided by|divide/g, '/')
      .replace(/÷/g, '/') // Support for ÷ symbol
      .replace(/×/g, '*') // Support for × symbol
      .replace(/\*/g, '*') // Ensure * is properly handled
      .replace(/\-/g, '-') // Ensure - is properly handled
      .replace(/equals|equal to/g, '=')
      .replace(/\s+/g, '')
      .trim();

    
    // Check if the expression contains at least one number and one operator
    if (!/\d/.test(cleanExpr) || !/[+\-*/]/.test(cleanExpr)) {
      return null; // Return null for non-math inputs
    }

    // Function to evaluate expression with proper order of operations
    const evaluateExpression = (expr) => {
      
      // Remove all spaces
      expr = expr.replace(/\s+/g, '');
      
      // Handle parentheses and curly braces first (innermost to outermost)
      while (expr.includes('(') || expr.includes('{')) {
        // Handle parentheses
        if (expr.includes('(')) {
          expr = expr.replace(/\(([^()]+)\)/g, (match, innerExpr) => {
            return evaluateExpression(innerExpr);
          });
        }
        
        // Handle curly braces
        if (expr.includes('{')) {
          expr = expr.replace(/\{([^{}]+)\}/g, (match, innerExpr) => {
            return evaluateExpression(innerExpr);
          });
        }
      }
      
      // Split into tokens using a more robust approach
      const tokens = [];
      let current = '';
      let inNumber = false;
      
      for (let i = 0; i < expr.length; i++) {
        const char = expr[i];
        
        if (/\d/.test(char) || char === '.') {
          // This is a digit or decimal point
          current += char;
          inNumber = true;
        } else if (/[+\-*/]/.test(char)) {
          // This is an operator
          if (inNumber && current) {
            tokens.push(current);
            current = '';
            inNumber = false;
          }
          tokens.push(char);
        }
      }
      
      // Don't forget the last number
      if (current) {
        tokens.push(current);
      }
      
      
      if (tokens.length < 3) {
        return parseFloat(expr) || 0;
      }
      
      // First pass: handle multiplication and division
      let i = 1;
      while (i < tokens.length - 1) {
        if (tokens[i] === '*' || tokens[i] === '/') {
          const left = parseFloat(tokens[i - 1]);
          const right = parseFloat(tokens[i + 1]);
          let result;
          
          if (tokens[i] === '*') {
            result = left * right;
          } else {
            if (right === 0) throw new Error('Division by zero is not allowed');
            result = left / right;
          }
          
          
          // Replace the three tokens with the result
          tokens.splice(i - 1, 3, result.toString());
          i = Math.max(1, i - 1); // Reset index to check for consecutive operations
        } else {
          i += 2;
        }
      }
      
      // Second pass: handle addition and subtraction
      let result = parseFloat(tokens[0]);
      for (i = 1; i < tokens.length; i += 2) {
        if (i + 1 >= tokens.length) break;
        
        const operator = tokens[i];
        const nextNumber = parseFloat(tokens[i + 1]);
        
        if (isNaN(nextNumber)) continue;
        
        switch (operator) {
          case '+':
            result += nextNumber;
            break;
          case '-':
            result -= nextNumber;
            break;
          default:
            continue;
        }
        
        
      }
      
      return result;
    };

    // Evaluate the expression
    const result = evaluateExpression(cleanExpr);
    
    // Format the original expression for display
    const displayExpr = cleanExpr.replace(/\s+/g, ' ').trim();

    // Generate simplified steps
    const simplifiedSteps = generateSimplifiedSteps(cleanExpr, result);

    return {
      expression: displayExpr,
      result: result,
      formattedResult: Number.isInteger(result) ? result.toString() : result.toFixed(2),
      simplifiedSteps: simplifiedSteps
    };
  } catch (error) {
    if (error.message === 'Division by zero is not allowed') {
      return {
        expression: expression,
        result: null,
        formattedResult: null,
        error: 'Error: Division by zero is not allowed'
      };
    }
    console.error('Math calculation error:', error);
    return {
      expression: expression,
      result: null,
      formattedResult: null,
      error: 'Sorry, I couldn\'t solve this math problem. It might be too complex or contain invalid syntax. You can use the math form to submit it for review!'
    };
  }
};

// Generate simplified step-by-step math solution
const generateSimplifiedSteps = (expression, result) => {
  try {
    let expr = expression.replace(/\s+/g, '');
    const steps = [];
    let stepNumber = 1;

    // Split into tokens
    const tokens = [];
    let current = '';
    let inNumber = false;
    
    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];
      
      if (/\d/.test(char) || char === '.') {
        current += char;
        inNumber = true;
      } else if (/[+\-*/]/.test(char)) {
        if (inNumber && current) {
          tokens.push(current);
          current = '';
          inNumber = false;
        }
        tokens.push(char);
      }
    }
    
    if (current) {
      tokens.push(current);
    }

    
    // First pass: handle multiplication and division
    let i = 1;
    while (i < tokens.length - 1) {
      if (tokens[i] === '*' || tokens[i] === '/') {
        const left = parseFloat(tokens[i - 1]);
        const right = parseFloat(tokens[i + 1]);
        let stepResult;
        
        if (tokens[i] === '*') {
          stepResult = left * right;
          steps.push(`**Step ${stepNumber}:** Multiply: ${left} × ${right} = ${stepResult}`);
        } else {
          stepResult = left / right;
          steps.push(`**Step ${stepNumber}:** Divide: ${left} ÷ ${right} = ${stepResult}`);
        }
        
        stepNumber++;
        tokens.splice(i - 1, 3, stepResult.toString());
        i = Math.max(1, i - 1);
      } else {
        i += 2;
      }
    }
    
    // Second pass: handle addition and subtraction
    let runningResult = parseFloat(tokens[0]);
    for (i = 1; i < tokens.length; i += 2) {
      if (i + 1 >= tokens.length) break;
      
      const operator = tokens[i];
      const nextNumber = parseFloat(tokens[i + 1]);
      
      if (isNaN(nextNumber)) continue;
      
      let stepResult;
      if (operator === '+') {
        stepResult = runningResult + nextNumber;
        steps.push(`**Step ${stepNumber}:** Add: ${runningResult} + ${nextNumber} = ${stepResult}`);
      } else if (operator === '-') {
        stepResult = runningResult - nextNumber;
        steps.push(`**Step ${stepNumber}:** Subtract: ${runningResult} - ${nextNumber} = ${stepResult}`);
      }
      
      stepNumber++;
      runningResult = stepResult;
    }

    // Add final result with explanation
    const finalExplanation = getFinalExplanation(result);
    steps.push(`**Final Answer:** ${result}\n\n${finalExplanation}`);

    return steps.join('\n\n');
  } catch (error) {
    console.error('Error generating simplified steps:', error);
    return `**Result:** ${result}`;
  }
};

// Helper function to provide friendly final answer explanation
const getFinalExplanation = (result) => {
  if (Number.isInteger(result)) {
    return `✨ The answer is a whole number: **${result}**`;
  } else {
    const rounded = Math.round(result * 100) / 100;
    return `✨ The answer is approximately: **${rounded}** (rounded to 2 decimal places)`;
  }
};

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
  const [userGender, setUserGender] = useState(null); // 'girl' | 'boy' | null
  const [thinking, setThinking] = useState(false);
  const hasWishedRef = useRef(false);

  // Category state
  const [showCategory, setShowCategory] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  const [showCategoryButton, setShowCategoryButton] = useState(false);

  // Code commands state
  const [showCodeCategory, setShowCodeCategory] = useState(false);
  const [showNewCodeForm, setShowNewCodeForm] = useState(false);
  const [showAnswerPreview, setShowAnswerPreview] = useState(false);
  const [newCodeForm, setNewCodeForm] = useState({
    question: '',
    answer: '',
    category: 'code'
  });

  // Math form state
  const [showMathForm, setShowMathForm] = useState(false);
  const [newMathForm, setNewMathForm] = useState({
    question: '',
    answer: '',
    category: 'math'
  });

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
  const Datacount = data.length;
  const Questions = data.map((items)=>(<>{items.question}, </>));
  const [copiedIndex, setCopiedIndex] = useState(null);
  const prefetchingRef = useRef(false);

  const [allData, setallData] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    
    // Toggle CSS class on document root
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    try {
      localStorage.setItem('isDarkTheme', newTheme.toString());
    } catch (_) {}
  };

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
    setThinking(true);

    // Detect gender declaration and store it
    const isGirl = /\b(i'?m|i am|my gender is|i identify as)\s+(a\s+)?girl\b/i.test(msg);
    const isBoy = /\b(i'?m|i am|my gender is|i identify as)\s+(a\s+)?boy\b/i.test(msg);
    if (isGirl || isBoy) {
      const gender = isGirl ? 'girl' : 'boy';
      setUserGender(gender);
      try { localStorage.setItem('userGender', gender); } catch (_) {}
      const salute = gender === 'girl' ? 'ok mam' : 'ok sir';
      if (!fromInput) speak(salute);
      setChatHistory(prev => [...prev, { type: 'bot', text: salute }]);
      setGoogleSearchQuery('');
      setShowGoogleButton(false);
      return;
    }

    // Handle clear commands first
    if (['/cls', '/clear', 'cls', 'clear'].includes(lowerMsg)) {
      setChatHistory([]);
      if (!fromInput) speak('Chat history cleared.');
      setGoogleSearchQuery('');
      setShowGoogleButton(false);
      setThinking(false);
      setSelectedCategories(['all']);
      setShowCategoryButton(false);
      setShowCodeCategory(false);
      setShowNewCodeForm(false);
      setallData(false);
      return;
    }

    // Handle /code command - show code category
    if (lowerMsg === '/code') {
      setShowCodeCategory(true);
      setShowNewCodeForm(false);
      setShowCategory(false);
      setShowCategoryButton(false);
      setallData(false);
      if (!fromInput) speak('Showing code category.');
      setChatHistory(prev => [...prev, { type: 'bot', text: 'Showing code category. Here are all the code-related questions and answers:' }]);
      setThinking(false);
      return;
    }

    // Handle /newcode command - show new code form
    if (lowerMsg === '/newcode') {
      setShowNewCodeForm(true);
      setShowCodeCategory(false);
      setShowCategory(false);
      setShowCategoryButton(false);
      setShowMathForm(false);
      setallData(false);
      if (!fromInput) speak('Opening new code form.');
      setChatHistory(prev => [...prev, { type: 'bot', text: 'Opening new code form. Please fill in the question, answer, and category fields.' }]);
      setThinking(false);
      return;
    }

    // Handle /math command - show math category
    if (lowerMsg === '/math') {
      setShowMathForm(false);
      setShowCodeCategory(false);
      setShowNewCodeForm(false);
      setShowCategory(false);
      setShowCategoryButton(false);
      setallData(false);
      if (!fromInput) speak('Showing math category.');
      setChatHistory(prev => [...prev, { type: 'bot', text: 'Showing math category. Here are all the math-related questions and answers:' }]);
      setThinking(false);
      return;
    }

    // Handle /newmath command - show new math form
    if (lowerMsg === '/newmath') {
      setShowMathForm(true);
      setShowCodeCategory(false);
      setShowNewCodeForm(false);
      setShowCategory(false);
      setShowCategoryButton(false);
      setallData(false);
      if (!fromInput) speak('Opening new math form.');
      setChatHistory(prev => [...prev, { type: 'bot', text: 'Opening new math form. Please fill in the math problem, solution, and category fields.' }]);
      setThinking(false);
      return;
    }

    //Handle /all data command - show all data
    if (lowerMsg === '/all data') {
      setallData(true);
      setShowMathForm(false);
      setShowCodeCategory(false);
      setShowNewCodeForm(false);
      setShowCategory(false);
      setShowCategoryButton(false);
      setChatHistory(prev => [...prev, { type: 'bot', text: 'Opening all data in this chat' }])
      setThinking(false);
      return;
    } 
    //Handle /change theme command - toggle theme
    if (lowerMsg === '/change theme') {
      toggleTheme();
      setChatHistory(prev => [
        ...prev,
        { type: 'bot', text: `Theme changed in " ${!isDarkTheme ? 'dark' : 'light'} " mode.` }
      ]);
      setThinking(false);
      return;
    } 
    //Handle change theme command - toggle theme
    if (lowerMsg === 'change theme') {
      toggleTheme();
      setChatHistory(prev => [
        ...prev,
        { type: 'bot', text: `Theme changed in " ${!isDarkTheme ? 'dark' : 'light'} " mode.` }
      ]);
      setThinking(false);
      return;
    } 

    // Handle math calculations - check API data first, then calculate if needed
    const mathResult = calculateMath(msg);
    if (mathResult) {
      if (mathResult.error) {
        // Math calculation failed - show error message with math form option
        const errorMsg = mathResult.error;
        setChatHistory(prev => [...prev, { 
          type: 'bot', 
          text: errorMsg,
          showMathForm: true // Flag to show math form button
        }]);
        if (!fromInput) speak(errorMsg);
        setGoogleSearchQuery('');
        setShowGoogleButton(false);
        setThinking(false);
        return;
      }
      
      if (mathResult.result !== null) {
        // Math calculation successful - show simplified steps
        setChatHistory(prev => [...prev, { type: 'bot', text: `**Your Question:** ${mathResult.expression}\n\n${mathResult.simplifiedSteps}` }]);
        if (!fromInput) speak(`The answer is ${mathResult.formattedResult}`);
        setGoogleSearchQuery('');
        setShowGoogleButton(false);
        setThinking(false);
        return;
      }
    } else {
      // Check if the input looks like a math expression but failed to parse
      const mathPattern = /[\d+\-*/().\s{}×÷]/.test(msg);
      if (mathPattern && /\d/.test(msg) && /[+\-*/×÷]/.test(msg)) {
        // This looks like a math expression but couldn't be solved
        const errorMsg = 'Sorry, I couldn\'t solve this math problem. It might be too complex or contain invalid syntax. You can use the math form to submit it for review!';
        setChatHistory(prev => [...prev, { 
          type: 'bot', 
          text: errorMsg,
          showMathForm: true // Flag to show math form button
        }]);
        if (!fromInput) speak(errorMsg);
        setGoogleSearchQuery('');
        setShowGoogleButton(false);
        setThinking(false);
        return;
      }
    }

    // Always fetch data from API before processing the command
    let latestData = [];
    try {
      const res = await axios.get('https://server-01-v2cx.onrender.com/getassistant');
      latestData = Array.isArray(res.data) ? res.data : [];
      setData(latestData);
    } catch (err) {
      setError('Failed to load assistant data for voice command.');
      if (!fromInput) speak('Sorry, I failed to load my brain.');
      // Fallback: Ask for consent to search Google (default off)
      const cleaned = lowerMsg.replace(/shipra|shifra/gi, '').trim();
      const fallbackText = cleaned
        ? `I couldn't find an exact match. Do you want me to search Google for: "${cleaned}"?`
        : "Sorry, I didn't understand. Please try again.";
      if (!fromInput) speak(fallbackText);
      setChatHistory(prev => [...prev, { type: 'bot', text: fallbackText, googleQuery: cleaned }]);
      if (cleaned) {
        setGoogleSearchQuery(cleaned);
        setShowGoogleButton(true);
      } else {
        setGoogleSearchQuery('');
        setShowGoogleButton(false);
      }
      setThinking(false);
      return;
    }

    // Filter data based on selected categories
    let filteredData = latestData;
    if (!selectedCategories.includes('all')) {
      filteredData = latestData.filter(item => {
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

    // Check for math questions in API data first (before exact match)
    let mathMatchedItem = null;
    for (const item of filteredData) {
      if (item.question && item.category === 'math') {
        const q = item.question.trim().toLowerCase();
        const userMsg = msg.trim().toLowerCase();
        
        // Check if the math question matches (allowing for some flexibility)
        if (q === userMsg || 
            q.includes(userMsg) || 
            userMsg.includes(q) ||
            q.replace(/[^0-9+\-*/()]/g, '') === userMsg.replace(/[^0-9+\-*/()]/g, '')) {
          mathMatchedItem = item;
          break;
        }
      }
    }

    // If math question found in API, use that instead of calculation
    if (mathMatchedItem) {
      const { answer, link, image, file, open } = mathMatchedItem;
      setChatHistory(prev => [
        ...prev,
        {
          type: 'bot',
          text: `**Math Problem from Database:** ${mathMatchedItem.question}\n\n${answer}`,
          link,
          image,
          file,
          open
        }
      ]);
      if (!fromInput) speak(`I found this math problem in my database: ${answer}`);
      if (open && link) {
        window.open(link, '_blank');
      }
      setGoogleSearchQuery('');
      setShowGoogleButton(false);
      setThinking(false);
      return;
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
      if (!fromInput) speak(answer, true);
      if (open && link) {
        window.open(link, '_blank');
      }
      setGoogleSearchQuery('');
      setShowGoogleButton(false);
      setThinking(false);
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
      setThinking(false);
      return;
    }
    if (lowerMsg.includes('time')) {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (!fromInput) speak(`The time is ${time}`);
      setChatHistory(prev => [...prev, { type: 'bot', text: `The time is ${time}` }]);
      setGoogleSearchQuery('');
      setShowGoogleButton(false);
      setThinking(false);
      return;
    }
    if (lowerMsg.includes('date')) {
      const date = new Date().toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
      if (!fromInput) speak(`Today's date is ${date}`);
      setChatHistory(prev => [...prev, { type: 'bot', text: `Today's date is ${date}` }]);
      setGoogleSearchQuery('');
      setShowGoogleButton(false);
      setThinking(false);
      return;
    }

    // No local match → Ask for consent to search Google (default off)
    const cleaned = lowerMsg.replace(/shipra|shifra/gi, '').trim();
    const fallbackText = cleaned
      ? `I couldn't find an exact match. Do you want me to search Google for: "${cleaned}"?`
      : "Sorry, I didn't understand. Please try again.";
    if (!fromInput) speak(fallbackText);
    setChatHistory(prev => [...prev, { type: 'bot', text: fallbackText, googleQuery: cleaned }]);
    if (cleaned) {
      setGoogleSearchQuery(cleaned);
      setShowGoogleButton(true);
    } else {
      setGoogleSearchQuery('');
      setShowGoogleButton(false);
    }
    setThinking(false);
    return;
  };

  // Start listening
  const handleStartListening = async () => {
    setError('');
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

    // Prefetch data silently in background
    if (!dataLoadedRef.current && !prefetchingRef.current) {
      prefetchingRef.current = true;
      axios
        .get('https://server-01-v2cx.onrender.com/getassistant')
        .then(res => {
          setData(Array.isArray(res.data) ? res.data : []);
          dataLoadedRef.current = true;
        })
        .catch(() => {})
        .finally(() => {
          prefetchingRef.current = false;
        });
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
      if (message.trim() === '/code') {
        setShowCodeCategory(true);
        setShowNewCodeForm(false);
        setShowCategory(false);
        setShowCategoryButton(false);
        setMessage('');
        return;
      }
      if (message.trim() === '/newcode') {
        setShowNewCodeForm(true);
        setShowCodeCategory(false);
        setShowCategory(false);
        setShowCategoryButton(false);
        setShowMathForm(false);
        setMessage('');
        return;
      }
      if (message.trim() === '/math') {
        setShowMathForm(false);
        setShowCodeCategory(false);
        setShowNewCodeForm(false);
        setShowCategory(false);
        setShowCategoryButton(false);
        setMessage('');
        return;
      }
      if (message.trim() === '/newmath') {
        setShowMathForm(true);
        setShowCodeCategory(false);
        setShowNewCodeForm(false);
        setShowCategory(false);
        setShowCategoryButton(false);
        setMessage('');
        return;
      }
      lastCommandFromInputRef.current = true;
      takeCommand(message, { fromInput: true });
      setMessage('');
      setShowCategory(false);
      setShowCodeCategory(false);
      setShowNewCodeForm(false);
      setShowMathForm(false);
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };

  // Handle new code form input changes
  const handleNewCodeFormChange = (field, value) => {
    setNewCodeForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle new code form submission
  const handleNewCodeFormSubmit = async (e) => {
    e.preventDefault();
    if (newCodeForm.question.trim() && newCodeForm.answer.trim()) {
      try {
        const submitData = {
          question: newCodeForm.question.trim(),
          answer: newCodeForm.answer.trim(),
          category: newCodeForm.category || 'code',
          open: false,
          link: '',
          image: '',
          file: ''
        };

        const response = await fetch('https://server-01-v2cx.onrender.com/postassistant/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        });

        if (response.ok) {
          setData(prev => [...prev, submitData]);
          setChatHistory(prev => [...prev, {
            type: 'bot',
            text: `✅ New code item added successfully!\n\n**Question:** ${submitData.question}\n\n**Answer:** ${submitData.answer}\n\n**Category:** ${submitData.category}`
          }]);
          setNewCodeForm({
            question: '',
            answer: '',
            category: 'code'
          });
          setShowNewCodeForm(false);
          setShowAnswerPreview(false);
          speak('New code item added successfully to the database.');
        } else {
          throw new Error('API request failed');
        }
      } catch (error) {
        console.error('Error adding new code item:', error);
        setChatHistory(prev => [...prev, { 
          type: 'bot', 
          text: '❌ Error adding new code item. Please try again or check your connection.' 
        }]);
        speak('Error adding new code item. Please try again.');
      }
    } else {
      setChatHistory(prev => [...prev, { 
        type: 'bot', 
        text: '⚠️ Please fill in both question and answer fields.' 
      }]);
      speak('Please fill in both question and answer fields.');
    }
  };

  // Handle new math form input changes
  const handleNewMathFormChange = (field, value) => {
    setNewMathForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle new math form submission
  const handleNewMathFormSubmit = async (e) => {
    e.preventDefault();
    if (newMathForm.question.trim() && newMathForm.answer.trim()) {
      try {
        const submitData = {
          question: newMathForm.question.trim(),
          answer: newMathForm.answer.trim(),
          category: newMathForm.category || 'math',
          open: false,
          link: '',
          image: '',
          file: ''
        };

        const response = await fetch('https://server-01-v2cx.onrender.com/postassistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        });

        if (response.ok) {
          setData(prev => [...prev, submitData]);
          setChatHistory(prev => [...prev, {
            type: 'bot',
            text: `✅ New math problem added successfully!\n\n**Problem:** ${submitData.question}\n\n**Solution:** ${submitData.answer}\n\n**Category:** ${submitData.category}`
          }]);
          setNewMathForm({
            question: '',
            answer: '',
            category: 'math'
          });
          setShowMathForm(false);
          speak('New math problem added successfully to the database.');
        } else {
          throw new Error('API request failed');
        }
      } catch (error) {
        console.error('Error adding new math problem:', error);
        setChatHistory(prev => [...prev, { 
          type: 'bot', 
          text: '❌ Error adding new math problem. Please try again or check your connection.' 
        }]);
        speak('Error adding new math problem. Please try again.');
      }
    } else {
      setChatHistory(prev => [...prev, { 
        type: 'bot', 
        text: '⚠️ Please fill in both problem and solution fields.' 
      }]);
      speak('Please fill in both problem and solution fields.');
    }
  };

  // Cancel new code form
  const handleCancelNewCodeForm = () => {
    setShowNewCodeForm(false);
    setShowAnswerPreview(false);
    setNewCodeForm({
      question: '',
      answer: '',
      category: 'code'
    });
    setChatHistory(prev => [...prev, { 
      type: 'bot', 
      text: 'New code form cancelled.' 
    }]);
    speak('New code form cancelled.');
  };

  // Cancel new math form
  const handleCancelNewMathForm = () => {
    setShowMathForm(false);
    setNewMathForm({
      question: '',
      answer: '',
      category: 'math'
    });
    setChatHistory(prev => [...prev, { 
      type: 'bot', 
      text: 'New math form cancelled.' 
    }]);
    speak('New math form cancelled.');
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
    if (val.trim().length > 0 && data && Datacount > 0) {
      // Filter data based on selected categories first
      let filteredData = data;
      if (!selectedCategories.includes('all')) {
        filteredData = data.filter(item => {
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

      // Find questions that start with the input (case-insensitive) from filtered data
      const inputLower = val.trim().toLowerCase();
      const filtered = filteredData
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
    // Load stored gender preference if available
    try {
      const storedGender = localStorage.getItem('userGender');
      if (storedGender === 'girl' || storedGender === 'boy') {
        setUserGender(storedGender);
      }
    } catch (_) {}

    // Load stored theme preference if available
    try {
      const storedTheme = localStorage.getItem('isDarkTheme');
      if (storedTheme !== null) {
        const isDark = storedTheme === 'true';
        setIsDarkTheme(isDark);
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (_) {}

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
    if (data && Datacount > 0) {
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
  }, [chatHistory, googleSearchQuery, showCategory, showCodeCategory, showNewCodeForm, thinking]);

  // Scroll to end when assistant finishes responding
  useEffect(() => {
    if (!thinking && chatEndRef.current) {
      setTimeout(() => {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [thinking]);
  if (loading) return <div className='va-loading p-4 w-full h-full flex items-center justify-center'><div className='size-10 flex items-center justify-center animate-spin bg-transparent'><i className='text-xl font-medium ri-loader-4-line'></i></div>We are Loading data...</div>;
  return (
    <div className="voice-assistant h-full w-full flex flex-col justify-end p-2">
      {/* Nav */}
      <div className="va-nav w-full min-h-10 mb-3 px-3 rounded-md flex items-center justify-between">
        <div className='w-fit'><h1 className='va-nav-title text-2xl font-medium'>Gaama.<span className='text-sm font-mediu lowercase'>AI</span></h1></div>
        <div className='w-fit flex items-center gap-2'>

          {/* Categories Button */}
        <button
          type="button"
          onClick={() => setShowCategoryButton(!showCategoryButton)}
          className={`va-category-item ${selectedCategories.length === 1 ? 'selected' : ''} transition-all duration-300 px-2 py-0.5 text-sm cursor-pointer flex items-center gap-0.5`}
        >
          <i className="ri-list-check text-lg"></i>
          Categories ({selectedCategories.length})
        </button>
          
      </div>
      </div>
      {/* Chat History */}
      <div className="flex flex-col gap-2 overflow-y-auto h-full mb-4 scroll-smooth relative">
        {chatHistory.length === 0 && (
          <div className="absolute inset-0 va-nav-title flex items-center justify-center bg-transparent z-20 rounded-md">
            <div className='w-full h-full bg-transparent rounded-md p-2 flex flex-col items-start justify-start gap-2'>
              {error && (
                <div className="va-error px-5 py-1 rounded-md">{error}</div>
              )}
              <p className="va-modal-text px-2 py-1 rounded-md border w-full max-w-[85%]">
              {8 <= 8 
                ? "Sir, I don't have enough knowledge right now to assist you properly. I'm still learning and gathering information. Please be patient with me as I improve." 
                : "Sir, I have a lot of data available. I'm ready to assist you with accurate and helpful information to the best of my ability."}
              </p>
              {!Datacount == 0 && <p className='va-modal-text px-2 py-1 rounded-md border w-full max-w-[85%]'>If you're willing to guide me, I'd be truly grateful. Learning from you would be an excellent opportunity to grow, improve my skills, and contribute more effectively.</p>}
              {!Datacount == 0 && <p className='va-modal-text px-2 py-1 rounded-md border w-full max-w-[85%]'>I'm eager to learn more. I would sincerely appreciate your guidance and support in <NavLink to={`/train`} className='va-link'>helping</NavLink> me to grow.</p>}
              {Datacount <= 99 && <p className='va-modal-text px-2 py-2 rounded-md border w-full max-w-[85%] flex flex-wrap gap-2 leading-4'>I have knowledge on <span>  math, {Questions}</span></p>}
            </div>
          </div>
        )}
        {Array.isArray(chatHistory) && chatHistory.length > 0 && chatHistory.map((chat, index) => (
          <div
            key={index}
            className={`w-full flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[95%] px-3 py-0.5 rounded-lg break-words text-sm ${
                chat.type === 'user'
                  ? 'bg-transparent va-chat-user min-h-10 flex items-center justify-center text-nowrap'
                  : 'bg-transparent va-chat-bot text-wrap py-1 break-words overflow-hidden'
              }`}
            >
              <div className="relative mb-1">
                {chat.text && (
                  <div className="flex flex-col items-start justify-start gap-2">
                    <div className="markdown">
                      {chat.type === 'user' ? (
                        <div className='va-chat-user w-96 text-end text-wrap'>{chat.text} </div>
                      ) : (
                        <div className="text-sm text-wrap">
                          <div className='text-blue-500' >
                            <TypewriterMarkdown
                              text={chat.text}
                              speed={80}
                              delay={index * 100}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {chat.link && (
                <a
                  href={chat.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="va-link underline text-sm block text-wrap"
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
                  className="va-warning underline text-sm block mt-1"
                >
                  📎 Download File
                </a>
              )}

              {/* Copy to clipboard button for assistant messages */}
              {chat.type !== 'user' && (
                <div id='testing' className='flex items-center w-full h-fit bg-transparent gap-2 rounded-md'>
                  {/* Copy button */}
                  <span>
                    <div className="h-fit w-full flex items-center justify-start gap-2 mt-1">
                      <button
                        type="button"
                        className="w-4 bg-transparent cursor-pointer transition-all duration-300 text-zinc-600 hover:text-zinc-200"
                        title="Copy markdown to clipboard"
                        onClick={async () => {
                          if (typeof chat.text === 'string') {
                            let markdownToCopy = chat.text;
                            try {
                              await navigator.clipboard.writeText(markdownToCopy);
                              setCopiedIndex(index);
                              setTimeout(() => setCopiedIndex(null), 1200);
                            } catch (err) {
                              console.error('Failed to copy text: ', err);
                              // Fallback for older browsers
                              const textArea = document.createElement('textarea');
                              textArea.value = markdownToCopy;
                              document.body.appendChild(textArea);
                              textArea.select();
                              try {
                                document.execCommand('copy');
                                setCopiedIndex(index);
                                setTimeout(() => setCopiedIndex(null), 1200);
                              } catch (fallbackErr) {
                                console.error('Fallback copy failed: ', fallbackErr);
                              }
                              document.body.removeChild(textArea);
                            }
                          }
                        }}
                      >
                        <i
                          className={`ri-file-copy-2-line va-copy-button text-xl ${
                            copiedIndex === index ? 'copied' : ''
                          } `}
                        ></i>
                      </button>
                    </div>
                  </span>
                  {/* Open in Google button when data not found */}
                  {chat.googleQuery && (
                    <button
                      type="button"
                      onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(chat.googleQuery)}`, '_blank')}
                      className="va-google-button cursor-pointer text-xs font-semibold rounded-md transition-colors duration-200 flex items-center gap-1"
                      title="Search this on Google"
                    >
                      <i className='ri-google-line text-base'></i>
                    </button>
                  )}
                  
                  {/* Math Form Button - Show when math calculation fails */}
                  {chat.showMathForm && (
                    <button
                      type="button"
                      onClick={() => setShowMathForm(true)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors duration-200 flex items-center gap-1"
                      title="Submit this math problem for review"
                    >
                      <i className="ri-calculator-line"></i>
                      Submit Math Problem
                    </button>
                  )}
                  
                  {/* Category show */}
                  {/* {chat.category && (
                    <span className="text-xs text-zinc-400 px-2 py-1 rounded">
                      {chat.category}
                    </span>
                  )} */}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      {/* Category List */}
      {/* {showCategory && categories.length > 0 && (
        <div className="mb-2 w-full max-h-96 rounded-xl border overflow-auto border-zinc-700 bg-zinc-800 shadow-lg z-50">
          <div className="p-2">
            <div className=" text-zinc-300/70 font-medium text-base">
              I have {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
            </div>
            <div className="flex flex-col gap-0.5">
              {categories.map((cat, idx) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <>
                    <label
                    key={cat + idx}
                    className={`flex items-center gap-2 hover:bg-zinc-700/30 text-start cursor-pointer rounded text-sm transition line-clamp-1 ${
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
                  </>
                );
              })}
            </div>
          </div>
        </div>
      )} */}

      {/* Code Category Display */}
      {showCodeCategory && (
        <div className="mb-2 w-full max-w-[700px] left-1/2 -translate-x-1/2 bottom-15 absolute max-h-96 rounded-xl overflow-auto border border-zinc-700 bg-zinc-800/30 backdrop-blur shadow-lg z-50">
          <div className="p-4">
            <div className="text-zinc-300/70 font-medium text-base mb-3 flex items-center gap-2">
              <i className="ri-code-s-slash-line text-lg"></i>
              Code Category - All Code Related Questions and Answers
            </div>
            <div className="space-y-3">
              {data.filter(item => item.category === 'code').map((item, idx) => (
                <div key={idx} className="border border-zinc-700/50 rounded-lg p-3 bg-zinc-800">
                  <div className="text-zinc-200 font-medium mb-2">
                    <i className="ri-question-line mr-2"></i>
                    {item.question}
                  </div>
                  <div className="text-zinc-400 text-sm whitespace-pre-wrap">
                    {item.answer}
                  </div>
                </div>
              ))}
              {data.filter(item => item.category === 'code').length === 0 && (
                <div className="text-zinc-500 text-center py-4">
                  No code items found. Use /newcode to add your first code item!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Code Form */}
      {showNewCodeForm && (
        <div className="mb-2 w-full max-w-2xl rounded-xl border border-zinc-700 bg-zinc-900 shadow-lg z-50">
          <div className="p-4">
            <div className="text-zinc-300/70 font-medium text-base mb-4 flex items-center gap-2">
              <i className="ri-add-line text-lg"></i>
              Add New Code Item
            </div>
            <form onSubmit={handleNewCodeFormSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">
                  Question:
                </label>
                <input
                  type="text"
                  value={newCodeForm.question}
                  onChange={(e) => handleNewCodeFormChange('question', e.target.value)}
                  placeholder="Enter your question..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent text-zinc-200 placeholder-zinc-500"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">
                  Answer:
                </label>
                <textarea
                  value={newCodeForm.answer}
                  onChange={(e) => handleNewCodeFormChange('answer', e.target.value)}
                  placeholder="Enter your answer (supports markdown)..."
                  rows={6}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent text-zinc-200 placeholder-zinc-500 resize-vertical"
                  required
                />
                {newCodeForm.answer.trim().split(/\s+/).length >= 2 && (
                  <>
                    <button
                      type="button"
                      className="mt-2 flex items-center gap-1 px-1.5 py-1 bg-zinc-800 hover:bg-zinc-700 cursor-pointer text-white rounded transition text-sm"
                      onClick={() => setShowAnswerPreview(true)}
                    >
                      <i className="ri-eye-line"></i>
                    </button>
                    {showAnswerPreview && (
                      <div
                        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur bg-black/60"
                        onClick={() => setShowAnswerPreview(false)}
                      >
                        <div
                          className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 overflow-auto w-full max-w-[700px] shadow-2xl relative"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-100 cursor-pointer"
                            onClick={() => setShowAnswerPreview(false)}
                            type="button"
                          >
                            <i className="ri-close-line text-2xl"></i>
                          </button>
                          <div className="mb-2 text-zinc-300 font-semibold text-lg flex items-center gap-2">
                            <i className="ri-eye-line"></i>
                            {!newCodeForm.question ? 'Markdown Preview' : `${newCodeForm.question}`}
                          </div>
                          <div className="prose prose-invert max-w-none text-zinc-100">
                            <div className='markdown'>
                            <Markdown>{newCodeForm.answer}</Markdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">
                  Category:
                </label>
                <div className="w-fit px-3.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent text-zinc-200 placeholder-zinc-500">{newCodeForm.category}</div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <i className="ri-save-line"></i>
                  Add Code Item
                </button>
                <button
                  type="button"
                  onClick={handleCancelNewCodeForm}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <i className="ri-close-line"></i>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Math Form */}
      {showMathForm && (
        <div className="mb-2 w-full max-w-2xl rounded-xl border border-zinc-700 bg-zinc-900 shadow-lg z-50">
          <div className="p-4">
            <div className="text-zinc-300/70 font-medium text-base mb-4 flex items-center gap-2">
              <i className="ri-calculator-line text-lg"></i>
              Add New Math Problem
            </div>
            <form onSubmit={handleNewMathFormSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">
                  Math Problem:
                </label>
                <input
                  type="text"
                  value={newMathForm.question}
                  onChange={(e) => handleNewMathFormChange('question', e.target.value)}
                  placeholder="Enter the math problem (e.g., 5 × (2 × 34) ÷ 6 + 7 – 8)..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent text-zinc-200 placeholder-zinc-500"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">
                  Solution:
                </label>
                <textarea
                  value={newMathForm.answer}
                  onChange={(e) => handleNewMathFormChange('answer', e.target.value)}
                  placeholder="Enter the step-by-step solution..."
                  rows={6}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent text-zinc-200 placeholder-zinc-500 resize-vertical"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">
                  Category:
                </label>
                <div className="w-fit px-3.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent text-zinc-200 placeholder-zinc-500">{newMathForm.category}</div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <i className="ri-save-line"></i>
                  Add Math Problem
                </button>
                <button
                  type="button"
                  onClick={handleCancelNewMathForm}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <i className="ri-close-line"></i>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Search Consent */}
      {showGoogleButton && googleSearchQuery && (
        <div className="va-google-consent mb-3 w-full rounded-lg p-2 flex items-end justify-between gap-2">
          <div className="va-google-text font-medium text-sm">
            I couldn't find an exact match. Search Google for . . . <br /> "{googleSearchQuery} " ?
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { handleOpenGoogle(); setShowGoogleButton(false); }}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm cursor-pointer"
            >
              <i className='ri-google-fill text-xl'></i>
            </button>
            <button
              type="button"
              onClick={() => { setGoogleSearchQuery(''); setShowGoogleButton(false); }}
              className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-md text-sm cursor-pointer"
            >
              <i className='ri-close-line text-xl'></i>
            </button>
          </div>
        </div>
      )}

      {/* Thinking Indicator */}
      {thinking && (
        <div className={`${isDarkTheme? 'bg-zinc-700' : 'bg-zinc-300 '} text-xs border-zinc-500 border mb-2 w-fit max-w-[95%] px-3 py-1 rounded-lg bg-transparent flex items-center gap-2 absolute bottom-15 left-2 z-50`}>
          <i className="ri-loader-4-line animate-spin" />
          <span>Thinking...</span>
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
            placeholder={`Ask me ${selectedCategories.length === 1 ? 'anything' : 'on this'} ${!selectedCategories.includes('all') ? ` (${selectedCategories.join(', ')})` : ''} ${selectedCategories.length === 1 ? '' : 'topics'}... (or type /code, /newcode, /math, /newmath)`}
            className={`w-full px-6 h-12 ${isDarkTheme? 'bg-zinc-700' : 'bg-zinc-300'} border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-4 focus:ring-zinc-500/20 dark:focus:ring-zinc-400/20 focus:border-transparent transition-all duration-300 ${isDarkTheme ? 'text-zinc-300' : 'text-zinc-700'} placeholder-zinc-400 dark:placeholder-zinc-500 text-sm shadow-md focus:shadow-zinc-400`}
            autoComplete="off"
          />
          
          {/* Show selected categories indicator */}
          
          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="va-suggestions absolute z-50 bottom-full left-0 right-0 mb-3 rounded-xl shadow-2xl h-fit max-h-96 overflow-y-auto backdrop-blur">
              {suggestions.slice(0, 5).map((suggestion, idx) => {
                // Find the original data item to get category info
                const originalItem = data.find(item => item.question === suggestion);
                const category = originalItem?.category || 'general';
                
                return (
                  <div className='w-full'>
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`w-full px-6 py-0 text-left va-suggestion-item transition-colors ${
                        idx === activeSuggestion ? 'active' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between py-2 cursor-pointer">
                        <span title={category || 'general'} className="text-base">{suggestion}</span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <button
          type="submit"
          onClick={() => setallData(false)}
          className={` ${isDarkTheme? 'bg-zinc-700' : 'bg-zinc-300'} size-12 flex items-center justify-center rounded-md cursor-pointer`}
        >
          <i className={`ri-send-plane-fill text-2xl ${message.length > 1 ? 'opacity-95 scale-100' : 'opacity-40 scale-70'} transition-all duration-300 `}></i>
        </button>
        <button
          ref={btnRef}
          onClick={handleStartListening}
          type="button"
          className={`${isDarkTheme? 'bg-zinc-700' : 'bg-zinc-300'} flex items-center cursor-pointer justify-center size-12 rounded-md overflow-hidden font-semibold transition text-xl ${
            listening ? 'va-button-primary' : ''
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
        <div className="va-categories absolute bottom-20 z-30 left-1/2 -translate-x-1/2 w-[90vw] max-w-[650px] mx-auto rounded-lg shadow-lg overflow-hidden">
          <div className="p-3">
            <div className="va-modal-title mb-3 font-medium text-base flex items-center justify-between">
              <span>Categories with Related Content</span>
              {Datacount <= 999 && (
                <NavLink
                  to={`/train`}
                  className="text-blue-400/70 hover:text-blue-400 text-sm font-medium hover:underline"
                >
                  Teach me
                </NavLink>
              )}
            </div>
            
            {/* All Categories Section */}
            <div className="mb-4">
              <label className="flex items-center space-x-3 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes('all')}
                  onChange={() => handleCategoryToggle('all')}
                  className="w-4 h-4 text-blue-600 bg-zinc-700 border-zinc-600 rounded"
                />
                <span className={`va-category-item ${selectedCategories.includes('all') ? 'selected' : ''} text-sm font-semibold`}>
                  📋 All Categories ({Datacount} items)
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
                  <span className={`va-category-item ${selectedCategories.includes(cat) ? 'selected' : ''} text-sm font-semibold`}>
                    📂 {cat}
                  </span>
                </label>
              </div>
            ))}
            
            <div className='mt-3 pt-2 border-t border-gray-300 dark:border-zinc-700'>
              <div className='va-modal-text text-xs'>
                Selected Categories: {selectedCategories.join(', ')}
              </div>
              <div className='va-modal-text text-xs mt-1'>
                <span>
                  Total Items Available:
                  {data.filter(item => selectedCategories.includes(item.category)).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show all data */}
        {allData && (
          <div className="va-all-data w-[97%] max-w-2xl rounded-md p-2 absolute left-1/2 bottom-16 -translate-x-1/2 -translate-y-0 z-50">
            {Array.isArray(data) && data.length > 0 ? (
              <div>
                <div className="va-all-data-title mb-2 text-sm font-semibold">
                  Showing all data ({data.length} items)
                </div>
                <ul className="space-y-0.5 max-h-80 overflow-y-auto text-xs">
                  {data.map((item, idx) => (
                    <li key={idx} className=" rounded py-1 px-2">
                      <div className=" font-medium">Q: {item.question}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="va-all-data-title">No data available.</div>
            )}
          </div>
        )}
    </div>
  );
};
export default VoiceAssistant;