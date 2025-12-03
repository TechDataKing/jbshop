import React, { useEffect, useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function AddItem() {
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [mp, setMp] = useState("");
  const [sp, setSp] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("");

  type Item = {
    id: number;
    name: string;
    alias?: string;
    mp: number;
    sp: number;
    quantity: number;
    unit: string;
  };

  const [suggestions, setSuggestions] = useState<Item[]>([]);

  // 🔴 FIXED: clearForm must be here (NOT inside saveItem)
  const clearForm = () => {
    setName("");
    setAlias("");
    setMp("");
    setSp("");
    setQty("");
    setUnit("");
    setSuggestions([]);
  };

  // 🔎 LIVE SEARCH
  useEffect(() => {
    const search = async () => {
      const query = name.trim().toLowerCase() || alias.trim().toLowerCase();
      if (query.length < 2) return setSuggestions([]);

      const { data, error } = await supabase
        .from("items")
        .select("id, name, mp, sp, quantity, unit")
        .or(`name.ilike.%${query}%,alias.ilike.%${query}%`)
        .limit(5);

      if (!error) setSuggestions(data || []);
    };

    search();
  }, [name, alias]);

  const fillItem = (item: Item) => {
    setName(item.name);
    setAlias(item.alias || "");
    setMp(item.mp.toString());
    setSp(item.sp.toString());
    setQty(item.quantity.toString());
    setUnit(item.unit || "");
    setSuggestions([]);
  };

  const saveItem = async () => {
    if (!name || !mp || !sp || !qty || !unit)
      return Alert.alert("Missing fields");

    const q = parseFloat(qty);

    const { data: existing, error: selectError } = await supabase
      .from("items")
      .select("*")
      .eq("name", name.trim().toLowerCase())
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      return Alert.alert(selectError.message);
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from("items")
        .update({ quantity: existing.quantity + q })
        .eq("id", existing.id);

      if (updateError) return Alert.alert(updateError.message);

      Alert.alert("✔ Updated quantity!");
    } else {
      const { error: insertError } = await supabase.from("items").insert([
        {
          name: name.trim().toLowerCase(),
          alias: alias.trim().toLowerCase(),
          mp: parseFloat(mp),
          sp: parseFloat(sp),
          quantity: q,
          unit,
        },
      ]);

      if (insertError) return Alert.alert(insertError.message);

      Alert.alert("✔ Item added!");
    }

    clearForm(); // ⭐ Works now
  };

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Add / Restock Item</Text>

      <TextInput
        placeholder="Item name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Alias"
        style={styles.input}
        value={alias}
        onChangeText={setAlias}
      />

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
      />

      <TextInput
        placeholder="Selling price"
        style={styles.input}
        value={sp}
        onChangeText={setSp}
        keyboardType="decimal-pad"
      />

      <TextInput
        placeholder="Quantity (ex: 1 or 0.25)"
        style={styles.input}
        value={qty}
        onChangeText={setQty}
        keyboardType="decimal-pad"
      />

      <TextInput
        placeholder="Unit (kg, pcs, litre)"
        style={styles.input}
        value={unit}
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
