(() => {
  const OVERLAY_ID = "anchor-tab-overlay";
  const BACKDROP_ID = "anchor-tab-backdrop";

  // Toggle off if already showing
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) {
    existing.remove();
    const backdrop = document.getElementById(BACKDROP_ID);
    if (backdrop) {
      backdrop.remove();
    }
    return;
  }

  interface AnchorTab {
    id: number;
    title: string;
    favIconUrl: string;
    slot: number;
  }

  interface AnchorMessage {
    type: string;
    tabs: AnchorTab[];
  }

  function createOverlay(tabs: AnchorTab[]): void {
    // Backdrop
    const backdrop = document.createElement("div");
    backdrop.id = BACKDROP_ID;
    Object.assign(backdrop.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      background: "rgba(0, 0, 0, 0.5)",
      zIndex: "2147483646",
    });

    // Panel
    const panel = document.createElement("div");
    panel.id = OVERLAY_ID;
    Object.assign(panel.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "#1e1e1e",
      border: "1px solid #3c3c3c",
      borderRadius: "8px",
      padding: "8px 0",
      minWidth: "360px",
      maxWidth: "500px",
      maxHeight: "400px",
      overflowY: "auto",
      zIndex: "2147483647",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: "13px",
      color: "#cccccc",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
    });

    if (tabs.length === 0) {
      const empty = document.createElement("div");
      Object.assign(empty.style, {
        padding: "16px 20px",
        textAlign: "center",
        color: "#888",
      });
      empty.textContent = "No anchored tabs. Press Cmd+Shift+P to anchor a tab.";
      panel.appendChild(empty);
    } else {
      for (const tab of tabs) {
        const item = document.createElement("div");
        Object.assign(item.style, {
          display: "flex",
          alignItems: "center",
          padding: "8px 16px",
          cursor: "pointer",
          gap: "10px",
        });

        item.addEventListener("mouseenter", () => {
          item.style.background = "#2a2d2e";
        });
        item.addEventListener("mouseleave", () => {
          item.style.background = "transparent";
        });

        // Slot number
        const slot = document.createElement("span");
        Object.assign(slot.style, {
          color: "#4688F1",
          fontWeight: "600",
          minWidth: "20px",
        });
        slot.textContent = String(tab.slot);

        // Favicon
        const favicon = document.createElement("img");
        favicon.src = tab.favIconUrl;
        favicon.width = 16;
        favicon.height = 16;
        Object.assign(favicon.style, {
          borderRadius: "2px",
          flexShrink: "0",
        });
        favicon.onerror = () => {
          favicon.style.display = "none";
        };

        // Title
        const title = document.createElement("span");
        Object.assign(title.style, {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        });
        title.textContent = tab.title;

        item.appendChild(slot);
        item.appendChild(favicon);
        item.appendChild(title);

        item.addEventListener("click", () => {
          chrome.runtime.sendMessage({ type: "switch-to-tab", tabId: tab.id });
          cleanup();
        });

        panel.appendChild(item);
      }
    }

    function cleanup(): void {
      panel.remove();
      backdrop.remove();
      document.removeEventListener("keydown", onKeydown);
    }

    function onKeydown(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cleanup();
      }
    }

    backdrop.addEventListener("click", cleanup);
    document.addEventListener("keydown", onKeydown);

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
  }

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message: unknown) => {
    const msg = message as AnchorMessage;
    if (msg.type === "show-anchor-list" || msg.type === "update-anchor-list") {
      // Remove existing if any, then recreate with fresh data
      const existingOverlay = document.getElementById(OVERLAY_ID);
      if (existingOverlay) {
        existingOverlay.remove();
      }
      const existingBackdrop = document.getElementById(BACKDROP_ID);
      if (existingBackdrop) {
        existingBackdrop.remove();
      }
      createOverlay(msg.tabs);
    }
  });
})();
