'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { parseLineChat } from '@/utils/lineParser';
import DanmakuComponent from '@/components/Danmaku';
import { type Message } from '@/components/Danmaku';

// 定義訊息介面 (使用從彈幕元件匯入的介面)
// interface Message {
//    content: string;
//    sender: string;
//    timestamp: string;
// }

// 彈幕介面已移至 Danmaku.tsx

export default function Timeline() {
    const router = useRouter();
    const [timestamps, setTimestamps] = useState<string[]>([]);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [currentMonth, setCurrentMonth] = useState<string>('');
    // 從這裡移除 danmakus 狀態
    const [loading, setLoading] = useState(true);
    const [showMemoryEffect, setShowMemoryEffect] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [scrollPosition, setScrollPosition] = useState<number>(0);
    const [isBubbleMode, setIsBubbleMode] = useState<boolean>(false);
    const timelineRef = useRef<HTMLDivElement>(null);
    // 用於彈幕元件的參考
    const danmakuRef = useRef<{ resetDanmaku: (isInitial?: boolean) => void }>(null);

    // 為每個發送者分配固定顏色
    const colorClasses = [
        'bg-purple-100 text-purple-800 border-purple-200 shadow-purple-200/40',
        'bg-blue-100 text-blue-800 border-blue-200 shadow-blue-200/40',
        'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-emerald-200/40',
        'bg-amber-100 text-amber-800 border-amber-200 shadow-amber-200/40',
        'bg-rose-100 text-rose-800 border-rose-200 shadow-rose-200/40',
        'bg-indigo-100 text-indigo-800 border-indigo-200 shadow-indigo-200/40',
    ];
    const [senderColors, setSenderColors] = useState<Record<string, number>>({});

    // 組件掛載時檢查是否有資料，沒有則立即重定向
    useEffect(() => {
        // 使用 try-catch 包裹所有操作，確保不會出現未捕獲的錯誤
        try {
            const chatData = localStorage.getItem('chatData');
            const storedTimestamps = localStorage.getItem('timestamps');

            // 檢查資料是否存在
            if (!chatData || !storedTimestamps) {
                console.log('沒有聊天記錄資料，正在重定向到首頁...');
                router.push('/');
                return;
            }

            // 嘗試解析 timestamps 以確保是有效的 JSON
            try {
                const parsedTimestamps = JSON.parse(storedTimestamps);
                if (!Array.isArray(parsedTimestamps) || parsedTimestamps.length === 0) {
                    console.log('時間戳資料無效，正在重定向到首頁...');
                    router.push('/');
                    return;
                }
            } catch (parseError) {
                console.error('解析時間戳時出錯:', parseError);
                router.push('/');
                return;
            }
        } catch (error) {
            console.error('檢查資料時出錯:', error);
            router.push('/');
        }
    }, [router]);

    useEffect(() => {
        // 顯示記憶加載效果
        setShowMemoryEffect(true);
        const timer = setTimeout(() => {
            setShowMemoryEffect(false);
        }, 1000); // 從 3000ms 減少到 1000ms

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // 包裹整個函數以捕獲所有可能的錯誤
        try {
            // 從 localStorage 獲取資料
            const chatData = localStorage.getItem('chatData');
            const storedTimestamps = localStorage.getItem('timestamps');

            if (!chatData || !storedTimestamps) {
                // 如果沒有資料，直接返回首頁
                console.log('沒有找到聊天資料，正在重定向...');
                router.push('/');
                return;
            }

            try {
                // 解析時間戳
                const parsedTimestamps = JSON.parse(storedTimestamps) as string[];

                // 如果沒有有效的時間戳，也返回首頁
                if (!parsedTimestamps || !Array.isArray(parsedTimestamps) || parsedTimestamps.length === 0) {
                    console.log('沒有有效的時間戳，正在重定向...');
                    router.push('/');
                    return;
                }

                // 設置時間戳
                setTimestamps(parsedTimestamps);

                // 使用 lineParser 處理聊天資料
                const parsedMessages = parseLineChat(chatData);

                // 按月份組織訊息
                const monthlyMessages: Record<string, Message[]> = {};

                // 初始化所有月份的空陣列
                parsedTimestamps.forEach(month => {
                    monthlyMessages[month] = [];
                });

                // 將訊息按月份分組
                parsedMessages.forEach(msg => {
                    // 從日期中提取年月
                    const dateParts = msg.date.split('/');
                    if (dateParts.length >= 2) {
                        const year = dateParts[0];
                        const month = dateParts[1].padStart(2, '0');
                        const monthKey = `${year}/${month}`;

                        // 檢查這個月份是否在我們的時間戳中
                        if (monthlyMessages[monthKey]) {
                            // 將解析出的訊息轉換為我們應用中使用的訊息格式
                            monthlyMessages[monthKey].push({
                                content: msg.content,
                                sender: msg.sender,
                                timestamp: msg.date // 使用完整日期作為時間戳
                            });
                        }
                    }
                });

                // 為每個發送者分配顏色
                const uniqueSenders = new Set<string>();
                parsedMessages.forEach(msg => uniqueSenders.add(msg.sender));

                const senderColorMap: Record<string, number> = {};
                Array.from(uniqueSenders).forEach((sender, index) => {
                    senderColorMap[sender] = index % colorClasses.length;
                });
                setSenderColors(senderColorMap);

                setMessages(monthlyMessages);

                if (parsedTimestamps.length > 0) {
                    setCurrentMonth(parsedTimestamps[0]);
                }

                setTimeout(() => {
                    setLoading(false);
                }, 500); // 從 1500ms 減少到 500ms

                // 如果經過處理後，找不到有效的月份數據，也重定向
                if (Object.keys(monthlyMessages).length === 0) {
                    console.log('處理後沒有有效的月份數據，正在重定向...');
                    router.push('/');
                    return;
                }
            } catch (err) {
                console.error('解析錯誤:', err);
                // 解析出錯也返回首頁
                router.push('/');
                return;
            }
        } catch (error) {
            console.error('資料處理主流程錯誤:', error);
            router.push('/');
            return;
        }
    }, [router]);

    // 移除彈幕生成相關的useEffect

    // 移除generateDanmakus函數

    // 移除彈幕定時器相關的useEffect

    const handlePauseToggle = () => {
        // 切換暫停/播放狀態
        setIsPaused(prevPaused => !prevPaused);
    };

    const handleSpeedChange = (speed: number) => {
        // 如果速度改變了，更新播放速度
        if (speed !== playbackSpeed) {
            setPlaybackSpeed(speed);
        }
    };

    // 監聽滾動
    useEffect(() => {
        const handleScroll = () => {
            if (timelineRef.current) {
                setScrollPosition(timelineRef.current.scrollTop);
            }
        };

        const timelineElement = timelineRef.current;
        if (timelineElement) {
            timelineElement.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (timelineElement) {
                timelineElement.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    // 滾動到特定月份
    const scrollToMonth = (monthIndex: number) => {
        if (timelineRef.current && timestamps.length > 0) {
            // 使用固定的月份高度
            const monthHeight = window.innerHeight - 120; // 減去標題和頁腳的高度
            const targetPosition = monthIndex * monthHeight;

            timelineRef.current.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    };

    // 根據滾動位置更新當前月份
    useEffect(() => {
        if (timelineRef.current && timestamps.length > 0) {
            const monthHeight = window.innerHeight - 120;
            const currentIndex = Math.round(scrollPosition / monthHeight);

            // 確保索引在有效範圍內
            const safeIndex = Math.min(Math.max(0, currentIndex), timestamps.length - 1);

            if (timestamps[safeIndex] && timestamps[safeIndex] !== currentMonth) {
                setCurrentMonth(timestamps[safeIndex]);
            }
        }
    }, [scrollPosition, timestamps, currentMonth]);

    // 設置初始月份
    useEffect(() => {
        if (!loading && timestamps.length > 0) {
            // 縮短延遲時間，更快開始生成彈幕
            setTimeout(() => {
                setCurrentMonth(timestamps[0]);
            }, 100);
        }
    }, [loading, timestamps]);

    // 格式化月份顯示
    const formatMonth = (month: string) => {
        try {
            if (!month || !/^\d{4}\/\d{2}$/.test(month)) {
                return month; // 如果不是正確格式，原樣返回
            }

            const parts = month.split('/');
            const year = parseInt(parts[0], 10);
            const monthNum = parseInt(parts[1], 10);

            if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                return month; // 如果解析失敗，原樣返回
            }

            const monthNames = [
                '01', '02', '03', '04', '05', '06',
                '07', '08', '09', '10', '11', '12'
            ];

            return `${year}.${monthNames[monthNum - 1]}`;
        } catch {
            return month; // 發生任何錯誤，原樣返回
        }
    };

    // 切換彈幕模式
    const toggleDanmakuMode = () => {
        // 切換模式
        setIsBubbleMode(!isBubbleMode);
    };

    // 記憶加載效果
    if (showMemoryEffect) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="text-center"
                >
                    <h1 className="text-3xl font-bold mb-6 text-purple-700">記憶正在喚醒中...</h1>
                    <div className="relative w-32 h-32 mx-auto mb-8">
                        <div className="time-ripple absolute inset-0"></div>
                        <div className="time-ripple absolute inset-0" style={{ animationDelay: '0.5s' }}></div>
                        <div className="time-ripple absolute inset-0" style={{ animationDelay: '1s' }}></div>
                        <div className="absolute inset-0 rounded-full bg-purple-100 flex items-center justify-center">
                            <Image
                                src="/MemoryLaneLOGO.png"
                                alt="記憶喚醒"
                                width={64}
                                height={64}
                                className="animate-pulse"
                            />
                        </div>
                    </div>
                    <p className="text-gray-600 italic">
                        每一則訊息，都是一段美好回憶
                    </p>
                </motion.div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mb-4"></div>
                    <p className="text-purple-800 font-medium">正在整理您的回憶...</p>
                    <p className="text-purple-600 text-sm mt-1">這可能需要幾秒鐘的時間</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-purple-50/30 relative overflow-hidden">
            {/* 使用彈幕元件替換原有的彈幕系統 */}
            {currentMonth && messages[currentMonth] && (
                <DanmakuComponent
                    currentMonth={currentMonth}
                    messages={messages}
                    isPaused={isPaused}
                    playbackSpeed={playbackSpeed}
                    isBubbleMode={isBubbleMode}
                    colorClasses={colorClasses}
                    senderColors={senderColors}
                />
            )}

            {/* 控制面板 */}
            <div className="fixed top-4 right-4 z-30 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-lg flex items-center gap-2 border border-purple-100">
                <button
                    onClick={handlePauseToggle}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                    aria-label={isPaused ? "播放" : "暫停"}
                    title={isPaused ? "播放彈幕" : "暫停彈幕"}
                >
                    {isPaused ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"></path>
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
                        </svg>
                    )}
                </button>

                {/* 模式切換按鈕 */}
                <button
                    onClick={toggleDanmakuMode}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isBubbleMode
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                        }`}
                    aria-label={isBubbleMode ? "切換至水平彈幕" : "切換至泡泡模式"}
                    title={isBubbleMode ? "切換至水平彈幕" : "切換至泡泡模式"}
                >
                    {isBubbleMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    )}
                </button>

                <div className="flex bg-purple-50 rounded-xl p-1 h-9">
                    <button
                        onClick={() => handleSpeedChange(1)}
                        className={`px-2 h-7 flex items-center justify-center text-xs rounded-lg transition-colors ${playbackSpeed === 1 ? 'bg-purple-600 text-white' : 'text-purple-700 hover:bg-purple-100'}`}
                        title="正常速度"
                    >
                        1x
                    </button>
                    <button
                        onClick={() => handleSpeedChange(2.0)}
                        className={`px-2 h-7 flex items-center justify-center text-xs rounded-lg transition-colors ${playbackSpeed === 2.0 ? 'bg-purple-600 text-white' : 'text-purple-700 hover:bg-purple-100'}`}
                        title="快速"
                    >
                        2.0x
                    </button>
                    <button
                        onClick={() => handleSpeedChange(3.0)}
                        className={`px-2 h-7 flex items-center justify-center text-xs rounded-lg transition-colors ${playbackSpeed === 3.0 ? 'bg-purple-600 text-white' : 'text-purple-700 hover:bg-purple-100'}`}
                        title="超快速"
                    >
                        3.0x
                    </button>
                </div>
                <button
                    onClick={() => router.push('/')}
                    className="w-9 h-9 flex items-center justify-center text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-xl transition-colors"
                    title="返回首頁"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </button>
            </div>

            {/* 垂直時間軸 - 可滾動區域 */}
            <div className="relative w-full h-screen">
                {/* 滾動區域 */}
                <div
                    ref={timelineRef}
                    className="h-screen w-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
                    onScroll={() => timelineRef.current && setScrollPosition(timelineRef.current.scrollTop)}
                >
                    <div className="min-h-full">
                        {timestamps.length === 0 ? (
                            <div className="h-screen w-full flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mb-4"></div>
                                <p className="text-purple-800">正在導向上傳頁面...</p>
                            </div>
                        ) : (
                            timestamps.map((month, index) => (
                                <div
                                    key={month}
                                    className="h-screen w-full flex items-center justify-center snap-start"
                                    id={`month-${index}`}
                                >
                                    <motion.div
                                        className="flex flex-col items-center justify-center px-6 text-center w-full max-w-4xl mx-auto relative z-30"
                                        initial={{ opacity: 0, y: 50 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5 }}
                                        viewport={{ once: true, margin: "-20%" }}
                                    >
                                        <h2 className="text-7xl md:text-8xl font-bold text-purple-700 drop-shadow-sm relative z-30">
                                            {formatMonth(month)}
                                        </h2>

                                        {/* 可選：顯示這個月的一些統計信息 */}
                                        {messages[month] && (
                                            <p className="mt-4 text-purple-500 relative z-30">
                                                {messages[month].length} 則訊息
                                            </p>
                                        )}
                                    </motion.div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 垂直中央線 - 放置在中間，但在Z-Index上在文字後面 */}
                <div className="fixed left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-purple-300 to-transparent opacity-50 z-10"></div>

                {/* 右側月份指示器 */}
                <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-lg">
                    <div className="flex flex-col gap-1.5">
                        {timestamps.map((month, index) => (
                            <button
                                key={month}
                                onClick={() => scrollToMonth(index)}
                                className={`w-3 h-3 rounded-full transition-all ${month === currentMonth
                                    ? 'bg-purple-600 shadow-md shadow-purple-300'
                                    : 'bg-purple-200 hover:bg-purple-300'
                                    }`}
                                title={formatMonth(month)}
                            />
                        ))}
                    </div>
                </div>

                {/* 滾動指示 */}
                <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-30">
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-purple-400 opacity-80"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </motion.div>
                </div>
            </div>
        </div>
    );
} 