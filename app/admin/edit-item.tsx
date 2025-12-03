import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { supabase } from "../lib/supabase";

type Item = {
  id: number;
  name: string;
  mp: number;
  sp: number;
  quantity: number;
};

export default function AdminInventory() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // confirmation modal state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"save" | "delete" | null>(null);
  const [selectedRow, setSelectedRow] = useState<Partial<Item> | null>(null);
  const [processing, setProcessing] = useState(false);
  //Database selection
  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("fetchItems error:", error);
        Alert.alert("Load failed", error.message);
      } else if (data) {
        setItems(
          data.map((r: any) => ({
            id: r.id,
            name: r.name,
            mp: Number(r.mp ?? 0),
            sp: Number(r.sp ?? 0),
            quantity: Number(r.quantity ?? r.qty ?? 0),
          }))
        );
      }
    } catch (e) {
      console.error("fetchItems exception:", e);
      Alert.alert("Load failed", String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // open modal for saving a row (row contains latest edited values)
  const openSaveConfirm = (row: Partial<Item>) => {
    setSelectedRow(row);
    setConfirmAction("save");
    setConfirmVisible(true);
  };

  // open modal for deleting a row
  const openDeleteConfirm = (row: Partial<Item>) => {
    setSelectedRow(row);
    setConfirmAction("delete");
    setConfirmVisible(true);
  };

  // called when user confirms in modal
  const onConfirm = async () => {
    if (!confirmAction || !selectedRow) {
      setConfirmVisible(false);
      return;
    }

    if (confirmAction === "save") {
      // validate
      const id = selectedRow.id;
      if (id == null) {
        Alert.alert("Save error", "Missing item id");
        setConfirmVisible(false);
        return;
      }

      const name = (selectedRow.name ?? "").toString().trim();
      const mp = Number(selectedRow.mp ?? 0);
      const sp = Number(selectedRow.sp ?? 0);
      const quantity = Number(selectedRow.quantity ?? 0);

      if (!name) {
        Alert.alert("Validation", "Name is required");
        return;
      }
      if (Number.isNaN(mp) || Number.isNaN(sp) || Number.isNaN(quantity)) {
        Alert.alert("Validation", "MP / SP / Qty must be valid numbers");
        return;
      }

      setProcessing(true);
      try {
        const { error } = await supabase
          .from("items")
          .update({ name, mp, sp, quantity })
          .eq("id", id);

        if (error) {
          console.error("save error:", error);
          Alert.alert("Save failed", error.message);
        } else {
          Alert.alert("Saved", `"${name}" updated`);
          await fetchItems();
        }
      } catch (e) {
        console.error("save exception:", e);
        Alert.alert("Save failed", String(e));
      } finally {
        setProcessing(false);
        setConfirmVisible(false);
        setSelectedRow(null);
        setConfirmAction(null);
      }

      return;
    }

    if (confirmAction === "delete") {
      const id = selectedRow.id;
      const name = selectedRow.name ?? "";
      if (id == null) {
        Alert.alert("Delete error", "Missing item id");
        setConfirmVisible(false);
        return;
      }

      setProcessing(true);
      try {
        const { error } = await supabase.from("items").delete().eq("id", id);

        if (error) {
          console.error("delete error:", error);
          Alert.alert("Delete failed", error.message);
        } else {
          Alert.alert("Deleted", `"${name}" removed`);
          await fetchItems();
        }
      } catch (e) {
        console.error("delete exception:", e);
        Alert.alert("Delete failed", String(e));
      } finally {
        setProcessing(false);
        setConfirmVisible(false);
        setSelectedRow(null);
        setConfirmAction(null);
      }
    }
  };

  // Individual editable row component
  function Row({ item }: { item: Item }) {
    const [name, setName] = useState(item.name);
    const [mp, setMp] = useState(String(item.mp));
    const [sp, setSp] = useState(String(item.sp));
    const [qty, setQty] = useState(String(item.quantity));
    const [localSaving, setLocalSaving] = useState(false); // optional per-row spinner while invoking modal

    // open modal and pass current edited values
    const askSave = () => {
      setLocalSaving(true); // show immediate feedback (optional)
      openSaveConfirm({
        id: item.id,
        name,
        mp: Number(mp),
        sp: Number(sp),
        quantity: Number(qty),
      });
      setTimeout(() => setLocalSaving(false), 200); // brief
    };

    const askDelete = () => {
      openDeleteConfirm({ id: item.id, name: item.name });
    };

    return (
      <View style={styles.row}>
        <TextInput
          style={[styles.cell, styles.name]}
          value={name}
          onChangeText={setName}
          placeholder="Name"
        />

        <TextInput
          style={styles.cell}
          value={mp}
          onChangeText={setMp}
          keyboardType="decimal-pad"
          placeholder="MP"
        />

        <TextInput
          style={styles.cell}
          value={sp}
          onChangeText={setSp}
          keyboardType="decimal-pad"
          placeholder="SP"
        />

        <TextInput
          style={styles.cell}
          value={qty}
          onChangeText={setQty}
          keyboardType="decimal-pad"
          placeholder="Qty"
        />

        <TouchableOpacity onPress={askSave} style={styles.saveBtn}>
          {localSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={askDelete} style={styles.deleteBtn}>
          <MaterialCommunityIcons name="trash-can" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search item..."
        style={styles.search}
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.header}>
        <Text style={[styles.hcell, styles.hName]}>Name</Text>
        <Text style={styles.hcell}>Marked Price </Text>
        <Text style={styles.hcell}>Selling Price</Text>
        <Text style={styles.hcell}>Quantity</Text>
      </View>

      {loading ? (
        <View style={{ padding: 20 }}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => <Row item={item} />}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {/* Confirmation modal - reliable across platforms */}
      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => {
        if (!processing) {
          setConfirmVisible(false);
          setSelectedRow(null);
          setConfirmAction(null);
        }
      }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {confirmAction === "save" ? "Confirm Save" : "Confirm Delete"}
            </Text>

            <Text style={styles.modalMessage}>
              {confirmAction === "save"
                ? `Apply changes to "${selectedRow?.name ?? ""}"?`
                : `Delete "${selectedRow?.name ?? ""}" permanently?`}
            </Text>

            {processing ? (
              <ActivityIndicator />
            ) : (
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalBtn, styles.modalCancel]}
                  onPress={() => {
                    setConfirmVisible(false);
                    setSelectedRow(null);
                    setConfirmAction(null);
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalBtn, confirmAction === "delete" ? styles.modalDelete : styles.modalSave]}
                  onPress={onConfirm}
                >
                  <Text style={styles.modalConfirmText}>
                    {confirmAction === "save" ? "Yes, Save" : "Delete"}
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
  container: { flex: 1, backgroundColor: "#0B132B", padding: 10 },

  search: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
  },

  header: {
    flexDirection: "row",
    backgroundColor: "#1F2A44",
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 6,
  },

  hcell: { flex: 1, color: "#fff", fontWeight: "700", textAlign: "center" },
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
    textAlign: "left",
    backgroundColor: "#fff",
  },

  name: { flex: 2, paddingLeft: 6 },

  saveBtn: {
    flex: 1.1,
    backgroundColor: "#2ecc71",
    paddingVertical: 9,
    borderRadius: 8,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteBtn: {
    backgroundColor: "#e74c3c",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  saveText: { color: "#fff", textAlign: "center", fontWeight: "700" },

  /* Modal styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
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
  modalMessage: { marginBottom: 14, fontSize: 14 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end" },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 8,
  },
  modalCancel: { backgroundColor: "#e6e6e6" },
  modalCancelText: { color: "#222", fontWeight: "600" },
  modalSave: { backgroundColor: "#3498db" },
  modalConfirmText: { color: "#fff", fontWeight: "700" },
  modalDelete: { backgroundColor: "#e74c3c" },
});
