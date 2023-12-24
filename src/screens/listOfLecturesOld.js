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
import Footer from "./Footer";
import { Animated, Dimensions } from "react-native";
import { Keyboard } from "react-native";
import { PanResponder } from "react-native";
import { useAuth } from "../context/authContext";
import { getAuth } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import uuid from "react-native-uuid";

// Image assets
const Spiral = require("../../assets/spiral.png");
const BackpackImg = require("../../assets/unzippedBackpackBlue.png");
const ClosedBackpack = require("../../assets/backpackBlue.png");

// Assuming 'lectures' will be passed as a prop with real data in the actual app

const ListOfLectures = ({ notebook }) => {
  const [openLecture, setOpenLecture] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [newLectureName, setNewLectureName] = useState("");
  const auth = getAuth();
  const { editLectureName, createLecture, getAllLectureNames, deleteLecture } =
    useAuth();
  const user = auth.currentUser;

  useEffect(() => {
    async function fetchClasses() {
      if (user) {
        try {
          const userLectures = await getAllLectureNames(
            user.uid,
            notebook.classId
          );
          console.log("Fetched lectures:", userLectures);
          if (userLectures && Array.isArray(userLectures)) {
            // Filter to only include "live" notebooks and prepend the "Add New" notebook
            const liveLectures = userLectures
              .filter((l) => l.status === "live") // Filter for live notebooks
              .map((l) => ({
                lectureName: l.lectureName,
                status: l.status,
                lectureId: l.lectureId,
                abbrevDate: l.abbrevDate,
                className: l.className,
                classId: l.classId,
              }));

            setLectures([...liveLectures]);
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
  }, [user, notebook, getAllLectureNames]);

  const onLecturePress = (lecture) => {
    setOpenLecture({
      ...lecture,
    });
  };

  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const bottomSheetHeight = 150; // Adjust as needed
  const windowHeight = Dimensions.get("window").height;
  const bottomSheetPosition = useRef(
    new Animated.Value(-bottomSheetHeight)
  ).current;

  const addNewLecture = () => {
    showBottomSheet(); // Show the bottom sheet when adding a new notebook
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

  const addLecture = async () => {
    console.log("handleCreateLecture called with:", newLectureName); // Debugging output

    if (newLectureName) {
      // Ensure we are using the correct state variable
      try {
        const lectureId = uuid.v4();
        const abbrevDate = getAbbreviatedDate();
        const newLecture = {
          lectureName: newLectureName,
          status: "live",
          lectureId: lectureId,
          abbrevDate: abbrevDate,
          className: notebook.name,
          lectureId,
        };
        await createLecture(
          String(user.uid),
          String(notebook.classId),
          notebook.name,
          newLectureName,
          abbrevDate,
          lectureId
        );
        console.log("Lecture created successfully"); // Debugging output

        setLectures((prevLectures) => [...prevLectures, newLecture]);
        setNewLectureName("");
        hideBottomSheet();
      } catch (error) {
        console.error("Error creating lecture:", error);
        // Optionally, show an error message to the user
      }
    } else {
      console.log("No lecture name provided"); // Debugging output
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.newLectureButton}
          onPress={addNewLecture}
        >
          <Text style={styles.plusIcon}>+</Text>
          <Text style={styles.newLectureText}>New Lecture</Text>
        </TouchableOpacity>
        {lectures.map((lecture) => (
          <Lecture lecture={lecture} onLecturePress={onLecturePress} />
        ))}
      </View>
      {isBottomSheetVisible && (
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={hideBottomSheet}
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
            value={newLectureName}
            onChangeText={setNewLectureName}
          />
          <TouchableOpacity onPress={addLecture} style={styles.addButton}>
            <Text style={styles.buttonText}>Add Notebook</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

export default ListOfLectures;

const Lecture = ({ lecture, onLecturePress }) => {
  return (
    <TouchableOpacity onPress={onLecturePress} styles={styles.lectureClick}>
      <View key={lecture.id} style={styles.lectureItem}>
        <Text style={styles.lectureDate}>{lecture.abbrevDate}</Text>
        <Text style={styles.lectureName} numberOfLines={2}>
          {lecture.lectureName}
        </Text>
        <Ionicons
          name="ellipsis-vertical"
          style={styles.menuIcon}
          size={24}
          color="black"
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
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
  plusIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  newLectureText: {
    fontSize: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
    margin: 0,
  },
  lectureItem: {
    width: 160, // Approximately two items per row
    height: 80,
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    margin: 0,
    marginBottom: 10,
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
  menuIcon: {
    position: "absolute",
    bottom: 28,
    right: 2,
  },
  input: {
    borderWidth: 1, // Border width
    borderColor: "#ccc", // Light gray border
    borderRadius: 5, // Rounded corners
    padding: 16, // Padding inside the input
    marginBottom: 16, // Margin at the bottom
    backgroundColor: "#FFF", // White background color
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
});

const PlusIcon = () => <Text style={styles.plusIcon}>+</Text>;
