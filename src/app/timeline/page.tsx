'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { parseLineChat } from '@/utils/lineParser';

// 定義訊息介面
interface Message {
    content: string;
    sender: string;
    timestamp: string;
}

// 定義彈幕介面
interface Danmaku {
    id: number | string;
    content: string;
    sender: string;
    duration: number;
    position: number;
    animationDelay: number;
    colorIndex: number;
    horizontalPosition: number;
    createdAt?: number; // 添加創建時間
    isFading?: boolean; // 是否正在淡出
}

export default function Timeline() {
    const router = useRouter();
    const [timestamps, setTimestamps] = useState<string[]>([]);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [currentMonth, setCurrentMonth] = useState<string>('');
    const [danmakus, setDanmakus] = useState<Danmaku[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMemoryEffect, setShowMemoryEffect] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [scrollPosition, setScrollPosition] = useState<number>(0);
    const [isBubbleMode, setIsBubbleMode] = useState<boolean>(false);
    const timelineRef = useRef<HTMLDivElement>(null);
    const danmakuTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    useEffect(() => {
        // 當當前月份變更時，先淡出現有彈幕，然後生成新的彈幕
        if (currentMonth && messages[currentMonth]) {
            if (danmakus.length > 0) {
                // 設置所有現有彈幕為淡出模式
                const fadingDanmakus = danmakus.map(danmaku => ({
                    ...danmaku,
                    isFading: true
                }));
                setDanmakus(fadingDanmakus);

                // 等待淡出動畫完成後再清除所有彈幕並生成新的
                setTimeout(() => {
                    setDanmakus([]);
                    // 不在這裡直接生成彈幕，避免重複觸發
                    // 讓定時器的useEffect去負責生成第一批彈幕
                }, 1000); // 1秒淡出時間
            }
            // 移除這裡直接呼叫generateDanmakus，避免與定時器觸發的重複
        }
    }, [currentMonth, messages]);

    // 生成彈幕 - 保證每個彈幕的完整生命週期
    const generateDanmakus = (monthMessages: Message[], isInitialBubble: boolean = false) => {
        // 移除這裡的暫停檢查，讓函數本身不受暫停狀態的影響
        if (!monthMessages || monthMessages.length === 0) return;

        // 固定彈幕的基本數量範圍，不再受到速度影響
        // 隨機決定這次生成1-3個彈幕
        let maxDanmakus = 3;  // 固定最大數量，不受速度影響

        // 如果是初始泡泡模式，生成更多泡泡
        if (isInitialBubble && isBubbleMode) {
            maxDanmakus = 8;  // 初始化時固定數量
        }

        const danmakuCount = Math.floor(Math.random() * maxDanmakus) + 1; // 最少生成1個

        // 從訊息中隨機選擇彈幕
        const shuffled = [...monthMessages].sort(() => 0.5 - Math.random());
        const selectedMessages = shuffled.slice(0, Math.min(danmakuCount, shuffled.length));

        // 獲取當前彈幕的數量，作為索引基數
        const currentCount = danmakus.length;

        // 使用更可靠的時間戳方式
        const now = new Date().getTime();

        // 生成新彈幕
        const newDanmakus = selectedMessages.map((msg, index) => {
            // 生成絕對唯一的ID：當前時間 + 當前彈幕數量 + 索引 + 隨機數
            const uniqueId = now + ((currentCount + index) * 100000) + Math.floor(Math.random() * 10000);

            // 為泡泡模式設定完全隨機的水平位置，覆蓋整個螢幕寬度
            const bubbleHorizontalPosition = isBubbleMode ?
                5 + Math.random() * 90 : // 泡泡模式：5%-95%範圍內隨機分布，覆蓋更廣的區域
                0; // 一般模式固定在左邊

            // 為泡泡模式設定隨機的垂直位置，覆蓋整個螢幕高度
            const bubbleVerticalPosition = isBubbleMode ?
                10 + Math.random() * 80 : // 泡泡模式時，在10%-90%範圍內隨機分布，更均勻的覆蓋
                5 + (Math.random() * 85); // 一般模式，隨機垂直位置

            // 泡泡模式的動畫時間根據是否是初始泡泡進行調整
            // 速度影響動畫時間：速度越快，動畫時間越短
            const bubbleDuration = isInitialBubble ?
                (Math.random() * 60 + 60) / playbackSpeed : // 初始泡泡持續時間縮短
                (Math.random() * 40 + 40) / playbackSpeed;  // 正常泡泡時間也縮短

            // 彈幕模式的動畫時間
            const danmakuDuration = (Math.random() * 25 + 25) / playbackSpeed; // 一般模式減少動畫時間為25-50秒

            return {
                id: uniqueId,
                content: isBubbleMode ?
                    (msg.content.length > 20 ? msg.content.substring(0, 20) + '...' : msg.content) : // 泡泡模式下增加可顯示字數
                    msg.content, // 一般模式顯示完整內容，不截斷
                sender: msg.sender,
                // 延長基礎動畫時間
                duration: isBubbleMode ?
                    bubbleDuration : // 泡泡模式：使用計算好的時間
                    danmakuDuration, // 一般模式：使用更短的動畫時間
                position: bubbleVerticalPosition, // 使用新計算的垂直位置
                animationDelay: isBubbleMode ? Math.random() * 0.5 : Math.random() * (1 / playbackSpeed), // 泡泡模式延遲更短
                colorIndex: senderColors[msg.sender] || 0,
                horizontalPosition: bubbleHorizontalPosition, // 使用新計算的水平位置
                createdAt: Date.now() // 記錄彈幕創建時間
            };
        });

        // 直接添加新彈幕到現有彈幕，不再限制數量
        setDanmakus(prevDanmakus => {
            // 如果是泡泡模式，需要控制數量
            if (isBubbleMode) {
                const maxBubbles = isInitialBubble ? 30 : 25; // 初始化或一般泡泡模式的最大數量
                return [...prevDanmakus, ...newDanmakus].slice(-maxBubbles);
            }
            // 一般模式也需要控制數量，最多30個，防止生成過多
            const maxNormalDanmakus = 30;
            return [...prevDanmakus, ...newDanmakus].slice(-maxNormalDanmakus);
        });
    };

    // 持續生成彈幕的定時器，並且定時清理已完成動畫的彈幕
    useEffect(() => {
        // 清除舊的定時器
        if (danmakuTimerRef.current) {
            clearInterval(danmakuTimerRef.current);
            danmakuTimerRef.current = null;
        }

        // 只有在非暫停狀態下才生成新彈幕
        if (currentMonth && messages[currentMonth] && !isPaused) {
            // 調整生成間隔，確保生成頻率受速度影響
            // 速度越快，間隔越短，彈幕出現得越頻繁
            const baseInterval = isBubbleMode ? 6000 : 7000; // 一般模式增加基本間隔時間
            const randomVariation = isBubbleMode ? 3000 : 3000; // 隨機變化範圍
            // 確保最小間隔，防止彈幕生成過快
            const adjustedInterval = Math.max(3000, (baseInterval + Math.random() * randomVariation) / playbackSpeed);

            // 設置生成彈幕的定時器
            danmakuTimerRef.current = setInterval(() => {
                generateDanmakus(messages[currentMonth]);
            }, adjustedInterval);

            // 立即生成第一批彈幕
            setTimeout(() => {
                generateDanmakus(messages[currentMonth], true); // 傳入true表示初始生成
            }, 300);
        }

        // 確保在組件卸載時清除
        return () => {
            if (danmakuTimerRef.current) {
                clearInterval(danmakuTimerRef.current);
                danmakuTimerRef.current = null;
            }
        };
    }, [currentMonth, messages, isPaused, isBubbleMode, playbackSpeed]);

    const handlePauseToggle = () => {
        // 切換暫停/播放狀態
        setIsPaused(prevPaused => !prevPaused);

        // 從暫停切換為播放
        if (isPaused && currentMonth && messages[currentMonth]) {
            // 當恢復播放時，立即生成一批彈幕
            setTimeout(() => {
                // 設置一個新的定時器來生成彈幕
                const baseInterval = isBubbleMode ? 6000 : 7000;
                const randomVariation = isBubbleMode ? 3000 : 3000;
                const adjustedInterval = Math.max(3000, (baseInterval + Math.random() * randomVariation) / playbackSpeed);

                // 清除現有計時器
                if (danmakuTimerRef.current) {
                    clearInterval(danmakuTimerRef.current);
                    danmakuTimerRef.current = null;
                }

                // 立即生成一批彈幕
                generateDanmakus(messages[currentMonth], true);

                // 設置定時器繼續生成彈幕
                danmakuTimerRef.current = setInterval(() => {
                    generateDanmakus(messages[currentMonth]);
                }, adjustedInterval);
            }, 300);
        }
        // 從播放切換為暫停
        else if (!isPaused) {
            // 清除定時器，停止生成新彈幕
            if (danmakuTimerRef.current) {
                clearInterval(danmakuTimerRef.current);
                danmakuTimerRef.current = null;
            }
        }
    };

    const handleSpeedChange = (speed: number) => {
        // 如果速度改變了，更新當前所有彈幕的動畫速度
        if (speed !== playbackSpeed) {
            // 儲存舊的播放速度，用於計算原始持續時間
            const oldSpeed = playbackSpeed;

            // 更新播放速度
            setPlaybackSpeed(speed);

            // 更新所有彈幕以反映新的速度
            setDanmakus(prevDanmakus => {
                return prevDanmakus.map(danmaku => {
                    // 計算原始持續時間（未經過速度調整）
                    // 由於danmaku.duration已經除以了oldSpeed，所以我們需要乘以oldSpeed來獲取原始值
                    const originalDuration = danmaku.duration * oldSpeed;

                    return {
                        ...danmaku,
                        // 使用新的速度調整持續時間
                        duration: originalDuration / speed,
                        // 創建一個新ID，強制React重新創建元素，確保動畫立即生效
                        id: `${typeof danmaku.id === 'number' ? danmaku.id : danmaku.id.split('-')[0]}-speed-${Date.now()}`
                    };
                });
            });

            // 如果當前是暫停狀態，我們不需要重新生成彈幕
            if (!isPaused && currentMonth && messages[currentMonth]) {
                // 清除現有計時器
                if (danmakuTimerRef.current) {
                    clearInterval(danmakuTimerRef.current);
                    danmakuTimerRef.current = null;
                }

                // 以新的速度重新設置計時器
                const baseInterval = isBubbleMode ? 6000 : 7000;
                const randomVariation = isBubbleMode ? 3000 : 3000;
                const adjustedInterval = Math.max(3000, (baseInterval + Math.random() * randomVariation) / speed);

                // 設置新的計時器
                danmakuTimerRef.current = setInterval(() => {
                    generateDanmakus(messages[currentMonth]);
                }, adjustedInterval);
            }
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
            // 延遲以確保 DOM 已完全渲染
            setTimeout(() => {
                setCurrentMonth(timestamps[0]);

                // 立即生成一些彈幕，不等待定時器
                if (timestamps[0] && messages[timestamps[0]]) {
                    setTimeout(() => {
                        generateDanmakus(messages[timestamps[0]]);
                    }, 200);
                }
            }, 200);
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
        // 先清空彈幕
        setDanmakus([]);
        // 切換模式
        setIsBubbleMode(!isBubbleMode);
        // 切換模式後立即重新生成彈幕
        if (currentMonth && messages[currentMonth]) {
            setTimeout(() => {
                // 初始一次性生成更多泡泡
                if (!isBubbleMode) { // 切換到泡泡模式
                    // 連續生成泡泡，數量控制更明確
                    const bubbleBatchCount = 3; // 減少批次數，避免過多泡泡
                    for (let i = 0; i < bubbleBatchCount; i++) {
                        setTimeout(() => {
                            generateDanmakus(messages[currentMonth], true);
                        }, i * 300); // 減少間隔，加速初始產生
                    }
                } else {
                    generateDanmakus(messages[currentMonth]);
                }
            }, 100);
        }
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
                                src="/line-chat.svg"
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
            {/* 彈幕區域 - 覆蓋整個頁面 */}
            <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
                {danmakus.map((danmaku) => (
                    <motion.div
                        key={danmaku.id}
                        initial={isBubbleMode ?
                            {
                                y: `${danmaku.position}%`,
                                x: `${danmaku.horizontalPosition}%`,
                                opacity: 0,
                                scale: 0.5
                            } : // 泡泡模式：直接在指定位置顯示
                            {
                                x: '110vw',
                                y: `${danmaku.position}%`,
                                opacity: 0.7
                            } // 一般模式：從右側開始，固定垂直位置
                        }
                        animate={danmaku.isFading ?
                            // 根據模式不同使用不同的淡出動畫
                            (isBubbleMode ?
                                {
                                    opacity: 0,
                                    scale: 0.5,
                                    transition: { duration: 0.8 / playbackSpeed, ease: "easeOut" }
                                } :
                                {
                                    opacity: 0,
                                    transition: { duration: 0.3 / playbackSpeed, ease: "easeOut" } // 縮短一般模式淡出時間
                                }
                            ) : // 如果正在淡出，使用相應的淡出效果
                            (isBubbleMode ?
                                {
                                    // 泡泡模式：使用更小幅度的縮放動畫
                                    scale: 1.005, // 從1.01縮小到1.005，讓動畫更加微妙
                                    opacity: 0.95, // 保持一致的不透明度
                                } : // 泡泡模式：簡化動畫，只保留縮放效果，移除位置變化
                                {
                                    x: '-10vw', // 只移動到畫面外，不用移動太遠
                                    opacity: 0.85 // 保持一致的不透明度
                                } // 普通模式：移動距離，不再設置y值避免抖動
                            )
                        }
                        // 暫停時暫停所有動畫，但保留當前顯示
                        transition={isPaused ?
                            {
                                // 暫停時使用非常長的動畫時間，實質上凍結動畫在當前狀態
                                duration: 999999,
                                ease: "linear"
                            } :
                            (!danmaku.isFading ? {
                                duration: danmaku.duration / playbackSpeed, // 重新添加速度調整
                                delay: danmaku.animationDelay / playbackSpeed, // 延遲也應該根據速度調整
                                ease: "linear", // 所有動畫使用線性緩動，減少變化
                                opacity: {
                                    duration: isBubbleMode ? 1 / playbackSpeed : danmaku.duration * 0.1 / playbackSpeed, // 重新添加速度調整
                                    ease: "linear"
                                },
                                x: isBubbleMode ? undefined : { // 泡泡模式不設置x軸動畫
                                    // 一般模式使用線性平滑運動，避免抖動
                                    duration: danmaku.duration / playbackSpeed, // 重新添加速度調整
                                    ease: "linear"
                                },
                                scale: isBubbleMode ? {
                                    duration: 4 / playbackSpeed, // 重新添加速度調整
                                    repeat: Infinity,
                                    repeatType: "reverse", // 使用reverse而非mirror，更平滑
                                    ease: "easeInOut", // 使用easeInOut緩動，讓動畫更柔和
                                } : undefined
                            } : (isBubbleMode ?
                                { duration: 0.8 / playbackSpeed, ease: "easeOut" } : // 重新添加速度調整
                                { duration: 0.3 / playbackSpeed, ease: "easeOut" } // 重新添加速度調整
                            ))
                        }
                        // 當動畫完成後，再從DOM移除元素
                        onAnimationComplete={() => {
                            // 如果是淡出狀態且動畫已完成，直接從DOM移除
                            if (danmaku.isFading) {
                                setDanmakus(current => current.filter(d => d.id !== danmaku.id));
                                return;
                            }

                            // 泡泡模式和一般模式使用不同的處理方式
                            if (isBubbleMode) {
                                // 泡泡模式：設置一個固定的延遲後淡出，不依賴動畫完成
                                // 泡泡模式下，直接設置一個短時間後自動淡出
                                setTimeout(() => {
                                    setDanmakus(current =>
                                        current.map(d =>
                                            d.id === danmaku.id
                                                ? { ...d, isFading: true }
                                                : d
                                        )
                                    );
                                }, 5000); // 5秒後淡出，確保泡泡不會永久存在
                            } else {
                                // 一般彈幕模式：直接移除，不需要淡出效果
                                // 因為彈幕已經移出畫面了
                                setDanmakus(current => current.filter(d => d.id !== danmaku.id));
                            }
                        }}
                        className={`danmaku border ${colorClasses[danmaku.colorIndex]} ${isBubbleMode ? 'danmaku-bubble' : 'danmaku-normal'}`}
                        style={{
                            position: 'absolute', // 使用絕對定位
                            top: `${danmaku.position}%`, // 垂直位置
                            left: isBubbleMode ? `${danmaku.horizontalPosition}%` : 'auto', // 水平位置
                            height: !isBubbleMode ? '40px' : 'auto', // 一般模式固定高度
                            width: !isBubbleMode ? 'auto' : 'auto', // 自動寬度
                            zIndex: 50 + Math.floor(danmaku.position / 5), // 根據垂直位置設置層級，確保不同層不會干擾
                            willChange: 'transform', // 提示瀏覽器準備變化，優化渲染性能
                            ...(isBubbleMode ? {
                                // 泡泡模式特有樣式
                                transform: 'translate3d(0, 0, 0)', // 開啟硬體加速
                                backfaceVisibility: 'hidden', // 優化渲染
                                margin: 0, // 移除邊距，避免影響位置
                                padding: '1rem', // 固定內邊距
                                textAlign: 'center', // 文字居中
                            } : {
                                // 一般模式特有樣式
                                transform: 'translate3d(0, 0, 0)', // 開啟硬體加速
                                backfaceVisibility: 'hidden', // 優化渲染
                                margin: 0, // 清除邊距
                                lineHeight: '1.4', // 增加行高，防止文字抖動
                                opacity: 0.85, // 固定透明度，避免透明度變化導致的抖動
                            })
                        }}
                    >
                        <span className={`font-medium mr-2 ${colorClasses[danmaku.colorIndex].split(' ')[1]}`}>{danmaku.sender}:</span>
                        {danmaku.content}
                    </motion.div>
                ))}
            </div>

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
                    aria-label={isBubbleMode ? "切換至水平彈幕" : "切換至垂直彈幕"}
                    title={isBubbleMode ? "切換至水平彈幕" : "切換至垂直彈幕"}
                >
                    {isBubbleMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    )}
                </button>

                <div className="flex bg-purple-50 rounded-xl p-1">
                    <button
                        onClick={() => handleSpeedChange(1)}
                        className={`px-2 py-1 text-xs rounded-lg transition-colors ${playbackSpeed === 1 ? 'bg-purple-600 text-white' : 'text-purple-700 hover:bg-purple-100'}`}
                        title="正常速度"
                    >
                        1x
                    </button>
                    <button
                        onClick={() => handleSpeedChange(2.0)}
                        className={`px-2 py-1 text-xs rounded-lg transition-colors ${playbackSpeed === 2.0 ? 'bg-purple-600 text-white' : 'text-purple-700 hover:bg-purple-100'}`}
                        title="快速"
                    >
                        2.0x
                    </button>
                    <button
                        onClick={() => handleSpeedChange(3.0)}
                        className={`px-2 py-1 text-xs rounded-lg transition-colors ${playbackSpeed === 3.0 ? 'bg-purple-600 text-white' : 'text-purple-700 hover:bg-purple-100'}`}
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