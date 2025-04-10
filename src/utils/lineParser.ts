interface Message {
    date: string;
    time: string;
    sender: string;
    content: string;
}

export function parseLineChat(text: string): Message[] {
    const lines = text.split('\n');
    const messages: Message[] = [];
    let currentDate = '';

    // 支援多種格式的正則表達式
    const datePattern = /^(\d{4})\.(\d{2})\.(\d{2})/;
    const messagePattern = /^(\d{2}:\d{2}) ([^\s]+) (.+)$/;

    for (const line of lines) {
        // 跳過空行
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        console.log('處理行:', trimmedLine); // 除錯用

        // 檢查是否為日期行
        const dateMatch = trimmedLine.match(datePattern);
        if (dateMatch) {
            const [, year, month, day] = dateMatch;
            currentDate = `${year}/${month}/${day}`;
            console.log('找到日期:', currentDate); // 除錯用
            continue;
        }

        // 檢查是否為訊息行
        const messageMatch = trimmedLine.match(messagePattern);
        if (messageMatch && currentDate) {
            const [, time, sender, content] = messageMatch;
            console.log('找到訊息:', { time, sender, content }); // 除錯用
            messages.push({
                date: currentDate,
                time,
                sender: sender.trim(),
                content: content.trim()
            });
        } else {
            console.log('無法解析行:', trimmedLine); // 除錯用
        }
    }

    console.log('總共解析出訊息數:', messages.length); // 除錯用

    // 按時間排序
    messages.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
    });

    return messages;
} 