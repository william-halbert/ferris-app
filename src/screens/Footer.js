import React from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
const ClosedBackpack = require("../../assets/backpackBlue.png");

const Footer = ({ navigation }) => (
  <View style={styles.bottomNavigation}>
    <TouchableOpacity
      onPress={() => {
        navigation.navigate("Notebooks");
      }}
    >
      <Image source={ClosedBackpack} style={styles.ClosedBackpack} />
    </TouchableOpacity>
    <Ionicons name="ios-create" size={36} color="#004DA2" />
  </View>
);
const styles = StyleSheet.create({
  // ... (other styles remain the same)
  // Footer styles are the same as previous bottomNavigation styles
  bottomNavigation: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 50,
    borderTopWidth: 1,
    borderColor: "black",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "white",
    zIndex: 5,
    paddingTop: 10,
  },
  ClosedBackpack: {
    width: 36,
    height: 36,
  },
  // ... (rest of your styles)
});
export default Footer;
