import {
	arrayUnion,
	doc,
	enableIndexedDbPersistence,
	getFirestore,
	updateDoc,
} from "firebase/firestore";

import configs from "./configs";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeApp } from "firebase/app";

import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseApp = initializeApp(JSON.parse(configs.firebaseConfig));

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const messaging = getMessaging(firebaseApp);

export const _getToken = (setTokenFound: (arg0: boolean) => void) => {
	return (
		auth.currentUser?.uid &&
		getToken(messaging, { vapidKey: configs.vapidKey })
			.then((currentToken) => {
				if (currentToken) {
					console.log("current token for client: ", currentToken);
					setTokenFound(true);
					// Track the token -> client mapping, by sending to backend server
					// show on the UI that permission is secured
					updateDoc(doc(db, "users", auth.currentUser?.uid || ""), {
						tokens: arrayUnion(currentToken),
					});
				} else {
					console.log(
						"No registration token available. Request permission to generate one."
					);
					setTokenFound(false);
					// shows on the UI that permission is required
				}
			})
			.catch((err) => {
				console.log("An error occurred while retrieving token. ", err);
				// catch error while creating client token
			})
	);
};

export const onMessageListener = () =>
	new Promise((resolve) => {
		onMessage(messaging, (payload) => {
			resolve(payload);
		});
	});

enableIndexedDbPersistence(db, { forceOwnership: false });
