import { Group } from "./group.model";

export interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  userName?: string;
  password?: string;
  phoneNumber?: string;
  role: string;
  groupIds?: string[]; // Changed from groupId to groupIds
  userGroups?: UserGroup[];
}

export interface UserGroup {
  id: string;
  userId: string;
  groupId: string;
  joinedDate: string;
  group?: Group;
}

export interface ResponseMessage {
  success: boolean;
  message: string;
}

export interface GetByIdResponse<T> {
  success: boolean;
  message: string;
  data: T;
}