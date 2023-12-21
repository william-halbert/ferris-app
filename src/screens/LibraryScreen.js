import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Button,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/authContext";
import { getAuth } from "firebase/auth";
import Dialog from "react-native-dialog";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const LibraryScreen = ({ navigation }) => {
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [inputClassName, setInputClassName] = useState("");
  const [classes, setClasses] = useState([]);
  const { logout, createClass, getAllClassNames } = useAuth();
  const auth = getAuth();
  const user = auth.currentUser;
  const showClassNameDialog = () => {
    setDialogVisible(true);
  };
  const handleLogout = async () => {
    try {
      await logout(); // Using the logout function from context
      navigation.navigate("SignIn");
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", `Failed to log out: ${error.message}`);
    }
  };

  const handleDeleteClass = async (className) => {
    try {
      //await deleteClass(user.uid, className); // assuming deleteClass is a function you have to define
      setClasses(classes.filter((item) => item.className !== className));
    } catch (error) {
      console.error("Error deleting class:", error);
      Alert.alert("Error", `Failed to delete the class: ${error.message}`);
    }
  };

  const renderRightActions = (className) => {
    return (
      <TouchableOpacity
        onPress={() => handleDeleteClass(className)}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    async function fetchClasses() {
      if (user) {
        try {
          const userClasses = await getAllClassNames(user.uid);
          setClasses(userClasses);
        } catch (error) {
          console.error("Failed to fetch classes:", error);
        }
      }
    }

    fetchClasses();
  }, []);

  const handleCreateClass = async () => {
    if (inputClassName) {
      try {
        await createClass(user.uid, inputClassName);
        setClasses((prevClasses) => [
          ...prevClasses,
          { className: inputClassName },
        ]);
        setInputClassName("");
        setDialogVisible(false);
      } catch (error) {
        console.error("Error creating class:", error);
        Alert.alert("Error", `Failed to create the class: ${error.message}`);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Your Classes</Text>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.className}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => renderRightActions(item.className)}
          >
            <TouchableOpacity
              style={styles.bookItem}
              onPress={() =>
                navigation.navigate("Notes", { className: item.className })
              }
            >
              <Text style={styles.bookTitle}>{item.className}</Text>
            </TouchableOpacity>
          </Swipeable>
        )}
      />

      <TouchableOpacity style={styles.addButton} onPress={showClassNameDialog}>
        <Ionicons
          name="add"
          size={60}
          color="white"
          style={{ position: "relative", left: 2, top: 0 }}
        />
      </TouchableOpacity>
      <Dialog.Container visible={isDialogVisible}>
        <Dialog.Title>Add New Class</Dialog.Title>
        <Dialog.Input
          onChangeText={(text) => setInputClassName(text)}
          value={inputClassName}
        />
        <Dialog.Button label="Cancel" onPress={() => setDialogVisible(false)} />
        <Dialog.Button label="Create" onPress={handleCreateClass} />
      </Dialog.Container>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFAFD",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    marginTop: 100,
  },
  bookItem: {
    padding: 15,

    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  bookTitle: {
    fontSize: 18,
  },
  deleteButton: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center", // Center the button content
    paddingHorizontal: 20, // Horizontal padding
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  addButton: {
    position: "absolute", // To position it over other components
    bottom: 30, // Distance from the bottom of the screen
    right: 30, // Distance from the right of the screen
    backgroundColor: "#007bff", // Button color
    width: 90, // Width of the circle
    height: 90, // Height of the circle
    borderRadius: 45, // Half of width/height to make it a perfect circle
    elevation: 5, // Shadow for Android
    shadowColor: "#000000", // Shadow for iOS
    shadowOffset: { width: 0, height: 2 }, // Shadow for iOS
    shadowRadius: 2, // Shadow for iOS
    shadowOpacity: 0.8, // Shadow for iOS
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  logoutButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default LibraryScreen;
