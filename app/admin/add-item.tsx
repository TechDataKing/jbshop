import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function AddItem() {
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [mp, setMp] = useState("");
  const [sp, setSp] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("");

  const saveItem = async () => {
    if (!name || !mp || !sp || !qty || !unit)
      return Alert.alert("Missing fields");

    const q = parseFloat(qty);

    // Check if item already exists
    const { data: existing, error: selectError } = await supabase
      .from("items")
      .select("*")
      .eq("name", name.trim().toLowerCase())
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      return Alert.alert(selectError.message);
    }

    if (existing) {
      // Update quantity
      const { error: updateError } = await supabase
        .from("items")
        .update({ quantity: existing.quantity + q })
        .eq("id", existing.id);

      if (updateError) return Alert.alert(updateError.message);

      Alert.alert("✔ Updated quantity!");
    } else {
      // Insert new item
      const { error: insertError } = await supabase
        .from("items")
        .insert([
          {
            name: name.trim().toLowerCase(),
            mp: parseFloat(mp),
            sp: parseFloat(sp),
            quantity: q,
            unit,
          },
        ]);

      if (insertError) return Alert.alert(insertError.message);

      Alert.alert("✔ Item added!");
    }

    // Clear form after save
    setName("");
    setMp("");
    setSp("");
    setQty("");
    setUnit("");
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
        onChangeText={setUnit}
      />

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
});
