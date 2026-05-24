export interface Contest {
  id: string;
  name: string;
  year: string;
  status: "active" | "archived";
  createdAt: string;
  startTime?: string;
  endTime?: string;
}

export interface Report {
  id: string;
  senderName: string;
  fileName: string;
  fileSize: string;
  fileData?: string; // base64 string to download the uploaded file if needed
  submittedAt: string;
  contestId?: string; // optional for backward compatibility
}

