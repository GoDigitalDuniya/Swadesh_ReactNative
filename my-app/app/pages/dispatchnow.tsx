import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  Pressable,
} from 'react-native';

// Interface for a single dispatch order record
interface DispatchOrder {
  _id: string;
  OrderNo: string;
  OrderDate: string;
  DeliveryDate: string; // This is the Due Date
  OrderStatus: string;
  Remarks: string;
  Transport: string;
  UnitName: string;
  UserName: string;
  CustomerName: string;
}

// Interface for the component's props
interface DispatchScreenProps {
  searchQuery: string;
}

export default function Dispatch({ searchQuery }: DispatchScreenProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data fetching logic for dispatch orders
  const fetchOrders = useCallback(async (query: string) => {
    if (!refreshing) {
      setLoading(true);
    }
    try {
      const authToken = await SecureStore.getItemAsync('authToken');
      if (!authToken) {
        router.replace('/pages/login');
        return;
      }

      const response = await fetch('https://followupio.com/swadeshordermanagment/get/dispatch_now_orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ empsearch: query }),
      });

      const json = await response.json();

      if (json.status !== 1 || !Array.isArray(json.data)) {
        setOrders([]);
      } else {
        setOrders(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch dispatch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router, refreshing]);

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch data when the debounced query changes
  useEffect(() => {
    fetchOrders(debouncedSearchQuery);
  }, [debouncedSearchQuery, fetchOrders]);

  // Handler for pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(debouncedSearchQuery);
  }, [fetchOrders, debouncedSearchQuery]);

  // Date formatting utility
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  // Dynamically get style based on OrderStatus
  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved for dispatch':
        return { indicator: '#42A5F5', badge: '#E3F2FD', text: '#1E88E5' }; // Blue
      case 'dispatched':
        return { indicator: '#66BB6A', badge: '#E8F5E9', text: '#388E3C' }; // Green
      case 'pending':
        return { indicator: '#FFA726', badge: '#FFF3E0', text: '#F57C00' }; // Orange
      case 'delivered':
        return { indicator: '#78909C', badge: '#ECEFF1', text: '#546E7A' }; // Blue Grey
      case 'cancelled':
        return { indicator: '#EF5350', badge: '#FFEBEE', text: '#D32F2F' }; // Red
      default:
        return { indicator: '#BDBDBD', badge: '#F5F5F5', text: '#616161' }; // Grey
    }
  };

  // Render function for each dispatch card
  const renderOrderItem = ({ item }: { item: DispatchOrder }) => {
    const statusStyle = getStatusStyle(item.OrderStatus);
    const remarks = item.Remarks;

    return (
      <Pressable
        onPress={() => {
          console.log(`Passing Dispatch Order ID: ${item._id}`);
          router.push({
            pathname: "/pages/dispatchlist", // Navigate to the details page
            params: { ...item }, // Pass all item data as params
          });
        }}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View style={styles.card}>
          <View style={[styles.cardIndicator, { backgroundColor: statusStyle.indicator }]} />
          <View style={styles.cardContent}>

            {/* Header: Customer Name & Status */}
            <View style={styles.cardHeader}>
              <Text style={styles.customerName} numberOfLines={1}>{item.CustomerName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.badge }]}>
                <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{item.OrderStatus}</Text>
              </View>
            </View>

            {/* Sub-Header: Order No & Unit */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="receipt-outline" size={14} color="#666" />
                <Text style={styles.infoText}>{item.OrderNo}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="business-outline" size={14} color="#666" />
                <Text style={styles.infoText} numberOfLines={1}>{item.UnitName}</Text>
              </View>
            </View>

            {/* Dates Row */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.infoText}>Ord: {formatDate(item.OrderDate)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="flag-outline" size={14} color="#666" />
                <Text style={styles.infoText}>Due: {formatDate(item.DeliveryDate)}</Text>
              </View>
            </View>

            {/* Remarks */}
            {remarks ? (
              <Text style={styles.remarksText} numberOfLines={2}>{remarks}</Text>
            ) : null}

            {/* Footer: Transport & User */}
            <View style={styles.cardFooter}>
              <Text style={styles.footerText} numberOfLines={1}>
                <Ionicons name="car-sport-outline" size={12} color="#888" /> {item.Transport || 'N/A'}
              </Text>
              <Text style={styles.footerText} numberOfLines={1}>
                <Ionicons name="person-circle-outline" size={12} color="#888" /> {item.UserName || 'N/A'}
              </Text>
            </View>

          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#025C42" style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No dispatch orders found.</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#025C42']} />
        }
      />
     
    </View>
  );
}

// Styles for the Dispatch component
const styles = StyleSheet.create({
  // --- Container & List ---
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  listContainer: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 80 },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 50 },

  // --- Card ---
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2.5,
    elevation: 3,
  },
  cardIndicator: { width: 5, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
  cardContent: { flex: 1, padding: 12 },

  // --- Card Header ---
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // --- Card Info Rows ---
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    marginLeft: 5,
  },
  
  // --- Remarks ---
  remarksText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
    paddingVertical: 4,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    paddingHorizontal: 6,
  },

  // --- Card Footer ---
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#777',
    flex: 0.5, // Distribute space
    textAlign: 'left',
  },

  // --- FAB ---
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#025C42',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 1, height: 2 },
  },
});