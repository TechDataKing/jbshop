import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { getIcon } from "../../utils/iconMap";
import { supabase } from "../lib/supabase";

type Item = {
  id: number;
  name: string;
  mp: number;
  sp: number;
  qty: number;
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

  const fetchItems = async () => {
    const { data, error } = await supabase.from("items").select("*");
    if (!error && data) setItems(data as Item[]);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openItem = (item: Item) => {
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

  // ✔ Checkout AND remove stock (fixed to not rely on setCart timing)
  const checkout = async () => {
  try {
    let itemsToProcess: CartItem[] = [...cart];

    if (itemsToProcess.length === 0 && selected && qty && sellPrice) {
      const q = parseFloat(qty);
      const price = parseFloat(sellPrice);
      if (!q || !price) {
        return alert("Enter valid quantity and price before checkout.");
      }

      // 🔥 LOSS WARNING HERE
      if (price < selected.mp) {
        const ok = confirm(
          `Warning: Selling below MP!\nMP: ${selected.mp}\nSP: ${price}\n\nSell anyway?`
        );
        if (!ok) return; // cancel checkout
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

    // 🧠 ALSO CHECK CART ITEMS FOR LOSS
    for (const ci of itemsToProcess) {
      const mpVal = items.find((i) => i.id === ci.id)?.mp ?? null;
      if (mpVal && ci.price < mpVal) {
        const ok = confirm(
          `Warning: Selling ${ci.name} below cost!\nMP: ${mpVal}\nSP: ${ci.price}\n\nSell anyway?`
        );
        if (!ok) return;
      }
    }

    // ------- your original code continues unchanged ------
    for (const ci of itemsToProcess) {
      const mpVal = items.find((i) => i.id === ci.id)?.mp ?? null;

      const { error: saleError } = await supabase.from("sales").insert({
        name: ci.name,
        mp: mpVal,
        sp: ci.price,
        qty: ci.qty,
        subtotal: ci.subtotal,
      });

      if (saleError) {
        alert("Failed to record sale: " + saleError.message);
        return;
      }

      const { error: rpcError } = await supabase.rpc("decrease_qty", {
        item_id: ci.id,
        quantity: ci.qty,
      });

      if (rpcError) {
        alert("Failed to update stock: " + rpcError.message);
        return;
      }
    }

    setCart([]);
    setModalVisible(false);
    setSelected(null);
    setQty("");
    setSellPrice("");
    alert("Sold Successfully!");
    fetchItems();
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
        Sp {item.sp}   Mkt {item.mp}
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
        numColumns={4}
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
            />

            <TextInput
              placeholder="Selling Price"
              style={styles.input}
              keyboardType="decimal-pad"
              value={sellPrice}
              onChangeText={setSellPrice}
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
    backgroundColor: "#0B132B", // dark premium blue
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

    // modern shadow
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
  },

  prices: {
    fontSize: 13,
    color: "#d63031", // premium red
    fontWeight: "600",
    marginTop: 5,
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

  btn: {
    backgroundColor: "#10ac84",
    padding: 16,
    marginTop: 18,
    borderRadius: 14,
    alignItems: "center",
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

  // ---- NEW STYLES for Add/Checkout row ----
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
