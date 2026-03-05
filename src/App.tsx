import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  History, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  RotateCcw, 
  ChevronRight, 
  User, 
  ListOrdered, 
  Timer as TimerIcon,
  ArrowLeft,
  Calendar,
  LogOut,
  Sparkles,
  Send,
  Loader2,
  X
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import questionBankRaw from './data/questions.json';
import { Question, TestResult, QuizSettings, QuestionBank, TestType } from './types';
import { getSolutionStream, chatWithAIStream } from './services/geminiService';

const questionBank = questionBankRaw as QuestionBank;

// --- Utilities ---
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// --- AI Panel Component ---
const AISolutionPanel: React.FC<{
  question: Question;
  context?: string;
  onClose: () => void;
}> = ({ question, context, onClose }) => {
  const [solution, setSolution] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "model"; parts: { text: string }[] }[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSolution = async () => {
      try {
        setLoading(true);
        const fullText = await getSolutionStream(
          question.question, 
          question.options, 
          context,
          (chunk) => {
            if (isMounted) {
              setChatHistory([{ role: "model", parts: [{ text: chunk }] }]);
            }
          }
        );
        if (isMounted) {
          setSolution(fullText || "No solution found.");
        }
      } catch (err) {
        if (isMounted) {
          setSolution("Failed to get solution. Please check your API key.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchSolution();
    return () => { isMounted = false; };
  }, [question, context]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isTyping) return;

    const userMsg = userInput.trim();
    setUserInput("");
    const newHistory = [...chatHistory, { role: "user" as const, parts: [{ text: userMsg }] }];
    setChatHistory(newHistory);
    setIsTyping(true);

    try {
      let currentResponse = "";
      await chatWithAIStream(newHistory, userMsg, (chunk) => {
        currentResponse = chunk;
        setChatHistory([...newHistory, { role: "model", parts: [{ text: chunk }] }]);
      });
    } catch (err) {
      setChatHistory(prev => [...prev, { role: "model", parts: [{ text: "Error communicating with AI." }] }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
    >
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={20} />
          <h3 className="font-bold">AI Tutor Solution</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-400">
            <Loader2 className="animate-spin" size={48} />
            <p className="font-medium">Thinking of a solution...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((chat, idx) => (
              <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-4 rounded-2xl shadow-sm ${
                  chat.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                }`}>
                  <div className="markdown-body text-sm prose prose-slate max-w-none">
                    <Markdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {chat.parts[0].text}
                    </Markdown>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2 text-slate-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs font-medium">AI is typing...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask a follow-up question..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!userInput.trim() || isTyping}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// --- Components ---

const StartScreen: React.FC<{ 
  onStart: (settings: QuizSettings) => void;
  onViewHistory: () => void;
}> = ({ onStart, onViewHistory }) => {
  const [name, setName] = useState('');
  const [count, setCount] = useState(10);
  const [duration, setDuration] = useState<number | null>(5);
  const [testType, setTestType] = useState<TestType>('numerical');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStart({ userName: name, questionCount: count, duration, testType });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md w-full glass-card rounded-3xl p-8 space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Pro MCQ Test</h1>
        <p className="text-slate-500">Test your knowledge with our professional platform</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <User size={16} /> Your Name
          </label>
          <input 
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <ListOrdered size={16} /> Test Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTestType('numerical')}
              className={`px-4 py-3 rounded-xl border-2 font-bold transition-all ${
                testType === 'numerical' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                  : 'border-slate-100 text-slate-500 hover:border-slate-200'
              }`}
            >
              Numerical
            </button>
            <button
              type="button"
              onClick={() => setTestType('verbal')}
              className={`px-4 py-3 rounded-xl border-2 font-bold transition-all ${
                testType === 'verbal' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                  : 'border-slate-100 text-slate-500 hover:border-slate-200'
              }`}
            >
              Verbal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <ListOrdered size={16} /> Questions
            </label>
            <select 
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              {[5, 10, 20, 50, 100, 200, 500].map(n => (
                <option key={n} value={n}>{n} Questions</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TimerIcon size={16} /> Duration
            </label>
            <select 
              value={duration === null ? 'none' : duration}
              onChange={(e) => setDuration(e.target.value === 'none' ? null : Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="none">No Duration</option>
              {[2, 5, 10, 15, 20, 30, 45, 60].map(n => (
                <option key={n} value={n}>{n} Minutes</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group"
        >
          Start Test <Play size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </form>

      <div className="pt-4 border-t border-slate-100">
        <button 
          onClick={onViewHistory}
          className="w-full text-slate-500 hover:text-indigo-600 font-medium py-2 transition-colors flex items-center justify-center gap-2"
        >
          <History size={18} /> View Past Performance
        </button>
      </div>
    </motion.div>
  );
};

const QuizScreen: React.FC<{
  settings: QuizSettings;
  onComplete: (result: Omit<TestResult, 'id' | 'date'>) => void;
}> = ({ settings, onComplete }) => {
  const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.duration ? settings.duration * 60 : 0);
  const [isFinished, setIsFinished] = useState(false);
  const [aiQuestion, setAiQuestion] = useState<Question | null>(null);

  // Reset AI panel when moving to next group
  useEffect(() => {
    setAiQuestion(null);
  }, [currentGroupIdx]);

  // Group and select questions
  const questionGroups = useMemo(() => {
    let atomicGroups: { context?: string; questions: Question[] }[] = [];

    if (settings.testType === 'verbal') {
      const allVerbal = [...questionBank.Verbal_Questions];
      const allPassage = [...questionBank.passage_based_questions];
      atomicGroups = [
        ...allVerbal.map(q => ({ questions: [q] })),
        ...allPassage.map(g => ({ context: g.context, questions: g.questions }))
      ];
    } else {
      const allGeneral = [...questionBank.General_Questions];
      const allContext = [...questionBank.Context_Based_Questions];
      
      atomicGroups = [
        ...allGeneral.map(q => ({ questions: [q] })),
        ...allContext.map(g => ({ context: g.context, questions: g.questions }))
      ];
    }

    const shuffledGroups = shuffleArray(atomicGroups);
    const selected: { context?: string; questions: Question[] }[] = [];
    let count = 0;
    
    for (const group of shuffledGroups) {
      if (count >= settings.questionCount) break;
      selected.push(group);
      count += group.questions.length;
    }
    
    return selected;
  }, [settings.questionCount, settings.testType]);

  const totalQuestions = useMemo(() => 
    questionGroups.reduce((acc, g) => acc + g.questions.length, 0), 
  [questionGroups]);

  const currentGroup = questionGroups[currentGroupIdx];

  const handleFinish = useCallback(() => {
    if (isFinished) return;
    setIsFinished(true);
    
    let timeTaken;
    if (settings.duration) {
      timeTaken = settings.duration * 60 - timeLeft;
    } else {
      timeTaken = timeLeft; // timeLeft acts as elapsed time when duration is null
    }
    
    onComplete({
      userName: settings.userName,
      totalQuestions,
      correctAnswers: score,
      score: score,
      percentage: Math.round((score / totalQuestions) * 100),
      timeTaken
    });
  }, [isFinished, settings, timeLeft, score, totalQuestions, onComplete]);

  useEffect(() => {
    if (settings.duration && timeLeft <= 0) {
      handleFinish();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => settings.duration ? prev - 1 : prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleFinish, settings.duration]);

  const handleSelect = (questionId: number, optionIdx: number, correctAnswer: string) => {
    if (answers[questionId] !== undefined || isFinished) return;
    
    const targetQuestion = currentGroup.questions.find(q => q.id === questionId)!;
    const optionKey = Object.keys(targetQuestion.options)[optionIdx];
    const isCorrect = optionKey === correctAnswer;
    
    setAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
    if (isCorrect) setScore(prev => prev + 1);

    // If it's a single question group, auto-advance
    if (currentGroup.questions.length === 1) {
      setTimeout(() => {
        if (currentGroupIdx < questionGroups.length - 1) {
          setCurrentGroupIdx(prev => prev + 1);
        } else {
          handleFinish();
        }
      }, 1500);
    }
  };

  const allAnsweredInGroup = currentGroup.questions.every(q => answers[q.id] !== undefined);

  const timerColor = !settings.duration ? 'text-indigo-600' : timeLeft < 30 ? 'text-red-500' : timeLeft < 60 ? 'text-amber-500' : 'text-indigo-600';

  return (
    <div className="max-w-3xl w-full space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center glass-card px-6 py-4 rounded-2xl">
        <div className="flex gap-8 items-center w-full md:w-auto justify-between md:justify-start">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</p>
            <p className="text-lg font-bold text-slate-700">Group {currentGroupIdx + 1} of {questionGroups.length}</p>
          </div>
          <div className="text-right md:text-left space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {settings.duration ? 'Time Remaining' : 'Time Elapsed'}
            </p>
            <div className={`text-2xl font-mono font-bold flex items-center gap-2 ${timerColor}`}>
              <Clock size={20} /> {formatTime(timeLeft)}
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => {
            if (window.confirm('Are you sure you want to end the test early? Your current progress will be saved.')) {
              handleFinish();
            }
          }}
          className="w-full md:w-auto px-6 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-bold transition-all flex items-center justify-center gap-2 border border-red-100"
        >
          <LogOut size={18} /> End Test
        </button>
      </div>

      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
        <motion.div 
          className="bg-indigo-600 h-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentGroupIdx + 1) / questionGroups.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentGroupIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          {currentGroup.context && (
            <div className="glass-card rounded-3xl p-8 border-l-4 border-indigo-500 bg-indigo-50/30">
              <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">
                {settings.testType === 'verbal' ? 'Passage' : 'Context'}
              </h3>
              <p className="text-lg text-slate-700 leading-relaxed italic">
                {currentGroup.context}
              </p>
            </div>
          )}

          {currentGroup.questions.map((q, qIdx) => (
            <div key={q.id} className="glass-card rounded-3xl p-8 space-y-6 relative overflow-hidden group/card">
              <div className="flex justify-between items-start gap-4">
                <h2 className="text-xl font-bold text-slate-800 leading-tight">
                  {currentGroup.questions.length > 1 ? `${qIdx + 1}. ` : ''}{q.question}
                </h2>
                <button 
                  onClick={() => setAiQuestion(q)}
                  className="shrink-0 p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-2 text-xs font-bold"
                  title="Get AI Solution"
                >
                  <Sparkles size={14} /> <span className="hidden sm:inline">Get Solution</span>
                </button>
              </div>

              <div className="grid gap-3">
                {Object.entries(q.options).map(([key, option], idx) => {
                  const selectedIdx = answers[q.id];
                  const isSelected = selectedIdx === idx;
                  const isCorrect = key === q.answer;
                  const showResult = selectedIdx !== undefined;

                  let btnClass = "w-full p-4 text-left rounded-xl border-2 font-medium transition-all flex justify-between items-center group ";
                  
                  if (!showResult) {
                    btnClass += "border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700";
                  } else {
                    if (isCorrect) {
                      btnClass += "border-emerald-500 bg-emerald-50 text-emerald-700";
                    } else if (isSelected && !isCorrect) {
                      btnClass += "border-red-500 bg-red-50 text-red-700";
                    } else {
                      btnClass += "border-slate-100 text-slate-400 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={key}
                      disabled={showResult}
                      onClick={() => handleSelect(q.id, idx, q.answer)}
                      className={btnClass}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold uppercase text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                          {key}
                        </span>
                        <span className="text-sm">{option}</span>
                      </div>
                      {showResult && isCorrect && <CheckCircle2 size={18} className="text-emerald-500" />}
                      {showResult && isSelected && !isCorrect && <XCircle size={18} className="text-red-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {currentGroup.questions.length > 1 && allAnsweredInGroup && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                if (currentGroupIdx < questionGroups.length - 1) {
                  setCurrentGroupIdx(prev => prev + 1);
                } else {
                  handleFinish();
                }
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              Next Group <ChevronRight size={20} />
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {aiQuestion && (
          <AISolutionPanel 
            question={aiQuestion} 
            context={currentGroup.context} 
            onClose={() => setAiQuestion(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ResultScreen: React.FC<{
  result: TestResult;
  onRestart: () => void;
}> = ({ result, onRestart }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl w-full glass-card rounded-3xl p-8 space-y-8 text-center"
    >
      <div className="space-y-4">
        <div className="inline-flex p-4 rounded-full bg-indigo-100 text-indigo-600 mb-2">
          <Trophy size={48} />
        </div>
        <h1 className="text-4xl font-bold text-slate-900">Test Completed!</h1>
        <p className="text-xl text-slate-500">Great job, <span className="font-bold text-indigo-600">{result.userName}</span>!</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Score', value: `${result.score}/${result.totalQuestions}`, icon: <ListOrdered size={16} /> },
          { label: 'Percentage', value: `${result.percentage}%`, icon: <CheckCircle2 size={16} /> },
          { label: 'Time Taken', value: formatTime(result.timeTaken), icon: <Clock size={16} /> },
          { label: 'Correct', value: result.correctAnswers, icon: <CheckCircle2 size={16} /> },
        ].map((item, i) => (
          <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center justify-center gap-1 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
              {item.icon} {item.label}
            </div>
            <div className="text-xl font-bold text-slate-800">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="pt-6 space-y-4">
        <button 
          onClick={onRestart}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw size={18} /> Take Another Test
        </button>
      </div>
    </motion.div>
  );
};

const HistoryScreen: React.FC<{
  history: TestResult[];
  onBack: () => void;
}> = ({ history, onBack }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-3xl w-full glass-card rounded-3xl p-8 space-y-6"
    >
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Performance History</h2>
        <div className="w-10" />
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {history.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <History size={48} className="mx-auto mb-4 opacity-20" />
            <p>No test attempts yet. Start your first test!</p>
          </div>
        ) : (
          history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item) => (
            <div key={item.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{item.userName}</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} /> {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-slate-500 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Clock size={14} /> {formatTime(item.timeTaken)}</span>
                  <span className="flex items-center gap-1"><ListOrdered size={14} /> {item.totalQuestions} Questions</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-lg font-bold text-indigo-600">{item.percentage}%</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{item.score}/{item.totalQuestions} Correct</div>
                </div>
                <div className={`h-12 w-1.5 rounded-full ${item.percentage >= 70 ? 'bg-emerald-500' : item.percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} />
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

// --- Main App ---

type Screen = 'START' | 'QUIZ' | 'RESULT' | 'HISTORY';

export default function App() {
  const [screen, setScreen] = useState<Screen>('START');
  const [settings, setSettings] = useState<QuizSettings | null>(null);
  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const [history, setHistory] = useState<TestResult[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('quiz_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const handleStart = (newSettings: QuizSettings) => {
    setSettings(newSettings);
    setScreen('QUIZ');
  };

  const handleQuizComplete = (resultData: Omit<TestResult, 'id' | 'date'>) => {
    const fullResult: TestResult = {
      ...resultData,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString()
    };
    
    const newHistory = [...history, fullResult];
    setHistory(newHistory);
    localStorage.setItem('quiz_history', JSON.stringify(newHistory));
    setLastResult(fullResult);
    setScreen('RESULT');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from),_transparent),radial-gradient(circle_at_bottom_left,_var(--tw-gradient-to),_transparent)] from-indigo-50 via-slate-50 to-indigo-50">
      <AnimatePresence mode="wait">
        {screen === 'START' && (
          <StartScreen 
            key="start"
            onStart={handleStart} 
            onViewHistory={() => setScreen('HISTORY')} 
          />
        )}
        
        {screen === 'QUIZ' && settings && (
          <QuizScreen 
            key="quiz"
            settings={settings} 
            onComplete={handleQuizComplete} 
          />
        )}

        {screen === 'RESULT' && lastResult && (
          <ResultScreen 
            key="result"
            result={lastResult} 
            onRestart={() => setScreen('START')} 
          />
        )}

        {screen === 'HISTORY' && (
          <HistoryScreen 
            key="history"
            history={history} 
            onBack={() => setScreen('START')} 
          />
        )}
      </AnimatePresence>

      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>
    </div>
  );
}
