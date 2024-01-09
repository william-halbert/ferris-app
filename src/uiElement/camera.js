import React, { useState, useEffect } from "react";
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
  Alert,
} from "react-native";

import { FontAwesome } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";

///snkjrjbrk

import * as ImagePicker from "expo-image-picker";
import { app } from "../../firebaseConfig";
import { useAuth } from "../context/authContext";
import { getAuth } from "firebase/auth";

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

const CameraElement = ({
  rawNotes,
  setRawNotes,
  navigation,
  email,
  classId,
  lectureId,
  rawNotesId,
  notebook,
  abbrevDate,
}) => {
  const [responseTexts, setResponseTexts] = useState([]);
  const [gptResponses, setGptResponses] = useState([]);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [gptResponse, setGptResponse] = useState("");
  const auth = getAuth();

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "You need to grant camera permissions to use this feature."
        );
        return;
      }
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.02,
      });
      if (!result.canceled) {
        setImage(result.assets[0].uri);
        uploadImageToFirebase(result.assets[0].uri);
      }
    } catch (E) {
      console.log(E);
    }
  };

  const uploadImageToFirebase = async (uri) => {
    setUploading(true);
    const storage = getStorage(app);
    const metadata = { contentType: "image/jpeg" };
    const storageRef = ref(storage, "images/" + Date.now()); ///switch to uuid64

    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });

    const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
      },
      (error) => {
        console.log(error);
        Alert.alert("Upload Error", error.message);
        setUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("File available at", downloadURL);
          navigation.navigate("ChooseGetText", {
            imageUrl: downloadURL,
            rawNotes: rawNotes,
            email: email,
            classId: classId,
            lectureId: lectureId,
            rawNotesId: rawNotesId,
            notebook: notebook,
            abbrevDate: abbrevDate,
          });
          //await sendImageToGPT4V(downloadURL);
        } catch (error) {
          Alert.alert("Upload Error", error.message);
        }
        setUploading(false);
      }
    );
  };

  const apiKey = "blah";

  const sendImageToGPT4V = async (imageUrl) => {
    try {
      let response = await fetch("https://api.openai.com/v1/chat/completions", {
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
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseJSON = await response.json();

      if (!responseJSON.choices) {
        throw new Error("No choices in response");
      }
      console.log(responseJSON.choices[0].message.content);
      const responseString = responseJSON.choices[0].message.content;

      if (responseString.startsWith("I'm sorry")) {
        throw new Error('Response starts with "I\'m sorry"');
      } else {
      }

      function removeMarkdownAndJson(responseString) {
        // Remove Markdown code block indicators (triple backticks) and "json" keyword
        const cleanedString = responseString.replace(/```json|```/g, "").trim();
        return cleanedString;
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
        const addData = (dataArray) => {
          setRawNotes((prevData) => [...prevData, ...dataArray]);
        };
        addData(dataArray);
      } catch (e) {
        console.log(e);
      }
    } catch (e) {
      console.log("Error:", e.message, e);
    }
  };

  return (
    <TouchableOpacity style={{ height: 26, width: 26 }} onPress={pickImage}>
      <FontAwesome
        name="camera"
        size={26}
        color="black"
        style={{ position: "relative", top: 2 }}
      />
    </TouchableOpacity>
  );
};

export default CameraElement;
