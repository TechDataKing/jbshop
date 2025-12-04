import { getItemById } from "@/app/lib/db/database";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  deleteItem,
  getItems,
  Item,
  updateItem,
} from "../lib/db/database";

export default function AdminInventory() {
  const { id } = useLocalSearchParams();
  const itemId = Number(id);

  const [item, setItem] = useState<Item | null>(null);

  /* ------------------- FIXED: LOCAL PARAM + ITEM REFRESH ------------------- */
  useFocusEffect(
    useCallback(() => {
      const refreshItem = async () => {
        console.log("🔄 Refreshing item data...");
        const updated = await getItemById(itemId);
        setItem(updated);
      };
      refreshItem(); // Refresh item every time the page is focused
    }, [itemId])
  );

  /* ------------------- NORMAL INVENTORY STATE ------------------- */
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"save" | "delete" | null>(
    null
  );
  const [selectedRow, setSelectedRow] = useState<Partial<Item> | null>(null);
  const [processing, setProcessing] = useState(false);

  /* ---------------- FETCH FROM SQLITE ONLY ---------------- */
  const fetchFromSQLite = async () => {
    setLoading(true);
    try {
      const data = await getItems();
      setItems(data);
      console.log("📥 Loaded items from SQLite:", data.length);
    } catch (e) {
      console.error("❌ fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFromSQLite(); // Re-fetch items every time the page is focused
    }, [])
  );

  /* ---------------- CONFIRM SAVE OR DELETE ---------------- */
  const onConfirm = async () => {
    if (!confirmAction || !selectedRow) return;

    const id = selectedRow.id;
    if (!id) return Alert.alert("Error", "Missing item ID");

    setProcessing(true);

    try {
      if (confirmAction === "save") {
        await updateItem({
          id,
          name: selectedRow.name!,
          mp: Number(selectedRow.mp),
          sp: Number(selectedRow.sp),
          quantity: Number(selectedRow.quantity),
          alias: "",
          unit: "",
          target: 0,
        });

        Alert.alert("✔ Saved", "Item updated");
      }

      if (confirmAction === "delete") {
        await deleteItem(id);
        Alert.alert("✔ Deleted", "Item removed");
      }

      await fetchFromSQLite(); // Refresh item list after update or delete
    } catch (e) {
      console.error("❌ onConfirm error:", e);
    }

    setProcessing(false);
    setConfirmVisible(false);
    setConfirmAction(null);
    setSelectedRow(null);
  };

  /* ---------------- ROW COMPONENT ---------------- */
  function Row({ item }: { item: Item }) {
    const [name, setName] = useState(item.name);
    const [mp, setMp] = useState(String(item.mp));
    const [sp, setSp] = useState(String(item.sp));
    const [qty, setQty] = useState(String(item.quantity));

    const askSave = () => {
      setSelectedRow({
        id: item.id,
        name,
        mp: Number(mp),
        sp: Number(sp),
        quantity: Number(qty),
      });
      setConfirmAction("save");
      setConfirmVisible(true);
    };

    const askDelete = () => {
      setSelectedRow({ id: item.id, name: item.name });
      setConfirmAction("delete");
      setConfirmVisible(true);
    };

    return (
      <View style={styles.row}>
        <TextInput
          style={[styles.cell, styles.name]}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.cell}
          value={mp}
          onChangeText={setMp}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={styles.cell}
          value={sp}
          onChangeText={setSp}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={styles.cell}
          value={qty}
          onChangeText={setQty}
          keyboardType="decimal-pad"
        />

        <TouchableOpacity onPress={askSave} style={styles.saveBtn}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={askDelete} style={styles.deleteBtn}>
          <MaterialCommunityIcons name="trash-can" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  /* ---------------- FILTER LIST ---------------- */
  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TextInput
      
        placeholder="Search item..."
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        
        placeholderTextColor="#ccc"
      />

      <View style={styles.header}>
        <Text style={[styles.hcell, styles.hName]}>Name</Text>
        <Text style={styles.hcell}>MP</Text>
        <Text style={styles.hcell}>SP</Text>
        <Text style={styles.hcell}>Qty</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ padding: 20 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => `item-${item.id}`}
          renderItem={({ item }) => <Row item={item} />}
          contentContainerStyle={{ paddingBottom: 150 }}
        />
      )}

      {/* Confirm Modal */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {confirmAction === "save" ? "Confirm Save" : "Confirm Delete"}
            </Text>

            <Text style={styles.modalMessage}>
              {confirmAction === "save"
                ? `Apply changes to "${selectedRow?.name}"?`
                : `Delete "${selectedRow?.name}" permanently?"`}
            </Text>

            {processing ? (
              <ActivityIndicator />
            ) : (
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalBtn, styles.modalCancel]}
                  onPress={() => setConfirmVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.modalBtn,
                    confirmAction === "delete"
                      ? styles.modalDelete
                      : styles.modalSave,
                  ]}
                  onPress={onConfirm}
                >
                  <Text style={styles.modalConfirmText}>
                    {confirmAction === "save" ? "Save" : "Delete"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#102dafff", padding: 10 ,paddingTop: 40},
  search: {
    backgroundColor: "#0c0101ff",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    color: "#fff",
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#1F2A44",
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  hcell: {
    flex: 1,
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },
  hName: { flex: 2, textAlign: "left", paddingLeft: 10 },
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 8,
    marginVertical: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  cell: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
    color: "#000",
  },
  name: { flex: 2 },
  saveBtn: {
    flex: 1.1,
    backgroundColor: "#2ecc71",
    paddingVertical: 9,
    borderRadius: 8,
    marginHorizontal: 6,
    alignItems: "center",
  },
  deleteBtn: {
    backgroundColor: "#e74c3c",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "86%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  modalMessage: { fontSize: 14, marginBottom: 14 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end" },
  modalBtn: { padding: 10, borderRadius: 8, marginLeft: 8 },
  modalCancel: { backgroundColor: "#e6e6e6" },
  modalCancelText: { color: "#222", fontWeight: "600" },
  modalSave: { backgroundColor: "#3498db" },
  modalDelete: { backgroundColor: "#e74c3c" },
  modalConfirmText: { color: "#fff", fontWeight: "700" },
});
