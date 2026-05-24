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
  fileData?: string;
  submittedAt: string;
  contestId?: string;
}

export interface SystemSettings {
  adminPasscode: string;
}
