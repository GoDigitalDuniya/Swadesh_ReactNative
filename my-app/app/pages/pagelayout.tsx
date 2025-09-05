import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// Import your screen and component files
import DispatchNowScreen from './dispatchnow';
import DispatchListScreen from './dispatchlist';
import LogoutModal from '../components/LogoutModal';
import Inward from './inward/inward';
import Stock from './stock/stock';

export default function PageLayout() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Dispatch'); // Default tab
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);

  // Function to handle the final logout action
  const handleConfirmLogout = async () => {
    await SecureStore.deleteItemAsync('authToken');
    setLogoutModalVisible(false);
    router.replace('/pages/login');
  };

  // Define the specific type for Ionicons names
  type IconName = React.ComponentProps<typeof Ionicons>['name'];

  // A helper function for navigation buttons, now with an optional onPress handler
  const NavButton = ({ name, iconName, onPress }: { name: string; iconName: IconName; onPress?: () => void; }) => (
    <Pressable
      style={styles.navButton}
      // Use the custom onPress if provided, otherwise default to setting the active tab
      onPress={onPress ? onPress : () => setActiveTab(name)}>
      <Ionicons
        name={iconName}
        size={26}
        color={activeTab === name ? '#025C42' : '#888'}
      />
      <Text style={[styles.navText, activeTab === name && styles.activeNavText]}>
        {name}
      </Text>
    </Pressable>
  );

  // Renders the main content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'Dispatch':
        return <DispatchNowScreen searchQuery={searchQuery} />;
      case 'Dispatch List':
        return <DispatchListScreen />;
      case 'Inward':
        return <Inward searchQuery={searchQuery} />;
      case 'Stock':
        return <Stock />;
      // The 'Logout' case is removed from here as it's not a screen anymore
      default:
        return <DispatchNowScreen searchQuery={searchQuery} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- MODIFIED: Header is removed, title moved next to search bar --- */}
      <View style={styles.searchFilterContainer}>
        <Text style={styles.pageTitle}>{activeTab}</Text> {/* Title moved here */}
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            placeholder="Search here..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <Pressable style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#025C42" />
        </Pressable>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <NavButton name="Dispatch" iconName="rocket-outline" />
        <NavButton name="Dispatch List" iconName="list-outline" />
        <NavButton name="Inward" iconName="arrow-down-circle-outline" />
        <NavButton name="Stock" iconName="cube-outline" />
        <NavButton
          name="Logout"
          iconName="log-out-outline"
          onPress={() => setLogoutModalVisible(true)}
        />
      </View>

      <LogoutModal
        visible={isLogoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={handleConfirmLogout}
      />
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  // NOTE: The 'header' style is no longer needed and can be removed.
  searchFilterContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center', // Align title and search bar vertically
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  // --- NEW: Style for the page title next to the search bar ---
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10, // Add some space between title and search bar
    textTransform: 'capitalize',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  content: { flex: 1 },
  bottomNav: {
    flexDirection: 'row',
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingTop: 5,
  },
  navButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
  navText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  activeNavText: {
    color: '#025C42',
    fontWeight: '600',
  },
});