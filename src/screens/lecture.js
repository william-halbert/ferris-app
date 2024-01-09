import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useAuth } from "../context/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const backpackImg = require("../../assets/unzippedBackpackBlue.png"); // Assuming the backpack image is stored locally
import { FontAwesome } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import CameraElement from "../uiElement/camera";

import { getAuth, sendSignInLinkToEmail } from "firebase/auth";
import { app } from "../../firebaseConfig";
import { useLayoutEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";

const Lecture = ({ navigation, route }) => {
  console.log("lecture page rendered");
  console.log("trying to get params");
  const { getRawNotes, saveRawNotes } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [lectureNameDisplay, setLectureNameDisplay] = useState("");
  const [abbrevDateDisplay, setAbbrevDateDisplay] = useState(
    abbrevDate || "Date"
  );
  const auth = getAuth(app);
  const [rawNotes, setRawNotes] = useState([]);

  let notebook, classId, lectureId, lectureName, abbrevDate, rawNotesId;

  console.log("trying to get params");
  if (route.params) {
    notebook = route.params.notebook || undefined;
    classId = route.params.classId || undefined;
    lectureId = route.params.lectureId || undefined;
    lectureName = route.params.lectureName || undefined;
    abbrevDate = route.params.abbrevDate || undefined;
    rawNotesId = route.params.rawNotesId || undefined;
  }
  console.log("got params");
  console.log(notebook);
  console.log(classId);
  console.log(lectureId);
  console.log(lectureName);
  console.log(abbrevDate);
  console.log(rawNotesId);
  console.log(lectureName);

  // Now, each variable will be set only if it exists in route.params

  //console.log(lectureName);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLectureNameDisplay(lectureName);
        console.log("new user fetch, lecture page");

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
  }, []);

  useEffect(() => {
    if (user) {
      sendSignInLinkToEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const fetchNotes = async () => {
      if (user) {
        console.log(user.email, classId, lectureId, rawNotesId);
        try {
          console.log("new raw notes fetch");
          const userRawNotes = await getRawNotes(
            user.email,
            classId,
            lectureId,
            rawNotesId
          );
          if (userRawNotes.notes) {
            setRawNotes(userRawNotes.notes);
          } else {
            console.log("No notes found");
            setRawNotes([]);
            console.log(rawNotes);
          }
        } catch (error) {
          console.log("Failed to fetch classes:", error);
        }
      } else {
        console.log("No user found to fetch notebooks");
      }
    };

    fetchNotes();
    if (lectureName) {
      setLectureNameDisplay(lectureName);
    }
    if (abbrevDate) {
      setAbbrevDateDisplay(abbrevDate);
    }
  }, [user, navigation, route]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchNotes = async () => {
        if (user) {
          try {
            console.log("new raw notes fetch");
            const userRawNotes = await getRawNotes(
              user.email,
              classId,
              lectureId,
              rawNotesId
            );
            if (userRawNotes.notes) {
              setRawNotes(userRawNotes.notes);
            } else {
              console.log("No note found");
            }
          } catch (error) {
            console.error("Failed to fetch classes:", error);
          }
        } else {
          console.log("No user found to fetch notebooks");
        }
      };

      fetchNotes();
    }, [user, classId, lectureId, rawNotesId])
  );

  React.useEffect(() => {
    const parent = navigation.getParent();

    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: "none" },
      });
    }

    return () => {
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: "unset" },
        });
      }
    };
  }, [navigation, route]);

  const goBack = () => {
    setRawNotes([]);
    setLectureNameDisplay("");
    setAbbrevDateDisplay("");
    navigation.navigate("NewLectureNavigator", { screen: "NewLecture" });
    setTimeout(() => {
      navigation.navigate("HomeStackNavigator", {
        screen: "ListOfNotebooks",
      });
    }, 1);
  };

  const scrollViewRef = useRef();

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [rawNotes, navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View style={styles.header}>
        <TouchableOpacity
          style={{
            width: 50,
            height: 50,
            marginRight: 10,
          }}
          onPress={goBack}
        >
          <Image source={backpackImg} style={styles.backpackIcon} />
        </TouchableOpacity>
        <View>
          <View>
            {lectureNameDisplay && (
              <Text style={styles.lectureTitle}>{lectureNameDisplay}</Text>
            )}
          </View>
          <Text style={styles.lectureDate}>{abbrevDateDisplay}</Text>
        </View>
      </View>

      <ScrollView style={styles.container} ref={scrollViewRef}>
        {rawNotes && Array.isArray(rawNotes) ? (
          rawNotes.map((item, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.headerNotes}>{item.header}</Text>
              {item.points.map((point, idx) => (
                <Text key={idx} style={styles.bulletPoint}>
                  • {point}
                </Text>
              ))}
            </View>
          ))
        ) : (
          <Text style={styles.errorText}>
            Data is not available or in the correct format
          </Text>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <MaterialIcons
          name="add-photo-alternate"
          size={36}
          color="black"
          style={{ position: "relative", top: -3 }}
        />
        {user && (
          <CameraElement
            rawNotes={rawNotes}
            setRawNotes={setRawNotes}
            email={user.email}
            classId={classId}
            lectureId={lectureId}
            rawNotesId={rawNotesId}
            navigation={navigation}
            abbrevDate={abbrevDate}
            notebook={notebook}
          />
        )}
        <FontAwesome name="paper-plane" size={26} color="black" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white", // Assuming this is the blue background color
    paddingHorizontal: 20,
    paddingTop: 5,
    marginTop: 75,
    marginBottom: 70,
    paddingBottom: 400,
  },
  header: {
    position: "absolute",
    top: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 0,
    width: "100%",
    paddingHorizontal: 20,
  },
  backpackIcon: {
    width: 50, // Set as per your icon size
    height: 50, // Set as per your icon size
    marginRight: 10,
  },
  lectureTitle: {
    color: "black",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "right",
  },
  lectureDate: {
    color: "black",
    fontSize: 16,
    textAlign: "right",
  },

  mainHeading: {
    color: "black",
    fontWeight: "bold",
    fontSize: 22,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    color: "black",
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 10,
  },
  bulletPoint: {
    color: "black",
    fontSize: 18,
    marginBottom: 5,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    height: 100,
    paddingTop: 20,
    backgroundColor: "white",
  },
  headerNotes: {
    color: "black",
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 10,
  },
  icon: {
    width: 30, // Set as per your icon size
    height: 30, // Set as per your icon size
  },
});

export default Lecture;
//ref={scrollViewRef}
