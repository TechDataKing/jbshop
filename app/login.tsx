import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { supabase } from "./lib/supabase";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin() {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error || !data) {
      setMessage("Invalid username or password");
      return;
    }

    if (data.role === "owner") {
      router.replace("/admin");
    } else {
      router.replace("/worker");
    }
  }

  return (
    <View style={{ padding: 20, marginTop: 100 }}>
      <Text>Username:</Text>
      <TextInput style={{ borderWidth: 1 }} value={username} onChangeText={setUsername} />

      <Text>Password:</Text>
      <TextInput secureTextEntry style={{ borderWidth: 1 }} value={password} onChangeText={setPassword} />

      <Button title="Login" onPress={handleLogin} />
      {message && <Text>{message}</Text>}
    </View>
  );
}
