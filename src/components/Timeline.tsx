'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface Message {
    date: string;
    time: string;
    sender: string;
    content: string;
}

interface TimelineProps {
    messages: Message[];
    onReturn: () => void;
}

interface TimelineMonth {
    id: string;
    label: string;
    messages: Message[];
}

const COLORS = [
    { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', shadow: 'shadow-violet-200/40' },
    { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', shadow: 'shadow-blue-200/40' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', shadow: 'shadow-emerald-200/40' },
    { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', shadow: 'shadow-amber-200/40' },
    { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', shadow: 'shadow-rose-200/40' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', shadow: 'shadow-indigo-200/40' },
    { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', shadow: 'shadow-teal-200/40' },
    { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200', shadow: 'shadow-fuchsia-200/40' },
];

export default function Timeline({ messages, onReturn }: TimelineProps) {
    const [timelineMonths, setTimelineMonths] = useState<TimelineMonth[]>([]);
    const [activeMonth, setActiveMonth] = useState<string | null>(null);
    const [visibleMessages, setVisibleMessages] = useState<Array<Message & { id: string }>>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [speed, setSpeed] = useState(1); // 1 = normal, 2 = fast, 0.5 = slow
    const monthRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const messageCountRef = useRef(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 為每個發送者分配固定顏色
    const senderColors = useMemo(() => {
        const uniqueSenders = Array.from(new Set(messages.map(m => m.sender)));
        return Object.fromEntries(
            uniqueSenders.map((sender, index) => [
                sender,
                COLORS[index % COLORS.length]
            ])
        );
    }, [messages]);

    // 持續顯示訊息 - 使用useCallback避免循環依賴
    const startShowingMessages = useCallback((monthId: string) => {
        const month = timelineMonths.find(m => m.id === monthId);
        if (!month) return;

        let currentIndex = 0;
        let isClearing = false;

        // 清除之前的訊息
        setVisibleMessages([]);
        messageCountRef.current = 0;

        // 清理任何現有計時器
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        const addNextMessage = () => {
            if (isClearing || isPaused) return;

            if (currentIndex < month.messages.length) {
                const message = month.messages[currentIndex];
                const newMessage = {
                    ...message,
                    id: `${message.date}-${message.time}-${currentIndex}`
                };

                setVisibleMessages(prev => {
                    const newMessages = [...prev, newMessage];
                    // 最多顯示 3 條訊息
                    return newMessages.slice(-3);
                });

                currentIndex++;
                // 使用速度係數調整間隔
                const interval = 12000 / speed;
                // 儲存計時器參考
                timerRef.current = setTimeout(addNextMessage, interval);
            } else {
                isClearing = true;
                // 等待最後一組訊息的動畫完成後再重新開始
                timerRef.current = setTimeout(() => {
                    isClearing = false;
                    currentIndex = 0;
                    setVisibleMessages([]);
                    timerRef.current = setTimeout(addNextMessage, 1000); // 短暫延遲後開始新的循環
                }, 12000 / speed);
            }
        };

        // 開始顯示第一條訊息
        timerRef.current = setTimeout(addNextMessage, 1000);
    }, [timelineMonths, isPaused, speed]);

    // 將訊息按月份分組
    useEffect(() => {
        const monthsMap = new Map<string, Message[]>();

        messages.forEach(message => {
            const date = new Date(message.date.replace(/\//g, '-'));
            const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthsMap.has(monthId)) {
                monthsMap.set(monthId, []);
            }
            monthsMap.get(monthId)?.push(message);
        });

        const sortedMonths = Array.from(monthsMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([id, msgs]) => ({
                id,
                label: new Date(id).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' }),
                messages: msgs.sort((a, b) => {
                    const dateA = new Date(a.date.replace(/\//g, '-') + ' ' + a.time);
                    const dateB = new Date(b.date.replace(/\//g, '-') + ' ' + b.time);
                    return dateA.getTime() - dateB.getTime();
                })
            }));

        setTimelineMonths(sortedMonths);
        if (sortedMonths.length > 0) {
            setActiveMonth(sortedMonths[0].id);
            // 直接使用內聯版本的startShowingMessages邏輯，或者在useEffect中調用，而不是依賴它
            const monthId = sortedMonths[0].id;
            const month = sortedMonths.find(m => m.id === monthId);
            if (month) {
                let currentIndex = 0;
                let isClearing = false;

                // 清除之前的訊息
                setVisibleMessages([]);
                messageCountRef.current = 0;

                // 清理任何現有計時器
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                }

                const addNextMessage = () => {
                    if (isClearing || isPaused) return;

                    if (currentIndex < month.messages.length) {
                        const message = month.messages[currentIndex];
                        const newMessage = {
                            ...message,
                            id: `${message.date}-${message.time}-${currentIndex}`
                        };

                        setVisibleMessages(prev => {
                            const newMessages = [...prev, newMessage];
                            // 最多顯示 3 條訊息
                            return newMessages.slice(-3);
                        });

                        currentIndex++;
                        // 使用速度係數調整間隔
                        const interval = 12000 / speed;
                        // 儲存計時器參考
                        timerRef.current = setTimeout(addNextMessage, interval);
                    } else {
                        isClearing = true;
                        // 等待最後一組訊息的動畫完成後再重新開始
                        timerRef.current = setTimeout(() => {
                            isClearing = false;
                            currentIndex = 0;
                            setVisibleMessages([]);
                            timerRef.current = setTimeout(addNextMessage, 1000); // 短暫延遲後開始新的循環
                        }, 12000 / speed);
                    }
                };

                // 開始顯示第一條訊息
                timerRef.current = setTimeout(addNextMessage, 1000);
            }
        }
    }, [messages, isPaused, speed]);

    // 監聽滾動事件
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const monthId = entry.target.getAttribute('data-month');
                        if (monthId && monthId !== activeMonth) {
                            setActiveMonth(monthId);
                            // 調用startShowingMessages，但不要在依賴數組中引用它
                            if (monthId) {
                                startShowingMessages(monthId);
                            }
                        }
                    }
                });
            },
            {
                threshold: 0.6,
                rootMargin: '-20% 0px -20% 0px'
            }
        );

        // 修正未使用變量問題
        Object.entries(monthRefs.current).forEach(([, ref]) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, [timelineMonths, activeMonth, startShowingMessages]); // 添加startShowingMessages作為依賴

    // 清理計時器
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    // 暫停/繼續
    const handlePlayPause = () => {
        setIsPaused(!isPaused);
        if (isPaused && activeMonth) {
            // 如果從暫停恢復，重新開始顯示訊息
            startShowingMessages(activeMonth);
        }
    };

    // 調整速度
    const handleSpeedChange = (newSpeed: number) => {
        setSpeed(newSpeed);
        if (activeMonth) {
            // 調整速度後重新開始
            startShowingMessages(activeMonth);
        }
    };

    // 生成訊息位置
    const getMessagePosition = (index: number, total: number) => {
        // 將訊息分散在螢幕寬度的 40% 範圍內，從中心向兩側擴展
        const x = -20 + (40 * index / Math.max(total - 1, 1));
        // 垂直位置從底部往上分布，留出更多空間
        const y = 85 - (index * 25); // 每個訊息間隔加大到 25vh
        return { x, y };
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* 控制面板 */}
            <div className="fixed top-6 right-6 z-20 bg-white/90 backdrop-blur-lg p-3 rounded-xl shadow-lg flex items-center gap-2 border border-gray-100">
                <button
                    onClick={handlePlayPause}
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    aria-label={isPaused ? "播放" : "暫停"}
                >
                    {isPaused ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"></path>
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
                        </svg>
                    )}
                </button>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => handleSpeedChange(0.5)}
                        className={`px-2 py-1 text-xs rounded-lg transition-colors ${speed === 0.5 ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                        0.5x
                    </button>
                    <button
                        onClick={() => handleSpeedChange(1)}
                        className={`px-2 py-1 text-xs rounded-lg transition-colors ${speed === 1 ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                        1x
                    </button>
                    <button
                        onClick={() => handleSpeedChange(2)}
                        className={`px-2 py-1 text-xs rounded-lg transition-colors ${speed === 2 ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                        2x
                    </button>
                </div>
            </div>

            {/* 時間軸 */}
            <div className="fixed left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 via-violet-300 to-indigo-300 
                        opacity-60 transform -translate-x-1/2 z-0"></div>

            {/* 月份標記 */}
            <div className="relative z-10 pt-20">
                {timelineMonths.map((month) => (
                    <div
                        key={month.id}
                        ref={(el) => {
                            monthRefs.current[month.id] = el;
                        }}
                        data-month={month.id}
                        className="min-h-screen flex items-center justify-center"
                    >
                        <div className={`text-4xl font-bold transition-all duration-500 font-serif
                                    ${activeMonth === month.id
                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 scale-110'
                                : 'text-gray-300'}`}>
                            {month.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* 浮動訊息容器 */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-screen">
                    {visibleMessages.map((message, index) => {
                        const position = getMessagePosition(index, visibleMessages.length);
                        const color = senderColors[message.sender];
                        return (
                            <div
                                key={message.id}
                                className="absolute left-1/2 animate-float-up message-container"
                                style={{
                                    ['--x-offset' as string]: `${position.x}vw`,
                                    ['--y-offset' as string]: `${position.y}vh`,
                                    transform: `translate(${position.x}vw, 100vh)`,
                                } as React.CSSProperties}
                            >
                                <div
                                    className={`relative backdrop-blur-md rounded-2xl p-4 
                                            max-w-xs animate-fade-in hover:scale-105 transition-transform
                                            ${color.bg} ${color.border} border-2 ${color.shadow} shadow-lg`}
                                    style={{
                                        opacity: 0,
                                        animationDelay: '0.5s',
                                        animationDuration: '0.5s',
                                        animationFillMode: 'forwards'
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded-full ${color.text} text-sm font-medium border ${color.border} bg-white/50`}>
                                            {message.sender}
                                        </span>
                                        <span className="text-gray-500 text-xs font-mono">
                                            {message.time}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap break-words leading-relaxed">
                                        {message.content}
                                    </p>
                                    <div className="absolute -bottom-1.5 left-4 w-3 h-3 rotate-45 bg-inherit border-b-2 border-r-2 border-inherit"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 返回按鈕 */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
                <button
                    onClick={onReturn}
                    className="w-24 h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    返回上傳頁面
                </button>
            </div>
        </div>
    );
} 