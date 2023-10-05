import { FC, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { auth, db, _getToken, onMessageListener } from "./shared/firebase";
import { doc, setDoc } from "firebase/firestore";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import BarWave from "react-cssfx-loading/src/BarWave";
import Chat from "./pages/Chat";
import Home from "./pages/Home";
import PrivateRoute from "./components/PrivateRoute";
import SignIn from "./pages/SignIn";
import { onAuthStateChanged } from "firebase/auth";
import { useStore } from "./store";

const App: FC = () => {
	const currentUser = useStore((state) => state.currentUser);
	const setCurrentUser = useStore((state) => state.setCurrentUser);
	const [isTokenFound, setTokenFound] = useState(false);
	_getToken(setTokenFound);

	useEffect(() => {
		onAuthStateChanged(auth, (user) => {
			if (user) {
				setCurrentUser(user);
				setDoc(doc(db, "users", user.uid), {
					uid: user.uid,
					email: user.email,
					displayName: user.displayName,
					photoURL: user.photoURL,
					phoneNumber:
						user.phoneNumber || user.providerData?.[0]?.phoneNumber,
				});
			} else setCurrentUser(null);
		});
	}, []);

	onMessageListener()
		.then((payload: any) => {
			toast(payload?.notification?.body ?? "", {
				position: "top-right",
				autoClose: false,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: "dark",
			});
		})
		.catch((err) => console.log("failed: ", err));

	if (typeof currentUser === "undefined")
		return (
			<div className="flex min-h-screen items-center justify-center">
				<BarWave />
			</div>
		);

	return (
		<>
			<Routes>
				<Route
					index
					element={
						<PrivateRoute>
							<Home />
						</PrivateRoute>
					}
				/>
				<Route path="sign-in" element={<SignIn />} />
				<Route
					path=":id"
					element={
						<PrivateRoute>
							<Chat />
						</PrivateRoute>
					}
				/>
			</Routes>
			<ToastContainer />
		</>
	);
};

export default App;
