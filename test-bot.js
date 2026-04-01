const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_KEY || "AIzaSyCSZxzDDoizVW_Z9m3hX1nXA842ndTrehk"); // Fallback key just for local test

async function geminiChatMultimodal(prompt, systemMsg) {
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-flash-latest',
        systemInstruction: systemMsg
    });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

async function run() {
    const resolvedText = "casco";
    const allCandidates = [
        {"quantity": 10, "material": {"name": "CASCO ROJO"}, "warehouse": {"name": "ALM1"}},
        {"quantity": 5, "material": {"name": "CASACA CUERO"}, "warehouse": {"name": "ALM1"}}
    ];
    
    console.log("=== Testing Pre-filter ===");
    const filterPrompt = `El usuario preguntó: "${resolvedText}"\n\nLista de la Base de Datos:\n${JSON.stringify(allCandidates)}\n\nTarea: Filtra esta lista y quédate SOLO con los productos que el usuario REALMENTE está pidiendo. Elimina coincidencias parciales irrelevantes (ej: si pide casco, elimina casacas). Responde SOLO el JSON puramente, un array de objetos. No uses markdown.`;
    const filteredJson = await geminiChatMultimodal(filterPrompt, "Filtro de precisión de JSON.");
    console.log("OUTPUT:", filteredJson);
}
run();
