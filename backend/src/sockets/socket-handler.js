const { SOCKET_EVENT, SERVER_MESSAGE_TYPE } = require("../utils/services");
const { socketAuthentication } = require("./socket-auth");
const db = require("../configs/db");
const ChatRoom = db.chat_room;
const ChatMember = db.chat_member;
const Member = db.member;
const Community = db.community;
const User = db.user;
const { Op } = require("sequelize");

module.exports = (io) => {
  // use socket authenication middleware
  io.use(socketAuthentication);

  io.on(SOCKET_EVENT.CONNECT, (socket) => {
    // use socket authorization middleware
    socket.use(async ([event, ...agrs], next) => {
      if (
        event === SOCKET_EVENT.CONNECT ||
        event === SOCKET_EVENT.DISCONNECT ||
        event === SOCKET_EVENT.JOIN_ROOM
      ) {
        return next();
      }
      // console.log(agrs);
      const chatRoomId = socket.chatRoomId;
      const userId = socket.user?.user_id;
      // console.log(socket);
      // console.log(chatRoomId, userId);
      if (!chatRoomId) {
        return next(new Error("User is not in a chat room!"));
      }
      if (!userId) {
        return next(
          new Error("User is not authorized to perform this action!")
        );
      }
      const chatMember = await ChatMember.findOne({
        chat_room_id: chatRoomId,
        user_id: userId,
      });
      if (!chatMember || chatMember.is_joined === false) {
        return next(new Error("User is not a member of this chat room!"));
      }
      return next();
    });

    socket.on(SOCKET_EVENT.JOIN_ROOM, async (data, callback) => {
      if (!callback) {
        callback = () => {};
      }
      const { chat_room_id: chatRoomId } = data;
      const chatMember = await ChatMember.findOne({
        chat_room_id: chatRoomId,
        user_id: socket.user.user_id,
      });
      if (!chatMember || chatMember.is_joined === false) {
        socket.emit(SOCKET_EVENT.SERVER_MESSAGE, {
          message_type: SERVER_MESSAGE_TYPE.ERROR,
          message: "User is not a member of this chat room!",
        });
        return callback("User is not a member of this chat room!");
      }
      socket.join(chatRoomId);
      socket.chatRoomId = chatRoomId;

      const chatRoom = await ChatRoom.findById(chatRoomId).select(
        "-chat_messages"
      );
      if (!chatRoom) {
        socket.emit(SOCKET_EVENT.SERVER_MESSAGE, {
          message_type: SERVER_MESSAGE_TYPE.ERROR,
          message: "Chat room not found!",
        });
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
      const { message } = data;
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
        message: message,
        created_at: new Date(),
      };
      chatRoom.chat_messages.push(newChatMessage);
      await chatRoom.save(); // no need to use await here because we don't need to wait for the result
      // Tìm thông tin người dùng
      const user = await User.findByPk(userId);
      const userName = user?.full_name || "Unknown User"; // Tên người dùng
      const avatar = user?.avatar || ""; // Avatar người dùng

      // Phát tin nhắn tới tất cả người dùng trong phòng trừ người gửi
      socket.broadcast.to(chatRoomId).emit(SOCKET_EVENT.RECEIVE_MESSAGE, {
        chat_room_id: chatRoomId,
        newMessage: {
          _id: chatRoom.chat_messages[chatRoom.chat_messages.length - 1]._id, // ID của tin nhắn
          text: newChatMessage.message, // Nội dung tin nhắn
          createdAt: new Date(newChatMessage.created_at), // Thời gian tạo tin nhắn
          user: {
            _id: newChatMessage.created_by, // ID của người gửi
            name: userName, // Tên người gửi
            avatar: avatar, // Avatar của người gửi
          },
        },
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
      await chatRoom.save();
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
      const newChatMember = await ChatMember.findOne({
        chat_room_id: chatRoomId,
        user_id: userId,
      });
      if (newChatMember) {
        if (newChatMember.is_joined === true) {
          socket.emit(SOCKET_EVENT.SERVER_MESSAGE, {
            message_type: SERVER_MESSAGE_TYPE.ERROR,
            message: "User is already a member of this chat room!",
          });
          return;
        }
        newChatMember.is_joined = true;
        await newChatMember.save();
      }
      const memberInCommunity = await Member.findOne({
        where: {
          community_id: chatRoom.community_id,
          user_id: userId,
        },
      });
      if (!memberInCommunity) {
        socket.emit(SOCKET_EVENT.SERVER_MESSAGE, {
          message_type: SERVER_MESSAGE_TYPE.ERROR,
          message: "User is not a member of this community!",
        });
        return;
      }
      const newMemberInfo = await User.findOne({
        attributes: ["full_name", "avatar"],
        where: {
          user_id: userId,
        },
      });
      io.to(chatRoomId).emit(SOCKET_EVENT.SERVER_MESSAGE, {
        chat_room_id: chatRoomId,
        message_type: SERVER_MESSAGE_TYPE.CHAT_MEMBERS_UPDATED,
        message: {
          user_id: userId,
          full_name: newMemberInfo.full_name,
          avatar: newMemberInfo.avatar,
          added_by: socket.user.user_id,
        },
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
      io.to(chatRoomId).emit(SOCKET_EVENT.SERVER_MESSAGE, {
        chat_room_id: chatRoomId,
        message_type: SERVER_MESSAGE_TYPE.CHAT_MEMBERS_UPDATED,
        message: {
          user_id: userId,
          removed_by: socket.user.user_id,
        },
      });

      // Find the socket associated with the removed member
      const socketToRemove = [...io.sockets.sockets.values()].find(
        (s) => s.user.user_id === userId
      );

      if (socketToRemove) {
        // Make the socket leave the chat room
        socketToRemove.leave(chatRoomId);
        socketToRemove.chatRoomId = null;
      }
    });

    socket.on(SOCKET_EVENT.DISCONNECT, () => {
      console.log("User had left!!!");
    });

    socket.on(SOCKET_EVENT.ERROR, (error) => {
      // console.log(error);
      // console.log(typeof error);
      socket.emit(SOCKET_EVENT.SERVER_MESSAGE, {
        message_type: SERVER_MESSAGE_TYPE.ERROR,
        message: error.message,
      });
    });
  });
};
