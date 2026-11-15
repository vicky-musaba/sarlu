import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lesecours.app',
  appName: 'Le Secours',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  android: {
    path: 'E:/android'
  }
};

export default config;
