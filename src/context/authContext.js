import React, { useContext, useState, useEffect } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
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
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import { signInWithCredential } from "firebase/auth";
import uuid from "react-native-uuid";

import { db } from "../../firebaseConfig";
import * as AuthSession from "expo-auth-session";
import { encode as btoa } from "base-64";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const storage = getStorage();
  const [noteInfo, setNoteInfo] = useState({ className: "", noteName: "" });

  const auth = getAuth();

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
        await createUser(user.uid, email, "no_name", "no_photo");
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

  function logout() {
    try {
      signOut(auth);
    } catch (err) {
      setAuthError(err);
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
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
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
      email: email,
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
        doc(db, "users", uid, "classes", classId),
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

  async function createLecture(
    uid,
    classId,
    className,
    lectureName,
    abbrevDate,
    lectureId
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
    };
    try {
      const docRef = await setDoc(
        doc(db, "users", uid, "classes", classId, "lectures", lectureId),
        docData
      );
    } catch (e) {
      console.error(e);
    }
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
        uid,
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
    noteInfo,
    setNoteInfo,
    createClass,
    getAllClassNames,
    deleteNotebook,
    editNotebookName,
    editLectureName,
    createLecture,
    getAllLectureNames,
    deleteLecture,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
