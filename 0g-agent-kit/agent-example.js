import express from "express";
import bodyParser from "body-parser";
import Agent from "./src/0gAgentSdk.js";

const app = express();
app.use(bodyParser.json());

agent.enableAI({
  groqApiKey: "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",
});

// ✅ API endpoint
app.post("/agent/execute", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("Received prompt:", prompt);

    // Step 1: Use AI
    const aiResponse = await agent.useAI(prompt);
    console.log("AI Response:", aiResponse);

    // Step 2: Execute on-chain action if needed
    let execResult = null;
    if (aiResponse.includes("authorize")) {
      execResult = await agent.executeAction("authorizeFeedback", { target: "0xAgent123" });
    }

    res.json({
      success: true,
      aiResponse,
      execResult,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log("🚀 0G Agent API running on http://localhost:3001");
});