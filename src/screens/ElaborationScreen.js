// ElaborationScreen.js

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import { useAuth } from "../context/authContext";
import { getAuth } from "firebase/auth";

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
    <ScrollView>
      <View>
        {gptResponses.map((response, index) => (
          <Text key={index}>{response}</Text>
        ))}
      </View>
    </ScrollView>
  );
};

export default ElaborationScreen;
