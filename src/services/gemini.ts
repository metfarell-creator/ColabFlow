import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DEFAULT_MODEL = "gemini-3-flash-preview";

export async function suggestDependencies(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `Suggest a list of Python pip packages for a machine learning project about: ${prompt}.
      Return a JSON array of objects with "name", "version", and "description" fields. 
      Always provide a reasonable "version" (e.g., standard stable version).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              version: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["name", "version", "description"]
          }
        }
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.error("Gemini Suggest Error:", error);
    return [];
  }
}

export async function checkOutdatedDependencies(dependencies: any[]) {
  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `Check if these Python dependencies are outdated: ${JSON.stringify(dependencies)}.
      Return a JSON array of objects for ONLY the outdated ones with fields: "name", "currentVersion", "latestVersion", "description".
      If all are up to date, return an empty array [].`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              currentVersion: { type: Type.STRING },
              latestVersion: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["name", "currentVersion", "latestVersion", "description"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.error("Gemini Check Updates Error:", error);
    return [];
  }
}

export async function generateColabSnippet(
  projectName: string, 
  dependencies: string[], 
  models: any[], 
  dataSources: any[], 
  gitConfig?: any, 
  hfConfig?: any
) {
  try {
    const prompt = `Generate a Google Colab compatible Python script for the project "${projectName}".
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
      Return only the python code block.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt
    });

    return response.text || "# Failed to generate snippet";
  } catch (error: any) {
    console.error("Gemini Generate Error:", error);
    return "# Failed to generate snippet";
  }
}
