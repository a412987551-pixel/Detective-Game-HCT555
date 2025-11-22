import { GoogleGenAI, Chat, Type, Schema } from "@google/genai";
import { GameResponse } from "../types";

// ↓↓↓↓↓ 最終修復區塊：直接寫入您的 API 金鑰，並移除錯誤的環境變數判斷 ↓↓↓↓↓
const API_KEY = "AIzaSyB6J-9inFy-dg3aa0f81tJ0zVlCAz1sQZw"; 
const ai = new GoogleGenAI({ apiKey: API_KEY });
// ↑↑↑↑↑ 最終修復區塊 ↑↑↑↑↑

// Define the schema for the structured output
const gameSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    narrative: {
      type: Type.STRING,
      description: "劇情的推進描述，包含對話、環境描寫。使用 Markdown 格式。請以繁體中文撰寫。",
    },
    resolution: { 
      type: Type.STRING,
      description: "當 game_status 為 'won' 或 'lost' 時，必須在這裡提供一個詳細、戲劇性的結局總結。如果遊戲正在進行 (playing)，則此欄位留空。",
    },
    location_name: {
      type: Type.STRING,
      description: "當前所在的具體地點名稱，例如：'餐飲三勤教室'、'走廊'。",
    },
    bgm_filename: { 
      type: Type.STRING,
      enum: ["懸疑音樂.mp3"], 
      description: "遊戲進行中，回傳應播放的背景音樂檔案名稱。",
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 個簡短明確的下一步行動建議。",
    },
    hotspots: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING, description: "可互動物件的名稱，例如：'血跡'、'廚刀'。" },
          action_text: { type: Type.STRING, description: "點擊此物件時，玩家會執行的預設行動，例如：'檢查血跡'。" },
        },
        required: ["id", "name", "action_text"],
      },
      description: "當前場景中，玩家可以點擊互動的關鍵證物或區域列表（請列出 3-5 個）。",
    },
    turns_left: {
      type: Type.INTEGER,
      description: "剩餘回合數。",
    },
    game_status: {
      type: Type.STRING,
      enum: ["playing", "won", "lost"],
    },
    characters: {
      type: Type.ARRAY,
      description: "所有相關角色的列表及其當前狀態。",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING, description: "請只填寫角色全名，不要加括號或稱謂。" },
          role: { type: Type.STRING, description: "角色身分，如'班長'、'目擊者'。" },
          status: { type: Type.STRING, enum: ['alive', 'deceased', 'missing', 'arrested'] },
          is_interrogating: { type: Type.BOOLEAN, description: "如果玩家正在與此人對話或調查此人，設為 true。" },
          description: { type: Type.STRING, description: "簡短的一句話描述。" },
          avatar_keyword: { type: Type.STRING, enum: ['man', 'woman', 'old', 'young', 'scar', 'singer'], description: "用於生成頭像的關鍵字。" }
        },
        required: ["id", "name", "role", "status", "is_interrogating", "avatar_keyword"]
      }
    },
    evidence: {
      type: Type.ARRAY,
      description: "目前玩家已發現並持有的所有線索與證物列表。",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          icon_type: { type: Type.STRING, enum: ['document', 'weapon', 'item', 'place'] }
        },
        required: ["id", "name", "description", "icon_type"]
      }
    }
  },
  required: ["narrative", "resolution", "location_name", "bgm_filename", "suggestions", "hotspots", "turns_left", "game_status", "characters", "evidence"],
};

const SYSTEM_INSTRUCTION = `
你是一位「現代校園懸疑謀殺案」的遊戲主持人 (GM)。
你的目標是透過文字與結構化數據，為玩家呈現一個緊張、寫實且恐怖的校園推理遊戲。

【遊戲設定】
1.  **主題**：滬江高中餐飲三勤命案。
2.  **風格**：現代校園、血腥、恐怖、懸疑。
3.  **玩家角色**：許淑媚 (餐飲三勤的班導師，女性，試圖保護學生並找出真相)。
4.  **目標**：在 15 回合內，找出殺死「壽司」的**殺手**、**兇器名稱**和**殺機**。

【登場人物 (請務必在 characters 列表中準確回傳以下姓名)】
- 壽司 (死者)：女性。慘死在教室中。
- 王洧邦 (班長/潛在嫌疑人)：男性。
- 許晉嘉 (同學A/目擊者/潛在嫌疑人)：男性。
- 張瑞麟 (同學B/目擊者/潛在嫌疑人)：男性。
- 戴沂臻 (同學C/目擊者/潛在嫌疑人)：女性。
- 林主安 (同學/證人)：男性。
- 小小 (校外人士/證人)：男性。
- 許淑媚 (玩家)：老師。

【GM 行為規範】
1.  **語言**：全繁體中文 (Traditional Chinese，台灣用語)。
2.  **敘事**：
    -   **【難度調整：普通偏困難模式】**：請稍微提高遊戲難度。
        -   **角色反應：** 所有嫌疑人（王洧邦、許晉嘉、張瑞麟、戴沂臻）對玩家的詢問必須更加**慌張、迴避、撒謊或提供誤導性資訊**。
        -   **線索描述：** 重要的線索和證據描述必須**模糊且不完整**，需要玩家結合多個線索才能推出結論。
        -   **環境干擾：** 案發現場和周圍環境中充滿大量**無關緊要的細節**和干擾物，增加玩家篩選資訊的難度。
    -   始終維持命案現場的**緊張氛圍**與**教室的細節**（例如：黑板上血寫的HELP、地上的血跡、空氣中的鐵鏽味、慌張哭泣的學生）。
    -   根據玩家行動描述結果，並推進劇情。
3.  **音樂控制 (BGM)**：
    - **在遊戲進行中 (game_status: 'playing')，'bgm_filename' 必須永遠回傳 '懸疑音樂.mp3'**。
4.  **遊戲結局 (FINAL REVEAL)**：
    -   當玩家正確指認兇手、兇器和殺機 (game_status 轉為 'won')，或回合數用盡 (game_status 轉為 'lost') 時：
    -   **必須在 'resolution' 欄位中**，提供一段詳細、戲劇性的結局揭露。
    -   **勝利結局**：揭露兇手的完整動機、犯案過程、以及他們被抓捕的細節。
    -   **失敗結局**：總結玩家錯失的關鍵線索，並描述錯失真相導致的後果。
5.  **互動提示 (Hotspots)**：
    - 在 'hotspots' 欄位中，列出 3-5 個當前地點中**肉眼可見**、**尚未被調查**且**具有潛在線索**的關鍵物件或區域。
    - 玩家點擊這些物件時，將觸發新的行動回合（例如：點擊物件'血跡'，玩家行動是'仔細檢查血跡'）。
6.  **狀態維護**：
    -   **characters**: 每次回覆都要包含上述所有角色。
        -   死者「壽司」的 **name 欄位必須精確為 "壽司"**，**不得自行命名**。status 必須是 'deceased'。
        -   **所有角色的 name 欄位必須精確匹配上述列表，不得自行增減或修改姓名。**
    -   **evidence**: 隨著調查，將發現的線索（如沾血的廚刀、食譜筆記、手機訊息）加入此陣列。
7.  **開場設定**：
    -   地點：滬江高中餐飲三勤教室。
    -   場景：許淑媚老師剛踏入教室，看見令人震驚的血腥一幕。黑板上可能有死者留下的血痕或求救訊號。學生們驚慌失措。
    - **初始回合數：** **'turns_left' 欄位在第一次回覆時，必須回傳 15。**

請記住，你是電腦系統，也是說書人。引導許淑媚老師揭開真相。
`;

let chatSession: Chat | null = null;

const handleGeminiResponse = async (message: string): Promise<GameResponse> => {
  if (!chatSession) {
    throw new Error("Game session not initialized.");
  }

  const response = await chatSession.sendMessage({ message });

  if (!response.text) {
    throw new Error("No response from AI");
  }
  // 直接解析 JSON
  return JSON.parse(response.text) as GameResponse;
};

export const initializeGame = async (): Promise<GameResponse> => {
  try {
    chatSession = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: gameSchema,
      },
    });
    // 首次初始化
    return handleGeminiResponse("初始化案件。描述許淑媚老師剛踏入案發現場（餐飲三勤教室）的恐怖場景，並列出所有在場學生。");
  } catch (error) {
    console.error("Failed to initialize game:", error);
    throw error;
  }
};

export const sendPlayerAction = async (action: string): Promise<GameResponse> => {
  return handleGeminiResponse(action);
};
