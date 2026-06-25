import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const payload = {
  provider: "gemini",
  code: "const x = 1",
  language: "typescript",
  rules: {},
  prettierConfig: { tabWidth: 2 }
};

async function main() {
  console.log("Testing /api/analyze with Gemini...");
  try {
    const response = await fetch("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Raw response:", text.substring(0, 500));
    try {
      const data = JSON.parse(text);
      console.log("Success! Score:", data.qualityMetrics?.score);
      console.log("Error:", data.error);
      console.log("Details:", data.details);
    } catch (e) {
      console.log("Response was not JSON");
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

main();
