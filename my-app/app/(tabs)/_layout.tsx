import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* The index screen is the first screen in the stack */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* The login screen is now found at the path 'pages/login' */}
      <Stack.Screen name="pages/login" options={{ title: 'Login' }} />
    </Stack>
  );
}

