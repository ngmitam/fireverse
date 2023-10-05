/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

const deltaTime = 1000 * 60 * 60; // 1 hour;

admin.initializeApp();

exports.updateNotification = functions.firestore
	.document("/conversations/{conversationId}/messages/{messageId}")
	.onWrite(async (snapshot, context) => {
		const message = snapshot.after.data();
		const conversationId = context.params.conversationId;

		// get conversation users
		const conversation = await admin
			.firestore()
			.collection("conversations")
			.doc(conversationId)
			.get();

		const users = conversation.data().users;
		const sender = message.sender;

		// update notification for receiver

		const receiver = users.filter((user) => user !== sender)[0];

		const receiverNotification = await admin
			.firestore()
			.doc("notifications/" + receiver + "-" + conversationId)
			.get();

		let receiverNotificationData = receiverNotification.data();

		if (!receiverNotificationData) {
			// create new notification
			await admin
				.firestore()
				.doc("notifications/" + receiver + "-" + conversationId)
				.set({
					updateAt: Date.now(),
				});
		}
	});

exports.sendNotificationSchedule = functions.pubsub
	.schedule("every 1 minutes")
	.onRun(async () => {
		// get all notifications that need to be sent
		const notifications = await admin
			.firestore()
			.collection("notifications")
			.where("updateAt", "<=", Date.now() - deltaTime)
			.get();

		const tokensToRemove = [];
		// send notifications
		for (let notification of notifications.docs) {
			const [receiver, conversationId] = notification.id.split("-");
			const conversation = await admin
				.firestore()
				.collection("conversations")
				.doc(conversationId)
				.get();

			const users = conversation.data().users;
			const sender = users.filter((user) => user !== receiver)[0];
			const senderData = await admin
				.firestore()
				.collection("users")
				.doc(sender)
				.get();

			const receiverData = await admin
				.firestore()
				.collection("users")
				.doc(receiver)
				.get();

			const tokens = receiverData.data().tokens;
			const payload = {
				notification: {
					title: senderData.data().displayName || "New message",
					body: "New message from " + senderData.data().displayName,
				},
				tokens,
			};

			const response = await admin
				.messaging()
				.sendEachForMulticast(payload);
			// For each message check if there was an error.
			response.responses.forEach((result, index) => {
				const error = result.error;
				if (error) {
					functions.logger.error(
						"Failure sending notification to",
						tokens[index],
						error
					);
					// Cleanup the tokens who are not registered anymore.
					if (
						error.code === "messaging/invalid-registration-token" ||
						error.code ===
							"messaging/registration-token-not-registered"
					) {
						tokensToRemove.push(
							admin
								.firestore()
								.collection("users")
								.doc(receiver)
								.update({
									tokens: admin.firestore.FieldValue.arrayRemove(
										tokens[index]
									),
								})
						);
					}
				} else {
					functions.logger.log("Notification sent successfully");
					// delete notification
					tokensToRemove.push(
						admin
							.firestore()
							.collection("notifications")
							.doc(notification.id)
							.delete()
					);
				}
			});
		}
		return Promise.all(tokensToRemove);
	});
