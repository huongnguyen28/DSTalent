const { SOCKET_EVENT } = require("../utils/services");
const socketAuth = require("./socket-auth");
const db = require("../configs/db");
const ChatRoom = db.chat_room;
const ChatMember = db.chat_member;

module.exports = (io) => {
  // use socket authenication middleware
  io.use(socketAuth);

  io.on(SOCKET_EVENT.CONNECT, (socket) => {
    console.log("We have a new connection!!!");

    socket.on(SOCKET_EVENT.JOIN_ROOM, async ({ chatRoomId }, callback) => {
      console.log("User is joining room: ", chatRoomId);
      const chatMember = await ChatMember.findOne({
        chat_room_id: chatRoomId,
        user_id: socket.user.user_id,
      });
      if (!chatMember || chatMember.is_joined === false) {
        console.log("User is not a member of this chat room!");
        return callback("User is not a member of this chat room!");
      }
      socket.join(chatRoomId);
      console.log("User has joined room: ", chatRoomId);

      // This callback is called without any arguments if there is no error
      callback();
    });

    socket.on(SOCKET_EVENT.SEND_MESSAGE, ({ chatRoomId, message }) => {
      console.log("User is sending message: ", message);
      io.to(chatRoomId).emit(SOCKET_EVENT.RECEIVE_MESSAGE, {
        chatRoomId,
        message,
        user: socket.user_id,
      });
    });

    socket.on(SOCKET_EVENT.DISCONNECT, () => {
      console.log("User had left!!!");
    });
  });
};
