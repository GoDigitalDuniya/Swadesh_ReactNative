// Filename: addEditItem.tsx

import React, { useState, useEffect, useContext } from 'react';
import { InwardItem, Product } from '../../context/types';
import {
    StyleSheet, View, Text, TextInput, Pressable, ScrollView,
    Alert, ActivityIndicator, Platform, Modal as ProductModal, FlatList, TouchableOpacity, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { InwardContext } from '../../context/InwardContext'; // Adjust path if needed
import DateTimePicker from '@react-native-community/datetimepicker';



const BLANK_ITEM: Omit<InwardItem, 'id'> = {
    productId: null,
    productName: '',
    productDescription: '',
    sku: '',
    uom: '',
    InQty: '',
    BatchNo: '',
    MfdDate: '',
    Remarks: '',
};

// Props define what information this component needs from its parent
interface AddEditItemComponentProps {
    itemToEdit: InwardItem | null; // Pass the item to edit, or null for a new one
    onClose: () => void; // A function to close the modal
}

export default function AddEditItemComponent({ itemToEdit, onClose }: AddEditItemComponentProps) {
    const context = useContext(InwardContext);
    if (!context) {
        Alert.alert("Error", "Context not found. Please ensure the parent component is wrapped in InwardContext.Provider.");
        return null;
    }
    const { setItems } = context;

    const [currentItem, setCurrentItem] = useState<InwardItem>(() => {
        // Initialize state based on props: if an item is passed, use it; otherwise, create a new one.
        return itemToEdit ? itemToEdit : { ...BLANK_ITEM, id: Date.now() };
    });

    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState('');

    const [showMfdDatePicker, setShowMfdDatePicker] = useState(false);
const [mfdDateObject, setMfdDateObject] = useState(
    // If editing, use the existing date, otherwise use today's date
    () => (itemToEdit?.MfdDate ? new Date(itemToEdit.MfdDate) : new Date())
);

    const fetchProducts = async () => {
        setIsLoadingProducts(true);
        try {
            const authToken = await SecureStore.getItemAsync('authToken');
            if (!authToken) { onClose(); return; } // Close modal if not authenticated

            const response = await fetch('https://followupio.com/swadeshordermanagment/get/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ ProductStatus: 'Active' }),
            });
            const data = await response.json();
            if (data.status === 1) {
                setProducts(data.data);
                setFilteredProducts(data.data);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch products');
        } finally {
            setIsLoadingProducts(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    useEffect(() => {
        if (productSearchQuery.trim() === '') {
            setFilteredProducts(products);
        } else {
            const filtered = products.filter(p =>
                p.ProductName.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                p.ProductSku.toLowerCase().includes(productSearchQuery.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    }, [productSearchQuery, products]);

    const handleProductSelect = (product: Product) => {
        setCurrentItem(prev => ({
            ...prev,
            productId: product._id,
            productName: product.ProductName,
            productDescription: product.ProductDesc || 'No description available.',
            sku: product.ProductSku,
            uom: product.UOM,
        }));
        setProductModalVisible(false);
        setProductSearchQuery('');
    };

    const handleItemChange = (field: keyof Omit<InwardItem, 'id'>, value: string) => {
        setCurrentItem(prev => ({ ...prev, [field]: value }));
    };

    const onMfdDateChange = (event: any, selectedDate?: Date) => {
    setShowMfdDatePicker(Platform.OS === 'ios'); // On iOS, the picker is a modal
    if (selectedDate) {
        setMfdDateObject(selectedDate);
        // Format date to YYYY-MM-DD and use the existing handleItemChange function
        const formattedDate = selectedDate.toISOString().slice(0, 10);
        handleItemChange('MfdDate', formattedDate);
    }
};

const toggleMfdDatePicker = () => {
    setShowMfdDatePicker(true);
};

    const validateItem = () => {
        if (!currentItem.productId) {
            Alert.alert('Validation Error', 'Please select a product.');
            return false;
        }
        if (!currentItem.InQty || parseInt(currentItem.InQty, 10) <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid quantity.');
            return false;
        }
        return true;
    };

    const updateMainList = () => {
        setItems(prevItems => {
            const itemIndex = prevItems.findIndex(item => item.id === currentItem.id);
            if (itemIndex > -1) {
                const newItems = [...prevItems];
                newItems[itemIndex] = currentItem;
                return newItems;
            } else {
                return [...prevItems, currentItem];
            }
        });
    };

    const handleSaveItem = () => {
        if (!validateItem()) return;
        updateMainList();
        onClose(); // Close the modal
    };

    const handleSaveAndAddAnother = () => {
        if (!validateItem()) return;
        updateMainList();
        Alert.alert('Success', 'Item saved. You can now add another.');
        setCurrentItem({ ...BLANK_ITEM, id: Date.now() }); // Reset form
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
            <View style={styles.modalView}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{itemToEdit ? 'Edit Item' : 'Add New Item'}</Text>
                    <Pressable onPress={onClose}>
                        <Ionicons name="close-circle" size={28} color="#999" />
                    </Pressable>
                </View>

                <ScrollView style={styles.scrollView}>
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Product *</Text>
                            <Pressable style={styles.productSelectInput} onPress={() => setProductModalVisible(true)}>
                                <Text style={[styles.selectText, !currentItem.productName && styles.placeholder]} numberOfLines={2}>
                                    {currentItem.productName || 'Select Product'}
                                </Text>
                            </Pressable>
                            {currentItem.productId && (
                                <View style={styles.productDetails}>
                                    <Text style={styles.productDetailText}>SKU: {currentItem.sku} | UOM: {currentItem.uom}</Text>
                                    <Text style={styles.productDescription}>{currentItem.productDescription}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, styles.halfWidth]}>
                                <Text style={styles.inputLabel}>Quantity * {currentItem.uom && `(${currentItem.uom})`}</Text>
                                <TextInput style={styles.textInput} value={currentItem.InQty} onChangeText={v => handleItemChange('InQty', v)} keyboardType="numeric" />
                            </View>
                            <View style={[styles.inputGroup, styles.halfWidth]}>
                                <Text style={styles.inputLabel}>Batch No.</Text>
                                <TextInput style={styles.textInput} value={currentItem.BatchNo} onChangeText={v => handleItemChange('BatchNo', v)} />
                            </View>
                        </View>
                       <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>Manufacturing Date</Text>
    
    {/* === REPLACE THIS TextInput === */}
    {/* <TextInput style={styles.textInput} value={currentItem.MfdDate} onChangeText={v => handleItemChange('MfdDate', v)} placeholder="YYYY-MM-DD" /> */}
    
    {/* === WITH THIS Pressable === */}
    <Pressable style={styles.textInput} onPress={toggleMfdDatePicker}>
        <Text style={[styles.selectText, !currentItem.MfdDate && styles.placeholder]}>
            {currentItem.MfdDate || 'YYYY-MM-DD'}
        </Text>
         <Ionicons name="calendar-outline" size={20} color="#666" />
    </Pressable>
</View>

{/* === AND ADD THIS DateTimePicker LOGIC RIGHT AFTER IT === */}
{showMfdDatePicker && (
    <DateTimePicker
        value={mfdDateObject}
        mode="date"
        display="default"
        onChange={onMfdDateChange}
    />
)}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Remarks</Text>
                            <TextInput style={styles.textInput} value={currentItem.Remarks} onChangeText={v => handleItemChange('Remarks', v)} placeholder="Enter Remarks" />
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.actionButtons}>
                    <Pressable style={styles.saveAnotherButton} onPress={handleSaveAndAddAnother}>
                        <Text style={styles.saveAnotherButtonText}>Save & Add Another</Text>
                    </Pressable>
                    <Pressable style={styles.saveButton} onPress={handleSaveItem}>
                        <LinearGradient colors={['#025C42', '#025C42']} style={styles.saveButtonGradient}>
                            <Text style={styles.saveButtonText}>Save Item</Text>
                        </LinearGradient>
                    </Pressable>
                </View>

                <ProductModal visible={productModalVisible} transparent={true} animationType="slide" onRequestClose={() => setProductModalVisible(false)}>
                    <View style={styles.productModalOverlay}>
                        <View style={styles.productModalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Product</Text>
                                <Pressable onPress={() => setProductModalVisible(false)}><Ionicons name="close" size={24} color="#666" /></Pressable>
                            </View>
                            <View style={styles.searchContainer}>
                                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                                <TextInput style={styles.searchInput} value={productSearchQuery} onChangeText={setProductSearchQuery} placeholder="Search products..." autoFocus />
                            </View>
                            {isLoadingProducts ? <ActivityIndicator size="large" color="#025C42" /> : (
                                <FlatList data={filteredProducts} keyExtractor={(p) => p._id} renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.modalOption} onPress={() => handleProductSelect(item)}>
                                        <Text style={styles.modalOptionText}>{item.ProductName}</Text>
                                        <Text style={styles.modalOptionSubText}>SKU: {item.ProductSku} | UOM: {item.UOM}</Text>
                                    </TouchableOpacity>
                                )} />
                            )}
                        </View>
                    </View>
                </ProductModal>
            </View>
        </KeyboardAvoidingView>
    );
}


// --- Styles for this component ---
const styles = StyleSheet.create({
    // Modal container and view
    modalContainer: { flex: 1 },
    modalView: { flex: 1, backgroundColor: '#f8f9fa' },
    scrollView: { flex: 1 },
    formContainer: { padding: 20 },

    // Header specific to this modal component
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#fff' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },

    // Re-used styles
    inputGroup: { marginBottom: 15 },
    inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
    halfWidth: { width: '48%' },
    inputLabel: { fontSize: 15, fontWeight: '600', color: '#2c3e50', marginBottom: 8 },
    textInput: {flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e1e8ed', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff', color: '#2c3e50' },
    productSelectInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#fff', minHeight: 48 },
    selectText: { fontSize: 16, color: '#333', flex: 1 },
    placeholder: { color: '#999' },
    productDetails: { marginTop: 8, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 6 },
    productDetailText: { fontSize: 14, color: '#555' },
    productDescription: { fontSize: 14, color: '#777', fontStyle: 'italic' },
    actionButtons: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#e0e0e0', backgroundColor: '#fff' },
    saveButton: { flex: 1, marginLeft: 10 },
    saveButtonGradient: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
    saveAnotherButton: { flex: 1.5, marginRight: 10, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#025C42', alignItems: 'center', backgroundColor: '#e6f4f0' },
    saveAnotherButtonText: { fontSize: 16, color: '#025C42', fontWeight: '600' },

    // Product search modal styles
    productModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    productModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 20, paddingHorizontal: 10, backgroundColor: '#f5f5f5', borderRadius: 8 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 16, paddingVertical: 10 },
    modalOption: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    modalOptionText: { fontSize: 16, color: '#333' },
    modalOptionSubText: { fontSize: 14, color: '#666', marginTop: 4 },
});