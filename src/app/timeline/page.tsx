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

                // 不再清空所有彈幕，而是讓它們自然淡出
                // 現有定時器會在適當的時候生成新彈幕
            }
        }
    }, [currentMonth, messages]);

    // 生成彈幕 - 保證每個彈幕的完整生命週期並確保位置均衡分布
    const generateDanmakus = (monthMessages: Message[], isInitialBubble: boolean = false) => {
        // 移除這裡的暫停檢查，讓函數本身不受暫停狀態的影響
        if (!monthMessages || monthMessages.length === 0) return;

        // 固定彈幕的基本數量範圍，不再受到速度影響
        // 隨機決定這次生成1-3個彈幕
        let maxDanmakus = 4;  // 增加一般模式同時生成的最大數量為4個

        // 如果是初始泡泡模式，生成更多泡泡並確保分布均勻
        if (isInitialBubble && isBubbleMode) {
            maxDanmakus = 9;  // 初始化時固定為9個，可以均勻分布在3x3的九宮格中
        } else if (isInitialBubble && !isBubbleMode) {
            maxDanmakus = 7;  // 一般模式初始化時生成7個彈幕，增加初始彈幕數量
        }

        const danmakuCount = Math.floor(Math.random() * maxDanmakus) + 2; // 最少生成2個，增加最小生成數量

        // 從訊息中隨機選擇彈幕
        const shuffled = [...monthMessages].sort(() => 0.5 - Math.random());
        const selectedMessages = shuffled.slice(0, Math.min(danmakuCount, shuffled.length));

        // 獲取當前彈幕的數量，作為索引基數
        const currentCount = danmakus.length;

        // 使用更可靠的時間戳方式
        const now = new Date().getTime();

        // 水平範圍，分成左、中、右三個區域確保均衡分布
        const horizontalAreas = [
            { min: 5, max: 30 },    // 左側區域：5%-30%
            { min: 30, max: 55 },   // 中間區域：30%-55%
            { min: 55, max: 75 }    // 右側區域：55%-75%
        ];

        // 垂直範圍，分成更多區間以確保均勻分布
        const verticalAreas = [
            { min: 5, max: 20 },    // 頂部區域
            { min: 20, max: 35 },   // 上部區域
            { min: 35, max: 50 },   // 上中區域
            { min: 50, max: 65 },   // 下中區域
            { min: 65, max: 80 },   // 下部區域
        ];

        // 針對一般模式，檢查現有的彈幕位置，避免新彈幕產生在接近的位置
        const existingPositions = !isBubbleMode ?
            danmakus
                .filter(d => !d.isFading)
                .map(d => d.position)
            : [];

        // 為一般模式找出空閒的垂直區域
        const usedVerticalAreas = new Set();
        for (const pos of existingPositions) {
            for (let i = 0; i < verticalAreas.length; i++) {
                if (pos >= verticalAreas[i].min && pos <= verticalAreas[i].max) {
                    usedVerticalAreas.add(i);
                    break;
                }
            }
        }

        // 可用的垂直區域索引
        const availableVerticalAreas: number[] = [];
        for (let i = 0; i < verticalAreas.length; i++) {
            if (!usedVerticalAreas.has(i)) {
                availableVerticalAreas.push(i);
            }
        }

        // 至少保留一個可用區域
        if (availableVerticalAreas.length === 0) {
            availableVerticalAreas.push(Math.floor(Math.random() * verticalAreas.length));
        }

        // 為初始泡泡創建更均勻的分布
        let initialGrid: { h: number, v: number }[] = [];

        if (isInitialBubble && isBubbleMode) {
            // 創建一個3x3的網格，確保泡泡均勻覆蓋整個頁面
            for (let h = 0; h < 3; h++) {
                for (let v = 0; v < 3; v++) {
                    initialGrid.push({ h, v });
                }
            }

            // 隨機打亂網格順序
            initialGrid = initialGrid.sort(() => 0.5 - Math.random());
        }

        // 生成新彈幕
        const newDanmakus = selectedMessages.map((msg, index) => {
            // 生成絕對唯一的ID：當前時間 + 當前彈幕數量 + 索引 + 隨機數
            const uniqueId = `danmaku-${now}-${currentCount + index}-${Math.random().toString(36).substr(2, 9)}`;

            // 為泡泡模式，選擇水平和垂直區域確保均衡分布
            let bubbleHorizontalPosition = 0;
            let bubbleVerticalPosition = 0;

            if (isBubbleMode) {
                if (isInitialBubble && initialGrid.length > 0 && index < initialGrid.length) {
                    // 對於初始泡泡，從準備好的網格中取一個位置
                    const gridCell = initialGrid[index];

                    // 從網格單元格計算確切位置，增加一點隨機性但確保在各自區域
                    const hArea = horizontalAreas[gridCell.h];
                    const vArea = verticalAreas[gridCell.v % verticalAreas.length];

                    // 在指定區域內增加一點隨機性
                    bubbleHorizontalPosition = hArea.min + Math.random() * (hArea.max - hArea.min);
                    bubbleVerticalPosition = vArea.min + Math.random() * (vArea.max - vArea.min);
                } else {
                    // 非初始泡泡或超出網格數量的泡泡，隨機選擇區域
                    const horizontalArea = horizontalAreas[Math.floor(Math.random() * horizontalAreas.length)];
                    bubbleHorizontalPosition = horizontalArea.min + Math.random() * (horizontalArea.max - horizontalArea.min);

                    const verticalArea = verticalAreas[Math.floor(Math.random() * verticalAreas.length)];
                    bubbleVerticalPosition = verticalArea.min + Math.random() * (verticalArea.max - verticalArea.min);
                }
            } else {
                // 一般模式：選擇一個空閒的垂直區域
                const areaIndex = availableVerticalAreas[Math.floor(Math.random() * availableVerticalAreas.length)];
                const area = verticalAreas[areaIndex];

                // 在選擇的區域中產生隨機位置
                bubbleVerticalPosition = area.min + Math.random() * (area.max - area.min);

                // 一般模式固定水平位置為0
                bubbleHorizontalPosition = 0;
            }

            // 泡泡模式的動畫時間根據是否是初始泡泡進行調整
            // 速度影響動畫時間：速度越快，動畫時間越短
            const bubbleDuration = isInitialBubble ?
                (Math.random() * 60 + 60) / playbackSpeed : // 初始泡泡持續時間縮短
                (Math.random() * 40 + 40) / playbackSpeed;  // 正常泡泡時間也縮短

            // 彈幕模式的動畫時間 - 加快正常速度下的彈幕移動速度
            const danmakuDuration = (Math.random() * 20 + 40) / playbackSpeed; // 40-60秒，顯著縮短動畫時間

            return {
                id: uniqueId,
                content: isBubbleMode ?
                    (msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content) : // 泡泡模式允許顯示更多字數，但限制50字
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
            // 一般模式需要控制數量，但提高最大顯示數量
            const maxNormalDanmakus = 30; // 增加最大數量至30個
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
            const baseInterval = isBubbleMode ? 6000 : 6000; // 降低一般模式的基本間隔時間至6秒
            const randomVariation = isBubbleMode ? 3000 : 3000; // 減少隨機變化範圍使彈幕生成更穩定
            // 降低最小間隔，使彈幕更快生成
            const adjustedInterval = Math.max(isBubbleMode ? 3000 : 4000, (baseInterval + Math.random() * randomVariation) / playbackSpeed);

            // 立即生成第一批彈幕，不等待
            generateDanmakus(messages[currentMonth], true); // 傳入true表示初始生成

            // 設置生成彈幕的定時器，縮短延遲時間加快生成
            const timerDelay = isBubbleMode ? 1500 : 1200; // 減少初始延遲

            setTimeout(() => {
                danmakuTimerRef.current = setInterval(() => {
                    generateDanmakus(messages[currentMonth]);
                }, adjustedInterval);
            }, timerDelay);
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
                const randomVariation = isBubbleMode ? 3000 : 4000;
                const adjustedInterval = Math.max(isBubbleMode ? 3000 : 5000, (baseInterval + Math.random() * randomVariation) / playbackSpeed);

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

            // 將現有彈幕標記為淡出
            setDanmakus(prevDanmakus => {
                return prevDanmakus.map(danmaku => ({
                    ...danmaku,
                    isFading: true
                }));
            });

            // 短暫延遲後生成新的彈幕，確保速度變化有明顯視覺效果
            setTimeout(() => {
                // 如果當前是暫停狀態，我們不需要重新生成彈幕
                if (!isPaused && currentMonth && messages[currentMonth]) {
                    // 清除現有計時器
                    if (danmakuTimerRef.current) {
                        clearInterval(danmakuTimerRef.current);
                        danmakuTimerRef.current = null;
                    }

                    // 立即生成新的彈幕，確保能立即看到新速度效果
                    generateDanmakus(messages[currentMonth], true);

                    // 以新的速度重新設置計時器
                    const baseInterval = isBubbleMode ? 6000 : 7000;
                    const randomVariation = isBubbleMode ? 3000 : 4000;

                    // 速度越快，產生彈幕越頻繁
                    const adjustedInterval = Math.max(isBubbleMode ? 3000 : 5000, (baseInterval + Math.random() * randomVariation) / speed);

                    // 短暫延遲後設置新的計時器
                    const timerDelay = 3000;
                    setTimeout(() => {
                        danmakuTimerRef.current = setInterval(() => {
                            generateDanmakus(messages[currentMonth]);
                        }, adjustedInterval);
                    }, timerDelay);
                }
            }, 400); // 給淡出效果一點時間
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

                // 立即生成一些彈幕，不等待定時器
                if (timestamps[0] && messages[timestamps[0]]) {
                    // 縮短延遲時間，更快生成彈幕
                    setTimeout(() => {
                        generateDanmakus(messages[timestamps[0]], true);

                        // 縮短延遲時間並增加初始化彈幕批次
                        setTimeout(() => {
                            generateDanmakus(messages[timestamps[0]]);

                            // 再增加一批初始彈幕，使畫面更快填充
                            setTimeout(() => {
                                generateDanmakus(messages[timestamps[0]]);
                            }, 400);
                        }, 400);
                    }, 100);
                }
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
        // 將現有彈幕設為淡出狀態，而不是直接清空
        setDanmakus(current => current.map(d => ({ ...d, isFading: true })));

        // 切換模式
        setIsBubbleMode(!isBubbleMode);

        // 切換模式後立即重新生成彈幕
        if (currentMonth && messages[currentMonth]) {
            // 給淡出效果一點時間，然後生成新的彈幕
            setTimeout(() => {
                // 初始一次性生成更多泡泡
                if (!isBubbleMode) { // 切換到泡泡模式
                    // 連續分批生成泡泡，避免同時生成過多導致性能問題
                    const bubbleBatchCount = 3; // 批次數
                    const bubbleBatchSize = 5; // 每批泡泡數

                    for (let i = 0; i < bubbleBatchCount; i++) {
                        setTimeout(() => {
                            // 第一批使用初始化參數true，後續批次使用false
                            generateDanmakus(messages[currentMonth], i === 0);
                        }, i * 500); // 增加間隔，確保泡泡有序生成
                    }
                } else {
                    // 切換到普通模式
                    generateDanmakus(messages[currentMonth], true);
                }
            }, 300); // 更長的延遲，確保淡出效果明顯
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
                                scale: playbackSpeed === 1 ? 0.8 :
                                    playbackSpeed === 2 ? 0.7 :
                                        0.6  // 速度越快，初始縮放越小，視覺效果更明顯
                            } : // 泡泡模式：直接在指定位置顯示
                            {
                                x: '120vw', // 從右側更近的位置開始移動，縮短初始移動距離
                                y: `${danmaku.position}%`,
                                opacity: 0.7
                            } // 一般模式：從右側開始，固定垂直位置
                        }
                        animate={danmaku.isFading ?
                            // 根據模式不同使用不同的淡出動畫
                            (isBubbleMode ?
                                {
                                    opacity: 0,
                                    scale: playbackSpeed === 1 ? 0.5 :
                                        playbackSpeed === 2 ? 0.4 :
                                            0.3, // 速度越快，淡出時縮放越小
                                    transition: { duration: 0.8 / playbackSpeed, ease: "easeOut" }
                                } :
                                {
                                    opacity: 0,
                                    transition: { duration: 0.3 / playbackSpeed, ease: "easeOut" } // 縮短一般模式淡出時間
                                }
                            ) : // 如果正在淡出，使用相應的淡出效果
                            (isBubbleMode ?
                                {
                                    // 依據播放速度決定最終顯示狀態
                                    scale: playbackSpeed === 1 ? 1 :
                                        playbackSpeed === 2 ? 1 :
                                            1, // 保持統一的基準大小
                                    opacity: 0.95, // 保持一致的不透明度
                                } : // 泡泡模式的顯示狀態
                                {
                                    x: '-70vw', // 減少移動距離，使彈幕更快通過畫面
                                    opacity: 0.92 // 提高不透明度，使彈幕更加明顯
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
                                delay: isBubbleMode ? (danmaku.animationDelay / playbackSpeed) : 0, // 一般模式不使用延遲，讓彈幕立即開始移動
                                ease: "linear", // 所有動畫使用線性緩動，減少變化
                                opacity: {
                                    duration: isBubbleMode ? 1 / playbackSpeed : 3 / playbackSpeed, // 縮短一般模式的透明度過渡時間
                                    ease: "linear"
                                },
                                x: isBubbleMode ? undefined : { // 泡泡模式不設置x軸動畫
                                    // 一般模式使用線性平滑運動，避免抖動
                                    duration: danmaku.duration / playbackSpeed, // 重新添加速度調整
                                    ease: "linear"
                                },
                                scale: isBubbleMode ? {
                                    // 依據播放速度調整動畫時間和縮放幅度
                                    duration: playbackSpeed === 1 ? 5 :
                                        playbackSpeed === 2 ? 3 :
                                            2, // 不同速度使用不同的動畫時間
                                    repeat: Infinity,
                                    repeatType: "reverse", // 使用reverse而非mirror，更平滑
                                    ease: "easeInOut", // 使用easeInOut緩動
                                    // 不同速度下使用不同的縮放幅度
                                    from: playbackSpeed === 1 ? 0.97 :
                                        playbackSpeed === 2 ? 0.96 :
                                            0.95, // 速度越快，收縮幅度越大
                                    to: playbackSpeed === 1 ? 1.03 :
                                        playbackSpeed === 2 ? 1.04 :
                                            1.05, // 速度越快，放大幅度越大
                                } : undefined
                            } : (isBubbleMode ?
                                { duration: 0.8 / playbackSpeed, ease: "easeOut" } : // 重新添加速度調整
                                { duration: 0.3 / playbackSpeed, ease: "easeOut" } // 重新添加速度調整
                            ))
                        }
                        // 當動畫完成後，處理元素的淡出或移除
                        onAnimationComplete={() => {
                            // 如果是淡出狀態且動畫已完成，直接從DOM移除
                            if (danmaku.isFading) {
                                setDanmakus(current => current.filter(d => d.id !== danmaku.id));
                                return;
                            }

                            // 檢查創建時間，確保彈幕存在時間達到一定長度才處理
                            const now = Date.now();
                            const creationTime = danmaku.createdAt || now;
                            const existTime = now - creationTime;

                            // 最短存在時間需達到動畫時間的75%
                            const minExistTime = danmaku.duration * 750; // 轉換為毫秒並取75%

                            // 如果存在時間不足，不進行任何操作，等待下一次onAnimationComplete觸發
                            if (existTime < minExistTime) {
                                return;
                            }

                            // 泡泡模式和一般模式使用不同的處理方式
                            if (isBubbleMode) {
                                // 泡泡模式：設置一個較長的存在時間，確保泡泡有足夠顯示時間
                                const bubbleLifetime = Math.max(8000, danmaku.duration * 1000); // 至少8秒或動畫時間

                                setTimeout(() => {
                                    // 使用漸變淡出，而不是立即設置淡出標誌
                                    setDanmakus(current =>
                                        current.map(d =>
                                            d.id === danmaku.id
                                                ? { ...d, isFading: true }
                                                : d
                                        )
                                    );
                                }, bubbleLifetime);
                            } else {
                                // 一般彈幕模式：不在動畫完成時立即處理，而是使用計時器延遲處理
                                // 計算更長的緩衝時間確保彈幕完全移出視窗
                                const safetyBuffer = Math.max(2000, danmaku.duration * 0.1 * 1000); // 至少2秒或10%的動畫時間

                                // 使用計時器，即使動畫提前完成，也會等待足夠時間才移除彈幕
                                setTimeout(() => {
                                    setDanmakus(current => current.filter(d => d.id !== danmaku.id));
                                }, safetyBuffer);
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
                                padding: '0.8rem 1.2rem', // 稍微減小內邊距，給文字更多空間
                                textAlign: 'left', // 文字左對齊，更自然
                            } : {
                                // 一般模式特有樣式
                                transform: 'translate3d(0, 0, 0)', // 開啟硬體加速
                                backfaceVisibility: 'hidden', // 優化渲染
                                margin: 0, // 清除邊距
                                lineHeight: '1.4', // 增加行高，防止文字抖動
                                opacity: 0.92, // 提高固定透明度，使彈幕更加明顯
                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)', // 增加微妙陰影提高可辨識度
                                minWidth: '100px', // 確保彈幕有足夠寬度
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