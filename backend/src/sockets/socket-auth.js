const jwt = require("jsonwebtoken");
const { SOCKET_EVENT } = require("../utils/services");
4;
const db = require("../configs/db");
const ChatRoom = db.chat_room;
const ChatMember = db.chat_member;
const Member = db.member;
const Community = db.community;
const User = db.user;

const socketAuthentication = (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.token;
  // console.log(token);
  if (!token) {
    return next(new Error("You are not authenticated!"));
  }

  jwt.verify(token, process.env.JWT_ACCESS_KEY, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError")
        return next(new Error("Token has expired!"));
      else return next(new Error("Token is not valid!"));
    }
    socket.user = user;
    next();
  });
};

// const socketAuthorization = async ([event, ...agrs], next) => {
//   const socket = this;
//   if (
//     event === SOCKET_EVENT.CONNECT ||
//     event === SOCKET_EVENT.DISCONNECT ||
//     event === SOCKET_EVENT.JOIN_ROOM
//   ) {
//     return next();
//   }
//   console.log(agrs);
//   const chatRoomId = socket.chatRoomId;
//   const userId = socket.user?.user_id;
//   console.log(socket);
//   console.log(chatRoomId, userId);
//   if (!chatRoomId) {
//     return next(new Error("User is not in a chat room!"));
//   }
//   if (!userId) {
//     return next(new Error("User is not authorized to perform this action!"));
//   }
//   const chatMember = await ChatMember.findOne({
//     chat_room_id: chatRoomId,
//     user_id: userId,
//   });
//   if (!chatMember || chatMember.is_joined === false) {
//     return next(new Error("User is not a member of this chat room!"));
//   }
//   return next();
// };

module.exports = {
  socketAuthentication,
  // socketAuthorization,
};
