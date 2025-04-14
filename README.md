<div align="center">
  <img src="public/MemoryLaneLOGO.png" alt="MemoryLane Logo" width="200" />
  <h1>MemoryLane - LINE Chat History Review Website</h1>
  <p>An elegant LINE chat history review website that lets you relive precious conversations and memories in a brand new way.</p>
  
  <p>
    <strong>English</strong> •
    <a href="README-zh.md">繁體中文</a>
  </p>
  
  <p>
    <a href="https://github.com/Sunzhi-will/memory-lane" target="_blank">
      <img src="https://img.shields.io/github/stars/Sunzhi-will/memory-lane?style=social" alt="GitHub Stars" />
    </a>
    <a href="https://github.com/Sunzhi-will/memory-lane/fork" target="_blank">
      <img src="https://img.shields.io/github/forks/Sunzhi-will/memory-lane?style=social" alt="GitHub Forks" />
    </a>
    <a href="https://github.com/Sunzhi-will/memory-lane/issues" target="_blank">
      <img src="https://img.shields.io/github/issues/Sunzhi-will/memory-lane" alt="GitHub Issues" />
    </a>
  </p>
</div>

---

## 📺 Demo

<div align="center">
  <a href="https://youtu.be/CPTTjLaydVU" target="_blank">
    <img src="https://img.youtube.com/vi/CPTTjLaydVU/maxresdefault.jpg" alt="MemoryLane Demo" width="600" />
  </a>
  <p>Click the image above to watch the demo on YouTube</p>
</div>

## 🌟 Features

- ✨ **Upload LINE Chat History**: Easily upload chat history files exported from LINE
- 📅 **Timeline Display**: Beautifully organized timeline by month, intuitive way to view conversation history
- 💬 **Danmaku Effect**: When browsing a specific month, random conversations from that month appear as danmaku, adding fun to your review
- 🔒 **Local Processing**: All processing is done locally, ensuring your privacy is protected
- 📱 **Responsive Design**: Get the best experience on any device





## 🚀 How to Use

### 1️⃣ **Get LINE Chat History**:
   - Open the LINE application
   - Enter the chat room you want to review
   - Click on the menu in the top right corner
   - Select "Settings"
   - Choose "Export Chat History"
   - Save the exported file to your device

### 2️⃣ **Upload Chat History**:
   - Visit the MemoryLane website
   - Click the upload area or drag and drop your chat history file
   - Wait for the system to process the file

### 3️⃣ **Browse Timeline**:
   - After processing is complete, automatically redirect to the timeline page
   - Use the month navigation at the top to switch between different time periods
   - Watch the danmaku effect for each month, reliving precious conversations

## 🚀 Deployment Information

You can deploy this project with Vercel in one click:

```bash
# Deploy using Vercel CLI
vercel

# Or connect your GitHub repository directly to Vercel
```

Or deploy using Docker:

```bash
# Build Docker image
docker build -t memoryline .

# Run container
docker run -p 3000:3000 memoryline
```

### Data Processing Flow

1. **Upload & Parsing**: LINE chat history files uploaded by users are parsed on the frontend
2. **Data Conversion**: Raw data is converted into structured format, organized by time and participants
3. **Local Storage**: Processed data is temporarily stored using localStorage
4. **Display Rendering**: Messages and interactive effects are displayed based on the time period selected by the user

## 💻 Technical Implementation

<div align="center">
  <table>
    <tr>
      <td align="center"><strong>Frontend Framework</strong></td>
      <td align="center"><strong>Tools & Libraries</strong></td>
      <td align="center"><strong>Development Tools</strong></td>
    </tr>
    <tr>
      <td>
        • Next.js 15.2<br>
        • React 19<br>
        • TypeScript 5<br>
        • Tailwind CSS 4
      </td>
      <td>
        • Framer Motion (animations)<br>
        • date-fns 4 (date handling)<br>
        • react-intersection-observer
      </td>
      <td>
        • Turbopack (dev mode)<br>
        • ESLint<br>
        • Prettier
      </td>
    </tr>
  </table>
</div>

## 🔒 Privacy Statement

MemoryLane highly values your privacy:
- 🔒 All processing is done locally in your browser
- 🚫 Chat history is not uploaded to any server
- 💾 Data is temporarily stored using localStorage, only saved within your browser

## ⚙️ Development Setup

```bash
# Install dependencies
npm install

# Start development server (using Turbopack)
npm run dev

# Build production version
npm run build

# Start production server
npm start
```

## 🤝 Contribution

Issues and pull requests are welcome to make this project better together!

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  <p>Made with ❤️ | © 2025 MemoryLane</p>
</div>
