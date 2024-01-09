import React, { useContext, useState, useEffect } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  deleteUser,
} from "firebase/auth";

import {
  setDoc,
  Timestamp,
  getDoc,
  doc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
  connectStorageEmulator,
} from "firebase/storage";
import uuid from "react-native-uuid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";

import { db, app } from "../../firebaseConfig";

const AuthContext = React.createContext();

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const storage = getStorage();
  const [noteInfo, setNoteInfo] = useState({ className: "", noteName: "" });

  const auth = getAuth(app);

  async function uploadLectureImage(base64) {
    const storageRef = ref(storage, "some-child");

    try {
      const snapshot = await uploadString(storageRef, base64, "base64");
      console.log("Uploaded a base64 string!");
      const downloadURL = await getDownloadURL(snapshot.ref);
      return {
        success: true,
        downloadURL: downloadURL,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  }

  async function signup(email, password) {
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (user) {
        await createUser(email, email, "no_name", "no_photo");
      }
    } catch (err) {
      return err.message;
    }
    return "success";
  }

  async function login(email, password) {
    try {
      await signInWithEmailAndPassword(auth, email, password).then((user) => {
        setCurrentUser(user);
      });
    } catch (err) {
      console.log(err);
      return err.message;
    }
    console.log("success");

    return "success";
  }

  async function verifyEmail(user) {
    try {
      await sendEmailVerification(user).then(
        console.log("sent email verification")
      );
    } catch (err) {
      return err.message;
    }
    return "success";
  }

  async function logout(userType) {
    try {
      if (userType === "firebase") {
        await signOut(auth);
        console.log("successful firebase log out");
      } else if (userType === "google") {
        const userJson = await AsyncStorage.getItem("user");

        if (userJson) {
          const userData = JSON.parse(userJson);
          const token = userData?.accessToken; // Extract the access token

          if (token) {
            await AuthSession.revokeAsync(
              { token },
              { revocationEndpoint: "https://oauth2.googleapis.com/revoke" }
            );
          }

          await AsyncStorage.removeItem("user");
          console.log("successful google log out");
        }
      }
      return "success";
    } catch (err) {
      setAuthError(err); // Make sure this function is defined and handles the error appropriately
    }
  }

  async function deleteAccount(user, email, userType) {
    try {
      if (userType === "firebase") {
        await deleteDoc(doc(db, "users", email));
        await deleteUser(user);
        console.log("successful firebase delete user account");
      } else if (userType === "google") {
        await deleteDoc(doc(db, "users", email));
        const userJson = await AsyncStorage.getItem("user");
        if (userJson) {
          const userData = JSON.parse(userJson);
          const token = userData?.accessToken; // Extract the access token

          if (token) {
            await AuthSession.revokeAsync(
              { token },
              { revocationEndpoint: "https://oauth2.googleapis.com/revoke" }
            );
          }

          await AsyncStorage.removeItem("user");
          console.log("successful google delete user account");
        }
      }
      return "success";
    } catch (err) {
      setAuthError(err); // Make sure this function is defined and handles the error appropriately
    }
  }

  async function saveTranscript(uid, chatId, transcript) {
    try {
      await setDoc(
        doc(db, "users", uid, "foldersAndChats", chatId),
        {
          transcript: transcript,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving transcript to Firestore: ", error);
    }
  }

  async function saveTranscriptSummary(uid, chatId, summary) {
    try {
      await setDoc(
        doc(db, "users", uid, "foldersAndChats", chatId),
        {
          transcriptSummary: summary,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving transcript to Firestore: ", error);
    }
  }

  async function saveItemName(uid, chatId, name) {
    try {
      await setDoc(
        doc(db, "users", uid, "foldersAndChats", chatId),
        {
          name: name,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving Item Name to Firestore: ", error);
    }
  }

  async function moveToTrash(uid, chatId) {
    try {
      await setDoc(
        doc(db, "users", uid, "foldersAndChats", chatId),
        {
          status: "Deleted",
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error moving item to trash in Firestore: ", error);
    }
  }

  async function moveToLive(uid, chatId) {
    try {
      await setDoc(
        doc(db, "users", uid, "foldersAndChats", chatId),
        {
          status: "Live",
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error moving item to trash in Firestore: ", error);
    }
  }

  async function saveChat(uid, chatId, conversation) {
    try {
      await setDoc(
        doc(db, "users", uid, "foldersAndChats", chatId),
        {
          messages: conversation,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving conversation to Firestore: ", error);
    }
  }

  async function saveNoteResponse(uid, className, noteTitle, responses) {
    try {
      await setDoc(
        doc(db, "users", String(uid), "classes", className, "notes", noteTitle),
        {
          responses: responses,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving conversation to Firestore: ", error);
    }
  }

  async function saveGptResponse(uid, className, noteTitle, responses) {
    try {
      await setDoc(
        doc(db, "users", String(uid), "classes", className, "notes", noteTitle),
        {
          gptResponses: responses,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving conversation to Firestore: ", error);
    }
  }

  async function saveFolderIsOpen(uid, chatId, isOpen) {
    try {
      await setDoc(
        doc(db, "users", uid, "foldersAndChats", chatId),
        {
          isOpen: isOpen,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving conversation to Firestore: ", error);
    }
  }

  async function saveTranscribing(uid, chatId, transcribing) {
    try {
      await setDoc(
        doc(db, "users", uid, "foldersAndChats", chatId),
        {
          transcribing: transcribing,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving conversation to Firestore: ", error);
    }
  }
  async function saveProgress(
    uid,
    chatId,
    audioDuration,
    audioName,
    startTime
  ) {
    try {
      await setDoc(
        doc(db, "users", uid, "foldersAndChats", chatId),
        {
          audioDuration: audioDuration,
          audioName: audioName,
          startTime: startTime,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving conversation to Firestore: ", error);
    }
  }

  async function removeCredits(uid, amount) {
    try {
      const userDocRef = doc(db, "users", uid);

      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        console.error("User does not exist!");
        return;
      }
      const currentCredits = userDocSnap.data().credits || 0;

      const newCredits = currentCredits - amount;

      await setDoc(
        doc(db, "users", uid),
        {
          credits: newCredits,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error updating credits in Firestore: ", error);
    }
  }

  async function setItemParent(uid, chatId, parentId) {
    try {
      await setDoc(
        doc(db, "users", uid, "foldersAndChats", chatId),
        {
          parentId: parentId,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving conversation to Firestore: ", error);
    }
  }
  async function getUser(uid) {
    const docRef = doc(db, "users", String(uid));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
      return null;
    }
    return docSnap.data();
  }

  async function getChat(uid, chatId) {
    const docRef = doc(db, "users", uid, "foldersAndChats", chatId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
    }
    return docSnap.data();
  }

  async function getSidebarInfo(uid) {
    const q = query(collection(db, "users", uid, "foldersAndChats"));

    const querySnapshot = await getDocs(q);
    return querySnapshot;
  }

  async function createFoldersAndChats(
    uid,
    name,
    type,
    itemId,
    parentId = null
  ) {
    const docData = {
      userId: String(uid),
      name: name,
      type: type,
      createdDate: Timestamp.fromDate(new Date()),
      parentId: parentId,
      itemId: String(itemId),
      status: "Live",
      isOpen: true,
      transcribing: "No",
    };
    try {
      const docRef = await setDoc(
        doc(db, "users", uid, "foldersAndChats", String(itemId)),
        docData
      );
    } catch (e) {
      console.error(uid, " ", itemId);
      console.error(e);
    }
  }
  async function createUser(uid, email, name, photoUrl) {
    const docData = {
      userId: String(uid),
      createdDate: Timestamp.fromDate(new Date()),
      email: String(email),
      name: name, // Storing the user's name
      photoUrl: photoUrl, // Storing the user's photo URL
    };
    try {
      const docRef = await setDoc(doc(db, "users", String(uid)), docData);
    } catch (e) {
      console.error(e);
    }
  }

  function readUser(uid) {}

  function readChat(uid, chatId, folderId) {}

  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      return err.message;
    }
    return "success";
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function createNote(uid, className, noteTitle) {
    const docData = {
      userId: String(uid),
      className: className,
      noteTitle: noteTitle,
      createdDate: Timestamp.fromDate(new Date()),
    };
    try {
      const docRef = await setDoc(
        doc(db, "users", uid, "classes", className, "notes", noteTitle),
        docData
      );
    } catch (e) {
      console.error(e);
    }
  }

  async function getClass(uid, className) {
    const docRef = doc(db, "users", uid, "classes", className);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log("No such class!");
      return null;
    }
    return docSnap.data();
  }

  async function getNote(uid, className, noteTitle) {
    const docRef = doc(
      db,
      "users",
      uid,
      "classes",
      className,
      "notes",
      noteTitle
    );
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log("No such note!");
      return null;
    }
    return docSnap.data();
  }

  async function getAllClassNames(uid) {
    const classesRef = collection(db, "users", uid, "classes");
    const querySnapshot = await getDocs(classesRef);

    const classObjects = querySnapshot.docs.map((doc) => {
      return {
        className: doc.id, // className key now holds the document ID which is the class name
        ...doc.data(), // Spreading other data that may exist in the document
      };
    });

    return classObjects;
  }

  async function getAllNotes(uid, className) {
    const notesRef = collection(
      db,
      "users",
      uid,
      "classes",
      className,
      "notes"
    );
    const querySnapshot = await getDocs(notesRef);

    const notes = querySnapshot.docs.map((doc) => {
      return {
        noteTitle: doc.id,
        ...doc.data(),
      };
    });

    return notes;
  }

  async function createClass(uid, className) {
    const userExists = await getUser(String(uid));
    if (userExists === null) {
      return;
    }
    const classId = uuid.v4();
    const docData = {
      userId: String(uid),
      className: className,
      createdDate: Timestamp.fromDate(new Date()),
      status: "live",
      classId: classId,
    };
    try {
      const docRef = await setDoc(
        doc(db, "users", uid, "classes", classId),
        docData
      );
    } catch (e) {
      console.error(e);
    }
  }

  async function getAllClassNames(uid) {
    const classesRef = collection(db, "users", uid, "classes");
    const querySnapshot = await getDocs(classesRef);

    const classObjects = querySnapshot.docs.map((doc) => {
      return {
        className: doc.id, // className key now holds the document ID which is the class name
        ...doc.data(), // Spreading other data that may exist in the document
      };
    });

    return classObjects;
  }

  async function deleteNotebook(uid, classId) {
    try {
      await setDoc(
        doc(db, "users", String(uid), "classes", String(classId)),
        {
          status: "deleted",
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error moving item to trash in Firestore: ", error);
    }
  }

  async function editNotebookName(uid, classId, newname) {
    try {
      await setDoc(
        doc(db, "users", uid, "classes", classId),
        {
          className: newname,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving Item Name to Firestore: ", error);
    }
  }

  async function editLectureName(uid, classId, lectureId, newname) {
    try {
      await setDoc(
        doc(db, "users", uid, "classes", classId, "lectures", lectureId),
        {
          lectureName: newname,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving Item Name to Firestore: ", error);
    }
  }

  const [userInfo, setUserInfo] = useState();
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:
      "904136774468-a75bsq0qoktsqgp6ve1tad2tokf0l0ge.apps.googleusercontent.com",
    webClientId:
      "904136774468-ghdmlbf1o9joeabpg05ld9q4hlmkifmd.apps.googleusercontent.com",
  });

  const getUserInfo = async (token) => {
    //absent token
    if (!token) return;
    //present token
    try {
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const user = await response.json();
      //store user information  in Asyncstorage
      await AsyncStorage.setItem("user", JSON.stringify(user));
      setUserInfo(user);
    } catch (error) {
      console.error(
        "Failed to fetch user data:",
        response.status,
        response.statusText
      );
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Attempt to retrieve user information from AsyncStorage
      const userJSON = await AsyncStorage.getItem("user");

      if (userJSON) {
        // If user information is found in AsyncStorage, parse it and set it in the state
        setUserInfo(JSON.parse(userJSON));
      } else if (response?.type === "success") {
        // If no user information is found and the response type is "success" (assuming response is defined),
        // call getUserInfo with the access token from the response
        await getUserInfo(response.authentication.accessToken);
        const userJSON = await AsyncStorage.getItem("user");
        const userData = JSON.parse(userJSON);
        const userAlready = await getUser(userData.email);
        if (!userAlready) {
          await createUser(
            userData.email,
            userData.email,
            userData.name,
            userData.picture
          );
        }
        console.log("returning signinwithgoogle successful sign in ");

        return true;
      }
    } catch (error) {
      // Handle any errors that occur during AsyncStorage retrieval or other operations
      console.error("Error retrieving user data from AsyncStorage:", error);
    }
  };

  async function handleGoogleSignin() {
    console.log("running promptAsync");

    promptAsync();
    const success = await signInWithGoogle();
    if (success) {
      console.log("succesful google sign in ");
      return true;
    } else {
      return false;
    }
  }

  useEffect(() => {
    signInWithGoogle();
  }, [response]);

  //log the userInfo to see user details
  console.log(JSON.stringify(userInfo));

  async function createLecture(
    uid,
    classId,
    className,
    lectureName,
    abbrevDate,
    lectureId,
    rawNotesId
  ) {
    const docData = {
      userId: String(uid),
      lectureName: lectureName,
      className: className,
      abbrevDate: abbrevDate,
      classId: String(classId),
      createdDate: Timestamp.fromDate(new Date()),
      status: "live",
      lectureId: String(lectureId),
      rawNotesId: String(rawNotesId),
    };
    try {
      const docRef = await setDoc(
        doc(db, "users", uid, "classes", classId, "lectures", lectureId),
        docData
      );
      console.log("successful lecture creation");
      return "success";
    } catch (e) {
      console.error(e);
    }
  }

  async function createRawNotes(email, classId, lectureId, rawNoteId) {
    try {
      const docData = {
        email: String(email),
        classId: String(classId),
        lectureId: String(lectureId),
      };
      const docRef = await setDoc(
        doc(
          db,
          "users",
          email,
          "classes",
          classId,
          "lectures",
          lectureId,
          "rawNotes",
          rawNoteId
        ),
        docData
      );
      console.log("successful raw notes creation");
      return "success";
    } catch (e) {
      console.error(e);
    }
  }

  async function getRawNotes(email, classId, lectureId, rawNoteId) {
    const docRef = doc(
      db,
      "users",
      email,
      "classes",
      classId,
      "lectures",
      lectureId,
      "rawNotes",
      rawNoteId
    );
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
    }
    return docSnap.data();
  }

  async function saveRawNotes(email, classId, lectureId, rawNoteId, notes) {
    try {
      await setDoc(
        doc(
          db,
          "users",
          email,
          "classes",
          classId,
          "lectures",
          lectureId,
          "rawNotes",
          rawNoteId
        ),
        {
          notes: notes,
        },
        { merge: true }
      );
      return "success";
    } catch (error) {
      console.error("Error saving transcript to Firestore: ", error);
    }
    return null;
  }

  async function getAllLectureNames(uid, classId) {
    const classesRef = collection(
      db,
      "users",
      String(uid),
      "classes",
      String(classId),
      "lectures"
    );
    const querySnapshot = await getDocs(classesRef);

    const LectureObjects = querySnapshot.docs.map((doc) => {
      return {
        ...doc.data(),
      };
    });

    return LectureObjects;
  }

  async function deleteLecture(uid, classId, lectureId) {
    try {
      const docRef = doc(
        db,
        "users",
        String(uid),
        "classes",
        classId,
        "lectures",
        lectureId
      );

      console.log(`Attempting to update: ${docRef.path}`);

      await setDoc(docRef, { status: "deleted" }, { merge: true });

      console.log("Lecture status updated to 'deleted'");
    } catch (error) {
      console.error("Error moving item to trash in Firestore: ", error);
    }
  }

  const value = {
    loading,
    authError,
    signup,
    login,
    logout,
    resetPassword,
    createUser,
    createFoldersAndChats,
    saveChat,
    saveTranscript,
    getChat,
    getSidebarInfo,
    setItemParent,
    moveToTrash,
    moveToLive,
    saveItemName,
    saveTranscriptSummary,
    removeCredits,
    getUser,
    saveFolderIsOpen,
    saveTranscribing,
    saveProgress,
    verifyEmail,
    uploadLectureImage,
    createNote,
    getClass,
    getNote,
    getAllClassNames,
    getAllNotes,
    saveNoteResponse,
    saveGptResponse,
    setNoteInfo,
    createClass,
    getAllClassNames,
    deleteNotebook,
    editNotebookName,
    editLectureName,
    createLecture,
    getAllLectureNames,
    deleteLecture,
    handleGoogleSignin,
    createRawNotes,
    getRawNotes,
    saveRawNotes,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
