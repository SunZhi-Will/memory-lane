'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { parseLineChat } from '@/utils/lineParser';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // 漂浮的記憶泡泡效果
  const [bubbles, setBubbles] = useState<{ id: number, x: number, y: number, size: number, delay: number }[]>([]);

  useEffect(() => {
    // 創建漂浮的記憶泡泡
    const newBubbles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 10 + Math.random() * 40,
      delay: Math.random() * 5
    }));
    setBubbles(newBubbles);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setError(null);
    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('請選擇一個檔案，讓我們一起重溫那些美好時光');
      return;
    }

    setIsUploading(true);

    try {
      // 這裡我們只是簡單地解析檔案並儲存到 localStorage
      const text = await file.text();
      localStorage.setItem('chatData', text);
      console.log(`已載入檔案: ${file.name}, 大小: ${file.size} 字節`);

      // 使用 lineParser 解析聊天記錄
      console.log('開始解析聊天記錄...');
      const messages = parseLineChat(text);
      console.log(`解析完成，取得 ${messages.length} 則訊息`);

      // 提取月份並去重
      console.log('開始提取唯一月份...');
      const monthSet = new Set<string>();

      messages.forEach(message => {
        // 從日期中提取年月
        const dateParts = message.date.split('/');
        if (dateParts.length >= 2) {
          const year = dateParts[0];
          const month = dateParts[1].padStart(2, '0');
          const monthKey = `${year}/${month}`;
          monthSet.add(monthKey);
        }
      });

      console.log('提取的唯一月份:', monthSet);

      // 將 Set 轉換為陣列並排序
      let timestamps = Array.from(monthSet).sort();
      console.log('排序後的月份:', timestamps);

      // 只有在沒找到任何月份時才使用預設值
      if (timestamps.length === 0) {
        console.warn('未檢測到任何月份，使用示例月份');
        timestamps = ['2024/01', '2024/03', '2025/01'];
      }

      // 檢查時間戳格式是否正確
      console.log('最終使用的時間戳陣列:', JSON.stringify(timestamps));

      // 儲存提取的月份
      localStorage.setItem('timestamps', JSON.stringify(timestamps));
      console.log('已將時間戳存入 localStorage');

      // 延遲導航以顯示上傳動畫
      console.log('準備導航到時間軸頁面...');
      setTimeout(() => {
        router.push('/timeline');
      }, 1500);
    } catch (err) {
      console.error('處理檔案時出錯:', err);
      setError('解析檔案時出錯，請確保是有效的 LINE 聊天紀錄格式');
      setIsUploading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-8 overflow-hidden">
      {/* 背景泡泡 */}
      {bubbles.map(bubble => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full bg-purple-100/40 z-0"
          style={{
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            width: bubble.size,
            height: bubble.size,
          }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 5 + bubble.delay,
            repeat: Infinity,
            delay: bubble.delay,
          }}
        />
      ))}

      {/* 主要內容 */}
      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            時光回顧
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            每一則訊息都是回憶，每一段對話都值得珍藏
          </p>
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-purple-100 animate-pulse"></div>
            <Image
              src="/line-chat.svg"
              alt="LINE聊天圖示"
              fill
              className="object-contain relative z-10 p-4"
              priority
            />
          </div>
          <p className="text-gray-500 italic max-w-md mx-auto">
            「時間沖淡了一切，但對話卻記錄了我們共度的每一刻」
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-8 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="w-full md:w-1/2"
          >
            <div className="h-full p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100">
              <h2 className="text-2xl font-bold mb-6 text-purple-800">上傳您的回憶</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${dragActive
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-50'
                    }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".txt,.log"
                    onChange={handleFileChange}
                  />

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center justify-center pt-5 pb-6"
                  >
                    <svg className="w-10 h-10 mb-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-600">
                      <span className="font-semibold">點擊上傳</span> 或將檔案拖放至此
                    </p>
                    <p className="text-xs text-gray-500">LINE 聊天紀錄 (TXT 或 LOG 檔案)</p>
                  </motion.div>

                  <motion.button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="absolute bottom-3 right-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg px-4 py-2 shadow-md transition-colors"
                  >
                    選擇檔案
                  </motion.button>
                </div>

                <AnimatePresence>
                  {file && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm text-purple-700 bg-purple-50 p-3 rounded-lg flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>已選擇: <span className="font-medium">{file.name}</span></span>
                    </motion.p>
                  )}

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-base font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300"
                  disabled={isUploading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      正在編織您的回憶...
                    </>
                  ) : '開始我的時光之旅'}
                </motion.button>
              </form>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="w-full md:w-1/2 flex flex-col gap-6"
          >
            <div className="h-full flex-1 p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100">
              <h2 className="text-2xl font-bold mb-6 text-purple-800">特色功能</h2>
              <ul className="space-y-5">
                <motion.li
                  className="flex items-start"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">隱私至上</h3>
                    <p className="mt-1 text-gray-600">檔案僅會在您的裝置上處理，不會上傳到任何伺服器，您的私密對話安全無虞。</p>
                  </div>
                </motion.li>

                <motion.li
                  className="flex items-start"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">情感彈幕</h3>
                    <p className="mt-1 text-gray-600">以動態彈幕方式重溫對話，彷彿時間倒流，與過去的對話重新連結。</p>
                  </div>
                </motion.li>

                <motion.li
                  className="flex items-start"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">時光時間線</h3>
                    <p className="mt-1 text-gray-600">以精美動畫呈現對話的時間脈絡，讓您輕鬆回顧每個重要時刻和情感轉折。</p>
                  </div>
                </motion.li>
              </ul>
            </div>

            <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-lg text-white">
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold">溫馨小語</h3>
              </div>
              <blockquote className="italic text-sm">
                "每一段對話都是生命中的珍寶，當文字再次浮現在眼前，那些曾經的喜悅、淚水和承諾，會重新撫慰我們的心靈。"
              </blockquote>
            </div>
          </motion.div>
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="mt-16 text-center text-sm text-gray-500"
        >
          <p className="mb-2">
            時光回顧 © {new Date().getFullYear()} | 用科技珍藏美好
          </p>
          <p>
            您的隱私始終是我們的首要考量，所有資料皆僅儲存於您的裝置中
          </p>
        </motion.footer>
      </div>
    </main>
  );
}
