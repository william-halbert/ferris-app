// ElaborationScreen.js

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useAuth } from "../context/authContext";
import { getAuth } from "firebase/auth";
import MathView from "react-native-math-view";

const ElaborationScreen = () => {
  const { getNote, noteInfo } = useAuth();
  const { className, noteName } = noteInfo;
  const [gptResponses, setGptResponses] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const noteData = await getNote(user.uid, className, noteName);
        if (noteData && noteData.gptResponses) {
          setGptResponses(noteData.gptResponses);
        }
      } catch (error) {
        console.error("Failed to fetch note details:", error);
      }
    };
    fetchData();

    const intervalId = setInterval(async () => {
      if (user) {
        try {
          const noteData = await getNote(user.uid, className, noteName);
          if (noteData && noteData.gptResponses) {
            setGptResponses(noteData.gptResponses);
          }
        } catch (error) {
          console.error("Failed to fetch note details:", error);
        }
      }
    }, 10000); // fetch every 20 seconds = 20000 milliseconds

    return () => clearInterval(intervalId); // clear the interval on component unmount or if you navigate away from this screen
  }, []);

  return (
    <ScrollView style={{ flex: 1 }}>
      {gptResponses.map((response, index) => (
        <View key={index} style={styles.responseContainer}>
          <Text style={styles.header}>Response {index + 1}</Text>
          <Text style={styles.responseText}>{response}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default ElaborationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  responseContainer: {
    marginVertical: 15,
    padding: 10,
    borderRadius: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  responseText: {
    fontSize: 16,
  },
});
