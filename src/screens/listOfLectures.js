import React, { useState, useEffect, useRef } from "react";
import { useRoute } from "@react-navigation/native";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Modal,
  TextInput,
  Button,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Animated, Dimensions } from "react-native";
import { Keyboard } from "react-native";
import { PanResponder } from "react-native";
import { useAuth } from "../context/authContext";
import { getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLayoutEffect } from "react";

// Image assets
const BackpackImg = require("../../assets/unzippedBackpackBlue.png");
import uuid from "react-native-uuid";

// Main screen component that renders notebooks in a grid
const ListOfLectures = ({ navigation }) => {
  const route = useRoute();
  const { notebook } = route.params;
  const thisNotebook = notebook;
  const [openNotebook, setOpenNotebook] = useState(null);
  const [notebooks, setNotebooks] = useState([]);
  const [isDeleteSheetVisible, setIsDeleteSheetVisible] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState(null);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [aPopUpIsVisible, setAPopupIsVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: notebook.name,
    });
  }, []);

  const auth = getAuth();
  const { editLectureName, createLecture, getAllLectureNames, deleteLecture } =
    useAuth();

  const [user, setUser] = useState(null);
  useEffect(() => {
    // Fetching user data
    const fetchUser = async () => {
      try {
        console.log("new fetch");
        const firebaseUser = auth.currentUser;
        const googleUser = await AsyncStorage.getItem("user");

        if (firebaseUser) {
          return firebaseUser;
        } else if (googleUser) {
          return JSON.parse(googleUser);
        } else {
          console.log("No users found");
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchUser().then((potentialUser) => {
      setUser(potentialUser);
    });
  }, []); // Empty dependency array to run only on component mount

  useEffect(() => {
    // Fetching classes when user changes
    async function fetchClasses() {
      if (user) {
        try {
          const userClasses = await getAllLectureNames(
            user.email,
            notebook.classId
          );
          console.log("Fetched Lectures:", userClasses);
          if (userClasses && Array.isArray(userClasses)) {
            // Filter to only include "live" notebooks and prepend the "Add New" notebook
            const liveNotebooks = userClasses
              .filter((c) => c.status === "live") // Filter for live notebooks
              .map((l) => ({
                lectureName: l.lectureName,
                status: l.status,
                lectureId: l.lectureId,
                abbrevDate: l.abbrevDate,
                className: l.className,
                classId: l.classId,
              }));

            setNotebooks([...liveNotebooks]);
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
  }, [user]);

  const onNotebookPress = (notebook) => {};

  const [renameSheetVisible, setRenameSheetVisible] = useState(false);
  const [currentNotebookName, setCurrentNotebookName] = useState("");

  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const bottomSheetHeight = 150; // Adjust as needed
  const windowHeight = Dimensions.get("window").height;
  const bottomSheetPosition = useRef(
    new Animated.Value(-bottomSheetHeight)
  ).current;

  const addNewNotebook = () => {
    showBottomSheet(); // Show the bottom sheet when adding a new notebook
  };

  const handleDeletePress = (notebook) => {
    console.log("Deleting notebook:", notebook.lectureName); // Debugging log
    setNotebookToDelete(notebook);
    setIsDeleteSheetVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (notebookToDelete) {
      try {
        await deleteLecture(
          String(user.email),
          String(thisNotebook.classId),
          String(notebookToDelete.lectureId)
        );
        setNotebooks(
          notebooks.filter((n) => n.lectureId !== notebookToDelete.lectureId)
        );

        setDeleteDialogOpen(false);
        setNotebookToDelete(null);
      } catch (error) {
        console.error("Error deleting the notebook:", error);
        // Optionally, show an error message to the user
      }
    }
  };

  const handleNotebookDelete = async (notebook) => {
    try {
      await deleteLecture(
        String(user.email),
        String(thisNotebook.classId),
        String(notebook.lectureId)
      );
      setNotebooks(notebooks.filter((n) => n.lectureId !== notebook.lectureId));
      setIsDeleteSheetVisible(false);
    } catch (error) {
      console.error("Error deleting the notebook:", error);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteSheetVisible(false);
  };

  const handleRenamePress = (notebook) => {
    setCurrentNotebookName({
      lectureName: notebook.lectureName,
      lectureId: notebook.lectureId,
      classId: notebook.classId,
    });
    setRenameSheetVisible(true);
  };

  const handleRenameSubmit = async (newName, lectureId) => {
    // Check if classId is provided
    if (lectureId) {
      try {
        // Call editNotebookName with classId
        await editLectureName(
          String(user.email),
          String(thisNotebook.classId),
          String(lectureId),
          newName
        );
        // Update the notebook name in the state
        setNotebooks(
          notebooks.map((n) =>
            n.lectureId === lectureId ? { ...n, lectureName: newName } : n
          )
        );
        setRenameSheetVisible(false);
      } catch (error) {
        console.error("Error renaming the notebook:", error);
      }
    }
    setRenameSheetVisible(false);
  };

  const handleCancelRename = () => {
    setRenameSheetVisible(false);
    Keyboard.dismiss();
    setRenameSheetVisible(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        if (gestureState.dy > 0) {
          // If dragging down
          bottomSheetPosition.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (event, gestureState) => {
        if (gestureState.dy > 50) {
          // If dragged down significantly
          hideBottomSheet();
        } else {
          // If not dragged down significantly
          Animated.spring(bottomSheetPosition, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        Animated.timing(bottomSheetPosition, {
          toValue: e.endCoordinates.height, // Move the bottom sheet up by the keyboard height
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardHideListener = Keyboard.addListener("keyboardDidHide", () => {
      Animated.timing(bottomSheetPosition, {
        toValue: 0, // Move the bottom sheet back down
        duration: 300,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      // Clean up listeners
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  const showBottomSheet = () => {
    setIsBottomSheetVisible(true);
    Animated.timing(bottomSheetPosition, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const hideBottomSheet = () => {
    Animated.timing(bottomSheetPosition, {
      toValue: -bottomSheetHeight,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setIsBottomSheetVisible(false);
      Keyboard.dismiss(); // Dismiss the keyboard when the bottom sheet is hidden
    });
  };

  const getAbbreviatedDate = () => {
    const now = new Date();
    const year = now.getFullYear().toString().substr(-2);
    const month = now.toLocaleString("default", { month: "short" });
    const day = now.getDate();

    return `${month} ${day}, '${year}`;
  };

  const addNotebook = async () => {
    console.log("handleCreateClass called with:", newNotebookName); // Debugging output

    if (newNotebookName) {
      // Ensure we are using the correct state variable
      try {
        const lectureId = uuid.v4();
        const abbrevDate = getAbbreviatedDate();
        const newLecture = {
          lectureName: newNotebookName,
          status: "live",
          lectureId: lectureId,
          abbrevDate: abbrevDate,
          className: notebook.name,
          lectureId,
        };
        await createLecture(
          String(user.email),
          String(thisNotebook.classId),
          thisNotebook.name,
          newNotebookName,
          abbrevDate,
          lectureId
        );
        console.log("Lecture created successfully"); // Debugging output

        setNotebooks((prevClasses) => [...prevClasses, newLecture]);
        setNewNotebookName("");
        hideBottomSheet();
      } catch (error) {
        console.error("Error creating class:", error);
        // Optionally, show an error message to the user
      }
    } else {
      console.log("No class name provided"); // Debugging output
    }
  };

  const handleGoBack = () => {
    navigation.navigate("ListOfNotebooks");
    setOpenNotebook(null);
  };

  const fullWidth = Dimensions.get("window").width;
  const calcPaddingLeft = (fullWidth - 335) / 2;

  const contentContainerStyles = new StyleSheet.create({
    contentContainer: {
      paddingTop: 20,
      marginTop: 0, // Make room for the backpack image
      paddingBottom: 90,
      paddingHorizontal: 12,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "start",
      alignItems: "center",
      gap: 15,
      paddingLeft: calcPaddingLeft,
    },
  });

  const PlusIcon = () => <Text style={styles.plusIcon}>+</Text>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container]}>
        <ScrollView
          contentContainerStyle={[contentContainerStyles.contentContainer]}
        >
          {!openNotebook && (
            <TouchableOpacity
              style={styles.newLectureButton}
              onPress={addNewNotebook}
            >
              <Text style={styles.plusIcon}>+</Text>
              <Text style={styles.newLectureText}>New Lecture</Text>
            </TouchableOpacity>
          )}
          {openNotebook ? (
            <Text></Text>
          ) : (
            notebooks.map((notebook, index) => (
              <Lecture
                key={index}
                title={notebook.lectureName}
                classId={notebook.lectureId}
                onPress={() => onNotebookPress(notebook)}
                onRenamePress={() => handleRenamePress(notebook)}
                onDeletePress={() => handleDeletePress(notebook)}
                backgroundColor={colors[index % colors.length]}
                abbrevDate={notebook.abbrevDate}
                setAPopupIsVisible={setAPopupIsVisible}
                aPopUpIsVisible={aPopUpIsVisible}
              />
            ))
          )}
        </ScrollView>
      </View>
      {isBottomSheetVisible && (
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={hideBottomSheet}
        />
      )}
      {renameSheetVisible && (
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={handleCancelRename}
        />
      )}
      {isDeleteSheetVisible && (
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={handleCancelDelete}
        />
      )}
      {aPopUpIsVisible && (
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={() => {
            setAPopupIsVisible(false);
          }}
        />
      )}
      {isBottomSheetVisible && (
        <Animated.View
          style={[styles.bottomSheet, { bottom: bottomSheetPosition }]}
          {...panResponder.panHandlers}
        >
          <TextInput
            style={styles.input}
            placeholder="Enter lecture name"
            value={newNotebookName}
            onChangeText={setNewNotebookName}
          />
          <TouchableOpacity onPress={addNotebook} style={styles.addButton}>
            <Text style={styles.buttonText}>Add Lecture</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      {renameSheetVisible && (
        <RenameBottomSheet
          isVisible={renameSheetVisible}
          initialName={currentNotebookName.name}
          onRenameSubmit={(newName) =>
            handleRenameSubmit(newName, currentNotebookName.lectureId)
          }
          onCancel={handleCancelRename}
          setRenameSheetVisible={setRenameSheetVisible}
        />
      )}
      {isDeleteSheetVisible && (
        <DeleteBottomSheet
          isVisible={isDeleteSheetVisible}
          notebookToDelete={notebookToDelete}
          onDeleteConfirm={handleNotebookDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </SafeAreaView>
  );
};

const Popup = ({ isVisible, position, onRename, onDelete }) => {
  if (!isVisible) return null;
  return (
    <View style={[styles.popup, { top: position.y, left: position.x }]}>
      <TouchableOpacity onPress={onRename}>
        <Text style={styles.popupText}>Rename</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete}>
        <Text style={styles.popupText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
};

const Overlay = ({ isVisible, onPress }) => {
  if (!isVisible) return null;
  return (
    <TouchableOpacity
      style={StyleSheet.absoluteFillObject}
      activeOpacity={1}
      onPress={onPress}
    />
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
    flexDirection: "column",
    justifyContent: "center",
  },
  backpack: {
    position: "absolute",
    top: 0, // Adjust as needed for positioning
    left: 10, // Adjust as needed for positioning
    width: 80, // Adjust size as needed
    height: 80, // Adjust size as needed
    resizeMode: "contain",
    zIndex: 10,
  },

  notebook: {
    width: 120, // Approximate width for 2 columns
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "black",
    position: "relative",
    height: 160,
    paddingHorizontal: 10,
  },
  notebookTouchable: {
    width: 120, // Ensure the touchable area does not exceed the notebook size
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1, // Ensure the touchable area is above the spiral image
    borderWidth: 1,
  },
  spiralMask: {
    position: "absolute",
    left: -14, // Keep the right edge aligned with the notebook
    top: 10, // Align with the top of the notebook
    height: 140, // Height of the spiral
    width: 30, // Mask is the full width of the notebook
  },
  spiral: {
    position: "absolute",
    left: 0, // Adjust this value so the spiral image extends slightly to the left
    width: 30, // Width of the spiral image
    height: 140, // Height of the spiral image
    resizeMode: "contain",
    zIndex: 0, // Lower zIndex to ensure touches on the spiral are not registered
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
    flexDirection: "column", // Align plus icon and text in a row
    alignItems: "center", // Center items vertically
    justifyContent: "center",
    marginTop: 0, // Spacing from the top edge
    textAlign: "center",
    padding: 20,
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "rgb(240,240,240)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  addButton: {
    backgroundColor: "#4630EB", // Deep blue background
    padding: 16, // Padding for size
    borderRadius: 5, // Rounded corners
    alignItems: "center", // Center content horizontally
    justifyContent: "center", // Center content vertically
    height: 50, // Fixed height for uniformity
    marginBottom: 10, // Margin at the bottom
  },
  buttonText: {
    color: "#FFFFFF", // White text
    fontSize: 16, // Font size
  },
  input: {
    borderWidth: 1, // Border width
    borderColor: "#ccc", // Light gray border
    borderRadius: 5, // Rounded corners
    padding: 16, // Padding inside the input
    marginBottom: 16, // Margin at the bottom
    backgroundColor: "#FFF", // White background color
  },

  popup: {
    position: "absolute",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 4,
    padding: 10,
    zIndex: 2,
  },
  popupText: {
    fontSize: 16,
    color: "black",
    padding: 8,
  },
  renameBottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgb(240,240,240)",
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: 200,
  },
  deleteBottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgb(240,240,240)",
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: 170,
  },
  renameInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  deleteText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  newLectureButton: {
    textAlign: "center",
    width: 160, // Approximately two items per row
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 0,
    borderRadius: 8,
    backgroundColor: "#ffffff", // Assuming a white background for the button
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // for Android
    marginBottom: 10,
  },
  lectureItem: {
    width: 160, // Approximately two items per row
    height: 80,
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    margin: 0,
    marginBottom: 0,
    position: "relative", // Added to position children absolutely
  },
  lectureDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  lectureName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 24, // Adjusted to prevent overlap with the ellipsis icon
  },
  lectureNameDiv: {
    lectureNameDiv: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      margin: 0,
    },
  },
  lectureClick: {
    width: 160, // Approximately two items per row
    height: 80,
  },
  menuIcon: {
    position: "absolute",
    bottom: 28,
    right: 2,
  },
});

export default ListOfLectures;

const RenameBottomSheet = ({
  isVisible,
  onRenameSubmit,
  onCancel,
  initialName,
  setRenameSheetVisible,
}) => {
  const [newName, setNewName] = useState(initialName);
  const translateY = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current;

  const show = (keyboardHeight = 0) => {
    Animated.timing(translateY, {
      toValue: -keyboardHeight,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hide = () => {
    Animated.timing(translateY, {
      toValue: Dimensions.get("window").height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onCancel();
      Keyboard.dismiss(); // Dismiss the keyboard when the rename bottom sheet is hidden
      setRenameSheetVisible(false);
    });
  };

  useEffect(() => {
    if (isVisible) {
      setNewName(initialName);
      show();
    } else {
      hide();
    }

    const keyboardShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        show(e.endCoordinates.height);
      }
    );

    const keyboardHideListener = Keyboard.addListener("keyboardDidHide", () => {
      show(0);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [isVisible, initialName]);

  const handleSubmit = () => {
    onRenameSubmit(newName);
    setRenameSheetVisible(false);
  };

  return (
    <Animated.View
      style={[styles.renameBottomSheet, { transform: [{ translateY }] }]}
    >
      <TextInput
        style={styles.input}
        placeholder="New lecture name"
        value={newName}
        onChangeText={setNewName}
      />
      <TouchableOpacity onPress={handleSubmit} style={styles.addButton}>
        <Text style={styles.buttonText}>Rename</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const DeleteBottomSheet = ({
  isVisible,
  notebookToDelete,
  onDeleteConfirm,
  onCancel,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;

  const show = () => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hide = () => {
    Animated.timing(translateY, {
      toValue: Dimensions.get("window").height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onCancel();
    });
  };

  useEffect(() => {
    isVisible ? show() : hide();
  }, [isVisible]);

  const handleDeleteConfirm = () => {
    onDeleteConfirm(notebookToDelete);
    hide();
  };

  return (
    <Animated.View
      style={[styles.deleteBottomSheet, { transform: [{ translateY }] }]}
    >
      <Text style={styles.deleteText}>
        Are you sure you want to delete this lecture?
      </Text>
      <TouchableOpacity onPress={handleDeleteConfirm} style={styles.addButton}>
        <Text style={styles.buttonText}>Delete</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Define a single Notebook component
const Lecture = ({
  title,
  onPress,
  backgroundColor,
  onRenamePress,
  onDeletePress,
  classId,
  abbrevDate,
  setAPopupIsVisible,
  aPopUpIsVisible,
}) => {
  const [clicked, setClicked] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const handlePress = () => {
    console.log("Notebook pressed", title); // Add this line to log
    if (!clicked) {
      onPress();
      setClicked(true);
      setTimeout(() => setClicked(false), 300);
    }
  };
  const closePopup = () => {
    setAPopupIsVisible(false);
    setPopupVisible(false);
  };

  const handleMenuPress = (event) => {
    // Prevent event from bubbling up
    event.stopPropagation();

    // Dimensions of the popup
    const popupWidth = 150; // Adjust according to the popup's width
    const popupHeight = 60; // Adjust according to the popup's height

    // Position of the menu icon within the notebook
    const menuIconX = styles.menuIcon.right;
    const menuIconY = styles.menuIcon.bottom;

    // Dimensions of the notebook
    const notebookWidth = styles.lectureItem.width;
    const notebookHeight = styles.lectureItem.height;

    // Calculate the position for the popup
    const adjustedX = notebookWidth - menuIconX - popupWidth / 2 - 10;
    const adjustedY = menuIconY + notebookHeight / 2 - popupHeight + 50;

    // Set the position state
    setPopupPosition({ x: adjustedX, y: adjustedY });
    setAPopupIsVisible(!aPopUpIsVisible);
    setPopupVisible(!popupVisible);
  };

  useEffect(() => {
    if (aPopUpIsVisible === false) {
      closePopup();
    }
  }, [aPopUpIsVisible]);

  const handleRename = () => {
    onRenamePress(title);
    setPopupVisible(false);
  };

  const handleDelete = () => {
    onDeletePress(); // Invoke the onDeletePress passed from the parent
    setPopupVisible(false);
  };

  return (
    <View key={classId} style={styles.lectureItem}>
      <Text style={styles.lectureDate}>{abbrevDate}</Text>
      <Text style={styles.lectureName} numberOfLines={2}>
        {title}
      </Text>
      <TouchableOpacity style={styles.menuIcon} onPress={handleMenuPress}>
        <Ionicons name="ellipsis-vertical" size={24} color="black" />
      </TouchableOpacity>
      <Popup
        isVisible={popupVisible}
        position={popupPosition}
        onRename={handleRename}
        onDelete={handleDelete}
      />
    </View>
  );
};

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
