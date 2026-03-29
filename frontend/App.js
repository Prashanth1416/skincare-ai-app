import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import MorningMoodAnalyzerScreen from './screens/MorningMoodAnalyzerScreen';
import MorningMoodHistoryScreen from './screens/MorningMoodHistoryScreen';
import MenstrualSettingsScreen from './screens/MenstrualSettingsScreen';
import ProductRecommendationsScreen from './screens/ProductRecommendationsScreen';
import ProfileDetailsScreen from './screens/ProfileDetailsScreen';
const Stack = createNativeStackNavigator();

function SplashScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
      }}
    >
      <ActivityIndicator size="large" color="#FF6B9D" />
    </View>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const profileCompleted = await AsyncStorage.getItem('profilecompleted');

        if (!token) {
          setInitialRoute('Login');
          return;
        }

        if (profileCompleted === 'true') {
          setInitialRoute('Home');
        } else {
          setInitialRoute('ProfileSetup');
        }
      } catch (error) {
        console.log('App bootstrap error:', error);
        setInitialRoute('Login');
      }
    };

    bootstrap();
  }, []);

  if (!initialRoute) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: Platform.OS === 'web' ? 'none' : 'slide_from_right',
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="MenstrualSettings" component={MenstrualSettingsScreen} />
        <Stack.Screen name="MorningMoodAnalyzer" component={MorningMoodAnalyzerScreen} />
        <Stack.Screen name="History" component={MorningMoodHistoryScreen} />
        <Stack.Screen name="MorningMoodHistory" component={MorningMoodHistoryScreen} />
        <Stack.Screen name="ProductRecommendations" component={ProductRecommendationsScreen} />
        <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}