import { Button, Text, View } from "react-native";

export default function WorkerDashboard() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Worker Dashboard</Text>
      <Text>View inventory and update stock</Text>
      <Button title="View Items" onPress={() => alert('View items button pressed')} />
    </View>
  );
}
