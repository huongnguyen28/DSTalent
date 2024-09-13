const db = require("../configs/db");
// const Member = db.member;
// const Community = db.community;
const { formatResponse, STATUS_CODE } = require("../utils/services");
// const {verifyMember} = require("./verify-member");

// Verify if the user is an admin of the community
// Only comes after verifyMember
const verifyAdmin = async (req, res, next) => {
  const member = req.member;
  if (member.is_admin === false) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.FORBIDDEN,
      "User is not an admin of this community!"
    );
  }

  next();
};

module.exports = {
  verifyAdmin,
};
