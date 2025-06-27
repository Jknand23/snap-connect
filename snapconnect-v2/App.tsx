/**
 * Main app entry point for SnapConnect V2
 * AI-powered sports Snapchat application
 */
import App from './src/app/index';
import { debugStorageTest } from './debug_storage_test';
import { debugAuthTest } from './debug_auth_test';
import { debugImageTest, debugImageTestWithCacheBust } from './debug_image_test';
import { debugDirectStorageTest, debugExistingImageTest } from './debug_storage_test_direct';
import { debugStorageConfig } from './debug_storage_config';
import { debugReactNativeImage } from './debug_react_native_image';
import { debugFixImageUpload } from './debug_fix_image_upload';
import { debugStoryTest } from './debug_story_test';

// Make debug function available globally in development
if (__DEV__) {
  (global as any).debugStorageTest = debugStorageTest;
  (global as any).debugAuthTest = debugAuthTest;
  (global as any).debugImageTest = debugImageTest;
  (global as any).debugImageTestWithCacheBust = debugImageTestWithCacheBust;
  (global as any).debugDirectStorageTest = debugDirectStorageTest;
  (global as any).debugExistingImageTest = debugExistingImageTest;
  (global as any).debugStorageConfig = debugStorageConfig;
  (global as any).debugReactNativeImage = debugReactNativeImage;
  (global as any).debugFixImageUpload = debugFixImageUpload;
  (global as any).debugStoryTest = debugStoryTest;
  console.log(' Debug tools loaded:');
  console.log('  - debugStorageTest() - Test storage configuration');
  console.log('  - debugAuthTest() - Test authentication system');
  console.log('  - debugImageTest() - Test specific failing image URL');
  console.log('  - debugImageTestWithCacheBust() - Test image with cache busting');
  console.log('  - debugDirectStorageTest() - Test storage without bucket listing');
  console.log('  - debugExistingImageTest() - Test your failing image directly');
  console.log('  - debugStorageConfig() - Comprehensive storage configuration test');
  console.log('  - debugReactNativeImage() - Test React Native Image component issues');
  console.log('  - debugFixImageUpload() - Test image upload fix');
  console.log('  - debugStoryTest() - Test story functionality');
}

export default App;
