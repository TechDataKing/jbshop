// app/admin/report.tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

type Sale = {
  name: string;
  qty: number;
  sp: number;
  mp: number;
  subtotal: number;
  created_at: string;
};

type Item = {
  name: string;
  quantity: number;
  target: number;
};

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

  const fetchItems = async () => {
    const { data, error } = await supabase.from("items").select("*");
    if (error) return Alert.alert("Error fetching items", error.message);
    setItems(data as Item[]);
  };

  const fetchSales = async () => {
    let query = supabase.from("sales").select("*");

    if (filter === "today") {
      query = query.gte("created_at", today);
    }

    if (filter === "yesterday") {
      query = query
        .gte("created_at", yesterday)
        .lte("created_at", today);
    }

    if (filter === "date" && formattedPicked) {
      query = query
        .gte("created_at", formattedPicked)
        .lte("created_at", formattedPicked + " 23:59:59");
    }

    const { data, error } = await query;
    if (error) return Alert.alert("Error fetching sales", error.message);

    setSales(data as Sale[]);
  };

  useEffect(() => {
    fetchItems();
    fetchSales();
  }, [filter, pickedDate]);

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
    (i) => i.quantity > 0 && i.quantity <= i.target
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>

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

      {/* PROFIT */}
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

      {/* SALES */}
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

      {/* RECEIPTS */}
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

      {/* STOCK */}
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

      <View style={{ gap: 10 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: "#CA8A04",
          }}
        >
          Running Low
        </Text>

        {lowStock.map((i, idx) => (
          <Text key={idx}>
            {i.name} ({i.quantity})
          </Text>
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
