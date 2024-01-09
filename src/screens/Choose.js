import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Text,
  Animated,
  PanResponder,
} from "react-native";

import { getAuth } from "firebase/auth";
import { app } from "../../firebaseConfig";
import { useLayoutEffect } from "react";
import { useAuth } from "../context/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ChooseGetText = ({ route, navigation }) => {
  const {
    imageUrl,
    email,
    classId,
    lectureId,
    rawNotesId,
    abbrevDate,
    notebook,
  } = route.params;
  const [rawNotes, setRawNotes] = useState("");
  const auth = getAuth(app);
  const { saveRawNotes, getRawNotes } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  console.log(imageUrl);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("new user fetch, Choose page");

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
            console.log("No Notes found");
          }
        } catch (error) {
          console.log("Failed to fetch classes:", error);
        }
      } else {
        console.log("No user found to fetch notebooks");
      }
    };

    fetchNotes();
  }, [user]);

  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: "none" },
    });
  }, [navigation, route]);

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
  }, [navigation, route]);

  const apiKey = "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";

  const sendImageToGPT4V = async (imageUrl, whatToShow) => {
    try {
      if (whatToShow === "text") {
        let response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4-vision-preview",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `Create structured notes in JSON, YOU CAN DO IT, respond only in this JSON format: [
                    {
                      header: 'Header 1',
                      points: ['Point 1', 'Point 2', etc],
                    },
                    {
                      header: 'Header 2',
                      points: ['Point 3', 'Point 4', etc],
                    },
                    etc
                  ];`,
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: String(imageUrl),
                      },
                    },
                  ],
                },
              ],
              max_tokens: 1000,
            }),
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseJSON = await response.json();

        if (!responseJSON.choices) {
          throw new Error("No choices in response");
        }
        const responseString = responseJSON.choices[0].message.content;

        if (responseString.startsWith("I'm sorry")) {
          throw new Error('Response starts with "I\'m sorry"');
        }

        function removeMarkdownAndJson(responseString) {
          let cleanedString;
          try {
            cleanedString = responseString.replace(/```json|```/g, "").trim();
            return cleanedString;
          } catch (e) {
            console.log(e);
          }
          return null;
        }

        let JSONstring;
        try {
          JSONstring = removeMarkdownAndJson(responseString);
        } catch (e) {
          console.log(e);
        }

        function parseJsonString(JSONstring) {
          try {
            return JSON.parse(JSONstring);
          } catch (error) {
            console.error("Error parsing JSON string:", error);
            return null;
          }
        }

        let dataArray;
        try {
          dataArray = parseJsonString(JSONstring);

          console.log("ARRAY FROM IMAGE", dataArray);
          console.log("RAW NOTES FROM FIREBASE", rawNotes);
          const firebaseData = {
            textArray: dataArray,
            whatToShow: whatToShow,
            imageUrl: imageUrl,
          };
          let notesToSave = [...rawNotes, ...firebaseData];
          await saveRawNotes(
            user.email,
            classId,
            lectureId,
            rawNotesId,
            notesToSave
          );
          console.log("Saved new text");
          navigation.navigate("Lecture", {
            rawNotes: rawNotes,
            email: email,
            classId: classId,
            lectureId: lectureId,
            rawNotesId: rawNotesId,
            notebook: notebook,
            abbrevDate: abbrevDate,
            fromChooseGetText: true,
          });
          setLoading(false);
          return "success";
        } catch (e) {
          console.log(e);
        }
      }
    } catch (e) {
      console.log("Error:", e.message, e);
    }
  };

  const handleGetText = async () => {
    try {
      console.log("Getting Text");
      setLoading(true);
      const response = await sendImageToGPT4V(imageUrl, "text");
    } catch (e) {
      console.log(e);
    }
  };

  const handlePlaceImage = async () => {
    try {
      console.log("Placing the image");
      const firebaseData = {
        textArray: "no_text",
        whatToShow: "image",
        imageUrl: imageUrl,
      };
      let notesToSave = [...rawNotes, ...firebaseData];
      await saveRawNotes(
        user.email,
        classId,
        lectureId,
        rawNotesId,
        notesToSave
      );
      console.log("Saved new text");
      navigation.navigate("Lecture", {
        rawNotes: rawNotes,
        email: email,
        classId: classId,
        lectureId: lectureId,
        rawNotesId: rawNotesId,
        notebook: notebook,
        abbrevDate: abbrevDate,
        fromChooseGetText: true,
      });
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <FadeBetweenImages
          image1={require("../../assets/ferrisFace.png")}
          image2={require("../../assets/ferrisWink.png")}
        />
      ) : (
        <>
          <Image source={{ uri: imageUrl }} style={styles.image} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleGetText}
              style={[styles.button, styles.buttonBlue]}
            >
              <Text style={styles.buttonText}>Generate Text</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePlaceImage} style={styles.button}>
              <Text style={styles.buttonText}>Place Image in Notes</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const FadeBetweenImages = ({ image1, image2 }) => {
  // Opacity for both images
  const opacity1 = useRef(new Animated.Value(1)).current;
  const opacity2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Loop the animation
    const animate = () => {
      Animated.sequence([
        // Fade image1 out and image2 in
        Animated.timing(opacity1, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity2, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        // Fade image2 out and image1 in
        Animated.timing(opacity2, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity1, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    animate();
  }, [opacity1, opacity2]);

  return (
    <View style={styles.fadeContainer}>
      <Animated.Image
        source={image1}
        style={{
          ...StyleSheet.absoluteFillObject,
          opacity: opacity1,
          height: 300,
          width: 300,
        }}
      />
      <Animated.Image
        source={image2}
        style={{
          ...StyleSheet.absoluteFillObject,
          opacity: opacity2,
          height: 300,
          width: 300,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fadeContainer: {
    position: "relative",
    alignItems: "center", // Center horizontally
    justifyContent: "center", // Center vertically
    height: 300, // Adjust the height as needed
    width: 300, // Adjust the width as needed
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  image: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
    borderRadius: 10,
  },
  imageContainer: {
    position: "relative",
    width: "90%",
    height: "70%",
    alignItems: "center",
    justifyContent: "center",
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    backgroundColor: "blue",
    borderRadius: 10,
  },
  buttonContainer: {
    width: "100%",
    flexDirection: "column",
    justifyContent: "space-around",
    padding: 10,
    gap: 20,
  },
  button: {
    backgroundColor: "rgb(180,180,180)",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  buttonBlue: {
    backgroundColor: "#4630EB",
  },
});

export default ChooseGetText;
