import { Picker } from "@react-native-picker/picker";
import * as Network from "expo-network"; // Use Expo's network module
import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function CreateWorker() {
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("client");

  const createWorker = async () => {
    const defaultPassword = "Pass@1234";

    const { data: existing } = await supabase
      .from("workers")
      .select("*")
      .eq("username", username)
      .single();

    if (existing) return alert("Username exists!");

    const { error } = await supabase.from("workers").insert([
      { fullname, username, phone, email, role, password: defaultPassword }
    ]);

    if (error) return alert(error.message);
    alert("Worker created!");
  };

  const checkNetworkStatus = async () => {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected) {
      alert("You are offline. The worker will be saved offline.");
      // Save the worker data offline here if needed
    } else {
      alert("You are online. Syncing with server...");
      // Proceed with server sync
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Worker</Text>

        <TextInput style={styles.input} placeholderTextColor="#999" placeholder="Full name" value={fullname} onChangeText={setFullname} />
        <TextInput style={styles.input} placeholderTextColor="#999" placeholder="Username" value={username} onChangeText={setUsername} />
        <TextInput style={styles.input} placeholderTextColor="#999" placeholder="Phone" value={phone} onChangeText={setPhone} />
        <TextInput style={styles.input} placeholderTextColor="#999" placeholder="Email" value={email} onChangeText={setEmail} />

        <View style={styles.input}>
          <Picker
  selectedValue={role}
  onValueChange={(value) => setRole(value)}
  style={{ color: "#000" }}
>
  <Picker.Item label="Select role..." value="" color="#888" />
  <Picker.Item label="Client" value="client" />
  <Picker.Item label="Admin" value="admin" />
</Picker>

        </View>

        <Button title="Create Worker" onPress={async () => { 
          await checkNetworkStatus();
          createWorker();
        }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
    backgroundColor: "#f2f2f2"
  },
  container: {
    width: "85%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  title: {
    fontSize: 22,
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "bold"
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    color: "#000"
  }
});
