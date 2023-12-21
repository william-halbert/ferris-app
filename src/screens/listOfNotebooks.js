// Import necessary components and libraries
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
import Footer from "./Footer";

// Image assets
const Spiral = require("../../assets/spiral.png");
const BackpackImg = require("../../assets/unzippedBackpackBlue.png");
const ClosedBackpack = require("../../assets/backpackBlue.png");

// Define a single Notebook component
const Notebook = ({ title, onPress, backgroundColor }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.notebook, { backgroundColor }]}
  >
    <Image source={Spiral} style={styles.spiral} />
    <Text style={styles.notebookText}>{title}</Text>
  </TouchableOpacity>
);

const colors = [
  "#FFADAD",
  "#FFD6A5",
  "#FDFFB6",
  "#CAFFBF",
  "#9BF6FF",
  "#A0C4FF",
  "#BDB2FF",
  "#FFC6FF",
  "#BEE9E8",
  "#F0B5B3",
  "#FF9AA2",
];
// Main screen component that renders notebooks in a grid
const ListOfNotebooks = () => {
  // Placeholder data for notebooks
  const notebooks = [
    "Chem",
    "Chem",
    "Chem",
    "Chem",
    "Chem",
    "Chem",
    "Chem",
    "Chem",
    "Chem",
  ];
  const PlusIcon = () => <Text style={styles.plusIcon}>+</Text>;
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image source={BackpackImg} style={styles.backpack} />
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <TouchableOpacity
            onPress={() => alert("Notebook pressed!")}
            style={[styles.notebook, { backgroundColor: "white" }]}
          >
            <Image source={Spiral} style={styles.spiral} />
            <View style={styles.newNotebookContainer}>
              <Text style={styles.plusIcon}>+</Text>
              <Text style={styles.newNotebookText}>New Notebook</Text>
            </View>
          </TouchableOpacity>
          {notebooks.map((title, index) => (
            <Notebook
              key={index}
              title={title}
              onPress={() => alert("Notebook pressed!")}
              backgroundColor={colors[index % colors.length]} // Cycle through colors
            />
          ))}
        </ScrollView>
        <Footer />
      </View>
    </SafeAreaView>
  );
};

// Styles for the components
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white", // Set the background color
  },
  container: {
    flex: 1,
  },
  backpack: {
    position: "absolute",
    top: -5, // Adjust as needed for positioning
    left: 10, // Adjust as needed for positioning
    width: 80, // Adjust size as needed
    height: 80, // Adjust size as needed
    resizeMode: "contain",
    zIndex: 5,
  },
  contentContainer: {
    paddingTop: 90, // Make room for the backpack image
    paddingHorizontal: 55,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  notebook: {
    width: 120, // Approximate width for 2 columns
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "black",
    position: "relative", // Needed for absolute positioning of spiral
    height: 160,
    paddingHorizontal: 10,
  },
  spiral: {
    position: "absolute",
    right: 0, // Aligns the spiral to the left side of the notebook
    top: 10, // Adjust top position as needed
    height: 140,
    width: 235,
    resizeMode: "contain",
  },
  notebookText: {
    fontSize: 16,
    color: "black",
    fontWeight: "bold",
  },
  plusIcon: {
    fontSize: 30,
    color: "black",
    textAlign: "center",

    marginRight: 4, // Spacing between plus icon and text
  },
  newNotebookText: {
    fontSize: 16,
    color: "black",
    fontWeight: "bold",
    textAlign: "center",
  },
  newNotebookContent: {
    fontSize: 16,
    flexDirection: "row", // Align plus icon and text in a row
    alignItems: "center", // Center items vertically
    justifyContent: "center",
    marginTop: 20, // Spacing from the top edge
    textAlign: "center",
  },
});

export default ListOfNotebooks;
