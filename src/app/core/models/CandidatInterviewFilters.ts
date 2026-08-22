import { InterviewType, InterviewStatus } from "./enums/enumPosteRecrutemnt";
import { Interview } from "./interview";

export interface CandidatInterviewFilters {
  type?: InterviewType;
  status?: InterviewStatus;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}
export interface EntretienTypeFilter {
  key: InterviewType;
  label: string;
  color: string;
  visible: boolean;
}
export interface CandidatInterviewPage {
  content: Interview[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
