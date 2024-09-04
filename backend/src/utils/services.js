const jwt = require("jsonwebtoken");
const appRootPath = require("app-root-path");
const fs = require("fs").promises;

const formatFilePath = (fileName) => {
  const path = appRootPath + "\\public\\upload\\" + fileName;
  console.log(path);
  console.log(fileName);
  return path;
};

const generateToken = (user, secret_key, expire) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
    },
    secret_key,
    { expiresIn: expire }
  );
};

const generageVerifyCode = (username) => {
  const min = Math.pow(10, 6 - 1);
  const max = Math.pow(10, 6) - 1;
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return username + "-" + num.toString();
};

function generateRandomPassword(length) {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*";

  const allChars = lowercase + uppercase + numbers + specialChars;

  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars[randomIndex];
  }

  return password;
}

const readAndTransformImageToBase64 = async (imagePath) => {
  try {
    const data = await fs.readFile(imagePath);
    const base64Image = data.toString("base64");
    const imageData = "data:image/jpeg;base64," + base64Image;
    return imageData;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const STATUS_CODE = {
  SUCCESS: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  PARTIAL_CONTENT: 206,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

const formatResponse = (
  res,
  data,
  status = STATUS_CODE.OK,
  message = "Success!"
) => {
  return res.status(status).json({
    data,
    status,
    message,
  });
};

const SOCKET_EVENT = {
  CONNECT: "connection",
  DISCONNECT: "disconnect",
  SEND_MESSAGE: "send_message",
  RECEIVE_MESSAGE: "receive_message",
  ADD_CHAT_MEMBER: "add_chat_member",
  REMOVE_CHAT_MEMBER: "remove_chat_member",
  UPDATE_CHAT_ROOM: "update_chat_room",
  SERVER_MESSAGE: "server_message",
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  ERROR: "error",
};

const SERVER_MESSAGE_TYPE = {
  CHAT_ROOM_DETAILS: "chat_room_details",
  CHAT_ROOM_NAME_UPDATED: "chat_room_name_updated",
  CHAT_MEMBERS_UPDATED: "chat_members_updated",
  ERROR: "error",
};

module.exports = {
  generateToken,
  generageVerifyCode,
  generateRandomPassword,
  formatFilePath,
  readAndTransformImageToBase64,
  STATUS_CODE,
  formatResponse,
  SOCKET_EVENT,
  SERVER_MESSAGE_TYPE,
};
