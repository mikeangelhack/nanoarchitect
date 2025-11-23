import { GoogleGenAI, Type } from "@google/genai";
import { ComponentType, BlueprintItem } from "../types";
import { BLUEPRINT_SYSTEM_INSTRUCTION } from "../constants";

// Initialize the client. 
// NOTE: In a real production build, you should proxy this through a backend.
// For this demo, we assume import.meta.env.VITE_GEMINI_API_KEY is available.
const getAiClient = () => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    console.error("API_KEY is missing from environment variables");
  }
  return new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
};

export const editImageWithPrompt = async (
  imageBase64: string,
  prompt: string,
  mimeType: string = 'image/png'
): Promise<string> => {
  const ai = getAiClient();

  try {
    // Gemini 2.5 Flash Image is designed for editing/transforming images with text prompts
    const model = 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
          {
            text: prompt, // e.g., "Add a retro filter" or "Remove the person"
          },
        ],
      },
      // Flash Image typically doesn't use schema for image output, it returns an image
    });

    // Iterate to find image part
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const content = candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
          }
        }
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

export const generateBlueprintLayout = async (userPrompt: string): Promise<BlueprintItem[]> => {
  const ai = getAiClient();

  try {
    // Use flash-lite or flash for fast logic generation
    const model = 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model,
      contents: `Create a layout for: "${userPrompt}". \n\nIMPORTANT: Ensure all furniture is strictly contained INSIDE the room walls. Align doors/windows to edges.`,
      config: {
        systemInstruction: BLUEPRINT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: Object.values(ComponentType) },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  rotation: { type: Type.NUMBER },
                  scaleX: { type: Type.NUMBER },
                  scaleY: { type: Type.NUMBER },
                },
                required: ["type", "x", "y"],
              },
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No layout generated");

    const parsed = JSON.parse(text);

    // Add IDs to items
    return parsed.items.map((item: any) => ({
      ...item,
      id: crypto.randomUUID(),
      rotation: item.rotation || 0,
      scaleX: item.scaleX || 1,
      scaleY: item.scaleY || 1
    }));

  } catch (error) {
    console.error("Error generating blueprint:", error);
    throw error;
  }
};

export const renderPerspectiveView = async (svgString: string, stylePrompt: string): Promise<string> => {
  const ai = getAiClient();

  try {
    const model = 'gemini-2.5-flash-image';

    // We convert SVG to base64 first. 
    // Since we can't easily canvas-draw efficiently in this service without browser API overhead,
    // we will pass the SVG code as text and ask for a render, OR if we had the base64 of the canvas we'd use that.
    // For this demo, we'll assume the SVG string is passed as a text description of geometry 
    // BUT passing an image is better. 
    // Let's use the text description method combined with the SVG code as a strong context.

    const prompt = `
    Render a high-quality photorealistic image based on this floorplan layout.
    Style: ${stylePrompt}.
    
    Here is the SVG layout structure:
    ${svgString}
    `;

    // If we had a way to snapshot the canvas to base64 in the component, we would send that as inlineData.
    // Assuming the caller might pass base64 if available, but here we rely on the model understanding SVG code structure or simple description.
    // Ideally, we send a screenshot.

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: prompt }]
      }
    });

    // Iterate to find image part
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const content = candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
          }
        }
      }
    }
    throw new Error("No render generated");

  } catch (error) {
    console.error("Error rendering perspective:", error);
    throw error;
  }
}

// Helper for client-side SVG to Base64 (used in components)
export const svgToDataUrl = (svgElement: SVGSVGElement) => {
  const xml = new XMLSerializer().serializeToString(svgElement);
  const svg64 = window.btoa(unescape(encodeURIComponent(xml)));
  return `data:image/svg+xml;base64,${svg64}`;
};