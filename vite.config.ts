import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // ↓↓↓ 這是為了修復 'process is not defined' 錯誤 ↓↓↓
  define: {
    'process.env': {} 
  },
  // ↑↑↑ 這是關鍵的修復 ↑↑↑
  server: {
    host: '0.0.0.0', 
    allowedHosts: [
      'lia-unhacked-magniloquently.ngrok-free.dev', // 您的 Ngrok 主機名
      'localhost',
      '127.0.0.1',
    ]
  }
});