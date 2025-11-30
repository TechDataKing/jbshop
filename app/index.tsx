
import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function Home() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Home Page</Text>

      <Button title="Go to Admin" onPress={() => router.push("/admin")} />
      <Button title="Go to Login" onPress={() => router.push("/login")} />
    </View>
  );
}
