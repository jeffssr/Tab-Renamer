// content.js

let rules = [];
let observer = null;
let currentForcedTitle = null;

// 初始化
function init() {
  loadRules();
  // 监听存储变化（当用户在 Popup 中修改规则时，立即生效）
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.rules) {
      rules = changes.rules.newValue || [];
      applyRules();
    }
  });
}

// 加载规则
function loadRules() {
  chrome.storage.sync.get(['rules'], (result) => {
    rules = result.rules || [];
    applyRules();
  });
}

// 应用规则逻辑
function applyRules() {
  const hostname = window.location.hostname;
  const matchedRule = rules.find(rule => hostname.includes(rule.domain));

  if (matchedRule) {
    currentForcedTitle = matchedRule.newTitle;
    enforceTitle(currentForcedTitle);
    startObserving();
  } else {
    // 如果规则被删除，停止监听，但很难恢复原始标题（因为原始标题可能丢失），
    // 这里选择停止强制锁定，允许网页自身修改。
    stopObserving();
    currentForcedTitle = null;
  }
}

// 强制修改标题
function enforceTitle(title) {
  if (document.title !== title) {
    document.title = title;
  }
}

// 开启监听器：防止网页自己把标题改回去（针对 SPA 或 消息通知）
function startObserving() {
  if (observer) return; // 已经在运行

  const target = document.querySelector('title');
  if (!target) {
    // 假如 head 里没有 title 标签（极少见），尝试监听 head
    return; 
  }

  observer = new MutationObserver(() => {
    if (currentForcedTitle && document.title !== currentForcedTitle) {
      // 暂时断开监听，避免死循环
      observer.disconnect();
      document.title = currentForcedTitle;
      // 重新连接监听
      observer.observe(document.querySelector('title'), { childList: true, characterData: true, subtree: true });
    }
  });

  observer.observe(target, { childList: true, characterData: true, subtree: true });
}

function stopObserving() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

init();