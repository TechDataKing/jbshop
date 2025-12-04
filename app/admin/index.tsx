// app/(admin)/index.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert, Dimensions, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { getIcon } from "../../utils/iconMap";

// local DB functions
import {
  addSale, getItemById, getItems, updateItemQty,
} from "../lib/db/database";

// auto sync
import { autoSync } from "../lib/sync";

import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

const screenWidth = Dimensions.get("window").width;
const COLUMN_WIDTH = 110; // adjust tile width
const numCols = Math.max(1, Math.floor(screenWidth / COLUMN_WIDTH));

const confirmAsync = (title: string, message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "OK", onPress: () => resolve(true) },
      ],
      { cancelable: false }
    );
  });
};

type Item = {
  id: number;
  name: string;
  mp: number;
  sp: number;
  quantity: number;
};

type CartItem = {
  id: number;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
};

export default function AdminSell() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);
  const [sellPrice, setSellPrice] = useState("");
  const [qty, setQty] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // load local items
  const fetchItemsLocal = async () => {
  try {
    const rows = await getItems();
    console.log("DEBUG: Items from SQLite:", rows);
    setItems(rows as Item[]);
  } catch (e) {
    console.error("fetchItemsLocal error", e);
  }
};


  useEffect(() => {
    fetchItemsLocal();

    // run autoSync on start
    autoSync();

    // daily auto sync: every 24 hours
    const DAY = 24 * 60 * 60 * 1000;
    const timer = setInterval(() => {
      autoSync();
    }, DAY);

    return () => clearInterval(timer);
  }, []);
  useFocusEffect(
  useCallback(() => {
    console.log("Screen focused → refreshing items");
    fetchItemsLocal();
    return () => {};
  }, [])
);


  const openItem = (item: Item) => {
    // 🚫 FIX 1: BLOCK OPENING MODAL WHEN OUT OF STOCK
    if (item.quantity <= 0) {
      alert(`${item.name} is out of stock!`);
      return;
    }

    setSelected(item);
    setSellPrice(item.sp.toString());
    setQty("");
    setModalVisible(true);
  };

  const addToCart = () => {
    if (!selected) return;

    const q = parseFloat(qty);
    const price = parseFloat(sellPrice);

    if (!q || !price) return alert("Missing values!");

    // 🚫 FIX 2: BLOCK ZERO OR NEGATIVE QUANTITY
    if (q <= 0) return alert("Quantity must be greater than 0");

    // 🚫 FIX 3: CANNOT ADD MORE THAN STOCK
    if (q > selected.quantity) {
      return alert(`${selected.name} has only ${selected.quantity} left in stock.`);
    }

    const newItem: CartItem = {
      id: selected.id,
      name: selected.name,
      qty: q,
      price,
      subtotal: q * price,
    };

    setCart((prev) => [...prev, newItem]);
    setModalVisible(false);
  };

  // ✔ Checkout AND remove stock (offline)
  const checkout = async () => {
    try {
      let itemsToProcess: CartItem[] = [...cart];

      if (itemsToProcess.length === 0 && selected && qty && sellPrice) {
        const q = parseFloat(qty);
        const price = parseFloat(sellPrice);
        if (!q || !price) {
          return alert("Enter valid quantity and price before checkout.");
        }

        // BLOCK invalid quantities
        if (q <= 0) return alert("Quantity must be greater than 0");
        if (q > selected.quantity)
          return alert(`${selected.name} has only ${selected.quantity} left in stock.`);

        // LOSS WARNING
        if (!selected) return; // defensive

        if (price < selected.mp) {
          const ok = await confirmAsync(
            "Warning: Selling below MP!",
            `MP: ${selected.mp}\nSP: ${price}\n\nSell anyway?`
          );
          if (!ok) return;
        }

        const newItem: CartItem = {
          id: selected.id,
          name: selected.name,
          qty: q,
          price,
          subtotal: q * price,
        };
        itemsToProcess.push(newItem);
      }

      if (itemsToProcess.length === 0) {
        return alert("Cart empty!");
      }

      // Loss check for all items (local list)
      for (const ci of itemsToProcess) {
        const mpVal = items.find((i) => i.id === ci.id)?.mp ?? null;
        if (mpVal && ci.price < mpVal) {
          const ok = await confirmAsync(
            `Selling ${ci.name} below cost!`,
            `MP: ${mpVal}\nSP: ${ci.price}\n\nSell anyway?`
          );
          if (!ok) return;
        }
      }

      // Process offline: addSale (local) and updateItemQty (local)
      for (const ci of itemsToProcess) {
        // confirm live local stock (fetch by id)
        const local = await getItemById(ci.id) as Item;

if (local.quantity <= 0) {
  alert(`${ci.name} is out of stock!`);
  return;
}

        if (local.quantity <= 0) {
          alert(`${ci.name} is out of stock!`);
          return;
        }
        if (ci.qty > local.quantity) {
          alert(`${ci.name} has only ${local.quantity} remaining — cannot sell ${ci.qty}`);
          return;
        }

        // record sale locally
        await addSale(ci.name, local.mp ?? 0, ci.price, ci.qty, ci.subtotal);

        // reduce local stock
        await updateItemQty(ci.id, ci.qty);
      }

      // clear cart and refresh local list
      setCart([]);
      setModalVisible(false);
      setSelected(null);
      setQty("");
      setSellPrice("");
      alert("Sold Successfully (offline). Will sync when online.");

      // refresh UI from local DB
      await fetchItemsLocal();

      // try immediate sync
      autoSync();
    } catch (err: unknown) {
      let message = "Unknown error";
      if (err instanceof Error) message = err.message;
      alert(`Checkout failed: ${message}`);
    }
  };

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity style={styles.tile} onPress={() => openItem(item)}>
      <MaterialCommunityIcons
        name={getIcon(item.name) as any}
        size={35}
        color="#27ae60"
      />
      <Text style={styles.name}>{item.name}</Text>

      <Text style={styles.prices}>
        SP: {item.sp}{"\n"}MP: {item.mp}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search item..."
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        
      />

      <FlatList
        data={filtered}
        numColumns={numCols}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{selected?.name}</Text>

            <TextInput
              placeholder="Quantity"
              style={styles.input}
              keyboardType="decimal-pad"
              value={qty}
              onChangeText={setQty}
              placeholderTextColor="#888"
            />

            <TextInput
              placeholder="Selling Price"
              style={styles.input}
              keyboardType="decimal-pad"
              value={sellPrice}
              onChangeText={setSellPrice}
              placeholderTextColor="#888"
            />

            <View style={styles.row}>
              <TouchableOpacity style={styles.btnAdd} onPress={addToCart}>
                <Text style={styles.btnText}>Add Item</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnCheckout} onPress={checkout}>
                <Text style={styles.btnText}>Checkout</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancel}
              onPress={() => setModalVisible(false)}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B132B",
    paddingTop: 40,
    paddingHorizontal: 12,
  },

  search: {
    backgroundColor: "white",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },

  tile: {
    flex: 1,
    backgroundColor: "#ffffff",
    margin: 8,
    paddingVertical: 20,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },

  name: {
    fontWeight: "700",
    marginTop: 10,
    color: "#1a1a1a",
    fontSize: 15,
    textAlign: "center", // ⭐ center text
    flexWrap: "wrap", // ⭐ allow 2 lines
    width: "100%",
  },

  prices: {
    fontSize: 13,
    color: "#d63031",
    fontWeight: "600",
    marginTop: 5,
    textAlign: "center",
    flexWrap: "wrap",
    width: "100%",
  },

  modalWrap: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 15,
  },

  modalBox: {
    backgroundColor: "#ffffff",
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 15,
    textAlign: "center",
    color: "#000",
  },

  input: {
    backgroundColor: "#f6f6f6",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e3e3e3",
  },

  btnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },

  cancel: {
    marginTop: 15,
    padding: 10,
    alignSelf: "center",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  btnAdd: {
    backgroundColor: "#3498db",
    padding: 14,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
  },

  btnCheckout: {
    backgroundColor: "#2ecc71",
    padding: 14,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
  },
});
