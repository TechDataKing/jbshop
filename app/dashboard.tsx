import { Link } from "expo-router";
import { Button, Text, View } from "react-native";

export default function Dashboard() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Welcome to the Dashboard!</Text>

      <View style={{ marginVertical: 20 }}>
        <Link href="/admin">
          <Button title="Go to Admin Dashboard" />
        </Link>
        <Link href="/worker">
          <Button title="Go to Worker Dashboard" />
        </Link>
      </View>
    </View>
  );
}
