import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Linking,
  StyleSheet,
} from "react-native";
import { useAuth } from "../context/authContext";
import { getAuth } from "firebase/auth";

const SignInScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState("initial");
  const { login, signInWithGoogle, signup, resetPassword } = useAuth();
  const auth = getAuth();

  useEffect(() => {
    if (auth.currentUser) {
      navigation.navigate("Notebooks");
    }
  }, [auth.currentUser]);

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await signInWithGoogle();
      setLoading(false);
      if (response === "success") {
        navigation.navigate("Notebooks");
      } else {
        setError(response);
      }
    } catch (err) {
      setLoading(false);
      setError("Failed to sign in with Google");
    }
  };

  const handleEmailContinue = () => {
    setAuthStep("email");
    setSuccess("");
    setError("");
  };

  const handleBack = () => {
    setAuthStep("initial");
  };

  async function handleLogin() {
    try {
      setError("");
      setSuccess("");
      const response = await login(email, password);
      if (response != "success") {
        return setError(response);
      } else {
        setSuccess("You're logged in!");
        navigation.navigate("Notebooks");
      }
    } catch (err) {
      console.log(err);
      setError(err);
    }
  }
  async function handleSignUp() {
    try {
      setError("");
      setSuccess("");
      const response = await signup(email, password);
      if (response != "success") {
        return setError(response);
      } else {
        return setSuccess("You're signed up!");
      }
    } catch (err) {
      console.log(err);
      setError(err);
    }
  }
  async function handleReset(e) {
    e.preventDefault();
    setSuccess("");
    setError("");
    try {
      const response = await resetPassword(email);
      if (response != "success") {
        return setError(response);
      } else {
        setSuccess("Check your email for further instructions.");
      }
    } catch (err) {
      console.log(err);
      setError("Failed to reset password.");
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setLoading(true);
    console.log("Email: ", email, "Password: ", password);

    try {
      handleSignUp();
      console.log("signed up");
      setTimeout(async () => {
        try {
          await handleLogin();
          console.log("logged in");
        } catch (loginError) {
          console.log("loginError", loginError);
        }
      }, 1000);
    } catch (error) {
      console.log("signUpError", signUpError);
      try {
        handleLogin();
        console.log("logged in");
      } catch (loginError) {
        console.log("loginError", loginError);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInitialScreen = () => (
    <View>
      <TouchableOpacity
        onPress={handleGoogleSignIn}
        style={styles.googleSignInButton}
      >
        <Image
          source={require("../../assets/google.png")}
          style={styles.googleLogo}
        />
        <Text style={styles.googleSignInText}>Continue with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleEmailContinue} style={styles.button}>
        <Text style={styles.buttonText}>Continue with Email</Text>
      </TouchableOpacity>
      <Text style={styles.termsText}>
        By continuing, you agree to Ferris's{" "}
        <Text
          style={styles.linkText}
          onPress={() =>
            Linking.openURL("https://ferris.so/terms-and-conditions")
          }
        >
          Terms of Use
        </Text>
        . Read our{" "}
        <Text
          style={styles.linkText}
          onPress={() => Linking.openURL("https://ferris.so/privacy-policy")}
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
  );

  const renderEmailSignIn = () => (
    <View>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Continue with email</Text>
      </View>
      {success ? <Text style={styles.successText}>{success}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Text style={styles.label}>Email (personal or work)</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="julie@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry={true}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handlePasswordSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleReset} disabled={loading}>
        <Text style={styles.forgotPasswordText}>Forgot Password</Text>
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    console.log("Error:", error); // Debugging
    console.log("Success:", success); // Debugging
  }, [error, success]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Image
        source={require("../../assets/convertible.png")}
        style={styles.backgroundImage}
      />
      <View style={styles.overlay}>
        <View style={styles.innerContainer}>
          {authStep === "initial" && renderInitialScreen()}
          {authStep === "email" && renderEmailSignIn()}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  innerContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    borderRadius: 10,
    backgroundColor: "white",
    // or '100%' if you want it to be full-width
    width: 350, // Set a max width if needed to prevent stretching on larger screens
    alignSelf: "center",
    shadowColor: "rgba(0,0,0, .4)", // Optional shadow color
    shadowOffset: { height: 1, width: 1 }, // Optional shadow offset
    shadowOpacity: 1, // Optional shadow opacity
    shadowRadius: 1, // Optional shadow radius
  },
  googleSignInButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Center the content
    backgroundColor: "#f5f5f5", // Light grey background
    padding: 10,
    borderRadius: 4,
    height: 50, // Match the height to "Continue with Email" button
    marginVertical: 20,
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  googleSignInText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#FFF",
  },
  button: {
    backgroundColor: "#4630EB",
    padding: 16,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: 300,
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  backButton: {
    padding: 0,
    marginRight: 15, // Add some space between the arrow and the text
  },
  backButtonText: {
    fontSize: 18,
    color: "#007BFF",
  },
  successText: {
    color: "green", // Style for success messages
    marginBottom: 10,
    textAlign: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  termsText: {
    marginTop: 20,
    fontSize: 14,
    textAlign: "center",
  },
  linkText: {
    color: "#007BFF",
    textDecorationLine: "underline",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  forgotPasswordText: {
    color: "#007BFF", // Set the color to blue
    textDecorationLine: "underline", // Optional: to keep the underline
    textAlign: "center",
    textDecorationLine: "none",
  },
});

export default SignInScreen;
