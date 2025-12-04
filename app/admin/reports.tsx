import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { db, getItems, Item, Sale } from "../lib/db/database";

export default function Report() {
  const [items, setItems] = useState<Item[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [filter, setFilter] =
    useState<"today" | "yesterday" | "date">("today");

  const [pickedDate, setPickedDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  })();

  const formattedPicked =
    pickedDate?.toISOString().split("T")[0] ?? "";

  // ➤ FETCH ITEMS FROM LOCAL SQLITE DB
  const fetchItemsLocal = async () => {
    try {
      const data = await getItems();
      setItems(data);
    } catch (error: any) {
      Alert.alert("Error fetching items (local DB)", error.message);
    }
  };

  // ➤ FETCH SALES FROM LOCAL SQLITE DB
  const fetchSalesLocal = async () => {
    try {
      let sql = "SELECT * FROM sales WHERE created_at >= ?";
      let params: any[] = [];

      if (filter === "today") {
        params = [today];
      }

      if (filter === "yesterday") {
        sql = "SELECT * FROM sales WHERE created_at >= ? AND created_at <= ?";
        params = [yesterday, today + " 23:59:59"];
      }

      if (filter === "date" && formattedPicked) {
        sql =
          "SELECT * FROM sales WHERE created_at >= ? AND created_at <= ?";
        params = [
          formattedPicked,
          formattedPicked + " 23:59:59",
        ];
      }

      const results = await db.getAllAsync(sql, params);
      setSales(results as Sale[]);
    } catch (error: any) {
      Alert.alert("Error fetching sales (local DB)", error.message);
    }
  };

  // Refresh when user changes Today / Yesterday / Date
useEffect(() => {
  fetchSalesLocal();
}, [filter, pickedDate]);

// Refresh when screen regains focus
useFocusEffect(
  useCallback(() => {
    fetchItemsLocal();
    fetchSalesLocal();
  }, [])
);


  // ➤ CALCULATIONS
  const profit = sales.reduce(
    (sum, s) => sum + (s.sp - s.mp) * s.qty,
    0
  );

  const totalSales = sales.reduce(
    (sum, s) => sum + s.subtotal,
    0
  );

  const outOfStock = items.filter((i) => i.quantity === 0);

  const lowStock = items.filter(
    (i) => i.quantity > 0 && i.quantity <= (i.target ?? 0)
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 20, marginTop: 10 }}>
      
      {/* FILTER BUTTONS */}
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <FilterBtn
          title="Today"
          active={filter === "today"}
          onPress={() => setFilter("today")}
        />

        <FilterBtn
          title="Yesterday"
          active={filter === "yesterday"}
          onPress={() => setFilter("yesterday")}
        />

        <FilterBtn
          title={
            filter === "date"
              ? formattedPicked || "DD / MM / YYYY"
              : "Pick Date"
          }
          active={filter === "date"}
          onPress={() => {
            setFilter("date");
            setShowPicker(true);
          }}
        />
      </View>

      {showPicker && (
        <DateTimePicker
          value={pickedDate || new Date()}
          mode="date"
          display="calendar"
          onChange={(event, selectedDate) => {
            if (event.type === "set" && selectedDate) {
              setPickedDate(selectedDate);
            }
            setShowPicker(false);
          }}
        />
      )}

      {/* PROFIT CARD */}
      <View
        style={{
          backgroundColor: "#D1FAE5",
          padding: 15,
          borderRadius: 8,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>
          Profit ({filter})
        </Text>
        <Text
          style={{
            fontSize: 26,
            fontWeight: "bold",
            color: "#065F46",
          }}
        >
          KSH {profit}
        </Text>
      </View>

      {/* SALES CARD */}
      <View
        style={{
          backgroundColor: "#E0F2FE",
          padding: 15,
          borderRadius: 8,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>
          Sales ({filter})
        </Text>
        <Text
          style={{
            fontSize: 26,
            fontWeight: "bold",
            color: "#0C4A6E",
          }}
        >
          KSH {totalSales}
        </Text>
      </View>

      {/* RECEIPT LIST */}
      <View
        style={{
          backgroundColor: "#fff",
          padding: 15,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#ddd",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>
          Sales Receipt ({filter})
        </Text>

        {sales.length === 0 && <Text>No sales</Text>}

        {sales.map((s, i) => (
          <View key={i} style={{ marginTop: 5, paddingBottom: 3 }}>
            <Text>
              {s.name} x {s.qty} = KSH {s.subtotal}
            </Text>
          </View>
        ))}
      </View>

      {/* OUT OF STOCK */}
      <View style={{ gap: 10 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: "red",
          }}
        >
          Out of Stock
        </Text>

        {outOfStock.map((i, idx) => (
          <Text key={idx}>{i.name}</Text>
        ))}
      </View>

      {/* LOW STOCK TABLE */}
      <View style={{ gap: 10, marginTop: 20 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: "#CA8A04",
          }}
        >
          Running Low
        </Text>

        {/* TABLE HEADER */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: 5 }}>
          <Text style={{ fontWeight: "bold", width: "40%" }}>Name</Text>
          <Text style={{ fontWeight: "bold", width: "25%",marginLeft:-30 }}>In Stock</Text>
          <Text style={{ fontWeight: "bold", width: "25%" }}>Deficit</Text>
        </View>

        {/* TABLE ROWS */}
        {lowStock.map((i, idx) => (
          <View
            key={idx}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingBottom: 5,
            }}
          >
            <Text style={{ width: "40%" }}>{i.name}</Text>
            <Text style={{ width: "25%" }}>{i.quantity}</Text>
            <Text style={{ width: "25%" }}>{(i.target ?? 0) - i.quantity}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function FilterBtn({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: active ? "#0EA5E9" : "#E5E7EB",
        borderRadius: 6,
      }}
    >
      <Text style={{ color: active ? "white" : "black" }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
