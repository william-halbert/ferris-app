// ElaborationScreen.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Button,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useAuth } from "../context/authContext";
import { getAuth } from "firebase/auth";
import MathView from "react-native-math-view";
import Question from "../components/Question";

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
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);
  function fixJSONString(jsonString) {
    // Replace single backslash with double backslashes
    return jsonString.replace(/\\/g, "\\\\");
  }
  function parseQuestion(jsonString) {
    const fixedJSONString = fixJSONString(jsonString.trim());

    console.log("openai response:", fixedJSONString);

    try {
      const parsedData = JSON.parse(fixedJSONString);
      return parsedData.question;
    } catch (e) {
      console.error("Parsing error:", e);
      console.error("Invalid JSON string:", jsonString);
      return null;
    }
  }

  function parseOptions(jsonString) {
    const fixedJSONString = fixJSONString(jsonString.trim());

    try {
      const parsedData = JSON.parse(fixedJSONString);
      const returnValue = [
        { key: "a", text: parsedData.options[0] },
        { key: "b", text: parsedData.options[1] },
      ];
      return returnValue;
    } catch (e) {
      console.error("Parsing error:", e);
      console.error("Invalid JSON string:", jsonString);
      return null;
    }
  }
  function parseCorrectAnswer(jsonString) {
    const fixedJSONString = fixJSONString(jsonString.trim());

    try {
      const parsedData = JSON.parse(fixedJSONString);
      return parsedData.correctAnswer.toLowerCase();
    } catch (e) {
      console.error("Parsing error:", e);
      console.error("Invalid JSON string:", jsonString);
      return null;
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FFFAFD" }}>
      {gptResponses.map((json, index) => (
        <View key={index} style={styles.responseContainer}>
          <Question
            question={parseQuestion(json)}
            options={parseOptions(json)}
            correctAnswer={parseCorrectAnswer(json)}
          />
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
  optionsContainer: {
    marginTop: 10,
  },
  option: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#EFEFEF",
    borderRadius: 5,
  },
  mathViewContainer: {
    width: "100%", // Ensures the container takes the full width of the parent
    padding: 10, // Adds padding around the MathView for safety
  },
  mathViewStyle: {
    maxWidth: Dimensions.get("window").width - 20, // Maximum width with some margin
    // Other styles if necessary, like backgroundColor, borderColor, etc.
  },
  answer: {
    marginHorizontal: 10, // Horizontal margin
    marginVertical: 10, // Vertical margin
    paddingHorizontal: 10, // Horizontal padding
    paddingVertical: 10, // Vertical padding
    borderWidth: 1, // Border width
    borderColor: "blue", // Border color
    borderRadius: 15, // Border radius
    // Regular font color
    color: "blue", // This sets the text color, not the font itself
  },
  answerText: { color: "blue" },
  answeredText: { color: "white" },
  rightAnswer: {
    backgroundColor: "green",
    borderColor: "green",
  },
  wrongAnswer: {
    backgroundColor: "red",
    color: "white",
    borderColor: "red",
  },
});

const ThreeQuestions = ({ optionsArray }) => {
  if (!Array.isArray(optionsArray) || optionsArray.length === 0) {
    return <Text>No data available</Text>;
  }

  const renderOption = ({ item, index }) => <Button key={index} title={item} />;

  const renderItem = ({ item, index }) => (
    <View style={{ marginBottom: 20 }}>
      <Text key={index} style={{ fontWeight: "bold", marginBottom: 5 }}>
        {item.question}
      </Text>
      <FlatList
        data={item.options}
        renderItem={renderOption}
        keyExtractor={(item, idx) => idx.toString()}
      />
    </View>
  );

  return (
    <FlatList
      data={optionsArray}
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()}
    />
  );
};

{
  /*
      <View style={styles.mathViewContainer}>
        <MathView
          math={
            "If the system is in an adiabatic condition, what does (dot{Q}) equate to?"
          }
          onError={(error) => console.warn(error)}
          style={styles.mathViewStyle}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.answer,
          answerAStatus === "right" && styles.rightAnswer,
          answerAStatus === "wrong" && styles.wrongAnswer,
        ]}
        onPress={handleAPress}
      >
        <MathView
          math={"a) 0"}
          onError={(error) => console.warn(error)}
          style={
            answerAStatus === "right" || answerAStatus === "wrong"
              ? styles.answeredText
              : styles.answerText
          }
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.answer,
          answerBStatus === "right" && styles.rightAnswer,
          answerBStatus === "wrong" && styles.wrongAnswer,
        ]}
        onPress={handleBPress}
      >
        <MathView
          math={"b) ( U Aleft(T_{a}-T\right) )"}
          onError={(error) => console.warn(error)}
          style={
            answerBStatus === "right" || answerBStatus === "wrong"
              ? styles.answeredText
              : styles.answerText
          }
        />
      </TouchableOpacity>*/
}
{
  /*
      <Question
        question={
          "If the system is in an adiabatic condition, what does (dot{Q}) equate to?"
        }
        options={[
          { key: "a", text: "a) 0" },
          { key: "b", text: "b) ( U Aleft(T_{a}-T\right) )" },
        ]}
        correctAnswer={"a"}
      />*/
}
