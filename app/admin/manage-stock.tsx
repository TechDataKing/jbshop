// manage-stock.tsx
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";

type Item = {
  id: number;
  name: string;
  quantity: number;
  target?: number | null;
};

export default function ManageStock() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] =
    useState<"noTarget" | "running" | "out" | "good">("noTarget");

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editingTarget, setEditingTarget] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("items")
      .select("id,name,quantity,target")
      .order("name");

    setItems(data as Item[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const noTargets = items.filter((i) => i.target == null);
  const outOfStock = items.filter((i) => i.quantity === 0);
  const runningLow = items.filter(
    (i) => i.target && i.quantity > 0 && i.quantity < i.target * 0.5
  );
  const goodStock = items.filter(
    (i) => i.target && i.quantity >= i.target * 0.5
  );

  const getTabItems = () => {
    switch (activeTab) {
      case "noTarget":
        return noTargets;
      case "running":
        return runningLow;
      case "out":
        return outOfStock;
      case "good":
        return goodStock;
      default:
        return [];
    }
  };

  const saveTarget = async () => {
    if (!selectedItem) return;

    const parsed =
      editingTarget.trim() === "" ? null : Number(editingTarget.trim());

    setProcessing(true);

    await supabase
      .from("items")
      .update({ target: parsed })
      .eq("id", selectedItem.id);

    await fetchItems();

    setProcessing(false);
    setConfirmVisible(false);
    setSuccessVisible(true);
    setSelectedItem(null);
    setEditingTarget("");
  };

  if (loading) return <ActivityIndicator />;

  return (
    <View style={{ flex: 1, padding: 12, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
        Manage Stock
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        <TabButton
          title={`No Targets (${noTargets.length})`}
          active={activeTab === "noTarget"}
          onPress={() => setActiveTab("noTarget")}
        />

        <TabButton
          title={`Running Low (${runningLow.length})`}
          active={activeTab === "running"}
          onPress={() => setActiveTab("running")}
        />

        <TabButton
          title={`Out of Stock (${outOfStock.length})`}
          active={activeTab === "out"}
          onPress={() => setActiveTab("out")}
        />

        <TabButton
          title={`Good Stock (${goodStock.length})`}
          active={activeTab === "good"}
          onPress={() => setActiveTab("good")}
        />
      </View>

      <ScrollView horizontal>
        <ScrollView style={{ maxHeight: 520 }}>
          <Header />

          {getTabItems().map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: "row",
                paddingVertical: 10,
                borderBottomWidth: 1,
              }}
            >
              <View style={{ width: 140 }}>
                <Text>{item.name}</Text>
              </View>

              <View style={{ width: 140 }}>
                <Text>{item.quantity}</Text>
              </View>

              <View style={{ width: 140 }}>
                {activeTab === "noTarget" ? (
                  <TextInput
                    keyboardType="numeric"
                    value={
                      selectedItem?.id === item.id
                        ? editingTarget
                        : item.target?.toString() || ""
                    }
                    onChangeText={(v) => {
                      setSelectedItem(item);
                      setEditingTarget(v);
                    }}
                    style={{
                      borderWidth: 1,
                      padding: 6,
                      borderRadius: 6,
                    }}
                  />
                ) : (
                  <Text>{item.target ?? "-"}</Text>
                )}
              </View>

              {activeTab === "noTarget" && (
                <TouchableOpacity
                  style={{
                    width: 140,
                    alignItems: "center",
                    padding: 5,
                  }}
                  onPress={() => {
                    setSelectedItem(item);
                    setEditingTarget(
                      editingTarget || item.target?.toString() || ""
                    );
                    setConfirmVisible(true);
                  }}
                >
                  <Text style={{ color: "green", fontSize: 18 }}>Save</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      {/* CONFIRM MODAL */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{ backgroundColor: "white", padding: 16, borderRadius: 10 }}
          >
            <Text style={{ fontWeight: "700", marginBottom: 10 }}>
              Save new target?
            </Text>

            {processing ? (
              <ActivityIndicator />
            ) : (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    setConfirmVisible(false);
                    setSelectedItem(null);
                    setEditingTarget("");
                  }}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: "gray",
                    flex: 1,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white" }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={saveTarget}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: "green",
                    flex: 1,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white" }}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* SUCCESS MODAL */}
      <Modal visible={successVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{ backgroundColor: "white", padding: 20, borderRadius: 10 }}
          >
            <Text style={{ fontWeight: "700", marginBottom: 12 }}>
              Target Updated Successfully!
            </Text>

            <TouchableOpacity
              onPress={() => setSuccessVisible(false)}
              style={{
                padding: 10,
                borderRadius: 8,
                backgroundColor: "green",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TabButton({
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
        padding: 10,
        borderRadius: 6,
        backgroundColor: active ? "#007bff" : "#eee",
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: active ? "white" : "black" }}>{title}</Text>
    </TouchableOpacity>
  );
}

function Header() {
  return (
    <View
      style={{
        flexDirection: "row",
        borderBottomWidth: 1,
        paddingVertical: 10,
      }}
    >
      <View style={{ width: 140 }}>
        <Text style={{ fontWeight: "700" }}>Name</Text>
      </View>
      <View style={{ width: 140 }}>
        <Text style={{ fontWeight: "700" }}>Quantity</Text>
      </View>
      <View style={{ width: 140 }}>
        <Text style={{ fontWeight: "700" }}>Target</Text>
      </View>
    </View>
  );
}
