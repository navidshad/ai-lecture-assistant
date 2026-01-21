# Gemini Live API Implementation Guide

This guide provides a comprehensive overview of how to utilize the **Gemini Live API** for building real-time, interactive AI applications. It is based on the implementation architecture of the **AI-Lecturer** project, focusing on connection stability, long-running sessions, and cost management.

---

## 1. Connection Mechanism

The Gemini Live API utilizes WebSockets for full-duplex, real-time communication. In a React/Web environment, this is typically managed using the `@google/genai` SDK.

### Initialization
To establish a connection, you need a `GoogleGenAI` instance and a session configuration.

```typescript
const ai = new GoogleGenAI({ apiKey: YOUR_API_KEY });

const sessionPromise = ai.live.connect({
  model: "gemini-2.0-flash-exp", // or preferred live model
  config: {
    responseModalities: ["audio"],
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
    },
    // Tools can be defined here for function calling
    tools: [{ functionDeclarations: [...] }],
    // Context window compression is key for long sessions
    contextWindowCompression: {
      slidingWindow: {},
    },
  },
  callbacks: {
    onopen: () => console.log("Session opened"),
    onmessage: (msg) => handleMessage(msg),
    onerror: (err) => handleError(err),
    onclose: (event) => handleClose(event),
  }
});
```

### Safety & Concurrency
Because connection is asynchronous, always guard your sends with a sequence check and a "session open" state to prevent errors on closed/stale WebSockets.

> [!TIP]
> Use a `connectSeqRef` counter to tag each connection. If an event (like `onclose`) occurs for a version that doesn't match the current sequence, ignore it.

---

## 2. Session Lifecycle & Resumption

One of the most powerful features of Gemini Live is the ability to resume sessions.

### Resumption Handles
When a session is active, the API sends periodic `sessionResumptionUpdate` messages containing a `newHandle`.

- **Storage**: Store this handle in `localStorage` or a database.
- **Usage**: When reconnecting, pass the handle in the `sessionResumption` config.

```typescript
// Storing the handle
if (message.sessionResumptionUpdate) {
  const { newHandle } = message.sessionResumptionUpdate;
  localStorage.setItem("gemini_resumption_handle", newHandle);
}

// Resuming the session
const config = {
  ...,
  sessionResumption: {
    handle: storedHandle
  }
};
```

---

## 3. Reconnection Strategies

Network interruptions are inevitable. We use two main strategies: **Proactive** and **Reactive**.

### Proactive (GoAway)
The API may send a `goAway` message indicating the connection will be terminated soon (e.g., due to server maintenance or reaching a time limit).
- **Action**: Start a new connection in the background *before* the current one dies.
- **Context**: Use the `resumptionHandle` to ensure the AI maintains the conversation context.

### Reactive (Exponential Backoff)
When an `onerror` or unexpected `onclose` occurs:
1. Implement **Exponential Backoff** (e.g., 1s, 2s, 4s...) to avoid hammering the server.
2. Limit the maximum number of attempts (e.g., 3 attempts) before asking the user to reconnect manually.

---

## 4. Connection Time Extension

Gemini Live sessions have a finite lifetime. To achieve "unlimited" duration:

1. **Context Window Compression**: Enable `slidingWindow` in the session config. This allows the model to manage its own "memory" by summarizing or forgetting older parts of the conversation.
2. **Proactive Reconnects**: Always monitor for `goAway` messages. By proactively switching to a new WebSocket with a resumption handle, the user experiences zero downtime and the AI "remembers" everything relevant.

---

## 5. Cost & Token Tracking

The Live API provides `usageMetadata` with cumulative token counts for the *entire* session.

### Calculating Delta Usage
Since the API returns the *total* session tokens, you must track the `previousTotal` to find the cost of the *current* turn.

```typescript
let previousTotalPromptTokens = 0;

function trackTurn(usageMetadata) {
  const currentPrompt = usageMetadata.promptTokenCount;
  const currentResponse = usageMetadata.responseTokenCount;
  
  // promptTokenCount includes all previous turns + current input
  const deltaPrompt = Math.max(0, currentPrompt - previousTotalPromptTokens);
  
  // responseTokenCount is already turn-specific based on current turn
  const turnTotal = deltaPrompt + currentResponse;
  
  // Update baseline for next turn ONLY when the turn is final
  if (isFinalTurn) {
    previousTotalPromptTokens = usageMetadata.totalTokenCount;
  }
}
```

> [!IMPORTANT]
> Reset your `previousTotal` baseline to `0` only when starting a **brand new** session (not on resume).

---

## 6. Best Practices

- **Sequence Guarding**: Use a sequence counter for every connection attempt to ignore callbacks from old, disconnected instances.
- **Audio Management**: Flush audio output buffers on interruption (e.g., when the user starts speaking) to ensure the AI feels responsive.
- **Context Anchoring**: Periodically send "Strong Anchors" (e.g., every 5 turns) with current system instructions and state to keep the AI focused during very long sessions.
- **Safe Messaging**: Wrap your `session.send()` calls in a try/catch and verify `socket.readyState` to prevent runtime crashes.

---

## 7. Events Reference

The following events from the Gemini Live API are utilized to manage the session lifecycle and user experience:

### Connection & Lifecycle Events
- **`onopen`**: Triggered when the WebSocket connection is established. Used to transition the UI to a `READY` state and send initial lecture instructions or resume context.
- **`onerror`**: Triggered on connection failures. Used to initiate reactive reconnection with exponential backoff.
- **`onclose`**: Triggered when the connection is terminated. Used for resource cleanup and to determine if a reconnection attempt should be made.

### Message Events (`onmessage`)
The `onmessage` callback receives various payloads that drive the application logic:

- **`sessionResumptionUpdate`**: Provides a `newHandle`. Critical for storing the token needed to resume the session if the connection drops.
- **`usageMetadata`**: Contains cumulative token counts (`promptTokenCount`, `candidatesTokenCount`). Used to calculate the cost of each individual turn.
- **`goAway`**: Sent by the server when a connection limit is approaching. Includes `timeLeft` (seconds), allowing the app to proactively restart the session using a resumption handle.
- **`toolCall`**: Occurs when the AI decides to use an external tool (e.g., `setActiveSlide` or `provideCanvasMarkdown`). The app processes these to update the UI or render visual content.
- **`serverContent`**: The container for AI responses and status updates:
    - **`inputTranscription`**: Real-time text of what the user is saying. Used to update the "Listening" state and transcript.
    - **`outputTranscription`**: Text version of the AI's audio response. Used for the real-time chat transcript.
    - **`modelTurn.parts[0].inlineData`**: Raw PCM audio data. Used for real-time playback through the Web Audio API.
    - **`interrupted`**: Triggered if the user speaks while the AI is talking. Used to immediately stop (flush) the current audio output.
    - **`generationComplete` / `turnComplete`**: Indicators that the AI has finished its current response. Used to finalize transcript entries and trigger periodic re-anchoring.

---

*This guide reflects the production-ready patterns implemented in the AI-Lecturer system.*
