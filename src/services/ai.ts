import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const getAI = () => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey });
};

export async function generateSummary(text: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Summarize the following text concisely, extracting key points and action items: \n\n${text}`,
  });
  return response.text;
}

export async function researchTopic(topic: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a research assistant. Provide a structured overview of the topic: "${topic}". Include key concepts, current trends, and suggested academic sources. Use Markdown formatting.`,
  });
  return response.text;
}

export async function searchSources(topic: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as an academic search engine. For the topic "${topic}", generate 5 realistic academic sources. 
    Return them as a JSON array of objects with the following structure:
    {
      "id": "unique-id",
      "title": "string",
      "authors": ["string"],
      "year": "string",
      "abstract": "string",
      "type": "journal" | "book" | "conference" | "other"
    }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            authors: { type: Type.ARRAY, items: { type: Type.STRING } },
            year: { type: Type.STRING },
            abstract: { type: Type.STRING },
            type: { type: Type.STRING }
          },
          required: ["id", "title", "authors", "year", "abstract", "type"]
        }
      }
    }
  });
  return JSON.parse(response.text);
}

export async function generateSourceSummary(source: any, detailLevel: 'short' | 'detailed' = 'detailed') {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Summarize this academic source in a ${detailLevel} manner: ${JSON.stringify(source)}. 
    ${detailLevel === 'short' ? 'Keep it to 2-3 sentences.' : 'Extract key points, important statistics, and major claims.'} 
    Use Markdown.`,
  });
  return response.text;
}

export async function generateSectionDraft(topic: string, sources: any[], section: 'Introduction' | 'Body' | 'Conclusion') {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Write the ${section} section of a research paper on "${topic}" using these sources: ${JSON.stringify(sources)}. 
    Include inline citations. Use Markdown formatting.`,
  });
  return response.text;
}

export async function generateCitation(source: any, style: 'APA' | 'MLA' | 'IEEE') {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a ${style} citation for this source: ${JSON.stringify(source)}. Return ONLY the citation string.`,
  });
  return response.text;
}

export async function generateResearchDraft(topic: string, sources: any[]) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a structured research draft for the topic "${topic}" using these sources: ${JSON.stringify(sources)}. 
    Include inline citations (e.g., [Author, Year]). 
    Add a "References" section at the end. 
    Use Markdown formatting.`,
  });
  return response.text;
}

export async function generateStructuredNotes(topic: string, sources: any[]) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Convert the research on "${topic}" from these sources: ${JSON.stringify(sources)} into organized, structured notes. 
    Categorize by sub-topics. Use Markdown.`,
  });
  return response.text;
}

export async function extractKeyInsights(source: any) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract the top 3-5 key insights and breakthrough findings from this research source: ${JSON.stringify(source)}. 
    Format as a bulleted list in Markdown.`,
  });
  return response.text;
}

export async function generateBibliography(sources: any[], style: 'APA' | 'MLA' | 'IEEE') {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a complete bibliography/reference list in ${style} style for the following sources: ${JSON.stringify(sources)}. 
    Sort them alphabetically. Use Markdown.`,
  });
  return response.text;
}

export async function analyzeDocument(text: string, task: 'summary' | 'detailed' | 'insights' | 'statistics' | 'notes' | 'draft') {
  const ai = getAI();
  let prompt = "";
  
  switch(task) {
    case 'summary':
      prompt = `Provide a concise summary of the following document text: ${text.substring(0, 10000)}`;
      break;
    case 'detailed':
      prompt = `Provide a detailed, comprehensive analysis and summary of the following document text: ${text.substring(0, 15000)}`;
      break;
    case 'insights':
      prompt = `Extract the top 5-10 key insights and breakthrough findings from this document: ${text.substring(0, 10000)}. Format as a bulleted list.`;
      break;
    case 'statistics':
      prompt = `Extract all key statistics, data points, and numerical findings from this document: ${text.substring(0, 10000)}. Format as a list.`;
      break;
    case 'notes':
      prompt = `Convert the following document into structured, organized research notes with sub-headings: ${text.substring(0, 15000)}`;
      break;
    case 'draft':
      prompt = `Generate a research paper draft based on the content of this document: ${text.substring(0, 15000)}. Include an introduction, main body, and conclusion.`;
      break;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
}

export async function detectDocumentMetadata(text: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on the following document text, extract the Title, Author(s), and Publication Year if available. 
    Return ONLY a JSON object with keys: title, authors (array), year. If not found, use null.
    Text: ${text.substring(0, 2000)}`,
    config: {
      responseMimeType: "application/json"
    }
  });
  try {
    return JSON.parse(response.text);
  } catch (e) {
    return { title: null, authors: null, year: null };
  }
}

export async function suggestPriorities(tasks: any[]) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Given these tasks: ${JSON.stringify(tasks)}, suggest which 3 should be prioritized today for maximum productivity. Explain why briefly.`,
  });
  return response.text;
}
