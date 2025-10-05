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
  Modal,
  TextInput,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";

// Interface for a single dispatch order record
interface DispatchOrder {
  _id: string;
  OrderNo: string;
  OrderDate: string;
  DeliveryDate: string;
  OrderStatus: string;
  Remarks: string;
  Transport: string;
  UnitName: string;
  UserName: string;
  CustomerName: string;
  LrNo?: string;
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

  // Status change modal states
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DispatchOrder | null>(
    null
  );
  const [statusToChange, setStatusToChange] = useState("");
  const [lrNumber, setLrNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Attachment modal states
  const [isAttachmentModalVisible, setIsAttachmentModalVisible] =
    useState(false);
  const [selectedAttachmentOrder, setSelectedAttachmentOrder] =
    useState<DispatchOrder | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Data fetching logic for dispatch orders
  const fetchOrders = useCallback(
    async (query: string) => {
      if (!refreshing) {
        setLoading(true);
      }
      try {
        const authToken = await SecureStore.getItemAsync("authToken");
        console.log("🔑 Auth Token:", authToken ? "Found" : "Missing");

        if (!authToken) {
          console.log("❌ No auth token, redirecting to login");
          router.replace("/pages/login");
          return;
        }

        const apiUrl = "https://nodeapi.godigitalchat.com/swadeshordermanagement/get/dispatch_now_orders";
        console.log("📡 Fetching orders from:", apiUrl);
        console.log("🔍 Search query:", query);

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ empsearch: query }),
        });

        console.log("📊 Response status:", response.status);
        console.log("📊 Response headers:", JSON.stringify(response.headers));

        const json = await response.json();
        console.log("✅ Parsed JSON response:", JSON.stringify(json, null, 2));

        if (json.status !== 1 || !Array.isArray(json.data)) {
          console.log("⚠️ No valid data in response");
          setOrders([]);
        } else {
          console.log(`✅ Loaded ${json.data.length} orders`);
          setOrders(json.data);
        }
      } catch (error) {
        console.error("❌ Failed to fetch dispatch orders:", error);
        console.error("❌ Error details:", JSON.stringify(error, null, 2));
        setOrders([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router, refreshing]
  );

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
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  };

  // Dynamically get style based on OrderStatus
  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved for dispatch":
        return { indicator: "#42A5F5", badge: "#E3F2FD", text: "#1E88E5" };
      case "documents prepared":
        return { indicator: "#66BB6A", badge: "#E8F5E9", text: "#388E3C" };
      case "final dispatch":
        return { indicator: "#FFA726", badge: "#FFF3E0", text: "#F57C00" };
      case "batch no. allotted":
        return { indicator: "#78909C", badge: "#ECEFF1", text: "#546E7A" };
      case "cancelled":
        return { indicator: "#EF5350", badge: "#FFEBEE", text: "#D32F2F" };
      default:
        return { indicator: "#BDBDBD", badge: "#F5F5F5", text: "#616161" };
    }
  };

  // Open status change modal
  const handleOpenStatusModal = (item: DispatchOrder, e: any) => {
    e.stopPropagation();
    console.log("🔄 Opening status modal for order:", item._id);
    console.log("📦 Order details:", JSON.stringify(item, null, 2));
    setSelectedOrder(item);
    setStatusToChange(item.OrderStatus || "");
    setLrNumber(item.LrNo || "");
    setIsStatusModalVisible(true);
  };

  // Close status change modal
  const handleCloseStatusModal = () => {
    console.log("❌ Closing status modal");
    setIsStatusModalVisible(false);
    setSelectedOrder(null);
    setStatusToChange("");
    setLrNumber("");
  };

  // Save status change
  const handleSaveStatusChange = async () => {
    console.log("💾 Starting save status change...");

    if (!selectedOrder) {
      console.log("❌ No order selected");
      Alert.alert("Error", "No order selected");
      return;
    }

    if (!statusToChange) {
      console.log("❌ No status selected");
      Alert.alert("Error", "Please select a status");
      return;
    }

    console.log("📝 Order ID:", selectedOrder._id);
    console.log("📝 New Status:", statusToChange);
    console.log("📝 LR Number:", lrNumber);

    setIsSaving(true);
    try {
      const authToken = await SecureStore.getItemAsync("authToken");
      console.log("🔑 Auth Token for update:", authToken ? "Found" : "Missing");

      if (!authToken) {
        console.log("❌ No auth token, redirecting to login");
        router.replace("/pages/login");
        return;
      }

      const requestBody = {
        OrderId: selectedOrder._id,
        OrderStatus: statusToChange,
        LrNo: lrNumber,
      };

      console.log("📤 Request body:", JSON.stringify(requestBody, null, 2));

      const apiUrl = "https://nodeapi.godigitalchat.com/swadeshordermanagement/edit/orders";
      console.log("📡 Sending update to:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📊 Update response status:", response.status);
      console.log("📊 Update response ok:", response.ok);

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      console.log("📊 Response content-type:", contentType);

      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("❌ Non-JSON response received:", textResponse);
        Alert.alert(
          "Error",
          "Server returned an invalid response. Please check your API endpoint."
        );
        return;
      }

      const json = await response.json();
      console.log("✅ Update response:", JSON.stringify(json, null, 2));

      if (json.status === 1) {
        console.log("✅ Order updated successfully");
        Alert.alert("Success", json.message || "Order updated successfully");
        handleCloseStatusModal();
        fetchOrders(debouncedSearchQuery);
      } else {
        console.log("⚠️ Update failed:", json.message);
        Alert.alert("Error", json.message || "Failed to update order");
      }
    } catch (error) {
      console.error("❌ Error updating order:", error);
      console.error(
        "❌ Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      console.error("❌ Error type:", typeof error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      Alert.alert(
        "Error",
        "Failed to update order. Check console for details."
      );
    } finally {
      setIsSaving(false);
      console.log("🏁 Save operation complete");
    }
  };

  // Open attachment modal
  const handleOpenAttachmentModal = (item: DispatchOrder, e: any) => {
    e.stopPropagation();
    console.log("📎 Opening attachment modal for order:", item._id);
    setSelectedAttachmentOrder(item);
    setSelectedImages([]);
    setIsAttachmentModalVisible(true);
  };

  // Close attachment modal
  const handleCloseAttachmentModal = () => {
    console.log("❌ Closing attachment modal");
    setIsAttachmentModalVisible(false);
    setSelectedAttachmentOrder(null);
    setSelectedImages([]);
  };

  // Pick images from gallery
  const pickImages = async () => {
    console.log("🖼️ Opening image picker...");

    // Request permissions
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to grant camera roll permissions to upload images."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5, // Max 5 images
    });

    console.log("📸 Image picker result:", result);

    if (!result.canceled && result.assets) {
      const imageUris = result.assets.map((asset) => asset.uri);
      console.log("✅ Selected images:", imageUris);
      setSelectedImages((prev) => [...prev, ...imageUris].slice(0, 5)); // Max 5 total
    }
  };

  // Take photo from camera
const takePhoto = async () => {
  console.log("📷 Opening camera...");

  // Request camera permissions
  const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

  if (permissionResult.granted === false) {
    Alert.alert(
      "Permission Required",
      "You need to grant camera permissions to take photos."
    );
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: true,
  });

  console.log("📸 Camera result:", result);

  if (!result.canceled && result.assets) {
    const imageUri = result.assets[0].uri;
    console.log("✅ Photo taken:", imageUri);
    setSelectedImages((prev) => [...prev, imageUri].slice(0, 5)); // Max 5 total
  }
};


  // Remove selected image
  const removeImage = (index: number) => {
    console.log("🗑️ Removing image at index:", index);
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload attachments
  const handleUploadAttachments = async () => {
    console.log("📤 Starting attachment upload...");

    if (!selectedAttachmentOrder) {
      console.log("❌ No order selected");
      Alert.alert("Error", "No order selected");
      return;
    }

    if (selectedImages.length === 0) {
      console.log("❌ No images selected");
      Alert.alert("Error", "Please select at least one image");
      return;
    }

    console.log("📝 Order ID:", selectedAttachmentOrder._id);
    console.log("📝 Total images:", selectedImages.length);

    setIsUploading(true);
    try {
      const authToken = await SecureStore.getItemAsync("authToken");
      console.log("🔑 Auth Token for upload:", authToken ? "Found" : "Missing");

      if (!authToken) {
        console.log("❌ No auth token, redirecting to login");
        router.replace("/pages/login");
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("OrderId", selectedAttachmentOrder._id);

      // Add each image to FormData
      for (let i = 0; i < selectedImages.length; i++) {
        const imageUri = selectedImages[i];
        const filename = imageUri.split("/").pop() || `image_${i}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("attachments", {
          uri: imageUri,
          name: filename,
          type: type,
        } as any);
      }

      console.log("📤 Uploading attachments...");

      const apiUrl = "your_api_url/upload/dispatch_attachments";
      console.log("📡 Sending upload to:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          // Don't set Content-Type - fetch will set it automatically for FormData
        },
        body: formData,
      });

      console.log("📊 Upload response status:", response.status);
      console.log("📊 Upload response ok:", response.ok);

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      console.log("📊 Response content-type:", contentType);

      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("❌ Non-JSON response received:", textResponse);
        Alert.alert(
          "Error",
          "Server returned an invalid response. Please check your API endpoint."
        );
        return;
      }

      const json = await response.json();
      console.log("✅ Upload response:", JSON.stringify(json, null, 2));

      if (json.status === 1) {
        console.log("✅ Attachments uploaded successfully");
        Alert.alert(
          "Success",
          json.message || "Attachments uploaded successfully"
        );
        handleCloseAttachmentModal();
        fetchOrders(debouncedSearchQuery);
      } else {
        console.log("⚠️ Upload failed:", json.message);
        Alert.alert("Error", json.message || "Failed to upload attachments");
      }
    } catch (error) {
      console.error("❌ Error uploading attachments:", error);
      console.error(
        "❌ Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      console.error("❌ Error type:", typeof error);
      Alert.alert(
        "Error",
        "Failed to upload attachments. Check console for details."
      );
    } finally {
      setIsUploading(false);
      console.log("🏁 Upload operation complete");
    }
  };

  // Render function for each dispatch card
  const renderOrderItem = ({ item }: { item: DispatchOrder }) => {
    const statusStyle = getStatusStyle(item.OrderStatus);
    const remarks = item.Remarks;

    return (
      <View style={styles.cardWrapper}>
        <Pressable
          onPress={() => {
            console.log(`👆 Card pressed - Order ID: ${item._id}`);
            router.push({
              pathname: "/pages/dispatchlist",
              params: { ...item },
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
              {/* Header: Customer Name & Status */}
              <View style={styles.cardHeader}>
                <Text style={styles.customerName} numberOfLines={1}>
                  {item.CustomerName}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusStyle.badge },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: statusStyle.text },
                    ]}
                  >
                    {item.OrderStatus}
                  </Text>
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
                  <Text style={styles.infoText} numberOfLines={1}>
                    {item.UnitName}
                  </Text>
                </View>
              </View>

              {/* Dates Row */}
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={styles.infoText}>
                    Ord: {formatDate(item.OrderDate)}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="flag-outline" size={14} color="#666" />
                  <Text style={styles.infoText}>
                    Due: {formatDate(item.DeliveryDate)}
                  </Text>
                </View>
              </View>

              {/* LR Number if available */}
              {item.LrNo ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="document-text-outline"
                      size={14}
                      color="#666"
                    />
                    <Text style={styles.infoText}>LR: {item.LrNo}</Text>
                  </View>
                </View>
              ) : null}

              {/* Remarks */}
              {remarks ? (
                <Text style={styles.remarksText} numberOfLines={2}>
                  {remarks}
                </Text>
              ) : null}

              {/* Footer: Transport & User */}
              <View style={styles.cardFooter}>
                <Text style={styles.footerText} numberOfLines={1}>
                  <Ionicons name="car-sport-outline" size={12} color="#888" />{" "}
                  {item.Transport || "N/A"}
                </Text>
                <Text style={styles.footerText} numberOfLines={1}>
                  <Ionicons
                    name="person-circle-outline"
                    size={12}
                    color="#888"
                  />{" "}
                  {item.UserName || "N/A"}
                </Text>
              </View>
        {/* Action Buttons Row */}
        <View style={styles.actionButtonsRow}>
          {/* Status Change Button */}
          <Pressable
            onPress={(e) => handleOpenStatusModal(item, e)}
            style={({ pressed }) => [
              styles.statusButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="swap-horizontal" size={18} color="#fff" />
            <Text style={styles.statusButtonText}>Change Status</Text>
          </Pressable>

          {/* Add Attachment Button */}
          <Pressable
            onPress={(e) => handleOpenAttachmentModal(item, e)}
            style={({ pressed }) => [
              styles.attachmentButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="attach" size={18} color="#000" />
            <Text style={styles.attachmentButtonText}>Add Attachment</Text>
          </Pressable>
        </View>
            </View>
          </View>
        </Pressable>

      </View>
    );
  };

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#025C42" style={{ flex: 1 }} />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No dispatch orders found.</Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#025C42"]}
          />
        }
      />

      {/* Status Change Modal */}
      <Modal
        visible={isStatusModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseStatusModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Order Status</Text>

            {/* Current Order Info */}
            {selectedOrder && (
              <View style={styles.orderInfoBox}>
                <Text style={styles.orderInfoText}>
                  Customer: {selectedOrder.CustomerName}
                </Text>
                <Text style={styles.orderInfoText}>
                  Order No: {selectedOrder.OrderNo}
                </Text>
                <Text style={styles.orderInfoText}>
                  Current Status: {selectedOrder.OrderStatus}
                </Text>
              </View>
            )}

            {/* Status Picker */}
            <Text style={styles.inputLabel}>Select New Status</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={statusToChange}
                onValueChange={(itemValue) => {
                  console.log("📝 Status changed to:", itemValue);
                  setStatusToChange(itemValue);
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select Status" value="" />
          
                <Picker.Item
                  label="Approved for Dispatch"
                  value="Approved for Dispatch"
                />
                <Picker.Item
                  label="Batch No. Allotted"
                  value="Batch No. Allotted"
                />
                <Picker.Item label="Hold Order" value="Hold Order" />
                <Picker.Item
                  label="Documents Prepared"
                  value="Documents Prepared"
                />
                <Picker.Item label="Final Dispatch" value="Final Dispatch" />
                <Picker.Item
                  label="Completed Order"
                  value="Completed Order"
                />
                <Picker.Item
                  label="Order Cancelled"
                  value="Order Cancelled"
                />
              </Picker>
            </View>

            {/* LR Number Input */}
            <Text style={styles.inputLabel}>LR Number (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={lrNumber}
              onChangeText={(text) => {
                console.log("📝 LR Number changed to:", text);
                setLrNumber(text);
              }}
              placeholder="Enter LR Number"
              placeholderTextColor="#999"
            />

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Pressable
                onPress={handleCloseStatusModal}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.cancelButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveStatusChange}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.saveButton,
                  { opacity: pressed || isSaving ? 0.7 : 1 },
                ]}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Attachment Upload Modal */}
      <Modal
        visible={isAttachmentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseAttachmentModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Attachments</Text>

            {/* Current Order Info */}
            {selectedAttachmentOrder && (
              <View style={styles.orderInfoBox}>
                <Text style={styles.orderInfoText}>
                  Customer: {selectedAttachmentOrder.CustomerName}
                </Text>
                <Text style={styles.orderInfoText}>
                  Order No: {selectedAttachmentOrder.OrderNo}
                </Text>
              </View>
            )}

            {/* Pick Images Button */}
         {/* Image Selection Buttons */}
<View style={styles.imageSelectionRow}>
  {/* Camera Button */}
  <Pressable
    onPress={takePhoto}
    style={({ pressed }) => [
      styles.cameraButton,
      { opacity: pressed ? 0.7 : 1 },
    ]}
    disabled={selectedImages.length >= 5}
  >
    <Ionicons name="camera" size={24} color="#025C42" />
    <Text style={styles.cameraButtonText}>Take Photo</Text>
  </Pressable>

  {/* Gallery Button */}
  <Pressable
    onPress={pickImages}
    style={({ pressed }) => [
      styles.galleryButton,
      { opacity: pressed ? 0.7 : 1 },
    ]}
    disabled={selectedImages.length >= 5}
  >
    <Ionicons name="images" size={24} color="#025C42" />
    <Text style={styles.galleryButtonText}>From Gallery</Text>
  </Pressable>
</View>

{selectedImages.length >= 5 && (
  <Text style={styles.maxImagesText}>Maximum 5 images selected</Text>
)}


            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
              <View style={styles.imagePreviewContainer}>
                <Text style={styles.imagePreviewTitle}>
                  Selected Images ({selectedImages.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageScrollView}
                >
                  {selectedImages.map((uri, index) => (
                    <View key={index} style={styles.imagePreviewWrapper}>
                      <Image source={{ uri }} style={styles.imagePreview} />
                      <Pressable
                        onPress={() => removeImage(index)}
                        style={styles.removeImageButton}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#EF5350"
                        />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Pressable
                onPress={handleCloseAttachmentModal}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.cancelButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                disabled={isUploading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleUploadAttachments}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.saveButton,
                  {
                    opacity:
                      pressed || isUploading || selectedImages.length === 0
                        ? 0.7
                        : 1,
                  },
                ]}
                disabled={isUploading || selectedImages.length === 0}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Upload ({selectedImages.length})
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Styles for the Dispatch component
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  listContainer: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 80 },
  emptyText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 50,
  },

  cardWrapper: {
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2.5,
    elevation: 3,
  },
  cardIndicator: {
    width: 5,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  cardContent: { flex: 1, padding: 12 },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  customerName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#222",
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
    fontWeight: "700",
    textTransform: "uppercase",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  infoText: {
    fontSize: 13,
    color: "#555",
    marginLeft: 5,
  },

  remarksText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
    paddingVertical: 4,
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
    paddingHorizontal: 6,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 8,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#777",
    flex: 0.5,
    textAlign: "left",
  },

  // Action Buttons Row (Two buttons side by side)
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },

  statusButton: {
    flex: 1,
    backgroundColor: "#025C42",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  statusButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  attachmentButton: {
    flex: 1,
    backgroundColor: "#FF9800",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  attachmentButtonText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
    marginBottom: 20,
  },

  orderInfoBox: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  orderInfoText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },

  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
    marginTop: 12,
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  picker: {
    height: 50,
  },

  textInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#222",
    marginBottom: 20,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#025C42",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Image Picker Button
  pickImageButton: {
    backgroundColor: "#E8F5E9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 10,
    borderWidth: 2,
    borderColor: "#025C42",
    borderStyle: "dashed",
  },
  pickImageButtonText: {
    color: "#025C42",
    fontSize: 15,
    fontWeight: "600",
  },

  // Image Selection Row
imageSelectionRow: {
  flexDirection: "row",
  gap: 8,
  marginBottom: 12,
},

cameraButton: {
  flex: 1,
  backgroundColor: "#E3F2FD",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 14,
  paddingHorizontal: 12,
  borderRadius: 8,
  gap: 8,
  borderWidth: 2,
  borderColor: "#42A5F5",
  borderStyle: "dashed",
},
cameraButtonText: {
  color: "#1E88E5",
  fontSize: 14,
  fontWeight: "600",
},

galleryButton: {
  flex: 1,
  backgroundColor: "#E8F5E9",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 14,
  paddingHorizontal: 12,
  borderRadius: 8,
  gap: 8,
  borderWidth: 2,
  borderColor: "#66BB6A",
  borderStyle: "dashed",
},
galleryButtonText: {
  color: "#2E7D32",
  fontSize: 14,
  fontWeight: "600",
},

maxImagesText: {
  fontSize: 13,
  color: "#EF5350",
  textAlign: "center",
  fontWeight: "600",
  marginBottom: 12,
},


  // Image Preview Container
  imagePreviewContainer: {
    marginBottom: 16,
  },
  imagePreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
  },
  imageScrollView: {
    maxHeight: 120,
  },
  imagePreviewWrapper: {
    position: "relative",
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
});
