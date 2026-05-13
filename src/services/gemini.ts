import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function suggestDependencies(prompt: string) {
  const model = "gemini-3-flash-preview";
  const result = await ai.models.generateContent({
    model,
    contents: `Suggest a list of Python pip packages for a machine learning project about: ${prompt}.
    Return a JSON array of objects with "name" and "description" fields.
    Example: [{"name": "numpy", "description": "Numerical calculations"}]`,
    config: {
      responseMimeType: "application/json",
    },
  });

  try {
    return JSON.parse(result.text || "[]");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
}

export async function generateColabSnippet(projectName: string, dependencies: string[], models: any[], dataSources: any[]) {
  const model = "gemini-3-flash-preview";
  const result = await ai.models.generateContent({
    model,
    contents: `Generate a Google Colab compatible Python script for the project "${projectName}".
    Dependencies: ${dependencies.join(", ")}.
    Models: ${models.map(m => m.name).join(", ")}.
    Data Sources: ${dataSources.map(ds => `${ds.name} (${ds.type}): ${ds.path}`).join(", ")}.
    Include:
    1. Dependencies installation.
    2. Data loading logic for specified sources.
    3. Model initialization template.
    4. Training loop boiler plate.
    Return only the python code block.`,
  });

  return result.text || "# Failed to generate snippet";
}
