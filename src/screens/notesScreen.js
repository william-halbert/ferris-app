import React, { useState, useEffect } from "react";
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
      <Text style={styles.title}>Notes for {classNameFromNavigation}</Text>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.noteTitle}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.noteItem}
            onPress={() => {
              setNoteInfo({
                className: item.className,
                noteName: item.noteTitle,
              });
              navigation.navigate("Tabs", {
                screen: "Notebook",
                params: { className: item.className, noteName: item.noteTitle },
              });
            }}
          >
            <Text style={styles.noteTitle}>{item.noteTitle}</Text>
          </TouchableOpacity>
        )}
      />
      <Button title="Add New Note" onPress={showNoteDialog} />
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
    padding: 16,
    backgroundColor: "#F7F7F7",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  noteItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#FFF",
  },
  noteTitle: {
    fontSize: 18,
  },
});

export default NotesScreen;
