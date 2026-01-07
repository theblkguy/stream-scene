export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
  bio?: string;
  profilePicture?: string;
  contactEmail?: string;
  phone?: string;
  socialLinks?: { twitter?: string; instagram?: string; [key: string]: string };
}

export interface AuthResponse {
  authenticated: boolean;
  user?: User;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}
