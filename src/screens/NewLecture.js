import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
  Button,
  Image,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { Ionicons } from "@expo/vector-icons";
import { Animated, Dimensions } from "react-native";
import { Keyboard } from "react-native";
import { PanResponder } from "react-native";
import { useAuth } from "../context/authContext";
import { getAuth } from "firebase/auth";
import ListOfLectures from "./listOfLectures";
import { app } from "../../firebaseConfig";
import { useLayoutEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";

const NewLecture = ({ navigation, route }) => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);
  const [notebooks, setNotebooks] = useState([]);
  const [user, setUser] = useState(null);
  const auth = getAuth(app);
  const [newName, setNewName] = useState("");
  const [userPopupVisbile, setUserPopupVisible] = useState(false);
  const [userType, setUserType] = useState("");
  const [isDeleteAccountSheetVisible, setIsDeleteAccountSheetVisible] =
    useState(false);

  const handleCancelDeleteAccount = () => {
    setIsDeleteAccountSheetVisible(false);
  };

  const handleDeleteAccountPress = () => {
    setIsDeleteAccountSheetVisible(true);
    setUserPopupVisible(false);
  };

  const handleLogout = async () => {
    console.log("logout pressed");
    let result;
    if (userType) {
      result = await logout(userType);
    }
    if (result === "success") {
    }
  };

  const handleDeleteAccount = async () => {
    console.log("delete account pressed");

    let result;
    if (userType && user.email) {
      console.log("email and user type received", user.email, userType);
      //result = await deleteAccount(user, user.email, userType);
    }
    if (result === "success") {
    }
  };

  const toggleUserPopup = () => {
    setUserPopupVisible((prevState) => !prevState);
  };

  React.useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: "unset" },
    });
  }, [navigation, route]);

  const openUserPopup = () => {
    setUserPopupVisible(true);
  };

  const closeUserPopup = () => {
    setUserPopupVisible(false);
  };

  const {
    createClass,
    getAllClassNames,
    deleteNotebook,
    editNotebookName,
    getUser,
    createLecture,
    createRawNotes,
    deleteAccount,
    logout,
  } = useAuth();

  useEffect(() => {
    // Fetching user data
    const fetchUser = async () => {
      try {
        console.log("new  user fetch, new lecture page");

        const firebaseUser = auth.currentUser;
        const googleUser = await AsyncStorage.getItem("user");

        if (firebaseUser) {
          setUserType("firebase");
          return firebaseUser;
        } else if (googleUser) {
          setUserType("google");
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
    const fetchClasses = async () => {
      if (user) {
        try {
          console.log("new classes fetch, new lecture page");
          const userClasses = await getAllClassNames(user.email);
          if (userClasses && Array.isArray(userClasses)) {
            const liveNotebooks = userClasses
              .filter((c) => c.status === "live")
              .map((c) => ({
                label: c.className,
                value: c.classId,
                name: c.className,
                classId: c.classId,
                status: c.status,
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
  }, [user, navigation, route]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Image
          source={require("../../assets/ferrisFace.png")}
          style={{ width: 40, height: 40, position: "relative", top: -5 }}
        />
      ),
      headerLeft: () => (
        <TouchableOpacity>
          <Image
            source={require("../../assets/unzippedBackpackBlue.png")}
            style={{
              marginLeft: 0,
              width: 37,
              height: 37,
              position: "relative",
              top: -3,
            }}
          />
        </TouchableOpacity>
      ),
      headerRight: () =>
        user && (
          <TouchableOpacity
            onPress={() => toggleUserPopup(userPopupVisbile)}
            style={{
              marginRight: 0,
              width: 35,
              height: 35,
              borderRadius: 30,
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              top: -3,
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

  const getAbbreviatedDate = () => {
    const now = new Date();
    const year = now.getFullYear().toString().substr(-2);
    const month = now.toLocaleString("default", { month: "short" });
    const day = now.getDate();

    return `${month} ${day}, '${year}`;
  };

  const handleContinue = async () => {
    try {
      if (value !== null) {
        const lectureId = uuid.v4();
        const rawNotesId = uuid.v4();
        const abbrevDate = getAbbreviatedDate();

        const filteredNotebook = notebooks.filter(
          (notebook) => String(notebook.value) == String(value)
        );
        console.log(value);
        console.log(filteredNotebook[0].value);
        const newLecture = {
          lectureName: "Untitled Lecture",
          status: "live",
          lectureId: lectureId,
          abbrevDate: abbrevDate,
          className: filteredNotebook[0].name,
          lectureId,
        };
        await createLecture(
          String(user.email),
          String(filteredNotebook[0].classId),
          filteredNotebook[0].name,
          "Untitled Lecture",
          abbrevDate,
          lectureId,
          rawNotesId
        );
        await createRawNotes(
          String(user.email),
          String(filteredNotebook[0].classId),
          lectureId,
          rawNotesId
        );
        console.log("Lecture created successfully"); // Debugging output

        navigation.navigate("Lecture", {
          email: user.email,
          notebook: filteredNotebook[0],
          classId: filteredNotebook[0].classId,
          lectureId: lectureId,
          lectureName: "Untitled Lecture",
          abbrevDate: abbrevDate,
          rawNotesId: rawNotesId,
        });
      }
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Dropdown
          style={[styles.dropdown, isFocus && { borderColor: "blue" }]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={notebooks}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={"Select notebook"}
          value={value}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={(item) => {
            setValue(item.value);
            setIsFocus(false);
          }}
        />
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue to lecture</Text>
        </TouchableOpacity>
      </View>
      {userPopupVisbile && (
        <UserPopup
          isVisible={userPopupVisbile}
          handleLogout={handleLogout}
          handleDeletePress={handleDeleteAccountPress}
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
      {isDeleteAccountSheetVisible && (
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={handleCancelDeleteAccount}
        />
      )}
      {isDeleteAccountSheetVisible && (
        <DeleteAccountBottomSheet
          isVisible={isDeleteAccountSheetVisible}
          onDeleteConfirm={handleDeleteAccount}
          onCancel={handleCancelDeleteAccount}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    backgroundColor: "white",
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
  button: {
    width: 250,
    marginTop: 30,
    backgroundColor: "#4630EB",
    padding: 16,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
    top: -50,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  dropdown: {
    width: 250,
    borderWidth: 2,
    borderColor: "#4630EB",
    padding: 10,
    borderRadius: 5,
    position: "relative",
    top: -50,
  },
  input: {
    width: 250,
    marginTop: 30,
    borderColor: "#4630EB",
    borderWidth: 2,
    padding: 16,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
    color: "black", // Set text color to black
    fontSize: 16, // Set font size to 16pt
    position: "relative",
    top: -50,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "white", // Set the background color
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
  PopupText: { textAlign: "center" },
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
  deleteText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
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
});

export default NewLecture;

const UserPopup = ({ isVisible, handleLogout, handleDeletePress }) => {
  if (!isVisible) return null;
  return (
    <View style={[styles.userPopup]}>
      <TouchableOpacity onPress={handleLogout} style={styles.topPopupText}>
        <Text style={styles.PopupText}>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleDeletePress}
        style={styles.bottomPopupText}
      >
        <Text style={styles.PopupText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
};

///Add a bottom thing for delete account
///logout and delete account need user credentials

const DeleteAccountBottomSheet = ({ isVisible, onDeleteConfirm, onCancel }) => {
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
    onDeleteConfirm();
    hide();
  };

  return (
    <Animated.View
      style={[styles.deleteBottomSheet, { transform: [{ translateY }] }]}
    >
      <Text style={styles.deleteText}>
        Are you sure you want to delete your account?
      </Text>
      <TouchableOpacity onPress={handleDeleteConfirm} style={styles.addButton}>
        <Text style={styles.buttonText}>Delete</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
