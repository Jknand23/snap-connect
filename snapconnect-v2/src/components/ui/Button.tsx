/**
 * Button Component
 * 
 * A comprehensive button component with sleek sports-themed styling,
 * loading states, different variants, and accessibility features.
 * Optimized for black background theme with enhanced visual appeal.
 */
import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'glass' | 'team';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
  style?: any;
}

/**
 * Sleek button component with sports-themed styling and multiple variants
 * Designed for black background with enhanced visual hierarchy
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
  style,
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  /**
   * Get button base styles with sleek modern design
   */
  function getBaseStyles() {
    const base = 'flex-row items-center justify-center transition-all duration-200';
    
    // Size styles with refined spacing
    const sizeStyles = {
      sm: 'px-4 py-2.5 rounded-md',
      md: 'px-6 py-3 rounded-lg',
      lg: 'px-8 py-4 rounded-xl',
    };

    // Width styles
    const widthStyle = fullWidth ? 'w-full' : '';

    return `${base} ${sizeStyles[size]} ${widthStyle}`;
  }

  /**
   * Get button variant styles with enhanced theme integration
   */
  function getVariantStyles() {
    if (isDisabled) {
      return 'bg-dark-bg-tertiary opacity-60 border border-dark-border-light';
    }

    const variants = {
      // Primary: Sleek interactive blue with subtle glow effect
      primary: 'bg-interactive shadow-lg shadow-interactive/25 active:shadow-interactive/40 active:scale-95',
      
      // Secondary: Elegant dark gray with subtle borders
      secondary: 'bg-dark-bg-elevated border border-dark-border-medium shadow-md active:bg-dark-bg-tertiary active:scale-95',
      
      // Outline: Clean minimal border design
      outline: 'border-2 border-interactive bg-transparent active:bg-interactive/10 active:scale-95',
      
      // Ghost: Subtle hover effects for minimal design
      ghost: 'bg-transparent active:bg-dark-bg-elevated active:scale-95',
      
      // Danger: Bold red for important actions
      danger: 'bg-error shadow-lg shadow-error/25 active:shadow-error/40 active:scale-95',
      
      // Success: Clean green for positive actions
      success: 'bg-success shadow-lg shadow-success/25 active:shadow-success/40 active:scale-95',
      
      // Glass: Sophisticated glassmorphic effect
      glass: 'bg-glass-dark border border-glass-border-dark backdrop-blur-md active:bg-glass-strong active:scale-95',
      
      // Team: Dynamic team colors with enhanced visual impact
      team: 'bg-team-primary shadow-lg shadow-team-primary/25 active:shadow-team-primary/40 active:scale-95',
    };

    return variants[variant];
  }

  /**
   * Get text styles with enhanced typography
   */
  function getTextStyles() {
    const baseTextStyle = 'font-semibold text-center tracking-wide';
    
    // Size-based text styles with improved hierarchy
    const sizeTextStyles = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    // Variant-based text colors with proper contrast
    const variantTextStyles = {
      primary: 'text-white',
      secondary: 'text-dark-text-primary',
      outline: isDisabled ? 'text-dark-text-tertiary' : 'text-interactive',
      ghost: 'text-dark-text-primary',
      danger: 'text-white',
      success: 'text-white',
      glass: 'text-dark-text-primary',
      team: 'text-white',
    };

    return `${baseTextStyle} ${sizeTextStyles[size]} ${variantTextStyles[variant]}`;
  }

  /**
   * Render loading indicator with proper theming
   */
  function renderLoadingIndicator() {
    if (!isLoading) return null;

    // Dynamic spinner color based on variant
    const getSpinnerColor = () => {
      switch (variant) {
        case 'outline':
        case 'ghost':
          return '#0066FF'; // interactive color
        case 'secondary':
        case 'glass':
          return '#FFFFFF'; // white for dark backgrounds
        default:
          return '#FFFFFF'; // white for colored backgrounds
      }
    };

    const spinnerSize = size === 'sm' ? 'small' : 'small';

    return (
      <ActivityIndicator
        size={spinnerSize}
        color={getSpinnerColor()}
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
   * Render button content with enhanced layout
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
      style={style}
      activeOpacity={0.85}
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

  Success: (props: Omit<ButtonProps, 'variant'>) => (
    <Button {...props} variant="success" />
  ),

  Glass: (props: Omit<ButtonProps, 'variant'>) => (
    <Button {...props} variant="glass" />
  ),

  Team: (props: Omit<ButtonProps, 'variant'>) => (
    <Button {...props} variant="team" />
  ),
};

/**
 * Enhanced sports-themed button presets
 */
export const SportsButtons = {
  /**
   * Follow Team button with dynamic styling
   */
  FollowTeam: ({ teamName, onPress, isFollowing = false, ...props }: 
    Omit<ButtonProps, 'title' | 'variant'> & { teamName: string; isFollowing?: boolean }
  ) => (
    <Button
      {...props}
      title={isFollowing ? `Following ${teamName}` : `Follow ${teamName}`}
      variant={isFollowing ? 'secondary' : 'team'}
      onPress={onPress}
    />
  ),

  /**
   * Join Game Chat button with enhanced styling
   */
  JoinGameChat: (props: Omit<ButtonProps, 'title' | 'variant'>) => (
    <Button
      {...props}
      title="Join Game Chat"
      variant="primary"
      icon={<Text className="text-white text-lg">💬</Text>}
    />
  ),

  /**
   * Share Story button with modern design
   */
  ShareStory: (props: Omit<ButtonProps, 'title' | 'variant'>) => (
    <Button
      {...props}
      title="Share to Story"
      variant="success"
      icon={<Text className="text-white text-lg">📱</Text>}
    />
  ),

  /**
   * Live Game button with enhanced visual impact
   */
  LiveGame: (props: Omit<ButtonProps, 'title' | 'variant'>) => (
    <Button
      {...props}
      title="🔴 LIVE"
      variant="danger"
      size="sm"
      className="animate-pulse-live"
    />
  ),

  /**
   * Watch Game button for live content
   */
  WatchGame: (props: Omit<ButtonProps, 'title' | 'variant'>) => (
    <Button
      {...props}
      title="Watch"
      variant="primary"
      size="sm"
      icon={<Text className="text-white">📺</Text>}
    />
  ),

  /**
   * Quick Action button for home screen
   */
  QuickAction: ({ title, onPress, icon, ...props }: 
    Omit<ButtonProps, 'variant'> & { title: string; onPress: () => void; icon?: React.ReactNode }
  ) => (
    <Button
      {...props}
      title={title}
      onPress={onPress}
      variant="secondary"
      size="sm"
      icon={icon}
    />
  ),
}; 