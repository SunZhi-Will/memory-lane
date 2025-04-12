'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { parseLineChat } from '@/utils/lineParser';

export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // 溫馨小語陣列
  const heartfeltMessages = useMemo(() => [
    "每一段對話都是生命中的珍寶，文字能重新撫慰我們的心靈。",
    "時間流逝，但那些珍貴的回憶，永遠留在我們心裡的角落。",
    "重溫過去的每一句問候，都讓我們與當時的自己再次相遇。",
    "文字背後是情感的流動，是無法取代的珍貴記憶。",
    "回顧過去的對話，是與逝去時光的一場溫柔對話。",
    "那些日常的問候與關心，織成了我們生命中最美的風景。",
    "在字裡行間，找回那些被時間沖淡的感動與溫度。",
    "重讀舊日的訊息，才發現原來幸福一直都在身邊。",
    "有些話語，只有回頭才能體會它背後的深刻含義。",
    "我們的故事，藏在每一則訊息中，靜待被重新發現。",
    "那些曾經的對話，是我們與過去保持連結的方式。",
    "時光易逝，但文字永存，它們承載著我們共同的記憶。"
  ], []);

  // 上傳處理過程中的溫馨小語
  const processingMessages = useMemo(() => [
    "有些回憶，只有重新閱讀，才能感受當初的溫度。",
    "時光荏苒，感謝科技讓我們能夠重溫那些珍貴瞬間。",
    "每一次回顧，都是與過去自己的一場溫暖對話。",
    "文字是時間的信使，帶我們回到那些美好的時刻。",
    "當我們整理回憶時，也是在整理自己的心靈。",
    "細數過往的對話，彷彿重新經歷那些悲歡離合。",
    "在數字時代，我們的情感依然真實而溫暖。",
    "讓我們一起打開時光的門扉，重訪那些美好。",
    "這些字句間，藏著我們的笑淚與成長。",
    "慢慢咀嚼這些文字，找回那些被遺忘的感動。",
    "記憶或許模糊，但文字永遠清晰地記錄著過往。",
    "每一條訊息背後，都是一段值得珍藏的故事。"
  ], []);

  // 隨機選擇一則溫馨小語和處理小語
  const [currentMessage, setCurrentMessage] = useState("");
  const [processingMessage, setProcessingMessage] = useState("");
  const [messageRefreshAnimation, setMessageRefreshAnimation] = useState(false);

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

    // 隨機選擇一則溫馨小語
    const randomIndex = Math.floor(Math.random() * heartfeltMessages.length);
    setCurrentMessage(heartfeltMessages[randomIndex]);

    // 隨機選擇一則處理過程中的溫馨小語
    const randomProcessingIndex = Math.floor(Math.random() * processingMessages.length);
    setProcessingMessage(processingMessages[randomProcessingIndex]);
  }, [heartfeltMessages, processingMessages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      setError(null);
      setFile(selectedFile);

      // 直接開始處理選擇的檔案
      processFile(selectedFile);
    }
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
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setError(null);

      // 自動開始處理檔案
      processFile(droppedFile);
    }
  };

  // 提取檔案處理邏輯到單獨的函數，以便可以從多個地方調用
  const processFile = async (fileToProcess: File) => {
    if (!fileToProcess) {
      setError('請選擇一個檔案，讓我們一起重溫那些美好時光');
      setShowErrorNotification(true);
      return;
    }

    // 檢查檔案類型，確保只有 .txt 或 .log 檔案
    const fileName = fileToProcess.name.toLowerCase();
    if (!fileName.endsWith('.txt') && !fileName.endsWith('.log')) {
      setError('請上傳 .txt 或 .log 格式的 LINE 聊天紀錄檔案');
      setShowErrorNotification(true);
      return;
    }

    // 重新選擇一個隨機處理訊息
    const randomProcessingIndex = Math.floor(Math.random() * processingMessages.length);
    setProcessingMessage(processingMessages[randomProcessingIndex]);

    setIsUploading(true);
    setUploadProgress('準備處理檔案...');

    try {
      // 這裡我們只是簡單地解析檔案並儲存到 localStorage
      setUploadProgress('正在讀取檔案...');
      const text = await fileToProcess.text();
      localStorage.setItem('chatData', text);
      console.log(`已載入檔案: ${fileToProcess.name}, 大小: ${fileToProcess.size} 字節`);

      // 使用 lineParser 解析聊天記錄
      setUploadProgress('正在解析聊天記錄...');
      console.log('開始解析聊天記錄...');
      const messages = parseLineChat(text);
      console.log(`解析完成，取得 ${messages.length} 則訊息`);

      // 檢查是否成功解析到任何 LINE 聊天記錄
      if (messages.length === 0) {
        setError('所上傳的檔案不是有效的 LINE 聊天紀錄格式。請確保您上傳的是從 LINE 匯出的聊天紀錄檔案。');
        setIsUploading(false);
        setUploadProgress(null);
        setShowErrorNotification(true);
        return;
      }

      // 提取月份並去重
      setUploadProgress('正在處理時間資訊...');
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
      const timestamps = Array.from(monthSet).sort();
      console.log('排序後的月份:', timestamps);

      // 檢查是否成功提取到任何月份
      if (timestamps.length === 0) {
        setError('無法從聊天記錄中提取日期資訊。請確保您上傳的 LINE 聊天紀錄包含正確的日期格式。');
        setIsUploading(false);
        setUploadProgress(null);
        setShowErrorNotification(true);
        return;
      }

      // 檢查時間戳格式是否正確
      console.log('最終使用的時間戳陣列:', JSON.stringify(timestamps));

      // 儲存提取的月份
      localStorage.setItem('timestamps', JSON.stringify(timestamps));
      console.log('已將時間戳存入 localStorage');

      // 完成處理
      setUploadProgress('處理完成，即將開始您的回憶之旅...');

      // 延遲導航以顯示上傳動畫
      console.log('準備導航到時間軸頁面...');
      setTimeout(() => {
        router.push('/timeline');
      }, 1500);
    } catch (err) {
      console.error('處理檔案時出錯:', err);
      const errorMessage = err instanceof Error ? err.message : '解析檔案時出錯';
      if (errorMessage.includes('未檢測到有效的 LINE 聊天記錄格式')) {
        setError('所上傳的檔案不是有效的 LINE 聊天紀錄格式。請確保您上傳的是從 LINE 匯出的聊天紀錄檔案。');
      } else if (errorMessage.includes('無法從聊天記錄中提取日期資訊')) {
        setError('無法從聊天記錄中提取日期資訊。請確保您上傳的 LINE 聊天紀錄包含正確的日期格式。');
      } else {
        setError('處理檔案時發生錯誤，請確保上傳的是有效的 LINE 聊天紀錄格式。');
      }
      setIsUploading(false);
      setUploadProgress(null);
      setShowErrorNotification(true);
    }
  };

  // 隨機選擇一個新的溫馨小語
  const refreshHeartfeltMessage = () => {
    setMessageRefreshAnimation(true);

    // 延遲選擇新訊息，以便動畫效果更流暢
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * heartfeltMessages.length);
      setCurrentMessage(heartfeltMessages[randomIndex]);
      setMessageRefreshAnimation(false);
    }, 300);
  };

  // 關閉錯誤通知
  const closeErrorNotification = () => {
    setShowErrorNotification(false);
  };

  // 當錯誤訊息顯示時，設置一個定時器在5秒後自動關閉
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (showErrorNotification) {
      timer = setTimeout(() => {
        setShowErrorNotification(false);
      }, 5000); // 5秒後自動關閉
    }

    // 清理定時器
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showErrorNotification]);

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 彈出式錯誤通知 */}
      <AnimatePresence>
        {showErrorNotification && error && (
          <motion.div
            key="error-notification"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-xl border border-rose-200 p-4 max-w-md w-full flex items-start"
          >
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-grow">
              <h3 className="text-base font-medium text-rose-700 mb-1">上傳錯誤</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
            <button
              onClick={closeErrorNotification}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 拖曳疊加層 - 只在拖曳激活時顯示 */}
      <AnimatePresence>
        {dragActive && (
          <motion.div
            key="drag-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-purple-600/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="bg-white p-6 rounded-xl shadow-2xl text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h2 className="text-xl font-bold text-purple-800 mb-2">釋放以上傳檔案</h2>
              <p className="text-sm text-gray-600">將開始您的時光回顧之旅</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
      <div className="relative z-10 w-full max-w-3xl mx-auto">
        {/* 上傳中覆蓋層 */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              key="uploading-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl"
            >
              <div className="text-center p-8">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-200 opacity-25"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-purple-600 opacity-75 animate-spin border-t-transparent"></div>
                </div>
                <h2 className="text-xl font-bold text-purple-800 mb-2">正在編織您的回憶...</h2>
                {uploadProgress && (
                  <p className="text-sm text-purple-600 mb-4">{uploadProgress}</p>
                )}
                <div className="max-w-md mx-auto mt-4 bg-purple-50 p-3 rounded-lg">
                  <p className="text-xs text-purple-700 italic">
                    &quot;{processingMessage}&quot;
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-4"
        >
          <div className="relative w-28 h-28 mx-auto mb-2">
            <Image
              src="/MemoryLaneLOGO.png"
              alt="MemoryLane Logo"
              fill
              className="object-contain relative z-10"
              priority
            />
          </div>

          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            MemoryLane
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            每一則訊息都是回憶，每一段對話都值得珍藏
          </p>


        </motion.div>

        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="w-full md:w-1/2"
          >
            <div className="h-full p-5 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100">
              <h2 className="text-xl font-bold mb-4 text-purple-800">上傳您的回憶</h2>
              <div className="space-y-3">
                <div
                  className={`relative flex flex-col items-center justify-center w-full h-65 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${dragActive
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-50'
                    }`}
                  onClick={() => inputRef.current?.click()}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".txt,.log"
                    onChange={handleFileChange}
                  />

                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <svg className="w-6 h-6 mb-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-0.5 text-sm text-gray-600">
                      <span className="font-semibold">點擊上傳</span> 或將檔案拖放至此
                    </p>
                    <p className="text-xs text-gray-500 mb-1">僅限 LINE 聊天紀錄 (TXT 或 LOG 檔案)</p>
                    <p className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      選擇檔案後將自動開始處理
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="absolute bottom-2 right-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg px-2 py-1 shadow-md transition-colors"
                  >
                    選擇檔案
                  </button>
                </div>


              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="w-full md:w-1/2 flex flex-col gap-4"
          >
            <div className="p-5 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100">
              <h2 className="text-xl font-bold mb-3 text-purple-800">特色功能</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900">隱私至上</h3>
                    <p className="text-sm text-gray-600">檔案僅在您的裝置上處理，不會上傳到任何伺服器</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900">情感彈幕</h3>
                    <p className="text-sm text-gray-600">動態彈幕重溫對話，彷彿時間倒流與過去連結</p>
                  </div>
                </li>

                <li className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900">時光時間線</h3>
                    <p className="text-sm text-gray-600">精美動畫呈現對話時間脈絡，回顧重要時刻</p>
                  </div>
                </li>
              </ul>
            </div>

            <div
              className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg text-white cursor-pointer transition-all duration-300 hover:shadow-xl group relative overflow-hidden"
              onClick={refreshHeartfeltMessage}
            >
              <div className="flex items-center mb-1">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <h3 className="text-base font-semibold">溫馨小語</h3>

                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.blockquote
                  key={currentMessage}
                  initial={messageRefreshAnimation ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="italic text-xs"
                >
                  &quot;{currentMessage}&quot;
                </motion.blockquote>
              </AnimatePresence>

            </div>
          </motion.div>
        </div>

        <footer className="mt-5 text-center text-xs text-gray-500">
          <p>
            MemoryLane | 時光回顧 © {new Date().getFullYear()} | 隱私資料皆僅儲存於裝置中
          </p>
        </footer>
      </div>
    </main>
  );
}
