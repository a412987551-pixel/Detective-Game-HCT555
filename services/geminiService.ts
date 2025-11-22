import { GoogleGenAI, Chat, Type, Schema } from "@google/genai";
import { GameResponse } from "../types";

// ↓↓↓↓↓ 關鍵修復區塊：請在此處直接寫入您的 API 金鑰，繞過 Vercel 環境變數問題 ↓↓↓↓↓
// 請將 YOUR_REAL_API_KEY 替換成您的真實金鑰！
const API_KEY = "AIzaSyCnntR6EEtleHW_pscZaf4qkfZKCxu3dhU"; // <<<<<<< 請替換此處！

if (!API_KEY || API_KEY === "YOUR_REAL_API_KEY") {
	console.error("API_KEY is missing or the placeholder is still present. Please insert your key directly into the geminiService.ts file.");
}
// ↑↑↑↑↑ 關鍵修復區塊 ↑↑↑↑↑

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Define the schema for the structured output
const gameSchema: Schema = {
	type: Type.OBJECT,
	properties: {
		narrative: {
			type: Type.STRING,
			description: "劇情的推進描述，包含對話、環境描寫。使用 Markdown 格式。請以繁體中文撰寫。",
		},
		location_name: {
			type: Type.STRING,
			description: "當前所在的具體地點名稱，例如：'餐飲三勤教室'、'走廊'。",
		},
		suggestions: {
			type: Type.ARRAY,
			items: { type: Type.STRING },
			description: "3 個簡短的建議行動，例如：'詢問王大明在幹什麼'、'檢查血跡來源'。不要包含序號。",
		},
		turns_left: {
			type: Type.INTEGER,
			description: "剩餘的調查回合數。每次行動應減 1。",
		},
		game_status: {
			type: Type.STRING,
			enum: ['playing', 'won', 'lost'],
			description: "遊戲狀態：'playing' (進行中), 'won' (成功破案), 'lost' (失敗或回合用盡)。",
		},
		resolution: {
			type: Type.STRING,
			description: "【**僅在 game_status 為 'won' 或 'lost' 時使用**】提供一個 200 字以上的最終故事，詳細解釋謀殺案的真相、動機和最終結果。請務必在結局時填寫此欄位，讓玩家能看到完整故事。",
		},
		characters: {
			type: Type.ARRAY,
			items: {
				type: Type.OBJECT,
				properties: {
					name: { type: Type.STRING },
					status: { type: Type.STRING, enum: ['suspect', 'witness', 'victim', 'deceased', 'clear'] },
					notes: { type: Type.STRING, description: "簡短的當前狀態/資訊，例如：'神色慌張'、'不在場證明待確認'。" },
				},
				propertyOrdering: ['name', 'status', 'notes'],
			},
			description: "當前所有角色（包含死者）。每次回覆都必須包含所有角色。",
		},
		evidence: {
			type: Type.ARRAY,
			items: {
				type: Type.OBJECT,
				properties: {
					name: { type: Type.STRING },
					description: { type: Type.STRING },
					location: { type: Type.STRING },
				},
				propertyOrdering: ['name', 'description', 'location'],
			},
			description: "迄今為止發現的所有關鍵線索。",
		},
		bgm_filename: {
			type: Type.STRING,
			enum: ["懸疑音樂.mp3", "勝利音樂.mp3", "失敗音樂.mp3", "無"],
			description: "當前場景應播放的音樂檔名。遊戲開始和進行中為 '懸疑音樂.mp3'。破案為 '勝利音樂.mp3'。失敗為 '失敗音樂.mpd'。只有在遊戲結束時才改變音樂。",
		},
	},
	required: ['narrative', 'location_name', 'suggestions', 'turns_left', 'game_status', 'characters', 'evidence', 'bgm_filename'],
	propertyOrdering: [
		'narrative',
		'location_name',
		'turns_left',
		'game_status',
		'resolution',
		'suggestions',
		'characters',
		'evidence',
		'bgm_filename',
	],
};


const SYSTEM_INSTRUCTION = `
你是一名叫做「遊戲大師 (Game Master)」的 AI，負責主持一場偵探解謎遊戲。你的所有回覆都必須是結構化 JSON 格式，並嚴格遵循提供的 JSON Schema。

**遊戲設定：**
許淑媚老師，現年 30 歲，滬江高中餐飲科老師，也是本次命案的主角偵探。
- **目標**：在 15 回合內，找出在餐飲三勤教室內被殺害的學生「壽司」的真兇。
- **角色列表** (每次回覆必須包含所有角色)：
  - 壽司 (死者)
  - 王大明 (嫌疑人，與壽司有金錢糾紛)
  - 李小花 (嫌疑人，壽司的前女友)
  - 陳小美 (嫌疑人，目擊證人)

**輸出要求** (Output Requirements)：
1. 嚴格輸出單一 JSON 物件，不能包含額外的文字或 Markdown 格式。
2. **回合數**：遊戲開始時為 15 回合。玩家每行動一次，turns_left 必須減少 1。
3. **狀態維護**：
    - **characters**: 每次回覆都要包含上述所有角色。
        - 死者「壽司」的 status 必須是 'deceased'。
        - 姓名必須精確匹配上述列表。
    - **evidence**: 隨著調查，將發現的線索（如沾血的廚刀、食譜筆記、手機訊息）加入此陣列。
4. **開場設定**：
    - 地點：滬江高中餐飲三勤教室。
    - 場景：許淑媚老師剛踏入教室，看見令人震驚的血腥一幕。黑板上可能有死者留下的血痕或求救訊號。學生們驚慌失措。
5. **開發者模式 (測試專用)**：
    - **如果玩家的輸入是 "/skip_to_end"，你必須忽略剩餘回合數，立即將 'game_status' 設定為 'won'，並將 'bgm_filename' 設定為 '勝利音樂.mp3'。**
    - 在 'resolution' 欄位中提供一個虛擬但完整的遊戲結局故事（約 200 字），說明許淑媚老師如何快速破案，以供測試顯示效果。
    - 'narrative' 欄位可以簡短說明：「系統進入開發者模式，即將顯示結局。」

請記住，你是電腦系統，也是說書人。引導許淑媚老師揭開真相。
`;

let chatSession: Chat | null = null;

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

		const response = await chatSession.sendMessage({
			message: "遊戲開始。描述初始場景並提供三個行動建議。",
		});

		const jsonText = response.text.trim();
		const gameResponse: GameResponse = JSON.parse(jsonText);
		return gameResponse;
	} catch (error) {
		console.error("Error during game initialization:", error);
		throw new Error("無法初始化遊戲。請檢查 API 金鑰和網路連線。");
	}
};

export const sendPlayerAction = async (action: string): Promise<GameResponse> => {
	if (!chatSession) {
		throw new Error("聊天會話尚未初始化。請先調用 initializeGame。");
	}

	try {
		const response = await chatSession.sendMessage({
			message: action,
		});

		const jsonText = response.text.trim();
		const gameResponse: GameResponse = JSON.parse(jsonText);
		return gameResponse;
	} catch (error) {
		console.error("Error sending player action:", error);
		throw new Error("無法傳送玩家行動。");
	}
};
