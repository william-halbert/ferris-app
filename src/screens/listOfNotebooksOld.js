import React, { useState, useEffect } from "react";
import {
  Image,
  View,
  Text,
  Button,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
} from "react-native";

import { useAuth } from "../context/authContext"; // Ensure this is compatible with React Native
import { getAuth } from "firebase/auth";
import NotebookContent from "./NotebookContent";
import Dialog from "react-native-dialog";
import Menu, { MenuItem } from "react-native-material-menu"; // Check if compatible or find an alternative
import { MaterialIcons } from "@expo/vector-icons"; // Instead of "@mui/icons-material"
import { Alert } from "react-native";

// Importing local images in React Native
const Spiral = require("../../assets/spiral.png");
const BackpackImg = require("../../assets/unzippedBackpackBlue.png");

export default function ListOfNotebooks() {
  const [notebooks, setNotebooks] = useState([{ name: "Add New" }]);
  const [openNotebook, setOpenNotebook] = useState(null);
  const [color, setColor] = useState(null);
  const [newNotebookName, setNewNotebookName] = useState("");

  const auth = getAuth();
  const {
    getUser,
    createClass,
    getAllClassNames,
    deleteNotebook,
    editNotebookName,
  } = useAuth();
  const user = auth.currentUser;
  const [inputClassName, setInputClassName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [notebookToRename, setNotebookToRename] = useState(null);
  const [renamedNotebookName, setRenamedNotebookName] = useState("");

  const handleRenameClick = (notebook) => {
    setNotebookToRename(notebook);
    setRenamedNotebookName(notebook.name);
    setRenameDialogOpen(true);
  };

  const colors = [
    "white",
    "#FFADAD",
    "#FFD6A5",
    "#FDFFB6",
    "#CAFFBF",
    "#9BF6FF",
    "#A0C4FF",
    "#BDB2FF",
    "#FFC6FF",
    "#FFFFFC",
    "#BEE9E8",
    "#F0B5B3",
    "#FF9AA2",
  ];

  const handleRenameConfirm = async () => {
    if (notebookToRename && renamedNotebookName) {
      try {
        await editNotebookName(
          String(user.uid),
          String(notebookToRename.classId),
          renamedNotebookName
        );

        setNotebooks(
          notebooks.map((n) =>
            n.classId === notebookToRename.classId
              ? { ...n, name: renamedNotebookName }
              : n
          )
        );
        setRenamedNotebookName("");
        setRenameDialogOpen(false);
        setNotebookToRename(null);
      } catch (error) {
        console.error("Error renaming the notebook:", error);
        // Optionally, show an error message to the user
      }
    }
  };

  // React Native does not support 'event' like in the web.
  // So, handleMenuClick can be simplified:
  const handleMenuClick = (notebook) => {
    setMenuAnchorEl(notebook.id); // Assuming notebook has an id
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleDeleteClick = (notebook) => {
    setNotebookToDelete(notebook);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (notebookToDelete) {
      try {
        await deleteNotebook(
          String(user.uid),
          String(notebookToDelete.classId)
        );

        setNotebooks(
          notebooks.filter((n) => n.classId !== notebookToDelete.classId)
        );

        // For React Native, use Alert instead of a custom dialog
        Alert.alert("Notebook deleted successfully");
        setNotebookToDelete(null);
      } catch (error) {
        console.error("Error deleting the notebook:", error);
        Alert.alert("Error", "Failed to delete the notebook");
      }
    }
  };

  const handleDialogOpen = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleAddNewNotebook = () => {
    if (newNotebookName.trim()) {
      setNotebooks([...notebooks, { name: newNotebookName }]);
      setNewNotebookName("");
      handleDialogClose();
    }
  };
  const handleCreateClass = async () => {
    console.log("handleCreateClass called with:", newNotebookName);

    if (newNotebookName) {
      try {
        await createClass(String(user.uid), newNotebookName);
        console.log("Class created successfully");

        setNotebooks((prevClasses) => [
          ...prevClasses,
          { name: newNotebookName },
        ]);
        setNewNotebookName("");
        setIsDialogOpen(false);
      } catch (error) {
        console.error("Error creating class:", error);
        Alert.alert("Error", "Failed to create class");
      }
    } else {
      console.log("No class name provided");
    }
  };

  useEffect(() => {
    async function fetchClasses() {
      if (user) {
        try {
          const userClasses = await getAllClassNames(user.uid);
          console.log("Fetched classes:", userClasses);

          if (userClasses && Array.isArray(userClasses)) {
            const liveNotebooks = userClasses
              .filter((c) => c.status === "live")
              .map((c) => ({
                name: c.className,
                status: c.status,
                classId: c.classId,
              }));

            setNotebooks([{ name: "Add New" }, ...liveNotebooks]);
          } else {
            console.error("Invalid data format received");
          }
        } catch (error) {
          console.error("Failed to fetch classes:", error);
        }
      } else {
        console.log("No user found");
      }
    }

    fetchClasses();
  }, [user, getAllClassNames]);

  const getNotebookStyle = (index) => ({
    // Define styles using React Native's styling system
    backgroundColor: colors[index % colors.length],
    // Other styles go here
  });

  const handleGoBack = () => {
    setOpenNotebook(null);
  };

  const renderDialog = (
    dialogTitle,
    dialogContent,
    confirmAction,
    confirmText,
    closeAction,
    isOpen
  ) => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isOpen}
        onRequestClose={closeAction}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{dialogTitle}</Text>
          <View style={styles.dialogContent}>{dialogContent}</View>
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={closeAction} style={styles.button}>
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmAction} style={styles.button}>
              <Text>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const styles = StyleSheet.create({
    backpack: {
      alignItems: "center",
      marginVertical: 20,
      marginHorizontal: 100,
    },
    notebooks: {
      marginVertical: 40,
      marginRight: 10,
      marginLeft: "20%",
      alignItems: "center",
      width: "70%",
      flexWrap: "wrap",
      flexDirection: "row",
      gap: 20,
    },
    notebook: {
      borderWidth: 3,
      borderColor: "black",
      padding: 20,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 200,
      width: 150,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      marginVertical: 5,
    },
    icon: (id, hoveredNotebook) => ({
      position: "absolute",
      top: 0,
      right: 5,
      display: hoveredNotebook === id ? "flex" : "none",
      fontSize: 30,
    }),
    addIcon: {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 36,
      fontWeight: "bold",
      textAlign: "center",
      position: "relative",
      top: -10,
    },
    newNotebook: {
      fontSize: 20,
      color: "black",
      marginLeft: 8,
      fontWeight: "normal",
    },
    plus: {
      margin: 0,
    },
  });

  const notebooksWithColor = notebooks.map((notebook, index) => ({
    ...notebook,
    color: colors[index % colors.length],
  }));
  return (
    <View>
      <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
        <Image
          source={BackpackImg}
          style={{
            height: 160,
            width: 160,
          }}
        />
      </TouchableOpacity>
      {openNotebook ? (
        <NotebookContent notebook={openNotebook} goBack={handleGoBack} />
      ) : (
        <View style={styles.notebooks}>
          {notebooks.map((notebook, index) => (
            <TouchableOpacity
              key={notebook.classId || index}
              style={getNotebookStyle(index)}
              onPress={() => {
                if (index !== 0) {
                  setOpenNotebook({
                    ...notebook,
                    color: getNotebookStyle(index).backgroundColor,
                  });
                } else {
                  handleDialogOpen();
                }
              }}
            >
              <Image source={Spiral} style={styles.spiralImage} />
              {index !== 0 && (
                <>
                  <MoreVertIcon
                    onPress={(e) => handleMenuClick(e, notebook)}
                    style={
                      {
                        // Add styles for MoreVertIcon if needed
                      }
                    }
                  />
                  <Menu
                    anchorEl={menuAnchorEl}
                    visible={openMenu}
                    onRequestClose={handleMenuClose}
                  >
                    <MenuItem
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRenameClick(e, notebook);
                      }}
                    >
                      Rename
                    </MenuItem>
                    <MenuItem
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(e, notebook);
                      }}
                    >
                      Delete
                    </MenuItem>
                  </Menu>
                </>
              )}
              {index !== 0 && (
                <Text style={styles.notebookTitle}>{notebook.name}</Text>
              )}
              {index === 0 && (
                <View style={styles.addIcon}>
                  <Text style={styles.plus}>+</Text>
                  <Text style={styles.newNotebook}>New Notebook</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
      {/* Dialog for creation */}
      {renderDialog(
        "Add New Notebook",
        <TextInput
          style={styles.textField}
          autoFocus
          placeholder="Notebook Name"
          value={newNotebookName}
          onChangeText={setNewNotebookName}
        />,
        handleCreateClass,
        "Add",
        handleDialogClose,
        isDialogOpen
      )}

      {/* Confirmation dialog for deletion */}
      {renderDialog(
        "Confirm Deletion",
        <Text>Are you sure you want to delete this notebook?</Text>,
        handleDeleteConfirm,
        "Delete",
        () => setDeleteDialogOpen(false),
        deleteDialogOpen
      )}

      {/* Dialog for renaming */}
      {renderDialog(
        "Rename Notebook",
        <TextInput
          style={styles.textField}
          autoFocus
          placeholder="New Notebook Name"
          value={renamedNotebookName}
          onChangeText={setRenamedNotebookName}
        />,
        handleRenameConfirm,
        "Rename",
        () => setRenameDialogOpen(false),
        renameDialogOpen
      )}
    </View>
  );
}
