import { app } from "@repo/config/app";
import { Text, View } from "react-native";

const HomeScreen = () => (
  <View
    style={{
      alignItems: "center",
      backgroundColor: app.backgroundColor,
      flex: 1,
      justifyContent: "center",
    }}
  >
    <Text style={{ color: "#E2E8F0", fontSize: 24, fontWeight: "600" }}>
      {app.name}
    </Text>
  </View>
);

export default HomeScreen;
