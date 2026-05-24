import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getContests, saveContests } from "../_lib/store";
import type { Contest } from "../_lib/types";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === "GET") {
    const contests = await getContests();
    return res.json(contests);
  }

  if (req.method === "POST") {
    const { name, year, startTime, endTime } = req.body ?? {};
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ error: "Tên kỳ thi không được để trống." });
    }
    const contests = await getContests();
    const newContest: Contest = {
      id:
        "contest_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      year: (year || new Date().getFullYear()).toString(),
      status: "active",
      createdAt: new Date().toISOString(),
      startTime:
        startTime && startTime.trim()
          ? new Date(startTime).toISOString()
          : undefined,
      endTime:
        endTime && endTime.trim()
          ? new Date(endTime).toISOString()
          : undefined
    };
    contests.push(newContest);
    await saveContests(contests);
    return res.status(201).json({ success: true, contest: newContest });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end();
}
