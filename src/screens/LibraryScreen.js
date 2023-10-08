import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Button,
  Alert,
} from "react-native";
import { useAuth } from "../context/authContext";
import { getAuth } from "firebase/auth";
import Dialog from "react-native-dialog";

const LibraryScreen = ({ navigation }) => {
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [inputClassName, setInputClassName] = useState("");
  const [classes, setClasses] = useState([]);
  const { getUser, createClass, getAllClassNames } = useAuth();
  const auth = getAuth();
  const user = auth.currentUser;
  const showClassNameDialog = () => {
    setDialogVisible(true);
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
      <Text style={styles.title}>Your Classes</Text>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.className}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bookItem}
            onPress={() =>
              navigation.navigate("Notes", { className: item.className })
            }
          >
            <Text style={styles.bookTitle}>{item.className}</Text>
          </TouchableOpacity>
        )}
      />
      <Button title="Add New Class" onPress={showClassNameDialog} />
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  bookItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#FFF",
  },
  bookTitle: {
    fontSize: 18,
  },
});

export default LibraryScreen;
