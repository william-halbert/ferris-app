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

const NewLecture = ({ navigation }) => {
  return (
    <View>
      <Text>New Lecture</Text>
    </View>
  );
};
export default NewLecture;
