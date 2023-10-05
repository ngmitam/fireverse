// Scripts for firebase and firebase messaging
importScripts(
	"https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
	"https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

// Initialize the Firebase app in the service worker by passing the generated config
var firebaseConfig = {
	apiKey: "AIzaSyDGu1NWCHBr3ohhdaGuCKSVjEHuk6lTmcQ",
	authDomain: "chat-demo-3b49e.firebaseapp.com",
	projectId: "chat-demo-3b49e",
	storageBucket: "chat-demo-3b49e.appspot.com",
	messagingSenderId: "256297829886",
	appId: "1:256297829886:web:d17fa0e5166a4043702caf",
	measurementId: "G-P7CS5HBS0S",
};

firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
	const notificationTitle = payload.notification.title;
	const notificationOptions = {
		body: payload.notification.body,
	};

	self.registration.showNotification(notificationTitle, notificationOptions);
});
