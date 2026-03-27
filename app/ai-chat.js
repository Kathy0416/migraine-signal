// AI聊天功能实现

// DOM元素
const chatBubbleBtn = document.getElementById('chat-bubble-btn');
const chatContainer = document.getElementById('chat-container');
const closeChatBtn = document.getElementById('close-chat-btn');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const attachmentBtn = document.getElementById('attachment-btn');
const fileInput = document.getElementById('file-input');
const attachmentPreview = document.getElementById('attachment-preview');

// 聊天历史记录
let chatHistory = [];

// 当前附件列表
let currentAttachments = [];

// DeepSeek API 配置（请在部署前替换为真实KEY）
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
let DEEPSEEK_API_KEY = localStorage.getItem('deepseekApiKey') || 'YOUR_DEEPSEEK_API_KEY';
const DEEPSEEK_MODEL = 'deepseek-reasoner';

function setDeepSeekApiKey(key) {
    if (key && key.trim()) {
        const trimmedKey = key.trim();
        localStorage.setItem('deepseekApiKey', trimmedKey);
        DEEPSEEK_API_KEY = trimmedKey;
    }
}

// 初始化聊天功能
function initChat() {
    // 添加事件监听
    addChatEventListeners();
    // 加载聊天历史（如果有）
    loadChatHistory();
    // 深度查询API key配置
    setupDeepSeekConfig();
}

function setupDeepSeekConfig() {
    const apiKeyInput = document.getElementById('deepseek-api-key-input');
    const apiKeySaveBtn = document.getElementById('save-api-key-btn');
    if (!apiKeyInput || !apiKeySaveBtn) return;

    apiKeyInput.value = localStorage.getItem('deepseekApiKey') || '';

    apiKeySaveBtn.addEventListener('click', () => {
        const value = apiKeyInput.value.trim();
        if (!value) {
            alert('请输入 DeepSeek API Key');
            return;
        }
        setDeepSeekApiKey(value);
        alert('已保存 DeepSeek API Key，下一次请求将使用该Key。');
    });
}

// 添加聊天事件监听
function addChatEventListeners() {
    // 聊天气泡按钮点击事件
    chatBubbleBtn.addEventListener('click', toggleChat);

    // 关闭聊天按钮点击事件
    closeChatBtn.addEventListener('click', toggleChat);

    // 发送按钮点击事件
    sendBtn.addEventListener('click', sendMessage);

    // 输入框回车发送消息
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 输入框自动调整高度
    chatInput.addEventListener('input', autoResizeTextarea);

    // 点击聊天界面外部关闭聊天
    document.addEventListener('click', (e) => {
        if (chatContainer.classList.contains('visible') &&
            !chatContainer.contains(e.target) &&
            e.target !== chatBubbleBtn) {
            toggleChat();
        }
    });

    // 附件按钮点击事件
    attachmentBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择事件
    fileInput.addEventListener('change', handleFileSelect);
}

// 切换聊天界面显示/隐藏
function toggleChat() {
    chatContainer.classList.toggle('visible');
    
    // 如果聊天界面显示，聚焦到输入框
    if (chatContainer.classList.contains('visible')) {
        setTimeout(() => chatInput.focus(), 300);
    }
}

// 自动调整输入框高度
function autoResizeTextarea() {
    // 重置高度，以便正确计算滚动高度
    chatInput.style.height = 'auto';
    // 设置新高度，限制最大高度
    const newHeight = Math.min(chatInput.scrollHeight, 120);
    chatInput.style.height = `${newHeight}px`;
}

// 处理文件选择
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        // 检查文件大小限制 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert(`文件 "${file.name}" 太大，请上传小于10MB的文件`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const attachment = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                name: file.name,
                type: file.type,
                size: file.size,
                data: event.target.result
            };
            currentAttachments.push(attachment);
            updateAttachmentPreview();
        };
        reader.readAsDataURL(file);
    });
    // 清空input以便可以再次选择相同文件
    fileInput.value = '';
}

// 更新附件预览
function updateAttachmentPreview() {
    if (currentAttachments.length === 0) {
        attachmentPreview.style.display = 'none';
        attachmentPreview.innerHTML = '';
        return;
    }

    attachmentPreview.style.display = 'flex';
    attachmentPreview.innerHTML = currentAttachments.map(att => `
        <div class="attachment-item" data-id="${att.id}">
            <span>${getFileIcon(att.type)} ${truncateFileName(att.name)}</span>
            <span class="remove-attachment" onclick="removeAttachment('${att.id}')">&times;</span>
        </div>
    `).join('');
}

// 获取文件图标
function getFileIcon(fileType) {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('text')) return '📃';
    return '📎';
}

// 截断文件名
function truncateFileName(name, maxLength = 15) {
    if (name.length <= maxLength) return name;
    const ext = name.split('.').pop();
    const base = name.substring(0, maxLength - ext.length - 3);
    return `${base}...${ext}`;
}

// 移除附件
function removeAttachment(id) {
    currentAttachments = currentAttachments.filter(att => att.id !== id);
    updateAttachmentPreview();
}

// 将附件添加到消息显示
function getAttachmentsHTML(attachments) {
    if (!attachments || attachments.length === 0) return '';
    return `
        <div class="message-attachments">
            ${attachments.map(att => `
                <div class="message-attachment" onclick="downloadAttachment('${att.id}', '${att.name}')">
                    ${getFileIcon(att.type)} ${truncateFileName(att.name)}
                </div>
            `).join('')}
        </div>
    `;
}

// 下载附件
function downloadAttachment(id, name) {
    const attachment = currentAttachments.find(att => att.id === id);
    if (attachment && attachment.data) {
        const link = document.createElement('a');
        link.href = attachment.data;
        link.download = name;
        link.click();
    }
}

// 清理AI回复中的HTML标签，避免展示HTML样式
function sanitizeAIContent(text) {
    if (!text || typeof text !== 'string') return '';
    // 先转换换行符，然后清除 HTML 标签
    const noTags = text.replace(/<[^>]*>/g, '');
    return noTags;
}

// 简单将纯文本转换为带 emoji/HTML 的消息
function formatAIContent(text) {
    if (!text || typeof text !== 'string') return '';

    // HTML特殊字符转义（安全）
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // 简单支持行内 Markdown：加粗、斜体、下划线等
    const renderInlineMarkdown = (input) => {
        let result = input;
        // **bold**
        result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // *italic*（避免与列表符号混淆）
        result = result.replace(/\*(?!\s)([^*]+?)\*/g, '<em>$1</em>');
        // __underline__ 或 __italicish__ ? 处理为强调也可
        result = result.replace(/__(.+?)__/g, '<u>$1</u>');
        return result;
    };

    // 行首规则：- 或 * 自动转为列表项
    const lines = escaped.split(/\r?\n/);
    let formatted = '';
    let inList = false;

    lines.forEach((line, i) => {
        const trimLine = line.trim();

        // 支持 Markdown 风格的列表
        if (/^[-*]\s+/.test(trimLine)) {
            const itemText = trimLine.replace(/^[-*]\s+/, '');
            const renderedItem = renderInlineMarkdown(itemText);
            if (!inList) {
                inList = true;
                formatted += '<ul style="padding-left: 1.1rem; margin: 0.2rem 0;">';
            }
            formatted += `<li style="margin-left:0.2rem;">✅ ${renderedItem}</li>`;
        } else {
            if (inList) {
                formatted += '</ul>';
                inList = false;
            }
            if (trimLine === '') {
                formatted += '<br/>';
            } else {
                // 针对建议文字加入 emoji 提示
                const withEmoji = renderInlineMarkdown(trimLine)
                    .replace(/触发因素/g, '⚠️ 触发因素')
                    .replace(/建议/g, '💡 建议')
                    .replace(/症状/g, '🩺 症状');
                formatted += `<p style="margin: 0.18rem 0;">${withEmoji}</p>`;
            }
        }

        // 避免最后闭合要在循环外处理
        if (i === lines.length - 1 && inList) {
            formatted += '</ul>';
            inList = false;
        }
    });

    return formatted;
}

// 发送消息
function sendMessage() {
    const message = chatInput.value.trim();
    if (!message && currentAttachments.length === 0) return;

    // 清空输入框
    chatInput.value = '';
    // 重置输入框高度
    chatInput.style.height = 'auto';

    // 准备消息数据（包含附件）
    const messageData = {
        text: message,
        attachments: [...currentAttachments]
    };

    // 显示用户消息
    displayMessage(message, 'user', currentAttachments);

    // 添加到聊天历史
    addToChatHistory(messageData, 'user');

    // 清空当前附件
    currentAttachments = [];
    updateAttachmentPreview();

    // 发送消息给AI并获取回复
    getAIResponse(message, messageData.attachments);
}

// 显示消息
function displayMessage(text, sender, attachments = null) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}`;

    if (sender === 'ai') {
        // AI返回可能带 HTML 标签原文，先清理再格式化
        const safeText = sanitizeAIContent(text);
        messageEl.innerHTML = formatAIContent(safeText);
    } else {
        messageEl.textContent = text;
        // 添加附件显示
        if (attachments && attachments.length > 0) {
            messageEl.innerHTML += getAttachmentsHTML(attachments);
        }
    }

    chatMessages.appendChild(messageEl);

    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 显示AI正在输入的状态
function displayTypingIndicator() {
    const typingEl = document.createElement('div');
    typingEl.className = 'message ai typing';
    typingEl.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    chatMessages.appendChild(typingEl);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return typingEl;
}

// 移除正在输入的状态
function removeTypingIndicator(typingEl) {
    if (typingEl && typingEl.parentNode) {
        typingEl.parentNode.removeChild(typingEl);
    }
}

// 获取AI回复（DeepSeek优先，失败回退模拟）
async function getAIResponse(userMessage) {
    // 显示正在输入的状态
    const typingEl = displayTypingIndicator();

    try {
        // 如果用户询问触发分析，优先使用本地日志分析结果
        const analysisKeywords = [/触发因素/, /分析/, /原因/, /建议/, /怎么\s*预防/];
        const askAnalysis = analysisKeywords.some(reg => reg.test(userMessage));

        if (askAnalysis) {
            const analysis = getMigraineTriggerAnalysis();
            if (analysis.migraineCount > 0) {
                const aiResponse = generateTriggerAnalysisResponse(userMessage);
                removeTypingIndicator(typingEl);
                displayMessage(aiResponse, 'ai');
                addToChatHistory(aiResponse, 'ai');
                saveChatHistory();
                return;
            }
            // 已记录但无偏头痛数据则继续访问API或模拟回复
        }

        const aiResponse = await callAIAPI(userMessage);
        removeTypingIndicator(typingEl);
        displayMessage(aiResponse, 'ai');
        addToChatHistory(aiResponse, 'ai');
        saveChatHistory();
    } catch (error) {
        console.error('AI回复失败，使用本地模拟：', error);
        removeTypingIndicator(typingEl);

        const errorTip = '（DeepSeek 调用失败，已回退本地模拟回复）';
        const fallbackResponse = `${generateMockAIResponse(userMessage)}\n\n${errorTip}`;
        displayMessage(fallbackResponse, 'ai');
        addToChatHistory(fallbackResponse, 'ai');
        saveChatHistory();
    }
}

// 生成模拟AI回复
function generateMockAIResponse(userMessage) {
    // 简单的关键词匹配回复
    const lowerMessage = userMessage.toLowerCase();
    const lastMigraine = getLastMigraineInfo();
    const diaryEntries = getUserDiaryNotes();

    // 个性化前缀
    let personalizedPrefix = '';
    if (lastMigraine) {
        personalizedPrefix = `根据你的记录，你最近一次偏头痛是在${lastMigraine.daysAgo}天前。`;
    }

    if (/触发因素|分析|原因|建议|怎么\s*预防/.test(lowerMessage)) {
        const analysis = getMigraineTriggerAnalysis();
        if (analysis.migraineCount > 0) {
            return generateTriggerAnalysisResponse(userMessage);
        }
        return personalizedPrefix + '我暂时没有你的偏头痛记录，无法做专属分析。请先在偏头痛日历中新增记录。';
    }

    // 最近一次偏头痛相关
    if (/最近|上次|多久|什么时候/.test(lowerMessage) && /偏头痛|头痛|发作/.test(lowerMessage)) {
        if (lastMigraine) {
            let response = `你最近一次偏头痛是在 ${lastMigraine.daysAgo} 天前（${lastMigraine.date}）。`;
            if (lastMigraine.diary) {
                response += `\n\n当时的记录："${lastMigraine.diary}"`;
            }
            if (lastMigraine.triggers.length > 0) {
                response += `\n\n记录的触发因素：${lastMigraine.triggers.join('、')}。`;
            }
            response += `\n\n总共记录了 ${lastMigraine.totalCount} 次偏头痛发作。`;
            return response;
        }
        return '我还没有检测到你的偏头痛历史记录。请在日历中添加记录。';
    }

    // 日记相关
    if (/日记|记录|笔记/.test(lowerMessage)) {
        if (diaryEntries.length > 0) {
            let response = `你共有 ${diaryEntries.length} 条日记记录。最近的记录包括：\n\n`;
            diaryEntries.slice(0, 3).forEach((entry, index) => {
                response += `${index + 1}. ${entry.date}${entry.migraine ? '（偏头痛日）' : ''}：${entry.diary.substring(0, 60)}${entry.diary.length > 60 ? '...' : ''}\n`;
            });
            return response;
        }
        return '你还没有添加任何日记记录。建议在每次偏头痛发作后记录你的感受和可能的触发因素。';
    }

    // 偏头痛相关回复
    if (lowerMessage.includes('偏头痛') || lowerMessage.includes('头痛')) {
        return personalizedPrefix + '偏头痛是一种常见的神经系统疾病，特征是反复发作的中重度头痛，通常伴有恶心、呕吐、对光和声音敏感。建议保持规律的作息、避免触发因素，如压力、缺乏睡眠、某些食物等。如果症状严重，建议咨询医生。';
    }

    // 食物触发因素相关回复
    if (lowerMessage.includes('吃了') || lowerMessage.includes('食物') || lowerMessage.includes('巧克力') || lowerMessage.includes('咖啡') || lowerMessage.includes('酒精') || lowerMessage.includes('不舒服')) {
        return personalizedPrefix + '某些食物确实可能触发偏头痛，常见的包括巧克力、咖啡因、酒精、含有硝酸盐的食物等。如果你刚吃完某些食物后感到不舒服，建议：1. 休息在安静黑暗的房间；2. 多喝水帮助代谢；3. 记录这次发作，以便识别个人触发因素；4. 如果症状严重，可服用止痛药。';
    }

    // 触发因素相关回复
    if (lowerMessage.includes('触发因素') || lowerMessage.includes('原因') || lowerMessage.includes('为什么')) {
        return personalizedPrefix + '偏头痛的常见触发因素包括：压力、睡眠不足或过多、饮食因素（如酒精、咖啡因、巧克力、硝酸盐等）、荷尔蒙变化、环境因素（如强光、噪音、天气变化）等。';
    }

    // 治疗方法相关回复
    if (lowerMessage.includes('治疗') || lowerMessage.includes('缓解') || lowerMessage.includes('怎么办') || lowerMessage.includes('怎么治')) {
        return personalizedPrefix + '偏头痛的治疗包括：休息在安静、黑暗的房间，服用止痛药（如布洛芬、对乙酰氨基酚），避免触发因素，保持规律的生活习惯，尝试放松技巧（如深呼吸、冥想），严重时可使用处方药。';
    }

    // 记录相关回复
    if (lowerMessage.includes('记录') || lowerMessage.includes('跟踪')) {
        return '记录偏头痛发作情况有助于识别触发因素和规律。建议记录发作时间、持续时间、疼痛程度、伴随症状、当天的饮食、睡眠、压力水平等信息。';
    }

    // 症状相关回复
    if (lowerMessage.includes('症状') || lowerMessage.includes('表现') || lowerMessage.includes('感觉')) {
        return '偏头痛的典型症状包括：单侧搏动性头痛、中重度疼痛、恶心呕吐、对光和声音敏感、有时伴有视觉先兆（如闪光、暗点）等。症状通常持续4-72小时。';
    }

    // 苹果/食物相关
    if (lowerMessage.includes('苹果') || lowerMessage.includes('水果')) {
        return '苹果通常被认为是健康食品，不是偏头痛的典型触发因素。建议观察自身反应，如果你有明确关联，可以继续记录；否则继续保持均衡饮食与规律作息。';
    }

    // 其他情况
    return personalizedPrefix + '抱歉，我不太明白你的问题。我是一个专注于偏头痛相关问题的AI助手，你可以问我关于偏头痛的症状、触发因素、治疗方法，或者询问"最近一次偏头痛是什么时候"、"我的日记记录"等问题。如果你希望测试 DeepSeek 实际回答，请检查 API Key 是否已输入并保存。';
}

// 添加到聊天历史
function addToChatHistory(data, sender) {
    let messageData;
    if (typeof data === 'string') {
        messageData = { text: data, attachments: [] };
    } else {
        messageData = data;
    }

    chatHistory.push({
        text: messageData.text || '',
        attachments: messageData.attachments || [],
        sender: sender,
        timestamp: new Date().toISOString()
    });

    // 限制聊天历史长度
    if (chatHistory.length > 50) {
        chatHistory.shift();
    }
}

// 保存聊天历史到本地存储
function saveChatHistory() {
    localStorage.setItem('aiChatHistory', JSON.stringify(chatHistory));
}

// 从本地存储加载聊天历史
function loadChatHistory() {
    const savedHistory = localStorage.getItem('aiChatHistory');
    if (savedHistory) {
        try {
            chatHistory = JSON.parse(savedHistory);

            // 显示聊天历史
            chatHistory.forEach(message => {
                displayMessage(message.text, message.sender, message.attachments);
            });
        } catch (e) {
            console.error('加载聊天历史失败:', e);
            chatHistory = [];
        }
    }
}

// 从日历数据中读取偏头痛触发因素分析
function loadMigraineCalendarData() {
    let data = {};
    try {
        const raw = localStorage.getItem('migraineCalendarData');
        if (raw) data = JSON.parse(raw);
    } catch (e) {
        console.error('读取 migraineCalendarData 失败:', e);
        data = {};
    }
    return data;
}

// 获取用户的日记/笔记内容
function getUserDiaryNotes() {
    const data = loadMigraineCalendarData();
    const entries = Object.entries(data || {});

    // 筛选有日记内容的条目
    const diaryEntries = entries
        .filter(([date, item]) => item && item.diary && item.diary.trim())
        .map(([date, item]) => ({
            date: date,
            diary: item.diary,
            migraine: item.migraine || false,
            triggers: item.triggers || []
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // 按日期从新到旧排序

    return diaryEntries;
}

// 获取最近一次偏头痛记录
function getLastMigraineInfo() {
    const data = loadMigraineCalendarData();
    const entries = Object.entries(data || {});

    // 筛选有偏头痛的条目
    const migraineEntries = entries
        .filter(([date, item]) => item && item.migraine)
        .map(([date, item]) => ({
            date: date,
            diary: item.diary || '',
            triggers: item.triggers || []
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (migraineEntries.length === 0) {
        return null;
    }

    const lastMigraine = migraineEntries[0];
    const daysSinceLastMigraine = Math.floor((new Date() - new Date(lastMigraine.date)) / (1000 * 60 * 60 * 24));

    return {
        date: lastMigraine.date,
        daysAgo: daysSinceLastMigraine,
        diary: lastMigraine.diary,
        triggers: lastMigraine.triggers,
        totalCount: migraineEntries.length
    };
}

// 生成用户笔记摘要
function generateUserNotesSummary() {
    const diaryEntries = getUserDiaryNotes();
    const lastMigraine = getLastMigraineInfo();

    let summary = '';

    // 添加最近一次偏头痛信息
    if (lastMigraine) {
        summary += `用户最近一次偏头痛是在 ${lastMigraine.daysAgo} 天前（${lastMigraine.date}）。`;
        if (lastMigraine.diary) {
            summary += `当时的记录："${lastMigraine.diary.substring(0, 100)}${lastMigraine.diary.length > 100 ? '...' : ''}" `;
        }
        if (lastMigraine.triggers.length > 0) {
            summary += `记录的触发因素：${lastMigraine.triggers.join('、')}。`;
        }
        summary += `\n`;
    }

    // 添加最近的日记摘要
    if (diaryEntries.length > 0) {
        const recentEntries = diaryEntries.slice(0, 5); // 最近5条
        summary += `\n用户最近的日记记录：\n`;
        recentEntries.forEach((entry, index) => {
            summary += `${index + 1}. ${entry.date}${entry.migraine ? '（偏头痛日）' : ''}：${entry.diary.substring(0, 80)}${entry.diary.length > 80 ? '...' : ''}\n`;
        });
    }

    return summary || '用户暂无日记记录。';
}

// 统计触发因素
function getMigraineTriggerAnalysis() {
    const data = loadMigraineCalendarData();
    const entries = Object.values(data || {});
    const migraineEntries = entries.filter(item => item && item.migraine);

    const analysis = {
        totalEntries: entries.length,
        migraineCount: migraineEntries.length,
        triggerCounts: {},
        topTriggers: [],
        message: '当前偏头痛数据不足，请记得添加更多记录以获得更准确分析。',
    };

    if (migraineEntries.length === 0) {
        return analysis;
    }

    migraineEntries.forEach(item => {
        if (Array.isArray(item.triggers)) {
            item.triggers.forEach(trigger => {
                if (!trigger) return;
                analysis.triggerCounts[trigger] = (analysis.triggerCounts[trigger] || 0) + 1;
            });
        }
    });

    const sorted = Object.entries(analysis.triggerCounts)
        .sort((a, b) => b[1] - a[1]);

    analysis.topTriggers = sorted.slice(0, 3).map(([trigger, count]) => ({trigger, count}));
    analysis.message = `在你记录的 ${migraineEntries.length} 次偏头痛发作中，最常见的触发因素包括：` +
        (analysis.topTriggers.length > 0 ? analysis.topTriggers.map(t => `${t.trigger} (${t.count} 次)`).join('，') : '暂无可分析触发因子') + '。';

    return analysis;
}

// 根据用户询问生成基于本地日志的分析回复
function generateTriggerAnalysisResponse(userMessage) {
    const analysis = getMigraineTriggerAnalysis();
    if (analysis.migraineCount === 0) {
        return '我还没有检测到你的偏头痛历史记录。请先在偏头痛日历中添加偏头痛记录和触发因素，然后再询问“分析触发因素”。';
    }

    let text = '📊 根据你的偏头痛记录：\n';
    text += `- 记录总天数：${analysis.totalEntries}；偏头痛天数：${analysis.migraineCount}。\n`;

    if (analysis.topTriggers.length > 0) {
        text += '- 你出现最频繁的触发因素：\n';
        analysis.topTriggers.forEach((item, idx) => {
            text += `  ${idx + 1}. ${item.trigger}（${item.count} 次）\n`;
        });
    } else {
        text += '- 目前的数据中没有明确触发因素，请增加触发选择。\n';
    }

    text += '- 建议：记录每次发作前24小时的饮食与情绪，逐步排除单一因子。\n';
    text += '💡 在你的日记中优先监控“睡眠”、“压力”和“饮食”这几个最常见因素。';

    return text;
}

// 集成AI API的函数（DeepSeek优先）
async function callAIAPI(message, attachments = []) {
    // 运行时重新读本地 Key，确保新保存的可用
    const localKey = localStorage.getItem('deepseekApiKey');
    if (localKey && localKey.trim()) {
        DEEPSEEK_API_KEY = localKey.trim();
    }

    // 如果没有配置key，直接使用本地模拟
    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'YOUR_DEEPSEEK_API_KEY') {
        console.warn('DeepSeek API Key未配置，使用本地模拟回复。');
        return generateMockAIResponse(message);
    }

    const baseSystemPrompt = '你是一个专业的偏头痛健康助手，提供温和、实用并且符合健康安全的建议。';
    const analysis = getMigraineTriggerAnalysis();
    const userNotesSummary = generateUserNotesSummary();

    let userDataSummary = '';
    if (analysis.migraineCount > 0) {
        userDataSummary = `用户历史记录：${analysis.migraineCount}次偏头痛，顶级触发：${analysis.topTriggers.map(t => `${t.trigger}(${t.count})`).join('、')}。`;
    } else {
        userDataSummary = '用户暂无偏头痛记录。';
    }

    // 构建系统提示词，包含用户笔记
    const systemPrompt = `${baseSystemPrompt}

${userDataSummary}

用户的日记和笔记信息：
${userNotesSummary}

请在回答中结合这些信息，特别是：
1. 参考用户最近一次偏头痛的时间和情况
2. 结合用户的日记内容给出个性化建议
3. 如果用户提到了触发因素，结合历史数据分析
4. 提供实用、温和的健康建议`;

    // 构建消息内容
    let userContent = message;
    if (attachments && attachments.length > 0) {
        const attachmentNames = attachments.map(att => att.name).join('、');
        userContent = `[用户上传了附件：${attachmentNames}]\n\n${message}`;
    }

    const chatMessagesPayload = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        })),
        { role: 'user', content: userContent }
    ];

    const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
            model: DEEPSEEK_MODEL,
            messages: chatMessagesPayload,
            stream: false
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content.trim();
    }

    throw new Error('DeepSeek API返回无效数据');
}

// 初始化聊天功能
initChat();

// 导出函数，方便在其他页面调用
// function showChat() {
//     chatContainer.classList.add('visible');
//     setTimeout(() => chatInput.focus(), 300);
// }