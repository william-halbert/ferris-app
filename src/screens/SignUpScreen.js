import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useAuth } from "../context/authContext";

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [confirmedTerms, setConfirmedTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { signup } = useAuth();

  const handleSignUp = async () => {
    if (!confirmedTerms) {
      setError("Accept the terms and conditions to sign up.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setError("");
      const response = await signup(email, password);
      if (response !== "success") {
        setError(response);
      } else {
        setSuccess("You're signed up!");
        await handleLogin();
        navigation.navigate("Library");
      }
    } catch (err) {}
  };

  async function handleLogin() {
    try {
      setError("");
      setLoading(true);
      const response = await login(email, password);
      if (response !== "success") {
        setError(response);
      } else {
        setSuccess("You're logged in!");
        navigation.navigate("Library");
      }
    } catch (err) {
      console.log(err);
      setError("Failed to log in.");
    }
    setLoading(false);
  }

  const renderCheckbox = (checked, onPress) => (
    <TouchableOpacity onPress={onPress} style={styles.checkboxContainer}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkboxX}>✓</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Create an Account</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}
        {success && <Text style={styles.successText}>{success}</Text>}

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCompleteType="email"
        />

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry={true}
          autoCapitalize="none"
          autoCompleteType="password"
        />

        <TextInput
          style={styles.input}
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
          placeholder="Confirm Password"
          secureTextEntry={true}
          autoCapitalize="none"
          autoCompleteType="password"
        />

        <View style={styles.termsContainer}>
          {renderCheckbox(confirmedTerms, () =>
            setConfirmedTerms(!confirmedTerms)
          )}
          <Text style={styles.termsText}>I have read and accept the </Text>
          <TouchableOpacity
            onPress={() => {
              /* navigate to terms and conditions */
            }}
          >
            <Text style={[styles.termsText, styles.link]}>
              terms and conditions
            </Text>
          </TouchableOpacity>
        </View>

        <Button title="Sign Up" onPress={handleSignUp} />

        <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
          <Text style={styles.link}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    backgroundColor: "#FFF",
  },
  link: {
    marginTop: 0,
    textAlign: "center",
    color: "#007BFF",
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20, // optional: add some horizontal padding if needed
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  successText: {
    color: "green",
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "white",
  },
  checkboxChecked: {
    backgroundColor: "#007BFF",
  },
  checkboxX: {
    color: "#FFF",
    fontWeight: "bold",
  },
});

export default SignUpScreen;
