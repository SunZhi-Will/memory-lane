'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';

// 定義彈幕介面
export interface Danmaku {
    id: number | string;
    content: string;
    sender: string;
    duration: number;
    position: number;
    animationDelay: number;
    colorIndex: number;
    horizontalPosition: number;
    createdAt?: number;
    isFading?: boolean;
    originalPlaybackSpeed?: number;
}

// 定義訊息介面
export interface Message {
    content: string;
    sender: string;
    timestamp: string;
}

// 彈幕元件接收的屬性
interface DanmakuProps {
    currentMonth: string;
    messages: Record<string, Message[]>;
    isPaused: boolean;
    playbackSpeed: number;
    isBubbleMode: boolean;
    colorClasses: string[];
    senderColors: Record<string, number>;
}

// 导出彈幕元件控制介面，讓父元件可以訪問彈幕元件的方法
export interface DanmakuHandles {
    resetDanmaku: (isInitial?: boolean) => void;
    pauseDanmaku: () => void;
    resumeDanmaku: () => void;
}

// 使用forwardRef創建可被父元件引用的彈幕元件
const DanmakuComponent = forwardRef<DanmakuHandles, DanmakuProps>(({
    currentMonth,
    messages,
    isPaused,
    playbackSpeed,
    isBubbleMode,
    colorClasses,
    senderColors
}, ref) => {
    const [danmakus, setDanmakus] = useState<Danmaku[]>([]);
    const danmakuTimerRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

    // 清理所有定時器
    const clearAllTimers = () => {
        if (danmakuTimerRef.current) {
            clearInterval(danmakuTimerRef.current);
            danmakuTimerRef.current = null;
        }

        // 清除所有存儲的timeout
        timeoutRefs.current.forEach(timeout => {
            clearTimeout(timeout);
        });
        timeoutRefs.current = [];
    };

    // 重置彈幕系統的函數，可以從外部調用
    const resetDanmakuSystem = (isInitial: boolean = false) => {
        // 清除舊的定時器和所有timeout
        clearAllTimers();

        // 如果需要清空彈幕
        if (isInitial) {
            setDanmakus([]);
        } else {
            // 將所有現有彈幕標記為淡出
            setDanmakus(prevDanmakus =>
                prevDanmakus.map(danmaku => ({
                    ...danmaku,
                    isFading: true,
                    originalPlaybackSpeed: playbackSpeed
                }))
            );
        }
    };

    // 暫停彈幕
    const pauseDanmaku = () => {
        if (danmakuTimerRef.current) {
            clearInterval(danmakuTimerRef.current);
            danmakuTimerRef.current = null;
        }
    };

    // 恢復彈幕
    const resumeDanmaku = () => {
        if (!danmakuTimerRef.current && currentMonth && messages[currentMonth]) {
            const baseInterval = isBubbleMode ? 6000 : 6000;
            const randomVariation = isBubbleMode ? 3000 : 3000;
            const adjustedInterval = Math.max(
                isBubbleMode ? 3000 : 4000,
                (baseInterval + Math.random() * randomVariation) / playbackSpeed
            );

            danmakuTimerRef.current = setInterval(() => {
                generateDanmakus(messages[currentMonth]);
            }, adjustedInterval);
        }
    };

    // 向父元件暴露方法
    useImperativeHandle(ref, () => ({
        resetDanmaku: resetDanmakuSystem,
        pauseDanmaku,
        resumeDanmaku
    }));

    // 生成彈幕的函數
    const generateDanmakus = (monthMessages: Message[], isInitialBubble: boolean = false) => {
        if (!monthMessages || monthMessages.length === 0) return;

        // 固定彈幕的基本數量範圍
        let maxDanmakus = 4;

        // 根據模式和是否為初始化調整生成數量
        if (isInitialBubble && isBubbleMode) {
            maxDanmakus = 12;
        } else if (isInitialBubble && !isBubbleMode) {
            maxDanmakus = 7;
        } else if (isBubbleMode) {
            maxDanmakus = 6;
        }

        const danmakuCount = Math.floor(Math.random() * maxDanmakus) + 2;

        // 從訊息中隨機選擇彈幕
        const shuffled = [...monthMessages].sort(() => 0.5 - Math.random());
        const selectedMessages = shuffled.slice(0, Math.min(danmakuCount, shuffled.length));

        // 獲取當前彈幕的數量，作為索引基數
        const currentCount = danmakus.length;

        // 使用更可靠的時間戳方式
        const now = new Date().getTime();

        // 水平範圍，分成左、中、右三個區域確保均衡分布
        const horizontalAreas = [
            { min: 5, max: 25 },    // 左側區域：5%-25%
            { min: 28, max: 48 },   // 左中區域：28%-48%
            { min: 52, max: 72 },   // 右中區域：52%-72%
            { min: 75, max: 90 }    // 右側區域：75%-90%
        ];

        // 垂直範圍，分成更多區間以確保均勻分布
        const verticalAreas = [
            { min: 5, max: 20 },    // 頂部區域
            { min: 22, max: 37 },   // 上部區域
            { min: 40, max: 55 },   // 中部區域
            { min: 58, max: 73 },   // 下部區域
            { min: 76, max: 90 },   // 底部區域
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
            // 創建一個4x5的網格，確保泡泡均勻覆蓋整個頁面
            for (let h = 0; h < 4; h++) {
                for (let v = 0; v < 5; v++) {
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

            // 設定基本持續時間 - 不受速度影響的初始值
            // 標準持續時間（以秒為單位）- 後續會根據播放速度調整
            const baseDuration = isBubbleMode ?
                (isInitialBubble ? (Math.random() * 30 + 80) : (Math.random() * 30 + 60)) :
                (Math.random() * 30 + 70);

            // 根據當前播放速度調整實際持續時間
            const adjustedDuration = baseDuration / playbackSpeed;

            // 泡泡模式和水平彈幕模式的延遲時間也不同
            const animDelay = isBubbleMode ?
                Math.random() * 0.5 / playbackSpeed :
                0;

            return {
                id: uniqueId,
                content: isBubbleMode ?
                    (msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content) :
                    msg.content,
                sender: msg.sender,
                duration: adjustedDuration,
                position: bubbleVerticalPosition,
                animationDelay: animDelay,
                colorIndex: senderColors[msg.sender] || 0,
                horizontalPosition: bubbleHorizontalPosition,
                createdAt: Date.now(),
                originalPlaybackSpeed: playbackSpeed
            };
        });

        // 直接添加新彈幕到現有彈幕，不再限制數量
        setDanmakus(prevDanmakus => {
            // 如果是泡泡模式，需要控制數量
            if (isBubbleMode) {
                const maxBubbles = isInitialBubble ? 40 : 30;
                return [...prevDanmakus, ...newDanmakus].slice(-maxBubbles);
            }
            // 一般模式需要控制數量，但提高最大顯示數量
            const maxNormalDanmakus = 30;
            return [...prevDanmakus, ...newDanmakus].slice(-maxNormalDanmakus);
        });
    };

    // 在組件卸載時清理所有定時器
    useEffect(() => {
        return () => {
            clearAllTimers();
        };
    }, []);

    // 當月份、暫停狀態或模式改變時重置彈幕系統
    useEffect(() => {
        // 清理所有之前的定時器
        clearAllTimers();

        // 標記現有的彈幕為淡出狀態
        setDanmakus(prevDanmakus =>
            prevDanmakus.map(danmaku => ({
                ...danmaku,
                isFading: true,
                originalPlaybackSpeed: playbackSpeed
            }))
        );

        // 在延遲後重新初始化彈幕
        const resetTimer = setTimeout(() => {
            // 清除舊彈幕
            setDanmakus(prevDanmakus =>
                prevDanmakus.filter(danmaku => !danmaku.isFading)
            );

            // 只有在非暫停狀態下才生成新彈幕
            if (currentMonth && messages[currentMonth] && !isPaused) {
                const baseInterval = isBubbleMode ? 6000 : 6000;
                const randomVariation = isBubbleMode ? 3000 : 3000;
                const adjustedInterval = Math.max(
                    isBubbleMode ? 3000 : 4000,
                    (baseInterval + Math.random() * randomVariation) / playbackSpeed
                );

                // 立即生成第一批彈幕
                generateDanmakus(messages[currentMonth], true);

                // 設置生成彈幕的定時器
                const timerDelay = isBubbleMode ? 1500 : 1200;

                const timer = setTimeout(() => {
                    danmakuTimerRef.current = setInterval(() => {
                        generateDanmakus(messages[currentMonth]);
                    }, adjustedInterval);
                }, timerDelay);

                // 保存timeout引用以便後續清理
                timeoutRefs.current.push(timer);
            }
        }, 600);

        // 保存timeout引用以便後續清理
        timeoutRefs.current.push(resetTimer);

        return () => {
            clearAllTimers();
        };
    }, [currentMonth, messages, isPaused, isBubbleMode, playbackSpeed]);

    return (
        <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
            {danmakus.map((danmaku) => (
                <motion.div
                    key={danmaku.id}
                    initial={isBubbleMode ?
                        {
                            y: `${danmaku.position}%`,
                            x: `${danmaku.horizontalPosition}%`,
                            opacity: 0,
                            scale: playbackSpeed === 1 ? 0.7 :
                                playbackSpeed === 2 ? 0.6 :
                                    0.5
                        } :
                        {
                            x: '120vw',
                            y: `${danmaku.position}%`,
                            opacity: 0.3
                        }
                    }
                    animate={danmaku.isFading ?
                        (isBubbleMode ?
                            {
                                opacity: 0,
                                scale: (danmaku.originalPlaybackSpeed || playbackSpeed) === 1 ? 0.5 :
                                    (danmaku.originalPlaybackSpeed || playbackSpeed) === 2 ? 0.4 :
                                        0.3,
                                transition: { duration: 0.8 / (danmaku.originalPlaybackSpeed || playbackSpeed), ease: "easeOut" }
                            } :
                            {
                                opacity: 0,
                                transition: { duration: 0.5 / (danmaku.originalPlaybackSpeed || playbackSpeed), ease: "easeOut" }
                            }
                        ) :
                        (isBubbleMode ?
                            {
                                scale: playbackSpeed === 1 ? 1 :
                                    playbackSpeed === 2 ? 1 :
                                        1,
                                opacity: 0.97,
                            } :
                            {
                                x: '-120vw',
                                opacity: 0.97
                            }
                        )
                    }
                    transition={isPaused ?
                        {
                            duration: 999999,
                            ease: "linear"
                        } :
                        (!danmaku.isFading ? {
                            duration: danmaku.duration / playbackSpeed,
                            delay: isBubbleMode ? (danmaku.animationDelay / playbackSpeed) : 0,
                            ease: "linear",
                            opacity: {
                                duration: isBubbleMode ? 1.5 / playbackSpeed : 2 / playbackSpeed,
                                ease: "easeInOut"
                            },
                            x: isBubbleMode ? undefined : {
                                duration: danmaku.duration / playbackSpeed,
                                ease: "linear"
                            },
                            scale: isBubbleMode ? {
                                duration: playbackSpeed === 1 ? 5 :
                                    playbackSpeed === 2 ? 3 :
                                        2,
                                repeat: Infinity,
                                repeatType: "reverse",
                                ease: "easeInOut",
                                from: playbackSpeed === 1 ? 0.95 :
                                    playbackSpeed === 2 ? 0.93 :
                                        0.91,
                                to: playbackSpeed === 1 ? 1.05 :
                                    playbackSpeed === 2 ? 1.07 :
                                        1.09,
                            } : undefined
                        } : (isBubbleMode ?
                            { duration: 0.8 / (danmaku.originalPlaybackSpeed || playbackSpeed), ease: "easeOut" } :
                            { duration: 0.5 / (danmaku.originalPlaybackSpeed || playbackSpeed), ease: "easeOut" }
                        ))
                    }
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

                        // 用於計算的播放速度 - 使用彈幕的原始速度或當前速度
                        const effectiveSpeed = danmaku.originalPlaybackSpeed || playbackSpeed;

                        // 最短存在時間需達到動畫時間的75%
                        const minExistTime = danmaku.duration * 750;

                        // 如果存在時間不足，不進行任何操作
                        if (existTime < minExistTime) {
                            return;
                        }

                        // 泡泡模式和一般模式使用不同的處理方式
                        if (isBubbleMode) {
                            // 泡泡模式：設置一個較長的存在時間
                            const bubbleLifetime = Math.max(8000, danmaku.duration * 1000);

                            const timer = setTimeout(() => {
                                setDanmakus(current =>
                                    current.map(d =>
                                        d.id === danmaku.id
                                            ? { ...d, isFading: true, originalPlaybackSpeed: effectiveSpeed }
                                            : d
                                    )
                                );
                            }, bubbleLifetime / effectiveSpeed);

                            // 保存timeout引用以便後續清理
                            timeoutRefs.current.push(timer);
                        } else {
                            // 一般彈幕模式：確保彈幕移動到畫面左側之後再移除
                            const fullCrossingTime = (danmaku.duration * 1000) / effectiveSpeed;
                            const extraTime = 2000 / effectiveSpeed;
                            const totalDisplayTime = fullCrossingTime + extraTime;

                            const fadeTimer = setTimeout(() => {
                                setDanmakus(current =>
                                    current.map(d =>
                                        d.id === danmaku.id
                                            ? { ...d, isFading: true, originalPlaybackSpeed: effectiveSpeed }
                                            : d
                                    )
                                );

                                const removeTimer = setTimeout(() => {
                                    setDanmakus(current => current.filter(d => d.id !== danmaku.id));
                                }, 500 / effectiveSpeed);

                                // 保存timeout引用以便後續清理
                                timeoutRefs.current.push(removeTimer);
                            }, totalDisplayTime);

                            // 保存timeout引用以便後續清理
                            timeoutRefs.current.push(fadeTimer);
                        }
                    }}
                    className={`danmaku border ${colorClasses[danmaku.colorIndex]} ${isBubbleMode ? 'danmaku-bubble' : 'danmaku-normal'}`}
                    style={{
                        position: 'absolute',
                        top: `${danmaku.position}%`,
                        left: isBubbleMode ? `${danmaku.horizontalPosition}%` : 'auto',
                        height: !isBubbleMode ? '40px' : 'auto',
                        width: !isBubbleMode ? 'auto' : 'auto',
                        zIndex: 50 + Math.floor(danmaku.position / 5),
                        willChange: 'transform',
                        ...(isBubbleMode ? {
                            transform: 'translate3d(0, 0, 0)',
                            backfaceVisibility: 'hidden',
                            margin: 0,
                            padding: '0.8rem 1.2rem',
                            textAlign: 'left',
                            maxWidth: '280px',
                            borderRadius: '18px',
                            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
                            wordBreak: 'break-word',
                            hyphens: 'auto',
                        } : {
                            transform: 'translate3d(0, 0, 0)',
                            backfaceVisibility: 'hidden',
                            margin: 0,
                            lineHeight: '1.4',
                            opacity: 0.92,
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                            minWidth: '100px',
                            maxWidth: '600px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        })
                    }}
                >
                    <span className={`font-medium mr-2 ${colorClasses[danmaku.colorIndex].split(' ')[1]}`}>{danmaku.sender}:</span>
                    {danmaku.content}
                </motion.div>
            ))}
        </div>
    );
});

// 設置顯示名稱，便於調試
DanmakuComponent.displayName = 'DanmakuComponent';

export default DanmakuComponent; 