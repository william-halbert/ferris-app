import React, { useState, useEffect } from "react";
import {
  Image,
  View,
  Button,
  ActivityIndicator,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { app } from "../../firebaseConfig";
import MathView from "react-native-math-view";
import { useAuth } from "../context/authContext";
import { getAuth } from "firebase/auth";
import { EXPO_PUBLIC_OPENAI_KEY } from "@env";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import "firebase/storage";

const NotebookScreen = ({ route }) => {
  const { className, noteName } = route.params;
  const navigation = useNavigation();
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [gptResponse, setGptResponse] = useState("");
  const [responseTexts, setResponseTexts] = useState([]);
  const [gptResponses, setGptResponses] = useState([]);
  const { saveNoteResponse, getNote, saveGptResponse, noteInfo, setNoteInfo } =
    useAuth();
  const auth = getAuth();
  const user = auth.currentUser;

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
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.3,
      });
      if (!result.canceled) {
        setImage(result.assets[0].uri);
        uploadImageToFirebase(result.assets[0].uri);
      }
    } catch (E) {
      console.log(E);
    }
  };

  useEffect(() => {
    async function fetchNoteDetails() {
      if (user) {
        try {
          const noteData = await getNote(user.uid, className, noteName);
          if (noteData && noteData.responses) {
            setResponseTexts(noteData.responses);
          }
          if (noteData && noteData.gptResponses) {
            setGptResponses(noteData.gptResponses);
          }
        } catch (error) {
          console.error("Failed to fetch note details:", error);
        }
      }
    }

    fetchNoteDetails();
    setNoteInfo({ className: className, noteName: noteName });
  }, []);

  const uploadImageToFirebase = async (uri) => {
    setUploading(true);
    const storage = getStorage(app);
    const metadata = { contentType: "image/jpeg" };
    const storageRef = ref(storage, "images/" + Date.now());

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
          await sendImageToBackend(downloadURL);
        } catch (error) {
          Alert.alert("Upload Error", error.message);
        }
        setUploading(false);
      }
    );
  };

  const sendImageToBackend = async (imageUrl) => {
    try {
      const response = await fetch(
        "https://chat-with-notes-server-b9f51be04d4f.herokuapp.com/api/image",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageUrl }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send the image URL.");
      }

      if (data.text) {
        setResponseTexts((prevTexts) => [...prevTexts, data.text]); // <-- push to the array
        openaiRequest(data.text);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Backend Error", error.message);
    }
  };

  useEffect(() => {
    if (responseTexts.length > 0) {
      saveNoteResponse(user.uid, className, noteName, responseTexts);
    }
  }, [responseTexts]);

  useEffect(() => {
    if (responseTexts.length > 0) {
      saveGptResponse(user.uid, className, noteName, gptResponses);
    }
  }, [gptResponses]);

  const apiKey = EXPO_PUBLIC_OPENAI_KEY;

  async function openaiRequest(content) {
    try {
      let response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "user",
              content: `Go deep on this meaning, yet be super concise: ${content}`,
            },
          ],
        }),
      });

      let data = await response.json();
      setGptResponse(data.choices[0].message.content);
      setGptResponses((prevTexts) => [
        ...prevTexts,
        data.choices[0].message.content,
      ]);
    } catch (e) {
      console.log("Error:", e.message, e);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerText}>Class: {className}</Text>
      <Text style={styles.headerText}>Note: {noteName}</Text>

      <Button title="Take a picture" onPress={pickImage} />

      {uploading && <ActivityIndicator />}
      {responseTexts.map((text, index) => renderResponse(text, index))}
    </ScrollView>
  );
};

export default NotebookScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },

  text: {
    marginVertical: 5,
  },
});

function renderResponse(responseText, mainIndex) {
  const lines = responseText.split("\n").filter((line) => line.trim() !== "");
  const renderedContent = [];

  let isLatexBlock = false;
  let latexContent = "";
  let inlineGroup = []; // Group to hold adjacent inline elements
  let keyCounter = 0; // Counter to ensure unique keys

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Reset the key counter for each line
    keyCounter = 0;

    if (line.startsWith("\\[")) {
      isLatexBlock = true;
      latexContent = line.slice(2) + "\n";
      continue;
    }

    if (line.endsWith("\\]")) {
      isLatexBlock = false;
      latexContent += line.slice(0, -2);
      renderedContent.push(
        <MathView
          key={`${i}-${keyCounter++}`}
          math={latexContent}
          onError={(error) => console.warn(error)}
          onLoad={() => console.log("Loaded")}
        />
      );
      latexContent = "";
      continue;
    }

    if (isLatexBlock) {
      latexContent += line + "\n";
    } else {
      const inlineLatexMatches = line.match(/\\\(.*?\\\)/g);
      if (inlineLatexMatches) {
        let startIndex = 0;
        for (const match of inlineLatexMatches) {
          const matchIndex = line.indexOf(match, startIndex);
          if (matchIndex > startIndex) {
            inlineGroup.push(
              <Text key={`${i}-${keyCounter++}`} style={styles.text}>
                {line.substring(startIndex, matchIndex)}
              </Text>
            );
          }
          inlineGroup.push(
            <MathView
              key={`${i}-${keyCounter++}`}
              math={match.slice(2, -2)}
              onError={(error) => console.warn(error)}
              onLoad={() => console.log("Loaded")}
            />
          );
          startIndex = matchIndex + match.length;
        }
        if (startIndex < line.length) {
          inlineGroup.push(
            <Text key={`${i}-${keyCounter++}`} style={styles.text}>
              {line.substring(startIndex)}
            </Text>
          );
        }
        renderedContent.push(
          <View
            key={`${i}-${keyCounter++}`}
            style={{ flexDirection: "row", flexWrap: "wrap" }}
          >
            {inlineGroup}
          </View>
        );
        inlineGroup = [];
      } else {
        renderedContent.push(
          <Text key={`${i}-${keyCounter++}`} style={styles.text}>
            {line}
          </Text>
        );
      }
    }
  }

  return renderedContent.map((content, subIndex) =>
    React.cloneElement(content, { key: `${mainIndex}-${subIndex}` })
  );
}
