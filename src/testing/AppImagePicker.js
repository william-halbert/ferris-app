import React, { useState } from "react";
import {
  Image,
  View,
  Button,
  ActivityIndicator,
  Text,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { app } from "./firebaseConfig";
import MathJax from "react-native-mathjax";
import MathView from "react-native-math-view";
import { Configuration, OpenAIApi } from "openai";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import "firebase/storage";

const App = () => {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [gptResponse, setGptResponse] = useState("");

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        setResponseText(data.text);
        openaiRequest(data.text);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Backend Error", error.message);
    }
  };

  const renderTextWithLatex = (text) => {
    const pattern = /(\\\(.+?\\\)|\\\[\s*(.+?)\s*\\\])/g;

    let match;
    const segments = [];
    let lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
      segments.push(text.slice(lastIndex, match.index)); // Push the non-LaTeX text
      segments.push(match[0]); // Push the matched LaTeX
      lastIndex = pattern.lastIndex;
    }
    segments.push(text.slice(lastIndex)); // Push the remaining non-LaTeX text

    return segments.map((segment, index) => {
      if (segment.startsWith("\\(") && segment.endsWith("\\)")) {
        return (
          <MathJax
            key={index}
            mathJaxOptions={mmlOptions}
            html={segment.slice(2, -2)}
          />
        );
      } else if (segment.startsWith("\\[") && segment.endsWith("\\]")) {
        return (
          <MathJax
            key={index}
            mathJaxOptions={mmlOptions}
            html={segment.slice(2, -2)}
          />
        );
      } else {
        // Wrap non-LaTeX segments in a <Text> component
        return <Text key={index}>{segment}</Text>;
      }
    });
  };

  const apiKey = "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";

  async function openaiRequest(content) {
    let conversationToOpenai = [
      {
        role: "user",
        content: `Create formatted notes:  ${content}`,
      },
    ];

    try {
      let response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `Create formatted notes: ${content}`,
            },
          ],
        }),
      });

      let data = await response.json();
      setGptResponse(data.choices[0].message.content);
    } catch (e) {
      console.log("Error:", e.message, e);
    }
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Button title="Pick an image from camera roll" onPress={pickImage} />
      {image && (
        <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />
      )}
      {uploading && <ActivityIndicator />}

      {responseText && renderResponse(responseText)}
      {gptResponse && <Text>{gptResponse}</Text>}
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  text: {
    marginVertical: 5,
  },
});

function renderResponse(responseText) {
  const lines = responseText.split("\n").filter((line) => line.trim() !== "");
  const renderedContent = [];

  let isLatexBlock = false;
  let latexContent = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("\\[")) {
      isLatexBlock = true;
      latexContent = line.slice(2) + "\n"; // Start collecting the LaTeX content
      continue;
    }

    if (line.endsWith("\\]")) {
      isLatexBlock = false;
      latexContent += line.slice(0, -2); // End collecting the LaTeX content
      renderedContent.push(
        <MathView
          key={i}
          math={latexContent}
          onError={(error) => console.warn(error)}
          onLoad={() => console.log("Loaded")}
        />
      );
      latexContent = "";
      continue;
    }

    if (isLatexBlock) {
      latexContent += line + "\n"; // Continue collecting the LaTeX content
    } else {
      // Check for inline LaTeX
      const inlineLatexMatches = line.match(/\\\(.*?\\\)/g);
      if (inlineLatexMatches) {
        let startIndex = 0;
        for (const match of inlineLatexMatches) {
          const matchIndex = line.indexOf(match, startIndex);
          if (matchIndex > startIndex) {
            renderedContent.push(
              <Text key={`${i}-${startIndex}`} style={styles.text}>
                {line.substring(startIndex, matchIndex)}
              </Text>
            );
          }
          renderedContent.push(
            <MathView
              key={`${i}-${match}`}
              math={match.slice(2, -2)}
              onError={(error) => console.warn(error)}
              onLoad={() => console.log("Loaded")}
            />
          );
          startIndex = matchIndex + match.length;
        }
        if (startIndex < line.length) {
          renderedContent.push(
            <Text key={`${i}-${startIndex}`} style={styles.text}>
              {line.substring(startIndex)}
            </Text>
          );
        }
      } else {
        renderedContent.push(
          <Text key={i} style={styles.text}>
            {line}
          </Text>
        );
      }
    }
  }

  return renderedContent;
}
