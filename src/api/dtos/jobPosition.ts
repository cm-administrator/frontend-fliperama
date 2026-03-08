export interface JobPositionApiDTO {
  id: number;
  name: string;
  description: string;
  department: string;
  status: boolean; // mudar pra active na api
}
