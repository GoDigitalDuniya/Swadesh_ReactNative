import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  Pressable,
} from "react-native";

// Interface for a single inward record
interface Inward {
  _id: string;
  WareHouseName: string;
  UserName: string;
  InwardDate: string;
  InwardStatus: string;
  Description: string;
  LastUpdateDate: string;
}

// Interface for the component's props
interface InwardScreenProps {
  searchQuery: string;
}

export default function Inward({ searchQuery }: InwardScreenProps) {
  const router = useRouter();
  const [inwards, setInwards] = useState<Inward[]>([]);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data fetching logic
  const fetchInwards = useCallback(
    async (query: string) => {
      if (!refreshing) {
        setLoading(true);
      }
      try {
        const authToken = await SecureStore.getItemAsync("authToken");
        if (!authToken) {
          router.replace("/pages/login");
          return;
        }

        const response = await fetch(
          "https://nodeapi.godigitalchat.com/swadeshordermanagement/get/inwards",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ empsearch: query }),
          }
        );

        const json = await response.json();

        if (json.status !== 1) {
          setInwards([]);
          return;
        }

        if (Array.isArray(json.data)) {
          setInwards(json.data);
        } else {
          setInwards([]);
        }
      } catch (error) {
        console.error("Failed to fetch inwards:", error);
        setInwards([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router, refreshing]
  );

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch data when debounced query changes
  useEffect(() => {
    fetchInwards(debouncedSearchQuery);
  }, [debouncedSearchQuery, fetchInwards]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInwards(debouncedSearchQuery);
  }, [fetchInwards, debouncedSearchQuery]);

  // Date formatting utility
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Dynamically get style based on InwardStatus
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "received":
        return { indicator: "#2E7D32", badge: "#E8F5E9", text: "#2E7D32" };
      case "pending":
        return { indicator: "#FBC02D", badge: "#FFFDE7", text: "#FBC02D" };
      default:
        return { indicator: "#BDBDBD", badge: "#F5F5F5", text: "#616161" };
    }
  };

  // Render function for each inward card
  // Render function for each inward card
  const renderInwardItem = ({ item }: { item: Inward }) => {
    const statusStyle = getStatusStyle(item.InwardStatus);
    return (
      <Pressable
        onPress={() => {
          console.log(`Passing Inward ID: ${item._id}`);

          // Correctly pass the ID and other data as parameters
          router.push({
            pathname: "/pages/inward/listinward", // Your details page
            params: {
              id: item._id, // Pass the unique ID
              warehouseName: item.WareHouseName,
              status: item.InwardStatus,
              userName: item.UserName,
              inwardDate: item.InwardDate,
              description: item.Description,
            },
          });
        }}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View style={styles.card}>
          <View
            style={[
              styles.cardIndicator,
              { backgroundColor: statusStyle.indicator },
            ]}
          />
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.warehouseName}>{item.WareHouseName}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusStyle.badge },
                ]}
              >
                <Text
                  style={[styles.statusBadgeText, { color: statusStyle.text }]}
                >
                  {item.InwardStatus}
                </Text>
              </View>
            </View>

            <View style={styles.secondrow}>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={18} color="#555" />
                <Text style={styles.detailValueBold}>{item.UserName}</Text>
              </View>
              <Text style={styles.detailValue}>
                {formatDate(item.InwardDate)}
              </Text>
            </View>

            {item.Description ? (
              <Text style={styles.description}>{item.Description}</Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#025C42"
        style={{ marginTop: 20 }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={inwards}
        renderItem={renderInwardItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No inward records found.</Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#025C42"]}
          />
        }
      />
      {/* Add Inward Button */}
      <Pressable
        style={styles.fab}
        onPress={() => {
          console.log("Add Inward button pressed, navigating...");
          router.push("/pages/inward/addinward");
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </View>
  );
}

// Styles specific to the Inward
const styles = StyleSheet.create({
  listContainer: { padding: 10 },
  emptyText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 50,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIndicator: {
    width: 6,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  cardContent: { flex: 1, padding: 15 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  warehouseName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  secondrow: { flexDirection: "row", justifyContent: "space-between" },
  detailRow: { flexDirection: "row", alignItems: "center" },
  detailValue: { fontSize: 14, color: "#333", marginLeft: 10 },
  detailValueBold: {
    fontSize: 16,
    color: "#111",
    fontWeight: "600",
    marginLeft: 10,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginTop: 12,
    fontStyle: "italic",
    padding: 8,
    borderRadius: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
    marginTop: 15,
    alignItems: "flex-end",
  },
  footerText: { fontSize: 12, color: "#999" },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  fab: {
    position: "absolute",
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    right: 20,
    bottom: 20,
    backgroundColor: "#025C42",
    borderRadius: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 1, height: 2 },
  },
});
