import { StyleSheet, View, Text, Pressable, TextInput, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('https://followupio.com/swadeshordermanagment/login&signup/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          UserLoginId: username,
          UserPassword: password,
        }),
      });

      const data = await response.json();

      // Log the response for debugging purposes
      console.log('API Response Status:', response.status);
      console.log('API Response Data:', data);

      // Check the 'status' field in the response data
     if (data.status === 1) {
  // If status is 1, login is successful
  const authToken = data.data[0].AuthToken;
  await SecureStore.setItemAsync('authToken', authToken);
  router.replace('/pages/pagelayout');
} else {
  // If status is not 1, show the message from the response
  setError(data.message || 'Invalid username or password.');
}
    } catch (e) {
      // Log the actual error to the console
      console.error('Error during API call:', e);
      setError('Failed to connect to the server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Image
            // Using a placeholder URI to avoid local asset path issues during compilation
            source={require('../../assets/images/my-logo.png')}
            style={styles.companyLogo}
          />
          <Text style={styles.companyTitle}>Wellcome To Swadesh</Text>
          
        </View>

        {/* Content Section with Login Form */}
        <View style={styles.contentContainer}>
          

          <Text style={styles.inputtitle}>UserID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Username..."
            placeholderTextColor="#A9A9A9"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            returnKeyType="next"
          />
          <Text style={styles.inputtitle}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Password..."
            placeholderTextColor="#A9A9A9"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </Pressable>
        </View>

        {/* Footer Section with Login Button */}
        <View style={styles.footerContainer}>
          <Pressable onPress={handleLogin} disabled={isLoading}>
            <LinearGradient
              colors={isLoading ? ['#aaa', '#999'] : ['#025C42', '#025C42']}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// StyleSheet for all the component styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    height: '35%',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  companyLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'absolute',
    top: 60,
    zIndex: 10,
   shadowColor: "#000",
   shadowOffset: {
     width: 0,
     height: 4,
   },
   shadowOpacity: 0.30,
   shadowRadius: 4.65,
  },
  companyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    height: 120,
    borderRadius: 60,
    position: 'absolute',
    top: 180,
    zIndex: 10,
   shadowColor: "#000",
   shadowOffset: {
     width: 0,
     height: 4,
   },
   shadowOpacity: 0.30,
   shadowRadius: 4.65,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: 'center',
    marginTop: 30,
    zIndex: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputtitle: {
    fontSize: 20,
    fontWeight: 'semibold',
    color: '#333',
    marginBottom: 3,
    
  },
  input: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: '#4A90E2',
    textAlign: 'right',
    fontSize: 14,
  },
  footerContainer: {
    height: '20%',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});