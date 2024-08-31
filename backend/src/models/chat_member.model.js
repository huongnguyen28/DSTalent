module.exports = (mongoose) => {
  // Create the chatMemberSchema
  const chatMemberSchema = new Schema({
    chat_room_id: {
      type: Number,
      required: true,
    },
    // member_id: {
    //   type: Number,
    //   required: true,
    // },
    user_id: {
      type: Number,
      required: true,
    },
    is_joined: {
      type: Boolean,
      required: true,
    },
  });
  const ChatMember = mongoose.model("ChatMember", chatMemberSchema);
  return ChatMember;
};
