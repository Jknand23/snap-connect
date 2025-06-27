/**
 * Button Component
 * 
 * A comprehensive button component with sports-themed styling,
 * loading states, different variants, and accessibility features.
 */
import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
}

/**
 * Button component with sports-themed styling and multiple variants
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  /**
   * Get button base styles
   */
  function getBaseStyles() {
    const base = 'flex-row items-center justify-center rounded-lg';
    
    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-2',
      md: 'px-4 py-3',
      lg: 'px-6 py-4',
    };

    // Width styles
    const widthStyle = fullWidth ? 'w-full' : '';

    return `${base} ${sizeStyles[size]} ${widthStyle}`;
  }

  /**
   * Get button variant styles
   */
  function getVariantStyles() {
    if (isDisabled) {
      return 'bg-gray-600 opacity-50';
    }

    const variants = {
      primary: 'bg-blue-600 active:bg-blue-700',
      secondary: 'bg-gray-700 active:bg-gray-600',
      outline: 'border-2 border-blue-600 bg-transparent active:bg-blue-600/10',
      ghost: 'bg-transparent active:bg-gray-700',
      danger: 'bg-red-600 active:bg-red-700',
    };

    return variants[variant];
  }

  /**
   * Get text styles based on variant and size
   */
  function getTextStyles() {
    const baseTextStyle = 'font-semibold text-center';
    
    // Size-based text styles
    const sizeTextStyles = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    // Variant-based text colors
    const variantTextStyles = {
      primary: 'text-white',
      secondary: 'text-white',
      outline: isDisabled ? 'text-gray-500' : 'text-blue-600',
      ghost: 'text-white',
      danger: 'text-white',
    };

    return `${baseTextStyle} ${sizeTextStyles[size]} ${variantTextStyles[variant]}`;
  }

  /**
   * Render loading indicator
   */
  function renderLoadingIndicator() {
    if (!isLoading) return null;

    const spinnerColor = variant === 'outline' ? '#3B82F6' : '#FFFFFF';
    const spinnerSize = size === 'sm' ? 'small' : 'small';

    return (
      <ActivityIndicator
        size={spinnerSize}
        color={spinnerColor}
        style={{ marginRight: icon || title ? 8 : 0 }}
      />
    );
  }

  /**
   * Render icon with proper spacing
   */
  function renderIcon() {
    if (!icon || isLoading) return null;

    const iconSpacing = iconPosition === 'left' ? 'mr-2' : 'ml-2';

    return (
      <View className={iconSpacing}>
        {icon}
      </View>
    );
  }

  /**
   * Render button content
   */
  function renderContent() {
    return (
      <>
        {isLoading && renderLoadingIndicator()}
        {iconPosition === 'left' && renderIcon()}
        
        {title && (
          <Text className={getTextStyles()}>
            {title}
          </Text>
        )}
        
        {iconPosition === 'right' && renderIcon()}
      </>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`${getBaseStyles()} ${getVariantStyles()} ${className}`}
      activeOpacity={0.8}
      accessibilityLabel={title}
      accessibilityHint={isLoading ? 'Loading' : undefined}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
        busy: isLoading,
      }}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

/**
 * Button variants for specific use cases
 */
export const ButtonVariants = {
  Primary: (props: Omit<ButtonProps, 'variant'>) => (
    <Button {...props} variant="primary" />
  ),
  
  Secondary: (props: Omit<ButtonProps, 'variant'>) => (
    <Button {...props} variant="secondary" />
  ),
  
  Outline: (props: Omit<ButtonProps, 'variant'>) => (
    <Button {...props} variant="outline" />
  ),
  
  Ghost: (props: Omit<ButtonProps, 'variant'>) => (
    <Button {...props} variant="ghost" />
  ),
  
  Danger: (props: Omit<ButtonProps, 'variant'>) => (
    <Button {...props} variant="danger" />
  ),
};

/**
 * Sports-themed button presets
 */
export const SportsButtons = {
  /**
   * Follow Team button
   */
  FollowTeam: ({ teamName, onPress, isFollowing = false, ...props }: 
    Omit<ButtonProps, 'title' | 'variant'> & { teamName: string; isFollowing?: boolean }
  ) => (
    <Button
      {...props}
      title={isFollowing ? `Following ${teamName}` : `Follow ${teamName}`}
      variant={isFollowing ? 'secondary' : 'primary'}
      onPress={onPress}
    />
  ),

  /**
   * Join Game Chat button
   */
  JoinGameChat: (props: Omit<ButtonProps, 'title' | 'variant'>) => (
    <Button
      {...props}
      title="Join Game Chat"
      variant="primary"
      icon={<Text className="text-white">💬</Text>}
    />
  ),

  /**
   * Share Story button
   */
  ShareStory: (props: Omit<ButtonProps, 'title' | 'variant'>) => (
    <Button
      {...props}
      title="Share to Story"
      variant="primary"
      icon={<Text className="text-white">📱</Text>}
    />
  ),

  /**
   * Live Game button
   */
  LiveGame: (props: Omit<ButtonProps, 'title' | 'variant'>) => (
    <Button
      {...props}
      title="🔴 LIVE"
      variant="danger"
      size="sm"
    />
  ),
}; 