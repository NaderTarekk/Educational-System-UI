export interface ApplicationUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    role: string;
    groupId?: string;
    group?: Group;
    profileImage?: string;
    bio?: string;
}

export interface Group {
    id: string;
    name: string;
}