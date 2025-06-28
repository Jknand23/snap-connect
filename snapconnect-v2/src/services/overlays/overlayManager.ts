/**
 * Overlay Manager Service
 * Central coordinator for all overlay functionality
 */

import { teamAssetService } from './teamAssetService';
import { overlayTemplateService } from './overlayTemplateService';
import { overlayRenderService } from './overlayRenderService';
import type { 
  ActiveOverlay, 
  OverlayTemplate, 
  OverlayPosition, 
  TeamAsset,
  SmartSuggestion 
} from '../../types/overlays';

export class OverlayManager {
  private activeOverlays: Map<string, ActiveOverlay> = new Map();
  private nextZIndex = 1;
  private maxOverlays = 5;

  /**
   * Get all active overlays
   */
  getActiveOverlays(): ActiveOverlay[] {
    return Array.from(this.activeOverlays.values()).sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Get active overlay by ID
   */
  getActiveOverlay(overlayId: string): ActiveOverlay | null {
    return this.activeOverlays.get(overlayId) || null;
  }

  /**
   * Add overlay from template
   */
  async addOverlayFromTemplate(
    template: OverlayTemplate, 
    teamId?: string,
    customPosition?: Partial<OverlayPosition>
  ): Promise<string | null> {
    try {
      console.log('🚀 ADD OVERLAY FROM TEMPLATE STARTED:', {
        templateId: template.id,
        templateName: template.name,
        teamId,
        currentSize: this.activeOverlays.size,
        maxOverlays: this.maxOverlays
      });

      // Check overlay limit
      if (this.activeOverlays.size >= this.maxOverlays) {
        console.warn('❌ Maximum overlay limit reached');
        return null;
      }

      // Get team asset if team-dependent
      let teamAsset: TeamAsset | null = null;
      if (template.teamDependent && teamId) {
        console.log('🏈 Getting team asset for teamId:', teamId);
        teamAsset = await teamAssetService.getTeamAsset(teamId);
        console.log('🏈 Team asset result:', teamAsset);
      }

      // Customize template for team
      let customizedTemplate = template;
      if (teamAsset && template.teamDependent) {
        console.log('🎨 Customizing template for team...');
        const teamCustomized = await overlayTemplateService.customizeTemplateForTeam(
          template.id,
          teamId!
        );
        if (teamCustomized) {
          customizedTemplate = teamCustomized;
          console.log('✅ Template customized for team');
        } else {
          console.log('⚠️ Template customization failed, using original');
        }
      }

      // Create overlay position
      const position: OverlayPosition = {
        ...template.defaultPosition,
        ...customPosition,
      };

      console.log('📍 Overlay position:', position);

      // Process template elements into overlay style and content
      const { style, content } = this.processTemplateElements(customizedTemplate, teamAsset);
      
      console.log('🎭 Processed template elements:', { style, content });

      // Create active overlay
      const overlayId = `overlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const activeOverlay: ActiveOverlay = {
        id: overlayId,
        templateId: template.id,
        teamId,
        position,
        customContent: content,
        style: style,
        isSelected: false,
        isVisible: true,
        zIndex: this.nextZIndex++,
      };

      console.log('📦 Created active overlay:', activeOverlay);

      // Add to active overlays
      this.activeOverlays.set(overlayId, activeOverlay);

      console.log('✅ OVERLAY ADDED SUCCESSFULLY:', {
        overlayId,
        newSize: this.activeOverlays.size,
        allOverlays: Array.from(this.activeOverlays.keys())
      });

      return overlayId;

    } catch (error) {
      console.error('❌ Error adding overlay from template:', error);
      return null;
    }
  }

  /**
   * Process template elements into overlay style and content
   */
  private processTemplateElements(
    template: OverlayTemplate, 
    teamAsset: TeamAsset | null
  ): { style: any; content: string } {
    try {
      let mergedStyle: any = {};
      let content = template.name.toUpperCase();

      // Process each element in the template
      for (const element of template.elements) {
        if (element.type === 'text') {
          // Extract text content and styling
          content = element.content || template.name.toUpperCase();
          
          if (element.style) {
            mergedStyle = {
              ...mergedStyle,
              fontSize: element.style.fontSize || 24,
              fontWeight: element.style.fontWeight || 'bold',
              color: element.style.color || '#FFFFFF',
              textAlign: element.style.textAlign || 'center',
              textShadow: element.style.textShadow || false,
              shadowColor: element.style.shadowColor || 'rgba(0,0,0,0.8)',
              shadowRadius: element.style.shadowRadius || 4,
            };
          }
        } else if (element.type === 'gradient') {
          // Extract gradient styling
          if (element.style?.gradient) {
            mergedStyle.gradient = element.style.gradient;
          }
          mergedStyle.borderRadius = element.style?.borderRadius || 10;
          mergedStyle.opacity = element.style?.opacity || 0.9;
        } else if (element.type === 'frame') {
          // Extract frame styling
          if (element.style) {
            mergedStyle = {
              ...mergedStyle,
              backgroundColor: element.style.backgroundColor || 'rgba(0,0,0,0.7)',
              borderRadius: element.style.borderRadius || 10,
              borderWidth: element.style.borderWidth || 0,
              borderColor: element.style.borderColor || 'transparent',
              opacity: element.style.opacity || 0.9,
            };
          }
        }
      }

      // If no elements or no styling found, use defaults
      if (Object.keys(mergedStyle).length === 0) {
        mergedStyle = {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#FFFFFF',
          textAlign: 'center',
          backgroundColor: teamAsset?.colors.primary || '#007AFF',
          borderRadius: 10,
          opacity: 0.9,
        };
      }

      return { style: mergedStyle, content };

    } catch (error) {
      console.error('Error processing template elements:', error);
      // Return safe defaults
      return {
        style: {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#FFFFFF',
          textAlign: 'center',
          backgroundColor: '#007AFF',
          borderRadius: 10,
          opacity: 0.9,
        },
        content: 'OVERLAY',
      };
    }
  }

  /**
   * Update overlay
   */
  updateOverlay(overlayId: string, updates: Partial<ActiveOverlay>): boolean {
    try {
      const overlay = this.activeOverlays.get(overlayId);
      if (!overlay) {
        console.warn(`Overlay not found: ${overlayId}`);
        return false;
      }

      // Update overlay
      const updatedOverlay = { ...overlay, ...updates };
      this.activeOverlays.set(overlayId, updatedOverlay);

      return true;
    } catch (error) {
      console.error('Error updating overlay:', error);
      return false;
    }
  }

  /**
   * Select overlay (deselect others)
   */
  selectOverlay(overlayId: string | null): boolean {
    try {
      // Deselect all overlays
      for (const overlay of this.activeOverlays.values()) {
        overlay.isSelected = false;
      }

      // Select target overlay
      if (overlayId) {
        const overlay = this.activeOverlays.get(overlayId);
        if (overlay) {
          overlay.isSelected = true;
          // Bring to front
          overlay.zIndex = this.nextZIndex++;
        } else {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error selecting overlay:', error);
      return false;
    }
  }

  /**
   * Duplicate overlay
   */
  duplicateOverlay(overlayId: string): string | null {
    try {
      const overlay = this.activeOverlays.get(overlayId);
      if (!overlay) {
        console.warn(`Overlay not found for duplication: ${overlayId}`);
        return null;
      }

      // Check overlay limit
      if (this.activeOverlays.size >= this.maxOverlays) {
        console.warn('Maximum overlay limit reached');
        return null;
      }

      // Create duplicate with offset position
      const newOverlayId = `overlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const duplicatedOverlay: ActiveOverlay = {
        ...overlay,
        id: newOverlayId,
        position: {
          ...overlay.position,
          x: Math.min(0.9, overlay.position.x + 0.1),
          y: Math.min(0.9, overlay.position.y + 0.1),
        },
        isSelected: false,
        zIndex: this.nextZIndex++,
      };

      this.activeOverlays.set(newOverlayId, duplicatedOverlay);

      console.log(`✅ Duplicated overlay: ${overlayId} → ${newOverlayId}`);
      return newOverlayId;

    } catch (error) {
      console.error('Error duplicating overlay:', error);
      return null;
    }
  }

  /**
   * Delete overlay
   */
  deleteOverlay(overlayId: string): boolean {
    try {
      const overlay = this.activeOverlays.get(overlayId);
      if (!overlay) {
        console.warn(`Overlay not found for deletion: ${overlayId}`);
        return false;
      }

      this.activeOverlays.delete(overlayId);

      console.log(`🗑️ Deleted overlay: ${overlayId}`);
      return true;

    } catch (error) {
      console.error('Error deleting overlay:', error);
      return false;
    }
  }

  /**
   * Clear all overlays
   */
  clearAllOverlays(): void {
    console.log('🗑️🗑️🗑️ CLEAR ALL OVERLAYS CALLED 🗑️🗑️🗑️');
    console.trace('Call stack:'); // This will show us who called this function
    this.activeOverlays.clear();
    this.nextZIndex = 1;
    console.log('🗑️ Cleared all overlays');
  }

  /**
   * Show/hide overlay
   */
  toggleOverlayVisibility(overlayId: string): boolean {
    try {
      const overlay = this.activeOverlays.get(overlayId);
      if (!overlay) {
        return false;
      }

      overlay.isVisible = !overlay.isVisible;
      return true;
    } catch (error) {
      console.error('Error toggling overlay visibility:', error);
      return false;
    }
  }

  /**
   * Get overlay count
   */
  getOverlayCount(): number {
    return this.activeOverlays.size;
  }

  /**
   * Get visible overlay count
   */
  getVisibleOverlayCount(): number {
    return Array.from(this.activeOverlays.values()).filter(o => o.isVisible).length;
  }

  /**
   * Check if can add more overlays
   */
  canAddOverlay(): boolean {
    return this.activeOverlays.size < this.maxOverlays;
  }

  /**
   * Get selected overlay
   */
  getSelectedOverlay(): ActiveOverlay | null {
    for (const overlay of this.activeOverlays.values()) {
      if (overlay.isSelected) {
        return overlay;
      }
    }
    return null;
  }

  /**
   * Get selected overlay ID
   */
  getSelectedOverlayId(): string | null {
    const selected = this.getSelectedOverlay();
    return selected ? selected.id : null;
  }

  /**
   * Bring overlay to front
   */
  bringToFront(overlayId: string): boolean {
    try {
      const overlay = this.activeOverlays.get(overlayId);
      if (!overlay) {
        return false;
      }

      overlay.zIndex = this.nextZIndex++;
      return true;
    } catch (error) {
      console.error('Error bringing overlay to front:', error);
      return false;
    }
  }

  /**
   * Send overlay to back
   */
  sendToBack(overlayId: string): boolean {
    try {
      const overlay = this.activeOverlays.get(overlayId);
      if (!overlay) {
        return false;
      }

      // Find minimum z-index
      const minZIndex = Math.min(...Array.from(this.activeOverlays.values()).map(o => o.zIndex));
      overlay.zIndex = minZIndex - 1;
      return true;
    } catch (error) {
      console.error('Error sending overlay to back:', error);
      return false;
    }
  }

  /**
   * Reset overlay positions to defaults
   */
  resetOverlayPositions(): void {
    try {
      let index = 0;
      for (const overlay of this.activeOverlays.values()) {
        // Get original template position
        const template = overlayTemplateService.getTemplateById(overlay.templateId);
        if (template) {
          overlay.position = {
            ...template.defaultPosition,
            // Add slight offset to prevent complete overlap
            x: template.defaultPosition.x + (index * 0.05),
            y: template.defaultPosition.y + (index * 0.05),
          };
          index++;
        }
      }
    } catch (error) {
      console.error('Error resetting overlay positions:', error);
    }
  }

  /**
   * Get overlay performance stats
   */
  getPerformanceStats(): {
    activeCount: number;
    visibleCount: number;
    memoryUsage: number;
    canAddMore: boolean;
  } {
    return {
      activeCount: this.getOverlayCount(),
      visibleCount: this.getVisibleOverlayCount(),
      memoryUsage: overlayRenderService.getPerformanceMetrics().memoryUsage,
      canAddMore: this.canAddOverlay(),
    };
  }

  /**
   * Export overlays configuration
   */
  exportOverlays(): any {
    return {
      overlays: Array.from(this.activeOverlays.values()),
      nextZIndex: this.nextZIndex,
      timestamp: Date.now(),
    };
  }

  /**
   * Import overlays configuration
   */
  importOverlays(config: any): boolean {
    try {
      if (!config.overlays || !Array.isArray(config.overlays)) {
        return false;
      }

      this.clearAllOverlays();
      
      for (const overlayData of config.overlays) {
        if (overlayData.id && this.activeOverlays.size < this.maxOverlays) {
          this.activeOverlays.set(overlayData.id, overlayData);
        }
      }

      this.nextZIndex = config.nextZIndex || this.activeOverlays.size + 1;
      
      return true;
    } catch (error) {
      console.error('Error importing overlays:', error);
      return false;
    }
  }

  /**
   * Get smart suggestions based on current context
   */
  async getSmartSuggestions(): Promise<SmartSuggestion[]> {
    try {
      return await overlayTemplateService.getSmartSuggestions();
    } catch (error) {
      console.error('Error getting smart suggestions:', error);
      return [];
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.clearAllOverlays();
    overlayRenderService.clearCache();
    teamAssetService.clearCache();
  }
}

// Export singleton instance
export const overlayManager = new OverlayManager(); 