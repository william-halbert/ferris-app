import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthProvider } from "./src/context/authContext";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import ElaborationScreen from "./src/screens/ElaborationScreen";
import SignInScreen from "./src/screens/SignInScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import LibraryScreen from "./src/screens/LibraryScreen";
import NotebookScreen from "./src/screens/NotebookScreen";
import NotesScreen from "./src/screens/notesScreen";

const Stack = createStackNavigator();
const Tab = createMaterialTopTabNavigator();

const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="SignIn">
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="Notes" component={NotesScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Library" component={LibraryScreen} />
          <Stack.Screen
            name="Tabs"
            component={TabNavigator}
            options={{ headerShown: true }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

function TabNavigator() {
  return (
    <Tab.Navigator initialRouteName="Notebook">
      <Tab.Screen name="Notebook" component={NotebookScreen} />
      <Tab.Screen name="Elaboration" component={ElaborationScreen} />
    </Tab.Navigator>
  );
}

export default App;
