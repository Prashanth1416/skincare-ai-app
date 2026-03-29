import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const WEB_LOCAL = 'http://localhost:5000';
const ANDROID_EMULATOR = 'http://10.0.2.2:5000';
const DEVICE_LAN = 'http://192.168.0.109:5000';

const BASE_URL = Platform.select({
  web: WEB_LOCAL,
  android: ANDROID_EMULATOR,
  ios: DEVICE_LAN,
  default: DEVICE_LAN,
});

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    if (error?.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'userId', 'userEmail', 'profilecompleted']);
    }
    return Promise.reject(error);
  }
);

export const getApiBaseUrl = () => BASE_URL;
export default api;