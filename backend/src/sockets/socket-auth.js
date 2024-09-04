const jwt = require("jsonwebtoken");

const socketAuth = (socket, next) => {
  const token = socket.handshake.headers.token;
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

module.exports = socketAuth;
