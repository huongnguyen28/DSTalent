module.exports = (mongoose) => {
  // Create the chatRoomSchema
  const chatRoomSchema = new mongoose.Schema(
    {
      // chat_room_id: {
      //   type: Number,
      //   required: true,
      //   unique: true, // Ensure room_id is unique
      // },
      community_id: {
        type: Number,
        required: true,
      },
      room_name: {
        type: String,
        required: true,
      },
      // members: [
      //   {
      //     type: Number, // member_id
      //     required: true,
      //   },
      // ],
      chat_messages: [
        {
          created_by: {
            type: Number, // user_id
            required: true,
          },
          message: {
            type: String,
            required: true,
          },
          created_at: {
            type: Date,
            default: Date.now, // Set default value to current date/time
          },
        },
      ],
    },
    {
      timestamps: true, // Automatically add createdAt and updatedAt fields
      versionKey: false, // Disable the __v field in the documents
    }
  );
  const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
  return ChatRoom;
};
