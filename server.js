import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/fms", async (req, res) => {
  const scriptUrl = "https://script.google.com/macros/s/AKfycbwD21RPP8qNlFmhVXoiwzw9MtaKTZcBrTmqngdBKvX7Pl-x_T9GXxhL7M6obgvNJppPvg/exec";
  const response = await fetch(scriptUrl, {
    method: "POST",
    body: JSON.stringify(req.body),
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  res.json(data);
});

app.listen(3000, () => console.log("Proxy running on port 3000"));
