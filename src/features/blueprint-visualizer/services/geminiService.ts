import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

// Constants for models
const CODE_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

export const generateBlueprintSvg = async (userPrompt: string): Promise<string> => {
  const systemInstruction = `
    You are an expert architect and vector graphics designer. 
    Your task is to generate a clean, professional SVG floorplan/blueprint based on the user's description.
    
    Rules:
    1. Output ONLY valid SVG code. Do not wrap in markdown code blocks.
    2. The SVG must be strictly 2D, top-down view.
    3. Use white background (fill='#FFFFFF').
    4. Use bold black lines for walls (stroke='black' stroke-width='4').
    5. Use thinner lines for windows/doors/furniture (stroke='black' stroke-width='2').
    6. Ensure the SVG has viewBox defined and responsive width/height.
    7. Do not include any text or explanations outside the SVG tags.
    8. Make it visually clear and spaced out.
  `;

  const prompt = `Create an SVG blueprint for: ${userPrompt}`;

  const response = await ai.models.generateContent({
    model: CODE_MODEL,
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.3, // Lower temperature for more precise code
    }
  });

  let svgText = response.text || '';

  // Cleanup markdown if present (e.g., ```xml ... ```)
  svgText = svgText.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();

  // Extract strictly the SVG part if there's extra noise
  const svgStart = svgText.indexOf('<svg');
  const svgEnd = svgText.lastIndexOf('</svg>');

  if (svgStart !== -1 && svgEnd !== -1) {
    svgText = svgText.substring(svgStart, svgEnd + 6);
  }

  if (!svgText.startsWith('<svg')) {
    throw new Error("Failed to generate valid SVG blueprint.");
  }

  return svgText;
};

export const generatePerspectiveImage = async (
  basePrompt: string,
  perspectiveType: string,
  referenceImageBase64: string
): Promise<string> => {

  // Clean base64 string if it contains data URI prefix
  const cleanBase64 = referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  const prompt = `
    Render a high-quality, photorealistic architectural visualization.
    Perspective: ${perspectiveType}.
    Subject: ${basePrompt}.
    
    IMPORTANT: strictly follow the layout and geometry provided in the reference image (blueprint).
    The reference image is the ground truth for the room shape and furniture placement.
    Lighting: Natural, professional architectural photography style.
  `;

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: cleanBase64
          }
        },
        {
          text: prompt
        }
      ]
    }
  });

  // Check for image parts in the response
  const candidates = response.candidates;
  if (candidates && candidates.length > 0) {
    const content = candidates[0].content;
    if (content && content.parts) {
      for (const part of content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
  }

  throw new Error(`Failed to generate perspective image for ${perspectiveType}`);
};