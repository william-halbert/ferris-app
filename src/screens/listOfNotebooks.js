import React, { useState, useEffect, useRef } from "react";
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
import ListOfLectures from "./listOfLectures";
import { app } from "../../firebaseConfig";
import { useLayoutEffect } from "react";

// Image assets
const Spiral = require("../../assets/spiral.png");
const BackpackImg = require("../../assets/unzippedBackpackBlue.png");
import AsyncStorage from "@react-native-async-storage/async-storage";

// Main screen component that renders notebooks in a grid
const ListOfNotebooks = ({ navigation }) => {
  const [openNotebook, setOpenNotebook] = useState(null);
  const [notebooks, setNotebooks] = useState([]);
  const [isDeleteSheetVisible, setIsDeleteSheetVisible] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState(null);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [userPopupVisbile, setUserPopupVisible] = useState(false);
  const [aPopUpIsVisible, setAPopupIsVisible] = useState(false);

  const auth = getAuth(app);
  const {
    createClass,
    getAllClassNames,
    deleteNotebook,
    editNotebookName,
    getUser,
  } = useAuth();

  const toggleUserPopup = () => {
    setUserPopupVisible((prevState) => !prevState);
  };

  const openUserPopup = () => {
    setUserPopupVisible(true);
  };

  const closeUserPopup = () => {
    setUserPopupVisible(false);
  };

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
      console.log(potentialUser);
    });
  }, []); // Empty dependency array to run only on component mount

  useEffect(() => {
    // Fetching classes when user changes
    const fetchClasses = async () => {
      if (user) {
        try {
          console.log("new fetch");
          const userClasses = await getAllClassNames(user.email);
          if (userClasses && Array.isArray(userClasses)) {
            const liveNotebooks = userClasses
              .filter((c) => c.status === "live")
              .map((c) => ({
                name: c.className,
                status: c.status,
                classId: c.classId,
              }));

            setNotebooks([...liveNotebooks]);
          } else {
            console.error("Invalid data format received");
          }
        } catch (error) {
          console.error("Failed to fetch classes:", error);
        }
      } else {
        console.log("No user found to fetch notebooks");
      }
    };

    fetchClasses();
  }, [user]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Image
          source={require("../../assets/ferrisFace.png")}
          style={{ width: 45, height: 45, position: "relative", top: -5 }}
        />
      ),
      headerLeft: () => (
        <TouchableOpacity>
          <Image
            source={require("../../assets/unzippedBackpackBlue.png")}
            style={{
              marginLeft: 15,
              width: 37,
              height: 37,
              position: "relative",
              top: -5,
            }}
          />
        </TouchableOpacity>
      ),
      headerRight: () =>
        user && (
          <TouchableOpacity
            onPress={() => toggleUserPopup(userPopupVisbile)}
            style={{
              marginRight: 15,
              width: 35,
              height: 35,
              borderRadius: 30,
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              top: -5,
              borderWidth: user.picture ? 0 : 2,
              borderColor: user.picture ? "white" : "#FF65A3",
              backgroundColor: "white",
            }}
          >
            {user.picture ? (
              <Image
                source={{ uri: user.picture }}
                style={{ width: 30, height: 30, borderRadius: 30 }}
              />
            ) : (
              <Text style={{ color: "#FF65A3", fontWeight: "bold" }}>
                {user.email.charAt(0).toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        ),
    });
  }, [user]);

  const onNotebookPress = (notebook) => {
    navigation.navigate("ListOfLectures", { notebook });
  };

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
    console.log("Deleting notebook:", notebook.name); // Debugging log
    setNotebookToDelete(notebook);
    setIsDeleteSheetVisible(true);
  };

  const handleNotebookDelete = async (notebook) => {
    try {
      console.log("user", String(user.email));
      console.log("classId", String(notebook.classId));

      await deleteNotebook(String(user.email), String(notebook.classId));
      setNotebooks(notebooks.filter((n) => n.classId !== notebook.classId));
      setIsDeleteSheetVisible(false);
    } catch (error) {
      console.error("Error deleting the notebook:", error);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteSheetVisible(false);
  };

  const handleRenamePress = (notebook) => {
    setCurrentNotebookName({ name: notebook.name, classId: notebook.classId });
    setRenameSheetVisible(true);
  };

  const handleRenameSubmit = async (newName, classId) => {
    // Check if classId is
    if (classId) {
      try {
        // Call editNotebookName with classId
        console.log("user", String(user.email));
        console.log("classid:", String(classId));
        console.log("newName:", newName);

        await editNotebookName(String(user.email), String(classId), newName);

        // Update the notebook name in the state
        setNotebooks(
          notebooks.map((n) =>
            n.classId === classId ? { ...n, name: newName } : n
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

  const addNotebook = async () => {
    console.log("handleCreateClass called with:", newNotebookName); // Debugging output

    if (newNotebookName) {
      // Ensure we are using the correct state variable
      try {
        await createClass(String(user.email), newNotebookName); // Create class
        console.log("Class created successfully"); // Debugging output

        setNotebooks((prevClasses) => [
          ...prevClasses,
          { name: newNotebookName },
        ]);
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
    console.log("handleGoBack called");

    setOpenNotebook(null);
  };

  const fullWidth = Dimensions.get("window").width;
  const calcPaddingLeft = (fullWidth - 290) / 2;

  const contentContainerStyles = new StyleSheet.create({
    contentContainer: {
      paddingTop: 20,
      marginTop: 0, // Make room for the backpack image
      paddingBottom: 90,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "start",
      alignItems: "center",
      gap: 50,
      paddingLeft: calcPaddingLeft,
    },
  });

  const PlusIcon = () => <Text style={styles.plusIcon}>+</Text>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <ScrollView
            contentContainerStyle={[contentContainerStyles.contentContainer]}
          >
            {!openNotebook && (
              <View style={[styles.notebook, { backgroundColor: "white" }]}>
                <TouchableOpacity
                  onPress={addNewNotebook}
                  style={styles.notebookTouchable}
                >
                  <View style={styles.newNotebookContent}>
                    <Text style={styles.plusIcon}>+</Text>
                    <Text style={styles.newNotebookText}>New Notebook</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.spiralMask}>
                  <Image source={Spiral} style={styles.spiral} />
                </View>
              </View>
            )}
            {openNotebook ? (
              <ListOfLectures notebook={openNotebook} />
            ) : (
              notebooks.map((notebook, index) => (
                <Notebook
                  key={index}
                  title={notebook.name}
                  classId={notebook.classId}
                  onPress={() => onNotebookPress(notebook)}
                  onRenamePress={() => handleRenamePress(notebook)}
                  onDeletePress={() => handleDeletePress(notebook)}
                  backgroundColor={colors[index % colors.length]}
                  setAPopupIsVisible={setAPopupIsVisible}
                  aPopUpIsVisible={aPopUpIsVisible}
                />
              ))
            )}
          </ScrollView>
        </View>
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
      {userPopupVisbile && (
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={() => {
            setUserPopupVisible(false);
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
            placeholder="Enter notebook name"
            value={newNotebookName}
            onChangeText={setNewNotebookName}
          />
          <TouchableOpacity onPress={addNotebook} style={styles.addButton}>
            <Text style={styles.buttonText}>Add Notebook</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      {renameSheetVisible && (
        <RenameBottomSheet
          isVisible={renameSheetVisible}
          initialName={currentNotebookName.name}
          onRenameSubmit={(newName) =>
            handleRenameSubmit(newName, currentNotebookName.classId)
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
      {userPopupVisbile && <UserPopup isVisible={userPopupVisbile} />}
    </SafeAreaView>
  );
};

const Popup = ({ isVisible, position, onRename, onDelete }) => {
  if (!isVisible) return null;
  return (
    <View style={[styles.popup, { top: position.y, left: position.x }]}>
      <TouchableOpacity onPress={onRename} style={styles.topPopupText}>
        <Text style={styles.PopupText}>Rename</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.bottomPopupText}>
        <Text style={styles.PopupText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
};

const UserPopup = ({ isVisible, onLogout, onDeleteAccount }) => {
  if (!isVisible) return null;
  return (
    <View style={[styles.userPopup]}>
      <TouchableOpacity onPress={() => {}} style={styles.topPopupText}>
        <Text style={styles.PopupText}>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => {}} style={styles.bottomPopupText}>
        <Text style={styles.PopupText}>Delete Account</Text>
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
  userPopup: {
    width: 130,
    position: "absolute",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 4,
    padding: 0,
    zIndex: 2,
    textAlign: "center",
    top: 3, // Adjust if needed
    right: 3, // Adjust if needed
  },

  notebook: {
    width: 120, // Approximate width for 2 columns
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 0,
    borderWidth: 1,
    borderColor: "black",
    position: "relative",
    height: 160,
  },
  notebookTouchable: {
    width: 120, // Ensure the touchable area does not exceed the notebook size
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1, // Ensure the touchable area is above the spiral image
    borderWidth: 1,
    paddingHorizontal: 10,
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
    textAlign: "center",
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
    padding: 0,
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
    zIndex: 5,
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
  menuIcon: {
    position: "absolute",
    top: 10,
    right: 4,
    zIndex: 2, // Ensure the icon is above other elements
  },
  popup: {
    width: 100,
    position: "absolute",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 4,
    padding: 0,
    zIndex: 2,
    textAlign: "center",
  },
  topPopupText: {
    fontSize: 16,
    color: "black",
    padding: 8,
    borderBottomColor: "black",
    borderTopColor: "black",
    borderTopWidth: 0,
    borderBottomWidth: 0.5,
    width: "100%",
    textAlign: "center",
    padding: 10,
  },
  PopupText: { textAlign: "center" },
  bottomPopupText: {
    fontSize: 16,
    color: "black",
    padding: 8,
    borderBottomColor: "black",
    borderTopColor: "black",
    borderTopWidth: 0.5,
    borderBottomWidth: 0,
    textAlign: "center",
    padding: 10,
    width: "100%",
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
});

export default ListOfNotebooks;

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
        placeholder="New notebook name"
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
        Are you sure you want to delete this notebook?
      </Text>
      <TouchableOpacity onPress={handleDeleteConfirm} style={styles.addButton}>
        <Text style={styles.buttonText}>Delete</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Define a single Notebook component
const Notebook = ({
  style,
  title,
  onPress,
  backgroundColor,
  onRenamePress,
  onDeletePress,
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
    const menuIconY = styles.menuIcon.top;

    // Dimensions of the notebook
    const notebookWidth = styles.notebook.width;
    const notebookHeight = styles.notebook.height;

    // Calculate the position for the popup
    const adjustedX = notebookWidth - menuIconX - popupWidth / 2 + 10;
    const adjustedY = menuIconY + notebookHeight / 2 - popupHeight + 10;

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
    <View style={[styles.notebook, { backgroundColor }]}>
      <TouchableOpacity onPress={onPress} style={styles.notebookTouchable}>
        <Text style={styles.notebookText}>{title}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuIcon} onPress={handleMenuPress}>
        <Ionicons name="ellipsis-vertical" size={24} color="black" />
      </TouchableOpacity>
      {popupVisible && (
        <Overlay isVisible={popupVisible} onPress={closePopup} />
      )}
      <Popup
        isVisible={popupVisible}
        position={popupPosition}
        onRename={handleRename}
        onDelete={handleDelete}
      />

      <View style={styles.spiralMask}>
        <Image source={Spiral} style={styles.spiral} />
      </View>
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
