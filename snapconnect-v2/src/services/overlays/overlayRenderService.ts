/**
 * Overlay Render Service
 * Handles capturing camera views with overlays as single images
 * Manages overlay rendering performance and quality
 */

import { captureRef } from 'react-native-view-shot';
import * as Haptics from 'expo-haptics';
import type { OverlayCaptureOptions, ActiveOverlay } from '../../types/overlays';

export class OverlayRenderService {
  private renderCache: Map<string, string> = new Map();
  private isCapturing = false;

  /**
   * Capture camera view with overlays as single image
   */
  async captureWithOverlays(
    viewRef: React.RefObject<any>,
    options: OverlayCaptureOptions = {
      format: 'jpg',
      quality: 0.9,
      includeOverlays: true,
    }
  ): Promise<string | null> {
    try {
      if (this.isCapturing) {
        console.warn('Capture already in progress');
        return null;
      }

      this.isCapturing = true;

      // Haptic feedback for capture
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!viewRef.current) {
        throw new Error('View reference is null');
      }

      console.log('📸 Capturing camera view with overlays...');

      const captureOptions = {
        format: options.format,
        quality: options.quality,
        result: 'tmpfile' as const,
        ...( options.width && options.height && {
          width: options.width,
          height: options.height,
        }),
      };

      const imageUri = await captureRef(viewRef, captureOptions);
      
      console.log('✅ Captured image:', imageUri);

      // Success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      return imageUri;
    } catch (error) {
      console.error('❌ Error capturing view with overlays:', error);
      
      // Error haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      return null;
    } finally {
      this.isCapturing = false;
    }
  }

  /**
   * Capture high-quality image for sharing
   */
  async captureHighQuality(
    viewRef: React.RefObject<any>,
    activeOverlays: ActiveOverlay[]
  ): Promise<string | null> {
    return this.captureWithOverlays(viewRef, {
      format: 'jpg',
      quality: 0.95,
      width: 1080,
      height: 1920,
      includeOverlays: true,
      overlayIds: activeOverlays.filter(o => o.isVisible).map(o => o.id),
    });
  }

  /**
   * Capture compressed image for stories
   */
  async captureForStory(
    viewRef: React.RefObject<any>,
    activeOverlays: ActiveOverlay[]
  ): Promise<string | null> {
    return this.captureWithOverlays(viewRef, {
      format: 'jpg',
      quality: 0.8,
      width: 720,
      height: 1280,
      includeOverlays: true,
      overlayIds: activeOverlays.filter(o => o.isVisible).map(o => o.id),
    });
  }

  /**
   * Capture thumbnail for preview
   */
  async captureThumbnail(
    viewRef: React.RefObject<any>
  ): Promise<string | null> {
    return this.captureWithOverlays(viewRef, {
      format: 'jpg',
      quality: 0.6,
      width: 200,
      height: 300,
      includeOverlays: true,
    });
  }

  /**
   * Get overlay rendering performance metrics
   */
  getPerformanceMetrics(): {
    cacheSize: number;
    isCapturing: boolean;
    memoryUsage: number;
  } {
    return {
      cacheSize: this.renderCache.size,
      isCapturing: this.isCapturing,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Clear render cache to free memory
   */
  clearCache(): void {
    this.renderCache.clear();
    console.log('🗑️ Overlay render cache cleared');
  }

  /**
   * Estimate memory usage of cache
   */
  private estimateMemoryUsage(): number {
    // Rough estimation: each cached item ~100KB
    return this.renderCache.size * 100;
  }

  /**
   * Prepare view for capture (optimize rendering)
   */
  async prepareForCapture(
    overlays: ActiveOverlay[]
  ): Promise<void> {
    try {
      // Sort overlays by z-index for proper rendering order
      overlays.sort((a, b) => a.zIndex - b.zIndex);
      
      // Pre-warm any dynamic content
      for (const overlay of overlays) {
        if (overlay.isVisible) {
          // Trigger any lazy-loaded content
          this.preloadOverlayAssets(overlay);
        }
      }
    } catch (error) {
      console.error('Error preparing for capture:', error);
    }
  }

  /**
   * Preload overlay assets for smooth capture
   */
  private async preloadOverlayAssets(overlay: ActiveOverlay): Promise<void> {
    // This would preload any fonts, images, or other assets
    // For now, it's a placeholder for future enhancements
  }

  /**
   * Validate capture quality
   */
  validateCapture(imageUri: string): boolean {
    // Basic validation - check if URI exists and looks valid
    return Boolean(imageUri && imageUri.length > 0 && imageUri.startsWith('file://'));
  }

  /**
   * Get optimal capture settings based on device capabilities
   */
  getOptimalCaptureSettings(): OverlayCaptureOptions {
    // For now, return standard settings
    // Future: detect device capabilities and adjust accordingly
    return {
      format: 'jpg',
      quality: 0.9,
      width: 1080,
      height: 1920,
      includeOverlays: true,
    };
  }

  /**
   * Batch capture multiple overlay configurations
   */
  async batchCapture(
    viewRef: React.RefObject<any>,
    overlayConfigurations: ActiveOverlay[][]
  ): Promise<string[]> {
    const results: string[] = [];

    for (const overlays of overlayConfigurations) {
      await this.prepareForCapture(overlays);
      
      const imageUri = await this.captureWithOverlays(viewRef, {
        format: 'jpg',
        quality: 0.8,
        includeOverlays: true,
        overlayIds: overlays.filter(o => o.isVisible).map(o => o.id),
      });

      if (imageUri) {
        results.push(imageUri);
      }

      // Small delay between captures to prevent performance issues
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Create overlay preset preview
   */
  async createPresetPreview(
    viewRef: React.RefObject<any>,
    presetName: string
  ): Promise<string | null> {
    const cacheKey = `preset-${presetName}`;
    
    if (this.renderCache.has(cacheKey)) {
      return this.renderCache.get(cacheKey)!;
    }

    const preview = await this.captureWithOverlays(viewRef, {
      format: 'jpg',
      quality: 0.6,
      width: 300,
      height: 400,
      includeOverlays: true,
    });

    if (preview) {
      this.renderCache.set(cacheKey, preview);
    }

    return preview;
  }

  /**
   * Handle capture error with user-friendly messages
   */
  handleCaptureError(error: any): string {
    if (error.message?.includes('View reference is null')) {
      return 'Camera is not ready. Please try again.';
    }
    
    if (error.message?.includes('permission')) {
      return 'Camera permission required to capture photos.';
    }
    
    if (error.message?.includes('memory')) {
      return 'Not enough memory. Close other apps and try again.';
    }
    
    return 'Failed to capture photo. Please try again.';
  }

  /**
   * Check if capture is currently possible
   */
  canCapture(): boolean {
    return !this.isCapturing;
  }

  /**
   * Get capture status
   */
  getCaptureStatus(): {
    isCapturing: boolean;
    cacheSize: number;
    lastCaptureTime?: Date;
  } {
    return {
      isCapturing: this.isCapturing,
      cacheSize: this.renderCache.size,
      // lastCaptureTime would be tracked in a real implementation
    };
  }
}

// Export singleton instance
export const overlayRenderService = new OverlayRenderService(); 