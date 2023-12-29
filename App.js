import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthProvider } from "./src/context/authContext";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useAuth } from "./src/context/authContext";
import { getAuth } from "firebase/auth";

import SignInScreen from "./src/screens/SignInScreen";
import NewLecture from "./src/screens/NewLecture";
import ListOfNotebooks from "./src/screens/listOfNotebooks";
import ListOfLectures from "./src/screens/listOfLectures";
import StartScreen from "./src/screens/startScreen";

const HomeStack = createStackNavigator();
const NewLectureStack = createStackNavigator();
const SignInStack = createStackNavigator();

const App = () => {
  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        <IsSignedIn />
      </View>
    </AuthProvider>
  );
};

function IsSignedIn() {
  const { userInfo } = useAuth();
  const auth = getAuth();
  const [signedIn, setSignedIn] = useState("starter");
  const [googleUser, setGoogleUser] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    let intervalId;

    const fetchUser = async () => {
      try {
        const userJSON = await AsyncStorage.getItem("user");
        if (userJSON) {
          setGoogleUser(JSON.parse(userJSON));
        } else {
          setGoogleUser(null);
        }
      } catch (err) {
        console.warn(err);
      }
    };

    const checkAuthState = async () => {
      await fetchUser(); // Ensuring that googleUser is updated before checking auth state
      const user = auth.currentUser;
      if (user || googleUser || userInfo) {
        setSignedIn("home screen");

        // Clear the interval if the home screen is set
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null; // Reset the intervalId to ensure it's cleared only once
        }
      } else {
        setSignedIn("signin screen");
      }
    };

    checkAuthState();

    // Set up the interval only if it's not already set (optional)
    if (!intervalId) {
      intervalId = setInterval(() => {
        checkAuthState();
      }, 3000);
    }

    // Cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [googleUser, userInfo]);

  return (
    <NavigationContainer>
      {signedIn === "starter" && <StartScreen />}
      {signedIn === "home screen" && <BottomTabsNavigator />}
      {signedIn === "signin screen" && <SignInStackNavigator />}
    </NavigationContainer>
  );
}

function SignInStackNavigator() {
  return (
    <SignInStack.Navigator>
      <SignInStack.Screen
        name="SignInScreen"
        component={SignInScreen}
        options={({ route }) => ({
          headerShown: false,
        })}
      />
    </SignInStack.Navigator>
  );
}

const BottomTab = createBottomTabNavigator();

function BottomTabsNavigator() {
  return (
    <BottomTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (route.name === "HomeStackNavigator") {
            iconName = focused ? "backpack" : "backpack";
            color = focused ? "#FF65A3" : "grey";
            return (
              <MaterialIcons name={iconName} size={size + 8} color={color} />
            );
          } else if (route.name === "NewLectureNavigator") {
            iconName = focused ? "create" : "create-outline";
            color = focused ? "#FF65A3" : "grey";

            return <Ionicons name={iconName} size={size + 8} color={color} />;
          }
        },
        tabBarLabel: () => null,
      })}
    >
      <BottomTab.Screen
        name="HomeStackNavigator"
        component={HomeStackNavigator}
        options={({ route }) => ({
          headerShown: false,
        })}
      />
      <BottomTab.Screen
        name="NewLectureNavigator"
        component={NewLectureNavigator}
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
    </BottomTab.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="ListOfNotebooks"
        component={ListOfNotebooks}
        options={({ route }) => ({
          headerShown: true,
        })}
      />
      <HomeStack.Screen
        name="ListOfLectures"
        component={ListOfLectures}
        options={({ route }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: "white",
          },
          headerTintColor: "black",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerBackTitleVisible: false,
          headerTitle: "Notebook",
        })}
      />
    </HomeStack.Navigator>
  );
}
function NewLectureNavigator() {
  return (
    <NewLectureStack.Navigator>
      <NewLectureStack.Screen
        name="NewLecture"
        component={NewLecture}
        options={({ route }) => ({
          headerShown: false,
          presentation: "modal",
        })}
      />
    </NewLectureStack.Navigator>
  );
}

export default App;
