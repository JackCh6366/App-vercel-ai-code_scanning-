import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const apiKey = process.env.NVIDIA_API_KEY ? process.env.NVIDIA_API_KEY.replace(/^["']|["']$/g, "") : "";
console.log("Using API Key:", apiKey.substring(0, 15) + "...");

async function testModel(model) {
  console.log(`\n--- Testing model: ${model} ---`);
  const url = "https://integrate.api.nvidia.com/v1/chat/completions";
  const start = Date.now();
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "user", content: "Hello, answer in 2 words." }
        ],
        temperature: 0.1,
        max_tokens: 10
      })
    });
    const duration = Date.now() - start;
    console.log(`Status: ${response.status} ${response.statusText} (${duration}ms)`);
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

async function run() {
  await testModel("meta/llama-3.1-8b-instruct");
  await testModel("meta/llama-3.2-3b-instruct");
  await testModel("nvidia/llama-3.1-nemotron-nano-8b-v1");
}

run();
