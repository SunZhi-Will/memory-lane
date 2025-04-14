<div align="center">
  <img src="public/MemoryLaneLOGO.png" alt="MemoryLane Logo" width="200" />
  <h1>MemoryLane - LINE 聊天記錄回顧網站</h1>
  <p>一個精美的 LINE 聊天記錄回顧網站，讓您以全新的方式重溫珍貴對話與回憶。</p>
  
  <p>
    <a href="#功能特色">功能特色</a> •
    <a href="#如何使用">如何使用</a> •
    <a href="#部署資訊">部署資訊</a> •
    <a href="#技術實現">技術實現</a> •
    <a href="#隱私聲明">隱私聲明</a> •
    <a href="#開發設置">開發設置</a>
  </p>
</div>

---

## 🌟 功能特色

- ✨ **上傳 LINE 聊天記錄**：簡單地上傳您從 LINE 匯出的聊天記錄檔案
- 📅 **時間線顯示**：按月份組織的精美時間線，直觀地查看對話歷史
- 💬 **彈幕效果**：當您瀏覽特定月份時，該月份的隨機對話會以彈幕形式呈現，增加回顧樂趣
- 🔒 **本地處理**：所有處理都在本地進行，確保您的隱私安全
- 📱 **響應式設計**：在任何裝置上都能獲得最佳體驗





## 🚀 如何使用

### 1️⃣ **獲取 LINE 聊天記錄**：
   - 開啟 LINE 應用程式
   - 進入您想要回顧的聊天室
   - 點擊右上角選單
   - 選擇「設定」
   - 選擇「匯出聊天記錄」
   - 將匯出的檔案保存到您的裝置上

### 2️⃣ **上傳聊天記錄**：
   - 訪問 MemoryLane 網站
   - 點擊上傳區域或拖放您的聊天記錄檔案
   - 等待系統處理檔案

### 3️⃣ **瀏覽時間線**：
   - 處理完成後，自動跳轉到時間線頁面
   - 使用頂部的月份導航切換不同時間段
   - 觀賞每個月份的彈幕效果，重溫珍貴對話

## 🚀 部署資訊

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

### 資料處理流程

1. **上傳與解析**：使用者上傳的 LINE 聊天記錄檔案經過前端解析
2. **資料轉換**：將原始資料轉換為結構化格式，按時間與對話者組織
3. **本地儲存**：使用 localStorage 暫存處理後的資料
4. **展示渲染**：根據用戶選擇的時間段展示對應的訊息與互動效果

## 💻 技術實現

<div align="center">
  <table>
    <tr>
      <td align="center"><strong>前端框架</strong></td>
      <td align="center"><strong>工具與庫</strong></td>
      <td align="center"><strong>開發工具</strong></td>
    </tr>
    <tr>
      <td>
        • Next.js 15.2<br>
        • React 19<br>
        • TypeScript 5<br>
        • Tailwind CSS 4
      </td>
      <td>
        • Framer Motion (動畫效果)<br>
        • date-fns 4 (日期處理)<br>
        • react-intersection-observer
      </td>
      <td>
        • Turbopack (開發模式)<br>
        • ESLint<br>
        • Prettier
      </td>
    </tr>
  </table>
</div>

## 🔒 隱私聲明

MemoryLane 高度重視您的隱私：
- 🔒 所有處理都在您的瀏覽器本地進行
- 🚫 聊天記錄不會上傳到任何伺服器
- 💾 資料使用 localStorage 暫存，僅在您的瀏覽器中保存

## ⚙️ 開發設置

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

## 🤝 貢獻

歡迎提出問題或提交拉取請求，一起讓這個項目變得更好！

## 📄 授權

本專案採用 MIT 授權條款。

---

<div align="center">
  <p>用 ❤️ 打造 | © 2025 MemoryLane</p>
</div>
