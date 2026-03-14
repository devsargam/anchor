async function updateBadge(): Promise<void> {
  const pinned = await chrome.tabs.query({ pinned: true, currentWindow: true });
  const count = pinned.length;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
  chrome.action.setBadgeBackgroundColor({ color: "#4688F1" });
}

async function toggleAnchor(): Promise<void> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!tab?.id) return;

  await chrome.tabs.update(tab.id, { pinned: !tab.pinned });
  await updateBadge();
}

async function toggleList(): Promise<void> {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!activeTab?.id) return;

  const pinnedTabs = await chrome.tabs.query({
    pinned: true,
    currentWindow: true,
  });

  const tabsData = pinnedTabs.map((tab, i) => ({
    id: tab.id,
    title: tab.title || "Untitled",
    favIconUrl: tab.favIconUrl || "",
    slot: i + 1,
  }));

  await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    files: ["list-overlay.js"],
  });

  // Small delay to ensure the content script is ready
  setTimeout(() => {
    if (activeTab.id) {
      chrome.tabs.sendMessage(activeTab.id, {
        type: "show-anchor-list",
        tabs: tabsData,
      });
    }
  }, 50);
}

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-anchor") {
    toggleAnchor();
  } else if (command === "toggle-list") {
    toggleList();
  }
});

// Listen for tab switch requests from the overlay
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "switch-to-tab" && message.tabId) {
    chrome.tabs.update(message.tabId, { active: true });
  }
});

// Keep badge in sync when tabs change
chrome.tabs.onUpdated.addListener(() => updateBadge());
chrome.tabs.onRemoved.addListener(() => updateBadge());

// Also update when the extension icon is clicked — show the list
chrome.action.onClicked.addListener(() => toggleList());

// Initialize badge on startup
updateBadge();
