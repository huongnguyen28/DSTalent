const { formatResponse, STATUS_CODE } = require("../utils/services");
const db = require("../configs/db.js");
const ChatRoom = db.chat_room;
const ChatMember = db.chat_member;
const Member = db.member;
const Community = db.community;
const User = db.user;
const { Op } = require("sequelize");

// Create a chat room
// Body: { room_name, members: [user_id1, user_id2, ...] }
const createChatRoom = async (req, res) => {
  const communityId = req.member.community_id;
  const roomName = req.body.room_name;
  // memberList contains list of user_id
  // it must not be empty
  const memberList = req.body.members;
  if (!communityId || !roomName || !memberList) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.BAD_REQUEST,
      "Missing required fields!"
    );
  }
  const chatRoom = new ChatRoom({
    community_id: communityId,
    room_name: roomName,
    chat_messages: [],
  });
  const savedChatRoom = await chatRoom.save();
  const chatRoomId = savedChatRoom._id;
  if (!chatRoomId) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to create chat room!"
    );
  }
  const chatMemberList = memberList.map((member) => ({
    chat_room_id: chatRoomId,
    user_id: member,
    is_joined: true,
  }));
  const savedChatMembers = await ChatMember.insertMany(chatMemberList);
  if (!savedChatMembers) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to create chat room!"
    );
  }
  return formatResponse(
    res,
    { chat_room_id: chatRoomId, members: memberList },
    STATUS_CODE.SUCCESS,
    "Chat room created successfully!"
  );
};

// Get all chat rooms that the user is a member of
// return chat room name and chat room id
const getChatRooms = async (req, res) => {
  const userId = req.user.user_id;
  const chatMembers = await ChatMember.find({ user_id: userId });
  // console.log(chatMembers);
  const chatRoomIds = chatMembers.map((member) => member.chat_room_id);
  // console.log(chatRoomIds);
  // const communityId = req.params.community_id;
  const communityId = req.member.community_id;
  // console.log(communityId);
  // Select only 'room_name', '_id' (which is the chat_room_id), and 'community_id'
  const chatRooms = await ChatRoom.find({
    _id: { $in: chatRoomIds },
    community_id: communityId,
  });
  // console.log(chatRooms);

  // If you want to explicitly include the _id as chat_room_id
  const formattedChatRooms = await Promise.all(
    chatRooms.map(async (room) => {
      // Find the user by ID (assumes `User.findById` returns a promise)
      // console.log(room);
      const len = room.chat_messages.length;
      const lastMessageInfo = room.chat_messages[len - 1];
      let user;
      if (lastMessageInfo == null) {
        user = null;
      } else {
        user = await User.findByPk(lastMessageInfo.created_by);
      }

      // Return the formatted object
      return {
        chat_room_id: room._id,
        room_name: room.room_name,
        community_id: room.community_id,
        last_message: lastMessageInfo != null ? lastMessageInfo.message : "",
        last_message_time:
          lastMessageInfo != null ? lastMessageInfo.created_at : "",
        full_name: user != null ? user.full_name : "", // Handle case where user is not found
      };
    })
  );
  return formatResponse(
    res,
    formattedChatRooms,
    STATUS_CODE.SUCCESS,
    "Get chat rooms successfully!"
  );
};

// Get chat room details
// return chat room name, chat room id, community id, and members, created_at, updated_at
// only if the user is a member of the chat room
const getChatRoomDetails = async (req, res) => {
  const chatRoomId = req.params.chat_room_id;
  // check if user is a member of the chat room
  const userId = Number(req.user.user_id);
  const chatMember = await ChatMember.findOne({
    chat_room_id: chatRoomId,
    user_id: userId,
  });
  // console.log(userId);
  // console.log(chatRoomId);
  // console.log(chatMember);
  if (!chatMember) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.NOT_FOUND,
      "Chat Room not found!"
    );
  }
  if (chatMember.is_joined === false) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.FORBIDDEN,
      "User is not a member of this chat room!"
    );
  }
  const chatRoom = await ChatRoom.findById(chatRoomId).select("-chat_messages");
  if (!chatRoom) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.NOT_FOUND,
      "Chat room not found!"
    );
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
  const formattedResponseMembers = responseMembers.map((member) => ({
    _id: member.user_id,
    name: member.full_name,
    avatar: member.avatar == null ? "" : member.avatar,
  }));
  const formattedChatRoomDetails = {
    chat_room_id: chatRoom._id,
    room_name: chatRoom.room_name,
    community_id: chatRoom.community_id,
    members: formattedResponseMembers,
    created_at: chatRoom.createdAt,
    updated_at: chatRoom.updatedAt,
  };
  return formatResponse(
    res,
    formattedChatRoomDetails,
    STATUS_CODE.SUCCESS,
    "Get chat room details successfully!"
  );
};

const addChatMember = async (req, res) => {
  const chatRoomId = req.params.chat_room_id;
  const userId = req.body.user_id; // user_id to be added to the chat room
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.NOT_FOUND,
      "Chat room not found!"
    );
  }
  const chatMember = await ChatMember.findOne({
    chat_room_id: chatRoomId,
    user_id: userId,
  });
  if (chatMember) {
    if (chatMember.is_joined === true) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "User is already a member of this chat room!"
      );
    }
    chatMember.is_joined = true;
    const updatedChatMember = await chatMember.save();
    const user = await User.findByPk(userId);
    const formattedSavedChatMember = {
      chatMember: updatedChatMember,
      user: {
        _id: userId,
        name: user.full_name,
        avatar: user.avatar == null ? "" : user.avatar,
      },
    };
    return formatResponse(
      res,
      formattedSavedChatMember,
      STATUS_CODE.SUCCESS,
      "Add chat member successfully!"
    );
  }
  const newChatMember = new ChatMember({
    chat_room_id: chatRoomId,
    user_id: userId,
    is_joined: true,
  });
  const savedChatMember = await newChatMember.save();
  const user = await User.findByPk(userId);
  const formattedSavedChatMember = {
    chatMember: savedChatMember,
    user: {
      _id: userId,
      name: user.full_name,
      avatar: user.avatar == null ? "" : user.avatar,
    },
  };
  return formatResponse(
    res,
    formattedSavedChatMember,
    STATUS_CODE.SUCCESS,
    "Add chat member successfully!"
  );
};

const removeChatMember = async (req, res) => {
  const chatRoomId = req.params.chat_room_id;
  const userId = req.params.user_id; // user_id to be removed from the chat room
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.NOT_FOUND,
      "Chat room not found!"
    );
  }
  const chatMember = await ChatMember.findOne({
    chat_room_id: chatRoomId,
    user_id: userId,
  });
  if (!chatMember) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.NOT_FOUND,
      "Chat member not found!"
    );
  }
  if (chatMember.is_joined === false) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.BAD_REQUEST,
      "User is not a member of this chat room!"
    );
  }
  chatMember.is_joined = false;
  const updatedChatMember = await chatMember.save();
  return formatResponse(
    res,
    chatMember,
    STATUS_CODE.SUCCESS,
    "Remove chat member successfully!"
  );
};

// Update chat room name
const updateChatRoom = async (req, res) => {
  const chatRoomId = req.params.chat_room_id;
  const roomName = req.body.room_name;
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.NOT_FOUND,
      "Chat room not found!"
    );
  }
  chatRoom.room_name = roomName;
  const updatedChatRoom = await chatRoom.save();
  const formattedChatRoom = {
    chat_room_id: chatRoomId,
    room_name: roomName,
    community_id: chatRoom.community_id,
    created_at: chatRoom.createdAt,
    updated_at: chatRoom.updatedAt,
  };

  return formatResponse(
    res,
    formattedChatRoom,
    STATUS_CODE.SUCCESS,
    "Update chat room successfully!"
  );
};

// Get chat messages in a chat room
const getChatMessages = async (req, res) => {
  const chatRoomId = req.params.chat_room_id;
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.NOT_FOUND,
      "Chat room not found!"
    );
  }
  const chatMessages = await Promise.all(
    chatRoom.chat_messages.map(async (message) => {
      const user = await User.findByPk(message.created_by);
      return {
        _id: message._id,
        user: {
          _id: message.created_by,
          name: user.full_name,
          avatar: user.avatar == null ? "" : user.avatar,
        },
        text: message.message,
        createdAt: message.created_at,
      };
    })
  );

  return formatResponse(
    res,
    chatMessages,
    STATUS_CODE.SUCCESS,
    "Get chat messages successfully!"
  );
};

const sendChatMessage = async (req, res) => {
  const chatRoomId = req.params.chat_room_id;
  const userId = req.user.user_id;
  const message = req.body.message;
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.NOT_FOUND,
      "Chat room not found!"
    );
  }
  const newChatMessage = {
    created_by: userId,
    message: message,
    created_at: new Date(),
  };
  chatRoom.chat_messages.push(newChatMessage);
  const updatedChatRoom = await chatRoom.save();
  return formatResponse(
    res,
    { newChatMessage, chat_room_id: chatRoomId },
    STATUS_CODE.SUCCESS,
    "Send chat message successfully!"
  );
};

module.exports = {
  getChatRooms,
  createChatRoom,
  getChatRoomDetails,
  addChatMember,
  removeChatMember,
  updateChatRoom,
  getChatMessages,
  sendChatMessage,
};
