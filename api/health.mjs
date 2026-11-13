export function GET() {
  return Response.json({
    online: false,
    vision: [],
    all: [],
    mode: "browser",
    reason: "Ollama runs on the user's computer and is not available inside Vercel.",
    geometryAvailable: true,
    researchAvailable: true
  }, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}