// --- DOM 元素获取 ---
const stimulusEl = document.getElementById("stimulus");
const startPracticeBtn = document.getElementById("startPractice");
const startTestBtn = document.getElementById("startTest");
const newTestBtn = document.getElementById("newTest");
const currentRTEl = document.getElementById("currentRT");
const avgRTEl = document.getElementById("avgRT");
const errorRateEl = document.getElementById("errorRate");
const messageEl = document.getElementById("message");
const practiceTimeInput = document.getElementById("practiceTimeInput");
const testTimeInput = document.getElementById("testTimeInput");

// --- 实验参数配置 ---
const COLORS = ["红", "蓝", "绿", "黄"];
const COLOR_MAP = { "红": "red", "蓝": "blue", "绿": "green", "黄": "yellow" };
const CORRECT_KEY_MAP = { "r": "红", "b": "蓝", "g": "绿", "y": "黄" };

// 新增：控制流程的时间参数 (单位：毫秒)
const FIXATION_DURATION = 500;  // “+”号准星显示时间
const FEEDBACK_DURATION = 800;  // “正确/错误”反馈显示时间

// --- 实验状态变量 ---
let phase = null; // 'practice' or 'test'
let trialData = [];
let currentStimulus = null;
let stimulusStartTime = null;
let endTime = null;
let resolveTrial = null; // 用于在按键后继续async流程的关键函数

// --- 工具函数 ---
const randomInt = (max) => Math.floor(Math.random() * max);
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- 核心功能函数 ---

/** 生成一个随机刺激，决定是否冲突 */
function generateStimulus() {
    const word = COLORS[randomInt(COLORS.length)];
    let fontColor, condition;
    if (Math.random() < 0.5) { // 一致条件
        fontColor = word;
        condition = "congruent";
    } else { // 不一致条件
        do {
            fontColor = COLORS[randomInt(COLORS.length)];
        } while (fontColor === word);
        condition = "incongruent";
    }
    return { word, fontColor, condition };
}

/** 显示刺激词，并记录开始时间 */
function showStimulus() {
    currentStimulus = generateStimulus();
    stimulusEl.textContent = currentStimulus.word;
    stimulusEl.style.color = COLOR_MAP[currentStimulus.fontColor];
    stimulusEl.classList.remove('feedback'); // 移除反馈样式
    stimulusStartTime = performance.now();
}

/** 更新右侧的统计数据 */
function updateStats() {
    if (trialData.length === 0) return;
    const lastTrial = trialData[trialData.length - 1];
    currentRTEl.textContent = lastTrial.reaction_time.toFixed(0);
    const totalRT = trialData.reduce((sum, t) => sum + t.reaction_time, 0);
    avgRTEl.textContent = (totalRT / trialData.length).toFixed(0);
    const errorCount = trialData.filter(t => !t.correct).length;
    errorRateEl.textContent = ((errorCount / trialData.length) * 100).toFixed(1);
}

/** 结束一个阶段（练习或正式） */
function endPhase() {
    phase = null;
    currentStimulus = null;
    if(resolveTrial) resolveTrial(null); // 如果正在等待响应，则取消
    resolveTrial = null;
    
    stimulusEl.textContent = "阶段结束";
    stimulusEl.classList.add('feedback');

    if (trialData.length > 0 && startTestBtn.disabled) { // 只有在正式测试后才保存
        messageEl.textContent = "数据保存中，请稍候...";
        saveData();
    } else if (startPracticeBtn.disabled) { // 练习结束
        startTestBtn.disabled = false;
        messageEl.textContent = "练习结束，请点击开始正式测试。";
    }

    startPracticeBtn.disabled = false;
}

/** 异步函数，执行单个试次流程 */
async function runTrial() {
    // 检查是否到达结束时间
    if (performance.now() >= endTime) {
        endPhase();
        return;
    }

    // 1. 显示“+”号准星
    stimulusEl.textContent = '+';
    stimulusEl.classList.remove('feedback');
    await wait(FIXATION_DURATION);
    
    // 如果在等待期间阶段被结束，则退出
    if (!phase) return;

    // 2. 显示刺激，并等待按键响应
    // 创建一个Promise，它将在键盘事件中被resolve
    const trialResultPromise = new Promise(resolve => {
        resolveTrial = resolve;
        showStimulus();
    });
    const result = await trialResultPromise; // 程序会在此暂停，直到按键
    resolveTrial = null; // 重置resolver

    // 如果阶段被结束，则退出
    if (!phase || !result) return;

    // 3. 显示即时反馈
    stimulusEl.classList.add('feedback');
    const feedbackText = result.correct ? '正确!' : '错误!';
    stimulusEl.textContent = `${feedbackText} 反应时间: ${result.rt.toFixed(0)}ms`;
    await wait(FEEDBACK_DURATION);

    // 4. 递归调用，开始下一个试次
    if (phase) {
        runTrial();
    }
}

/** 开始一个阶段（练习或正式） */
function runPhase(durationMs, currentPhase) {
    phase = currentPhase;
    trialData = [];
    updateStats(); // 重置统计显示
    messageEl.textContent = "";
    startPracticeBtn.disabled = true;
    startTestBtn.disabled = true;

    endTime = performance.now() + durationMs;
    runTrial(); // 启动第一个试次
}

// --- 事件监听器 ---

// 键盘响应事件
window.addEventListener("keydown", (e) => {
    // 只有在等待响应时（resolveTrial不为null）且有刺激呈现时才处理
    if (!resolveTrial || !currentStimulus) return;

    const key = e.key.toLowerCase();
    if (!CORRECT_KEY_MAP[key]) return; // 只处理r,g,b,y键

    const reaction_time = performance.now() - stimulusStartTime;
    const userColor = CORRECT_KEY_MAP[key];
    const correct = (userColor === currentStimulus.fontColor);

    trialData.push({
        word: currentStimulus.word,
        font_color: currentStimulus.fontColor,
        condition: currentStimulus.condition,
        reaction_time,
        correct,
    });

    updateStats();

    // 立即清除刺激
    stimulusEl.textContent = "";

    // resolve Promise，将结果传递给runTrial函数，并让它继续执行
    resolveTrial({ correct, rt: reaction_time });
});

// 按钮点击事件
startPracticeBtn.onclick = () => {
    const duration = Number(practiceTimeInput.value) * 1000;
    runPhase(duration, 'practice');
};

startTestBtn.onclick = () => {
    const duration = Number(testTimeInput.value) * 1000;
    runPhase(duration, 'test');
};

newTestBtn.onclick = () => {
    if (phase) endPhase(); // 如果正在运行，则先结束
    phase = null;
    trialData = [];
    currentRTEl.textContent = '-';
    avgRTEl.textContent = '-';
    errorRateEl.textContent = '-';
    stimulusEl.textContent = '按“开始练习”开始';
    stimulusEl.classList.remove('feedback');
    messageEl.textContent = "";
    startPracticeBtn.disabled = false;
    startTestBtn.disabled = true;
};

/** 发送数据到后端保存 */
function saveData() {
    const payload = {
        user_id: "mobile_test_001", // 可根据需要修改
        timestamp: new Date().toISOString(),
        phase: 'test',
        trials: trialData
    };

    fetch("/save_data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            messageEl.textContent = "数据已成功保存!";
        } else {
            messageEl.textContent = `数据保存失败: ${data.message}`;
        }
    })
    .catch(e => {
        messageEl.textContent = `请求失败: ${e}`;
    });
}