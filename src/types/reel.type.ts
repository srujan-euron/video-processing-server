export interface CreateReel {
  title: string;
  description: string;
  publishStatus: string;
  processingStatus: string;
  videoId: string;
  thumbnailUrl: string;
  addedBy: string;
}

export interface UpdateReel {
  id: string;
  title?: string;
  description?: string;
  publishStatus?: string;
  videoId?: string;
  thumbnailUrl?: string;
}

export interface UpdateReelStatus {
  id: string;
  publishStatus: string;
}