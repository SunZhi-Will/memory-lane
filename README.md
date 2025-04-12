# MemoryLane - LINE 聊天記錄回顧網站

一個精美的 LINE 聊天記錄回顧網站，讓您以全新的方式重溫珍貴對話與回憶。

## 功能特色

- **上傳 LINE 聊天記錄**：簡單地上傳您從 LINE 匯出的聊天記錄檔案
- **時間線顯示**：按月份組織的精美時間線，直觀地查看對話歷史
- **彈幕效果**：當您瀏覽特定月份時，該月份的隨機對話會以彈幕形式呈現，增加回顧樂趣
- **本地處理**：所有處理都在本地進行，確保您的隱私安全
- **響應式設計**：在任何裝置上都能獲得最佳體驗

## 使用體驗

## 如何使用

1. **獲取 LINE 聊天記錄**：
   - 開啟 LINE 應用程式
   - 進入您想要回顧的聊天室
   - 點擊右上角選單
   - 選擇「設定」
   - 選擇「匯出聊天記錄」
   - 將匯出的檔案保存到您的裝置上

2. **上傳聊天記錄**：
   - 訪問 MemoryLane 網站
   - 點擊上傳區域或拖放您的聊天記錄檔案
   - 等待系統處理檔案

3. **瀏覽時間線**：
   - 處理完成後，自動跳轉到時間線頁面
   - 使用頂部的月份導航切換不同時間段
   - 觀賞每個月份的彈幕效果，重溫珍貴對話

## 部署資訊

您可以使用 Vercel 一鍵部署本專案：

```bash
# 使用 Vercel CLI 部署
vercel

# 或者直接連接您的 GitHub 倉庫到 Vercel
```

或者使用 Docker 部署：

```bash
# 構建 Docker 映像
docker build -t memoryline .

# 運行容器
docker run -p 3000:3000 memoryline
```

## 技術實現

- Next.js 15.2
- React 19
- TypeScript 5
- Tailwind CSS 4
- Framer Motion (動畫效果)
- date-fns 4 (日期處理)
- react-intersection-observer (交叉觀察器)
- Turbopack (開發模式)

## 隱私聲明

MemoryLane 高度重視您的隱私：
- 所有處理都在您的瀏覽器本地進行
- 聊天記錄不會上傳到任何伺服器
- 資料使用 localStorage 暫存，僅在您的瀏覽器中保存

## 開發設置

```bash
# 安裝依賴
npm install

# 啟動開發服務器 (使用 Turbopack)
npm run dev

# 構建生產版本
npm run build

# 啟動生產服務器
npm start
```

## 貢獻

歡迎提出問題或提交拉取請求，一起讓這個項目變得更好！

## 授權

本專案採用 MIT 授權條款。
