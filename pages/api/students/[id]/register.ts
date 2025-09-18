import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { id } = req.query;
  const { images } = req.body;
  const pyRes = await fetch(`http://localhost:8000/api/students/${id}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images }),
  });
  const data = await pyRes.json();
  res.status(pyRes.status).json(data);
}
