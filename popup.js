document.addEventListener('DOMContentLoaded', () => {
  const domainInput = document.getElementById('domainInput');
  const titleInput = document.getElementById('titleInput');
  const addBtn = document.getElementById('addBtn');
  const getCurrentBtn = document.getElementById('getCurrentBtn');
  const rulesList = document.getElementById('rulesList');
  const emptyState = document.getElementById('emptyState');
  const ruleCount = document.getElementById('ruleCount');

  // 1. 加载所有规则
  loadRules();

  // 2. 添加规则按钮点击事件
  addBtn.addEventListener('click', addRule);

  // 3. 获取当前 Tab 域名
  getCurrentBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const url = new URL(tabs[0].url);
        domainInput.value = url.hostname;
        // 自动聚焦到标题输入框
        titleInput.focus();
      }
    });
  });

  // 读取并渲染规则
  function loadRules() {
    chrome.storage.sync.get(['rules'], (result) => {
      const rules = result.rules || [];
      renderList(rules);
    });
  }

  // 渲染列表函数
  function renderList(rules) {
    rulesList.innerHTML = '';
    ruleCount.textContent = rules.length;

    if (rules.length === 0) {
      emptyState.style.display = 'block';
      return;
    } else {
      emptyState.style.display = 'none';
    }

    rules.forEach((rule, index) => {
      const li = document.createElement('li');
      li.className = 'rule-item';
      
      li.innerHTML = `
        <div class="rule-info">
          <span class="rule-domain">${escapeHtml(rule.domain)}</span>
          <span class="rule-title">${escapeHtml(rule.newTitle)}</span>
        </div>
        <button class="delete-btn" data-index="${index}" title="删除">&times;</button>
      `;
      rulesList.appendChild(li);
    });

    // 绑定删除事件
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.getAttribute('data-index');
        deleteRule(index);
      });
    });
  }

  // 添加规则
  function addRule() {
    const domain = domainInput.value.trim();
    const newTitle = titleInput.value.trim();

    if (!domain || !newTitle) {
      alert('请输入域名和新标题');
      return;
    }

    chrome.storage.sync.get(['rules'], (result) => {
      const rules = result.rules || [];
      
      // 检查是否已存在该域名的规则，如果存在则更新
      const existingIndex = rules.findIndex(r => r.domain === domain);
      if (existingIndex > -1) {
        rules[existingIndex].newTitle = newTitle;
      } else {
        rules.push({ domain, newTitle });
      }

      chrome.storage.sync.set({ rules }, () => {
        domainInput.value = '';
        titleInput.value = '';
        loadRules();
      });
    });
  }

  // 删除规则
  function deleteRule(index) {
    chrome.storage.sync.get(['rules'], (result) => {
      const rules = result.rules || [];
      rules.splice(index, 1);
      chrome.storage.sync.set({ rules }, () => {
        loadRules();
      });
    });
  }

  // 简单的 XSS 防御
  function escapeHtml(text) {
    if (!text) return text;
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});