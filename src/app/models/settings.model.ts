export interface SiteSettings {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  email: EmailSettings;
}

export interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  phoneNumber: string;
  address: string;
  timezone: string;
  language: string;
}

export interface AppearanceSettings {
  primaryColor: string;
  secondaryColor: string;
  darkMode: boolean;
  sidebarPosition: 'right' | 'left';
  fontSize: 'small' | 'medium' | 'large';
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notifyOnNewUser: boolean;
  notifyOnNewMessage: boolean;
  notifyOnPayment: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  loginAttempts: number;
  maintenanceMode: boolean;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpEncryption: 'none' | 'ssl' | 'tls';
  fromEmail: string;
  fromName: string;
}