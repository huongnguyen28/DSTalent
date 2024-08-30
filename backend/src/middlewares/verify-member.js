const db = require("../configs/db");
const Member = db.member;
const { formatResponse, STATUS_CODE } = require("../utils/services");

const verifyMember = async (req, res, next) => {
  const userInReq = req.user;
  const userId = userInReq.user_id;
  const communityId = req.params.community_id;
  const memberInDb = await Member.findOne({
    where: { community_id: communityId, user_id: userId },
  });
  if (memberInDb === null) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.NOT_FOUND,
      "User is not a member of this community!"
    );
  }
  const member = memberInDb.dataValues;
  // console.log(member);
  if (!member || member.is_joined === false)
    return formatResponse(
      res,
      {},
      STATUS_CODE.NOT_FOUND,
      "User is not a member of this community!"
    );

  req.member = member;
  next();
};

module.exports = {
  verifyMember,
};
