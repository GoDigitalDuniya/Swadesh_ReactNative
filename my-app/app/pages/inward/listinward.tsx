import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
} from "react-native";

// Interface for a single product in the inward details
interface InwardProduct {
  _id: string;
  ProductName: string;
  Remarks: string;
  InQty: number;
  BatchNo: string;
  MfdDate: string;
  UOM: string;
  GRNNo: string;
  ProductSku: string;
}

export default function InwardDetailsPage() {
  // Get the ID and other parameters passed from the previous screen
  const params = useLocalSearchParams<{
    id: string;
    warehouseName: string;
    status: string;
    userName: string;
    inwardDate: string;
    description: string;
  }>();

  const {
    id: inwardMasterId,
    warehouseName,
    status,
    userName,
    inwardDate,
    description,
  } = params;

  const [products, setProducts] = useState<InwardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date formatting utility
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Data fetching logic
  const fetchInwardDetails = useCallback(async () => {
    if (!inwardMasterId) return;
    setLoading(true);
    setError(null);
    try {
      const authToken = await SecureStore.getItemAsync("authToken");
      if (!authToken) {
        setError("Authentication token not found.");
        return;
      }

      const response = await fetch(
        "https://nodeapi.godigitalchat.com/swadeshordermanagement/get/inwards_details",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ InwardMasterId: inwardMasterId }),
        }
      );

      const json = await response.json();

      if (json.status === 1 && Array.isArray(json.data)) {
        setProducts(json.data);
      } else {
        setError(json.message || "Failed to fetch product details.");
        setProducts([]);
      }
    } catch (err) {
      console.error("Failed to fetch inward details:", err);
      setError("An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  }, [inwardMasterId]);

  useEffect(() => {
    fetchInwardDetails();
  }, [fetchInwardDetails]);

  // Render function for each product card
  const renderProductItem = ({ item }: { item: InwardProduct }) => (
    <View style={styles.productCard}>
      <View style={styles.productCardIndicator} />
      <View style={styles.productCardContent}>
        <View style={styles.productHeader}>
          <View>
            <Text style={styles.skuText}>{item.ProductSku}</Text>
            <Text style={styles.productName}>{item.ProductName}</Text>
          </View>

          <View style={styles.quantityBadge}>
            <Text
              style={styles.quantityBadgeText}
            >{`${item.InQty} ${item.UOM}`}</Text>
          </View>
        </View>

        <View style={styles.rowbetween}>
          <View style={styles.productDetailRow}>
            <Ionicons name="barcode-outline" size={16} color="#555" />
            <Text style={styles.productDetailTextLabel}>Batch:</Text>
            <Text style={styles.productDetailText}>{item.BatchNo}</Text>
          </View>

          <View style={styles.productDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="#555" />
            <Text style={styles.productDetailTextLabel}>MFD:</Text>
            <Text style={styles.productDetailText}>
              {formatDate(item.MfdDate)}
            </Text>
          </View>
        </View>

        <View style={styles.rowbetween}>
          <View style={styles.productDetailRow}>
            <Ionicons name="barcode-outline" size={16} color="#555" />
            <Text style={styles.productDetailTextLabel}>GRN:</Text>
            <Text style={styles.productDetailText}>{item.GRNNo}</Text>
          </View>

          {item.Remarks ? (
            <View style={styles.productDetailRow}>
              <Ionicons
                name="chatbox-ellipses-outline"
                size={16}
                color="#555"
              />
              <Text style={styles.productDetailTextLabel}>Remark:</Text>
              <Text style={styles.productDetailText}>{item.Remarks}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#025C42" style={styles.centered} />
    );
  }

  if (error) {
    return <Text style={[styles.centered, styles.errorText]}>{error}</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <>
            {/* Section 1: Master Details */}
            <View style={styles.masterCard}>
              <View style={styles.detailRow}>
                <Ionicons name="business-outline" size={20} color="#555" />
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Warehouse:</Text>{" "}
                  {warehouseName}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={20} color="#555" />
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>User:</Text> {userName}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#555" />
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Date:</Text>{" "}
                  {formatDate(inwardDate)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#555"
                />
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Status:</Text> {status}
                </Text>
              </View>

              {description && (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="chatbox-ellipses-outline"
                    size={20}
                    color="#555"
                  />
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Remarks:</Text>{" "}
                    {description}
                  </Text>
                </View>
              )}
            </View>

            {/* Section 2: Product List Header */}
            <Text style={styles.headerTitle}>Products ({products.length})</Text>
          </>
        }
      />
    </SafeAreaView>
  );
}

// =================================================================
// =====> UI MODIFICATION: Updated Styles <=========================
// =================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8", marginTop: 30 },
  listContainer: { padding: 15 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red", fontSize: 16, padding: 20, textAlign: "center" },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },

  // Master Card Styles
  masterCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  detailText: { fontSize: 16, color: "#444", marginLeft: 15, flex: 1 },
  detailLabel: { fontWeight: "600" },

  // Product Card Styles (NEW)
  productCard: {
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
  productCardIndicator: {
    width: 6,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    backgroundColor: "#025C42",
  },
  productCardContent: { flex: 1, padding: 15 },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  quantityBadge: {
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  skuText: { fontSize: 16, fontWeight: "700", color: "#BA871F" },
  quantityBadgeText: { fontSize: 12, fontWeight: "700", color: "#00796B" },
  rowbetween: { flexDirection: "row", justifyContent: "space-between" },
  productDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  productDetailTextLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
    fontWeight: "600",
  },
  productDetailText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 5,
    flexShrink: 1,
  },
});
