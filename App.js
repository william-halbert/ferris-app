import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthProvider } from "./src/context/authContext";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
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
import ElaborationScreen from "./src/screens/ElaborationScreen";
import SignInScreen from "./src/screens/SignInScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import LibraryScreen from "./src/screens/LibraryScreen";
import NotebookScreen from "./src/screens/NotebookScreen";
import ListOfNotebooks from "./src/screens/listOfNotebooks";
import NotesScreen from "./src/screens/notesScreen";

const Stack = createStackNavigator();
const Tab = createMaterialTopTabNavigator();

const App = () => {
  const auth = getAuth();
  const [initialRoute, setInitialRoute] = useState("SignIn");
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setInitialRoute("Notebooks");
      } else {
        setInitialRoute("SignIn");
      }
    });
    return unsubscribe; // Clean up the subscription
  }, []);
  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName={initialRoute}>
            <Stack.Screen
              name="SignIn"
              component={SignInScreen}
              options={({ route }) => ({
                headerShown: false,
              })}
            />
            <Stack.Screen
              name="Notes"
              component={NotesScreen}
              options={({ route }) => ({
                title: route.params?.className || "Notes",
              })}
            />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen
              name="Library"
              component={LibraryScreen}
              options={({ route }) => ({
                headerShown: false,
              })}
            />
            <Stack.Screen
              name="Notebooks"
              component={ListOfNotebooks}
              options={({ route }) => ({
                headerShown: false,
              })}
            />
            {/*
            <Stack.Screen
              name="Notebook"
              component={NotebookScreen}
              options={({ route }) => ({
                title:
                  route.params?.className + " | " + route.params?.noteName ||
                  "Notes",
              })}
            />
            */}
            <Stack.Screen
              name="Tabs"
              component={TabNavigator}
              options={{ headerShown: true, headerTitle: "" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </AuthProvider>
  );
};

function TabNavigator() {
  return (
    <Tab.Navigator initialRouteName="Notebook">
      <Tab.Screen name="Auto-Notes" component={NotebookScreen} />
      <Tab.Screen name="Gamify" component={ElaborationScreen} />
    </Tab.Navigator>
  );
}

export default App;
