// app/admin/add-item.tsx
import { router } from "expo-router";
import React, { useEffect, useState } from "react";

import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getItems,
  saveItem as insertItem,
  Item,
  searchItems,
  updateItem,
} from "../lib/db/database";


export default function AddItem() {
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [mp, setMp] = useState("");
  const [sp, setSp] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("");

  const [suggestions, setSuggestions] = useState<Item[]>([]);

  // 🔴 CLEAR FORM
  const clearForm = () => {
    setName("");
    setAlias("");
    setMp("");
    setSp("");
    setQty("");
    setUnit("");
    setSuggestions([]);
  };

  // 🔎 OFFLINE SEARCH FROM SQLITE
  useEffect(() => {
    const search = async () => {
      const query = name.trim().toLowerCase() || alias.trim().toLowerCase();
      if (query.length < 2) return setSuggestions([]);

      const results = await searchItems(query);
      setSuggestions(results || []);
    };

    search();
  }, [name, alias]);

  // 🔄 AUTO FILL WHEN SELECTED
  const fillItem = (item: Item) => {
    setName(item.name);
    setAlias(item.alias || "");
    setMp(item.mp.toString());
    setSp(item.sp.toString());
    setQty(item.quantity.toString());
    setUnit(item.unit || "");
    setSuggestions([]);
  };

  // 💾 SAVE / UPDATE OFFLINE
const saveItem = async () => {
  console.log("🔍 SAVE ITEM PRESS:", { name, alias, mp, sp, qty, unit });

  if (!name || !mp || !sp || !qty || !unit) {
    console.log("❌ Missing fields");
    return Alert.alert("Missing fields");
  }

  const q = parseFloat(qty);
  const mpVal = parseFloat(mp);
  const spVal = parseFloat(sp);

  const allItems = await getItems();
  console.log("📦 ALL ITEMS IN DB:", allItems);

  const existing = allItems.find(
    (i) => i.name.trim().toLowerCase() === name.trim().toLowerCase()
  );

  if (existing) {
    console.log("🔁 UPDATING EXISTING ITEM:", existing);

    await updateItem({
      id: existing.id,
      name: existing.name,
      alias,
      mp: mpVal,
      sp: spVal,
      unit,
      quantity: existing.quantity + q,
    });

    console.log("✔ UPDATED SUCCESSFULLY");
    Alert.alert("✔ Quantity updated (offline)");

    clearForm();
  router.back();
  } else {
    console.log("➕ INSERTING NEW ITEM");

    await insertItem({
      name: name.trim().toLowerCase(),
      alias: alias.trim().toLowerCase(),
      mp: mpVal,
      sp: spVal,
      unit,
      quantity: q,
    });

    console.log("✔ INSERTED SUCCESSFULLY");
    Alert.alert("✔ Item added (offline)");
  }

  clearForm();
  router.back();
};


  return (
    <View style={styles.page}>
      <Text style={styles.title}>Add / Restock Item</Text>

      <TextInput
        placeholder="Item name"
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholderTextColor="#888"
      />

      <TextInput
        placeholder="Alias"
        style={styles.input}
        value={alias}
        onChangeText={setAlias}
        placeholderTextColor="#888"
      />

      {/* SUGGESTIONS */}
      {suggestions.length > 0 && (
        <View style={styles.suggestBox}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => fillItem(item)}
              style={styles.suggestItem}
            >
              <Text style={{ fontWeight: "700" }}>{item.name}</Text>
              <Text style={{ color: "#555" }}>
                MP: {item.mp} | SP: {item.sp}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TextInput
        placeholder="Market price"
        style={styles.input}
        value={mp}
        onChangeText={setMp}
        keyboardType="decimal-pad"
        placeholderTextColor="#888"
      />

      <TextInput
        placeholder="Selling price"
        style={styles.input}
        value={sp}
        onChangeText={setSp}
        keyboardType="decimal-pad"
        placeholderTextColor="#888"
      />

      <TextInput
        placeholder="Quantity (ex: 1 or 0.25)"
        style={styles.input}
        value={qty}
        onChangeText={setQty}
        keyboardType="decimal-pad"
        placeholderTextColor="#888"
      />

      <TextInput
        placeholder="Unit (kg, pcs, litre)"
        style={styles.input}
        value={unit}
        onChangeText={setUnit}
        placeholderTextColor="#888"
      />

      <View style={{ marginBottom: 10 }}>
        <Button title="Clear Form" color="red" onPress={clearForm} />
      </View>

      <Button title="Save Item" onPress={saveItem} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fafafa",
  },
  title: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderColor: "#ccc",
    color: "#000",
  },
  suggestBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
  },
  suggestItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
});
