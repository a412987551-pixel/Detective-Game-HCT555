import React, { useState, useEffect, useRef } from 'react';
import { initializeGame, sendPlayerAction } from './services/geminiService';
import { Message, GameState, GameResponse, Character, Evidence } from './types';
import Header from './components/Header';
import NarrativeDisplay from './components/NarrativeDisplay';
import ActionPanel from './components/ActionPanel';
import CharacterBoard from './components/CharacterBoard';
import EvidenceSidebar from './components/EvidenceSidebar';
import GameOverModal from './components/GameOverModal';

// 定義 EvidenceSidebarProps 以便我們可以將 className 傳遞給它
interface EvidenceSidebarProps {
  evidence: Evidence[];
  className?: string; 
}

// 設定結局彈窗延遲時間 (毫秒)
// *** 已從 2500 毫秒調整為 60000 毫秒 (60 秒) ***
const ENDGAME_DELAY_MS = 60000; 

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [turnsLeft, setTurnsLeft] = useState(15);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // New State for Dashboard
  const [characters, setCharacters] = useState<Character[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [locationName, setLocationName] = useState<string>("");

  // State to hold the latest AI response for use in BGM useEffect
  const [gameResponse, setGameResponse] = useState<GameResponse | null>(null);
    
  // State to explicitly track the game resolution status (won or lost)
  const [finalStatus, setFinalStatus] = useState<'won' | 'lost' | null>(null); 

  const [isLoading, setIsLoading] = useState(false);
  const hasInitialized = useRef(false);
  
  // Ref to hold the Audio object
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Ref to track the currently playing file name
  const currentBGM = useRef<string | null>(null); 

  // FIXED: Music playback logic
  useEffect(() => {
    const desiredBGM = gameResponse?.bgm_filename;
    const gameStatus = gameResponse?.game_status;

    // 1. 檢查遊戲是否應該播放懸疑音樂
    if (desiredBGM === "懸疑音樂.mp3" && gameStatus === 'playing') {
        
        const shouldStartNewAudio = currentBGM.current !== desiredBGM;

        if (shouldStartNewAudio) { 
            
            // 停止舊的音樂 (如果有)
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            // 建立新的 Audio 物件並播放
            const newAudio = new Audio(`/${desiredBGM}`);
            newAudio.loop = true; 
            newAudio.volume = 0.5;

            newAudio.play().catch(error => {
                console.warn("Audio auto-playback blocked. User interaction needed to start music. Error:", error);
            });

            // 更新兩個 Ref，記錄正在播放的歌曲
            audioRef.current = newAudio;
            currentBGM.current = desiredBGM; 
        } else if (audioRef.current && audioRef.current.paused) {
            // 新增修復點：如果歌曲名稱沒變，但目前是暫停狀態 (瀏覽器阻擋)，則嘗試恢復播放
            audioRef.current.play().catch(error => {
                console.warn("Retrying playback failed after interaction:", error);
            });
        }

    } else if (gameStatus !== 'playing') {
        // 遊戲結束時 (won/lost/idle)，停止音樂
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            currentBGM.current = null; 
        }
    }
  }, [gameResponse]); 

  const startGame = async () => {
    setIsLoading(true);
    setMessages([]);
    setGameState(GameState.PLAYING);
    setTurnsLeft(15);
    setSuggestions([]);
    setCharacters([]);
    setEvidence([]);
    setGameResponse(null);
    // 重設結局狀態
    setFinalStatus(null);
    
    try {
      const response = await initializeGame();
      handleGameResponse(response);
      setGameResponse(response); // 儲存完整回應
    } catch (error) {
      console.error(error);
      setGameState(GameState.ERROR);
      addSystemMessage("Error initializing the Game Master. Please check your API key or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasInitialized.current) {
        setTimeout(() => {
            startGame();
        }, 100);
        hasInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGameResponse = (response: GameResponse) => {
    
    // START: 確保 resolution 故事被提取
    let finalNarrative = response.narrative;
    if (response.game_status === 'won' || response.game_status === 'lost') {
        finalNarrative = response.resolution || response.narrative;
    }
    // END: 確保 resolution 故事被提取

    // Add Bot Message (使用 finalNarrative)
    const botMsg: Message = {
      id: Date.now().toString(),
      role: 'model',
      text: finalNarrative,
    };
    setMessages((prev) => [...prev, botMsg]);

    // Update Dashboard State
    setTurnsLeft(response.turns_left);
    setSuggestions(response.suggestions || []);
    setCharacters(response.characters || []);
    setEvidence(response.evidence || []);
    setLocationName(response.location_name || "Unknown");
    
    // 關鍵修復點：如果遊戲結束，設定 finalStatus，但延遲彈出 modal (60秒)
    if (response.game_status === 'won') {
      setFinalStatus('won'); // 精確記錄贏了
      // 延遲設定 GAME_OVER 狀態，給予玩家閱讀時間 (60秒)
      setTimeout(() => {
        setGameState(GameState.GAME_OVER);
      }, ENDGAME_DELAY_MS); 
    } else if (response.game_status === 'lost' || response.turns_left <= 0) {
      setFinalStatus('lost'); // 精確記錄輸了
      // 延遲設定 GAME_OVER 狀態 (60秒)
      setTimeout(() => {
        setGameState(GameState.GAME_OVER);
      }, ENDGAME_DELAY_MS); 
    }
  };

  const handleAction = async (actionText: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: actionText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await sendPlayerAction(actionText);
      handleGameResponse(response);
      setGameResponse(response); // 儲存完整回應
    } catch (error) {
      console.error(error);
      addSystemMessage("The Game Master is silent (Network Error). Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const addSystemMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: 'model', text: `**SYSTEM:** ${text}` },
    ]);
  };

  const handleRestart = () => {
      setGameState(GameState.IDLE);
      hasInitialized.current = false;
      setFinalStatus(null); // 重設結局狀態
      startGame();
  };

  // 取得最後的敘事內容 (現在會是完整的 resolution 故事)
  const lastNarrative = messages[messages.length - 1]?.text || "結局故事遺失。";
  
  // 確保 modal 使用 finalStatus，並只有在 finalStatus 存在時才渲染
  const modalStatus = finalStatus || 'lost';

  return (
    // 最外層容器：確保背景透明
    <div className="flex h-screen bg-transparent text-slate-300 overflow-hidden font-sans selection:bg-red-900 selection:text-white">
      
      {/* Sidebar (Desktop Only) - Evidence */}
      <div className="hidden md:block h-full shrink-0">
         {/* 將半透明背景類別傳遞給 EvidenceSidebar */}
         <EvidenceSidebar evidence={evidence} className="bg-black/80 backdrop-blur-sm" /> 
      </div>

      {/* Main Content Area */}
      {/* 設定 Main Content Area 為半透明容器 */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-black/70 backdrop-blur-sm rounded-xl m-2 md:m-4 shadow-2xl"> 
        <Header turnsLeft={turnsLeft} location={locationName} />
        
        {/* Character Board Panel */}
        <div className="z-10">
           <CharacterBoard characters={characters} />
        </div>

        {/* Main Narrative Scroll Area - (NarrativeDisplay 元件內部可能需要調整) */}
        <NarrativeDisplay messages={messages} isTyping={isLoading} />

        {/* Error Banner */}
        {gameState === GameState.ERROR && (
          <div className="bg-red-900/80 border-t border-b border-red-500 text-red-200 p-2 text-center text-sm backdrop-blur">
            Connection lost.
            <button onClick={startGame} className="ml-4 underline">重新開始</button>
          </div>
        )}

        <ActionPanel 
          onAction={handleAction} 
          suggestions={suggestions} 
          isLoading={isLoading}
          gameStatus={gameState === GameState.GAME_OVER ? 'finished' : 'playing'}
        />
      </div>

      {/* Modal: 只有當 finalStatus 設置後且 gameState 為 GAME_OVER 時才顯示 */}
      {gameState === GameState.GAME_OVER && finalStatus && (
        <GameOverModal 
          // 傳遞完整的 resolution 故事給 modal
          lastNarrative={lastNarrative}
          status={modalStatus} // 使用精確記錄的狀態
          onRestart={handleRestart} 
        />
      )}
    </div>
  );
};

export default App;
