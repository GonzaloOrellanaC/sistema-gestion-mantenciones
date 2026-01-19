export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string; // SVG string data from ionicons/icons
}

export interface NavigationLink {
  label: string;
  path: string;
  isButton?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
}

export enum RoutePath {
  HOME = '/',
  LOGIN = '/auth/login',
  REGISTER = '/auth/register'
}