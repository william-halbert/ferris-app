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

import { Animated, Dimensions } from "react-native";
import { Keyboard } from "react-native";
import { PanResponder } from "react-native";
import { useAuth } from "../context/authContext";
import { getAuth } from "firebase/auth";

// Assuming the path to your image is correct
import splash from "../../assets/splash.png";

const StartScreen = () => {
  return (
    <View style={styles.container}>
      <Image source={splash} style={styles.backgroundImage} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover", // or 'stretch'
    width: "100%",
    height: "100%",
    position: "absolute",
  },
});

export default StartScreen;
