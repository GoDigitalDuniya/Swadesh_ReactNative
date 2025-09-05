// Filename: addInward.tsx

import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, TextInput, Pressable, SafeAreaView, ScrollView,
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, FlatList, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import DateTimePicker from '@react-native-community/datetimepicker'; 

// --- STEP 1: Centralized Type Imports ---
// Import shared types from the central types file.
import { InwardContext } from '../../context/InwardContext';
import { InwardItem, Warehouse } from '../../context/types'; // Adjust path if needed
import AddEditItemComponent from './addEditItem'; // Import the new component

export default function AddInwardScreen() {
    const router = useRouter();

    // Main form states
    const [warehouseId, setWarehouseId] = useState('');
    const [warehouseName, setWarehouseName] = useState('');
    const [inwardDate, setInwardDate] = useState(new Date().toISOString().slice(0, 10));
    const [dateObject, setDateObject] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [description, setDescription] = useState('');
    const [inwardStatus, setInwardStatus] = useState('Received');

    // Item list state
    const [items, setItems] = useState<InwardItem[]>([]);

    // Data and Loading states
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Modal states for Warehouse/Status pickers
    const [warehouseModalVisible, setWarehouseModalVisible] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const statusOptions = ['Received', 'Pending', 'Cancelled'];

    // --- STEP 2: State to Manage the Add/Edit Item Modal ---
    const [isItemModalVisible, setItemModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<InwardItem | null>(null);

    


    const fetchWarehouses = async () => {
        setIsLoadingWarehouses(true);
        try {
            const authToken = await SecureStore.getItemAsync('authToken');
            if (!authToken) {
                router.replace('/pages/login');
                return;
            }

            const response = await fetch('https://followupio.com/swadeshordermanagment/get/warehouse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ Status: 'Active' }),
            });

            const data = await response.json();
            if (data.status === 1) {
                setWarehouses(data.data);
            } else if (data.message === 'Invalid AuthToken' || data.message === 'AuthToken is required') {
                await SecureStore.deleteItemAsync('authToken');
                router.replace('/pages/login');
            }
        } catch (error) {
            console.error('Error fetching warehouses:', error);
            Alert.alert('Error', 'Failed to fetch warehouses');
        } finally {
            setIsLoadingWarehouses(false);
        }
    };
    useEffect(() => { fetchWarehouses(); }, []);

    const submitInward = async () => {
        setIsSaving(true);
        try {
            const authToken = await SecureStore.getItemAsync('authToken');
            if (!authToken) {
                router.replace('/pages/login');
                return;
            }
            if (!warehouseId) {
                Alert.alert('Validation Error', 'Please select a warehouse.');
                setIsSaving(false);
                return;
            }
            const productsForApi = items
                .filter(item => item.productId && item.InQty)
                .map(item => ({
                    _id: item.productId,
                    InQty: parseInt(item.InQty, 10) || 0,
                    BatchNo: item.BatchNo,
                    MfdDate: item.MfdDate,
                    Remarks: item.Remarks,
                }));

            if (productsForApi.length === 0) {
                Alert.alert('Validation Error', 'Please add at least one valid item with a quantity.');
                setIsSaving(false);
                return;
            }

            const requestBody = {
                WareHouseId: warehouseId,
                InwardDate: inwardDate,
                InwardStatus: inwardStatus,
                Description: description,
                Products: productsForApi,
            };

            const response = await fetch('https://followupio.com/swadeshordermanagment/add/inwards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            if (data.status === 1) {
                Alert.alert('Success', 'Inward entry created successfully.', [{ text: 'OK', onPress: () => router.back() }]);
            } else {
                Alert.alert('Error', data.message || 'Failed to create inward entry.');
            }
        } catch (error) {
            console.error('Error submitting inward:', error);
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleWarehouseSelect = (warehouse: Warehouse) => {
        setWarehouseId(warehouse._id);
        setWarehouseName(warehouse.Warehousename);
        setWarehouseModalVisible(false);
    };

    const handleStatusSelect = (status: string) => {
        setInwardStatus(status);
        setStatusModalVisible(false);
    };

    const toggleDatePicker = () => {
    setShowDatePicker(true);
};

const onDateChange = (event: any, selectedDate?: Date) => {
    // Hide the date picker
    setShowDatePicker(false);
    
    if (selectedDate) {
        // Update the Date object state
        setDateObject(selectedDate);
        
        // Format the date to "YYYY-MM-DD" and update the string state for display/API
        const year = selectedDate.getFullYear();
        const month = ('0' + (selectedDate.getMonth() + 1)).slice(-2); // getMonth() is 0-indexed
        const day = ('0' + selectedDate.getDate()).slice(-2);
        
        setInwardDate(`${year}-${month}-${day}`);
    }
};


    const handleDeleteItem = (idToDelete: number) => {
        Alert.alert('Delete Item', 'Are you sure you want to remove this item?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => setItems(prev => prev.filter(item => item.id !== idToDelete)) },
        ]);
    };

    const handleCancel = () => {
        Alert.alert('Cancel', 'Are you sure? Any unsaved changes will be lost.', [
            { text: 'Stay', style: 'cancel' },
            { text: 'Cancel', style: 'destructive', onPress: () => router.back() },
        ]);
    };

    // --- STEP 3: Functions to open the modal for adding or editing an item ---
    const handleAddNewItem = () => {
        setEditingItem(null); // Clear previous editing state
        setItemModalVisible(true);
    };

    const handleEditItem = (itemToEdit: InwardItem) => {
        setEditingItem(itemToEdit);
        setItemModalVisible(true);
    };

    const renderItemSummary = ({ item }: { item: InwardItem }) => (
        <View style={styles.itemSummaryCard}>
            <View style={styles.itemSummaryContent}>
                <Text style={styles.itemSummaryTitle} numberOfLines={1}>{item.productName}</Text>
                <Text style={styles.itemSummaryDetails}>Qty: {item.InQty} {item.uom} | SKU: {item.sku}</Text>
            </View>
            <View style={styles.itemSummaryActions}>
                <TouchableOpacity onPress={() => handleDeleteItem(item.id)} style={styles.iconButton}>
                    <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleEditItem(item)} style={[styles.iconButton, { marginLeft: 10 }]}>
                    <Ionicons name="create-outline" size={22} color="#025C42" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <InwardContext.Provider value={{ items, setItems }}>
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                    <View style={styles.header}>
                        <Pressable onPress={handleCancel} style={styles.headerButton}>
                            <Ionicons name="arrow-back" size={24} color="#025C42" />
                        </Pressable>
                        <Text style={styles.headerTitle}>New Inward Entry</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Inward Details</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Warehouse *</Text>
                                <Pressable style={styles.selectInput} onPress={() => setWarehouseModalVisible(true)}>
                                    <Text style={[styles.selectText, !warehouseName && styles.placeholder]}>{warehouseName || 'Select Warehouse'}</Text>
                                    <Ionicons name="chevron-down" size={20} color="#666" />
                                </Pressable>
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Status</Text>
                                <Pressable style={styles.selectInput} onPress={() => setStatusModalVisible(true)}>
                                    <Text style={styles.selectText}>{inwardStatus}</Text>
                                    <Ionicons name="chevron-down" size={20} color="#666" />
                                </Pressable>
                            </View>
                           

<View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>Inward Date</Text>

    {/* === REPLACE THIS TextInput === */}
    {/* <TextInput style={styles.textInput} value={inwardDate} onChangeText={setInwardDate} placeholder="YYYY-MM-DD" /> */}

    {/* === WITH THIS Pressable === */}
    <Pressable style={styles.selectInput} onPress={toggleDatePicker}>
        <Text style={styles.selectText}>{inwardDate}</Text>
        <Ionicons name="calendar-outline" size={20} color="#666" />
    </Pressable>
</View>

{/* === ADD THIS DateTimePicker LOGIC RIGHT AFTER THE inputGroup VIEW === */}
{showDatePicker && (
    <DateTimePicker
        value={dateObject}
        mode="date"
        display="default"
        onChange={onDateChange}
    />
)}

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <TextInput style={[styles.textInput, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Enter description..." multiline />
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Items</Text>
                                <Pressable style={styles.addButton} onPress={handleAddNewItem}>
                                    <Ionicons name="add" size={20} color="#025C42" />
                                    <Text style={styles.addButtonText}>Add Item</Text>
                                </Pressable>
                            </View>
                            {items.length > 0 ? (
                                <FlatList data={items} renderItem={renderItemSummary} keyExtractor={(item) => item.id.toString()} scrollEnabled={false} />
                            ) : (
                                <Text style={styles.noItemsText}>No items have been added yet.</Text>
                            )}
                        </View>
                        <View style={styles.bottomSpacing} />
                    </ScrollView>

                    <View style={styles.actionButtons}>
                        <Pressable style={styles.cancelButton} onPress={handleCancel}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                        <Pressable style={styles.saveButton} onPress={submitInward} disabled={isSaving}>
                            <LinearGradient colors={['#025C42', '#025C42']} style={styles.saveButtonGradient}>
                                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Inward</Text>}
                            </LinearGradient>
                        </Pressable>
                    </View>

                    {/* --- STEP 4: Render the AddEditItemComponent inside a Modal --- */}
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={isItemModalVisible}
                        onRequestClose={() => setItemModalVisible(false)}
                    >
                        <AddEditItemComponent
                            itemToEdit={editingItem}
                            onClose={() => setItemModalVisible(false)}
                        />
                    </Modal>

                    {/* Modals for warehouse and status pickers */}
                    <Modal visible={warehouseModalVisible} transparent={true} animationType="slide" onRequestClose={() => setWarehouseModalVisible(false)}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Select Warehouse</Text>
                                    <Pressable onPress={() => setWarehouseModalVisible(false)}><Ionicons name="close" size={24} color="#666" /></Pressable>
                                </View>
                                {isLoadingWarehouses ? <ActivityIndicator size="large" color="#025C42" style={{ padding: 20 }} /> : (
                                    <FlatList data={warehouses} keyExtractor={(item) => item._id} renderItem={({ item }) => (
                                        <TouchableOpacity style={styles.modalOption} onPress={() => handleWarehouseSelect(item)}>
                                            <Text style={styles.modalOptionText}>{item.Warehousename}</Text>
                                        </TouchableOpacity>
                                    )} />
                                )}
                            </View>
                        </View>
                    </Modal>
                    <Modal visible={statusModalVisible} transparent={true} animationType="slide" onRequestClose={() => setStatusModalVisible(false)}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Select Status</Text>
                                    <Pressable onPress={() => setStatusModalVisible(false)}><Ionicons name="close" size={24} color="#666" /></Pressable>
                                </View>
                                <FlatList data={statusOptions} keyExtractor={(item) => item} renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.modalOption} onPress={() => handleStatusSelect(item)}>
                                        <Text style={styles.modalOptionText}>{item}</Text>
                                    </TouchableOpacity>
                                )} />
                            </View>
                        </View>
                    </Modal>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </InwardContext.Provider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
    headerButton: { width: 40, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#025C42' },
    scrollView: { flex: 1 },
    formSection: { backgroundColor: '#fff', margin: 12, padding: 20, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#025C42', marginBottom: 15 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    addButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#025C42' },
    addButtonText: { color: '#025C42', marginLeft: 5, fontWeight: '600' },
    inputGroup: { marginBottom: 15 },
    inputLabel: { fontSize: 15, fontWeight: '600', color: '#34495e', marginBottom: 8 },
    textInput: { borderWidth: 1, borderColor: '#e1e8ed', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fdfdfd', color: '#2c3e50' },
    textArea: { height: 80, textAlignVertical: 'top' },
    selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e1e8ed', borderRadius: 8, padding: 12, backgroundColor: '#fdfdfd' },
    selectText: { fontSize: 16, color: '#2c3e50' },
    placeholder: { color: '#95a5a6' },
    itemSummaryCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#f8f9fa', borderRadius: 8, marginBottom: 10 },
    itemSummaryContent: { flex: 1, marginRight: 10 },
    itemSummaryTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
    itemSummaryDetails: { fontSize: 13, color: '#7f8c8d', marginTop: 4 },
    itemSummaryActions: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { padding: 5 },
    noItemsText: { textAlign: 'center', color: '#95a5a6', marginVertical: 20, fontStyle: 'italic' },
    bottomSpacing: { height: 100 },
    actionButtons: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingBottom: 50 },
    cancelButton: { flex: 1, marginRight: 10, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
    cancelButtonText: { fontSize: 16, color: '#555', fontWeight: '600' },
    saveButton: { flex: 1.5, marginLeft: 10 },
    saveButtonGradient: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    saveButtonText: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    modalOption: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    modalOptionText: { fontSize: 16, color: '#444' },
});