
import { GoogleGenAI, Type } from "@google/genai";
import { Puzzle, InteractionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generatePlayablePuzzle(topic: string): Promise<Puzzle> {
  const prompt = `Act as a Visual Algorithm Designer. Create a game challenge for: "${topic}".
  
  Available Visual Primitives:
  - 'circle', 'bracket', 'tree-node', 'path-arrow', 'divisor', 'rectangle', 'box'.

  INTERACTIVE PROPERTIES:
  - 'isLocked': true if the item shouldn't move individually (use for static structure background).
  - 'canDragGroup': true if dragging this item should move its entire groupId.
  - 'groupId': String. Items with same ID are treated as a logical unit.

  CRITICAL DESIGN RULES:
  1. For Sliding Window: Use 'bracket' objects. Give them the same groupId. 
  2. For Arrays: Arrange nodes horizontally. Give them a groupId but keep canDragGroup false so user can swap individual elements, unless the goal is to move the whole array.
  3. Interactive Cues: Provide a 'path-arrow' or 'pointer' for user-controlled variables.

  Task: Give the user a clear goal (e.g., "Rearrange the nodes to sort the array").
  Return valid JSON matching the schema.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          topic: { type: Type.STRING },
          title: { type: Type.STRING },
          challengeGoal: { type: Type.STRING },
          interactionMode: { type: Type.STRING },
          initialState: {
            type: Type.OBJECT,
            properties: {
              objects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    label: { type: Type.STRING },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER },
                    groupId: { type: Type.STRING },
                    isLocked: { type: Type.BOOLEAN },
                    canDragGroup: { type: Type.BOOLEAN }
                  }
                }
              }
            }
          },
          victoryCondition: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              logicHint: { type: Type.STRING }
            }
          },
          explanation: { type: Type.STRING }
        },
        required: ["id", "title", "challengeGoal", "interactionMode", "initialState", "victoryCondition"]
      }
    }
  });

  return JSON.parse(response.text);
}
