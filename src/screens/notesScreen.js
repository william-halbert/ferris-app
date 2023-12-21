import React, { useState, useEffect } from "react";
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

const NotesScreen = ({ navigation, route }) => {
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [inputNoteTitle, setInputNoteTitle] = useState("");
  const [notes, setNotes] = useState([]);
  const { getUser, createNote, getAllNotes, setNoteInfo } = useAuth();
  const auth = getAuth();
  const user = auth.currentUser;

  const classNameFromNavigation = route.params.className;

  const showNoteDialog = () => {
    setDialogVisible(true);
  };

  const handleDeleteNote = async (noteTitle) => {
    try {
      // Add logic to delete the note from the backend
      // For example: await deleteNote(user.uid, classNameFromNavigation, noteTitle);
      setNotes(notes.filter((note) => note.noteTitle !== noteTitle));
    } catch (error) {
      console.error("Error deleting note:", error);
      Alert.alert("Error", `Failed to delete the note: ${error.message}`);
    }
  };

  useEffect(() => {
    async function fetchNotes() {
      if (user) {
        try {
          const userNotes = await getAllNotes(
            user.uid,
            classNameFromNavigation
          );
          setNotes(userNotes);
        } catch (error) {
          console.error("Failed to fetch notes:", error);
        }
      }
    }

    fetchNotes();
  }, []);

  const handleCreateNote = async () => {
    if (inputNoteTitle) {
      try {
        await createNote(user.uid, classNameFromNavigation, inputNoteTitle);
        const updatedNotes = await getAllNotes(
          user.uid,
          classNameFromNavigation
        );
        setNotes(updatedNotes);
        setInputNoteTitle("");
        setDialogVisible(false);
      } catch (error) {
        console.error("Error creating note:", error);
        Alert.alert("Error", `Failed to create the note: ${error.message}`);
      }
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.noteTitle}
        style={{ marginTop: 40 }}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <TouchableOpacity
                onPress={() => handleDeleteNote(item.noteTitle)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
          >
            <TouchableOpacity
              style={styles.noteItem}
              onPress={() => {
                setNoteInfo({
                  className: item.className,
                  noteName: item.noteTitle,
                });
                navigation.navigate("Tabs", {
                  screen: "Auto-Notes",
                  params: {
                    className: item.className,
                    noteName: item.noteTitle,
                  },
                });
              }}
            >
              <Text style={styles.noteTitle}>{item.noteTitle}</Text>
            </TouchableOpacity>
          </Swipeable>
        )}
      />
      <TouchableOpacity style={styles.addButton} onPress={showNoteDialog}>
        <Ionicons
          name="add"
          size={60}
          color="white"
          style={{ position: "relative", left: 2, top: 0 }}
        />
      </TouchableOpacity>
      <Dialog.Container visible={isDialogVisible}>
        <Dialog.Title>Add New Note</Dialog.Title>
        <Dialog.Input
          onChangeText={(text) => setInputNoteTitle(text)}
          value={inputNoteTitle}
        />
        <Dialog.Button label="Cancel" onPress={() => setDialogVisible(false)} />
        <Dialog.Button label="Create" onPress={handleCreateNote} />
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
    marginTop: 10,
  },
  noteItem: {
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  noteTitle: {
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
});

export default NotesScreen;
