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
  STATUS_CODE,
  SOCKET_EVENT,
  SERVER_MESSAGE_TYPE,
};
