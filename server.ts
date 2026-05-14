import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy initialization of Gemini
let ai: GoogleGenAI | null = null;
const getAI = () => {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

// API routes
app.post("/api/gemini/suggest-dependencies", async (req, res) => {
  try {
    const { prompt } = req.body;
    const aiClient = getAI();
    const model = "gemini-1.5-flash"; // Using stable model alias
    
    const result = await aiClient.models.generateContent({
      model,
      contents: `Suggest a list of Python pip packages for a machine learning project about: ${prompt}.
      Return a JSON array of objects with "name" and "description" fields.
      Example: [{"name": "numpy", "description": "Numerical calculations"}]`,
      config: {
        responseMimeType: "application/json",
      },
    });

    res.json(JSON.parse(result.text || "[]"));
  } catch (error: any) {
    console.error("Gemini Suggest Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/gemini/generate-snippet", async (req, res) => {
  try {
    const { projectName, dependencies, models, dataSources, gitConfig, hfConfig } = req.body;
    const aiClient = getAI();
    const model = "gemini-1.5-flash";

    const result = await aiClient.models.generateContent({
      model,
      contents: `Generate a Google Colab compatible Python script for the project "${projectName}".
      Dependencies: ${dependencies.join(", ")}.
      Models: ${models.map((m: any) => m.name).join(", ")}.
      Data Sources: ${dataSources.map((ds: any) => `${ds.name} (${ds.type}): ${ds.path}`).join(", ")}.
      Git Config: ${gitConfig?.enabled ? `Remote: ${gitConfig.remoteUrl}, Branch: ${gitConfig.branch}` : 'None'}.
      Hugging Face: ${hfConfig?.enabled ? `Repo ID: ${hfConfig.repoId}` : 'None'}.
      Include:
      1. Dependencies installation.
      2. Git integration (cloning repo if enabled).
      3. Hugging Face login requirement (huggingface_hub.login) - explain how to use HF_TOKEN.
      4. Model downloading (snapshot_download or from_pretrained).
      5. Data loading logic for specified sources.
      6. Model initialization template.
      7. Training loop boiler plate.
      Return only the python code block.`,
    });

    res.json({ code: result.text || "# Failed to generate snippet" });
  } catch (error: any) {
    console.error("Gemini Generate Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
