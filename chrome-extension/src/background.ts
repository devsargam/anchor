interface PinnedTabData {
  id: number;
  title: string;
  favIconUrl: string;
  slot: number;
}

interface SwitchMessage {
  type: "switch-to-tab";
  tabId: number;
}

async function updateBadge(): Promise<void> {
  const pinned = await chrome.tabs.query({ pinned: true, currentWindow: true });
  const count = pinned.length;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
  chrome.action.setBadgeBackgroundColor({ color: "#4688F1" });
}

async function getPinnedTabsData(): Promise<PinnedTabData[]> {
  const pinnedTabs = await chrome.tabs.query({
    pinned: true,
    currentWindow: true,
  });
  return pinnedTabs.reduce<PinnedTabData[]>((acc, tab, i) => {
    if (tab.id !== undefined) {
      acc.push({
        id: tab.id,
        title: tab.title || "Untitled",
        favIconUrl: tab.favIconUrl || "",
        slot: i + 1,
      });
    }
    return acc;
  }, []);
}

async function getActiveTabId(): Promise<number | null> {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const activeTab = tabs[0];
  if (activeTab === undefined || activeTab.id === undefined) {
    return null;
  }
  return activeTab.id;
}

async function refreshOverlay(): Promise<void> {
  const tabId = await getActiveTabId();
  if (tabId === null) return;

  const tabsData = await getPinnedTabsData();
  chrome.tabs.sendMessage(tabId, {
    type: "update-anchor-list",
    tabs: tabsData,
  }).catch(() => {
    // Overlay not open on this tab, ignore
  });
}

async function toggleAnchor(): Promise<void> {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const tab = tabs[0];
  if (tab === undefined || tab.id === undefined) return;

  await chrome.tabs.update(tab.id, { pinned: !tab.pinned });
  await updateBadge();
  await refreshOverlay();
}

async function toggleList(): Promise<void> {
  const tabId = await getActiveTabId();
  if (tabId === null) return;

  const tabsData = await getPinnedTabsData();

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["list-overlay.js"],
  });

  // Small delay to ensure the content script is ready
  setTimeout(() => {
    chrome.tabs.sendMessage(tabId, {
      type: "show-anchor-list",
      tabs: tabsData,
    });
  }, 50);
}

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command: string) => {
  if (command === "toggle-anchor") {
    toggleAnchor();
  } else if (command === "toggle-list") {
    toggleList();
  }
});

// Listen for tab switch requests from the overlay
chrome.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as SwitchMessage;
  if (msg.type === "switch-to-tab" && typeof msg.tabId === "number") {
    chrome.tabs.update(msg.tabId, { active: true });
  }
});

// Keep badge in sync when tabs change
chrome.tabs.onUpdated.addListener(() => updateBadge());
chrome.tabs.onRemoved.addListener(() => updateBadge());

// Also update when the extension icon is clicked — show the list
chrome.action.onClicked.addListener(() => toggleList());

// Initialize badge on startup
updateBadge();
