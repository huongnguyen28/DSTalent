const { SOCKET_EVENT, SERVER_MESSAGE_TYPE } = require("../utils/services");
const socketAuth = require("./socket-auth");
const db = require("../configs/db");
const ChatRoom = db.chat_room;
const ChatMember = db.chat_member;
const Member = db.member;
const Community = db.community;
const User = db.user;
const { Op } = require("sequelize");

module.exports = (io) => {
  // use socket authenication middleware
  io.use(socketAuth);

  io.on(SOCKET_EVENT.CONNECT, (socket) => {
    console.log("We have a new connection!!!");

    socket.on(SOCKET_EVENT.STOP_TYPING, (object) => {
      console.log(typeof object);
      console.log("User has stopped typing: ", object);
    });

    socket.on(SOCKET_EVENT.JOIN_ROOM, async (data, callback) => {
      if (!callback) {
        callback = () => {};
      }
      const { chat_room_id: chatRoomId } = data;
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
      socket.chatRoomId = chatRoomId;
      console.log("User has joined room: ", chatRoomId);

      const chatRoom = await ChatRoom.findById(chatRoomId).select(
        "-chat_messages"
      );
      if (!chatRoom) {
        console.log("Chat room not found!");
        return callback("Chat room not found!");
      }
      const chatMembers = await ChatMember.find({
        chat_room_id: chatRoomId,
        is_joined: true,
      });
      const members = chatMembers.map((member) => member.user_id);
      const responseMembers = await User.findAll({
        attributes: ["user_id", "full_name", "avatar"],
        where: {
          user_id: {
            [Op.in]: members, // Use the Op.in operator to match user_id with members array
          },
        },
      });
      const formattedChatRoomDetails = {
        chat_room_id: chatRoom._id,
        room_name: chatRoom.room_name,
        community_id: chatRoom.community_id,
        members: responseMembers,
        created_at: chatRoom.createdAt,
        updated_at: chatRoom.updatedAt,
      };
      socket.emit(SOCKET_EVENT.SERVER_MESSAGE, {
        chat_room_id: chatRoomId,
        message_type: SERVER_MESSAGE_TYPE.CHAT_ROOM_DETAILS,
        chat_room_details: formattedChatRoomDetails,
      });

      // This callback is called without any arguments if there is no error
      callback();
    });

    socket.on(SOCKET_EVENT.SEND_MESSAGE, async (data) => {
      // const { chat_room_id: chatRoomId, message } = data;
      const { content } = data;
      const chatRoomId = socket.chatRoomId;
      const userId = socket.user.user_id;
      const chatRoom = await ChatRoom.findById(chatRoomId);
      if (!chatRoom) {
        socket.emit(SOCKET_EVENT.SERVER_MESSAGE, {
          message_type: SERVER_MESSAGE_TYPE.ERROR,
          message: "Chat room not found!",
        });
        return;
      }
      const newChatMessage = {
        created_by: userId,
        content: content,
        created_at: new Date(),
      };
      chatRoom.chat_messages.push(newChatMessage);
      chatRoom.save(); // no need to use await here because we don't need to wait for the result
      console.log("User is sending message: ", message);
      socket.broadcast.to(chatRoomId).emit(SOCKET_EVENT.RECEIVE_MESSAGE, {
        chat_room_id: chatRoomId,
        message,
        user: socket.user,
      });
    });

    // update chat room name
    socket.on(SOCKET_EVENT.UPDATE_CHAT_ROOM, async (data) => {
      const { chat_room_id: chatRoomId, room_name: roomName } = data;
      const chatRoom = await ChatRoom.findById(chatRoomId).select(
        "-chat_messages"
      );
      if (!chatRoom) {
        socket.emit(SOCKET_EVENT.SERVER_MESSAGE, {
          message_type: SERVER_MESSAGE_TYPE.ERROR,
          message: "Chat room not found!",
        });
        return;
      }
      chatRoom.room_name = roomName;
      chatRoom.save(); // no need to use await here because we don't need to wait for the result
      // const formattedChatRoom = {
      //   chat_room_id: chatRoom._id,
      //   room_name: roomName,
      //   community_id: chatRoom.community_id,
      //   created_at: chatRoom.createdAt,
      //   updated_at: chatRoom.updatedAt,
      // };
      io.to(chatRoomId).emit(SOCKET_EVENT.SERVER_MESSAGE, {
        chat_room_id: chatRoomId,
        message_type: SERVER_MESSAGE_TYPE.CHAT_ROOM_NAME_UPDATED,
        room_name: roomName,
      });
    });

    socket.on(SOCKET_EVENT.ADD_CHAT_MEMBER, async (data) => {
      const { chat_room_id: chatRoomId, user_id: userId } = data;
      const chatRoom = await ChatRoom.findById(chatRoomId);
      if (!chatRoom) {
        socket.emit(SOCKET_EVENT.SERVER_MESSAGE, {
          message_type: SERVER_MESSAGE_TYPE.ERROR,
          message: "Chat room not found!",
        });
        return;
      }
      const chatMember = await ChatMember.findOne({
        chat_room_id: chatRoomId,
        user_id: userId,
      });
      if (chatMember) {
        if (chatMember.is_joined === true) {
          socket.emit(SOCKET_EVENT.SERVER_MESSAGE, {
            message_type: SERVER_MESSAGE_TYPE.ERROR,
            message: "User is already a member of this chat room!",
          });
          return;
        }
        chatMember.is_joined = true;
        await chatMember.save();
      }
      const chatMembers = await ChatMember.find({
        chat_room_id: chatRoomId,
        is_joined: true,
      });
      const members = chatMembers.map((member) => member.user_id);
      const responseMembers = await User.findAll({
        attributes: ["user_id", "full_name", "avatar"],
        where: {
          user_id: {
            [Op.in]: members, // Use the Op.in operator to match user_id with members array
          },
        },
      });
      io.to(chatRoomId).emit(SOCKET_EVENT.SERVER_MESSAGE, {
        chat_room_id: chatRoomId,
        message_type: SERVER_MESSAGE_TYPE.CHAT_MEMBERS_UPDATED,
        members: responseMembers,
      });
    });

    socket.on(SOCKET_EVENT.REMOVE_CHAT_MEMBER, async (data) => {
      const { chat_room_id: chatRoomId, user_id: userId } = data;
      const chatRoom = await ChatRoom.findById(chatRoomId);
      if (!chatRoom) {
        socket.emit(SOCKET_EVENT.SERVER_MESSAGE, {
          message_type: SERVER_MESSAGE_TYPE.ERROR,
          message: "Chat room not found!",
        });
        return;
      }
      const chatMember = await ChatMember.findOne({
        chat_room_id: chatRoomId,
        user_id: userId,
      });
      if (!chatMember || chatMember.is_joined === false) {
        socket.emit(SOCKET_EVENT.SERVER_MESSAGE, {
          message_type: SERVER_MESSAGE_TYPE.ERROR,
          message: "User is not a member of this chat room!",
        });
        return;
      }
      chatMember.is_joined = false;
      await chatMember.save();
      const chatMembers = await ChatMember.find({
        chat_room_id: chatRoomId,
        is_joined: true,
      });
      const members = chatMembers.map((member) => member.user_id);
      const responseMembers = await User.findAll({
        attributes: ["user_id", "full_name", "avatar"],
        where: {
          user_id: {
            [Op.in]: members, // Use the Op.in operator to match user_id with members array
          },
        },
      });
      io.to(chatRoomId).emit(SOCKET_EVENT.SERVER_MESSAGE, {
        chat_room_id: chatRoomId,
        message_type: SERVER_MESSAGE_TYPE.CHAT_MEMBERS_UPDATED,
        members: responseMembers,
      });
    });

    socket.on(SOCKET_EVENT.DISCONNECT, () => {
      console.log("User had left!!!");
    });
  });
};
