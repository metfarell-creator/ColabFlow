export async function suggestDependencies(prompt: string) {
  try {
    const response = await fetch("/api/gemini/suggest-dependencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) throw new Error("Failed to fetch suggestions");
    return await response.json();
  } catch (e) {
    console.error("Failed to suggest dependencies", e);
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
    const response = await fetch("/api/gemini/generate-snippet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        projectName, 
        dependencies, 
        models, 
        dataSources, 
        gitConfig, 
        hfConfig 
      }),
    });
    if (!response.ok) throw new Error("Failed to generate snippet");
    const data = await response.json();
    return data.code;
  } catch (e) {
    console.error("Failed to generate Colab snippet", e);
    return "# Failed to generate snippet";
  }
}
