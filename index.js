/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Suppress LogBox warnings and dev banners in the app UI
LogBox.ignoreAllLogs(true);

AppRegistry.registerComponent(appName, () => App);
