/**
 * Navigation type definitions
 * Centralizes all navigation-related TypeScript types
 */
export type RootTabParamList = {
  Discovery: undefined;
  Camera: undefined;
  Messages: undefined;
};

export type MessagesStackParamList = {
  MessagesList: undefined;
  Friends: undefined;
  Profile: undefined;
  Chat: {
    friendId: string;
    friendUsername: string;
    chatId?: string;
  };
};

export type AuthStackParamList = {
  Login: undefined;
  // Add more auth screens here in the future
  // Signup: undefined;
  // ForgotPassword: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
} 