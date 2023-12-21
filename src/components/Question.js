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
import { EXPO_PUBLIC_OPENAI_KEY } from "@env";

const Question = ({ question, options, correctAnswer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [justification, setJustification] = useState(null);

  console.log("question", question);
  console.log("options", options);
  console.log("correctAnswer", correctAnswer);

  const handlePress = (option) => {
    if (selectedAnswer) {
      return;
    }
    console.log("press within component");
    setSelectedAnswer({
      option: option,
      status: option === correctAnswer ? "right" : "wrong",
    });
    if (option == correctAnswer) {
      openaiRequest(
        `Why was ${correctAnswer} the right answer. Question: ${question} Option a: ${options[0].text}. Option b: ${options[1].text}`
      );
    } else {
      openaiRequest(
        `Why was ${option} the wrong answer. Question: ${question} Option a: ${options[0].text}. Option b: ${options[1].text}`
      );
    }
  };

  const getAnswerStyle = (option) => [
    styles.answer,
    selectedAnswer?.option === option &&
      (selectedAnswer?.status === "right"
        ? styles.rightAnswer
        : styles.wrongAnswer),
  ];

  const getMathViewStyle = (option) => [
    selectedAnswer?.option === option ? styles.answeredText : styles.answerText,
  ];
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
              content: content,
            },
          ],
        }),
      });

      let data = await response.json();
      setJustification(data.choices[0].message.content);

      console.log(data.choices[0].message.content);
    } catch (e) {
      console.log("Error:", e.message, e);
    }
  }
  return (
    <View style={{ flex: 1, backgroundColor: "#FFFAFD" }}>
      <View style={styles.mathViewContainer}>
        {splitTextAndLatex(question).map(renderSegment)}
      </View>

      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={getAnswerStyle(option.key)}
          onPress={() => handlePress(option.key)}
        >
          <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap" }}>
            {splitTextAndLatex(option.text).map(renderSegment)}
          </View>
        </TouchableOpacity>
      ))}
      {justification && (
        <View style={styles.mathViewContainer}>
          {splitTextAndLatex(justification).map(renderSegment)}
        </View>
      )}
    </View>
  );
};
//
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
  },
  responseContainer: {
    marginVertical: 15,
    padding: 10,
    borderRadius: 10,
  },
  text: {
    flexShrink: 1,
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
    paddingBottom: 10, // Adds padding around the MathView for safety
  },
  mathViewStyle: {
    flexWrap: "wrap", // Wraps the text
    maxWidth: Dimensions.get("window").width - 20,
    flexShrink: 1,
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
    flexWrap: "wrap", // Wrap content
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
  segmentContainer: {
    flexDirection: "row", // Align items in a row
    flexWrap: "wrap", // Wrap content to the next line
    alignItems: "center", // Align items vertically in center
    maxWidth: Dimensions.get("window").width - 20, // Set a maximum width
  },
});

export default Question;

const renderSegment = (segment, index) => {
  if (segment.startsWith("$") && segment.endsWith("$")) {
    const latex = segment.slice(1, -1);
    return (
      <MathView
        key={`latex-${index}`}
        math={latex}
        onError={(error) => console.warn("LaTeX Error:", error)}
        onLoad={() => console.log("LaTeX Loaded")}
        style={styles.mathViewStyle}
      />
    );
  } else {
    return (
      <Text key={`text-${index}`} style={styles.text}>
        {segment}
      </Text>
    );
  }
};

const splitTextAndLatex = (input) => {
  if (input == null) {
    console.warn("Input is null or undefined.");
    return []; // Return an empty array or any other default value
  }

  const lines = input.split("\n").filter((line) => line.trim() !== "");
  let segments = [];
  let isLatexBlock = false;
  let latexContent = "";

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("\\[")) {
      isLatexBlock = true;
      latexContent = trimmedLine.slice(2) + "\n";
      return;
    }

    if (trimmedLine.endsWith("\\]")) {
      isLatexBlock = false;
      latexContent += trimmedLine.slice(0, -2);
      segments.push(`$${latexContent}$`);
      latexContent = "";
      return;
    }

    if (isLatexBlock) {
      latexContent += trimmedLine + "\n";
    } else {
      const inlineLatexMatches = trimmedLine.match(/\\\(.*?\\\)/g);
      if (inlineLatexMatches) {
        let startIndex = 0;
        inlineLatexMatches.forEach((match) => {
          const matchIndex = trimmedLine.indexOf(match, startIndex);
          if (matchIndex > startIndex) {
            segments.push(trimmedLine.substring(startIndex, matchIndex));
          }
          segments.push(`$${match.slice(2, -2)}$`);
          startIndex = matchIndex + match.length;
        });
        if (startIndex < trimmedLine.length) {
          segments.push(trimmedLine.substring(startIndex));
        }
      } else {
        segments.push(trimmedLine);
      }
    }
  });

  return segments;
};

/*
const splitTextAndLatex = (input) => {
  // Regular expression to identify LaTeX parts
  const regex = /(\$.*?\$)/g;
  return input.split(regex).filter(Boolean);
};
const renderSegment = (segment, index) => {
  if (segment.startsWith("$") && segment.endsWith("$")) {
    const latex = segment.slice(1, -1);
    return (
      <MathView
        key={`latex-${index}`}
        math={latex}
        onError={(error) => console.warn(error)}
        style={styles.mathViewStyle}
      />
    );
  } else {
    return (
      <Text key={`text-${index}`} style={styles.text}>
        {segment}
      </Text>
    );
  }
};

*/
