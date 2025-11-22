
export interface Character {
  id: string;
  name: string;
  role: string; // e.g., "受害者", "班長", "同學"
  status: 'alive' | 'deceased' | 'missing' | 'arrested';
  is_interrogating: boolean; // 是否為當前對話焦點
  description: string;
  avatar_keyword: 'man' | 'woman' | 'old' | 'young' | 'scar' | 'singer'; // 對應前端圖片：man/woman(學生), old(老師), singer(校外)
}

export interface Evidence {
  id: string;
  name: string;
  description: string;
  icon_type: 'document' | 'weapon' | 'item' | 'place';
}

export interface GameResponse {
  narrative: string;
  suggestions: string[];
  turns_left: number;
  game_status: 'playing' | 'won' | 'lost';
  characters: Character[];
  evidence: Evidence[];
  location_name: string; // 當前場景名稱
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}

export enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  ERROR = 'ERROR'
}