// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   Modal,
//   ScrollView,
//   ActivityIndicator,
//   RefreshControl,
//   SafeAreaView,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useRoute, useNavigation } from '@react-navigation/native';
// import * as SecureStore from 'expo-secure-store';
// import axios from 'axios';

// // API Configuration - Updated with your endpoints
// const serverip = "https://followupio.com/swadeshordermanagment";
// const Api = {
//   getdispatchorder: `${serverip}/get/dispatch_now_orders`,
//   getdispatchorderdetails: `${serverip}/get/dispatch_now_orders_details`,
//   adddispatch: `${serverip}/add/dispatch`,
//   editorder: `${serverip}/edit/orders`,
//   addpayment: `${serverip}/add/payment`,
//   orderpayment: `${serverip}/get/order_payment`,
//   deletedispatchlist: `${serverip}/delete/delete_dispatch`,
// };

// export default function DispatchListScreen() {
//   const route = useRoute();
//   const navigation = useNavigation();
//   const selectedOrderFromParams = route.params || {};

//   // Main state variables
//   const [selectedCustomer, setSelectedCustomer] = useState(selectedOrderFromParams);
//   const [orderItems, setOrderItems] = useState([]);
//   const [allOrders, setAllOrders] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  
//   // Modal states
//   const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
  
//   // Form states
//   const [statusToChange, setStatusToChange] = useState('');
//   const [lrNumber, setLrNumber] = useState('');

//   // Get auth token
//   const getAuthToken = async () => {
//     return await SecureStore.getItemAsync('authToken');
//   };

//   // Format date function
//   const formatDateTime = (dateString) => {
//     if (!dateString) return 'N/A';
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return 'Invalid Date';
    
//     const day = String(date.getDate()).padStart(2, '0');
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const year = date.getFullYear();
    
//     let hours = date.getHours();
//     const minutes = String(date.getMinutes()).padStart(2, '0');
//     const ampm = hours >= 12 ? 'PM' : 'AM';
//     hours = hours % 12 || 12;
    
//     return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
//   };

//   // Get order status badge style
//   const getStatusBadgeStyle = (status) => {
//     switch (status?.toLowerCase()) {
//       case 'approved for dispatch':
//         return { backgroundColor: '#E3F2FD', textColor: '#1E88E5', indicator: '#1E88E5' };
//       case 'dispatched':
//         return { backgroundColor: '#E8F5E9', textColor: '#388E3C', indicator: '#388E3C' };
//       case 'documents prepared':
//         return { backgroundColor: '#FFF3E0', textColor: '#F57C00', indicator: '#F57C00' };
//       case 'final dispatch':
//         return { backgroundColor: '#E8F5E9', textColor: '#388E3C', indicator: '#388E3C' };
//       case 'completed order':
//         return { backgroundColor: '#ECEFF1', textColor: '#546E7A', indicator: '#546E7A' };
//       case 'cancelled':
//         return { backgroundColor: '#FFEBEE', textColor: '#D32F2F', indicator: '#D32F2F' };
//       default:
//         return { backgroundColor: '#F5F5F5', textColor: '#616161', indicator: '#BDBDBD' };
//     }
//   };

//   // Fetch all dispatch orders
//   const getDispatchOrders = useCallback(async () => {
//     setLoading(true);
//     try {
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         Alert.alert('Error', 'Authentication required');
//         return;
//       }

//       const response = await axios.post(
//         Api.getdispatchorder,
//         {},
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${authToken}`,
//           },
//         }
//       );

//       if (response.data.status === 1 && response.data.data) {
//         setAllOrders(response.data.data);
//         if (!selectedCustomer._id && response.data.data.length > 0) {
//           setSelectedCustomer(response.data.data[0]);
//         }
//       } else {
//         setAllOrders([]);
//       }
//     } catch (error) {
//       console.error('Error fetching dispatch orders:', error);
//       Alert.alert('Error', 'Failed to fetch dispatch orders');
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedCustomer._id]);

//   // Get order details - Fixed API endpoint
//   const getOrderDetails = useCallback(async (orderId) => {
//     if (!orderId) return;
//     setIsDetailsLoading(true);
//     setOrderItems([]);

//     try {
//       const authToken = await getAuthToken();
//       const response = await axios.post(
//         Api.getdispatchorderdetails, // Correct endpoint
//         { OrderMasterId: orderId },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${authToken}`,
//           },
//         }
//       );

//       if (response.data.status === 1 && response.data.data) {
//         setOrderItems(response.data.data);
//       } else {
//         setOrderItems([]);
//       }
//     } catch (error) {
//       console.error('Error fetching order details:', error);
//       setOrderItems([]);
//     } finally {
//       setIsDetailsLoading(false);
//     }
//   }, []);

//   // Add dispatch
//   const addDispatch = async () => {
//     setIsSubmitting(true);
//     let payload = [];

//     orderItems.forEach((product) => {
//       const productId = product.ProductId;
//       const orderDetailsId = product.OrderDetailsId;
//       const orderId = product.OrderId;
//       const DispatchRemark = product.dispatchRemarks || '';

//       let stockAdded = false;

//       if (product.StockReport && product.StockReport.length > 0) {
//         product.StockReport.forEach((item) => {
//           if (Number(item.outwardQty) > 0) {
//             stockAdded = true;
//             payload.push({
//               OrderDetailsId: orderDetailsId,
//               OrderId: orderId,
//               ProductId: productId,
//               DispatchRemarks: DispatchRemark,
//               OutwardQty: item.outwardQty || 0,
//               BatchNo: item.BatchNo,
//               MfdDate: item.MfdDate,
//               InwardDetailsId: item.InwardDetailsId,
//               Remarks: item.Remarks || '',
//               WareHouseId: item.WareHouseId,
//             });
//           }
//         });
//       }

//       if (!stockAdded) {
//         payload.push({
//           OrderDetailsId: orderDetailsId,
//           OrderId: orderId,
//           ProductId: productId,
//           DispatchRemarks: DispatchRemark,
//         });
//       }
//     });

//     try {
//       const authToken = await getAuthToken();
//       const reqbody = { Dispatchs: payload };

//       const response = await axios.post(Api.adddispatch, reqbody, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${authToken}`,
//         },
//       });

//       if (response.data.status === 1) {
//         Alert.alert('Success', 'Dispatch added successfully!');
//         navigation.goBack();
//       } else {
//         Alert.alert('Error', response.data.message || 'Failed to add dispatch');
//       }
//     } catch (error) {
//       console.error('Error adding dispatch:', error);
//       Alert.alert('Error', 'Failed to add dispatch');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Edit order status
//   const editOrder = async () => {
//     if (!selectedCustomer) return;
//     setIsSubmitting(true);

//     try {
//       const authToken = await getAuthToken();
//       const reqbody = {
//         OrderId: selectedCustomer._id,
//         OrderStatus: statusToChange,
//         LrNo: lrNumber,
//       };

//       const response = await axios.post(Api.editorder, reqbody, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${authToken}`,
//         },
//       });

//       if (response.data.status === 1) {
//         Alert.alert('Success', 'Order updated successfully!');
//         getDispatchOrders();
//         setIsStatusModalOpen(false);
//       } else {
//         Alert.alert('Error', response.data.message || 'Failed to update order');
//       }
//     } catch (error) {
//       console.error('Error updating order:', error);
//       Alert.alert('Error', 'Failed to update order');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Handle customer selection
//   const handleCustomerClick = (order) => {
//     setSelectedCustomer(order);
//   };

//   // Handle outward quantity change
//   const handleOutwardQtyChange = (itemIndex, stockIndex, value) => {
//     const newItems = [...orderItems];
//     const numValue = Math.max(0, Math.min(Number(value) || 0, newItems[itemIndex].StockReport[stockIndex].AvailableQty));
//     newItems[itemIndex].StockReport[stockIndex].outwardQty = numValue;
//     setOrderItems(newItems);
//   };

//   // Handle dispatch remarks change
//   const handleDispatchRemarksChange = (index, value) => {
//     const newItems = [...orderItems];
//     newItems[index].dispatchRemarks = value;
//     setOrderItems(newItems);
//   };

//   // Refresh function
//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     getDispatchOrders().finally(() => setRefreshing(false));
//   }, [getDispatchOrders]);

//   // Effects
//   useEffect(() => {
//     getDispatchOrders();
//   }, []);

//   useEffect(() => {
//     if (selectedCustomer?._id) {
//       console.log("Passing Dispatch Order ID:", selectedCustomer._id);
//       getOrderDetails(selectedCustomer._id);
//     }
//   }, [selectedCustomer, getOrderDetails]);

//   // Render customer card (mobile optimized)
//   const renderCustomerCard = ({ item }) => {
//     const statusStyle = getStatusBadgeStyle(item.OrderStatus);
//     const isSelected = selectedCustomer?._id === item._id;

//     return (
//       <TouchableOpacity
//         style={[styles.customerCard, isSelected && styles.selectedCustomerCard]}
//         onPress={() => handleCustomerClick(item)}
//         activeOpacity={0.7}
//       >
//         <View style={[styles.statusIndicator, { backgroundColor: statusStyle.indicator }]} />
        
//         <View style={styles.cardContent}>
//           <View style={styles.cardHeader}>
//             <Text style={styles.customerName} numberOfLines={1}>
//               {item.CustomerName}
//             </Text>
//             <View style={[styles.statusChip, { backgroundColor: statusStyle.backgroundColor }]}>
//               <Text style={[styles.statusChipText, { color: statusStyle.textColor }]}>
//                 {item.OrderStatus}
//               </Text>
//             </View>
//           </View>

//           <View style={styles.orderInfo}>
//             <View style={styles.infoRow}>
//               <Ionicons name="receipt-outline" size={14} color="#666" />
//               <Text style={styles.infoText}>{item.OrderNo}</Text>
//             </View>
//             <View style={styles.infoRow}>
//               <Ionicons name="business-outline" size={14} color="#666" />
//               <Text style={styles.infoText} numberOfLines={1}>{item.UnitName}</Text>
//             </View>
//           </View>

//           <View style={styles.dateInfo}>
//             <View style={styles.infoRow}>
//               <Ionicons name="calendar-outline" size={12} color="#888" />
//               <Text style={styles.dateText}>Ord: {formatDateTime(item.OrderDate)}</Text>
//             </View>
//             <View style={styles.infoRow}>
//               <Ionicons name="flag-outline" size={12} color="#888" />
//               <Text style={styles.dateText}>Due: {formatDateTime(item.DeliveryDate)}</Text>
//             </View>
//           </View>

//           {item.Remarks && (
//             <Text style={styles.remarksText} numberOfLines={2}>
//               💬 {item.Remarks}
//             </Text>
//           )}

//           <View style={styles.footerInfo}>
//             <Text style={styles.footerText} numberOfLines={1}>
//               🚛 {item.Transport || 'No transport'}
//             </Text>
//             <Text style={styles.footerText} numberOfLines={1}>
//               👤 {item.UserName}
//             </Text>
//           </View>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   // Render product card (mobile optimized)
//   const renderProductCard = ({ item, index }) => (
//     <View style={styles.productCard}>
//       <View style={styles.productHeader}>
//         <Text style={styles.productName} numberOfLines={2}>{item.ProductName}</Text>
//         <Text style={styles.productSku}>#{item.ProductSku}</Text>
//       </View>
      
//       <Text style={styles.productDescription} numberOfLines={3}>{item.Description}</Text>
      
//       <View style={styles.quantityGrid}>
//         <View style={styles.qtyBox}>
//           <Text style={styles.qtyLabel}>Order</Text>
//           <Text style={styles.qtyValue}>{item.OrderQty}</Text>
//           <Text style={styles.qtyUnit}>{item.ProductUOM}</Text>
//         </View>
//         <View style={styles.qtyBox}>
//           <Text style={styles.qtyLabel}>Out</Text>
//           <Text style={styles.qtyValue}>{item.OutwardQty}</Text>
//           <Text style={styles.qtyUnit}>{item.ProductUOM}</Text>
//         </View>
//         <View style={styles.qtyBox}>
//           <Text style={styles.qtyLabel}>Pending</Text>
//           <Text style={[styles.qtyValue, { color: '#F57C00' }]}>{item.PendingQty}</Text>
//           <Text style={styles.qtyUnit}>{item.ProductUOM}</Text>
//         </View>
//       </View>

//       <TextInput
//         style={styles.remarksInput}
//         placeholder="Enter dispatch remarks..."
//         value={item.dispatchRemarks || ''}
//         onChangeText={(value) => handleDispatchRemarksChange(index, value)}
//         multiline
//         numberOfLines={2}
//       />

//       {item.StockReport && item.StockReport.length > 0 ? (
//         <View style={styles.stockSection}>
//           <Text style={styles.stockSectionTitle}>📦 Available Stock</Text>
//           {item.StockReport.map((stock, stockIndex) => (
//             <View key={stockIndex} style={styles.stockCard}>
//               <View style={styles.stockInfo}>
//                 <Text style={styles.stockTitle}>{stock.WareHouseName}</Text>
//                 <Text style={styles.stockDetail}>Batch: {stock.BatchNo || 'N/A'}</Text>
//                 <Text style={styles.stockDetail}>Available: {stock.AvailableQty} {stock.UOM}</Text>
//               </View>
              
//               <View style={styles.outwardSection}>
//                 <Text style={styles.outwardLabel}>Outward Qty</Text>
//                 <TextInput
//                   style={styles.outwardInput}
//                   value={stock.outwardQty?.toString() || ''}
//                   onChangeText={(value) => handleOutwardQtyChange(index, stockIndex, value)}
//                   keyboardType="numeric"
//                   placeholder="0"
//                   maxLength={6}
//                 />
//               </View>
//             </View>
//           ))}
//         </View>
//       ) : (
//         <View style={styles.noStockCard}>
//           <Ionicons name="warning-outline" size={24} color="#D32F2F" />
//           <Text style={styles.noStockText}>Stock Not Available</Text>
//         </View>
//       )}
//     </View>
//   );

//   if (loading && !refreshing) {
//     return (
//       <SafeAreaView style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#025c42" />
//         <Text style={styles.loadingText}>Loading dispatch orders...</Text>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Dispatch Orders</Text>
//         <TouchableOpacity
//           style={styles.editButton}
//           onPress={() => {
//             if (selectedCustomer) {
//               setStatusToChange(selectedCustomer.OrderStatus || '');
//               setLrNumber(selectedCustomer.LrNo || '');
//               setIsStatusModalOpen(true);
//             }
//           }}
//         >
//           <Ionicons name="create-outline" size={24} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       {/* Main Content */}
//       <ScrollView 
//         style={styles.mainScroll} 
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#025c42']} />
//         }
//       >
//         {/* Customer List Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>
//             📋 Orders ({allOrders.length})
//           </Text>
//           <FlatList
//             data={allOrders}
//             renderItem={renderCustomerCard}
//             keyExtractor={(item) => item._id}
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={styles.customerList}
//           />
//         </View>

//         {/* Selected Order Details */}
//         {selectedCustomer && (
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>
//               🏢 {selectedCustomer.CustomerName}
//             </Text>
            
//             {/* Order Summary Card */}
//             <View style={styles.summaryCard}>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Order No:</Text>
//                 <Text style={styles.summaryValue}>{selectedCustomer.OrderNo}</Text>
//               </View>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>LR No:</Text>
//                 <Text style={styles.summaryValue}>{selectedCustomer.LrNo || 'Not assigned'}</Text>
//               </View>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Transport:</Text>
//                 <Text style={styles.summaryValue}>{selectedCustomer.Transport || 'TBD'}</Text>
//               </View>
//             </View>

//             {/* Products Section */}
//             <Text style={styles.sectionTitle}>
//               📦 Products ({orderItems.length})
//             </Text>
            
//             {isDetailsLoading ? (
//               <View style={styles.loadingCard}>
//                 <ActivityIndicator size="small" color="#025c42" />
//                 <Text style={styles.loadingText}>Loading products...</Text>
//               </View>
//             ) : orderItems.length > 0 ? (
//               <FlatList
//                 data={orderItems}
//                 renderItem={renderProductCard}
//                 keyExtractor={(item, index) => item._id || index.toString()}
//                 scrollEnabled={false}
//                 showsVerticalScrollIndicator={false}
//               />
//             ) : (
//               <View style={styles.emptyCard}>
//                 <Ionicons name="cube-outline" size={48} color="#ccc" />
//                 <Text style={styles.emptyText}>No products found</Text>
//               </View>
//             )}

//             {/* Action Buttons */}
//             {orderItems.length > 0 && (
//               <View style={styles.actionSection}>
//                 <TouchableOpacity
//                   style={[styles.saveButton, isSubmitting && styles.disabledButton]}
//                   onPress={addDispatch}
//                   disabled={isSubmitting}
//                 >
//                   {isSubmitting ? (
//                     <ActivityIndicator size="small" color="#fff" />
//                   ) : (
//                     <>
//                       <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
//                       <Text style={styles.saveButtonText}>Save Dispatch</Text>
//                     </>
//                   )}
//                 </TouchableOpacity>
//               </View>
//             )}
//           </View>
//         )}
//       </ScrollView>

//       {/* Status Change Modal */}
//       <Modal
//         visible={isStatusModalOpen}
//         transparent={true}
//         animationType="slide"
//         onRequestClose={() => setIsStatusModalOpen(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Change Order Status</Text>
//               <TouchableOpacity onPress={() => setIsStatusModalOpen(false)}>
//                 <Ionicons name="close-circle" size={24} color="#666" />
//               </TouchableOpacity>
//             </View>
            
//             <View style={styles.modalContent}>
//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>Order Status</Text>
//                 <TextInput
//                   style={styles.modalInput}
//                   value={statusToChange}
//                   onChangeText={setStatusToChange}
//                   placeholder="Enter new status"
//                 />
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>LR Number</Text>
//                 <TextInput
//                   style={styles.modalInput}
//                   value={lrNumber}
//                   onChangeText={setLrNumber}
//                   placeholder="Enter LR number"
//                 />
//               </View>
//             </View>

//             <View style={styles.modalActions}>
//               <TouchableOpacity
//                 style={styles.cancelButton}
//                 onPress={() => setIsStatusModalOpen(false)}
//               >
//                 <Text style={styles.cancelButtonText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.confirmButton, isSubmitting && styles.disabledButton]}
//                 onPress={editOrder}
//                 disabled={isSubmitting}
//               >
//                 {isSubmitting ? (
//                   <ActivityIndicator size="small" color="#fff" />
//                 ) : (
//                   <Text style={styles.confirmButtonText}>Save Changes</Text>
//                 )}
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
  
//   // Header Styles
//   header: {
//     backgroundColor: '#025c42',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#fff',
//     flex: 1,
//     textAlign: 'center',
//   },
//   editButton: {
//     padding: 8,
//   },

//   // Main Layout
//   mainScroll: {
//     flex: 1,
//   },
//   section: {
//     margin: 16,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 12,
//   },

//   // Customer Card Styles
//   customerList: {
//     paddingRight: 16,
//   },
//   customerCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     marginRight: 12,
//     width: 280,
//     flexDirection: 'row',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   selectedCustomerCard: {
//     borderColor: '#025c42',
//     borderWidth: 2,
//   },
//   statusIndicator: {
//     width: 4,
//     borderTopLeftRadius: 12,
//     borderBottomLeftRadius: 12,
//   },
//   cardContent: {
//     flex: 1,
//     padding: 12,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 8,
//   },
//   customerName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//     flex: 1,
//     marginRight: 8,
//   },
//   statusChip: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   statusChipText: {
//     fontSize: 10,
//     fontWeight: 'bold',
//     textTransform: 'uppercase',
//   },
//   orderInfo: {
//     marginBottom: 8,
//   },
//   infoRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   infoText: {
//     fontSize: 14,
//     color: '#666',
//     marginLeft: 6,
//     flex: 1,
//   },
//   dateInfo: {
//     marginBottom: 8,
//   },
//   dateText: {
//     fontSize: 12,
//     color: '#888',
//     marginLeft: 4,
//   },
//   remarksText: {
//     fontSize: 12,
//     color: '#666',
//     fontStyle: 'italic',
//     backgroundColor: '#f8f9fa',
//     padding: 6,
//     borderRadius: 6,
//     marginBottom: 8,
//   },
//   footerInfo: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   footerText: {
//     fontSize: 12,
//     color: '#888',
//     flex: 1,
//   },

//   // Summary Card
//   summaryCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   summaryRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   summaryLabel: {
//     fontSize: 14,
//     color: '#666',
//     fontWeight: '500',
//   },
//   summaryValue: {
//     fontSize: 14,
//     color: '#333',
//     fontWeight: 'bold',
//     flex: 1,
//     textAlign: 'right',
//   },

//   // Product Card Styles
//   productCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   productHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 8,
//   },
//   productName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//     flex: 1,
//     marginRight: 8,
//   },
//   productSku: {
//     fontSize: 12,
//     color: '#666',
//     backgroundColor: '#f0f0f0',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   productDescription: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 12,
//     lineHeight: 20,
//   },

//   // Quantity Grid
//   quantityGrid: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 12,
//   },
//   qtyBox: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   qtyLabel: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 4,
//   },
//   qtyValue: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   qtyUnit: {
//     fontSize: 10,
//     color: '#888',
//     marginTop: 2,
//   },

//   // Input Styles
//   remarksInput: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 14,
//     backgroundColor: '#fafafa',
//     marginBottom: 16,
//     textAlignVertical: 'top',
//   },

//   // Stock Section
//   stockSection: {
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//     padding: 12,
//   },
//   stockSectionTitle: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 8,
//   },
//   stockCard: {
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 8,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   stockInfo: {
//     flex: 1,
//   },
//   stockTitle: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 4,
//   },
//   stockDetail: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 2,
//   },
//   outwardSection: {
//     alignItems: 'center',
//   },
//   outwardLabel: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 4,
//   },
//   outwardInput: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 6,
//     padding: 8,
//     width: 80,
//     textAlign: 'center',
//     fontSize: 14,
//     backgroundColor: '#fff',
//   },

//   // No Stock Card
//   noStockCard: {
//     backgroundColor: '#ffebee',
//     borderRadius: 8,
//     padding: 20,
//     alignItems: 'center',
//     flexDirection: 'row',
//     justifyContent: 'center',
//   },
//   noStockText: {
//     color: '#D32F2F',
//     fontWeight: 'bold',
//     marginLeft: 8,
//     fontSize: 14,
//   },

//   // Action Section
//   actionSection: {
//     marginTop: 20,
//     marginBottom: 20,
//   },
//   saveButton: {
//     backgroundColor: '#025c42',
//     borderRadius: 12,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   disabledButton: {
//     opacity: 0.6,
//   },
//   saveButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginLeft: 8,
//   },

//   // Loading & Empty States
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
//   loadingCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 20,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   loadingText: {
//     marginTop: 8,
//     color: '#666',
//     fontSize: 14,
//   },
//   emptyCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 40,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   emptyText: {
//     color: '#666',
//     fontSize: 16,
//     marginTop: 12,
//   },

//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   modalContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     width: '100%',
//     maxWidth: 400,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   modalContent: {
//     padding: 20,
//   },
//   inputGroup: {
//     marginBottom: 16,
//   },
//   inputLabel: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#333',
//     marginBottom: 8,
//   },
//   modalInput: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 14,
//     backgroundColor: '#fafafa',
//   },
//   modalActions: {
//     flexDirection: 'row',
//     padding: 20,
//     paddingTop: 0,
//   },
//   cancelButton: {
//     flex: 1,
//     backgroundColor: '#f0f0f0',
//     borderRadius: 8,
//     padding: 12,
//     alignItems: 'center',
//     marginRight: 8,
//   },
//   cancelButtonText: {
//     color: '#666',
//     fontWeight: '500',
//   },
//   confirmButton: {
//     flex: 1,
//     backgroundColor: '#025c42',
//     borderRadius: 8,
//     padding: 12,
//     alignItems: 'center',
//     marginLeft: 8,
//   },
//   confirmButtonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//   },
// });
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Stock() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Dispatch list will be listed here ok.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6f8',
  },
  text: {
    fontSize: 16,
    color: '#888',
  },
});