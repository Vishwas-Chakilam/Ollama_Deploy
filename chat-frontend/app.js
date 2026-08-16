const OLLAMA_URL = "https://ollama-qwen.onrender.com/api/chat";
const MODEL_NAME = "qwen2.5:0.5b";

const chatHistory = document.getElementById("chatHistory");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Store full conversation history for context
let messagesContext = [];

// Auto-resize textarea
userInput.addEventListener("input", function() {
    this.style.height = "auto";
    this.style.height = (this.scrollHeight) + "px";
    if (this.value.trim() === "") {
        this.style.height = "auto";
    }
});

// Handle Enter key to submit (Shift+Enter for newline)
userInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }
});

chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    // Reset UI
    userInput.value = "";
    userInput.style.height = "auto";
    sendBtn.disabled = true;

    // Add user message to UI and Context
    appendMessage("user", text);
    messagesContext.push({ role: "user", content: text });

    // Create assistant message placeholder
    const assistantMessageId = "msg-" + Date.now();
    const assistantMsgElement = appendMessage("assistant", "<span class='loading-dots'>Thinking</span>", assistantMessageId);

    try {
        const response = await fetch(OLLAMA_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: messagesContext,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        
        // Clear "Thinking..."
        assistantMsgElement.innerHTML = "";
        
        let fullContent = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunkStr = decoder.decode(value, { stream: true });
            const lines = chunkStr.split('\n');

            for (const line of lines) {
                if (line.trim() !== '') {
                    try {
                        const json = JSON.parse(line);
                        if (json.message && json.message.content) {
                            fullContent += json.message.content;
                            // Parse markdown using marked (loaded via CDN in HTML)
                            assistantMsgElement.innerHTML = marked.parse(fullContent);
                            scrollToBottom();
                        }
                    } catch (e) {
                        console.error("Error parsing chunk", e, line);
                    }
                }
            }
        }

        // Save assistant response to context
        messagesContext.push({ role: "assistant", content: fullContent });

    } catch (error) {
        console.error("Fetch error:", error);
        assistantMsgElement.innerHTML = `<span style="color: #ef4444;">Connection failed. Ensure the backend allows CORS or is awake. (${error.message})</span>`;
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
});

function appendMessage(role, content, id = null) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", role);
    
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("message-content");
    if (id) contentDiv.id = id;
    
    // If user, just text. If assistant, might be HTML initially (loading dots)
    if (role === 'user') {
        contentDiv.textContent = content;
    } else {
        contentDiv.innerHTML = content;
    }

    msgDiv.appendChild(contentDiv);
    chatHistory.appendChild(msgDiv);
    
    scrollToBottom();
    
    return contentDiv;
}

function scrollToBottom() {
    chatHistory.scrollTo({
        top: chatHistory.scrollHeight,
        behavior: 'smooth'
    });
}
