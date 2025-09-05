import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function LoadingScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthToken = async () => {
      try {
        const authToken = await SecureStore.getItemAsync('authToken');
        if (authToken) {
          // Token exists, navigate to the pagelayout screen
          router.replace('/pages/pagelayout');
        } else {
          // No token, navigate to the login screen
          router.replace('/pages/login');
        }
      } catch (error) {
        console.error('Error checking auth token:', error);
        // Handle error, maybe navigate to login
        router.replace('/pages/login');
      }
    };

    checkAuthToken();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}